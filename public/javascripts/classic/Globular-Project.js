"use strict";

/*
    Project class
*/

/*
    Constructs a new project. If the argument is undefined, we are constructing
    this in the destringify routine, so we should do nothing. If it's empty,
    construct an empty project. Otherwise, destringify.
*/
function Project(s) {
    if (s === undefined) {
        return;
    }
    if (s === "") {
        this.mapDiagram = null;
        this.signature = new Signature(null);

        // Holds an association between individual cell names in the signature and the colours assigned by the user (which can be non-unique)
        this.dataList = new Hashtable();

        // We pass a fresh newly created generator with a fresh name
        this.addZeroCell();

        // Hold a MapDiagram intended to be a source/target of a new rule. Kept here temporarily so that the target/source of the rule could be constructed
        this.cacheSourceTarget = null;
        return;
    }

    // Rebuild the project from the given string
    globular_destringify(s, this);
};

Project.prototype.getType = function() {
    return 'Project';
};

// This method returns the diagram currently associated with this project, this is used to maintain a complete separation between the front end and the core
Project.prototype.getMapDiagram = function() {
    return this.mapDiagram;
};

// This method returns the signature currently associated with this project, this is used to maintain a complete separation between the front end and the core
Project.prototype.getSignature = function() {
    return this.signature;
};

// Return an array of array of Data objects listing every generator in the signature
Project.prototype.listGenerators = function() {
    return this.signature.getCells();
};

// Sets the front-end name of a generator to what the user wants
Project.prototype.setName = function(id, name) {
    var tempData = this.dataList.get(id);
    tempData.name = name;
    this.dataList.put(id, tempData);
    this.saveState();
};

// Gets the front-end name of a generator to what the user wants
Project.prototype.getName = function(id) {
    return this.dataList.get(id).name;
};

// Sets the front-end colour to what the user wants
Project.prototype.setColour = function(id, colour) {
    var tempData = this.dataList.get(id);
    tempData.colour = colour;
    this.dataList.put(id, tempData);
    this.saveState();
};

// Gets the front-end colour to what the user wants
Project.prototype.getColour = function(id) {
    return this.dataList.get(id).colour;
};


/* 
Takes a rule (generator) and a string describing how to get to an appropriate boundary of this diagram as arguments
Returns the list of all possible inclusion functions of the source of this generator into the diagram
*/
Project.prototype.matches = function(matchedDiagram, boundaryPath) {
    /* 
    If the degrees of this diagram and the matched diagram do not match, we boost the matched diagram so that they do
    This is a precondition for enumeration and matching
    */
    while (matchedDiagram.diagram.diagramSignature.n < this.mapDiagram.diagram.diagramSignature.n) {
        matchedDiagram.boost();
    }

    var diagramPointer = this.d;
    var matchedDiagramPointer = matchedDiagram;
    /*
    Depending on the user selection, we find matches within an appropriate boundary of this diagram
    The default selection is the diagram itself, i.e. boundaryPath = []
    */
    for (var i = 0; i < boundaryPath.length; i++) {
        if (boundaryPath[i] === 's') {
            diagramPointer = diagramPointer.diagram.sourceBoundary;
            matchedDiagramPointer = matchedDiagramPointer.diagram.targetBoundary;

        }
        else {
            diagramPointer = diagramPointer.diagram.targetBoundary;
            matchedDiagramPointer = matchedDiagramPointer.diagram.sourceBoundary;

        }
    }
    return diagramPointer.enumerate(matchedDiagramPointer);
};

/* 
Takes two arrays - an array of pre-computed matches between some matched diagram and this diagram, also an array of elements of this diagram
Only keeps the matches for which at least one value appears in the array of selected elements
*/
Project.prototype.limitMatches = function(matches, elements) {

    var validMatches = new Array();
    for (var i = 0; i < matches.length; i++) {
        var flag = false;
        matches[i].each(function(key, value) {
            for (var j = 0; j < elements.length; j++) {
                if (value === elements[j]) {
                    flag = true;
                }
            }
        }.bind(this));
        if (flag) {
            validMatches.push(matches[i]);
        }
    }
};

