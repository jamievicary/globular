"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-N family
// This is naturality for the 4-cell pull-through


RegisterSingularityFamily({
    family: 'IntLN',
    dimension: 5,
    members: ['Int-L-N', 'Int-L-NI0',
    'IntI0-L-N', 'IntI0-L-NI0',
    'Int-LI0-N', 'Int-LI0-NI0',
    'IntI0-LI0-N', 'IntI0-LI0-NI0',
    'Int-R-N', 'Int-R-NI0',
    'IntI0-R-N', 'IntI0-R-NI0',
    'Int-RI0-N', 'Int-RI0-NI0',
    'IntI0-RI0-N', 'IntI0-RI0-NI0'],
    friendly: {
        'Int-L-N': 'Pull-through pull-through interchanger left above',
        'IntI0-L-N': 'Pull-through pull-through interchanger left underneath',
        'Int-R-N': 'Pull-through pull-through inverse interchanger right underneath',
        'IntI0-R-N': 'Pull-through pull-through inverse interchanger right above',
        'Int-L-NI0': 'Pull-through pull-through interchanger above left inverse',
        'IntI0-L-NI0': 'Pull-through pull-through interchanger left underneath inverse',
        'Int-R-NI0': 'Pull-through pull-through inverse interchanger right underneath inverse',
        'IntI0-R-NI0': 'Pull-through pull-through inverse interchanger right above inverse',
        'Int-LI0-N': 'Pull-through pull-through interchanger left inverse above',
        'IntI0-LI0-N': 'Pull-through pull-through interchanger left inverse underneath',
        'Int-RI0-N': 'Pull-through pull-through inverse interchanger right inverse underneath',
        'IntI0-RI0-N': 'Pull-through pull-through inverse interchanger right inverse above',
        'Int-LI0-NI0': 'Pull-through pull-through interchanger left inverse above inverse',
        'IntI0-LI0-NI0': 'Pull-through pull-through interchanger left inverse underneath inverse',
        'Int-RI0-NI0': 'Pull-through pull-through inverse interchanger right inverse underneath inverse',
        'IntI0-RI0-NI0': 'Pull-through pull-through inverse interchanger right inverse above inverse'
    }
});


