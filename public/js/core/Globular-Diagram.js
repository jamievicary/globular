"use strict";

class Diagram {
    constructor(n, args) {
        this['_t'] = 'Diagram';
        _assert(!isNaN(n));
        _assert(!isNaN(args.type_dimension));
        _assert(n <= args.type_dimension);
        this.geometric_dimension = n;
        this.type_dimension = args.type_dimension;
        if (n == 0) {
            _assert(args.type);
            this.type = args.type;
            return this;
        }
        _assert(args.source && (args.source.getDimension() + 1 == n));
        _assert(args.data);
        this.source = args.source;
        this.data = args.data;
    }
    // The type of the object
    getType() {
        return 'Diagram';
    }
    // Check if the diagram has any non-identity data up to the given height
    hasTopLevelContent(height) {
        if (!height)
            return this.hasTopLevelContent(this.height);
        if (this.data[height] != null)
            return true;
        if (height == 0)
            return false;
        return this.hasTopLevelContent(height - 1);
    }
    getDimension() {
        return this.geometric_dimension;
    }
    // Returns the source boundary of the diagram
    getSourceBoundary() {
        return this.source;
    }
    // Computes the target boundary of the diagram
    getTargetBoundary() {
        if (this.getDimension() == 0) return null;
        return this.getSlice({ height: this.data.length, regular: true });
    }
    getSlice(location) {
        if (globular_is_array(location)) location = location.slice();
        else location = [location];
        if (location.length == 0) return this;
        if (!this.source) return null;
        // Recursive case
        let pos = location.shift();
        if (location.length > 0) return this.getSlice(pos).getSlice(location); // no need to copy slice
        _assert((pos.regular && pos.height <= this.data.length) || (!pos.regular && pos.height < this.data.length));
        // Handle request for slice 1 of identity diagram gracefully
        if (pos.height == 1 && pos.regular && this.data.length == 0) return this.source;
        _assert(pos.height <= this.data.length);
        /*
        // Check whether the cache contains the slice
        if (!this.sliceCache) {
            this.initializeSliceCache();
        } else if (this.sliceCache[height]) {
            return this.sliceCache[height];
        }
        this.sliceCache[height] = this.getSlice(height - 1).copy().rewrite(this.data[height - 1]); // need to copy before rewrite!
        return this.sliceCache[height];
        */
        var regular = pos.height == 0 ? this.source.copy() : this.getSlice({ height: pos.height - 1, regular: true }).copy().rewrite(this.data[pos.height - 1]);
        if (pos.regular) return regular;
        let singular = this.data[pos.height].forward_limit.rewrite(regular);
        return singular;
    }
    /*
        if (height == 0) return this.source;
        return this.getSlice(height - 1).rewrite(this.data[height - 1]);
    */
    // Return the ways that the goal (up to goal_size) fits inside this diagram (up to max_height),
    // with match starting at the specified height, and including click_point if present
    enumerate({ goal, goal_size, start_height, max_height }) { //(goal, goal_size, start_height, max_height, click_point) {
        _assert(this.geometric_dimension == goal.geometric_dimension);
        _assert(this.type_dimension == goal.type_dimension);
        // Base case
        if (this.geometric_dimension == 0) {
            if (this.type == goal.type) return [[]]; // return a single trivial match
            return []; // return no matches
        }
        if (goal_size == undefined) goal_size = goal.data.length;
        if (max_height == undefined) max_height = this.data.length;
        // If this diagram is too short to yield a possible match, return empty
        if (start_height == undefined && max_height < goal_size) return [];
        if (start_height != undefined && max_height < start_height + goal_size) return [];
        // The matches at least contain all the matches in the history of the diagram
        let matches = [];
        if (max_height > 1 && start_height == undefined) {
            matches = this.enumerate({ goal, goal_size, start_height, max_height: max_height - 1 });
        }
        // If goal_size == 0, we can try to find a match to a subslice
        if (goal_size == 0) {
            let slice_matches = this.getSlice({ height: max_height, regular: true }).enumerate({ goal: goal.source });
            let max_height_array = [max_height];
            for (let i = 0; i < slice_matches.length; i++) {
                matches.push(max_height_array.concat(slice_matches[i]));
            }
            return matches;
        }
        // If goal_size > 0, we can try to extend a match of a smaller goal
        let new_matches = this.enumerate({ goal, goal_size: goal_size - 1, start_height: max_height - goal_size, max_height: max_height - 1 });
        for (let i = 0; i < new_matches.length; i++) {
            var match = new_matches[i];
            if (sub_content(this.data[max_height - 1], goal.data[goal_size - 1], match.slice(1))) {
                matches.push(match);
            }
            /*
            if (this.sub_data(goal.data[goal_size - 1], match, max_height - 1)) {
                matches.push(match);
            }
            */
        }
        return matches;
    }

