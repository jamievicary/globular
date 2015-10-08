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
    this.prepare_controls();
    var self = this;
    $(container).mousedown(function(event) {
        self.mousedown(event)
    });
    $(container).mouseup(function(event) {
        self.mouseup(event)
    });
}

Display.prototype.mousedown = function(event) {
    if (this.active == null) return;
    if (this.active.length == 0) return;
    var closest_zone = null;
    var shortest_sq_dist = Number.MAX_VALUE;
    var logical = this.pixelsToLogical(event);
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
    //console.log(JSON.stringify(this.select_zone));
}

Display.prototype.mouseup = function(event) {
    var z = this.select_zone;
    if (z == null) return;
    var logical = this.pixelsToLogical(event);
    var dx = logical.x - this.select_logical.x;
    var dy = logical.y - this.select_logical.y;
    var data = {boundary_depth: z.boundary_depth, boundary_type: z.boundary_type, coordinates: z.logical};
    if (z.direction == 'horizontal' && Math.abs(dx) > 0.25) {
        data.positive = (dx > 0);
        gProject.drag_cell(data)
    }
    else if (z.direction == 'vertical' && Math.abs(dy) > 0.25) {
        data.positive = (dy > 0);
        gProject.drag_cell(data)
    }
    this.select_zone = null;
}

Display.prototype.pixelsToLogical = function(event) {

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
    }
    else {
        // Picture is tall and thin, touching the top and bottom of the viewing area
        b.top_left.pix_x = (this_width - (b.width * this_height / b.height)) / 2;
        b.top_left.pix_y = 0;
        b.pix_width = b.width * this_height / b.height;
        b.pix_height = this_height;
    }
    var x = 0.5 + b.left + (event.offsetX - b.top_left.pix_x) * b.width / b.pix_width;
    var y = b.top - (event.offsetY - b.top_left.pix_y) * b.height / b.pix_height;
    //var x = b.left + ((b.right - b.left) * event.offsetX / $(this).width());
    //var y = b.bottom + ((b.bottom - b.top) * event.offsetY / $(this).height());
    //console.log("Clicked pixel=(" + event.offsetX + "," + event.offsetY + ") = logical " + x + "," + y + ")");
    return {
        x: x,
        y: y
    };
}

Display.prototype.prepare_controls = function() {
    var c = $(this.container);
    this.suppress = 0;

    // Choose popout mode if the display is small
    var popout = (c.width() < 100 || c.height() < 100);

    this.control = $('<div>').addClass('control').addClass(popout ? 'popout' : 'inline');
    this.container.append(this.control);
    this.control.append(document.createTextNode('Suppress '));
    var suppress_input = document.createElement('input');
    suppress_input.type = 'number';
    suppress_input.className = 'control';
    suppress_input.min = 0;
    suppress_input.max = this.diagram.getDimension();
    this.control.append(suppress_input);
    var remaining_dimensions = this.diagram.getDimension() - this.suppress - 2;
    this.coordinates = [];

    if (remaining_dimensions > 0) {
        this.control.append($('<br>'));
        var slice = this.diagram.copy();
        for (var i = 0; i < remaining_dimensions; i++) {
            this.coordinates[i] =
                $('input')
                .addClass('control')
                .attr('type', 'number')
                .attr('min', 0)
                .attr('max', slice.nCells.length);
            this.control.append(this.coordinates[i]);
            var slice = slice.getSource();
        }
    }

    $(this.container).append(this.control);
}

// Attach the given diagram to the window
Display.prototype.set_diagram = function(diagram) {
    this.diagram = diagram;
    if (this.diagram == null) {
        this.container.empty();
    }
    else {
        this.render();
    }
}

Display.prototype.render = function() {

    // Slice the diagram appropriately
    var slice = this.diagram.copy();
    for (var i = 0; i < this.coordinates.length; i++) {
        slice = slice.getSlice(this.coordinates[i].val());
    }
    this.active = globular_render(this.container, slice, this.highlight);
    if (this.active == null) return;

    var pad_coordinates = [];
    for (var i = 0; i < this.coordinates.length; i++) {
        pad_coordinates[i] = this.coordinates[i].val();
    }
    for (var i = 0; i < this.active.length; i++) {

        // Pad the boundary depth if it's a boundary coordinate
        if (this.active[i].boundary_depth > 0) {
            this.active[i].boundary_depth += this.coordinates.length;
        }

        // Pad the logical coordinates with the slider coordinates
        this.active[i].logical = pad_coordinates.concat(this.active[i].logical);
    }

    // Add in the missing dimensions to the active region data
}
