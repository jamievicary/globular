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
            list.push(new NCell(type, null, [x]));
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

Diagram.prototype.atomicInterchangerSource = function(type, heights, key_location) {
    
    var x;
    if(type.tail('RI') || type.tail('LI')){
        x = key_location.last();
    }
    else{
        x = heights[heights.length - 1];   
    }
    
    var list = new Array();

    if (type.tail('Int', 'IntI')) {
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
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
/*
        list.push(new NCell(new_type, [heights[heights.length - 2]]));
        if (new_type.tail('I')) {
            list.push(new NCell(new_type.substr(0, new_type.length - 1), [heights[heights.length - 2]]));
        }
        else {
            list.push(new NCell(new_type + 'I', [heights[heights.length - 2]]));
        }
*/
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

Diagram.prototype.atomicInterchangerTarget = function(type, heights, key_location) {


    var x;
    if(type.tail('RI') || type.tail('LI')){
        x = key_location.last();
    }
    else{
        x = heights[heights.length - 1];   
    }
    
    /*
    var temp_coordinates_x = zero_array(heights.length - 2);
    temp_coordinates_x.push(this.nCells[x].coordinates.last());
    */
    if(this.nCells.length != 0){
        var temp_coordinates_x = diff_array(this.nCells[x].coordinates, heights.slice(0, heights.length - 1));
    }
    //temp_coordinates_x.push(this.nCells[x].coordinates.last());
    
    if(x + 1 < this.nCells.length){
        /*
        var temp_coordinates_x1 = zero_array(heights.length - 2);
        temp_coordinates_x1.push(this.nCells[x+1].coordinates.last());
        */
     var temp_coordinates_x1 = diff_array(this.nCells[x+1].coordinates, heights.slice(0, heights.length - 1));
    }
    
    var list = new Array();
    var entry;

    if (type.tail('Int')) {
        var g_source = this.source_size(x + 1); 
        var g_target = this.target_size(x + 1); 
        
        temp_coordinates_x.increment_last(g_target - g_source);

        list.push(new NCell(this.nCells[x + 1].id, temp_coordinates_x1, temp_coordinates_x1.last()));
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, temp_coordinates_x.last()));
        
        /*
        list.push(new NCell(this.nCells[x + 1].id, temp_coordinates_x1));
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
        */
        
        /*
        this.nCells[x].coordinates.increment_last(g_target - g_source);
        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        */
    }

    if (type.tail('IntI')) {

        var g_source = this.source_size(x); 
        var g_target = this.target_size(x); 
      
        temp_coordinates_x1.increment_last(g_source - g_target);

        list.push(new NCell(this.nCells[x + 1].id, temp_coordinates_x1, temp_coordinates_x1.last()));
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x, temp_coordinates_x.last()));
        
        /*
        list.push(new NCell(this.nCells[x + 1].id, temp_coordinates_x1));
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
        */
      
        /*
        this.nCells[x + 1].coordinates.increment_last(g_source - g_target);
        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        */
    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('L')) {

        list = this.expand(new_type, 0, this.source_size(x), 1);
        
        temp_coordinates_x.increment_last(1);
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
       
    }


    if (type.tail('R')) {

        list = this.expand(new_type, 0, 1, this.source_size(x));

        temp_coordinates_x.increment_last(-1);
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
    }


    var new_type = type.slice(0, type.length - 3);

    if (type.tail('LI')) {

        var g_source = this.source_size(x);
        var g_target = this.target_size(x);

        list = list.concat(this.expand(new_type, 0, g_target, 1));

        temp_coordinates_x.increment_last(-1);
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x));
    }

    if (type.tail('RI')) {

        var g_source = this.source_size(x);
        var g_target = this.target_size(x);

        list = list.concat(this.expand(new_type, 0, 1, g_target));
         
        temp_coordinates_x.increment_last(1);
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x));
    }
    
    if (type.tail('1I')) {
        return [];
    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('1')) {
        /*
        list.push(new NCell(new_type, zero_array(heights.length - 1)));
        if(new_type.tail('I')){
            list.push(new NCell(new_type.substr(0, new_type.length - 1), zero_array(heights.length - 1)));
        }
        else{
            list.push(new NCell(new_type + 'I', zero_array(heights.length - 1)));
        }
        */
        list.push(new NCell(new_type, [0]));
        if(new_type.tail('I')){
            list.push(new NCell(new_type.substr(0, new_type.length - 1), [0]));
        }
        else{
            list.push(new NCell(new_type + 'I', [0]));
        }
    }

    return list;
}

