
class DiagramMaterials {

    constructor() {
        this.materials = new Map();
    }

    /**
     * The material to be used for a cell.
     *
     * @param {*} meta Meta information of the geometric cell.
     * @param {int} dimension Dimension of the geometric cell.
     * @param {*} options Renderer options.
     */
    getMaterial(meta, dimension, options) {
        if (this.materials.has(meta.cell.id)) return this.materials.get(meta.cell.id);

        let id = { id: meta.cell.id, dimension: meta.dimension };
        let { transparency } = options;
        let color = gProject.getColour(id);

        let material = new THREE.MeshLambertMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: dimension == 2 && transparency
        });

        if (dimension == 2 && transparency) {
            material.depthWrite = false;
            material.blending = THREE.MultiplyBlending;
        }

        this.materials.set(meta.cell.id, material);
        return material;
    }

}

/**
 * Static three.js scene generated from geometry.
 *
 * Renders vertices, lines and surfaces. Volumes and higher dimensional cells are ignored.
 *
 * For efficiency and to enable better smoothing, the geometries of all surfaces with
 * the same id are merged together. Surfaces with a different id are not merged, to be
 * able to distinguish them.
 */
class StaticDiagramScene3D {

    constructor(geometry, options) {
        this.scene = new THREE.Scene();
        let materials = new DiagramMaterials();
        let surfaces = {};
        options.unbufferedSurfaces = true;

        this.surfaces = [];

        for (let cell of geometry.cells) {
            // if (cell.dimension > 2) continue;
            let points = cell.vertices.map(v => new THREE.Vector3(...v));

            let material = materials.getMaterial(cell.meta, cell.dimension, options);
            let rendered = getRenderedCell3D(cell.dimension, points, cell.meta, material, options);

            // Collect the surfaces and group them by id
            // if (cell.dimension == 2) this.surfaces.push(rendered);

            if (cell.dimension == 2) {
                let id = cell.meta.cell.id;
                if (!surfaces.hasOwnProperty(id)) {
                    surfaces[id] = [];
                }
                surfaces[id].push(...rendered.objects);
            } else {
                this.scene.add(...rendered.objects);
            }
        }

        // Merge the geometries of all surfaces with the same id
        for (let id in surfaces) {
            if (!surfaces.hasOwnProperty(id)) continue;
            let combined = surfaces[id][0];
            for (let i = 1; i < surfaces[id].length; i++) {
                combined.geometry.merge(surfaces[id][i].geometry);
            }
            combined.geometry.mergeVertices();
            combined.geometry.computeVertexNormals();
            this.scene.add(combined);
        }
    }

    setTime(time) {}

}

/**
 * Dynamic three.js scene generated from geometry. The top dimension of each geometry
 * cell is interpreted as the time dimension and the scene supports efficiently moving
 * through time slices.
 *
 * Time slices not present in the geometry are interpolated linearly.
 *
 * Renders vertices, lines and surfaces at a time slice. Volumes and higher dimensional
 * cells are ignored.
 *
 * Unfortunately, we can't directly merge the surfaces here, since we need to be able
 * to update them in-place.
 * TODO: Update the bezier surface code such that in an in-place update of the merged
 * geometry is possible, and use the buffer's draw range for visibility control of surfaces
 */
class DynamicDiagramScene3D {

    constructor(geometry, options) {
        this.scene = new THREE.Scene();
        this.cells = [];
        this.visible = [];
        let materials = new DiagramMaterials();

        for (let i = 0; i < geometry.cells.length; i++) {
            let cell = geometry.cells[i];

            if (cell.dimension == 0 || cell.dimension > 3) continue;

            let length = cell.vertices.length;
            let verticesStart = cell.vertices.slice(0, length / 2).map(v => v.slice(0, -1));
            let verticesEnd = cell.vertices.slice(length / 2).map(v => v.slice(0, -1));

            let pointsStart = verticesStart.map(v => new THREE.Vector3(...v));
            let pointsEnd = verticesEnd.map(v => new THREE.Vector3(...v));

            let heights = cell.vertices.map(v => v[v.length - 1]);
            let timeStart = Math.min(...heights);
            let timeEnd = Math.max(...heights);

            // Skip cells that have an empty time interval in which they are visible
            if (timeStart === timeEnd) continue;

            let material = materials.getMaterial(cell.meta, cell.dimension - 1, options);
            let rendered = getRenderedCell3D(cell.dimension - 1, pointsStart, cell.meta, material, options);

            this.cells.push({
                pointsStart,
                pointsEnd,
                timeStart,
                timeEnd,
                rendered
            });

            rendered.objects.forEach(object => { object.visible = false; });
            this.scene.add(...rendered.objects);
        }

        this.cells.sort((a, b) => a.timeStart - b.timeStart);
        this.setTime(0);
    }

    setTime(time) {
        // Hide the previously visible cells
        for (let i = 0; i < this.visible.length; i++) {
            this.visible[i].visible = false;
        }
        this.visible = [];

        // Show the cells that should be visible now
        for (let i = 0; i < this.cells.length; i++) {
            let cell = this.cells[i];

            // Since the cells are sorted by their starting time, we can stop
            // checking if once we reach cells that start in the future.
            if (cell.timeEnd < time) continue;
            if (cell.timeStart > time) break;

            let points = this.getPoints(cell, time);
            cell.rendered.update(points);
            cell.rendered.objects.forEach(object => { object.visible = true; });
            this.visible.push(...cell.rendered.objects);
        }
    }