/*
    Takes a diagram that we want to attach, the path to the attachement boundary as arguments
    Updates this diagram to be the result of the attachment
*/
Project.prototype.attach = function(attachmentFlag, attachedDiagram, inclusionFunction, boundaryPath) {
    /*
    The attachment procedure could be rewritten so that the additional complexity arising from creating a copy of the source of the attached rewrite could be omitted
    This got created because of how the software was developed and because at the time when the attachment procedure was written it was not yet clear
    what will be the exact form of input provided by the front end.
    
    For now we leave it in the current form, as modifications to the attachment procedure would require modifying all the tests too
    */
    if (attachmentFlag) {
        this.mapDiagram = this.mapDiagram.attachWrapped(attachedDiagram, inclusionFunction, boundaryPath, true);
    }
    else {
        var rewriteSource = attachedDiagram.diagram.sourceBoundary.copy();
        rewriteSource.map = inclusionFunction;
        var rewriteTarget = attachedDiagram.diagram.targetBoundary.copy();
        rewriteTarget.extend(attachedDiagram.map);
        this.mapDiagram = this.mapDiagram.rewrite(rewriteSource, rewriteTarget);
    }
};


// Clear the main diagram
Project.prototype.clearDiagram = function() {
    $('div.cell-b-sect').empty();
    this.mapDiagram = null;
    this.renderDiagram();
    this.saveState();
}

// Take the identity on the main diagram
Project.prototype.takeIdentity = function() {
    if (this.mapDiagram == null) return;
    if (this.mapDiagram.getDimension() >= 2) {
        alert("Can't take the identity of a " + this.mapDiagram.getDimension().toString() + "-dimensional diagram");
        return;
    }

    this.mapDiagram.boost();
    this.renderDiagram();
}

/* 
    Depending on whether a source or a target have been already stored in memory, this procedure completes the rule with the diagram currently in workspace.
    If the dimensions match, an appropriate generator is added an an appropriate level (the second part handled internally by the Signature class).
    If none have been saved, it adds a 0-generator. For all these possible generators the internal name will be automatically added when the generator is created.
    Return true to indicate n-cells should be rerendered.
*/

Project.prototype.saveSourceTarget = function(boundary /* = 'source' or 'target' */ ) {

    // If we haven't stored any source/target data yet, then just save this
    if (this.cacheSourceTarget == null) {
        this.cacheSourceTarget = {};
        this.cacheSourceTarget[boundary] = this.mapDiagram;
        this.clearDiagram();
        return;
    }

    // Check whether we're replacing the cached source or target with a new one
    if (this.cacheSourceTarget[boundary] != null) {
        this.cacheSourceTarget[boundary] = this.mapDiagram;
        this.clearDiagram();
        return;
    }

    // Store the source and target information
    this.cacheSourceTarget[boundary] = this.mapDiagram;

    var source = this.cacheSourceTarget.source;
    var target = this.cacheSourceTarget.target;

    // Test dimensions
    if (source.getDimension() != target.getDimension()) {
        alert("Source and target must be the same dimension");
        this.cacheSourceTarget[boundary] = null;
        return true;
    }

    // Test globularity
    var sourceOfSource = source.diagram.sourceBoundary;
    var sourceOfTarget = target.diagram.sourceBoundary;
    var targetOfSource = source.diagram.targetBoundary;
    var targetOfTarget = target.diagram.targetBoundary;
    if (source.getDimension() != 0) { // globularity trivially satisfied for 0-diagrams
        if (!sourceOfSource.mapDiagramBijection(sourceOfTarget)) {
            alert("Source of source does not match source of target");
            this.cacheSourceTarget[boundary] = null;
            return true;
        }
        if (!targetOfSource.mapDiagramBijection(targetOfTarget)) {
            alert("Target of source does not match target of target");
            this.cacheSourceTarget[boundary] = null;
            return true;
        }
    }

    // Create the new generator using freshly named mapDiagrams
    //source.renameFresh(); 
    //target.renameFresh();

    var generator = new Generator(source, target);
    var d = generator.getDimension();
    while (this.signature.n < d) {
        this.signature = new Signature(this.signature);
    }
    this.signature.addGenerator(generator);

    // Make the diagram for the generator
    var tempMapDiagram = this.signature.createMapDiagram(generator.identifier);
    var colour;
    var d = source.getDimension() + 1;
    if (d == 1) {
        colour = '#000000';
    }
    else {
        colour = '#ffffff';
    }
    var data = new Data(generator.identifier, colour, tempMapDiagram, tempMapDiagram.diagram.diagramSignature.n);
    this.dataList.put(generator.identifier, data);
    this.diagram = new MapDiagram();

    // Re-render and save the new state
    this.renderNCells(d);
    this.clearDiagram();
    this.cacheSourceTarget = null;
    this.saveState();
};

