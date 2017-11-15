
class BezierSurfaceGeometry extends THREE.Geometry {

    constructor(points, segments) {
        super();

        // Store parameters
        this.type = "BezierSurfaceGeometry";
        this.parameters = { points, segments };

        // Create from buffer geometry
        this.fromBufferGeometry(new BezierSurfaceBufferGeometry(points, segments));
        this.mergeVertices();
    }

}

class BezierSurfaceBufferGeometry extends THREE.BufferGeometry {

    constructor(points, segments) {
        super();

        // Store parameters
        this.type = "BezierSurfaceBufferGeometry";
        this.parameters = { points, segments };

        // Create and fill the buffers
        this.createBuffers();
        this.generateIndices();
        this.generateSurface();
        this.generateUVs();

        // Set geometry
        this.addAttribute("position", this.vertexBuffer);
        this.addAttribute("normal", this.normalBuffer);
        this.addAttribute("uv", this.uvsBuffer);
    }

    createBuffers() {
        let { segments } = this.parameters;

        // Vertices buffer
        let verticesSize = (segments + 1) * (segments + 1) * 3;
        this.vertexBuffer = new THREE.Float32BufferAttribute(new Float32Array(verticesSize), 3);
        this.vertexBuffer.dynamic = true;

        // Normal buffer
        this.normalBuffer = new THREE.Float32BufferAttribute(new Float32Array(verticesSize), 3);
        this.normalBuffer.dynamic = true;

        // UV buffer
        let uvsSize = (segments + 1) * (segments + 1) * 2;
        this.uvsBuffer = new THREE.Float32BufferAttribute(new Float32Array(uvsSize), 2);
        this.uvsBuffer.dynamic = true;
    }

    generateIndices() {
        let { segments } = this.parameters;
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

        this.setIndex(indices);
    }

    generateSurface() {
        let { segments } = this.parameters;
        let bufferOffset = 0;
        let vertex = new THREE.Vector3();
        let normalU = new THREE.Vector3();
        let normalV = new THREE.Vector3();
        let normal = new THREE.Vector3();

        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                this.sampleVertex(vertex, normalU, normalV, i / segments, j / segments);
                normal.crossVectors(normalU, normalV);

                this.vertexBuffer.array.set([vertex.x, vertex.y, vertex.z], bufferOffset);
                this.normalBuffer.array.set([normal.x, normal.y, normal.z], bufferOffset);

                bufferOffset += 3;
            }
        }
    }

    generateUVs() {
        let { segments } = this.parameters;
        let bufferOffset = 0;

        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                let u = i / segments;
                let v = j / segments;
                this.uvsBuffer.array.set([u, v], bufferOffset);
                bufferOffset += 2;
            }
        }
    }

    sampleVertex(vertex, normalU, normalV, u, v) {
        let { points } = this.parameters;
        vertex.set(0, 0, 0);
        normalU.set(0, 0, 0);
        normalV.set(0, 0, 0);

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let a  = this.cubicBernstein(i, u);
                let ad = this.cubicBernsteinDeriv(i, u);
                let b  = this.cubicBernstein(j, v);
                let bd = this.cubicBernsteinDeriv(j, v);
                let point = points[i + j * 4];

                vertex.addScaledVector(point, a * b);
                normalU.addScaledVector(point, ad * b);
                normalV.addScaledVector(point, a * bd);
            }
        }
    }

    cubicBernstein(i, x) {
        switch (i) {
        case 0: return (1 - x) * (1 - x) * (1 - x);
        case 1: return 3 * (1 - x) * (1 - x) * x;
        case 2: return 3 * (1 - x) * x * x;
        case 3: return x * x * x;
        default: throw new Error();
        }
    }

    cubicBernsteinDeriv(i, x) {
        switch (i) {
        case 0: return -3 * (1 - x) * (1 - x);
        case 1: return -6 * x * (1 - x) + 3 * (1 - x) * (1 - x);
        case 2: return -3 * x * x + 6 * x * (1 - x);
        case 3: return 3 * x * x;
        default: throw new Error();
        }
    }

    update(points) {
        this.parameters.points = points;

        this.generateSurface();
        this.computeVertexNormals();

        this.vertexBuffer.needsUpdate = true;
    }

}
