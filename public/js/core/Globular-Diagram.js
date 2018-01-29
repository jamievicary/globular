"use strict";

class Diagram {
    constructor(n, args) {
        this['_t'] = 'Diagram';
        _assert(!isNaN(n));
        _assert(!isNaN(args.t));
        _assert(n <= args.t);
        this.n = n;
        this.t = args.t;
        if (n == 0) {
            _assert(args.type instanceof Generator);
            this.type = args.type;
            return this;
        }
        _assert(args.source && (args.source.n + 1 == n));
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
    // Returns the source boundary of the diagram
    getSourceBoundary() {
        return this.source;
    }
    // Computes the target boundary of the diagram
    getTargetBoundary() {
        if (this.n == 0) return null;
        return this.getSlice({ height: this.data.length, regular: true });
    }
    getSlice(location) {
        if (globular_is_array(location)) location = location.slice();
        else location = [location];
        if (location.length == 0) return this;
        _assert(!isNaN(location[0].height));
        _assert(location[0].regular != undefined);
        if (!this.source) return null;
        // Recursive case
        let pos = location.shift();
        if (location.length > 0) return this.getSlice(pos).getSlice(location); // no need to copy slice
        // Handle request for slice 1 of identity diagram gracefully
        if (pos.height == 1 && pos.regular && this.data.length == 0) return this.source;
        _assert((pos.regular && pos.height <= this.data.length) || (!pos.regular && pos.height < this.data.length));
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

        if (pos.height == 0 && pos.regular) return this.source;
        if (pos.regular) {
            let singular = this.getSlice({ height: pos.height - 1, regular: false }).copy();
            return this.data[pos.height - 1].backward_limit.rewrite(singular);
        } else {
            let regular = this.getSlice({ height: pos.height, regular: true }).copy();
            if (pos.height == 0) regular.t = this.t - 1; // When rewriting source need to correct the type dimension
            return this.data[pos.height].forward_limit.rewrite(regular);
        }
        /*
        var regular = pos.height == 0 ? this.source.copy() : this.getSlice({ height: pos.height - 1, regular: true }).copy().rewrite(this.data[pos.height - 1]);
        if (pos.regular) return regular;
        let singular = this.data[pos.height].forward_limit.rewrite(regular);
        if (pos.height == 0) singular.t ++; // Give type dimension an extra boost when we rewrite the source
        return singular;
        */
    }
    /*
        if (height == 0) return this.source;
        return this.getSlice(height - 1).rewrite(this.data[height - 1]);
    */
    // Return the ways that the goal (up to goal_size) fits inside this diagram (up to max_height),
    // with match starting at the specified height, and including click_point if present
    enumerate({ goal, goal_size, start_height, max_height }) { //(goal, goal_size, start_height, max_height, click_point) {
        _assert(this.n == goal.n);
        _assert(this.t == goal.t);
        // Base case
        if (this.n == 0) {
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
        if (max_height > 0 /*1*/ && start_height == undefined) {
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
        if (this.n == 0) {
            this.data = data;
            return this;
        }
        */
        // Handle the inductive case
        return data.backward_limit.rewrite(data.forward_limit.rewrite(this));
    }
    // Make a copy of a diagram
    copy() {
        let t = this.t;
        if (!this.source) {
            let type = this.type;
            return new Diagram(0, { t, type });
        }
        let data = Content.copyData(this.data);
        let source = this.source.copy();
        return new Diagram(this.n, { t, source, data });
    }
    // Find the ID of the last cell that appears in the diagram
    getLastId() {
        var d = this;
        if (this.n == 0) return this.type; //{ id: this.data, dimension: this.t };
        while (d.data.length == 0) {
            d = d.source;
            if (d.n == 0) return d.type;
        }
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
        //_assert(coordinates.length == this.n);
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
        if (generator.dimension > this.t) return false;
        if (this.n == 0) return this.data == generator.id;
        if (this.source && this.source.usesCell(generator)) return true;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].usesCell(generator)) return true;
        }
        return false;
    }
    // Get the bounding box surrounding a diagram component
    getLocationBoundingBox(location) {
        _assert(this.n == location.length);
        if (!globular_is_array(location))
            location = [location];
        else
            location = location.slice();
        if (this.n == 0)
            return {
                min: [],
                max: []
            };
        if (location.length == 0)
            debugger;
        var box = this.getSliceBoundingBox(location);
        if (box == null)
            return null;
        var extra = (location.length > this.n ? location.slice(1) : location);
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
    attach(option, boundary /*, bounds*/) {
        _assert(option instanceof Content);

        if (boundary == null) return this.rewrite(option);

        _assert(boundary.type != null);
        _assert(boundary.depth != null);

        if (boundary.depth > 1) {
            if (boundary.type == 's') this.pad(boundary.depth);
            this.source.attach(option, { type: boundary.type, depth: boundary.depth - 1 });
            //this.source.attach(id, position, { type: boundary.type, depth: boundary.depth - 1 });
        } else {
            if (boundary.type == 's') {
                let new_content = option.reverse(this.source);
                this.data.unshift(new_content);
                this.source.rewrite(option);
            }
            else {
                this.data.push(option);
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

    // Create the forward limit which contracts the a subdiagram at a given position, to a given type
    contractForwardLimit(type, position, subdiagram, framing) {
        if (!position) {
            let arr = [];
            if (this.n > 0) {
                arr[this.n - 1] = 0;
                arr = arr.fill(0, 0, this.n);
            }
            position = arr;
        }
        if (!subdiagram) subdiagram = this;
        _assert(position.length == this.n);
        _assert(this.n == subdiagram.n);
        if (this.n == 0) return new ForwardLimit(0, [new LimitComponent(0, { type })], framing);
        let slice_position = position.slice(1);
        let sublimits = [];
        for (let i = 0; i < subdiagram.data.length; i++) {
            let singular_slice = this.getSlice({ height: position[0] + i, regular: false });
            let subdiagram_singular_slice = subdiagram.getSlice({ height: i, regular: false });
            let sub_forward_limit = singular_slice.contractForwardLimit(type, slice_position, subdiagram_singular_slice, framing);
            sublimits.push(sub_forward_limit);
        }
        let source_forward_limit = this.source.contractForwardLimit(type, slice_position, subdiagram.source, framing);
        //let source_backward_limit = this.getTargetBoundary().contractBackwardLimit(type);
        let source_backward_limit = this.getSlice({ height: position[0] + subdiagram.data.length, regular: true }).contractBackwardLimit(type, slice_position, subdiagram.getTargetBoundary(), framing);
        let data = [new Content(this.n - 1, source_forward_limit, source_backward_limit)];
        let first = position[0];
        let last = position[0] + subdiagram.data.length;
        let forward_limit_component = new LimitComponent(this.n, { first, last, data, sublimits });
        let forward_limit = new ForwardLimit(this.n, [forward_limit_component]);
        return forward_limit;
    }

    // Create the backward limit which inflates the point at the given position, to a given subdiagram
    contractBackwardLimit(type, position, subdiagram, framing) {
        if (!position) {
            let arr = [];
            if (this.n > 0) {
                arr[this.n - 1] = 0;
                arr = arr.fill(0, 0, this.n);
            }
            position = arr;
        }
        if (!subdiagram) subdiagram = this;
        _assert(position.length == this.n);
        _assert(this.n == subdiagram.n);
        if (this.n == 0) {
            let forward_component = new LimitComponent(0, { type: subdiagram.type });
            return new BackwardLimit(0, [forward_component], framing);
        }
        let sublimits = [];
        let singular_slice = this.getSlice({ height: position[0], regular: false });
        let slice_position = position.slice(1);
        for (let i = 0; i < subdiagram.data.length; i++) {
            let subdiagram_singular_slice = subdiagram.getSlice({ height: i, regular: false });
            let sub_backward_limit = singular_slice.contractBackwardLimit(type, slice_position, subdiagram_singular_slice, framing);
            sublimits.push(sub_backward_limit);
        }
        let first = position[0];
        let last = position[0] + subdiagram.data.length;
        let data = Content.copyData(subdiagram.data);
        Content.deepPadData(data, slice_position);
        let backward_limit_component = new LimitComponent(this.n, { first, last, data, sublimits });
        let backward_limit = new BackwardLimit(this.n, [backward_limit_component]);
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
        if (this.n == 0) return this.type;
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
        if (diagram.n == 0) {
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
        return [new LimitComponent(this.n, { first, last, data, sublimits })];
        //return [new LimitComponent(id, position[0], position[0] + diagram.data.length, null, sublimits)];
    }
    */

    equals(d2) {
        var d1 = this;
        if (d1.n != d2.n) return false;
        if (d1.t != d2.t) return false;
        if (d1.n == 0) return d1.type == d2.type;
        if (d1.data.length != d2.data.length) return false;
        for (var i = 0; i < this.data.length; i++) {
            if (!d1.data[i].equals(d2.data[i])) return false;
        }
        return d1.source.equals(d2.source);
    }

    // Get all the ways that a cell matches, local to a given click
    getLocalMatches(click, type, flip) {
        //        subdiagramContainsPoint({ subdiagram, position, point }) {
        var subdiagram;
        if (!flip) subdiagram = type.source;
        else subdiagram = type.target;
        var matches = this.enumerate({ goal: subdiagram });
        var results = [];
        for (var i = 0; i < matches.length; i++) {
            if (!this.subdiagramContainsPoint({ subdiagram, position: matches[i], click })) continue;
            //var small_intersection = intersection.min.vector_equals(intersection.max);
            // Only accept small intersection if it equals click_box
            //if (small_intersection && !boundingBoxesEqual(intersection, click_box)) continue; 

            let content = this.getAttachmentContent(type, matches[i],
                type.source, type.target, flip);
            results.push(content);

            //results.push({ id: id + flip, key: matches[i], possible: true });
        }
        return results;
    }

    // Construct the content that contracts a source diagram, at a given position, and inserts the target diagram
    getAttachmentContent(type, position, source, target, flip) {

        if (flip) [source, target] = [target, source];
        
        //if (!position) position = [].fill(0, 0, this.n);
        _assert(position.length == this.n);
        _assert(this.n == source.n);
        _assert(this.n == target.n);
        if (this.n == 0) {
            let forward_component = new LimitComponent(0, { type: type });
            let backward_component = new LimitComponent(0, { type: target.type });
            let forward_limit = new ForwardLimit(0, [forward_component], true);
            let backward_limit = new BackwardLimit(0, [backward_component], false);
            return new Content(0, forward_limit, backward_limit);
        }
        let forward_limit = this.contractForwardLimit(type, position, source, !flip);
        let singular_diagram = forward_limit.rewrite(this.copy());
        let backward_limit = singular_diagram.contractBackwardLimit(type, position, target, flip);
        return new Content(this.n, forward_limit, backward_limit);
    }

    getContractionLimit(location, right) {
        _assert(location instanceof Array);
        _assert(location.length > 0);
        //_assert(!isNaN(location[0]));
        if (location.length == 1) {
            _assert(!location[0].regular); // Must end on a singular structure
            let height = location[0].height;
            let contract_data = this.contract(height, right == 1);
            let first = location[0].height;
            let last = first + 2;
            let n = this.n;
            let I2_reversed = contract_data.I2.getForwardLimit(this.getSlice({ height: first + 1, regular: false }), contract_data.T);
            let sublimits = [contract_data.I1, I2_reversed];
            let data_forward = contract_data.I1.compose(this.data[height].forward_limit);
            let data_backward = contract_data.I2.compose(this.data[height + 1].backward_limit);
            let data = [new Content(this.n - 1, data_forward, data_backward)];
            let forward_component = new LimitComponent(this.n, { first, last, data, sublimits });
            return new ForwardLimit(n, [forward_component]);
        }
        else if (location.length > 1) {
            let slice = this.getSlice(location[0]);
            let recursive = slice.getContractionLimit(location.slice(1), right);
            if (!location[0].regular) return null; // Can't handle contractions in singular subslices yet
            let recursive_target = recursive.rewrite(slice.copy())
            let recursive_reversed = recursive.getBackwardLimit(slice, recursive_target);
            let first = location[0].height;
            let last = location[0].height;
            let data = [new Content(this.n - 1, recursive, recursive_reversed)];
            let sublimits = [];
            let component = new LimitComponent(this.n, { data, first, last, sublimits });
            return new ForwardLimit(this.n, [component]);
        }
        _assert(false);
    }

    getContractionContent(location, right) {
        let forward_limit = this.getContractionLimit(location, right);
        if (!forward_limit) return null;
        let target = forward_limit.rewrite(this.copy());
        let backward_limit = new BackwardLimit(this.n, []);
        return new Content(this.n, forward_limit, backward_limit);
        // The target has length 0, so it's a pure vacuum bubble.
    }

    drag(location, drag) {
        _assert(location instanceof Array);
        _assert(location.length > 0);
        _assert(!location.last().regular); // final entity must be at a singular height
        if (drag[0] < 0 && location.last().height == 0) return null;
        if (drag[0] < 0) {
            location[location.length - 1].height--; // if we're dragging down, adjust for this
            if (drag[1] != null) drag[1] = - drag[1];
        }
        try
        {
            return this.getContractionContent(location, drag[1]);
        }
        catch (e)
         {
            // Contraction not possible, report reason to the console
            if (typeof e == 'string') console.log(e);
            else throw e;
        }
        return [];
    }

    // Contract the given height with the one above
    contract(height, right) {
        _assert(!isNaN(height));
        _assert(height >= 0);
        _assert(height < this.data.length - 1);
        let regular = this.getSlice({ height: height + 1, regular: true });
        let D1 = this.getSlice({ height, regular: false });
        let D2 = this.getSlice({ height: height + 1, regular: false });
        let L1 = this.data[height].backward_limit;
        let L2 = this.data[height + 1].forward_limit;
        return regular.unify({ D1, D2, L1, L2, right });
    }

    // Define pushout as an unbiased unification. This might never be needed, let's see.
    pushout({ D1, D2, L1, L2, depth }) {
        if (depth == null) depth = 0;
        return this.unify({ D1, D2, L1, L2, depth }); // right is implicitly null
    }

    // Unify two diagrams, at given recursive depth, with a given tendency to the right
    unify({ D1, D2, L1, L2, right, depth }) {
        _assert(right == null || (typeof (right) == 'boolean'));
        _assert(D1 instanceof Diagram);
        _assert(D2 instanceof Diagram);
        if (L1 instanceof ForwardLimit) L1 = L1.getBackwardLimit(this, D1); // correct L1 if necessary
        if (L2 instanceof BackwardLimit) L2 = L2.getForwardLimit(this, D2); // correct L2 if necessary
        _assert(L1 instanceof BackwardLimit);
        _assert(L2 instanceof ForwardLimit);
        _assert(this.n == D1.n);
        _assert(this.n == D2.n);
        if (depth == null) depth = 0;

        // Handle the base case, where we only allow unifications given a matching triangle of types
        if (this.n == 0) {
            _assert(D1.type instanceof Generator && D2.type instanceof Generator);
            let I1, I2, T;
            if (D1.type == this.type) {
                T = D2.copy(); I1 = L2.copy(); I2 = new BackwardLimit(0, []);
                console.log("Unification base case this==D1");
            }
            else if (this.type == D2.type) {
                T = D1.copy(); I2 = L1.copy(); I1 = new ForwardLimit(0, []);
                console.log("Unification base case this==D2");
            }
            else if (D1.type == D2.type) {
                if (L1.framing != L2.framing) throw "No unification at codimension " + depth + ": base case, inconsistent framings";
                T = D1.copy(); I1 = new ForwardLimit(0, []); I2 = new BackwardLimit(0, []);
                console.log("Unification base case D1==D2, this.t==" + this.t + ", this.type.n==" + this.type.n + ", D1.t==" + D1.t + ", D1.type.n=" + D1.type.n + ", depth=" + depth);
            } else throw "No unification at codimension " + depth + ": base case, all types distinct";
            _assert(T instanceof Diagram && I1 instanceof ForwardLimit && I2 instanceof BackwardLimit);
            return { T, I1, I2 };
        }

        // Get the unification of the singular monotones
        let L1m = L1.getMonotone(this.data.length, D1.data.length);
        let L2m = L2.getMonotone(this.data.length, D2.data.length);
        let m_unif = L1m.unify({ second: L2m, right });
        let I1m = m_unif.first;
        let I2m = m_unif.second;
        let target_size = m_unif.first.target_size;

        // Get component data from each target slice
        let I1_content = [];
        let I2_content = [];
        let T_content = [];
        for (let h = 0; h < target_size; h++) {
            let c = this.unifyComponent({ D1, D2, L1, L2, right, depth }, h, { L1m, L2m, I1m, I2m });
            T_content.push(c.T_content);
            if (c.I1_content) I1_content.push(c.I1_content);
            if (c.I2_content) I2_content.push(c.I2_content);
        }

        // Construct and return the necessary objects
        let T = new Diagram(this.n, { t: this.t, n: this.n, source: this.source.copy(), data: T_content });
        let I1 = new ForwardLimit(this.n, I1_content);
        let I2 = new BackwardLimit(this.n, I2_content);
        return { T, I1, I2 };
        
        /*

        // Get the unification of the singular monotones
        let M1 = L1.getMonotone(this.data.length, D1.data.length);
        let M2 = L2.getMonotone(this.data.length, D2.data.length);
        let m_unif = M1.unify({ second: M2, right });

        // Get the unifications on all the singular slices
        let slice_unifications = [];
        for (let i = 0; i < this.data.length; i++) {
            let main_slice = this.getSlice({ height: i, regular: false });
            let d1_slice = D1.getSlice({ height: M1[i], regular: false });
            let d2_slice = D2.getSlice({ height: M2[i], regular: false });
            let l1_sublimit = L1.subLimit(i);
            let l2_sublimit = L2.subLimit(i);
            let slice_unification = main_slice.unify({ D1: d1_slice, D2: d2_slice, L1: l1_sublimit, L2: l2_sublimit, depth: depth + 1, right });
            if (!slice_unification) {
                console.log("No unification at codimension " + depth + ": singular slice " + i + " has no unification");
                return null; // if any of the slice unifications can't be formed, then fail
            }
            slice_unifications.push(slice_unification);
        }

        let new_left_limits = [];
        let new_right_limits = [];
        let target_slices = [];
        for (let i = 0; i < slice_unifications.length; i++) {
            let advance_1 = (i == 0) || M1[i] > M1[i - 1];
            let advance_2 = (i == 0) || M2[i] > M2[i - 1];
            if (advance_1 && advance_2) {
                new_left_limits[M1[i]] = slice_unifications[i].I1;
                new_right_limits[M2[i]] = slice_unifications[i].I2;
                target_slices[m_unif.first[M1[i]]] = slice_unifications[i].T;
            }
            else if (!advance_1 && !advance_2) {
                let problem = false;
                if (!slice_unifications[i].T.equals(slice_unifications[i - 1].T)) problem = true;
                if (!slice_unifications[i].I1.equals(slice_unifications[i - 1].I1)) problem = true;
                if (!slice_unifications[i].I2.equals(slice_unifications[i - 1].I2)) problem = true;
                if (problem) {
                    console.log("No unification at codimension " + depth + ": inconsistent slice unifications");
                    return null;
                }
            }
            if (advance_1 && !advance_2) {
                let limit_1 = new_right_limits[M2[i]];
                _assert(limit_1);
                let target_1 = target_slices.last();
                let limit_2 = slice_unifications[i].I2;
                let target_2 = slice_unifications[i].T;
                let source = D2.getSlice({ height: M2[i], regular: false });
                let pushout = source.unify({ D1: target_1, D2: target_2, L1: limit_1, L2: limit_2, depth: depth + 1, right });
                if (!pushout) {
                    console.log("No unification at codimension " + depth + ": right slice incremental unification failure");
                    return null;
                }
                // Update the stored left limits by postcomposition with I1
                let preimage = M2.preimage(M2[i]);
                for (let j = M1[preimage.first]; j < M1[i]; j++) {
                    new_left_limits[j] = pushout.I1.compose(new_left_limits[j]);
                }
                // Store the new left limit
                pushout.I2_forward = pushout.I2.getForwardLimit(slice_unifications[i].T, pushout.T);
                new_left_limits.push(pushout.I2_forward.compose(slice_unifications[i].I1));
                // Update the stored target
                target_slices[target_slices.length - 1] = pushout.T;
                // Update the stored right limit
                new_right_limits[new_right_limits.length - 1] = pushout.I2.compose(slice_unifications[i].I2);
            } else if (!advance_1 && advance_2) {
                let limit_2 = new_left_limits[M1[i]];
                _assert(limit_2);
                let target_2 = target_slices.last();
                let limit_1 = slice_unifications[i].I1;
                let target_1 = slice_unifications[i].T;
                let source = D1.getSlice({ height: M1[i], regular: false });
                let pushout = source.unify({ D1: target_1, D2: target_2, L1: limit_1, L2: limit_2, depth: depth + 1, right });
                if (!pushout) {
                    console.log("No unification at codimension " + depth + ": left slice incremental unification failure");
                    return null;
                }
                // Update the stored right limits by postcomposition with I1
                let preimage = M1.preimage(M1[i]);
                for (let j = M2[preimage.first]; j < M2[i]; j++) {
                    new_right_limits[j] = pushout.I2.compose(new_right_limits[j]);
                }
                // Store the new right limit
                pushout.I1_backward = pushout.I1.getBackwardLimit(slice_unifications[i].T, pushout.T);
                new_right_limits.push(pushout.I1_backward.compose(slice_unifications[i].I2));
                // Update the stored target
                target_slices[target_slices.length - 1] = pushout.T;
                // Update the stored left limit
                new_left_limits[new_left_limits.length - 1] = pushout.I1.compose(slice_unifications[i].I1);
            }
        }

        // Check agreement on elements not in the image of L1 or L2
        let l1_complement = M1.imageComplement();
        let l2_complement = M2.imageComplement();
        for (let i = 0; i < l1_complement.length; i++) {
            let d1_level = l1_complement[i];
            let d1_slice = D1.getSlice({ height: d1_level, regular: false });
            if (target_slices[m_unif.first[d1_level]] == null) {
                //target_slices[unification.first[i]] = d1_slice.copy();
            } else if (!d1_slice.equals(target_slices[m_unif.first[d1_level]])) {
                console.log("No unification at codimension " + depth + ": D1 index " + i + " is not in the image and has a conflicting unification diagram");
                return null;
            }
        }
        for (let i = 0; i < l2_complement.length; i++) {
            let d2_level = l2_complement[i];
            let d2_slice = D2.getSlice({ height: d2_level, regular: false });
            if (target_slices[m_unif.second[d2_level]] == null) {
                //target_slices[unification.second[i]] = d1_slice.copy();
            }
            else if (!d2_slice.equals(target_slices[m_unif.second[d2_level]])) {
                console.log("No unification at codimension " + depth + ": D2 index " + i + " is not in the image and has a conflicting unification diagram");
                return null;
            }
        }

        // Build target diagram
        let data = [];
        let I1_content = [];
        let I2_content = [];
        for (let i = 0; i < m_unif.first.target_size; i++) {
            let i1_preimage = m_unif.first.preimage(i);
            let i2_preimage = m_unif.second.preimage(i);
            _assert(i1_preimage.first != null && i1_preimage.last != null && i2_preimage.first != null && i2_preimage.last != null);

            // If the target slice is not present we will add it later
            if (target_slices[i] == null) continue;

            // These checks should now always pass
            _assert(i1_preimage.last > i1_preimage.first);
            _assert(i2_preimage.last > i2_preimage.first);

            // Build content for main diagram
            let backward_limit = new_right_limits[i2_preimage.last - 1].compose(D2.data[i2_preimage.last - 1].backward_limit);
            let forward_limit = new_left_limits[i1_preimage.first].compose(D1.data[i1_preimage.first].forward_limit);
            let new_content = new Content(this.n - 1, forward_limit, backward_limit);
            data[i] = new_content;
            //data.push(new_content);

            // Build the forward limit component
            let I1_component_args = { first: i1_preimage.first, last: i1_preimage.last, data: [new_content.copy()], sublimits: [] };
            let I1_trivial = true;
            for (let j = i1_preimage.first; j < i1_preimage.last; j++) {
                let limit = new_left_limits[j];
                if (limit.length > 0) I1_trivial = false;
                I1_component_args.sublimits.push(limit);
            }
            if (!I1_trivial) I1_content.push(new LimitComponent(this.n, I1_component_args));

            // Build the backward limit component
            let I2_component_args = { first: i2_preimage.first, last: i2_preimage.last, data: [], sublimits: [] };
            let I2_trivial = true;
            for (let j = i2_preimage.first; j < i2_preimage.last; j++) {
                let limit = new_right_limits[j];
                if (limit.length > 0) I2_trivial = false;
                I2_component_args.sublimits.push(limit);
                I2_component_args.data.push(D2.data[j].copy());

            }
            if (!I2_trivial) I2_content.push(new LimitComponent(this.n, I2_component_args));
        }

        // Insert additional levels induced by non-surjectivity of L1 or L2.
        // These need inserting into T, I1, I2.
        let l2_index = 0;
        let l1_index = 0;
        while (l1_index < l1_complement.length || l2_index < l2_complement.length) {
            let l1_position = l1_complement[l1_index];
            let l2_position = l2_complement[l2_index];
            let use_left;
            if (l1_position == null && l2_position == null) _assert(false);
            else if (l1_position == null) use_left = false;
            else if (l2_position == null) use_left = true;
            else use_left = (m_unif.first[l1_position] < m_unif.second[l2_position]);
            let insert_position = use_left ? m_unif.first[l1_position] : m_unif.second[l2_position];
            let insert_data = use_left ? D1.data[l1_position] : D2.data[l2_position];
            _assert(!isNaN(insert_position));
            _assert(insert_data);
            //data.splice(insert_position, 0, insert_data);
            _assert(data[insert_position] == null);
            data[insert_position] = insert_data;
            if (use_left) {
                let firstlast = m_unif.second.preimage(insert_position);
                _assert(firstlast.first == firstlast.last);
                let new_content = { first: firstlast.first, last: firstlast.last, data: [], sublimits: [] };
                let i = 0;
                for (; i < I2_content.length; i++) {
                    if (I2_content[i].last > new_content.last) break;
                }
                I2_content.splice(i, 0, new LimitComponent(this.n, new_content));
                l1_index++;
            } else {
                let firstlast = m_unif.first.preimage(insert_position);
                _assert(firstlast.first == firstlast.last);
                let new_content = { first: firstlast.first, last: firstlast.last, data: [insert_data.copy()], sublimits: [] };
                let i = 0;
                for (; i < I1_content.length; i++) {
                    if (I1_content[i].last > new_content.last) break;
                }
                I1_content.splice(i, 0, new LimitComponent(this.n, new_content));
                l2_index++;
            }
        }

        // Construct and return the necessary objects
        let T = new Diagram(this.n, { t: this.t, n: this.n, source: this.source.copy(), data });
        let I1 = new ForwardLimit(this.n, I1_content);
        let I2 = new BackwardLimit(this.n, I2_content);
        return { T, I1, I2 };

        */
    }

    // Compute one component of the given unification, given by the preimage at height h in the target
    unifyComponent({ D1, D2, L1, L2, right, depth }, h, { L1m, L2m, I1m, I2m }) {

        // Find which parts of this, D1 and D2 are needed for this component
        let main = this;
        let preimage_D1 = I1m.preimage(h);
        let preimage_D2 = I2m.preimage(h);
        let preimage_main = I1m.compose(L1m).preimage(h);
        let preimage_main_check = I2m.compose(L2m).preimage(h); // only used for this _assert
        _assert(preimage_main.first == preimage_main_check.first && preimage_main.last == preimage_main_check.last);

        // Handle the trivial case where there is no relevant data in the main digram
        if (preimage_main.first == preimage_main.last) {
            // Must have nontrivial content on exactly one side. 2018-ANC-32
            _assert((preimage_D1.first == preimage_D1.last) != (preimage_D2.first == preimage_D2.last));
            if (preimage_D1.first != preimage_D1.last) { // Nontrivial content is on the left
                let I2_content = new LimitComponent(this.n, { first: preimage_D2.first, last: preimage_D2.last, data: [], sublimits: [] });
                let T_content = D1.data[preimage_D1.first].copy();
                return { I2_content, T_content };
            }
            if (preimage_D2.first != preimage_D2.last) { // Nontrivial content is on the right
                //let diagram_content = L2[preimage_main.first].copy();
                let diagram_content = D2.data[preimage_D2.first].copy();
                let I1_content = new LimitComponent(this.n, { first: preimage_D1.first, last: preimage_D1.last, data: [diagram_content], sublimits: [] });
                let T_content = D2.data[preimage_D2.first].copy();
                return { I1_content, T_content };
            }
        }

        // Unify recursively on subslices of the main diagram
        let slice_unifications = [];
        for (let i = preimage_main.first; i < preimage_main.last; i++) {
            let main_slice = this.getSlice({ height: i, regular: false });
            let d1_slice = D1.getSlice({ height: L1m[i], regular: false });
            let d2_slice = D2.getSlice({ height: L2m[i], regular: false });
            let l1_sublimit = L1.subLimit(i);
            let l2_sublimit = L2.subLimit(i);
            let slice_unification = main_slice.unify({ D1: d1_slice, D2: d2_slice, L1: l1_sublimit, L2: l2_sublimit, depth: depth + 1, right });
            _assert(slice_unification);
            slice_unifications.push(slice_unification);
        }

        // Now iterate through all the relevant data, which could be in the left, right or main diagrams
        let index_main = preimage_main.first + 1;
        let index_D1 = preimage_D1.first + 1;
        let index_D2 = preimage_D2.first + 1;
        let left_sublimits = [slice_unifications[0].I1];
        let right_sublimits = [slice_unifications[0].I2];
        let target_diagram = slice_unifications[0].T;

        while (index_main < preimage_main.last) {
            let image_D1 = L1m[index_main];
            let image_D2 = L2m[index_main];

            // Don't let the side diagram indices overtake the main diagram indices
            index_D1 = Math.min(index_D1, image_D1);
            index_D2 = Math.min(index_D2, image_D2);

            // Sanity check: without this property we'd split into distinct components
            _assert(index_D1 == image_D1 || index_D2 == image_D2);

            // For illustration see 2018-1-ANC-33
            if (index_D1 < image_D1) { // CASE 1
                let x = D1.data[index_D1 - 1].backward_component;
                let z = D1.data[index_D1].forward_component;
                let y = left_sublimits.last();
                let d1_singular_below = D1.getSlice({ height: index_D1 - 1, regular: false });
                let y_backward = y.getBackwardLimit(d1_singular_below, target_diagram);
                let xy = y_backward.compose(x);
                let regular = D1.getSlice({ height: index_D1, regular: true });
                let d1_singular_above = D1.getSlice({ height: index_d1, regular: false });
                let unif = regular.unify({ D1: current_target, L1: xy, D2: d1_singular_above, L2: z, right, depth });

                // Update left sublimits
                for (let i = 0; i < left_sublimits.length; i++) {
                    left_sublimits[i] = unif.I1.compose(left_sublimits[i]);
                }

                // Update right sublimits
                unif.I1_backward = unif.I1.getBackwardLimit(current_target, unif.T);
                for (let i = 0; i < right_sublimits.length; i++) {
                    right_sublimits[i] = unif.I1_backward.compose(right_sublimits[i]);
                }

                // Append new left sublimit
                unif.I2_forward = unif.I2.getForwardLimit(d1_singular_above, unif.T);
                left_sublimits.push(unif.I2_forward);

                // Update target diagram
                target_diagram = unif.T;

                // Increment appropriate index
                index_D1++;
            }
            else if (index_D2 < image_D2) { // CASE 2

                let x = D2.data[index_D2 - 1].backward_component;
                let z = D2.data[index_D2].forward_component;
                let y = right_sublimits.last();
                let d2_singular_below = D2.getSlice({ height: index_D2 - 1, regular: false });
                let xy = y.compose(x);
                let regular = D2.getSlice({ height: index_D2, regular: true });
                let d2_singular_above = D2.getSlice({ height: index_d2, regular: false });
                let unif = regular.unify({ D1: current_target, L1: xy, D2: d2_singular_above, L2: z, right, depth });

                // Update left sublimits
                for (let i = 0; i < left_sublimits.length; i++) {
                    left_sublimits[i] = unif.I1.compose(left_sublimits[i]);
                }

                // Update right sublimits
                unif.I1_backward = unif.I1.getBackwardLimit(current_target, unif.T);
                for (let i = 0; i < right_sublimits.length; i++) {
                    right_sublimits[i] = unif.I1_backward.compose(right_sublimits[i]);
                }

                // Append new right sublimit
                right_sublimits.push(unif.I2);

                // Update target diagram
                target_diagram = unif.T;

                // Increment appropriate index
                index_D2++;
            } else {
                _assert(index_D1 >= image_D1 && index_D2 >= image_D2); // CASE 3, 2018-ANC-34
                let advance_1 = (L1m[index_main] > L1m[index_main - 1]);
                let advance_2 = (L2m[index_main] > L2m[index_main - 1]);
                _assert(!advance_1 || !advance_2); // if both sides were advancing, the component would have split into two
                if (!advance_1 && !advance_2) {
                    /* See 2018-1-ANC-28. Unclear what to do.
                    For now do a simple consistency check and fail, with logging,
                    if the check fails. Maybe there's some further unification that
                    could be done */
                    let err_msg = "No unification at codimension " + depth + ": inconsistent slice unifications";
                    if (!slice_unifications[index_main].T.equals(slice_unifications[index_main - 1].T)) throw err_msg;
                    if (!slice_unifications[index_main].I1.equals(slice_unifications[index_main - 1].I1)) throw err_msg;
                    if (!slice_unifications[index_main].I2.equals(slice_unifications[index_main - 1].I2)) throw err_msg;
                }
                else if (advance_1) {
                    let limit_1 = right_sublimits.last();
                    let target_1 = target_diagram;
                    let limit_2 = slice_unifications[index_main].I2;
                    let target_2 = slice_unifications[index_main].T;
                    let source = D2.getSlice({ height: image_D2, regular: false });
                    let unif = source.unify({ D1: target_1, D2: target_2, L1: limit_1, L2: limit_2, depth: depth + 1, right });

                    // Update left sublimits
                    for (let i = 0; i < left_sublimits.length; i++) {
                        left_sublimits[i] = unif.I1.compose(left_sublimits[i]);
                    }

                    // Update right sublimits
                    unif.I1_backward = unif.I1.getBackwardLimit(target_diagram, unif.T);
                    for (let i = 0; i < right_sublimits.length; i++) {
                        right_sublimits[i] = unif.I1_backward.compose(right_sublimits[i]);
                    }

                    // Store the new left limit
                    /* IS IT NECESSARY TO CHECK IF THIS NEW LEFT LIMIT SATISFIES A COMMUTATIVITY EQUATION? SEE 2018-ANC-27 */
                    unif.I2_forward = unif.I2.getForwardLimit(slice_unifications[index_main].T, unif.T);
                    left_sublimits.push(unif.I2_forward.compose(slice_unifications[index_main].I1));

                    // Update target diagram
                    target_diagram = unif.T;
                }
                else if (advance_2) {
                    let limit_1 = left_sublimits.last();
                    let target_1 = target_diagram;
                    let limit_2 = slice_unifications[index_main].I1;
                    let target_2 = slice_unifications[index_main].T;
                    let source = D1.getSlice({ height: index_D1, regular: false });
                    let unif = source.unify({ D1: target_1, D2: target_2, L1: limit_1, L2: limit_2, depth: depth + 1, right });

                    // Update left sublimits
                    for (let i = 0; i < left_sublimits.length; i++) {
                        left_sublimits[i] = unif.I1.compose(left_sublimits[i]);
                    }

                    // Update right sublimits
                    unif.I1_backward = unif.I1.getBackwardLimit(target_diagram, unif.T);
                    for (let i = 0; i < right_sublimits.length; i++) {
                        right_sublimits[i] = unif.I1_backward.compose(right_sublimits[i]);
                    }

                    // Store the new right limit
                    /* IS IT NECESSARY TO CHECK IF THIS NEW LEFT LIMIT SATISFIES A COMMUTATIVITY EQUATION? SEE 2018-ANC-27 */
                    //unif.I2_forward = unif.I2.getForwardLimit(slice_unifications[index_main].T, unif.T);
                    right_sublimits.push(unif.I2.compose(slice_unifications[index_main].I2));

                    // Update target diagram
                    target_diagram = unif.T;
                }

                index_main++;
                index_D1++;
                index_D2++;
            }
        }

        // Build Content object for target diagram. See 2017-ANC-16
        let backward_limit = right_sublimits.last().compose(D2.data[preimage_D2.last - 1].backward_limit);
        let forward_limit = left_sublimits[0].compose(D1.data[preimage_D1.first].forward_limit);
        let T_content = new Content(this.n - 1, forward_limit, backward_limit);

        // If there are any nontrivial left limit components, build the appropriate component
        let I1_content = null;
        if ((left_sublimits.length > 1) || (left_sublimits[0].length > 0)) {
            let I1_component_args = { first: preimage_D1.first, last: preimage_D1.last, data: [T_content.copy()], sublimits: left_sublimits };
            I1_content = new LimitComponent(this.n, I1_component_args);
        }

        // If there are any nontrivial right limit components, build the appropriate component
        let I2_content = null;
        if ((right_sublimits.length > 1) || (right_sublimits[0].length > 0)) {
            let I2_component_data = [];
            for (let j = preimage_D2.first; j < preimage_D2.last; j++) {
                I2_component_data.push(D2.data[j].copy());
            }
            let I2_component_args = { first: preimage_D2.first, last: preimage_D2.last, data: I2_component_data, sublimits: right_sublimits };
            I2_content = new LimitComponent(this.n, I2_component_args);
        }

        return { I1_content, I2_content, T_content };
    }

    //////////////////// NOT REVISED ////////////////////////
    /*
        Check for equality of two diagrams, recursively on their sources.
    */
    multipleInterchangerRewrite(rewrite_array) {
        if (rewrite_array === false) return false;
        for (var i = 0; i < rewrite_array.length; i++) {
            if (this.interchangerAllowed(rewrite_array[i].id, rewrite_array[i].key)) {
                this.rewrite(rewrite_array[i]);
            }
            else return false;
        }
        return true;
    }
    expandWrapper(type, x, k) {
        if (x < 0 || x >= this.cells.length) return false;
        var y = this.cells[x].key.last();
        if (this.cells[x].id === 'IntI0') y--;
        // Special code to deal with the key for IntI0
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
        this.n++;
        this.t++;
        this.initializeSliceCache();
    }
    /*
        Returns the full sizes of all the slices of the diagram
    */
    getFullDimensions() {
        if (this.n == 0) return [];
        if (this.n == 1) return this.cells.length;
        var full_dimensions = [this.source.getFullDimensions()];
        for (var i = 0; i < this.cells.length; i++) {
            full_dimensions.push(this.getSlice(i + 1).getFullDimensions());
        }
        //return [this.cells.length].concat(this.source.getFullDimensions());
        return full_dimensions;
    }
    getLengthsAtSource() {
        if (this.n == 0) return [];
        if (this.n == 1) return [this.data.length];
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
        if (path == null) return this;
        var boundary = {};
        if (typeof path == 'string') {
            boundary.type = path.last();
            boundary.depth = path.length;
        }
        else {
            boundary = path;
        }
        if (boundary.depth > 1) return this.source.getBoundary({ depth: boundary.depth - 1, type: boundary.type });
        if (boundary.type == 's') return this.getSourceBoundary();
        if (boundary.type == 't') return this.getTargetBoundary();
    }
    pullUpMinMax(top_height, bottom_height, min, max) {
        for (var i = bottom_height; i < top_height; i++) {
            var box = this.cells[i].box;
            var delta = this.target_size(i) - this.source_size(i);
            max = Math.max(max + delta, box.max.last() + delta);
            min = Math.min(min, box.min.last());
        }
        return { min, max };
    }
    // Check that the bounding boxes can slide past each other
    boundingBoxesSlideDownOnRight(lower, upper) {
        // Make sure they are adjacent in height correctly
        if (lower.max.last() != upper.min.last()) return false;
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
        _assert(location.length == this.n);
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
        if (source == null) return { min: [], max: [] };
        var box = this.getSourceBoundary().getEntireBoundingBox();
        box.min.push(0);
        box.max.push(this.cells.length);
        return box;
    }
    // Gets the bounding box for an entire slice of the diagram
    getEntireSliceBoundingBox(location) {
        if (!globular_is_array(location)) location = [location];
        else location = location.slice();
        if (location.length == 0) return this.getEntireBoundingBox();
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
            if (height < box.min.last()) return null;
            if (height > box.max.last()) return null;
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
                if (height > 0) return null;
                return this.getSourceBoundary().getLocationBoundaryBox(null, box, location);
            }
            else {
                if (height < Math.max(1, this.cells.length)) return null;
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
        if (slice.n == 0) return { min: [], max: [] };
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
        while (slice.n > 0 && slice.data.length == 0) {
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
        download_SVG_as_PNG(div.children('svg')[0], { sx: 0, sy: 0, sWidth: 10, sHeight: 10, logical_width: 10, logical_height: b.top - b.bottom }, filename);
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
    //    if (!sub_limit(this.data[height].forward_limit, subdata.forward_limit, offset)) return false;
    //    if (!sub_limit(this.data[height].backward_limit, subdata.backward_limit, offset)) return false;
    if (!sub_limit(data.forward_limit, subdata.forward_limit, offset)) return false;
    if (!sub_limit(data.backward_limit, subdata.backward_limit, offset)) return false;
    return true;
}


// Check if a forward limit contains all the content of another
function sub_limit(limit, sublimit, offset) {
    _assert(limit.n == sublimit.n);
    if (limit.length != sublimit.length) return false; // number of components must be the same
    for (let i = 0; i < limit.length; i++) {
        if (!sub_limit_component(limit[i], sublimit[i], offset)) return false;
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
    return true;
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