// Handle a click on a 2-cell to implement interchangers
Project.prototype.clickCell = function(id) {

    if (this.mapDiagram.getDimension() != 2) return;

    // If this is the first click, just store it and exit
    if (this.selected_cell == null) {
        this.selected_cell = id;
        return;
    }

    // If we're reclicking the same thing, just exit
    if (this.selected_cell == id) {
        return;
    }

    /*
        The user has selected two different IDs, so try to interchange them.
    */

    var c1 = this.selected_cell;
    var c2 = id;

    // Get the partial orders that we have to modify
    var p2 = this.mapDiagram.diagram.partialOrderList[1];
    var p1 = this.mapDiagram.diagram.partialOrderList[0];

    // Make sure the cells are in order
    if (!p2.graph.isEdgePresent(c1, c2)) {
        var temp = c1;
        c1 = c2;
        c2 = temp;
    }

    // Check that the cells are adjacent
    if (!p2.graph.isEdgePresent(c1, c2)) {
        alert("Can't interchange non-adjacent cells");
        this.selected_cell = null;
        return;
    }

    // Prepare source and target lists for the cells
    var c1_targets = this.mapDiagram.diagram.diagramSignature.nCells[c1].target.getMappedTotalOrder();
    var c1_sources = this.mapDiagram.diagram.diagramSignature.nCells[c1].source.getMappedTotalOrder();
    var c1_all = c1_sources.concat(c1_targets);
    var c2_targets = this.mapDiagram.diagram.diagramSignature.nCells[c2].target.getMappedTotalOrder();
    var c2_sources = this.mapDiagram.diagram.diagramSignature.nCells[c2].source.getMappedTotalOrder();
    var c2_all = c2_sources.concat(c2_targets);

    // Check none of the outputs of cell_1 is an input of cell_2
    for (var i = 0; i < c2_sources.length; i++) {
        for (var j = 0; j < c1_targets.length; j++) {
            if (c2_sources[i] == c1_targets[j]) {
                alert("Can't interchange connected cells");
                this.selected_cell = null;
                return;
            }
        }
    }

    // Prepare some more source and target data
    var c1_last_target = (c1_targets.length == 0 ? null : c1_targets[c1_targets.length - 1]);
    var c1_last_source = (c1_sources.length == 0 ? null : c1_sources[c1_sources.length - 1]);
    var c1_first_target = (c1_targets.length == 0 ? null : c1_targets[0]);
    var c1_first_source = (c1_sources.length == 0 ? null : c1_sources[0]);
    var c2_last_target = (c2_targets.length == 0 ? null : c2_targets[c2_targets.length - 1]);
    var c2_last_source = (c2_sources.length == 0 ? null : c2_sources[c2_sources.length - 1]);
    var c2_first_target = (c2_targets.length == 0 ? null : c2_targets[0]);
    var c2_first_source = (c2_sources.length == 0 ? null : c2_sources[0]);

    // Is cell_1 to the left of cell_2?
    var c1_on_the_left;

    if (c1_targets.length > 0) {
        if (p1.graph.pathExists(c1_last_target, c2)) {
            c1_on_the_left = true;
        }
        else if (p1.graph.pathExists(c2, c1_first_target)) {
            c1_on_the_left = false;
        }
        else {
            alert("Can't interchange 2-cells in this configuration (case A)");
            this.selected_cell = null;
            return;
        }
    }
    else if (c2_sources.length > 0) {
        if (p1.graph.pathExists(c1, c2_first_source)) {
            c1_on_the_left = true;
        }
        else if (p1.graph.pathExists(c2_last_source, c1)) {
            c1_on_the_left = false;
        }
        else {
            alert("Can't interchange 2-cells in this configuration (case B)");
            this.selected_cell = null;
            return;
        }
    }
    else if (p1.graph.pathExists(c1, c2)) {
        c1_on_the_left = true;
    }
    else if (p1.graph.pathExists(c2, c1)) {
        c1_on_the_left = false;
    }
    else if ((c2_sources.length == 0) && (c1_targets.length == 0)) {
        c1_on_the_left = (c1 == id);
    }
    else {
        alert("Can't interchange 2-cells in this configuration (case C)");
        this.selected_cell = null;
        return;
    }

    /*
        Update the horizontal partial order
    */

    // Do the additions and removals
    if (c1_on_the_left) {
        var c1_predecessors = p1.getElementPredecessors(c1);
        var c2_successors = p1.getElementSuccessors(c2);
        p1.graph.removeEdgeIgnoreNull(c1_last_target, c2_first_source);
        p1.graph.removeEdgeIgnoreNull(c1, c2_first_source);
        p1.graph.removeEdgeIgnoreNull(c1_last_target, c2);
        p1.addRelation(c1_last_source, c2_first_target);
        p1.addRelation(c1, c2_first_target);
        p1.addRelation(c1_last_source, c2);
        if (c1_sources.length == 0) {
            p1.addPredecessors(c2_first_source, c1_predecessors);
            p1.addPredecessors(c2, c1_predecessors);
            p1.addPredecessors(c2_first_target, c1_predecessors);
        }
        if (c2_targets.length == 0) {
            p1.addSuccessors(c1_last_source, c2_successors);
            p1.addSuccessors(c1, c2_successors);
            p1.addSuccessors(c1_last_target, c2_successors);
        }
    }
    else {
        var c2_predecessors = p1.getElementPredecessors(c2);
        var c1_successors = p1.getElementSuccessors(c1);
        p1.graph.removeEdgeIgnoreNull(c2_last_source, c1_first_target);
        p1.graph.removeEdgeIgnoreNull(c2_last_source, c1);
        p1.graph.removeEdgeIgnoreNull(c2, c1_first_target);
        p1.addRelation(c2_last_target, c1_first_source);
        p1.addRelation(c2_last_target, c1);
        p1.addRelation(c2, c1_first_source);
        if (c2_targets.length == 0) {
            p1.addPredecessors(c1_first_target, c2_predecessors);
            p1.addPredecessors(c1, c2_predecessors);
            p1.addPredecessors(c1_first_source, c2_predecessors);
        }
        if (c1_sources.length == 0) {
            p1.addSuccessors(c2_last_source, c1_successors);
            p1.addSuccessors(c2, c1_successors);
            p1.addSuccessors(c2_last_target, c1_successors);
        }
    }

    /*
        Update the vertical partial order
    */

    // Get the predecessor and successor
    var predecessors = p2.getElementPredecessors(c1);
    var successors = p2.getElementSuccessors(c2);

    // Modify the partial order on vertices
    p2.graph.removeNode(c1);
    p2.graph.removeNode(c2);
    p2.graph.addNode(c1);
    p2.graph.addNode(c2);
    p2.graph.addEdge(c2, c1);
    if (predecessors.length > 0) {
        p2.graph.addEdge(predecessors[0], c2);
    }
    if (successors.length > 0) {
        p2.graph.addEdge(c1, successors[0]);
    }

    // Finish up and render the result
    this.selected_cell = null;
    this.saveState();
    $('div.cell-b-sect').empty();
    this.renderDiagram();
}

