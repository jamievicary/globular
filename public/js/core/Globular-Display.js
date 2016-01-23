"use strict";
/*global gProject*/
/*global Timer*/
/*global detectLeftButton*/

/*
    A Display class for rendering diagrams.
    
    Members:
        - suppress : N, levels to supress
        - coordinates : Array, indices of the display positions
        - container: div to render 
        - control: div for controls
*/

// Constructor
function Display(container, diagram) {
    this['_t'] = 'Display';
    this.container = container;
    this.diagram = diagram;
    this.select_zone = null;
    this.suppress_input = null;
    this.view_input = null;
    this.slices = [];
    var self = this;
    $(container).mousedown(function(event) {
        self.mousedown(event)
    });
    $(container).mouseup(function(event) {
        self.mouseup(event)
    });
    $(container).mousemove(function(event) {
        self.mousemove(event)
    });
    this.create_controls();
}

// Disable mouse interaction
Display.prototype.disableMouse = function() {
    this.container.css('pointer-events', 'none');
}

// Enable mouse interaction
Display.prototype.enableMouse = function() {
    this.container.css('pointer-events', 'all');
}

Display.prototype.mousedown = function(event) {

    // Only interact with left mouse button
    if (event.buttons != 1) return;

    if (!gProject.initialized) return;
    if (this.diagram == null) return;
    var b = $(this.container)[0].bounds;
    if (b == undefined) return;
    var logical = this.pixelsToGrid(event);
    if (logical == undefined) return;
    if (logical.x < b.left) return;
    if (logical.x > b.right) return;
    if (logical.y < b.bottom) return;
    if (logical.y > b.top) return;
    this.select_grid = logical;
}

var min_drag = 0.25;
Display.prototype.mousemove = function(event) {
    if (!gProject.initialized) return;
    if (this.diagram == null) return;

    var timer = new Timer("Display.mousemove - updating popup")

    //console.log('grid.x = ' + new_grid.x + ', grid.y = ' + new_grid.y);

    var new_grid = this.pixelsToGrid(event);
    this.updatePopup({
        logical: this.gridToLogical(new_grid),
        pixels: {
            x: event.offsetX,
            y: event.offsetY
        }
    });
    //timer.Report();

    if (this.select_grid == null) return;
    if (!detectLeftButton(event)) {
        this.select_grid = null;
        return;
    }

    var dx = new_grid.x - this.select_grid.x;
    var dy = new_grid.y - this.select_grid.y;

    //console.log("distance = " + Math.sqrt(dx*dx+dy*dy));
    if (dx * dx + dy * dy < 0.3 * 0.3) {
        //console.log("Haven't moved far enough");
        return;
    }


    var data = this.gridToLogical(this.select_grid);
    this.select_grid = null;

    // Clicking a 2d picture
    if (this.data.dimension == 2) {
        if (data.dimension == this.diagram.getDimension() - 1) {
            // Clicking on an edge
            if (Math.abs(dx) < 0.25) return;
            data.directions = [dx > 0 ? +1 : -1];
        } else if (data.dimension == this.diagram.getDimension()) {
            // Clicking on a vertex
            if (Math.abs(dy) < 0.25) return;
            data.directions = [dy > 0 ? +1 : -1, dx > 0 ? +1 : -1];
        }

        // Clicking a 1d picture
    } else if (this.data.dimension == 1) {
        data.directions = [dx > 0 ? +1 : -1];
    }

    gProject.dragCellUI(data);
};

