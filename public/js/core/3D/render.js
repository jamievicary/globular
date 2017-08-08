// TODO: Cache material
//let materialCache = {};

const getMaterial = (meta, dimension, options) => {
    let id = { id: meta.cell.id, dimension: meta.dimension };

    // let cacheKey = id.id + ":" + id.dimension;
    // if (materialCache.hasOwnProperty(cacheKey)) {
    //     return materialCache[cacheKey];
    // }
    let { transparency } = options;
    let color = gProject.getColour(id);
    let material = new THREE.MeshLambertMaterial({ color: color, side: THREE.DoubleSide, transparent: transparency });

    if (dimension == 2) {
        material.opacity = 0.6;
    }

    //materialCache[cacheKey] = material;

    return material;
};

const renderGeometry3D = (geometry, options) => {
    // Render vertices and lines
    let group = new THREE.Group();
    geometry.cells
        .filter(cell => cell.dimension < 2)
        .forEach(cell => group.add(...renderCell(cell, options)));

    // Group planes by id
    let planes = {};
    for (let cell of geometry.cells) {
        if (cell.dimension != 2) continue;
        let id = cell.meta.cell.id;
        if (!planes[id]) planes[id] = [];
        planes[id].push(cell);
    }

    // Combine and render the planes
    for (let id in planes) {
        if (!planes.hasOwnProperty(id)) continue;
        group.add(renderCombinedCells(planes[id], options));
    }

    return group;
}

const renderCell = (cell, options) => {
    let points = cell.vertices.map(vertex => new THREE.Vector3(...vertex));
    let material = getMaterial(cell.meta, cell.dimension, options);

    let renderers = [renderVertex, renderLine, renderPlane];
    if (cell.dimension > renderers.length) {
        return new THREE.Group();
    } else {
        let rendered = renderers[cell.dimension](points, material);
        for (let object of rendered) object.name = cell;
        return rendered;
    }
}

const renderVertex = (points, material) => {
    let geometry = new THREE.SphereBufferGeometry(2, 16, 16);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(points[0]);
    return [mesh];
};

/*
const getControlPoints = (from, to) => {
    let yMiddle = (to.y + from.y) / 2;
    let zMiddle = (to.z + from.z) / 2;
    let cp0 = new THREE.Vector3(from.x, yMiddle, zMiddle);
    let cp1 = new THREE.Vector3(to.x, yMiddle, zMiddle);
    return [cp0, cp1];
}
*/

const renderLine = (points, material) => {
    let lineCurve = new THREE.LineCurve3(points[0], points[1]);

    //let cp = getControlPoints(points[0], points[1]);
    //let lineCurve = new THREE.CubicBezierCurve3(points[0], cp[0], cp[1], points[1]);

    let geometry = new THREE.TubeBufferGeometry(lineCurve, 1, 1, 16, false);
    let mesh = new THREE.Mesh(geometry, material);

    let startCap = renderLineCap(points[0], material);
    let endCap = renderLineCap(points[1], material);
    
    return [mesh, startCap, endCap];
};

const renderLineCap = (point, material) => {
    let cap = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 8, 8), material);
    cap.position.copy(point);
    return cap;
}

const renderPlane = (points, material) => {
    /*let cp13 = getControlPoints(points[1], points[3]);
    let cp02 = getControlPoints(points[0], points[2]);
    let cpRow0 = getControlPoints(points[0], points[1]);
    let cpRow1 = getControlPoints(cp02[0], cp13[0]);
    let cpRow2 = getControlPoints(cp02[1], cp13[1]);
    let cpRow3 = getControlPoints(points[2], points[3]);

    let controlPoints = [
        points[0], cpRow0[0], cpRow0[1], points[1],
        cp02[0], cpRow1[0], cpRow1[1], cp13[0],
        cp02[1], cpRow2[0], cpRow2[1], cp13[1],
        points[2], cpRow3[0], cpRow3[1], points[3]
    ];*/

    let controlPoints = [
        points[0], points[0], points[1], points[1],
        points[0], points[0], points[1], points[1],
        points[2], points[2], points[3], points[3],
        points[2], points[2], points[3], points[3]
    ];

    let geometry = new BezierSurfaceGeometry(controlPoints, 2);
    let mesh = new THREE.Mesh(geometry, material);
    return [mesh];
}

const renderCombinedCells = (cells, options) => {
    let combined = renderCell(cells[0], options)[0];

    for (let i = 1; i < cells.length; i++) {
        combined.geometry.merge(renderCell(cells[i], options)[0].geometry);
    }

    combined.geometry.mergeVertices();
    combined.geometry.computeVertexNormals();
    return combined;
}

const renderHighlightBox = (base, size) => {
    base = new THREE.Vector3(...base);
    size = new THREE.Vector3(...size);

    let vertices = [
        new THREE.Vector3(base.x, base.y, base.z),
        new THREE.Vector3(base.x + size.x, base.y, base.z),
        new THREE.Vector3(base.x + size.x, base.y + size.y, base.z),
        new THREE.Vector3(base.x, base.y + size.y, base.z),
        new THREE.Vector3(base.x, base.y, base.z + size.z),
        new THREE.Vector3(base.x + size.x, base.y, base.z + size.z),
        new THREE.Vector3(base.x + size.x, base.y + size.y, base.z + size.z),
        new THREE.Vector3(base.x, base.y + size.y, base.z + size.z)
    ];

    let geometry = new THREE.Geometry();
    geometry.vertices.push(
        vertices[0], vertices[1],
        vertices[1], vertices[2],
        vertices[2], vertices[3],
        vertices[3], vertices[0],
        vertices[4], vertices[5],
        vertices[5], vertices[6],
        vertices[6], vertices[7],
        vertices[7], vertices[4],
        vertices[0], vertices[4],
        vertices[1], vertices[5],
        vertices[2], vertices[6],
        vertices[3], vertices[7]
    );

    let material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    let line = new THREE.LineSegments(geometry, material);
    return line;
}