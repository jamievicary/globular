/**
 * Display that renders 3-dimensional diagrams.
 *
 * This class manages the lifecycle of the WebGL elements and the
 * interactions of the user with the rendered diagram.
 */
class Display3D {
    
    constructor(visibleDimensions, animated) {
        this.container = null;
        this.renderer = null;
        this.scene = null;
        this.visibleDimensions = visibleDimensions;
        this.animated = animated;

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
        this.diagramScene = null;

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

        // Create raycaster
        this.raycaster = new THREE.Raycaster();

        // Reset the position of the camera
        this.resetCameraPosition();

        // Resize listener
        $(window).resize(this.onResize);

        // No highlight
        this.highlight = null;

        // Additional listeners on the container
        this.container.mousemove(this.onMouseMove);
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
        console.log("Create 3D controls");
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

        this.timeSliceControl = $("<input>")
            .attr("type", "range")
            .prop("value", 0)
            .attr("min", 0)
            .change(e => this.updateTime());

        if (!this.animated) {
            let surfacesControl = $("<div>");
            surfacesControl.append(this.surfacesControl, "Show surfaces");
            controls.append(surfacesControl);
        }

        if (!this.animated) {
            let layersControl = $("<div>");
            layersControl.append(this.layersControl, "Show layers");
            controls.append(layersControl);
        }

        let transparencyControl = $("<div>");
        transparencyControl.append(this.transparencyControl, "Transparency");
        controls.append(transparencyControl);

        if (this.animated) {
            let timeSliceControl = $("<div>");
            timeSliceControl.append(this.timeSliceControl);
            controls.append(timeSliceControl);
        }

        this.manager.displayControls.append(controls);
        this.updateControls();
    }

    updateControls() {
        // Set correct bounds for time slice control if the display is animated
        if (this.animated && this.diagram) {
            let max = this.manager.getVisibleDiagram().cells.length * 20;
            console.log("Time: ", max);
            this.timeSliceControl.attr("max", max);
        }
    }

    onMouseMove(event) {
        if (this.diagram === null) {
            return;
        }

        // Cast a ray to obtain all diagram elements beneath the cursor
        let mouseVector = this.getMouseVector(event);
        this.raycaster.setFromCamera(mouseVector, this.camera);
        let intersections = this.raycaster.intersectObjects(this.diagramScene.scene.children);

        // Extract the diagram elements and sort them by dimension
        let objects = intersections.map(x => x.object.name);
        objects.sort((a, b) => b.meta.dimension - a.meta.dimension);

        // Pick the cell of lowest dimension
        if (objects.length == 0) {
            this.manager.hidePopup();
            return;
        }
        let object = objects[0];
        let cell = object.meta.cell;

        // 
        this.manager.showPopup(`${cell.id.getFriendlyName()}`, {
            position: "absolute",
            left: event.clientX,
            top: event.clientY
        });
    }

    getMouseVector(event) {
        let { width, height } = this.getBounds();
        let pixels = eventToPixels(event);
        return new THREE.Vector3(
            (pixels.x / width) * 2 - 1,
            -(pixels.y / height) * 2 + 1,
            0.5
        );
    }

    getMaximumDimension() {
        let dimension = this.visibleDimensions;
        if (this.animated) dimension++;
        return dimension;
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
        console.log(box, boundary);
        //this.highlight = getHighlightBox3D(this.scaffold, box, boundary);
        //renderHighlightBox([0, 0, 0], [1, 1, 1]);
        //this.scene.add(this.highlight);
        this.renderCanvas();
    }

    removeHighlight() {
        this.scene.remove(this.highlight);
        this.highlight = null;
        this.renderCanvas();
    }

    setDiagram(diagram, preserveView = false) {
        this.diagram = diagram;
        this.time = { time: 0 };
        this.updateControls();
        this.render(preserveView);
        this.renderCanvas();
    }

