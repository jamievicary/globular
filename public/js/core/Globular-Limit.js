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
    - for all n:
        - Array(LimitComponent(n))
        - framing :: Boolean, the local framing data. "Is this the source?"
        - dt :: increase in type dimension
- LimitComponent(n) comprises: (this is a component of a limit between n-diagrams)
    - for n > 0:
        - data :: Array(Content(n-1))
        - first :: Number, the first regular slice affected
        - last :: Number, the last regular slice affected
        - sublimits :: Array(Limit(n-1)) // should be forward/backward?
    - for n == 0:
        - type :: Generator
*/

class Content {

    constructor(n, forward_limit, backward_limit) {
        this.n = n;
        this.forward_limit = forward_limit;
        this.backward_limit = backward_limit;
        _validate(this);
    }

    validate() {
        _assert(!isNaN(this.n));
        _assert(this.forward_limit instanceof ForwardLimit);
        _assert(this.backward_limit instanceof BackwardLimit);
        _assert(this.forward_limit.n == this.n);
        _assert(this.backward_limit.n == this.n);
        _propertylist(this, ['n', 'forward_limit', 'backward_limit']);
        _validate(this.forward_limit, this.backward_limit);
    }

    getLastPoint() {
        _assert(false);
        if (this.forward_limit.length == 0) _assert(false);
        return this.forward_limit.last().getLastPoint();
    }

    copy() {
        return new Content(this.n, this.forward_limit.copy(), this.backward_limit.copy());
    }

