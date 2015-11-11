"use strict";

/*global Diagram*/
/*global NCell*/

/*
    Handle inverse singularities
*/

// Interpret drag of this type
Diagram.prototype.interpretDrag.Inverses = function(drag) {
    var up = drag.directions[0] > 0;
    var height = drag.coordinates[0];

    // Basic tests
    if (!up && height == 0) return [];
    if (up && height >= this.nCells.length - 1) return [];
    
    var cell = this.nCells[up ? height : height - 1];
    var options = this.getDragOptions([cell.id + '-1I'], [up ? height : height - 1]);

    // Collect the possible options
    var possible_options = [];
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) {
        return [];
    }
    return [possible_options[0]];
};

Diagram.prototype.getInterchangerCoordinates.Inverses = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;
    
    if (type.tail('-1')) {
        var base_type = type.substr(0, type.length - 2);
        var box = this.getSlice(key.last()).getBoundingBox({id: base_type, key: key.slice(0, key.length - 1)});
        box.min.push(key.last());
        return box.min;
    } else if (type.tail('-1I')) {
        // need to write this
        debugger;
    }
    /*
    var slice = this.getSlice(key.last());
    var box = slice.getInterchangerCoordinates(type, )
    return this.nCells[key.last()].coordinates.slice().concat([key]);
    */
}

Diagram.prototype.getInverseKey.Inverses = function(type, key) {
    
}

Diagram.prototype.getInterchangerBoundingBox.Inverses = function(type, key) {
    var base_type = type.substr(0, type.length - (type.tail('-1') ? 2 : 3));
    
    var box;
    if (type.tail('-1I')) {
        box = this.getSliceBoundingBox(key.last());
        box.max.push(key.last() + 2)
    } else {
        box = this.getSlice(key.last()).getBoundingBox({id: base_type, key: key.slice(0, key.length - 1)});
        box.max.push(key.last());
    }
    box.min.push(key.last());
    return box;
}

Diagram.prototype.interchangerAllowed.Inverses = function(type, key) {
    
    // If this isn't an interchanger, return false
    if (!type.is_interchanger()) return false;
    
    var height = key.last();
    
    // If we're inserting from the identity, just assume it's fine
    if (type.tail('-1')) return true;

    // Can't cancel out an inverse cell if we're at the top of the diagram
    if (height == this.nCells.length) return false;
    
    // Must have at least 2 things to cancel out
    if (this.nCells.length < 2) return false;

    var cell1 = this.nCells[height];
    var cell2 = this.nCells[height + 1];
    
    // Check coordinates are identical
    if (!cell1.coordinates.vector_equals(cell2.coordinates)) return null;
    
    // Check cell ids are consistent
    if (type == cell1.id + '-1I' && cell2.id == cell1.id + 'I') return true;
    if (type == cell1.id + '-1I' && cell1.id == cell2.id + 'I') return true;
    
    // Cell ids don't match, so interchanger is not allowed
    return false;
};


Diagram.prototype.rewritePasteData.Inverses = function(type, key) {
    
    // '...-1I'-type cells just rewrite to the identity
    if (type.tail('-1I')) return [];
    
    // '...-1'-type cells introduce a nontrivial pair
    var base_type = type.substr(0, type.length - 2);
    var base_key = key.slice(0, key.length - 1);
    var slice = this.getSlice(key.last());
    var reverse_key = slice.getInverseKey(base_type, base_key);
    return [new NCell(base_type, null, base_key), new NCell(base_type.toggle_inverse(), null, reverse_key)];
}