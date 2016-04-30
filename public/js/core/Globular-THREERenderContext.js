"use strict";

// WebGL render context. Note: only one thing should be rendered at a time, since render contexts
// share a global offscreen renderer.

// Create offscreen WebGL canvas
function globular_prepare_renderer_THREE() {
    // Prepare WebGL stuff
    globular_offscreen.camera = new THREE.OrthographicCamera(-1, 1, -1, 1, -1, 1);
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

function THREERenderContext() {
    this.container = null;

    return this;
}

THREERenderContext.prototype.init = function(container, min_x, max_x, min_y, max_y) {
    this.container = $(container);
    this.scene = new THREE.Scene();
    this.renderer = globular_offscreen.renderer;
    this.camera = globular_offscreen.camera;
    this.path = null;
    this.shape = null;
    this.point = null;

	// set camera to as small as possible, while keeping the correct aspect ratio
	var w = max_x - min_x;
	var h = max_y - min_y;
    var aspect = this.container.width()/this.container.height();
    if (aspect * h > w) {
    	min_x = (min_x/w)*(h*aspect);
    	max_x = (max_x/w)*(h*aspect);
    } else {
    	min_y = (min_y/h)*(w/aspect);
    	max_y = (max_y/h)*(w/aspect);
    }
    this.camera.left = min_x;
    this.camera.right = max_x;
    this.camera.bottom = min_y;
    this.camera.top = max_y;

	

    this.camera.updateProjectionMatrix();

    // still need to clear?

	var renderer = globular_offscreen.renderer;
	renderer.setClearColor(0xdddddd, 1);
	renderer.setSize( this.container.width(), this.container.height() );

}

THREERenderContext.prototype.render = function() {
    // display rendered diagram

    var scene = new THREE.Scene();
	var camera = globular_offscreen.camera;
	var container = this.container;

	//var container = $('#view');

	this.renderer.render(this.scene, this.camera);

	var target_canvas = this.container.find('canvas');
	if (target_canvas.length == 0) {
	  target_canvas = document.createElement('canvas');
	  this.container.append(target_canvas);
	}
	else {
	  target_canvas = target_canvas[0];
	}
	$(target_canvas)
	.attr('width', this.container.width())
	.attr('height', this.container.height());


	var context = target_canvas.getContext('2d');
	context.drawImage(document.getElementById('globular-offscreen'),
	0, 0, this.container.width(), this.container.height(),
	0, 0, this.container.width(), this.container.height());
}

THREERenderContext.prototype.startPath = function() {
    this.path = new THREE.CurvePath();
    this.shape = new THREE.Shape();
    this.point = new THREE.Vector3(0,0,0);
}


THREERenderContext.prototype.finishPath = function(data) {
    if (data == undefined) { data = {}; }
    if (data.stroke_width === undefined) data.stroke_width = 0.1;
    if (data.stroke === undefined) data.stroke = "none";
    if (data.fill === undefined) data.fill = "none";
    if (data.stroke_opacity === undefined) data.stroke_opacity = "1";
    if (data.fill_opacity === undefined) data.fill_opacity = "1";
    
    var geometry, material;
    if (data.stroke != "none") {
    	geometry = new THREE.TubeGeometry(this.path, 20,  data.stroke_width*0.5, 12, false);
    	material = new THREE.MeshBasicMaterial( { color: data.stroke } );
		var wire = new THREE.Mesh( geometry, material );
		this.scene.add( wire );
    }

    if (data.fill != "none") {
    	geometry = new THREE.ShapeGeometry(this.shape);
    	material = new THREE.MeshBasicMaterial( { color: data.fill } );
    	var region = new THREE.Mesh( geometry, material );
    	this.scene.add( region );
    }
    

    return data;
}


THREERenderContext.prototype.moveTo = function(p) {
    if (p.x === undefined) throw 0;
    if (p.y === undefined) throw 0;

    this.point = new THREE.Vector3(p.x,p.y,0);
    this.shape.moveTo(p.x,p.y);
}

THREERenderContext.prototype.lineTo = function(p) {
    if (p.x === undefined) {
        throw 0;
    }
    if (p.y === undefined) throw 0;

	var dest = new THREE.Vector3(p.x,p.y,0);
	this.path.add(new THREE.LineCurve3(this.point, dest));
    this.point = dest;
    this.shape.lineTo(p.x,p.y);
}

THREERenderContext.prototype.bezierTo = function(p) {
    if (p.c1x === undefined) throw 0;
    if (p.c1y === undefined) throw 0;
    if (p.c2x === undefined) throw 0;
    if (p.c2y === undefined) throw 0;
    if (p.x === undefined) throw 0;
    if (p.y === undefined) throw 0;
    
    var dest = new THREE.Vector3(p.x,p.y,0);
    var c1 = new THREE.Vector3(p.c1x,p.c1y,0);
    var c2 = new THREE.Vector3(p.c2x,p.c2y,0);
    this.path.add(new THREE.CubicBezierCurve3(this.point, c1, c2, dest));
    this.point = dest;
    this.shape.bezierCurveTo(p.c1x,p.c1y,p.c2x,p.c2y,p.x,p.y);
}

THREERenderContext.prototype.drawCircle = function(data) {
    if (data.x === undefined) throw 0;
    if (data.y === undefined) throw 0;
    if (data.radius == undefined) data.radius = 0.05;
    if (data.fill == undefined) data.fill = "white";
    if (data.radius == undefined) data.radius = circle_radius;
    
    var geometry = new THREE.SphereGeometry( data.radius, 32, 32 );
	var material = new THREE.MeshBasicMaterial( { color: data.fill } );
	var sphere = new THREE.Mesh( geometry, material );
	sphere.position.x = data.x;
	sphere.position.y = data.y;
	this.scene.add( sphere );
}

THREERenderContext.prototype.drawNode = function(cx, cy, radius, colour) {
    this.drawCircle({x: cx, y: cy, radius: radius, fill: colour});
}

THREERenderContext.prototype.drawEmpty = function(colour) {
    // from (-0.5,-0.5) to (0.5, 0.5)
}

THREERenderContext.prototype.drawLine = function(x1, y1, x2, y2, colour, opacity) {
    if (opacity == null) opacity = 1.0;
    this.startPath();
    this.moveTo({x:x1, y:y1});
    this.lineTo({x:x2, y:y2});
    this.finishPath({'stroke_opacity':opacity, 'stroke': colour});
}

THREERenderContext.prototype.drawRect = function(x, y, w, h, colour, opacity) {
    if (opacity == undefined) opacity = 1.0;
    var x1 = x + w;
    var y1 = y + h;
    this.startPath();
    this.moveTo({x:x, y:y});
    this.lineTo({x:x1, y:y});
    this.lineTo({x:x1, y:y1});
    this.lineTo({x:x, y:y1});
    this.finishPath({fill: colour, 'fill_opacity': opacity});
}
