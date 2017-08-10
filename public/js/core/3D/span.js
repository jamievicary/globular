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