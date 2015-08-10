"use strict";

/*
    Diagram rendering with Three.js
*/

// Cool implementation idea for the future:
// http://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page

var globular_offscreen = {};
var pixelScale = 1;

// Create offscreen WebGL canvas
function globular_prepare_renderer() {
    // Prepare WebGL stuff
    globular_offscreen.camera = new THREE.OrthographicCamera(-10, 10, -10, 10, -10, 10);
    globular_offscreen.renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    document.body.appendChild(globular_offscreen.renderer.domElement);
    $(globular_offscreen.renderer.domElement)
        .css('position', 'absolute')
        .css('left', 0)
        .css('bottom', 0)
        .css('visibility', 'hidden');

}

// Render a diagram on the offscreen canvas, then copy to the specified container
function globular_render(container, diagram, colors, subdiagram) {

    // Make contact with offscreen renderer
    var offscreen_canvas = globular_offscreen.renderer.domElement;
    var g = globular_offscreen;
    container = $(container);

    // Prepare scene, and store interactive rectangles
    var scene = new THREE.Scene();
    container[0].rectangles = globular_prepare_2d_scene(diagram, scene, colors, subdiagram);

    // Get dimensions
    var container_width = container.width();
    var container_height = container.height();
    if (container_width == 0) return;
    if (container_height == 0) return;
    g.renderer.setPixelRatio(window.devicePixelRatio);
    $(offscreen_canvas)
        .css('width', container_width)
        .css('height', container_height);
    g.renderer.setSize(container_width, container_height);
    g.renderer.setClearColor(0xdddddd, 1);

    // Prepare target canvas
    var target_canvas = container.find('canvas');
    if (target_canvas.length == 0) {
        target_canvas = document.createElement('canvas');
        container.append(target_canvas);
    }
    else {
        target_canvas = target_canvas[0];
    }
    $(target_canvas)
        .attr('width', container_width)
        .attr('height', container_height);
    var context = target_canvas.getContext('2d');

    // Calculate viewport
    var viewport = {};
    diagram.width = diagram.bounds.max_x - diagram.bounds.min_x;
    diagram.height = diagram.bounds.max_y - diagram.bounds.min_y;
    if (diagram.width / diagram.height > container_width / container_height) {
        // Diagram is wide with respect to the container
        viewport.min_x = diagram.bounds.min_x;
        viewport.max_x = diagram.bounds.max_x;
        var mean_y = (diagram.bounds.min_y + diagram.bounds.max_y) / 2;
        var viewport_height = container_height * diagram.width / container_width;
        viewport.min_y = mean_y - (viewport_height / 2);
        viewport.max_y = mean_y + (viewport_height / 2);
    }
    else {
        viewport.min_y = diagram.bounds.min_y;
        viewport.max_y = diagram.bounds.max_y;
        var mean_x = (diagram.bounds.min_x + diagram.bounds.max_x) / 2;
        var viewport_width = container_width * diagram.height / container_height;
        viewport.min_x = mean_x - (viewport_width / 2);
        viewport.max_x = mean_x + (viewport_width / 2);
    }
    g.camera.left = viewport.min_x;
    g.camera.right = viewport.max_x;
    g.camera.top = viewport.max_y;
    g.camera.bottom = viewport.min_y;
    g.camera.position.x = 0;
    g.camera.position.y = 0;
    //    g.camera.position.z = g.diagram_max_z;
    g.camera.position.z = 10;
    g.camera.updateProjectionMatrix();

    // Store bounds in the container so we can interpret mouse clicks on the canvas
    container[0].bounds = {
        left: g.camera.left,
        right: g.camera.right,
        top: g.camera.top,
        bottom: g.camera.bottom
    };

    // Controls ... forget about controls for now
    /*
    g.controls = new THREE.OrbitControls(g.camera);
    g.controls.addEventListener('change', g.render);
    */

    // Render scene on offscreen canvas
    g.renderer.render(scene, g.camera);

    // Pixel ratio calculations
    var backingStoreRatio =
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;
    var devicePixelRatio = window.devicePixelRatio || 1;
    pixelScale = devicePixelRatio / backingStoreRatio;

    // Copy image
    context.drawImage(offscreen_canvas, 0, 0, container_width * pixelScale, container_height * pixelScale, 0, 0, container_width, container_height);
}

