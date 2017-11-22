"use strict";

/*  Diagram class

    Diagram.source :: Diagram, the source of the diagram, possibly null
    Diagram.geometric_dimension :: Number, the recursive depth
    Diagram.type_dimension :: Number, the dimension of the signature over which it is defined
    Diagram.data :: Array(Content)
*/

/*global gProject*/

function Diagram(source, type_dimension, data) {
    this['_t'] = 'Diagram';
    this.source = source;
    this.geometric_dimension = source ? source.geometric_dimension + 1 : 0;
    this.type_dimension = type_dimension;
    _assert(this.geometric_dimension <= this.type_dimension);
    this.data = data;
};

// The type of the object
Diagram.prototype.getType = function () {
    return 'Diagram';
}

// Check if the diagram has any non-identity data up to the given height
Diagram.prototype.hasTopLevelContent = function (height) {
    if (!height) return this.hasTopLevelContent(this.height);
    if (this.data[height] != null) return true;
    if (height == 0) return false;
    return this.hasTopLevelContent(height - 1);
}

Diagram.prototype.getDimension = function() {
    return this.geometric_dimension;
}

// Returns the source boundary of the diagram
Diagram.prototype.getSourceBoundary = function () {
    return this.source;
}

// Computes the target boundary of the diagram
Diagram.prototype.getTargetBoundary = function () {
    return this.getSlice({height: this.data.length, regular: true});
}

Diagram.prototype.getSlice = function(location) {
    if (globular_is_array(location)) location = location.slice();
    else location = [location];
    if (location.length == 0) return this;
    if (this.source === null) return null;

    // Recursive case
    let pos = location.pop();
    if (location.length > 0) return this.getSlice(pos).getSlice(location); // no need to copy slice

    _assert((pos.regular && pos.height <= this.data.length) || (!pos.regular && pos.height < this.data.length));

    // Handle request for slice 1 of identity diagram gracefully
    if (pos.height == 1 && pos.regular && this.data.length == 0) {
        return this.source;
    }
    else _assert(pos.height <= this.data.length);

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

    var regular = pos.height == 0 ? this.source.copy() : this.getSlice({height: pos.height - 1, regular: true}).copy().rewrite(this.data[pos.height - 1]);
    if (pos.regular) return regular;

    let singular = this.data[pos.height].forward_limit.rewrite(regular);
    return singular;
}
/*
    if (height == 0) return this.source;
    return this.getSlice(height - 1).rewrite(this.data[height - 1]);
*/

// Return the ways that the goal (up to goal_size) fits inside this diagram (up to max_height), with match starting at the specified height
Diagram.prototype.enumerate = function (goal, goal_size, start_height, max_height) {

    if (goal_size == undefined) goal_size = goal.height;
    if (max_height == undefined) max_height = this.height;
    _assert(this.geometric_dimension == goal.geometric.dimension);
    _assert(this.type_dimension == goal.type_dimension);

    // Base case
    if (this.geometric_dimension == 0) {
        if (this.data == goal.data) return [[]]; // return a single trivial match
        return []; // return no matches
    }

    // If this diagram is too short to yield a possible match, return empty
    if (start_height == undefined && max_height < goal_size) return [];
    if (start_height != undefined && max_height < start_height + goal_size) return [];

    // The matches at least contain all the matches in the history of the diagram
    let matches = [];
    if (max_height > 1 && start_height == undefined) {
        matches = this.enumerate(goal, goal_size, start_height, height - 1);
    }

    // If goal_size == 0, we can try to find a match to a subslice
    if (goal_size == 0) {
        let slice_matches = this.getSlice(max_height).enumerate(goal.source);
        let max_height_array = [max_height];
        for (let i = 0; i < slice_matches.length; i++) {
            matches.push(max_height_array.concat(slice_matches[i]));
        }
        return matches;
    }

    // If goal_size > 0, we can try to extend a match of a smaller goal
    let new_matches = this.enumerate(goal, goal_size - 1, max_height - goal_size, max_height - 1);
    for (let i = 0; i < new_matches.size; i++) {
        var match = new_matches[i];
        if (this.sub_data(goal.data, match, max_height)) {
            matches.push(match);
        }
    }
    return matches;
};

// Check if the given subdata is present with the indicated offset
Diagram.prototype.sub_data = function (subdata, offset, height) {
    if (!sub_limit(this.data[height].forward_limit, subdata.forward_limit, offset)) return false;
    if (!sub_limit(this.data[height].reverse_limit, subdata.reverse_limit, offset)) return false;
    return true;
}

