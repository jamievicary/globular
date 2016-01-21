"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-S family
// This is naturality for the 4-cell pull-through


RegisterSingularityFamily({
    family: 'IntLS',
    dimension: 5,
    members: ['Int-L-S', 'Int-L-SI'/*,
    'IntI0-L-S', 'IntI0-L-SI',
    'Int-LI0-S', 'Int-LI0-SI',
    'IntI0-LI0-S', 'IntI0-LI0-SI',
    'Int-R-S', 'Int-R-SI',
    'IntI0-R-S', 'IntI0-R-SI',
    'Int-RI0-S', 'Int-RI0-SI',
    'IntI0-RI0-S', 'IntI0-RI0-SI'*/],
    friendly: {
        'Int-L-S': 'Pull-through pull-through interchanger above',
        'IntI0-L-S': 'Pull-through pull-through interchanger underneath',
        'Int-R-S': 'Pull-through pull-through inverse interchanger underneath',
        'IntI0-R-S': 'Pull-through pull-through inverse interchanger above'

    }
});


Diagram.prototype.getSource.IntLS = function(type, key) {
    
    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last());
    
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // The subtype is needed to identify which family to call the expansion procedure on

    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    var x, y;
    
    // For the target we need to modify the key of alpha


    if (type === 'Int-L-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type === 'IntI0-L-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type === 'Int-LI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type === 'IntI0-LI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type === 'Int-R-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type === 'IntI0-R-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type === 'Int-RI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type === 'IntI0-RI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        return this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    else if (type.tail('I')) {
        x = box.min.last() - this.source_size(key.last()) + this.target_size(key.last());
        y = box.min.penultimate();
        n += - this.source_size(key.last()) + this.target_size(key.last());
        
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
    var steps = 0;

    if(!type.tail("I")){
        steps = this.getSlice(key.last()).pseudoExpand(subtype, box, 1);
    }

    var alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
    var l = alpha_box.max.penultimate() - alpha_box.min.penultimate();
    var n = alpha_box.max.last() - alpha_box.min.last();
    var m = 1;
    var x, y;

    if (type == 'Int-L-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: -l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('Int-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-L-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)},
                    {relative: -m}, {relative: -l}]);
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
       
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('IntI0-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-LI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('Int-LI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-LI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                    {relative: m}, {relative: l}]);
       
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
       
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('IntI0-LI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-R-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                       {relative: m}, {relative: -l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); // 3rd from the end
        
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('Int-R', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-R-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: -l}]);
       
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('IntI0-R', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-RI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1)},
                     {relative: -m}, {relative: l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('Int-RI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-RI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: l}]);
       
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('IntI0-RI', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-L-SI') {
        //n += this.source_size(key.last()) - this.target_size(key.last());
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        cell.move([{relative: 0}, {relative: m}, {relative: l}]);

        
        return this.getSlice(key.last()).expand('Int-L', {up: x, across: y, length: l}, n, m).concat([cell]);

    }
    if (type == 'IntI0-L-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                    {relative: m}, {relative: l}]);
        
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end       

        return this.getSlice(key.last()).expand('IntI0-L', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'Int-LI0-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: -l}]);
        
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        
        return this.getSlice(key.last()).expand('Int-LI', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'IntI0-LI0-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)},
                    {relative: -m}, {relative: -l}]);
       
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
       
        return this.getSlice(key.last()).expand('IntI0-LI', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'Int-R-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1)},
                     {relative: m}, {relative: -l}]);
        
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); // 3rd from the end
       
        return this.getSlice(key.last()).expand('Int-R', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'IntI0-R-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: -l}]);
       
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
       
        return this.getSlice(key.last()).expand('IntI0-R', {up: x, across: y, length: l}, n, m).concat[cell];
   }
    if (type == 'Int-RI0-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                    {relative: -m}, {relative: l}]);
        
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
        
        return this.getSlice(key.last()).expand('Int-RI', {up: x, across: y, length: l}, n, m).concat[cell];
    }
    if (type == 'IntI0-RI0-SI') {
        n += this.source_size(key.last()) - this.target_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: l}]);
       
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.penultimate();
        y = alpha_box.min.end(2); // 3rd from the end
       
        return this.getSlice(key.last()).expand('IntI0-RI', {up: x, across: y, length: l}, n, m).concat[cell];
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
    var options = this.getDragOptions(up ? ['Int-L-SI'/*, 'IntI0-L-SI', 'Int-R-SI', 'IntI0-R-SI', 
                                            'Int-LI0-SI', 'IntI0-LI0-SI', 'Int-RI0-SI', 'IntI0-RI0-SI'*/] 
                                            : ['Int-L-S'/*, 'IntI0-L-S', 'Int-R-S', 'IntI0-R-S', 
                                            'Int-LI0-S', 'IntI0-LI0-S', 'Int-RI0-S', 'IntI0-RI0-S'*/], key);

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
    
    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last());
    
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // The subtype is needed to identify which family to call the expansion procedure on

    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    var x, y;
    
    // For the target we need to modify the key of alpha
    if (type === 'Int-L-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});
    }
    else if (type === 'IntI0-L-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});
    }
    else if (type === 'Int-LI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});
    }
    else if (type === 'IntI0-LI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});
    }
    else if (type === 'Int-R-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});
    }
    else if (type === 'IntI0-R-S') {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});

    }
    else if (type === 'Int-RI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});

    }
    else if (type === 'IntI0-RI0-S') {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});

    }
    else if (type.tail('I')) {
        x = box.min.last() //- this.source_size(key.last()) + this.target_size(key.last());
        y = box.min.penultimate();
        n += - this.source_size(key.last()) + this.target_size(key.last());
        
        var source = [cell].concat(this.getSlice(key.last()).copy().rewrite(cell).expand(subtype, {up: x, across: y, length: l}, n, m));
        return this.subinstructions(key,  {list: source, key: 0});
    }

    else{
        return [];
    }

    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
    
};


Diagram.prototype.getInterchangerBoundingBox.IntLS = function(type, key) {

    var box = this.getSliceBoundingBox(key.last());
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var steps = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; // Which edge exactly do we need?
    
    if (type.tail('L-S')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()), // we subtract the # of crossings
                key.last() - steps]);
    }
    if (type.tail('L-SI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps]); // We need the '+1' to account for the cell itself, not just the 'pull-throughs'
    }
    if (type.tail('LI0-S')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()), 
                key.last() - steps]);
    }
    if (type.tail('LI0-SI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps + 1]);
    }
    if (type.tail('R-S')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() - steps]);
    }
    if (type.tail('R-SI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps + 1]);
    }
    if (type.tail('RI0-S')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()), 
                key.last() - steps]);
    }
    if (type.tail('RI0-SI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps + 1]);

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
