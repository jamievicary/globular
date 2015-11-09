"use strict";

/*
    New interchanger code used in diagram class
*/

/*
    n is the number of elements on the left, m the number of elements on the right - this explanation is to be expanded
*/
Diagram.prototype.expand = function(type, x, n, m) {
    var list = new Array();

    if (type === 'Int' || type === 'IntI') {
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
    }
    return list;
}


Diagram.prototype.atomicInterchangerSource = function(type, key_location) {
    
    var x = key_location.last();

    var list = new Array();

    if (type.tail('Int')) {
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
        return list;
    }

    if (type.tail('IntI')) {
        list.push(new NCell(this.nCells[x - 1].id, this.nCells[x - 1].coordinates));
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        return list;
    }

    if (type.tail('L', 'R')) {
        list = this.nCells.slice(x, x + this.target_size(x) + 1);
    }

    if (type.tail('LI', 'RI')) {
       list = this.nCells.slice(x - this.source_size(x) , x + 1);

    }
    
    if (type.tail('1')) {
        return [];
    }

    var new_type = type.slice(0, type.length - 3);

    if (type.tail('1I')) {
        list.push(new NCell(new_type, [0]));
        if (new_type.tail('I')) {
            list.push(new NCell(new_type.substr(0, new_type.length - 1), [0]));
        }
        else {
            list.push(new NCell(new_type + 'I', [0]));
        }
    }

    return list;
}

Diagram.prototype.atomicInterchangerTarget = function(type, key_location) {

    var x = key_location.last();

    var heights = this.interchangerCoordinates(type, key_location);

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

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('L')) {

        list = this.expand(new_type, 0, this.source_size(x), 1);
        
        if(temp_coordinates_x != null){
            temp_coordinates_x.increment_last(1);
        }
        else{
            this.nCells[x].key.increment_last(-heights.penultimate() + 1);
        }        
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }


    if (type.tail('R')) {

        list = this.expand(new_type, 0, 1, this.source_size(x));
        
        if(temp_coordinates_x != null){
            temp_coordinates_x.increment_last(-1);
        }
        else{
            this.nCells[x].key.increment_last(-heights.penultimate() - 1);
        }
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }


    var new_type = type.slice(0, type.length - 3);

    if (type.tail('LI')) {

        var g_source = this.source_size(x);
        var g_target = this.target_size(x);

        list = list.concat(this.expand(new_type, 0, g_target, 1));

        if(temp_coordinates_x != null){
            temp_coordinates_x.increment_last(-1);
        }
        else{
            this.nCells[x].key.increment_last(-heights.penultimate() - 1);
        }
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }

    if (type.tail('RI')) {

        var g_source = this.source_size(x);
        var g_target = this.target_size(x);

        list = list.concat(this.expand(new_type, 0, 1, g_target));
         
        if(temp_coordinates_x != null){
            temp_coordinates_x.increment_last(1);
        }
        else{
            this.nCells[x].key.increment_last(-heights.penultimate() + 1);
        } 
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x, this.nCells[x].key));
    }
    
    
    if (type.tail('1I')) {
        return [];
    }

    if (type.tail('1')) {
        
        var new_type = type.slice(0, type.length - 2);
        var new_key_location = key_location.slice(0, key_location.length - 1);
        var inverse_key_location = this.getSlice(x).interchangerInverseKey(new_type, new_key_location);
        
        for(var i = 0; i < new_key_location.length; i++){
            new_key_location[new_key_location.length - 1 - i] -= heights[heights.length - 2 - i];
            inverse_key_location[new_key_location.length - 1 - i] -= heights[heights.length - 2 - i];
        }
        
        if(new_type.tail('I')){
            list.push(new NCell(new_type, null, new_key_location));
            list.push(new NCell(new_type.substr(0, new_type.length - 1), null, inverse_key_location));
        }
        else{
            list.push(new NCell(new_type, null, new_key_location));
            list.push(new NCell(new_type + 'I', null, inverse_key_location));
        }
    }
    
    /*
    We make key locations such, that it is possible to take key location one shorter here
    to get the key of the thing that should be inserted
    
    Then an additional function would tell us what would be the key of the inverse interchanger applied
    at the same location to undo the application of this one
    */

    return list;
}

