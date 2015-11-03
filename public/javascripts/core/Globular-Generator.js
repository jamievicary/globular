"use strict";

/*
    Generator class
*/


// Creates a generator with a fresh id, and specific source and target, both source and target are of type Diagram
function Generator(source, target, id) {
    if (source === undefined) return;
    var n = 0;
    if (source != null) n = source.getDimension() + 1;
    if (id == undefined) id = globular_freshName(n);
    this.source = source;
    this.target = target;
    this.identifier = id;
};

Generator.prototype.getTargetColour = function() {
    var t = this.target;
    while (t.nCells.length == 0) {
        t = t.getTargetBoundary();
    }
    var id = t.nCells[0].id;
    var colour = gProject.getColour(id);
    return colour;
}

Generator.prototype.getDimension = function() {
    if (this.source === undefined) return 0;
    if (this.source == null) return 0;
    return this.source.getDimension() + 1;
}

Generator.prototype.getType = function () {
    return 'Generator';
}

Generator.prototype.copy = function () {
    var newSource = null;
    var newTarget = null;
    if (this.source != null) {
        newSource = this.source.copy();
    }
    if (this.target != null) {
        newTarget = this.target.copy();
    }
    var generator = new Generator(newSource, newTarget, this.identifier);
    return generator;
};