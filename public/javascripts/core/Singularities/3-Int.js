"use strict";
/*global RegisterSingularityFamily*/
/*global Diagram*/

var NewSingularityFamily = {family: 'Int', dimension: 3, members: ['Int', 'IntI']};

Diagram.prototype.expand['Int'] = function (type, x, n, m){
    
    var list = new Array();
    if (n === 0 || m === 0) {
        return [];
    }
    else if (n === 1 && m === 1) {
        if(type === 'Int'){
            list.push(new NCell(type, null, [x]));
        }
        else{
            list.push(new NCell(type, null, [x + 1]));
        }
    }
    else if (m != 1 && n === 1) {
        list = this.expand(type, x, 1, 1).concat(this.expand(type, x + 1, 1, m - 1));
    }
    else {
        list = this.expand(type, x + n - 1, 1, m).concat(this.expand(type, x, n - 1, m));
    }
    
    return list;
};

// Interpret drag of this type
Diagram.prototype.interpretDrag['Int'] = function(drag) {
    var r = {};
    var h = drag.coordinates[0];
    if (drag.directions[0] > 0) {
        r.left = { type: 'Int', key: [h], possible: this.interchangerAllowed('Int', [h]) };
        r.right = { type: 'IntI', key: [h+1], possible: this.interchangerAllowed('IntI', [h + 1]) };
    } else {
        r.left = { type: 'IntI', key: [h], possible: this.interchangerAllowed('IntI', [h]) };
        r.right = { type: 'Int', key: [h - 1], possible: this.interchangerAllowed('Int', [h - 1]) };
    }
    // Return the best match in a permissive way
    if (!r.left.possible && !r.right.possible) return null;
    if (r.left.possible && r.right.possible) return (drag.directions[1] > 0 ? r.left : r.right);
    if (r.left.possible) return r.left;
    return r.right;
}

Diagram.prototype.interchangerAllowed['Int'] = function (type, key){
    
    var x = key.last();
    // Sanity check - necessary for degenerate cases
    if(x < 0){
        return false;
    }
    
    var c1 = this.nCells[x];
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);
    
    if (type === 'Int') {
        if(x + 1 >= this.nCells.length) return false;

        var c2 = this.nCells[x + 1];
        var g2_source = this.source_size(x + 1);
        var g2_target = this.target_size(x + 1);

        return (c1.coordinates.last() >= c2.coordinates.last() + g2_source);
    }

    if (type.tail('IntI')) {
        if(x - 1 < 0) return false;

        var c3 = this.nCells[x - 1];
        var g3_source = this.source_size(x - 1);
        var g3_target = this.target_size(x - 1); 

        return (c3.coordinates.last() + g3_target <= c1.coordinates.last());
    }
}


Diagram.prototype.rewritePasteData['Int'] = function (type, key){

    var x = key.last();

    var heights = this.getInterchangerCoordinates(type, key);

    if(this.nCells.length != 0){
        if(this.nCells[x].id.substr(0, 3) === 'Int'){
            var temp_coordinates_x = null;    
        }
        else{
            var temp_coordinates_x = diff_array(this.nCells[x].coordinates, heights.slice(0, heights.length - 1));
        }
    }
    
    var list = new Array();

    if (type.tail('Int')) {
        
        if(x + 1 < this.nCells.length){
            var temp_coordinates_x1 = diff_array(this.nCells[x+1].coordinates, heights.slice(0, heights.length - 1));
        }
        
        var g_source = this.source_size(x + 1); 
        var g_target = this.target_size(x + 1); 
        
        if(temp_coordinates_x != null){
            temp_coordinates_x.increment_last(g_target - g_source);
        }
        else{
            this.nCells[x].key.increment_last(-heights.penultimate() + g_target - g_source);
        }
        
        if(this.nCells[x + 1].key != undefined){
            this.nCells[x + 1].key.increment_last(-heights.penultimate());
        }
        
        list.push(new NCell(this.nCells[x + 1].id, temp_coordinates_x1, this.nCells[x + 1].key));
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }

    if (type.tail('IntI')) {
        
        if(x - 1 >= 0){
            var temp_coordinates_x1 = diff_array(this.nCells[x-1].coordinates, heights.slice(0, heights.length - 1));
        }

        var g_source = this.source_size(x - 1); 
        var g_target = this.target_size(x - 1); 
      
        if(temp_coordinates_x != null){
            temp_coordinates_x.increment_last(g_source - g_target);
        }
        else{
            this.nCells[x].key.increment_last(-heights.penultimate() + g_source - g_target);
        }
        
        if(this.nCells[x - 1].key != undefined){
            this.nCells[x - 1].key.increment_last(-heights.penultimate());
        }

        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
        list.push(new NCell(this.nCells[x - 1].id, temp_coordinates_x1, this.nCells[x - 1].key));
    }
    
    return list;
};

Diagram.prototype.getInterchangerCoordinates['Int'] = function (type, key){
    
    if(key.length === 0) return [];
    
    var diagram_pointer = this;
    var x = key.last();
    
    if(key.length === 1) {
        if(type.tail('Int')){
            list = this.nCells[x + 1].coordinates.slice(0);
        }
        
        else if(type.tail('IntI')){
            x--;
            list = this.nCells[x].coordinates.slice(0);
        }

        else{
            var list = this.nCells[x].coordinates.slice(0);
        }
        
        return list.concat([x]);    
    }
    
    var new_type = type.slice(0, type.length - 2);
    return diagram_pointer.getSlice(x).getInterchangerCoordinates(new_type, key.slice(0, key.length - 1)).concat([x]);   

};

Diagram.prototype.getInterchangerBoundingBox['Int'] = function (type, key){

    var position = this.getInterchangerCoordinates(type, key);
    var x = key.last();
    
    if(type.tail('Int')){
        
        return [this.nCells[x].coordinates.last() - position.penultimate() + this.source_size(x) , 2];
    }
    else if(type.tail('IntI')){
        return [this.nCells[x - 1].coordinates.last() - position.penultimate() + this.source_size(x) , 2];
    }
};

Diagram.prototype.getInverseKey['Int'] = function (type, key){

    var x = key.last();
    
    if(type.tail('Int')){
        return [x + 1];
    }
    else if(type.tail('IntI')){
        return [x - 1];
    }
};

RegisterSingularityFamily(NewSingularityFamily);