    // Check if the given subdiagram, at the given position, contains the given point
    subdiagramContainsPoint({ subdiagram, position, click }) {
        if (click == null) return true;
        if (click.length == 0) return true;
        if (click[0].height < position[0]) return false;
        if (!click[0].regular && click[0].height >= position[0] + subdiagram.data.length) return false;
        if (click[0].regular && click[0].height > position[0] + subdiagram.data.length) return false;
        let main_slice = this.getSlice({ height: click[0].height, regular: true });
        let subdiagram_slice = subdiagram.getSlice({ height: click[0].height - position[0], regular: true });
        return main_slice.subdiagramContainsPoint({ subdiagram: subdiagram_slice, position: position.slice(1), click: click.slice(1) });
    }

    rewrite(data) {
        // Handle the pointlike case
        /*
        if (this.geometric_dimension == 0) {
            this.data = data;
            return this;
        }
        */
        // Handle the inductive case
        return data.backward_limit.rewrite(data.forward_limit.rewrite(this));
    }
    // Make a copy of a diagram
    copy() {
        let type_dimension = this.type_dimension;
        if (!this.source) {
            let type = this.type;
            return new Diagram(0, { type_dimension, type });
        }
        let data = Content.copyData(this.data);
        let source = this.source.copy();
        return new Diagram(this.getDimension(), { type_dimension, source, data });
    }
    // Find the ID of the last cell that appears in the diagram
    getLastId() {
        var d = this;
        if (this.geometric_dimension == 0) return this.type; //{ id: this.data, dimension: this.type_dimension };
        while (d.data.length == 0) d = d.source;
        if (d.dimension == 0) return d.type; //{ id: d.type, dimension: d.type_dimension };
        _assert(d.data != null);
        return d.data.last().getLastId();
    }
    // Find the colour of the first cell that appears in the diagram
    getLastColour() {
        var id = this.getLastId();
        return gProject.getColour(id);
    }
    render(div, highlight) {
        globular_render(div, this, highlight);
    }
    prepare() {
        return;
        /*
        if (this.source != null) this.source.prepare();
        for (var i = 0; i < this.cells.length; i++) {
            var cell = this.cells[i];
            cell.id = cell.id.clean(); // update the ID to the new format, in case this is an old workspace
            if (cell.box != undefined) continue;
            cell.box = this.getSliceBoundingBox(i);
        }
        */
    }
    // Convert an internal coordinate to {boundary: {type, depth}, coordinates}, by identifying coordinates in slices adjacent to the boundary as being in that boundary. Assumes coordinates are first-index-first.
    getBoundaryCoordinates(coordinates, boundaryFlags) {
        //_assert(coordinates.length == this.geometric_dimension);
        if (coordinates.length == 0) return { boundary: null, coordinates: [] };
        let allow_boundary = boundaryFlags.length ? boundaryFlags[0] : { source: false, target: false };
        var slice = this.getSlice(coordinates[0]); // no need to copy slice
        //var new_allow_boundary = params.allow_boundary.length == 0 ? [] : params.allow_boundary.slice(1);
        let sub = slice.getBoundaryCoordinates(coordinates.slice(1), boundaryFlags.slice(1));
        var in_source = allow_boundary.source /* && coordinates.length > 1*/ && coordinates[0].height == 0 && coordinates[0].regular;
        //var in_target = coordinates.length > 1 && c[0] >= Math.max(this.cells.length, fakeheight ? 1 : 0);
        var in_target = allow_boundary.target /*&& coordinates.length > 1*/ /*&& c[0] == Math.max(1, this.cells.length)*/;
        if (sub.boundary != null) {
            sub.boundary.depth++;
        }
        else if (in_target) {
            // We're in the target, and we were previously in the interior
            sub.boundary = {
                type: 't',
                depth: 1
            };
        }
        else if (in_source) {
            // We're in the source, and we were previously in the interior
            sub.boundary = {
                type: 's',
                depth: 1
            };
        }
        else {
            // Not in the source or the target, previously in the interior
            sub.coordinates.unshift(coordinates[0]);
        }
        return sub;
    }
    // Check if the specified id is used at all in this diagram
    usesCell(generator) {
        if (generator.dimension > this.type_dimension)
            return false;
        if (this.geometric_dimension == 0)
            return this.data == generator.id;
        // Check whether the source uses it
        if (this.source && this.source.usesCell(generator))
            return true;
        // Check all the content of the diagram
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].usesCell(generator))
                return true;
        }
        // If not, we're clear
        return false;
    }
    // Get the bounding box surrounding a diagram component
    getLocationBoundingBox(location) {
        _assert(this.geometric_dimension == location.length);
        if (!globular_is_array(location))
            location = [location];
        else
            location = location.slice();
        if (this.geometric_dimension == 0)
            return {
                min: [],
                max: []
            };
        if (location.length == 0)
            debugger;
        var box = this.getSliceBoundingBox(location);
        if (box == null)
            return null;
        var extra = (location.length > this.getDimension() ? location.slice(1) : location);
        box.min = box.min.concat(extra);
        box.max = box.max.concat(extra);
        if (extra.length == location.length)
            box.max[box.max.length - location.length]++;
        return box;
    }
    // Pad the diagram content to remain consistent with a higher source attachment
    pad(depth) {
        if (depth == 1)
            return;
        for (let i = 0; i < this.data.length; i++) {
            let content = this.data[i];
            content.pad(depth - 1);
        }
    }
    // Attaches the given cell to the diagram, via the specified boundary path. 
    attach(id, position, boundary /*, bounds*/) {
        if (boundary != null) {
            if (boundary.type == '')
                boundary = null;
        }
        let generator = gProject.signature.getGenerator(id);
        // If the boundary is null, just rewrite the interior
        if (boundary == null) {
            let content = this.getAttachmentContent(generator.id, position, generator.source, generator.target);
            this.rewrite(content);
            return;
        }
        _assert(boundary.type != null);
        _assert(boundary.depth != undefined);

        if (boundary.depth > 1) {
            if (boundary.type == 's') this.pad(boundary.depth);
            this.source.attach(id, position, { type: boundary.type, depth: boundary.depth - 1 });
        } else {
            if (boundary.type == 's') {
                var content = this.source.getAttachmentContent(id, position, generator.source, generator.target);
                this.source.rewrite(content);
                var inverse_content = this.source.getAttachmentContent(Globular.toggle_inverse(id), position, generator.target, generator.source);
                this.data.unshift(inverse_content);
                //this.initializeSliceCache();
            }
            else {
                let content = this.getTargetBoundary().getAttachmentContent(id, position, generator.source, generator.target);
                this.data.push(content);
            }

        }
        /*
                // Attach to final element of the slice cache
                if (this.sliceCache != null) {
                    for (var i = 0; i < this.sliceCache.length; i++) {
                        if (this.sliceCache[i] == undefined) continue;
                        this.sliceCache[i].attach(id, position, {
                            type: boundary.type,
                            depth: boundary.depth - 1
                        });
                    }
                }
        */
        //this.initializeSliceCache();
    }
    /*
    // Construct the inverse to the specified cell, for the current diagram
    Diagram.prototype.getInverseCell = function (id, key) {
        return new NCell({
            id: Globular.toggle_inverse(cell.id),
            key: this.getInverseKey(cell.id, cell.key)
        });
    };
    */
    // Construct the content that contracts a source diagram, at a given position, and inserts the target diagram
    getAttachmentContent(type, position, source, target) {
        //if (!position) position = [].fill(0, 0, this.getDimension());
        _assert(position.length == this.getDimension());
        _assert(this.getDimension() == source.getDimension());
        _assert(this.getDimension() == target.getDimension());
        if (this.getDimension() == 0) {
            let forward_component = new LimitComponent(0, { type: type });
            let backward_component = new LimitComponent(0, { type: target.type });
            let forward_limit = new ForwardLimit(0, [forward_component]);
            let backward_limit = new BackwardLimit(0, [backward_component]);
            return new Content(0, forward_limit, backward_limit);
        }
        let forward_limit = this.contractForwardLimit(type, position, source);
        let singular_diagram = forward_limit.rewrite(this.copy());
        let backward_limit = singular_diagram.contractBackwardLimit(type, position, target);
        return new Content(this.getDimension(), forward_limit, backward_limit);
    }

    // Create the forward limit which contracts the a subdiagram at a given position, to a given type
    contractForwardLimit(type, position, subdiagram) {
        if (!position) {
            let arr = [];
            if (this.getDimension() > 0) {
                arr[this.getDimension() - 1] = 0;
                arr = arr.fill(0, 0, this.getDimension());
            }
            position = arr;
        }
        if (!subdiagram) subdiagram = this;
        _assert(position.length == this.getDimension());
        _assert(this.getDimension() == subdiagram.getDimension());
        if (this.getDimension() == 0) {
            let forward_component = new LimitComponent(0, { type: type });
            return new ForwardLimit(0, [forward_component]);
        }
        let slice_position = position.slice(1);
        let sublimits = [];
        for (let i = 0; i < subdiagram.data.length; i++) {
            let singular_slice = this.getSlice({ height: position[0] + i, regular: false });
            let subdiagram_singular_slice = subdiagram.getSlice({ height: i, regular: false });
            let sub_forward_limit = singular_slice.contractForwardLimit(type, slice_position, subdiagram_singular_slice);
            sublimits.push(sub_forward_limit);
        }
        let source_forward_limit = this.source.contractForwardLimit(type);
        let source_backward_limit = this.getTargetBoundary().contractBackwardLimit(type);
        let data = [new Content(this.getDimension() - 1, source_forward_limit, source_backward_limit)];
        let first = position[0];
        let last = position[0] + subdiagram.data.length;
        let forward_limit_component = new LimitComponent(this.getDimension(), { first, last, data, sublimits });
        let forward_limit = new ForwardLimit(this.getDimension(), [forward_limit_component]);
        return forward_limit;
    }

    // Create the backward limit which inflates the point at the given position, to a given subdiagram
    contractBackwardLimit(type, position, subdiagram) {
        if (!position) {
            let arr = [];
            if (this.getDimension() > 0) {
                arr[this.getDimension() - 1] = 0;
                arr = arr.fill(0, 0, this.getDimension());
            }
            position = arr;
        }
        if (!subdiagram) subdiagram = this;
        _assert(position.length == this.getDimension());
        _assert(this.getDimension() == subdiagram.getDimension());
        if (this.getDimension() == 0) {
            let forward_component = new LimitComponent(0, { type: subdiagram.type });
            return new BackwardLimit(0, [forward_component]);
        }
        let sublimits = [];
        let singular_slice = this.getSlice({ height: position[0], regular: false });
        let slice_position = position.slice(1);
        for (let i = 0; i < subdiagram.data.length; i++) {
            let subdiagram_singular_slice = subdiagram.getSlice({ height: i, regular: false });
            let sub_backward_limit = singular_slice.contractBackwardLimit(type, slice_position, subdiagram_singular_slice);
            sublimits.push(sub_backward_limit);
        }
        let first = position[0];
        let last = position[0] + subdiagram.data.length;
        let data = Content.copyData(subdiagram.data);
        Content.deepPadData(data, slice_position);
        let backward_limit_component = new LimitComponent(this.getDimension(), { first, last, data, sublimits });
        let backward_limit = new BackwardLimit(this.getDimension(), [backward_limit_component]);
        return backward_limit;
    }

    /*
    // Build the content which will attach a type at the given position
    buildAttachContent(type, position) {
        let generator = gProject.signature.getGenerator(type);
        _assert(generator.source);
        //let forward_limit = new ForwardLimit(Content.getLimitComponents(id, generator.source, position));
        let forward_limit = this.contractForwardLimit(type, position, generator.source);
        let backward_limit = this.contractBackwardLimit(type, positio)
        let backward_limit_components = Content.getLimitComponents(generator.id, generator.target, position);
        backward_limit_components[0].data = Content.copyData(generator.target.data);
        let backward_limit = new BackwardLimit(backward_limit_components);
        return new Content(forward_limit, backward_limit);
    }
    */

    singularData() {
        if (this.getDimension() == 0) return this.type;
        let array = [];
        for (let i = 0; i < this.data.length; i++) {
            slice_array = this.getSlice({ height: i, regular: false }).singularData();
            array.push(slice_array);
        }
        return array;
    }



    /*
    // Get the content array to attach a type at the given position of a given diagram
    static getLimitComponents(id, diagram, position) {
        if (!diagram) return null;
        if (diagram.geometric_dimension == 0) {
            return [new LimitComponent(0, { type: id })];
        }
        let sublimits = [];
        let slice_position = position.slice(1);
        for (let i = 0; i < diagram.data.length; i++) {
            let components = Content.getLimitComponents(id, diagram.getSlice({ height: i, regular: true }), slice_position);
            sublimits.push(new ForwardLimit(components));
        }
        let first = position[0];
        let last = position[0] + diagram.data.length;
        return [new LimitComponent(this.getDimension(), { first, last, data, sublimits })];
        //return [new LimitComponent(id, position[0], position[0] + diagram.data.length, null, sublimits)];
    }
    */

    equals(d2) {
        var d1 = this;
        if (d1.getDimension() != d2.getDimension()) return false;
        if (d1.type_dimension != d2.type_dimension) return false;
        if (d1.geometric_dimension == 0) return d1.type == d2.type;
        if (d1.data.length != d2.data.length) return false;
        for (var i = 0; i < this.data.length; i++) {
            if (!d1.data[i].equals(d2.data[i])) return false;
        }
        return d1.source.equals(d2.source);
    }

    // Get all the ways that a cell matches, local to a given click
    getLocalMatches(click, id, flip) {
        //        subdiagramContainsPoint({ subdiagram, position, point }) {
        var generator = gProject.signature.getGenerator(id);
        var subdiagram;
        if (flip == '') subdiagram = generator.source;
        else if (flip == 'I0') subdiagram = generator.target;
        else if (flip == 'I1') subdiagram = generator.source.mirror(0);
        else if (flip == 'I0I1') subdiagram = generator.target.mirror(0);
        var matches = this.enumerate({ goal: subdiagram });
        var results = [];
        for (var i = 0; i < matches.length; i++) {
            if (!this.subdiagramContainsPoint({ subdiagram, position: matches[i], click })) continue;
            //var small_intersection = intersection.min.vector_equals(intersection.max);
            // Only accept small intersection if it equals click_box
            //if (small_intersection && !boundingBoxesEqual(intersection, click_box)) continue;
            results.push({ id: id + flip, key: matches[i], possible: true });
        }
        return results;
    }


    //////////////////// NOT YET REVISED ////////////////////////
    /*
        Check for equality of two diagrams, recursively on their sources.
    */
    multipleInterchangerRewrite(rewrite_array) {
        if (rewrite_array === false) {
            return false;
        }
        for (var i = 0; i < rewrite_array.length; i++) {
            if (this.interchangerAllowed(rewrite_array[i].id, rewrite_array[i].key)) {
                this.rewrite(rewrite_array[i]);
            }
            else {
                return false;
            }
        }
        return true;
    }
    expandWrapper(type, x, k) {
        if (x < 0 || x >= this.cells.length) {
            return false;
        }
        var y = this.cells[x].key.last();
        if (this.cells[x].id === 'IntI0') {
            y--;
        } // Special code to deal with the key for IntI0
        return this.expand(type, {
            up: x,
            across: y,
            length: this.source_size(x)
        }, 1, k);
    }
    // Turns an n-diagram into an identity (n+1)-diagram
    boost() {
        var diagram_copy = this.copy();
        this.source = diagram_copy;
        this.data = [];
        this.type = undefined;
        this.geometric_dimension++;
        this.type_dimension++;
        this.initializeSliceCache();
    }
    /*
        Returns the full sizes of all the slices of the diagram
    */
    getFullDimensions() {
        if (this.getDimension() == 0) {
            return [];
        }
        else if (this.getDimension() == 1) {
            return this.cells.length;
        }
        var full_dimensions = [this.source.getFullDimensions()];
        for (var i = 0; i < this.cells.length; i++) {
            full_dimensions.push(this.getSlice(i + 1).getFullDimensions());
        }
        //return [this.cells.length].concat(this.source.getFullDimensions());
        return full_dimensions;
    }
    getLengthsAtSource() {
        if (this.getDimension() == 0) return [];
        if (this.getDimension() == 1) return [this.data.length];
        return this.getSourceBoundary().getLengthsAtSource().concat([this.data.length]);
    }
    source_size(level) {
        var nCell = this.cells[level];
        if (nCell.id.substr(0, 3) === 'Int') {
            return this.getSlice(level).getInterchangerBoundingBox(nCell.id, nCell.key).last(); // no need to copy slice
        }
        else {
            return nCell.source_size();
        }
    }
    target_size(level) {
        var nCell = this.cells[level];
        if (nCell.id.substr(0, 3) === 'Int') {
            return this.getSlice(level).rewritePasteData(nCell.id, nCell.key).length; // no need to copy slice
        }
        else {
            return nCell.target_size();
        }
    }
    getBoundary(path) {
        if (path == null)
            return this;
        var boundary = {};
        if (typeof path == 'string') {
            boundary.type = path.last();
            boundary.depth = path.length;
        }
        else {
            boundary = path;
        }
        if (boundary.depth > 1)
            return this.source.getBoundary({
                depth: boundary.depth - 1,
                type: boundary.type
            });
        if (boundary.type == 's')
            return this.getSourceBoundary();
        if (boundary.type == 't')
            return this.getTargetBoundary();
    }
    pullUpMinMax(top_height, bottom_height, min, max) {
        for (var i = bottom_height; i < top_height; i++) {
            var box = this.cells[i].box;
            var delta = this.target_size(i) - this.source_size(i);
            max = Math.max(max + delta, box.max.last() + delta);
            min = Math.min(min, box.min.last());
        }
        return {
            min: min,
            max: max
        };
    }
    // Check that the bounding boxes can slide past each other
    boundingBoxesSlideDownOnRight(lower, upper) {
        // Make sure they are adjacent in height correctly
        if (lower.max.last() != upper.min.last())
            return false;
        // Find the top face of the lower bounding box
        var pull_up = this.pullUpMinMax(upper.min.last(), lower.min.last(), lower.min.penultimate(), lower.max.penultimate());
        // Check the upper box is on the right
        return upper.min.penultimate() >= pull_up.max;
    }
    // Check that the bounding boxes can slide past each other
    boundingBoxesSlideDownOnLeft(lower, upper) {
        // Make sure they are adjacent in height correctly
        if (lower.max.last() != upper.min.last())
            return false;
        // Find the top face of the lower bounding box
        var pull_up = this.pullUpMinMax(upper.min.last(), lower.min.last(), lower.min.penultimate(), lower.max.penultimate());
        // Check the upper box is on the left
        return upper.max.penultimate() <= pull_up.min;
    }
    // Get the cell at a particular location in the diagram
    getCell(location) {
        _assert(location.length == this.geometric_dimension);
        return this.getSlice(location).getLastId();
        /*
        var level = location.shift();
        var slice = this.getSlice(location); // no need to copy slice
        while (slice.data.length == 0) {
            if (slice == null) return null;
            slice = slice.getSourceBoundary();
        }
        return slice.data[level];
        */
    }
    // Get bounding box surrounding the entire diagram
    getEntireBoundingBox(cell) {
        var source = this.getSourceBoundary();
        if (source == null)
            return {
                min: [],
                max: []
            };
        var box = this.getSourceBoundary().getEntireBoundingBox();
        box.min.push(0);
        box.max.push(this.cells.length);
        return box;
    }
    // Gets the bounding box for an entire slice of the diagram
    getEntireSliceBoundingBox(location) {
        if (!globular_is_array(location))
            location = [location];
        else
            location = location.slice();
        if (location.length == 0)
            return this.getEntireBoundingBox();
        var height = location.pop();
        var box = this.getSlice(height).getEntireSliceBoundingBox(location);
        box.min.push(height);
        box.max.push(height);
        return box;
    }
    // Find how the specified boundary and sub-box appears from the specified location
    getLocationBoundaryBox(boundary, box, location) {
        // If the location is the whole diagram, then the inputs are already correct
        if (location.length == 0) {
            return {
                boundary: boundary,
                box: box
            };
        }
        // Pop off the height
        var height = location.pop();
        // Interior
        if (boundary == null) {
            /*
            if (location.length == 0) {
                return {boundaryboundary_data
            }
            */
            if (height < box.min.last())
                return null;
            if (height > box.max.last())
                return null;
            var minmax = this.pullUpMinMax(height, box.min.last(), box.min.penultimate(), box.max.penultimate());
            box.min.pop();
            box.min[box.min.length - 1] = minmax.min;
            box.max.pop();
            box.max[box.max.length - 1] = minmax.max;
            var slice = this.getSlice(height);
            return slice.getLocationBoundaryBox(null, box, location);
        }
        // Shallow boundary
        if (boundary.depth == 1) {
            if (boundary.type == 's') {
                if (height > 0)
                    return null;
                return this.getSourceBoundary().getLocationBoundaryBox(null, box, location);
            }
            else {
                if (height < Math.max(1, this.cells.length))
                    return null;
                return this.getTargetBoundary().getLocationBoundaryBox(null, box, location);
            }
        }
        // Deep boundary
        var new_boundary = boundary == null ? null : {
            depth: boundary.depth - 1,
            type: boundary.type
        };
        return this.getSourceBoundary().getLocationBoundaryBox(new_boundary, box, location);
    }
    getBoundingBox(cell) {
        _assert(cell);
        _assert(cell.id);
        if (cell.id.is_interchanger()) return this.getInterchangerBoundingBox(cell.id, cell.key);
        var box = { min: cell.key.slice() };
        var generator_box = gProject.signature.getGenerator(cell.id).getBoundingBox();
        box.max = box.min.vector_add(generator_box.max);
        box.ignore = true; // don't store bounding boxes on the server
        return box;
    }
    getSliceBoundingBox(location) {
        if (globular_is_array(location)) location = location.slice();
        else location = [location];
        var height = location.shift();
        var slice = this.getSlice(location); // no need to copy slice
        if (slice.getDimension() == 0) return { min: [], max: [] };
        if (height >= slice.data.length) return null;
        return slice.getSlice(height).getBoundingBox(slice.data[height]); // no need to copy slice
    }
    /*
    // Returns a slice subdiagram
    Diagram.prototype.getSlice = function (location) {
        if (globular_is_array(location)) location = location.slice();
        else location = [location];
        if (location.length == 0) return this;
        if (this.source === null) return null;
    
        // Recursive case
        var height = location.pop();
        if (location.length > 0) return this.getSlice(height).getSlice(location); // no need to copy slice
    
        // Base case
        if (height == 1 && this.cells.length == 0) {
            // Handle request for slice 1 of identity diagram gracefully
            //return this.source.copy();
            return this.source;
        } else if (height > this.cells.length) debugger;
    
        if (height == 0) return this.source;
    
        // Check whether the cache contains the slice
        if (this.sliceCache == null) {
            this.initializeSliceCache();
        } else {
            if (this.sliceCache[height] != undefined) {
                //return this.sliceCache[height].copy();
                return this.sliceCache[height];
            }
        }
    
        // Otherwise do a recursive call
        this.sliceCache[height] = this.getSlice(height - 1).copy().rewrite(this.cells[height - 1]); // need to copy before rewrite!
        return this.sliceCache[height];
    };
    */
    initializeSliceCache() {
        this.sliceCache = [];
        this.sliceCache.ignore = true;
    }
    clearAllSliceCaches() {
        delete this.sliceCache;
        if (this.source != null)
            this.source.clearAllSliceCaches();
        return this;
    }
    // Reflect a diagram in the nth way
    mirror(n) {
        if (n == 0) {
            // Construct the inverse diagram
            var new_diagram = new Diagram(this.getTargetBoundary(), []);
            for (var i = this.cells.length - 1; i >= 0; i--) {
                var new_cell = this.getSlice(i).getInverseCell(this.cells[i]);
                new_diagram.attach(new_cell, {
                    depth: 1,
                    type: 't'
                });
            }
            return new_diagram;
        }
        else {
            // Not yet implemented
            debugger;
        }
    }
    // Flips the diagram in the nth way
    flip(n) {
    }
    keepAfter(n) {
        var new_source = this.getSlice(n).copy();
        var new_cells = this.cells.slice(n);
        var new_cache = this.sliceCache.slice(n);
        this.source = new_source;
        this.cells = new_cells;
        this.sliceCache = new_cache;
    }
    keepBefore(n) {
        var new_cells = this.cells.slice(0, n);
        var new_cache = this.sliceCache.slice(0, n);
        this.cells = new_cells;
        this.sliceCache = new_cache;
    }
    // Pad the given coordinates as required to ensure there is an entity present
    realizeCoordinate(coords) {
        var slice = this;
        // Obtain the suggested slice
        for (var i = 0; i < coords.length - 1; i++) {
            slice = slice.getSlice({ height: coords[coords.length - 1 - i], regular: true });
        }
        // For each extra dimension we have to dive to find an entity, pad the coords
        while (slice.getDimension() > 0 && slice.data.length == 0) {
            slice = slice.source;
            coords.unshift(0);
        }
        return coords;
    }
    downloadPNG(filename, highlight) {
        var div = $('<div>').addClass('temporary_export_div').css('position', 'absolute').css('left', 0).css('width', 100).css('height', 100);
        var display = new Display($('#diagram-canvas'));
        display.set_diagram(this, highlight);
        display.render(div[0], highlight);
        download_SVG_as_PNG(div.children('svg')[0], {
            sx: 0,
            sy: 0,
            sWidth: 10,
            sHeight: 10,
            logical_width: 10,
            logical_height: b.top - b.bottom
        }, filename);
        div.remove();
    }
}

