"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-T family
// This naturality for the tangle/untangle

RegisterSingularityFamily({
    family: 'IntLT',
    dimension: 5,
    members: ['Int-L-T'
    /*
    ,'Int-L-TI',
    'IntI-L-T', 'IntI-L-TI',
    'Int-LI-T', 'Int-LI-TI',
    'IntI-LI-T', 'IntI-LI-TI',
    'Int-R-T', 'Int-R-TI',
    'IntI-R-T', 'IntI-R-TI',
    'Int-RI-T', 'Int-RI-TI',
    'IntI-RI-T', 'IntI-RI-TI'
    */
    ]
});

Diagram.prototype.getSource.IntLT = function(type, k) {
    
    if (type != 'Int-L-T') return null;

    // Do a basic check
    var key_cell = this.nCells[k.last()];
    var base_type = type.substr(0, type.length - (type.tail('-TI') ? 3 : 2));
    if (key_cell.id != base_type) return null;
    
    // Auxiliary dummy diagram object
    var d = new Diagram();

    var key_slice = this.getSlice(k.last());
    //var f_cell = key_slice.nCells[key_cell.key.last()];
    var stack = d.expand('IntI-1I', {start: key_cell.key.last() - 1, n: key_slice.source_size(key_cell.key.last())});
    return [key_cell].concat(stack);
};


// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLT = function(drag) {
    
    var right = drag.directions[1] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(right ? ['Int-L-T'] : [], key);

    // Collect the possible options
    var possible_options = [];
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            possible_options.push(options[i]);
        }
    }

    if (possible_options.length == 0) return [];
    return [possible_options[0]];
};

Diagram.prototype.interchangerAllowed.IntLT = function(type, key) {

    var x = key.last();
    var slice = this.getSlice(x);
    var cell = this.nCells[x];
    var coords = cell.coordinates;
    var cell_depth = coords.end(1);
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);
    var subtype = (type.substr(0, 4) == 'IntI' ? 'IntI' : 'Int');

    if (type == 'Int-L-T') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() + g1_source).max.end(0)) return false; // must be deeper
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last(), g1_target, 1));
    }

    /*
    if (type == 'IntI-L') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() + g1_source).min.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last(), g1_target, 1));
    }

    if (type == 'Int-RI') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() + g1_source).min.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last(), 1, g1_source));
    }

    if (type == 'IntI-RI') {
        if (slice.nCells.length <= coords.last() + g1_source) return false; // must have something on the right
        if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() + g1_source).max.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last(), 1, g1_source));
    }
    
    if (type == 'Int-LI') {
        if (coords.last() == 0) return false; // must have something on the left
        if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() - 1).max.end(0)) return false; // must be deeper
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last() - 1, g1_source, 1));
    }

    if (type == 'IntI-LI') {
        if (coords.last() == 0) return false; // must have something on the left
        if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() - 1).min.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x - g1_source, x), this.expand(subtype, coords.last() - 1, g1_source, 1));
    }

    if (type == 'Int-R') {
        if (coords.last() == 0) return false; // must have something on the left
        if (this.getSliceBoundingBox(x).max.end(1) > slice.getSliceBoundingBox(coords.last() - 1).min.end(0)) return false; // must be shallower
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last() - 1, 1, g1_target));
    }

    if (type == 'IntI-R') {
        if (coords.last() == 0) return false; // must have something on the left
        if (this.getSliceBoundingBox(x).min.end(1) < slice.getSliceBoundingBox(coords.last() - 1).max.end(0)) return false; // must be deeper
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last() - 1, 1, g1_target));
    }
    */
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
    if (type == 'Int-RI')  return [cell.move([{relative: 1}])].concat(d.expand('Int', coords.last(), t, 1));
    if (type == 'IntI-RI') return [cell.move([{relative: 1}])].concat(d.expand('IntI', coords.last(), t, 1));
    
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
