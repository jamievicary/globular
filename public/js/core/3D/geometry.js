/**
 * Collection of geometrical cells positioned in space.
 */
class Geometry {

    constructor(cells = null) {
        this.cells = cells || [];
    }

    /**
     * Scale the coordinates of this geometry, seperately in each axis.
     * 
     * @param {number[]} factors 
     */
    scale(...factors) {
        this.move(vertex => {
            vertex = vertex.slice();
            for (let i = 0; i < Math.min(factors.length, vertex.length); i++) {
                vertex[i] *= factors[i];
            }
            return vertex;
        });
    }

    /**
     * Add a new 0-cell to the geometry.
     * 
     * @param {number[]} vertex Position of the newly generated 0-cell.
     * @param {*} meta Metadata to identify the associated diagram cell.
     */
    add(vertex, meta) {
        this.cells.push(new GeometryCell(0, [vertex], meta));
    }

    /**
     * Append the cells of the supplied geometries to this geometry.
     * 
     * @param {Geometry[]} geometries 
     */
    append(...geometries) {
        for (let geometry of geometries) {
            this.cells.push(...geometry.cells);
        }
    }

    /**
     * Move the points of all cells in this geometry.
     * 
     * @param {*} fn Function to apply to call coordinates.
     */
    move(fn) {
        this.cells.forEach(cell => cell.move(fn));
    }

    /**
     * Lift the geometry into a higher dimension.
     * 
     * @param {*} base 
     * @param {*} fn 
     */
    lift(base, fn, flip = false, maxDimension = -1) {
        let cells = this.cells.map(cell => cell.lift(base, fn, flip, maxDimension));
        cells = cells.filter(cell => cell !== null);
        return new Geometry(cells);
    }

    filterCells(fn) {
        let cells = this.cells.filter(fn);
        return new Geometry(cells);
    }

    filterEmpty() {
        return this.filterCells(cell => {
            return !cell.isTrivial();
        });
    }

}

class GeometryCell {

    constructor(dimension, vertices, meta) {
        this.dimension = dimension;
        this.vertices = vertices;
        this.meta = meta;

        if (!(vertices instanceof Array)) {
            throw new Error();
        }
    }

    move(fn) {
        this.vertices = this.vertices.map(fn);
    }

    lift(base, fn, flip, maxDimension = -1) {
        if (maxDimension >= 0 && this.dimension >= maxDimension) {
            return null;
        }

        let baseVertices = this.vertices.map(v => v.concat([base]));
        let liftVertices = this.vertices.map((v, i) => fn(v, getPath(i, this.vertices.length)));
        let vertices = flip ? liftVertices.concat(baseVertices) : baseVertices.concat(liftVertices);

        if (liftVertices.findIndex(x => x === null) >= 0) {
            return null;
        }

        return new GeometryCell(this.dimension + 1, vertices, this.meta);
    }

    isTrivial() {
        let vertexStrings = this.vertices.map(v => v.join(":"));

        switch(this.dimension) {
        case 0:
            return false;

        case 1:
            return containsDuplicates(vertexStrings);

        case 2:
            return containsDuplicates(vertexStrings.slice(1)) &&
                containsDuplicates(vertexStrings.slice(0, -1));

        default:
            return false;
        }
    }

}

const containsDuplicates = (array) => {
    for (let i = 1; i < array.length; i++) {
        for (let j = 0; j < i; j++) {
            if (array[j] == array[i]) return true;
        }
    }
    return false;
}

/**
 * 
 * @param {Scaffold} scaffold 
 * @return 
 */
const getGeometry3D = (scaffold, maxDimension, codimension = 0) => {
    if (scaffold.dimension == 0) {
        let geometry = getGeometryBase(scaffold);
        return { geometry, sliceGeometries: null };
    } else {
        let sliceGeometries = getSliceGeometries(scaffold, maxDimension, codimension);
        let geometry = getGeometryStep(scaffold, sliceGeometries, maxDimension, codimension);
        return { geometry, sliceGeometries };
    }
}

const getSliceGeometries = (scaffold, maxDimension, codimension) => {
    let sliceGeometries = [];

    for (let level = 0; level <= scaffold.size; level++) {
        let scaffoldSlice = scaffold.getSlice(level);
        let sliceGeometry = getGeometry3D(scaffoldSlice, maxDimension, codimension - 1).geometry;
        sliceGeometries.push(sliceGeometry.filterEmpty());
    }

    return sliceGeometries;
}

