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

    this['_t'] = 'Project';

    var timer = new Timer('Project constructor');

    if (string == '' || string == undefined) {
        this.diagram = null;
        this.signature = new Signature(null);
        this.cacheSourceTarget = null;
        return;
    }

    var uncompressed;
    if (string.compressed == undefined) {
        uncompressed = string;
    } else {
        uncompressed = JSON.parse(globular_lz4_decompress(string));
    }
    var new_project = globular_destringify(uncompressed);
    for (var name in new_project) {
        if (!new_project.hasOwnProperty(name)) continue;
        this[name] = new_project[name];
    }

    // Ensure at least one 0-cell

    timer.Report();

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
Project.prototype.setNameUI = function(id, name) {
    this.signature.getGenerator(id).name = name;
    // too trivial to save state
};

// Gets the front-end name of a generator to what the user wants
Project.prototype.getName = function(id) {
    return this.signature.getGenerator(id).name;
};

// Sets the front-end colour to what the user wants
Project.prototype.setColourUI = function(id, colour) {
    this.signature.getGenerator(id).display.colour = colour;
    this.saveState();
};

// Gets the front-end colour to what the user wants
var lightnesses = [30, 50, 70];
Project.prototype.getColour = function(data) {
    if (data.id === undefined) data.id = data.type;
    if (data.dimension == undefined) debugger;
    /*
    var generator = this.signature.getGenerator(id);
    if (generator != null) return generator.display.colour;
    */
    var analysis = data.id.analyze_id();

    // Case that the id derives from the signature
    if (analysis.signature) {
        if (data.id == analysis.base_id) return analysis.generator.display.colour;
        var husl = $.husl.fromHex(analysis.generator.display.colour);
        return $.husl.toHex(husl[0], husl[1], lightnesses[analysis.dimension % 3])
    }

    // Case that the id derives from an interchanger
    else {
        return $.husl.toHex(0, 0, lightnesses[data.dimension % 3]);
    }
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
    //$("#options-box").fadeOut(100);
    $("#options-box").hide();
}

// Clear the main diagram, UI function
Project.prototype.clearDiagramUI = function() {
    this.clearDiagram();
    this.saveState();
}

// Clear the main diagram, internal function
Project.prototype.clearDiagram = function() {
    this.diagram = null;
    this.clearThumbnails();
    this.renderDiagram();
}

// Take the identity on the main diagram
Project.prototype.takeIdentityUI = function() {
    if (this.diagram == null) return;

    /*
    if (this.diagram.getDimension() >= 3) {
        alert("Can't take the identity of a " + this.diagram.getDimension().toString() + "-dimensional diagram");
        return;
    }
    */
    this.diagram.boost();
    this.renderDiagram({
        drag: {
            boundary: {
                type: 't',
                depth: 1
            }
        },
        boost: true
    });
    this.clearThumbnails();
    this.saveState();
}

Project.prototype.clearSourceTargetPreview = function() {
    this.cacheSourceTarget = null;
    $('#source-target-window').fadeOut(100);
}

Project.prototype.showSourceTargetPreview = function(diagram, boundary) {
    $('#source-target-title').html(boundary == 'source' ? 'Saved Source' : 'Saved Target');
    diagram.render('#source-target-diagram');
    $('#source-target-window').fadeIn(100);
}

