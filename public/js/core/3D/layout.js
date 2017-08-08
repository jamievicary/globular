/**
 * Translates a geometry in scaffold coordinates to more aesthetic,
 * centred coordinates; the original geometry is modified.
 * 
 * The geometry must have been generated for the diagram with the
 * supplied scaffold.
 * 
 * @param {Scaffold} scaffold 
 * @param {Geometry} geometry
 */
const layoutGeometry3D = (scaffold, geometry) => {
    let cache = {};
    geometry.move(point => layoutPoint(scaffold, point, cache, ""));
}

/**
 * Translates scaffold coordinates to centered coordinates.
 * 
 * @param {Diagram} scaffold 
 * @param {number[]} point 
 * @return {number[]}
 */
const layoutPoint = (scaffold, point, cache, path = "") => {
    if (scaffold.dimension == 0) {
        return [];
    } else if (scaffold.size == 0) {
        let slice = scaffold.getSlice(0);
        let rest = layoutPoint(slice, point.slice(0, -1), cache, path + ":0");
        let height = point.last();
        return rest.concat([height]);
    }

    // Cached?
    let cacheName = path + ";" + point.join(":");
    if (cache[cacheName]) {
        return cache[cacheName];
    }

    // Calculate
    let level = roundQuarter(point.last());
    let quarter = getQuarter(level);
    
    if (quarter == 2 && scaffold.cells.length > 0) {
        let cell = scaffold.getCell(Math.floor(level));

        if (!(cell instanceof IdentityEntity)) {
            let sourceSlice = scaffold.getSlice(Math.floor(level));
            let targetSlice = scaffold.getSlice(Math.ceil(level));

            let sourceOrigins = collectOrigins(point.slice(0, -1), sourceSlice, cell, "s");
            let targetOrigins = collectOrigins(point.slice(0, -1), targetSlice, cell, "t");

            sourceOrigins = sourceOrigins.map(p => layoutPoint(sourceSlice, p, cache, path + ":" + Math.floor(level)));
            targetOrigins = targetOrigins.map(p => layoutPoint(targetSlice, p, cache, path + ":" + Math.ceil(level)));

            let sourceMean = sourceOrigins.length > 0 ? [getMean(sourceOrigins)] : [];
            let targetMean = targetOrigins.length > 0 ? [getMean(targetOrigins)] : [];

            if (sourceMean.length > 0 || targetMean.length > 0) {
                let rest = getMean(sourceMean.concat(targetMean));
                let height = getHeight(level, scaffold.size);
                cache[cacheName] = rest.concat([height]);
                return rest.concat([height]);
            }
        }
    }

    let slice = scaffold.getSlice(level);
    let rest = layoutPoint(slice, point.slice(0, -1), cache, path + ":" + level);
    let height = getHeight(level, scaffold.size);
    cache[cacheName] = rest.concat([height]);
    return rest.concat([height]);
}

const collectOrigins = (point, slice, cell, boundary) => {
    let origins = [];
    point = point.map(roundQuarter);

    for (let p of slice.allPoints()) {
        let moved = slice.moveCell(cell, p, boundary);
        if (moved !== null && arrayEquals(moved, point)) {
            origins.push(p);
        }
    }
    return origins;
}

const getHeight = (level, size) => {
    return level - 0.5 * size;
}

const roundQuarter = (x) => {
    let quarter = getQuarter(x);

    if (quarter == 1) {
        return Math.floor(x);
    } else if (quarter == 3) {
        return Math.ceil(x);
    } else {
        return x;
    }
}