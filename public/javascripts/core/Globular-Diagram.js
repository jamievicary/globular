"use strict";

/*
    Diagram class
*/

function Diagram(source, nCells) {
    if (source === undefined) return;

    this.source = source;
    this.nCells = nCells;

    if (source === null) {
        this.dimension = 0;
    } else {
        this.dimension = source.dimension + 1;
    }
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
    by systematic application of single cell rewrites based on the list of nCells of the diagram
*/
Diagram.prototype.getTargetBoundary = function() {
    if (this.source === null) {
        return null;
    }

    var target_boundary = this.source.copy();
    for (var i = 0; i < this.nCells.length; i++) {
        target_boundary.rewrite(this.nCells[i]);

    }

    return target_boundary;
}

/*
    Returns a specific kth slice of this diagram
*/

Diagram.prototype.getSlice = function(k) {
    if (this.source === null) {
        return null;
    }
    if (k == 1 && this.nCells.length == 0) {
        // Handle request for slice 1 of identity diagram gracefully
        return this.source.copy();
    }
    else if (k > this.nCells.length) {
        return null;
    }

    var slice = this.source.copy();
    for (var i = 0; i < k; i++) {
        slice.rewrite(this.nCells[i]);
    }

    return slice;
};


/*
    Returns true if this diagram and the matched diagram are identical, i.e. they have the same set of nCells, composed
    in the same way. This is checked recursively by looking at the source boundary too. Otherwise, returns false.
*/
Diagram.prototype.diagramBijection = function(matched_diagram) {

    if (this.getDimension() != matched_diagram.getDimension()) {
        return false;
    }

    if (this.nCells.length != matched_diagram.nCells.length) {
        return false;
    }

    for (var i = 0; i < this.nCells.length; i++) {
        if (this.nCells[i].id != matched_diagram.nCells[i].id) {
            return false;
        }
        for (var k = 0; k < this.getCoordinates(this.nCells[i]).length; k++) {
            if (this.getCoordinates(this.nCells[i])[k] != matched_diagram.getCoordinates(matched_diagram.nCells[i])[k]) {
                if (this.getCoordinates(this.nCells[i]).length != matched_diagram.getCoordinates(matched_diagram.nCells[i]).length) {
                    return false;
                }

            }
        }
        for (var k = 0; k < this.getCoordinates(this.nCells[i]).length; k++) {
            if (this.getCoordinates(this.nCells[i])[k] != matched_diagram.getCoordinates(matched_diagram.nCells[i])[k]) {
                return false;
            }
        }

    }
    if (this.source != null) {
        return this.source.diagramBijection(matched_diagram.source);
    }

    return true;
};

Diagram.prototype.render = function(div, highlight) {
    globular_render(div, this, highlight);
}

/*
    Rewrites a subdiagram of this diagram, to a diagram over the same singature. The function takes as input an
    entry in the list of nCells - this contains two parameters, id: the name of the rewrite cell in the signature and 
    coordinates: an array with information on how to attach the given cell. In this context, id tells us what rewrite to apply
    and coordinate tells us which exact part of the diagram to apply the rewrite to.
*/
Diagram.prototype.rewrite = function(nCell, reverse) {

    if (nCell.coordinates != null) {
        for (var i = 0; i < nCell.coordinates.length; i++) {
            if (isNaN(nCell.coordinates[i])) debugger;
        }
    }

    if (reverse === undefined) reverse = false;

    var source;
    var target;

    // Special code to deal with interchangers
    var source_size;
    var insert_position;
    if (nCell.isInterchanger()) {
        var target = new Diagram(null, this.rewritePasteData(nCell.id, nCell.key));
        var bounding_box = this.getBoundingBox(nCell);
        insert_position = bounding_box.min.last();
        source_size = bounding_box.max.last() - bounding_box.min.last();
    } else {
        // Info on the source and the target of the rewrite is retrieved from the signature here
        if (nCell.id.last() == 'I') reverse = !reverse;
        var rewrite = gProject.signature.getGenerator(nCell.id.getBaseType());
        if (reverse) {
            source = rewrite.target.copy();
            target = rewrite.source.copy();
        } else {
            source = rewrite.source.copy();
            target = rewrite.target.copy();
        }
        source_size = source.nCells.length;
        insert_position = (this.getDimension() == 0 ? 0 : nCell.coordinates.last());
        if (insert_position < 0) debugger;
    }

    // Remove cells in the source of the rewrite
    this.nCells.splice(insert_position, source_size);
    for (var i = 0; i < target.nCells.length; i++) {

        // If the rewrite wasn't an interchanger, pad with the rewrite location
        if (!nCell.id.is_interchanger()) {
            target.nCells[i].pad(nCell.coordinates);
        }

        // Add the cell into the diagram
        this.nCells.splice(insert_position + i, 0, target.nCells[i]);
    }

    // Make sure all cells have coordinates properly defined
    if (insert_position != undefined) {
        for (var i = 0; i < target.nCells.length; i++) {
            if (this.nCells[insert_position + i].coordinates === null) {
                this.nCells[insert_position + i].coordinates =
                    this.getSlice(insert_position + i).getInterchangerCoordinates(this.nCells[insert_position + i].id, this.nCells[insert_position + i].key);
            }
        }
    }

    return this;
}


/*
    Returns a copy of this diagram. This is obtained by recursively copying the source boundary and then 
    copying the set of n-nCells along with the information on how they are attached to each other
*/
Diagram.prototype.copy = function() {

    var source_boundary;
    if (this.source === null) {
        source_boundary = null;
    } else {
        source_boundary = this.source.copy();
    }

    var nCells = new Array();
    for (var i = 0; i < this.nCells.length; i++) {
        if (this.nCells[i].coordinates == null) {
            nCells.push(new NCell(this.nCells[i].id, null, this.nCells[i].key.slice(0)));
        } else if (this.nCells[i].key == null) {
            nCells.push(new NCell(this.nCells[i].id, this.nCells[i].coordinates.slice(0), undefined));
        } else {
            nCells.push(new NCell(this.nCells[i].id, this.nCells[i].coordinates.slice(0), this.nCells[i].key.slice(0)));
        }
    }

    var diagram = new Diagram(source_boundary, nCells);
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
        if (matched_diagram.nCells[0].id === this.nCells[0].id) {
            return [
                []
            ];
        }
        // Returns false if a match has not been found
        return [];
    }

    // This is the base platform for finding each match, it will be rewritten once the matches beginning at the particular height are investigated
    var intermediate_boundary = this.source.copy();

    // The maximum number of matches that can possibly be found
    var loopCount = this.nCells.length - matched_diagram.nCells.length + 1;

    for (var i = 0; i < loopCount; i++) { // i  is the number of the platform where the match is found

        var current_match = new Array();

        // We anchor matches by recursively matching the boundary of the matched diagram and this diagram
        var boundary_matches = intermediate_boundary.enumerate(matched_diagram.source);

        if (matched_diagram.nCells.length === 0) {
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
                    if (matched_diagram.nCells.length != 0) {
                        offset = matched_diagram.getCoordinates(matched_diagram.nCells[0])[k];
                    }
                    if (this.getCoordinates(this.nCells[i])[k] != boundary_matches[j][k] + offset) {
                        break;
                    }
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
                intermediate_boundary.rewrite(this.nCells[i]);
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
            var matches_needed = matched_diagram.nCells.length;
            var matches_found = 0;
            var x_offset = 0;
            while (matches_found < matches_needed) {
                //for (var j = 0; j < matched_diagram.nCells.length; j++) {

                // If we've gone past the end of the diagram, then we've failed to find a match
                if (i + matches_found + adjustments.length == this.nCells.length) {
                    current_match = null;
                    break;
                }

                var cell = this.nCells[i + matches_found + adjustments.length];

                var adjustment_needed = false;

                if (matched_diagram.nCells[matches_found].id != cell.id) {
                    // It's not the right cell, so to have a hope we'll have to interchange it out of the way
                    adjustment_needed = true;
                } else {
                    var coordinates = matched_diagram.getCoordinates(matched_diagram.nCells[matches_found]);
                    for (var k = 0; k < coordinates.length; k++) {
                        if (coordinates[k] + (loose ? x_offset : 0) != this.getCoordinates(cell)[k] - current_match[k]) {
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
                        var last_source = cell.coordinates[0] + rewrite.source.nCells.length;
                        var on_left = (last_source <= current_match[0] + x_offset);
                        var first_source = cell.coordinates[0];
                        var on_right = (first_source >= current_match[0] + x_offset + matched_diagram_shape[matches_found]);
                        if (on_left) {
                            adjustments.push({
                                height: matches_found + adjustments.length,
                                side: 'left',
                                id: cell.id
                            });
                            x_offset += rewrite.target.nCells.length - rewrite.source.nCells.length;
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
            for (var j = 0; j < matched_diagram.nCells.length; j++) {
                if (matched_diagram.nCells[j].id != this.nCells[i + j].id) {
                    current_match = null;
                    break;
                }
                if (matched_diagram.getCoordinates(matched_diagram.nCells[j]).length !=
                    this.getCoordinates(this.nCells[i + j]).length) {
                    console.log("enumerate - strange condition triggered");
                    current_match = null;
                    break;
                }
                else {
                    for (var k = 0; k < matched_diagram.getCoordinates(matched_diagram.nCells[j]).length; k++) {
                        if (matched_diagram.getCoordinates(matched_diagram.nCells[j])[k] !=
                            this.getCoordinates(this.nCells[i + j])[k] - current_match[k]) {
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
        intermediate_boundary.rewrite(this.nCells[i]);
    }

    // For a 2-diagram, record data about match locations to enable suppression of equivalent rewrites.
    // Only applies for 2-diagrams, when the matched diagram is an identity.
    if ((this.getDimension() == 2) && (matched_diagram.nCells.length == 0)) {
        var length = matched_diagram.source.nCells.length;
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
            var previous_vertex = this.nCells[height - 1].id;
            var previous_generator = gProject.signature.getGenerator(previous_vertex);
            var previous_vertex_first_target = this.nCells[height - 1].coordinates[0];
            var previous_vertex_last_target = previous_vertex_first_target + previous_generator.target.nCells.length;

            // Is this match blocked by the preceding vertex?
            var equivalent_matches = [];
            if (previous_vertex_last_target <= match[0]) {
                // Not blocked, previous vertex is to the left
                equivalent_matches.push([
                    match[0] - previous_generator.target.nCells.length + previous_generator.source.nCells.length,
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

    return matches;
};

// Attaches the given cell to the diagram, via the specified boundary path. 
Diagram.prototype.attach = function(cell, boundary/*, bounds*/, reversible) {
    
    if (reversible == undefined) reversible = false;
    
    // bleurgh
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
    if (boundary.depth > 1) { // attached_diagram.nCells.length = 0
        if (boundary.type == 's') {
            for (var i = 0; i < this.nCells.length; i++) {
                this.nCells[i].coordinates[this.nCells[i].coordinates.length - boundary.depth + 1]++;
                if(this.nCells[i].key != undefined) {
                    this.nCells[i].key[this.nCells[i].key.length - boundary.depth + 1]++;
                }
            }
        }
        this.source.attach(cell, {type: boundary.type, depth: boundary.depth - 1}, reversible);
        return;
    }

    //if (cell.id.is_interchanger()) {
    if (reversible) {
        var cell_index;
        if (boundary.type == 's') {
            var inverse_cell = this.source.getInverseCell(cell);
            this.source.rewrite(cell);
            this.nCells.unshift(inverse_cell);
            cell_index = 0;
        } else {
            this.nCells.push(cell);
            cell_index = this.nCells.length - 1;
        }
        var final_cell = this.nCells[cell_index];
        
        // Make sure the attached cell has correct coordinates
        if (cell.id.is_interchanger()) {
            this.nCells[cell_index].coordinates = this.getSlice(cell_index).getInterchangerCoordinates(final_cell.id, final_cell.key);
        }
    } else {
        if (boundary.type == 's') {
            // Rewrite the source in reverse
            this.source.rewrite(cell, true);
            this.nCells.unshift(cell);
        } else {
            this.nCells.push(cell);
        }
    }

};

/*
    Boosts this n-diagram, to be an identity (n+1)-diagram
*/
Diagram.prototype.boost = function() {

    var nCells = new Array();
    var diagram_copy = this.copy();
    this.source = diagram_copy;
    this.nCells = nCells;
    this.dimension++;
};

/* 
    Returns the full sizes of all the slices of the diagram
*/
Diagram.prototype.getFullDimensions = function() {
    if (this.getDimension() == 0) {
        return [];
    } else if (this.getDimension() == 1) {
        return this.nCells.length;
    }

    var full_dimensions = [this.source.getFullDimensions()];
    var platform = this.source.copy();
    for (var i = 0; i < this.nCells.length; i++) {
        platform.rewrite(this.nCells[i]);
        full_dimensions.push(platform.getFullDimensions());
    }
    //return [this.nCells.length].concat(this.source.getFullDimensions());
    return full_dimensions;
};


Diagram.prototype.setCoordinates = function(nCell, position, new_coordinates) {
    nCell.coordinates[position] = new_coordinates;
};


/*
    Given a generator, returns its list of coordinates in the form of an array
*/
Diagram.prototype.getCoordinates = function(nCell) {
    return nCell.coordinates;
};

/*
    Given a coordinate of a generator, returns its list of source elements
*/
Diagram.prototype.getNCellSource = function(x) {

    if (this.nCells[x].id.substr(0, 3) === 'Int') {
        var temp_diag = this.getSlice(x);
        return temp_diag.atomicInterchangerSource(this.nCells[x].id, this.nCells[x].coordinates);
    } else {
        var g = gProject.signature.getGenerator(this.nCells[x].id);
        return g.source.nCells;
    }

};

/*
    Given a coordinate of a generator, returns its list of target elements
*/
Diagram.prototype.getNCellTarget = function(x) {

    if (this.nCells[x].id.substr(0, 3) === 'Int') {
        var temp_diag = this.getSlice(x);
        return temp_diag.atomicInterchangerTarget(this.nCells[x].id, this.nCells[x].coordinates);
    } else {
        var g = gProject.signature.getGenerator(this.nCells[x].id);
        return g.target.nCells;
    }

};

// Convert an internal coordinate to {boundary: {type, depth}, coordinates}, by identifying
// coordinates in slices adjacent to the boundary as being in that boundary.
// ASSUMES COORDINATES ARE FIRST-INDEX-FIRST
Diagram.prototype.getBoundaryCoordinates = function(internal, fakeheight) {
    if (fakeheight == undefined) fakeheight = false;
    var sub;
    if (internal.length == 1) {
        sub = {boundary: null, coordinates: []};
    } else {
        var slice = this.getSlice(internal[0]);
        var sub = slice.getBoundaryCoordinates(internal.slice(1));
    }
    
    var in_source = internal.length > 1 && internal[0] == 0;
    var in_target = internal.length > 1 && internal[0] >= Math.max(this.nCells.length, fakeheight? 1 : 0);
    if (sub.boundary != null) {
        sub.boundary.depth ++;
    } else if (in_target) {
        // We're in the target, and we were previously in the interior
        sub.boundary = {type: 't', depth: 1};
    } else if (in_source) {
        // We're in the source, and we were previously in the interior
        sub.boundary = {type: 's', depth: 1};
    } else {
        // Not in the source or the target, previously in the interior
        sub.coordinates.unshift(internal[0]);
    }
    return sub;
}
/*
Diagram.prototype.getBoundaryCoordinate = function(internal) {
    var location = {
        boundary_path: '',
        coordinates: internal.slice()
    };
    var slice = this.copy();
    while (location.coordinates[0] == 0 || location.coordinates[0] == slice.nCells.length) {
        if (location.coordinates.length == 1) break;
        if (location.coordinates[0] == slice.nCells.length) {
            slice = this.getTargetBoundary();
            location.boundary_path += 't';
        } else if (location.coordinates[0] == 0) {
            slice = this.getSourceBoundary();
            location.boundary_path += 's';
        }
        location.coordinates.shift();
    }
    return location;
}
*/

// Find the first colour that appears in the diagram
Diagram.prototype.getFirstColour = function() {
    var d = this;
    while (d.nCells.length == 0) {
        d = d.getSourceBoundary();
    }
    var id = d.nCells[0].id;
    return gProject.getColour(id);
}


Diagram.prototype.getSliceBoundingBox = function(level) {
    return this.getSlice(level).getBoundingBox(this.nCells[level]);
    /*
        var nCell = this.nCells[level];
        if (nCell.isInterchanger()) return this.getSlice(level).getInterchangerBoundingBox(nCell.id, nCell.key);
        var box = {
            min: nCell.coordinates.concat([level])
        };
        var generator_bbox = gProject.signature.getGenerator(nCell.id).getBoundingBox(); 
        box.max = box.min.vector_add(generator_bbox.max);
        return box;
    */
}

Diagram.prototype.getBoundingBox = function(nCell) {
    //if (param == undefined) debugger;
    if (nCell.id == undefined) debugger;
    if (nCell.id.is_interchanger()) return this.getInterchangerBoundingBox(nCell.id, nCell.key);
    var box = {
        min: nCell.coordinates.slice()
    };
    var generator_bbox = gProject.signature.getGenerator(nCell.id).getBoundingBox();
    box.max = box.min.vector_add(generator_bbox.max);
    return box;
}

Diagram.prototype.getLengthsAtSource = function() {
    if (this.getDimension() == 0) return [];
    if (this.getDimension() == 1) return [this.nCells.length];
    return this.getSourceBoundary().getLengthsAtSource().concat([this.nCells.length]);
}

Diagram.prototype.source_size = function(level) {
    var nCell = this.nCells[level];
    if (nCell.id.substr(0, 3) === 'Int') {
        return this.getSlice(level).getInterchangerBoundingBox(nCell.id, nCell.key).last();
    } else {
        return nCell.source_size();
    }
}

Diagram.prototype.target_size = function(level) {
    var nCell = this.nCells[level];
    if (nCell.id.substr(0, 3) === 'Int') {
        return this.getSlice(level).rewritePasteData(nCell.id, nCell.key).length;
    } else {
        return nCell.target_size();
    }
};

// Identify separation of parts of a diagram
Diagram.prototype.separation = function(c1, c2) {
    var d1 = this.dimension + 1 - c1.length;
    var d2 = this.dimension + 1 - c2.length;
    if (d1 == d2) {
        // ... ?
    } else if (d1 > d2) {
        return this.wellSeparated(c2, c1);
    }

    /* CAN ASSUME d1 < d2 */

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
    //var min = c2bbox.min[0];
    //var max = c2bbox.max[0];
    //var level = c2bbox.min.last();
    //var start_height = Math.min(c2bbox.min.last(), c1coord);
    //var final_height = Math.max(c2bbox.min.last(), c1coord);
    var start_height, final_height, min, max, target_min, target_max;
    if (c2bbox.min.last() < c1coord) {
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
            /*
            if (target_max <= min) return -1;
            if (target_min >= max) return +1;
            return 0;
            */
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
            max = Math.max(max + delta, h_bbox.min.last() + h_slice.target_size(h));
        }
    }
}

// Construct the inverse to the specified cell, for the current diagram
Diagram.prototype.getInverseCell = function(cell) {
    
    // Get the new ID
    var new_id;
    if (cell.id.last() == 'I') {
        new_id = cell.id.substr(0, cell.id.length-1);
    } else {
        new_id = cell.id + 'I';
    }

    // Get the new key and coordinates
    var new_key;
    var new_coordinates;
    if (cell.key == undefined) {
        new_key = null;
        new_coordinates = cell.coordinates;
    } else {
        new_key = this.getInverseKey(cell.id, cell.key);
        new_coordinates = this.getInterchangerCoordinates(new_id, new_key);
    }

    // Build the new NCell    
    return new NCell(new_id, new_coordinates, new_key);
}