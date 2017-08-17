class Entity {

    static of(diagram, level, dimension) {
        let cell = diagram.cells[level];
        let meta = getMeta(diagram, level);

        let { source, target } = getBoundaryDiagrams(diagram, level);
        source = dimension > 0 ? Scaffold.of(source, dimension - 1) : null;
        target = dimension > 0 ? Scaffold.of(target, dimension - 1) : null;

        let embedding = Embedding.of(diagram, level, dimension);

        if (dimension >= 3 && meta.interchange > 0) {
            let forward = meta.interchange == 1;
            return new InterchangerEntity(embedding, source, target, forward, meta);
        }  else {
            return new ConeEntity(embedding, source, target, meta);
        }
    }

    constructor(embedding, source, target, meta) {
        this.embedding = embedding;
        this.source = source;
        this.target = target;
        this.meta = meta;
    }

    get dimension() {
        return this.source === null ? 0 : this.source.dimension + 1;
    }

    halfSpliceData() {
        throw new Error("Entity must implement halfSpliceData.");
    }

    pad(positive, negative) {
        throw new Error("Entity must implement pad.");
    }

}

/**
 * Entity that forms a cone over its source and target diagrams.
 *
 * For a half rewrite, the source is replaced by a single entity that represents
 * the cusp of the cone. On points, this entity acts by a `ConeAction` that moves
 * the points of the source or target to the cone's cusp.
 */
class ConeEntity extends Entity {

    constructor(embedding, source, target, meta) {
        super(embedding, source, target, meta);
    }

    halfSpliceData() {
        let embedding = this.embedding.rest();
        let source = this.source.source;
        let target = this.source.target;
        let entity = new ConeEntity(embedding, source, target, this.meta);
        return [entity];
    }

    pad(positive, negative = null) {
        let embedding = this.embedding.pad(positive, negative);
        return new ConeEntity(embedding, this.source, this.target, this.meta);
    }

    sourceAction() {
        return new ConeAction(this.embedding, this.source);
    }

    targetAction() {
        return new ConeAction(this.embedding, this.target);
    }

}

/**
 * Entity that swaps the height of two entities, corresponding to a type I
 * homotopy generator.
 *
 * For a half rewrite, a parallel entity is generated that combines both
 * interchanged entities on one level. On points, this entity acts by a
 * `InterchangerAction`.
 *
 * Interchanger entities can be oriented forwards or backwards: In forwards
 * orientation, the lower entity is located to the right of the upper in the
 * 2-projection of the source slice, and vice versa in the backwards
 * orientation. In forwards orientation, the entity produces a parallel entity
 * in swap mode on the half slice.
 */
class InterchangerEntity extends Entity {

    constructor(embedding, source, target, forward, meta) {
        super(embedding, source, target, meta);
        this.forward = forward;

        if (this.dimension < 3) {
            throw new Error("Interchanger entities must have at least dimension 3.");
        }
    }

    halfSpliceData() {
        let lower = this.source.entities[0];
        let upper = this.source.entities[1];
        let entity = ParallelEntity.make(lower, upper, this.forward, this.meta);
        return [entity];
    }

    pad(positive, negative = null) {
        let embedding = this.embedding.pad(positive, negative);
        return new InterchangerEntity(embedding, this.source, this.target, this.forward, this.meta);
    }

    sourceAction() {
        return new InterchangerAction(this.embedding, this.source, this.forward);
    }

    targetAction() {
        return new InterchangerAction(this.embedding, this.target, !this.forward);
    }

}

/**
 * Entity that combines two entities on one level, provided they act on disjoint
 * source and target diagrams. The two entities must have had no intervening
 * entities in between them.
 *
 * A parallel entity has two modes: In swap mode, the left entity has been above
 * the right one, while in normal mode it has been below. This is important for
 * adjusting the embeddings accordingly in face of varying source and target sizes.
 */
class ParallelEntity extends Entity {

    static make(lower, upper, swap, meta) {
        let left = !swap ? lower : upper;
        let right = !swap ? upper : lower;

        // Create source scaffold by concatenating sources
        let sourceEntities = left.source.entities.concat(right.source.entities);
        let source = new Scaffold(left.source.source, sourceEntities);

        // Create target scaffold by concatenating targets
        let targetEntities = left.target.entities.concat(right.target.entities);
        let target = new Scaffold(left.target.source, targetEntities);

        let embedding = left.embedding;

        return new ParallelEntity(embedding, left, right, source, target, swap, meta);
    }

    constructor(embedding, left, right, source, target, swap, meta) {
        super(embedding, source, target, meta);
        this.left = left;
        this.right = right;
        this.swap = swap;
    }

    halfSpliceData() {
        let left = this.left.halfSpliceData();
        let right = this.right.halfSpliceData();
        return left.concat(right);
    }

    pad(positive, negative = null) {
        return new ParallelEntity(
            this.embedding.pad(by),
            this.lower.pad(positive, negative),
            this.upper.pad(positive, negative),
            this.source, this.target,
            this.swap,
            this.meta
        );
    }

    sourceAction() {
        let left = this.left;
        let right = this.right;

        if (!this.swap) {
            right = right.pad(left.source.getBox().max, left.target.getBox().max);
        }

        return new ParallelAction(left.sourceAction(), right.sourceAction());
    }