Project.prototype.saveState = function() {
    return;
    history.pushState({
        string: this.currentString()
    }, "", "");
}

// Makes this signature an empty signature of level (n+1)
Project.prototype.lift = function() {
    this.signature = new Signature(this.signature);
};

Project.prototype.selectGenerator = function(id) {

    var cell = this.dataList.get(id);

    // If current diagram is null, just display the generator
    if (this.mapDiagram === null) {
        // Set this to be a pointer so that the rule gets modified accordingly
        // Equivalently we could set it to a copy
        this.mapDiagram = cell.mapDiagram.copy();
        this.mapDiagram.renameFresh();
        this.renderDiagram();
        this.saveState();
        return null;
    }

    // If user clicked a 0-cell, do nothing
    if (cell.dimension == 0) {
        alert("0-cells can never be attached");
        return null;
    }

    var matchedMapDiagram = cell.mapDiagram.copy();
    matchedMapDiagram.renameFreshBoundaries(true);
    //matchedMapDiagram.renameFresh();

    if (cell.dimension == 2) {
        
    }
    
    if (cell.dimension == 3) {
        // Don't bother attaching, just rewrite
        var extendedSourceMatched = matchedMapDiagram.diagram.sourceBoundary.copy();
        extendedSourceMatched.extend(matchedMapDiagram.map);
        var extendedTargetMatched = matchedMapDiagram.diagram.sourceBoundary.copy();
        extendedTargetMatched.extend(matchedMapDiagram.map);

        var rewrite_matches = this.mapDiagram.enumerate(extendedSourceMatched);

        for (var i = 0; i < rewrite_matches.length; i++) {
            rewrite_matches[i] = {
                boundaryPath: "",
                inclusion: rewrite_matches[i]
            }
        }

        var enumerationData = {
            attachmentFlag: false,
            mapDiagram: matchedMapDiagram,
            matches: rewrite_matches
        };
        return enumerationData;
    }


    // Return all the ways to attach the selected cell
    var boundary_depth = this.mapDiagram.getDimension() - cell.dimension;

    if (boundary_depth < 0) {
        // Special case for Rewriting 2-cells
        if (matchedMapDiagram.getDimension() == 3 && this.mapDiagram.getDimension == 2) {
            var extendedSourceMatched = matchedMapDiagram.diagram.sourceBoundary.copy();
            extendedSourceMatched.extend(matchedMapDiagram.map);
            var matches = this.mapDiagram.enumerate(extendedSourceMatched);
        }
        else {
            alert("You can't attach a cell to a lower-dimensional diagram");
        }
        return;
    }
    /*
        else{
            while(matchedMapDiagram.getDimension() < this.mapDiagram.getDimension()){
                matchedMapDiagram.boost();
            }
        }
        */

    var extendedSource = this.mapDiagram.diagram.sourceBoundary.copy();
    extendedSource.extend(this.mapDiagram.map);
    var extendedTarget = this.mapDiagram.diagram.targetBoundary.copy();
    extendedTarget.extend(this.mapDiagram.map);
    for (var i = 0; i < boundary_depth; i++) {
        var next_source = extendedSource.diagram.sourceBoundary.copy();
        next_source.extend(extendedSource.map);
        extendedSource = next_source;
        var next_target = extendedTarget.diagram.targetBoundary.copy();
        next_target.extend(extendedTarget.map);
        extendedTarget = next_target;
    }

    /*    
        var extendedSource = main_source.copy();
        extendedSource.extend(this.mapDiagram.map);
        var extendedTarget = main_target.copy();
        extendedTarget.extend(this.mapDiagram.map);
    */

    var extendedSourceMatched = matchedMapDiagram.diagram.sourceBoundary.copy();
    extendedSourceMatched.extend(matchedMapDiagram.map);
    var extendedTargetMatched = matchedMapDiagram.diagram.targetBoundary.copy();
    extendedTargetMatched.extend(matchedMapDiagram.map);

    var sourceMatches = extendedSource.enumerate(extendedTargetMatched);
    for (var i = 0; i < sourceMatches.length; i++) {
        sourceMatches[i] = {
            //boundaryBool: 's',
            boundaryPath: (boundary_depth < 0 ? "" : Array(boundary_depth + 2).join('s')),
            inclusion: sourceMatches[i]
        };
    }
    var targetMatches = extendedTarget.enumerate(extendedSourceMatched);
    for (var i = 0; i < targetMatches.length; i++) {
        targetMatches[i] = {
            // boundaryBool: 't',
            boundaryPath: (boundary_depth < 0 ? "" : Array(boundary_depth + 2).join('t')),
            inclusion: targetMatches[i]
        };
    }
    var enumerationData = {
        attachmentFlag: true,
        mapDiagram: matchedMapDiagram,
        matches: sourceMatches.concat(targetMatches)
    };
    return enumerationData;
}

