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
            return new Scaffold(0, [entity], null, null);
        }

        // All cells
        let cells = [];
        for (let level = 0; level < diagram.cells.length; level++) {
            cells.push(CellEntity.of(diagram, level));
        }

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
            //if (cell.cone || slice.dimension != 2) {
            return slice.mergeOne(cell.source, cell.key, cell.meta);
            // } else {
            //      return slice.mergeSwap(cell.source.min);
            // }
        } else {
            return slice.mergeOne(new Span(0, 0), cell.key);
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

    mergeOne(heightSpan, key, meta) {
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

    merge(heightSpans) {
        throw new Error("TODO: merge");
        heightSpans.sort((a, b) => a.min - b.min);

        let diagram = this;
        let offset = 0;

        for (let span of heightSpans) {
            span = span.move(offset);
            offset += 1 - span.size();
            diagram = diagram.mergeOne(span);
        }

        return diagram;
    }

    mergeSwap(height) {
        throw new Error("TODO: Merge swap");
        // let target = this.cells[height].target;
        // let source = this.cells[height + 1].source;

        let source = this.sourceSpan(height, height + 2);
        let target = this.targetSpan(height, height + 2);
        let cell = new Entity(source, target);

        let cells = this.cells.slice();
        cells.splice(height, 2, cell);

        let slices = this.slices.slice();
        slices.splice(height + 1, 1);

        let spanA = this.cells[height].source;
        let spanB = this.cells[height + 1].source;
        if (spanB.min >= this.cells[height].target.min) {
            spanB = spanB.move(this.cells[height].source.size() - this.cells[height].target.size());
        }

        let halfSlice = slices[height].merge([spanA, spanB]);
        // Scaffold.makeHalfSlice(slices[heightSpan.min], cells[heightSpan.min]);
        let halfSlices = this.halfSlices.slice();
        halfSlices.splice(height, 2, halfSlice);

        return new Scaffold(this.dimension, cells, slices, halfSlices);
    }

    move(heightSpans, point, path) {
        if (this.dimension == 0) {
            return [];
        }

        let height = point.last();
        let newHeight = height;
        let rest = point.slice(0, -1);

        

        // Inside a span?
        let spanInterior = heightSpans.find(s => s.min < height && s.max > height);
        if (!!spanInterior) {
            // Interior or parallel
            let slice = this.getSlice(height);
            let span = this.getSpan(spanInterior.min, spanInterior.max, height);
            rest = slice.move([span], rest, path.slice(0, -1));
            newHeight = spanInterior.min + 0.5;
        }

        // Contract the spans before
        let spansBefore = heightSpans.filter(s => s.max <= height);
        for (let span of spansBefore) {
            newHeight -= span.size() - 1;
        }

        return rest.concat([newHeight]);
    }

    /*move(heightSpan, point) {
        if (this.dimension == 0) {
            return [];
        }

        let height = point.last();
        let newHeight = height;
        let rest = point.slice(0, -1);

        //let spansBefore = heightSpans.filter(s => s.max <= height);

        if (heightSpan.min < height && heightSpan.max > height) {
            // Interior or parallel
            let slice = this.getSlice(height);
            let span = this.getSpan(heightSpan.min, heightSpan.max, height);
            rest = slice.move(span, rest);
            newHeight = heightSpan.min + 0.5;
        } else if (heightSpan.max <= height) {
            // Above
            newHeight -= heightSpan.max - heightSpan.min - 1;
        }

        if (rest === null) {
            return null;
        }

        if (heightSpan.max == heightSpan.min && height == heightSpan.min) {
            return null;
        }

        return rest.concat([newHeight]);
    }*/

    moveSwap(swapHeight, point) {
        throw new Error("TODO: Move swap");
        let height = point.last();
        let rest = point.slice(0, -1);
        let newHeight = height;
        let lowerCell = this.cells[swapHeight];
        let upperCell = this.cells[swapHeight + 1];

        

        if (height == swapHeight + 0.5) {
            let slice = this.getSlice(height);
            let spanA = lowerCell.target.collapsed();
            let spanB = upperCell.source.withCollapse(lowerCell.target);
            rest = slice.move([spanA, spanB], rest);
            newHeight = swapHeight + 0.5;

        } else if (height == swapHeight + 1) {
            let slice = this.getSlice(height);
            let spanA = upperCell.source;
            let spanB = lowerCell.target;
            rest = slice.move([spanA, spanB], rest);
            newHeight = swapHeight + 0.5;
        } else if (height == swapHeight + 1.5) {
            let slice = this.getSlice(height);
            let spanA = upperCell.source.collapsed();
            let spanB = lowerCell.target.withCollapse(upperCell.source);
            rest = slice.move([spanA, spanB], rest);
            newHeight = swapHeight + 0.5;
        }
        
        
        if (height >= swapHeight + 2) {
            newHeight -= 1;
        }

        if (rest === null) {
            return null;
        }

        return rest.concat([newHeight]);
    }

    getSpan(minHeight, maxHeight, height) {
        let topSpan = this.sourceSpan(Math.ceil(height), maxHeight);
        let bottomSpan = this.targetSpan(minHeight, Math.floor(height));
        if (height > Math.floor(height)) {
            let cell = this.cells[Math.floor(height)];
            let cellSpan = cell.source.collapsed();
            topSpan.max -= cell.target.size() - 1;
            bottomSpan.max -= cell.source.size() - 1;
            return Span.union(topSpan, bottomSpan, cellSpan);
        } else {
            return Span.union(topSpan, bottomSpan);
        }
    }

    getSlice(level) {
        if (this.dimension == 0) {
            throw new Error("Scaffold of dimension 0 has no slices.");
        }

        if (level >= this.slices.length || level < 0) {
            throw new Error(`Scaffold has no slice at level ${level}.`);
        } else if (level > Math.floor(level)) {
            return this.halfSlices[Math.floor(level)];
        } else {
            return this.slices[level];
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