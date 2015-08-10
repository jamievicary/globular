"use strict";

/*
    Complex class
    
    Properties:
        - points
        - simplices
        - source
        - target
*/

/*
    An example 0-complex

    points: [[]], // one point with no coordinates
    simplices: [{
        id: diagram.generator,
        subset: [0]
    }]
*/

// Recursive procedure that constructs the simplicial complex for a diagram
function Complex(diagram) {

    this.points = {};
    this.simplices = {};
    this.source = null;
    this.target = null;
    if (diagram == undefined) return;

    // Ugh ... a nice recursive procedure is too hard for now.
    // Hardcode something that works for d = 0,1,2, and we'll
    // do something better at a later stage.

    if (diagram.getDimension() == 0) {
        return this.complex_0(diagram);
    }
    else if (diagram.getDimension() == 1) {
        return this.complex_1(diagram);
    }
    else if (diagram.getDimension() == 2) {
        return this.complex_2(diagram);
    }
    else {
        return null;
    }
}

// Copy a complex
Complex.prototype.copy = function() {
    var new_complex = new Complex();
    new_complex.points = {};
    new_complex.simplices = {};
    for (var index in this.points) {
        if (!this.points.hasOwnProperty(index)) continue;
        new_complex.points[index] = this.points[index].slice();
    }
    for (var index in this.simplices) {
        if (!this.simplices.hasOwnProperty(index)) continue;
        new_complex.simplices[index] = {
            type: this.simplices[index].type,
            subset: this.simplices[index].subset.slice()
        };
    }
    if (this.getDimension() > 0) {
        new_complex.source = this.source.copy();
        new_complex.target = this.target.copy();
    }
    else {
        new_complex.source = null;
        new_complex.target = null;
    }
    return new_complex;
}

// Build a 0-complex from a 0-diagram
Complex.prototype.complex_0 = function(diagram) {

    this.triangles = [];
    this.lines = [];
    this.points = [];
    this.dimension = 0;
    this.min_x = -diagram.generators.length / 2;
    this.max_x = diagram.generators.length / 2;
    this.min_y = -0.5;
    this.max_y = 0.5;
    this.size = diagram.getFullDimensions();
    this.points = [{
        type: diagram.generators[0].id,
        point: [0, 0],
        logical: []
    }];
    return this;
}

// Build a 1-complex from a 1-diagram
Complex.prototype.complex_1 = function(diagram) {

    this.triangles = [];
    this.lines = [];
    this.points = [];
    this.dimension = 1;
    this.min_x = -diagram.generators.length / 2;
    this.max_x = diagram.generators.length / 2;
    this.min_y = -0.5;
    this.max_y = 0.5;
    this.size = diagram.getFullDimensions();

    var pos = this.min_x;

    if (diagram.generators.length == 0) {
        this.min_x = -0.5;
        this.max_x = 0.5;
        this.min_y = -0.5;
        this.max_y = 0.5;
        this.lines = [{
            type: diagram.source.generators[0].id,
            points: [
                [-0.5, 0],
                [0.5, 0]
            ],
            origin: ""
        }];
        return;
    }

    // Add each generator
    var first = true;
    var last = false;
    for (var level = 0; level < diagram.generators.length; level++) {

        var generator = diagram.generators[level];
        var rewrite = gProject.signature.getGenerator(generator.id);
        this.points.push({
            type: generator.id,
            point: [pos + 0.5, 0],
            logical: [level + 0.5]
        });
        this.lines.push({
            type: rewrite.source.generators[0].id,
            points: [
                [pos, 0],
                [pos + 0.5, 0]
            ],
            logical: [level + 0.25],
            origin: "generator source"
        });
        first = false;
        if (level == diagram.generators.length - 1) last = true;
        this.lines.push({
            type: rewrite.target.generators[0].id,
            points: [
                [pos + 0.5, 0],
                [pos + 1, 0]
            ],
            logical: [level + 0.75],
            origin: "generator source"
        });
        pos += 1;
    }

    return this;
}

