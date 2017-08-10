class LayoutCache {

    constructor() {
        this.cache = {};
    }

    get(path, point) {
        return this.cache[this.getName(path, point)];
    }

    set(path, point, result) {
        this.cache[this.getName(path, point)] = result;
        return result;
    }

    getName(path, point) {
        return path.join(":") + ";" + point.join(":");
    }

}

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
    let cache = new LayoutCache;
    geometry.move(point => layoutPoint(scaffold, point, cache, []));
}

/**
 * Translates scaffold coordinates to centered coordinates.
 * 
 * @param {Diagram} scaffold 
 * @param {number[]} point 
 * @return {number[]}
 */
const layoutPoint = (scaffold, point, cache, path = [], depth = 0) => {
    if (point.length == 0) {
        return [];
    } else if (scaffold.size == 0) {
        let slice = scaffold.getSlice(0, depth);
        let rest = layoutPoint(slice, point.slice(0, -1), cache, path.concat([0]), depth + 1);
        let height = point.last();
        return rest.concat([height]);
    }

    // Cached?
    let cached = cache.get(path, point);
    if (cached) return cached;

    // Calculate
    let level = roundQuarter(point.last());
    let quarter = getQuarter(level);
    
    if (quarter == 2 && scaffold.size > 0) {
        let cell = scaffold.getEntity(Math.floor(level));

        let sourceSlice = scaffold.getSlice(Math.floor(level));
        let targetSlice = scaffold.getSlice(Math.ceil(level));

        let sourceOrigins = collectOrigins(point.slice(0, -1), sourceSlice, cell, "s");
        let targetOrigins = collectOrigins(point.slice(0, -1), targetSlice, cell, "t");

        sourceOrigins = sourceOrigins.map(p => layoutPoint(sourceSlice, p, cache, path.concat([Math.floor(level)]), depth + 1));
        targetOrigins = targetOrigins.map(p => layoutPoint(targetSlice, p, cache, path.concat([Math.ceil(level)]), depth + 1));

        let sourceMean = sourceOrigins.length > 0 ? [getMean(sourceOrigins)] : [];
        let targetMean = targetOrigins.length > 0 ? [getMean(targetOrigins)] : [];

        if (sourceMean.length > 0 || targetMean.length > 0) {
            let rest = getMean(sourceMean.concat(targetMean));
            let height = getHeight(level, scaffold.size);
            return cache.set(path, point, rest.concat([height]));
        }
    }

    let slice = scaffold.getSlice(level);
    let rest = layoutPoint(slice, point.slice(0, -1), cache, path.concat([level]), depth + 1);
    let height = getHeight(level, scaffold.size);
    return cache.set(path, point, rest.concat([height]));
}

const collectOrigins = (point, slice, cell, boundary) => {
    let origins = [];
    point = point.map(roundQuarter);

    for (let p of slice.allPoints()) {
        let moved = slice.moveEntity(cell, boundary, p);
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