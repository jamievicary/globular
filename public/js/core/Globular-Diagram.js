"use strict";

/*
    Diagram class
*/

/*global gProject*/

function Diagram(source, cells) {
    this['_t'] = 'Diagram';
    if (source === undefined) return;
    this.source = (source == null ? null : source.copy());
    this.cells = cells;
    this.dimension = (source == null ? 0 : source.getDimension() + 1);
    return this;
};

Diagram.prototype.getType = function() {
    return 'Diagram';
}

/*
    Returns the dimension of the entire diagram (not of the highest order generator)
*/
Diagram.prototype.getDimension = function() {
    return this.dimension;
}

/*
    Returns the source boundary of the diagram, which is stored explicitly within the class
*/
Diagram.prototype.getSourceBoundary = function() {
    return this.source;
}

/*
    Returns the target boundary of the diagram, which is computed by rewriting the explicitly stored source boundary
    by systematic application of single cell rewrites based on the list of cells of the diagram
*/
Diagram.prototype.getTargetBoundary = function() {
    return this.getSlice(this.cells.length);

    /*
    if (this.source === null) return null;
    var target_boundary = this.source.copy();
    for (var i = 0; i < this.cells.length; i++) {
        target_boundary.rewrite(this.cells[i]);
    }
    return target_boundary;
    */
}



/*
    Check for equality of two diagrams, recursively on their sources.
*/
Diagram.prototype.equals = function(d2) {
    var d1 = this;
    if (d1.getDimension() != d2.getDimension()) return false;
    if (d1.cells.length != d2.cells.length) return false;
    for (var i = 0; i < this.cells.length; i++) {
        if (!d1.cells[i].equals(d2.cells[i])) return false;
    }
    if (this.source == null) return true;
    return d1.source.equals(d2.source);
};

Diagram.prototype.render = function(div, highlight) {
    globular_render(div, this, highlight);
}

// Rewrites a subdiagram of this diagram
Diagram.prototype.rewrite = function(cell) {
    if (cell == undefined) debugger;
    if (cell.key.last() < 0) debugger;

    // Identify the portion to be cut out, and the cells to be spliced in
    var source_size;
    var insert_position;
    var target;
    if (cell.id.is_interchanger()) {
        target = new Diagram(null, this.rewritePasteData(cell.id, cell.key)); // WHY DOES THIS HAVE TO BE A DIAGRAM OBJECT?
        var bounding_box = (cell.box != null ? cell.box : this.getBoundingBox(cell));
        insert_position = bounding_box.min.last();
        source_size = bounding_box.max.last() - bounding_box.min.last();
    } else {
        // Info on the source and the target of the rewrite is retrieved from the signature here
        var rewrite = gProject.signature.getGenerator(cell.id);
        source_size = rewrite.source.cells.length;
        target = rewrite.target.copy();
        insert_position = (this.getDimension() == 0 ? 0 : cell.key.last());
        
        /* OLD
        var rewrite = gProject.signature.getGenerator(cell.id.getBaseType());
        source_size = (cell.id.last() == 'I' ? rewrite.target.cells.length : rewrite.source.cells.length);
        target = (cell.id.last() == 'I' ? rewrite.source.copy() : rewrite.target.copy());
        insert_position = (this.getDimension() == 0 ? 0 : cell.key.last());
        */
    }

    if (isNaN(insert_position)) debugger;
    if (insert_position < 0) debugger;

    // Remove the source cells
    this.cells.splice(insert_position, source_size);

    // Prepare the target cells and insert them
    var slice = this.getSlice(insert_position);
    if (slice != null) slice = slice.copy(); // need to copy

    // Update the slice cache
    if (this.sliceCache != null) {
        this.sliceCache = [];
        this.sliceCache.splice(insert_position, source_size);
        for (var i = 0; i < target.cells.length; i++) {
            this.sliceCache.splice(insert_position + i, 0, null);
        }
    }
    //this.initializeSliceCache();

    // Insert the target of the rewrite
    for (var i = 0; i < target.cells.length; i++) {
        var new_cell = target.cells[i];
        if (!cell.id.is_interchanger()) {
            if (new_cell.id.substr(0, 3) == 'Int') {
                var z = 1;
            }
            new_cell.pad(cell.key.slice(0, cell.key.length - 1));
        }
        new_cell.box = this.getDimension() == 0 ? null : slice.getBoundingBox(new_cell);
        this.cells.splice(insert_position + i, 0, target.cells[i]);
        if (i < target.cells.length - 1) slice.rewrite(new_cell);
    }

    return this;
}

