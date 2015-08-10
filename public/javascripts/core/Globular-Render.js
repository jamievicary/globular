"use strict";

/*
    Diagram rendering with Three.js
*/

// Cool implementation idea for the future:
// http://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page

var globular_offscreen = {};
var pixelScale = 1;
//var line_width = 0.01;
//var sphere_radius = 0.05;
var item_size = 0.05;
var Pi = 3.141592654;

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
        .css('visibility', 'hidden').
        attr('id', 'globular-offscreen');
}

// Render a diagram on the offscreen canvas, then copy to the specified container
function globular_render(container, diagram, subdiagram) {

    if (diagram.getDimension() > 2) return;

    // Make contact with offscreen renderer
    //var offscreen_canvas = globular_offscreen.renderer.domElement;
    var g = globular_offscreen;
    
    /*
    g.camera = new THREE.OrthographicCamera(-10, 10, -10, 10, -10, 10);
    g.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById('globular-offscreen')
    });
    */

    container = $(container);

    // Prepare scene, and store interactive rectangles
    var scene = new THREE.Scene();
    var complex = new Complex(diagram);
    scene.meshes = [];
    scene.geometries = [];
    scene.materials = [];
    container[0].rectangles = complex.rectangles;
    globular_draw_complex(complex, scene, subdiagram);

    // Get dimensions
    var container_width = container.width();
    var container_height = container.height();
    if (container_width == 0) return;
    if (container_height == 0) return;
    g.renderer.enableScissorTest(false);
    g.renderer.setPixelRatio(window.devicePixelRatio);
    $('#globular-offscreen')
        .css('width', container_width)
        .css('height', container_height);
    g.renderer.setSize(container_width, container_height);
    g.renderer.setClearColor(0xdddddd, 1);
    g.renderer.clear();

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
    diagram.width = complex.max_x - complex.min_x;
    diagram.height = complex.max_y - complex.min_y;
    if (diagram.width / diagram.height > container_width / container_height) {
        // Diagram is wide with respect to the container
        viewport.min_x = complex.min_x;
        viewport.max_x = complex.max_x;
        var mean_y = (complex.min_y + complex.max_y) / 2;
        var viewport_height = container_height * diagram.width / container_width;
        viewport.min_y = mean_y - (viewport_height / 2);
        viewport.max_y = mean_y + (viewport_height / 2);
        g.renderer.setScissor(
            0,
            (container_height - (diagram.height * container_width / diagram.width))/2,
            container_width,
            diagram.height * container_width / diagram.width);
    }
    else {
        viewport.min_y = complex.min_y;
        viewport.max_y = complex.max_y;
        var mean_x = (complex.min_x + complex.max_x) / 2;
        var viewport_width = container_width * diagram.height / container_height;
        viewport.min_x = mean_x - (viewport_width / 2);
        viewport.max_x = mean_x + (viewport_width / 2);
        g.renderer.setScissor(
            (container_width - (diagram.width * container_height / diagram.height))/2,
            0,
            diagram.width * container_height / diagram.height,
            container_height
        );
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
    //g.renderer.setScissor ( complex.min_x, complex.min_y, complex.max_x - complex.min_x, complex.max_y - complex.min_y );
    //g.renderer.setScissor ( 0, 0, 100, 100 );
    g.renderer.enableScissorTest(true);

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
    context.drawImage(document.getElementById('globular-offscreen'), 0, 0, container_width * pixelScale, container_height * pixelScale, 0, 0, container_width, container_height);
    
    // Deallocate everything
    for (var i=0; i<scene.geometries.length; i++) {
        scene.geometries[i].dispose();
    }
    for (var i=0; i<scene.materials.length; i++) {
        scene.materials[i].dispose();
    }
    for (var i=0; i<scene.meshes.length; i++) {
        scene.remove(scene.meshes[i]);
    }
    scene.meshes = null;
    scene.geometries = null;
    scene.materials = null;
    scene = null;

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

function globular_get_colour(type, colours) {
    if (type in colours) return colours[type];
    colours[type] = new THREE.Color(gProject.getColour(type));
    return colours[type];
}

function globular_draw_complex(complex, scene, subdiagram) {

    var colours = {};
    // Prepare geometry, material
    var geometry = new THREE.Geometry();
    var material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    });
    scene.geometries.push(geometry);
    scene.materials.push(material);

    var black = new THREE.Color("#000");
    var yellow = new THREE.Color("#FF0");

    for (var i = 0; i < complex.points.length; i++) {

        // Determine whether to highlight        
        var point = complex.points[i];
        var highlight = in_subdiagram(point.logical, complex.size, subdiagram);

        // Draw a point
        //var point_geometry = new THREE.SphereGeometry(sphere_radius, 12, 12);
        var point_geometry = new THREE.CircleGeometry( item_size, 32 );
        scene.geometries.push(point_geometry);
        var sphere_material = new THREE.MeshBasicMaterial({
            color: (highlight ? yellow : gProject.getColour(point.type))
        });
        scene.materials.push(sphere_material);
        var sphere_mesh = new THREE.Mesh(point_geometry, sphere_material);
        scene.meshes.push(sphere_mesh);
        sphere_mesh.position.set(point.point[0], point.point[1], 2);
        scene.add(sphere_mesh);
    }

    // Draw line segments, with hemispheres for a nicer visual effect
    for (var i = 0; i < complex.lines.length; i++) {
        // Draw a line
        var line = complex.lines[i];
        var highlight = in_subdiagram(line.logical, complex.size, subdiagram);
        var colour = (highlight ? yellow : globular_get_colour(line.type, colours));
        // Draw highlighted lines below non-highlighted lines
        var z = (highlight ? 0.5 : 0.6);
        globular_line(geometry, line.points[0], line.points[1], z, colour);
        globular_pacman(scene, Pi, Pi, line.points[0], z, colour);
        globular_pacman(scene, 0, Pi, line.points[1], z, colour);
    }


    for (var i = 0; i < complex.triangles.length; i++) {
        // Draw a triangle
        var triangle = complex.triangles[i];
        var highlight = in_subdiagram(triangle.logical, complex.size, subdiagram);
        var colour = (highlight ? yellow : globular_get_colour(triangle.type, colours));
        globular_triangle(geometry, triangle.points[0], triangle.points[1], triangle.points[2], 0,
            colour
            //getRandomColour()
        );
    }

    // Render 0-cells
    var mesh = new THREE.Mesh(geometry, material);
    scene.meshes.push(mesh);
    scene.add(mesh);
}