Display.prototype.updatePopup = function(data) {
    var popup = $('#diagram-popup');
    if (this.update_in_progress || data.logical == null) {
        popup.remove();
        this.popup = null;
        return;
    }

    // Create popup if necessary
    if (popup.length == 0) {
        popup = $('<div>').attr('id', 'diagram-popup').appendTo('#diagram-canvas');
    }

    this.popup = data.logical;
    var boundary = this.diagram.getBoundary(data.logical.boundary);
    var cell = boundary.getCell(data.logical.coordinates.reverse());
    var boundary_string = (data.logical.boundary == null ? '' : data.logical.boundary.type.repeat(data.logical.boundary.depth) + ' ');
    var description = cell.id.getFriendlyName() + ' @ ' + boundary_string + JSON.stringify(data.logical.coordinates);
    var pos = $('#diagram-canvas').position();
    popup.html(description)
        .css({
            left: 5 + pos.left + data.pixels.x,
            top: data.pixels.y - 28,
            position: 'absolute'
        });
}

Display.prototype.gridToLogical = function(grid) {
    if (grid == null) return null;
    if (this.data == null) return null;
    if (this.data.dimension == 0) return this.gridToLogical_0(grid);
    if (this.data.dimension == 1) return this.gridToLogical_1(grid);
    if (this.data.dimension == 2) return this.gridToLogical_2(grid);
}

Display.prototype.gridToLogical_0 = function(grid_coord) {
    var vertex = this.data.vertex;
    var dx = grid_coord.x - vertex.x;
    var dy = grid_coord.y - vertex.y;
    if (dx * dx + dy * dy > 0.1 * 0.1) return null;
    var padded = this.padCoordinates([0]);
    var position = this.diagram.getBoundaryCoordinates({
        coordinates: padded,
        allow_boundary: this.getBoundaryFlags()
    });
    position.dimension = this.diagram.getDimension();
    return position;
}

Display.prototype.gridToLogical_1 = function(grid_coord) {

    // Has the user clicked on a vertex?
    for (var i = 0; i < this.data.vertices.length; i++) {
        var vertex = this.data.vertices[i];
        var dx = grid_coord.x - vertex.x;
        var dy = grid_coord.y - vertex.y;
        if (dx * dx + dy * dy > 0.1 * 0.1) continue;

        // User has selected this vertex
        var padded = this.padCoordinates([vertex.level]);
        //if (this.slices.length > 0 && this.slices[0].attr('max') == 0) padded[0] = 1; // fake being in the target
        //console.log("Click on vertex at coordinates " + JSON.stringify(padded));
        var position = this.diagram.getBoundaryCoordinates({
            coordinates: padded,
            allow_boundary: this.getBoundaryFlags()
        });
        position.dimension = this.diagram.getDimension();
        return position;
    }

    // Get boundary distance
    var b = $(this.container)[0].bounds;
    var allow_s = Math.abs(grid_coord.x - b.left) < 0.25;
    var allow_t = Math.abs(grid_coord.x - b.right) < 0.25;
    //var boundary_distance = Math.min(Math.abs(grid_coord.x - b.left), Math.abs(grid_coord.x - b.right));
    //var allow_boundary = Math.abs(boundary_distance) < 0.25;

    // Has the user clicked on an edge?
    for (var i = 0; i < this.data.edges.length; i++) {
        var edge = this.data.edges[i];
        if (edge.start_x > grid_coord.x) continue;
        if (edge.finish_x < grid_coord.x) continue;
        // How close is this edge?
        var d = grid_coord.y - edge.y;
        if (Math.abs(d) > 0.05) continue;

        // User has clicked on this edge
        var padded = this.padCoordinates([edge.level, 0]);
        //if (this.slices.length > 0 && this.slices[0].attr('max') == 0) padded[0] = 1; // fake being in the target
        //console.log("Click on edge at coordinates " + JSON.stringify(padded));
        var position = this.diagram.getBoundaryCoordinates({
            coordinates: padded,
            allow_boundary: this.getBoundaryFlags().concat([{
                source: allow_s,
                target: allow_t
            }])
        });
        position.dimension = this.diagram.getDimension() - 1;
        return position;
    }

    // Clicked on nothing
    return null;

}

