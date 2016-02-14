"use strict";

/*
    SVG rendering of 2d diagrams
*/

// Parameter that sets the hardness of string diagram curves
var shoulder_strength = 0.1;
var circle_radius = 0.1;
var highlight_colour = '#ffff00';
var highlight_opacity = 0.8;

function SVGRender(container, min_x, max_x, min_y, max_y) {
    this.container = null;
    this.svg = null;
    this.g = null;
    this.path_string = "";

    return this;
}

SVGRender.prototype.init = function(container, min_x, max_x, min_y, max_y) {
    this.container = $(container);
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    this.svg.setAttributeNS(null, "viewBox", (min_x).toString() + " " + (-max_y.toString()) + " " + (max_x - min_x) + " " + (max_y - min_y));
    this.svg.setAttributeNS(null, "preserveAspectRatio", "xMidYMid meet");
    this.svg.setAttribute("width", this.container.width());
    this.svg.setAttribute("height", this.container.height());
    this.svg.appendChild(this.g);
    this.g.setAttributeNS(null, "transform", "scale (1 -1)");
}

SVGRender.prototype.render = function() {
    this.container.children('svg').remove();
    this.container.append(this.svg);
}

SVGRender.prototype.startPath = function() {
    this.path_string = "";
}

SVGRender.prototype.finishPath = function(colour, args) {
    if (args == undefined) { args = {}; }
    args.string = this.path_string;
    this.g.appendChild(SVG_create_path(args));
}

SVGRender.prototype.moveTo = function(x, y) {
    this.path_string += SVG_move_to({x: x, y: y});
}

SVGRender.prototype.lineTo = function(x, y) {
    this.path_string += SVG_line_to({x: x, y: y});
}

SVGRender.prototype.bezierTo = function(c1x, c1y, c2x, c2y, x, y) {
    this.path_string += SVG_bezier_to({
        c1x: c1x,
        c1y: c1y,
        c2x: c2x,
        c2y: c2y,
        x: x,
        y: y
    });
}

SVGRender.prototype.drawCircle = function(data) {
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    if (data.radius == undefined) data.radius = 0.05;
    circle.setAttributeNS(null, "cx", data.x);
    circle.setAttributeNS(null, "cy", data.y);
    circle.setAttributeNS(null, "r", data.radius);
    circle.setAttributeNS(null, "fill", data.fill);
    circle.setAttributeNS(null, "stroke", "none");
    this.g.appendChild(circle);
}

SVGRender.prototype.drawNode = function(cx, cy, radius, colour) {
    this.drawCircle({x: cx, y: cy, radius: radius, fill: colour});
}

SVGRender.prototype.drawEmpty = function(colour) {
    this.g.appendChild(SVG_create_path({
        string: "M -0.5 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5  0.5",
        fill: colour
    }));
}

SVGRender.prototype.drawLine = function(x1, y1, x2, y2, colour, opacity) {
    if (opacity == null) opacity = 1.0;
    this.startPath();
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.finishPath(colour, {'stroke-opacity':opacity, 'stroke': colour});
}

SVGRender.prototype.drawRect = function(x, y, w, h, colour) {
    var x1 = x + w;
    var y1 = y + h;
    this.startPath();
    this.moveTo(x, y);
    this.lineTo(x1, y);
    this.lineTo(x1, y1);
    this.lineTo(x, y1);
    this.finishPath({fill: colour});
}

var globular_renderer = new SVGRender();

function globular_set_viewbox() {
    var container = $('#diagram-canvas');
    $('#diagram-canvas>svg').css("width", container.width()).css("height", container.height());
}

function globular_render(container, diagram, subdiagram, suppress) {
    if (suppress == undefined) suppress = 0;
    var container_dom = $(container)[0];
    container_dom.rectangles = [];
    diagram = diagram.copy();
    if (diagram.getDimension() - suppress == 0) {
        return globular_render_0d(container, diagram, subdiagram);
    } else if (diagram.getDimension() - suppress == 1) {
        return globular_render_1d(container, diagram, subdiagram);
    } else if (diagram.getDimension() - suppress >= 2) {
        return globular_render_2d(container, diagram, subdiagram);
    }
}

