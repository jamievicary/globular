
class Scaffold {

    constructor(source, entities) {
        this.source = source;
        this.entities = entities;
        this.dimension = this.source ? this.source.dimension + 1 : 0;

        // Populate slice and half slice cache
        this.slices = Array(this.entities.length + 1).fill(null);
        this.halfSlices = Array(this.entities.length).fill(null);

        for (let entity of entities) {
            if (this.dimension > 0 && entity.dimension != this.dimension) {
                throw new Error(`Scaffold of dimension ${this.dimension} can not contain entity of dimension ${entity.dimension}.`);
            }
        }
    }

    static of(diagram, dimension = null) {
        dimension = dimension === null ? diagram.getDimension() : dimension;

        if (dimension == 0) {
            let entity = null;
            let slice = diagram;
            while (entity == null) {
                if (slice.cells.length > 0) {
                    entity = Entity.of(slice, slice.cells.length - 1, 0);
                } else {
                    slice = slice.getSourceBoundary();
                }
            }
            return new Scaffold(null, [entity]);
        }

        let source = Scaffold.of(diagram.source, dimension - 1);
        let entities = [];
        for (let level = 0; level < diagram.cells.length; level++) {
            entities.push(Entity.of(diagram, level, dimension));
        }

        return new Scaffold(source, entities);
    }

    rewrite(entity) {
        if (entity.dimension != this.dimension + 1) {
            throw new Error(`Can't rewrite ${this.dimension} dimensional scaffold with entity of dimension ${entity.dimension}.`);
        }

        let insert = entity.target.entities;
        insert = insert.map(i => i.pad(entity.embedding.rest()));
        let height = entity.embedding.height();

        return this.splice(height, entity.source.size, ...insert);
    }

    rewriteHalf(entity) {
        let insert = entity.halfSpliceData();
        let height = entity.embedding.height();
        return this.splice(height, entity.source.size, ...insert);
    }

    splice(height, remove, ...insert) {
        // Update the collection of entities
        let entities = this.entities.slice();
        entities.splice(height, remove, ...insert);

        // TODO: Slice and half slice cache?

        return new Scaffold(this.source, entities);
    }

    getSlice(level) {
        if (this.dimension == 0) {
            return null;
        }

        let quarter = getQuarter(level);
        let rounded = roundQuarter(level);

        // Source boundary?
        if (rounded <= 0) {
            return this.source;
        }

        // Target boundary?
        if (rounded > this.size) {
            return this.target;
        }

        // Half slice?
        if (quarter == 2) {
            rounded = Math.floor(rounded);

            // Cached?
            if (this.halfSlices[rounded]) return this.halfSlices[rounded];

            // Rewrite previous full slice
            let entity = this.entities[rounded];
            let slice = this.getSlice(rounded);
            slice = slice.rewriteHalf(entity);
            this.halfSlices[rounded] = slice;
            return slice;
        }

        // Cached?
        if (this.slices[rounded]) return this.slices[rounded];

        // Rewrite previous slice
        let slice = this.getSlice(rounded - 1);
        slice = slice.rewrite(this.entities[rounded - 1]);
        this.slices[rounded] = slice;
        return slice;
    }

    getEntity(level) {
        return this.entities[level];
    }

    get size() {
        return this.entities.length;
    }

    get target() {
        return this.getSlice(this.size);
    }

    getBox() {
        if (this.dimension == 0) {
            return Box.empty();
        }

        let box = this.source.getBox();
        let span = new Span(0, this.size);
        return box.lift(span);
    }

    pad(vector) {
        if (this.dimension == 0) {
            return this;
        }

        let source = this.source.pad(vector.slice(0, -1));
        let entities = this.entites.pad(vector);
        return new Scaffold(source, entities);
    }

    allPoints() {
        if (this.dimension == 0) {
            return [];
        }

        let points = [];
        for (let level = 0; level < this.size; level += 0.5) {
            let slicePoints = this.getSlice(level).allPoints();
            points.push(...slicePoints.map(p => p.concat([level])));
        }

        return points;
    }

}

const getQuarter = (level) => {
    let floor = Math.floor(level);
    return (level - floor) / 0.25;
}
