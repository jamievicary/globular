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
        this.cells.push(new Cell(0, [vertex], meta));
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
    lift(base, fn, flip = false) {
        let cells = this.cells.map(cell => cell.lift(base, fn, flip));
        cells = cells.filter(cell => cell !== null);
        return new Geometry(cells);
    }

    filterCells(fn) {
        let cells = this.cells.filter(fn);
        return new Geometry(cells);
    }

}

class Cell {

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

    lift(base, fn, flip) {
        let baseVertices = this.vertices.map(v => v.concat([base]));
        let liftVertices = this.vertices.map((v, i) => fn(v, getPath(i, this.vertices.length)));
        let vertices = flip ? liftVertices.concat(baseVertices) : baseVertices.concat(liftVertices);

        if (liftVertices.findIndex(x => x === null) >= 0) {
            return null;
        }

        return new Cell(this.dimension + 1, vertices, this.meta);
    }

}

/**
 * Generates the geometry for a diagram. The coordinates
 * are coordinates in the scaffold, and can be layed out later for aesthetics.
 * 
 * @param {Diagram} diagram
 * @param {Scaffold} scaffold 
 * @return 
 */
const getGeometry3D = (diagram, scaffold) => {
    if (scaffold.dimension == 0) {
        let geometry = getGeometryBase(diagram, scaffold);
        return { geometry, sliceGeometries: null };
    } else {
        let sliceGeometries = getSliceGeometries(diagram, scaffold);
        let geometry = getGeometryStep(diagram, scaffold, sliceGeometries);
        return { geometry, sliceGeometries };
    }
}

const getSliceGeometries = (diagram, scaffold) => {
    let sliceGeometries = [];

    for (let level = 0; level <= scaffold.size; level++) {
        let slice = diagram.getSlice(level);
        let scaffoldSlice = scaffold.getSlice(level);
        let sliceGeometry = getGeometry3D(slice, scaffoldSlice).geometry;
        sliceGeometries.push(sliceGeometry);
    }

    return sliceGeometries;
}

/**
 * Generates only the codimension 0 vertices of a 0D or 1D diagram. Serves
 * as the base case for the recursive generation of potentially higher
 * dimensional geometry.
 * 
 * @param {Diagram} diagram 
 * @param {Scaffold} scaffold
 * @return Geometry
 */
const getGeometryBase = (diagram, scaffold) => {
    let geometry = new Geometry();

    if (scaffold.dimension == 0) {
        let meta = null;
        while (meta === null) {
            if (diagram.cells.length > 0) {
                meta = getMeta(diagram, diagram.cells.length - 1);
            } else {
                diagram = diagram.getSourceBoundary();
            }
        }
        geometry.add(getVertex(diagram, scaffold, 0), meta);

    }

    return geometry;
}

/**
 * Generates the n-dimensional geometry of a diagram of dimension n by
 * appropriately lifting and manipulating the (n-1)-dimensional geometry of
 * the diagram's slices.
 * 
 * @param {Diagram} diagram 
 * @param {Scaffold} scaffold 
 * @param {Geometry[]} sliceGeometries
 * @return {Diagram}
 */
const getGeometryStep = (diagram, scaffold, sliceGeometries) => {
    let geometry = new Geometry();

    // Generate the geometry level-wise
    for (let level = 0; level < scaffold.size; level++) {
        // Add a vertex for the cell at this level
        let meta = getMeta(diagram, level);
        let boundary = scaffold.getCell(level); //CellBoundary.of(diagram, level);
        let cell = diagram.cells[level];

        /*   */
        let cone = boundary.cone || scaffold.dimension != 3;

        if (!cone) {
            // Lift the source and target slice geometries as prescribed by the scaffold.
            let sourceScaffold = scaffold.getSlice(level);
            let sourceGeometry = sliceGeometries[level].lift(level, (point, path) => {
                let target = sourceScaffold.moveSwap(boundary.source.min, point, path);
                return (target === null) ? null : target.concat([level + 0.5]);
            });

            let targetScaffold = scaffold.getSlice(level + 1);
            let targetGeometry = sliceGeometries[level + 1].lift(level + 1, (point, path) => {
                let target = targetScaffold.moveSwap(boundary.target.min, point, path);
                return (target === null) ? null : target.concat([level + 0.5]);
            }, true);
            geometry.append(sourceGeometry, targetGeometry);
        } else {
            // Lift the source and target slice geometries as prescribed by the scaffold.
            let sourceScaffold = scaffold.getSlice(level);
            let sourceGeometry = sliceGeometries[level].lift(level, (point, path) => {
                let target = sourceScaffold.move([boundary.source], point, path);
                return (target === null) ? null : target.concat([level + 0.5]);
            });

            let targetScaffold = scaffold.getSlice(level + 1);
            let targetGeometry = sliceGeometries[level + 1].lift(level + 1, (point, path) => {
                let target = targetScaffold.move([boundary.target], point, path);
                return (target === null) ? null : target.concat([level + 0.5]);
            }, true);
            
            geometry.append(sourceGeometry, targetGeometry);
        }

        if (cone) {
            geometry.add(getVertex(diagram, scaffold, level), meta);
        }
    }

    if (scaffold.size == 0) {
        return sliceGeometries[0].lift(0, point => point.concat([0]));
    }

    return geometry;
}

/**
 * Recursively obtain the scaffold coordinates of the vertex at a given level.
 * 
 * @param {Scaffold} scaffold 
 * @param {int} level 
 * @return {number[]}
 */
const getVertex = (diagram, scaffold, level) => {
    if (scaffold.dimension == 0) {
        return [];
    } else if (scaffold.dimension == 1) {
        return [level + 0.5];
    }

    return diagram.cells[level].box.min.map(x => x + 0.5).concat([level + 0.5]);

    // let cell = scaffold.getCell(level);
    // let slice = scaffold.getSlice(level + 0.5);
    // let rest = getVertex(diagram, slice, cell.source.min);
    // return rest.concat([level + 0.5]);
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
    return { dimension: diagram.getDimension(), cell: cell };
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