// Check if a forward limit contains another
function sub_limit(limit, sublimit, offset, max_index) {

    if (limit.length != sublimit.length) return false;
    if (max_index == undefined) max_index = limit.length - 1;

    // Check lower parts of this limit
    if (max_index > 0 && !sub_forward_limit(limit, sublimit, offset, max_index - 1)) return false;
    let a = limit[max_index];
    let b = sublimit[max_index];
    if (a.first != b.first + offset[0]) return false;
    if (a.last != b.last + offset[0]) return false;
    let offset_slice = offset.slice(1);
    if (!sub_limit(a.data, b.data, offset_slice)) return false;

    // If present, check type data
    if (a.data && !sub_limit(a.data, b.data, offset_slice)) return false;

    return true;
}

Diagram.prototype.rewrite = function (data) {

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
Diagram.prototype.copy = function () {
    if (!this.source) return new Diagram(null, this.type_dimension, this.data);
    let new_source = this.source.copy();
    let new_data = Content.copyData(this.data);
    /*
    let new_data = [];
    for (let i=0; i<this.data.length; i++) {
        new_data.push(this.data[i].copy());
    }
    */
    return new Diagram(new_source, this.type_dimension, new_data);
};
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
    for (let i=0; i<old_limit.length; i++) {
        let x = old_limit[i];
        let entry = {};
        entry.data = copy_data(x.data);
        entry.first = x.first;
        entry.last = x.last;
        entry.data = copy_limit(o.data);
    }
}

// Find the ID of the last cell that appears in the diagram
Diagram.prototype.getLastId = function () {
    var d = this;
    if (this.geometric_dimension == 0) return this.data; //{ id: this.data, dimension: this.type_dimension };
    while (d.data.length == 0) d = d.source;
    if (d.dimension == 0) return d.type; //{ id: d.type, dimension: d.type_dimension };
    _assert(d.data != null);
    return d.data.last().getLastId();
}

// Find the colour of the first cell that appears in the diagram
Diagram.prototype.getLastColour = function () {
    var id = this.getLastId();
    return gProject.getColour(id);
}


Diagram.prototype.render = function (div, highlight) {
    globular_render(div, this, highlight);
}

Diagram.prototype.prepare = function () {
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
};

// Convert an internal coordinate to {boundary: {type, depth}, coordinates}, by identifying coordinates in slices adjacent to the boundary as being in that boundary. Assumes coordinates are first-index-first.
Diagram.prototype.getBoundaryCoordinates = function (coordinates, boundaryFlags) {
    _assert(coordinates.length == this.geometric_dimension);

    if (coordinates.length == 0) return {boundary: null, coordinates: []};
    //if (!boundaryFlags) boundaryFlags = [];

    let allow_boundary = {};
    if (boundaryFlags.length == 0) {
        allow_boundary = {source: false, target: false};
    } else {
        allow_boundary = boundaryFlags[0];
    }

    /*
    if (coordinates.length == 1) {
        sub = {
            boundary: null,
            coordinates: []
        };
    } else {
    */

    var slice = this.getSlice(coordinates[0]); // no need to copy slice
    //var new_allow_boundary = params.allow_boundary.length == 0 ? [] : params.allow_boundary.slice(1);
    let sub = slice.getBoundaryCoordinates(coordinates.slice(1), boundaryFlags.slice(1));

    var in_source = allow_boundary.source /* && coordinates.length > 1*/ && coordinates[0].height == 0 && coordinates[0].regular;
    //var in_target = coordinates.length > 1 && c[0] >= Math.max(this.cells.length, fakeheight ? 1 : 0);
    var in_target = allow_boundary.target /*&& coordinates.length > 1*/ /*&& c[0] == Math.max(1, this.cells.length)*/;
    if (sub.boundary != null) {
        sub.boundary.depth++;
    } else if (in_target) {
        // We're in the target, and we were previously in the interior
        sub.boundary = {
            type: 't',
            depth: 1
        };
    } else if (in_source) {
        // We're in the source, and we were previously in the interior
        sub.boundary = {
            type: 's',
            depth: 1
        };
    } else {
        // Not in the source or the target, previously in the interior
        sub.coordinates.unshift(coordinates[0]);
    }
    return sub;
};



//////////////////// NOT YET REVISED ////////////////////////

/*
    Check for equality of two diagrams, recursively on their sources.
*/
Diagram.prototype.equals = function (d2) {
    var d1 = this;
    if (d1.getDimension() != d2.getDimension()) return false;
    if (d1.cells.length != d2.cells.length) return false;
    for (var i = 0; i < this.cells.length; i++) {
        if (!d1.cells[i].equals(d2.cells[i])) return false;
    }
    if (this.source == null) return true;
    return d1.source.equals(d2.source);
};

