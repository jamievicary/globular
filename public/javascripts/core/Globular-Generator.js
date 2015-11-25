"use strict";

/*
    Generator class
*/


// Creates a generator with a fresh id, and specific source and target, both source and target are of type Diagram
function Generator(data) {
    if (data == undefined) return;
    if (data.source === undefined) debugger;
    var n = (data.source == null ? 0 : data.source.getDimension() + 1);
    if (data.id == undefined) data.id = globular_freshName(n);
    this.source = data.source;
    this.target = data.target;
    this.id = data.id;
    this.invertible = data.invertible;
    if (data.name == undefined) data.name = "Cell " + (gProject.signature.getAllCells().length + 1).toString();
    this.name = data.name;
    return this;
};

Generator.prototype.setDiagram = function(diagram) {
    this.diagram = diagram;
    this.diagram.ignore = true;
}

Generator.prototype.getDiagram = function() {
    var copy = this.diagram.copy();
    delete copy.ignore;
    return copy;
}

Generator.prototype.swapSourceTarget = function() {
    var temp = this.source;
    this.source = this.target;
    this.target = temp;
    return this;
}

Generator.prototype.getTargetColour = function() {
    var t = this.target;
    while (t.cells.length == 0) {
        t = t.getTargetBoundary();
    }
    var id = t.cells[0].id;
    var colour = gProject.getColour(id);
    return colour;
}

Generator.prototype.getDimension = function() {
    if (this.source === undefined) return 0;
    if (this.source == null) return 0;
    return this.source.getDimension() + 1;
}

Generator.prototype.getType = function() {
    return 'Generator';
}

Generator.prototype.copy = function() {
    var newSource = null;
    var newTarget = null;
    if (this.source != null) {
        newSource = this.source.copy();
    }
    if (this.target != null) {
        newTarget = this.target.copy();
    }
    var generator = new Generator({source: newSource, target: newTarget, id: this.id, name: this.name});
    return generator;
};

Generator.prototype.getBoundingBox = function() {
    var box = {
        min: [].fill(0, this.getDimension() - 1),
        max: this.getSourceLengths()
    };
    //box.max.push(1);
    return box;
}

Generator.prototype.getSourceLengths = function() {
    if (this.source == null) return [];
    return this.source.getLengthsAtSource();
}