Diagram.prototype.multipleInterchangerRewrite = function(rewrite_array) {
    
    if(rewrite_array === false){return false;}
    
    for(var i = 0; i < rewrite_array.length; i++){
        if(this.interchangerAllowed(rewrite_array[i].id, rewrite_array[i].key)){
            this.rewrite(rewrite_array[i]);
        }
        else{
            return false;
        }
    }
    return true;

}

Diagram.prototype.expandWrapper = function(type, x, k) {
    
    if(x < 0 || x >= this.cells.length){return false;}
    var y = this.cells[x].key.last();
    if(this.cells[x].id === 'IntI0'){y--;} // Special code to deal with the key for IntI0
    return this.expand(type, {up: x, across: y, length: this.source_size(x)}, 1, k);
}

/*
    Returns a copy of this diagram. This is obtained by recursively copying the source boundary and then
    copying the set of n-cells along with the information on how they are attached to each other
*/

Diagram.prototype.copy = function() {
    var source = (this.source == null ? null : this.source.copy());
    var cells = [];
    for (var i = 0; i < this.cells.length; i++) {
        var cell = this.cells[i];
        cells.push(new NCell({
            id: cell.id,
            key: cell.key,
            box: cell.box
        }));
    }
    var diagram = new Diagram(source, cells);
    return diagram;
};

/*
    Returns the list of all the ways in which the matched_diagram fits into this diagram. If there are no matches - returns false.
    Setting the boolean 'loose' activates a more permissive matching strategy for 2-diagrams.
*/

