"use strict";

// Data for the Int-L-S family
// This is naturality for the 4-cell pull-through

RegisterSingularityFamily(
    'IntLS', 5,
    ['Int-L-S', 'Int-L-SI',
    'IntI-L-S', 'IntI-L-SI',
    'Int-LI-S', 'Int-LI-SI',
    'IntI-LI-S', 'IntI-LI-SI',
    'Int-R-S', 'Int-R-SI',
    'IntI-R-S', 'IntI-R-SI',
    'Int-RI-S', 'Int-RI-SI',
    'IntI-RI-S', 'IntI-RI-SI']
);

Diagram.prototype.rewriteAllowed_IntLS = function(type, key) {
    
    // Basic check on the key
    if (key >= this.nCells.length) return false;
    if (key < 0) return false;
    var key_cell = this.nCells[key];
    
    if (type == 'Int-L-S') {
        var f = get_cell.getSource(); // ???? does this always make sense ????
        
        // Pseudocode
        var template = concatenate(expand('Int-L', ))
    }
    
}

// Give data to cut source from the diagram
Diagram.prototype.rewriteCutData_IntLS = function(type, key) {
    var data = {};
}

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData_IntLS = function(type, key) {
}

// Interpret drag of this type
Diagram.prototype.interpret_drag_IntLS = function(drag) {
    if (this.dimension < 4) return null;
    // blah
}

/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {
    
}
*/