"use strict";

/*
    SVG rendering of 2d diagrams
*/

// Parameter that sets the hardness of string diagram curves
var shoulder_strength = 0.1;
var circle_radius = 0.1;
var highlight_colour = '#ffff00';
var highlight_opacity = 0.8;

function globular_set_viewbox() {
    var container = $('#diagram-canvas');
    $('#diagram-canvas>svg').css("width", container.width()).css("height", container.height());
}

function globular_render(container, diagram, subdiagram) {
    if (diagram.getDimension() == 0) {
        globular_render_0d(container, diagram, subdiagram);
    }
    else if (diagram.getDimension() == 1) {
        globular_render_1d(container, diagram, subdiagram);
    }
    else if (diagram.getDimension() == 2) {
        globular_render_2d(container, diagram, subdiagram);
    }
    else {
        return;
    }
}

function prepare_SVG_container(container, min_x, max_x, min_y, max_y) {
    container = $(container);
    container.empty();
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.setAttributeNS(null, "viewBox", (min_x).toString() + " " + (-max_y.toString()) + " " + (max_x - min_x) + " " + (max_y - min_y));
    svg.setAttributeNS(null, "preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("width", container.width());
    svg.setAttribute("height", container.height());
    container.append(svg);
    svg.appendChild(g);
    g.setAttributeNS(null, "transform", "scale (1 -1)");
    return g;
}

function globular_render_0d(container, diagram, subdiagram) {
    var g = prepare_SVG_container(container, -0.5, 0.5, -0.5, 0.5);
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttributeNS(null, "cx", 0);
    circle.setAttributeNS(null, "cy", 0);
    circle.setAttributeNS(null, "r", circle_radius);
    circle.setAttributeNS(null, "fill", gProject.getColour(diagram.nCells[0].id));
    circle.setAttributeNS(null, "stroke", "none");
    g.appendChild(circle);
}

function globular_render_1d(container, diagram, subdiagram) {
    var length = Math.max(1, diagram.nCells.length);
    var g = prepare_SVG_container(container, 0, length, -0.5, 0.5);

    /*
    if (diagram.nCells.length == 0) {
        var path = SVG_create_path({
            string: "M 0 0 L 1 0",
            stroke: gProject.getColour(diagram.source.nCells[0].id)
        });
        g.appendChild(path);
        return;
    }
    */

    // Draw line segments except last
    for (var i = 0; i < diagram.nCells.length; i++) {
        var start_x = (i == 0 ? 0 : i - 0.5);
        var finish_x = i + 0.5;
        var path_string = SVG_move_to({
            x: start_x,
            y: 0
        }) + SVG_line_to({
            x: finish_x,
            y: 0
        });
        var id = gProject.signature.getGenerator(diagram.nCells[i].id).source.nCells[0].id;
        var colour = gProject.getColour(id);
        g.appendChild(SVG_create_path({
            string: path_string,
            stroke: colour
        }));
    }

    // Draw last line segment
    g.appendChild(SVG_create_path({
        string: SVG_move_to({
            x: length - 0.5 - (diagram.nCells.length == 0 ? 0.5 : 0),
            y: 0
        }) + SVG_line_to({
            x: length,
            y: 0
        }),
        stroke: gProject.getColour(diagram.getTargetBoundary().nCells[0].id),
    }));

    // Draw vertices
    for (var i = 0; i < diagram.nCells.length; i++) {
        var id = diagram.nCells[i].id;
        var colour = gProject.getColour(id);
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttributeNS(null, "cx", i + 0.5);
        circle.setAttributeNS(null, "cy", 0);
        circle.setAttributeNS(null, "r", circle_radius);
        circle.setAttributeNS(null, "fill", colour);
        circle.setAttributeNS(null, "stroke", "none");
        g.appendChild(circle);
    }

    // Draw highlight
    if (subdiagram === undefined) return;
    if (subdiagram.boundaryPath == 's') {
        g.appendChild(SVG_create_path({
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
    }
    else if (subdiagram.boundaryPath == 't') {
        g.appendChild(SVG_create_path({
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

function globular_render_2d(container, diagram, subdiagram) {

    if (diagram.getDimension() != 2) return;

    // Deal with an empty 2-diagram specially
    if ((diagram.nCells.length == 0) && (diagram.source.nCells.length == 0)) {
        var g = prepare_SVG_container(container, -0.5, 0.5, -0.5, 0.5);
        g.appendChild(SVG_create_path({
            string: "M -0.5 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5  0.5",
            fill: gProject.getColour(diagram.source.source.nCells[0].id)
        }));
        return;
    }

    var data = SVG_prepare(diagram);

    // Prepare the SVG group in which to render the diagram    
    var g = prepare_SVG_container(container, -0.5, data.max_x + 0.5, 0, Math.max(1, diagram.nCells.length));

    // Draw overall background rectangle
    //var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var path_string = SVG_move_to({
        x: -0.5,
        y: 0
    });
    path_string += SVG_line_to({
        x: data.max_x + 0.5,
        y: 0
    });
    path_string += SVG_line_to({
        x: data.max_x + 0.5,
        y: Math.max(1, data.vertices.length)
    });
    path_string += SVG_line_to({
        x: -0.5,
        y: Math.max(1, data.vertices.length)
    });
    g.appendChild(SVG_create_path({
        string: path_string,
        fill: gProject.getColour(diagram.source.source.nCells[0].id)
    }));

    // Check to see if there's a level with no edges
    var empty_level = false;
    for (var i = 0; i < data.edges_at_level.length; i++) {
        if (data.edges_at_level[i].length == 0) {
            empty_level = true;
            break;
        }
    }

    var svg_paths = [];
    for (var i = -1; i < data.edges.length; i++) {
        // Fill the extended area to the right of edge i
        var edge;
        if (i < 0) {
            // Only draw this right-hand region first if there are no empty levels
            if (empty_level) continue;
            var source_edges = data.edges_at_level[0];
            edge = data.edges[source_edges[source_edges.length - 1]];
        }
        else {
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
        do {
            instructions.edge.adjacent_regions.push(edge);
            process_instructions(data, instructions)
            if (instructions.edge == null) break;
        } while (instructions.edge != edge);
        if (instructions.edge == null) {
            continue;
        }
        if (instructions.turning < 0) {
            continue;
        }

        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttributeNS(null, "d", instructions.path_string);
        var colour = gProject.getColour(gProject.signature.getGenerator(edge.type).target.nCells[0].id);
        path.setAttributeNS(null, "stroke-width", 0.01);
        path.setAttributeNS(null, "stroke", "none");
        path.setAttributeNS(null, "fill", colour);
        path.region = edge;
        svg_paths.push({
            path: path,
            edge: edge
        });
    }
    for (var i = 0; i < svg_paths.length; i++) {
        g.appendChild(svg_paths[i].path);
    }

    // Draw the edges
    for (var i = 0; i < data.edges.length; i++) {
        var edge = data.edges[i];
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        // Detect if we start or finish on a boundary
        var start_boundary = (edge.start_height == 0);
        var finish_boundary = (edge.finish_height == Math.max(1, diagram.nCells.length));

        var path_s = "";

        // Draw line out of start vertex 
        if (start_boundary) {
            // We start at the boundary
            path_s += SVG_move_to({
                x: edge.x,
                y: 0
            });
        }
        else {
            // We start at a vertex
            var vertex = data.vertices[edge.start_vertex];
            path_s += SVG_move_to({
                x: vertex.x,
                y: vertex.y
            });
            //path_s += SVG_line_to(edge.x, edge.start_height + 0.5);
            path_s += SVG_bezier_to({
                c1x: edge.x,
                c1y: vertex.y,
                c2x: edge.x,
                c2y: vertex.y + 0.4,
                x: edge.x,
                y: edge.start_height + 0.5
            });
        }

        // Do the main straight part of the edge
        if (edge.finish_height > edge.start_height + 1) {
            path_s += SVG_line_to({
                x: edge.x,
                y: edge.finish_height - 0.5
            });
        }

        // Do the top bit of the path
        if (finish_boundary) {
            var z = 0;
            // Nothing to do, unless also coming from source boundary
            //if (start_boundary) {
            path_s += SVG_line_to({
                x: edge.x,
                y: edge.finish_height
            });
            //}
        }
        else {
            var vertex = data.vertices[edge.finish_vertex];
            //path_s += SVG_line_to(vertex.x, vertex.height + 0.5);
            path_s += SVG_bezier_to({
                c1x: edge.x,
                c1y: vertex.y - 0.4,
                c2x: edge.x,
                c2y: vertex.y,
                x: vertex.x,
                y: vertex.y
            });
        }

        // Add the path to the SVG object
        path.setAttributeNS(null, "d", path_s);
        path.setAttributeNS(null, "stroke", gProject.getColour(edge.type));
        path.setAttributeNS(null, "stroke-width", 0.1);
        path.setAttributeNS(null, "fill", "none");
        g.appendChild(path);
    }

    // Draw the vertices
    for (var i = 0; i < data.vertices.length; i++) {
        var vertex = data.vertices[i];
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttributeNS(null, "cx", vertex.x);
        circle.setAttributeNS(null, "cy", vertex.y);
        circle.setAttributeNS(null, "r", 0.1);
        circle.setAttributeNS(null, "fill", gProject.getColour(vertex.type));
        circle.setAttributeNS(null, "stroke", "none");
        g.appendChild(circle);
    }

    // Render the highlight
    if (subdiagram === undefined) return;
    var delta = 0.0005;
    if (subdiagram.boundaryPath.length == 2) {
        // Highlight left or right side boundary
        var x = (subdiagram.boundaryPath == 'ss' ? 0.125 - 0.5 - delta : data.max_x + 0.5 - 0.125 + delta);
        g.appendChild(SVG_create_path({
            string: SVG_move_to({
                x: x,
                y: 0
            }) + SVG_line_to({
                x: x,
                y: Math.max(1, diagram.nCells.length)
            }),
            stroke_width: 0.25,
            stroke: highlight_colour,
            stroke_opacity: highlight_opacity
        }));
    }
    else if (subdiagram.boundaryPath.length == 1) {
        var y = (subdiagram.boundaryPath == 's' ? 0.125 - delta : Math.max(1, diagram.nCells.length) - 0.125 + delta);
        var x1, x2;
        var edges = data.edges_at_level[subdiagram.boundaryPath == 's' ? 0 : diagram.nCells.length];

        // Get the first and last edge of the inclusion
        //var first_edge = data.edges[data.edges_at_level[0][subdiagram.inclusion[0]]];
        var first_edge_index = subdiagram.inclusion[0];
        var last_edge_index = subdiagram.inclusion[0] + subdiagram.size;
        var x1, x2;
        if (first_edge_index == last_edge_index) {
            if (first_edge_index == 0) {
                x1 = -0.4;
            } else {
                x1 = data.edges[edges[first_edge_index - 1]].x + 0.1;
            }
            if (first_edge_index == edges.length) {
                x2 = data.max_x + 0.4;
            }
            else {
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
        }
        else {
            var x1 = data.edges[edges[first_edge_index]].x - 0.25;
            var x2 = data.edges[edges[last_edge_index - 1]].x + 0.25;
        }
        g.appendChild(SVG_create_path({
            string: SVG_move_to({
                x: x1,
                y: y
            }) + SVG_line_to({
                x: x2,
                y: y
            }),
            stroke_width: 0.25,
            stroke: highlight_colour,
            stroke_opacity: highlight_opacity
        }));
    }
    else if (subdiagram.boundaryPath.length == 0) {
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
        }
        else {
            // Min and max y-values fall on vertices
            min_y = inc_y + 0.5;
            //max_y = inc_y + subdiagram.size.length - 1 + 0.5;
            max_y = min_y + subdiagram.size.length - 2;
        }

        // Find min and max x-values by looking at edges and vertices of diagram
        var inc_x = subdiagram.inclusion[0];
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
            }
            else {
                min_x = data.edges[data.edges_at_level[inc_y][inc_x - 1]].x + 0.5;
            }
            if (inc_x == data.edges_at_level[inc_y].length) {
                // We're at the right-hand edge
                max_x = data.max_x + 0.5;
            } else  {
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
        var path_string = SVG_move_to({x: min_x, y: min_y}) + SVG_line_to({x: min_x, y: max_y})
            + SVG_line_to({x: max_x, y: max_y}) + SVG_line_to({x: max_x, y: min_y});
        g.appendChild(SVG_create_path({string: path_string, fill: highlight_colour, fill_opacity: highlight_opacity}));
    }
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
    return path;
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
                i.path_string += SVG_line_to({
                    x: data.max_x + 0.5,
                    y: Math.max(1, data.vertices.length)
                });
                i.path_string += SVG_line_to({
                    x: data.max_x + 0.5,
                    y: 0
                });
                var source_edges = data.edges_at_level[0];
                if (source_edges.length == 0) {
                    i.path_string += SVG_line_to({
                        x: -0.5,
                        y: 0
                    });
                    i.path_string += SVG_line_to({
                        x: -0.5,
                        y: Math.max(1, data.vertices.length)
                    });
                    var target_edges = data.edges_at_level[data.edges_at_level.length - 1];
                    i.edge = data.edges[target_edges[0]]; // Will necessarily exist
                    i.path_string += SVG_line_to(top_of_edge(data, i.edge));
                    i.draw_up = false;
                    i.turning += 3; // turn right thrice
                    return;
                }
                i.edge = data.edges[source_edges[source_edges.length - 1]];
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
            i.path_string += SVG_line_to({
                x: -0.5,
                y: 0
            });
            i.path_string += SVG_line_to({
                x: -0.5,
                y: Math.max(1, data.vertices.length)
            });
            var target_edges = data.edges_at_level[data.edges_at_level.length - 1];
            if (target_edges.length == 0) {
                // No edges at the top of the diagram, so come around
                i.path_string += SVG_line_to({
                    x: data.max_x + 0.5,
                    y: Math.max(1, data.vertices.length)
                });
                i.path_string += SVG_line_to({
                    x: data.max_x + 0.5,
                    y: 0
                });
                var source_edges = data.edges_at_level[0];
                i.edge = data.edges[source_edges.length - 1]; // Will necessarily exist
                i.path_string += SVG_line_to(bottom_of_edge(data, i.edge));
                i.draw_up = true;
                i.turning += 3;
                return;
            }
            // There are edges at the top of the diagram, so choose the first one
            i.edge = data.edges[target_edges[0]];
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
    if (p.x === undefined) throw 0;
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
        y: edge.start_height
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
        y: edge.finish_height
    };
}

function SVG_draw_edge_bottom_to_top(data, edge) {
    var r = SVG_draw_edge_section(data, edge, edge.start_height, edge.finish_height);
    if (r === undefined) throw 0;
    return r;
}

function SVG_draw_edge_top_to_bottom(data, edge) {
    var r = SVG_draw_edge_section(data, edge, edge.finish_height, edge.start_height);
    if (r === undefined) throw 0;
    return r;
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
    var path = "";
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
    }
    else if (edge_index == edge_list.length) {
        edge = {
            start_height: 0,
            finish_height: Math.max(1, data.vertices.length),
            length: Math.max(1, data.vertices.length),
            x: data.max_x + 0.5,
            start_vertex: null,
            finish_vertex: null
        }
    }
    else {
        edge = data.edges[edge_list[edge_index]];
    }
    return SVG_draw_edge_section(data, edge, h_start, h_end);
}

function SVG_draw_edge_section(data, edge, h_start, h_end) {
    var diagram_height = Math.max(1, data.vertices.length);
    h_start = Math.min(Math.max(h_start, 0), diagram_height);
    h_end = Math.min(Math.max(h_end, 0), diagram_height);
    if (h_start == h_end) return "";
    var path = "";
    if (h_start < h_end) {
        // Draw bottom-to-top
        var bottom_section = (edge.start_vertex == null ? (h_start == 0) && (edge.finish_height > 0.5)  : h_start == edge.start_height);
        var middle_section = ((h_start < edge.finish_height - 0.5) && (h_end > edge.start_height + 0.5));
        var top_section = (edge.finish_vertex == null ? h_end == diagram_height : h_end == edge.finish_height);
        if (bottom_section) {
            // Draw bottom half-height of edge
            if (edge.start_vertex == null) {
                // Incoming from lower boundary
                path += SVG_line_to({
                    x: edge.x,
                    y: h_start + 0.5
                });
            }
            else {
                // Coming up out of a vertex as a target edge
                var vertex = data.vertices[edge.start_vertex];
                path += SVG_bezier_to({
                    c1x: edge.x,
                    c1y: vertex.y,
                    c2x: edge.x,
                    c2y: vertex.y + 0.4,
                    x: edge.x,
                    y: edge.start_height + 0.5
                });
            }
        }
        if (middle_section) {
            // Draw appropriate portion of central piece of line
            var central_finish = Math.min(h_end, edge.finish_height - 0.5);
            path += SVG_line_to({
                x: edge.x,
                y: central_finish
            });
        }
        if (top_section) {
            // Draw top half-height of line
            if (edge.finish_vertex == null) {
                // Edge finishes at the top boundary
                path += SVG_line_to({
                    x: edge.x,
                    y: h_end
                });
            }
            else {
                // Coming up into a vertex as a source edge
                var vertex = data.vertices[edge.finish_vertex];
                path += SVG_bezier_to({
                    c1x: edge.x,
                    c1y: vertex.y - 0.4,
                    c2x: edge.x,
                    c2y: vertex.y,
                    x: vertex.x,
                    y: vertex.y
                });
            }
        }
    }
    else {
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
            }
            else {
                // Coming down out of a vertex as a source edge
                var vertex = data.vertices[edge.finish_vertex];
                path += SVG_bezier_to({
                    c1x: edge.x,
                    c1y: vertex.y,
                    c2x: edge.x,
                    c2y: vertex.y - 0.4,
                    x: edge.x,
                    y: edge.finish_height - 0.5
                });
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
            }
            else {
                // Coming down into a vertex as a target edge
                var vertex = data.vertices[edge.start_vertex];
                path += SVG_bezier_to({
                    c1x: edge.x,
                    c1y: vertex.y + 0.4,
                    c2x: edge.x,
                    c2y: vertex.y,
                    x: vertex.x,
                    y: vertex.y
                });
            }
        }
    }

    return path;
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

    if (diagram.getDimension() != 2) return;

    // Start with the edges that exist at the source boundary
    var current_edges = [];
    for (var level = 0; level < diagram.source.nCells.length; level++) {
        var attachment = diagram.source.nCells[level];
        var new_edge = {
            type: attachment.id,
            attachment_coordinates: level,
            start_height: 0,
            finish_height: null,
            succeeding: [],
            x: 0,
            start_vertex: null,
            finish_vertex: null
        };

        // Every source edge except the last has a succeeding edge
        if (level < diagram.source.nCells.length - 1) {
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

    for (var level = 0; level < diagram.nCells.length; level++) {
        var attachment = diagram.nCells[level];
        var rewrite = gProject.signature.getGenerator(attachment.id);

        // Add to the list of vertices
        var vertex = {
            type: attachment.id,
            level: level,
            y: level + 0.5,
            source_edges: [],
            target_edges: []
        };
        vertices.push(vertex);

        // For each edge consumed by this rewrite, indicate its finish
        // height and remove it from the list of current edges
        for (var i = 0; i < rewrite.source.nCells.length; i++) {
            var remove_edge_index = current_edges[attachment.coordinates[0]];
            vertex.source_edges.push(remove_edge_index);
            if (edges[remove_edge_index] === undefined) {
                var x = 0;
            }
            edges[remove_edge_index].finish_height = level + 0.5;
            edges[remove_edge_index].finish_vertex = vertices.length - 1;
            current_edges.splice(attachment.coordinates[0], 1);
        }

        // Add the first target of the rewrite in the succeedence partial order
        if (rewrite.target.nCells.length > 0) {
            if (attachment.coordinates[0] > 0) {
                edges[current_edges[attachment.coordinates[0] - 1]].succeeding.push({
                    index: edges.length,
                    offset: 1
                });
            }
        }

        // For each edge produced by this rewrite, add it to the lists
        // of edges and current edges, and correctly set succeeding data
        for (i = 0; i < rewrite.target.nCells.length; i++) {
            var new_edge = {
                type: rewrite.target.nCells[i].id,
                attachment_coordinate: attachment.coordinates[0],
                start_height: level + 0.5,
                finish_height: null,
                succeeding: [],
                x: 0,
                start_vertex: vertices.length - 1,
                finish_vertex: null
            };
            edges.push(new_edge);
            var new_edge_index = edges.length - 1;
            current_edges.splice(attachment.coordinates[0] + i, 0, new_edge_index);
            vertex.target_edges.push(new_edge_index);
            if (i != rewrite.target.nCells.length - 1) {
                new_edge.succeeding.push({
                    index: new_edge_index + 1,
                    offset: 1
                });
            }
        }

        // Add succeeding data for the first edge after the rewrite
        if (rewrite.target.nCells.length > 0) {
            if (attachment.coordinates[0] + rewrite.target.nCells.length < current_edges.length) {
                var subsequent_edge_index = current_edges[attachment.coordinates[0] + rewrite.target.nCells.length];
                edges[edges.length - 1].succeeding.push({
                    index: subsequent_edge_index,
                    offset: 1
                });
            }
        }

        // Handle the case of a scalar
        if (vertex.source_edges.length + vertex.target_edges.length > 0) {
            vertex.scalar = false;
        }
        else {
            vertex.scalar = true;
            if (attachment.coordinates[0] == 0) {
                vertex.preceding_edge = null;
            }
            else {
                vertex.preceding_edge = current_edges[attachment.coordinates[0] - 1];
            }
            if (attachment.coordinates[0] == current_edges.length) {
                vertex.succeeding_edge = null;
            }
            else {
                vertex.succeeding_edge = current_edges[attachment.coordinates[0]];
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
            edge.finish_height = Math.max(1, diagram.nCells.length);
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
        var problem = false;
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

        // Even up inputs and outputs for vertices
        for (var i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            if (!vertex.scalar) {
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
                var diff = Math.abs(source_mean - target_mean);
                if (diff > 0.01) {
                    problem = true;
                    var edges_to_offset;
                    if (source_mean > target_mean) {
                        edges_to_offset = vertex.target_edges;
                    }
                    else {
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
        }
        else if (vertex.target_edges.length == 1) {
            vertex.x = edges[vertex.target_edges[0]].x;
        }
        else {
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
