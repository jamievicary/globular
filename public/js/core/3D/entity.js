class AbstractEntity {

    get height() {
        return this.inclusion.length == 0 ? 0 : this.inclusion[this.inclusion.length - 1];
    }

    getSourceBox() {
        let box = this.source.getBox();
        box = box.move(this.inclusion);
        return box;
    }

    getTargetBox() {
        let box = this.target.getBox();
        box = box.move(this.inclusion);
        return box;
    }

}

class Entity extends AbstractEntity {

    constructor(inclusion, source, target, meta) {
        super();
        this.inclusion = inclusion;
        this.source = source;
        this.target = target;
        this.meta = meta;

        if (source !== null && inclusion.length != source.dimension) debugger;

        if (this.source !== null && this.target.dimension != this.source.dimension) {
            throw new Error("Dimensions of an entity's source and target must agree.");
        }

        this.inclusion.forEach(i => { if (i < 0) debugger; });
    }

    get dimension() {
        return this.source === null ? 0 : this.source.dimension + 1;
    }

    static of(diagram, level, dimension) {
        let cell = diagram.cells[level];
        let meta = getMeta(diagram, level);
        let inclusion = Box.sourceOf(diagram, level).min;
        inclusion = inclusion.slice(inclusion.length - dimension + 1);

        let { source, target } = getBoundaryDiagrams(diagram, level);
        source = dimension > 0 ? Scaffold.of(source, dimension - 1) : null;
        target = dimension > 0 ? Scaffold.of(target, dimension - 1) : null;

        return new Entity(inclusion, source, target, meta);
    }

    rewriteHalf(scaffold) {
        // Is interchanger entity?
        if (this.meta.interchange > 0 && scaffold.dimension == 2) {
            let inverse = this.meta.interchange == 2;

            let bottom = scaffold.entities[this.height];
            let top = scaffold.entities[this.height + 1];

            if (inverse) {
                let diff = bottom.source.size - bottom.target.size;
                top = top.pad([diff]);
            }

            bottom = bottom.pad(this.inclusion.slice(0, -1).map(x => -x));
            top = top.pad(this.inclusion.slice(0, -1).map(x => -x));

            let inclusion = Array(this.dimension - 2).fill(0);
            let entity = ParallelEntity.of(inclusion, top, bottom, this.meta);
            return scaffold.splice(this.inclusion, this.source.size, entity);
        }


        let entity = this.collapse();
        // Splice the entity into the scaffold
        return scaffold.splice(this.inclusion, this.source.size, entity);
    }

    collapse() {
        let inclusion = [];
        let source = null;
        let target = null;

        if (this.source.dimension > 0) {
            source = this.source.source;
            target = this.source.target;
            inclusion = Array(source.dimension).fill(0);
        }
        
        return new Entity(inclusion, source, target, this.meta);
    }

    pad(vector) {
        let inclusion = padArray(this.inclusion, vector);
        return new Entity(inclusion, this.source, this.target, this.meta);
    }

    toScaffold() {
        let inclusion = Array(this.source.dimension).fill(0);
        let entity = new Entity(inclusion, this.source, this.target, this.meta);
        return new Scaffold(this.source, [entity]);
    }

    toNormal() {
        return this;
    }

}

class ParallelEntity extends AbstractEntity {

    constructor(inclusion, left, right, source, target, meta) {
        super();
        this.inclusion = inclusion;
        this.left = left;
        this.right = right;
        this.source = source;
        this.target = target;
        this.meta = meta;

        this.inclusion.forEach(i => { if (i < 0) debugger; });

        if (this.inclusion.length != this.source.dimension) debugger;
    }

    static of(inclusion, entityA, entityB, meta) {
        // Sort by height
        let swap = entityA.height > entityB.height;
        let left = swap ? entityB : entityA;
        let right = swap ? entityA : entityB;

        // Make source and target scaffolds
        let sourceEntities = left.source.entities.concat(right.source.entities);
        let targetEntities = left.target.entities.concat(right.target.entities);

        let source = new Scaffold(left.source.source, sourceEntities);
        let target = new Scaffold(left.target.source, targetEntities);

        return new ParallelEntity(inclusion, left, right, source, target, meta);
    }

