"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-N family
// This is naturality for the 4-cell pull-through

/*
RegisterSingularityFamily({
    family: 'IntLN',
    dimension: 5,
    members: ['Int-L-N', 'Int-L-NI',
    /*'IntI0-L-N', 'IntI0-L-NI',
    'Int-LI0-N', 'Int-LI0-NI',
    'IntI0-LI0-N', 'IntI0-LI0-NI',
    'Int-R-N', 'Int-R-NI',
    'IntI0-R-N', 'IntI0-R-NI',
    'Int-RI0-N', 'Int-RI0-NI',
    'IntI0-RI0-N', 'IntI0-RI0-NI'*],
    friendly: {
        'Int-L-N': 'Pull-through pull-through interchanger above',
        'IntI0-L-N': 'Pull-through pull-through interchanger underneath',
        'Int-R-N': 'Pull-through pull-through inverse interchanger underneath',
        'IntI0-R-N': 'Pull-through pull-through inverse interchanger above'

    }
});
*/

Diagram.prototype.getTarget.IntLN = function(type, key) {
    
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

    if (type == 'Int-L-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: -l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); 
        
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('Int-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-L-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)},
                    {relative: -m}, {relative: -l}]);
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); 
       
        return [cell].concat(this.getSlice(key.last() - steps).copy()/*!!!!!*/.rewrite(cell).expand('IntI0-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-LI0-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('Int-LI0', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-LI0-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                    {relative: m}, {relative: l}]);
       
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); 
       
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('IntI0-LI0', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-R-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                       {relative: m}, {relative: -l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('Int-R', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-R-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: m}, {relative: -l}]);
       
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();  
        
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('IntI0-R', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-RI0-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)},
                     {relative: -m}, {relative: l}]);
        
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); 
        
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('Int-RI0', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-RI0-N') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{relative: 0}, {relative: -m}, {relative: l}]);
       
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();  
        
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('IntI0-RI0', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-L-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();  
        cell.move([{relative: 0}, {relative: m}, {relative: l}]);

        return this.getSlice(key.last()).expand('Int-L', {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    if (type == 'IntI0-L-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();       
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
            {relative: m}, {relative: l}]);

        return this.getSlice(key.last()).expand('IntI0-L', {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    if (type == 'Int-LI0-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{relative: 0}, {relative: -m}, {relative: -l}]);
        
        return this.getSlice(key.last()).expand('Int-LI0', {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    if (type == 'IntI0-LI0-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();  
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)},
            {relative: -m}, {relative: -l}]);
       
        return this.getSlice(key.last()).expand('IntI0-LI0', {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    if (type == 'Int-R-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1)},
                     {relative: -m}, {relative: l}]);
       
        return this.getSlice(key.last()).expand('Int-R', {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    if (type == 'IntI0-R-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); 
        cell.move([{relative: 0}, {relative: -m}, {relative: l}]);
       
        return this.getSlice(key.last()).expand('IntI0-R', {up: x, across: y, length: l}, n, m).concat([cell]);
   }
    if (type == 'Int-RI0-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); 
        cell.move([{relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)},
                {relative: m}, {relative: -l}]);

        return this.getSlice(key.last()).expand('Int-RI0', {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    if (type == 'IntI0-RI0-NI') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate(); 

        cell.move([{relative: 0}, {relative: m}, {relative: -l}]);
         return this.getSlice(key.last()).expand('IntI0-RI0', {up: x, across: y, length: l}, n, m).concat([cell]);
    }
    
    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
}

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData.IntLN = function(type, key) {
    return this.getTarget(type, key);
}

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLN = function(drag) {
    if (drag.directions == null) return [];
    var up = drag.directions[0] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(up ? ['Int-L-NI'/*, 'IntI0-L-NI', 'Int-R-NI', 'IntI0-R-NI', 
                                            'Int-LI0-NI', 'IntI0-LI0-NI', 'Int-RI0-NI', 'IntI0-RI0-NI'*/] 
                                            : ['Int-L-N'/*, 'IntI0-L-N', 'Int-R-N', 'IntI0-R-N', 
                                            'Int-LI0-N', 'IntI0-LI0-N', 'Int-RI0-N', 'IntI0-RI0-N'*/], key);
                                            

    // Collect the possible options
    var possible_options = [];
    var msg = 'interpretDrag.IntLN: allowed ';
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            msg += (possible_options.length != 0 ? ', ' : '') + options[i].type;
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) {
        console.log('interpretDrag.IntLN: no moves allowed');
        return [];
    }
    console.log(msg);
    return possible_options;
};

Diagram.prototype.interchangerAllowed.IntLN = function(type, key) {
    
    
    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last());
    var slice = this.getSlice(key.last());
    
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // The subtype is needed to identify which family to call the expansion procedure on

    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    var x, y;


    // For the target we need to modify the key of alpha
    if (type === 'Int-L-N') {

        // Initial check that a swap of multiple vertices is indeed a swap (may be unnecessary)
        // Calculation of three separate components of the 'steps back' parameter, done by PseudoExpand and Reorganisation of crossings

        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;

        var source = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});
    }
    else if (type === 'Int-L-N') {

        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;
        
        var complementaryType = 'Int-R';

        var source = this.getSlice(key.last()).expand(subtype, {up: x, across: y, length: l}, n, m).concat([cell]);
        return this.subinstructions(key,  {list: source, key: source.length - 1});
    }
    else{
        return [];
    }

    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
    
};


Diagram.prototype.getInterchangerBoundingBox.IntLN = function(type, key) {

    var box = this.getSliceBoundingBox(key.last());
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    
    if(type.tail("I")){
        var correction = this.pullUpMinMax(key.last() + 1 , key.last(), box.min.last(), box.max.last());

        box.max[box.max.length - 1] = correction.max;
        box.min[box.min.length - 1] = correction.min;

        var steps_front = this.getSlice(key.last() + 1).pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    }else{
        var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    }
    
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; // Which edge exactly do we need?
    
    if (type.tail('L-N')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()), // we subtract the # of crossings
                key.last() - steps_back]);
    }
    if (type.tail('L-NI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]); // We need the '+1' to account for the cell itself, not just the 'pull-throughs'
    }
    if (type.tail('LI0-N')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()), 
                key.last() - steps_back]);
    }
    if (type.tail('LI0-NI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]);
    }
    if (type.tail('R-N')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() - steps_back]);
    }
    if (type.tail('R-NI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]);
    }
    if (type.tail('RI0-N')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1, 
                box.min.last() + (box.max.penultimate() - box.min.penultimate()), 
                key.last() - steps_back]);
    }
    if (type.tail('RI0-NI')) {
    edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1, 
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]);
    }
    
    
    return this.unionBoundingBoxes(alpha_box, edge_box);
};


Diagram.prototype.getInterchangerCoordinates.IntLN = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;

}