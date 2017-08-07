// TODO: Cache material
//let materialCache = {};

const getMaterial = (meta, dimension) => {
    let id = { id: meta.cell.id, dimension: meta.dimension };

    // let cacheKey = id.id + ":" + id.dimension;
    // if (materialCache.hasOwnProperty(cacheKey)) {
    //     return materialCache[cacheKey];
    // }

    let color = gProject.getColour(id);
    // , transparent: true
    let material = new THREE.MeshLambertMaterial({ color: color, side: THREE.DoubleSide });

    if (dimension == 2) {
        material.opacity = 0.6;
    }

    //materialCache[cacheKey] = material;

    return material;
};

const renderGeometry3D = (geometry) => {
    // Render vertices and lines
    let group = new THREE.Group();
    geometry.cells
        .filter(cell => cell.dimension < 2)
        .forEach(cell => group.add(...renderCell(cell)));

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
        group.add(renderCombinedCells(planes[id]));
    }

    return group;
}

const renderCell = (cell) => {
    let points = cell.vertices.map(vertex => new THREE.Vector3(...vertex));
    let material = getMaterial(cell.meta, cell.dimension);

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

const renderCombinedCells = (cells) => {
    let combined = renderCell(cells[0])[0];

    for (let i = 1; i < cells.length; i++) {
        combined.geometry.merge(renderCell(cells[i])[0].geometry);
    }
    combined.geometry.mergeVertices();
    combined.geometry.computeVertexNormals();

    //let wfh = new THREE.WireframeHelper(combined, 0x000000);

    let group = new THREE.Group();
    group.add(combined);
    // group.add(wfh);

    return group;
}