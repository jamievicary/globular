"use strict";

/*
    Diagram class
*/

function Diagram(source, generators) {
    if (source === undefined) return;

    this.source = source;
    this.generators = generators;

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
    by systematic application of single cell rewrites based on the list of generators of the diagram
*/
Diagram.prototype.getTargetBoundary = function() {
    if (this.source === null) {
        return null;
    }

    var target_boundary = this.source.copy();
    for (var i = 0; i < this.generators.length; i++) {
        target_boundary.rewrite(this.generators[i]);

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

    if (k > this.generators.length) {
        return null;
    }

    var slice = this.source.copy();
    for (var i = 0; i < k; i++) {
        slice.rewrite(this.generators[i]);
    }

    return slice;
};


/*
    Returns true if this diagram and the matched diagram are identical, i.e. they have the same set of generators, composed
    in the same way. This is checked recursively by looking at the source boundary too. Otherwise, returns false.
*/
Diagram.prototype.diagramBijection = function(matched_diagram) {

    if (this.getDimension() != matched_diagram.getDimension()) {
        return false;
    }

    if (this.generators.length != matched_diagram.generators.length) {
        return false;
    }

    for (var i = 0; i < this.generators.length; i++) {
        if (this.generators[i].id != matched_diagram.generators[i].id) {
            return false;
        }
        for (var k = 0; k < this.generators[i].coordinate.length; k++) {
            if (this.generators[i].coordinate[k] != matched_diagram.generators[i].coordinate[k]) {
                if (this.generators[i].coordinate.length != matched_diagram.generators[i].coordinate.length) {
                    return false;
                }

            }
        }
        for (var k = 0; k < this.generators[i].coordinate.length; k++) {
            if (this.generators[i].coordinate[k] != matched_diagram.generators[i].coordinate[k]) {
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
    entry in the list of generators - this contains two parameters, id: the name of the rewrite cell in the signature and 
    coordinate: an array with information on how to attach the given cell. In this context, id tells us what rewrite to apply
    and coordinate tells us which exact part of the diagram to apply the rewrite to.
*/
Diagram.prototype.rewrite = function(nCell, reverse) {

    if (reverse === undefined) reverse = false;

    // Special code to deal with interchangers
    if ((nCell.id === 'interchanger-L') || (nCell.id === 'interchanger-R')) {
        this.rewriteInterchanger(nCell);
        return;
    }

    // Info on the source and the target of the rewrite is retrieved from the signature here
    var rewrite = gProject.signature.getGenerator(nCell.id);

    var source;
    var target;
    if (reverse) {
        source = rewrite.target;
        target = rewrite.source;
    }
    else {
        source = rewrite.source;
        target = rewrite.target;
    }
    var source_size = source.generators.length;

    // Remove cells in the source of the rewrite
    var insert_position = nCell.coordinate[nCell.coordinate.length - 1];
    this.generators.splice(insert_position, source_size);
    for (var i = 0; i < target.generators.length; i++) {

        /* 
        In the process of inserting n-cells in the target of the rewrite into the list of generators, we need to shift
        the inclusion information by the location of the rewrite in the overall diagram
        */
        for (var j = 0; j < target.generators[i].coordinate.length; j++) {
            target.generators[i].coordinate[j] += nCell.coordinate[j];
        }
        this.generators.splice(insert_position + i, 0, target.generators[i]);
    }
    // Due to globularity conditions, we can never remove or add a generator to the source boundary

    return this;
}


/*
    Returns a copy of this diagram. This is obtained by recursively copying the source boundary and then 
    copying the set of n-generators along with the information on how they are attached to each other
*/
Diagram.prototype.copy = function() {

    var source_boundary;
    if (this.source === null) {
        source_boundary = null;
    }
    else {
        source_boundary = this.source.copy();
    }

    var generators = new Array();
    for (var i = 0; i < this.generators.length; i++) {
        generators.push({
            id: this.generators[i].id,
            coordinate: this.generators[i].coordinate.slice(0)
        });
    }

    var diagram = new Diagram(source_boundary, generators);
    return diagram;
};

/*
    Returns the list of all the ways in which the matched_diagram fits into this diagram. If there are no matches - returns false
*/
Diagram.prototype.enumerate = function(matched_diagram) {
    var matches = new Array();

    // For a match of 0-diagrams, returns an empty match, as there are no boundaries to be passed
    if (this.dimension === 0) {
        if (matched_diagram.generators[0].id === this.generators[0].id) {
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
    var loopCount = this.generators.length - matched_diagram.generators.length + 1;

    for (var i = 0; i < loopCount; i++) { // i  is the number of the platform where the match is found

        var current_match = new Array();

        // We anchor matches by recursively matching the boundary of the matched diagram and this diagram
        var boundary_matches = intermediate_boundary.enumerate(matched_diagram.source);

        // If there are no boundary matches, no point in performing any more operations - immediately returns false
        /* This causes us to forget about some matches in the 'matches' array
        if(boundary_matches.length === 0){
            return [];
        }
        */
        /*
        if(boundary_matches.length === 1 && boundary_matches[0].length === 0){
            current_match.push(i)
        }
        */

        if (matched_diagram.generators.length === 0) {
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
            for (var j = 0; j < boundary_matches.length; j++) {
                var k;
                for (k = 0; k < boundary_matches[j].length; k++) {

                    // Generator attachment data shifted by the offset created by the newly added generator
                    var offset = 0;
                    if (matched_diagram.generators.length != 0) {
                        offset = matched_diagram.generators[0].coordinate[k]
                    }
                    if (this.generators[i].coordinate[k] != boundary_matches[j][k] + offset) {
                        break;
                    }
                }
                if (k === boundary_matches[j].length) {
                    current_match = boundary_matches[j].slice(0);
                    break;
                }
            }
            if (j === boundary_matches.length) {
                // We haven't found a match
                // Go to the next platform
                intermediate_boundary.rewrite(this.generators[i]);
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
            for (var j = 0; j < matched_diagram.generators.length; j++) {
                if (matched_diagram.generators[j].id != this.generators[i + j].id) {
                    current_match = null;
                    break;
                }

                if (matched_diagram.generators[j].coordinate.length != this.generators[i + j].coordinate.length) {
                    current_match = null;
                }
                else {
                    for (var k = 0; k < matched_diagram.generators[j].coordinate.length; k++) {
                        if (matched_diagram.generators[j].coordinate[k] != this.generators[i + j].coordinate[k] - current_match[k]) {
                            current_match = null;
                        }
                    }
                }

            }

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
        intermediate_boundary.rewrite(this.generators[i]);
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

    // No generators to add on this level, so we recursively attach to the boundary
    if (boundary_path.length != 1) { // attached_diagram.generators.length = 0
        var temp_path = boundary_path.slice(1);
        var temp_bounds = bounds; //.slice(1);

        // If attaching to the source, need to pad all other attachments
        if (temp_path[0] === 's') {
            for (var i = 0; i < this.generators.length; i++) {
                this.generators[i].coordinate[this.generators[i].coordinate.length - temp_path.length]++;
                /*
                for(var j = 0; j < this.generators[i].coordinate.length; j++){
                    this.generators[i].coordinate[j]++;
                }
                */
            }
        }

        // the attached diagram is not boosted up, so we do not need to call the function on its boundary
        this.source.attach(attached_diagram, temp_path, temp_bounds);
        return;
    }
    else {
        var boundary_boolean = boundary_path[0];
    }

    // The attached cell is prepared according to the match that has been found and inserted into the generators array

    var attached_nCell = attached_diagram.generators[0];

    if ((this.dimension != attached_diagram.dimension) && (attached_nCell.id != "interchanger-R") && (attached_nCell.id != 'interchanger-L')) {
        console.log("Cannot attach - dimensions do not match");
        return;
    }


    if (attached_nCell.id.substr(0, 12) != "interchanger") {
        attached_nCell.coordinate = bounds;
    }

    var k = 0;
    if (boundary_boolean === 't') {
        k = this.generators.length;
    }
    this.generators.splice(k, 0, attached_nCell);

    /*
        If necessary the source is rewritten.
        To specify a rewrite of an n-diagram, we need n bounds, to specify attachment we just need n-1. 
        The rewrite of the boundary is specified exactly by the attachment bounds
    */
    if (boundary_boolean === 's') {
        if (attached_nCell.id.substr(0, 12) === "interchanger") {
            this.source.rewriteInterchanger(attached_nCell.level[1], attached_nCell.level[0]);
        }
        else {
            var rewriteCell = {
                id: attached_diagram.generators[0].id,
                coordinate: bounds
            };
            this.source.rewrite(rewriteCell, true);
        }
    }
    // No need to rewrite the target, as this will implicitly be done when the target is explicitly calculated
};

/*
    Boosts this n-diagram, to be an identity (n+1)-diagram
*/
Diagram.prototype.boost = function() {

    var generators = new Array();
    var diagram_copy = this.copy();
    this.source = diagram_copy;
    this.generators = generators;
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
        return this.generators.length;
    }

    var full_dimensions = [this.source.getFullDimensions()];
    var platform = this.source.copy();
    for (var i = 0; i < this.generators.length; i++) {
        platform.rewrite(this.generators[i]);
        full_dimensions.push(platform.getFullDimensions());
    }
    //return [this.generators.length].concat(this.source.getFullDimensions());
    return full_dimensions;
};

Diagram.prototype.getInterchangersOLD = function() {

    var t0 = performance.now();
    var interchangers = new Array();
    for (var i = 0; i < this.generators.length - 1; i++) {
        if (this.interchangerAllowed(i, i + 1)) {
            interchangers.push({
                id: "interchanger",
                level: [i, i + 1],
                tension_change: this.computeTensionChange(i, i + 1)
            });
        }
        if (this.interchangerAllowed(i + 1, i)) {
            interchangers.push({
                id: "interchanger",
                level: [i + 1, i],
                tension_change: this.computeTensionChange(i + 1, i)
            });
        }
    }
    console.log("Diagram.getInterchangers: " + parseInt(performance.now() - t0) + "ms");
    return interchangers;
}

Diagram.prototype.getInterchangers = function() {

    var t0 = performance.now();
    var interchangers = new Array();
    for (var i = 0; i < this.generators.length - 1; i++) {
        if (this.interchangerAllowed({id: 'interchanger-L', coordinate: [i]})) {
            interchangers.push({
                id: "interchanger-L",
                coordinate: [i],
                tension_change: 0 //this.computeTensionChange(i, i + 1)
            });
        }
        if (this.interchangerAllowed({id: 'interchanger-R', coordinate: [i]})) {
            interchangers.push({
                id: "interchanger-R",
                coordinate: [i],
                tension_change: 0 //this.computeTensionChange(i + 1, i)
            });
        }
    }
    //console.log("Diagram.getInterchangers: " + parseInt(performance.now() - t0) + "ms");
    return interchangers;
}

Diagram.prototype.computeTensionChange = function(h1, h2) {
    var gen1 = this.generators[h1]; //index of array is the height; array generators doesn't actually contain generator
    var gen2 = this.generators[h2];
    var gen1_input = gProject.signature.getGenerator(gen1.id).source.generators.length; //these will be diagrams
    var gen2_input = gProject.signature.getGenerator(gen2.id).source.generators.length;
    var gen1_output = gProject.signature.getGenerator(gen1.id).target.generators.length;
    var gen2_output = gProject.signature.getGenerator(gen2.id).target.generators.length;
    if (h1 > h2) {
        gen1_input *= -1;
        gen2_output *= -1;
    }
    else {
        gen1_output *= -1;
        gen2_input *= -1;
    }
    return gen1_input + gen2_input + gen1_output + gen2_output;
}

Diagram.prototype.interchangerAllowedOLD = function(height_left, height_right) {

    if (this.getDimension() != 2) return false;
    if (height_right == height_left) return false;
    if (height_left < 0) return false;
    if (height_left > this.generators.length) return false;
    if (height_right < 0) return false;
    if (height_right > this.generators.length) return false;

    // Check that cells are adjacent
    if (Math.abs(height_left - height_right) != 1) {
        return false;
    }

    // Get data about rewrites
    var g_left = this.generators[height_left];
    var r_left = gProject.signature.getGenerator(g_left.id);
    var g_right = this.generators[height_right];
    var r_right = gProject.signature.getGenerator(g_right.id);

    // Check that cells are able to be interchanged
    if (height_left < height_right) {
        return (g_left.coordinate[0] + r_left.target.generators.length <= g_right.coordinate[0]);
    }
    else {
        return (g_left.coordinate[0] + r_left.source.generators.length <= g_right.coordinate[0]);
    }
}

// NEW SCHEME - check if interchanger is allowed for this diagram
Diagram.prototype.interchangerAllowed = function(cell) {
    
    var height = cell.coordinate[0];
    var type = cell.id;

    if (this.getDimension() != 2) return false;
    if (height < 0) return false;
    if (height >= this.generators.length - 1) return false;

    // Get data about rewrites
    var g1 = this.generators[height];
    var r1 = gProject.signature.getGenerator(g1.id);
    var g2 = this.generators[height + 1];
    var r2 = gProject.signature.getGenerator(g2.id);

    // Check that cells are able to be interchanged
    if (type == 'interchanger-L') {
        return (g1.coordinate[0] + r1.target.generators.length <= g2.coordinate[0]);
    }
    else if (type == 'interchanger-R') {
        return (g1.coordinate[0] >= g2.coordinate[0] + r2.source.generators.length);
    } else {
        alert ("Illegal type passed to interchangerAllowed");
        return false;
    }
}

Diagram.prototype.rewriteInterchangerOLD = function(height_left, height_right) {

    if (!this.interchangerAllowed(height_left, height_right)) {
        alert("Illegal input passed to rewriteInterchanger");
        return;
    }

    // Get data about rewrites
    var g_left = this.generators[height_left];
    var r_left = gProject.signature.getGenerator(g_left.id);
    var g_right = this.generators[height_right];
    var r_right = gProject.signature.getGenerator(g_right.id);

    var g_left_new_position, g_right_new_position;
    if (height_left < height_right) {
        g_left_new_position = g_left.coordinate[0];
        g_right_new_position = g_right.coordinate[0] + r_left.source.generators.length - r_left.target.generators.length;
    }
    else {
        g_left_new_position = g_left.coordinate[0];
        g_right_new_position = g_right.coordinate[0] - r_left.source.generators.length + r_left.target.generators.length;
    }

    // Rewrite the diagram
    this.generators[height_left].coordinate[0] = g_left_new_position;
    this.generators[height_right].coordinate[0] = g_right_new_position;
    var temp = this.generators[height_left];
    this.generators[height_left] = this.generators[height_right];
    this.generators[height_right] = temp;

}

// NEW SYSTEM - Apply an interchanger at a given height
Diagram.prototype.rewriteInterchanger = function(cell) {

    if (!this.interchangerAllowed(cell)) {
        alert("Illegal data passed to rewriteInterchanger");
        return;
    }

    // Get data about rewrites
    var height = cell.coordinate[0];
    var type = cell.id;
    var g1 = this.generators[height];
    var r1 = gProject.signature.getGenerator(g1.id);
    var g2 = this.generators[height + 1];
    var r2 = gProject.signature.getGenerator(g2.id);

    var g1_new_position, g2_new_position;
    if (type == 'interchanger-L') {
        g1_new_position = g1.coordinate[0];
        g2_new_position = g2.coordinate[0] + r1.source.generators.length - r1.target.generators.length;
    }
    else if (type == 'interchanger-R') {
        g1_new_position = g1.coordinate[0] - r2.source.generators.length + r2.target.generators.length;
        g2_new_position = g2.coordinate[0];
    } else {
        alert ("Illegal type passed to rewriteInterchanger")
    }

    // Rewrite the diagram
    this.generators[height].coordinate[0] = g1_new_position;
    this.generators[height + 1].coordinate[0] = g2_new_position;
    var temp = this.generators[height];
    this.generators[height] = this.generators[height + 1];
    this.generators[height + 1] = temp;

}