// Returns the current string 
Project.prototype.currentString = function() {
    return globular_stringify(this);
}

// Returns the current string 
Project.prototype.addZeroCell = function() {
    var generator = new Generator(null, null);
    var varSig = this.signature;
    while (varSig.sigma != null) {
        varSig = varSig.sigma;
    }
    varSig.addGenerator(generator);
    var tempMapDiagram = this.signature.createMapDiagram(generator.identifier);
    var data = new Data(generator.identifier, '#00b8ff', tempMapDiagram, tempMapDiagram.getDimension());
    this.dataList.put(generator.identifier, data);
}

Project.prototype.render = function(div, map_diagram, highlight) {

    if (highlight === undefined) {
        highlight = {
            inclusion: {
                bounds: []
            },
            boundaryPath: ""
        };
    }

    // Update the highlight data to refer to top-level names
    var boundary_array = highlight.boundaryPath.split();
    var bounds = [];
    for (var i = 0; i < highlight.inclusion.bounds.length; i++) {
        bounds[i] = {};
        bounds[i].preceding = map_diagram.elementGeneralName(highlight.inclusion.bounds[i].preceding, boundary_array);
        bounds[i].succeeding = map_diagram.elementGeneralName(highlight.inclusion.bounds[i].succeeding, boundary_array);
    }

    // Make an array of colour data.
    // In the future, only do this for colours we actually need,
    // or find some other way to do this - it's a bit ugly.
    var tempColours = new Hashtable();
    map_diagram.map.each(function(key, value) {
        tempColours.put(key, this.dataList.get(value).colour);
    }.bind(this));
    map_diagram.render(div, tempColours, {boundaryPath: highlight.boundaryPath, bounds: bounds, bubble_bounds: highlight.inclusion.bubble_bounds});
}

