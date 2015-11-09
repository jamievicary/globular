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

Diagram.prototype.expand.IntL = function(type, x, y, n, l, m) {
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
                this.expand(type, x + a * m, y + a, 1, this.source_size(x), 1)).concat(
                this.expand(new_type, x + this.source_size(x) + a * m, 1, b * m));
        }
    } else if (m != 1 && n === 1) {
        list = this.expand(type, x, y, 1, l, 1).concat(
            this.expand(type, x + a + b + this.source_size(x), y + 1, 1, new_l, m - 1));
    } else {
        list = this.expand(type, x + n - 1, y, 1, final_l, m).concat(this.expand(type, x, y, n - 1, l, m));
    }

    return list;
};

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntL = function(drag) {
    var up = drag.directions[0] > 0;
    var right = drag.directions[1] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(up ? ['Int-L', 'IntI-L', 'IntI-R', 'Int-R'] : ['Int-RI', 'IntI-RI', 'Int-LI', 'IntI-LI'], key);

    // Collect the possible options
    var possible_options = [];
    var msg = 'interpretDrag.IntL: allowed ';
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            msg += (possible_options.length != 0 ? ', ' : '') + options[i].type;
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) {
        console.log('interpretDrag.IntL: no moves allowed');
        return null;
    }
    console.log(msg);
    if (possible_options.length == 1) return possible_options[0];

    // Otherwise select based on secondary direction
    if (right) {
        var r1 = options[0];
        var r2 = options[1];
        if (r1.possible && r2.possible) return r1; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return r1;
        if (!r1.possible && r2.possible) return r2;
        if (options[2].possible) return options[2];
        return options[3];
    } else {
        var r1 = options[2];
        var r2 = options[3];
        if (r1.possible && r2.possible) return r1; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return r1;
        if (!r1.possible && r2.possible) return r2;
        if (options[0].possible) return options[0];
        return options[1];
    }
};

Diagram.prototype.interchangerAllowed.IntL = function(type, key) {

    var x = key.last();
    var slice = this.getSlice(x);
    var cell = this.nCells[x];
    var coords = cell.coordinates;
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('L')) {
        var cell_depth = coords.end(1);
        if (this.getSlice(x).nCells.length <= coords.last() + g1_source) return false; // x test
        if (this.getBoundingBox(x).max.end(1) > this.getSlice(x).nCells[coords.last() + g1_source - 1].coordinates.last()) return false; // depth test
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(new_type, coords.last(), g1_target, 1));
    }

    if (type.tail('R')) {
        // depth test
        if (this.nCells[x].coordinates.last() <= 0) return false; // x test
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + g1_target), this.expand(new_type, coords.last() - 1, 1, g1_target));
    }

    var new_type = type.slice(0, type.length - 3);

    if (type.tail('LI')) {
        var crossings = g1_source;
        if (x < 0) return false;
        if (this.nCells[x].coordinates.last() - 1 != this.nCells[x - 1].coordinates.last()) return false;
        var template = this.expand(new_type, this.nCells[x].coordinates.last() - 1, crossings, 1);
        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }

    if (type.tail('RI')) {
        var crossings = g1_source;
        if (this.nCells[x].coordinates.last() === this.getSlice(x).nCells.length - 1) return false;
        if (this.nCells[x].coordinates.last() + this.source_size(x) - 1 != this.nCells[x - 1].coordinates.last()) return false;
        var template = this.expand(new_type, this.nCells[key.last()].coordinates.last(), 1, crossings);
        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }
}

Diagram.prototype.rewritePasteData.IntL = function(type, key) {

    var x = key.last();
    var heights = this.getInterchangerCoordinates(type, key);

    if (this.nCells.length != 0) {
        if (this.nCells[x].id.substr(0, 3) === 'Int') {
            var temp_coordinates_x = null;
        } else {
            var temp_coordinates_x = diff_array(this.nCells[x].coordinates, heights.slice(0, heights.length - 1));
        }
    }

    var list = new Array();
    var new_type = type.slice(0, type.length - 2);

    if (type.tail('L')) {
        list = this.expand(new_type, 0, this.source_size(x), 1);
        if (temp_coordinates_x != null) {
            temp_coordinates_x.increment_last(1);
        } else {
            this.nCells[x].key.increment_last(-heights.penultimate() + 1);
        }
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }

    if (type.tail('R')) {
        list = this.expand(new_type, 0, 1, this.source_size(x));
        if (temp_coordinates_x != null) {
            temp_coordinates_x.increment_last(-1);
        } else {
            this.nCells[x].key.increment_last(-heights.penultimate() - 1);
        }
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }

    var new_type = type.slice(0, type.length - 3);
    var g_source = this.source_size(x);
    var g_target = this.target_size(x);

    if (type.tail('LI')) {
        list = list.concat(this.expand(new_type, 0, g_target, 1));
        if (temp_coordinates_x != null) {
            temp_coordinates_x.increment_last(-1);
        } else {
            this.nCells[x].key.increment_last(-heights.penultimate() - 1);
        }
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }

    if (type.tail('RI')) {
        list = list.concat(this.expand(new_type, 0, 1, g_target));
        if (temp_coordinates_x != null) {
            temp_coordinates_x.increment_last(1);
        } else {
            this.nCells[x].key.increment_last(-heights.penultimate() + 1);
        }
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }
    return list;
}

Diagram.prototype.getInterchangerCoordinates.IntL = function(type, key) {

    var diagram_pointer = this;
    var new_key = key.last();
    var list = [];

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

    return list.concat([new_key]);
}

Diagram.prototype.getInterchangerBoundingBox.IntL = function(type, key) {
    var x = key.last();
    if (type.tail('R')) return [this.source_size(x) + 1, this.target_size(x) + 1];
    else if (type.tail('L')) return [this.source_size(x) + 1, this.target_size(x) + 1];
    else if (type.tail('RI')) return [this.source_size(x) + 1, this.source_size(x) + 1];
    else if (type.tail('LI')) return [this.source_size(x) + 1, this.source_size(x) + 1];
}

Diagram.prototype.getInverseKey.IntL = function(type, key) {
    var x = key.last();
    if (type.tail('R')) return [x + this.source_size(x)];
    else if (type.tail('L')) return [x + this.source_size(x)];
    else if (type.tail('RI')) return [x - this.source_size(x)];
    else if (type.tail('LI')) return [x - this.source_size(x)];
}
