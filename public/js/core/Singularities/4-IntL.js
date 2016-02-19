"use strict";

/*global RegisterSingularityFamily*/
/*global Diagram*/
/*global diff_array*/

// Data for the IntL family of singularities
// These are 4-cell pull-throughs

RegisterSingularityFamily({
    family: 'IntL',
    dimension: 4,
    members: ['Int-L', 'Int-LI0', 'IntI0-L', 'IntI0-LI0', 'Int-R', 'Int-RI0', 'IntI0-R', 'IntI0-RI0'],
    friendly: {
        'Int-L': 'Pull-through interchanger above',
        'IntI0-L': 'Pull-through interchanger underneath',
        'Int-R': 'Pull-through inverse interchanger underneath',
        'IntI0-R': 'Pull-through inverse interchanger above'
    }
});

Diagram.prototype.expand.IntL = function(type, data, n, m) {

    var x = data.up;
    var y = data.across;
    var l = data.length;
    var list_one = new Array(); 
    
    if(n === 0 || m === 0) return [];

    var list = new Array();
    var new_l = l + (this.target_size(x) - this.source_size(x));
    var penultimate_l = l;
    for (var i = 0; i < n - 1; i++) {
        penultimate_l += (this.target_size(x + i) - this.source_size(x + i));
    }
    var b = this.cells[x].box.min.last() - y;
    var a = l - this.source_size(x) - b;

    if(a < 0 || b < 0) {return false;}

    var expansion_base = this.copy();

    if (n === 0 || m === 0) {
        return [];
    }

    if (n === 1 && m === 1) {
        if (a === 0 && b === 0) {
            list.push(new NCell({id: type, key: [x]}));
        } else {

            if (type.tail('LI0')) {
                list_one = this.expand('IntI0', x - b * m, b * m, 1).concat([new NCell({id: type, key: [x - b * m]})]);
                if(!expansion_base.multipleInterchangerRewrite(list_one)) {return false;}
                list = list_one.concat(expansion_base.expand('Int', x - this.source_size(x) - (a + b) * m, a * m, 1));
            }
            else if (type.tail('L')){
                list_one = this.expand('IntI0', x, 1, a * m).concat([new NCell({id: type, key: [x + a * m]})]);
                if(!expansion_base.multipleInterchangerRewrite(list_one)) {return false;}
                list = list_one.concat(expansion_base.expand('Int', x + this.source_size(x) + a * m, 1, b * m));
            } else if (type.tail('RI0')) {
                list_one = this.expand('Int', x - a * m, a * m, 1).concat([new NCell({id: type, key: [x - a * m]})]);
                if(!expansion_base.multipleInterchangerRewrite(list_one)) {return false;}
                list = list_one.concat(expansion_base.expand('IntI0', x - this.source_size(x) - (a + b) * m, b * m, 1));
            }
            else if (type.tail('R')){
                list_one = this.expand('Int', x, 1, b * m).concat([new NCell({id: type, key: [x + b * m]})]);
                if(!expansion_base.multipleInterchangerRewrite(list_one)) {return false;}
                list = list_one.concat(expansion_base.expand('IntI0', x + this.source_size(x) + b * m, 1, a * m));
            }
        }
    } else{
        if (type.tail('I0')) {
            list_one = this.expand(type, {up: x, across: y, length: l}, 1, 1);
        }
        else{
            list_one = this.expand(type, {up: x + n - 1, across: y, length: penultimate_l}, 1, 1);
        }
        if(!expansion_base.multipleInterchangerRewrite(list_one)) {return false;}
            
        if (m != 1 && n === 1) {
            if (type.tail('I0')) {
                list = list_one.concat(expansion_base.expand(type, {up: x - a - b - this.source_size(x), across: (type.tail('LI0')) ? y - 1: y + 1, length: l}, 1, m - 1));
            } else{
                list = list_one.concat(expansion_base.expand(type, {up: x + a + b + this.source_size(x), across: (type.tail('L')) ? y + 1: y - 1, length: l}, 1, m - 1));
            }
        } else {
            if (type.tail('I0')) {
                list = list_one.concat(expansion_base.expand(type, {up: x + 1 - (this.source_size(x) - this.target_size(x)) , across: y, length: new_l}, n - 1, m));
            } else{
                list = list_one.concat(expansion_base.expand(type, {up: x, across: y, length: l}, n - 1, m));
            }
        }
    } 
    return list;
};


Diagram.prototype.pseudoExpand.IntL = function(box, side_wires) {
    var count = 0;
    var l = box.max.penultimate() - box.min.penultimate();
    for(var i = box.min.last(); i < box.max.last(); i++){
        var left_wires = this.cells[i].key.last() - box.min.penultimate();
        var right_wires = l - this.source_size(i) - left_wires;
        count += (left_wires + right_wires + 1) * side_wires;
        l += (this.target_size(i) - this.source_size(i));
    }
    return count;
};

