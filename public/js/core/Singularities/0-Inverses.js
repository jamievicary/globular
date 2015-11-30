"use strict";

/*global Diagram*/
/*global NCell*/

/*
    Handle inverse singularities
*/

// Interpret drag of this type
Diagram.prototype.interpretDrag.Inverses = function(drag) {

    if (drag.directions == null) return this.interpretClickInverses(drag);
    if (drag.coordinates.length > 1) return [];

    var up = drag.directions[0] > 0;
    var height = drag.coordinates[0];

    // Can we cancel an invertible cell at the bottom?
    if (!up && height == 0) {
        var cell = this.cells[height];
        //if (!cell.id.is_invertible()) return [];
        var preattachment = {
            boundary: {
                type: 's',
                depth: 1
            },
            id: cell.id,
            key: cell.key
        };
        return [{
            preattachment: preattachment,
            id: cell.id.toggle_inverse() + '-EI',
            key: [0]
        }];
    };

    // Can we cancel an invertible cell at the top?
    if (up && height == this.cells.length - 1) {
        var cell = this.cells[height];
        //if (!cell.id.is_invertible()) return [];
        var preattachment = {
            boundary: {
                type: 't',
                depth: 1
            },
            id: cell.id.toggle_inverse(),
            key: this.getSlice(height).getInverseKey(cell.id, cell.key)
        };
        return [{
            preattachment: preattachment,
            id: cell.id + '-EI',
            key: [this.cells.length - 1]
        }];
    }

    var cell = this.cells[up ? height : height - 1];
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
    var results = [];
    for (var i = 0; i < cells.length; i++) {
        // Does the source of this cell match at this location?
        var generator = gProject.signature.getGenerator(cells[i]);
        //var checkbox = $('#invertible-' + generator.id);
        //if (!checkbox.is(':checked')) continue;
        var matches = this.enumerate(generator.source);
        for (var j = 0; j < matches.length; j++) {
            
            /*
                How to select the appropriate matches? If we use
                    //if (!matches[j].tail(drag.coordinates)) continue;
                then we are too permissive, and get lots of matches
                that are not local to the click (e.g. applying 'rho^ inverse')
            */
            
            if (!matches[j].tail(drag.coordinates)) continue;
            //if (!matches[j].vector_equals(drag.coordinates)) continue;
            results.push({
                id: cells[i],
                key: matches[j],
                possible: true
            });
        }
        // What about the target
        var matches = this.enumerate(generator.target);
        for (var j = 0; j < matches.length; j++) {
            if (!matches[j].tail(drag.coordinates)) continue;
            //if (!matches[j].vector_equals(drag.coordinates)) continue;
            results.push({
                id: cells[i] + 'I',
                key: matches[j],
                possible: true
            });
        }
    }
    return results;
};

Diagram.prototype.getInterchangerCoordinates.Inverses = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;
}

Diagram.prototype.getInverseKey.Inverses = function(type, key) {
    
    // '-E' cells require a key of length 1
    if (type.tail('E')) return [key.last()];
    
    // '-EI' cells require a key of length > 1
    //if (type.tail('EI')) return this.getBoundingBox({id: type, key: key}).min.slice(1);
    if (type.tail('EI')) return this.getBoundingBox({id: type, key: key}).min;
}

Diagram.prototype.getInterchangerBoundingBox.Inverses = function(type, key) {
    var base_type = type.substr(0, type.length - (type.tail('-E') ? 2 : 3));

    var box;
    if (type.tail('-EI')) {
        box = this.getSliceBoundingBox(key.last());
        box.max.push(key.last() + 2)
    } else {
        var slice = this.getSlice(key.last());
        var base_key = slice.tidyKey(base_type, key.slice(0, key.length - 1));
        box = this.getSlice(key.last()).getBoundingBox({
            id: base_type,
            key: base_key
        });
        box.max.push(key.last());
    }
    box.min.push(key.last());
    return box;
}

Diagram.prototype.interchangerAllowed.Inverses = function(type, key) {

    // This procedure only recognizes '-E' or '-EI' type moves
    if (!type.tail('-EI', '-E')) return false;

    var height = key.last();

    // If we're inserting from the identity, just assume it's fine
    if (type.tail('-E')) return true;

    // Can't cancel out an inverse cell if we're at the top of the diagram
    if (height == this.cells.length) return false;

    // Must have at least 2 things to cancel out
    if (this.cells.length < 2) return false;

    // Get the two things that are supposed to be inverse
    var cell1 = this.cells[height];
    var cell2 = this.cells[height + 1];

    // Check they are actually inverse
    var inverse_cell1 = this.getSlice(height).getInverseCell(cell1);
    if (!inverse_cell1.equals(cell2)) return false;

    // Check cell ids are consistent with the type we've been passed
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
    var slice = this.getSlice(key.last());
    var base_key = slice.tidyKey(base_type, key.slice(0, key.length - 1));
    var reverse_key = slice.getInverseKey(base_type, base_key);
    return [new NCell({
        id: base_type,
        key: base_key
    }), new NCell({
        id: base_type.toggle_inverse(),
        key: reverse_key
    })];
}

Diagram.prototype.tidyKey.Inverses = function(type, key) {
    if (type.tail('-EI') && key.length != 1) debugger;
    if (type.tail('-E') && key.length != this.getDimension()) debugger;
    return key;
}
