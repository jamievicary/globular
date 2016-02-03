"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-T family
// This naturality for the tangle/untangle


RegisterSingularityFamily({
    family: 'IntLT',
    dimension: 5,
    members: ['Int-L-T','Int-L-TI0',
    'IntI0-L-T', 'IntI0-L-TI0',
    'Int-LI0-T', 'Int-LI0-TI0',
    'IntI0-LI0-T', 'IntI0-LI0-TI0',
    'Int-R-T', 'Int-R-TI0',
    'IntI0-R-T', 'IntI0-R-TI0',
    'Int-RI0-T', 'Int-RI0-TI0',
    'IntI0-RI0-T', 'IntI0-RI0-TI0'],
    friendly: {
        'Int-L-T': 'Pull-through tangle interchanger above',
    }
});

Diagram.prototype.complementaryKey = function(type) {
    
    if(type.tail('L')) return 'RI0'
    if(type.tail('R')) return 'LI0'
    if(type.tail('LI0')) return 'R'
    if(type.tail('RI0')) return 'L'

};

Diagram.prototype.getTarget.IntLT = function(type, key) {
    
    var cell = this.cells[key.last()];
    var slice = this.getSlice(key.last());
    var t = slice.target_size(cell.key.last());
    var s = slice.source_size(cell.key.last());
    
    var key_type = type.substr(0, type.length - (type.tail('-TI0') ? 4 : 2));
    var base_type = (type.substr(0, 5) === 'IntI0') ? 'IntI0' : 'Int';
    var complimentary_base_type = base_type === 'Int' ? 'IntI0' : 'Int';
    var complementary_key_type = this.complementaryKey(key_type);

    var x, expansion_base, target, source_key;


    if (type.tail('L-T')  || type.tail('R-T')) {
        if (cell.id != key_type) {return false;}
        var new_cell = new NCell({id: complimentary_base_type + '-' + complementary_key_type, key: cell.key})
        expansion_base = this.getSlice(key.last()).copy()
        if(!expansion_base.multipleInterchangerRewrite([new_cell])) {return false;}


        var stack = expansion_base.expand(complimentary_base_type + '-EI0', cell.key.last() - s + 1, t);
        if(!expansion_base.multipleInterchangerRewrite(stack)) {return false;}

        target = [new_cell].concat(stack);
    }
    else if (type.tail('L-TI0')  || type.tail('R-TI0')) {
        var new_cell = new NCell({id: key_type, key: cell.key})
        expansion_base = this.getSlice(key.last()).copy()
        if(!expansion_base.multipleInterchangerRewrite([new_cell])) {return false;}


        var stack = expansion_base.expand(complimentary_base_type + '-EI0', cell.key.last() - s, s);
        if(!expansion_base.multipleInterchangerRewrite(stack)) {return false;}

        target = [new_cell].concat(stack);
    }

    else{
        return false;
    }

    return target;
    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
}

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData.IntLT = function(type, key) {
    return this.getTarget(type, key);
}

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLT = function(drag) {
    if (drag.directions == null) return [];
    var right = drag.directions[1] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(right ? ['Int-L-TI0', 'Int-R-TI0', 'Int-LI0-TI0', 'Int-RI0-TI0', 'IntI0-L-TI0', 'IntI0-R-TI0', 
                                            'IntI0-LI0-TI0', 'IntI0-RI0-TI0'] 
                                            : ['Int-L-T', 'Int-R-T', 'Int-LI0-T', 'Int-RI0-T', 'IntI0-L-T', 'IntI0-R-T', 
                                            'IntI0-LI0-T', 'IntI0-RI0-T'], key);
                                            

    // Collect the possible options
    var possible_options = [];
    var msg = 'interpretDrag.IntLT: allowed ';
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            msg += (possible_options.length != 0 ? ', ' : '') + options[i].type;
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) {
        console.log('interpretDrag.IntLT: no moves allowed');
        return [];
    }
    console.log(msg);
    return possible_options;
};

Diagram.prototype.interchangerAllowed.IntLT = function(type, key) {
    
    var cell = this.cells[key.last()];
    var slice = this.getSlice(key.last());
    var t = slice.target_size(cell.key.last());
    var s = slice.source_size(cell.key.last());
    
    var key_type = type.substr(0, type.length - (type.tail('-TI0') ? 4 : 2));
    var base_type = (type.substr(0, 5) === 'IntI0') ? 'IntI0' : 'Int';
    var complimentary_base_type = base_type === 'Int' ? 'IntI0' : 'Int';
    var complementary_key_type = this.complementaryKey(key_type);
    var x, expansion_base, stack, source, source_key;

    if (type.tail('L-T') || type.tail('R-T')) {
        if (cell.id != key_type) {return false;}
        expansion_base = this.getSlice(key.last() + 1).copy();
        stack = expansion_base.expand(complimentary_base_type + '-EI0', cell.key.last() - s, s);
        if(!expansion_base.multipleInterchangerRewrite(stack)) {return false;}

        source = [cell].concat(stack);
        source_key = 0;
    } else if (type.tail('L-TI0') || type.tail('R-TI0')) {
        if (cell.id != complimentary_base_type + '-' + complementary_key_type) {return false;}
        expansion_base = this.getSlice(key.last() + 1).copy();
        stack = expansion_base.expand(complimentary_base_type + '-EI0', cell.key.last() - s + 1, t);
        if(!expansion_base.multipleInterchangerRewrite(stack)) {return false;}

        source = [cell].concat(stack);
        source_key = 0;
    }

    else{
        return false;
    }
    
    return this.subinstructions(key,  {list: source, key: source_key});


    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
    
};


Diagram.prototype.getInterchangerBoundingBox.IntLT = function(type, key) {

    var cell = this.cells[key.last()];
    var slice = this.getSlice(key.last());
    var t = slice.target_size(cell.key.last());
    var s = slice.source_size(cell.key.last());

    var box = this.getSliceBoundingBox(key.last());
    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; 
    
    if (type.tail('L-T')  || type.tail('R-T')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() - s,
                key.last() + 1 + s]);
    } 
    else if (type.tail('L-TI0')  || type.tail('R-TI0')) {
    edge_box = this.getLocationBoundingBox([0, 
                box.min.last() ,
                key.last() + 1 + t]);
    } 

    return this.unionBoundingBoxes(alpha_box, edge_box);
};


Diagram.prototype.getInterchangerCoordinates.IntLT = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;

};