/*
Diagram.prototype.expansionStepsDown.IntL = function(box, side_wires) {
    var count = 0;
    var l = box.max.penultimate() - box.min.penultimate();
    for(var i = box.min.last(); i < box.max.last(); i++){
        var left_wires = this.cells[i].key.last() - box.min.penultimate();
        var right_wires = l - this.source_size(i) - left_wires;
        count += (left_wires + right_wires + 1) * side_wires;
        l += (this.target_size(i) - this.source_size(i));
    }
    return count;
};

Diagram.prototype.expansionStepsUp.IntL = function(box, side_wires) {
    var count = 0;
    var l = box.max.penultimate() - box.min.penultimate();
    for(var i = box.min.last(); i < box.max.last(); i++){
        var left_wires = this.cells[i].key.last() - box.min.penultimate();
        var right_wires = l - this.source_size(i) - left_wires;
        count += (left_wires + right_wires + 1) * side_wires;
        l += (this.target_size(i) - this.source_size(i));
    }
    return count;
};
*/


// Interpret drag of this type
Diagram.prototype.interpretDrag.IntL = function(drag) {
    if (drag.directions == null) return [];
    if (drag.coordinates.length > 1) return [];
    var up = drag.directions[0] > 0;
    var right = drag.directions[1] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(up ? ['Int-L', 'IntI0-L', 'IntI0-R', 'Int-R'] : ['IntI0-RI0', 'Int-RI0', 'Int-LI0', 'IntI0-LI0'], key);

    // Collect the possible options
    var possible_options = [];
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            possible_options.push(options[i]);
        }
    }

    if (possible_options.length == 0) {
        return [];
    }
    if (possible_options.length == 1) return [possible_options[0]];

    // Otherwise select based on secondary direction
    if (right) {
        var r1 = options[0];
        var r2 = options[1];
        if (r1.possible && r2.possible) return [r1]; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return [r1];
        if (!r1.possible && r2.possible) return [r2];
        if (options[2].possible) return [options[2]];
        return [options[3]];
    } else {
        var r1 = options[2];
        var r2 = options[3];
        if (r1.possible && r2.possible) return [r1]; // make the thing we pull be 'on top'
        if (r1.possible && !r2.possible) return [r1];
        if (!r1.possible && r2.possible) return [r2];
        if (options[0].possible) return [options[0]];
        return [options[1]];
    }
};

Diagram.prototype.interchangerAllowed.IntL = function(type, key) {
    if (key.length != 1) debugger;

    var x = key.last();
    var box = this.getSliceBoundingBox(x);
    var slice = this.getSlice(x);
    var cell = this.cells[x];
    var coords = cell.box.min;
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);
    var subtype = (type.substr(0, 5) == 'IntI0' ? 'IntI0' : 'Int');
    if (this.cells.length == 0) return false;
    var space_above = (x < this.cells.length - g1_target);
    var space_below = (x >= g1_source);
    var space_left = (coords.last() > 0);
    var space_right = (coords.last() + g1_source < slice.cells.length);

    if (type == 'Int-L') {
        if (!(space_right && space_above)) return false;
        if (!slice.boundingBoxesSlideDownOnLeft(box, slice.getLocationBoundingBox(coords.last() + g1_source))) return false;
        return this.instructionsEquiv(this.cells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last(), g1_target, 1));
    }

    if (type == 'IntI0-L') {
        if (!(space_right && space_above)) return false;
        if (!slice.boundingBoxesSlideDownOnRight(box, slice.getLocationBoundingBox(coords.last() + g1_source))) return false;
        return this.instructionsEquiv(this.cells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last(), g1_target, 1));
    }

    if (type == 'Int-RI0') {
        if (!(space_right && space_below)) return false;
        if (!slice.boundingBoxesSlideDownOnRight(box, slice.getLocationBoundingBox(coords.last() + g1_source))) return false;
        return this.instructionsEquiv(this.cells.slice(x - g1_source, x), this.expand(subtype, coords.last(), 1, g1_source));
    }

    if (type == 'IntI0-RI0') {
        if (!(space_right && space_below)) return false;
        if (!slice.boundingBoxesSlideDownOnLeft(box, slice.getLocationBoundingBox(coords.last() + g1_source))) return false;
        return this.instructionsEquiv(this.cells.slice(x - g1_source, x), this.expand(subtype, coords.last(), 1, g1_source));
    }

    if (type == 'Int-LI0') {
        if (!(space_left && space_below)) return false;
        if (!slice.boundingBoxesSlideDownOnRight(slice.getLocationBoundingBox(coords.last() - 1), box)) return false;
        return this.instructionsEquiv(this.cells.slice(x - g1_source, x), this.expand(subtype, coords.last() - 1, g1_source, 1));
    }

    if (type == 'IntI0-LI0') {
        if (!(space_left && space_below)) return false;
        if (!slice.boundingBoxesSlideDownOnLeft(slice.getLocationBoundingBox(coords.last() - 1), box)) return false;
        return this.instructionsEquiv(this.cells.slice(x - g1_source, x), this.expand(subtype, coords.last() - 1, g1_source, 1));
    }

    if (type == 'Int-R') {
        if (!(space_left && space_above)) return false;
        if (!slice.boundingBoxesSlideDownOnLeft(slice.getLocationBoundingBox(coords.last() - 1), box)) return false;
        return this.instructionsEquiv(this.cells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last() - 1, 1, g1_target));
    }

    if (type == 'IntI0-R') {
        if (!(space_left && space_above)) return false;
        if (!slice.boundingBoxesSlideDownOnRight(slice.getLocationBoundingBox(coords.last() - 1), box)) return false;
        return this.instructionsEquiv(this.cells.slice(x + 1, x + 1 + g1_target), this.expand(subtype, coords.last() - 1, 1, g1_target));
    }
    
    debugger;
    return false;
}