Display.prototype.gridToLogical_2 = function(grid_coord) {

    var height = grid_coord.y;

    // Make sure we're within the diagram bounds
    var b = $(this.container)[0].bounds;
    if (grid_coord.x < b.left) return null;
    if (grid_coord.x > b.right) return null;
    if (grid_coord.y < b.bottom) return null;
    if (grid_coord.y > b.top) return null;

    // Get boundary distance
    var allow_s1 = Math.abs(grid_coord.y - b.bottom) < 0.25;
    var allow_t1 = Math.abs(grid_coord.y - b.top) < 0.25;
    var allow_s2 = Math.abs(grid_coord.x - b.left) < 0.25;
    var allow_t2 = Math.abs(grid_coord.x - b.right) < 0.25;

    // Has the user clicked on a vertex?
    for (var i = 0; i < this.data.vertices.length; i++) {
        var vertex = this.data.vertices[i];
        var dx = grid_coord.x - vertex.x;
        var dy = grid_coord.y - vertex.y;
        if (dx * dx + dy * dy > 0.1 * 0.1) continue;

        // User has selected this vertex
        var padded = this.padCoordinates([vertex.level]);
        var position = this.diagram.getBoundaryCoordinates({
            coordinates: padded,
            allow_boundary: this.getBoundaryFlags()
        });
        position.dimension = this.diagram.getDimension();
        return position;
    }

    // Find the closest edge
    var best_edge_index = -1;
    var best_edge_distance = Number.MAX_VALUE;
    var slice_height = -1;
    var edges_to_left = 0;
    for (var i = 0; i < this.data.edges.length; i++) {
        var edge = this.data.edges[i];
        if (edge.start_height >= height) continue;
        if (edge.finish_height < height) continue;
        // How close is this edge?
        var d = grid_coord.x - edge.x;
        // If the edge is to the right, ignore it
        if (d < -0.1) continue;
        edges_to_left++;
        if (d < best_edge_distance) {
            best_edge_distance = d;
            best_edge_index = i;
        }
    }

    // Has the user clicked on an edge?
    if (Math.abs(best_edge_distance) < 0.05) {
        var padded = this.padCoordinates([Math.floor(height + 0.5 - b.bottom), edges_to_left - 1]);
        //if (this.slices.length > 0 && this.slices[0].attr('max') == 0) padded[0] = 1; // fake being in the target
        //console.log("Click on edge at coordinates " + JSON.stringify(padded));
        var position = this.diagram.getBoundaryCoordinates({
            coordinates: padded,
            allow_boundary: this.getBoundaryFlags().concat([{
                source: allow_s1,
                target: allow_t1
            }])
        });
        position.dimension = this.diagram.getDimension() - 1;
        return position;
    }

    // The user has clicked on a region
    var depth = this.visible_diagram.getSlice([edges_to_left, Math.floor(height + 0.5 - b.bottom)]).cells.length - 1; // no need to copy slice
    if (depth < 0) depth = 0;
    var padded = this.padCoordinates([Math.floor(height + 0.5 - b.bottom), edges_to_left, depth]);
    //if (this.slices.length > 0 && this.slices[0].attr('max') == 0) padded[0] = 1; // fake being in the target
    //console.log("Click on region at coordinates " + JSON.stringify(padded));
    var position = this.diagram.getBoundaryCoordinates({
        coordinates: padded,
        allow_boundary: this.getBoundaryFlags().concat([{
            source: allow_s1,
            target: allow_t1
        }, {
            source: allow_s2,
            target: allow_t2
        }])
    });
    position.dimension = this.diagram.getDimension() - 2;
    return position;
}

Display.prototype.mouseup = function(event) {
    if (this.select_grid == null) return;
    var position = this.gridToLogical(this.select_grid);
    if (position == null) {
        this.select_grid = null;
        return;
    }
    position.directions = null;
    gProject.dragCellUI(position);
}