    rewrite(source) {
        let singular = this.forward_limit.rewrite(source.copy());
        let target = this.backward_limit.rewrite(singular);
        return target;
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

    // Get data that describes an expansion of this Content object (2018-ANC-1-55)
    getExpansionData(index, r1, r2, s) {
        _validate(this, r1, r2, s);

        let f = this.forward_limit;
        let b = this.backward_limit;

        let forward_monotone = f.getMonotone(r1.data.length, s.data.length);
        let backward_monotone = b.getMonotone(r2.data.length, s.data.length);
        //let source_preimage = forward_monotone.preimage(location[1].height);
        let f_analysis = f.getComponentTargets();
        let f_index = f_analysis.indexOf(index);
        let b_analysis = b.getComponentTargets();
        let b_index = b_analysis.indexOf(index);

        let f_old = f_index < 0 ? null : f[f_index];
        let b_old = b_index < 0 ? null : b[b_index];
        _assert(f_old || b_old);
        _assert(f.length > 0 || b.length > 0);

        // The only failure case is if there is only a single component
        if (f.length == 0 && b.length == 1) throw "can't expand a single component";
        if (f.length == 1 && b.length == 0) throw "can't expand a single component";
        if (f.length == 1 && b.length == 1 && f_old && b_old) throw "can't expand a single component";

        // E - Prepare the first new forward limit by deleting the chosen component
        let f_new_1 = f.copy();
        if (f_index >= 0) f_new_1.splice(f_index, 1);

        // Compute delta offset
        let f_delta = 0;
        for (let i = 0; i < f.length; i++) {
            if (f_analysis[i] >= index) break;
            f_delta -= f[i].last - f[i].first - 1;
        }
        let b_delta = 0;
        for (let i = 0; i < b.length; i++) {
            if (b_analysis[i] >= index) break;
            b_delta += b[i].last - b[i].first - 1;
        }

        // G - Prepare the second new forward limit by selecting only the chosen component, and adjusting first/last
        let f_new_2 = f_old ? new ForwardLimit(this.n, [f_old.copy()], null, f.dt) : new ForwardLimit(this.n, [], null, f.dt);
        if (f_old) {
            f_new_2[0].first += f_delta + b_delta;
            f_new_2[0].last += f_delta + b_delta;
        }

        // F - Prepare the first new backward limit
        let b_new_1 = b.copy();
        if (b_old) {
            b_new_1.splice(b_index, 1);
            let f_old_delta = f_old ? f_old.last - f_old.first - 1: 0; // weird f/b mixing here!
            let b_old_delta = b_old ? b_old.last - b_old.first - 1 : 0;
            for (let i = b_index + 1; i < b.length; i++) {
                b_new_1[i - 1].first += f_old_delta - b_old_delta;
                b_new_1[i - 1].last += f_old_delta - b_old_delta;
            }
        }

        // H - Prepare the second new backward limit
        
        let b_new_2 = b_old ? new BackwardLimit(this.n, [b_old.copy()], null, b.dt) : new BackwardLimit(this.n, [], null, b.dt);

        // C - Prepare the first sublimit - tricky as we need the reversed version of f_old
        // OPTIMIZATION: we don't really need to reverse all of f, just f_old
        let f_backward = f.getBackwardLimit(r1, s);
        let sublimit_1 = f_old ? new BackwardLimit(this.n, [f_backward[f_index].copy()], null, f.dt) : new BackwardLimit(this.n, [], null, f.dt);
        if (f_old) {
            sublimit_1[0].first += f_delta;
            sublimit_1[0].last += f_delta;
        }
        _validate(sublimit_1);

        // D - Prepare the second sublimit
        let sublimit_2 = b.copy();
        if (b_old) {
            sublimit_2.splice(b_index, 1);
            let local_delta = b_old.last - b_old.first - 1;
            for (let i = b_index + 1; i < b.length; i++) {
                b[i].first -= local_delta;
                b[i].last -= local_delta;
            }
        }
        _validate(sublimit_2);

        _validate(f_new_1, b_new_1, f_new_2, b_new_2);

        // Return the data of the expansion, an array of Content of length 2,
        // and the corresponding sublimits, an array of BackwardLimit of length 2.
        return {
            data: [new Content(this.n, f_new_1, b_new_1), new Content(this.n, f_new_2, b_new_2)],
            sublimits: [sublimit_1, sublimit_2]
        }
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

    constructor(n, args) {
        this.n = n;
        if (n == 0) {
            this.type = args.type;
            return this;
        }
        this.data = args.data;
        this.first = args.first;
        this.last = args.last;
        this.sublimits = args.sublimits;
        _validate(this);
    }

    validate() {
        _assert(isNatural(this.n));
        if (this.n == 0) {
            _propertylist(this, ['n', 'type']);
            _assert(this.type instanceof Generator);
            _validate(this.type);
        } else {
            _propertylist(this, ['n', 'data', 'first', 'last', 'sublimits']);
            _assert(isNatural(this.first));
            _assert(isNatural(this.last));
            _assert(this.first <= this.last);
            _assert(this.data instanceof Array);
            _assert(this.sublimits instanceof Array);
            _assert(this.sublimits.length == this.last - this.first);
            for (let i = 0; i < this.sublimits.length; i++) {
                _assert(this.sublimits[i] instanceof Limit);
                _assert(this.sublimits[i].n == this.n - 1);
                _validate(this.sublimits[i]);
            }
            for (let i = 0; i < this.data.length; i++) {
                _assert(this.data[i] instanceof Content);
                _assert(this.data[i].n == this.n - 1);
                _validate(this.data[i]);
            }
        }
    }

    equals(b) {
        let a = this;
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

    getLastPoint() {
        _assert(false);
        if (this.n == 0) {
            return new Diagram(0, { t: this.n, type: this.type }); // ???
        }
        return this.data.last().getLastPoint();
        _assert(false); // ... to write ...
    }

    copy() {
        _validate(this);
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
    initialize(n, framing, dt) {
        this.n = n;
        if (framing != null) this.framing = framing;
        this.dt = dt;
        _validate(this);
    }
    validate() {
        _assert(isNatural(this.n));
        if (this.n == 0 && this.length > 0) _assert(typeof this.framing === 'boolean');
        if (this.n > 0) _assert(this.framing == undefined);
        for (let i = 0; i < this.length; i++) {
            _assert(this[i] instanceof LimitComponent);
            _assert(this[i].n == this.n);
            if (i != 0) _assert(this[i].first >= this[i - 1].last);
            this[i].validate();
        }
        if (this.n == 0) _propertylist(this, ['n'], ['framing', 'dt']);
        else _propertylist(this, ['n'], ['dt']);
    }
    set_dt(dt) {
        return this;
        _assert(isInteger(dt));
        _assert(dt >= 0);
        this.dt = dt;
        return this;
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
        _validate(this);
        _assert(isNatural(source_height));
        _assert(isNatural(target_height));
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
    // For each component, find its target index in the codomain diagram
    getComponentTargets() {
        let component_targets = [];
        let offset = 0;
        for (let i = 0; i < this.length; i++) {
            component_targets.push(this[i].first - offset);
            offset += this[i].last - this[i].first - 1;
        }
        return component_targets;
    }
    subLimit(n, forward) {
        for (let i = 0; i < this.length; i++) {
            let component = this[i];
            if (n < component.first) return forward ? new ForwardLimit(this.n - 1, [], null, this.dt) : new BackwardLimit(this.n - 1, [], null, this.dt);
            if (n < component.last) return component.sublimits[n - component.first];
        }
        return forward ? new ForwardLimit(this.n - 1, [], null, this.dt) : new BackwardLimit(this.n - 1, [], null, this.dt);
    }

    compose(first, forward) { // See 2017-ANC-19
        let second = this;
        _assert((typeof forward) === 'boolean');
        if (forward) _assert(second instanceof ForwardLimit && first instanceof ForwardLimit);
        if (!forward) _assert(second instanceof BackwardLimit && first instanceof BackwardLimit);
        _validate(first, second);
        _assert(first.n == second.n);
        if (first.length == 0) return second.copy().set_dt(first.dt + second.dt);
        if (second.length == 0) return first.copy().set_dt(first.dt + second.dt);
        if (first.n == 0) {
            let composite = forward ? second.copy() : first.copy();
            if (first.framing != null) composite.framing = first.framing;
            composite.dt = first.dt + second.dt;
            return composite;
        }
        let analysis1 = first.getComponentTargets();
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
                for (let i = 0; i < first[c1].last - first[c1].first; i++) {
                    // For every overlapping level except the first, the new component is getting bigger
                    if (i > 0) c2_component.last++;
                    let first_sublimit = first[c1].sublimits[i];
                    let composed_sublimit = second_sublimit.compose(first_sublimit);
                    c2_component.sublimits.push(composed_sublimit);
                    //if (!forward) c2_component.data.push(Content.copyData(first[c1].data[i]));
                    if (!forward) c2_component.data.push(first[c1].data[i].copy());
                    // DO WE NEED TO UPDATE C2??
                }
                c1++;

                // If this exhausts c2, then finalize it
                //if (target1 == second[c2].last - 1) {
                //if (c1 == first.length || first[c1].first >= second[c2].last) {
                if (c1 == first.length || analysis1[c1] >= second[c2].last) {
                    if (forward) c2_component.data = Content.copyData(second[c2].data);
                    while (c2_component.sublimits.length < c2_component.last - c2_component.first) {
                        let index = second[c2].sublimits.length - c2_component.last
                            + c2_component.first + c2_component.sublimits.length;
                        let second_sublimit = second[c2].sublimits[index];
                        c2_component.sublimits.push(second_sublimit.copy());
                        if (!forward) c2_component.data.push(second[c2].data[index].copy())
                    }
                    new_components.push(new LimitComponent(this.n, c2_component));
                    c2_component = { sublimits: [], data: [] };
                    c2++;
                }
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
        if (forward) return new ForwardLimit(this.n, new_components, null, first.dt + second.dt);
        else return new BackwardLimit(this.n, new_components, null, first.dt + second.dt);
    }

}

class ForwardLimit extends Limit {

    constructor(n, components, framing, dt) {
        if (components === undefined) return super(n);
        super(...components);
        super.initialize(n, framing, dt);
        _validate(this);
        return this;
    }
    /*
        splice(...args) {
            return super.splice(...args);
        }
        */

    validate() {
        super.validate();
        for (let i = 0; i < this.length; i++) {
            _assert(this.n == 0 || this[i].data.length == 1);
        }
    }

    rewrite(diagram) {
        diagram.t += this.dt;
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
        return new ForwardLimit(this.n, new_components, this.framing, this.dt);
    }

    compose(second) {
        return super.compose(second, true);
    }

    subLimit(n) {
        return super.subLimit(n, true);
    }

    // Supposing this limit goes from source to target, construct the equivalent backward limit.
    getBackwardLimit(source, target) {
        _assert(source instanceof Diagram && target instanceof Diagram);
        _validate(source, target);
        _assert(source.n == this.n);
        _assert(target.n == this.n);
        if (this.n == 0) {
            if (this.length == 0) return new BackwardLimit(0, []);
            else return new BackwardLimit(0, [new LimitComponent(0, { type: source.type })], this.framing, this.dt);
        }
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
        return new BackwardLimit(this.n, new_components, null, this.dt);
    }
}

class BackwardLimit extends Limit {
    constructor(n, components, framing, dt) {
        if (components === undefined) return super(n);
        super(...components);
        super.initialize(n, framing, dt);
        _validate(this);
        return this;
        //return super(n, components, framing); // call the Limit constructor
    }

    validate() {
        super.validate();
        for (let i = 0; i < this.length; i++) {
            if (this.n > 0) _assert(this[i].sublimits.length == this[i].data.length);
        }
    }

    rewrite(diagram) {
        _assert(diagram instanceof Diagram);
        _validate(this, diagram);
        diagram.t -= this.dt;
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
        return new BackwardLimit(this.n, new_components, this.framing, this.dt);
    }
    compose(second) {
        return super.compose(second, false);
    }
    subLimit(n) {
        return super.subLimit(n, false);
    }
    // Supposing this limit goes from source to target, construct the equivalent backward limit.
    getForwardLimit(source, target) {
        _assert(source instanceof Diagram && target instanceof Diagram);
        _validate(this, source, target);
        _assert(source.n == this.n);
        _assert(target.n == this.n);
        if (this.n == 0) {
            if (this.length == 0) return new ForwardLimit(0, []);
            else return new ForwardLimit(0, [new LimitComponent(0, { type: target.type })], this.framing, this.dt);
        }
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
        return new ForwardLimit(this.n, new_components, null, this.dt);
    }
}

class Monotone extends Array {
    constructor(target_size, values) {
        super();
        for (let i = 0; i < values.length; i++) {
            this[i] = values[i];
        }
        this.target_size = target_size;
        _validate(this);
    }
    validate() {
        _assert(isNatural(this.target_size));
        for (let i = 0; i < this.length; i++) {
            _assert(isNatural(this[i]));
            if (i > 0) _assert(this[i - 1] <= this[i]);
        }
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
    equals(second, n) {
        if (n == null) n = this.length;
        let first = this;
        if (first.length != second.length) return false;
        if (first.target_size != second.target_size) return false;
        for (let i = 0; i < n; i++) {
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
        if (swap) return { first: data.second, second: data.first };
        return data;
    }

    // Unify with a second monotone, with the indicated tendency to the right if specified. Throws exception on failure.
    unify({ second, right, depth }) {
        let first = this;
        _assert(second instanceof Monotone);
        _assert(first.length == second.length);
        _assert(right == null || (typeof (right) == 'boolean'));
        _assert(depth == null || !isNaN(depth));
        if (depth == null) {
            if (first.length == 0) {
                if (first.target_size > 0 && second.target_size > 0) {
                    if (right == null) throw "no monotone unification";
                    else if (right == false) return Monotone.union(first.target_size, second.target_size);
                    else return Monotone.union(second.target_size, first.target_size, true);
                }
                else if (first.target_size == 0) return { first: second.copy(), second: Monotone.getIdentity(second.target_size) };
                else if (second.target_size == 0) return { first: Monotone.getIdentity(first.target_size), second: first.copy() };
                else _assert(false); // Above cases should be exclusive
            }
            //return this.unify({ second, right, depth: first.length }); // begin the induction
            depth = first.length;
        }
        if (depth == 0) return { first: new Monotone(0, []), second: new Monotone(0, []) }; // base case
        let injections = this.unify({ second, right, depth: depth - 1 }); // recursive step
        _assert(injections.first instanceof Monotone);
        _assert(injections.second instanceof Monotone);
        _assert(injections.first.target_size == injections.second.target_size);
        let n = depth;
        let left_delta = first[n - 1] + (n == 1 ? 1 : -first[n - 2]);
        let right_delta = second[n - 1] + (n == 1 ? 1 : -second[n - 2]);
        if (left_delta > 1 && right_delta > 1) {
            // If we haven't been given a tendency, fail
            if (right == null) throw "no monotone unification at depth " + depth + ", cannot unify head-to-head monotones without a bias";
            let major = right ? { monotone: injections.second, delta: right_delta } : { monotone: injections.first, delta: left_delta };
            let minor = right ? { monotone: injections.first, delta: left_delta } : { monotone: injections.second, delta: right_delta };
            for (let i = 0; i < major.delta - 1; i++) major.monotone.grow();
            minor.monotone.target_size += major.delta - 1;
            for (let i = 0; i < minor.delta - 1; i++) minor.monotone.grow();
            major.monotone.target_size = minor.monotone.target_size;
            let t = injections.first.target_size;
            injections.first.append(t);
            injections.second.append(t);
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
            // Append any trailing elements to the injections
            let left_trailing = first.target_size - first.last() - 1;
            let right_trailing = second.target_size - second.last() - 1;
            if (right == null && left_trailing > 0 && right_trailing > 0) throw "no monotone unification at depth " + depth + ", cannot unify head-to-head trailing elements without a bias";
            let major = right ? { monotone: injections.second, delta: right_trailing } : { monotone: injections.first, delta: left_trailing };
            let minor = right ? { monotone: injections.first, delta: left_trailing } : { monotone: injections.second, delta: right_trailing };
            for (let i = 0; i < major.delta; i++) major.monotone.grow();
            minor.monotone.target_size += major.delta;
            for (let i = 0; i < minor.delta; i++) minor.monotone.grow();
            major.monotone.target_size = minor.monotone.target_size;

            // Perform final consistency checks
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
    preimage(value) {
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
    static identity(n) {
        _assert(isNatural(n));
        let arr = [];
        for (let i = 0; i < n; i++) {
            arr.push(i);
        }
        return new Monotone(n, arr);
    }

    static coequalize(M1, M2, n) {
        _assert(M1 instanceof Monotone && M2 instanceof Monotone);
        _assert(M1.target_size == M2.target_size);
        _assert(M1.length == M2.length);
        if (n == null) n = M1.length;

        // Base case
        if (n == 0) return Monotone.identity(M1.target_size);

        // Inductive case
        let c = Monotone.coequalize(M1, M2, n - 1);

        let v1 = M1[n-1];
        let v2 = M2[n-1];
        let min = Math.min(v1, v2);
        let max = Math.max(v1, v2);

        // In c, contract everything in this range
        let delta = c[max] - c[min];
        for (let i=c[min] + 1; i<c[max]; i++) {
            c[i] = c[min];
        }
        for (let i=c[max]; i<c.length; i++) {
            c[i] -= delta;
        }
        c.target_size -= delta;

        _assert(c.compose(M1).equals(c.compose(M2), n));
        return c;

    }
}
