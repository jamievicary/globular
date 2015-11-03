"use strict";

/*global RegisterSingularityFamily*/
/*global Diagram*/
/*global diff_array*/

// Data for the IntL family of singularities
// These are 4-cell pull-throughs

var NewSingularityFamily = {
    family: 'IntL',
    dimension: 4,
    members: ['Int-L', 'Int-LI', 'IntI-L', 'IntI-LI', 'Int-R', 'Int-RI', 'IntI-R', 'IntI-RI']
};

RegisterSingularityFamily(
    'IntL', 4
);

// Interpret drag of this type
Diagram.prototype.interpretDrag['IntL'] = function(drag) {

    var up = drag.direction[0] > 0;
    var right = drag.direction[1] > 0;
    var key = drag.position[0];

    var options = [];
    if (up) {
        options.push({
            type: 'Int-L',
            key: key,
            possible: this.rewriteAllowed('Int-L', key)
        });
        options.push({
            type: 'IntI-L',
            key: key,
            possible: this.rewriteAllowed('IntI-L', key)
        });
        options.push({
            type: 'IntI-R',
            key: key,
            possible: this.rewriteAllowed('IntI-R', key)
        });
        options.push({
            type: 'Int-R',
            key: key,
            possible: this.rewriteAllowed('Int-R', key)
        });
    } else {
        options.push({
            type: 'Int-R',
            key: key,
            possible: this.rewriteAllowed('Int-RI', key)
        });
        options.push({
            type: 'IntI-R',
            key: key,
            possible: this.rewriteAllowed('IntI-RI', key)
        });
        options.push({
            type: 'Int-L',
            key: key,
            possible: this.rewriteAllowed('Int-LI', key)
        });
        options.push({
            type: 'IntI-L',
            key: key,
            possible: this.rewriteAllowed('IntI-LI', key)
        });
    }

    // Collect the possible options
    var possible_options = [];
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) possible_options.push(options[i]);
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) return null;
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

Diagram.prototype.interchangerAllowed['IntL'] = function(type, key) {

    var x = key.last();
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);

    if (type.tail('L')) {
        var crossings = g1_target;
        if (this.nCells[x].coordinates.last() === this.getSlice(x).nCells.length - 1) return false;
        if (this.nCells[x].coordinates.last() + this.target_size(x) - 1 != this.nCells[x + 1].coordinates.last()) return false;
        var template = this.expand(new_type, this.nCells[x].coordinates.last(), crossings, 1);
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }

    if (type.tail('R')) {
        var crossings = g1_target;
        if (this.nCells[x].coordinates.last() <= 0) return false;
        if (this.nCells[x].coordinates.last() - 1 != this.nCells[x + 1].coordinates.last()) return false;
        var template = this.expand(new_type, this.nCells[x].coordinates.last() - 1, 1, crossings);
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }

    var new_type = type.slice(0, type.length - 3);

    if (type.tail('LI')) {
        var crossings = g1_source;
        if (x <= 0) return false;
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

Diagram.prototype.rewritePasteData['IntL'] = function(type, key) {

    var x = key.last();
    var heights = this.interchangerCoordinates(type, key);

    if (this.nCells.length != 0) {
        if (this.nCells[x].id.substr(0, 3) === 'Int') {
            var temp_coordinates_x = null;
        } else {
            var temp_coordinates_x = diff_array(this.nCells[x].coordinates, heights.slice(0, heights.length - 1));
        }
    }

    var list = new Array();

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

}

/* Needed for 4-categories
Diagram.prototype.expand['IntL'] = function(type, height, n, m) {
}
*/

Diagram.prototype.getInterchangerCoordinates['IntL'] = function(type, key) {
    
    var diagram_pointer = this;
    var new_key = key.last();
    var list = [];

    if(type.tail('R')){
        list = this.nCells[new_key + 1].coordinates.slice(0);
    }
    else if(type.tail('L')){
        list = this.nCells[new_key].coordinates.slice(0);
    }
    else if(type.tail('RI')){
        new_key -= diagram_pointer.source_size(new_key);
        list = this.nCells[new_key].coordinates.slice(0);
    }
    else if(type.tail('LI')){
        list = this.nCells[new_key - 1].coordinates.slice(0);
        new_key -= diagram_pointer.source_size(new_key);
    }

    return list.concat([new_key]);
}

Diagram.prototype.getInterchangerBoundingBox['IntL'] = function(type, key) {
    
}

Diagram.prototype.getInverseKey['IntL'] = function(type, key) {
    var x = key.last();
    if (type.tail('R')) {
        return [x + this.source_size(x)];
    } else if (type.tail('L')) {
        return [x + this.source_size(x)];
    } else if (type.tail('RI')) {
        return [x - this.source_size(x)];
    } else if (type.tail('LI')) {
        return [x - this.source_size(x)];
    }
}

RegisterSingularityFamily(NewSingularityFamily);