Display.prototype.getExportRegion = function() {
    var b = $(this.container)[0].bounds;
    if (b === undefined) return;
    var top_left = this.gridToPixels({
        x: b.left,
        y: b.top
    });
    var bottom_right = this.gridToPixels({
        x: b.right,
        y: b.bottom
    });
    return {
        sx: top_left.x,
        sy: top_left.y,
        sWidth: bottom_right.x - top_left.x,
        sHeight: bottom_right.y - top_left.y,
        logical_width: b.right - b.left,
        logical_height: b.top - b.bottom
    };
}

Display.prototype.gridToPixels = function(grid) {
    var pixel = {};
    var b = $(this.container)[0].bounds;
    if (b === undefined) return;
    var pan = this.panzoom.getPan();
    var sizes = this.panzoom.getSizes();
    pixel.x = grid.x * sizes.realZoom + pan.x;
    pixel.y = (b.bottom - grid.y) * sizes.realZoom + pan.y;
    console.log("pixel.x:" + pixel.x + ", pixel.y:" + pixel.y);
    return pixel;
}

Display.prototype.pixelsToGrid = function(event) {
    var b = $(this.container)[0].bounds;
    if (b === undefined) return;
    var pan = this.panzoom.getPan();
    var sizes = this.panzoom.getSizes();
    var grid = {};
    grid.x = (event.offsetX - pan.x) / sizes.realZoom;
    grid.y = b.bottom + (pan.y - event.offsetY) / sizes.realZoom;
    console.log("grid.x:" + grid.x + ", grid.y:" + grid.y);
    this.gridToPixels(grid);
    return grid;

    /*
    var this_width = $(this.container).width();
    var this_height = $(this.container).height();
    if (this_width == 0) return null;
    if (this_height == 0) return null;
    var b = $(this.container)[0].bounds;
    if (b === undefined) return;
    b.top_left = {};
    b.height = b.top - b.bottom;
    b.width = b.right - b.left;
    if (this_width / this_height < b.width / b.height) {
        // Picture is short and fat, touching the sides of the viewing area
        b.top_left.pix_x = 0;
        b.top_left.pix_y = (this_height - (b.height * this_width / b.width)) / 2;
        b.pix_width = this_width;
        b.pix_height = b.height * this_width / b.width;
    } else {
        // Picture is tall and thin, touching the top and bottom of the viewing area
        b.top_left.pix_x = (this_width - (b.width * this_height / b.height)) / 2;
        b.top_left.pix_y = 0;
        b.pix_width = b.width * this_height / b.height;
        b.pix_height = this_height;
    }
    var x = b.left + (event.offsetX - b.top_left.pix_x) * b.width / b.pix_width;
    var y = b.top - (event.offsetY - b.top_left.pix_y) * b.height / b.pix_height;
    return {
        x: x,
        y: y
    };
    */
}

Display.prototype.has_controls = function() {
    return ($(this.container).children('div.control').length > 0);
}

// Make sure all the coordinates and suppressions make sense, bearing in mind
// that an attachment has just been performed at the specified location,
// so we want to keep it in view
Display.prototype.update_controls = function(drag, controls) {

    var timer = new Timer("Display.update_controls");

    // If there's no diagram, nothing to do
    if (this.diagram == null) return;

    // If there are no controls, create them
    if (!this.has_controls()) this.create_controls();

    // Update the suppression input
    var new_suppress = this.suppress_input.val();
    if (controls != null) new_suppress = controls.project;
    new_suppress = Math.min(new_suppress, this.diagram.getDimension());
    if (new_suppress < 0) new_suppress = 0;
    this.suppress_input.val(new_suppress);
    update_control_width(this.suppress_input);

    // Update the view dimension input
    if (this.view_input != null) {
        var new_view = Number(this.view_input.val());
        if (drag != undefined) {
            if (drag.boost) new_view++;
        }
        new_view = Math.min(2, new_view, this.diagram.getDimension() - new_suppress);
        this.view_input.val(new_view);
        update_control_width(new_view);
    }

    // Update the slice controls
    this.update_slice_container(drag, controls);

    timer.Report();
}