Diagram.prototype.interchangerAllowed = function(type, key_location) {
    
    var x = key_location.last();
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

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('L')) {
        var crossings = g1_target;
        
        if(this.nCells[x].coordinates.last() === this.getSlice(x).nCells.length - 1) return false;
        if(this.nCells[x].coordinates.last() + this.target_size(x) - 1 != this.nCells[x + 1].coordinates.last()) return false;
        
        var template = this.expand(new_type, this.nCells[x].coordinates.last(), crossings, 1);
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }

    if (type.tail('R')) {

        var crossings = g1_target;
        if(this.nCells[x].coordinates.last() <= 0) return false;
        if(this.nCells[x].coordinates.last() - 1 != this.nCells[x + 1].coordinates.last()) return false;
        
        var template = this.expand(new_type, this.nCells[x].coordinates.last() - 1, 1, crossings);
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }


    var new_type = type.slice(0, type.length - 3);
    
    if (type.tail('LI')) {

        var crossings = g1_source;
        
        if(x <= 0 ) return false;
        if(this.nCells[x].coordinates.last() - 1 != this.nCells[x - 1].coordinates.last()) return false;


        var template = this.expand(new_type, this.nCells[x].coordinates.last() - 1, crossings, 1);
        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }

    if (type.tail('RI')) {

        var crossings = g1_source;
        
        if(this.nCells[x].coordinates.last() === this.getSlice(x).nCells.length - 1) return false;
        if(this.nCells[x].coordinates.last() + this.source_size(x) - 1 != this.nCells[x - 1].coordinates.last()) return false;
        
        var template = this.expand(new_type, this.nCells[key_location.last()].coordinates.last(), 1, crossings);
        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }

    if (type.tail('1I')) {
        if (this.nCells[x].id === new_type) {
            if (this.nCells[x + 1].id === new_type + 'I' || this.nCells[x + 1].id === new_type.substr(0, new_type.length - 1))
                if(this.nCells[x].key.last() + 1 === this.nCells[x + 1].key.last()
                    || this.nCells[x].key.last() - 1 === this.nCells[x + 1].key.last()
                    ) return true;
        }
        return false;
    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('1')) {
        return true;
    }

}

Diagram.prototype.instructionsEquiv = function(list1, list2) {

    if(list1.length != list2.length) return false;

    for (var i = 0; i < list1.length; i++) {
        if (!this.nCellEquiv(list1[i], list2[i])) {
            return false;
        }
    }
    return true;
}

Diagram.prototype.nCellEquiv = function(cell_one, cell_two) {

    if (cell_one.id != cell_two.id) return false;
    if (cell_one.key.length != cell_two.key.length) return false;
    
    for (var i = 0; i < cell_one.key.length; i++) {
        if (cell_one.key[i] != cell_two.key[i]) return false;
    }
    return true;
}

Diagram.prototype.rewriteInterchanger = function(nCell) {

    var rewrite = {};

    rewrite.source = new Diagram(null, this.atomicInterchangerSource(nCell.id, nCell.key));
    rewrite.target = new Diagram(null, this.atomicInterchangerTarget(nCell.id, nCell.key));

    if (rewrite.source.nCells.length != 0 || rewrite.target.nCells.length) return rewrite;

    alert("Illegal data passed to rewriteInterchanger");

    return [];
}

Diagram.prototype.interpret_drag = function(drag) {
    
    var new_drag;
    
    // RECURSIVE CASE
    if (drag.coordinates.length > 1) {
        
        new_drag = {
            boundary_type: drag.boundary_type,
            boundary_depth: drag.boundary_depth,
            coordinates: drag.coordinates.slice(0, drag.coordinates.length),
            directions: drag.directions.slice(0, drag.directions.length)
        };
        new_drag.coordinates = new_drag.coordinates.slice(0, drag.coordinates.length - 1);
        
        var action = this.getSlice(drag.coordinates.last()).interpret_drag(new_drag);

        if(action.length === 0){
            return [];
        }
        var new_action = action[0];
        new_action.id += "-1";
        new_action.key.push(drag.coordinates.last());
        return [new_action];
    }
    
    // Create a copy of the drag to use in the first round of tests:
    new_drag = {
            boundary_type: drag.boundary_type,
            boundary_depth: drag.boundary_depth,
            coordinates: drag.coordinates.slice(0, drag.coordinates.length),
            directions: drag.directions.slice(0, drag.directions.length)
        };
        
    // BASE CASE
    return this.test_basic(new_drag).concat(this.test_pull_through(drag));
        
}

