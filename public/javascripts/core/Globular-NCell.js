"use strict";

/*
    NCell class
*/

/*
    Creates an N-Cell of type 'id' whose location in a diagram is specified by coordinate
    This is to allow uniform treatment of interchangers and other cells
*/
function NCell(data) {
    if (data == null) return;
    this.id = data.id;
    this.key = data.key.slice();
    this.box = (data.box == undefined ? undefined : {min: data.box.min.slice(), max: data.box.max.slice()});
};

NCell.prototype.equals = function(c2) {
    var c1 = this;
    if (c1.id != c2.id) return false;
    if (!c1.key.vector_equals(c2.key)) return false;
    return true;
}

NCell.prototype.getType = function() {
    return 'NCell';
}

NCell.prototype.copy = function() {
    return new NCell({
        id: this.id,
        key: this.key.slice(),
        box: (this.box == null ? null : {
            min: this.box.min.slice(),
            max: this.box.max.slice()
        })
    });
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
    this.key.move(instructions);
    this.box = null;
    return this;
}

NCell.prototype.pad = function(position) {
    if (this.key != null) {
        for (var i = 0; i < this.key.length; i++) {
            this.key[i] += position[i];
        }
    }
    if (this.slices != null) {
        for (var i = 0; i < this.slices.length; i++) {
            this.slices[i] += slices[i];
        }
    }
}
