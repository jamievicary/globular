"use strict";
/*global RegisterSingularityFamily*/
/*global Diagram*/

RegisterSingularityFamily({
    family: 'Int',
    dimension: 3,
    members: ['Int', 'IntI0'],
    friendly: {'Int': 'Interchanger'}
});

Diagram.prototype.expand.Int = function(type, x, n, m) {

    var list = new Array();
    if (n === 0 || m === 0) {
        return [];
    } else if (n === 1 && m === 1) {
        if (type === 'Int') {
            list.push(new NCell({id: type, key: [x]}));
        } else {
            list.push(new NCell({id: type, key: [x + 1]}));
        }
    } else if (m != 1 && n === 1) {
        list = this.expand(type, x, 1, 1).concat(this.expand(type, x + 1, 1, m - 1));
    } else {
        list = this.expand(type, x + n - 1, 1, m).concat(this.expand(type, x, n - 1, m));
    }

    return list;
};

Diagram.prototype.reorganiseCrossings.Int = function(type, x, n, m) {

    var list = new Array();
    if(n === 0 &  m === 0) {return list;}
    if((n === 0 & m != 0) || (n != 0 & m === 0)) {return false;}

        for (var i = 1; i < m; i++) {
            list = list.concat(this.expand(type, x + i, i * (n - 1), 1));
        }
        if(n > 1){
            list = list.concat(this.reorganiseCrossings(type, x + m, n - 1, m));
        }

    return list;
}

// Interpret drag of this type, assuming we are matching to the source
Diagram.prototype.interpretDrag.Int = function(drag) {
    if (drag.directions == null) return [];
    if (drag.coordinates.length > 1) return [];
    var r = {};
    var h = drag.coordinates[0];
    if (drag.directions[0] > 0) {
        r.left = {
            id: 'IntI0',
            key: [h + 1],
            possible: this.interchangerAllowed('IntI0', [h + 1])
        };
        r.right = {
            id: 'Int',
            key: [h],
            possible: this.interchangerAllowed('Int', [h])
        };
    } else {
        r.left = {
            id: 'Int',
            key: [h - 1],
            possible: this.interchangerAllowed('Int', [h - 1])
        };
        r.right = {
            id: 'IntI0',
            key: [h],
            possible: this.interchangerAllowed('IntI0', [h])
        };
    }
    // Return the best match in a permissive way
    if (!r.left.possible && !r.right.possible) return [];
    if (r.left.possible && r.right.possible) return (drag.directions[1] < 0 ? [r.left] : [r.right]);
    if (r.left.possible) return [r.left];
    return [r.right];
}

Diagram.prototype.tidyKey.Int = function(type, key) {
    return [key.last()];
}

Diagram.prototype.interchangerAllowed.Int = function(type, key) {
    
    if (key.length != 1) {
        debugger;
        return false;
    }

    // Sanity check - necessary for degenerate cases
    var x = key.last();
    if (x < 0) return false;
    
    // Main test
    if (type === 'Int') {
        if (x == this.cells.length - 1) return false;
        return (this.cells[x].box.min.last() >= this.cells[x + 1].box.min.last() + this.source_size(x + 1));
    }
    if (type.tail('IntI0')) {
        if (x == 0) return false;
        var delta = this.target_size(x - 1) - this.source_size(x - 1);
        return (this.cells[x - 1].box.min.last() + this.target_size(x - 1) <= this.cells[x].box.min.last());
    }
}

Diagram.prototype.rewritePasteData.Int = function(type, key) {
    if (key.length != 1) debugger;
    var x = key.last();
    if (type.tail('Int')) {
        var cell1 = this.cells[x].copy();
        var cell2 = this.cells[x + 1].copy();
        return [cell2, cell1.move([{
            relative: this.target_size(x + 1) - this.source_size(x + 1)
        }])];
    }
    if (type.tail('IntI0')) {
        var cell1 = this.cells[x - 1].copy();
        var cell2 = this.cells[x].copy();
        return [cell2.move([{
            relative: this.source_size(x - 1) - this.target_size(x - 1)
        }]), cell1];
    }
};

Diagram.prototype.getInterchangerCoordinates.Int = function(type, key) {

    //if (key.length === 0) return [];
    if (key.length != 1) debugger;

    var diagram_pointer = this;
    var x = key.last();

    if (key.length === 1) {
        if (type.tail('Int')) {
            list = this.cells[x + 1].box.min.slice(0);
        } else if (type.tail('IntI0')) {
            x--;
            list = this.cells[x].box.min.slice(0);
        } else {
            var list = this.cells[x].box.min.slice(0);
        }

        return list.concat([x]);
    }

    var new_type = type.slice(0, type.length - 2);
    return diagram_pointer.getSlice(x).getInterchangerCoordinates(new_type, key.slice(0, key.length - 1)).concat([x]);

};

Diagram.prototype.getInterchangerBoundingBox.Int = function(type, key) {
    if (key.length != 1) debugger;

    var position = this.getInterchangerCoordinates(type, key);
    var x = key.last();

    if (type.tail('Int')) {
        return this.unionBoundingBoxes(this.getLocationBoundingBox([x]), this.getLocationBoundingBox([x+1]));
        /*
        return {
            min: position,
            max: position.slice().move([{
                    absolute: this.cells[x].box.min.last() - position.penultimate() + this.source_size(x)
                },
                {
                    relative: 2
                }])
        };
        */
    } else if (type.tail('IntI0')) {
        return this.unionBoundingBoxes(this.getLocationBoundingBox([x]), this.getLocationBoundingBox([x-1]));
        /*
        return {
            min: position,
            max: position.slice().move([{
                absolute: this.cells[x - 1].box.min.last() - position.penultimate() + this.source_size(x)
            }, {
                relative: 2
            }])
        };
        */
    }
};

Diagram.prototype.getInverseKey.Int = function(type, key) {
    if (key.length != 1) debugger
    if (type.tail('Int')) return [key.last() + 1];
    else if (type.tail('IntI0')) return [key.last() - 1];
};