Diagram.prototype.test_basic = function(drag) {
    
    var id;
    var x = drag.coordinates.last();

    if(drag.coordinates.length === 1){
        
        if(x + drag.directions[0] < 0 || x + drag.directions[0] >= this.nCells.length){
            return [];
        }
        
        var int_bool;
        var intI_bool;
            
        if(drag.directions[0] > 0){
            int_bool = this.interchangerAllowed('Int', [x]); 
            intI_bool = this.interchangerAllowed('IntI', [x + 1]) ;
            
            if(!int_bool && !intI_bool){
                id = this.nCells[x].id + '-1I'; // Attempt to cancel out interchangers
                var k;
                if(this.nCells[x].id === 'Int'){
                    k = 0;
                }
                else{
                    k = 1;
                }
                if(!this.interchangerAllowed(id, [k, x])){
                    console.log("cannot interchange");
                    return [];
                }
                else{
                    return [new NCell(id, null, [k, x])];
                }
            }   
            else if(int_bool && intI_bool){ 
                
                // Resolve conflict using the second variable
                if(drag.directions.last() === 1){
                    intI_bool = false;
                }
                else{
                    int_bool = false;
                }
            }
            
            if(int_bool){
                return [new NCell('Int', null, [x])];
            }
            else {
                return [new NCell('IntI', null, [x + 1])];
            }
        }
        else{
            int_bool = this.interchangerAllowed('Int', [x - 1]); 
            intI_bool = this.interchangerAllowed('IntI', [x]);
            
            if(!int_bool && !intI_bool){
                id = this.nCells[x - 1].id + '-1I'; // Attempt to cancel out interchangers
                if(!this.interchangerAllowed(id, [x - 1])){
                    console.log("cannot interchange");
                    return [];
                }
                else{
                    return [new NCell(id, null, [x - 1])];
                }
            }   
            else if(int_bool && intI_bool){ 
                
                // Resolve conflict using the second variable
                if(drag.directions.last() === 1){
                    intI_bool = false;
                }
                else{
                    int_bool = false;
                }
            }
            
            if(int_bool){
                return [new NCell('Int', null, [x - 1])];
            }
            else {
                return [new NCell('IntI', null, [x])];
            }
            
        }
    }
    else{
        return [];
    }
}

Diagram.prototype.test_pull_through = function(drag) {

    var id;
    var x = drag.coordinates.last(); 

    if(drag.directions[0] === 1){
        
        if(this.target_size(x) === 0){
            if(drag.directions.last() === 1){
                id = 'Int'   
            }
            else{
                id = 'IntI'
            }       
        }
        else if(this.nCells[drag.coordinates.last() + 1].id.substr(0, 3) === 'Int'){
            id = this.nCells[drag.coordinates.last() + 1].id; 
        }
        else{
            console.log("No way to pull through");
            return [];
        }

        var boolL = this.interchangerAllowed(id + '-L', [x]);
        var boolR = this.interchangerAllowed(id + '-R', [x]);        
    }
    else{
        
        if(this.source_size(x) === 0){
            if(drag.directions.last() === 1){
                id = 'IntI'   
            }
            else{
                id = 'Int'
            }
            
        }
        else if(this.nCells[drag.coordinates.last() - 1].id.substr(0, 3) === 'Int'){
            id = this.nCells[drag.coordinates.last() - 1].id; 
        }
        else{
            console.log("No way to pull through");
            return [];
        }
        
        var boolLI = this.interchangerAllowed(id + '-LI', [x]);
        var boolRI = this.interchangerAllowed(id + '-RI', [x]);
    }  
    
    var list = new Array();
    
    if(boolL){
        list.push(new NCell(id + '-L', null, [x]));
    }
    if(boolR){
        list.push(new NCell(id + '-R', null, [x]));
    }
    if(boolLI){
        list.push(new NCell(id + '-LI', null, [x]));
    }
    if(boolRI){
        list.push(new NCell(id + '-RI', null, [x]));
    }
    
    return list;
};


Diagram.prototype.interchangerInverseKey = function(type, key_location) {

    var x = key_location.last();

        if(type.tail('Int')){
            return [x + 1];
        }
        
        else if(type.tail('IntI')){
            return [x - 1];
        }
        else if(type.tail('R')){
            return [x + this.source_size(x)];
        }
        
        else if(type.tail('L')){
            return [x + this.source_size(x)];
        }
        else if(type.tail('RI')){
            return [x - this.source_size(x)];
        }
        else if(type.tail('LI')){
            return [x - this.source_size(x)];
        }
        else if(type.tail('-1')){
            return key_location.slice(0);
        }
        else if(type.tail('-1I')){
            return key_location.slice(0);
        }
};

Diagram.prototype.interchangerCoordinates = function(type, key_location) {
    
    if(key_location.length === 0) return [];
    
    var diagram_pointer = this;
    var key = key_location.last();
    
    if(key_location.length === 1) {
        if(type.tail('Int')){
            list = this.nCells[key + 1].coordinates.slice(0);
        }
        
        else if(type.tail('IntI')){
            key--;
            list = this.nCells[key].coordinates.slice(0);
        }
        
       
        else if(type.tail('R')){
            list = this.nCells[key + 1].coordinates.slice(0);
        }
        
        else if(type.tail('L')){
            list = this.nCells[key].coordinates.slice(0);
        }
        else if(type.tail('RI')){
            key = key - diagram_pointer.source_size(key);
            list = this.nCells[key].coordinates.slice(0);
        }
        else if(type.tail('LI')){
            list = this.nCells[key - 1].coordinates.slice(0);
            key = key - diagram_pointer.source_size(key);
        }
        
        else{
            var list = this.nCells[key].coordinates.slice(0);
        }
        
        return list.concat([key]);    
    }
    // Possibly generate a new type
    
    var new_type = type.slice(0, type.length - 2);
    
    return diagram_pointer.getSlice(key).interchangerCoordinates(new_type, key_location.slice(0, key_location.length - 1)).concat([key]);   

};

