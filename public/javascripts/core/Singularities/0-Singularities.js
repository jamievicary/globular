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
    //  try {
    if (key.last() < 0) return false;
    if (key >= this.nCells.length) return false;
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;
    return ((this.interchangerAllowed[family]).bind(this))(type, key);
    //    } catch (e) {
    //        return false;
    //    }
}

Diagram.prototype.wellSeparated = function(type, key) {
    var family = SingularityFamilies[type];
    return ((this.getSource[family]).bind(this))(type, key);
}

Diagram.prototype.getSource = function(type, key) {
    var family = SingularityFamilies[type];
    return ((this.getSource[family]).bind(this))(type, key);
}

Diagram.prototype.getTarget = function(type, key) {
    var family = SingularityFamilies[type];
    return ((this.getTarget[family]).bind(this))(type, key);
}

Diagram.prototype.rewritePasteData = function(type, key) {
    var family = SingularityFamilies[type];
    return ((this.rewritePasteData[family]).bind(this))(type, key);
}

Diagram.prototype.expand = function(type, start, n, m) {
    var family = SingularityFamilies[type];
    return ((this.expand[family]).bind(this))(type, start, n, m);
}

Diagram.prototype.getInterchangerCoordinates = function(type, key) {
    var family = SingularityFamilies[type];
    if (family === undefined) throw 0;

    // Call specialized code to get the coordinates of the interchanger
    var r = ((this.getInterchangerCoordinates[family]).bind(this))(type, key);

    // If the type is not possible, return null
    if (r == null) return null;

    // If any of the coordinates are negative, return null, as this means
    // the interchanger cannot apply here
    if (r.indexOf(-1) >= 0) return null;

    // Otherwise, return the coordinates we have calculated
    return r;
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

    var options = [];
    for (var family in SingularityData) {
        if (!SingularityData.hasOwnProperty(family)) continue;

        // Get the data for this singularity family
        var data = SingularityData[family];

        // Don't bother testing if the dimension of the diagram is too low for this singularity type
        if (this.getDimension() < data.dimension - 1) continue;

        // See if this family can interpret the drag
        var r = ((this.interpretDrag[family]).bind(this))(drag);

        // If so, add it to the list of options
        if (r != null) options.push(r);
    }

    //    return [];
    return options;
}

Diagram.prototype.getDragOptions = function(list, key) {
    var options = [];
    for (var i = 0; i < list.length; i++) {
        var type = list[i];
        options.push({
            type: type,
            key: key,
            possible: this.interchangerAllowed(type, key)
        });
    }
    return options;
}

Diagram.prototype.instructionsEquiv = function(list1, list2) {
    if (list1.length != list2.length) return false;
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

// Compare the list to a subset of the diagram
Diagram.prototype.subinstructions = function(diagram_key, instructions) {
    var diagram_key_cell = this.nCells[diagram_key].coordinates;
    var instructions_key_cell = instructions.list[instructions.key];
    if (diagram_key_cell.coordinates.length != instructions_key_cell.length) return false;
    var offset_array = [];
    for (var i = 0; i < diagram_key_cell.coordinates.length; i++) {
        var offset_array = diagram_key_cell.coordinates[i] - instructions_key_cell.coordinates[i];
    }

    for (var i = 0; i < instructions.list.length; i++) {
        var list_cell = instructions.list[i];
        var diagram_cell = this.nCells[i + diagram_key - instructions.key];
        var diagram_coord;
        var list_coord;
        if (list_cell.id.isInterchanger()) {
            diagram_coord = diagram_cell.key;
            list_coord = list_cell.key;
        } else {
            diagram_coord = diagram_cell.coordinates;
            list_coord = list_cell.coordinates;
        }

        // Is it the right thing?
        if (list_cell.id != diagram_cell.id) return false;

        // Is it at the right position?
        for (var j = 0; j < offset_array.length; j++) {
            if (diagram_coord[j] != list_coord[j] + offset_array[j]) return false;
        }
    }

    return true;
}

Diagram.prototype.reorganiseCrossings = {};

Diagram.prototype.source_size = function(level) {
    var bbox = this.getSliceBoundingBox(level);
    return bbox.max.last() - bbox.min.last();
    /*
    var nCell = this.nCells[level];
    if(nCell.id.substr(0, 3) === 'Int'){
        return this.getSlice(level).getInterchangerBoundingBox(nCell.id, nCell.key).last();
    }
    else{
        return nCell.source_size();
    }
    */
};

Diagram.prototype.target_size = function(level) {
    var nCell = this.nCells[level];
    if (nCell.id.substr(0, 3) === 'Int') {
        return this.getSlice(level).atomicInterchangerTarget(nCell.id, nCell.key).length;
    } else {
        return nCell.target_size();
    }
};
