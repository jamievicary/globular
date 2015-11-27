"use strict";

var T = 1;
var d;

/*
    Project class
*/

/*
    Constructs a new project. If the argument is undefined, we are constructing
    this in the destringify routine, so we should do nothing. If it's empty,
    construct an empty project. Otherwise, destringify.
*/
function Project(string) {

    if (string == '' || string == undefined) {
        this.diagram = null;
        this.signature = new Signature(null);
        this.cacheSourceTarget = null;
        return;
    }

    var new_project = globular_destringify(string);
    for (var name in new_project) {
        if (!new_project.hasOwnProperty(name)) continue;
        this[name] = new_project[name];
    }

};

Project.prototype.getType = function() {
    return 'Project';
};

// This method returns the diagram currently associated with this project, this is used to maintain a complete separation between the front end and the core
Project.prototype.getDiagram = function() {
    return this.diagram;
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
    this.signature.getGenerator(id).name = name;
    this.saveState();
};

// Gets the front-end name of a generator to what the user wants
Project.prototype.getName = function(id) {
    return this.signature.getGenerator(id).name;
};

// Sets the front-end colour to what the user wants
Project.prototype.setColour = function(id, colour) {
    this.signature.getGenerator(id).display.colour = colour;
    this.saveState();
};

// Gets the front-end colour to what the user wants
Project.prototype.getColour = function(id) {
    var generator = this.signature.getGenerator(id);
    if (generator == null) return '#555555';
    if (generator.display == null) return '#555555';
    return generator.display.colour;
};


