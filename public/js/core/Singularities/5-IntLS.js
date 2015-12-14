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
    'IntI-L-S', 'IntI-L-SI',
    'Int-LI-S', 'Int-LI-SI',
    'IntI-LI-S', 'IntI-LI-SI',
    'Int-R-S', 'Int-R-SI',
    'IntI-R-S', 'IntI-R-SI',
    'Int-RI-S', 'Int-RI-SI',
    'IntI-RI-S', 'IntI-RI-SI'],
    friendly: {
        'Int-L-S': 'Pull-through pull-through interchanger above',
        'Int-L': 'Pull-through pull-through interchanger above',
        'IntI-L': 'Pull-through pull-through interchanger underneath',
        'Int-R': 'Pull-through pull-through inverse interchanger underneath',
        'IntI-R': 'Pull-through pull-through inverse interchanger above'

    }

});


Diagram.prototype.getSource.IntLS = function(type, key) {
    
    var coord = this.getInterchangerCoordinates(type, key);
    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last())
    
    var steps_back = this.pseudoExpand('Int-L', box, 1);

    var x = this.getSlice(key.last()).getInverseKey('Int-LI', cell.key).last() // key.last();
    var y = box.min.penultimate() - 1;
    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    
    var source;    
    if (type == 'Int-L-S'){
    source = this.getSlice(key.last() - steps_back).expand('Int-L', {up: x, across: y, length: l}, n, m).concat([cell])
        return {
        list: source,
        key: source.length - 1
        }
    }
    if (type == 'IntI-L-S'){
    source = this.getSlice(key.last() - steps_back).expand('IntI-L', {up: x, across: y, length: l}, n, m).concat([cell])
        return {
        list: source,
        key: source.length - 1
        }
    }
    if (type == 'Int-L-SI') return [cell].concat(this.rewrite(cell).expand('Int-L', x + 1, y, n, l, m));
    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
}

Diagram.prototype.getTarget.IntLS = function(type, key) {
    
    var new_type;
    if(type.tail('I')){
        new_type = type.substr(0, type.length - 3)
    }
    else{
        new_type = type.substr(0, type.length - 2)
    }
    
    var coord = this.getInterchangerCoordinates(type, key);
    var cell = this.cells[key.last()].copy();
    var box = this.getSliceBoundingBox(key.last())
    
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;

    var steps_back = this.pseudoExpand(new_type, box, 1);
    
    
    cell.move([{relative: 0}, {relative: -m}, {relative: -l}]);
    
    var alpha_box = this.getSlice(key.last() - steps_back).getBoundingBox(cell);

    alpha_box.max[alpha_box.max.length - 1] += this.target_size(key.last()) - this.source_size(key.last())

    var x = alpha_box.min.penultimate();
    var y = alpha_box.min.end(2); // 3rd from the end
    var n = alpha_box.max.last() - alpha_box.min.last() //this.target_size(key.last());
    var l = alpha_box.max.penultimate() - alpha_box.min.penultimate();
    var m = 1;


    if (type == 'Int-L-S') return [cell].concat(
        this.getSlice(key.last() - steps_back).rewrite(cell).expand('Int-L', {up: x, across: y, length: l}, n, m));
    if (type == 'IntI-L-S') return [cell].concat(
        this.getSlice(key.last() - steps_back).rewrite(cell).expand('IntI-L', {up: x, across: y, length: l}, n, m));
    
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
    var options = this.getDragOptions(up ? ['Int-L-SI', 'IntI-L-SI', 'Int-R-SI', 'IntI-R-SI', 
                                            'Int-LI-SI', 'IntI-LI-SI', 'Int-RI-SI', 'IntI-RI-SI'] 
                                            : ['Int-L-S', 'IntI-L-S', 'Int-R-S', 'IntI-R-S', 
                                            'Int-LI-S', 'IntI-LI-S', 'Int-RI-S', 'IntI-RI-S'], key);

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
    
    if (type.tail('IntI-L-S', 'Int-L-S')) {
        return coords; //coords.move([{relative: -1}, {relative: -this.source_size(h)}]);
    }
}
*/

Diagram.prototype.getInterchangerBoundingBox.IntLS = function(type, key) {

    var box = this.getSliceBoundingBox(key.last());
    var steps_back = this.pseudoExpand('Int-L', box, 1);
    
    
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box = this.getLocationBoundingBox([box.max.penultimate() - 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() - steps_back]);

    return this.unionBoundingBoxes(alpha_box, edge_box);
}


Diagram.prototype.getInterchangerCoordinates.IntLS = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;
}


/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {
    
}
*/
