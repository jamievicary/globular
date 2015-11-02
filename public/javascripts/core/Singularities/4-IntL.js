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
        options.push({ type: 'IntI-R', key: key, possible: this.rewriteAllowed_IntL('IntI-R', key) });
        options.push({ type: 'Int-R', key: key, possible: this.rewriteAllowed_IntL('Int-R', key) });
    } else {
        options.push({ type: 'Int-R', key: key, possible: this.rewriteAllowed_IntL('Int-RI', key) });
        options.push({ type: 'IntI-R', key: key, possible: this.rewriteAllowed_IntL('IntI-RI', key) });
        options.push({ type: 'Int-L', key: key, possible: this.rewriteAllowed_IntL('Int-LI', key) });
        options.push({ type: 'IntI-L', key: key, possible: this.rewriteAllowed_IntL('IntI-LI', key) });
    }
    
    // Collect the possible options
    var possible_options = [];
    for (var i=0; i<options.length; i++) {
        if (options[i].possible) possible_options.push(options[i]);
    }
    
    // Maybe it's already determined what to do
    if (possible_options.length == 0) return null;
    if (possible_options.length == 1) return possible_options[0];
    
    // Otherwise select based on secondary direction
    if (right) {
        var r1 = options[0];
        var r2 = options[1];
        if (r1.possible && r2.possible) return r1; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return r1;
        if (!r1.possible && r2.possible) return r2;
        if (options[2].possible) return options[2];
        return options[3];
    } else {
        var r1 = options[2];
        var r2 = options[3];
        if (r1.possible && r2.possible) return r1; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return r1;
        if (!r1.possible && r2.possible) return r2;
        if (options[0].possible) return options[0];
        return options[1];
    }
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