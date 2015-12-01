"use strict";

/*
    x_ : Experimental basic interchanger data
*/

x_RegisterSingularityFamily({family: 'Int', dimension: 3, members: ['Int', 'IntI']});

function x_interchangerSource.Int(type, id) {
    throw 0; // what to do here?
}

function x_interchangerTarget.Int(type, id) {
    throw 0; // what to do here?
}

function x_expand.Int(type, key) {
}

Diagram.prototype.x_singularitiesMatch.Int = function(type, key) {
    if (key.length != 1) return false;
    if (type == 'Int') return (key < this.cells.length - 2 && key >= 0);
    return (key < this.cells.length - 1 && key >= 1);
}

Diagram.prototype.x_wellSeparated.Int = function(type, key) {
    var x = key.last();
    if (x < 0) return false;
    if (type === 'Int') {
        if(x + 1 >= this.cells.length) return false;
        return (this.cells[x].coordinates.last() >= this.cells[x + 1].coordinates.last() + this.source_size(x + 1));
    }
    if (type.tail('IntI')) {
        if(x - 1 < 0) return false;
        return (this.cells[x - 1].coordinates.last() + this.target_size(x - 1) <= this.cells[x].coordinates.last());
    }
}

Diagram.prototype.x_interpretDrag.Int = function(drag) {
    var r = {};
    var h = drag.coordinates[0];
    if (drag.directions[0] > 0) {
        r.left = { id: 'Int', key: [h], possible: this.interchangerAllowed('Int', [h]) };
        r.right = { id: 'IntI', key: [h+1], possible: this.interchangerAllowed('IntI', [h + 1]) };
    } else {
        r.left = { id: 'IntI', key: [h], possible: this.interchangerAllowed('IntI', [h]) };
        r.right = { id: 'Int', key: [h - 1], possible: this.interchangerAllowed('Int', [h - 1]) };
    }
    // Return the best match in a permissive way
    if (!r.left.possible && !r.right.possible) return null;
    if (r.left.possible && r.right.possible) return (drag.directions[1] > 0 ? r.left : r.right);
    if (r.left.possible) return r.left;
    return r.right;
}

