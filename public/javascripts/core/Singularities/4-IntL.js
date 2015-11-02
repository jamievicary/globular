"use strict";

/*global RegisterSingularityFamily*/
/*global Diagram*/

// Data for the IntL family of singularities
// These are 4-cell pull-throughs

RegisterSingularityFamily(
    'IntL', 4,
    ['Int-L', 'Int-LI', 'IntI-L', 'IntI-LI',
    'Int-R', 'Int-RI', 'IntI-R', 'IntI-RI']
);
    
// Interpret drag of this type
Diagram.prototype.interpret_drag_IntL = function(drag) {
    
    var up = drag.direction[0] > 0;
    var right = drag.direction[1] > 0;
    var key = drag.position[0];

    
    var options = [];
    if (up) {
        options.push({ type: 'Int-L', key: key, possible: this.rewriteAllowed_IntL('Int-L', key) });
        options.push({ type: 'IntI-L', key: key, possible: this.rewriteAllowed_IntL('IntI-L', key) });
        options.push({ type: 'Int-R', key: key, possible: this.rewriteAllowed_IntL('Int-R', key) });
        options.push({ type: 'IntI-R', key: key, possible: this.rewriteAllowed_IntL('IntI-R', key) });
    } else {
        options.push({ type: 'Int-L', key: key, possible: this.rewriteAllowed_IntL('Int-L', key) });
        options.push({ type: 'IntI-L', key: key, possible: this.rewriteAllowed_IntL('IntI-L', key) });
        options.push({ type: 'Int-R', key: key, possible: this.rewriteAllowed_IntL('Int-R', key) });
        options.push({ type: 'IntI-R', key: key, possible: this.rewriteAllowed_IntL('IntI-R', key) });
    }
    // blah
};

/*    
Diagram.prototype.rewriteAllowed_IntL = function(type, key) {
}
*/

/*
Diagram.prototype.rewriteCutData_IntL = function(type, key) {
}
*/

/*
Diagram.prototype.rewritePasteData_IntL = function(type, key) {
}
*/


/*
Diagram.prototype.expand_IntL(type, start, n, m) {
}
*/