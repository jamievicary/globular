"use strict";

// Data for the Int family
// This is the basic interchanger

RegisterSingularityFamily('Int', 3, ['Int', 'IntI']);

/*
Diagram.prototype.rewriteAllowed_Int = function(type, key) {
    // Basic check on the key
}
*/

// Give data to cut source from the diagram
/*
Diagram.prototype.rewriteCutData_Int = function(type, key) {
    var data = {};
}
*/
// Data to insert result of rewrite into diagram
/*
Diagram.prototype.rewritePasteData_Int = function(type, key) {
}
*/

// Interpret drag of this type
Diagram.prototype.interpret_drag_Int = function(drag) {
    var r = {};
    var h = drag.position[0];
    if (drag.direction[0] > 0) {
        r.left = { type: 'Int', key: h+1, possible: this.rewriteAllowed_Int('Int', h + 1) };
        r.right = { type: 'IntI', key: h, possible: this.rewriteAllowed_Int('IntI', h) };
    } else {
        r.left = { type: 'IntI', key: h+1, possible: this.rewriteAllowed('IntI', h + 1) };
        r.right = { type: 'Int', key: h, possible: this.rewriteAllowed('Int', h) };
    }
    // Return the best match in a permissive way
    if (!r.left.possible && !r.right.possible) return null;
    if (r.left.possible && r.right.possible) return (drag.direction[1] > 0 ? r.right : r.left);
    if (r.left.possible) return r.left;
    return r.right;
}

/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {

}
*/