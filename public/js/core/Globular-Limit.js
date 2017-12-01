"use strict";

/*
- Diagram(n) comprises:
    - type_dimension :: Number
    - n > 0:
        - source :: Diagram(n-1)
        - data :: Array(Content(n-1))
    - n == 0:
        - type :: String // Makes no sense to have an array here
- Content(n) comprises:
    - for all n:
        - forward_limit :: ForwardLimit(n)
        - backward_limit :: BackwardLimit(n)
- ForwardLimit(n) extends Limit(n)
- BackwardLimit(n) extends Limit(n)
- Limit(n) extends Array comprises: (this is a limit between n-diagrams)
    - for all n, an array of:
        - LimitComponent(n)
- LimitComponent(n) comprises: (this is a component of a limit between n-diagrams)
    - for n > 0:
        - data :: Array(Content(n-1))
        - first :: Number, the first regular slice affected
        - last :: Number, the last regular slice affected
        - sublimits :: Array(Limit(n-1)) // should be forward/backward?
    - for n == 0:
        - type :: String
*/

class Content {
    constructor(n, forward_limit, backward_limit) {
        _assert(!isNaN(n));
        _assert(forward_limit);
        _assert(backward_limit);
        _assert(forward_limit instanceof ForwardLimit);
        _assert(backward_limit instanceof BackwardLimit);
        _assert(forward_limit.n == n);
        _assert(backward_limit.n == n);
        this.n = n;
        this.forward_limit = forward_limit;
        this.backward_limit = backward_limit;
    }
    getLastId() {
        return this.forward_limit.last().getLastId();
    }
    copy() {
        return new Content(this.n, this.forward_limit.copy(), this.backward_limit.copy());
    }
    usesCell(generator) {
        if (this.forward_limit.usesCell(generator)) return true;
        if (this.backward_limit.usesCell(generator)) return true;
        return false;
    }
    pad(depth) {
        this.forward_limit.pad(depth);
        this.backward_limit.pad(depth);
    }
    // Pad the content so that the origin moves to the specified position
    deepPad(position) {
        this.forward_limit.deepPad(position);
        this.backward_limit.deepPad(position);
    }
    equals(content) {
        if (!this.forward_limit.equals(content.forward_limit)) return false;
        if (!this.backward_limit.equals(content.backward_limit)) return false;
        return true;
    }
    getMonotones() {
        return {
            forward_monotone: this.forward_limit.getMonotone(),
            backward_monotone: this.backward_limit.getMonotone()
        }
    }
    static copyData(data) {
        if ((typeof data) === 'string') return data;
        if (!data) return data;
        let new_data = [];
        for (let i = 0; i < data.length; i++) {
            new_data.push(data[i].copy());
        }
        return new_data;
    }
    static deepPadData(data, position) {
        for (let i = 0; i < data.length; i++) {
            data[i].deepPad(position);
        }
    }
}

class LimitComponent {