Diagram.prototype.rewritePasteData.IntL = function(type, key) {
    if (key.length != 1) debugger;

    var x = key.last();
    var h = key.last();
    var cell = this.cells[h].copy();
    var coords = cell.box.min.slice(0);
    var heights = this.getInterchangerCoordinates(type, key);
    var d = new Diagram(); // dummy diagram object for Int expansion
    var s = this.source_size(h);
    var t = this.target_size(h);
    var slice = this.getSlice(h);
    var basic_type = (type.substr(0, 5) == 'IntI0' ? 'IntI0' : 'Int');

    // Compute how the coordinates of the key cell should be modified. Falls
    // into two classes, dependingon whether the cell is moving 'right' or 'left.'
    var move_right = type.tail('Int-L', 'IntI0-L', 'Int-RI0', 'IntI0-RI0');
    var behind = type.tail('Int-R', 'Int-RI0', 'IntI0-L', 'IntI0-LI0');
    //var q = move_right ? cell.key.last() + s : cell.key.last() - 1;
    var q = move_right ? cell.box.max.last() : cell.box.min.last() - 1;
    if (q >= slice.cells.length) debugger;
    var movement = [{
            relative: behind ? 0 : ((move_right ? 1 : -1) * (slice.target_size(q) - slice.source_size(q)))
        }, {
            relative: (move_right ? 1 : -1)
        }
    ];

    // Return the target of the rewrite
    if (type.tail('Int-L', 'IntI0-L')) return d.expand(basic_type, coords.last(), s, 1).concat([cell.move(movement)]);
    if (type.tail('Int-RI0', 'IntI0-RI0')) return [cell.move(movement)].concat(d.expand(basic_type, coords.last(), 1, t));
    if (type.tail('Int-R', 'IntI0-R')) return d.expand(basic_type, coords.last() - 1, 1, s).concat([cell.move(movement)]);
    if (type.tail('Int-LI0', 'IntI0-LI0')) return [cell.move(movement)].concat(d.expand(basic_type, coords.last() - 1, t, 1));
    
    // Should never fall through to here
    debugger;

}

Diagram.prototype.tidyKey.IntL = function(type, key) {
    return [key.last()];
}

Diagram.prototype.getInterchangerCoordinates.IntL = function(type, key) {

    var diagram_pointer = this;
    var new_key = key.last();
    var h = key.last();
    var cell = this.cells[h];
    var coords = cell.box.min.slice(0);
    coords.push(h);

    if (type.tail('Int-L', 'IntI0-L')) {
        return coords;
    } else if (type.tail('Int-LI0', 'IntI0-LI0')) {
        return coords.move([{
            relative: -1
        }, {
            relative: -this.source_size(h)
        }]);
    } else if (type.tail('Int-R', 'IntI0-R')) {
        return coords.move([{
            relative: -1
        }, {
            relative: 0
        }]);
    } else if (type.tail('Int-RI0', 'IntI0-RI0')) {
        return coords.move([{
            relative: -this.source_size(h)
        }])
    }
}

Diagram.prototype.getInterchangerBoundingBox.IntL = function(type, key) {
    var x = key.last();
    var coords = this.getInterchangerCoordinates(type, key);
    if (type.tail('R', 'L')) return {
        min: coords,
        max: coords.slice().move([{
            relative: this.source_size(x) + 1
        }, {
            relative: this.target_size(x) + 1
        }])
    };
    if (type.tail('RI0', 'LI0')) return {
        min: coords,
        max: coords.slice().move([{
            relative: this.source_size(x) + 1
        }, {
            relative: this.source_size(x) + 1
        }])
    };
    debugger;
}

Diagram.prototype.getInverseKey.IntL = function(type, key) {
    var x = key.last();
    if (type.tail('R')) return [x + this.source_size(x)];
    else if (type.tail('L')) return [x + this.source_size(x)];
    else if (type.tail('RI0')) return [x - this.source_size(x)];
    else if (type.tail('LI0')) return [x - this.source_size(x)];
}
