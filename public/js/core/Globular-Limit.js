"use strict";

/*
- Diagram(n) comprises:
    - t :: Number, the dimension of the signature over which it is defined
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
        if (this.forward_limit.length == 0) return null;
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
    getMonotones(height) {
        return {
            forward_monotone: this.forward_limit.getMonotone(height),
            backward_monotone: this.backward_limit.getMonotone(height)
        }
    }
    // Assuming that the content is to act on the specified source, reverse it
    reverse(source) {
        _assert(this.n == source.n);
        let middle = this.forward_limit.rewrite(source.copy());
        let target = this.backward_limit.rewrite(middle.copy());
        let new_forward_limit = this.backward_limit.getForwardLimit(target, middle);
        let new_backward_limit = this.forward_limit.getBackwardLimit(source, middle);
        return new Content(this.n, new_forward_limit, new_backward_limit);
    }
    static copyData(data) {
        _assert(data instanceof Array);
        if ((typeof data) === 'string') return data;
        if (!data) return data;
        let new_data = [];
        for (let i = 0; i < data.length; i++) {
            _assert(data[i] instanceof Content);
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
            _assert(args.type instanceof Generator);
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
        _assert(components instanceof Array);
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
    getMonotone(source_height, target_height) {
        _assert(!isNaN(source_height));
        _assert(!isNaN(target_height));
        let monotone = new Monotone(target_height, []);
        let singular_height = 0;
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            while (monotone.length < component.first) {
                monotone.push(singular_height);
                singular_height++;
            }
            for (let j = component.first; j < component.last; j++) {
                monotone[j] = singular_height;
            }
            singular_height++;
        }
        while (monotone.length < source_height) {
            monotone.push(singular_height);
            singular_height++;
        }
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
    analyze() {
        let component_targets = [];
        let offset = 0;
        for (let i = 0; i < this.length; i++) {
            component_targets.push(this[i].first - offset);
            offset += this[i].last - this[i].first - 1;
        }
        return component_targets;
    }
    compose(first, forward) {
        let second = this;
        _assert((typeof forward) === 'boolean');
        if (forward) _assert(second instanceof ForwardLimit && first instanceof ForwardLimit);
        if (!forward) _assert(second instanceof BackwardLimit && first instanceof BackwardLimit);
        _assert(first.n == second.n);
        if (first.length == 0) return second.copy();
        if (second.length == 0) return first.copy();
        if (first.n == 0) return (forward ? second.copy() : first.copy());
        let analysis1 = first.analyze();
        let c1 = 0;
        let c2 = 0;
        let new_components = [];
        let c2_component = { sublimits: [], data: [] };
        while (c1 < first.length) {
            let target1 = analysis1[c1];
            if (c2 == second.length || target1 < second[c2].first) { // c1 comes before c2, so copy it to the composed limit
                new_components.push(first[c1].copy());
                c1++;
                continue;
            }
            // Set the start of the component correctly
            if (c2_component.first == null) {
                c2_component.first = first[c1].first - (target1 - second[c2].first);
                c2_component.last = c2_component.first + (second[c2].last - second[c2].first);
            }
            // Ensure any identity levels that we have skipped are correctly handled
            let height_target = Math.min(first[c1].first, c2_component.last) - c2_component.first;
            while (c2_component.sublimits.length < height_target) {
                let index = c2_component.sublimits.length;
                let second_sublimit = second[c2].sublimits[index];
                c2_component.sublimits.push(second_sublimit.copy());
                if (!forward) {
                    let second_data = second[c2].data[index];
                    c2_component.data.push(second_data.copy());
                }
            }
            if (target1 < second[c2].last) {  // c1 is in the support of c2
                // Add the overlapping levels
                let second_sublimit = second[c2].sublimits[target1 - second[c2].first];
                for (let i = 0; i < first[c1].last - first[c1].last; i++) {
                    // For every overlapping level except the first, the new component is getting bigger
                    if (i > 0) c2_component.last++;
                    let first_sublimit = first[c1].sublimits[i];
                    let composed_sublimit = second_sublimit.compose(first_sublimit);
                    c2_component.sublimits.push(composed_sublimit);
                    if (!forward) c2_component.data.push(Content.copyData(first[c1].data[i]));
                }
                c1++;
            }
            else if (target1 >= second[c2].last) {
                //c2_component.last = c2_component.first + c2_component.sublimits.length;
                if (forward) c2_component.data = Content.copyData(second[c2].data);
                new_components.push(new LimitComponent(this.n, c2_component));
                c2_component = { sublimits: [], data: [] };
                c2++;
            } else _assert(false);
        }
        _assert(c1 == first.length);
        // Finish off any unpropagated uppermost components of the second limit
        for (; c2 < second.length; c2++) {
            if (c2_component.first == null) {
                c2_component.first = first.last().last + second[c2].first - analysis1.last() - 1;
                c2_component.last = c2_component.first + second[c2].last - second[c2].first;
            }
            if (forward) c2_component.data = Content.copyData(second[c2].data);
            while (c2_component.sublimits.length < c2_component.last - c2_component.first) {
                let index = c2_component.sublimits.length;
                let second_sublimit = second[c2].sublimits[index];
                c2_component.sublimits.push(second_sublimit.copy());
            }
            if (!forward) c2_component.data = Content.copyData(second[c2].data);
            new_components.push(new LimitComponent(this.n, c2_component));
            c2_component = { sublimits: [] };
        }
        if (forward) return new ForwardLimit(this.n, new_components);
        else return new BackwardLimit(this.n, new_components);
    }
}

class ForwardLimit extends Limit {
    constructor(n, components) {
        _assert(!isNaN(n));
        _assert(components);
        for (let i = 0; i < components.length; i++) {
            _assert(n == 0 || components[i].data.length == 1);
        }
        return super(n, components); // call the Limit constructor
    }
    rewrite(diagram) {
        diagram.t++;
        if (this.n == 0) {
            diagram.type = this[0].type;
            return diagram;
        }
        for (let i = this.length - 1; i >= 0; i--) {
            let c = this[i];
            diagram.data.splice(c.first, c.last - c.first, c.data[0].copy());
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
    compose(second) {
        return super.compose(second, true);
    }
    subForwardLimit(n) {
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            if (n < component.first) return new ForwardLimit(this.n - 1, []);
            if (n < component.last) return component.sublimits[n - component.first];
        }
        return new ForwardLimit(this.n - 1, []);
    }
    // Supposing this limit goes from source to target, construct the equivalent backward limit.
    getBackwardLimit(source, target) {
        _assert(source.n == this.n);
        _assert(target.n == this.n);
        if (this.n == 0) return new BackwardLimit(0, [new LimitComponent(0, { type: source.type })]);
        let new_components = [];
        let monotone = this.getMonotone(source.data.length, target.data.length);
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            let sublimits = [];

            let data = [];
            if (component.first < component.last) {
                let slice_target = target.getSlice({ height: monotone[component.first], regular: false });
                for (let j = component.first; j < component.last; j++) {
                    let slice_source = source.getSlice({ height: j, regular: false });
                    sublimits.push(component.sublimits[j - component.first].getBackwardLimit(slice_source, slice_target));
                    data.push(source.data[j].copy());
                }
            }
            let first = component.first;
            let last = component.last;
            new_components.push(new LimitComponent(this.n, { first, last, data, sublimits }));
        }
        return new BackwardLimit(this.n, new_components);
    }
}

class BackwardLimit extends Limit {
    constructor(n, components) {
        _assert(!isNaN(n));
        _assert(components);
        for (let i = 0; i < components.length; i++) {
            _assert(components[i] instanceof LimitComponent)
            _assert(components[i].n == n);
            if (n > 0) {
                _assert(components[i].sublimits.length == components[i].data.length);
            }
        }
        return super(n, components); // call the Limit constructor
    }
    rewrite(diagram) {
        diagram.t--;
        if (diagram.n == 0) {
            diagram.type = this[0].type;
            return diagram;
        }
        let offset = 0;
        for (let i = 0; i < this.length; i++) {
            let c = this[i];
            let before = diagram.data.slice(0, c.first);
            let after = diagram.data.slice(c.first + 1, diagram.data.length);
            diagram.data = before.concat(c.data.concat(after));
            //diagram.data = diagram.data.slice(0, c.first + offset).concat(c.data.concat(diagram.data.slice(c.first + offset + 1, diagram.data.length)));
            //offset += c.last - c.first - 1;
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
    compose(second) {
        return super.compose(second, false);
    }
    subBackwardLimit(n) {
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            if (n < component.first) return new BackwardLimit(this.n - 1, []);
            if (n < component.last) return component.sublimits[n - component.first];
        }
        return new BackwardLimit(this.n - 1, []);
    }
    // Supposing this limit goes from source to target, construct the equivalent backward limit.
    getForwardLimit(source, target) {
        _assert(source.n == this.n);
        _assert(target.n == this.n);
        if (this.n == 0) return new ForwardLimit(0, [new LimitComponent(0, { type: target.type })]);
        let new_components = [];
        let monotone = this.getMonotone(source.data.length, target.data.length);
        let offset = 0;
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            let sublimits = [];
            let target_slice_index = component.first - offset;//monotone[component.first];
            offset += component.last - component.first - 1;
            let slice_target = target.getSlice({ height: target_slice_index, regular: false });
            for (let j = component.first; j < component.last; j++) {
                let slice_source = source.getSlice({ height: j, regular: false });
                sublimits.push(component.sublimits[j - component.first].getForwardLimit(slice_source, slice_target));
            }
            let data = [target.data[target_slice_index].copy()];
            let first = component.first;
            let last = component.last;
            new_components.push(new LimitComponent(this.n, { first, last, data, sublimits }));
        }
        return new ForwardLimit(this.n, new_components);
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
    static getIdentity(n) {
        let m = new Monotone(0, []);
        for (let i = 0; i < n; i++) {
            m.grow();
        }
        return m;
    }
    grow() {
        this.push(this.target_size);
        this.target_size++;
    }
    append(value) {
        this.push(value);
        this.target_size = value + 1;
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
    imageComplement() {
        let n = 0;
        let complement = [];
        for (let i = 0; i < this.target_size; i++) {
            if (n == this.length || this[n] > i) complement.push(i);
            else n++;
        }
        return complement;
    }

    static union(first, second, swap) {
        let i1_array = [];
        for (let i = 0; i < first; i++) i1_array.push(i);
        let i2_array = [];
        for (let i = 0; i < second; i++) i2_array.push(first + i);
        let data = { first: new Monotone(first + second, i1_array), second: new Monotone(first + second, i2_array) };
        if (swap) return {first: data.second, second: data.first};
        return data;
    }

    pushout({ second, right }) {
        return this.unify({ second, right }); // implicitly right==null, depth==null
    }

    // Unify with a second monotone, with the indicated tendency to the right if specified
    unify({ second, right, depth }) {
        let first = this;
        _assert(second instanceof Monotone);
        _assert(first.length == second.length);
        _assert(right == null || (typeof (right) == 'boolean'));
        _assert(depth == null || !isNaN(depth));
        if (depth == null) {
            if (first.length == 0) {
                if (first.target_size > 0 && second.target_size > 0) {
                    if (right == null) return null;
                    else if (right == false) return Monotone.union(first.target_size, second.target_size);
                    else return Monotone.union(second.target_size, first.target_size, true);
                }
                else if (first.target_size == 0) return { first: second.copy(), second: Monotone.getIdentity(second.target_size) };
                else if (second.target_size == 0) return { first: Monotone.getIdentity(first.target_size), second: first.copy() };
                else _assert(false);
            }
            return this.unify({ second, right, depth: first.length }); // begin the induction
        }
        if (depth == 0) return { first: new Monotone(0, []), second: new Monotone(0, []) }; // base case
        let injections = this.unify({ second, right, depth: depth - 1 }); // recursive step
        if (injections == null) return null;
        _assert(injections.first instanceof Monotone);
        _assert(injections.second instanceof Monotone);
        _assert(injections.first.target_size == injections.second.target_size);
        let n = depth;
        let left_delta = first[n - 1] + (n == 1 ? 1 : -first[n - 2]);
        let right_delta = second[n - 1] + (n == 1 ? 1 : -second[n - 2]);
        if (left_delta > 1 && right_delta > 1) {
            // If we haven't been given a tendency, fail
            if (right == null) return null;
            let major = right ? { monotone: injections.second, delta: right_delta } : { monotone: injections.first, delta: left_delta };
            let minor = right ? { monotone: injections.first, delta: left_delta } : { monotone: injections.second, delta: right_delta };
            for (let i = 0; i < major.delta - 1; i++) major.monotone.grow();
            minor.monotone.target_size += major.delta - 1;
            for (let i = 0; i < minor.delta - 1; i++) minor.monotone.grow();
            major.monotone.target_size = minor.monotone.target_size;
        } else if (left_delta == 0 || right_delta == 0) {
            let t = injections.first.target_size;
            while (injections.first.length <= first[n - 1]) injections.first.push(t - 1);
            while (injections.second.length <= second[n - 1]) injections.second.push(t - 1);
        } else {
            for (let i = 0; i < left_delta - 1; i++) injections.first.grow();
            for (let i = 0; i < right_delta - 1; i++) injections.second.grow();
            let t = (left_delta > 1 ? injections.first.target_size : injections.second.target_size);
            injections.first.append(t);
            injections.second.append(t);
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
    getFirstPreimage(value) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] == value) return i;
        }
        return null;
    }
    getLastPreimage(value) {
        for (let i = this.length - 1; i >= 0; i--) {
            if (this[i] == value) return i;
        }
        return null;
    }
    getFirstLast(value) {
        let first = null;
        let last = null;
        let pos = 0;
        while (this[pos] < value) pos++;
        first = pos;
        while (pos < this.length && this[pos] == value) pos++;
        //if (pos == monotone.length) pos --;
        last = pos;
        return { first, last };
    }
}
