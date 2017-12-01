"use strict";

/*
    SVG rendering of 2d diagrams
*/

// Parameter that sets the hardness of string diagram curves
var shoulder_strength = 0.1;
var circle_radius = 0.11;
var line_width = 0.1;
var highlight_colour = '#ffff00';
var highlight_opacity = 0.8;
var mask_index = 0;

function globular_set_viewbox() {
    var container = $('#diagram-canvas');
    $('#diagram-canvas>svg').css("width", container.width()).css("height", container.height());
}

function globular_render(container, diagram, subdiagram, suppress) {
    if (suppress == undefined) suppress = 0;
    var container_dom = $(container)[0];
    container_dom.rectangles = [];
    diagram = diagram.copy();
    if (diagram.geometric_dimension - suppress == 0) {
        return globular_render_0d(container, diagram, subdiagram);
    } else if (diagram.geometric_dimension - suppress == 1) {
        return globular_render_1d(container, diagram, subdiagram);
    } else if (diagram.geometric_dimension - suppress >= 2) {
        var data = globular_render_2d(container, diagram, subdiagram);
        if (subdiagram != undefined) {
            globular_add_highlight(container, data, subdiagram.box, {
                //                boundary: {
                depth: subdiagram.visibleBoundaryDepth,
                type: subdiagram.boundaryType
                //                }
            }, diagram);
        }
        return data;
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
    if (container.attr('id') == 'diagram-canvas' && diagram.getDimension() == 2 && diagram.source.data.length == 0) {
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
    g.setAttributeNS(null, "class", "diagram_group");
    return {
        svg: svg,
        g: g
    };
}

function globular_render_0d(container, diagram, subdiagram) {
    var d = prepare_SVG_container(container, diagram, -0.5, 0.5, -0.5, 0.5);
    $(container)[0].bounds = {
        left: -0.5,
        right: 0.5,
        top: 0.5,
        bottom: -0.5
    };
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttributeNS(null, "cx", 0);
    circle.setAttributeNS(null, "cy", 0);
    circle.setAttributeNS(null, "r", circle_radius);
    var id_data = diagram.getLastId();
    circle.setAttributeNS(null, "fill", gProject.getColour(id_data));
    circle.setAttributeNS(null, "stroke", "none");
    circle.setAttributeNS(null, "element_type", "vertex");
    d.g.appendChild(circle);
    $(container).append(d.svg);
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
    var length = Math.max(1, diagram.data.length);
    var d = prepare_SVG_container(container, diagram, 0, length, -0.5, 0.5);
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
    for (var i = 0; i < diagram.data.length; i++) {
        var start_x = (i == 0 ? 0 : i - 0.5);
        var finish_x = i + 0.5;
        var path_string = SVG_move_to({
            x: start_x,
            y: 0
        }) + SVG_line_to({
            x: finish_x,
            y: 0
        });
        d.g.appendChild(SVG_create_path({
            string: path_string,
            stroke: diagram.getSlice({ height: i, regular: true }).getLastColour(),
            element_type: 'edge',
            element_index: i
        }));
        data.edges.push({
            start_x: start_x,
            finish_x: finish_x,
            y: 0,
            id: diagram.getSlice({ height: i, regular: true }).getLastId(),
            level: i
        });
    }

    // Draw last line segment
    var start_x = length - 0.5 - (diagram.data.length == 0 ? 0.5 : 0);
    var finish_x = length;
    //var id = diagram.getTargetBoundary().cells[0].id;
    var id_data = diagram.getTargetBoundary().getLastId();
    d.g.appendChild(SVG_create_path({
        string: SVG_move_to({
            x: start_x,
            y: 0
        }) + SVG_line_to({
            x: finish_x,
            y: 0
        }),
        stroke: gProject.getColour(id_data),
        element_type: 'edge',
        element_index: diagram.data.length
    }));
    data.edges.push({
        start_x: start_x,
        finish_x: finish_x,
        y: 0,
        id: id_data.id,
        level: diagram.data.length
    });

    // Draw vertices
    var dimension = diagram.getDimension();
    for (var i = 0; i < diagram.data.length; i++) {
        //var id = diagram.data[i].getLastId();
        var id = diagram.getSlice({ height: i, regular: false }).getLastId();
        /*
        var colour = gProject.getColour({
            id: id,
            dimension: dimension
        });
        */
        var colour = gProject.getColour(id);
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        var x = i + 0.5;
        var y = 0;
        circle.setAttributeNS(null, "cx", x);
        circle.setAttributeNS(null, "cy", y);
        circle.setAttributeNS(null, "r", circle_radius);
        circle.setAttributeNS(null, "fill", colour);
        circle.setAttributeNS(null, "stroke", "none");
        circle.setAttributeNS(null, 'element_type', 'vertex');
        circle.setAttributeNS(null, 'element_index', i);
        d.g.appendChild(circle);
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
            d.g.appendChild(SVG_create_path({
                string: SVG_move_to({
                    x: 0,
                    y: 0
                }) + SVG_line_to({
                    x: .25,
                    y: 0
                }),
                stroke: highlight_colour,
                'stroke-opacity': highlight_opacity
            }));
        } else if (subdiagram.boundaryType == 't' && subdiagram.visibleBoundaryDepth == 1) {
            d.g.appendChild(SVG_create_path({
                string: SVG_move_to({
                    x: length,
                    y: 0
                }) + SVG_line_to({
                    x: length - .25,
                    y: 0
                }),
                stroke: highlight_colour,
                'stroke-opacity': highlight_opacity
            }));
        }
    }

    $(container).append(d.svg);
    return data;
}

// Render the top 2 dimensions of a diagram
function globular_render_2d(container, diagram, subdiagram) {

    // Deal with an empty 2-diagram specially
    if ((diagram.data.length == 0) && (diagram.source.data.length == 0)) {
        var d = prepare_SVG_container(container, diagram, -0.5, 0.5, -0.5, 0.5);
        d.g.appendChild(SVG_create_path({
            string: "M -0.5 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5  0.5",
            //fill: gProject.getColour(diagram.source.source.data[0].id)
            fill: diagram.getLastColour(),
            element_type: 'region'
        }));
        $(container).append(d.svg);
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
            edges_at_level: [[], []]
        };
    }

    var data = SVG_prepare(diagram);

    // Prepare the SVG group in which to render the diagram    
    var d = prepare_SVG_container(container, diagram, -0.5, data.max_x + 0.5, 0, Math.max(1, diagram.data.length));
    var defs = $('<defs>');
    $(d.svg).prepend(defs);

    // Draw overall background rectangle
    var big_background = false;
    var x_center = (data.max_x + 0) / 2;
    var y_center = Math.max(1, data.vertices.length) / 2;
    var w = big_background ? 20 : data.max_x + 1;
    var h = big_background ? 20 : Math.max(1, data.vertices.length);
    var path_string = SVG_move_to({ x: x_center - w / 2, y: y_center - h / 2 })
        + SVG_line_to({ x: x_center + w / 2, y: y_center - h / 2 })
        + SVG_line_to({ x: x_center + w / 2, y: y_center + h / 2 })
        + SVG_line_to({ x: x_center - w / 2, y: y_center + h / 2 });

    // Determine background colour
    var color = diagram.source.source.getLastColour();
    d.g.appendChild(SVG_create_path({ string: path_string, fill: color, element_type: 'region' }));
    $(container)[0].bounds = { left: -0.5, right: data.max_x + 0.5, top: Math.max(1, data.vertices.length), bottom: 0 };

    // Check whether there's a level with no edges
    var empty_level = false;
    data.edges_at_level = data.regular_levels;
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
        e1_bot = vertex.source_edges[p];
        e2_bot = vertex.source_edges[q];
        e1_top = vertex.target_edges[q];
        e2_top = vertex.target_edges[p];
        vertex.intersection = bezier_decompose(Math.min(e1_bot.x, e2_bot.x), Math.max(e1_bot.x, e2_bot.x), Math.min(e1_top.x, e2_top.x), Math.max(e1_top.x, e2_top.x), i);
        vertex.y = vertex.intersection.centre[1];
    }

    var svg_paths = [];
    for (var i = -1; i < data.edges.length; i++) {
        // Fill the extended area to the right of edge i
        var edge;
        if (i < 0) {
            // Only draw this right-hand region first if there are no empty levels
            if (empty_level) continue;
            var source_edges = data.edges_at_level[0];
            edge = source_edges[source_edges.length - 1];
        } else {
            edge = data.edges[i];
        }
        if (edge.fill_right) continue;
        var draw_up = true;

        var instructions = { edge, draw_up, path_string: "", turning: 0, avoid_boundary: (i >= 0) };
        do {
            instructions.edge.adjacent_regions.push(edge);
            process_instructions(data, instructions)
            if (instructions.edge == null) break;
        } while (instructions.edge != edge);
        if (!instructions.edge) continue;
        if (instructions.turning < 0) continue;

        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttributeNS(null, "d", instructions.path_string);
        //var colour = (edge.type == null ? '#ffffff' : gProject.getColour(gProject.signature.getGenerator(edge.type).target.data[0].id));
        var colour;
        if (!edge.type) colour = '#ffffff';
        else {
            var level = Math.ceil(edge.start_height);
            var sublevel;
            if (i < 0) {
                sublevel = data.edges_at_level[level].length - 1;
            } else {
                sublevel = data.edges_at_level[level].indexOf(i);
            }
            var sd = diagram.getSlice({ height: level, regular: true })
                .getSlice({ height: sublevel + 1, regular: true });
            colour = sd.getLastColour();
        }

        path.setAttributeNS(null, "stroke-width", 0.01);
        path.setAttributeNS(null, "stroke", "none");
        path.setAttributeNS(null, "fill", colour);
        path.setAttributeNS(null, "element_type", "region");
        path.region = edge;
        svg_paths.push({ path: path, edge: edge });
    }
    for (var i = 0; i < svg_paths.length; i++) {
        d.g.appendChild(svg_paths[i].path);
    }

    // Draw the edges
    for (var i = 0; i < data.edges.length; i++) {
        var edge = data.edges[i];
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        // Detect if we start or finish on a boundary
        var start_boundary = (edge.start_height == 0);
        var finish_boundary = (edge.finish_height == Math.max(1, diagram.data.length));

        var path_s = "";
        var drawn_something = false;

        // Draw line out of start vertex 
        if (start_boundary) {
            // We start at the boundary
            path_s += SVG_move_to({
                x: edge.x,
                y: 0
            });
        } else {
            // We start at a vertex
            var vertex = edge.start_vertex;
            if (vertex.type.is_basic_interchanger()) {
                path_s = SVG_move_to({ x: edge.x, y: edge.start_height + 0.5 });
            } else {
                path_s += SVG_move_to({ x: vertex.x, y: vertex.y });
                //path_s += SVG_line_to(edge.x, edge.start_height + 0.5);
                path_s += SVG_bezier_to({ c1x: edge.x, c1y: vertex.y, c2x: edge.x, c2y: vertex.y + 0.4, x: edge.x, y: edge.start_height + 0.5 });
                drawn_something = true;
            }
        }

        // Do the main straight part of the edge
        var draw_main = false;
        if (edge.finish_height > edge.start_height + 1) {
            path_s += SVG_line_to({ x: edge.x, y: edge.finish_height - 0.5 });
            drawn_something = true;
            draw_main = true;
        }

        // Do the top bit of the path
        if (finish_boundary) {
            path_s += SVG_line_to({ x: edge.x, y: edge.finish_height });
            drawn_something = true;
        } else {
            var vertex = edge.finish_vertex;
            if (!vertex.type.is_basic_interchanger()) {
                path_s += SVG_bezier_to({ c1x: edge.x, c1y: vertex.y - 0.4, c2x: edge.x, c2y: vertex.y, x: vertex.x, y: vertex.y });
                drawn_something = true;
            }
        }

        // Add the path to the SVG object
        if (drawn_something) {
            path.setAttributeNS(null, "d", path_s);
            path.setAttributeNS(null, "stroke", gProject.getColour(edge.type));
            path.setAttributeNS(null, "stroke-width", line_width);
            path.setAttributeNS(null, "fill", "none");
            path.setAttributeNS(null, "element_type", 'edge');
            path.setAttributeNS(null, 'element_index', i)
            d.g.appendChild(path);
        }
    }

    // Draw the vertices
    var epsilon = 0.0;
    for (var i = 0; i < data.vertices.length; i++) {

        var vertex = data.vertices[i];
        vertex.dimension = diagram.getDimension();
        var circle_opacity = 1;

        if (vertex.type.is_basic_interchanger()) {

            circle_opacity = 0;

            // Draw the interchanger. First, decide which strand goes on top
            var e1_bot, e2_bot, e1_top, e2_top;
            var p = (vertex.type == 'Int' ? 1 : 0);
            var q = 1 - p;
            e1_bot = vertex.source_edges[p];
            e2_bot = vertex.source_edges[q];
            e1_top = vertex.target_edges[q];
            e2_top = vertex.target_edges[p];
            var left = Math.min(e1_bot.x, e2_bot.x, e1_top.x, e2_top.x) - 1;
            var right = Math.max(e1_bot.x, e2_bot.x, e1_top.x, e2_top.x) + 1;

            var lower_colour = gProject.getColour({ id: e1_bot.type, dimension: diagram.getDimension() - 1 });
            var upper_colour = gProject.getColour({ id: e2_bot.type, dimension: diagram.getDimension() - 1 });

            // Prepare the upper path
            var top_str = SVG_move_to({ x: e2_bot.x, y: i - epsilon })
                + SVG_bezier_to({ c1x: e2_bot.x, c1y: i + 0.5, c2x: e2_top.x, c2y: i + 0.5, x: e2_top.x, y: i + 1 + epsilon });

            // Draw lower path, possibly using an obscuring mask
            var obscure = vertex.type.tail('Int', 'IntI0'); // obscure only for basic interchangers
            //var mask_id = "mask" + i;
            var mask_id = "mark" + (mask_index++);
            if (obscure) {
                // Add the obscuring mask, which is a fattened version of the upper line
                var mask = $('<mask>', {
                    id: mask_id
                });
                var transparent_str = SVG_move_to({ x: left, y: i })
                    + SVG_line_to({ x: left, y: i + 1 })
                    + SVG_line_to({ x: right, y: i + 1 })
                    + SVG_line_to({ x: right, y: i })
                    + SVG_line_to({ x: left, y: i });
                mask.append(SVG_create_path({ string: transparent_str, fill: "white", element_type: 'mask_transparent' }));
                mask.append(SVG_create_path({ string: top_str, stroke_width: line_width * 2, stroke: "black", element_type: 'mask_top' }));
                //g.appendChild(mask[0]);
                defs.append(mask);

            }
            // Draw the lower path
            var bot_str = SVG_move_to({ x: e1_bot.x, y: i - epsilon })
                + SVG_bezier_to({ c1x: e1_bot.x, c1y: i + 0.5, c2x: e1_top.x, c2y: i + 0.5, x: e1_top.x, y: i + 1 + epsilon });
            d.g.appendChild(SVG_create_path({ element_index: i, element_index_2: 1, string: bot_str, stroke: lower_colour, stroke_width: line_width, mask: (obscure ? "url(#" + mask_id + ")" : null), element_type: 'interchanger_edge' }));

            // Draw upper path
            d.g.appendChild(SVG_create_path({ element_index: i, element_index_2: 0, string: top_str, stroke: upper_colour, stroke_width: line_width, element_type: 'interchanger_edge', }));

            // Attach little circles where the path joins its neighbours
            if (i != 0) { // Draw little circles at the bottom                
                d.g.appendChild(SVG_create_circle({ x: e2_bot.x, y: i, fill: upper_colour, class_name: 'dummy' }));
                d.g.appendChild(SVG_create_circle({ x: e1_bot.x, y: i, fill: lower_colour, class_name: 'dummy' }));
            }
            if (i != data.vertices.length - 1) { // Draw little circles at the top
                d.g.appendChild(SVG_create_circle({ x: e2_top.x, y: i + 1, fill: upper_colour, class_name: 'dummy' }));
                d.g.appendChild(SVG_create_circle({ x: e1_top.x, y: i + 1, fill: lower_colour, class_name: 'dummy' }));
            }
        }

        vertex.fill = gProject.getColour(vertex.type);
        vertex.radius = circle_radius;
        vertex.element_type = 'vertex';
        vertex.element_index = i;
        vertex.fill_opacity = circle_opacity;
        d.g.appendChild(SVG_create_circle(vertex));
    }

    // Add SVG object to container. We have to do it in this weird way because
    // otherwise the masks aren't recognized in Chrome v46.
    var html = $("<div />").append($(d.svg)).html();
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
    if (data.element_index != undefined) path.setAttributeNS(null, 'element_index', data.element_index);
    if (data.element_index_2 != undefined) path.setAttributeNS(null, 'element_index_2', data.element_index_2);
    if (data.element_type != undefined) path.setAttributeNS(null, 'element_type', data.element_type);
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
    if (data.fill_opacity != undefined) circle.setAttributeNS(null, 'fill-opacity', data.fill_opacity);
    if (data.element_index != undefined) circle.setAttributeNS(null, 'element_index', data.element_index);
    if (data.element_type != undefined) circle.setAttributeNS(null, 'element_type', data.element_type);
    if (data.class_name != undefined) circle.setAttributeNS(null, 'class', data.class_name);
    //d.g.appendChild(circle);
    return circle;

}

