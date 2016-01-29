"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-N family
// This is naturality for the 4-cell pull-through


RegisterSingularityFamily({
    family: 'IntLN',
    dimension: 5,
    members: ['Int-L-N', 'Int-L-NI'/*,
    'IntI0-L-N', 'IntI0-L-NI',
    'Int-LI0-N', 'Int-LI0-NI',
    'IntI0-LI0-N', 'IntI0-LI0-NI',
    'Int-R-N', 'Int-R-NI',
    'IntI0-R-N', 'IntI0-R-NI',
    'Int-RI0-N', 'Int-RI0-NI',
    'IntI0-RI0-N', 'IntI0-RI0-NI'*/],
    friendly: {
        'Int-L-N': 'Pull-through pull-through interchanger above',
        'IntI0-L-N': 'Pull-through pull-through interchanger underneath',
        'Int-R-N': 'Pull-through pull-through inverse interchanger underneath',
        'IntI0-R-N': 'Pull-through pull-through inverse interchanger above'

    }
});


Diagram.prototype.getTarget.IntLN = function(type, key) {
    
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    var cell = this.cells[key.last()].copy();
    
    var slice = this.getSlice(key.last());
    if(cell.id === 'Int'){
        var index_right = cell.key.last();   
        var index_left = cell.key.last() + 1;
    }
    else if(cell.id === 'IntI0'){
        var index_right = cell.key.last();   
        var index_left = cell.key.last() - 1;
    }
    
    var t1 = slice.target_size(index_left);
    var s1 = slice.source_size(index_left);
    var t2 = slice.target_size(index_right);
    var s2 = slice.source_size(index_right);
    
    var m = slice.target_size(index_left);
    var n = slice.source_size(index_right);
    
    var steps_crossings = 0;
    for (var i = n; i > 0; i--){
        steps_crossings += (i - 1) * (m - 1) * m / 2;
    }


    if (type == 'Int-L-N') {
        cell.move([{relative: 0}, {relative: 0}, {relative: - s1 * s2}]);
        cell.id = 'Int';
        cell.key[cell.key.length - 1]--;
        var x = cell.key.last() + 2;
        
        var expansion_base = this.getSlice(key.last() - t1 - s2 - steps_crossings).copy().rewrite(cell);
        var crossings_list_one = expansion_base.reorganiseCrossings('Int', x, t2, t1);
        for(var i = 0; i < crossings_list_one.length; i++){
            expansion_base.rewrite(crossings_list_one[i]);   
        }
        
        x = x - 1;
        var y = expansion_base.cells[x].key.last();
        var pullthrough_top = expansion_base.expand('Int-R', {up: x, across: y, length: expansion_base.source_size(x)}, 1, t2);
        for(var i = 0; i < pullthrough_top.length; i++){
            expansion_base.rewrite(pullthrough_top[i]);   
        }
        
        var crossings_list_two = expansion_base.reorganiseCrossings('IntI0', x, s1, t2);
        for(var i = 0; i < crossings_list_two.length; i++){
            expansion_base.rewrite(crossings_list_two[i]);   
        }
        
        x = x - 1;
        y = expansion_base.cells[x].key.last();
        var pullthrough_bottom = expansion_base.expand('Int-L', {up: x, across: y, length: expansion_base.source_size(x)}, 1, s1);
                for(var i = 0; i < pullthrough_bottom.length; i++){
            expansion_base.rewrite(pullthrough_bottom[i]);   
        }
        
        var crossings_list_three = expansion_base.reorganiseCrossings('Int', x, s1, s2);
        
        var target = [cell].concat(crossings_list_one.concat(pullthrough_top.concat(crossings_list_two.concat(pullthrough_bottom.concat(crossings_list_three)))));
    } else if (type == 'Int-L-NI') {

        var expansion_base = this.getSlice(key.last()).copy();

        var x = cell.key.last() + 2; // x has to be set before we move the cell
        cell.move([{relative: 0}, {relative: 0}, {relative: s1 * s2}]); 
        cell.id = 'IntI0';
        cell.key[cell.key.length - 1]++;

        var crossings_list_one = expansion_base.reorganiseCrossings('Int', x, t2, t1);
        for(var i = 0; i < crossings_list_one.length; i++){
            expansion_base.rewrite(crossings_list_one[i]);   
        }
        
        x = x - 1;
        var y = expansion_base.cells[x].key.last();
        var pullthrough_top = expansion_base.expand('Int-L', {up: x, across: y, length: expansion_base.source_size(x)}, 1, t2);
                for(var i = 0; i < pullthrough_top.length; i++){
            expansion_base.rewrite(pullthrough_top[i]);   
        }
        
        var crossings_list_two = expansion_base.reorganiseCrossings('IntI0', x, s1, t2);
        for(var i = 0; i < crossings_list_two.length; i++){
            expansion_base.rewrite(crossings_list_two[i]);   
        }
        
        x = x - 1;
        y = expansion_base.cells[x].key.last();
        var pullthrough_bottom = expansion_base.expand('Int-R', {up: x, across: y, length: expansion_base.source_size(x)}, 1, s1);
        for(var i = 0; i < pullthrough_bottom.length; i++){
            expansion_base.rewrite(pullthrough_bottom[i]);   
        }
        
        var crossings_list_three = expansion_base.reorganiseCrossings('Int', x, s1, s2);
        
        var target = crossings_list_one.concat(pullthrough_top.concat(crossings_list_two.concat(pullthrough_bottom.concat(crossings_list_three)))).concat([cell]);
    }

    return target;
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
    var slice = this.getSlice(key.last());
    if(cell.id === 'Int'){
        var index_right = cell.key.last();   
        var index_left = cell.key.last() + 1;
    }
    else if(cell.id === 'IntI0'){
        var index_right = cell.key.last();   
        var index_left = cell.key.last() - 1;
    }
    
    var m = slice.target_size(index_left);
    var n = slice.source_size(index_right);
    
    var t1 = slice.target_size(index_left);
    var s1 = slice.source_size(index_left);
    var t2 = slice.target_size(index_right);
    var s2 = slice.source_size(index_right);
    
    
    var steps_crossings = 0;
    for (var i = n; i > 0; i--){
        steps_crossings += (i - 1) * (m - 1) * m / 2;
    }

    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));

    if (type === 'Int-L-N') {
        var expansion_base = this.getSlice(key.last() - s2 - steps_crossings - t1).copy();
   
        var x = cell.key.last() - s1 * s2;
        var y = expansion_base.cells[x].key.last();

        var pullthrough_top = expansion_base.expand('Int-L', {up: x, across: y, length: expansion_base.source_size(x)}, 1, t1);
        for(var i = 0; i < pullthrough_top.length; i++){
            if(expansion_base.interchangerAllowed(pullthrough_top[i].id, pullthrough_top[i].key)){
                expansion_base.rewrite(pullthrough_top[i]);
            }
            else {return [];}
        }

        var crossings_list_one = expansion_base.reorganiseCrossings('IntI0', x, s2, t1);
        for(var i = 0; i < crossings_list_one.length; i++){
            expansion_base.rewrite(crossings_list_one[i]);   
        }
        
        x = x - 1;
        var y = expansion_base.cells[x].key.last();
        var pullthrough_bottom = expansion_base.expand('Int-R', {up: x, across: y, length: expansion_base.source_size(x)}, 1, s2);
        
        var source = pullthrough_top.concat(crossings_list_one.concat(pullthrough_bottom)).concat([cell]);
        var source_key = source.length - 1
    }
    else if (type === 'Int-L-NI') {
   
        var expansion_base = this.getSlice(key.last() + 1).copy();
   
        var x = cell.key.last() + 1;
        var y = expansion_base.cells[x].key.last();
        var pullthrough_top = expansion_base.expand('Int-R', {up: x, across: y, length: expansion_base.source_size(x)}, 1, t1);
        for(var i = 0; i < pullthrough_top.length; i++){
            if(expansion_base.interchangerAllowed(pullthrough_top[i].id, pullthrough_top[i].key)){
                expansion_base.rewrite(pullthrough_top[i]);
            }
            else {return [];}
        }
        
        var crossings_list_one = expansion_base.reorganiseCrossings('IntI0', x, s2, t1);
        for(var i = 0; i < crossings_list_one.length; i++){
            expansion_base.rewrite(crossings_list_one[i]);   
        }
        
        x = x - 1;
        y = expansion_base.cells[x].key.last();
        var pullthrough_bottom = expansion_base.expand('Int-L', {up: x, across: y, length: expansion_base.source_size(x)}, 1, s2);
        var source = [cell].concat(pullthrough_top.concat(crossings_list_one.concat(pullthrough_bottom)));
        var source_key = 0;
   }
    else{
        return [];
    }
    
    return this.subinstructions(key,  {list: source, key: source_key});


    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
    
};


