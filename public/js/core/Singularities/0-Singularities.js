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
    if (data.friendly == undefined) data.friendly = {};
    for (var index in data.members) {
        if (!data.members.hasOwnProperty(index)) continue;
        var member = data.members[index];
        SingularityFamilies[member] = data.family;
        if (data.friendly[member] == undefined) data.friendly[member] = member;
    }

    SingularityData[data.family] = {
        dimension: data.dimension,
        friendly: data.friendly
    };
    // Clean up friendly names

}

function GetSingularityFamily(type) {
    if (type.tail('-E', '-EI0')) return 'Inverses';
    if (gProject.signature.getGenerator(Globular.getBaseType(type))) return 'Signature';
    return SingularityFamilies[type];
}

Diagram.prototype.interchangerAllowed = function (type, key) {
    if (key.last() < 0) return false;
    if (key >= this.cells.length) return false;
    var family = GetSingularityFamily(type);
    return ((this.interchangerAllowed[family]).bind(this))(type, key);
}

Diagram.prototype.getSource = function (type, key) {
    var family = GetSingularityFamily(type);
    return ((this.getSource[family]).bind(this))(type, key);
}

Diagram.prototype.getTarget = function (type, key) {
    var family = GetSingularityFamily(type);
    return ((this.getTarget[family]).bind(this))(type, key);
}

Diagram.prototype.rewritePasteData = function (type, key) {
    var family = GetSingularityFamily(type);
    return ((this.rewritePasteData[family]).bind(this))(type, key);
}

Diagram.prototype.tidyKey = function (type, key) {
    var family = GetSingularityFamily(type);
    return ((this.tidyKey[family]).bind(this))(type, key);
}

Diagram.prototype.tidyKey.Signature = function (type, key) {
    return key;
}

/*
Diagram.prototype.expand = function (type, start, n, m) {
    var family = GetSingularityFamily(type);
    return ((this.expand[family]).bind(this))(type, start, n, m);
}
*/

Diagram.prototype.reorganiseCrossings = function (type, start, n, m) {
    var family = GetSingularityFamily(type);
    return ((this.reorganiseCrossings[family]).bind(this))(type, start, n, m);
}

Diagram.prototype.pseudoExpand = function (type, box, side_wires) {
    var family = GetSingularityFamily(type);
    return ((this.pseudoExpand[family]).bind(this))(box, side_wires);
}

Diagram.prototype.getInterchangerCoordinates = function (type, key) {
    var family = GetSingularityFamily(type);
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

Diagram.prototype.getInterchangerBoundingBox = function (type, key) {
    var family = GetSingularityFamily(type);
    var box = ((this.getInterchangerBoundingBox[family]).bind(this))(type, key);
    //box.ignore = true; // never export boxes to file
    box.ignore = false;
    return box;
}

Diagram.prototype.getInverseKey = function (type, key) {
    var family = GetSingularityFamily(type);
    if (family == 'Signature') return key;
    return ((this.getInverseKey[family]).bind(this))(type, key);
}

/*
Diagram.prototype.interpretDrag = function (drag, boundary_type) {
    if (drag.directions == null) return this.interpretClickInverses(drag, boundary_type);
    let drag_content = this.drag(drag.coordinates, drag.directions);
    if (!drag_content) return [];
    return drag_content;
}
*/

Diagram.prototype.getDragOptions = function (list, key) {
    var options = [];
    for (var i = 0; i < list.length; i++) {
        var type = list[i];
        options.push({
            id: type,
            key: key.slice(),
            possible: this.interchangerAllowed(type, key)
        });
    }
    return options;
}

Diagram.prototype.instructionsEquiv = function (list1, list2) {
    if (list1.length != list2.length) return false;
    for (var i = 0; i < list1.length; i++) {
        if (!this.nCellEquiv(list1[i], list2[i])) {
            return false;
        }
    }
    return true;
}

Diagram.prototype.nCellEquiv = function (cell_one, cell_two) {
    if (cell_one.id != cell_two.id) return false;
    if (cell_one.key.length != cell_two.key.length) return false;
    for (var i = 0; i < cell_one.key.length; i++) {
        if (cell_one.key[i] != cell_two.key[i]) return false;
    }
    return true;
}

// Compare the list to a subset of the diagram
Diagram.prototype.subinstructions = function (diagram_key, instructions) {

    var diagram_key_cell = this.cells[diagram_key.last()];
    var instructions_key_cell = instructions.list[instructions.key];

    if (diagram_key_cell.key.length != instructions_key_cell.key.length) return false;
    var offset_array = zero_array(this.dimension);

    for (var i = 0; i < diagram_key_cell.key.length; i++) {
        offset_array[i] = diagram_key_cell.key[i] - instructions_key_cell.key[i];
    }

    // Check the instructions match
    for (var i = 0; i < instructions.list.length; i++) {
        var list_cell = instructions.list[i];
        var diagram_cell = this.cells[i + diagram_key.last() - instructions.key];

        if (diagram_cell === undefined) return false;

        // Is it the right thing?
        if (list_cell.id != diagram_cell.id) return false;

        // Is it at the right position?
        for (var j = 0; j < diagram_cell.key.length; j++) {
            if (diagram_cell.key[j] != list_cell.key[j] + offset_array[j]) return false;
        }
    }

    return true;
}

Diagram.prototype.source_size = function (level) {
    var bbox = this.getSliceBoundingBox(level);
    return bbox.max.last() - bbox.min.last();
};

Diagram.prototype.target_size = function (level) {
    var nCell = this.cells[level];
    if (nCell.id.is_interchanger()) {
        return this.getSlice(level).rewritePasteData(nCell.id, nCell.key).length;
    } else {
        return nCell.target_size();
    }
};