function process_instructions(data, i) {

    // Draw the edge segment appropriately
    if (i.draw_up) {
        i.edge.fill_right = true;
        if (i.path_string.length == 0) {
            i.path_string = SVG_move_to(bottom_of_edge(data, i.edge));
        }
        i.path_string += SVG_draw_edge_bottom_to_top(data, i.edge);
        // ... update the instructions.
        var vertex = i.edge.finish_vertex;
        if (vertex == null) {
            // We've reached the top of the diagram, so draw a line clockwise
            // until we get to the next edge
            var next_edge = i.edge.next_clockwise_at_target;
            if (next_edge == null) {
                // We've reached the top-right of the diagram, so come around
                if (i.avoid_boundary) {
                    i.edge = null;
                    return;
                }
                i.path_string += SVG_line_to({ x: data.max_x + 0.5, y: Math.max(1, data.vertices.length) });
                i.path_string += SVG_line_to({ x: data.max_x + 0.5, y: 0 });
                var source_edges = data.edges_at_level[0];
                if (source_edges.length == 0) {
                    i.path_string += SVG_line_to({ x: -0.5, y: 0 });
                    i.path_string += SVG_line_to({ x: -0.5, y: Math.max(1, data.vertices.length) });
                    var target_edges = data.edges_at_level.last();//[data.edges_at_level.length - 1];
                    i.edge = target_edges[0]; // Will necessarily exist
                    i.path_string += SVG_line_to(top_of_edge(data, i.edge));
                    i.draw_up = false;
                    i.turning += 3; // turn right thrice
                    return;
                }
                i.edge = source_edges.last();//[source_edges.length - 1];
                i.path_string += SVG_line_to(bottom_of_edge(data, i.edge));
                i.draw_up = true;
                i.turning += 2; // turn right twice
                return;
            }
            // Come down the next edge
            i.path_string += SVG_line_to(top_of_edge(data, next_edge));
            i.edge = next_edge;
            i.draw_up = false;
            i.turning += 1; // turn right once
            return;
        }
        // We've got to a vertex, as a source edge.
        for (var j = 0; j < vertex.source_edges.length; j++) {
            if (vertex.source_edges[j] == i.edge) {
                if (j < vertex.source_edges.length - 1) {
                    // Come down the next source edge
                    i.edge = vertex.source_edges[j + 1];
                    i.draw_up = false;
                    i.turning += 1; // turn right once
                    return;
                }
                // We've come up the last source edge
                if (vertex.target_edges.length == 0) {
                    // No target edges! So come back down the first source edge.
                    // Doesn't matter if this is the same one we came up.
                    i.edge = vertex.source_edges[0];
                    i.draw_up = false;
                    i.turning -= 1; // turn left once
                    return;
                }
                // Continue up the last target edge
                i.edge = vertex.target_edges.last();//[vertex.target_edges.length - 1];
                i.draw_up = true;
                i.turning += 0; // not turning
                return;
            }
        }
    }

    // We're drawing down
    if (i.path_string.length == 0) {
        alert("Shouldn't be drawing down with empty path string!");
        throw 0;
    }

    i.path_string += SVG_draw_edge_top_to_bottom(data, i.edge);
    var vertex = i.edge.start_vertex;
    if (vertex == null) {
        // We've reached the bottom of the diagram, so draw a line clockwise
        // until we get to the next edge
        var next_edge = i.edge.next_clockwise_at_source;
        if (next_edge == null) {
            // We've reached the bottom-left of the diagram, so come around
            if (i.avoid_boundary) {
                i.edge = null;
                return;
            }
            i.path_string += SVG_line_to({ x: -0.5, y: 0 });
            i.path_string += SVG_line_to({ x: -0.5, y: Math.max(1, data.vertices.length) });
            var target_edges = data.edges_at_level.last();//[data.edges_at_level.length - 1];
            if (target_edges.length == 0) {
                // No edges at the top of the diagram, so come around
                i.path_string += SVG_line_to({ x: data.max_x + 0.5, y: Math.max(1, data.vertices.length) });
                i.path_string += SVG_line_to({ x: data.max_x + 0.5, y: 0 });
                var source_edges = data.edges_at_level[0];
                i.edge = data.edges[source_edges.length - 1]; // Will necessarily exist
                i.path_string += SVG_line_to(bottom_of_edge(data, i.edge));
                i.draw_up = true;
                i.turning += 3;
                return;
            }
            // There are edges at the top of the diagram, so choose the first one
            i.edge = target_edges[0];
            i.path_string += SVG_line_to(top_of_edge(data, i.edge));
            i.draw_up = false;
            i.turning += 2;
            return;
        }
        // We've got another edge clockwise on the bottom of the diagram
        i.path_string += SVG_line_to(bottom_of_edge(data, next_edge));
        i.edge = next_edge;
        i.draw_up = true;
        i.turning += 1;
        return;
    }

    // We've got to a vertex, as a target edge. Find which edge it is.
    for (var j = 0; j < vertex.target_edges.length; j++) {
        if (vertex.target_edges[j] == i.edge) {
            if (j == 0) {
                // We've come down as the first target edge
                if (vertex.source_edges.length == 0) {
                    // No source edges! So come back up the last target edge.
                    // Doesn't matter if this is the same one we came down.
                    i.edge = vertex.target_edges.last();//[vertex.target_edges.length - 1];
                    i.draw_up = true;
                    i.turning -= 1;
                    return;
                }
                // Continue down the first source edge
                i.edge = vertex.source_edges[0];
                i.draw_up = false;
                i.turning += 0; // no turning
                return;
            }
            // We haven't come down the first target edge, so continue
            // up the edge to the left
            i.edge = vertex.target_edges[j - 1];
            i.draw_up = true;
            i.turning += 1;
            return;
        }
    }
}

