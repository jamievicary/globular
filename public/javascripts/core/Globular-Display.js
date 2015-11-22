"use strict";

/*
    A Display class for rendering diagrams.
    
    Members:
        - suppress : N, levels to supress
        - coordinates : Array, indices of the display positions
        - container: div to render 
        - control: div for controls
*/

var click_radius = 0.25;

// Constructor
function Display(container, diagram) {
    this.container = container;
    this.diagram = diagram;
    this.active = null;
    this.select_zone = null;
    this.suppress_input = null;
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

Display.prototype.mousedown = function(event) {

    /*
    if (this.active == null) return;
    if (this.active.length == 0) return;
    var closest_zone = null;
    var shortest_sq_dist = Number.MAX_VALUE;
    */

    // Ignore clicks outside the diagram region
    var b = $(this.container)[0].bounds;
    var logical = this.pixelsToGrid(event);
    if (logical.x < b.left) return;
    if (logical.x > b.right) return;
    if (logical.y < b.bottom) return;
    if (logical.y > b.top) return;
    this.select_grid = this.pixelsToGrid(event);

    /*
    //console.log("Detected click: " + JSON.stringify(logical));
    for (var i = 0; i < this.active.length; i++) {
        var zone = this.active[i];
        var dx = logical.x - zone.x;
        var dy = logical.y - zone.y;
        var sq_dist = dx * dx + dy * dy;
        if (sq_dist < shortest_sq_dist) {
            closest_zone = zone;
            shortest_sq_dist = sq_dist;
        }
        this.select_zone = closest_zone;
        this.select_logical = logical;
    }
    */
    //console.log("Detected mousedown: " + JSON.stringify(this.select_zone));
}

var min_drag = 0.25;
Display.prototype.mousemove = function(event) {

    if (this.select_grid == null) return;
    if (!detectLeftButton(event)) {
        this.select_grid = null;
        return;
    }

    var new_grid = this.pixelsToGrid(event);
    var dx = new_grid.x - this.select_grid.x;
    var dy = new_grid.y - this.select_grid.y;

    //console.log("distance = " + Math.sqrt(dx*dx+dy*dy));
    if (dx * dx + dy * dy < 0.3 * 0.3) {
        //console.log("Haven't moved far enough");
        return;
    }


    var data = this.gridToLogical(this.select_grid);
    this.select_grid = null;

    if (data.dimension == this.diagram.getDimension() - 1) {
        // Clicking on an edge
        if (Math.abs(dx) < 0.25) return;
        data.directions = [dx > 0 ? +1 : -1];
    } else if (data.dimension == this.diagram.getDimension()) {
        // Clicking on a vertex
        if (Math.abs(dy) < 0.25) return;
        data.directions = [dy > 0 ? +1 : -1, dx > 0 ? +1 : -1];
    }

    gProject.dragCell(data);
};

Display.prototype.gridToLogical = function(grid_coord) {

    var height = grid_coord.y;

    // Has the user clicked on a vertex?
    for (var i = 0; i < this.data.vertices.length; i++) {
        var vertex = this.data.vertices[i];
        var dx = grid_coord.x - vertex.x;
        var dy = grid_coord.y - vertex.y;
        if (dx * dx + dy * dy > 0.15 * 0.15) continue;

        // User has selected this vertex
        var padded = this.padCoordinates([vertex.level]);
        console.log("Click on vertex at coordinates " + JSON.stringify(padded));
        var position = this.diagram.getBoundaryCoordinates(padded, false);
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
        if (edge.start_height > height) continue;
        if (edge.finish_height < height) continue;
        // How close is this edge?
        var d = grid_coord.x - edge.x;
        // If the edge is to the right, ignore it
        if (d < -0.1) continue;
        edges_to_left ++;
        if (d < best_edge_distance) {
            best_edge_distance = d;
            best_edge_index = i;
        }
    }
    
    // Has the user clicked on an edge?
    if (Math.abs(best_edge_distance) < 0.1) {
        var padded = this.padCoordinates([Math.floor(height + 0.5), edges_to_left - 1]);
        console.log("Click on edge at coordinates " + JSON.stringify(padded));
        var position = this.diagram.getBoundaryCoordinates(padded, true);
        position.dimension = this.diagram.getDimension() - 1;
        return position;
    }

    // The user has clicked on a region
    var padded = this.padCoordinates([Math.floor(height + 0.5), edges_to_left, 0]);
    console.log("Click on region at coordinates " + JSON.stringify(padded));
    var position = this.diagram.getBoundaryCoordinates(padded, true);
    position.dimension = this.diagram.getDimension() - 2;
    return position;
}

Display.prototype.mouseup = function(event) {
    if (this.select_grid == null) return;
    var position = this.gridToLogical(this.select_grid);
    position.directions = null;
    gProject.dragCell(position);
}

Display.prototype.pixelsToGrid = function(event) {

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
}

Display.prototype.has_controls = function() {
    return ($(this.container).children('div.control').length > 0);
}

// Make sure all the coordinates and suppressions make sense, bearing in mind
// that an attachment has just been performed at the specified location,
// so we want to keep it in view
Display.prototype.update_controls = function(boundary) {

    // If there's no diagram, nothing to do
    if (this.diagram == null) return;

    // If there are no controls, create them
    if (!this.has_controls()) this.create_controls();

    // Update the suppression input
    var new_suppress = this.suppress_input.val();
    new_suppress = Math.min(new_suppress, this.diagram.getDimension() - 1);
    if (new_suppress < 0) new_suppress = 0;
    this.suppress_input.val(new_suppress);

    // Update the slice controls
    this.update_slice_container(boundary);
}

Display.prototype.update_sliders = function() {

}

Display.prototype.control_change = function() {
    this.update_controls();
    this.render();
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

    // Construct the suppress control
    this.control.append(document.createTextNode('Suppress '));
    this.suppress_input =
        $('<input>')
        .attr('type', 'number')
        .addClass('control')
        .attr('min', 0)
        .val(0)
        .mouseover(function() {
            this.focus();
        });
    var self = this;
    this.suppress_input.on('input', function(event) {
        self.control_change(event)
    });
    this.control.append(this.suppress_input);

    // Construct the container for the slice controls
    this.slice_div = $('<div>').addClass('slice_container');
    this.slice_div.append(document.createTextNode('Slice '));
    this.control.append(this.slice_div);
    this.slices = [];
}

Display.prototype.update_slice_container = function(drag) {

    // If the diagram is null, we shouldn't have any slice controls
    if (this.diagram == null) {
        for (var i = 0; i < this.slices.length; i++) {
            this.slices[i].remove();
        }
        this.slices = [];
        return;
    }

    // Calculate the desired number of slice controls
    var remaining_dimensions = this.diagram.getDimension() - $(this.suppress_input).val() - 2;
    if (remaining_dimensions < 0) remaining_dimensions = 0;

    // Remove any superfluous slice controls
    while (this.slices.length > remaining_dimensions) {
        this.slices.last().remove();
        this.slices.pop();
    }

    // If a particular boundary has been requested, make sure it is within view
    if (drag != null) {
        if (drag.boundary == null) {
            // Rewrite in the interior, so advance the last slider
            if (this.slices.length > 0) {
                var counter = this.slices.last();
                var current = Number(counter.val());
                counter.val(current + 1);
            }
        } else {
            if (drag.boundary.depth > 0) {
                var slice_index = drag.boundary.depth - 1;
                if (drag.boundary.type == 't') {
                    if (slice_index < this.slices.length) {
                        var current = Number(this.slices[slice_index].val());
                        this.slices[slice_index].val(current + 1);
                    }
                }
            }
        }
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
                self.control_change(event)
            })
            .mouseover(function() {
                this.focus();
            });
        this.slice_div.append(this.slices[i]);
    }

    // Ensure the slice coordinates are valid
    var slice = this.diagram.copy();
    for (var i = 0; i < remaining_dimensions; i++) {
        var input = this.slices[i];
        input.val(Math.min(input.val(), slice.cells.length));
        input.attr('max', slice.cells.length);
        slice = slice.getSlice(input.val());
    }
}

// Attach the given diagram to the window, showing at least the specified boundary
Display.prototype.set_diagram = function(diagram, boundary) {
    this.diagram = diagram;
    if (this.diagram == null) {
        this.container.empty();
    } else {
        this.update_controls(boundary);
        this.render();
    }
}

Display.prototype.get_current_slice = function() {
    var position = [];
    for (var i = 0; i < this.slices.length; i++) {
        position.push(Number(this.slices[i].val()));
    }
    return position;
}

Display.prototype.render = function() {
    var t = performance.now();
    var slice = this.diagram.copy();
    for (var i = 0; i < this.slices.length; i++) {
        slice = slice.getSlice(this.slices[i].val());
    }
    this.visible_diagram = slice;
    var data = globular_render(this.container, slice, this.highlight, this.suppress_input.val());
    console.log("Display.render: time " + Math.floor(performance.now() - t) + 'ms');
    if (data == null) return;
    this.data = data.data;
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