/**
 * 
 * 
 * @param {Scaffold} scaffold
 * @return Geometry
 */
const getGeometryBase = (scaffold) => {
    let geometry = new Geometry();

    // TODO: Get meta differently here
    let meta = scaffold.getEntity(0).meta;
    geometry.add(getVertex(scaffold, 0, 0), meta);

    return geometry;
}

/**
 * Generates the n-dimensional geometry of a diagram of dimension n by
 * appropriately lifting and manipulating the (n-1)-dimensional geometry of
 * the diagram's slices.
 * 
 * @param {Scaffold} scaffold 
 * @param {Geometry[]} sliceGeometries
 * @return {Diagram}
 */
const getGeometryStep = (scaffold, sliceGeometries, maxDimension, codimension) => {
    let geometry = new Geometry();
    let topDimension = codimension == 0;

    // Generate the geometry level-wise
    for (let level = 0; level < scaffold.size; level++) {
        let entity = scaffold.getEntity(level);

        let bottom = topDimension ? level : level + 0.25;
        let middle = level + 0.5;
        let top = topDimension ? level + 1 : level + 0.75;

        // Lift the source and target slice geometries as prescribed by the scaffold.
        let sourceGeometry = sliceGeometries[level].lift(bottom, (point, path) => {
            let target = EntityAction.perform(entity.sourceAction(), point);
            return target.concat([middle]);
        }, false, maxDimension);
        let targetGeometry = sliceGeometries[level + 1].lift(top, (point, path) => {
            let target = EntityAction.perform(entity.targetAction(), point);
            return target.concat([middle]);
        }, true, maxDimension);

        geometry.append(sourceGeometry, targetGeometry);

        if (entity instanceof ConeEntity) {
            geometry.add(getVertex(scaffold, level), entity.meta);
        }
    }

    // Generate the quarter-slice geometry
    if (!topDimension || scaffold.size == 0) {
        for (let level = 0; level <= scaffold.size; level++) {
            let sliceGeometry = sliceGeometries[level];
            let overhangBottom = sliceGeometry.lift(level - 0.25, point => point.concat([level]), false, maxDimension);
            let overhangTop = sliceGeometry.lift(level + 0.25, point => point.concat([level]), true, maxDimension);
            geometry.append(overhangBottom, overhangTop);
        }

        // Generate additional padding geometry at the beginning and en
        let n = scaffold.size;
        geometry.append(sliceGeometries[0].lift(-0.5, point => point.concat([-0.25]), false, maxDimension));
        geometry.append(sliceGeometries[n].lift(n + 0.5, point => point.concat([n + 0.25]), true, maxDimension));
    }

    return geometry;
}


/**
 * 
 * @param {Scaffold} scaffold 
 * @param {int} level 
 * @return {number[]}
 */
const getVertex = (scaffold, level, dimension) => {
    if (dimension == 0) {
        return [];
    }
    let key = scaffold.getEntity(level).embedding.heights.concat([level]);
    return key.slice(-dimension).map(x => x + 0.5);
}

/**
 * Obtain meta information about a cell in a diagram that can be attached to
 * the geometrical cell for identification.
 * 
 * @param {Diagram} diagram 
 * @param {int} level 
 * @return {*}
 */
const getMeta = (diagram, level) => {
    let cell = diagram.cells[level];
    let interchange = 0;
    if (cell.id == "Int") interchange = 1;
    if (cell.id == "IntI0") interchange = 2;
    return { dimension: diagram.getDimension(), cell, interchange };
}


const getPath = (position, size) => {
    if (size < 2) {
        return [];
    } else {
        let top = position >= 0.5 * size;
        let rest = top ? getPath(position - 0.5 * size, size / 2) : getPath(position, size / 2);
        return rest.concat([top ? 1 : 0]);
    }
}

const arrayEquals = (a, b) => {
    if (a.length != b.length) {
        return false;
    } else {
        for (let i = 0; i < a.length; i++) {
            if (a[i] != b[i]) return false;
        }
        return true;
    }
}

const roundGeometryQuarters = (geometry) => {
    geometry.move(p => p.map(x => {
        let quarter = getQuarter(x);
        switch (quarter) {
            case 0:
            case 1:
                return Math.floor(x);
            case 2:
                return x;
            case 3:
                return Math.ceil(x);
        }
    }));
}