function SVG_line_to(p) {
    _assert(p.x != null && p.y != null);
    return "L " + p.x + " " + p.y + " ";
}

function SVG_bezier_to(p) {
    _assert(p.c1x != null && p.c1y != null && p.c2x != null && p.c2y != null && p.x != null && p.y != null);
    return "C " + p.c1x + " " + p.c1y + ", " + p.c2x + " " + p.c2y + ", " + p.x + " " + p.y + " ";
}

function SVG_move_to(p) {
    _assert(p.x != null && p.y != null);
    return "M " + p.x + " " + p.y + " ";
}

// Return the point at the bottom of the edge
function bottom_of_edge(data, edge) {
    if (edge.start_vertex == null) return { x: edge.x, y: 0 };
    return { x: edge.start_vertex.x, y: edge.start_vertex.y };
}

// Return the point at the top of the edge
function top_of_edge(data, edge) {
    if (edge.finish_vertex == null) return { x: edge.x, y: Math.max(1, data.vertices.length) };
    return { x: edge.finish_vertex.x, y: edge.finish_vertex.y };
}

function SVG_draw_edge_bottom_to_top(data, edge) {
    let r = SVG_draw_edge_section(data, edge, edge.start_height, edge.finish_height);
    _assert(r != null);
    return r;
}