function prepare_SVG_container(container, diagram, min_x, max_x, min_y, max_y) {
    container = $(container);
    container.children('svg').remove();
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    var x_center = (min_x + max_x) / 2;
    var y_center = (min_y + max_y) / 2;
    var w, h;
    /* special display mode for bio pictures
    if (container.attr('id') == 'diagram-canvas' && diagram.getDimension() == 2 && diagram.source.cells.length == 0) {
        w = 15;
        h = 15;
        svg.setAttributeNS(null, "viewBox", (x_center - w / 2).toString() + " " + (-y_center - h / 2).toString() + " " + w + " " + h);
    }
    else {
    */
    svg.setAttributeNS(null, "viewBox", (min_x).toString() + " " + (-max_y.toString()) + " " + (max_x - min_x) + " " + (max_y - min_y));
    //}
    svg.setAttributeNS(null, "preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("width", container.width());
    svg.setAttribute("height", container.height());
    //container.append(svg);
    svg.appendChild(g);
    g.setAttributeNS(null, "transform", "scale (1 -1)");
    return {
        svg: svg,
        g: g
    };
}

function globular_render_0d(container, diagram, subdiagram) {
    var r = globular_renderer;
    r.init(container, -0.5, 0.5, -0.5, 0.5);

    $(container)[0].bounds = {
        left: -0.5,
        right: 0.5,
        top: 0.5,
        bottom: -0.5
    };

    var id_data = diagram.getLastId();
    r.drawNode(0, 0, circle_radius, gProject.getColour(id_data));
    r.render();

    return {
        vertex: {
            x: 0,
            y: 0,
            id: id_data.id
        },
        dimension: 0
    };
}

function globular_render_1d(container, diagram, subdiagram) {
    var length = Math.max(1, diagram.cells.length);
    var r = globular_renderer;
    r.init(container, 0, length, -0.5, 0.5);

    $(container)[0].bounds = {
        left: 0,
        right: length,
        top: 0.5,
        bottom: -0.5
    };

    var data = {
        vertices: [],
        edges: [],
        dimension: 1
    };

    // Draw line segments except last
    for (var i = 0; i < diagram.cells.length; i++) {
        var start_x = (i == 0 ? 0 : i - 0.5);
        var finish_x = i + 0.5;
        r.drawLine(start_x, 0, finish_x, 0, diagram.getSlice(i).getLastColour());

        data.edges.push({
            start_x: start_x,
            finish_x: finish_x,
            y: 0,
            id: diagram.getSlice(i).getLastId(),
            level: i
        });
    }

    // Draw last line segment
    var start_x = length - 0.5 - (diagram.cells.length == 0 ? 0.5 : 0);
    var finish_x = length;
    //var id = diagram.getTargetBoundary().cells[0].id;
    var id_data = diagram.getTargetBoundary().getLastId();
    r.drawLine(start_x, 0, finish_x, 0, gProject.getColour(id_data));
    data.edges.push({
        start_x: start_x,
        finish_x: finish_x,
        y: 0,
        id: id_data.id,
        level: diagram.cells.length
    });

    // Draw vertices
    var dimension = diagram.getDimension();
    for (var i = 0; i < diagram.cells.length; i++) {
        var id = diagram.cells[i].id;
        var colour = gProject.getColour({
            id: id,
            dimension: dimension
        });
        
        var x = i + 0.5;
        var y = 0;

        r.drawNode(x, y, circle_radius, colour);

        data.vertices.push({
            x: x,
            y: y,
            radius: circle_radius,
            id: id,
            level: i
        });
    }

    // Draw highlight
    if (subdiagram != undefined) {
        if (subdiagram.boundaryType == 's' && subdiagram.visibleBoundaryDepth == 1) {
            r.drawLine(0, 0, 0.25, 0, highlight_colour, highlight_opacity);
        } else if (subdiagram.boundaryType == 't' && subdiagram.visibleBoundaryDepth == 1) {
            r.drawLine(length, 0, length - 0.25, 0, highlight_colour, highlight_opacity);
        }
    }

    r.render();
    return data;
}

// Render the top 2 dimensions of a diagram
function globular_render_2d(container, diagram, subdiagram) {
    var r = globular_renderer;

    // Deal with an empty 2-diagram specially
    if ((diagram.cells.length == 0) && (diagram.source.cells.length == 0)) {
        r.init(container, -0.5, 0.5, -0.5, 0.5);
        r.drawEmpty(diagram.getLastColour());
        r.render();

        $(container)[0].bounds = {
            left: -0.5,
            right: 0.5,
            top: 0.5,
            bottom: -0.5
        };
        return {
            dimension: 2,
            edges: [],
            vertices: [],
            edges_at_level: [[],[]]
        };
    }

    var data = SVG_prepare(diagram);

    // Prepare the SVG group in which to render the diagram
    r.init(container, -0.5, data.max_x + 0.5, 0, Math.max(1, diagram.cells.length));
    //var d = prepare_SVG_container(container, diagram, -0.5, data.max_x + 0.5, 0, Math.max(1, diagram.cells.length));
    var defs = $('<defs>');
    $(r.svg).prepend(defs); // AK --- not sure what to do here....

    // Draw overall background rectangle
    //var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    //var big_background = ($(container).attr('id') == 'diagram-canvas') && (diagram.source.cells.length == 0);
    var big_background = false;
    var x_center = (data.max_x + 0) / 2;
    var y_center = Math.max(1, data.vertices.length) / 2;
    var w = big_background ? 20 : data.max_x + 1;
    var h = big_background ? 20 : Math.max(1, data.vertices.length);

    // Determine background colour
    var color = diagram.source.source.getLastColour();
    r.drawRect(x_center - w / 2, y_center - h / 2, w, h, color);

    
    $(container)[0].bounds = {
        left: -0.5,
        right: data.max_x + 0.5,
        top: Math.max(1, data.vertices.length),
        bottom: 0
    };


    // Check to see if there's a level with no edges
    var empty_level = false;
    for (var i = 0; i < data.edges_at_level.length; i++) {
        if (data.edges_at_level[i].length == 0) {
            empty_level = true;
            break;
        }
    }

    // Calculate Bezier intersection data for crossings
    for (var i = 0; i < data.vertices.length; i++) {
        var vertex = data.vertices[i];
        if (!vertex.type.is_basic_interchanger()) continue;
        var e1_bot, e2_bot, e1_top, e2_top;
        var p = (vertex.type == 'Int' ? 1 : 0);
        var q = 1 - p;
        e1_bot = data.edges[vertex.source_edges[p]];
        e2_bot = data.edges[vertex.source_edges[q]];
        e1_top = data.edges[vertex.target_edges[q]];
        e2_top = data.edges[vertex.target_edges[p]];
        vertex.intersection = bezier_decompose(Math.min(e1_bot.x, e2_bot.x), Math.max(e1_bot.x, e2_bot.x), Math.min(e1_top.x, e2_top.x), Math.max(e1_top.x, e2_top.x), i);
        vertex.y = vertex.intersection.centre[1];
    }

    for (var i = -1; i < data.edges.length; i++) {
        // Fill the extended area to the right of edge i
        var edge;
        if (i < 0) {
            // Only draw this right-hand region first if there are no empty levels
            if (empty_level) continue;
            var source_edges = data.edges_at_level[0];
            edge = data.edges[source_edges[source_edges.length - 1]];
        } else {
            edge = data.edges[i];
        }
        if (edge.fill_right) continue;
        var draw_up = true;

        var instructions = {
            edge: edge,
            draw_up: true,
            path_string: "",
            turning: 0,
            avoid_boundary: (i >= 0)
        };

        r.startPath();
        do {
            instructions.edge.adjacent_regions.push(edge);
            process_instructions(data, instructions);
            if (instructions.edge == null) break;
        } while (instructions.edge != edge);
        if (instructions.edge == null) {
            continue;
        }
        if (instructions.turning < 0) {
            continue;
        }



        //var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        //path.setAttributeNS(null, "d", instructions.path_string);
        
        var colour;
        if (edge.type == null) {
            colour = '#ffffff';
        } else {
            var level = Math.ceil(edge.start_height);
            var sublevel;
            if (i < 0) {
                sublevel = data.edges_at_level[level].length - 1;
            } else {
                sublevel = data.edges_at_level[level].indexOf(i);
            }
            var sd = diagram.getSlice(level).getSlice(sublevel + 1);
            colour = sd.getLastColour();
        }

        r.finishPath({'stroke-width': 0.01, stroke: 'none', fill: colour});

        //path.region = edge; // AK --- does this need to be saved here?
        //d.g.appendChild(path);
    }

    // Draw the edges
    for (var i = 0; i < data.edges.length; i++) {
        var edge = data.edges[i];
        //var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        r.startPath();

        // Detect if we start or finish on a boundary
        var start_boundary = (edge.start_height == 0);
        var finish_boundary = (edge.finish_height == Math.max(1, diagram.cells.length));

        //var path_s = "";
        var drawn_something = false;

        // Draw line out of start vertex 
        if (start_boundary) {
            // We start at the boundary
            //path_s += SVG_move_to({
            //    x: edge.x,
            //    y: 0
            //});
            r.moveTo(edge.x, 0);
        } else {
            // We start at a vertex
            var vertex = data.vertices[edge.start_vertex];
            if (vertex.type.is_basic_interchanger()) {
//                 path_s = SVG_move_to({
//                     x: edge.x,
//                     y: edge.start_height + 0.5
//                 });
                r.moveTo(edge.x, edge.start_height + 0.5);
            } else {
                //path_s += SVG_move_to({
                //    x: vertex.x,
                //    y: vertex.y
                //});
                r.moveTo(vertex.x, vertex.y);
                //path_s += SVG_line_to(edge.x, edge.start_height + 0.5);
//                 path_s += SVG_bezier_to({
//                     c1x: edge.x,
//                     c1y: vertex.y,
//                     c2x: edge.x,
//                     c2y: vertex.y + 0.4,
//                     x: edge.x,
//                     y: edge.start_height + 0.5
//                 });
                r.bezierTo(edge.x, vertex.y, edge.x, vertex.y + 0.5, edge.x, edge.start_height);
                drawn_something = true;
            }
        }

        // Do the main straight part of the edge
        var draw_main = false;
        if (edge.finish_height > edge.start_height + 1) {
//             path_s += SVG_line_to({
//                 x: edge.x,
//                 y: edge.finish_height - 0.5
//             });
            r.lineTo(edge.x, edge.finish_height - 0.5);
            drawn_something = true;
            draw_main = true;
        }

        // Do the top bit of the path
        if (finish_boundary) {
            // Nothing to do, unless also coming from source boundary
            //            if (edge.start_height == 0) {
//             path_s += SVG_line_to({
//                 x: edge.x,
//                 y: edge.finish_height
//             });
            r.lineTo(edge.x, edge.finish_height);
            drawn_something = true;
            //            }
        } else {
            var vertex = data.vertices[edge.finish_vertex];
            if (!vertex.type.is_basic_interchanger()) {
                //path_s += SVG_line_to(vertex.x, vertex.height + 0.5);
//                 path_s += SVG_bezier_to({
//                     c1x: edge.x,
//                     c1y: vertex.y - 0.4,
//                     c2x: edge.x,
//                     c2y: vertex.y,
//                     x: vertex.x,
//                     y: vertex.y
//                 });
                r.bezierTo(edge.x, vertex.y - 0.4, edge.x, vertex.y, vertex.x, vertex.y);
                drawn_something = true;
            }
        }

        // Add the path to the SVG object
        if (drawn_something) {
//             path.setAttributeNS(null, "d", path_s);
//             path.setAttributeNS(null, "stroke", gProject.getColour({
//                 id: edge.type,
//                 dimension: diagram.getDimension() - 1
//             }));
//             path.setAttributeNS(null, "stroke-width", 0.1);
//             path.setAttributeNS(null, "fill", "none");
//             d.g.appendChild(path);
            var colour =  gProject.getColour({
                id: edge.type,
                dimension: diagram.getDimension() - 1
            });
            r.finishPath({stroke: colour, 'stroke-width': 0.1, fill: 'none'});
        }
    }

    // Draw the vertices
    var epsilon = 0.0;
    for (var i = 0; i < data.vertices.length; i++) {

        var vertex = data.vertices[i];
        vertex.dimension = diagram.getDimension();

        if (vertex.type.is_basic_interchanger()) {

            // Draw the interchanger. First, decide which strand goes on top
            var e1_bot, e2_bot, e1_top, e2_top;
            var p = (vertex.type == 'Int' ? 1 : 0);
            var q = 1 - p;
            e1_bot = data.edges[vertex.source_edges[p]];
            e2_bot = data.edges[vertex.source_edges[q]];
            e1_top = data.edges[vertex.target_edges[q]];
            e2_top = data.edges[vertex.target_edges[p]];
            var left = Math.min(e1_bot.x, e2_bot.x, e1_top.x, e2_top.x) - 1;
            var right = Math.max(e1_bot.x, e2_bot.x, e1_top.x, e2_top.x) + 1;

            var lower_colour = gProject.getColour({
                id: e1_bot.type,
                dimension: diagram.getDimension() - 1
            });
            var upper_colour = gProject.getColour({
                id: e2_bot.type,
                dimension: diagram.getDimension() - 1
            });

            // Draw lower path, possibly using an obscuring mask (disabled)
//             var obscure = false;
//             //var obscure = vertex.type.tail('Int', 'IntI0'); // obscure only for basic interchangers
//             var mask_id = 0; //"mask" + i;
//             if (obscure) {
//                 // Add the obscuring mask, which is a fattened version of the upper line
//                 var mask = $('<mask>', {
//                     id: mask_id
//                 });
//                 var transparent_str = SVG_move_to({
//                     x: left,
//                     y: i
//                 }) + SVG_line_to({
//                     x: left,
//                     y: i + 1
//                 }) + SVG_line_to({
//                     x: right,
//                     y: i + 1
//                 }) + SVG_line_to({
//                     x: right,
//                     y: i
//                 }) + SVG_line_to({
//                     x: left,
//                     y: i
//                 });
//                 mask.append(SVG_create_path({
//                     string: transparent_str,
//                     fill: "white"
//                 }));
//                 mask.append(SVG_create_path({
//                     string: top_str,
//                     stroke_width: 0.2,
//                     stroke: "black"
//                 }));
//                 //g.appendChild(mask[0]);
//                 defs.append(mask);

//             }

            // Draw the lower path
//             var bot_str = SVG_move_to({
//                 x: e1_bot.x,
//                 y: i - epsilon
//             }) + SVG_bezier_to({
//                 c1x: e1_bot.x,
//                 c1y: i + 0.5,
//                 c2x: e1_top.x,
//                 c2y: i + 0.5,
//                 x: e1_top.x,
//                 y: i + 1 + epsilon
//             });
//             d.g.appendChild(SVG_create_path({
//                 string: bot_str,
//                 stroke: lower_colour,
//                 stroke_width: 0.1,
//                 mask: (obscure ? "url(#" + mask_id + ")" : null)
//             }));

            r.startPath();
            r.moveTo(e1.x, i - epsilon);
            r.bezierTo(e1_bot.x, i + 0.5, e1_top.x, i + 0.5, e1_top.x, i + 1 + epsilon);
            r.finishPath({stroke: lower_colour, 'stroke-width': 0.1});

            // Draw upper path
//             var top_str = SVG_move_to({
//                 x: e2_bot.x,
//                 y: i - epsilon
//             }) + SVG_bezier_to({
//                 c1x: e2_bot.x,
//                 c1y: i + 0.5,
//                 c2x: e2_top.x,
//                 c2y: i + 0.5,
//                 x: e2_top.x,
//                 y: i + 1 + epsilon
//             });
//             d.g.appendChild(SVG_create_path({
//                 string: top_str,
//                 stroke: upper_colour,
//                 stroke_width: 0.1
//             }));

            r.startPath();
            r.moveTo(e2_bot.x, i - epsilon);
            r.bezierTo(e2_bot.x, i + 0.5, e2_top.x, i + 0.5, e2_top.x, i + 1 + epsilon);
            r.finishPath({stroke: upper_colour, 'stroke-width': 0.1});

            // Calculate the intersection data
            //var intersect = bezier_decompose(Math.min(e1_bot.x, e2_bot.x), Math.max(e1_bot.x, e2_bot.x), Math.min(e1_top.x, e2_top.x), Math.max(e1_top.x, e2_top.x), i);
            /*
            d.g.appendChild(SVG_create_circle({
                x: intersect.centre[0],
                y: intersect.centre[1],
                fill: '#ff8fbf'
            }));
            */
            //vertex.y = intersect.centre[1];

            // Attach little circles where the path joins its neighbours
            if (i != 0) {
                // Draw little circles at the bottom
                r.drawCircle({
                    x: e2_bot.x,
                    y: i,
                    fill: upper_colour
                });
                r.drawCircle({
                    x: e1_bot.x,
                    y: i,
                    fill: lower_colour
                });
            }
            if (i != data.vertices.length - 1) {
                // Draw little circles at the top
                r.drawCircle({
                    x: e2_top.x,
                    y: i + 1,
                    fill: upper_colour
                });
                r.drawCircle({
                    x: e1_top.x,
                    y: i + 1,
                    fill: lower_colour
                });
            }
        } else {
            /*
            var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttributeNS(null, "cx", vertex.x);
            circle.setAttributeNS(null, "cy", vertex.y);
            circle.setAttributeNS(null, "r", circle_radius);
            circle.setAttributeNS(null, "fill", gProject.getColour({id: vertex.type, dimension: diagram.getDimension()}));
            circle.setAttributeNS(null, "stroke", "none");
            d.g.appendChild(circle);
            */
            vertex.fill = gProject.getColour(vertex);
            vertex.radius = 0.1;
            r.drawCircle(vertex);
        }
    }

    /*
    // Prepare active regions
    var active = [];
    for (var i = 0; i < data.vertices.length; i++) {
        var vertex = data.vertices[i];
        // Add vertex active region
        active.push({
            x: vertex.x,
            y: vertex.y,
            logical: [i],
            direction: 'vertical'
        });
    }
    for (var i = 0; i < data.edges.length; i++) {
        var edge = data.edges[i];

        // Add line active region
        for (var height = Math.ceil(edge.start_height); height <= Math.floor(edge.finish_height); height++) {

            // Correction for case that diagram is an identity
            var edge_height = Math.min(height, data.edges_at_level.length - 1);

            active.push({
                x: edge.x,
                y: height,
                logical: [edge_height, data.edges_at_level[edge_height].indexOf(i)],
                direction: 'horizontal'
            });
        }
    }
    */

    // Render the highlight
    if (subdiagram != undefined) {
        var delta = 0.0005;
        //if (subdiagram.boundaryPath.length == 2) {
        if (subdiagram.visibleBoundaryDepth == 2) {
            // Highlight left or right side boundary
            var x = (subdiagram.boundaryType == 's' ? 0.125 - 0.5 - delta : data.max_x + 0.5 - 0.125 + delta);
//             d.g.appendChild(SVG_create_path({
//                 string: SVG_move_to({
//                     x: x,
//                     y: 0
//                 }) + SVG_line_to({
//                     x: x,
//                     y: Math.max(1, diagram.cells.length)
//                 }),
//                 stroke_width: 0.25,
//                 stroke: highlight_colour,
//                 stroke_opacity: highlight_opacity
//             }));

            r.startPath();
            r.moveTo(x, 0);
            r.lineTo(x, Math.max(1, diagram.cells.length));
            r.finishPath({
                stroke: highlight_colour,
                'stroke-width': 0.25,
                'stroke-opacity': highlight_opacity
            });
        }
        //else if (subdiagram.boundaryPath.length == 1) {
        else if (subdiagram.visibleBoundaryDepth == 1) {
            var y = (subdiagram.boundaryType == 's' ? 0.125 - delta : Math.max(1, diagram.cells.length) - 0.125 + delta);
            var x1, x2;
            var edges = data.edges_at_level[subdiagram.boundaryType == 's' ? 0 : diagram.cells.length];

            // Get the first and last edge of the inclusion
            //var first_edge = data.edges[data.edges_at_level[0][subdiagram.inclusion[0]]];
            var first_edge_index = subdiagram.inclusion.last();
            var last_edge_index = subdiagram.inclusion.last() + subdiagram.size.magnitude();
            var x1, x2;
            if (first_edge_index == last_edge_index) {
                if (first_edge_index == 0) {
                    x1 = -0.4;
                } else {
                    x1 = data.edges[edges[first_edge_index - 1]].x + 0.1;
                }
                if (first_edge_index == edges.length) {
                    x2 = data.max_x + 0.4;
                } else {
                    x2 = data.edges[edges[first_edge_index]].x - 0.1;
                }
                /*
                if (first_edge_index == 0) {
                    x1 = 0.15;
                    x2 = 0.35;
                }
                else if (first_edge_index == edges.length) {
                    x1 = data.edges[edges[first_edge_index - 1]].x + 0.15;
                    x2 = data.edges[edges[first_edge_index - 1]].x + 0.35;
                }
                else {
                    x1 = data.edges[edges[first_edge_index - 1]].x + 0.15;
                    x2 = data.edges[edges[first_edge_index]].x - 0.15;
                }
                */
            } else {
                var x1 = data.edges[edges[first_edge_index]].x - 0.25;
                var x2 = data.edges[edges[last_edge_index - 1]].x + 0.25;
            }
//             d.g.appendChild(SVG_create_path({
//                 string: SVG_move_to({
//                     x: x1,
//                     y: y
//                 }) + SVG_line_to({
//                     x: x2,
//                     y: y
//                 }),
//                 stroke_width: 0.25,
//                 stroke: highlight_colour,
//                 stroke_opacity: highlight_opacity
//             }));

            r.startPath();
            r.moveTo(x1, y);
            r.lineTo(x2, y);
            r.finishPath({
                stroke: highlight_colour,
                'stroke-width': 0.25,
                'stroke-opacity': highlight_opacity
            });

        } else if (subdiagram.visibleBoundaryDepth == 0) {
            // Highlight in main diagram
            // Design decision: pad out by 0.25 uniformly.

            // Find min and max y-values by looking at subdiagram specification
            var inc_y = subdiagram.inclusion[1];
            var min_y, max_y;
            if (subdiagram.size.length == 1) {
                // The subdiagram has height zero, so min and max y-values fall
                // between vertices
                min_y = inc_y + 0.1;
                max_y = inc_y - 0.1;
                /*
                if (inc_y == 0) {
                    min_y = 0.25;
                } else if (inc_y == data.vertices.length) {
                    min_y = data.vertices.length - 0.25;
                } else {
                    min_y = inc_y;
                }
                max_y = min_y;
                */
            } else {
                // Min and max y-values fall on vertices
                min_y = inc_y + 0.5;
                //max_y = inc_y + subdiagram.size.length - 1 + 0.5;
                max_y = min_y + subdiagram.size.length - 2;
            }

            // Find min and max x-values by looking at edges and vertices of diagram
            var inc_x = subdiagram.inclusion.end(1);
            var min_x = Number.MAX_VALUE;
            var max_x = -Number.MAX_VALUE;
            for (var height = inc_y; height < inc_y + subdiagram.size.length; height++) {
                var size = subdiagram.size[height - inc_y];
                var edges = data.edges_at_level[height];
                for (var i = 0; i < size; i++) {
                    var edge = data.edges[edges[inc_x + i]];
                    min_x = Math.min(min_x, edge.x);
                    max_x = Math.max(max_x, edge.x);
                }
            }
            for (var height = inc_y; height < inc_y + subdiagram.size.length - 1; height++) {
                min_x = Math.min(min_x, data.vertices[height].x);
                max_x = Math.max(max_x, data.vertices[height].x);
            }
            if (min_x == Number.MAX_VALUE) {
                // The subdiagram is an identity on an identity, so handle this case specially
                if (inc_x == 0) {
                    min_x = -0.5;
                } else {
                    min_x = data.edges[data.edges_at_level[inc_y][inc_x - 1]].x + 0.5;
                }
                if (inc_x == data.edges_at_level[inc_y].length) {
                    // We're at the right-hand edge
                    max_x = data.max_x + 0.5;
                } else {
                    max_x = data.edges[data.edges_at_level[inc_y][inc_x]].x - 0.5;
                }
            }

            // Pad values appropriately to give a little buffer to the highlighted area
            min_x -= 0.45;
            max_x += 0.45;
            min_y -= 0.5;
            max_y += 0.5;
            // Clip the highlight box to within the diagram bounds
            min_y = Math.max(min_y, 0);
            max_y = Math.min(max_y, Math.max(1, data.vertices.length));
            min_x = Math.max(min_x, -0.5);
            max_x = Math.min(max_x, data.max_x + 0.5);
//             var path_string = SVG_move_to({
//                 x: min_x,
//                 y: min_y
//             }) + SVG_line_to({
//                 x: min_x,
//                 y: max_y
//             }) + SVG_line_to({
//                 x: max_x,
//                 y: max_y
//             }) + SVG_line_to({
//                 x: max_x,
//                 y: min_y
//             });
//             d.g.appendChild(SVG_create_path({
//                 string: path_string,
//                 fill: highlight_colour,
//                 fill_opacity: highlight_opacity
//             }));

            r.drawRect(min_x, min_y, max_x - min_x, max_y - min_y,
                       highlight_colour, highlight_opacity);
        }
    }

    // Add SVG object to container. We have to do it in this weird way because
    // otherwise the masks aren't recognized in Chrome v46.
    var html = $("<div />").append($(r.svg)).html();
    $(container).append($(html));

    // Return layout data
    data.dimension = 2;
    return data;
}

function SVG_create_path(data) {
    if (data.string.length == 0) return;
    if (data.stroke_width === undefined) data.stroke_width = 0.1;
    if (data.stroke === undefined) data.stroke = "none";
    if (data.fill === undefined) data.fill = "none";
    if (data.stroke_opacity === undefined) data.stroke_opacity = "1";
    if (data.fill_opacity === undefined) data.fill_opacity = "1";
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttributeNS(null, "d", data.string);
    path.setAttributeNS(null, "stroke-width", data.stroke_width);
    path.setAttributeNS(null, "stroke", data.stroke);
    path.setAttributeNS(null, "fill", data.fill);
    path.setAttributeNS(null, "stroke-opacity", data.stroke_opacity);
    path.setAttributeNS(null, "fill-opacity", data.fill_opacity);
    if (data.mask != null) path.setAttributeNS(null, "mask", data.mask);
    return path;
}

function SVG_create_circle(data) {
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    if (data.radius == undefined) data.radius = 0.05;
    circle.setAttributeNS(null, "cx", data.x);
    circle.setAttributeNS(null, "cy", data.y);
    circle.setAttributeNS(null, "r", data.radius);
    circle.setAttributeNS(null, "fill", data.fill);
    circle.setAttributeNS(null, "stroke", "none");
    //d.g.appendChild(circle);
    return circle;

}

function process_instructions(data, i) {
    var c = null;
    var r = globular_renderer;

    // Draw the edge segment appropriately
    if (i.draw_up) {
        i.edge.fill_right = true;
        if (i.path_string.length == 0) {
            //i.path_string = SVG_move_to(bottom_of_edge(data, i.edge));
            var c = bottom_of_edge(data, i.edge);
            r.moveTo(c.x, c.y);
        }
        //i.path_string +=
        SVG_draw_edge_bottom_to_top(data, i.edge);
        // ... update the instructions.
        var vertex_index = i.edge.finish_vertex;
        if (vertex_index == null) {
            // We've reached the top of the diagram, so draw a line clockwise
            // until we get to the next edge
            var next_edge = i.edge.next_clockwise_at_target;
            if (next_edge == null) {
                // We've reached the top-right of the diagram, so come around
                if (i.avoid_boundary) {
                    i.edge = null;
                    return;
                }
//                 i.path_string += SVG_line_to({
//                     x: data.max_x + 0.5,
//                     y: Math.max(1, data.vertices.length)
//                 });

                r.lineTo(data.max_x + 0.5, Math.max(1, data.vertices.length));

//                 i.path_string += SVG_line_to({
//                     x: data.max_x + 0.5,
//                     y: 0
//                 });

                r.lineTo(data.max_x + 0.5, 0);

                var source_edges = data.edges_at_level[0];
                if (source_edges.length == 0) {
//                     i.path_string += SVG_line_to({
//                         x: -0.5,
//                         y: 0
//                     });
                    r.lineTo(-0.5, 0);
//                     i.path_string += SVG_line_to({
//                         x: -0.5,
//                         y: Math.max(1, data.vertices.length)
//                     });
                    r.lineTo(-0.5, Math.max(1, data.vertices.length));
                    var target_edges = data.edges_at_level[data.edges_at_level.length - 1];
                    i.edge = data.edges[target_edges[0]]; // Will necessarily exist
                    c = top_of_edge(data, i.edge);
                    r.lineTo(c.x, c.y);
//                  i.path_string += SVG_line_to(top_of_edge(data, i.edge));
                    i.draw_up = false;
                    i.turning += 3; // turn right thrice
                    return;
                }
                i.edge = data.edges[source_edges[source_edges.length - 1]];
                c = bottom_of_edge(data, i.edge);
                r.lineTo(c.x, c.y);
//                 i.path_string += SVG_line_to(bottom_of_edge(data, i.edge));
                i.draw_up = true;
                i.turning += 2; // turn right twice
                return;
            }
            // Come down the next edge
//             i.path_string += SVG_line_to(top_of_edge(data, next_edge));
            c = top_of_edge(data, next_edge);
            r.lineTo(c.x, c.y);
            i.edge = next_edge;
            i.draw_up = false;
            i.turning += 1; // turn right once
            return;
        }
        // We've got to a vertex, as a source edge.
        var vertex = data.vertices[vertex_index];
        for (var j = 0; j < vertex.source_edges.length; j++) {
            if (data.edges[vertex.source_edges[j]] == i.edge) {
                if (j < vertex.source_edges.length - 1) {
                    // Come down the next source edge
                    i.edge = data.edges[vertex.source_edges[j + 1]];
                    i.draw_up = false;
                    i.turning += 1; // turn right once
                    return;
                }
                // We've come up the last source edge
                if (vertex.target_edges.length == 0) {
                    // No target edges! So come back down the first source edge.
                    // Doesn't matter if this is the same one we came up.
                    i.edge = data.edges[vertex.source_edges[0]];
                    i.draw_up = false;
                    i.turning -= 1; // turn left once
                    return;
                }
                // Continue up the last target edge
                i.edge = data.edges[vertex.target_edges[vertex.target_edges.length - 1]];
                i.draw_up = true;
                // not turning
                return;
            }
        }
    }

    // We're drawing down
//     if (i.path_string.length == 0) {
//         alert("Shouldn't be drawing down with empty path string!");
//         throw 0;
//     }

    //i.path_string +=
    SVG_draw_edge_top_to_bottom(data, i.edge);

    var vertex_index = i.edge.start_vertex;
    if (vertex_index == null) {
        // We've reached the bottom of the diagram, so draw a line clockwise
        // until we get to the next edge
        var next_edge = i.edge.next_clockwise_at_source;
        if (next_edge == null) {
            // We've reached the bottom-left of the diagram, so come around
            if (i.avoid_boundary) {
                i.edge = null;
                return;
            }
//             i.path_string += SVG_line_to({
//                 x: -0.5,
//                 y: 0
//             });
            r.lineTo(-0.5, 0);
//             i.path_string += SVG_line_to({
//                 x: -0.5,
//                 y: Math.max(1, data.vertices.length)
//             });
            r.lineTo(-0.5, Math.max(1, data.vertices.length));
            var target_edges = data.edges_at_level[data.edges_at_level.length - 1];
            if (target_edges.length == 0) {
                // No edges at the top of the diagram, so come around
//                 i.path_string += SVG_line_to({
//                     x: data.max_x + 0.5,
//                     y: Math.max(1, data.vertices.length)
//                 });
                r.lineTo(data.max_x + 0.5, Math.max(1, data.vertices.length));
//                 i.path_string += SVG_line_to({
//                     x: data.max_x + 0.5,
//                     y: 0
//                 });
                r.lineTo(data.max_x + 0.5, 0);
                var source_edges = data.edges_at_level[0];
                i.edge = data.edges[source_edges.length - 1]; // Will necessarily exist
//                 i.path_string += SVG_line_to(bottom_of_edge(data, i.edge));
                c = bottom_of_edge(data, i.edge);
                r.lineTo(c.x, c.y);
                i.draw_up = true;
                i.turning += 3;
                return;
            }
            // There are edges at the top of the diagram, so choose the first one
            i.edge = data.edges[target_edges[0]];
//             i.path_string += SVG_line_to(top_of_edge(data, i.edge));
            c = top_of_edge(data, i.edge);
            r.lineTo(c.x, c.y);
            i.draw_up = false;
            i.turning += 2;
            return;
        }
        // We've got another edge clockwise on the bottom of the diagram
//         i.path_string += SVG_line_to(bottom_of_edge(data, next_edge));
        c = bottom_of_edge(data, next_edge);
        r.lineTo(c.x, c.y);
        i.edge = next_edge;
        i.draw_up = true;
        i.turning += 1;
        return;
    }

    // We've got to a vertex, as a target edge. Find which edge it is.
    var vertex = data.vertices[vertex_index];
    for (var j = 0; j < vertex.target_edges.length; j++) {
        if (data.edges[vertex.target_edges[j]] == i.edge) {
            if (j == 0) {
                // We've come down as the first target edge
                if (vertex.source_edges.length == 0) {
                    // No source edges! So come back up the last target edge.
                    // Doesn't matter if this is the same one we came down.
                    i.edge = data.edges[vertex.target_edges[vertex.target_edges.length - 1]];
                    i.draw_up = true;
                    i.turning -= 1;
                    return;
                }
                // Continue down the first source edge
                i.edge = data.edges[vertex.source_edges[0]];
                i.draw_up = false;
                i.turning += 0; // no turning
                return;
            }
            // We haven't come down the first target edge, so continue
            // up the edge to the left
            i.edge = data.edges[vertex.target_edges[j - 1]];
            i.draw_up = true;
            i.turning += 1;
            return;
        }
    }
}

function SVG_line_to(p) {
    if (p.x === undefined) {
        throw 0;
    }
    if (p.y === undefined) throw 0;
    return "L " + p.x + " " + p.y + " ";
}

function SVG_bezier_to(p) {
    if (p.c1x === undefined) throw 0;
    if (p.c1y === undefined) throw 0;
    if (p.c2x === undefined) throw 0;
    if (p.c2y === undefined) throw 0;
    if (p.x === undefined) throw 0;
    if (p.y === undefined) throw 0;
    return "C " + p.c1x + " " + p.c1y + ", " + p.c2x + " " + p.c2y + ", " + p.x + " " + p.y + " ";
}

function SVG_move_to(p) {
    if (p.x === undefined) throw 0;
    if (p.y === undefined) throw 0;
    return "M " + p.x + " " + p.y + " ";
}

// Return the point at the bottom of the edge
function bottom_of_edge(data, edge) {
    if (edge.start_vertex == null) {
        return {
            x: edge.x,
            y: 0
        };
    }
    return {
        x: data.vertices[edge.start_vertex].x,
        y: data.vertices[edge.start_vertex].y,
        //y: edge.start_height
    };
}

// Return the point at the top of the edge
function top_of_edge(data, edge) {
    if (edge.finish_vertex == null) {
        return {
            x: edge.x,
            y: Math.max(1, data.vertices.length)
        };
    }
    return {
        x: data.vertices[edge.finish_vertex].x,
        y: data.vertices[edge.finish_vertex].y,
        //y: edge.finish_height
    };
}

function SVG_draw_edge_bottom_to_top(data, edge) {
    //var r = 
    SVG_draw_edge_section(data, edge, edge.start_height, edge.finish_height);
    //if (r === undefined) throw 0;
    //return r;
}

function SVG_draw_edge_top_to_bottom(data, edge) {
    //var r =
    SVG_draw_edge_section(data, edge, edge.finish_height, edge.start_height);
    //if (r === undefined) throw 0;
    //return r;
}

function point_on_edge(data, edge_list, edge_index, height) {
    var diagram_height = Math.max(1, data.vertices.length);
    height = Math.max(height, 0);
    height = Math.min(height, diagram_height);
    if (edge_index == -1) {
        return {
            x: -0.5,
            y: height
        };
    }
    if (edge_index == edge_list.length) {
        return {
            x: data.max_x + 0.5,
            y: height
        }
    }
    var edge = data.edges[edge_list[edge_index]];
    if (height == edge.start_height) {
        if (edge.start_vertex == null) return {
            x: edge.x,
            y: height
        };
        return {
            x: data.vertices[edge.start_vertex].x,
            y: height
        };
    }
    if (height == edge.finish_height) {
        if (edge.finish_vertex == null) return {
            x: edge.x,
            y: height
        };
        return {
            x: data.vertices[edge.finish_vertex].x,
            y: height
        };
    }
    return {
        x: edge.x,
        y: height
    };
}

// Draw section of an edge. Assume that we have already moved to the start point.
function SVG_draw_edge_section_at_slice(data, edge_list, edge_index, h_start, h_end) {
    var diagram_height = Math.max(1, data.vertices.length);
    h_start = Math.min(Math.max(h_start, 0), diagram_height);
    h_end = Math.min(Math.max(h_end, 0), diagram_height);
    if (h_start == h_end) return "";
    var edge;
    if (edge_index < 0) {
        edge = {
            start_height: 0,
            finish_height: Math.max(1, data.vertices.length),
            length: Math.max(1, data.vertices.length),
            x: -0.5,
            start_vertex: null,
            finish_vertex: null
        }
    } else if (edge_index == edge_list.length) {
        edge = {
            start_height: 0,
            finish_height: Math.max(1, data.vertices.length),
            length: Math.max(1, data.vertices.length),
            x: data.max_x + 0.5,
            start_vertex: null,
            finish_vertex: null
        }
    } else {
        edge = data.edges[edge_list[edge_index]];
    }
    return SVG_draw_edge_section(data, edge, h_start, h_end);
}

function SVG_draw_edge_section(data, edge, h_start, h_end) {
    var r = globular_renderer;
    var diagram_height = Math.max(1, data.vertices.length);
    h_start = Math.min(Math.max(h_start, 0), diagram_height);
    h_end = Math.min(Math.max(h_end, 0), diagram_height);
    if (h_start == h_end) return "";
    //var path = "";
    if (h_start < h_end) {
        // Draw bottom-to-top
        var bottom_section = (edge.start_vertex == null ? (h_start == 0) && (edge.finish_height > 0.5) : h_start == edge.start_height);
        var middle_section = ((h_start < edge.finish_height - 0.5) && (h_end > edge.start_height + 0.5));
        var top_section = (edge.finish_vertex == null ? h_end == diagram_height : h_end == edge.finish_height);
        if (bottom_section) {
            // Draw bottom half-height of edge
            if (edge.start_vertex == null) {
                // Incoming from lower boundary
//                 path += SVG_line_to({
//                     x: edge.x,
//                     y: h_start + 0.5
//                 });
                r.lineTo(edge.x, h_start + 0.5);

            } else {
                // Coming up out of a vertex as a target edge
                var vertex = data.vertices[edge.start_vertex];
                if (vertex.intersection == undefined) {
//                     path += SVG_bezier_to({
//                         c1x: edge.x,
//                         c1y: vertex.y,
//                         c2x: edge.x,
//                         c2y: vertex.y + 0.4,
//                         x: edge.x,
//                         y: edge.start_height + 0.5
//                     });

                    r.bezierTo(edge.x, vertex.y, edge.x, vertex.y + 0.4, edge.x, edge.start_height + 0.5);
                } else {
                    var i = vertex.intersection;
                    var left = (edge == data.edges[vertex.target_edges[0]]);
//                     path += SVG_bezier_to({
//                         c1x: (left ? i.tl.P3[0] : i.tr.P3[0]),
//                         c1y: (left ? i.tl.P3[1] : i.tr.P3[1]),
//                         c2x: (left ? i.tl.P2[0] : i.tr.P2[0]),
//                         c2y: (left ? i.tl.P2[1] : i.tr.P2[1]),
//                         x: edge.x,
//                         y: edge.start_height + 0.5
//                     });
                    r.bezierTo(
                        (left ? i.tl.P3[0] : i.tr.P3[0]),
                        (left ? i.tl.P3[1] : i.tr.P3[1]),
                        (left ? i.tl.P2[0] : i.tr.P2[0]),
                        (left ? i.tl.P2[1] : i.tr.P2[1]),
                        edge.x,
                        edge.start_height + 0.5);
                }
            }
        }
        if (middle_section) {
            // Draw appropriate portion of central piece of line
            var central_finish = Math.min(h_end, edge.finish_height - 0.5);
//             path += SVG_line_to({
//                 x: edge.x,
//                 y: central_finish
//             });
            r.lineTo(edge.x, central_finish);
        }
        if (top_section) {
            // Draw top half-height of line
            if (edge.finish_vertex == null) {
                // Edge finishes at the top boundary
//                 path += SVG_line_to({
//                     x: edge.x,
//                     y: h_end
//                 });
                r.lineTo(edge.x, h_end);
            } else {
                // Coming up into a vertex as a source edge
                var vertex = data.vertices[edge.finish_vertex];
                if (vertex.intersection == undefined) {
//                     path += SVG_bezier_to({
//                         c1x: edge.x,
//                         c1y: vertex.y - 0.4,
//                         c2x: edge.x,
//                         c2y: vertex.y,
//                         x: vertex.x,
//                         y: vertex.y
//                     });
                    r.bezierTo(
                        edge.x,
                        vertex.y - 0.4,
                        edge.x,
                        vertex.y,
                        vertex.x,
                        vertex.y
                    );
                } else {
                    var i = vertex.intersection;
                    var left = (edge == data.edges[vertex.source_edges[0]]);
//                     path += SVG_bezier_to({
//                         c1x: (left ? i.bl.P2[0] : i.br.P2[0]),
//                         c1y: (left ? i.bl.P2[1] : i.br.P2[1]),
//                         c2x: (left ? i.bl.P3[0] : i.br.P3[0]),
//                         c2y: (left ? i.bl.P3[1] : i.br.P3[1]),
//                         x: vertex.x,
//                         y: vertex.y
//                     });
                    r.bezierTo(
                        (left ? i.bl.P2[0] : i.br.P2[0]),
                        (left ? i.bl.P2[1] : i.br.P2[1]),
                        (left ? i.bl.P3[0] : i.br.P3[0]),
                        (left ? i.bl.P3[1] : i.br.P3[1]),
                        vertex.x,
                        vertex.y
                    );
                }
            }
        }
    } else {
        // Draw top-to-bottom
        var top_section = (edge.finish_vertex == null ? (h_start == diagram_height) && (edge.length > 0.5) : h_start == edge.finish_height);
        var middle_section = ((h_start > edge.start_height + 0.5) && (h_end < edge.finish_height - 0.5));
        var bottom_section = (edge.start_vertex == null ? h_end == 0 : h_end == edge.start_height);
        if (top_section) {
            // Draw top half-height of edge
            if (edge.finish_vertex == null) {
                // Descending from upper boundary
//                 path += SVG_line_to({
//                     x: edge.x,
//                     y: h_start - 0.5
//                 });
                r.lineTo(edge.x, h_start - 0.5);
            } else {
                // Coming down out of a vertex as a source edge
                var vertex = data.vertices[edge.finish_vertex];
                if (vertex.intersection == undefined) {
//                     path += SVG_bezier_to({
//                         c1x: edge.x,
//                         c1y: vertex.y,
//                         c2x: edge.x,
//                         c2y: vertex.y - 0.4,
//                         x: edge.x,
//                         y: edge.finish_height - 0.5
//                     });
                    r.bezierTo(
                        edge.x,
                        vertex.y,
                        edge.x,
                        vertex.y - 0.4,
                        edge.x,
                        edge.finish_height - 0.5
                    );
                } else {
                    var i = vertex.intersection;
                    var left = (edge == data.edges[vertex.source_edges[0]]);
//                     path += SVG_bezier_to({
//                         c1x: (left ? i.bl.P3[0] : i.br.P3[0]),
//                         c1y: (left ? i.bl.P3[1] : i.br.P3[1]),
//                         c2x: (left ? i.bl.P2[0] : i.br.P2[0]),
//                         c2y: (left ? i.bl.P2[1] : i.br.P2[1]),
//                         x: edge.x,
//                         y: edge.finish_height - 0.5
//                     });
                    r.bezierTo(
                        (left ? i.bl.P3[0] : i.br.P3[0]),
                        (left ? i.bl.P3[1] : i.br.P3[1]),
                        (left ? i.bl.P2[0] : i.br.P2[0]),
                        (left ? i.bl.P2[1] : i.br.P2[1]),
                        edge.x,
                        edge.finish_height - 0.5
                    );
                }
            }
        }
        if (middle_section) {
            // Draw appropriate portion of central piece of line
            var central_finish = Math.max(h_end, edge.start_height + 0.5);
//             path += SVG_line_to({
//                 x: edge.x,
//                 y: central_finish
//             });
            r.lineTo(edge.x, central_finish);
        }
        if (bottom_section) {
            // Draw bottom half-height of line
            if (edge.start_vertex == null) {
                // Edge finishes at the bottom boundary
//                 path += SVG_line_to({
//                     x: edge.x,
//                     y: h_end
//                 });
                r.lineTo(edge.x, h_end);
            } else {
                // Coming down into a vertex as a target edge
                var vertex = data.vertices[edge.start_vertex];
                if (vertex.intersection == undefined) {
//                     path += SVG_bezier_to({
//                         c1x: edge.x,
//                         c1y: vertex.y + 0.4,
//                         c2x: edge.x,
//                         c2y: vertex.y,
//                         x: vertex.x,
//                         y: vertex.y
//                     });
                    r.bezierTo(
                        edge.x,
                        vertex.y + 0.4,
                        edge.x,
                        vertex.y,
                        vertex.x,
                        vertex.y
                    );
                } else {
                    var i = vertex.intersection;
                    var left = (edge == data.edges[vertex.target_edges[0]]);
//                     path += SVG_bezier_to({
//                         c1x: (left ? i.tl.P2[0] : i.tr.P2[0]),
//                         c1y: (left ? i.tl.P2[1] : i.tr.P2[1]),
//                         c2x: (left ? i.tl.P3[0] : i.tr.P3[0]),
//                         c2y: (left ? i.tl.P3[1] : i.tr.P3[1]),
//                         x: vertex.x,
//                         y: vertex.y
//                     });
                    r.bezierTo(
                        (left ? i.tl.P2[0] : i.tr.P2[0]),
                        (left ? i.tl.P2[1] : i.tr.P2[1]),
                        (left ? i.tl.P3[0] : i.tr.P3[0]),
                        (left ? i.tl.P3[1] : i.tr.P3[1]),
                        vertex.x,
                        vertex.y
                    );

                }
            }
        }
    }

//     return path;
}


function SVG_prepare(diagram, subdiagram) {
    /*
        For each edge, calculate its start and finish height, and its
        x-coordinate.
        
        For each vertex, calculate its list of edges.
    */

    var data = {
        edges: [],
        vertices: [],
        edges_at_level: []
    };

    var edges = data.edges;
    var vertices = data.vertices;
    var edges_at_level = data.edges_at_level;

    // Can't layout a diagram of dimension less than 2
    if (diagram.getDimension() < 2) return;

    // Start with the edges that exist at the source boundary
    var current_edges = [];
    for (var level = 0; level < diagram.source.cells.length; level++) {
        var attachment = diagram.source.cells[level];
        var new_edge = {
            type: attachment.id,
            attachment_height: level,
            start_height: 0,
            finish_height: null,
            succeeding: [],
            x: 0,
            start_vertex: null,
            finish_vertex: null,
            //coordinates: [0, attachment.box.min[0]]
        };

        // Every source edge except the last has a succeeding edge
        if (level < diagram.source.cells.length - 1) {
            new_edge.succeeding.push({
                index: level + 1,
                offset: 1
            });
        }

        // Store data
        edges.push(new_edge);
        current_edges.push(level);

    }
    edges_at_level.push(current_edges.slice());

    // Get the subdiagrams at each slice
    var slices = [];
    for (var level = 0; level <= diagram.cells.length; level++) {
        slices.push(diagram.getSlice(level));
    }

    for (var level = 0; level < diagram.cells.length; level++) {

        var attachment = diagram.cells[level];
        var interchanger = (attachment.id.substring(0, 3) == 'Int');
        var source_cells, target_cells;
        if (attachment.id.is_interchanger()) {
            var source_size = diagram.source_size(level);
            var target_size = diagram.target_size(level);
            var pos = attachment.box.min.last();
            source_cells = slices[level].cells.slice(pos, pos + source_size);
            target_cells = slices[level + 1].cells.slice(pos, pos + target_size);
            /*
            var x = slices[level].cells[attachment.box.min.last()];
            var y = slices[level].cells[attachment.box.min.last() + 1];
            source_cells = [x, y];
            target_cells = [y, x];
            */
        } else {
            var r = gProject.signature.getGenerator(attachment.id);
            source_cells = r.source.cells;
            target_cells = r.target.cells;
        }

        // Add to the list of vertices
        var vertex = {
            type: attachment.id,
            level: level,
            y: level + 0.5,
            source_edges: [],
            target_edges: [],
            //coordinates: level // DEFINITELY RIGHT!!!!!!
        };
        vertices.push(vertex);

        // For each edge consumed by this rewrite, indicate its finish
        // height and remove it from the list of current edges
        for (var i = 0; i < source_cells.length; i++) {
            var remove_edge_index = current_edges[attachment.box.min.last()];
            vertex.source_edges.push(remove_edge_index);
            if (edges[remove_edge_index] === undefined) {
                var x = 0;
            }
            edges[remove_edge_index].finish_height = level + 0.5;
            edges[remove_edge_index].finish_vertex = vertices.length - 1;
            current_edges.splice(attachment.box.min.last(), 1);
        }

        // Add the first target of the rewrite in the succeedence partial order
        if (target_cells.length > 0) {
            if (attachment.box.min.last() > 0) {
                edges[current_edges[attachment.box.min.last() - 1]].succeeding.push({
                    index: edges.length,
                    offset: 1
                });
            }
        }

        // For each edge produced by this rewrite, add it to the lists
        // of edges and current edges, and correctly set succeeding data
        for (i = 0; i < target_cells.length; i++) {
            var new_edge = {
                type: target_cells[i].id,
                attachment_height: attachment.box.min.last(),
                start_height: level + 0.5,
                finish_height: null,
                succeeding: [],
                x: 0,
                start_vertex: vertices.length - 1,
                finish_vertex: null
            };
            edges.push(new_edge);
            var new_edge_index = edges.length - 1;
            current_edges.splice(attachment.box.min.last() + i, 0, new_edge_index);
            vertex.target_edges.push(new_edge_index);
            if (i != target_cells.length - 1) {
                new_edge.succeeding.push({
                    index: new_edge_index + 1,
                    offset: 1
                });
            }
        }

        // Add succeeding data for the first edge after the rewrite
        if (target_cells.length > 0) {
            if (attachment.box.min.last() + target_cells.length < current_edges.length) {
                var subsequent_edge_index = current_edges[attachment.box.min.last() + target_cells.length];
                edges[edges.length - 1].succeeding.push({
                    index: subsequent_edge_index,
                    offset: 1
                });
            }
        }

        // Handle the case of a scalar
        if (vertex.source_edges.length + vertex.target_edges.length > 0) {
            vertex.scalar = false;
        } else {
            vertex.scalar = true;
            if (attachment.box.min.last() == 0) {
                vertex.preceding_edge = null;
            } else {
                vertex.preceding_edge = current_edges[attachment.box.min.last() - 1];
            }
            if (attachment.box.min.last() == current_edges.length) {
                vertex.succeeding_edge = null;
            } else {
                vertex.succeeding_edge = current_edges[attachment.box.min.last()];
            }
            vertex.x = 0;
        }

        // Remember the edges present at this level
        edges_at_level.push(current_edges.slice());
    }

    // Specify finish height of dangling edges
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        if (edge.finish_height == null) {
            edge.finish_height = Math.max(1, diagram.cells.length);
        }
        edge.length = edge.finish_height - edge.start_height;
        edge.fill_right = false;
        edge.next_clockwise_at_target = null;
        edge.next_clockwise_at_source = null;
        edge.adjacent_regions = [];
    }

    // For the edges at the top and bottom of the diagram, specify their clockwise successors
    // Bottom of diagram:
    for (var i = 1; i < edges_at_level[0].length; i++) {
        var edge = edges[edges_at_level[0][i]];
        edge.next_clockwise_at_source = edges[edges_at_level[0][i - 1]];
    }
    // Top of diagram:
    for (var i = 0; i < current_edges.length - 1; i++) {
        var edge = edges[current_edges[i]];
        edge.next_clockwise_at_target = edges[current_edges[i + 1]];
    }

    // Calculate the x coordinates for edges and scalars
    while (true) {
        var problem;
        do {
            problem = false;
            for (var i = 0; i < edges.length; i++) {
                var edge = edges[i];
                for (var j = 0; j < edge.succeeding.length; j++) {
                    var succ = edge.succeeding[j];
                    var succ_edge = edges[succ.index];
                    if (succ_edge.x < edge.x + succ.offset) {
                        succ_edge.x = edge.x + succ.offset;
                        problem = true;
                    };
                }
            }
        } while (problem == true);

        // Even up inputs and outputs for vertices
        for (var i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            if (!vertex.scalar) {
                if (vertex.source_edges.length == 0) continue;
                if (vertex.target_edges.length == 0) continue;
                var source_mean = 0;
                for (var j = 0; j < vertex.source_edges.length; j++) {
                    source_mean += edges[vertex.source_edges[j]].x;
                }
                source_mean /= vertex.source_edges.length;
                var target_mean = 0;
                for (var j = 0; j < vertex.target_edges.length; j++) {
                    target_mean += edges[vertex.target_edges[j]].x;
                }
                target_mean /= vertex.target_edges.length;
                // NEW IDEA
                source_mean = (edges[vertex.source_edges[0]].x + edges[vertex.source_edges.last()].x) / 2;
                target_mean = (edges[vertex.target_edges[0]].x + edges[vertex.target_edges.last()].x) / 2;
                var diff = Math.abs(source_mean - target_mean);
                if (diff > 0.01) {
                    problem = true;
                    var edges_to_offset;
                    if (source_mean > target_mean) {
                        edges_to_offset = vertex.target_edges;
                    } else {
                        edges_to_offset = vertex.source_edges;
                    }
                    for (var j = 0; j < edges_to_offset.length; j++) {
                        edges[edges_to_offset[j]].x += diff;
                    }
                }
                continue;
            }
            // Check that scalars are sufficiently padded on either side
            var preceding_x = (vertex.preceding_edge == null ? -1 : edges[vertex.preceding_edge].x);
            if (vertex.x < preceding_x + 1) {
                vertex.x = preceding_x + 1;
                problem = true;
            }
            if (vertex.succeeding_edge != null) {
                var succeeding_x = edges[vertex.succeeding_edge].x;
                if (succeeding_x < vertex.x + 1) {
                    edges[vertex.succeeding_edge].x = vertex.x + 1;
                    problem = true;
                }
            }
        }
        if (!problem) break;
    }

    // Find max edge x-coordinate
    data.max_x = -Number.MAX_VALUE;
    for (var i = 0; i < edges.length; i++) {
        data.max_x = Math.max(data.max_x, edges[i].x);
    }

    // Set vertex x-coordinates for non-scalars
    for (var i = 0; i < vertices.length; i++) {
        var vertex = vertices[i];
        if (vertex.scalar) {
            data.max_x = Math.max(data.max_x, vertex.x);
            continue;
        };
        if (vertex.source_edges.length == 1) {
            vertex.x = edges[vertex.source_edges[0]].x;
        } else if (vertex.target_edges.length == 1) {
            vertex.x = edges[vertex.target_edges[0]].x;
        } else {
            var total_x = 0;
            for (var j = 0; j < vertex.source_edges.length; j++) {
                total_x += edges[vertex.source_edges[j]].x;
            }
            for (var j = 0; j < vertex.target_edges.length; j++) {
                total_x += edges[vertex.target_edges[j]].x;
            }
            vertex.x = total_x / (vertex.target_edges.length + vertex.source_edges.length);
        }
    }

    return data;
}

