"use strict";

/*
    NCell class
*/

/*
    Creates an N-Cell of type 'id' whose location in a diagram is specified by coordinate
    This is to allow uniform treatment of interchangers and other cells
*/
function NCell(id, coordinates, key) {

    this.id = id;
    this.coordinates = coordinates;
    this.key = key;
};

NCell.prototype.getType = function() {
    return 'NCell';
}

NCell.prototype.copy = function() {
    /*
    var temp_array = new Array();
    for (var i = 0; i < this.coordinates.length; i++) {
        temp_array[i] = this.coordinates[i];
    }
    return new NCell(this.id, temp_array);
    */
    return new NCell(this.id, this.coordinates.slice(), (this.key == undefined ? undefined : this.key.slice()));
}

NCell.prototype.isInterchanger = function() {
    return this.id.is_interchanger();
}

NCell.prototype.source_size = function() {
    if (this.id.substr(0, 3) === 'Int') {
        console.log("Interchanger not in the signature");
    } else {
        return gProject.signature.getGenerator(this.id).source.cells.length;
    }
}

NCell.prototype.target_size = function() {
    if (this.id.substr(0, 3) === 'Int') {
        console.log("Interchanger not in the signature");
    } else {
        return gProject.signature.getGenerator(this.id).target.cells.length;
    }
}

NCell.prototype.move = function(instructions) {
    if (this.key != undefined) this.key.move(instructions);
    if (this.coordinates != null) this.coordinates.move(instructions);
    return this;
}

NCell.prototype.pad = function(coordinates) {
    if (this.key != null) {
        for (var i=0; i<this.key.length; i++) {
            this.key[i] += coordinates[i];
        }
    }
    if (this.coordinates != null) {
        for (var i=0; i<this.coordinates.length; i++) {
            this.coordinates[i] += coordinates[i];
        }
    }
}