"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-S family
// This is naturality for the 4-cell pull-through


RegisterSingularityFamily({
    family: 'IntLS',
    dimension: 5,
    members: ['Int-L-S', 'Int-L-SI'
    /*, 'IntI-L-S', 'IntI-L-SI',
    'Int-LI-S', 'Int-LI-SI',
    'IntI-LI-S', 'IntI-LI-SI',
    'Int-R-S', 'Int-R-SI',
    'IntI-R-S', 'IntI-R-SI',
    'Int-RI-S', 'Int-RI-SI',
    'IntI-RI-S', 'IntI-RI-SI'*/],
    friendly: {
        'Int-L-S': 'Pull-through pull-through interchanger above',
        'IntI-L-S': 'Pull-through pull-through interchanger underneath',
        'Int-R-S': 'Pull-through pull-through inverse interchanger underneath',
        'IntI-R-S': 'Pull-through pull-through inverse interchanger above'

    }

});


Diagram.prototype.getSource.IntLS = function(type, key) {
    
    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last());
    
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var steps_back = this.pseudoExpand(subtype, box, 1); // The subtype is needed to identify which family to call the expansion procedure on

    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    
    // For the target we need to modify the key of alpha


    if (type === 'Int-L-S') {
        var x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        var y = box.min.penultimate() - 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        
    }
    else if (type === 'Int-L-SI') {
        var x = box.min.last() - this.source_size(key.last()) + this.target_size(key.last());
        var y = box.min.penultimate();
        
        return [cell].concat(this.getSlice(key.last()).rewrite(cell).expand(subtype, {up: x, across: y, length: l}, n, m));
    }
    else{
        return [];
    }

    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
};

Diagram.prototype.getTarget.IntLS = function(type, key) {
    
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var cell = this.cells[key.last()].copy();
    var box = this.getSliceBoundingBox(key.last());

    var steps = this.pseudoExpand(subtype, box, 1);
//    if(!type.tail('I')) steps_back = this.pseudoExpand(subtype, box, 1);

    var alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
    
    //    alpha_box.max[alpha_box.max.length - 1] += this.target_size(key.last()) - this.source_size(key.last());
    var x = alpha_box.min.penultimate();
    var y = alpha_box.min.end(2); // 3rd from the end
    var l = alpha_box.max.penultimate() - alpha_box.min.penultimate();
    
    var n = alpha_box.max.last() - alpha_box.min.last() 
    var m = 1;

    if (type == 'Int-L-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: -l}]);
        
        return [cell].concat(
        this.getSlice(key.last() - steps).rewrite(cell).expand('Int-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI-L-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)},
                    {relative: -m}, {relative: -l}]);
       
        return [cell].concat(
        this.getSlice(key.last() - steps).rewrite(cell).expand('IntI-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-LI-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: l}]);
        
        return [cell].concat(
            this.getSlice(key.last() - steps).rewrite(cell).expand('Int-LI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI-LI-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                    {relative: m}, {relative: l}]);
       
        return [cell].concat(
        this.getSlice(key.last() - steps).rewrite(cell).expand('IntI-LI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-R-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                       {relative: m}, {relative: -l}]);
        
        return [cell].concat(
        this.getSlice(key.last() - steps).rewrite(cell).expand('Int-R', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI-R-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: -l}]);
       
        return [cell].concat(
        this.getSlice(key.last() - steps).rewrite(cell).expand('IntI-R', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-RI-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1)},
                     {relative: -m}, {relative: l}]);
        
        return [cell].concat(
            this.getSlice(key.last() - steps).rewrite(cell).expand('Int-RI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI-RI-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: l}]);
       
        return [cell].concat(
        this.getSlice(key.last() - steps).rewrite(cell).expand('IntI-RI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-L-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: l}]);
        
        return this.getSlice(key.last()).expand('Int-L', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'IntI-L-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                    {relative: m}, {relative: l}]);
       
        return this.getSlice(key.last()).expand('IntI-L', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'Int-LI-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: -l}]);
        
        return this.getSlice(key.last()).expand('Int-LI', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'IntI-LI-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)},
                    {relative: -m}, {relative: -l}]);
       
        return this.getSlice(key.last()).expand('IntI-LI', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'Int-R-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1)},
                     {relative: m}, {relative: -l}]);
        
        return this.getSlice(key.last()).expand('Int-R', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'IntI-R-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: -l}]);
       
         return this.getSlice(key.last()).expand('IntI-R', {up: x, across: y, length: l}, n, m).concat[cell];
   }
    if (type == 'Int-RI-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                    {relative: -m}, {relative: l}]);
        
        return this.getSlice(key.last()).expand('Int-RI', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'IntI-RI-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: l}]);
       
        return this.getSlice(key.last()).expand('IntI-RI', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    
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
    var options = this.getDragOptions(up ? ['Int-L-SI'/*, 'IntI-L-SI', 'Int-R-SI', 'IntI-R-SI', 
                                            'Int-LI-SI', 'IntI-LI-SI', 'Int-RI-SI', 'IntI-RI-SI'*/] 
                                            : ['Int-L-S'/*, 'IntI-L-S', 'Int-R-S', 'IntI-R-S', 
                                            'Int-LI-S', 'IntI-LI-S', 'Int-RI-S', 'IntI-RI-S'*/], key);

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
    
    /*  Need clauses for separation from sides of the diagram
    
    var space_above = (x < this.cells.length - g1_target);
    var space_below = (x >= g1_source);
    var space_left = (coords.last() > 0);
    var space_right = (coords.last() + g1_source < slice.cells.length);
    
    */
    
    var source = this.getSource(type, key);
    return this.subinstructions(key,  {list: source, key: source.length - 1});
};


Diagram.prototype.getInterchangerBoundingBox.IntLS = function(type, key) {

    var box = this.getSliceBoundingBox(key.last());
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var steps = this.pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; // Which edge exactly do we need?
    
    if (type.tail('L-S')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() - 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()), // we subtract the # of crossings
                key.last() - steps]);
    }
    if (type.tail('L-SI')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() + 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps]);
    }
    if (type.tail('LI-S')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() + 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()), 
                key.last() - steps]);
    }
    if (type.tail('LI-SI')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() - 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps]);
    }
    if (type.tail('R-S')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() + 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() - steps]);
    }
    if (type.tail('R-SI')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() - 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps]);
    }
    if (type.tail('RI-S')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() - 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()), 
                key.last() - steps]);
    }
    if (type.tail('RI-SI')) {
    edge_box = this.getLocationBoundingBox([box.max.penultimate() + 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps]);
    }
    
    
    return this.unionBoundingBoxes(alpha_box, edge_box);
};


Diagram.prototype.getInterchangerCoordinates.IntLS = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;
}


/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {
    
}
*/