    /*
- LimitComponent(n) comprises: (this is a component of a limit between n-diagrams)
    - for n > 0:
        - data :: Array(Content(n-1))
        - first :: Number, the first regular slice affected
        - last :: Number, the last regular slice affected
        - sublimits :: Array(Limit(n-1)) // should be forward/backward?
    - for n == 0:
        - type :: String
    */
    constructor(n, args) {
        _assert(!isNaN(n));
        this.n = n;
        if (n == 0) {
            _assert(args.type);
            this.type = args.type;
            return this;
        }
        _assert(!isNaN(args.first));
        _assert(!isNaN(args.last));
        _assert(args.data instanceof Array);
        _assert(args.sublimits instanceof Array);
        this.data = args.data;
        this.first = args.first;
        this.last = args.last;
        this.sublimits = args.sublimits;
        for (let i = 0; i < this.sublimits.length; i++) {
            _assert(this.sublimits[i] instanceof Limit);
            _assert(this.sublimits[i].n == n - 1);
        }
        for (let i = 0; i < this.data.length; i++) {
            _assert(this.data[i] instanceof Content);
            _assert(this.data[i].n == n - 1);
        }
    }
    equals(b) {
        var a = this;
        if (a.first != b.first) return false;
        if (a.last != b.last) return false;
        if (!a.data && b.data) return false;
        if (a.data && !b.data) return false;
        if (a.data) {
            if (a.data.length != b.data.length) return false;
            for (let i = 0; i < a.data.length; i++) {
                if (!a.data[i].equals(b.data[i])) return false;
            }
        }
        if (!a.sublimits && b.sublimits) return false;
        if (a.sublimits && !b.sublimits) return false;
        if (a.sublimits) {
            if (a.sublimits.length != b.sublimits.length) return false;
            for (let i = 0; i < a.sublimits.length; i++) {
                if (!a.sublimits[i].equals(b.sublimits[i])) return false;
            }
        }
        return true;
    }
    getLastId() {
        if (this.n == 0) return this.type;
        return this.data.last().getLastId();
        _assert(false); // ... to write ...
    }
    copy() {
        if (this.n == 0) {
            let type = this.type;
            return new LimitComponent(0, { type });
        }
        let data = Content.copyData(this.data);
        let sublimits = [];
        for (let i = 0; i < this.sublimits.length; i++) {
            sublimits.push(this.sublimits[i].copy());
        }
        let first = this.first;
        let last = this.last;
        return new LimitComponent(this.n, { data, sublimits, first, last });
    }
    usesCell(generator) {
        if (this.n == 0) return this.type == generator.id;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].usesCell(generator)) return true;
        }
        for (let i = 0; i < this.sublimits.length; i++) {
            if (this.sublimits[i].usesCell(generator)) return true;
        }
        return false;
    }
    pad(depth) {
        if (depth == 1) {
            this.first++;
            this.last++;
        } else if (depth > 1) {
            for (let i = 0; i < this.data.length; i++) {
                this.data[i].pad(depth - 1);
            }
            for (let i = 0; i < this.sublimits.length; i++) {
                this.sublimits[i].pad(depth - 1);
            }
        }
    }
    // Pad this component so that the origin moves to the given position
    deepPad(position) {
        _assert(this.n == position.length);
        if (this.n == 0) return;
        this.first += position[0];
        this.last += position[0];
        let slice_position = position.slice(1);
        for (let i = 0; i < this.data.length; i++) {
            this.data[i].deepPad(slice_position);
        }
        for (let i = 0; i < this.sublimits.length; i++) {
            this.sublimits[i].deepPad(slice_position);
        }
    }
}

class Limit extends Array {
    constructor(n, components) {
        _assert(!isNaN(n));
        _assert(components);
        super(...components);
        this.n = n;
    }
    usesCell(generator) {
        for (let i = 0; i < this.length; i++) {
            if (this[i].usesCell(generator)) return true;
        }
        return false;
    }
    pad(depth) {
        for (let i = 0; i < this.length; i++) {
            this[i].pad(depth);
        }
    }
    deepPad(position) {
        _assert(this.n == position.length);
        for (let i = 0; i < this.length; i++) {
            this[i].deepPad(position);
        }
    }
    equals(limit) {
        if (this.length != limit.length) return false;
        for (let i = 0; i < this.length; i++) {
            if (!this[i].equals(limit[i])) return false;
        }
        return true;
    }
    getMonotone() {
        let monotone = new Monotone(0, []);
        let singular_height = 0;
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            while (monotone.length < component.first) {
                monotone.push(singular_height);
                singular_height++;
            }
            for (let j = component.first; j <= component.last; j++) {
                monotone[j] = singular_height;
            }
            singular_height++;
        }
        monotone.target_size = 
        return monotone;
    }
    // For each singular height, computes whether its neighbourhood is nontrivial
    analyzeSingularNeighbourhoods() {
        var singular_classification = [];
        let offset = 0;
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            singular_classification[component.first - offset] = true;
            offset += component.last - component.first - 1;
        }
        return singular_classification;
    }
}

class ForwardLimit extends Limit {
    constructor(n, components) {
        _assert(!isNaN(n));
        _assert(components);
        return super(n, components); // call the Limit constructor
    }
    rewrite(diagram) {
        diagram.type_dimension++;
        if (this.n == 0) {
            diagram.type = this[0].type;
            return diagram;
        }
        for (let i = this.length - 1; i >= 0; i--) {
            let c = this[i];
            diagram.data.splice(c.first, c.last - c.first, c.data[0])
        }
        return diagram;
    }
    copy() {
        let new_components = [];
        for (let i = 0; i < this.length; i++) {
            new_components.push(this[i].copy());
        }
        return new ForwardLimit(this.n, new_components);
    }
}