// Store a source or target, or build a new generator
Project.prototype.saveSourceTargetUI = function(boundary /* = 'source' or 'target' */ ) {

    if (this.diagram == null) {
        this.cacheSourceTarget = null;
        return;
    }

    // If we haven't stored any source/target data yet, then just save this
    if (this.cacheSourceTarget == null) {
        this.cacheSourceTarget = {};
        this.cacheSourceTarget[boundary] = this.diagram.copy();
        this.showSourceTargetPreview(MainDisplay.visible_diagram, boundary);
        this.clearDiagram();
        this.saveState();
        return;
    }

    // Check whether we're replacing the cached source or target with a new one
    if (this.cacheSourceTarget[boundary] != null) {
        this.cacheSourceTarget[boundary] = this.diagram.copy();
        this.showSourceTargetPreview(MainDisplay.visible_diagram, boundary);
        this.clearDiagram();
        this.saveState();
        return;
    }

    // Store the source and target information
    this.cacheSourceTarget[boundary] = this.diagram.copy();

    var source = this.cacheSourceTarget.source;
    var target = this.cacheSourceTarget.target;

    // Test dimensions
    if (source.getDimension() != target.getDimension()) {
        alert("Source has dimension " + source.getDimension() + ", but target has dimension " + target.getDimension());
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

    // Construct and render the new generator
    this.addNCell({
        source: source,
        target: target
    });

    // Finish up
    this.clearSourceTargetPreview();
    this.clearDiagramUI();
};

Project.prototype.storeTheoremUI = function() {
    var theorem_id = this.addNCell({
        source: this.diagram.getSourceBoundary(),
        target: this.diagram.getTargetBoundary()
    });
    var theorem_diagram = this.signature.getGenerator(theorem_id).getDiagram();
    this.addNCell({
        source: theorem_diagram,
        target: this.diagram,
        invertible: true
    });
    this.clearDiagram();
    this.saveState();
};


Project.prototype.dragCellUI = function(drag) {
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

    // Delete those options which require invertibility of noninvertible cells
    for (var i = options.length - 1; i >= 0; i--) {
        if (!this.actionAllowed(options[i], drag)) options.splice(i, 1);
    }

    if (options.length === 0) {
        console.log("No interchanger applies");
        return;
    }

    // Should really prompt the user to choose between the valid options
    if (options.length == 1) {
        this.performActionUI(options[0], drag);
        return;
    }

    var list = $('#options-list').empty();
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        var id = option.id;
        if (drag.boundary != null) {
            if (drag.boundary.depth > 0 && drag.boundary.type == 's') {
                id = id.toggle_inverse();
            }
        }
        var item = $('<li>').html(id.getFriendlyName());
        list.append(item);

        // Use a closure to specify the behaviour on selection
        (function(action) {
            item.click(function() {
                //$("#options-box").fadeOut(100);
                $("#options-box").hide();
                gProject.performActionUI(action, drag);
            }).hover(
                // Mouse in
                function() {
                    MainDisplay.highlight_action(action, drag.boundary)
                },
                // Mouse out
                function() {
                    MainDisplay.remove_highlight();
                });
        })(options[i]);
    }
    //$("#options-box").fadeIn(100);
    $("#options-box").show();
};

Project.prototype.actionAllowed = function(option, drag) {

    if (option.preattachment != null) {

        // If the base type is invertible, there's no problem
        if (option.preattachment.id.getBaseType().is_invertible()) return true;

        // If we're just cancelling at the top or bottom, there's no problem            
        if (option.preattachment.boundary.depth + (drag.boundary == null ? 0 : drag.boundary.depth) <= 1) return true;

        // Not allowed
        return false;
    }

    // Allow anything involving flipping
    if (option.id.indexOf('I1') > -1) return true;

    // If the base type we're attaching is invertible, there's no problem
    var signature_id = option.id.getSignatureType();
    if (signature_id == null) return true;
    if (signature_id.is_invertible()) return true;

    // If we're attaching to a target, can only apply a base type
    if (drag.boundary == null || drag.boundary.type == 't') {
        return (option.id == signature_id);
    }

    // If we're attaching to a source, can only apply an inverse type
    if (drag.boundary.type == 's') {
        return (option.id == signature_id.toggle_inverse());
    }
}

Project.prototype.performActionUI = function(option, drag) {

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
    this.clearThumbnails();
    this.renderDiagram({
        drag: drag,
        preserve_view: true
    });
    this.saveState();
}

Project.prototype.saveState = function() {
    if ($('#allow-undo-checkbox').is(':checked')) {
        history.pushState({
            string: this.currentString(),
            p_id: global_p_id
        }, "", "");
    }
}

// Makes this signature an empty signature of level (n+1)
Project.prototype.lift = function() {
    this.signature = new Signature(this.signature);
};

