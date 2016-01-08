"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-S family
// This is naturality for the 4-cell pull-through


RegisterSingularityFamily({
    family: 'IntLS',
    dimension: 5,
    members: ['Int-L-S', 'Int-L-SI',
    'IntI0-L-S', 'IntI0-L-SI',
    'Int-LI-S', 'Int-LI-SI',
    'IntI0-LI-S', 'IntI0-LI-SI',
    'Int-R-S', 'Int-R-SI',
    'IntI0-R-S', 'IntI0-R-SI',
    'Int-RI-S', 'Int-RI-SI',
    'IntI0-RI-S', 'IntI0-RI-SI']
});


Diagram.prototype.getSource.IntLS = function(type, key) {
    
    var coord = this.getInterchangerCoordinates(type, key);
    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last())

    var x = this.getSlice(key.last()).getInverseKey('Int-LI', cell.key).last() // key.last();
    var y = box.min.penultimate() - 1;
    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    
    var source = this.getSlice(coord.last()).expand('Int-L', {up: x, across: y, length: l}, n, m).concat([cell])
    
    if (type == 'Int-L-S') return {
        list: source,
        key: source.length - 1
    }
    if (type == 'Int-L-SI') return [cell].concat(this.rewrite(cell).expand('Int-L', x + 1, y, n, l, m));
    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
}

Diagram.prototype.getTarget.IntLS = function(type, key) {
    
    var coord = this.getInterchangerCoordinates(type, key);
    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last())

    var x = coord.penultimate();
    var y = coord.end(2); // 3rd from the en
    var n = this.target_size(key.last());
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    
    if (type == 'Int-L-S') return [cell.move([{relative: -1}, {absolute: coord.penultimate()}])].concat(
        this.getSlice(coord.last()).rewrite(cell).expand('Int-L', {up: x, across: y, length: l}, n, m));
    
    //if (type == 'Int-L-SI') return this.getSlice(coord.last()).expand('Int-L', expand_data, 1, coord).push(cell);
    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
}

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData.IntLS = function(type, key) {
    return this.getTarget(type, key);
}

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLS = function(drag) {
    var up = drag.directions[0] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(up ? ['Int-L-SI'] : ['Int-L-S'], key);

    // Collect the possible options
    var possible_options = [];
    var msg = 'interpretDrag.IntLS: allowed ';
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            msg += (possible_options.length != 0 ? ', ' : '') + options[i].type;
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) {
        console.log('interpretDrag.IntLS: no moves allowed');
        return null;
    }
    console.log(msg);
    return possible_options;
};

Diagram.prototype.interchangerAllowed.IntLS = function(type, key) {

    // Is the key cell well-separated from the adjacent structure?
   
// if (!this.wellSeparated.IntLS(type, key)) return false;

    // See if the source of the rewrite is a subset of the diagram instruction list

    
    return this.subinstructions(key, this.getSource(type, key));
}

/*
Diagram.prototype.getInterchanger.IntLS = function(type, key) {
    
    var diagram_pointer = this;
    var h = key.last();
    var cell = this.cells[h - this.source_size(h)];
    var coords = cell.box.min.slice(0);
    coords.push(h - this.source_size(h));
    
    if (type.tail('IntI0-L-S', 'Int-L-S')) {
        return coords; //coords.move([{relative: -1}, {relative: -this.source_size(h)}]);
    }
}
*/

Diagram.prototype.getInterchangerBoundingBox.IntLS = function(type, key) {
    
    var x = key.last();
    var coords = this.getInterchangerCoordinates(type, key);
    if (type.tail('L-S')) return {min: coords, max: coords.slice().move([{relative: this.source_size(x) + 1}, {relative: this.target_size(x) + 1}])};

}


Diagram.prototype.getInterchangerCoordinates.IntLS = function(type, key) {

    var diagram_pointer = this;
    var new_key = key.last();
    var h = key.last();
    var cell = this.cells[h];
    var coords = cell.box.min.slice(0);
    coords.push(h);

    return coords;
    
/*
    if (type.tail('Int-L-S', 'IntI0-L')) {
        return coords;
    } else if (type.tail('Int-LI', 'IntI0-LI')) {
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
    } else if (type.tail('Int-RI', 'IntI0-RI')) {
        return coords.move([{
            relative: -this.source_size(h)
        }])
    }
*/
}


/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {
    
}
*/
