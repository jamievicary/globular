/**
 * Display that renders 3-dimensional diagrams.
 *
 * This class manages the lifecycle of the WebGL elements and the
 * interactions of the user with the rendered diagram.
 */
class Display3D {
    
    constructor() {
        this.container = null;
        this.renderer = null;
        this.scene = null;

        this.onResize = this.onResize.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onCameraMove = this.onCameraMove.bind(this);
    }

    setup(manager) {
        this.manager = manager;
        this.container = this.manager.container;

        let { width, height } = this.getBounds();

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0xffffff, 1);
        this.container.append(this.renderer.domElement);

        // Scene
        this.scene = new THREE.Scene();
        this.diagramScene = new THREE.Scene();
        this.scene.add(this.diagramScene);

        // Camera
        let { fov, aspect, near, far } = this.getCameraInfo();
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.scene.add(this.camera);

        // Point light in camera
        let pointLight = new THREE.PointLight(0xffffff, 1, 10000);
        this.camera.add(pointLight);

        // Ambient light
        let ambientLight = new THREE.AmbientLight(0x050505);
        this.scene.add(ambientLight);

        // Orbit controls
        this.controls = new THREE.EditorControls(this.camera, this.container[0]);
        this.controls.addEventListener("change", this.onCameraMove);

        // Reset the position of the camera
        this.resetCameraPosition();

        // Resize listener
        $(window).resize(this.onResize);
    }

    dispose() {
        // Remove renderer DOM element
        $(this.renderer.domElement).remove();

        // Remove container event listeners
        this.container.off();

        // TODO: Dispose renderer

        // Remove resize listener
        $(window).off("resize", this.onResize);
    }

    createControls() {
        let controls = $("<div>").attr("id", "controls-3d");

        this.surfacesControl = $("<input>")
            .attr("type", "checkbox")
            .prop("checked", true)
            .attr("id", "controls-3d-surfaces")
            .change(e => this.render(true));

        this.layersControl = $("<input>")
            .attr("type", "checkbox")
            .prop("checked", false)
            .attr("id", "controls-3d-layers")
            .change(e => this.render(true));

        this.transparencyControl = $("<input>")
            .attr("type", "checkbox")
            .prop("checked", false)
            .attr("id", "controls-3d-transparency")
            .change(e => this.render(true));

        let surfacesControl = $("<div>");
        surfacesControl.append(this.surfacesControl, "Show surfaces");
        controls.append(surfacesControl);

        let layersControl = $("<div>");
        layersControl.append(this.layersControl, "Show layers");
        controls.append(layersControl);

        let transparencyControl = $("<div>");
        transparencyControl.append(this.transparencyControl, "Transparency");
        controls.append(transparencyControl);

        this.manager.displayControls.append(controls);
    }

    onMouseMove(event) {

    }

    getMaximumDimension() {
        return 3;
    }

    onCameraMove() {
        this.renderCanvas();
    }

    getCameraInfo() {
        let { width, height } = this.getBounds();
        let fov = 35;
        let aspect = width / height;
        let near = 0.1;
        let far = 10000;
        return { fov, aspect, near, far };
    }

    updateCamera() {
        let { fov, aspect, near, far } = this.getCameraInfo();
        this.camera.fov = fov;
        this.camera.aspect = aspect;
        this.camera.near = near;
        this.camera.far = far;
        this.camera.updateProjectionMatrix();
    }

    resetCameraPosition() {
        let center = new THREE.Vector3(0, 0, 0);

        this.camera.position.copy(new THREE.Vector3(0, 0, 100));
        this.camera.lookAt(center);
        this.camera.updateProjectionMatrix();

        this.controls.center.copy(center);
    }

    getBounds() {
        let width = this.container.width();
        let height = this.container.height();
        return { width, height };
    }

    onResize() {
        let { width, height } = this.getBounds();
        this.renderer.setSize(width, height);
        this.updateCamera();
        this.container
            .children("canvas")
            .width(width)
            .height(height);

        this.renderCanvas();
    }

    renderCanvas() {
        this.renderer.render(this.scene, this.camera);
    }

    highlightBox(box, boundary) {
    }

    removeHighlight() {

    }

    setDiagram(diagram, preserveView = false) {
        this.diagram = diagram;
        this.render(preserveView);
    }

    render(preserveView = false) {
        this.updateDiagramScene();
        if (!preserveView) this.resetCameraPosition();
        this.renderCanvas();
    }

    showSurfacesFlag() {
        return this.surfacesControl.prop("checked");
    }

    showLayersFlag() {
        return this.layersControl.prop("checked");
    }

    transparencyFlag() {
        return this.transparencyControl.prop("checked");
    }

    updateDiagramScene() {
        // Clear diagram scene
        this.diagramScene.remove(...this.diagramScene.children);

        let timer;

        // Only create a diagram scene if there is a diagram
        if (this.diagram === null) {
            return;
        }

        // Create the diagram geometry
        let { diagramGeometry, sliceGeometries } = this.createDiagramGeometry();
        let geometry = new Geometry();
        geometry.append(diagramGeometry);

        // Filter out surfaces
        if (!this.showSurfacesFlag()) {
            geometry = geometry.filterCells(cell => cell.dimension != 2);
        }

        // Show the layers
        if (this.showLayersFlag()) {
            geometry.append(...sliceGeometries);
        }

        // Create three.js scene from geometry
        let options = { transparency: this.transparencyFlag() };
        this.diagramScene.add(...renderGeometry3D(geometry, options).children);
    }

    createDiagramGeometry() {
        // TODO: Cache this

        // Obtain the diagram that should be visible in this display
        let diagram = this.manager.getVisibleDiagram();

        // Calculate the dimension of the visible diagram under the current projection
        let effectiveDimension = Math.min(3, diagram.getDimension() - this.manager.getSuppress());

        // Create a scaffold for the projected diagram
        let scaffold = Scaffold.of(diagram, effectiveDimension);
        
        // TODO: Remove this debug info
        window.last_diagram = diagram;
        window.last_scaffold = scaffold;

        // Create 3D geometry from scaffold
        let { geometry, sliceGeometries } = getGeometry3D(scaffold);

        // Postprocess the geometries
        roundGeometryQuarters(geometry);
        layoutGeometry3D(scaffold, geometry);
        geometry.scale(40, 40, 80);

        if (scaffold.dimension > 0) {
            sliceGeometries.forEach((sliceGeometry, level) => {
                sliceGeometry.move(p => p.concat([level]));
                roundGeometryQuarters(sliceGeometry);
                layoutGeometry3D(scaffold, sliceGeometry);
                sliceGeometry.scale(40, 40, 80);
            });
        } else {
            sliceGeometries = [];
        }

        return { diagramGeometry: geometry, sliceGeometries };
    }

}