"use strict";

/*global Diagram*/

/*
    x
    
    An experiment in singularities.
*/

/********** IntL **********/

function x_getSource_IntL(type, id /* could be from signature, or an interchanger */) {
    if (type.isInverse()) return x_getTarget_IntL(type.removeInverse(), id);
    if (type == 'Int-L' ) return {key: [0], list: [{id: id, coordinates: [0]}].concat(x_expand_Int('Int' , 'L', x_target(id)))};
    if (type == 'IntI-L') return {key: [0], list: [{id: id, coordinates: [0]}].concat(x_expand_Int('IntI', 'L', x_target(id)))};
    if (type == 'Int-R' ) return {key: [0], list: [{id: id, coordinates: [1]}].concat(x_expand_Int('Int' , 'R', x_target(id)))};
    if (type == 'IntI-R') return {key: [0], list: [{id: id, coordinates: [1]}].concat(x_expand_Int('IntI', 'R', x_target(id)))};
}

function x_getTarget_IntL(type, id) {
    if (type.isInverse()) return x_getSource_IntL(type.removeInverse(), id);
    if (type == 'Int-L' ) return {key: [x_source(id).length], list: x_expand_Int('Int' , 'L', x_target(id)).push({id: id, coordinates: [1]})};
    if (type == 'IntI-L') return {key: [x_source(id).length], list: x_expand_Int('IntI', 'L', x_target(id)).push({id: id, coordinates: [1]})};
    if (type == 'Int-R' ) return {key: [x_source(id).length], list: x_expand_Int('Int' , 'R', x_target(id)).push({id: id, coordinates: [0]})};
    if (type == 'IntI-R') return {key: [x_source(id).length], list: x_expand_Int('IntI', 'R', x_target(id)).push({id: id, coordinates: [0]})};
};

function x_expand_IntL(type, d1, d2) {
    if (type != 'Int-L') throw 0;
    if (d1.getLength() == 1 && d2.getLength() == 1) {
        // Base case
        var result = [];
        var steps = d1.getTarget().getLength() - d1.cells[0].getTarget().getLength() + 1;
        for (var i = 0; i < steps; i++) {
            // ...
        }
    } else if (d1.getLength() == 1 && d2.getLength() > 1) {
        // Recursive case 1
        // ...
    }
    } else if (d1.getLength() > 1 && d2.getLength() == 1) {
        // Recursive case 2
        // ...
    }
    } else {
        // Recursive case 3
        // ...
    }
}


Diagram.prototype.x_interchangerAllowed_IntL = function(type, key) {
    return this.x_subinstructions(key, x_getSource_IntL(type, this.cells[key]));
}

Diagram.prototype.x_rewritePasteData_IntL = function(type, key) {
    return x_getTarget_IntL(type, this.cells[key]);
}

// Not needed
Diagram.prototype.x_getInterchangerCoordinates = function(type, key) {
    // ...
}

// Not needed
Diagram.prototype.x_getInterchangerBoundingBox = function(type, key) {
    
}

// This would be unchanged
Diagram.prototype.interpretDrag = function(drag) {
    //...
}

// This would be easy
Diagram.prototype.getInverseKey = function(type, key) {
    //...
}

/********** IntLS **********/

function x_getSource_IntLS(type, id) {
    var key_source = gProject.signature.getRealSource(id);
    var result = x_expand_IntL('Int-L', key_source).concatenate({id: id, coordinates: [1, key_source.getSource().cells.length]})
}

function x_expand_IntL(type, first, second) {
    
}

function x_target(id) {
    
}

function x_source(id) {
    
}

/********** IntLS **********/

