"use strict";

/*global RegisterSingularityFamily*/
/*global Diagram*/

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
            possible: this.rewriteAllowed_IntL('Int-L', key)
        });
        options.push({
            type: 'IntI-L',
            key: key,
            possible: this.rewriteAllowed_IntL('IntI-L', key)
        });
        options.push({
            type: 'IntI-R',
            key: key,
            possible: this.rewriteAllowed_IntL('IntI-R', key)
        });
        options.push({
            type: 'Int-R',
            key: key,
            possible: this.rewriteAllowed_IntL('Int-R', key)
        });
    } else {
        options.push({
            type: 'Int-R',
            key: key,
            possible: this.rewriteAllowed_IntL('Int-RI', key)
        });
        options.push({
            type: 'IntI-R',
            key: key,
            possible: this.rewriteAllowed_IntL('IntI-RI', key)
        });
        options.push({
            type: 'Int-L',
            key: key,
            possible: this.rewriteAllowed_IntL('Int-LI', key)
        });
        options.push({
            type: 'IntI-L',
            key: key,
            possible: this.rewriteAllowed_IntL('IntI-LI', key)
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

Diagram.prototype.interchangerAllowed['IntL'](type, key) {
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

        var template = this.expand(new_type, this.nCells[key_location.last()].coordinates.last(), 1, crossings);
        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }

}

Diagram.prototype.rewritePasteData['IntL'] = function(type, key) {
    // rewriteInterchangerTarget
}

/* Needed for 4-categories
Diagram.prototype.expand['IntL'] = function(type, height, n, m) {
}
*/

Diagram.prototype.getInterchangerCoordinates['IntL'] = function(type, key) {

}

Diagram.prototype.getInterchangerBoundingBox['IntL'] = function(type, key) {

}

Diagram.prototype.getInverseKey['IntL'] = function(type, key) {
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