    render(preserveView = false) {
        this.updateDiagramScene();
        if (!preserveView) this.resetCameraPosition();
        this.removeHighlight();
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

    currentTimeSlice() {
        return this.timeSliceControl.val() / 20;
    }

    updateTime() {
        if (this.diagramScene) {
            if (this.timeTween) this.timeTween.stop();
            this.timeTween = new TWEEN.Tween(this.time)
                .to({ time: this.currentTimeSlice() }, 1000)
                .onComplete(() => this.timeTween = null)
                .start();
            this.startRenderLoop();
        }
    }

    startRenderLoop() {
        let loop = () => {
            TWEEN.update();
            this.diagramScene.setTime(this.time.time);
            this.renderCanvas();

            if (this.timeTween) {
                window.requestAnimationFrame(loop);
            }
        }
        loop();
    }

    updateDiagramScene() {
        // Clear diagram scene
        if (this.diagramScene) {
            this.scene.remove(this.diagramScene.scene);
        }

        // Only create a diagram scene if there is a diagram
        if (this.diagram === null) {
            return;
        }

        // Create the diagram geometry
        let { diagramGeometry, sliceGeometries } = this.createDiagramGeometry();
        let geometry = new Geometry();
        geometry.append(diagramGeometry);

        // Obtain renderer options
        let options = { transparency: this.transparencyFlag() };

        // Animated or static?
        if (this.animated) {
            // TODO: Allow layers and surfaces options
            this.diagramScene = new DynamicDiagramScene3D(geometry, options);
        } else {
            if (!this.showSurfacesFlag()) {
                geometry = geometry.filterCells(cell => cell.dimension != 2);
            }

            if (this.showLayersFlag()) {
                geometry.append(...sliceGeometries);
            }

            this.diagramScene = new StaticDiagramScene3D(geometry, options);
        }

        this.scene.add(this.diagramScene.scene);
    }

    createDiagramGeometry() {
        // TODO: Cache this

        // Obtain the diagram that should be visible in this display
        let diagram = this.manager.getVisibleDiagram();

        // Calculate the dimension of the visible diagram under the current projection
        let effectiveDimension = Math.min(
            this.getMaximumDimension(),
            diagram.getDimension() - this.manager.getSuppress());
        console.log(effectiveDimension);

        // Create a scaffold for the projected diagram
        let scaffold = Scaffold.of(diagram, effectiveDimension);
        this.scaffold = scaffold;
        
        // TODO: Remove this debug info
        window.last_diagram = diagram;
        window.last_scaffold = scaffold;

        // Create 3D geometry from scaffold
        let { geometry, sliceGeometries } = getGeometry3D(scaffold);

        // Postprocess the geometries
        let skip = this.animated ? 1 : 0;
        layoutGeometry3D(scaffold, geometry, skip);

        if (this.visibleDimensions == 3) {
            geometry.scale(40, 40, 80, 1);
        } else {
            geometry.scale(40, 40, 1);
        }

        // TEST: Get time slice geometry
        //geometry = getTimeSliceGeometry(geometry, this.currentTimeSlice());

        if (effectiveDimension > 0) {
            sliceGeometries.forEach((sliceGeometry, level) => {
                sliceGeometry.move(p => p.concat([level]));
                layoutGeometry3D(scaffold, sliceGeometry);
                sliceGeometry.scale(40, 40, 80);
            });
        } else {
            sliceGeometries = [];
        }

        return { diagramGeometry: geometry, sliceGeometries };
    }

}

const getHighlightBox3D = (scaffold, box, boundary) => {
    // TODO: Make this work for projected diagrams!
    // TODO: This is a bit naive by just using a box, because the layout
    // algorithm does not have the same nice invariants as the SVG layout

    let base = [];
    let size = [];
    let slice = scaffold;

    if (boundary !== null && boundary.depth > 0) {
        for (let i = 0; i < boundary.depth - 1; i++) {
            slice = slice.getSlice(0);
            base.unshift(0);
            size.unshift(0);
        }

        let level = boundary.type == "s" ? 0 : slice.cells.length;
        slice = slice.getSlice(level);
        base.unshift(level);
        size.unshift(0);
    }

    let boxDiff = [];
    for (let i = 0; i < box.min.length; i++) {
        boxDiff.push(box.max[i] - box.min[i]);
    }

    base = box.min.concat(base);
    size = boxDiff.concat(size);

    console.log(base);
    base = layoutPoint(scaffold, base, base, {});
    console.log(base);

    base = base.concat([0, 0, 0]).slice(0, 3);
    size = size.concat([0, 0, 0]).slice(0, 3);

    base[0] *= 40;
    base[1] *= 40;
    base[2] *= 80;

    size[0] *= 40;
    size[1] *= 40;
    size[2] *= 80;

    base = base.map(x => x - 5);
    size = size.map(x => x + 10);

    console.log(base, size);

    return renderHighlightBox(base, size);
}