Diagram.prototype.getTarget.IntLN = function(type, key) {
    
    var cell = this.cells[key.last()].copy();
    var slice = this.getSlice(key.last());
    var s1, t1, s2, t2;
    if(cell.id === 'Int'){
        t1 = slice.target_size(cell.key.last() + 1);
        s1 = slice.source_size(cell.key.last() + 1);
        t2 = slice.target_size(cell.key.last());
        s2 = slice.source_size(cell.key.last());
    }
    else if(cell.id === 'IntI0'){
        t1 = slice.target_size(cell.key.last() - 1);
        s1 = slice.source_size(cell.key.last() - 1);
        t2 = slice.target_size(cell.key.last());
        s2 = slice.source_size(cell.key.last());
    }
    else{
        return false;
    }
    
    var base_type = (type.substr(0, 5) === 'IntI0') ? 'IntI0' : 'Int';
    
    var x, expansion_base, pullthrough_top, pullthrough_bottom, x_ings_one, x_ings_two, target;

    if (type.tail('L-N')) {
        x = cell.key.last() - s1 * s2 - 1;
        var complimentary_cell = new NCell({id: 'Int', key: [cell.key.last() - s1 * s2 - 1]});
        expansion_base = this.getSlice(key.last() - t1 - s2 - this.crossings(s2, t1) - this.crossings(s2, s1)).copy().rewrite(complimentary_cell);

        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 2, t2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_top = expansion_base.expandWrapper(base_type + '-R', x + 1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 1, t2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-L', x, s1);
        //if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        target = [complimentary_cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
    } else if (type.tail('L-NI0')) {
        x = cell.key.last();
        expansion_base = this.getSlice(key.last()).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-L', x + 1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 1, s1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-R', x, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('Int', x, s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        target = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([new NCell({id: 'IntI0', key: [cell.key.last() + s1 * s2 + 1]})]);
    } else if (type.tail('R-N')) {
        x = cell.key.last() - s1 * s2;
        var complimentary_cell = new NCell({id: 'IntI0', key: [cell.key.last() - s1 * s2 + 1]});
        expansion_base = this.getSlice(key.last() - s1 - this.crossings(t2, s1) - this.crossings(s2, s1) - t2).copy().rewrite(complimentary_cell);

        x_ings_one = expansion_base.reorganiseCrossings('Int', x + 2, t1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_top = expansion_base.expandWrapper(base_type + '-L', x + 1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x + 1, s2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-R', x, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        target = [complimentary_cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
    } else if (type.tail('R-NI0')) {
        x = cell.key.last() - 1;
        expansion_base = this.getSlice(key.last()).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-R', x + 1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_one = expansion_base.reorganiseCrossings('Int', x + 1, s2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-L', x, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x, s1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        target = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([new NCell({id: 'Int', key: [cell.key.last() + s1 * s2 - 1]})]);
    } else if (type.tail('LI0-N')) {
        x = cell.key.last() - 1;
        var complimentary_cell = new NCell({id: 'Int', key: [cell.key.last() + s1 * s2 - 1]});
        expansion_base = this.getSlice(key.last() - s2 - this.crossings(t1, s2) - this.crossings(t1, t2) - t1).copy().rewrite(complimentary_cell);

        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x, s1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_top = expansion_base.expandWrapper(base_type + '-RI0', x + s1 * s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 1, t2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-LI0', x + s1 * t2 + 1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        target = [complimentary_cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
    } else if (type.tail('LI0-NI0')) {
        x = cell.key.last() - s1 * s2;
        expansion_base = this.getSlice(key.last()).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-LI0', x + s1 * s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 1, t2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-RI0', x + 1 + t2 * s1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 2, t1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}
        
        target = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([new NCell({id: 'IntI0', key: [x + 1]})]);
    } else if (type.tail('RI0-N')) {
        x = cell.key.last();
        var complimentary_cell = new NCell({id: 'IntI0', key: [cell.key.last() + s1 * s2 + 1]});
        expansion_base = this.getSlice(key.last() - t2 - this.crossings(s1, t2) - this.crossings(t1, t2) - s1).copy().rewrite(complimentary_cell);

        x_ings_one = expansion_base.reorganiseCrossings('Int', x, s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_top = expansion_base.expandWrapper(base_type + '-LI0', x + s1 * s2, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x + 1, t1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-RI0', x + t1 * s2 + 1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        target = [complimentary_cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
    } else if (type.tail('RI0-NI0')) {
        x = cell.key.last() - s1 * s2 - 1;
        expansion_base = this.getSlice(key.last()).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-RI0', x + s1 * s2, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_one = expansion_base.reorganiseCrossings('Int', x + 1, t1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}

        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-LI0', x + 1 + s2 * t1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x + 2, t2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        target = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([new NCell({id: 'Int', key: [x]})]);
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
    var options = this.getDragOptions(up ? ['Int-L-NI0', 'Int-R-NI0', 'Int-LI0-NI0', 'Int-RI0-NI0', 'IntI0-L-NI0', 'IntI0-R-NI0', 
                                            'IntI0-LI0-NI0', 'IntI0-RI0-NI0'] 
                                            : ['Int-L-N', 'Int-R-N', 'Int-LI0-N', 'Int-RI0-N', 'IntI0-L-N', 'IntI0-R-N', 
                                            'IntI0-LI0-N', 'IntI0-RI0-N'], key);
                                            

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
        //console.log('interpretDrag.IntLN: no moves allowed');
        return [];
    }
    console.log(msg);
    return possible_options;
};

Diagram.prototype.interchangerAllowed.IntLN = function(type, key) {
    
    var cell = this.cells[key.last()];
    var slice = this.getSlice(key.last());
    var s1, t1, s2, t2;
    if(cell.id === 'Int'){
        t1 = slice.target_size(cell.key.last() + 1);
        s1 = slice.source_size(cell.key.last() + 1);
        t2 = slice.target_size(cell.key.last());
        s2 = slice.source_size(cell.key.last());
    }
    else if(cell.id === 'IntI0'){
        t1 = slice.target_size(cell.key.last() - 1);
        s1 = slice.source_size(cell.key.last() - 1);
        t2 = slice.target_size(cell.key.last());
        s2 = slice.source_size(cell.key.last());
    }
    else{
        return false;
    }

    var base_type = (type.substr(0, 5) === 'IntI0') ? 'IntI0' : 'Int';
    var x, index, expansion_base, pullthrough_top, pullthrough_bottom, x_ings_one, x_ings_two, source, source_key;

    if (type.tail('L-N')) {
        x = cell.key.last() - s1 * s2 - 1; if(x < 0) {return false;}
        index = key.last() - s2 - this.crossings(s2, t1) - this.crossings(s2, s1) - t1; if(index < 0 || index > this.cells.length) {return false;}
        expansion_base = this.getSlice(index).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-L', x + 1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}

        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 1, s2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-R', x, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('Int', x, s1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        source = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([cell]);
        source_key = source.length - 1;
    }
    else if (type.tail('L-NI0')) {
        x = cell.key.last(); if(x < 0) {return false;}
        index = key.last() + 1; if(index < 0 || index > this.cells.length) {return false;}
        expansion_base = this.getSlice(index).copy();
   
        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 2, t1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
 
        pullthrough_top = expansion_base.expandWrapper(base_type + '-R', x + 1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 1, t1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-L', x, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}
        
        source = [cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
        source_key = 0;
   } else if (type.tail('R-N')) {
        x = cell.key.last() - s1 * s2; if(x < 0) {return false;}
        index = key.last() - s1 - this.crossings(t2, s1) - this.crossings(s2, s1) - t2; if(index < 0 || index > this.cells.length) {return false;}
        expansion_base = this.getSlice(index).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-R', x + 1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}

        x_ings_one = expansion_base.reorganiseCrossings('Int', x + 1, s1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-L', x, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x, s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        source = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([cell]);
        source_key = source.length - 1;
    }
    else if (type.tail('R-NI0')) {
        x = cell.key.last() - 1; if(x < 0) {return false;}
        index = key.last() + 1; if(index < 0 || index > this.cells.length) {return false;}
        expansion_base = this.getSlice(index).copy();
   
        x_ings_one = expansion_base.reorganiseCrossings('Int', x + 2, t2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
 
        pullthrough_top = expansion_base.expandWrapper(base_type + '-L', x + 1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x + 1, s1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-R', x, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        source = [cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
        source_key = 0;
   } else if (type.tail('LI0-N')) {
        x = cell.key.last() - 1; if(x < 0) {return false;}
        index = key.last() - s2 - this.crossings(t1, s2) - this.crossings(t1, t2) - t1; if(index < 0 || index > this.cells.length) {return false;}
        expansion_base = this.getSlice(index).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-LI0', x + s1 * s2, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}

        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x + 1, t1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-RI0', x + 1 + t1 * s2, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 2, t2, t1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        source = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([cell]);
        source_key = source.length - 1;
    }
    else if (type.tail('LI0-NI0')) {
        x = cell.key.last() - s1 * s2; if(x < 0) {return false;}
        index = key.last() + 1; if(index < 0 || index > this.cells.length) {return false;}

        expansion_base = this.getSlice(index).copy();
   
        x_ings_one = expansion_base.reorganiseCrossings('IntI0', x, s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
 
        pullthrough_top = expansion_base.expandWrapper(base_type + '-RI0', x + s1 * s2, s2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('Int', x + 1, t1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-LI0', x + 1 + s2 * t1, t1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        source = [cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
        source_key = 0;
   } else if (type.tail('RI0-N')) {
        x = cell.key.last(); if(x < 0) {return false;}
        index = key.last() - t2 - this.crossings(s1, t2) - this.crossings(t1, t2) - s1; if(index < 0 || index > this.cells.length) {return false;}
        expansion_base = this.getSlice(index).copy();

        pullthrough_top = expansion_base.expandWrapper(base_type + '-RI0', x + s1 * s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}

        x_ings_one = expansion_base.reorganiseCrossings('Int', x + 1, t2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-LI0', x + 1 + s1 * t2, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x + 2, t1, t2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}

        source = pullthrough_top.concat(x_ings_one.concat(pullthrough_bottom.concat(x_ings_two))).concat([cell]);
        source_key = source.length - 1;
    }
    else if (type.tail('RI0-NI0')) {
        x = cell.key.last() - s1 * s2 - 1; if(x < 0) {return false;}
        index = key.last() + 1; if(index < 0 || index >= this.cells.length) {return false;}
        expansion_base = this.getSlice(index).copy();
   
        x_ings_one = expansion_base.reorganiseCrossings('Int', x, s1, s2);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_one)) {return false;}
 
        pullthrough_top = expansion_base.expandWrapper(base_type + '-LI0', x + s1 * s2, s1);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_top)) {return false;}
        
        x_ings_two = expansion_base.reorganiseCrossings('IntI0', x + 1, t2, s1);
        if(!expansion_base.multipleInterchangerRewrite(x_ings_two)) {return false;}
        
        pullthrough_bottom = expansion_base.expandWrapper(base_type + '-RI0', x + 1 + t2 * s1, t2);
        if(!expansion_base.multipleInterchangerRewrite(pullthrough_bottom)) {return false;}

        source = [cell].concat(x_ings_one.concat(pullthrough_top.concat(x_ings_two.concat(pullthrough_bottom))));
        source_key = 0;
   }
    else{
        return false;
    }
    
    // Special cases with empty crossings
    if(source.length === 1){
        if(source.last().id === 'Int'){
            if(!type.tail('R-N', 'RI0-N', 'L-NI0', 'LI0-NI0')) return false;
        }else if(source.last().id === 'IntI0'){
            if(!type.tail('L-N', 'LI0-N', 'R-NI0', 'RI0-NI0')) return false;
        }
    }
    
    return this.subinstructions(key,  {list: source, key: source_key});


    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
    
};


Diagram.prototype.getInterchangerBoundingBox.IntLN = function(type, key) {

    var cell = this.cells[key.last()].copy();
    var slice = this.getSlice(key.last());
    var s1, t1, s2, t2;
    if(cell.id === 'Int'){
        t1 = slice.target_size(cell.key.last() + 1);
        s1 = slice.source_size(cell.key.last() + 1);
        t2 = slice.target_size(cell.key.last());
        s2 = slice.source_size(cell.key.last());
    }
    else if(cell.id === 'IntI0'){
        t1 = slice.target_size(cell.key.last() - 1);
        s1 = slice.source_size(cell.key.last() - 1);
        t2 = slice.target_size(cell.key.last());
        s2 = slice.source_size(cell.key.last());
    }
    else{
        return false;
    }

    var box = this.getSliceBoundingBox(key.last());
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; 
    
    if (type.tail('L-N')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() - s1 * s2,
                key.last() - t1 - s2 - this.crossings(s2, t1) - this.crossings(s2, s1)]);
    } else if (type.tail('L-NI0')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() + s1 * s2,
                key.last() + 1 + t1 + s2 + this.crossings(s2, t1) + this.crossings(t2, t1)]);
    } else if (type.tail('R-N')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() - s1 * s2,
                key.last() - t2 - s1 - this.crossings(t2, s1) - this.crossings(s2, s1)]);
    } else if (type.tail('R-NI0')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() + s1 * s2,
                key.last() + 1 + t2 + s1 + this.crossings(s1, t2) + this.crossings(t2, t1)]);
    } else  if (type.tail('LI0-N')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() + s1 * s2,
                key.last() - s2 - t1 - this.crossings(t1, s2) - this.crossings(t1, t2)]);
    } else if (type.tail('LI0-NI0')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() - s1 * s2,
                key.last() + 1 + s2 + t1 + this.crossings(s2, s1) + this.crossings(s2, t1)]);
    } else  if (type.tail('RI0-N')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() + s1 * s2,
                key.last() - s1 - t2 - this.crossings(s1, t2) - this.crossings(t1, t2)]);
    } else if (type.tail('RI0-NI0')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() - s1 * s2,
                key.last() + 1 + s1 + t2 + this.crossings(s2, s1) + this.crossings(t2, s1)]);
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