Diagram.prototype.getInterchangerBoundingBox.IntLN = function(type, key) {

    var box = this.getSliceBoundingBox(key.last());
    var subtype = (type.tail('I') ? type.substr(0, type.length - 3) : type.substr(0, type.length - 2));
    
    var cell = this.cells[key.last()];
    var slice = this.getSlice(key.last());
    if(cell.id === 'Int'){
        var index_right = cell.key.last();   
        var index_left = cell.key.last() + 1;
    }
    else if(cell.id === 'IntI0'){
        var index_right = cell.key.last();   
        var index_left = cell.key.last() - 1;
    }
    
    var t1 = slice.target_size(index_left);
    var s1 = slice.source_size(index_left);
    var t2 = slice.target_size(index_right);
    var s2 = slice.source_size(index_right);
    
    var m = slice.target_size(index_left);
    var n = slice.source_size(index_right);
    
    var steps_crossings = 0;
    for (var i = n; i > 0; i--){
        steps_crossings += (i - 1) * (m - 1) * m / 2;
    }
    
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; 
    
    if (type.tail('L-N')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() - s1 * s2, // we subtract the # of crossings
                key.last() - m - n - steps_crossings]);
    } else if (type.tail('L-NI')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() + s1 * s2, // we subtract the # of crossings
                key.last() + 1 + m + n + steps_crossings]);
    }

    
    return this.unionBoundingBoxes(alpha_box, edge_box);
};


Diagram.prototype.getInterchangerCoordinates.IntLN = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;

}