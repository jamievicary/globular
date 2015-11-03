"use strict";
/*global RegisterSingularityFamily*/
/*global Diagram*/

// Data for the Int family
// This is the basic interchanger

var NewSingularityFamily = {family: 'Int', dimension: 3, members: ['Int', 'IntI']};

/*
Diagram.prototype.rewriteAllowed['Int'] = function(type, key) {
}

Diagram.prototype.rewriteCutData['Int'] = function(type, key) {
    var data = {};
}

Diagram.prototype.rewritePasteData['Int'] = function(type, key) {
}
*/

// Interpret drag of this type
Diagram.prototype.interpret_drag['Int'] = function(drag) {
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

/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {

}
*/

RegisterSingularityFamily(NewSingularityFamily);
