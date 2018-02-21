"use strict";

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

    static test() {
        Monotone.multiUnify_test();
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
    unify({ second, right, fibre }, n) {
        let first = this;
        _assert(second instanceof Monotone);
        _assert(first.length == second.length);
        _assert(right == null || (typeof (right) == 'boolean'));
        _assert(n == null || isNatural(n));
        if (fibre) {
            _propertylist(fibre, ['L1F1M', 'L1F2M', 'L2F1M', 'L2F2M']) // check arguments
            _assert(fibre.L1F1M.target_size == fibre.L2F1M.target_size); // agreement on F1 size
            _assert(fibre.L1F2M.target_size == fibre.L2F2M.target_size); // agreement on F2 size
        }
        if (n == null) {
            /*
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
            */
            //return this.unify({ second, right, depth: first.length }); // begin the induction
            n = first.length + 1; // add an extra element for a 'tidying up' pass
        }

        // Base case
        if (n == 0) return { first: new Monotone(0, []), second: new Monotone(0, []), fibre: fibre ? { J1M: new Monotone(0, []), J2M: new Monotone(0, []) } : null }; // base case

        // Recursive case
        let injections = this.unify({ second, right, fibre }, n - 1);
        _assert(injections.first instanceof Monotone);
        _assert(injections.second instanceof Monotone);
        _assert(injections.first.target_size == injections.second.target_size);
        let left_delta = (n > first.length ? first.target_size : first[n - 1]) + (n == 1 ? 1 : -first[n - 2]);
        let right_delta = (n > first.length ? second.target_size : second[n - 1]) + (n == 1 ? 1 : -second[n - 2]);
        /*
        let left_delta = first[n-1] + (n == 1 ? 1 : -first[n - 2]);
        let right_delta = second[n - 1] + (n == 1 ? 1 : -second[n - 2]);
        */
        if (left_delta > 1 && right_delta > 1) {

            // Iterate through the elements to be ordered
            let left_start = (n == 1) ? 0 : (first[n - 2] + 1);
            let right_start = (n == 1) ? 0 : (first[n - 2] + 1);
            let left_done = 0;
            let right_done = 0;
            while (left_done < left_delta - 1 || right_done < right_delta - 1) {
                let preference; // negative for left, zero for both, positive for right
                let left_pos = left_start + left_done;
                let right_pos = right_start + right_done;
                if (fibre) {
                    if (left_done == left_delta - 1) preference = +1; // check consistency with fibre?
                    else if (right_done == right_delta - 1) preference = -1; // check consistency with fibre?
                    else { // Get preference by looking at ordering in fibres
                        let f1_order = fibre.L1F1M[left_pos] - fibre.L2F1M[right_pos];
                        let f2_order = fibre.L1F2M[left_pos] - fibre.L2F2M[right_pos];
                        if (f1_order == 0 || f2_order == 0) preference = 0;
                        else if (f1_order == f2_order) preference = f1_order;
                        else throw "inconsistent fibre ordering";
                    }
                } else if (right != null) {
                    if (left_done == left_delta - 1) preference = +1;
                    else if (right_done == right_delta - 1) preference = -1;
                    else preference = right ? 1 : -1;
                } else throw "no monotone unification at depth " + n + ", cannot unify head-to-head monotones without a bias";

                if (fibre) {
                    if (preference < 0) {
                        injections.fibre.J1M.append(fibre.L1F1M[left_pos]);
                        injections.fibre.J2M.append(fibre.L1F2M[left_pos]);
                    } else if (preference == 0) {

                    } else { // preference == -1
                        injections.fibre.J1M.append(fibre.L2F1M[right_pos]);
                        injections.fibre.J2M.append(fibre.L2F2M[right_pos]);
                    }
                }

                if (preference < 0) {
                    injections.first.grow();
                    injections.second.target_size++;
                    left_done++;
                } else if (preference == 0) {
                } else { // preference > 0
                    injections.second.grow();
                    injections.first.target_size++;
                    right_done++;
                }
            }

            if (n <= first.length) {
                let t = injections.first.target_size;
                injections.first.append(t);
                injections.second.append(t);
                if (fibre) {
                    injections.fibre.J1M.grow();
                    injections.fibre.J2M.grow();
                }
            }

            /*
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
            */

        } else if (left_delta == 0 || right_delta == 0) {
            let t = injections.first.target_size;
            while (injections.first.length <= first[n - 1]) injections.first.push(t - 1);
            while (injections.second.length <= second[n - 1]) injections.second.push(t - 1);
            // target not changing so no need to update J1M, J2M?
        } else { // deltas (1,>1) or (>1,1)
            // fibre analysis at 2018-2-ANC-30
            for (let i = 0; i < left_delta - 1; i++) {
                if (fibre) injections.fibre.J1M.append(fibre.L1F1M[injections.first.length]);
                if (fibre) injections.fibre.J2M.append(fibre.L1F2M[injections.first.length]);
                injections.first.grow();
            }
            for (let i = 0; i < right_delta - 1; i++) {
                if (fibre) injections.fibre.J1M.append(fibre.L2F1M[injections.second.length]);
                if (fibre) injections.fibre.J2M.append(fibre.L2F2M[injections.second.length]);
                injections.second.grow();
            }
            let t = (left_delta > 1 ? injections.first.target_size : injections.second.target_size);
            if (n <= first.length) {
                injections.first.append(t);
                injections.second.append(t);
                if (fibre) {
                    injections.fibre.J1M.grow();
                    injections.fibre.J2M.grow();
                }
            } else {
                injections.first.target_size = t;
                injections.second.target_size = t;
            }
        }
        if (n == first.length + 1) {
            // Append any trailing elements to the injections
            /*
            let left_trailing = first.target_size - first.last() - 1;
            let right_trailing = second.target_size - second.last() - 1;
            if (right == null && left_trailing > 0 && right_trailing > 0) throw "no monotone unification at depth " + n + ", cannot unify head-to-head trailing elements without a bias";
            let major = right ? { monotone: injections.second, delta: right_trailing } : { monotone: injections.first, delta: left_trailing };
            let minor = right ? { monotone: injections.first, delta: left_trailing } : { monotone: injections.second, delta: right_trailing };
            for (let i = 0; i < major.delta; i++) major.monotone.grow();
            minor.monotone.target_size += major.delta;
            for (let i = 0; i < minor.delta; i++) minor.monotone.grow();
            major.monotone.target_size = minor.monotone.target_size;
            */

            // Perform final consistency checks
            _assert(injections.first.length == first.target_size);
            _assert(injections.second.length == second.target_size);
            _assert(injections.first.target_size == injections.second.target_size);
            _assert(injections.first.compose(first).equals(injections.second.compose(second)));
            if (fibre) { // See 2018-2-ANC-29
                _assert(injections.fibre);
                _assert(injections.fibre.J1M.length == injections.first.target_size);
                _assert(injections.fibre.J2M.length == injections.first.target_size);
                _assert(injections.fibre.J1M.target_size == fibre.L1F1M.target_size);
                _assert(injections.fibre.J2M.taret_size == fibre.L1F2M.target_size);
                let J1M = injections.fibre.J1M;
                let J2M = injections.fibre.J2M;
                let I1 = injections.first;
                let I2 = injections.second;
                let f = fibre;
                _assert(J1M.compose(I1).equals(f.L1F1M));
                _assert(J2M.compose(I2).equals(f.L2F2M));
                _assert(J1M.compose(I2).equals(f.L2F1M));
                _assert(J2M.compose(I1).equals(f.L1F2M));
            }
        }
        return injections;
    }

    copy() {
        let m = new Monotone(this.target_size, []);
        for (let i = 0; i < this.length; i++) m[i] = this[i];
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
        if (!isNatural(value)) {
            _propertylist(value, ['first', 'last']);
        }
        let min, max;
        if (isNatural(value)) {
            min = value;
            max = value + 1;
        } else {
            min = value.first;
            max = value.last;
        }
        let first = null;
        let last = null;
        let pos = 0;
        while (this[pos] < min) pos++;
        first = pos;
        while (pos < this.length && this[pos] < max) pos++;
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

    // Coequalize two monotones, cannot fail. NOT USED.
    static coequalize(M1, M2, n) { // n is recursive parameter
        _assert(M1 instanceof Monotone && M2 instanceof Monotone);
        _assert(M1.target_size == M2.target_size);
        _assert(M1.length == M2.length);
        if (n == null) n = M1.length;

        // Base case
        if (n == 0) return Monotone.identity(M1.target_size);

        // Recursive case
        let c = Monotone.coequalize(M1, M2, n - 1);

        let v1 = M1[n - 1];
        let v2 = M2[n - 1];
        let min = Math.min(v1, v2);
        let max = Math.max(v1, v2);

        // In c, contract everything in this range
        let delta = c[max] - c[min];
        for (let i = c[min] + 1; i < c[max]; i++) {
            c[i] = c[min];
        }
        for (let i = c[max]; i < c.length; i++) {
            c[i] -= delta;
        }
        c.target_size -= delta;

        _assert(c.compose(M1).equals(c.compose(M2), n));
        return c;
    }

    static multiUnify_test() {
        let result = Monotone.multiUnify({ lower: [{ left: { target: 0, monotone: new Monotone(3, [0, 2]) }, right: { target: 1, monotone: new Monotone(4, [0, 1]) } }], upper: [3, 4] });
        _assert(result[0].equals(new Monotone(5, [0, 1, 2])) && result[1].equals(new Monotone(5, [0, 2, 3, 4])));

        let result2 = Monotone.multiUnify({ lower: [{ left: { target: 0, monotone: new Monotone(2, [0]) }, right: { target: 1, monotone: new Monotone(2, [1]) } }, { left: { target: 0, monotone: new Monotone(2, [1]) }, right: { target: 1, monotone: new Monotone(2, [0]) } }], upper: [2, 2] });
        _assert(result2[0].equals(new Monotone(1, [0, 0])) && result2[1].equals(new Monotone(1, [0, 0])));
    }

    // Simultaneously unify an entire diagram of monotones
    static multiUnify({ lower, upper }) {
        let upper_included = [];
        for (let i = 0; i < upper.length; i++) {
            _assert(isNatural(upper[i]));
            upper_included[i] = false;
        }

        let lower_included = [];
        for (let i = 0; i < lower.length; i++) {
            _propertylist(lower[i], ['left', 'right']);
            _propertylist(lower[i].left, ['target', 'monotone']);
            _propertylist(lower[i].right, ['target', 'monotone']);
            _assert(lower[i].left.monotone instanceof Monotone && lower[i].right.monotone instanceof Monotone);
            let lt = lower[i].left.target;
            _assert(lower[i].left.monotone.length == lower[i].right.monotone.length);
            _assert(lower[i].left.target < upper.length && lower[i].right.target < upper.length);
            _assert(lower[i].left.monotone.target_size == upper[lower[i].left.target]);
            _assert(lower[i].right.monotone.target_size == upper[lower[i].right.target]);
            _assert(lower[i].left.length == lower[i].right.length);
            lower_included[i] = false;
        }

        // Build the first part of the cocone
        let cocone = [];
        cocone[0] = Monotone.getIdentity(upper[0]);
        upper_included[0] = true;

        // Pass through repeatedly until no further unifications can be made
        while (Monotone.multiUnify_singlePass({ lower_included, upper_included, lower, upper, cocone })) { };

        // Check that all levels have been included
        for (let i = 0; i < lower.length; i++) _assert(lower_included[i]);
        for (let i = 0; i < upper.length; i++) _assert(upper_included[i]);

        // Return the cocone data that has been computed
        return cocone;
    }

    static multiUnify_singlePass({ lower_included, upper_included, lower, upper, cocone }) {

        let changed = false;
        for (let i = 0; i < lower.length; i++) {

            // If this part has already been included, skip it
            if (lower_included[i]) continue;

            let left_inc = upper_included[lower[i].left.target];
            let right_inc = upper_included[lower[i].right.target];

            // If neither upper target is included, handle this component later, as it's disconnected
            if (!left_inc && !right_inc) continue;

            if (left_inc && right_inc) { // If both upper targets are included, then glue in the lower object
                Monotone.multiUnify_glueLower({ i, lower_included, upper_included, lower, upper, cocone });
            } else { // Only one upper target is included, so glue the other one in with respect to the base.
                if (left_inc) {
                    Monotone.multiUnify_glueBoth({ lower, upper, cocone, new_data: lower[i].right, old_data: lower[i].left });
                } else {
                    Monotone.multiUnify_glueBoth({ lower, upper, cocone, new_data: lower[i].left, old_data: lower[i].right });
                }
            }
            lower_included[i] = true;
            upper_included[lower[i].left.target] = true;
            upper_included[lower[i].right.target] = true;
            changed = true;
        }

        return changed;
    }


    // Glue in new_data with respect to old_data
    static multiUnify_glueBoth({ lower, upper, cocone, new_data, old_data }) {

        // Get the pushout of the old data with the new data
        let leg_1 = cocone[old_data.target].compose(old_data.monotone);
        let leg_2 = new_data.monotone;
        let pushout = leg_1.unify({ second: leg_2, right: true });

        // Compose this pushout with existing cocone data
        for (let k = 0; k < upper.length; k++) {
            if (cocone[k] == null) continue;
            cocone[k] = pushout.first.compose(cocone[k]);
        }

        // Add new cocone
        cocone[new_data.target] = pushout.second;
    }

    static multiUnify_glueLower({ i, lower_included, upper_included, lower, upper, cocone }) {
        let base = lower[i];
        for (let j = 0; j < base.left.monotone.length; j++) {
            let left_element = cocone[base.left.target][base.left.monotone[j]];
            let right_element = cocone[base.right.target][base.right.monotone[j]];
            if (left_element == right_element) continue;
            let collapse = Monotone.getCollapseMonotone(cocone[base.left.target].target_size, left_element, right_element);
            for (let k = 0; k < upper.length; k++) {
                if (cocone[k] == null) continue;
                cocone[k] = collapse.compose(cocone[k]);
            }
            _assert(cocone[base.left.target][base.left.monotone[j]] == cocone[base.right.target][base.right.monotone[j]]);
        }
    }

    // Buid a collapsing monotone that identifies the elements first and last
    static getCollapseMonotone(target_size, a, b) {
        if (a == b) return Monotone.getIdentity(target_size);
        let first = Math.min(a, b);
        let last = Math.max(a, b);
        let arr = [];
        for (let i = 0; i < first; i++) {
            arr.push(i);
        }
        for (let i = first; i <= last; i++) {
            arr.push(first);
        }
        for (let i = last + 1; i < target_size; i++) {
            arr.push(i - last + first);
        }
        return new Monotone(target_size - last + first, arr);
    }
}
