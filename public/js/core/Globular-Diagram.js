"use strict";

class Diagram {
    constructor(n, args) {
        this['_t'] = 'Diagram';
        _assert(isNatural(n));
        this.n = n;
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
    validate() {
        return true;
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
    getSlice(location, depth) {
        if (depth == undefined) depth = 0;
        _assert(depth < 100);
        if (globular_is_array(location)) location = location.slice();
        else location = [location];
        if (location.length == 0) return this;
        _assert(!isNaN(location[0].height));
        _assert(location[0].regular != undefined);
        if (!this.source) return null;
        // Recursive case
        let pos = location.shift();
        if (location.length > 0) return this.getSlice(pos, depth + 1).getSlice(location, depth + 1); // no need to copy slice
        // Handle request for slice 1 of identity diagram gracefully
        if (pos.height == 1 && pos.regular && this.data.length == 0) return this.source;
        _assert((pos.regular && pos.height <= this.data.length) || (!pos.regular && pos.height < this.data.length));
        _assert(pos.height <= this.data.length);
        _assert(pos.height >= 0);
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
            let singular = this.getSlice({ height: pos.height - 1, regular: false }, depth + 1).copy();
            return this.data[pos.height - 1].backward_limit.rewrite(singular);
        } else {
            let regular = this.getSlice({ height: pos.height, regular: true }, depth + 1).copy();
            return this.data[pos.height].forward_limit.rewrite(regular);
        }
        /*
        var regular = pos.height == 0 ? this.source.copy() : this.getSlice({ height: pos.height - 1, regular: true }).copy().rewrite(this.data[pos.height - 1]);
        if (pos.regular) return regular;
        let singular = this.data[pos.height].forward_limit.rewrite(regular);
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
    getLastPoint() {
        var d = this;
        if (this.n == 0) return this;
        while (d.data.length == 0) {
            d = d.source;
            if (d.n == 0) return d;
        }
        _assert(d.data != null);
        let k = d.data.length - 1;
        while (d > 0 && d.data[k].forward_limit.length + d.data[k].backward_limit.length == 0) d--;
        return d.getSlice({ height: k, regular: false }).getLastPoint();
        //return d.getSlice({ height: d.data.length - 1, regular: false }).getLastPoint();
        //return d.data.last().getLastPoint();
    }

    // Get the 0-diagram of 'leftmost action' at the given height (ANC-2018-2-2)
    getActionType(height) {
        if (this.n == 0) return this.type;
        if (this.data.length == 0) return this.source.getActionType(0);
        if (this.n == 1) {
            if (height == null) {
                let t = 0;
                let max_dim = -1;
                for (let i = 0; i < this.data.length; i++) {
                    let type = this.data[i].forward_limit[0].type;
                    if (type.n > max_dim) {
                        max_dim = type.n;
                        t = i;
                    }
                }
                return this.getSlice({ height: t, regular: false }).type;
            } else {
                return this.getSlice({ height, regular: false }).type;
            }
        }
        let forward_targets = this.data[height].forward_limit.getComponentTargets();
        let backward_targets = this.data[height].backward_limit.getComponentTargets();
        if (forward_targets.length + backward_targets.length == 0) {
            return this.source.getActionType(0);
        }
        let t;
        if (forward_targets.length == 0 || backward_targets.length == 0) {
            t = forward_targets.length == 0 ? backward_targets[0] : forward_targets[0];
        } else {
            t = Math.min(forward_targets[0], backward_targets[0]);
        }
        return this.getSlice({ height: height, regular: false }).getActionType(t);
    }
    // Find the colour of the first cell that appears in the diagram
    getLastColour() {
        return gProject.getColour(this.getActionType(0));
        //return gProject.getColour(this.getLastPoint());
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
        let source_first_limit = this.source.contractForwardLimit(type, slice_position, subdiagram.source, framing);
        let singular = source_first_limit.rewrite(this.source.copy());
        //let source_backward_limit = this.getTargetBoundary().contractBackwardLimit(type);
        /*
        let source_backward_limit = this
            .getSlice({ height: position[0] + subdiagram.data.length, regular: true })
            .contractBackwardLimit(type, slice_position, subdiagram.getTargetBoundary(), framing); // only contractBackwardLimit call, can we avoid?
        */
        let target = this.getSlice({ height: position[0] + subdiagram.data.length, regular: true });
        let source_second_limit_forward = target.contractForwardLimit(type, slice_position, subdiagram.getTargetBoundary(), !framing);
        let source_second_limit_backward = source_second_limit_forward.getBackwardLimit(target, singular);

        let data = [new Content(this.n - 1, source_first_limit, source_second_limit_backward)];
        let first = position[0];
        let last = position[0] + subdiagram.data.length;
        let forward_limit_component = new LimitComponent(this.n, { first, last, data, sublimits });
        let forward_limit = new ForwardLimit(this.n, [forward_limit_component], null);
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
        let backward_limit = new BackwardLimit(this.n, [backward_limit_component], null);
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

    // Interpret a user interaction
    interaction(data, boundary_type, expand) {

        // If there are no directions, the user is trying to attach a generator
        if (data.directions == null) return this.click(data, boundary_type);

        try {
            if (expand) return [this.expand(data)];
            else return [this.contract(data)];
            //return [this.homotopy(data.coordinates, data.directions, shift)];
        } catch (e) {
            let prefix = expand ? "Expansion unsuccessful: " : "Contraction unsuccessful: ";
            if (typeof e == 'string') console.log(prefix + e);
            else throw e;
            return [];
        }
    }

    // Produce the Content object that contracts a diagram
    contract(data) {
        let location = data.coordinates;
        let drag = data.directions;
        _assert(!data.coordinates.last().regular); // final entity must be at a singular height
        let slice = this.getSlice(data.coordinates.slice(0, location.length - 1)); // last coordinate is irrelevant
        if (drag[0] < 0 && location.last().height == 0) throw "can't perform homotopy off the bottom of the diagram";
        _assert(location.last().height < slice.data.length);
        if (drag[0] > 0 && location.last().height == slice.data.length - 1) throw "can't perform homotopy off the top of the diagram";
        if (drag[0] < 0) {
            location[location.length - 1].height--; // if we're dragging down, adjust for this
            if (drag[1] != null) drag[1] = - drag[1];
        }
        let right = drag[1];
        let forward_limit = this.getContractionLimit(location, right);
        //let target = forward_limit.rewrite(this.copy());
        let backward_limit = new BackwardLimit(this.n, []);
        console.log("Contraction successful");
        return new Content(this.n, forward_limit, backward_limit);
    }

    // Produce the Content object that contracts a diagram
    expand(data) {
        //throw "not yet implemented";
        let backward_limit = this.getExpansionLimit(data.coordinates, data.directions[0] == 1);
        let forward_limit = new ForwardLimit(this.n, []);
        console.log("Expansion successful");
        return new Content(this.n, forward_limit, backward_limit);
    }

    // Recursive procedure constructing a BackwardsLimit object that expands a diagram at a given position
    getExpansionLimit(location, up) {
        _assert(location instanceof Array);
        _assert(location.length >= 2); // Expansion requires at least 2 coordinates
        if (location.length == 2) {
            // Expansion base case
            _assert(!location[0].regular && !location[1].regular); // both coordinates must be singular
            if (up) {
                let r1 = this.getSlice({ height: location[0].height, regular: true });
                let r2 = this.getSlice({ height: location[0].height + 1, regular: true });
                let s = this.getSlice({ height: location[0].height, regular: false });
                let expansion = this.data[location[0].height].getExpansionData(location[1].height, r1, r2, s);
                let component = new LimitComponent(this.n, { data: expansion.data, sublimits: expansion.sublimits, first: location[0].height, last: location[0].height + 2 });
                return new BackwardLimit(this.n, [component]);
            } else {
                let r1 = this.getSlice({ height: location[0].height, regular: true });
                let r2 = this.getSlice({ height: location[0].height + 1, regular: true });
                let s = this.getSlice({ height: location[0].height, regular: false });
                let content = this.data[location[0].height];
                let reverse_content = content.reverse(r1);
                let reverse_expansion = reverse_content.getExpansionData(location[1].height, r2, r1, s);
                let data_0_rev = reverse_expansion.data[0].reverse(r2);

                let new_regular_slice = reverse_expansion.data[0].rewrite(r2.copy());
                let data_1_rev = reverse_expansion.data[1].reverse(new_regular_slice);
                let data = [data_1_rev, data_0_rev];

                let sublimits = reverse_expansion.sublimits.reverse();
                let component = new LimitComponent(this.n, { data, sublimits, first: location[0].height, last: location[0].height + 2 });
                return new BackwardLimit(this.n, [component]);
            }
        } else if (location[0].regular) {
            throw "cannot perform expansion on regular slice"
        } else {
            throw "not yet implemented recursive expansion on singular slices";
        }
    }

    // Recursive procedure that constructs a limit contracting a diagram at a given position
    getContractionLimit_old(location, right) {
        _assert(location instanceof Array);
        _assert(location.length >= 1); // Contraction requires at least 1 coordinate
        let height = location[0].height;
        _assert(!isNaN(height));
        if (location.length == 1) {
            // Contraction base case
            _assert(!location[0].regular); // The UI should never trigger contraction frrom a regular slice
            _assert(height >= 0);
            _assert(height < this.data.length - 1);
            let regular = this.getSlice({ height: height + 1, regular: true });
            let D1 = this.getSlice({ height, regular: false });
            let D2 = this.getSlice({ height: height + 1, regular: false });
            let L1 = this.data[height].backward_limit;
            let L2 = this.data[height + 1].forward_limit;

            let contract_data = regular.unify({ D1, D2, L1, L2, right: right == 1 });

            // Build the limit to the contracted diagram
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
            // Recursive case
            let slice = this.getSlice(location[0]);
            let recursive = slice.getContractionLimit(location.slice(1), right);
            let recursive_target = recursive.rewrite(slice.copy())
            let recursive_backward = recursive.getBackwardLimit(slice, recursive_target);
            if (location[0].regular) {
                // Contraction recursive case on regular slice: insert bubble.
                let data = [new Content(this.n - 1, recursive, recursive_backward)];
                let sublimits = [];
                let component = new LimitComponent(this.n, { data, first: height, last: height, sublimits });
                return new ForwardLimit(this.n, [component]);
            } else {
                // Contraction recursive case on singular slice: postcompose.
                let forward_first = this.data[height].forward_limit;
                let forward_second = recursive;
                let backward_first = this.data[height].backward_limit;
                let backward_second = recursive_backward;
                let new_forward = forward_second.compose(forward_first);
                let new_backward = backward_second.compose(backward_first);
                let data = [new Content(this.n - 1, new_forward, new_backward)];
                let component = new LimitComponent(this.n, { data, first: height, last: height + 1, sublimits: [recursive] });
                return new ForwardLimit(this.n, [component]);
            }
        }
        _assert(false);
    }

    // Recursive procedure that constructs a limit contracting a diagram at a given position
    getContractionLimit(location, right) {
        _assert(location instanceof Array);
        _assert(location.length >= 1); // Contraction requires at least 1 coordinate
        let height = location[0].height;
        _assert(!isNaN(height));
        if (location.length == 1) {
            // Contraction base case
            _assert(!location[0].regular); // The UI should never trigger contraction from a regular slice
            _assert(height >= 0);
            _assert(height < this.data.length - 1);
            let regular = this.getSlice({ height: height + 1, regular: true });
            let D1 = this.getSlice({ height, regular: false });
            let D2 = this.getSlice({ height: height + 1, regular: false });
            let L1 = this.data[height].backward_limit;
            let L1_forward = L1.getForwardLimit(regular, D1);
            let L2 = this.data[height + 1].forward_limit;

            let upper = [D1, D2];
            let lower = [{
                diagram: regular,
                left_index: 0,
                right_index: 1,
                left_limit: L1,
                right_limit: L2
            }];
            let contract_data = Diagram.multiUnify({ lower, upper });

            // Build the limit to the contracted diagram
            let first = location[0].height;
            let last = first + 2;
            let n = this.n;
            let sublimits = contract_data.limits;
            let data_forward = sublimits[0].compose(this.data[height].forward_limit);
            let cocone1_backward = sublimits[1].getBackwardLimit(upper[1], contract_data.target);
            let data_backward = cocone1_backward.compose(this.data[height + 1].backward_limit);
            let data = [new Content(this.n - 1, data_forward, data_backward)];
            let forward_component = new LimitComponent(this.n, { first, last, data, sublimits });
            return new ForwardLimit(n, [forward_component]);
        }
        else if (location.length > 1) {
            // Recursive case
            let slice = this.getSlice(location[0]);
            let recursive = slice.getContractionLimit(location.slice(1), right);
            let recursive_target = recursive.rewrite(slice.copy())
            let recursive_backward = recursive.getBackwardLimit(slice, recursive_target);
            if (location[0].regular) {
                // Contraction recursive case on regular slice: insert bubble.
                let data = [new Content(this.n - 1, recursive, recursive_backward)];
                let sublimits = [];
                let component = new LimitComponent(this.n, { data, first: height, last: height, sublimits });
                return new ForwardLimit(this.n, [component]);
            } else {
                // Contraction recursive case on singular slice: postcompose.
                let forward_first = this.data[height].forward_limit;
                let forward_second = recursive;
                let backward_first = this.data[height].backward_limit;
                let backward_second = recursive_backward;
                let new_forward = forward_second.compose(forward_first);
                let new_backward = backward_second.compose(backward_first);
                let data = [new Content(this.n - 1, new_forward, new_backward)];
                let component = new LimitComponent(this.n, { data, first: height, last: height + 1, sublimits: [recursive] });
                return new ForwardLimit(this.n, [component]);
            }
        }
        _assert(false);
    }

    // User has clicked on the diagram
    click(data, boundary_type) {

        var cells = gProject.signature.getNCells(this.n + 1);
        if (this.n == 0) data.coordinates = [];
        //var click_box = this.getLocationBoundingBox(drag.coordinates);
        let click = data.coordinates;

        var results = [];
        for (var i = 0; i < cells.length; i++) {
            results = results.concat(this.getLocalMatches(click, cells[i], boundary_type == 's' ? true : false))
        }
        return results;
    };

    // Unify two diagrams, at given recursive depth, with a given tendency to the right
    unify({ D1, D2, L1, L2, right, depth, fibre }) {
        _assert(fibre == null || _propertylist(fibre, ['L1F1', 'L1F2', 'L2F1', 'L2F2', 'F1', 'F2']));
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

        // Base case
        if (this.n == 0) {
            _assert(D1.type instanceof Generator && D2.type instanceof Generator);
            let I1, I2, T;
            if (D1.type == this.type)[I1, I2, T] = [L2.copy(), new BackwardLimit(0, [], null, 0), D2.copy()];
            else if (this.type == D2.type)[I1, I2, T] = [new ForwardLimit(0, [], null, 0), L1.copy(), D1.copy()];
            else if (D1.type != D2.type) throw "no unification at codimension " + depth + ", base case has all types distinct";
            else if (L1.framing != L2.framing) throw "no unification at codimension " + depth + ", base case has inconsistent framings";
            else[I1, I2, T] = [new ForwardLimit(0, [], null, 0), new BackwardLimit(0, [], null, 0), D1.copy()];
            _assert(T instanceof Diagram && I1 instanceof ForwardLimit && I2 instanceof BackwardLimit);
            return { T, I1, I2 };
        }

        // Get the monotones for the fibre maps
        let L1F1M, L1F2M, L2F1M, L2F2M;
        if (fibre) {
            L1F1M = fibre.L1F1.getMonotone(D1.data.length, F1.data.length);
            L1F2M = fibre.L1F2.getMonotone(D1.data.length, F2.data.length);
            L2F1M = fibre.L2F1.getMonotone(D2.data.length, F1.data.length);
            L2F2M = fibre.L2F2.getMonotone(D2.data.length, F2.data.length);
        }

        // Get the unification of the singular monotones
        let L1m = L1.getMonotone(this.data.length, D1.data.length);
        let L2m = L2.getMonotone(this.data.length, D2.data.length);
        let m_unif = L1m.unify({ second: L2m, right, fibre: fibre ? { L1F1M, L1F2M, L2F1M, L2F2M } : null });
        let I1m = m_unif.first;
        let I2m = m_unif.second;
        let target_size = m_unif.first.target_size;

        // Get component data from each target slice
        let I1_content = [];
        let I2_content = [];
        let T_content = [];
        for (let h = 0; h < target_size; h++) {
            let c = this.unifyComponent({ D1, D2, L1, L2, right, fibre, depth }, h, { L1m, L2m, I1m, I2m });
            T_content.push(c.T_content);
            if (c.I1_content) I1_content.push(c.I1_content);
            if (c.I2_content) I2_content.push(c.I2_content);
        }

        // Construct and return the necessary objects
        let T = new Diagram(this.n, { t: this.t, n: this.n, source: this.source.copy(), data: T_content });
        let I1 = new ForwardLimit(this.n, I1_content);
        let I2 = new BackwardLimit(this.n, I2_content);
        return { T, I1, I2 };
    }

    // Compute a simultaneous unification of monotones
    static multiUnify({ lower, upper, depth }) {

        let n = upper[0].n;
        for (let i = 0; i < upper.length; i++) {
            _assert(upper[i] instanceof Diagram);
            _assert(upper[i].n == n);
        }

        for (let i = 0; i < lower.length; i++) {
            _propertylist(lower[i], ['left_index', 'left_limit', 'right_index', 'right_limit', 'diagram']);
            _assert(lower[i].diagram instanceof Diagram && lower[i].left_limit instanceof BackwardLimit && lower[i].right_limit instanceof ForwardLimit);
            _assert(isNatural(lower[i].left_index) && isNatural(lower[i].right_index));
            _assert(lower[i].left_index < upper.length && lower[i].right_index < upper.length);
            _assert(lower[i].diagram.n == n && lower[i].left_limit.n == n && lower[i].right_limit.n == n);
        }

        _assert(depth == null || isNatural(depth));
        _assert(upper.length > 0); // doesn't make sense to pushout no families (?)

        // Base case
        if (n == 0) {

            // Tabulate the top-dimensional types that appear
            let top_types = [];
            for (let i = 0; i < upper.length; i++) Diagram.updateTopTypes(top_types, upper[i].type);
            for (let i = 0; i < lower.length; i++) Diagram.updateTopTypes(top_types, lower[i].diagram.type);

            // If there's more than one top-dimensional type, throw an error
            _assert(top_types.length > 0);
            if (top_types.length > 1) throw "no unification, multiple top types in base case";
            let type = top_types[0];

            // We must be approaching the top type with a consistent framing
            let framing = null;
            for (let i = 0; i < lower.length; i++) {
                let l = lower[i];
                if (upper[l.left_index].type == type && l.diagram.type != type) {
                    _assert(l.left_limit.framing != null);
                    if (framing == null) framing = l.left_limit.framing;
                    if (framing != l.left_limit.framing) throw "no unification, base case has inconsistent framings";
                }
                if (upper[l.right_index].type == type && l.diagram.type != type) {
                    _assert(l.right_limit.framing != null);
                    if (framing == null) framing = l.right_limit.framing;
                    if (framing != l.right_limit.framing) throw "no unification, base case has inconsistent framings";
                }
            }

            // Build the cocone maps
            let limits = [];
            for (let i = 0; i < upper.length; i++) {
                if (upper[i].type == type) limits.push(new ForwardLimit(0, []));
                else {
                    _assert(framing != null);
                    limits.push(new ForwardLimit(0, [new LimitComponent(0, { type })], framing));
                }
            }

            // Check the cocone property
            for (let i=0; i<lower.length; i++) {
                let left_forward = lower[i].left_limit.getForwardLimit(lower[i].diagram, upper[lower[i].left_index]);
                let left_path = limits[lower[i].left_index].compose(left_forward);
                let right_path = limits[lower[i].right_index].compose(lower[i].right_limit);
                if (!left_path.equals(right_path)) throw "no unification, base case has no unification"; // can this happen?
            }

            // Return the final data
            let target = new Diagram(0, { type });
            return { limits, target };

            /*

            // For each lower point, then appending the unique top type, it must fit one of these patterns:
            //  - 

            // All framings if present must be consistent
            let framing = null;
            for (let i = 0; i < lower.length; i++) {
                let ll = lower[i].left_limit;
                let rl = lower[i].right_limit;
                if (framing == null) framing = (ll.framing == null ? rl.framing : ll.framing);
                if (framing != null && ll.framing != null && framing != ll.framing) throw "no unification, base case has inconsistent framings";
                if (framing != null && rl.framing != null && framing != rl.framing) throw "no unification, base case has inconsistent framings";
            }

            // Entire family of 0-diagrams must be 2-valued
            let types = { type1: null, type2: null };
            for (let i = 0; i < upper.length; i++) Diagram.updateTypes(types, upper[i].type);
            for (let i = 0; i < lower.length; i++) Diagram.updateTypes(types, lower[i].diagram.type);

            // Choose the type of the target
            let new_type = types.type2 == null ? types.type1 : types.type2;
            _assert(new_type != null);

            // Build the final data
            let limits = [];
            for (let i = 0; i < upper.length; i++) {
                let u = upper[i];
                if (u.type == new_type) limits.push(new ForwardLimit(0, []));
                else {
                    _assert(framing != null);
                    limits.push(new ForwardLimit(0, [new LimitComponent(0, { type: new_type })], framing));
                }
            }
            let target = new Diagram(0, { type: new_type });
            return { limits, target };
            */
        }

        // Get the unification of the singular monotones
        let m_upper = [];
        for (let i = 0; i < upper.length; i++) {
            m_upper[i] = upper[i].data.length;
        }
        let m_lower = [];
        for (let i = 0; i < lower.length; i++) {
            let m_left = lower[i].left_limit.getMonotone(lower[i].diagram, upper[lower[i].left_index]);
            let left = { target: lower[i].left_index, monotone: m_left };
            let m_right = lower[i].right_limit.getMonotone(lower[i].diagram, upper[lower[i].right_index]);
            let right = { target: lower[i].right_index, monotone: m_right };
            m_lower.push({ left, right });
        }
        let m_unif = Monotone.multiUnify({ lower: m_lower, upper: m_upper });

        // Find size of unification set
        let target_size = m_unif[0].target_size;

        // For each element of unification set, recursively unify
        let limit_components = [];
        for (let i = 0; i < upper.length; i++) limit_components[i] = [];
        let target_content = [];
        for (let i = 0; i < target_size; i++) {
            let component = Diagram.multiUnifyComponent({ upper, lower }, m_unif, m_lower, i);
            target_content.push(component.target_content);
            for (let j = 0; j < upper.length; j++) {
                if (!component.cocone_components[j]) continue;
                limit_components[j].push(component.cocone_components[j]);
            }
        }

        // Build final data
        let target = new Diagram(n, { source: upper[0].source.copy(), data: target_content });
        let limits = [];
        for (let i = 0; i < upper.length; i++) {
            limits.push(new ForwardLimit(n, limit_components[i]));
        }

        // Return final data
        return { limits, target };
    }

    static updateTopTypes(top_types, type) {
        if (top_types.indexOf(type) >= 0) return; // type already in list
        if (top_types.length == 0 || type.n == top_types[0].n) {
            top_types.push(type);
            return;
        }
        if (type.n < top_types[0].n) return;
        _assert(type.n > top_types[0].n);
        top_types.length = 0;
        top_types.push(type);
    }

    static updateTypes(types, type) {
        _assert(type instanceof Generator);
        _assert(types.type1 != types.type2 || (types.type1 == null && types.type2 == null));
        if (types.type1 != null && types.type2 != null) _assert(types.type1.n < types.type2.n);
        if (types.type2 != null) _assert(types.type1 != null);
        if (types.type1 == type || types.type2 == type) return;
        if (types.type1 == null) types.type1 = type;
        else if (types.type2 == null) types.type2 = type;
        else throw "inconsistent types";
        if (types.type1 != null && types.type2 != null && types.type1.n > types.type2.n) {
            [types.type1, types.type2] = [types.type2, types.type1];
        }


        /*
                if (type1.n == type2.n && type1 != type2) throw "inconsistent types A";
                if (type1 == type2) {
                    if (types.type1 == null) {
                        types.type1 = type1;
                    } else if (types.type2 == null) {
                        types.type2 = type1;
                    } else if (types.type1 != type1 && types.type2 != type1) {
                        throw "inconsistent types B";
                    }
                } else {
                    if (types.type1 == null && types.type2 == null) {
                        types.type1 = type1;
                        types.type2 = type2;
                    } else if (types.type2 == null) {
                        if (type1 != types.type1 && type2 != types.type1) {
                            throw "inconsistent types C";
                        } else if (type1 == types.type1) {
                            types.type2 = type2;
                        } else if (type2 == types.type1) {
                            types.type1 = type1;
                        } else _assert(false);
                    } else {
                        _assert(types.type1 != types.type2 && type1 != type2);
                        if (types.type1 == type1 && types.type2 == type2) {
                            // that's fine, nothing to do
                        } else if (types.type1 == type2 && types.type2 == type1) {
                            // that's fine, nothing to do
                        } else {
                            throw "inconsistent types C";
                        }
                    }
                }
        
                // Ensure any null is second, and if neither is null, that they are in dimension order
                if (types.type1 == null) [types.type1, types.type2] = [types.type2, types.type1];
                else if (types.type2 != null && types.type1.n > types.type2.n) [types.type1, types.type2] = [types.type2, types.type1];
                */
    }

    static multiUnifyComponent({ upper, lower }, m_cocone, m_lower, height) {

        // Restrict upper, lower to the appropriate heights
        let upper_preimage = [];
        let lower_preimage = [];
        let upper_ranges = [];
        let lower_ranges = [];
        for (let i = 0; i < upper.length; i++) {
            upper_ranges[i] = m_cocone[i].preimage(height);
            upper_preimage.push(upper[i].restrict(upper_ranges[i]));
        }
        for (let i = 0; i < lower.length; i++) {
            let l = lower[i];
            let left_index = l.left_index;
            let right_index = l.right_index;
            let left_limit = l.left_limit.preimage(upper_ranges[left_index]);
            let right_limit = l.right_limit.preimage(upper_ranges[right_index]);
            let left_monotone = l.left_limit.getMonotone(l.diagram.data.length, upper[l.left_index].data.length);
            let left_preimage = left_monotone.preimage(upper_ranges[l.left_index]);
            lower_ranges.push(left_preimage);
            let diagram = l.diagram.restrict(left_preimage);
            lower_preimage.push({ left_index, right_index, left_limit, right_limit, diagram });
        }
        let preimage = { upper: upper_preimage, lower: lower_preimage };

        // Explode the upper singular and regular diagrams
        let upper_exploded = [];
        let lower_exploded = [];
        let upper_slice_position = [];
        for (let i = 0; i < upper.length; i++) {
            let u = upper_preimage[i];
            let slice_positions = [];
            for (let j = 0; j < u.data.length; j++) {
                slice_positions.push(upper_exploded.length);
                upper_exploded.push(u.getSlice({ height: j, regular: false }));
                if (j == 0) continue; // one less regular level than singular level to include
                let diagram = u.getSlice({ height: j, regular: true }).copy();
                let left_limit = u.data[j - 1].backward_limit.copy();
                let right_limit = u.data[j].forward_limit.copy();
                let left_index = upper_exploded.length - 2;
                let right_index = upper_exploded.length - 1;
                lower_exploded.push({ diagram, left_limit, right_limit, left_index, right_index });
            }
            upper_slice_position.push(slice_positions);
        }

        // Extract the lower singular diagrams
        for (let i = 0; i < lower.length; i++) {
            let l = lower_preimage[i];
            for (let j = 0; j < l.diagram.data.length; j++) {
                let diagram = l.diagram.getSlice({ height: j, regular: false }).copy(); // LOTS OF THESE COPIES CAN BE AVOIDED, THINK IT THROUGH CAREFULLY
                let left_limit = l.left_limit.subLimit(j).copy();
                let right_limit = l.right_limit.subLimit(j).copy();
                let lower_offset = lower_ranges[i].first;
                let upper_right_offset = upper_ranges[l.right_index].first;
                let upper_left_offset = upper_ranges[l.left_index].first;
                let left_index = upper_slice_position[l.left_index][m_lower[i].left.monotone[j + lower_offset] - upper_left_offset];
                let right_index = upper_slice_position[l.right_index][m_lower[i].right.monotone[j + lower_offset] - upper_right_offset];
                lower_exploded.push({ diagram, left_limit, right_limit, left_index, right_index });
            }
        }
        let exploded = { upper: upper_exploded, lower: lower_exploded };
        _assert(upper_exploded.length > 0);
        let nonempty_upper = null;
        for (let i = 0; i < upper.length; i++) {
            if (upper_preimage[i].data.length > 0) {
                nonempty_upper = i;
                break;
            }
        }
        _assert(nonempty_upper != null);

        // Recursively unify
        let recursive = Diagram.multiUnify(exploded);

        // Get the content for the main diagram
        let nu = upper[nonempty_upper];
        let recursive_first = recursive.limits[upper_slice_position[nonempty_upper][0]];
        let forward = recursive_first.compose(nu.data[upper_ranges[nonempty_upper].first].forward_limit);
        let last_slice_position = upper_slice_position[nonempty_upper].last();
        let recursive_last = recursive.limits[last_slice_position];
        let recursive_last_backward = recursive_last.getBackwardLimit(upper_exploded[last_slice_position], recursive.target);
        let backward = recursive_last_backward.compose(nu.data[upper_ranges[nonempty_upper].last - 1].backward_limit);
        let target_content = new Content(nu.n, forward, backward);

        /*
        if ((left_sublimits.length > 1) || (left_sublimits[0].length > 0)) {
            let I1_component_args = { first: preimage_D1.first, last: preimage_D1.last, data: [T_content.copy()], sublimits: left_sublimits };
            I1_content = new LimitComponent(this.n, I1_component_args);
        }
        */

        // Get the cocone components as forward limits
        let cocone_components = [];
        for (let i = 0; i < upper.length; i++) {
            let first = upper_ranges[i].first;
            let last = upper_ranges[i].last;
            let sublimits = [];
            for (let j = first; j < last; j++) {
                let sublimit = recursive.limits[upper_slice_position[i][j - first]]
                sublimits.push(sublimit.copy());
            }
            if (sublimits.length == 1 && sublimits[0].length == 0) {
                cocone_components[i] = null;
            } else {
                let data = [target_content.copy()];
                cocone_components[i] = new LimitComponent(upper[0].n, { first, last, data, sublimits });
            }
        }

        return { target_content, cocone_components };

    }

    restrict(range) {
        let source = this.getSlice({ height: range.first, regular: true }).copy();
        let data = [];
        for (let i = range.first; i < range.last; i++) {
            data.push(this.data[i].copy());
        }
        let n = this.n;
        return new Diagram(n, { source, data });
    }

    // Compute one component of the given unification, given by the preimage at height h in the target
    unifyComponent({ D1, D2, L1, L2, right, depth, fibre }, h, { L1m, L2m, I1m, I2m }) {

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
            let d1_height = L1m[i];
            let d2_height = L2m[i];
            let d1_slice = D1.getSlice({ height: d1_height, regular: false });
            let d2_slice = D2.getSlice({ height: d2_height, regular: false });
            let l1_sublimit = L1.subLimit(i);
            let l2_sublimit = L2.subLimit(i);

            // Get slice fibre data
            let fibre_slice = null;
            if (fibre) {
                _assert(fibre.L1F1M[d1_height] == fibre.L2F1M[d2_height]);
                _assert(fibre.L1F2M[d1_height] == fibre.L2F2M[d2_height]);
                let f1_height = fibre.L1F1M[d1_height];
                let f2_height = fibre.L1F2M[d1_height];
                let f1_slice = F1.getSlice({ height: f1_height, regular: false });
                let f2_slice = F2.getSlice({ height: f2_height, regular: false });
                let l1f1_slice = fibre.L1F1.subLimit(d1_height);
                let l1f2_Slice = fibre.L1F2.subLimit(d1_height);
                let l2f1_slice = fibre.L2F1.subLimit(d2_height);
                let l2f2_slice = fibre.L2F2.subLimit(d2_height);
                fibre_slice = { F1: f1_slice, F2: f2_slice, L1F1: l1f1_slice, L1F2: l1f2_slice, L2F1: l2f1_slice, L2F2: l2f2_slice };
            }

            let slice_unification = main_slice.unify({ D1: d1_slice, D2: d2_slice, L1: l1_sublimit, L2: l2_sublimit, depth: depth + 1, right, fibre: fibre_slice });
            _assert(slice_unification);
            slice_unifications[i] = slice_unification;
        }

        // Now iterate through all the relevant data, which could be in the left, right or main diagrams
        let index_main = preimage_main.first + 1;
        let index_D1 = preimage_D1.first + 1;
        let index_D2 = preimage_D2.first + 1;
        let left_sublimits = [slice_unifications[preimage_main.first].I1];
        let right_sublimits = [slice_unifications[preimage_main.first].I2];
        let target_diagram = slice_unifications[preimage_main.first].T;

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
                    let err_msg = "no unification at codimension " + depth + ", inconsistent slice unifications (?)";
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

    // Find the coequalizer of two limits out of this diagram. See 2018-2-ANC-46.
    coequalize(L1, L2, target, n) {
        _assert(L1.n == this.n && L2.n == this.n && target.n == this.n);
        _assert(L1 instanceof ForwardLimit && L2 instanceof ForwardLimit);
        _assert(target instanceof Diagram);
        _assert(n == null || isNatural(n));
        if (n == null) n = this.data.length;
        let source = this;

        // Base case, return identity limit
        if (n == 0) return new ForwardLimit(this.n, []);

        // Recursive case
        let recursive = source.coequalize(L1, L2, target, n - 1);

        // Get monotone coequalizer
        let M1 = L1.getMonotone(n, target.data.length);
        let M2 = L2.getMonotone(n, source.data.length);
        let MC = Monotone.coequalize(M1, M2);

        let L1_image = M1[n - 1];
        let L2_image = M2[n - 1];
        let min = Math.min(L1_image, L2_image);
        let max = Math.max(L1_image, L2_image);

    }


    /*
        // Expand a diagram
        expand({ D1, D2, L1, L2, right, depth }) {
            _assert(right == null || (typeof (right) == 'boolean'));
            _assert(D1 instanceof Diagram && D2 instanceof Diagram);
            if (L1 instanceof BackwardLimit) L1 = L1.getForwardLimit(this, D1); // correct L1 if necessary
            if (L2 instanceof ForwardLimit) L2 = L2.getBackwardLimit(this, D2); // correct L2 if necessary
            _assert(L1 instanceof ForwardLimit && L2 instanceof BackwardLimit);
            _assert(this.n == D1.n && this.n == D2.n && this.n == L1.n && this.n == L2.n);
        }
    */


    // Construct the content that contracts a source diagram, at a given position, and inserts the target diagram
    getAttachmentContent(type, position, source, target, flip) {

        if (flip)[source, target] = [target, source];

        //if (!position) position = [].fill(0, 0, this.n);
        _assert(position.length == this.n);
        _assert(this.n == source.n);
        _assert(this.n == target.n);
        if (this.n == 0) {
            let forward_component = new LimitComponent(0, { type: type });
            let backward_component = new LimitComponent(0, { type: target.type });
            let forward_limit = new ForwardLimit(0, [forward_component], !flip);
            let backward_limit = new BackwardLimit(0, [backward_component], flip);
            return new Content(0, forward_limit, backward_limit);
        }
        let forward_limit = this.contractForwardLimit(type, position, source, !flip);
        let singular_diagram = forward_limit.rewrite(this.copy());
        let backward_limit = singular_diagram.contractBackwardLimit(type, position, target, flip);
        return new Content(this.n, forward_limit, backward_limit);
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
        _assert(false);
        return this.getSlice(location).getLastPoint();
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