function globular_get_dimension(diagram) {
    var cells = diagram[0];
    for (var name in cells) {
        if (!(cells.hasOwnProperty(name))) continue;
        if (cells[name][0].length == 2) {
            return 2;
        }
        else {
            return 3;
        }
    }
}

function globular_prepare_2d_scene(layout, scene, colors, subdiagram) { // colors is a hashtable that associates cell names with colors set by the user

    if (layout.regions === undefined) layout.regions = new Hashtable();
    /*
        var g = container.globular;
        g.dimension = globular_get_dimension(diagram);
    */

    // Prepare geometry, material
    var geometry = new THREE.Geometry();
    var material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    });

    // Prepare colors
    //    var tred = new THREE.Color('#ff0000');
    colors.each(function(key, value) {
        //three_colors[key] = new THREE.Color(value);
        //three_colors[key] = tred;
        colors[key] = new THREE.Color(value);
        //colors[key] = tred;
    });

    // Render 0-cells
    /*
    for (var name in layout.regions) {
        if (!(layout.vertices.hasOwnProperty(name))) continue;
    */
    layout.regions.each(function(name, coord_list) {
        for (var i = 0; i < coord_list.length; i++) {
            var coord = coord_list[i];
            var x1 = coord[0];
            var y1 = coord[1];
            var x2 = coord[0] + 1;
            var y2 = coord[1] + 1;
            globular_square_fill(geometry, x1, y1, x2, y2, 0, colors[name]);
            //globular_text(name, scene, coord[0] + 0.4, coord[1] + 0.4, 1);
        }
    });

    // 1-cells
    for (var name in layout.edges) {
        if (!(layout.edges.hasOwnProperty(name))) continue;
        var onecell = layout.edges[name];
        var x = onecell[0];
        var y1 = onecell[1];
        var y2 = onecell[2];

        globular_vertical_line(geometry, x, y1, y2, 2, line_thickness, 0, colors[name]);

        //var textGeom = new THREE.TextGeometry(name, text_data);
        //var textMesh = new THREE.Mesh(textGeom, text_material);
        //textMesh.position.set(x + 0, ((y1+y2)/2) - 0.1, 1);
        //scene.add(textMesh);
    }
    
    // 2-cells
    var rectangles = [];
    for (var name in layout.vertices) {
        if (!(layout.vertices.hasOwnProperty(name))) continue;

        var twocell = layout.vertices[name];
        var x1 = twocell[0];
        var x2 = twocell[1];
        var y = twocell[2];

        globular_horizontal_line(geometry, x1, x2, y, 2, morphism_padding, morphism_padding / 2, colors[name]);
        //globular_square_outline(geometry, x1 - morphism_padding / 2, y - morphism_padding / 2, x2 + morphism_padding / 2, y + morphism_padding / 2, 3, line_thickness, black);

        //twocell_geometry.vertices.push(new THREE.Vector3(x1-0.2, y, 2));
        //twocell_geometry.vertices.push(new THREE.Vector3(x2+0.2, y, 2));

        rectangles.push({
            id: name,
            x_min: x1 - (morphism_padding / 2),
            x_max: x2 + (morphism_padding / 2),
            y_min: y - (morphism_padding / 2),
            y_max: y + (morphism_padding / 2)
        });
    }

    // Highlight source and target boundaries
    var highlight = new THREE.Color('#ffff00'); // bright yellow
    if (subdiagram != undefined) {
        var x1;
        var x2;
        var y1;
        var y2;
        var delta;
        if (subdiagram.boundaryPath.length == 2) {
            // Must be doing 1-attachment to a 2-diagram
            if (subdiagram.boundaryPath[subdiagram.boundaryPath.length-1] == "s") {
                x1 = layout.bounds.min_x;
                x2 = x1 + 0.5;
            }
            else {
                x1 = layout.bounds.max_x;
                x2 = x1 - 0.5;
            }
            y1 = layout.bounds.min_y;
            y2 = layout.bounds.max_y;
            if (x1 == x2) {
                x1 -= 0.25;
                x2 += 0.25;
            }
            if (y1 == y2) {
                y1 -= 0.25;
                y2 += 0.25;
            }
        }
        else if (subdiagram.boundaryPath.length == 1) {
            if (subdiagram.bounds.length == 0) {
                // It's a 1-diagram
                x1 = -0.5;
                x2 = 0.5;
            }
            else {
                // It's a 2-diagram
                var preceding = subdiagram.bounds[0].preceding;
                if (preceding == null) {
                    x1 = 0.5;
                } else {
                    x1 = layout.edges[preceding][0] + 0.5;
                }
                var succeeding = subdiagram.bounds[0].succeeding;
                if (succeeding == null) {
                    x2 = layout.bounds.max_x - 0.5;
                } else {
                    x2 = layout.edges[succeeding][0] - 0.5;
                }
            }
            
            if (subdiagram.boundaryPath == "s") {
                y1 = 0;
                y2 = y1 + 0.25;
            } else {
                y1 = layout.bounds.max_y;
                y2 = y1 - 0.25;
            }
            if (x1 == x2) {
                x1 -= 0.25;
                x2 += 0.25;
            }
            if (y1 == y2) {
                y1 -= 0.25;
                y2 += 0.25;
            }
        }
        else if ((subdiagram.boundaryPath.length == 0) && (subdiagram.bounds.length == 2)) {
            // We're rewriting a 2-diagram
            
            var preceding = subdiagram.bubble_bounds[0].preceding;
            if (preceding == null) {
                x1 = layout.bounds.min_x + 0.5;
            } else {
                x1 = layout.edges[preceding][0] + 0.5;
            }
            var succeeding = subdiagram.bubble_bounds[0].succeeding;
            if (succeeding == null) {
                x2 = layout.bounds.max_x - 0.5;
            } else {
                x2 = layout.edges[succeeding][0] - 0.5;
            }

            preceding = subdiagram.bubble_bounds[1].preceding;
            if (preceding == null) {
                y1 = layout.bounds.min_y + 0.5;
            } else {
                y1 = layout.vertices[preceding][2] + 0.5;
            }
            var succeeding = subdiagram.bubble_bounds[1].succeeding;
            if (succeeding == null) {
                y2 = layout.bounds.max_y - 0.5;
            } else {
                y2 = layout.vertices[succeeding][2] - 0.5;
            }
            
            if (x1 == x2) {
                x1 -= 0.25;
                x2 += 0.25;
            }
            if (y1 == y2) {
                y1 -= 0.25;
                y2 += 0.25;
            }
        } else {
            
            // No highlighting
            x1 = 0;
            x2 = 0;
            y1 = 0;
            y2 = 0;
            
        }
    
        globular_square_fill(geometry, x1, y1, x2, y2, 3, highlight);
    }

    scene.add(new THREE.Mesh(geometry, material));

    return rectangles;
}

