"use strict";

/*
    Some auxiliary functions
*/

// Quick way to return a random alphanumeric string of length ~10
function globular_freshName(n) {
    return n.toString() + '-' + Math.random().toString(36).slice(2);
    
    /*
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }();
    */
}