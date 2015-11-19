"use strict";

/*global RegisterSingularityFamily*/
/*global Diagram*/
/*global diff_array*/

// Data for the IntL family of singularities
// These are 4-cell pull-throughs

RegisterSingularityFamily({
    family: 'IntL',
    dimension: 4,
    members: ['Int-L', 'Int-LI', 'IntI-L', 'IntI-LI', 'Int-R', 'Int-RI', 'IntI-R', 'IntI-RI']
});

Diagram.prototype.expand.IntL = function(type, data, n, m) {
    
    var x = data.up;
    var y = data.across;
    var l = data.length;
    
    var list = new Array();
    var new_type;
    var new_l = l + (this.target_size(x) - this.source_size(x));
    var final_l = l;
    for (var i = 0; i < n; i++) {
        final_l += (this.target_size(x + i) - this.source_size(x + i));
    }
    var b = this.nCells[x].coordinates.last() - y;
    var a = y + l - this.nCells[x].coordinates.last() - this.source_size(x);
    if (type.tail('I')) {
        new_type = type.substr(0, type.length - 3)
    } else {
        new_type = type.substr(0, type.length - 2)
    }
    if (n === 0 || m === 0) {
        return [];
    } else if (n === 1 && m === 1) {
        if (a === 0 && b === 0) {
            if (type.tail('I')) {
                list.push(new NCell(type, null, [x + 1]));
            } else {
                list.push(new NCell(type, null, [x]));
            }
        } else {
            list = this.expand(new_type, x, 1, a * m).concat(
                this.expand(type, {up: x + a * m, across: y + a, length: this.source_size(x)}, 1, 1)).concat(
                this.expand(new_type, x + this.source_size(x) + a * m, b * m, 1));
        }
    } else if (m != 1 && n === 1) {
        list = this.expand(type, {up: x, across: y, length: l}, 1, 1).concat(
            this.expand(type, {up: x + a + b + this.source_size(x), across: y + 1, up: new_l}, 1, m - 1));
    } else {
        list = this.expand(type, x + n - 1, y, 1, final_l, m).concat(this.expand(type, {up: x, across: y, length: l}, n - 1, m));
    }

    return list;
};

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntL = function(drag) {
    if (drag.directions == null) return [];
    var up = drag.directions[0] > 0;
    var right = drag.directions[1] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(up ? ['Int-L', 'IntI-L', 'IntI-R', 'Int-R'] : ['Int-RI', 'IntI-RI', 'Int-LI', 'IntI-LI'], key);

    // Collect the possible options
    var possible_options = [];
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            possible_options.push(options[i]);
        }
    }

    if (possible_options.length == 0) {
        return [];
    }
    if (possible_options.length == 1) return [possible_options[0]];

    // Otherwise select based on secondary direction
    if (right) {
        var r1 = options[0];
        var r2 = options[1];
        if (r1.possible && r2.possible) return [r1]; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return [r1];
        if (!r1.possible && r2.possible) return [r2];
        if (options[2].possible) return [options[2]];
        return [options[3]];
    } else {
        var r1 = options[2];
        var r2 = options[3];
        if (r1.possible && r2.possible) return [r1]; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return [r1];
        if (!r1.possible && r2.possible) return [r2];
        if (options[0].possible) return [options[0]];
        return [options[1]];
    }
};

Diagram.prototype.interchangerAllowed.IntL = function(type, key) {

    var x = key.last();
    var slice = this.getSlice(x);
    var cell = this.nCells[x];
    var coords = cell.coordinates;
    var cell_depth = coords.end(1);
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);
    var subtype = (type.substr(0, 4) == 'IntI' ? 'IntI' : 'Int');

    if (type == 'Int-L') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        //if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() + g1_source).max.end(0)) return false; // must be deeper
        if (!this.separation([coords.last() + g1_source, key.last()], [key.last()]).below) return false;
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last(), g1_target, 1));
    }

    if (type == 'IntI-L') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        //if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() + g1_source).min.end(0)) return false; // must be shallower
        if (!this.separation([coords.last() + g1_source, key.last()], [key.last()]).above) return false;
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last(), g1_target, 1));
    }

    if (type == 'Int-RI') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        if (!this.separation([coords.last() + g1_source, key.last()], [key.last()]).above) return false;
        //if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() + g1_source).min.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last(), 1, g1_source));
    }

    if (type == 'IntI-RI') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        if (!this.separation([coords.last() + g1_source, key.last()], [key.last()]).below) return false;
        //if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() + g1_source).max.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last(), 1, g1_source));
    }
    
    if (type == 'Int-LI') {
        if (coords.last() == 0) return false; // must have something on the left
        //if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() - 1).max.end(0)) return false; // must be deeper
        if (!this.separation([coords.last() - 1, key.last()], [key.last()]).above) return false;
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last() - 1, g1_source, 1));
    }

    if (type == 'IntI-LI') {
        if (coords.last() == 0) return false; // must have something on the left
        if (!this.separation([coords.last() - 1, key.last()], [key.last()]).below) return false;
        //if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() - 1).min.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last() - 1, g1_source, 1));
    }

    if (type == 'Int-R') {
        if (coords.last() == 0) return false; // must have something on the left
        if (!this.separation([coords.last() - 1, key.last()], [key.last()]).below) return false;
        //if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() - 1).min.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last() - 1, 1, g1_target));
    }

    if (type == 'IntI-R') {
        if (coords.last() == 0) return false; // must have something on the left
        if (!this.separation([coords.last() - 1, key.last()], [key.last()]).above) return false;
        //if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() - 1).max.end(0)) return false; // must be deeper
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last() - 1, 1, g1_target));
    }
    
    return false;
}