    /**
     * Obtain the interpolated points of a cell at a given point in time.
     */
    getPoints(cell, time) {
        let points = [];
        let alpha = (time - cell.timeStart) / (cell.timeEnd - cell.timeStart);

        for (let i = 0; i < cell.pointsStart.length; i++) {
            let start = cell.pointsStart[i];
            let end = cell.pointsEnd[i];
            let vertex = new THREE.Vector3();
            vertex.lerpVectors(start, end, alpha);
            points.push(vertex);
        }

        return points;
    }

}

/**
 * The rendered cell for a diagram cell.
 *
 * @param {int} dimension Dimension of the geometric cell.
 * @param {THREE.Vector3[]} points Points of the cell.
 * @param {*} meta Meta information of the geometric cell.
 * @param {*} options Renderer options.
 */
const getRenderedCell3D = (dimension, points, meta, material, options) => {
    meta = { dimension, meta };
    
    switch (dimension) {
        case 0: return new RenderedVertex3D(points, material, meta, options);
        case 1: return new RenderedLine3D(points, material, meta, options);
        case 2: return new RenderedSurface3D(points, material, meta, options);
        default: throw new Error(`Unspported rendered cell dimension ${dimension}.`);
    }
}

class RenderedVertex3D {

    constructor(points, material, meta, options) {
        this.geometry = new THREE.SphereBufferGeometry(2, 16, 16);
        this.sphere = new THREE.Mesh(this.geometry, material);
        this.sphere.position.copy(points[0]);
        this.sphere.name = meta;
        this.objects = [this.sphere];
    }

    update(points) {
        this.sphere.position.copy(points[0]);
    }

}

const lineControlPoints = (start, end, dimension, f = 1) => {
    let d = new THREE.Vector3();
    d.subVectors(end, start);

    d.x = d.x != 0 && dimension <= 1 ? d.x : 0;
    d.y = d.y != 0 && dimension <= 2 ? d.y : 0;
    d.z = d.z != 0 && dimension <= 3 ? d.z : 0;

    d.multiplyScalar(1/3);

    let p = new THREE.Vector3();
    p.copy(start);
    p.addScaledVector(d, 1);

    let q = new THREE.Vector3();
    q.copy(end);
    q.addScaledVector(d, -1);

    return [p, q];
}

class RenderedLine3D {

    constructor(points, material, meta, options) {
        let curve = this.getCurve(points, meta.meta.visibleDimensions);
        this.tubeGeometry = new DynamicTubeBufferGeometry(curve, 6, 1, 8);
        this.tubeMesh = new THREE.Mesh(this.tubeGeometry, material);
        this.tubeMesh.frustumCulled = false;
        this.tubeMesh.name = meta;

        this.capGeometry = new THREE.SphereBufferGeometry(1, 16, 8);
        this.startCapMesh = new THREE.Mesh(this.capGeometry, material);
        this.endCapMesh = new THREE.Mesh(this.capGeometry, material);
        this.startCapMesh.position.copy(points[0]);
        this.endCapMesh.position.copy(points[1]);
        this.startCapMesh.name = meta;
        this.endCapMesh.name = meta;

        this.objects = [];
        this.objects.push(this.tubeMesh);
        this.objects.push(this.startCapMesh);
        this.objects.push(this.endCapMesh);
    }

    getCurve(points, visibleDimensions) {
        let x = points[0];
        let y = points[1];
        let [p, q] = lineControlPoints(x, y, visibleDimensions);
        return new THREE.CubicBezierCurve3(x, p, q, y);
    }

    update(points) {
        let curve = this.getCurve(points);
        this.tubeGeometry.update(curve);
        this.startCapMesh.position.copy(points[0]);
        this.endCapMesh.position.copy(points[1]);
    }

}

class RenderedSurface3D {

    constructor(points, material, meta, options) {
        let controlPoints = this.getControlPoints(points);

        if (options.unbufferedSurfaces) {
            this.surfaceGeometry = new BezierSurfaceGeometry(controlPoints, 6);
        } else {
            this.surfaceGeometry = new BezierSurfaceBufferGeometry(controlPoints, 6);
        }

        this.surface = new THREE.Mesh(this.surfaceGeometry, material);
        this.surface.frustumCulled = false;
        this.surface.name = meta;
        this.objects = [this.surface];
    }

    getControlPoints(points) {
        let p00 = points[0];
        let p03 = points[2];
        let p30 = points[1];
        let p33 = points[3];

        let [p10, p20] = lineControlPoints(p00, p30, 2);
        let [p13, p23] = lineControlPoints(p03, p33, 2);

        let zdiff = p03.z - p00.z;

        let line0 = [p00, p10, p20, p30];
        let [p01, p11, p21, p31] = line0.map(p => {
            let q = new THREE.Vector3();
            q.copy(p);
            q.z += zdiff / 3;
            return q;
        });

        let line3 = [p03, p13, p23, p33];
        let [p02, p12, p22, p32] = line3.map(p => {
            let q = new THREE.Vector3();
            q.copy(p);
            q.z -= zdiff / 3;
            return q;
        });

        return [
            p00, p10, p20, p30,
            p01, p11, p21, p31,
            p02, p12, p22, p32,
            p03, p13, p23, p33
        ];
    }

    update(points) {
        let controlPoints = this.getControlPoints(points);
        this.surfaceGeometry.update(controlPoints);
    }

}
