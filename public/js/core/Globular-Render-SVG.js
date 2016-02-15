"use strict";

/*
    SVG rendering of 2d diagrams
*/

// Parameter that sets the hardness of string diagram curves
var shoulder_strength = 0.1;
var circle_radius = 0.1;
var highlight_colour = '#ffff00';
var highlight_opacity = 0.8;

function SVGRenderContext(container, min_x, max_x, min_y, max_y) {
    this.container = null;
    this.svg = null;
    this.g = null;
    this.path_string = "";

    return this;
}

SVGRenderContext.prototype.init = function(container, min_x, max_x, min_y, max_y) {
    this.container = $(container);
    this.container.children('svg').remove();
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    this.svg.setAttributeNS(null, "viewBox", (min_x).toString() + " " + (-max_y.toString()) + " " + (max_x - min_x) + " " + (max_y - min_y));
    this.svg.setAttributeNS(null, "preserveAspectRatio", "xMidYMid meet");
    this.svg.setAttribute("width", this.container.width());
    this.svg.setAttribute("height", this.container.height());
    this.svg.appendChild(this.g);
    this.g.setAttributeNS(null, "transform", "scale (1 -1)");
}

SVGRenderContext.prototype.render = function() {
    this.container.children('svg').remove();
    this.container.append(this.svg);
}

SVGRenderContext.prototype.startPath = function() {
    this.path_string = "";
}


SVGRenderContext.prototype.finishPath = function(data) {
    if (data == undefined) { data = {}; }
    if (data.stroke_width === undefined) data.stroke_width = 0.1;
    if (data.stroke === undefined) data.stroke = "none";
    if (data.fill === undefined) data.fill = "none";
    if (data.stroke_opacity === undefined) data.stroke_opacity = "1";
    if (data.fill_opacity === undefined) data.fill_opacity = "1";
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttributeNS(null, "d", this.path_string);
    path.setAttributeNS(null, "stroke-width", data.stroke_width);
    path.setAttributeNS(null, "stroke", data.stroke);
    path.setAttributeNS(null, "fill", data.fill);
    path.setAttributeNS(null, "stroke-opacity", data.stroke_opacity);
    path.setAttributeNS(null, "fill-opacity", data.fill_opacity);
    if (data.mask != null) path.setAttributeNS(null, "mask", data.mask);
    
    this.g.appendChild(path);
    return path;
}


SVGRenderContext.prototype.moveTo = function(p) {
    if (p.x === undefined) throw 0;
    if (p.y === undefined) throw 0;

    this.path_string += "M " + p.x + " " + p.y + " ";
}

SVGRenderContext.prototype.lineTo = function(p) {
    if (p.x === undefined) {
        throw 0;
    }
    if (p.y === undefined) throw 0;

    this.path_string += "L " + p.x + " " + p.y + " ";
}

SVGRenderContext.prototype.bezierTo = function(p) {
    if (p.c1x === undefined) throw 0;
    if (p.c1y === undefined) throw 0;
    if (p.c2x === undefined) throw 0;
    if (p.c2y === undefined) throw 0;
    if (p.x === undefined) throw 0;
    if (p.y === undefined) throw 0;
    
    this.path_string += "C " + p.c1x + " " + p.c1y + ", " + p.c2x + " " + p.c2y + ", " + p.x + " " + p.y + " ";
}

SVGRenderContext.prototype.drawCircle = function(data) {
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    if (data.radius == undefined) data.radius = 0.05;
    circle.setAttributeNS(null, "cx", data.x);
    circle.setAttributeNS(null, "cy", data.y);
    circle.setAttributeNS(null, "r", data.radius);
    circle.setAttributeNS(null, "fill", data.fill);
    circle.setAttributeNS(null, "stroke", "none");
    this.g.appendChild(circle);
}

SVGRenderContext.prototype.drawNode = function(cx, cy, radius, colour) {
    this.drawCircle({x: cx, y: cy, radius: radius, fill: colour});
}

SVGRenderContext.prototype.drawEmpty = function(colour) {
    this.g.appendChild(SVG_create_path({
        string: "M -0.5 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5  0.5",
        fill: colour
    }));
}

SVGRenderContext.prototype.drawLine = function(x1, y1, x2, y2, colour, opacity) {
    if (opacity == null) opacity = 1.0;
    this.startPath();
    this.moveTo({x:x1, y:y1});
    this.lineTo({x:x2, y:y2});
    this.finishPath({'stroke_opacity':opacity, 'stroke': colour});
}

SVGRenderContext.prototype.drawRect = function(x, y, w, h, colour, opacity) {
    var x1 = x + w;
    var y1 = y + h;
    this.startPath();
    this.moveTo({x:x, y:y});
    this.lineTo({x:x1, y:y});
    this.lineTo({x:x1, y:y1});
    this.lineTo({x:x, y:y1});
    this.finishPath({fill: colour, 'fill_opacity': 0.5});
}

//var globular_renderer = new SVGRenderContext();

function globular_set_viewbox() {
    var container = $('#diagram-canvas');
    $('#diagram-canvas>svg').css("width", container.width()).css("height", container.height());
}

function globular_render_SVG(container, diagram, subdiagram, suppress) {
    if (suppress == undefined) suppress = 0;
    var container_dom = $(container)[0];
    container_dom.rectangles = [];
    diagram = diagram.copy();

    var r = new SVGRenderContext();
    var data;

    if (diagram.getDimension() - suppress == 0) {

        r.init(container, -0.5, 0.5, -0.5, 0.5);
        $(container)[0].bounds = {
            left: -0.5,
            right: 0.5,
            top: 0.5,
            bottom: -0.5
        };
        data = globular_render_0d(r, diagram, subdiagram);

    } else if (diagram.getDimension() - suppress == 1) {

        var length = Math.max(1, diagram.cells.length);
        r.init(container, 0, length, -0.5, 0.5);
        $(container)[0].bounds = {
            left: 0,
            right: length,
            top: 0.5,
            bottom: -0.5
        };
        data = globular_render_1d(r, diagram, subdiagram);

    } else if (diagram.getDimension() - suppress >= 2) {
        data = globular_render_2d(r, container, diagram, subdiagram);
    }

    data.renderContext = r;
    return data;
}