function SVG_draw_edge_top_to_bottom(data, edge) {
    var r = SVG_draw_edge_section(data, edge, edge.finish_height, edge.start_height);
    _assert(r != null);
    return r;
}

function SVG_draw_edge_section(data, edge, h_start, h_end) {
    var diagram_height = Math.max(1, data.vertices.length);
    h_start = Math.min(Math.max(h_start, 0), diagram_height);
    h_end = Math.min(Math.max(h_end, 0), diagram_height);
    if (h_start == h_end) return "";
    var path = "";
    if (h_start < h_end) {
        // Draw bottom-to-top
        var bottom_section = (edge.start_vertex == null ? (h_start == 0) && (edge.finish_height > 0.5) : h_start == edge.start_height);
        var middle_section = ((h_start < edge.finish_height - 0.5) && (h_end > edge.start_height + 0.5));
        var top_section = (edge.finish_vertex == null ? h_end == diagram_height : h_end == edge.finish_height);
        if (bottom_section) {
            // Draw bottom half-height of edge
            if (edge.start_vertex == null) {
                // Incoming from lower boundary
                path += SVG_line_to({ x: edge.x, y: h_start + 0.5 });
            } else {
                // Coming up out of a vertex as a target edge
                var vertex = edge.start_vertex;
                if (vertex.intersection == undefined) {
                    path += SVG_bezier_to({ c1x: edge.x, c1y: vertex.y, c2x: edge.x, c2y: vertex.y + 0.4, x: edge.x, y: edge.start_height + 0.5 });
                } else {
                    var i = vertex.intersection;
                    var left = (edge == vertex.target_edges[0]);
                    path += SVG_bezier_to({ c1x: (left ? i.tl.P3[0] : i.tr.P3[0]), c1y: (left ? i.tl.P3[1] : i.tr.P3[1]), c2x: (left ? i.tl.P2[0] : i.tr.P2[0]), c2y: (left ? i.tl.P2[1] : i.tr.P2[1]), x: edge.x, y: edge.start_height + 0.5 });
                }
            }
        }
        if (middle_section) {
            // Draw appropriate portion of central piece of line
            var central_finish = Math.min(h_end, edge.finish_height - 0.5);
            path += SVG_line_to({ x: edge.x, y: central_finish });
        }
        if (top_section) {
            // Draw top half-height of line
            if (edge.finish_vertex == null) {
                // Edge finishes at the top boundary
                path += SVG_line_to({ x: edge.x, y: h_end });
            } else {
                // Coming up into a vertex as a source edge
                var vertex = edge.finish_vertex;
                if (vertex.intersection == undefined) {
                    path += SVG_bezier_to({ c1x: edge.x, c1y: vertex.y - 0.4, c2x: edge.x, c2y: vertex.y, x: vertex.x, y: vertex.y });
                } else {
                    var i = vertex.intersection;
                    var left = (edge == vertex.source_edges[0]);
                    path += SVG_bezier_to({ c1x: (left ? i.bl.P2[0] : i.br.P2[0]), c1y: (left ? i.bl.P2[1] : i.br.P2[1]), c2x: (left ? i.bl.P3[0] : i.br.P3[0]), c2y: (left ? i.bl.P3[1] : i.br.P3[1]), x: vertex.x, y: vertex.y });
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
                path += SVG_line_to({
                    x: edge.x,
                    y: h_start - 0.5
                });
            } else {
                // Coming down out of a vertex as a source edge
                var vertex = edge.finish_vertex;
                if (vertex.intersection == undefined) {
                    path += SVG_bezier_to({
                        c1x: edge.x,
                        c1y: vertex.y,
                        c2x: edge.x,
                        c2y: vertex.y - 0.4,
                        x: edge.x,
                        y: edge.finish_height - 0.5
                    });
                } else {
                    var i = vertex.intersection;
                    var left = (edge == vertex.source_edges[0]);
                    path += SVG_bezier_to({
                        c1x: (left ? i.bl.P3[0] : i.br.P3[0]),
                        c1y: (left ? i.bl.P3[1] : i.br.P3[1]),
                        c2x: (left ? i.bl.P2[0] : i.br.P2[0]),
                        c2y: (left ? i.bl.P2[1] : i.br.P2[1]),
                        x: edge.x,
                        y: edge.finish_height - 0.5
                    });

                }
            }
        }
        if (middle_section) {
            // Draw appropriate portion of central piece of line
            var central_finish = Math.max(h_end, edge.start_height + 0.5);
            path += SVG_line_to({
                x: edge.x,
                y: central_finish
            });
        }
        if (bottom_section) {
            // Draw bottom half-height of line
            if (edge.start_vertex == null) {
                // Edge finishes at the bottom boundary
                path += SVG_line_to({
                    x: edge.x,
                    y: h_end
                });
            } else {
                // Coming down into a vertex as a target edge
                var vertex = edge.start_vertex;
                if (vertex.intersection == undefined) {
                    path += SVG_bezier_to({
                        c1x: edge.x,
                        c1y: vertex.y + 0.4,
                        c2x: edge.x,
                        c2y: vertex.y,
                        x: vertex.x,
                        y: vertex.y
                    });
                } else {
                    var i = vertex.intersection;
                    var left = (edge == vertex.target_edges[0]);
                    path += SVG_bezier_to({
                        c1x: (left ? i.tl.P2[0] : i.tr.P2[0]),
                        c1y: (left ? i.tl.P2[1] : i.tr.P2[1]),
                        c2x: (left ? i.tl.P3[0] : i.tr.P3[0]),
                        c2y: (left ? i.tl.P3[1] : i.tr.P3[1]),
                        x: vertex.x,
                        y: vertex.y
                    });

                }
            }
        }
    }

    return path;
}


function SVG_prepare(diagram, subdiagram) {
    /* For each edge, calculate its start and finish height, and its x-coordinate.
       For each vertex, calculate its list of edges. */

    let edges = [];
    let vertices = [];
    let regular_levels = [];
    let singular_levels = [];
    let max_x = -Number.MAX_VALUE;

    // Can't layout a diagram of dimension less than 2
    if (diagram.getDimension() < 2) return;

    // Start with the edges that exist at the source boundary
    let current_regular_level = [];
    for (var level = 0; level < diagram.source.data.length; level++) {
        var attachment = diagram.source.data[level];
        var new_edge = {
            structure: 'edge',
            type: attachment.getLastId(),
            start_height: 0,
            finish_height: null,
            x: 0,
            start_vertex: null,
            finish_vertex: null,
        };

        // Store data
        edges.push(new_edge);
        current_regular_level.push(new_edge);
    }
    regular_levels.push(current_regular_level.slice());

    for (var level = 0; level < diagram.data.length; level++) {

        let data = diagram.data[level];
        let height_is_vertex = [];
        let current_singular_level = current_regular_level.slice();

        // Create the new vertices for this level
        let forward_nontrivial_neighbourhood = data.forward_limit.analyzeSingularNeighbourhoods();
        let backward_nontrivial_neighbourhood = data.backward_limit.analyzeSingularNeighbourhoods();
        let forward_monotone = data.forward_limit.getMonotone();
        let backward_monotone = data.backward_limit.getMonotone();
        let s = diagram.getSlice({ height: level, regular: false });
        let new_vertices = [];
        for (let i = 0; i < s.data.length; i++) {
            if (forward_nontrivial_neighbourhood[i] || backward_nontrivial_neighbourhood[i]) {
                let structure = 'vertex';
                let type = s.data[i].getLastId();
                let x = 0;
                let y = level + 0.5;
                let forward_insert = Globular.findFirstLast(forward_monotone, i);
                let backward_insert = Globular.findFirstLast(backward_monotone, i);
                let singular_height = i;
                let vertex = { structure, type, level, x, y, forward_insert, backward_insert, singular_height };
                //current_singular_level.push(vertex);
                vertices.push(vertex);
                new_vertices.push(vertex);
            }
        }

        // Remove the edges that have been consumed, and create new edges as necessary
        let offset = 0;
        for (let i = new_vertices.length - 1; i >= 0; i--) {
            let vertex = new_vertices[i];
            vertex.source_edges = [];
            vertex.target_edges = [];

            // Set the source edges correctly for this vertex
            for (let j = vertex.forward_insert.first; j < vertex.forward_insert.last; j++) {
                var edge = regular_levels[level][j]
                vertex.source_edges[j - vertex.forward_insert.first] = edge;
                edge.finish_vertex = vertex;
                edge.finish_height = vertex.y;
            }

            // Create the new edges that are created by this vertex
            let next_slice = diagram.getSlice({ height: level + 1, regular: true });
            let new_edges = [];
            for (let j = vertex.backward_insert.first; j < vertex.backward_insert.last; j++) {
                let index = j;
                let structure = 'edge';
                let type = next_slice.data[j].getLastId();
                let start_height = vertex.y;
                let finish_height = null;
                //let succeeding = []; // NEED TO POPULATE!!!
                let x = 0;
                let start_vertex = vertex;
                let finish_vertex = null;
                var new_edge = { structure, type, start_height, finish_height, x, start_vertex, finish_vertex };
                edges.push(new_edge);
                new_edges.push(new_edge);
                vertex.target_edges[j - vertex.backward_insert.first] = new_edge;
            }

            // Update the current_edges array
            let regular_before = current_regular_level.slice(0, vertex.forward_insert.first);
            let regular_after = current_regular_level.slice(vertex.forward_insert.last);
            current_regular_level = regular_before.concat(new_edges.concat(regular_after));
            let singular_before = current_singular_level.slice(0, vertex.forward_insert.first);
            let singular_after = current_singular_level.slice(vertex.forward_insert.last);
            current_singular_level = singular_before.concat([vertex].concat(singular_after));
        }

        // Remember the list of edges at this level of the diagram
        singular_levels.push(current_singular_level);
        regular_levels.push(current_regular_level.slice());
    }

    // Specify finish height of dangling edges
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        if (edge.finish_height == null) {
            edge.finish_height = Math.max(1, diagram.data.length);
        }
        edge.length = edge.finish_height - edge.start_height;
        edge.fill_right = false;
        edge.next_clockwise_at_target = null;
        edge.next_clockwise_at_source = null;
        edge.adjacent_regions = [];
    }

    // For the edges at the top and bottom of the diagram, specify their clockwise successors
    // Bottom of diagram:
    for (var i = 1; i < regular_levels[0].length; i++) {
        let edge = regular_levels[0][i];
        edge.next_clockwise_at_source = regular_levels[0][i - 1];
    }
    // Top of diagram:
    for (var i = 0; i < current_regular_level.length - 1; i++) {
        let edge = current_regular_level[i];
        edge.next_clockwise_at_target = current_regular_level[i + 1];
    }

    // Calculate the x coordinates for edges and scalars
    while (true) {
        let problem;

        // Make sure there's enough space between elements
        do {
            problem = false;
            for (let i = 0; i < regular_levels.length; i++) {
                let level = regular_levels[i];
                for (let j = 0; j < level.length - 1; j++) {
                    if (level[j + 1].x <= level[j].x) {
                        problem = true;
                        level[j + 1].x = level[j].x + 1;
                    }
                }
            }
            for (let i = 0; i < singular_levels.length; i++) {
                let level = singular_levels[i];
                for (let j = 0; j < level.length - 1; j++) {
                    if (level[j + 1].x <= level[j].x) {
                        problem = true;
                        level[j + 1].x = level[j].x + 1;
                    }
                }
            }
        } while (problem);

        // Even up inputs and outputs for vertices
        for (var i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            if (vertex.source_edges.length == 0) continue;
            if (vertex.target_edges.length == 0) continue;

            let source_mean = (vertex.source_edges[0].x + vertex.source_edges.last().x) / 2;
            let target_mean = (vertex.target_edges[0].x + vertex.target_edges.last().x) / 2;
            let diff = Math.abs(source_mean - target_mean);
            if (diff > 0.01) {
                problem = true;
                let edges_to_offset = (source_mean > target_mean) ? vertex.target_edges : vertex.source_edges;
                for (let j = 0; j < edges_to_offset.length; j++) {
                    edges_to_offset[j].x += diff;
                }
            }

            /*
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
            */
        }
        if (!problem) break;
    }

    // Find max x-coordinate
    for (var i = 0; i < regular_levels.length; i++) {
        let level = regular_levels[i];
        for (let j = 0; j < level.length; j++) {
            max_x = Math.max(max_x, level[j].x);
        }
    }
    for (var i = 0; i < singular_levels.length; i++) {
        let level = singular_levels[i];
        for (let j = 0; j < level.length; j++) {
            max_x = Math.max(max_x, level[j].x);
        }
    }

    // Set vertex x-coordinates for non-scalars
    for (var i = 0; i < vertices.length; i++) {
        var vertex = vertices[i];
        if (vertex.source_edges.length + vertex.target_edges.length == 0) continue;
        if (vertex.source_edges.length == 1) {
            vertex.x = vertex.source_edges[0].x;
        } else if (vertex.target_edges.length == 1) {
            vertex.x = vertex.target_edges[0].x;
        } else {
            var total_x = 0;
            for (var j = 0; j < vertex.source_edges.length; j++) {
                total_x += vertex.source_edges[j].x;
            }
            for (var j = 0; j < vertex.target_edges.length; j++) {
                total_x += vertex.target_edges[j].x;
            }
            vertex.x = total_x / (vertex.target_edges.length + vertex.source_edges.length);
        }
    }

    return { edges, vertices, regular_levels, max_x };
}

