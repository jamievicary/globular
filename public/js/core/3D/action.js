class EntityAction {

    /**
     * Perform an entity action on a point.
     */
    static perform(action, point) {
        // In zero dimensions, all actions are trivial
        if (point.length == 0) {
            return [];
        }

        // Operate on the last coordinate first
        let height = point[point.length - 1];
        let rest = point.slice(0, -1);

        // Is the point inside of the action's height range?
        if (action.height <= height && height <= action.height + action.size) {
            // Recurse into the slice action
            let moved = EntityAction.perform(action.getSlice(height - action.height), rest);
            if (moved !== null) rest = moved;
        }

        // Update the height according to the action
        height = action.updateHeight(height);

        return rest.concat([height]);
    }

    constructor(dimension) {
        this.dimension = dimension;
    }

    getSlice(level) {
        throw new Error("Entity action must implement getSlice.");
    }

    updateHeight(level) {
        throw new Error("Entity action must implement updateHeight");
    }

    pad(by) {
        throw new Error("Entity action must implement pad.");
    }

    getBox() {
        if (this.dimension <= 1) {
            return Box.empty();
        }

        let span = new Span(this.height, this.height + this.size);
        let rest = this.getSlice(0).getBox();
        return rest.lift(span);
    }

}

class ConeAction extends EntityAction {

    constructor(embedding, source) {
        super(source ? source.dimension + 1 : 0);
        this.embedding = embedding;
        this.source = source;
    }

    getSlice(level) {
        let embedding = this.embedding.rest();
        let source = this.source.getSlice(level);
        return new ConeAction(embedding, source);
    }

    updateHeight(height) {
        // Before the action occurs
        if (height < this.embedding.height()) {
            return height;
        }

        // After the action occurs
        if (height > this.embedding.height() + this.source.size) {
            return height - this.source.size + 1;
        }

        // Inside the actions span
        return this.embedding.height() + 0.5;
    }

    get height() {
        return this.embedding.height();
    }

    get size() {
        return this.source.size;
    }

    contract() {
        return new ContractedAction(this);
    }

    pad(positive, negative) {
        let embedding = this.embedding.pad(positive, negative);
        return new ConeAction(embedding, this.source);
    }

}

class InterchangerAction extends EntityAction {

    constructor(embedding, source, forward) {
        super(source.dimension + 1);
        this.embedding = embedding;
        this.source = source;
        this.forward = forward;
    }

    getSlice(level) {
        let lower = this.source.entities[0].pad(this.embedding.rest());
        let upper = this.source.entities[1].pad(this.embedding.rest());

        // Lower half
        if (level == 0 || level == 0.25 || level == 0.5) {
            let lowerAction = lower.sourceAction();
            let upperAction = upper.sourceAction();

            if (level == 0.5) {
                lowerAction = lowerAction.contract();
            }

            if (!this.forward) {
                upperAction = upperAction.pad(lowerAction.getBox().max, lower.targetBox().max);
            }

            return ParallelAction.make(lowerAction, upperAction, this.forward);
        }

        // The full slice in the middle
        if (level == 0.75 || level == 1 || level == 1.25) {
            return ParallelAction.make(lower.targetAction(), upper.sourceAction(), this.forward);
        }

        // Upper half
        if (level == 1.5 || level == 1.75 || level == 2) {
            let lowerAction = lower.targetAction();
            let upperAction = upper.targetAction();

            if (level == 1.5) {
                upperAction = upperAction.contract();
            }

            if (this.forward) {
                lowerAction = lowerAction.pad(upperAction.getBox().max, upper.sourceBox().max);
            }

            return ParallelAction.make(lowerAction, upperAction, this.forward);
        }

        // Out of bounds
        throw new Error(`Interchanger actions do not have a slice at level ${level}.`);
    }

    updateHeight(height) {
        // Before the action occurs
        if (height < this.embedding.height()) {
            return height;
        }

        // After the action occurs
        if (height > this.embedding.height() + 2) {
            return height - 1;
        }

        // Inside the action's span
        return this.embedding.height() + 0.5;
    }

    get size() {
        return 2;
    }

    get height() {
        return this.embedding.height();
    }

    contract() {
        return new ContractedAction(this);
    }

    pad(positive, negative = null) {
        let embedding = this.embedding.pad(positive, negative);
        return new InterchangerAction(embedding, this.source, this.forward);
    }

}

class ParallelAction extends EntityAction {

    static make(lower, upper, swap) {
        let left = !swap ? lower : upper;
        let right = !swap ? upper : lower;
        return new ParallelAction(left, right);
    }

    constructor(lower, upper) {
        super(lower.dimension);
        this.lower = lower;
        this.upper = upper;
    }

    getSlice(level) {
        // Slice in lower action
        if (level >= 0 && level <= this.lower.size) {
            return this.lower.getSlice(level);
        }

        // Slice in upper action
        if (level >= this.upper.height - this.height && level <= this.height + this.size) {
            return this.upper.getSlice(level - this.upper.height + this.height);
        }

        // Outside of the action
        return null;
    }

    updateHeight(height) {
        // Before even the lower action
        if (height < this.lower.height - 0.25) {
            return height;
        }

        // Inside the lower action
        if (height < this.lower.height + this.lower.size) {
            return this.height + 0.5;
        }

        // Between the actions
        if (height <= this.upper.height) {
            return height - this.lower.size + 1;
        }

        // Inside the upper action
        if (height <= this.upper.height + this.upper.size + 0.25) {
            return this.upper.height - this.lower.size + 1.5;
        }

        // Above both actions
        return height - this.lower.size - this.upper.size + 2;
    }

    get height() {
        return this.lower.height;
    }

    get size() {
        return this.lower.size + this.upper.size;
    }

    contract() {
        return new ParallelAction(this.lower.contract(), this.upper.contract());
    }

    pad(positive, negative = null) {
        let lower = this.lower.pad(positive, negative);
        let upper = this.upper.pad(positive, negative);
        return new ParallelAction(lower, upper);
    }

}

class ContractedAction extends EntityAction {

    constructor(action) {
        super(action.dimension);
        this.action = action;
    }

    getSlice(level) {
        if (level == 0 || level == 0.25) {
            return this.action.getSlice(0);
        }

        if (level == 0.5) {
            return this.action.getSlice(0).contract();
        }

        if (level == 0.75 || level == 1) {
            return this.action.getSlice(this.action.size);
        }

        throw new Error(`Contracted action does not have a slice at level ${level}.`);
    }

    updateHeight(height) {
        return 0.5;
    }

    get height() {
        return this.action.height;
    }

    get size() {
        return 1;
    }

    contract() {
        return this;
    }

    pad(positive, negative = null) {
        let action = this.action.pad(positive, negative = null);
        return new ContractedAction(action);
    }

}
