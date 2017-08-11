class DynamicTubeGeometry extends THREE.Geometry {

    constructor(path, tubularSegments, radius, radialSegments) {
        super();

        // Store parameters
        this.type = "DynamicTubeBufferGeometry";
        this.parameters = { path, tubularSegments, radius, radialSegments };

        // Create from buffer geometry
        this.fromBufferGeometry(new DynamicTubeBufferGeometry(
            path, tubularSegments, radius, radialSegments
        ));
        this.mergeVertices();
    }

}

class DynamicTubeBufferGeometry extends THREE.BufferGeometry {

    constructor(path, tubularSegments, radius, radialSegments) {
        super();

        // Store parameters
        this.type = "DynamicTubeBufferGeometry";
        this.parameters = { path, tubularSegments, radius, radialSegments };

        // Create and fill the buffers
        this.createBuffers();
        this.generateFrames();
        this.generateIndices();
        this.generateSegments();
        this.generateUVs();

        // Set attributes
        this.addAttribute("position", this.vertexBuffer);
        this.addAttribute("normal", this.normalBuffer);
        this.addAttribute("uv", this.uvBuffer);
    }

    createBuffers() {
        let { tubularSegments, radialSegments } = this.parameters;

        // Vertices buffer
        let verticesSize = (tubularSegments + 1) * (radialSegments + 1) * 3;
        this.vertexBuffer = new THREE.Float32BufferAttribute(new Float32Array(verticesSize), 3);
        this.vertexBuffer.dynamic = true;

        // Normals buffer
        let normalsSize = verticesSize;
        this.normalBuffer = new THREE.Float32BufferAttribute(new Float32Array(normalsSize), 3);
        this.normalBuffer.dynamic = true;

        // UV buffer
        let uvsSize = (tubularSegments + 1) * (radialSegments + 1) * 2;
        this.uvBuffer = new THREE.Float32BufferAttribute(new Float32Array(uvsSize), 2);
    }

    generateFrames() {
        this.frames = this.parameters.path.computeFrenetFrames(this.parameters.tubularSegments, false);
    }

    generateIndices() {
        let { tubularSegments, radialSegments } = this.parameters;
        let indices = [];

        for (let j = 1; j <= tubularSegments; j++) {
            for (let i = 1; i <= radialSegments; i++) {
                let a = (radialSegments + 1) * (j - 1) + (i - 1);
                let b = (radialSegments + 1) * j + (i - 1);
                let c = (radialSegments + 1) * j + i;
                let d = (radialSegments + 1) * (j - 1) + i;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        this.setIndex(indices);
    }

    generateSegments() {
        let { tubularSegments, radialSegments, radius, path } = this.parameters;
        let bufferOffset = 0;
        let normal = new THREE.Vector3();
        let vertex = new THREE.Vector3();

        for (let i = 0; i <= tubularSegments; i++) {
            // Obtain info from the path
            let P = path.getPointAt(i / tubularSegments);
            let N = this.frames.normals[i];
            let B = this.frames.binormals[i];

            for (let j = 0; j <= radialSegments; j++) {
                // Angle around the path
                let angle = (j / radialSegments) * Math.PI * 2;
                let sin = Math.sin(angle);
                let cos = -Math.cos(angle);

                // Normal
                normal.x = cos * N.x + sin * B.x;
                normal.y = cos * N.y + sin * B.y;
                normal.z = cos * N.z + sin * B.z;
                normal.normalize();
                this.normalBuffer.array.set([normal.x, normal.y, normal.z], bufferOffset);

                // Vertex
                vertex.x = P.x + radius * normal.x;
                vertex.y = P.y + radius * normal.y;
                vertex.z = P.z + radius * normal.z;
                this.vertexBuffer.array.set([vertex.x, vertex.y, vertex.z], bufferOffset);

                // Increase buffer offset by the size of the vectors
                bufferOffset += 3;
            }
        }
    }

    generateUVs() {
        let { tubularSegments, radialSegments } = this.parameters;
        let uv = new THREE.Vector2();
        let bufferOffset = 0;

        for (let i = 0; i <= tubularSegments; i++) {
            for (let j = 0; j <= radialSegments; j++) {
                uv.x = i / this.tubularSegments;
                uv.y = j / this.radialSegments;
                this.uvBuffer.array.set([uv.x, uv.y], bufferOffset);
                bufferOffset += 2;
            }
        }
    }

    update(path) {
        this.parameters.path = path;

        this.generateFrames();
        this.generateSegments();

        this.normalBuffer.needsUpdate = true;
        this.vertexBuffer.needsUpdate = true;
    }

}