// Build a 2-complex from a 2-diagram
Complex.prototype.complex_2 = function(diagram) {

    this.triangles = [];
    this.lines = [];
    this.points = [];
    this.height = diagram.generators.length;
    this.dimension = 2;
    this.min_x = Number.MAX_VALUE;
    this.max_x = -Number.MAX_VALUE;
    this.min_y = 0;
    this.max_y = Math.max(1, diagram.generators.length);
    this.size = diagram.getFullDimensions();
    var current_platform = diagram.getSourceBoundary().copy();
    this.rectangles = [];

    // Build up the diagram
    if (diagram.generators.length == 0) {

        // Deal with an identity on an identity specially
        if (diagram.source.generators.length == 0) {
            var anchor = [0, 0];
            var l = [-0.5, 0];
            var r = [0.5, 0];
            var t = [0, 0.5];
            var b = [0, -0.5];
            var id = diagram.source.source.generators[0].id;

            this.triangles = [{
                type: id,
                points: [anchor, l, t]
            }, {
                type: id,
                points: [anchor, t, r]
            }, {
                type: id,
                points: [anchor, r, b]
            }, {
                type: id,
                points: [anchor, b, l]
            }];
            this.min_x = -0.5;
            this.max_x = 0.5;
            this.min_y = -0.5;
            this.max_y = 0.5;
            return this;
        }

        this.build_layer(current_platform, null, 0, diagram.source.generators.length);
        return this;
    }

    // Find width of the widest timeslice
    var max_width = 1;
    for (height = 0; height <= diagram.generators.length; height++) {
        var layer_max_width = this.size[height];
        if (height < diagram.generators.length) {
            var rewrite = gProject.signature.getGenerator(diagram.generators[height].id);
            if ((rewrite.source.generators.length == 0) && (rewrite.target.generators.length == 0)) {
                layer_max_width += 1
            }
        }
        max_width = Math.max(max_width, layer_max_width);
    }

    // Build layers and construct active rectangles
    for (var height = 0; height < diagram.generators.length; height++) {

        // Active rectangle to recognize interchanger clicks
        this.rectangles.push({
            height: height,
            x_min: -max_width / 2,
            x_max: max_width / 2,
            y_min: height,
            y_max: height + 1
        });

        var generator = diagram.generators[height];
        this.build_layer(current_platform, generator, height, max_width);
        current_platform.rewrite(generator);

    }

    return this;
}