Display.prototype.control_change = function() {
    var timer = new Timer('Display.control_change');
    gProject.clearThumbnails();
    this.update_controls();
    this.render();
    timer.Report();
}

// Create the control panel, only called in the constructor
Display.prototype.create_controls = function() {
    var c = $(this.container);

    // Remove any existing controls
    $(this.container).children('div.control').remove();

    // Choose popout mode if the display is small
    var popout = (c.width() < 100 || c.height() < 100);

    // Construct the main control div
    this.control = $('<div>')
        .attr('id', 'main_view_control')
        .addClass('control')
        .addClass(popout ? 'popout' : 'inline')
        .mousedown(function(e) {
            e.stopPropagation()
        })
        .mouseup(function(e) {
            e.stopPropagation()
        })
        .click(function(e) {
            e.stopPropagation()
        });
    this.container.append(this.control);

    /*
    // Construct the dimension control
    this.control.append(document.createTextNode('Viewer dimension '));
    this.view_input =
        $('<input>')
        .attr('type', 'number')
        .addClass('control')
        .attr('min', 0)
        .attr('id', 'view_input')
        .val(this.diagram == null ? 0 : Math.min(2, this.diagram.getDimension()))
        .mouseover(function() {
            this.focus();
        });
    this.view_input.on('input', function(event) {
        self.control_change(event)
    });
    this.control.append(this.view_input);
    this.control.append(document.createElement('br'));
    */

    // Construct the project control
    this.control.append(document.createTextNode('Project '));
    this.suppress_input =
        $('<input>')
        .attr('type', 'number')
        .addClass('control')
        .attr('min', 0)
        .val(this.diagram == null ? 0 : Math.max(0, this.diagram.getDimension() - 2))
        .mouseover(function() {
            this.focus();
        });
    var self = this;
    this.suppress_input.on('input', function(event) {
        $('#view_input').val(10);
        self.control_change(event)
    });
    this.control.append(this.suppress_input);
    update_control_width(this.suppress_input);


    // Construct the container for the slice controls
    this.slice_div = $('<div>').addClass('slice_container');
    this.slice_div.append(document.createTextNode('Slice '));
    this.control.append(this.slice_div);
    this.slices = [];
}