function sub_content(content, subcontent, position) {
    if (!sub_limit(content.forward_limit, subcontent.forward_limit, position)) return false;
    if (!sub_limit(content.backward_limit, subcontent.backward_limit, position)) return false;
    return true;
}

// Check if the given subdata is present with the indicated offset
function sub_data(data, subdata, offset) {
    //    if (!sub_limit(this.data[height].forward_limit.components, subdata.forward_limit.components, offset)) return false;
    //    if (!sub_limit(this.data[height].backward_limit.components, subdata.backward_limit.components, offset)) return false;
    if (!sub_limit(this.data[height].forward_limit.components, subdata.forward_limit.components, offset)) return false;
    if (!sub_limit(this.data[height].backward_limit.components, subdata.backward_limit.components, offset)) return false;
    return true;
}


// Check if a forward limit contains all the content of another
function sub_limit(limit, sublimit, offset) {
    _assert(limit.n == sublimit.n);
    if (limit.components.length != sublimit.components.length) return false; // number of components must be the same
    for (let i = 0; i < limit.components.length; i++) {
        if (!sub_limit_component(limit.components[i], sublimit.components[i], offset)) return false;
    }
    return true;
}

function sub_limit_component(component, subcomponent, offset) {
    _assert(component.n == subcomponent.n);
    _assert(offset.length == component.n);
    if (component.n == 0) return component.type == subcomponent.type;
    if (component.first != subcomponent.first + offset[0]) return false;
    if (component.last != subcomponent.last + offset[0]) return false;
    if (component.data.length != subcomponent.data.length) return false;
    let offset_slice = offset.slice(1);
    for (let i = 0; i < component.data.length; i++) {
        if (!sub_data(component.data[i], subcomponent.data[i], offset_slice)) return false;
    }
    if (component.sublimits.length != subcomponent.sublimits.length) return false;
    for (let i = 0; i < component.sublimits.length; i++) {
        if (!sub_limit(component.sublimits[i], subcomponent.sublimits[i], offset_slice)) return false;
    }
}