Diagram.prototype.multipleInterchangerRewrite = function (rewrite_array) {

    if (rewrite_array === false) {
        return false;
    }

    for (var i = 0; i < rewrite_array.length; i++) {
        if (this.interchangerAllowed(rewrite_array[i].id, rewrite_array[i].key)) {
            this.rewrite(rewrite_array[i]);
        } else {
            return false;
        }
    }
    return true;

}

Diagram.prototype.expandWrapper = function (type, x, k) {

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

// Attaches the given cell to the diagram, via the specified boundary path. 
Diagram.prototype.attach = function (cell, boundary /*, bounds*/) {

    if (boundary != null) {
        if (boundary.type == '') boundary = null;
    }

    // If the boundary is null, just rewrite the interior
    if (boundary == null) {
        this.rewrite(cell);
        return;
    }

    if (boundary.type == undefined) debugger;
    if (boundary.depth == undefined) debugger;

    // If attaching to a higher source, need to pad all other attachments
    if (boundary.depth > 1) { // attached_diagram.data.length = 0
        if (boundary.type == 's') {
            for (var i = 0; i < this.cells.length; i++) {
                this.cells[i].key[this.cells[i].key.length - boundary.depth + 1]++;
                var min = this.cells[i].box.min;
                min[min.length - boundary.depth + 1]++;
                var max = this.cells[i].box.max;
                max[max.length - boundary.depth + 1]++;
            }
        }
        this.source.attach(cell, {
            type: boundary.type,
            depth: boundary.depth - 1
        });
        // Attach to final element of the slice cache
        if (this.sliceCache != null) {
            for (var i = 0; i < this.sliceCache.length; i++) {
                if (this.sliceCache[i] == undefined) continue;
                this.sliceCache[i].attach(cell, {
                    type: boundary.type,
                    depth: boundary.depth - 1
                });
            }
        }
        //this.initializeSliceCache();
        return;
    }

    // Attach the cell
    var cell_index;
    if (boundary.type == 's') {
        var inverse_cell = this.source.getInverseCell(cell);
        this.source.rewrite(cell);
        this.cells.unshift(inverse_cell);
        cell_index = 0;
        this.initializeSliceCache();
    } else {
        this.cells.push(cell);
        cell_index = this.cells.length - 1;
    }
    var final_cell = this.cells[cell_index];

    // Store bounding box
    this.cells[cell_index].box = this.getSlice(cell_index).getBoundingBox(final_cell); // no need to copy slice

};

// Turns an n-diagram into an identity (n+1)-diagram
Diagram.prototype.boost = function () {
    var diagram_copy = this.copy();
    this.source = diagram_copy;
    this.cells = [];
    this.initializeSliceCache();
    this.dimension++;
};

/* 
    Returns the full sizes of all the slices of the diagram
*/
Diagram.prototype.getFullDimensions = function () {
    if (this.getDimension() == 0) {
        return [];
    } else if (this.getDimension() == 1) {
        return this.cells.length;
    }

    var full_dimensions = [this.source.getFullDimensions()];
    for (var i = 0; i < this.cells.length; i++) {
        full_dimensions.push(this.getSlice(i + 1).getFullDimensions());
    }
    //return [this.cells.length].concat(this.source.getFullDimensions());
    return full_dimensions;
};





Diagram.prototype.getLengthsAtSource = function () {
    if (this.getDimension() == 0) return [];
    if (this.getDimension() == 1) return [this.cells.length];
    return this.getSourceBoundary().getLengthsAtSource().concat([this.cells.length]);
}

Diagram.prototype.source_size = function (level) {
    var nCell = this.cells[level];
    if (nCell.id.substr(0, 3) === 'Int') {
        return this.getSlice(level).getInterchangerBoundingBox(nCell.id, nCell.key).last(); // no need to copy slice
    } else {
        return nCell.source_size();
    }
}

Diagram.prototype.target_size = function (level) {
    var nCell = this.cells[level];
    if (nCell.id.substr(0, 3) === 'Int') {
        return this.getSlice(level).rewritePasteData(nCell.id, nCell.key).length; // no need to copy slice
    } else {
        return nCell.target_size();
    }
};

// Construct the inverse to the specified cell, for the current diagram
Diagram.prototype.getInverseCell = function (cell) {
    return new NCell({
        id: cell.id.toggle_inverse(),
        key: this.getInverseKey(cell.id, cell.key)
    });
};

Diagram.prototype.getBoundary = function (path) {
    if (path == null) return this;
    var boundary = {};
    if (typeof path == 'string') {
        boundary.type = path.last();
        boundary.depth = path.length;
    } else {
        boundary = path;
    }
    if (boundary.depth > 1) return this.source.getBoundary({
        depth: boundary.depth - 1,
        type: boundary.type
    });
    if (boundary.type == 's') return this.getSourceBoundary();
    if (boundary.type == 't') return this.getTargetBoundary();
}

Diagram.prototype.intersectBoundingBoxes = function (b1, b2) {
    var new_b1 = {
        min: b1.min.slice(),
        max: b1.max.slice()
    };
    var new_b2 = {
        min: b2.min.slice(),
        max: b2.max.slice()
    };
    return this.intersectBoundingBoxesRef(new_b1, new_b2);
}

// Find intersections of bounding boxes by shrinking to a core
Diagram.prototype.intersectBoundingBoxesRef = function (b1, b2) {

    // Deal with the case that one of the boxes is empty
    if (b1 == null || b2 == null) return null;

    // If we're in dimension zero; if neither box is empty, return the nonempty bounding box
    if (this.getDimension() == 0) return {
        min: [],
        max: []
    };

    // Return null if they are nonintersecting just based on final coordinates
    if (b1.min.last() > b2.max.last()) return null;
    if (b2.min.last() > b1.max.last()) return null;

    // Reduce height of bounding boxes where they protrude above the other
    while (b1.max.last() > b2.max.last()) b1.max[b1.max.length - 1]--;
    while (b2.max.last() > b1.max.last()) b2.max[b2.max.length - 1]--;

    // Raise height of bounding boxes where they descend below the other
    if (b1.min.last() < b2.min.last()) {
        var adj = this.pullUpMinMax(b2.min.last(), b1.min.last(), b1.min.penultimate(), b1.max.penultimate())
        b1.max.penultimate(adj.max);
        b1.min.last(b2.min.last());
    }
    if (b2.min.last() < b1.min.last()) {
        var adj = this.pullUpMinMax(b1.min.last(), b2.min.last(), b2.min.penultimate(), b2.max.penultimate())
        b2.max.penultimate(adj.max);
        b2.min.last(b1.min.last());
    }

    // Boxes b1 and b2 should now have the same final min and max values.
    var slice = this.getSlice(b1.min.last());
    var slice_intersection = slice.intersectBoundingBoxes({
        min: b1.min.slice(0, this.dimension - 1),
        max: b1.max.slice(0, this.dimension - 1)
    }, {
            min: b2.min.slice(0, this.dimension - 1),
            max: b2.max.slice(0, this.dimension - 1)
        });
    if (slice_intersection == null) return
    slice_intersection.min.push(b1.min.last());
    slice_intersection.max.push(b1.max.last());
    return slice_intersection;
}

Diagram.prototype.pullUpMinMax = function (top_height, bottom_height, min, max) {
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
};

// Check that the bounding boxes can slide past each other
Diagram.prototype.boundingBoxesSlideDownOnRight = function (lower, upper) {

    // Make sure they are adjacent in height correctly
    if (lower.max.last() != upper.min.last()) return false;

    // Find the top face of the lower bounding box
    var pull_up = this.pullUpMinMax(upper.min.last(), lower.min.last(), lower.min.penultimate(), lower.max.penultimate());

    // Check the upper box is on the right
    return upper.min.penultimate() >= pull_up.max;
}

// Check that the bounding boxes can slide past each other
Diagram.prototype.boundingBoxesSlideDownOnLeft = function (lower, upper) {

    // Make sure they are adjacent in height correctly
    if (lower.max.last() != upper.min.last()) return false;

    // Find the top face of the lower bounding box
    var pull_up = this.pullUpMinMax(upper.min.last(), lower.min.last(), lower.min.penultimate(), lower.max.penultimate());

    // Check the upper box is on the left
    return upper.max.penultimate() <= pull_up.min;
}

// Get all the ways that a cell matches, local to a given click
Diagram.prototype.getLocalMatches = function (click_box, id, flip) {
    var generator = gProject.signature.getGenerator(id);
    var match_diagram;
    if (flip == '') match_diagram = generator.source;
    else if (flip == 'I0') match_diagram = generator.target;
    else if (flip == 'I1') match_diagram = generator.source.mirror(0);
    else if (flip == 'I0I1') match_diagram = generator.target.mirror(0);
    var matches = this.enumerate(match_diagram);
    var results = [];
    for (var i = 0; i < matches.length; i++) {
        var match_box = this.getBoundingBox({
            id: id + flip,
            key: matches[i]
        });
        var intersection = this.intersectBoundingBoxes(click_box, match_box);
        if (intersection == null) continue;
        var small_intersection = intersection.min.vector_equals(intersection.max);
        if (small_intersection) {
            // Only accept if intersection equals click_box
            if (!boundingBoxesEqual(intersection, click_box)) continue;
        }
        results.push({
            id: id + flip,
            key: matches[i],
            possible: true
        });
    }
    return results;
}

// Get the cell at a particular location in the diagram
Diagram.prototype.getCell = function (location) {
    _assert(location.length == this.geometric_dimension);
    return this.getSlice(location).data;
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

// Get the bounding box surrounding a diagram component
Diagram.prototype.getLocationBoundingBox = function (location) {
    if (!globular_is_array(location)) location = [location];
    else location = location.slice();
    if (this.dimension == 0) return {
        min: [],
        max: []
    };
    if (location.length == 0) debugger;
    var box = this.getSliceBoundingBox(location);
    if (box == null) return null;
    var extra = (location.length > this.getDimension() ? location.slice(1) : location);
    box.min = box.min.concat(extra);
    box.max = box.max.concat(extra);
    if (extra.length == location.length) box.max[box.max.length - location.length]++;
    return box;
};

// Get bounding box surrounding the entire diagram
Diagram.prototype.getEntireBoundingBox = function (cell) {
    var source = this.getSourceBoundary();
    if (source == null) return {
        min: [],
        max: []
    }
    var box = this.getSourceBoundary().getEntireBoundingBox();
    box.min.push(0);
    box.max.push(this.cells.length);
    return box;
}

// Gets the bounding box for an entire slice of the diagram
Diagram.prototype.getEntireSliceBoundingBox = function (location) {
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
Diagram.prototype.getLocationBoundaryBox = function (boundary, box, location) {

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
        } else {
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

Diagram.prototype.getBoundingBox = function (cell) {
    if (cell == undefined) debugger;
    if (cell.id == undefined) debugger;
    if (cell.id.is_interchanger()) return this.getInterchangerBoundingBox(cell.id, cell.key);
    var box = {
        min: cell.key.slice()
    };
    var generator_box = gProject.signature.getGenerator(cell.id).getBoundingBox();
    box.max = box.min.vector_add(generator_box.max);
    box.ignore = true; // don't store bounding boxes on the server
    return box;
};

Diagram.prototype.getSliceBoundingBox = function (location) {
    if (globular_is_array(location)) location = location.slice();
    else location = [location];
    var height = location.shift();
    var slice = this.getSlice(location); // no need to copy slice
    if (slice.getDimension() == 0) return {
        min: [],
        max: []
        //,ignore: true
    };
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

Diagram.prototype.initializeSliceCache = function () {
    this.sliceCache = [];
    this.sliceCache.ignore = true;
}

Diagram.prototype.clearAllSliceCaches = function () {
    delete this.sliceCache;
    if (this.source != null) this.source.clearAllSliceCaches();
    return this;
}


// Check if the specified id is used at all in this diagram
Diagram.prototype.usesCell = function (generator) {

    // Check all the cells
    for (var i = 0; i < this.cells.length; i++) {
        if (this.cells[i].id.getSignatureType() == generator.id) return true;
    }

    // Check whether the source uses it
    if (this.source && this.source.usesCell(generator)) return true;

    // If not, we're clear
    return false;
};

// Reflect a diagram in the nth way
Diagram.prototype.mirror = function (n) {
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
    } else {
        // Not yet implemented
        debugger;
    }
}

// Flips the diagram in the nth way
Diagram.prototype.flip = function (n) {

}

Diagram.prototype.keepAfter = function (n) {
    var new_source = this.getSlice(n).copy();
    var new_cells = this.cells.slice(n);
    var new_cache = this.sliceCache.slice(n);
    this.source = new_source;
    this.cells = new_cells;
    this.sliceCache = new_cache;
}

Diagram.prototype.keepBefore = function (n) {
    var new_cells = this.cells.slice(0, n);
    var new_cache = this.sliceCache.slice(0, n);
    this.cells = new_cells;
    this.sliceCache = new_cache;
}

// Pad the given coordinates as required to ensure there is an entity present
Diagram.prototype.realizeCoordinate = function (coords) {
    var slice = this;

    // Obtain the suggested slice
    for (var i = 0; i < coords.length - 1; i++) {
        slice = slice.getSlice(coords[coords.length - 1 - i]);
    }

    // For each extra dimension we have to dive to find an entity, pad the coords
    while (slice.data.length == 0) {
        slice = slice.source;
        coords.unshift(0);
    }

    return coords;
}

Diagram.prototype.downloadPNG = function (filename, highlight) {
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

