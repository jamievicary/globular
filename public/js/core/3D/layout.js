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
/*
const getMean = (xs) => {
    if (xs.length == 0) {
        throw new Error("Can't calculate mean of zero vectors.");
    }

    let result = xs[0];
    for (let i = 1; i < xs.length; i++) {
        for (let j = 0; j < result.length; j++) {
            result[j] += xs[i][j];
        }
    }

    for (let i = 0; i < result.length; i++) {
        result[i] /= xs.length;
    }

    return result;
}*/
/*
const arrayEquals = (a, b) => {
    if (a.length != b.length) {
        return false;
    } else {
        for (let i = 0; i < a.length; i++) {
            if (a[i] != b[i]) return false;
        }
        return true;
    }
}*/

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
    }

    // Cached?
    let cacheName = path + ";" + point.join(":");
    if (cache[cacheName]) {
        return cache[cacheName];
    }

    // Calculate
    let level = point.last();
    
    if (level > Math.floor(level)) {
        let cell = scaffold.getCell(Math.floor(level));

        if (!(cell instanceof IdentityEntity)) {
            let sourceSlice = scaffold.getSlice(Math.floor(level));
            let targetSlice = scaffold.getSlice(Math.ceil(level));

            let sourceOrigins = collectOrigins(point.slice(0, -1), sourceSlice, cell.source, cell.key);
            let targetOrigins = collectOrigins(point.slice(0, -1), targetSlice, cell.target, cell.key);

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

const collectOrigins = (point, slice, span, key) => {
    let origins = [];

    for (let p of slice.allPoints()) {
        let moved = true ? slice.move([span], p, false, key) : slice.moveSwap(span.min, p);
        if (moved !== null && arrayEquals(moved, point)) {
            origins.push(p);
        }
    }
    return origins;
}

const getHeight = (level, size) => {
    return level - 0.5 * size;
}