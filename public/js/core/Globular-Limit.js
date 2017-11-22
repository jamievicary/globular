"use strict";

class Content {
    constructor (forward_limit, backward_limit) {
        this.forward_limit = forward_limit;
        this.backward_limit = backward_limit;
    }
    getLastId() {
        return this.forward_limit.components.last().getLastId();
    }
    copy () {
        return new Content(this.forward_limit.copy(), this.backward_limit.copy());
    }
    static copyData(data) {
        if ((typeof data) === 'string') return data;
        if (!data) return data;
        let new_data = [];
        for (let i=0; i<data.length; i++) {
            new_data.push(data[i].copy());
        }
        return new_data;
    }
}

class LimitComponent {
    // Variables
    // data :: Array(Content)
    // first :: Number, the first regular slice affected
    // last :: Number, the last regular slice affected
    // sublimits :: Array, an array of ForwardLimits
    // contract :: String, optional, an indication that this component just contracts to the given type
    constructor (contract, data, first, last, sublimits) {
        this.contract = contract;
        this.data = data;
        this.first = first;
        this.last = last;
        this.sublimits = sublimits;
    }
    getLastId() {
        if (this.contract) return this.contract;
        _assert(false); // ... to write ...
    }
    copy () {
        let new_data = Content.copyData(this.data);
        let new_sublimits = undefined;
        if (this.sublimits) {
            new_sublimits = [];
            for (let i=0; i<this.sublimits.length; i++) {
                new_sublimits.push(this.sublimits[i].copy());
            }
        }
        return new LimitComponent(this.contract, new_data, this.first, this.last, new_sublimits);
    }
}

class ForwardLimit {
    // Variables
    // components :: Array(LimitComponent)
    constructor (components) {
        this.components = components;
    }

    rewrite (diagram) {
        for (let i = this.components.length - 1; i >= 0; i--) {
            let c = this.components[i];
            if (c.contract) {
                diagram.data = c.contract;
            } else {
                diagram.data.splice(c.first, c.last - c.first, c.data[0])
            }
        }
        diagram.type_dimension++;    
        return diagram;
    }

    copy () {
        let new_components = [];
        for (let i=0; i<this.components.length; i++) {
            new_components.push(this.components[i].copy());
        }
        return new ForwardLimit(new_components);
    }
}


class BackwardLimit {
    // Variables
    // components :: Array(LimitComponent)
    constructor (components) {
        this.components = components;
    }

    rewrite(diagram) {
        diagram.type_dimension --;
        if (diagram.geometric_dimension == 0) {
            diagram.data = this.components[0].data;
            return diagram;
        }
        let offset = 0;
        for (let i = 0; i < this.components.length; i++) {
            let c = this.components[i];
            let before = diagram.data.slice(0, c.first + offset);
            let after = diagram.data.slice(c.first + offset + 1, diagram.data.length);
            diagram.data = before.concat(c.data.concat(after));
            //diagram.data = diagram.data.slice(0, c.first + offset).concat(c.data.concat(diagram.data.slice(c.first + offset + 1, diagram.data.length)));
            offset += c.first - c.last;
        }
        return diagram;
    }

    copy () {
        let new_components = [];
        for (let i=0; i<this.components.length; i++) {
            new_components.push(this.components[i].copy());
        }
        return new BackwardLimit(new_components);
    }
}
