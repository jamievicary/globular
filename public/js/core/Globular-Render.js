"use strict";

/*
    Diagram rendering with Three.js
*/

// Cool implementation idea for the future:
// http://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page

// Choose "SVG" or "THREE"
var render_mode = "SVG";
// var render_mode = "THREE";

var globular_offscreen = {};
var pixelScale = 1;
//var line_width = 0.01;
//var sphere_radius = 0.05;
var item_size = 0.05;
var Pi = 3.141592654;

// Create offscreen WebGL canvas
function globular_prepare_renderer() {
    
    if (render_mode == 'SVG') {
        // No init required for SVG
    }
    else if (render_mode == 'THREE') {
        globular_prepare_renderer_THREE();
    }
    else {
        alert ("Invalid render mode");
        return;
    }
}

// Render a diagram on the offscreen canvas, then copy to the specified container
function globular_render(container, diagram, subdiagram, suppress) {
    
    if (render_mode == 'SVG') {
        return globular_render_SVG(container, diagram, subdiagram, suppress);
    }
    else if (render_mode == 'THREE') {
        return globular_render_THREE(container, diagram, subdiagram);
    }
    else {
        alert("Invalid render mode");
        return null;
    }

}