function globular_prepare_3d(container, diagram) {

    var g = container.globular;

    var opaque_material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide,
        transparent: false
    });

    var transparent_material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
    });

    var opaque_geometry = new THREE.Geometry();
    var transparent_geometry = new THREE.Geometry();

    // Render 1-cells
    var onecells = diagram[0];
    var colors = {};
    g.diagram_min_x = Number.MAX_VALUE;
    g.diagram_min_y = Number.MAX_VALUE;
    g.diagram_min_z = Number.MAX_VALUE;
    g.diagram_max_x = -Number.MAX_VALUE;
    g.diagram_max_y = -Number.MAX_VALUE;
    g.diagram_max_z = -Number.MAX_VALUE;
    for (var name in onecells) {
        if (!(onecells.hasOwnProperty(name))) continue;
        colors[name] = new THREE.Color(getRandomColor());
        var coord_list = onecells[name];
        for (var i = 0; i < coord_list.length; i++) {
            var coord = coord_list[i];
            var x = coord[0];
            var y = coord[1];
            var z = coord[2];
            globular_square_fill(transparent_geometry, x, y, x + 1, y + 1, z, colors[name]);
            //globular_text(name, scene, coord[0] + 0.4, coord[1] + 0.4, 1);

            g.diagram_min_x = Math.min(g.diagram_min_x, x);
            g.diagram_min_y = Math.min(g.diagram_min_y, y);
            g.diagram_min_z = Math.min(g.diagram_min_z, z);
            g.diagram_max_x = Math.max(g.diagram_max_x, x + 1);
            g.diagram_max_y = Math.max(g.diagram_max_y, y + 1);
            g.diagram_max_z = Math.max(g.diagram_max_z, z + 1);
        }
    }
    g.diagram_width = g.diagram_max_x - g.diagram_min_x;
    g.diagram_height = g.diagram_max_y - g.diagram_min_y;
    g.diagram_depth = g.diagram_max_z - g.diagram_min_z;

    // Render 2-cells
    var black = new THREE.Color(0x000000);
    var white = new THREE.Color(0xffffff);
    var twocells = diagram[1];
    for (var name in twocells) {
        if (!(twocells.hasOwnProperty(name))) continue;
        var twocell = twocells[name];
        var x = twocell[0];
        var y1 = twocell[1];
        var y2 = twocell[2];
        var z1 = twocell[3];
        var z2 = twocell[4];

        //        var color = black;
        var d = 0.02;
        globular_cuboid(opaque_geometry, x - d, y1, z1 - d, x + d, y2, z2 + d, black);


    }

    // 3-cells
    var threecells = diagram[2];
    for (var name in threecells) {
        if (!(threecells.hasOwnProperty(name))) continue;

        var threecell = threecells[name];
        var x1 = threecell[0];
        var x2 = threecell[1];
        var y = threecell[2];
        var z1 = threecell[3];
        var z2 = threecell[4];

        var color = new THREE.Color(getRandomColor());
        var d = 0.2;

        var v1 = new THREE.Vector3(x1 - d, y - d, z1 - d);
        var v2 = new THREE.Vector3(x1 - d, y + d, z1 - d);
        var v3 = new THREE.Vector3(x2 + d, y - d, z1 - d);
        var v4 = new THREE.Vector3(x1 - d, y - d, z2 + d);


        //globular_draw_cuboid(opaque_geometry, v1, v2, v3, v4, color);

        globular_cuboid(opaque_geometry, x1 - d, y - d, z1 - d, x2 + d, y + d, z2 + d, color);
        globular_cuboid_wireframe(opaque_geometry, x1 - d, y - d, z1 - d, x2 + d, y + d, z2 + d, black, 0.01);
    }

    g.scene.add(new THREE.Mesh(opaque_geometry, opaque_material));
    g.scene.add(new THREE.Mesh(transparent_geometry, transparent_material));

}