Diagram.prototype.rewritePasteData.IntL = function(type, key) {

    var x = key.last();
    var h = key.last();
    var cell = this.nCells[h].copy();
    var coords = cell.coordinates.slice(0);
    var heights = this.getInterchangerCoordinates(type, key);
    var d = new Diagram(); // dummy diagram objects for Int expansion
    var s = this.source_size(h);
    var t = this.target_size(h);
    
    if (type == 'Int-L')   return d.expand('Int', coords.last(), s, 1).concat([cell.move([{relative: 1}])]);
    if (type == 'IntI-L')  return d.expand('IntI', coords.last(), s, 1).concat([cell.move([{relative: 1}])]);
    if (type == 'Int-R')   return d.expand('Int', coords.last() - 1, 1, s).concat([cell.move([{relative: -1}])]);
    if (type == 'IntI-R')  return d.expand('IntI', coords.last() - 1, 1, s).concat([cell.move([{relative: -1}])]);
    if (type == 'Int-LI')  return [cell.move([{relative: -1}])].concat(d.expand('Int', coords.last() - 1, t, 1));
    if (type == 'IntI-LI') return [cell.move([{relative: -1}])].concat(d.expand('IntI', coords.last() - 1, t, 1));
    if (type == 'Int-RI')  return [cell.move([{relative: 1}])].concat(d.expand('Int', coords.last(), 1, t));
    if (type == 'IntI-RI') return [cell.move([{relative: 1}])].concat(d.expand('IntI', coords.last(), 1, t));
    
}

Diagram.prototype.getInterchangerCoordinates.IntL = function(type, key) {

    var diagram_pointer = this;
    var new_key = key.last();
    var h = key.last();
    var cell = this.nCells[h];
    var coords = cell.coordinates.slice(0);
    coords.push(h);
    
    if (type.tail('Int-L', 'IntI-L')) {
        return coords;
    }
    else if (type.tail('Int-LI', 'IntI-LI')) {
        return coords.move([{relative: -1}, {relative: -this.source_size(h)}]);
    }
    else if (type.tail('Int-R', 'IntI-R')) {
        return coords.move([{relative: -1}, {relative: 0}]);
    }
    else if (type.tail('Int-RI', 'IntI-RI')) {
        return coords.move([{relative: -this.source_size(h)}])
    }

    //////// OLD
    
    var list = [];
    /*
    if (type.tail('R')) {
        list = this.nCells[new_key + 1].coordinates.slice(0);
    } else if (type.tail('L')) {
        list = this.nCells[new_key].coordinates.slice(0);
    } else if (type.tail('RI')) {
        new_key -= diagram_pointer.source_size(new_key);
        list = this.nCells[new_key].coordinates.slice(0);
    } else if (type.tail('LI')) {
        list = this.nCells[new_key - 1].coordinates.slice(0);
        new_key -= diagram_pointer.source_size(new_key);
    }
    */

    return list.concat([new_key]);
}

Diagram.prototype.getInterchangerBoundingBox.IntL = function(type, key) {
    var x = key.last();
    var coords = this.getInterchangerCoordinates(type, key);
    if (type.tail('R', 'L')) return {min: coords, max: coords.slice().move([{relative: this.source_size(x) + 1}, {relative: this.target_size(x) + 1}])};
    if (type.tail('RI', 'LI')) return {min: coords, max: coords.slice().move([{relative: this.source_size(x) + 1}, {relative: this.source_size(x) + 1}])};
    debugger;
}

Diagram.prototype.getInverseKey.IntL = function(type, key) {
    var x = key.last();
    if (type.tail('R')) return [x + this.source_size(x)];
    else if (type.tail('L')) return [x + this.source_size(x)];
    else if (type.tail('RI')) return [x - this.source_size(x)];
    else if (type.tail('LI')) return [x - this.source_size(x)];
}