class BackwardLimit extends Limit {
    constructor(n, components) {
        _assert(!isNaN(n));
        _assert(components);
        return super(n, components); // call the Limit constructor
    }
    rewrite(diagram) {
        diagram.type_dimension--;
        if (diagram.geometric_dimension == 0) {
            diagram.type = this[0].type;
            return diagram;
        }
        let offset = 0;
        for (let i = 0; i < this.length; i++) {
            let c = this[i];
            let before = diagram.data.slice(0, c.first + offset);
            let after = diagram.data.slice(c.first + offset + 1, diagram.data.length);
            diagram.data = before.concat(c.data.concat(after));
            //diagram.data = diagram.data.slice(0, c.first + offset).concat(c.data.concat(diagram.data.slice(c.first + offset + 1, diagram.data.length)));
            offset += c.first - c.last;
        }
        return diagram;
    }
    copy() {
        let new_components = [];
        for (let i = 0; i < this.length; i++) {
            new_components.push(this[i].copy());
        }
        return new BackwardLimit(this.n, new_components);
    }
}

class Monotone extends Array {
    constructor(target_size, values) {
        _assert(!isNaN(target_size));
        _assert(target_size >= 0);
        _assert(values);
        //super(...values);
        super();
        for (let i = 0; i < values.length; i++) {
            this[i] = values[i];
            _assert(!isNaN(values[i]));
            _assert(values[i] >= 0);
            if (i > 0) _assert(this[i - 1] <= this[i]);
        }
        this.target_size = target_size;
        if (this.length > 0) _assert(this.target_size > this.last());
    }
    grow() {
        this.push(this.target_size);
        this.target_size++;
    }
    compose(second) {
        _assert(second instanceof Monotone);
        let copy_second = second.copy();
        copy_second.target_size = this.target_size;
        for (let i = 0; i < second.length; i++) {
            copy_second[i] = this[second[i]];
        }
        return copy_second;
    }
    equals(second) {
        let first = this;
        if (first.length != second.length) return false;
        if (first.target_size != second.target_size) return false;
        for (let i = 0; i < first.length; i++) {
            if (first[i] != second[i]) return false;
        }
        return true;
    }
    pushout(second, n) {
        let first = this;
        _assert(second instanceof Monotone);
        _assert(first.length == second.length);
        if (n == null) return this.pushout(second, first.length); // begin the induction
        if (n == 0) return { first: new Monotone(0, []), second: new Monotone(0, []) }; // base case
        let injections = this.pushout(second, n - 1); // recursive step
        if (injections == null) return null;
        _assert(injections.first instanceof Monotone);
        _assert(injections.second instanceof Monotone);
        _assert(injections.first.target_size == injections.second.target_size);
        let left_delta = first[n - 1] + (n == 1 ? 1 : -first[n - 2]);
        let right_delta = second[n - 1] + (n == 1 ? 1 : -second[n - 2]);
        if (left_delta > 1 && right_delta > 1) return null;
        else if (left_delta == 0 || right_delta == 0) {
            let t = injections.first.target_size;
            while (injections.first.length <= first[n - 1]) injections.first.push(t - 1);
            while (injections.second.length <= second[n - 1]) injections.second.push(t - 1);
        } else {
            for (let i = 0; i < left_delta - 1; i++) injections.first.grow();
            for (let i = 0; i < right_delta - 1; i++) injections.second.grow();
            let t = (left_delta > 1 ? injections.first.target_size : injections.second.target_size);
            injections.first.push(t);
            injections.second.push(t);
            injections.first.target_size = t + 1;
            injections.second.target_size = t + 1;
        }
        if (n == first.length) {
            let first_trailing = first.target_size - this.last() - 1;
            let second_trailing = second.target_size - this.last() - 1;
            if (first_trailing > 0 && second_trailing > 0) return null;
            while (injections.first.length < first.target_size) injections.first.grow();
            while (injections.second.length < second.target_size) injections.second.grow();
            injections.first.target_size = injections.second.target_size = Math.max(injections.first.target_size, injections.second.target_size);
        }
        if (n == first.length) {
            _assert(injections.first.length == first.target_size);
            _assert(injections.second.length == second.target_size);
            _assert(injections.first.target_size == injections.second.target_size);
            _assert(injections.first.compose(first).equals(injections.second.compose(second)));
        }
        return injections;
    }
    copy() {
        let m = new Monotone(this.target_size, []);
        for (let i = 0; i < this.length; i++) {
            m[i] = this[i];
        }
        return m;
    }
}

