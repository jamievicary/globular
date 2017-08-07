class Scaffold {

    constructor(dimension, cells, slices, halfSlices) {
        this.dimension = dimension;
        this.cells = cells;
        this.slices = slices;
        this.halfSlices = halfSlices;
        this.size = dimension > 0 ? this.cells.length : 1;

        if (dimension > 0 && this.slices.length != this.cells.length + 1) {
            throw new Error("Span and slice mismatch in scaffold.");
        } else if (dimension > 0 && this.halfSlices.length != this.cells.length) {
            throw new Error("Half slice and cell mismatch in scaffold.");
        }
    }

    static of(diagram, maxDimension = Infinity) {
        let dimension = Math.min(maxDimension, diagram.getDimension());

        if (dimension == 0) {
            let entity = CellEntity.topProjected(diagram);
            return new Scaffold0(entity);
        }

        // All cells
        let cells = [];
        for (let level = 0; level < diagram.cells.length; level++) {
            cells.push(CellEntity.of(diagram, level));
        }

        // if (dimension == 1 && cells.find(cell => cell.source.size() != 1)) debugger;

        // Generate all slices
        let slices = [];
        for (let level = 0; level <= diagram.cells.length; level++) {
            slices.push(Scaffold.of(diagram.getSlice(level), dimension - 1));
        }

        // Generate all half-slices
        let halfSlices = [];
        for (let level = 0; level < diagram.cells.length; level++) {
            halfSlices.push(Scaffold.makeHalfSlice(slices[level], cells[level]));
        }

        return new Scaffold(dimension, cells, slices, halfSlices);
    }

    static makeHalfSlice(slice, cell) {
        if (slice.size > 0) {
            if (!cell.meta.swap || slice.dimension != 2) {
                return slice.mergeNormal(cell.source, cell.key, cell.meta);
            } else {
                return slice.mergeSwap(cell.source.min, cell.key, cell.meta);
            }
        } else {
            return slice.mergeNormal(new Span(0, 0), cell.key, cell.meta);
        }
    }

    targetSpan(fromLevel, toLevel) {
        let cells = this.cells.slice(fromLevel, toLevel);
        return this.cells[fromLevel].source.moveUp(cells);
    }

    sourceSpan(fromLevel, toLevel) {
        let cells = this.cells.slice(fromLevel, toLevel).reverse();
        return this.cells[toLevel - 1].target.moveDown(cells);
    }

    mergeNormal(heightSpan, key, meta) {
        if (this.dimension == 0) {
            return this;
        } else if (heightSpan.min == heightSpan.max) {
            let span = this.dimension == 1 ? new Span(0, 1) : new Span(0, 0);
            let cell = new CellEntity(key, span, span, meta);
            let halfSlice = Scaffold.makeHalfSlice(this.slices[heightSpan.min], cell);

            let cells = this.cells.slice();
            cells.splice(heightSpan.min, 0, cell);

            let slices = this.slices.slice();
            slices.splice(heightSpan.min + 1, 0, slices[heightSpan.min]);

            let halfSlices = this.halfSlices.slice();
            halfSlices.splice(heightSpan.min, 0, halfSlice);
            
            return new Scaffold(this.dimension, cells, slices, halfSlices);
        } else {
            let source = this.sourceSpan(heightSpan.min, heightSpan.max);
            let target = this.targetSpan(heightSpan.min, heightSpan.max);
            let cell = this.dimension == 1
                ? new CellEntity(key, new Span(0, 1), new Span(0, 1), meta)
                : new CellEntity(key, source, target, meta);
 
            let cells = this.cells.slice();
            cells.splice(heightSpan.min, heightSpan.max - heightSpan.min, cell);

            let slices = this.slices.slice();
            slices.splice(heightSpan.min + 1, heightSpan.max - heightSpan.min - 1);

            let halfSlice = Scaffold.makeHalfSlice(slices[heightSpan.min], cells[heightSpan.min]);
            let halfSlices = this.halfSlices.slice();
            halfSlices.splice(heightSpan.min, heightSpan.max - heightSpan.min, halfSlice);

            return new Scaffold(this.dimension, cells, slices, halfSlices);
        }
    }

    mergeMulti(heightSpans, keys, metas) {
        heightSpans.sort((a, b) => a.min - b.min);

        let diagram = this;
        let offset = 0;

        for (let i = 0; i < heightSpans.length; i++) {
            let span = heightSpans[i];
            span = span.move(offset);
            offset += 1 - span.size();
            diagram = diagram.mergeNormal(span, keys[i], metas[i]);
        }

        return diagram;
    }

    mergeSwap(height, key, meta) {
        let source = this.sourceSpan(height, height + 2);
        let target = this.targetSpan(height, height + 2);
        let cell = new CellEntity(key, source, target, meta);

        let cells = this.cells.slice();
        cells.splice(height, 2, cell);

        let slices = this.slices.slice();
        slices.splice(height + 1, 1);

        let spanA = this.cells[height].source;
        let spanB = this.cells[height + 1].source;
        if (spanB.min >= this.cells[height].target.min) {
            spanB = spanB.move(this.cells[height].source.size() - this.cells[height].target.size());
        }

        let keys = [this.cells[height].key, this.cells[height + 1].key];
        let metas = [this.cells[height].meta, this.cells[height + 1].meta];
        let halfSlice = slices[height].mergeMulti([spanA, spanB], keys, metas);
        let halfSlices = this.halfSlices.slice();
        halfSlices.splice(height, 2, halfSlice);

        return new Scaffold(this.dimension, cells, slices, halfSlices);
    }

    moveCell(cell, point, boundary) {
        let heightSpan = boundary == "s" ? cell.source : cell.target;

        if (this.dimension == 2 && cell.meta.swap) {
            return this.moveSwap(heightSpan.min, point, cell.key);
        } else {
            return this.moveNormal([heightSpan], point, cell.key);
        }
    }

    moveNormal(heightSpans, point, key, dodge = true) {
        if (this.dimension == 0) {
            return [];
        }

        let height = point.last();
        let newHeight = height;
        let rest = point.slice(0, -1);

        // Inside a span?
        let spanInterior = heightSpans.find(s => s.min < height + 0.25 && s.max > height - 0.25);
        if (!!spanInterior) {
            // Interior or parallel
            let slice = this.getSlice(height);

            if (spanInterior.min <= height && spanInterior.max >= height && spanInterior.size() > 0) {
                let span = this.getSpan(spanInterior.min, spanInterior.max, height);
                rest = slice.moveNormal([span], rest, key.slice(0, -1));
                newHeight = spanInterior.min + 0.5;
            } else if (spanInterior.size() == 0 && spanInterior.min == height) {
                let span = new Span(0.5 + key.last(), 0.5 + key.last());
                rest = slice.moveNormal([span], rest, key.slice(0, -1), false);
                newHeight = spanInterior.min + (dodge ? 0.5 : 0);
            }
        }

        // Contract the spans before
        if (dodge) {
            let spansBefore = heightSpans.filter(s => s.max <= height - 0.25);
            for (let span of spansBefore) {
                newHeight -= span.size() - 1;
            }
        }

        return rest.concat([newHeight]);
    }

    moveSwap(swapHeight, point, key) {
        let height = point.last();
        let rest = point.slice(0, -1);
        let newHeight = height;
        let lowerCell = this.cells[swapHeight];
        let upperCell = this.cells[swapHeight + 1];

        if (height == swapHeight + 0.5) {
            let slice = this.getSlice(height);
            let spanA = lowerCell.target.collapsed();
            let spanB = upperCell.source.withCollapse(lowerCell.target);
            rest = slice.moveNormal([spanA, spanB], rest, key.slice(0, -1));
            newHeight = swapHeight + 0.5;
        } else if (height >= swapHeight + 0.75 && height <= swapHeight + 1.25) {
            let slice = this.getSlice(height);
            let spanA = upperCell.source;
            let spanB = lowerCell.target;
            rest = slice.moveNormal([spanA, spanB], rest, key.slice(0, -1));
            newHeight = swapHeight + 0.5;
        } else if (height == swapHeight + 1.5) {
            let slice = this.getSlice(height);
            let spanA = upperCell.source.collapsed();
            let spanB = lowerCell.target.withCollapse(upperCell.source);
            rest = slice.moveNormal([spanA, spanB], rest, key.slice(0, -1));
            newHeight = swapHeight + 0.5;
        }
        
        if (height >= swapHeight + 1.75) {
            newHeight -= 1;
        }

        if (rest === null) {
            return null;
        }

        return rest.concat([newHeight]);
    }

    getSpan(minHeight, maxHeight, height) {
        let quarter = getQuarter(height);
        if (quarter == 1) height = Math.floor(height);
        if (quarter == 3) height = Math.ceil(height);

        let topSpan = this.sourceSpan(Math.ceil(height), maxHeight);
        let bottomSpan = this.targetSpan(minHeight, Math.floor(height));
        if (getQuarter(height) == 2) {
            let cell = this.cells[Math.floor(height)];

            if (cell instanceof CellEntity) {
                let cellSpan = cell.source.collapsed();
                topSpan.max -= cell.target.size() - 1;
                bottomSpan.max -= cell.source.size() - 1;
                return Span.union(topSpan, bottomSpan, cellSpan);
            }
        } else {
            return Span.union(topSpan, bottomSpan);
        }
    }

    getSlice(level) {
        if (this.dimension == 0) {
            throw new Error("Scaffold of dimension 0 has no slices.");
        }

        let quarter = getQuarter(level);

        if (level >= this.slices.length + 0.25 || level < 0) {
            throw new Error(`Scaffold has no slice at level ${level}.`);
        } else if (quarter == 2) {
            return this.halfSlices[Math.floor(level)];
        } else if (quarter == 0 || quarter == 1) {
            return this.slices[Math.floor(level)];
        } else {
            return this.slices[Math.ceil(level)];
        }
    }
    
    allPoints(fromHeight = null, toHeight = null) {
        if (this.dimension == 0) {
            return [[]];
        }

        fromHeight = fromHeight === null ? 0 : fromHeight;
        toHeight = toHeight === null ? this.cells.length : toHeight;

        let points = [];
        for (let level = fromHeight; level <= toHeight; level += 0.5) {
            let slice = this.getSlice(level);
            let slicePoints = slice.allPoints();
            points.push(...slicePoints.map(p => p.concat(level)));
        }

        return points;
    }

    getCell(level) {
        if (level >= this.size) {
            throw new Error(`Scaffold has no cell at level ${level}.`);
        }
        return this.cells[level];
    }

}

class Scaffold0 {

    constructor(cell) {
        this.cell = cell;
        this.dimension = 0;
    }

    get cells() {
        return [this.cell];
    }

    getSlice() {
        throw new Error("Scaffold of dimension 0 has no slices.");
    }

    move() {
        return [];
    }

    moveNormal() {
        return [];
    }

    moveCell() {
        return [];
    }

    mergeMulti() {
        return this;
    }

    mergeNormal() {
        return this;
    }

    allPoints() {
        return [[]];
    }

}

const getQuarter = (number) => {
    let floor = Math.floor(number);
    switch (Math.abs(number - floor)) {
        case 0: return 0;
        case 0.25: return 1;
        case 0.5: return 2;
        case 0.75: return 3;
        default: throw new Error(`Misaligned coordinate ${number}.`);
    }
}