function globular_cuboid_wireframe(geometry, x1, y1, z1, x2, y2, z2, color, d) {
    globular_cuboid(geometry, x1 - d, y1 - d, z1 - d, x2 + d, y1 + d, z1 + d, color);
    globular_cuboid(geometry, x1 - d, y1 - d, z2 - d, x2 + d, y1 + d, z2 + d, color);
    globular_cuboid(geometry, x1 - d, y2 - d, z1 - d, x2 + d, y2 + d, z1 + d, color);
    globular_cuboid(geometry, x1 - d, y2 - d, z2 - d, x2 + d, y2 + d, z2 + d, color);
    globular_cuboid(geometry, x1 - d, y1 - d, z1 - d, x1 + d, y2 + d, z1 + d, color);
    globular_cuboid(geometry, x2 - d, y1 - d, z1 - d, x2 + d, y2 + d, z1 + d, color);
    globular_cuboid(geometry, x1 - d, y1 - d, z2 - d, x1 + d, y2 + d, z2 + d, color);
    globular_cuboid(geometry, x2 - d, y1 - d, z2 - d, x2 + d, y2 + d, z2 + d, color);
    globular_cuboid(geometry, x1 - d, y1 - d, z1 - d, x1 + d, y1 + d, z2 + d, color);
    globular_cuboid(geometry, x2 - d, y1 - d, z1 - d, x2 + d, y1 + d, z2 + d, color);
    globular_cuboid(geometry, x1 - d, y2 - d, z1 - d, x1 + d, y2 + d, z2 + d, color);
    globular_cuboid(geometry, x2 - d, y2 - d, z1 - d, x2 + d, y2 + d, z2 + d, color);
}