    targetAction() {
        let left = this.left;
        let right = this.right;

        if (this.swap) {
            right = right.pad(left.target.getBox().max, left.source.getBox().max);
        }

        return new ParallelAction(left.targetAction(), right.targetAction());
    }

}

class Embedding {

    constructor(heights) {
        this.heights = heights;
    }

    height() {
        return this.heights.length == 0 ? 0 : this.heights[this.heights.length - 1];
    }

    rest() {
        return new Embedding(this.heights.slice(0, -1));
    }

    pad(positive, negative = null) {
        positive = positive instanceof Embedding ? positive.heights : positive;
        negative = negative instanceof Embedding ? negative.heights : negative;

        let heights = this.heights.slice();
        for (let i = 0; i < positive.length; i++) {
            let diff = positive[positive.length - i - 1];

            if (negative != null) {
                diff -= negative[negative.length - i - 1];
            }

            heights[heights.length - i - 1] += diff;
        }
        return new Embedding(heights);
    }

    static of(diagram, level, dimension) {
        let heights = Box.sourceOf(diagram, level).min;
        heights = heights.slice(heights.length - dimension + 1);
        return new Embedding(heights);
    }

    static corner(dimension) {
        return new Embedding(Array(dimension).fill(0));
    }

}

class Box {

    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    /**
     * Add a span to this box's end.
     *
     * @param {Span} span The span to add.
     * @return {Box} The lifted box.
     */
    lift(span) {
        let min = this.min.concat([span.min]);
        let max = this.max.concat([span.max]);
        return new Box(min, max);
    }

    /**
     * Remove one span from this box's end.
     *
     * @return {Box} The rest of the box.
     */
    rest() {
        let min = this.min.slice(0, -1);
        let max = this.max.slice(0, -1);
        return new Box(min, max);
    }

    /**
     * Obtain the topmost span of this box.
     *
     * @return {Span}
     */
    span() {
        let min = this.min.length > 0 ? this.min.last() : 0;
        let max = this.max.length > 0 ? this.max.last() : 0;
        return new Span(min, max);
    }

    /**
     * Move the box by the specified vector, beginning from the end.
     * The vector can be shorter than the box.
     *
     * @param {int[]} vector Amount to move the box.
     * @return {Box} The moved box.
     */
    move(vector) {
        let min = this.min.slice();
        let max = this.max.slice();

        for (let i = 0; i < vector.length; i++) {
            min[min.length - i - 1] += vector[vector.length - i - 1];
            max[max.length - i - 1] += vector[vector.length - i - 1];
        }

        return new Box(min, max);
    }

    /**
     * Obtain the source boundary box of a cell.
     *
     * @param {Diagram} diagram Diagram that contains the cell.
     * @param {int} level Level of the cell in the diagram.
     * @return {Box} Source boundary box of the cell.
     */
    static sourceOf(diagram, level) {
        if (diagram.getDimension() == 0) {
            return Box.empty();
        }

        let { min, max } = diagram.getSlice(level).getBoundingBox(diagram.cells[level]);
        return new Box(min, max);
    }

    /**
     * @return {Box} Empty box.
     */
    static empty() {
        return new Box([], []);
    }

    minEmbedding() {
        return new Embedding(this.min);
    }

    maxEmbedding() {
        return new Embedding(this.max);
    }

}

/**
 * Obtain the source and target diagrams of a cell.
 *
 * @param {Diagram} diagram Diagram that contains the cell.
 * @param {int} level Level of the cell in the diagram.
 * @return {*} Object with the "source" and "target" diagram of the cell.
 */
const getBoundaryDiagrams = (diagram, level) => {
    if (diagram.getDimension() == 0) {
        return { source: null, target: null };
    }

    let cell = diagram.cells[level];
    if (cell.id.is_interchanger()) {
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

/**
 * Restrict a diagram to the inside of a bounding box.
 *
 * Diagram and box must have the same dimension.
 *
 * Does not modify the original diagram.
 *
 * @param {Diagram} diagram The diagram to restrict.
 * @param {Box} box The bounding box.
 * @return {Diagram} The restricted diagram.
 */
const restrictDiagram = (diagram, box) => {
    // Base case: 0-diagrams can't be restricted further
    if (diagram.dimension == 0) {
        return diagram;
    }

    // Obtain the new source slice and recursively restrict
    // it to the rest of the box
    let span = box.span();
    let source = restrictDiagram(diagram.getSlice(span.min).copy(), box.rest());

    // Restrict the cells to the box
    let cells = diagram.cells.slice(span.min, span.max).map(cell => cell.copy());

    // Update the cells' key and bounding box appropriately to accomodate
    // for the changed source diagram
    let slice = source.copy();
    for (let cell of cells) {
        cell.pad(box.rest().min.map(x => -x));
        cell.box = slice.getBoundingBox(cell);
        slice.rewrite(cell);
    }

    return new Diagram(source, cells);
}

class Span {

    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    get size() {
        return this.max - this.min;
    }

    static union(...spans) {
        let min = Infinity;
        let max = -Infinity;

        for (let span of spans) {
            min = Math.min(min, span.min);
            max = Math.max(max, span.max);
        }

        return new Span(min, max);
    }

}