Project.prototype.selectGeneratorUI = function(id) {
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
            alert('Choose projection level ' + (this.diagram.getDimension() - 2) + ' to rewrite diagram.');
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
        if (i == slices_data.length - 1) last_slice_max = Math.max(1, slice_pointer.cells.length);
        slice_pointer = slice_pointer.getSlice(slices_data[i]); // no need to copy slice
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
Project.prototype.currentString = function(minimize) {
    if (minimize == undefined) minimize = false;

    var timer = new Timer("Project.currentString");
    // Store the viewbox controls
    this.view_controls = MainDisplay.getControls();

    var result = globular_stringify(this, minimize);

    //timer.Report();
    return result;
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
    if (generator == null) debugger;
    this.render(div, generator.getDiagram());
}

// Render the main diagram
Project.prototype.renderDiagram = function(data) {
    if (data == undefined) data = {};
    //MainDisplay.set_diagram(this.diagram, data.drag, data.controls);
    MainDisplay.set_diagram({diagram: this.diagram, drag: data.drag, controls: data.controls, preserve_view: data.preserve_view});
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

    // Create icon group
    var icon_group = $('<div>')
        .addClass('cell-icon-group')
        .appendTo($(div_main));

    // Add icon
    var div_icon = document.createElement('div');
    div_icon.className = 'cell-icon';
    div_icon.id = 'ci-' + generator.id;
    icon_group.append(div_icon);

    // Add second icon if necessary
    var div_icon_2 = null;
    if (n > 0 && !generator.single_thumbnail) {
        var div_icon_2 = document.createElement('div');
        div_icon_2.className = 'cell-icon';
        div_icon_2.id = 'ci-second-' + generator.id;
        //div_main.appendChild(div_icon_2);
        icon_group.append(div_icon_2);
    }

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

    // Add delete button
    var div_delete = $('<div>').addClass('delete_button').html('X');
    div_delete.click(function() {
        gProject.removeCell(id);
    });
    div_detail.appendChild(div_delete[0]);

    // Add color picker
    var project = this;
    var input_color = document.createElement('input');
    input_color.className = 'color-picker';
    input_color.value = generator.display.colour;
    var color_widget = new jscolor.color(input_color);
    color_widget.pickerClosable = true;
    color_widget.fromString(generator.display.colour);
    color_widget.onImmediateChange = function() {
        project.setColourUI(generator.id, '#' + this.toString());
        project.renderNCell(generator.id);
        //project.renderCellsAbove(generator.id);
        project.renderDiagram();
    };
    div_detail.appendChild(input_color);

    // Add invertibility selector
    if (n > 0) {
        var label = $('<br><label class="cell-invertible"><input type="checkbox" name="checkbox">Invertible</label>');
        var input = label.find('input');
        input.attr('id', 'invertible-' + generator.id).prop('checked', generator.invertible);
        $(div_detail).append(label);
        input.change(function() {
            var g = gProject.signature.getGenerator(generator.id);
            g.invertible = !g.invertible;
        });
    }

    // Add separate source/target selector
    if (n > 0) {
        var label = $('<br><label class="cell-single-thumbnail"><input type="checkbox" name="checkbox"/>Single image</label>');
        var input = label.find('input');
        input.attr('id', 'single-thumbnail-' + generator.id).prop('checked', generator.single_thumbnail);
        $(div_detail).append(label);
        input.change(function() {
            var g = gProject.signature.getGenerator(generator.id);
            g.single_thumbnail = !g.single_thumbnail;
            gProject.renderNCell(generator.id);
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
        $(div_icon).add($(div_icon_2)).click(function() {

            //var cid = $(this).attr("id").substring(3);
            var cid = generator.id;

            var enumerationData = project.selectGeneratorUI(cid);
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
                            drag: {
                                boundary: boundary
                            }
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

Project.prototype.removeCell = function(id) {
    var generator = this.signature.getGenerator(id);
    var relatedCells = this.relatedCells(generator);

    // Remove the main diagram if it uses any related cells
    for (var i = 0; i < relatedCells.length; i++) {
        if (this.diagram == null) break;
        var related_generator = relatedCells[i];
        if (this.diagram.usesCell(related_generator)) this.clearDiagram();
    }

    // Remove the related cells
    for (var i = 0; i < relatedCells.length; i++) {
        this.signature.removeCell(relatedCells[i].id);
        $('#cell-opt-' + relatedCells[i].id).remove();
    }
}

Project.prototype.relatedCells = function(generator_to_remove) {
    var related_cells = [generator_to_remove];
    var cells = this.signature.getAllCells();
    for (var i = 0; i < cells.length; i++) {
        var id = cells[i];
        var generator = this.signature.getGenerator(id);
        if (generator.usesCell(generator_to_remove)) {
            related_cells.push(generator);
            related_cells = related_cells.concat(this.relatedCells(generator));
        }
    }
    return related_cells;
}

// Render n-cells and main diagram
Project.prototype.renderAll = function() {
    this.renderCells();
    this.renderDiagram();
}

Project.prototype.renderCellChain = function(list) {
    var id = list.shift();
    if (id == undefined) return;
    $('#loading-window').html("Rendering cell " + id);
    setTimeout(function() {
        gProject.renderNCell(id);
        setTimeout(function() {
            gProject.renderCellChain(list), 0
        })
        0
    });

}

// Render all n-cells
Project.prototype.renderCells = function() {
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
    console.log("Rendering " + generator.getDimension() + "-cell " + generator.name);

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

    // Set default single thumbnail behaviour if undefined
    if (generator.single_thumbnail == undefined) {
        generator.single_thumbnail = (generator.getDimension() <= 2);
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

    // Render the thumbnails
    if (generator.single_thumbnail) {
        var d = generator.getDiagram();
        d.render('#ci-' + generator.id);
        d.clearAllSliceCaches();
    } else if (generator.getDimension() > 0) {
        var s = generator.getSource();
        s.render('#ci-' + generator.id);
        s.clearAllSliceCaches();
        var t = generator.getTarget();
        t.render('#ci-second-' + generator.id);
        t.clearAllSliceCaches();
    }

    // Clear up the data
    generator.prepare();
}


Project.prototype.redrawAllCells = function() {
    $("#cell-body").empty();

    var list = this.signature.getAllCells();
    this.renderCellChain(list);

    return;

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

Project.prototype.restrictUI = function() {
    if (MainDisplay.visible_diagram == null) return;
    this.diagram = MainDisplay.visible_diagram.copy();
    this.renderDiagram();
    this.saveState()
}

Project.prototype.exportUI = function() {
    download($('#diagram-title').val() + '.json', this.compressedString());
}

Project.prototype.compressedString = function() {
    return JSON.stringify(globular_lz4_compress(this.currentString()));
}

Project.prototype.saveUI = function() {
    var string = this.compressedString();
    $.post("/c-loggedin", {
            valid: true
        },
        function(result, status) {
            if (result.status != "in") {
                show_msg("Please log in to save this project.", 7000, 3);
                render_frontend("out");
                //render_page();
                return;
            }
            //var compressed_string = JSON.stringify(globular_lz4_compress(currentString));
            $.post("/save_project_changes", {
                string: string,
                p_id: global_p_id,
                p_name: $("#diagram-title").val(),
                p_desc: $("#text-p-desc").val()
            }, function(result, status) {
                global_p_id = result.p_id;
                show_msg("Successfully saved changes.", 2000, 2);
            });
        }
    );
}

Project.prototype.keepTopUI = function() {
    if (this.diagram == null) return;
    
    if (MainDisplay.slices.length == 0) {
        // Get cut location from mouse position
        if (MainDisplay.popup == null) return;
        var coordinate = MainDisplay.popup.coordinates[0]
        this.diagram.keepAfter(coordinate);
    } else {
        // Get cut location from first slice
        this.diagram.keepAfter(Number(MainDisplay.slices[0].val()));
    }
    
    this.renderDiagram();
}

Project.prototype.keepBottomUI = function() {
    if (this.diagram == null) return;
    
    if (MainDisplay.slices.length == 0) {
        // Get cut location from mouse position
        if (MainDisplay.popup == null) return;
        var coordinate = MainDisplay.popup.coordinates[0]
        this.diagram.keepBefore(coordinate);
    } else {
        // Get cut location from first slice
        this.diagram.keepBefore(Number(MainDisplay.slices[0].val()));
    }
    
    this.renderDiagram();
}

Project.prototype.downloadGraphic = function() {
    download_SVG_as_PNG(MainDisplay.svg_element, MainDisplay.getExportRegion(), "image.png");
}