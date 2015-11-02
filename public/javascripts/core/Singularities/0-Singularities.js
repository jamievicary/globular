"use strict";

var SingularityFamilies = {};
var SingularityData = {};

function RegisterSingularityFamily(family, dimension, members) {
    for (var index in members) {
        if (!members.hasOwnProperty(index)) continue;
        SingularityFamilies[members[index]] = family;
    }
    SingularityData[family] = {
        dimension: dimension,
        rewriteAllowed: eval("rewriteAllowed_" + family),
        rewriteCutData: eval("rewriteCutData_", +family),
        rewritePasteData: eval("rewritePasteData_" + family),
        interpretDrag: eval("interpret_drag_" + family)
    };
}

Diagram.prototype.rewriteAllowed = function(type, key) {
    return SingularityData[SingularityFamilies[type]].rewriteAllowed(type, key);
}

Diagram.prototype.rewriteCutData = function(type, key) {
    return SingularityData[SingularityFamilies[type]].rewriteCutData(type, key);
}

Diagram.prototype.rewritePasteData = function(type, key) {
    return SingularityData[SingularityFamilies[type]].rewritePasteData(type, key);
}

Diagram.prototype.expand = function(type, start, n, m) {
    return SingularityData[SingularityFamilies[type]].expand(type, start, n, m);
}

Diagram.prototype.interpretDrag = function(drag) {
    
    // See what options we have
    var options = [];
    for (var index in SingularityData) {
        if (!SingularityData.hasOwnProperty(index)) continue;
        var data = SingularityData[index];
        
        // Don't bother testing if the dimension of the diagram is too low for this singularity type
        if (Diagram.getDimension() < data.dimension) continue;
        
        // If this is a possibility, add it
        var result = data.interpretDrag(drag);
        if (result != null) options.push(result);
    }
    
    if (options.length == 0) return null;
    
    // For now, just do the first option that's returned. We should really pop
    // up a selection box for the user if there's more than one choice.
    return options[0];
}