Diagram.prototype.interchangerAllowed = function(nCell) {
    
    var x = nCell.key_location.last();
    // Sanity check - necessary for degenerate cases
    if(x < 0){
        return false;
    }
    
    var type = nCell.id;

    var c1 = this.nCells[x];
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);
    
    if(x + 1 < this.nCells.length){
        var c2 = this.nCells[x + 1];
        var g2_source = this.source_size(x + 1);
        var g2_target = this.target_size(x + 1); 
    }

    if (nCell.id === 'Int') {
        return (c1.coordinates.last() >= c2.coordinates.last() + g2_source);
    }

    if (nCell.id.tail('IntI')) {
        return (c1.coordinates.last() + g1_target <= c2.coordinates.last());
    }

    var new_type = type.slice(0, type.length - 2);


    if (nCell.id.tail('L')) {
        var crossings = g1_target;
        
        if(this.nCells[x].coordinates.last() === this.getSlice(x).nCells.length - 1) 
            return false;
        
        var template = this.expand(new_type, 
        this.nCells[x].coordinates.last(), crossings, 1);

        if(this.nCells[x].coordinates.last() + this.target_size(x) - 1 != this.nCells[x + 1].coordinates.last()) return false;

        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }

    if (nCell.id.tail('R')) {

        var crossings = g1_target;
        if(this.nCells[x].coordinates.last() - nCell.coordinates.penultimate() - 1 < 0) return false;
        
        var template = this.expand(new_type, this.nCells[x].coordinates.last() - 1, 1, crossings);
        
        if(this.nCells[x].coordinates.last() - 1 != this.nCells[x + 1].coordinates.last()) return false;
        
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }


    var new_type = type.slice(0, type.length - 3);
    
    if (nCell.id.tail('LI')) {

        var crossings = g1_source;
        if(x - crossings < 0 ) return false;

        var template = this.expand(new_type, this.nCells[x].coordinates.last() - 1, crossings, 1);
            
        if(this.nCells[x].coordinates.last() - 1 != this.nCells[x - 1].coordinates.last()) return false;

        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }

    if (nCell.id.tail('RI')) {

        var crossings = g1_source;
        if(x - crossings < 0 ) return false;
        
        var template = this.expand(new_type, 
        this.nCells[nCell.key_location.last()].coordinates.last(), 1, crossings);

        if(this.nCells[x].coordinates.last() + this.source_size(x) - 1 != this.nCells[x - 1].coordinates.last()) return false;
            
        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }


    if (nCell.id.tail('1I')) {
        if (this.nCells[x].id === new_type) {
            if (this.nCells[x + 1].id === new_type + 'I' || this.nCells[x + 1].id === new_type.substr(0, new_type.length - 1))
                //if(this.nCells[x].coordinates.last() === this.nCells[x + 1].coordinates.last())
                if(this.nCells[x].key_location.last() === this.nCells[x + 1].key_location.last())
                    return true;
        }
        return false;
    }

    var new_type = type.slice(0, type.length - 2);

    if (nCell.id.tail('1')) {
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
    if (cell_one.key_location.length != cell_two.key_location.length) return false;
    
    for (var i = 0; i < cell_one.key_location.length; i++) {
        if (cell_one.key_location[i] != cell_two.key_location[i]) return false;
    }
    return true;
}

Diagram.prototype.rewriteInterchanger = function(nCell) {

    var rewrite = {};

    rewrite.source = new Diagram(null, this.atomicInterchangerSource(nCell.id, nCell.coordinates, nCell.key_location));
    rewrite.target = new Diagram(null, this.atomicInterchangerTarget(nCell.id, nCell.coordinates, nCell.key_location));

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
        new_action.coordinates.push(drag.coordinates.last());
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
    var temp_coordinates; 
    var x = drag.coordinates.last();

    if(drag.coordinates.length === 1){
        
        if(x + drag.directions[0] < 0 || x + drag.directions[0] >= this.nCells.length){
            return [];
        }
        
        if(drag.directions[0] === -1){
            temp_coordinates = this.nCells[x - 1].coordinates.slice(0);
            temp_coordinates.push(drag.coordinates.last());
            temp_coordinates.increment_last(-1);
        }
        else{
            temp_coordinates = this.nCells[x].coordinates.slice(0);
            temp_coordinates.push(drag.coordinates.last());
        }
        

        var int1_bool = false;
        var int2_bool = false;
       
        id = 'Int';
        var interchanger_1 = new NCell(id, temp_coordinates, [temp_coordinates.last()]);
        if (this.interchangerAllowed(interchanger_1)) {
            int1_bool = true;    
        }
        
        id = 'IntI'
        var interchanger_2 = new NCell(id, temp_coordinates, [temp_coordinates.last()]);
        if(this.interchangerAllowed(interchanger_2)){
            int2_bool = true;
        }
            
        if(!int1_bool && !int2_bool){
            id = this.nCells[temp_coordinates.last()].id + '-1I'; // Attempt to cancel out interchangers
            var interchanger_3 = new NCell(id, temp_coordinates, [temp_coordinates.last()]);
            if(!this.interchangerAllowed(interchanger_3)){
                console.log("cannot interchange");
                return [];
            }
        }
        else if(int1_bool && int2_bool){ 
            
            // Resolve conflict using the second variable
            if(drag.directions.last() === 1){
                id = 'Int';
            }
            else{
                id = 'IntI';
            }
        }
        else if(int1_bool){
            id = 'Int';
        }
        else {
            id = 'IntI';
        }
    return [new NCell(id, temp_coordinates, [temp_coordinates.last()])];
    }
    else{
        return [];
    }
}

