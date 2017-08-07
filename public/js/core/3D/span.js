class Span {

    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    size() {
        return this.max - this.min;
    }

    equals(span) {
        if (!(span instanceof Span)) return false;
        return span.min === this.min && span.max === this.max;
    }

    move(offset) {
        let min = this.min + offset;
        let max = this.max + offset;
        return new Span(min, max);
    }

    moveUp(cells) {
        let min = this.min;
        let max = this.max;

        for (let cell of cells) {
            let delta = cell.target.size() - cell.source.size();
            min = Math.min(min, cell.target.min);
            max = Math.max(max + delta, cell.source.max + delta);
        }

        return new Span(min, max);
    }

    moveDown(cells) {
        let min = this.min;
        let max = this.max;

        for (let cell of cells) {
            let delta = cell.source.size() - cell.target.size();
            min = Math.min(min, cell.source.min);
            max = Math.max(max + delta, cell.source.max);
        }

        return new Span(min, max);
    }

    /*inside(x, left, right) {
        return !this.left(x, left) && !this.right(x, right);
    }

    left(x, closed) {
        return x < this.min || (!closed && x == this.min);
    }

    right(x, closed) {
        return x > this.max || (!closed && x == this.min);
    }*/

    collapsed() {
        return new Span(this.min, this.min + 1);
    }

    withCollapse(span) {
        if (this.min >= span.max) {
            return this.move(1 - span.size());
        } else {
            return this;
        }
    }

    pad() {
        if (this.size() == 0) {
            let min = this.min * 2;
            let max = this.max * 2 + 1;
            return new Span(min, max);
        } else {
            let min = this.min * 2;
            let max = this.max * 2 + 1;
            return new Span(min, max);
        }
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