/* 
Takes a rule (generator) and a string describing how to get to an appropriate boundary of this diagram as arguments
Returns the list of all possible inclusion functions of the source of this generator into the diagram
*/
Project.prototype.matches = function(matched_diagram, boundary_path) {
    /* 
    If the degrees of this diagram and the matched diagram do not match, we boost the matched diagram so that they do
    This is a precondition for enumeration and matching
    */
    while (matched_diagram.dimension < this.diagram.dimension) {
        matched_diagram.boost();
    }

    var diagram_pointer = this.d;
    var matched_diagram_pointer = matched_diagram;
    /*
    Depending on the user selection, we find matches within an appropriate boundary of this diagram
    The default selection is the diagram itself, i.e. boundaryPath = []
    */
    for (var i = 0; i < boundary_path.length; i++) {
        if (boundary_path[i] === 's') {
            diagram_pointer = diagram_pointer.getSourceBoundary();
            matched_diagram_pointer = matched_diagram_pointer.getTargetBoundary();

        } else {
            diagram_pointer = diagram_pointer.getTargetBoundary();
            matched_diagram_pointer = matched_diagram_pointer.getSourceBoundary();

        }
    }
    return diagram_pointer.enumerate(matched_diagram_pointer);
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

// Clear thumbnails
Project.prototype.clearThumbnails = function() {
    $('div.cell-b-sect').empty();
}

// Clear the main diagram
Project.prototype.clearDiagram = function() {
    this.diagram = null;
    this.clearThumbnails();
    this.renderDiagram();
    this.saveState();
}

// Take the identity on the main diagram
Project.prototype.takeIdentity = function() {
    if (this.diagram == null) return;

    /*
    if (this.diagram.getDimension() >= 3) {
        alert("Can't take the identity of a " + this.diagram.getDimension().toString() + "-dimensional diagram");
        return;
    }
    */
    this.diagram.boost();
    this.renderDiagram();
}

/* 
    Depending on whether a source or a target have been already stored in memory, this procedure completes the rule with the diagram currently in workspace.
    If the dimensions match, an appropriate generator is added an an appropriate level (the second part handled internally by the Signature class).
    If none have been saved, it adds a 0-generator. For all these possible nCells the internal name will be automatically added when the generator is created.
    Return true to indicate n-cells should be re-rendered.
*/

Project.prototype.saveSourceTarget = function(boundary /* = 'source' or 'target' */ ) {

    if (this.diagram == null) {
        this.cacheSourceTarget = null;
        return;
    }

    // If we haven't stored any source/target data yet, then just save this
    if (this.cacheSourceTarget == null) {
        this.cacheSourceTarget = {};
        this.cacheSourceTarget[boundary] = this.diagram;
        this.clearDiagram();
        return;
    }

    // Check whether we're replacing the cached source or target with a new one
    if (this.cacheSourceTarget[boundary] != null) {
        this.cacheSourceTarget[boundary] = this.diagram;
        this.clearDiagram();
        return;
    }

    // Store the source and target information
    this.cacheSourceTarget[boundary] = this.diagram;

    var source = this.cacheSourceTarget.source;
    var target = this.cacheSourceTarget.target;

    // Test dimensions
    if (source.getDimension() != target.getDimension()) {
        alert("Source and target must be the same dimension");
        this.cacheSourceTarget[boundary] = null;
        return true;
    }

    // Test globularity
    var sourceOfSource = source.getSourceBoundary();
    var sourceOfTarget = target.getSourceBoundary();
    var targetOfSource = source.getTargetBoundary();
    var targetOfTarget = target.getTargetBoundary();
    if (source.getDimension() != 0) { // globularity trivially satisfied for 0-diagrams
        if (!sourceOfSource.equals(sourceOfTarget)) {
            alert("Source of source does not match source of target");
            this.cacheSourceTarget[boundary] = null;
            return true;
        }
        if (!targetOfSource.equals(targetOfTarget)) {
            alert("Target of source does not match target of target");
            this.cacheSourceTarget[boundary] = null;
            return true;
        }
    }

    this.addNCell({
        source: source,
        target: target
    });

    // Re-render and save the new state

    //this.renderNCells(source.getDimension() + 1);
    this.clearDiagram();

    this.cacheSourceTarget = null;
    this.saveState();
};

Project.prototype.storeTheorem = function() {
    var theorem_id = this.addNCell({
        source: this.diagram.getSourceBoundary(),
        target: this.diagram.getTargetBoundary()
    });
    //var theorem_diagram = this.signature.createDiagram(theorem_id);
    var theorem_diagram = this.signature.getGenerator(theorem_id).getDiagram();
    this.addNCell({
        source: theorem_diagram,
        target: this.diagram,
        invertible: true
    });
    this.clearDiagram();
    //this.renderAll();
    this.saveState();
};


Project.prototype.dragCell = function(drag) {
    //console.log("Detected drag: " + JSON.stringify(drag));

    // Get a pointer to the subdiagram in which the drag took place
    var diagram_pointer = this.diagram;
    if (drag.boundary != null) {
        for (var i = 0; i < drag.boundary.depth - 1; i++) {
            diagram_pointer = diagram_pointer.getSourceBoundary();
        }
        diagram_pointer = (drag.boundary.type == 's' ? diagram_pointer.getSourceBoundary() : diagram_pointer.getTargetBoundary());
    }

    // Reverse the coordinates, since the display code uses the opposite system
    drag.coordinates = drag.coordinates.reverse();

    // Find how we can interpret this drag in terms of an algebraic move
    var options = diagram_pointer.interpretDrag(drag);

    if (options.length === 0) {
        console.log("No interchanger applies");
        return;
    }

    // Should really prompt the user to choose between the valid options
    if (options.length == 1) {
        this.performAction(options[0], drag);
        return;
    }

    var list = $('#options-list').empty();
    for (var i = 0; i < options.length; i++) {
        var description = options[i].id.getFriendlyName();
        var item = $('<li>').html(description);
        list.append(item);
        
        // Use a closure to specify the behaviour on selection
        (function(action) {
            item.click(function() {
                $("#options-box").fadeOut();
                gProject.performAction(action, drag);
            });
        })(options[i]);
    }
    $("#options-box").fadeIn();
};

Project.prototype.performAction = function(option, drag) {

    // Perform a preattachment if necessary
    if (option.preattachment != null) {
        option.preattachment.boundary.depth += (drag.boundary == null ? 0 : drag.boundary.depth);
        this.diagram.attach(new NCell({
            id: option.preattachment.id,
            key: option.preattachment.key
        }), option.preattachment.boundary);
        console.log("Preattachment " + option.preattachment.id.getFriendlyName());
    }

    this.diagram.attach(new NCell({
        id: option.id,
        key: option.key
    }), drag.boundary, true);
    console.log("Attachment " + option.id.getFriendlyName());

    // Useful shortcut to the diagram for console manipulation
    d = this.diagram;

    // Finish up and render the result
    this.selected_cell = null;
    this.saveState();
    this.clearThumbnails();
    this.renderDiagram(drag);
}

Project.prototype.saveState = function() {
    //return;
    var t0 = performance.now();
    history.pushState({
        string: this.currentString()
    }, "", "");
    //console.log("Project.saveState: " + parseInt(performance.now() - t0) + "ms");
}

// Makes this signature an empty signature of level (n+1)
Project.prototype.lift = function() {
    this.signature = new Signature(this.signature);
};

Project.prototype.selectGenerator = function(id) {
    var generator = this.signature.getGenerator(id);

    // If current diagram is null, just display the generator
    if (this.diagram === null) {
        this.diagram = generator.getDiagram();
        this.renderDiagram();
        this.saveState();
        return null;
    }

    // If user clicked a 0-cell, do nothing
    if (generator.getDimension() == 0) {
        alert("0-cells can never be attached");
        return null;
    }

    var matched_diagram = generator.getDiagram();
    var slices_data = MainDisplay.get_current_slice();

    if (matched_diagram.getDimension() == this.diagram.getDimension() + 1) {
        // REWRITE
        if (slices_data.length > 0) {
            var d = this.diagram.getDimension();
            alert('Choose suppression level ' + this.diagram.getDimension() - 2 + ' to rewrite diagram.');
            return null;
        }
        var rewrite_matches = this.diagram.enumerate(matched_diagram.getSourceBoundary());
        for (var i = 0; i < rewrite_matches.length; i++) {
            rewrite_matches[i] = {
                boundaryType: "",
                realBoundaryDepth: 0,
                visibleBoundaryDepth: 0,
                inclusion: rewrite_matches[i],
                size: matched_diagram.getSourceBoundary().getFullDimensions()
            }
        }
        var enumerationData = {
            attachmentFlag: false,
            diagram: matched_diagram,
            matches: rewrite_matches
        };
        return enumerationData;
    } else if (matched_diagram.getDimension() > this.diagram.getDimension() + 1) {
        // TOO HIGH-DIMENSIONAL
        alert('Cannot apply a ' + matched_diagram.getDimension() + '-cell to a ' + this.diagram.getDimension() + '-dimensional diagram.');
        return null;
    }

    // Try attaching to a boundary
    var depth = slices_data.length;
    var d = generator.getDimension();
    var matches = [];

    // Can we attach by virtue of viewing the entire source or target?
    var slice_pointer = this.diagram;
    var last_slice_max = null;
    for (var i = 0; i < slices_data.length; i++) {
        if (i == slices_data.length - 1) last_slice_max = slice_pointer.cells.length;
        slice_pointer = slice_pointer.getSlice(slices_data[i]);
        //slices_counter++;
    }
    var visible_slice = slice_pointer;

    // Are we viewing an entire target?
    if (slices_data.length > 0 && slices_data.last() == last_slice_max && matched_diagram.getDimension() == visible_slice.getDimension() + 1) {
        matches = this.prepareEnumerationData(visible_slice, matched_diagram.getBoundary('s'), 0, 't', depth);
    }

    // Are we viewing an entire source?
    else if (slices_data.length > 0 && slices_data.last() === 0 && matched_diagram.getDimension() == visible_slice.getDimension() + 1) {
        matches = this.prepareEnumerationData(visible_slice, matched_diagram.getBoundary('t'), 0, 's', depth);
    }

    // Can we attach to the apparent s or t of the visible diagram?
    else if (d == this.diagram.getDimension() - depth) {
        matches = this.prepareEnumerationData(visible_slice.getBoundary('s'), matched_diagram.getBoundary('t'), 1, 's', depth);
        matches = matches.concat(this.prepareEnumerationData(visible_slice.getBoundary('t'), matched_diagram.getBoundary('s'), 1, 't', depth));
    }

    // Can we attach to the apparent ss or tt of the visible diagram?
    else if (d == this.diagram.getDimension() - depth - 1) {
        matches = this.prepareEnumerationData(visible_slice.getBoundary('ss'), matched_diagram.getTargetBoundary(), 2, 's', depth);
        matches = matches.concat(this.prepareEnumerationData(visible_slice.getBoundary('st'), matched_diagram.getBoundary('s'), 2, 't', depth));
    }

    // Nothing possible
    else {
        alert('Cannot attach this cell from the current view');
        return null;
    }

    // Return the results
    var enumerationData = {
        attachmentFlag: true,
        diagram: matched_diagram,
        matches: matches
    };
    return enumerationData;

}

Project.prototype.prepareEnumerationData = function(subject_diagram, matched_diagram, visible_boundary_depth, boundary_type, slice_depth) {
    var matches = subject_diagram.enumerate(matched_diagram);
    for (var i = 0; i < matches.length; i++) {
        matches[i] = {
            visibleBoundaryDepth: visible_boundary_depth,
            realBoundaryDepth: visible_boundary_depth + slice_depth,
            boundaryType: boundary_type,
            inclusion: matches[i],
            size: matched_diagram.getFullDimensions()
        };
    }
    return matches;
};

// Returns the current string 
Project.prototype.currentString = function() {
    return globular_stringify(this);
}

// Returns the current string 
Project.prototype.addZeroCell = function() {
    this.addNCell({
        source: null,
        target: null
    });
}

Project.prototype.render = function(div, diagram, slider, highlight) {
    diagram.render(div, highlight);
}

// Render a generator
Project.prototype.renderGenerator = function(div, id) {
    var generator = this.signature.getGenerator(id);
    this.render(div, generator.diagram);
}

// Render the main diagram
Project.prototype.renderDiagram = function(boundary_data) {
    MainDisplay.set_diagram(this.diagram, boundary_data);
};

// Need to write this code
Project.prototype.renderHighlighted = function() {
    return null;
}

Project.prototype.createGeneratorDOMEntry = function(id) {

    var generator = this.signature.getGenerator(id);
    var n = generator.getDimension();

    var ccps_opt_str = "";

    var cell_name = generator.name;

    // Create cell body
    var div_main = document.createElement('div');
    div_main.className = 'cell-opt';
    div_main.id = 'cell-opt-' + generator.id;
    div_main.c_type = n;

    // Add icon
    var div_icon = document.createElement('div');
    div_icon.className = 'cell-icon';
    div_icon.id = 'ci-' + generator.id;
    div_main.appendChild(div_icon);

    // Add second icon if necessary
    /*
    if (n == 3) {
        var span_arrow = document.createElement('div');
        span_arrow.innerHTML = '&rarr;';
        span_arrow.className = 'target-rule-arrow';
        div_main.appendChild(span_arrow);

        var div_icon_2 = document.createElement('div');
        div_icon_2.className = 'cell-icon';
        div_icon_2.id = 'ci1-' + cell;
        div_main.appendChild(div_icon_2);
        $(div_icon_2).css('margin-left', '22px');
    }
    */

    // Add detail container
    var div_detail = document.createElement('div');
    //$(div_detail).css('width', '100px');
    div_detail.className = 'cell-detail';
    div_main.appendChild(div_detail);
    /*
    if (n == 3) {
        //$(div_detail).css('margin-left', '155px');
    }
    */

    // Add label
    var div_name = document.createElement('input');
    div_name.type = 'text';
    div_name.className = 'cell-label';
    div_name.id = 'cl-' + generator.id;
    div_name.value = cell_name;
    $(div_name).on('input', function(event) {
        var text = $(this).val();
        //var generator = gProject.signature.getGenerator(generator.id);
        generator.name = text;
    })
    $(div_name).keypress(function(e) {
        e.stopPropagation()
    });

    div_detail.appendChild(div_name);

    // Add color picker
    var project = this;
    var input_color = document.createElement('input');
    input_color.className = 'color-picker';
    input_color.value = this.getColour(generator.id);
    var color_widget = new jscolor.color(input_color);
    color_widget.pickerClosable = true;
    color_widget.fromString(this.getColour(generator.id));
    color_widget.onImmediateChange = function() {
        project.setColour(generator.id, '#' + this.toString());
        project.renderNCell(generator.id);
        project.renderCellsAbove(generator.id);
        project.renderDiagram();
    };
    div_detail.appendChild(input_color);

    // Add invertibility selector
    if (n > 0 && generator.id.last() != 'I') {
        var label = $('<br><label><input type="checkbox" name="checkbox">Invertible</label>');
        var input = label.find('input');
        input.attr('id', 'invertible-' + generator.id).prop('checked', generator.invertible);
        $(div_detail).append(label);
        input.change(function() {
            var g = gProject.signature.getGenerator(generator.id);
            g.invertible = !g.invertible;
        });
    }

    /*
    if (n != 0) {
        var sto_rate_text = document.createElement('input');
        sto_rate_text.className = 'stochastic-rate';
        sto_rate_text.id = 'sr-' + generator.id;
        sto_rate_text.type = 'text';
        sto_rate_text.placeholder = 'Rate';
        div_detail.appendChild(sto_rate_text);
    }
    $("#stochastic-cb").change(function() {
        if ($(this).is(':checked')) {
            $(".stochastic-rate").slideDown();

        } else {
            $(".stochastic-rate").slideUp();
        }
    });
    $(sto_rate_text).blur(function() {
        var cid = $(this).attr("id").substring(3);
        var rate = $(this).val();
        project.set_rate(generator.id, rate);
    });
    */

    // Add extra section
    var div_extra = document.createElement('div');
    div_extra.className = 'cell-b-sect';
    div_main.appendChild(div_extra);

    (function(project) {
        $(div_icon).click(function() {

            var cid = $(this).attr("id").substring(3);

            var enumerationData = project.selectGenerator(cid);
            if (enumerationData == null) return;
            var match_array = enumerationData.matches;

            // Display a list of all the attachment possibilities
            project.clearThumbnails();
            for (var i = 0; i < match_array.length; i++) {
                var div_match = document.createElement('div');
                $(div_match).addClass('preview-icon');
                $(div_extra).append(div_match);
                project.render(div_match, MainDisplay.visible_diagram, null, match_array[i]);
                (function(match) {
                    $(div_match).click(function() {
                        var ncell = new NCell({
                            id: enumerationData.diagram.cells[0].id,
                            key: match.inclusion
                        });
                        var boundary = {
                            type: match.boundaryType,
                            depth: match.realBoundaryDepth
                        };
                        if (boundary.type == 's') ncell.id = ncell.id.toggle_inverse();
                        project.diagram.attach(ncell, boundary);
                        d = project.diagram;
                        project.clearThumbnails();
                        project.renderDiagram({
                            boundary: boundary
                        });
                        project.saveState();
                    });
                })(match_array[i]);

                (function(match) {
                    $(div_match).hover(
                        // Mouse over preview thumbnail
                        function() {
                            project.render('#diagram-canvas', MainDisplay.visible_diagram, null, match);
                        },
                        // Mouse out of preview thumbnail
                        function() {
                            project.renderDiagram();
                        }
                    )
                })(match_array[i]);
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
    var list = this.listGenerators();
    for (var i = 0; i < list.length; i++) {
        this.renderNCell(list[i]);
    }
}

Project.prototype.renderCellsAbove = function(id) {
    var generator = this.signature.getGenerator(id);
    for (var d = generator.getDimension() + 1; d <= this.signature.getDimension(); d++) {
        var cells = this.signature.getNCells(d);
        for (var i = 0; i < cells.length; i++) {
            this.renderNCell(cells[i]);
        }
    }
}

// Insert a new n-cell into the menu
Project.prototype.renderNCell = function(id) {

    var generator = this.signature.getGenerator(id);

    // Create any required cell groups
    var cell_body = $('#cell-body');
    for (var d = 0; d <= generator.getDimension(); d++) {
        var cell_group_id = '#cell-group-' + d;
        if ($(cell_group_id).length == 0) {
            var cell_group_html = "";
            if (d == 0) cell_group_html = "<div class = 'mini-opt-links'><span id = 'add-0-cell-opt'>New 0-cell</span></div>";
            cell_group_html += "<div class = 'cell-group' id = 'cell-group-" + d + "'>" + d + "-Cells</div>";
            var content = $(cell_group_html);
            cell_body.append(content);
        }
    }

    // Add the new generator
    var cell_group_id = '#cell-group-' + generator.getDimension();
    var entry = this.createGeneratorDOMEntry(generator.id);
    var cell_id = '#cell-opt-' + generator.id;
    if ($(cell_id).length > 0) {
        $(cell_id).replaceWith(entry);
    } else {
        $(cell_group_id).append(entry);
    }
    this.renderGenerator('#ci-' + generator.id, generator.id);
}


Project.prototype.redrawAllCells = function() {
    $("#cell-body").empty();
    var cells = this.signature.getAllCells();
    for (var i = 0; i < cells.length; i++) {
        this.renderNCell(cells[i]);
    }
}

Project.prototype.addNCell = function(data) {

    var generator = new Generator({
        source: data.source,
        target: data.target,
        name: "Cell " + (this.signature.getAllCells().length + 1),
        invertible: (data.invertible == undefined ? false : data.invertible)
    });
    var d = generator.getDimension();

    // Make sure the signature has a sufficiently high dimension
    while (this.signature.n < d) {
        this.signature = new Signature(this.signature);
    }
    this.signature.addGenerator(generator);
    generator = this.signature.getGenerator(generator.id);

    // Set the colour
    var colour_array = GlobularColours[d % 3];
    var colour = colour_array[(this.signature.getNCells(d).length - 1) % colour_array.length];
    generator.display = {
        colour: colour,
        rate: 1
    };

    // Add the diagram to the menu
    if (gProject != null) this.renderNCell(generator.id);

    return generator.id;
};
