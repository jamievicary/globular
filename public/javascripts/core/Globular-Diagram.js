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
    }
    else {
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

    if (k > this.nCells.length) {
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

    if (reverse === undefined) reverse = false;

    var source;
    var target;

    // Special code to deal with interchangers
    if (nCell.id.substr(0, 3) === 'Int'){
        /*
        if (reverse) {
            if (nCell.id.tail('I')){
                nCell.id = nCell.id.substr(0, nCell.id.length - 1);
                //== 'interchanger-right';
            }
            else {
                nCell.id = nCell.id + 'I';
            }
        }*/
        var rewrite = this.rewriteInterchanger(nCell);
        source = rewrite.source.copy();
        target = rewrite.target.copy();
    }
    else{
    // Info on the source and the target of the rewrite is retrieved from the signature here
        var rewrite = gProject.signature.getGenerator(nCell.id);
        if (reverse) {
            source = rewrite.target.copy();
            target = rewrite.source.copy();
        }
        else {
            source = rewrite.source.copy();
            target = rewrite.target.copy();
        }
    }
    

    var source_size = source.nCells.length;

    // Remove cells in the source of the rewrite
    
    var insert_position
    if (nCell.id.tail('LI') || nCell.id.tail('RI')){
        insert_position = nCell.coordinates.last() - this.source_size(nCell.coordinates.last());   
    }
    else{
        insert_position = nCell.coordinates.last();   
    }
    this.nCells.splice(insert_position, source_size);
    for (var i = 0; i < target.nCells.length; i++) {

        /* 
        In the process of inserting n-cells in the target of the rewrite into the list of nCells, we need to shift
        the inclusion information by the location of the rewrite in the overall diagram
        */
        for (var j = 0; j < target.nCells[i].coordinates.length; j++) {
            target.nCells[i].coordinates[j] += nCell.coordinates[j];
        }
        this.nCells.splice(insert_position + i, 0, target.nCells[i]);
    }
    // Due to globularity conditions, we can never remove or add a generator to the source boundary

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
    }
    else {
        source_boundary = this.source.copy();
    }

    var nCells = new Array();
    for (var i = 0; i < this.nCells.length; i++) {
        nCells.push(new NCell(this.nCells[i].id, this.nCells[i].coordinates.slice(0)));
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
        }

        else {
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
            }
            else {
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
                }
                else {
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
                        }
                        else
                        if (on_right) {
                            adjustments.push({
                                height: matches_found + adjustments.length,
                                side: 'right',
                                id: cell.id
                            });
                        }
                        else {
                            // Loose matching has failed
                            current_match = null;
                            break;
                        }
                    }
                    else {
                        // Not allowed to do loose matching, so fail.
                        current_match = null;
                        break;
                    }
                }
                else {
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
            }
            else {
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


/*
    Attaches the attached diagram to this diagram. 
    
    As input takes the diagram to be attached, an array boundary path determining whether to attach to the source or to the target
    and bounds specifying where exactly the attachment should take place and how the n-cell in the generator fits with other n-cells in
    this diagram.
    
    An assumption that we are making is that the attached n-diagram is a generator (== contains exactly one n-cell).
    
    The procedure recursively attaches to the boundary (this is enforced to only happen when there are no n-cells in the attached diagram)
    or the attached diagram is of a lower dimension and has not been boosted up (this would have been unnecessary, as he we would have
    just removed the identity layers that have been added on top of the diagram)
*/
Diagram.prototype.attach = function(attached_diagram, boundary_path, bounds) {

    // No nCells to add on this level, so we recursively attach to the boundary
    if (boundary_path.length != 1) { // attached_diagram.nCells.length = 0
        var temp_path = boundary_path.slice(1);
        var temp_bounds = bounds; //.slice(1);

        // If attaching to the source, need to pad all other attachments
        if (temp_path[0] === 's') {
            for (var i = 0; i < this.nCells.length; i++) {
                this.nCells[i].coordinates[this.nCells[i].coordinates.length - temp_path.length]++;
            }
        }

        // The attached diagram is not boosted up, so we do not need to call the function on its boundary
        this.source.attach(attached_diagram, temp_path, temp_bounds);
        return;
    }
    else {
        var boundary_boolean = boundary_path[0];
    }

    // The attached cell is prepared according to the match that has been found and inserted into the nCells array

    var attached_nCell = attached_diagram.nCells[0];

    if (this.dimension != attached_diagram.dimension && attached_nCell.id.substr(0,3) != "Int") {
        console.log("Cannot attach - dimensions do not match");
        return;
    }

    var new_id = attached_nCell.id 
    var new_coordinates = attached_nCell.coordinates.slice(0);
    if (attached_nCell.id.substr(0, 3) != "Int") {
        attached_nCell.coordinates = bounds;
        new_coordinates = bounds;
        new_id = attached_nCell.id;
    }
    else if(boundary_boolean === 's'){
        if (new_id.tail('RI') || new_id.tail('LI')){
            new_coordinates.increment_last(-this.getSourceBoundary().source_size(new_coordinates.last()));   
        }
        if (new_id.tail('R') || new_id.tail('L')){
            new_coordinates.increment_last(this.getSourceBoundary().source_size(new_coordinates.last()));   
        }
        if (new_id.tail('I')){
                new_id = new_id.substr(0, new_id.length - 1);
            }
            else {
                new_id = new_id + 'I';
            }
    }

    var k = 0;
    if (boundary_boolean === 't') {
        k = this.nCells.length;
    }
    this.nCells.splice(k, 0, new NCell(new_id, new_coordinates));

    /*
        If necessary the source is rewritten.
        To specify a rewrite of an n-diagram, we need n bounds, to specify attachment we just need n-1. 
        The rewrite of the boundary is specified exactly by the attachment bounds
    */

    if (boundary_boolean === 's') {
        this.source.rewrite(attached_nCell, true);
    }

    // No need to rewrite the target, as this is not stored
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
    }
    else if (this.getDimension() == 1) {
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
    
    if(this.nCells[x].id.substr(0,3) === 'Int'){
        var temp_diag = this.getSlice(x);
        return temp_diag.atomicInterchangerSource(this.nCells[x].id, this.nCells[x].coordinates);
    }
    else{
        var g = gProject.signature.getGenerator(this.nCells[x].id);
        return g.source.nCells;
    }
    
};

/*
    Given a coordinate of a generator, returns its list of target elements
*/
Diagram.prototype.getNCellTarget = function(x) {
    
    if(this.nCells[x].id.substr(0,3) === 'Int'){
        var temp_diag = this.getSlice(x);
        return temp_diag.atomicInterchangerTarget(this.nCells[x].id, this.nCells[x].coordinates);
    }
    else{
        var g = gProject.signature.getGenerator(this.nCells[x].id);
        return g.target.nCells;
    }
    
};

// Convert an internal coordinate to {boundarypath, coordinate}, by identifying
// coordinates in slices adjacent to the boundary as being in that boundary.
Diagram.prototype.getBoundaryCoordinate = function(internal) {
    var location = {boundary_path: '', coordinates: internal.slice()};
    var slice = this.copy();
    while (location.coordinates[0] == 0 || location.coordinates[0] == slice.nCells.length) {
        if (location.coordinates.length == 1) break;
        if (location.coordinates[0] == slice.nCells.length) {
            slice = this.getTargetBoundary();
            location.boundary_path += 't';
        }
        else if (location.coordinates[0] == 0) {
            slice = this.getSourceBoundary();
            location.boundary_path += 's';
        }
        location.coordinates.shift();
    }
    return location;
}

// Find the first colour that appears in the diagram
Diagram.prototype.getFirstColour = function() {
    var d = this;
    while (d.nCells.length == 0) {
        d = d.getSourceBoundary();
    }
    var id = d.nCells[0].id;
    return gProject.getColour(id);
}