// Add a highlighting rectangle to the diagram
function globular_add_highlight(container, data, box, boundary, diagram) {

    if (diagram.getDimension() < 2) return;
    var b = $(container)[0].bounds;
    var bottom, top, left, right;
    
    if (boundary != null) {
        if (boundary.depth == 2) {
            if (boundary.type == 's') {
                left = b.left;
                top = b.top;
                bottom = b.bottom;
                right = b.left + 0.25;
            } else {
                left = b.right - 0.25;
                top = b.top;
                bottom = b.bottom;
                right = b.right;
            }
        } else if (boundary.depth == 1) {
            var edges;
            if (boundary.type == 's') {
                bottom = b.bottom;
                top = b.bottom + 0.25;
                edges = data.edges_at_level[0];
            } else {
                bottom = b.top - 0.25;
                top = b.top;
                edges = data.edges_at_level[diagram.cells.length];
            }
            if (box.min.last() == box.max.last()) {
                if (box.min.last() == 0) {
                    left = b.left;
                    right = data.edges[edges[0]].x - 0.5;
                } else if (box.max.last() == edges.length) {
                    left = data.edges[edges.last()].x + 0.5;
                    right = b.right;
                } else {
                    left = data.edges[edges[box.min.last() - 1]].x + 0.5;
                    right = data.edges[edges[box.min.last()]].x - 0.5;
                }
            } else {
                left = data.edges[edges[box.min.last()]].x - 0.5;
                right = data.edges[edges[box.max.last() - 1]].x + 0.5;
            }
            if (left == right) {
                left -= 0.25;
                right += 0.25;
            }
        }
    } else {

        // Get top and bottom
        bottom = box.min.last() + b.bottom;
        top = box.max.last() + b.bottom;
    
        // Get left and right
        var start_height = box.min.last();
        var finish_height = box.max.last();
        var left = b.right;
        var right = b.left;
        var chunk = {
            min: box.min.penultimate(),
            max: box.max.penultimate()
        }
        for (var i = start_height; i <= finish_height; i++) {
            chunk = diagram.pullUpMinMax(i, i == start_height ? start_height : i - 1, chunk.min, chunk.max)
            var edges = data.edges_at_level[i];
            var eff_left, eff_right;
            if (edges.length == 0) {
                eff_left = b.left;
                eff_right = b.right;
            } else {
                if (chunk.min == chunk.max) {
                    if (chunk.min == 0) {
                        eff_left = b.left;
                        eff_right = data.edges[edges[0]].x - 0.5;
                    } else if (chunk.max == edges.length) {
                        eff_left = data.edges[edges.last()].x + 0.5;
                        eff_right = b.right;
                    } else {
                        eff_left = data.edges[edges[chunk.min - 1]].x + 0.5;
                        eff_right = data.edges[edges[chunk.min]].x - 0.5;
                    }
                } else {
                    eff_left = data.edges[edges[chunk.min]].x - 0.5;
                    eff_right = data.edges[edges[chunk.max - 1]].x + 0.5;
                }
            }
            left = Math.min(left, eff_left);
            right = Math.max(right, eff_right);
        }
    
        // Correct for zero volume
        if (bottom == top) {
            top += 0.4;
            bottom -= 0.4;
            if (bottom < b.bottom) {
                bottom = b.bottom;
                top = b.bottom + 0.5;
            }
            if (top > b.top) {
                top = b.top;
                bottom = b.top - 0.5;
            }
        }
        if (left == right) {
            left -= 0.25;
            right += 0.25;
            if (left < b.left) {
                left = b.left;
                right = b.left + 0.5;
            }
            if (right > b.right) {
                right = b.right;
                left = b.right - 0.5;
            }
        }
        
        left += 0.125;
        right -= 0.125;
        bottom += 0.125;
        top -= 0.125;
    }

    // Insert box
    var g = $(document.createElementNS("http://www.w3.org/2000/svg", "g"));
    g.addClass('highlight');
    var svg = $(container).children('svg');
    svg.children('g').children('g').append(g);
    var path_string =
        SVG_move_to({
            x: left,
            y: bottom
        }) + SVG_line_to({
            x: left,
            y: top
        }) + SVG_line_to({
            x: right,
            y: top
        }) + SVG_line_to({
            x: right,
            y: bottom
        }) + SVG_line_to({
            x: left,
            y: bottom
        });
    g[0].appendChild(SVG_create_path({
        string: path_string,
        fill: '#ffff00',
        fill_opacity: 0.5
        /*,
        stroke: '#ff0000',
        stroke_opacity: 0.4,
        stroke_width: 0.01
        */
    }));
    /*
    g[0].appendChild(SVG_create_path({
        string: path_string,
        stroke_width: 0.01,
        stroke: '#ff0000',
        stroke_opacity: 0.4
    }));
    */

}