function globular_cuboid(geometry, x1, y1, z1, x2, y2, z2, color) {
    var v111 = new THREE.Vector3(x1, y1, z1);
    var v112 = new THREE.Vector3(x1, y1, z2);
    var v121 = new THREE.Vector3(x1, y2, z1);
    var v122 = new THREE.Vector3(x1, y2, z2);
    var v211 = new THREE.Vector3(x2, y1, z1);
    var v212 = new THREE.Vector3(x2, y1, z2);
    var v221 = new THREE.Vector3(x2, y2, z1);
    var v222 = new THREE.Vector3(x2, y2, z2);
    globular_planar_quad_v(geometry, v111, v121, v221, color);
    globular_planar_quad_v(geometry, v111, v121, v122, color);
    globular_planar_quad_v(geometry, v112, v122, v222, color);
    globular_planar_quad_v(geometry, v211, v221, v222, color);
    globular_planar_quad_v(geometry, v111, v211, v212, color);
    globular_planar_quad_v(geometry, v121, v221, v222, color);
}

// Write text to scene
function globular_text(text, scene, x, y, z) {
    var geometry = new THREE.TextGeometry(text, text_data);
    var mesh = new THREE.Mesh(geometry, text_material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
}

// Draw a rectangle in arbitrary orientation, given three vertices in cyclic order
function globular_planar_quad_v(geometry, v1, v2, v3, color) {
    var v4 = new THREE.Vector3();
    v4.subVectors(v3, v2);
    v4.add(v1);

    var n = geometry.vertices.length;
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    geometry.vertices.push(v3);
    geometry.vertices.push(v4);
    geometry.faces.push(new THREE.Face3(n, n + 1, n + 2, null, color));
    geometry.faces.push(new THREE.Face3(n, n + 2, n + 3, null, color));

}

// Draw a rectangle in arbitrary orientation, given three vertices in cyclic order
function globular_planar_quad(geometry, x1, y1, z1, x2, y2, z2, x3, y3, z3, color) {
    var v1 = new THREE.Vector3(x1, y1, z1);
    var v2 = new THREE.Vector3(x2, y2, z2);
    var v3 = new THREE.Vector3(x3, y3, z3);
    globular_planar_quad_v(geometry, v1, v2, v3, color);
}

// Add square to geometry
function globular_square_fill(geometry, x1, y1, x2, y2, z, color) {
    var n = geometry.vertices.length;
    geometry.vertices.push(new THREE.Vector3(x1, y1, z));
    geometry.vertices.push(new THREE.Vector3(x2, y1, z));
    geometry.vertices.push(new THREE.Vector3(x1, y2, z));
    geometry.vertices.push(new THREE.Vector3(x2, y2, z));
    geometry.faces.push(new THREE.Face3(n, n + 1, n + 2, null, color));
    geometry.faces.push(new THREE.Face3(n + 1, n + 2, n + 3, null, color));
}

function globular_square_outline(geometry, x1, y1, x2, y2, z, thickness, color) {
    var h = thickness / 2;
    globular_horizontal_line(geometry, x1 - h, x2 + h, y1, z, thickness, 0, color);
    globular_horizontal_line(geometry, x1 - h, x2 + h, y2, z, thickness, 0, color);
    globular_vertical_line(geometry, x1, y1, y2, z, thickness, 0, color);
    globular_vertical_line(geometry, x2, y1, y2, z, thickness, 0, color);
}

function globular_horizontal_line(geometry, x1, x2, y, z, thickness, extension, color) {
    var h = thickness / 2;
    globular_square_fill(geometry, x1 - extension, y - h, x2 + extension, y + h, z, color);
}

function globular_vertical_line(geometry, x, y1, y2, z, thickness, extension, color) {
    var h = thickness / 2;
    globular_square_fill(geometry, x - h, y1 - extension, x + h, y2 + extension, z, color);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Geometry parameters
var line_thickness = 0.05;
var morphism_padding = 0.5;

// Text details
//var text_material = new THREE.MeshPhongMaterial({color: 0xff0000});
var text_data = {
    size: 0.2, // size of the text
    height: 0, // thickness to extrude text
    //curveSegments: <int>,	// number of points on the curves
    //font: 'helvetiker',	// font name
    //weight: 'normal',		// font weight (normal, bold)
    //style: 'normal',		// font style  (normal, italics)
    bevelEnabled: false, // turn on bevel, boolean
    bevelThickness: 0.1, // how deep into text bevel goes
    bevelSize: 0.0, // how far from text outline is bevel
};

function globular_three_init() {

    // 2D
    var json = '[{"A":[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]},{"1-gamma":[1,0,1],"1-alfa":[1,1,2],"1-beta":[2,1,2]},{"2-theta":[1,2,1]}]';
    //var json = '[{"A":[[0,0],[0,1],[0,2]],"B":[[1,0],[2,0],[2,1]],"E":[[3,0],[3,1],[2,2],[3,2]],"C":[[1,1],[1,2]]},{"alfa":[1,0,1],"beta":[1,1,3],"eta":[2,1,2],"kappa":[3,0,2],"epsilon":[2,2,3]},{"omega":[1,2,1],"iota":[2,3,2]}]';
    //var json = '[{"D":[[0,0],[0,1],[0,2]],"A":[[1,0],[1,1],[1,2]],"B":[[2,0],[3,0],[3,1]],"E":[[4,0],[4,1],[3,2],[4,2]],"J":[[5,0],[5,1],[5,2]],"C":[[2,1],[2,2]]},{"alfa":[2,0,1],"beta":[2,1,3],"eta":[3,1,2],"kappa":[4,0,2],"epsilon":[3,2,3],"mu":[1,0,3],"lambda":[5,0,3]},{"omega":[2,3,1],"iota":[3,4,2]}]';

    // 3D
    //var json = '[{"1-alfa":[[0,0,0],[0,1,0],[0,2,0]],"1-beta":[[1,0,0],[2,0,0],[1,1,0],[2,1,0],[1,2,0],[2,2,0]],"1-kappa":[[0,0,1],[1,0,1],[0,1,1],[1,1,1],[0,2,1],[1,2,1]],"1-epsilon":[[2,0,1],[2,1,1],[2,2,1]]},{"2-omega":[1,0,1,0,0],"2-theta":[1,1,3,0,0],"2-lambda":[2,0,2,1,1],"2-ro":[2,2,3,1,1]},{"3-iota":[1,1,1,0,0],"3-omikron":[2,2,2,1,1]}]';
    var diagram = JSON.parse(json);

    // Attach the diagram to the element
    var element = $('#mydiv')[0];
    //$(element).attr('height', 100).attr('width', 100);
    $(element).css('height', 100).css('width', 100);
    globular_render(element, diagram);

    //    render();

}

// Geometry parameters
var line_thickness = 0.05;
var morphism_padding = 0.5;

// Text details
//var text_material = new THREE.MeshPhongMaterial({color: 0xff0000});
var text_data = {
    size: 0.2, // size of the text
    height: 0, // thickness to extrude text
    //curveSegments: <int>,	// number of points on the curves
    //font: 'helvetiker',	// font name
    //weight: 'normal',		// font weight (normal, bold)
    //style: 'normal',		// font style  (normal, italics)
    bevelEnabled: false, // turn on bevel, boolean
    bevelThickness: 0.1, // how deep into text bevel goes
    bevelSize: 0.0, // how far from text outline is bevel
};
