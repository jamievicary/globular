"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-P family

// This is Baez and Neuchl's "S^- = S^+" axiom

RegisterSingularityFamily({
    family: 'IntLP',
    dimension: 5,
    members: ['Int-L-P', 'Int-L-PI0',
    'Int-R-P', 'Int-R-PI0',
    'IntI0-L-P', 'IntI0-L-PI0',
    'IntI0-R-P', 'IntI0-R-PI0'],
    friendly: {
        'Int-L-P': 'Left interchanger pull-through reparameterization',
        'Int-R-P': 'Right interchanger pull-through reparameterization',
        'IntI0-L-P': 'Left inverse interchanger pull-through reparameterization',
        'IntI0-R-P': 'Right inverse interchanger pull-through reparameterization',
    }
});

Diagram.prototype.getTarget.IntLP = function(type, key) {
    var cell = this.cells[key.last()];
    if (type == 'Int-L-P')   return [{id: 'Int-RI0',   key: [cell.key.last() + 2]}];
    if (type == 'Int-L-PI0') return [{id: 'Int-L',     key: [cell.key.last() - 2]}];
    if (type == 'Int-R-P')   return [{id: 'Int-LI0',   key: [cell.key.last() + 2]}];
    if (type == 'Int-R-PI0') return [{id: 'Int-R',     key: [cell.key.last() - 2]}];
    if (type == 'IntI0-L-P') return [{id: 'IntI0-RI0', key: [cell.key.last() + 2]}];
    if (type == 'IntI0-L-PI0') return [{id: 'IntI0-L',   key: [cell.key.last() - 2]}];
    if (type == 'IntI0-R-P')   return [{id: 'IntI0-LI0', key: [cell.key.last() + 2]}];
    if (type == 'IntI0-R-PI0') return [{id: 'IntI0-R',   key: [cell.key.last() - 2]}];
}

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData.IntLP = function(type, key) {
    return this.getTarget(type, key);
}

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLP = function(drag) {
    var options = this.getDragOptions(['Int-L-P', 'Int-L-PI0', 'Int-R-P', 'Int-R-PI0', 'IntI0-L-P', 'IntI0-L-PI0', 'IntI0-R-P', 'IntI0-R-PI0'], [drag.coordinates[0]]);

    // Collect the possible options
    var possible_options = [];
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) return [];
    return possible_options;
};

Diagram.prototype.interchangerAllowed.IntLP = function(type, key) {

    var cell = this.cells[key.last()];
    var slice = this.getSlice(key.last());
    
    // Check the source cell has the correct type
    if (type == 'Int-L-P')          { if (cell.id != 'Int-L')   return false; }
    else if (type == 'Int-L-PI0')   { if (cell.id != 'Int-RI0') return false; }
    else if (type == 'Int-R-P')     { if (cell.id != 'Int-R')   return false; }
    else if (type == 'Int-R-PI0')   { if (cell.id != 'Int-LI0') return false; }
    else if (type == 'IntI0-L-P')   { if (cell.id != 'IntI0-L')   return false; }
    else if (type == 'IntI0-L-PI0') { if (cell.id != 'IntI0-RI0') return false; }
    else if (type == 'IntI0-R-P')   { if (cell.id != 'IntI0-R')   return false; }
    else if (type == 'IntI0-R-PI0') { if (cell.id != 'IntI0-LI0') return false; }

    // Check the cell being pulled through has the correct type (interchanger or inverse interchanger)
    if (type.tail('Int-L-P', 'Int-L-PI0', 'Int-R-P', 'Int-R-PI0')) return slice.cells[cell.key.last()].id == 'Int';
    return slice.cells[cell.key.last()].id == 'IntI0';
};


Diagram.prototype.getInterchangerBoundingBox.IntLP = function(type, key) {
    // Just return the bounding box of the key cell
    return this.getLocationBoundingBox(key.last());
};


Diagram.prototype.getInterchangerCoordinates.IntLP = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;
}

Diagram.prototype.getInverseKey.IntLS = function(type, key) {
    return key;
}