// Render a generator
Project.prototype.renderGenerator = function(div, id) {
    this.render(div, this.dataList.get(id).mapDiagram);
}

// Render the main diagram
Project.prototype.renderDiagram = function() {
    var div = '#diagram-canvas';
    if (this.mapDiagram == null) {
        var canvas = $(div).find('canvas');
        if (canvas.length != 0) {
            canvas = canvas[0];
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    else {
        this.render(div, this.mapDiagram);
        /*
                var tempColours = new Hashtable();
                this.dataList.each(function(key, value) {
                    tempColours.put(key, value.colour)
                });
                this.mapDiagram.render(div, tempColours);
        */
    }

}

// Need to write this code
Project.prototype.renderHighlighted = function() {
    return null;
}

Project.prototype.createGeneratorDOMEntry = function(n, cell) {
    var ccps_opt_str = "";

    var cell_name = this.getName(cell);

    // Create cell body
    var div_main = document.createElement('div');
    div_main.className = 'cell-opt';
    div_main.id = 'cell-opt-' + cell;
    div_main.c_type = n;

    // Add icon
    var div_icon = document.createElement('div');
    div_icon.className = 'cell-icon';
    div_icon.id = 'ci-' + cell;
    div_main.appendChild(div_icon);
    
    // Add second icon if necessary
    if (n == 3) {
        var span_arrow = document.createElement('div');
        span_arrow.innerHTML = '&rarr;';
        span_arrow.className = 'target-rule-arrow';
        div_main.appendChild(span_arrow);
        
        var div_icon_2 = document.createElement('div');
        div_icon_2.className = 'cell-icon';
        div_icon_2.id = 'ci1-' + cell;
        div_main.appendChild(div_icon_2);
        $(div_icon_2).css('margin-left', '22px')
    }

    // Add detail container
    var div_detail = document.createElement('div');
    $(div_detail).css('width', '100px');
    div_detail.className = 'cell-detail';
    div_main.appendChild(div_detail);
    if (n == 3) {
        $(div_detail).css('margin-left', '165px');
    }

    // Add label
    var div_name = document.createElement('input');
    div_name.type = 'text';
    div_name.className = 'cell-label';
    div_name.id = 'cl-' + cell;
    div_name.value = cell_name;
    div_detail.appendChild(div_name);

    // Add color picker
    var project = this;
    var input_color = document.createElement('input');
    input_color.className = 'color-picker';
    input_color.value = this.getColour(cell);
    var color_widget = new jscolor.color(input_color);
    color_widget.pickerClosable = true;
    color_widget.fromString(this.getColour(cell));
   	color_widget.onImmediateChange = function() {
        project.setColour(cell, '#' + this.toString());
        project.renderAll();
    };
    
    /*$(input_color).blur(function() {
        project.setColour(cell, '#' + $(this).val().toString());
        project.renderAll();
    });*/
   
    div_detail.appendChild(input_color);

    // Add extra section
    var div_extra = document.createElement('div');
    div_extra.className = 'cell-b-sect';
    //div_extra.id = 'cell-b-sect-' + cell;
    div_main.appendChild(div_extra);

    // Add to body and animate
    $(div_name).blur(function() {
        project.setName(cell, cell_name);
    });

    (function(project) {
        $(div_icon).click(function() {

            var cid = $(this).attr("id").substring(3);

            var enumerationData = project.selectGenerator(cid);
            if (enumerationData == null) return;
            var match_array = enumerationData.matches;

            // Display a list of all the attachment possibilities
            $('div.cell-b-sect').empty();
            for (var i = 0; i < match_array.length; i++) {
                var div_match = document.createElement('div');
                $(div_match)
                    .css('width', 65)
                    .css('height', 65)
                    .css('float', 'left')
                    .css('margin', 3);
                //div_match.appendChild(document.createTextNode(" " + i.toString() + " "));

                project.render(div_match, project.mapDiagram, match_array[i]);

                (function(match) {
                    $(div_match).click(function() {
                        project.attach(
                            enumerationData.attachmentFlag,
                            enumerationData.mapDiagram, // the diagram we are attaching
                            match.inclusion, // the inclusion data for the boundary
                            match.boundaryPath);
                        $('div.cell-b-sect').empty();
                        project.renderAll();
                        project.saveState();
                    });
                })(match_array[i]);
                
                (function(match) {
                    $(div_match).hover(
                        /* HOVER OVER THE PREVIEW THUMBNAIL */
                        function() {
                            project.render('#diagram-canvas', project.mapDiagram, match);
                        }                 ,
                        /* MOUSE OUT OF THE PREVIEW THUMBNAIL */
                        function () {
                            project.renderDiagram();
                        }
                    )
                })(match_array[i]);
                $(div_extra).append(div_match);
            }
        });
    })(this);

   

    return div_main;
}

// Render n-cells and main diagram
Project.prototype.renderAll = function() {
    this.renderCells();
    this.renderDiagram();
}

// Render all n-cells
Project.prototype.renderCells = function() {
    var n = this.listGenerators().length;
    for (var i = 0; i <= n; i++) {
        this.renderNCells(i);
    }
}

// Render the n-cells
Project.prototype.renderNCells = function(n) {
    var replace;
    if ($("#cell-group-" + n.toString())[0]) {
        replace = true;
    }
    else {
        replace = false;
    }
    if (replace == false) {
        var cell_group_html;
        if (n == 0) {
            cell_group_html = "<div class = 'mini-opt-links'><span id = 'add-0-cell-opt'>New 0-cell</span></div>";
        }
        else {
            cell_group_html = "";
        }
        var cell_group_html = cell_group_html + "<div class = 'cell-group' id = 'cell-group-" + n + "'>" + n + "-Cells</div>";
        $("#cell-body").append($(cell_group_html));
    }
    var cells = this.listGenerators()[n]; //["testCell1", "testCell2", "TESTcell3"];
    if (cells == undefined) cells = [];
    $("#cell-group-" + n.toString()).html(n + "-Cells");

    for (var i = 0; i < cells.length; i++) {

        var cell = cells[i];

        // Construct the new generator
        var entry = this.createGeneratorDOMEntry(n, cell);

        // Add it to the list
        $("#cell-group-" + n.toString()).append(entry);

        // Render the picture of the generator
        if (n == 3) {

            // Render the source diagram into $("#ci-" + cell)
            var tempColours = new Hashtable();
            this.dataList.each(function(key, value) {
                tempColours.put(key, value.colour)
            });
            var overallMapDiag = this.dataList.get(cell).mapDiagram; //this.signature.createMapDiagram(cell); //this.dataList.get(id).mapDiagram;

            // Source
            var sourceMapDiag = overallMapDiag.diagram.sourceBoundary.copy();
            sourceMapDiag.extend(overallMapDiag.map);
            this.render("#ci-" + cell, sourceMapDiag);

            // Target
            var targetMapDiag = overallMapDiag.diagram.targetBoundary.copy();
            targetMapDiag.extend(overallMapDiag.map);
            this.render("#ci1-" + cell, targetMapDiag);

        }
        else {
            this.renderGenerator("#ci-" + cell, cell);
        }
    }

}