    get dimension() {
        return this.source.dimension + 1;
    }

    pad(vector) {
        let inclusion = padArray(this.inclusion, vector);
        return new ParallelEntity(inclusion, this.left, this.right, this.source, this.target, this.meta);
    }

    rewriteHalf(scaffold) {
        return scaffold.splice(this.inclusion, this.source.size, this.left.collapse(), this.right.collapse());
    }

    toScaffold() {
        let inclusion = Array(this.source.dimension).fill(0);
        let entity = new ParallelEntity(inclusion, this.left, this.right, this.source, this.target, this.meta);
        return new Scaffold(this.source, [entity]);
    }

    toNormal() {
        return new Entity(this.inclusion, this.source, this.target, this.meta);
    }

}

const padArray = (a, b) => {
    a = a.slice();
    for (let i = 0; i < b.length; i++) {
        a[a.length - i - 1] += b[b.length - i - 1];
    }
    return a;
}

class Box {

    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    get depth() {
        return this.min.length;
    }

    lift(span) {
        let min = this.min.concat([span.min]);
        let max = this.max.concat([span.max]);
        return new Box(min, max);
    }

    rest() {
        let min = this.min.slice(0, -1);
        let max = this.max.slice(0, -1);
        return new Box(min, max);
    }

    span() {
        let min = this.min.length > 0 ? this.min.last() : 0;
        let max = this.max.length > 0 ? this.max.last() : 0;
        return new Span(min, max);
    }

    move(vector, scale = 1) {
        if (vector.length != this.min.length) debugger;

        let min = this.min.slice();
        let max = this.max.slice();

        for (let i = 0; i < vector.length; i++) {
            min[min.length - i - 1] += scale * vector[vector.length - i - 1];
            max[max.length - i - 1] += scale * vector[vector.length - i - 1];
        }

        return new Box(min, max);
    }

    static sourceOf(diagram, level) {
        if (diagram.getDimension() == 0) {
            return Box.empty();
        }

        let { min, max } = diagram.getSlice(level).getBoundingBox(diagram.cells[level]);
        return new Box(min, max);
    }

    static targetOf(diagram, level) {
        debugger;
        if (diagram.getDimension() == 0) {
            return Box.empty();
        }

        let cell = diagram.cells[level];
        cell = diagram.getInverseCell(cell);
        let { min, max } = diagram.mirror(0).getBoundingBox(cell);
        return new Box(min, max);
    }

    static empty() {
        return new Box([], []);
    }

}

const getBoundaryDiagrams = (diagram, level) => {
    if (diagram.getDimension() == 0) {
        return { source: null, target: null };
    }

    let cell = diagram.cells[level];
    if (cell.id.is_interchanger()) {
        if (cell.id == "IntI0-L") debugger;
        let sourceBox = Box.sourceOf(diagram, level);
        let source = restrictDiagram(diagram.getSlice(level).copy(), sourceBox);
        let target = restrictDiagram(diagram.getSlice(level + 1).copy(), sourceBox);
        return { source, target };

    } else {
        let generator = gProject.signature.getGenerator(cell.id);
        let source = generator.source;
        let target = generator.target;
        return { source, target };
    }
}
 
const restrictDiagram = (diagram, box) => {
    if (diagram.dimension == 0) {
        return diagram;
    }

    let span = box.span();

    let source = restrictDiagram(diagram.getSlice(span.min).copy(), box.rest());
    let cells = diagram.cells.slice(span.min, span.max).map(cell => cell.copy());

    let slice = source.copy();

    for (let cell of cells) {
        cell.pad(box.rest().min.map(x => -x));
        cell.box = slice.getBoundingBox(cell);
        slice.rewrite(cell);
    }

    return new Diagram(source, cells);
}