Display.prototype.update_slice_container = function(drag, controls) {

    // If the diagram is null, we shouldn't have any slice controls
    if (this.diagram == null) {
        for (var i = 0; i < this.slices.length; i++) {
            this.slices[i].remove();
        }
        this.slices = [];
        return;
    }

    // Calculate the desired number of slice controls
    var remaining_dimensions = this.diagram.getDimension() - $(this.suppress_input).val() - 2 /*this.view_input.val()*/ ;
    if (remaining_dimensions < 0) remaining_dimensions = 0;

    // Remove any superfluous slice controls
    while (this.slices.length > remaining_dimensions) {
        this.slices.last().remove();
        this.slices.pop();
    }

    // Add any additional slice controls with a dimension of zero
    var self = this;
    for (var i = this.slices.length; i < remaining_dimensions; i++) {
        this.slices[i] =
            $('<input>')
            .addClass('control')
            .addClass('slice')
            .attr('type', 'number')
            .attr('min', 0)
            .val(0)
            .on('input', function(event) {
                //.change(function(event) {
                self.control_change(event)
            })
            .hover(
                // Mouse over
                function() {
                    var timer = new Timer('mouse over slicer')
                    this.focus();
                    self.highlight_slice(Number(this.getAttribute('index')));
                    timer.Report();
                    /*
                    if (Number(this.getAttribute('index')) == self.slices.length - 1) {
                        self.highlight_next_slice();
                    }
                    */
                },
                // Mouse out
                function() {
                    var timer = new Timer('mouse out of slicer');
                    self.remove_highlight();
                    timer.Report();
                });

        // Store the index of the slice control
        (function(i) {
            self.slices[i].attr('index', i)
        })(i);
        this.slice_div.append(this.slices[i]);
        update_control_width(this.slices[i]);
    }

    // If a particular boundary has been requested, make sure it is within view
    if (drag != null) {
        if (drag.boundary == null) {
            // Rewrite in the interior, so advance the last slider
            if (this.slices.length > 0) {
                var counter = this.slices.last();
                var current = Number(counter.val());
                counter.val(current + 1);
                update_control_width(counter);
            }
        } else {
            if (drag.boundary.depth > 0) {
                var slice_index = drag.boundary.depth - 1;
                if (drag.boundary.type == 't') {
                    if (slice_index < this.slices.length) {
                        var current = Number(this.slices[slice_index].val());
                        this.slices[slice_index].val(current + 1);
                        update_control_width(this.slices[slice_index]);
                    }
                }
            }
        }
    }

    // Ensure the slice coordinates are valid
    var slice = this.diagram; // no need to copy
    for (var i = 0; i < remaining_dimensions; i++) {
        var input = this.slices[i];
        var val = input.val();
        if (controls != null) {
            if (controls.slices[i] != null) {
                val = controls.slices[i];
            }
        }
        input.val(Math.min(val, Math.max(slice.cells.length, 1)));
        update_control_width(input);
        input.attr('max', Math.max(1, slice.cells.length));
        slice = slice.getSlice(input.val()); // no need to copy slice
    }

}

// Make the number scrollers the correct width
function update_control_width(input) {
    var length = String(input.val()).length;
    var width = 24 + 6 * length;
    $(input).css('max-width', width + 'px');
}

Display.prototype.highlight_slice = function(index) {

    // Get bounding box for entire action
    var location = [];
    for (var i = 0; i <= index; i++) {
        location.unshift(Number(this.slices[i].val()));
    }
    var box = this.diagram.getLocationBoundingBox(location);
    if (box == null) return; // no box to display

    // Get display data for bounding box
    var display_data = this.diagram.getLocationBoundaryBox(null, box, this.padCoordinates([]).reverse());
    if (display_data == null) return; // the box is invisible on the current slice

    this.highlight_box(display_data.box, display_data.boundary);

}

// Highlight a portion of the diagram
Display.prototype.highlight_next_slice = function() {

    // Don't highlight if we're on the last slice
    var slice_control = this.slices.last();
    if (slice_control.val() == slice_control.attr('max')) return;

    // Get the bounding box of the cell which is next to act
    var slice = this.diagram;
    for (var i = 0; i < this.slices.length - 1; i++) {
        slice = slice.getSlice(this.slices[i].val()); // no need to copy slice
    }
    var height = slice_control.val();

    // If the value is out of range (e.g. if we're on the source slice of an identity diagram,
    // do nothing)
    if (height >= slice.cells.length) return;

    var box = slice.cells[height].box;

    // Apply the highlight
    this.highlight_box(box);
}

Display.prototype.remove_highlight = function() {
    $(this.container).children('svg').children('g').children('g').children('g').remove();
}

Display.prototype.highlight_action = function(action, boundary) {

    // Get bounding box for entire action
    var slice = this.diagram;
    if (boundary != null) {
        for (var i = 0; i < boundary.depth - 1; i++) {
            slice = slice.getSourceBoundary();
        }
        if (boundary.type == 's') slice = slice.getSourceBoundary();
        else slice = slice.getTargetBoundary();
    }
    var boundary_box = slice.getBoundingBox(action);
    if (boundary_box == null) return;

    // Get display data for bounding box
    var display_data = this.diagram.getLocationBoundaryBox(boundary, boundary_box, this.padCoordinates([]).reverse());
    if (display_data == null) return;

    this.highlight_box(display_data.box, display_data.boundary);
}

