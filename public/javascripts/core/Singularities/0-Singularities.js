"use strict";

/*global Diagram*/

/* Core functions for each singularity
Diagram.prototype.interchangerAllowed(type, key)
Diagram.prototype.rewritePasteData(type, key)
Diagram.prototype.expand(type, height, n, m)
Diagram.prototype.interpretDrag(drag)
Diagram.prototype.getInterchangerCoordinates(type, key)
Diagram.prototype.getInterchangerBoundingBox(type, key)
Diagram.prototype.getInverseKey(type, key)
*/

var SingularityFamilies = {};
var SingularityData = {};

function RegisterSingularityFamily(data) {
    for (var index in data.members) {
        if (!data.members.hasOwnProperty(index)) continue;
        SingularityFamilies[data.members[index]] = data.family;
    }
    SingularityData[data.family] = {
        dimension: data.dimension
        /*
        ,
        rewriteAllowed: eval("rewriteAllowed_" + data.family),
        rewriteCutData: eval("rewriteCutData_", + data.family),
        rewritePasteData: eval("rewritePasteData_" + data.family),
        interpretDrag: eval("interpret_drag_" + data.family)
        */
    };
}

Diagram.prototype.interchangerAllowed = function(type, key) {
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;
    return ((this.interchangerAllowed[family]).bind(this))(type, key);
}

Diagram.prototype.rewritePasteData = function(type, key) {
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;
    return ((this.rewritePasteData[family]).bind(this))(type, key);
}

Diagram.prototype.expand = function(type, start, n, m) {
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;
    return ((this.expand[family]).bind(this))(type, start, n, m);
}

Diagram.prototype.getInterchangerCoordinates = function(type, key) {
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;
    return ((this.getInterchangerCoordinates[family]).bind(this))(type, key);
}

Diagram.prototype.getInterchangerBoundingBox = function(type, key) {
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;
    return ((this.getInterchangerBoundingBox[family]).bind(this))(type, key);
}

Diagram.prototype.getInverseKey = function(type, key) {
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;
    return ((this.getInverseKey[family]).bind(this))(type, key);
}

Diagram.prototype.interpretDrag = function(drag) {
    
    // See what options we have
    var options = [];
    for (var family in SingularityData) {
        if (!SingularityData.hasOwnProperty(family)) continue;
        var data = SingularityData[family];
        
        // Don't bother testing if the dimension of the diagram is too low for this singularity type
        if (this.getDimension() < data.dimension - 1) continue;
        
        // See if this family can interpret the drag
        var r = ((this.interpretDrag[family]).bind(this))(drag);
        
        // If so, add it to the list of options
        if (r != null) options.push(r);
    }
    
    return options;
}

Diagram.prototype.instructionsEquiv = function(list1, list2) {

    if(list1.length != list2.length) return false;

    for (var i = 0; i < list1.length; i++) {
        if (!this.nCellEquiv(list1[i], list2[i])) {
            return false;
        }
    }
    return true;
}

Diagram.prototype.nCellEquiv = function(cell_one, cell_two) {

    if (cell_one.id != cell_two.id) return false;
    if (cell_one.key.length != cell_two.key.length) return false;
    
    for (var i = 0; i < cell_one.key.length; i++) {
        if (cell_one.key[i] != cell_two.key[i]) return false;
    }
    return true;
}

