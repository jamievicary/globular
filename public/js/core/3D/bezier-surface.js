
class BezierSurfaceGeometry extends THREE.Geometry {

    constructor(points, segments) {
        super();
        this.type = "BezierSurfaceGeometry";
        this.parameters = { points, segments };
        this.fromBufferGeometry(new BezierSurfaceBufferGeometry(points, segments));
        this.mergeVertices();
    }

}

class BezierSurfaceBufferGeometry extends THREE.BufferGeometry {

    constructor(points, segments) {
        super();
        this.type = "BezierSurfaceBufferGeometry";
        this.parameters = { points, segments };

        let surface = cubicBezierSurface(points);

        // Build buffers
        let vertices = [];
        let normals = [];
        let uvs = [];

        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                let u = i / segments;
                let v = j / segments;
                let { vertex, normal } = surface(u, v);
                
                vertices.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(u, v);
            }
        }

        // Build indices
        let indices = [];

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                let a = i + (segments + 1) * j;
                let b = i + (segments + 1) * (j + 1);
                let c = (i + 1) + (segments + 1) * (j + 1);
                let d = (i + 1) + (segments + 1) * j;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        // Set geometry
        this.setIndex(indices);
        this.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        //this.addAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
        this.addAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        this.computeVertexNormals();
    }

}

const cubicBezierSurface = (points) => (u, v) => {
    let vertex = new THREE.Vector3();
    let normalU = new THREE.Vector3();
    let normalV = new THREE.Vector3();

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let a = cubicBernstein[i](u);
            let b = cubicBernstein[j](v);
            let point = points[i + j * 4];

            // Compute vertex
            vertex.add(point.clone().multiplyScalar(a * b));

            // Compute normal
            let da = cubicBernsteinDiff[i](u);
            let db = cubicBernsteinDiff[j](v);

            normalU.add(point.clone().multiplyScalar(da * b));
            normalV.add(point.clone().multiplyScalar(a * db));
        }
    }

    normalU.cross(normalV);
    return { vertex, normal: normalU };
}

const cubicBernstein = [
    x => 1 * (1 - x) * (1 - x) * (1 - x),
    x => 3 * (1 - x) * (1 - x) * x,
    x => 3 * (1 - x) * x * x,
    x => 1 * x * x * x
];

const cubicBernsteinDiff = [
    x => -3 * (1 - x) * (1 - x),
    x => -6 * (1 - x) * x + 3 * (1 - x) * (1 - x),
    x => -3 * x * x + 6 * (1 - x) * x,
    x => 3 * x * x
];