function globular_pacman(scene, theta_start, theta_length, point, z, colour) {
    var point_geometry = new THREE.CircleGeometry(item_size, 32, theta_start, theta_length);
    var sphere_material = new THREE.MeshBasicMaterial({
        color: colour
    });
    var sphere_mesh = new THREE.Mesh(point_geometry, sphere_material);
    sphere_mesh.position.set(point[0], point[1], z);
    scene.add(sphere_mesh);
    scene.geometries.push(point_geometry);
    scene.materials.push(sphere_material);
    scene.meshes.push(sphere_mesh);
}

function in_subdiagram(logical, size, subdiagram) {
    if (subdiagram === undefined) return false;
    if (logical.length == 0) return true;
    if (logical.length == 1) return in_subdiagram_1(logical, size, subdiagram);
    if (logical.length == 2) return in_subdiagram_2(logical, size, subdiagram);
    return false;
}

function in_subdiagram_1(logical, size, subdiagram) {
    if (subdiagram.boundaryPath == 's') {
        return logical[0] < 0.5;
    }
    else if (subdiagram.boundaryPath == 't') {
        return logical[0] > size - 0.5;
    }
    else if (subdiagram.boundaryPath.length == 0) {
        if (logical[0] < subdiagram.inclusion) return false;
        if (logical[0] > subdiagram.inclusion + subdiagram.size) return false;
        return true;
    }
    else {
        alert("Bad data passed to in_subdiagram_1");
        return false;
    }
}

