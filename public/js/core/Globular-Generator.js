"use strict";

class Generator {
    constructor(data) {
        this['_t'] = 'Generator';
        if (!data) return;
        if (data == undefined) return;
        this.n = (data.source == null ? 0 : data.source.n + 1);
        if (data.id == undefined) data.id = gProject.freshName(this.n);
        this.source = (data.source == null ? null : data.source.copy());
        this.target = (data.target == null ? null : data.target.copy());
        if (this.source != null) this.source.clearAllSliceCaches();
        if (this.target != null) this.target.clearAllSliceCaches();
        this.id = data.id;
        this.invertible = data.invertible;
        this.separate_source_target = data.separate_source_target;
        if (data.name == undefined) data.name = "Cell " + (gProject.signature.getAllCells().length + 1).toString();
        this.name = data.name;
        if (!data.single_thumbnail) data.single_thumbnail = (this.n <= 2);
        this.single_thumbnail = data.single_thumbnail;

        return this;
    }
    prepare() {
        if (this.source != null) {
            this.source.prepare();
            this.source.clearAllSliceCaches();
        }
        if (this.target != null) {
            this.target.prepare();
            this.target.clearAllSliceCaches();
        }
        // We don't hold diagram objects any more
        if (this.diagram != undefined)
            delete this.diagram;
    }
    getDiagram() {
        if (!this.source) return new Diagram(0, { t: 0, type: this });
        let source = this.source.copy();
        let t = source.t + 1;
        let forward_limit = this.source.contractForwardLimit(this);
        let singular_height = forward_limit.rewrite(this.source.copy());
        let backward_limit = singular_height.contractBackwardLimit(this.id, null, this.target);
        let data = [new Content(this.n - 1, forward_limit, backward_limit)];
        return new Diagram(source.n + 1, {t, source, data});
    }
    getSource() {
        return (this.source == null ? null : this.source.copy());
    }
    getTarget() {
        return (this.target == null ? null : this.target.copy());
    }
    // Mirror a generator
    mirror(n) {
        if (n == 0) {
            var temp = this.source;
            this.source = this.target;
            this.target = temp;
        }
        else if (n == 1) {
            this.source = this.source.mirror(0);
            this.target = this.target.mirror(0);
        }
        return this;
    }
    swapSourceTarget() {
        return this;
    }
    getTargetColour() {
        var t = this.target;
        while (t.data.length == 0) {
            t = t.getTargetBoundary();
        }
        var id = t.data[0].id;
        var colour = gProject.getColour(id);
        return colour;
    }
    getType() {
        return 'Generator';
    }
    copy() {
        var newSource = null;
        var newTarget = null;
        if (this.source != null) {
            newSource = this.source.copy();
        }
        if (this.target != null) {
            newTarget = this.target.copy();
        }
        return new Generator({ source: newSource, target: newTarget, id: this.id, name: this.name });
    }
    getBoundingBox() {
        var box = {
            min: Array(Math.max(0, this.n - 1)).fill(0),
            max: this.getSourceLengths()
        };
        //box.max.push(1);
        return box;
    }
    getSourceLengths() {
        if (this.source == null)
            return [];
        return this.source.getLengthsAtSource();
    }
    usesCell(generator) {
        // Generators can only use cells which have a lower dimension
        if (generator.n >= this.n)
            return false;
        // The generator uses the specified cell iff the source or target uses it
        if (this.source != null) {
            var source_uses = this.source.usesCell(generator);
            this.source.clearAllSliceCaches();
            if (source_uses)
                return true;
            var target_uses = this.target.usesCell(generator);
            this.target.clearAllSliceCaches();
            if (target_uses)
                return true;
        }
        return false;
    }
    flippable() {
        return (this.name.indexOf('*1') > -1);
    }
    is_basic_interchanger() {
        return false;
    }
}