// Add a highlighting rectangle to the diagram
function globular_add_highlight(container, data, box, boundary, diagram) {

    if (diagram.getDimension() < 2) return;
    var b = $(container)[0].bounds;
    var bottom, top, left, right;

    if (boundary != null) {
        if (boundary.depth == 0) boundary = null;
    }

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
                edges = data.edges_at_level[diagram.data.length];
            }
            if (box.min.last() == box.max.last()) {
                if (box.min.last() == 0) {
                    left = b.left;
                    right = edges.length == 0 ? b.right : edges[0].x - 0.5;
                } else if (box.max.last() == edges.length) {
                    left = edges.last().x + 0.5;
                    right = b.right;
                } else {
                    left = edges[box.min.last() - 1].x + 0.5;
                    right = edges[box.min.last()].x - 0.5;
                }
            } else {
                left = edges[box.min.last()].x - 0.5;
                right = edges[box.max.last() - 1].x + 0.5;
            }
            if (left == right) {
                left -= 0.25;
                right += 0.25;
            }
        }
    } else { // The case that boundary == null

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
                        eff_right = edges[0].x - 0.5;
                    } else if (chunk.max == edges.length) {
                        eff_left = edges.last().x + 0.5;
                        eff_right = b.right;
                    } else {
                        eff_left = edges[chunk.min - 1].x + 0.5;
                        eff_right = edges[chunk.min].x - 0.5;
                    }
                } else {
                    eff_left = edges[chunk.min].x - 0.5;
                    eff_right = edges[chunk.max - 1].x + 0.5;
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
    //svg.children('g').children('g').append(g);
    svg.find('g.diagram_group').append(g);
    var path_string =
        SVG_move_to({ x: left, y: bottom })
        + SVG_line_to({ x: left, y: top })
        + SVG_line_to({ x: right, y: top })
        + SVG_line_to({ x: right, y: bottom })
        + SVG_line_to({ x: left, y: bottom });
    g[0].appendChild(SVG_create_path({ string: path_string, fill: '#ffff00', fill_opacity: 0.5 }));
}