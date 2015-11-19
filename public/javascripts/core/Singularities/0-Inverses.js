"use strict";

/*global Diagram*/
/*global NCell*/

/*
    Handle inverse singularities
*/

// Interpret drag of this type
Diagram.prototype.interpretDrag.Inverses = function(drag) {
    
    if (drag.directions == null) return this.interpretClickInverses(drag);
    
    var up = drag.directions[0] > 0;
    var height = drag.coordinates[0];

    // Basic tests
    if (!up && height == 0) {
        // Can we cancel this from the bottom?
    };
    
    if (up && height >= this.nCells.length - 1) return [];
    
    var cell = this.nCells[up ? height : height - 1];
    var options = this.getDragOptions([cell.id + '-EI'], [up ? height : height - 1]);

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

// See if we can insert a invertible cell from the signature
Diagram.prototype.interpretClickInverses = function(drag) {
    
    var cells = gProject.signature.getNCells(this.getDimension() + 1);
    if (this.getDimension() == 0) drag.coordinates = [];
    for (var i=0; i<cells.length; i++) {
        // Does the source of this cell match at this location?
        var generator = gProject.signature.getGenerator(cells[i]);
        var checkbox = $('#invertible-' + generator.id);
        if (!checkbox.is(':checked')) continue;
        var matches = this.enumerate(generator.source);
        for (var j=0; j<matches.length; j++) {
            //if (matches[j].length == 0) matches[j].push(0);
            if (drag.coordinates.length > 0) {
                if (matches[j].last() != drag.coordinates[0]) continue;
            }
            return { id: cells[i], key: null, coordinates: matches[j], possible: true }
        }
        var matches = this.enumerate(generator.target);
        for (var j=0; j<matches.length; j++) {
            //if (matches[j].length == 0) matches[j].push(0);
            if (drag.coordinates.length > 0) {
                if (matches[j].last() != drag.coordinates[0]) continue;
            }
            //if (matches[j].last() != drag.coordinates[0]) continue;
            return { id: cells[i] + 'I', key: null, coordinates: matches[j], possible: true }
        }
    }
    return [];


    var options = this.getDragOptions([cell.id + '-EI'], [up ? height : height - 1]);

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
    
    if (type.tail('-E')) {
        var base_type = type.substr(0, type.length - 2);
        var box = this.getSlice(key.last()).getBoundingBox({id: base_type, key: key.slice(0, key.length - 1)});
        box.min.push(key.last());
        return box.min;
    } else if (type.tail('-EI')) {
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
    return key;
}

Diagram.prototype.getInterchangerBoundingBox.Inverses = function(type, key) {
    var base_type = type.substr(0, type.length - (type.tail('-E') ? 2 : 3));
    
    var box;
    if (type.tail('-EI')) {
        box = this.getSliceBoundingBox(key.last());
        box.max.push(key.last() + 2)
    } else {
        var slice = this.getSlice(key.last());
        var base_coordinates = null;
        var base_key = null;
        if (base_type.is_interchanger()) {
            base_key = key.slice(0, key.length - 1);
        } else {
            base_coordinates = key.slice(0, key.length - 1);
        }
        box = this.getSlice(key.last()).getBoundingBox({id: base_type, key: base_key, coordinates: base_coordinates});
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
    if (type.tail('-E')) return true;

    // Can't cancel out an inverse cell if we're at the top of the diagram
    if (height == this.nCells.length) return false;
    
    // Must have at least 2 things to cancel out
    if (this.nCells.length < 2) return false;

    var cell1 = this.nCells[height];
    var cell2 = this.nCells[height + 1];
    
    // Check coordinates are identical
    if (!cell1.coordinates.vector_equals(cell2.coordinates)) return null;
    
    // Check cell ids are consistent
    if (type == cell1.id + '-EI' && cell2.id == cell1.id + 'I') return true;
    if (type == cell1.id + '-EI' && cell1.id == cell2.id + 'I') return true;
    
    // Cell ids don't match, so interchanger is not allowed
    return false;
};


Diagram.prototype.rewritePasteData.Inverses = function(type, key) {
    
    // '...-EI'-type cells just rewrite to the identity
    if (type.tail('-EI')) return [];
    
    // '...-E'-type cells introduce a nontrivial pair
    var base_type = type.substr(0, type.length - 2);
    if (base_type.is_interchanger()) {
        var base_key = key.slice(0, key.length - 1);
        var slice = this.getSlice(key.last());
        var reverse_key = slice.getInverseKey(base_type, base_key);
        return [new NCell(base_type, null, base_key), new NCell(base_type.toggle_inverse(), null, reverse_key)];
    } else {
        //var coordinate = key.slice(0, key.length - 1);
        var coordinates = key.slice(0, key.length - 1);
        return [new NCell(base_type, coordinates, null), new NCell(base_type.toggle_inverse(), coordinates, null)];
    }
}