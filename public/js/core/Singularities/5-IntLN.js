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
    
    var x, expansion_base, pullthrough_top, pullthrough_bottom, x_ings_one, x_ings_two, target;

    if (type === 'Int-L-N') {
        x = cell.key.last() - s1 * s2 - 1;
        var complimentary_cell = new NCell({id: 'Int', key: [cell.key.last() - s1 * s2 - 1]});
        expansion_base = this.getSlice(key.last() - t1 - s2 - this.crossings(s2, t1) - this.crossings(s2, s1)).copy().rewrite(complimentary_cell);

        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 2, t2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return [];}

        pullthrough_top = expansion_base.expandWrapper('Int-R', x + 1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return [];}
        
        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 1, s1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return [];}

        pullthrough_bottom = expansion_base.expandWrapper('Int-L', x, s1);
        target = [complimentary_cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
    } else if (type === 'Int-L-NI') {
        x = cell.key.last();
        expansion_base = this.getSlice(key.last()).copy();

        pullthrough_top = expansion_base.expandWrapper('Int-L', x + 1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return [];}
        
        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 1, s1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return [];}

        pullthrough_bottom = expansion_base.expandWrapper('Int-R', x, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return [];}

        x_ings_two = expansion_base.reorganiseCrossings('Int', x, s2, s1);
        target = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([new NCell({id: 'IntI0', key: [cell.key.last() + s1 * s2 + 1]})]);
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
    else{
        return false;
    }
    
    var t1 = slice.target_size(index_left);
    var s1 = slice.source_size(index_left);
    var t2 = slice.target_size(index_right);
    var s2 = slice.source_size(index_right);
    
    var x, expansion_base, pullthrough_top, pullthrough_bottom, x_ings_one, x_ings_two, source, source_key;

    if (type === 'Int-L-N') {
        x = cell.key.last() - s1 * s2 - 1;
        expansion_base = this.getSlice(key.last() - s2 - this.crossings(s2, t1) - this.crossings(s2, s1) - t1).copy();

        pullthrough_top = expansion_base.expandWrapper('Int-L', x + 1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return [];}

        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 1, s2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return [];}
        
        pullthrough_bottom = expansion_base.expandWrapper('Int-R', x, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return [];}

        x_ings_two = expansion_base.reorganiseCrossings('Int', x, s1, s2);

        source = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([cell]);
        source_key = source.length - 1;
    }
    else if (type === 'Int-L-NI') {
        x = cell.key.last()
        expansion_base = this.getSlice(key.last() + 1).copy();
   
        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 2, t2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return [];}
 
        pullthrough_top = expansion_base.expandW('Int-R', x + 1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return [];}
        
        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 1, s2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return [];}
        
        pullthrough_bottom = expansion_base.expandWrapper('Int-L', x, s2);
        
        source = [cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
        source_key = 0;
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
    
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; 
    
    if (type.tail('L-N')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() - s1 * s2,
                key.last() - t1 - s2 - this.crossings(s2, t1) - this.crossings(s2, s1)]);
    } else if (type.tail('L-NI')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() + s1 * s2,
                key.last() + 1 + t1 + s2 + this.crossings(s2, t1) + this.crossings(t2, t1)]);
    }

    return this.unionBoundingBoxes(alpha_box, edge_box);
};


Diagram.prototype.getInterchangerCoordinates.IntLN = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;

}

Diagram.prototype.crossings = function(n, m) {
    var steps_crossings = 0;
    for (var i = n; i > 0; i--){
        steps_crossings += (i - 1) * (m - 1) * m / 2;
    }
    return steps_crossings;
}