/*
// Check lower parts of this limit
if (max_index > 0 && !sub_limit(limit, sublimit, offset, max_index - 1)) return false;
let a = limit[max_index];
let b = sublimit[max_index];
_assert(a.n == b.n);
if (a.n == 0) return a.type == b.type;
if (a.first != b.first + offset[0]) return false;
if (a.last != b.last + offset[0]) return false;
let offset_slice = offset.slice(1);
if (!sub_limit(a.data, b.data, offset_slice)) return false;

// If present, check type data
if (a.data && !sub_limit(a.data, b.data, offset_slice)) return false;

return true;
}
*/

/*
// Make a new copy of data
function copy_data(old_data) {
    if ((typeof old_data) === 'string') return old_data;
    if (old_data == null) return null;
    let new_data = [];
    for (let i=0; i<old_data.length; i++) {
        new_data.push()
        let x = old_data[i];
        let entry = {};
        entry.type = x.type;
        entry.forward_limit = x.forward_limit.copy();
        entry.backward_limit = x.backward_limit.copy();
    }
    return new_data;
}
*/
// Make a new copy of a limit
function copy_limit(old_limit) {
    if (old_limit == null) return null;
    let new_limit = [];
    for (let i = 0; i < old_limit.length; i++) {
        let x = old_limit[i];
        let entry = {};
        entry.data = copy_data(x.data);
        entry.first = x.first;
        entry.last = x.last;
        entry.data = copy_limit(o.data);
    }
}