Diagram.prototype.enumerate = function(matched_diagram, loose) {
    var matches = new Array();

    // Set loose flag correctly
    if (loose === undefined) loose = false;
    if (matched_diagram.getDimension() != 2) {
        loose = false;
    }

    var matched_diagram_shape = matched_diagram.getFullDimensions();

    // For a match of 0-diagrams, returns an empty match, as there are no boundaries to be passed
    if (this.dimension === 0) {
        if (matched_diagram.cells[0].id === this.cells[0].id) {
            return [
                []
            ];
        }
        // Returns false if a match has not been found
        return [];
    }

    // This is the base platform for finding each match, it will be rewritten once the matches beginning at the particular height are investigated
    //var intermediate_boundary = this.source.copy();

    // The maximum number of matches that can possibly be found
    var loopCount = this.cells.length - matched_diagram.cells.length + 1;

    for (var i = 0; i < loopCount; i++) { // i  is the number of the platform where the match is found

        var intermediate_boundary = this.getSlice(i);
        var current_match = new Array();

        // We anchor matches by recursively matching the boundary of the matched diagram and this diagram
        var boundary_matches = intermediate_boundary.enumerate(matched_diagram.source);

        if (matched_diagram.cells.length === 0) {
            for (var j = 0; j < boundary_matches.length; j++) {
                boundary_matches[j].push(i);
                matches.push(boundary_matches[j]);
            }
        } else {
            /*
                Constructs the current match on the basis of total orders on n-cells in the matched diagram and in this diagram.
                At the given (n-1)-platform, there may be at most one match between n-cells. Here we select the (n-1) match on the boundary
                which is consistent with the only possible match on n-cells. 
            */
            var j;
            for (j = 0; j < boundary_matches.length; j++) {
                var k = 0;
                for (k = 0; k < boundary_matches[j].length; k++) {

                    // Generator attachment data shifted by the offset created by the newly added generator
                    var offset = 0;
                    if (matched_diagram.cells.length != 0) {
                        //offset = matched_diagram.getCoordinates(matched_diagram.cells[0])[k];
                        offset = matched_diagram.cells[0].box.min[k];
                    }
                    //if (this.getCoordinates(this.cells[i])[k] != boundary_matches[j][k] + offset) break;
                    if (this.cells[i].box.min[k] != boundary_matches[j][k] + offset) break;
                }
                // }
                if (k === boundary_matches[j].length) {
                    current_match = boundary_matches[j].slice(0);
                    break;
                }
            }
            if (j === boundary_matches.length) {
                // We haven't found a match
                // Go to the next platform
                //intermediate_boundary = this.getSlice(i + 1);
                //intermediate_boundary.rewrite(this.cells[i]);
                continue;
            } else {
                // We have found a match stored in current_match
                current_match.push(i);
            }


            /* 
                Performs checks on whether in the current match, corresponding n-cells have the same types and the same information
                on how they fit together.
            */
            current_match.adjustments = [];
            var adjustments = current_match.adjustments;
            var matches_needed = matched_diagram.cells.length;
            var matches_found = 0;
            var x_offset = 0;
            while (matches_found < matches_needed) {
                //for (var j = 0; j < matched_diagram.cells.length; j++) {

                // If we've gone past the end of the diagram, then we've failed to find a match
                if (i + matches_found + adjustments.length == this.cells.length) {
                    current_match = null;
                    break;
                }

                var cell = this.cells[i + matches_found + adjustments.length];

                var adjustment_needed = false;

                if (matched_diagram.cells[matches_found].id != cell.id) {
                    // It's not the right cell, so to have a hope we'll have to interchange it out of the way
                    adjustment_needed = true;
                } else {
                    //var coordinates = matched_diagram.getCoordinates(matched_diagram.cells[matches_found]);
                    var coordinates = matched_diagram.cells[matches_found].box.min;
                    for (var k = 0; k < coordinates.length; k++) {
                        //if (coordinates[k] + (loose ? x_offset : 0) != this.getCoordinates(cell)[k] - current_match[k]) {
                        if (coordinates[k] + (loose ? x_offset : 0) != cell.box.min[k] - current_match[k]) {
                            adjustment_needed = true;
                            break;
                        }
                    }
                }

                if (adjustment_needed) {
                    if (matches_found == 0 && adjustments.length == 0) {
                        // Never adjust on the first rung
                        current_match = null;
                        break;
                    }
                    if (loose) {
                        // Can we interchange the cell out of the way?
                        var rewrite = gProject.signature.getGenerator(cell.id);
                        var last_source = cell.box.min[0] + rewrite.source.cells.length;
                        var on_left = (last_source <= current_match[0] + x_offset);
                        var first_source = cell.box.min[0];
                        var on_right = (first_source >= current_match[0] + x_offset + matched_diagram_shape[matches_found]);
                        if (on_left) {
                            adjustments.push({
                                height: matches_found + adjustments.length,
                                side: 'left',
                                id: cell.id
                            });
                            x_offset += rewrite.target.cells.length - rewrite.source.cells.length;
                        } else
                        if (on_right) {
                            adjustments.push({
                                height: matches_found + adjustments.length,
                                side: 'right',
                                id: cell.id
                            });
                        } else {
                            // Loose matching has failed
                            current_match = null;
                            break;
                        }
                    } else {
                        // Not allowed to do loose matching, so fail.
                        current_match = null;
                        break;
                    }
                } else {
                    // We found a bona-fide match
                    matches_found++;
                }
            }
            if (loose && (current_match != null)) {
                console.log('Found ' + adjustments.length + ' loose matches');
            }

            /*
            for (var j = 0; j < matched_diagram.cells.length; j++) {
                if (matched_diagram.cells[j].id != this.cells[i + j].id) {
                    current_match = null;
                    break;
                }
                if (matched_diagram.getCoordinates(matched_diagram.cells[j]).length !=
                    this.getCoordinates(this.cells[i + j]).length) {
                    console.log("enumerate - strange condition triggered");
                    current_match = null;
                    break;
                }
                else {
                    for (var k = 0; k < matched_diagram.getCoordinates(matched_diagram.cells[j]).length; k++) {
                        if (matched_diagram.getCoordinates(matched_diagram.cells[j])[k] !=
                            this.getCoordinates(this.cells[i + j])[k] - current_match[k]) {
                            current_match = null;
                            break;
                        }
                    }
                }
                if (current_match === null) {
                    break;
                }
            }
            */
            // If the current match passed all the checks, it is added to the list of matches
            if (current_match != null) {
                matches.push(current_match);
            }

        }
        // No need to rewrite the platform at the final pass of the loop
        if (i === loopCount - 1) {
            break;
        }

        // Rewrites the intermediate boundary to allow to search for matches at the next platform
        //intermediate_boundary.rewrite(this.cells[i]);
        //intermediate_boundary = this.getSlice(i + 1);
    }

    /*
    // For a 2-diagram, record data about match locations to enable suppression of equivalent rewrites.
    // Only applies for 2-diagrams, when the matched diagram is an identity.
    if ((this.getDimension() == 2) && (matched_diagram.cells.length == 0)) {
        var length = matched_diagram.source.cells.length;
        var matches_by_coordinate = {};
        var match_equivalence_classes = [];
        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            matches_by_coordinate[match.toString()] = i;
            if (match.last() == 0) {
                match_equivalence_classes.push([i]);
                continue;
            }

            var height = match[1];
            var previous_vertex = this.cells[height - 1].id;
            var previous_generator = gProject.signature.getGenerator(previous_vertex);
            var previous_vertex_first_target = this.cells[height - 1].box.min[0];
            var previous_vertex_last_target = previous_vertex_first_target + previous_generator.target.cells.length;

            // Is this match blocked by the preceding vertex?
            var equivalent_matches = [];
            if (previous_vertex_last_target <= match[0]) {
                // Not blocked, previous vertex is to the left
                equivalent_matches.push([
                    match[0] - previous_generator.target.cells.length + previous_generator.source.cells.length,
                    match[1] - 1
                ]);
            }
            if (previous_vertex_first_target >= match[0] + length) {
                // Not blocked, previous vertex is to the right
                equivalent_matches.push([match[0], match[1] - 1]);
            }

            if (equivalent_matches.length == 0) {
                // It's a new equivalence class
                match_equivalence_classes.push([i]);
            } else {
                var new_class = [(i)];
                for (var em = 0; em < equivalent_matches.length; em++) {
                    var equivalent_match = equivalent_matches[em];
                    // Take out all equivalence classes containing equivalent_match, and
                    // concatenate them onto new_class
                    var equiv_string = equivalent_match.toString();
                    var match_index = matches_by_coordinate[equiv_string];
                    var matching_classes = [];
                    for (var c = 0; c < match_equivalence_classes.length; c++) {
                        var equivalence_class = match_equivalence_classes[c];
                        var index = equivalence_class.indexOf(match_index);
                        if (index >= 0) {
                            new_class = new_class.concat(match_equivalence_classes[c]);
                            match_equivalence_classes.splice(c, 1);
                        }
                    }
                }
                // Add this new equivalence class
                match_equivalence_classes.push(new_class);
            }
        }

        // Every match should appear exactly once in the list of equivalence classes.
        // Provide it with data on the size of its equivalence class.
        for (var i = 0; i < match_equivalence_classes.length; i++) {
            for (var j = 0; j < match_equivalence_classes[i].length; j++) {
                var index = match_equivalence_classes[i][j];
                matches[index].equivalence_class_size = match_equivalence_classes[i].length;
            }
        }
    }
    */

    return matches;
};

