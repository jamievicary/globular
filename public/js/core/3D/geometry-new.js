class GeometryCell {

    constructor(dimension, source, target, sourceHeight, targetHeight, orientation, meta) {
        this.dimension = dimension;
        this.source = source;
        this.target = target;
        this.sourceHeight = sourceHeight;
        this.targetHeight = targetHeight;
        this.orientation = orientation;
        this.meta = meta;
    }

    get vertices() {
        if (this.dimension == 0) {
            let height = this.sourceHeight !== null ? this.sourceHeight : 0;
            return [this.source[0].concat(height)];
        }

        let source = this.source.concat([this.sourceHeight]);
        let target = this.target.concat([this.targetHeight]);
        return this.orientation ? source.concat(target) : target.concat(source);
    }

    lift(sourceFn, targetFn, sourceHeight, targetHeight, orientation) {
        let dimension = dimension + 1;
        let vertices = this.vertices;
        let source = sourceFn(vertices);
        let target = targetFn(vertices);
        return new GeometryCell(dimension, source, target, sourceHeight, targetHeight, orientation, this.meta);
    }

    move(fn) {
        this.source = this.source.forEach((p, i) => this.source[i] = fn(p));
        this.target = this.target.forEach((p, i) => this.target[i] = fn(p));
    }

    stretchSource(by) {
        return new GeometryCell(
            this.source, this.source,
            this.sourceHeight, this.sourceHeight + by,
            false, this.meta
        );
    }

    strechTarget(by) {
        return new GeometryCell(
            this.target, this.target,
            this.targetHeight, this.targetHeight + by,
            true, this.meta
        );
    }

}

class Geometry {

    constructor() {
        this.cells = [];
    }

    addZeroCell(vertex, height, meta) {
        let cell = new GeometryCell(0, [vertex], [], height, height, false, meta);
        this.cells.push(cell);
    }

    append(...geometries) {
        for (let geometry of geometries) {
            this.cells.push(...geometry.cells);
        }
    }

    move(fn) {
        this.cells.forEach(cell => cell.move(fn));
    }

    lift(sourceFn, targetFn, sourceHeight, targetHeight, orientation, maxDimension) {
        let cells = [];

        for (let cell of this.cells) {
            if (cell.dimension >= maxDimension) continue;
            cells.push(cell.lift(sourceFn, targetFn, sourceHeight, targetHeight, orientation));
        }

        return new Geometry(cells);
    }

    stretchSingle(height, by) {
        let cells = [];

        for (let cell of this.cells) {
            if (cell.dimension > 0 && cell.sourceHeight == height) {
                cells.push(cell.stretchSource(by / 2));
            }

            if (cell.dimension > 0 && cell.targetHeight == height) {
                cells.push(cell.stretchTarget(by / 2));
            }

            let move = (cell.sourceHeight >= height) ? by : 0;
            cells.push(new GeometryCell(
                cell.dimension,
                cell.source, cell.target,
                cell.sourceHeight + move,
                cell.targetHeight + move,
                cell.orientation, cell.meta
            ));
        }

        return new Geometry(cells);
    }

    stretch(heights, by) {
        heights.sort();

        let geometry = this;
        let offset = 0;

        for (let height of heights) {
            geometry = geometry.stretchSingle(height + offset, by);
            offset += by;
        }

        return geometry;
    }

}

class GeometryBuilder {

    constructor(scaffold, maxDimension) {
        this.scaffold = scaffold;
        this.maxDimension = maxDimension;
    }

    buildGeometry(scaffold) {
        if (scaffold.dimension == 0) {
            let geometry = this.buildGeometryBase(scaffold);
            let slices = [];
            return { geometry, slices };
        } else {
            let slices = [];
            for (let level = 0; level < scaffold.size; level++) {
                slices.push(this.buildGeometry(scaffold.getSlice(level)).geometry);
            }

            let geometry = this.buildGeometryStep(scaffold, slices);
            return { geometry, slices };
        }
    }

    buildGeometryBase(scaffold) {
        let geometry = new Geometry();
        let meta = scaffold.getEntity(0).meta;
        geometry.addZeroCell([], null, meta);
        return geometry;
    }

    buildGeometryStep(scaffold, slices) {
        let geometry = new Geometry();

        for (let level = 0; level < scaffold.size; level++) {
            let entity = scaffold.getEntity(level);

            let sourceAction = entity.sourceAction();
            let sourceGeometry = slices[level]
                .stretch(action.stretchHeights(), 1)
                .lift(
                    point => EntityAction.unstretch(point, sourceAction.stretchHeights()),
                    point => EntityAction.perform(point, sourceAction),
                    level, level + 0.5, false, this.maxDimension
                );

            let targetAction = entity.targetAction();
            let targetGeometry = slices[level + 1]
                .stretch(action.stretchHeights(), 1)
                .lift(
                    point => EntityAction.perform(point, targetAction),
                    point => EntityAction.unstretch(point, targetAction.stretchHeights()),
                    level + 0.5, level + 1, false, this.maxDimension
                );

            geometry.append(sourceGeometry);
            geometry.append(targetGeometry);

            if (entity instanceof ConeEntity) {
                geometry.addZeroCell(this.getVertex(scaffold, level), entity.meta);
            }
        }

        if (scaffold.size == 0) {
            let sourceGeometry = slices[0];
            let overhangBottom = sourceGeometry.lift(p => p, p => p, -0.25, 0, false, this.maxDimension);
            let overhangTop = sourceGeometry.lift(p => p, p => p, 0, 0.25, true, this.maxDimension);
            geometry.append(overhangBottom, overhangTop);
        }

        return geometry;
    }

    getVertex(scaffold, level) {
        if (scaffold.dimension == 0) {
            return [];
        }

        let vertex = scaffold.entities[level].embedding.heights.concat([level]);
        return vertex.map(x => x + 0.5);
    }

}

const getMeta = (diagram, level) => {
    let cell = diagram.cells[level];
    let interchange = 0;
    if (cell.id == "Int") interchange = 1;
    if (cell.id == "IntI0") interchange = 2;
    return { dimension: diagram.getDimension(), cell, interchange };
}
