"use strict";

/*
    Generator class
*/


// Creates a generator with a fresh id, and specific source and target, both source and target are of type Diagram
function Generator(data) {
    this['_t'] = 'Generator';
    if (data == undefined) return;
    if (data.source === undefined) debugger;
    var n = (data.source == null ? 0 : data.source.getDimension() + 1);
    if (data.id == undefined) data.id = globular_freshName(n);
    this.source = (data.source == null ? null : data.source.copy());
    this.target = (data.target == null ? null : data.target.copy());
    if (this.source != null) this.source.clearAllSliceCaches();
    if (this.target != null) this.target.clearAllSliceCaches();
    this.id = data.id;
    this.invertible = data.invertible;
    this.separate_source_target = data.separate_source_target;
    if (data.name == undefined) data.name = "Cell " + (gProject.signature.getAllCells().length + 1).toString();
    this.name = data.name;
    if (data.single_thumbnail == undefined) data.single_thumbnail = (this.getDimension() <= 2);
    this.single_thumbnail = data.single_thumbnail;
    return this;
};

Generator.prototype.prepare = function() {
    if (this.source != null) {
        this.source.prepare();
        this.source.clearAllSliceCaches();
    }
    if (this.target != null) {
        this.target.prepare();
        this.target.clearAllSliceCaches();
    }
    
    // We don't hold diagram objects any more
    if (this.diagram != undefined) delete this.diagram;
}

Generator.prototype.getDiagram = function() {
    var key = [].fill(0, this.source == null ? 0 : this.source.getDimension());
    return new Diagram(this.source == null ? null : this.source.copy(), [new NCell({id: this.id, key: key.slice(), box: this.getBoundingBox()})]);
}

Generator.prototype.getSource = function() {
    return (this.source == null ? null : this.source.copy());
}

Generator.prototype.getTarget = function() {
    return (this.target == null ? null : this.target.copy());
}

// Mirror a generator
Generator.prototype.mirror = function(n) {
    if (n == 0) {
        var temp = this.source;
        this.source = this.target;
        this.target = temp;
    } else if (n == 1) {
        this.source = this.source.mirror(0);
        this.target = this.target.mirror(0);
    }
    return this;
}

Generator.prototype.swapSourceTarget = function() {
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
    return new Generator({source: newSource, target: newTarget, id: this.id, name: this.name});
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

Generator.prototype.usesCell = function(generator) {
    
    // Generators can only use cells which have a lower dimension
    if (generator.getDimension() >= this.getDimension()) return false;
    
    // The generator uses the specified cell iff the source or target uses it
    if (this.source != null) {
        var source_uses = this.source.usesCell(generator);
        this.source.clearAllSliceCaches();
        if (source_uses) return true;

        var target_uses = this.target.usesCell(generator);
        this.target.clearAllSliceCaches();
        if (target_uses) return true;
    }
    return false;
}

Generator.prototype.flippable = function() {
    return (this.name.indexOf('^1') > -1);
}