function in_subdiagram_2(logical, size, subdiagram) {
    if (subdiagram.boundaryPath == 'ss') {
        return logical[1] <= 0.25;
    }
    else if (subdiagram.boundaryPath == 'tt') {
        return logical[1] >= size[Math.trunc(logical[0] + 0.5)] - 0.25;
    }
    else if (subdiagram.boundaryPath == 's') {
        if (logical[0] > 0.25) return false;
        if (logical[1] <= subdiagram.inclusion[0] - 0.5) return false;
        if (logical[1] >= subdiagram.inclusion[0] + subdiagram.size + 0.5) return false;
        return true;
    }
    else if (subdiagram.boundaryPath == 't') {
        if (logical[0] < size.length - 1.25) return false;
        if (logical[1] <= subdiagram.inclusion[0] - 0.5) return false;
        if (logical[1] >= subdiagram.inclusion[0] + subdiagram.size + 0.5) return false;
        return true;
    }
    else if (subdiagram.boundaryPath.length == 0) {
        if (logical[0] + 0.5 <= subdiagram.inclusion[1]) return false;
        if (logical[0] - 0.5 >= subdiagram.inclusion[1] + subdiagram.size.length - 1) return false;
        if (logical[1] <= subdiagram.inclusion[0] - 0.5) return false;
        var lhs = logical[1];
        var rhs
        if (logical[1] >= subdiagram.inclusion[0] + subdiagram.size[Math.trunc(logical[0] - subdiagram.inclusion[1] + 0.5)] + 0.5) return false;
        return true;
    }
    else {
        alert("Bad data passed to in_subdiagram_2");
    }
}



function reduce_size(size) {
    if (!isNaN(size)) {
        return null;
    }
    else return size.slice(0, size.length - 1);
}

function globular_triangle(geometry, p1, p2, p3, z, color) {
    globular_triangle_v(geometry,
        new THREE.Vector3(p1[0], p1[1], z),
        new THREE.Vector3(p2[0], p2[1], z),
        new THREE.Vector3(p3[0], p3[1], z),
        z,
        color
    );
}

function globular_triangle_v(geometry, v1, v2, v3, z, color) {
    var n = geometry.vertices.length;
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    geometry.vertices.push(v3);
    geometry.faces.push(new THREE.Face3(n, n + 1, n + 2, null, color));
}

function globular_line(geometry, p_array, q_array, z, color) {
    var p = new THREE.Vector3(p_array[0], p_array[1], z);
    var q = new THREE.Vector3(q_array[0], q_array[1], z);
    var pq = (new THREE.Vector3()).copy(q).sub(p);
    var zunit = new THREE.Vector3(0, 0, 1);
    var perp = (new THREE.Vector3()).copy(pq).cross(zunit).setLength(item_size);
    var a = new THREE.Vector3();
    var b = new THREE.Vector3();
    var c = new THREE.Vector3();
    var d = new THREE.Vector3();
    a.copy(p).add(perp);
    b.copy(p).sub(perp);
    c.copy(q).add(perp);
    d.copy(q).sub(perp);
    globular_triangle_v(geometry, a, b, c, z, color);
    globular_triangle_v(geometry, b, c, d, z, color);
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

function getRandomColour() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return new THREE.Color(color);
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

// TubeGeometry based on Polyline

THREE.PiecewiseLinearCurve3 = THREE.Curve.create(

	function ( points /* array of Vector3 */ ) {

		this.points = (points == undefined) ? [] : points;

	},

	function ( t ) {

		var points = this.points;

		var d = ( points.length - 1 ) * t; // t should be clamped between 0 and 1

		var index1 = Math.floor( d );
		var index2 = ( index1 < points.length - 1 ) ? index1 + 1 : index1;

		var	pt1 = points[ index1 ];
		var	pt2 = points[ index2 ];

		var weight = d - index1;

		return new THREE.Vector3().copy( pt1 ).lerp( pt2, weight );

	}

);

function init() {

	// points
	var points = [];
	for( var i = 0; i < 38; i++ ) {
		points.push( new THREE.Vector3( Math.cos( i * Math.PI / 3 ), i / 18 - 1, Math.sin( i * Math.PI / 3 ) ).multiplyScalar( 48 ) );
	}

	// path
	var path = new THREE.PiecewiseLinearCurve3( points );

	// params
	var pathSegments = 1024; // must be a fairly big number to pass near corners
	var tubeRadius = 1;
	var radiusSegments = 8;
	var closed = false;

	// geometry
	geometry = new THREE.TubeGeometry( path, pathSegments, tubeRadius, radiusSegments, closed );
	
	// mesh
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

}