// Highlight a portion of the diagram
Display.prototype.highlight_box = function(box, boundary) {

    // Remove an existing highlight
    this.remove_highlight();
    //$(this.container).children('svg').children('g').children('g').remove();

    // Add the highlight to the diagram
    globular_add_highlight(this.container, this.data, box, boundary, this.visible_diagram);
}

// Attach the given diagram to the window, showing at least the specified boundary
Display.prototype.set_diagram = function(data /*diagram, boundary, controls*/ ) {
    console.log("Set new diagram");
    if (data.diagram == null) {
        this.diagram = null;
        this.data = null;
        this.container.empty();
    } else {
        //this.diagram = diagram.copy();
        this.diagram = data.diagram;
        this.update_controls(data.drag, data.controls);
        this.render(data.preserve_view);
    }
}

Display.prototype.get_current_slice = function() {
    var position = [];
    for (var i = 0; i < this.slices.length; i++) {
        position.push(Number(this.slices[i].val()));
    }
    return position;
}

Display.prototype.render = function(preserve_view) {
    var timer = new Timer("Display.render");
    var slice = this.diagram;
    for (var i = 0; i < this.slices.length; i++) {
        slice = slice.getSlice(this.slices[i].val()); // no need to copy slice
    }
    this.visible_diagram = slice;
    var pan = null;
    var zoom = null;
    if (this.panzoom != null) {
        if (preserve_view) {
            pan = this.panzoom.getPan();
            zoom = this.panzoom.getZoom();
        }
        this.panzoom.destroy();
    }
    var data = globular_render(this.container, slice, this.highlight, this.suppress_input.val());
    this.svg_element = this.container.find('svg')[0];
    this.container.on('contextmenu', function(evt) {
        evt.preventDefault();
    })
    this.data = data;
    timer.Report();
    this.panzoom = svgPanZoom(this.container.find('svg')[0]);
    if (pan != null) {
        this.panzoom.zoom(zoom);
        this.panzoom.pan(pan);
    }

    // Render highlight if necessary
    if (this.slices.length > 0) {
        if (this.slices.last().is(":focus")) {
            this.highlight_next_slice();
        }
    }

    //if (data == null) return;
}

// Pads an object with 'boundary_depth' and 'logical' properties
Display.prototype.padLocation = function(location) {
    if (location.boundary_depth > 0) {
        location.boundary_depth += coordinates.length;
    }
    var pad_coordinates = [];
    for (var i = 0; i < this.slices.length; i++) {
        pad_coordinates[i] = Number(this.slices[i].val());
    }
    location.logical = pad_coordinates.concat(location.logical);
}

// Pads a coordinate array with the slider coordinates
Display.prototype.padCoordinates = function(position) {
    var pad_position = [];
    for (var i = 0; i < this.slices.length; i++) {
        pad_position[i] = Number(this.slices[i].val());
    }
    position = pad_position.concat(position);
    return position;
}

Display.prototype.getBoundaryFlags = function() {
    var flags = [];
    for (var i = 0; i < this.slices.length; i++) {
        var flag = {};
        var s = this.slices[i];
        flag.source = (s.val() == s.attr('min'));
        flag.target = (s.val() == s.attr('max'));
        flags.push(flag);
    }
    return flags;
}

Display.prototype.getControls = function() {
    return {
        project: this.suppress_input == null ? null : Number(this.suppress_input.val()),
        slices: this.slices == null ? null : this.padCoordinates([])
    }
}

Display.prototype.setControls = function(controls) {
    if (controls == null) return;
    if (this.suppress_input != null && controls.project != null) {
        this.suppress_input.val(controls.project);
    }
    if (this.slices != null && controls.slices != null) {
        for (var i = 0; i < controls.slices.length; i++) {
            if (this.slices[i] != undefined) {
                this.slices[i].val(controls.slices(i));
            }
        }
    }
}