Diagram.prototype.test_pull_through = function(drag) {

    if(drag.directions.length != 2){
        return [];   
    }
    
    var id;
    var temp_coordinates
    var interchanger;
    var x = drag.coordinates.last(); 
    
    var new_drag = {
        boundary_type: drag.boundary_type,
        boundary_depth: drag.boundary_depth,
        coordinates: [this.nCells[drag.coordinates.last()].coordinates.last()],//drag.coordinates.slice(0, drag.coordinates.length),
        directions: drag.directions.slice(1, drag.directions.length)
    };
    
    if(drag.directions.last() === 1){
        if(drag.directions[0] === 1){
            
            if(x + this.target_size(x) >= this.nCells.length){
                return [];
            }
            
            if(this.target_size(x) === 0){
                var sub_action = this.getSlice(drag.coordinates.last()).test_basic(new_drag);
                if(sub_action.length === 0){
                    return [];
                }else{
                    id = sub_action[0].id;
                }
            }
            else if(this.nCells[drag.coordinates.last() + 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() + 1].id; 
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            id = id + '-L';
        
            temp_coordinates = this.nCells[x].coordinates.slice(0);
            temp_coordinates.push(drag.coordinates.last());
        }
        else{
            
            if(this.source_size(x) === 0){
                new_drag.directions[0] = - new_drag.directions[0]; // HACK
                var sub_action = this.getSlice(drag.coordinates.last() + 1).test_basic(new_drag);
                if(sub_action.length === 0){
                    return [];
                }else{
                    id = sub_action[0].id;
                }
            }
            else if(this.nCells[drag.coordinates.last() - 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() - 1].id; 
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            id = id + '-RI'; 
            
            if(x - this.source_size(x) < 0){
                return [];
            }

            temp_coordinates = this.nCells[x - this.source_size(x)].coordinates.slice(0)
            temp_coordinates.push(drag.coordinates.last());
            temp_coordinates.increment_last(-this.source_size(x));
        }
    }

    else if (drag.directions.last() === -1){
        if(drag.directions[0] === 1){

            if(this.target_size(x) === 0){
                var sub_action = this.getSlice(drag.coordinates.last()).test_basic(new_drag);
                if(sub_action.length === 0){
                    return [];
                }else{
                    id = sub_action[0].id;
                }
            }
            else if(this.nCells[drag.coordinates.last() + 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() + 1].id; 
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            
            id = id + '-R';  
           
            temp_coordinates = this.nCells[x].coordinates.slice(0);
            temp_coordinates.increment_last(-1);
            temp_coordinates.push(drag.coordinates.last());
        }
        else{
            if(this.source_size(x) === 0){
                new_drag.directions[0] = - new_drag.directions[0]; // HACK
                
                var sub_action = this.getSlice(drag.coordinates.last() + 1).test_basic(new_drag);
                if(sub_action.length === 0){
                    return [];
                }else{
                    id = sub_action[0].id;
                }
            }
            else if(this.nCells[drag.coordinates.last() - 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() - 1].id; 
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            
            id = id + '-LI';  
            
            temp_coordinates = this.nCells[x].coordinates.slice(0);
            temp_coordinates.increment_last(-1);
            temp_coordinates.push(drag.coordinates.last());
            temp_coordinates.increment_last(-this.source_size(x));
        }
    }
    else{
        return [];
    }
    //interchanger = new NCell(id, temp_coordinates, [drag.coordinates.last()]);
    interchanger = new NCell(id, temp_coordinates, [drag.coordinates.last()]);
    
    if(!this.interchangerAllowed(interchanger)){
        return [];
    }
    else{
        return [interchanger];
    }
};


Diagram.prototype.source_size = function(level) {

    var nCell = this.nCells[level];

    if(nCell.id.substr(0, 3) === 'Int'){
        return this.getSlice(level).atomicInterchangerSource(nCell.id, nCell.coordinates, nCell.key_location).length;
    }
    else{
        return nCell.source_size();
    }

}

Diagram.prototype.target_size = function(level) {

    var nCell = this.nCells[level];

    if(nCell.id.substr(0, 3) === 'Int'){
        return this.getSlice(level).atomicInterchangerTarget(nCell.id, nCell.coordinates, nCell.key_location).length;
    }
    else{
        return nCell.target_size();
    }

};

Diagram.prototype.interchangerCoordinates = function(type, key_location) {
    
    if(key_location.length === 0) return [];
    
    var diagram_pointer = this;
    var key = this.nCells[x].key_location.last();
    
    if(diagram_pointer.nCells[key].id.tail('RI') || diagram_pointer.nCells[key].id.tail('LI')){
        key = key - diagram_pointer.source_size(key);
    }
    
    // Possibly generate a new type
    
    return diagram_pointer.getSlice(key).interchangerCoordinates(type, key_location.slice(0, key_location.length - 1)).concat([key]);   

};