Complex.prototype.build_layer = function(current_platform, generator, height, max_width) {

    var rewrite = (generator == null ? null : gProject.signature.getGenerator(generator.id));
    var num_blocks = (generator == null ? current_platform.generators.length : current_platform.generators.length - rewrite.source.generators.length + 1);
    var base_width = current_platform.generators.length;
    var generator_mid_width;
    if (rewrite == null) {
        generator_mid_width = 1;
    }
    else {
        generator_mid_width = Math.max(0.5, (rewrite.source.generators.length + rewrite.target.generators.length) / 2);
    }
    var mid_width = num_blocks - 1 + generator_mid_width;
    var top_width = (generator == null ? base_width : current_platform.generators.length - rewrite.source.generators.length + rewrite.target.generators.length);
    var base_position = -base_width / 2;
    var mid_position = -mid_width / 2;
    var top_position = -top_width / 2;
    this.min_x = Math.min(this.min_x, base_position, mid_position, top_position);
    this.max_x = Math.max(this.max_x, -base_position, -mid_position, -top_position);
    var attach = (generator == null ? -1 : generator.coordinate[0]);

    /*    
    var top_extra = max_width - top_width;
    var mid_extra = max_width - mid_width;
    var base_extra = max_width - base_width;
    */

    var source_index = 0;
    var target_index = 0;
    for (var block = 0; block < num_blocks; block++) {

        var first_block = (block == 0);
        var last_block = (block == num_blocks - 1);

        // Decide block type
        if (block == attach) {

            // Construct generator block
            var anchor = [mid_position + (generator_mid_width / 2), height + 0.5];

            // Main vertex
            this.points.push({
                type: generator.id,
                point: anchor,
                logical: [height + 0.5, source_index + 0.5],
                origin: "generator vertex"
            });

            // Source triangles
            for (var i = 0; i < rewrite.source.generators.length; i++) {
                var source_generator = rewrite.source.generators[i];
                var b1 = [base_position + i, height];
                var b2 = [base_position + i + 0.5, height];
                var b3 = [base_position + i + 1, height];
                this.triangles.push({
                    type: gProject.signature.getGenerator(source_generator.id).source.generators[0].id,
                    points: [anchor, b1, b2],
                    logical: [height + 0.25, source_index + i + 0.25],
                    origin: "generator source left triangle " + i
                });
                this.triangles.push({
                    type: gProject.signature.getGenerator(source_generator.id).target.generators[0].id,
                    points: [anchor, b2, b3],
                    logical: [height + 0.25, source_index + i + 0.75],
                    origin: "generator source right triangle " + i
                });
                this.lines.push({
                    type: source_generator.id,
                    points: [anchor, b2],
                    logical: [height + 0.25, source_index + i + 0.5],
                    origin: "generator source wire " + i
                });
            }

            // Target triangles
            for (var i = 0; i < rewrite.target.generators.length; i++) {
                var target_generator = rewrite.target.generators[i];
                var b1 = [top_position + i, height + 1];
                var b2 = [top_position + i + 0.5, height + 1];
                var b3 = [top_position + i + 1, height + 1];
                this.triangles.push({
                    type: gProject.signature.getGenerator(target_generator.id).source.generators[0].id,
                    points: [anchor, b1, b2],
                    logical: [height + 0.75, source_index + i + 0.25],
                    origin: "generator target left triangle " + i
                });
                this.triangles.push({
                    type: gProject.signature.getGenerator(target_generator.id).target.generators[0].id,
                    points: [anchor, b2, b3],
                    logical: [height + 0.75, source_index + i + 0.75],
                    origin: "generator target right triangle " + i
                });
                this.lines.push({
                    type: target_generator.id,
                    points: [b2, anchor],
                    logical: [height + 0.75, source_index + i + 0.5],
                    origin: "generator target wire " + i
                });
            }

            // Left side triangles
            var bl = [base_position, height];
            var ml = [mid_position, height + 0.5];
            var tl = [top_position, height + 1];
            var left_type = rewrite.source.getSourceBoundary().generators[0].id;
            var top_logical = [height + 0.75, source_index + (rewrite.target.generators.length == 0 ? -0.1 : 0.25)];
            var bottom_logical = [height + 0.25, source_index + (rewrite.source.generators.length == 0 ? -0.1 : 0.25)];
            this.triangles.push({
                type: left_type,
                points: [anchor, ml, tl],
                logical: top_logical,
                origin: "generator side left top"
            });
            this.triangles.push({
                type: left_type,
                points: [anchor, ml, bl],
                logical: bottom_logical,
                origin: "generator side left bottom"
            });
            if (first_block) {
                // Add padding triangles on the left-hand side of the diagram
                var tll = [-max_width / 2, height + 1];
                var mll = [-max_width / 2, height + 0.5];
                var bll = [-max_width / 2, height];
                this.triangles.push({
                    type: left_type,
                    points: [ml, mll, tll],
                    logical: top_logical,
                    origin: "generator left top padding 1"
                });
                this.triangles.push({
                    type: left_type,
                    points: [ml, tl, tll],
                    logical: top_logical,
                    origin: "generator left top padding 2"
                });
                this.triangles.push({
                    type: left_type,
                    points: [ml, mll, bll],
                    logical: bottom_logical,
                    origin: "generator left bottom padding 1"
                });
                this.triangles.push({
                    type: left_type,
                    points: [ml, bl, bll],
                    logical: bottom_logical,
                    origin: "generator left bottom padding 2"
                });
            }

            // Right side triangles
            br = [base_position + rewrite.source.generators.length, height];
            mr = [mid_position + generator_mid_width, height + 0.5];
            tr = [top_position + rewrite.target.generators.length, height + 1];
            var right_type = rewrite.source.getTargetBoundary().generators[0].id;
            top_logical = [height + 0.75, source_index + rewrite.target.generators.length + (rewrite.target.generators.length == 0 ? 0.1 : -0.25)];
            bottom_logical = [height + 0.25, source_index + rewrite.source.generators.length + (rewrite.source.generators.length == 0 ? 0.1 : -0.25)];
            this.triangles.push({
                type: right_type,
                points: [anchor, mr, tr],
                logical: top_logical,
                origin: "generator side right top"
            });
            this.triangles.push({
                type: right_type,
                points: [anchor, mr, br],
                logical: bottom_logical,
                origin: "generator side right bottom"
            });
            if (last_block) {
                // Add padding triangles on the right-hand side of the diagram
                var trr = [max_width / 2, height + 1];
                var mrr = [max_width / 2, height + 0.5];
                var brr = [max_width / 2, height];
                this.triangles.push({
                    type: right_type,
                    points: [mr, mrr, trr],
                    logical: top_logical,
                    origin: "generator right top padding 1"
                });
                this.triangles.push({
                    type: right_type,
                    points: [mr, tr, trr],
                    logical: top_logical,
                    origin: "generator right top padding 2"
                });
                this.triangles.push({
                    type: right_type,
                    points: [mr, mrr, brr],
                    logical: bottom_logical,
                    origin: "generator right bottom padding 1"
                });
                this.triangles.push({
                    type: right_type,
                    points: [mr, br, brr],
                    logical: bottom_logical,
                    origin: "generator right bottom padding 2"
                });
            }

            // Adjust positions for next block
            source_index += rewrite.source.generators.length;
            target_index += rewrite.target.generators.length;
            base_position += rewrite.source.generators.length;
            mid_position += generator_mid_width;
            top_position += rewrite.target.generators.length;
        }
        else {

            // Construct identity block from 8 triangles and 2 lines
            var wire_type = current_platform.generators[source_index].id;
            var wire_rewrite = gProject.signature.getGenerator(wire_type);
            var left_type = wire_rewrite.source.generators[0].id;
            var right_type = wire_rewrite.target.generators[0].id;

            var bl = [base_position, height];
            var bm = [base_position + 0.5, height];
            var br = [base_position + 1, height];
            var ml = [mid_position, height + 0.5];
            var anchor = [mid_position + 0.5, height + 0.5];
            var mr = [mid_position + 1, height + 0.5];
            var tl = [top_position, height + 1];
            var tm = [top_position + 0.5, height + 1];
            var tr = [top_position + 1, height + 1];
            this.triangles.push({
                type: left_type,
                points: [anchor, bl, bm],
                logical: [height + 0.25, source_index + 0.25],
                origin: "identity bl bm"
            });
            this.triangles.push({
                type: left_type,
                points: [anchor, bl, ml],
                logical: [height + 0.25, source_index + 0.25],
                origin: "identity bl ml"
            });
            this.triangles.push({
                type: left_type,
                points: [anchor, ml, tl],
                logical: [height + 0.75, target_index + 0.25],
                origin: "identity ml tl"
            });
            this.triangles.push({
                type: left_type,
                points: [anchor, tl, tm],
                logical: [height + 0.75, target_index + 0.25],
                origin: "identity tl tm"
            });
            this.triangles.push({
                type: right_type,
                points: [anchor, br, bm],
                logical: [height + 0.25, source_index + 0.75],
                origin: "identity br bm"
            });
            this.triangles.push({
                type: right_type,
                points: [anchor, br, mr],
                logical: [height + 0.25, source_index + 0.75],
                origin: "identity br mr"
            });
            this.triangles.push({
                type: right_type,
                points: [anchor, mr, tr],
                logical: [height + 0.75, target_index + 0.75],
                origin: "identity mr tr"
            });
            this.triangles.push({
                type: right_type,
                points: [anchor, tr, tm],
                logical: [height + 0.75, target_index + 0.75],
                origin: "identity tr tm"
            });
            this.lines.push({
                type: wire_type,
                points: [anchor, bm],
                logical: [height + 0.25, source_index + 0.5],
                origin: "identity wire source"
            });
            this.lines.push({
                type: wire_type,
                points: [tm, anchor],
                logical: [height + 0.75, target_index + 0.5],
                origin: "identity wire target"
            });
            if (first_block) {
                // Add padding triangles on the left-hand side of the diagram
                var tll = [-max_width / 2, height + 1];
                var mll = [-max_width / 2, height + 0.5];
                var bll = [-max_width / 2, height];
                var top_logical = [height + 0.75, target_index + 0.25];
                var bottom_logical = [height + 0.25, source_index + 0.25];
                this.triangles.push({
                    type: left_type,
                    points: [ml, mll, tll],
                    logical: top_logical,
                    origin: "generator left top padding 1"
                });
                this.triangles.push({
                    type: left_type,
                    points: [ml, tl, tll],
                    logical: top_logical,
                    origin: "generator left top padding 2"
                });
                this.triangles.push({
                    type: left_type,
                    points: [ml, mll, bll],
                    logical: bottom_logical,
                    origin: "generator left bottom padding 1"
                });
                this.triangles.push({
                    type: left_type,
                    points: [ml, bl, bll],
                    logical: bottom_logical,
                    origin: "generator left bottom padding 2"
                });
            }
            if (last_block) {
                // Add padding triangles on the right-hand side of the diagram
                var trr = [max_width / 2, height + 1];
                var mrr = [max_width / 2, height + 0.5];
                var brr = [max_width / 2, height];
                var top_logical = [height + 0.75, target_index + 0.75];
                var bottom_logical = [height + 0.25, source_index + 0.75];
                this.triangles.push({
                    type: right_type,
                    points: [mr, mrr, trr],
                    logical: top_logical,
                    origin: "right top padding 1"
                });
                this.triangles.push({
                    type: right_type,
                    points: [mr, tr, trr],
                    logical: top_logical,
                    origin: "right top padding 2"
                });
                this.triangles.push({
                    type: right_type,
                    points: [mr, mrr, brr],
                    logical: bottom_logical,
                    origin: "right bottom padding 1"
                });
                this.triangles.push({
                    type: right_type,
                    points: [mr, br, brr],
                    logical: bottom_logical,
                    origin: "right bottom padding 2"
                });
            }

            // Adjust positions for next block
            source_index += 1;
            target_index += 1;
            base_position += 1;
            mid_position += 1;
            top_position += 1;
        }
    }
}

Complex.prototype.getType = function() {
    return 'Complex';
}

// Get the dimension of the complex
Complex.prototype.getDimension = function() {
    return this.dimension;
}