// Attaches the given cell to the diagram, via the specified boundary path. 
Diagram.prototype.attach = function(cell, boundary /*, bounds*/ ) {

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
    if (boundary.depth > 1) { // attached_diagram.cells.length = 0
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
Diagram.prototype.boost = function() {
    var diagram_copy = this.copy();
    this.source = diagram_copy;
    this.cells = [];
    this.initializeSliceCache();
    this.dimension++;
};

/* 
    Returns the full sizes of all the slices of the diagram
*/
Diagram.prototype.getFullDimensions = function() {
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


// Convert an internal coordinate to {boundary: {type, depth}, coordinates}, by identifying
// coordinates in slices adjacent to the boundary as being in that boundary.
// ASSUMES COORDINATES ARE FIRST-INDEX-FIRST
Diagram.prototype.getBoundaryCoordinates = function(params /*internal, fakeheight*/ ) {
    if (params.allow_boundary == undefined) params.allow_boundary = [];
    var allow_boundary = params.allow_boundary.length == 0 ? {
        source: false,
        target: false
    } : params.allow_boundary[0];
    var c = params.coordinates;
    var sub;
    if (c.length == 1) {
        sub = {
            boundary: null,
            coordinates: []
        };
    } else {
        var slice = this.getSlice(c[0]); // no need to copy slice
        var new_allow_boundary = params.allow_boundary.length == 0 ? [] : params.allow_boundary.slice(1);
        sub = slice.getBoundaryCoordinates({
            coordinates: params.coordinates.slice(1),
            allow_boundary: new_allow_boundary
        });
    }

    var in_source = allow_boundary.source && c.length > 1 && c[0] == 0;
    //var in_target = c.length > 1 && c[0] >= Math.max(this.cells.length, fakeheight ? 1 : 0);
    var in_target = allow_boundary.target && c.length > 1 && c[0] == Math.max(1, this.cells.length);
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
        sub.coordinates.unshift(c[0]);
    }
    return sub;
};

// Find the ID of the first cell that appears in the diagram
Diagram.prototype.getLastId = function() {
    var d = this;
    while (d.cells.length == 0) {
        d = d.getSourceBoundary();
    }
    return {
        id: d.cells[d.cells.length - 1].id,
        dimension: d.getDimension()
    };
}

// Find the colour of the first cell that appears in the diagram
Diagram.prototype.getLastColour = function() {
    var id = this.getLastId();
    return gProject.getColour(id);
}


Diagram.prototype.getLengthsAtSource = function() {
    if (this.getDimension() == 0) return [];
    if (this.getDimension() == 1) return [this.cells.length];
    return this.getSourceBoundary().getLengthsAtSource().concat([this.cells.length]);
}

Diagram.prototype.source_size = function(level) {
    var nCell = this.cells[level];
    if (nCell.id.substr(0, 3) === 'Int') {
        return this.getSlice(level).getInterchangerBoundingBox(nCell.id, nCell.key).last(); // no need to copy slice
    } else {
        return nCell.source_size();
    }
}

Diagram.prototype.target_size = function(level) {
    var nCell = this.cells[level];
    if (nCell.id.substr(0, 3) === 'Int') {
        return this.getSlice(level).rewritePasteData(nCell.id, nCell.key).length; // no need to copy slice
    } else {
        return nCell.target_size();
    }
};

/*
// Identify separation of parts of a diagram
Diagram.prototype.separation = function(c1, c2) {
    var d1 = this.dimension + 1 - c1.length;
    var d2 = this.dimension + 1 - c2.length;
    if (d1 == d2) {
        // ... ?
    } else if (d1 > d2) {
        return this.wellSeparated(c2, c1);
    }

    // CAN ASSUME d1 < d2

    // Only considering single-dimension difference at the moment
    if (d2 != d1 + 1) return false;

    if (!c1.has_suffix(c2)) return false;

    // Find the base slice for d2
    var slice = this;
    for (var i = 0; i < c2.length - 1; i++) {
        slice = slice.getSlice(c2.end(i));
    }

    // Get region where c2 is acting
    var c2bbox = slice.getSliceBoundingBox(c2[0]);

    // Get slice on which c2 is acting
    slice = slice.getSlice(c2[0]);

    // Find the coordinates of c1 in this slice
    var c1coord = c1[0];

    // Find the 'future cone' of c2bbox in slice
    var start_height, final_height, min, max, target_min, target_max;
    if (c2bbox.min.last() <= c1coord) {
        // Starting from the bbox
        min = c2bbox.min[0];
        max = c2bbox.max[0];
        start_height = c2bbox.min.last();
        final_height = c1coord;
        var h_bbox = slice.getSliceBoundingBox(c1coord);
        target_min = h_bbox.min.last();
        target_max = h_bbox.max.last();
    } else {
        // Starting from the point
        var h_bbox = slice.getSliceBoundingBox(c1coord);
        min = h_bbox.min.last();
        max = h_bbox.max.last();
        start_height = c1coord;
        final_height = c2bbox.min.last();
        target_min = c2bbox.min.end(1);
        target_max = c2bbox.max.end(1);
    }

    for (var h = start_height; h <= final_height; h++) {
        if (h == final_height) {
            var above = target_min >= max;
            var below = target_max <= min;
            return {
                above: target_min >= max,
                below: target_max <= min
            };
        }
        var h_slice = slice.getSlice(h);
        var h_bbox = slice.getSliceBoundingBox(h);
        var delta = slice.target_size(h) - slice.source_size(h);
        if (h_bbox.max.last() <= min) {
            min += delta;
            max += delta;
        } else if (h_bbox.min.last() >= max) {
            // do nothing
        } else {
            // interact
            min = Math.min(min, h_bbox.min.last());
            max = Math.max(max + delta, h_bbox.min.last() + slice.target_size(h));
        }
    }
};
*/

// Construct the inverse to the specified cell, for the current diagram
Diagram.prototype.getInverseCell = function(cell) {
    return new NCell({
        id: cell.id.toggle_inverse(),
        key: this.getInverseKey(cell.id, cell.key)
    });
};

Diagram.prototype.getBoundary = function(path) {
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

// Take the union of two bounding boxes on (projections of) this diagram
Diagram.prototype.unionBoundingBoxes = function(b1, b2) {

    // Deal with the case that one of the boxes is empty
    if (b1 == null) return b2;
    if (b2 == null) return b1;

    // Base case
    if (b1.min.length == 1) return {
        min: [Math.min(b1.min[0], b2.min[0])],
        max: [Math.max(b1.max[0], b2.max[0])]
    };

    // Recursive case: evaluate on the once-projected subdiagram
    var new_box = this.unionBoundingBoxes({
        min: b1.min.slice(1),
        max: b1.max.slice(1)
    }, {
        min: b2.min.slice(1),
        max: b2.max.slice(1)
    });

    // Now new_box holds the correct data, except the first entries of the
    // min and max arrays are missing.
    var b1slice = this.getSlice(b1.min.slice(2)); // no need to copy slice
    var mm1 = b1slice.pullBackMinMax(b1.min[1], new_box.min[0], b1.min[0], b1.max[0]);
    var b2slice = this.getSlice(b2.min.slice(2)); // no need to copy slice
    var mm2 = b2slice.pullBackMinMax(b2.min[1], new_box.min[0], b2.min[0], b2.max[0]);
    new_box.min.unshift(Math.min(mm1.min, mm2.min));
    new_box.max.unshift(Math.max(mm1.max, mm2.max));
    return new_box;
};

Diagram.prototype.pullBackMinMax = function(top_height, bottom_height, min, max) {
    for (var i = top_height; i > bottom_height; i--) {
        var box = this.cells[i - 1].box;
        var delta = this.source_size(i - 1) - this.target_size(i - 1);
        max = Math.max(max + delta, box.max.last());
        min = Math.min(min, box.min.last());
    }
    return {
        min: min,
        max: max
    };
};

Diagram.prototype.intersectBoundingBoxes = function(b1, b2) {

    // Deal with the case that one of the boxes is empty
    if (b1 == null || b2 == null) return null;

    // Base case
    if (b1.min.length == 1) {
        var low = Math.max(b1.min.last(), b2.min.last());
        var high = Math.min(b1.max.last(), b2.max.last());
        if (high < low) return null;
        return {
            min: [low],
            max: [high]
        };
    }

    // Recursive case: evaluate on the once-projected subdiagram
    var new_box = this.intersectBoundingBoxes({
        min: b1.min.slice(1),
        max: b1.max.slice(1)
    }, {
        min: b2.min.slice(1),
        max: b2.max.slice(1)
    });

    // If the result of the recursion is empty, then the intersection is empty
    if (new_box == null) return null;

    // Now new_box holds the correct data, except the first entries of the
    // min and max arrays are missing.
    var b1slice = this.getSlice(b1.min.slice(2)); // no need to copy slice
    var mm1 = b1slice.pullUpMinMax(new_box.min[0], b1.min[1], b1.min[0], b1.max[0]);
    var b2slice = this.getSlice(b2.min.slice(2)); // no need to copy slice
    var mm2 = b2slice.pullUpMinMax(new_box.min[0], b2.min[1], b2.min[0], b2.max[0]);
    new_box.min.unshift(Math.max(mm1.min, mm2.min));
    new_box.max.unshift(Math.min(mm1.max, mm2.max));
    return new_box;
}

Diagram.prototype.pullUpMinMax = function(top_height, bottom_height, min, max) {
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
Diagram.prototype.boundingBoxesSlideDownOnRight = function(lower, upper) {

    // Make sure they are adjacent in height correctly
    if (lower.max.last() != upper.min.last()) return false;

    // Find the top face of the lower bounding box
    var pull_up = this.pullUpMinMax(upper.min.last(), lower.min.last(), lower.min.penultimate(), lower.max.penultimate());

    // Check the upper box is on the right
    return upper.min.penultimate() >= pull_up.max;
}

// Check that the bounding boxes can slide past each other
Diagram.prototype.boundingBoxesSlideDownOnLeft = function(lower, upper) {

    // Make sure they are adjacent in height correctly
    if (lower.max.last() != upper.min.last()) return false;

    // Find the top face of the lower bounding box
    var pull_up = this.pullUpMinMax(upper.min.last(), lower.min.last(), lower.min.penultimate(), lower.max.penultimate());

    // Check the upper box is on the left
    return upper.max.penultimate() <= pull_up.min;
}

// Get the cell at a particular location in the diagram
Diagram.prototype.getCell = function(location) {
    var level = location.shift();
    var slice = this.getSlice(location); // no need to copy slice
    while (slice.cells.length == 0) {
        if (slice == null) return null;
        slice = slice.getSourceBoundary();
    }
    return slice.cells[level];
}

// Get the bounding box surrounding a object
Diagram.prototype.getLocationBoundingBox = function(location) {
    if (!globular_is_array(location)) location = [location];
    else location = location.slice();
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
Diagram.prototype.getEntireBoundingBox = function(cell) {
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
Diagram.prototype.getEntireSliceBoundingBox = function(location) {
    if (!globular_is_array(location)) location = [location];
    else location = location.slice();
    if (location.length == 0) return this.getEntireBoundingBox();
    var height = location.pop();
    var box = this.getSlice(height).getEntireSliceBoundingBox(location);
    box.min.push(height);
    box.max.push(height);
    return box;
}

// Embeds a bounding box in a boundary into the entire diagram, extruding as necessary
/*
Diagram.prototype.embedBoundaryBoundingBox = function(box, boundary) {
    
    // If it's a depth-1 boundary, just embed
    if (boundary.depth == 1) {
        if (boundary.type == 's') {
            box.min.push(0);
            box.max.push(0);
        } else {
            box.min.push(this.cells.length);
            box.max.push(this.cells.length);
        }
        return box;
    }
    
    // Otherwise, embed and extrude
    var new_boundary = {depth: boundary.depth - 1, type: boundary.type};
    var box = this.source.embedBoundaryBoundingBox(box, new_boundary);
    box.min.push(0);
    box.max.push(this.cells.length);
    return box;
}
*/

// Find how the specified boundary and sub-box appears from the specified location
Diagram.prototype.getLocationBoundaryBox = function(boundary, box, location) {

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

Diagram.prototype.getBoundingBox = function(cell) {
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

Diagram.prototype.getSliceBoundingBox = function(location) {
    if (globular_is_array(location)) location = location.slice();
    else location = [location];
    var height = location.shift();
    var slice = this.getSlice(location); // no need to copy slice
    if (slice.getDimension() == 0) return {
        min: [],
        max: []
            //,ignore: true
    };
    if (height >= slice.cells.length) return null;
    return slice.getSlice(height).getBoundingBox(slice.cells[height]); // no need to copy slice
}

// Returns a slice subdiagram
Diagram.prototype.getSlice = function(location) {
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
    //return this.sliceCache[height].copy();
    return this.sliceCache[height];
    /*
    var slice = this.source.copy();
    for (var i = 0; i < height; i++) {
        slice.rewrite(this.cells[i]);
    }
    return slice;
    */
};

Diagram.prototype.initializeSliceCache = function() {
    this.sliceCache = [];
    this.sliceCache.ignore = true;
}

Diagram.prototype.clearAllSliceCaches = function() {
    delete this.sliceCache;
    if (this.source != null) this.source.clearAllSliceCaches();
    return this;
}

Diagram.prototype.prepare = function() {
    if (this.source != null) this.source.prepare();
    for (var i = 0; i < this.cells.length; i++) {
        var cell = this.cells[i];
        cell.id = cell.id.clean(); // update the ID to the new format, in case this is an old workspace
        if (cell.box != undefined) continue;
        cell.box = this.getSliceBoundingBox(i);
    }
};

// Check if the specified id is used at all in this diagram
Diagram.prototype.usesCell = function(generator) {

    // Check all the cells
    for (var i = 0; i < this.cells.length; i++) {
        if (this.cells[i].id.getSignatureType() == generator.id) return true;
    }
    
    // Check whether the source uses it
    if (this.source != null) if (this.source.usesCell(generator)) return true;
    
    // If not, we're clear
    return false;

    /*
    // Check all the slices
    for (var i = 0; i < this.cells.length + 1; i++) {
        var slice = this.getSlice(i); // no need to copy slice
        if (slice != null) {
            if (slice.usesCell(generator)) return true;
        }
    }
    return false;
    */
};

// Reflect a diagram in the nth way
Diagram.prototype.mirror = function(n) {
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
Diagram.prototype.flip = function(n) {
    
}

Diagram.prototype.keepAfter = function(n) {
    var new_source = this.getSlice(n).copy();
    var new_cells = this.cells.slice(n);
    var new_cache = this.sliceCache.slice(n);
    this.source = new_source;
    this.cells = new_cells;
    this.sliceCache = new_cache;
}

Diagram.prototype.keepBefore = function(n) {
    var new_cells = this.cells.slice(0, n);
    var new_cache = this.sliceCache.slice(0, n);
    this.cells = new_cells;
    this.sliceCache = new_cache;
}