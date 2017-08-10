
class Scaffold {
    
    constructor(source, entities) {
        this.source = source;
        this.entities = entities;
        this.dimension = this.source ? this.source.dimension + 1 : 0;

        this.slices = Array(this.entities.length + 1).fill(null);
        this.halfSlices = Array(this.entities.length).fill(null);

        if (this.dimension == 0 && this.entities.length != 1) debugger;

        for (let entity of entities) {
            if (entity.dimension != this.dimension) {
                throw new Error(`Scaffold of dimension ${this.dimension} can not contain entity of dimension ${entity.dimension}.`);
            }
        }
    }

    static of(diagram) {
        let source = diagram.getDimension() != 0 ? Scaffold.of(diagram.source) : null;

        let entities = [];
        for (let level = 0; level < diagram.cells.length; level++) {
            entities.push(Entity.of(diagram, level));
        }

        return new Scaffold(source, entities);
    }

    rewrite(entity) {
        if (entity.dimension != this.dimension + 1) {
            throw new Error(`Can't rewrite ${this.dimension} dimensional scaffold with entity of dimension ${entity.dimension}.`);
        }

        return this.splice(entity.inclusion, entity.source.size, ...entity.target.entities);
    }

    splice(inclusion, remove, ...insert) {
        // Pad the new entitites
        insert = insert.map(entity => entity.pad(inclusion.slice(0, -1)));

        // Determine the height where to insert the entities
        let height = inclusion.length == 0 ? 0 : inclusion[inclusion.length - 1];

        // Update the collection of entities
        let entities = this.entities.slice();
        entities.splice(height, remove, ...insert);

        // TODO: Slice and half slice cache?

        return new Scaffold(this.source, entities);
    }

    getSlice(level, codimension = 0) {
        if (this.dimension == 0) {
            throw new Error("Scaffold of dimension 0 has no slices.");
        }

        let quarter = getQuarter(level);
        let rounded = roundQuarter(level);

        if (rounded < 0 || rounded > this.size) {
            throw new Error(`Scaffold of size ${this.size} does not have a slice at ${level}.`);
        }

        // Source boundary?
        if (rounded == 0) {
            return this.source;
        }

        // Half slice?
        if (quarter == 2) {
            rounded = Math.floor(rounded);

            // Cached?
            if (this.halfSlices[rounded]) return this.halfSlices[rounded];

            // Rewrite previous full slice
            let entity = this.entities[rounded];
            if (codimension != 1) entity = entity.toNormal();
            let slice = this.getSlice(rounded, codimension);
            slice = entity.rewriteHalf(slice, codimension == 0);
            this.halfSlices[rounded] = slice;
            return slice;
        }

        // Cached?
        if (this.slices[rounded]) return this.slices[rounded];

        // Rewrite previous slice
        let slice = this.getSlice(rounded - 1, codimension);
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

    moveEntity(entity, boundaryType, point, codimension) {
        if (entity.meta.interchange > 0 && codimension == 0) {
            return this.moveInterchange(entity, boundaryType, point, codimension);
        } else {
            let boundary = boundaryType == "s" ? entity.source : entity.target;
            return this.move([
                { inclusion: entity.inclusion, boundary }
            ], point, codimension);
        }
    }

    moveInterchange(entity, boundaryType, point, codimension) {
        let boundary = boundaryType == "s" ? entity.source : entity.target;

        let bottom = boundary.entities[0];
        let top = boundary.entities[1];

        bottom = bottom.pad(entity.inclusion.slice(0, -1));
        top = top.pad(entity.inclusion.slice(0, -1));

        let inverse = entity.meta.interchange == 2;
        inverse = boundaryType == "t" ? !inverse : inverse;

        let height = point[point.length - 1];
        let rest = point.slice(0, -1);
        let newHeight = height;

        if (height == entity.height + 0.5) {
            if (inverse) {
                let diff = 1 - bottom.target.size;
                top = top.pad([diff]);
            }

            let slice = this.getSlice(height);
            let a = top.source;
            let b = bottom.collapse().toScaffold();
            rest = slice.move([
                { inclusion: bottom.inclusion, boundary: b },
                { inclusion: top.inclusion, boundary: a}
            ], rest, codimension + 1);
            newHeight = entity.height + 0.5;
        } else if (height >= entity.height + 0.75 && height <= entity.height + 1.25) {
            let slice = this.getSlice(height, codimension);
            let a = top.source;
            let b = bottom.target;
            rest = slice.move([
                { inclusion: top.inclusion, boundary: a },
                { inclusion: bottom.inclusion, boundary: b }
            ], rest, codimension + 1);
            newHeight = entity.height + 0.5;
        } else if (height == entity.height + 1.5) {
            if (!inverse) {
                let diff = 1 - top.source.size;
                bottom = bottom.pad([diff]);
            }

            let slice = this.getSlice(height);
            let a = top.collapse().toScaffold();
            let b = bottom.target;
            rest = slice.move([
                { inclusion: top.inclusion, boundary: a },
                { inclusion: bottom.inclusion, boundary: b }
            ], rest, codimension + 1);
            newHeight = entity.height + 0.5;
        }

        if (height >= entity.height + 1.75) {
            newHeight -= 1;
        }
    
        return rest.concat([newHeight]);
    }

    move(included, point, codimension, dodge = true) {
        // Does this really depend on the current scaffold?

        if (point.length == 0) {
            return [];
        }

        included.sort((a, b) => a.inclusion.last() - b.inclusion.last());

        let height = point[point.length - 1];
        let rest = point.slice(0, -1);
        let newHeight = height;

        // Obtain the boundary boxes
        let boxes = included.map(i => i.boundary.getBox().move(i.inclusion));

        // Determine if inside a box
        if (boxes.length == 2 && boxes[0].span().min > boxes[1].span().min) debugger;

        for (let i = 0; i < included.length; i++) {
            let boundary = included[i].boundary;
            let inclusion = included[i].inclusion;
            let box = boxes[i];
            let span = box.span();

            // Inside the height of the box?
            if (span.min < height + 0.25 && span.max > height - 0.25) {
                let slice = this.getSlice(height, codimension);
                let boundarySlice = boundary.getSlice(height - inclusion[inclusion.length - 1], codimension);
                let inclusionSlice = inclusion.slice(0, -1);
                rest = slice.move([{
                    inclusion: inclusionSlice,
                    boundary: boundarySlice
                }], rest, codimension + 1);
                newHeight = span.min + 0.5;
                break;
            }
        }

        // Shift the height if above a box
        if (dodge) {
            for (let i = 0; i < included.length; i++) {
                let span = boxes[i].span();

                if (span.max <= height - 0.25) {
                    newHeight += 1;
                    newHeight -= span.size;
                }
            }
        }

        return rest.concat([newHeight]);
    }

    allPoints(codimension) {
        if (this.dimension == 0) {
            return [];
        }

        let points = [];
        for (let level = 0; level < this.size; level += 0.5) {
            let slicePoints = this.getSlice(level, codimension + 1).allPoints();
            points.push(...slicePoints.map(p => p.concat([level])));
        }

        return points;
    }

}

const getQuarter = (level) => {
    let floor = Math.floor(level);
    return (level - floor) / 0.25;
}