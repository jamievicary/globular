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
        if (n === 1 && m === 1) {
           //list.push(new NCell(type, [0, x])); // Zero is hardcoded - number of zeros has to be generic
           list.push(new NCell(type, [0, x]));
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
        x = key_location;
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
        list.push(new NCell(new_type, [heights[heights.length - 2]]));
        if (new_type.tail('I')) {
            list.push(new NCell(new_type.substr(0, new_type.length - 1), [heights[heights.length - 2]]));
        }
        else {
            list.push(new NCell(new_type + 'I', [heights[heights.length - 2]]));
        }
    }

    return list;
}

Diagram.prototype.atomicInterchangerTarget = function(type, heights, key_location) {


    var x;
    if(type.tail('RI') || type.tail('LI')){
        x = key_location;
    }
    else{
        x = heights[heights.length - 1];   
    }
    
    /*
    var temp_coordinates_x = zero_array(heights.length - 2);
    temp_coordinates_x.push(this.nCells[x].coordinates.last());
    */
    
    var temp_coordinates_x = diff_array(this.nCells[x].coordinates, heights.slice(0, heights.length - 1));
    //temp_coordinates_x.push(this.nCells[x].coordinates.last());
    
    diff_array
    
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
        list.push(new NCell(this.nCells[x + 1].id, temp_coordinates_x1));
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
        
        
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
        list.push(new NCell(this.nCells[x + 1].id, temp_coordinates_x1));
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
        
      
        /*
        this.nCells[x + 1].coordinates.increment_last(g_source - g_target);
        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        */
    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('L')) {
        /*
        list = this.getSlice(x).expand(new_type, this.nCells[x].coordinates.last(),
           this.source_size(x), 1);
        */
        
        list = this.getSlice(x).expand(new_type, 0,
           this.source_size(x), 1);
        
        temp_coordinates_x.increment_last(1);
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
       
        /*
        this.nCells[x].coordinates.increment_last(1);
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        */
    }


    if (type.tail('R')) {
    /*
        list = this.getSlice(x).expand(new_type, this.nCells[x].coordinates.last() - 1,
            1, this.source_size(x));

        this.nCells[x].coordinates.increment_last(-1);
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
    */
        list = this.getSlice(x).expand(new_type, 0,
            1, this.source_size(x));

        temp_coordinates_x.increment_last(-1);
        list.push(new NCell(this.nCells[x].id, temp_coordinates_x));
    }


    var new_type = type.slice(0, type.length - 3);

    if (type.tail('LI')) {

        var g_source = this.source_size(x);
        var g_target = this.target_size(x);

        list = list.concat(this.getSlice(x - g_source- 1).expand(
            new_type, 0,
            g_target, 1));

        temp_coordinates_x.increment_last(-1);
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x));

/*
        list = list.concat(this.getSlice(x - g_source- 1).expand(
            new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1] - 1,
            g_target, 1));

        this.nCells[x].coordinates.increment_last(-1);
        list.splice(0, 0, new NCell(this.nCells[x].id, this.nCells[x].coordinates));
*/
    }

    if (type.tail('RI')) {

        var g_source = this.source_size(x);
        var g_target = this.target_size(x);

/*
        list = list.concat(this.getSlice(x - g_source - 1).expand(
            new_type, this.nCells[x].coordinates.last(),
            1, g_target));
*/
        list = list.concat(this.getSlice(x - g_source - 1).expand(
            new_type, 0,
            1, g_target));
         
        temp_coordinates_x.increment_last(1);
        list.splice(0, 0, new NCell(this.nCells[x].id, temp_coordinates_x));

        /*    
        this.nCells[x].coordinates.increment_last(1);
        list.splice(0, 0, new NCell(this.nCells[x].id, this.nCells[x].coordinates));

        */
    }
    
    if (type.tail('1I')) {
        return [];
    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('1')) {
        list.push(new NCell(new_type, zero_array(heights.length - 1)));//heights.slice(0, heights.length - 1)));
        if(new_type.tail('I')){
            list.push(new NCell(new_type.substr(0, new_type.length - 1), zero_array(heights.length - 1)));//heights.slice(0, heights.length - 1)));
        }
        else{
            list.push(new NCell(new_type + 'I', zero_array(heights.length - 1)));//heights.slice(0, heights.length - 1)));
        }
    }

    return list;
}

Diagram.prototype.interchangerAllowed = function(nCell) {
    
    var x;
    if(nCell.id.tail('RI') || nCell.id.tail('LI')){
        x = nCell.key_location;
    }
    else{
        x = nCell.coordinates[nCell.coordinates.length - 1];    
    }

    // Sanity check - necessary for degenerate cases
    if(x < 0){
        return false;
    }
    
    var type = nCell.id;

    var c1 = this.nCells[x];
    var g1_source = this.source_size(x); //gProject.signature.getGenerator(this.nCells[x].id);
    var g1_target = this.target_size(x); //gProject.signature.getGenerator(this.nCells[x].id);
    
    if(x + 1 < this.nCells.length){
        var c2 = this.nCells[x + 1];
        var g2_source = this.source_size(x + 1); //gProject.signature.getGenerator(this.nCells[x].id);
        var g2_target = this.target_size(x + 1); //gProject.signature.getGenerator(this.nCells[x].id);
    }
    //var g2 = this.source_size(this.nCells[x+1]); //gProject.signature.getGenerator(this.nCells[x + 1].id);

    if (nCell.id === 'Int') {
        return (c1.coordinates.last() >= c2.coordinates.last() + g2_source);
    }

    if (nCell.id.tail('IntI')) {
        return (c1.coordinates.last() + g1_target <= c2.coordinates.last());
    }

    var new_type = type.slice(0, type.length - 2);


    if (nCell.id.tail('L')) {
        var crossings = g1_target;
        var template = this.getSlice(x).expand(new_type, this.nCells[x].coordinates.last(),
            crossings, 1);

        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template, nCell.coordinates);
    }

    if (nCell.id.tail('R')) {

        var crossings = g1_target;
        var template = this.getSlice(x).expand(new_type, this.nCells[x].coordinates.last() - 1,
            1, crossings);
            
        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template, nCell.coordinates);
    }

    var new_type = type.slice(0, type.length - 3);


    if (nCell.id.tail('LI')) {

        var crossings = g1_source;
        if(x - crossings < 0){
            return false;
        }
        var template = this.getSlice(x - crossings).expand(
            new_type, this.nCells[x - /*HACK*/ 1].coordinates.last(),
            crossings, 1);

        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template, nCell.coordinates);
        
        /*
        for(var i = 0; i < template.length; i++){
            template[i].coordinates[0] += this.nCells[x - crossings + i].coordinates[0];
        } 
        */
    }

    if (nCell.id.tail('RI')) {

        var crossings = g1_source;
        if(x - crossings < 0){
            return false;
        }
        var template = this.getSlice(x - crossings).expand(
            new_type, this.nCells[x - crossings].coordinates.last(),
            1, crossings);
        
        /*   
        for(var i = 0; i < template.length; i++){
            template[i].coordinates[0] += this.nCells[x - crossings + i].coordinates[0];
        }
        */

        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template, nCell.coordinates);
    }


    if (nCell.id.tail('Int-1I') || nCell.id.tail('IntI-1I')) {
        if (this.nCells[x].id === new_type) {
            if (this.nCells[x + 1].id === new_type + 'I' || this.nCells[x + 1].id === new_type.substr(0, new_type.length - 1))
                if(this.nCells[x].coordinates.last() === this.nCells[x + 1].coordinates.last())
                    return true;
        }
        return false;
    }

    var new_type = type.slice(0, type.length - 2);

    if (nCell.id.tail('1')) {
        return true;
    }

}

Diagram.prototype.instructionsEquiv = function(list1, list2, offset) {

    if(list1.length != list2.length) return false;

    for (var i = 0; i < list1.length; i++) {
        if (!this.nCellEquiv(list1[i], list2[i], offset)) {
            return false;
        }
    }
    return true;
}

Diagram.prototype.nCellEquiv = function(cell_one, cell_two, offset) {

    if (cell_one.id != cell_two.id) return false;
    if (cell_one.coordinates.length != cell_two.coordinates.length) return false;
    //if (cell_one.coordinates.last() != cell_two.coordinates.last()) return false;

    for (var i = 0; i < cell_one.coordinates.length; i++) {
        if (cell_one.coordinates[i] != cell_two.coordinates[i] + offset[i]) return false;
    }

    // NEEED OFFSET, Do you really? (with inclusion of slices in preprocessing for Expansion - I don't think so)

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
    var temp_coordinates; // = this.nCells[drag.coordinates.last()].coordinates.slice(0);
    //temp_coordinates.push(drag.coordinates.last());

    var x = drag.coordinates.last();
    var y;
    
    if(drag.coordinates.length === 1){
        
        temp_coordinates = min_array(this.nCells[x].coordinates.slice(0),
                                    this.nCells[x + drag.directions[0]].coordinates.slice(0))
        temp_coordinates.push(drag.coordinates.last());
        
        if(drag.directions[0] === -1){
            //drag.coordinates.increment_last(-1);
            //temp_coordinates.increment_last(-1);
            //temp_coordinates = this.nCells[drag.coordinates.last() - 1].coordinates.slice(0);
            //temp_coordinates.push(drag.coordinates.last());
        /*    if(this.nCells[drag.coordinates.last() - 1].coordinates.last() <
                this.nCells[drag.coordinates.last()].coordinates.last()){
                temp_coordinates[temp_coordinates.length - 2]--;
            }
        */
        temp_coordinates.increment_last(-1);
        
        }
        

        var int1_bool = false;
        var int2_bool = false;
       
        id = 'Int';
        var interchanger_1 = new NCell(id, temp_coordinates);
        if (this.interchangerAllowed(interchanger_1)) {
            int1_bool = true;    
        }
        
        id = 'IntI'
        var interchanger_2 = new NCell(id, temp_coordinates);
        if(this.interchangerAllowed(interchanger_2)){
            int2_bool = true;
        }
            
        if(!int1_bool && !int2_bool){
            id = this.nCells[drag.coordinates.last()].id + '-1I'; // Attempt to cancel out interchangers
            var interchanger_3 = new NCell(id, temp_coordinates);
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
    return [new NCell(id, temp_coordinates)];
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
    
    if(drag.directions.last() === 1){
        if(drag.directions[0] === 1){
            if(this.nCells[drag.coordinates.last() + 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() + 1].id; 
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            id = id + '-L';
            
            temp_coordinates = min_array(this.nCells[x].coordinates.slice(0),
                                    this.nCells[x + this.target_size(x)].coordinates.slice(0))
            temp_coordinates.push(drag.coordinates.last());
 
                                    
            interchanger = new NCell(id, temp_coordinates, drag.coordinates.last());
            if(!this.interchangerAllowed(interchanger)){
                return [];
            }
            else{
                return [interchanger];
            }
        }
        else{
            if(this.nCells[drag.coordinates.last() - 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() - 1].id;
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            id = id + '-RI'; 
            
            //temp_coordinates = this.nCells[drag.coordinates.last() - this.source_size(x)].coordinates.slice(0);
            
            temp_coordinates = min_array(this.nCells[x].coordinates.slice(0),
                                    this.nCells[x - this.source_size(x)].coordinates.slice(0))
            
            temp_coordinates.push(drag.coordinates.last());
            temp_coordinates.increment_last(-this.source_size(x));
            
            

            interchanger = new NCell(id, temp_coordinates, drag.coordinates.last());
            if(!this.interchangerAllowed(interchanger)){
                return [];
            }
            else{
                return [interchanger];
            }            
        }
    }


    else if (drag.directions.last() === -1){
        if(drag.directions[0] === 1){
            if(this.nCells[drag.coordinates.last() + 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() + 1].id;   
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            id = id + '-R';  
            //temp_coordinates.increment_last(-this.source_size(x));
            
            //temp_coordinates = this.nCells[drag.coordinates.last()/*Hack?*/].coordinates.slice(0);
            //temp_coordinates.increment_last(-1);
            
            temp_coordinates = min_array(this.nCells[x].coordinates.slice(0),
                                    this.nCells[x + this.target_size(x)].coordinates.slice(0))
            
            temp_coordinates.push(drag.coordinates.last());
            
            interchanger = new NCell(id, temp_coordinates, drag.coordinates.last());
            if(!this.interchangerAllowed(interchanger)){
                return [];
            }
            else{
                return [interchanger];
            }
        }
        else{
            if(this.nCells[drag.coordinates.last() - 1].id.substr(0, 3) === 'Int'){
                id = this.nCells[drag.coordinates.last() - 1].id;  
                
                // Need to offset the attachment point of the interchanger by the number of inputs of the pulled-through cell
                //var g = gProject.signature.getGenerator(this.nCells[drag.coordinates.last()].id)
                //temp_coordinates.increment_last(-g.source.nCells.length);
            }
            else{
                console.log("No way to pull through");
                return [];
            }
            id = id + '-LI';  
            
            //temp_coordinates = this.nCells[drag.coordinates.last()/*Hack?*/].coordinates.slice(0);
            //temp_coordinates.increment_last(-1);
            temp_coordinates = min_array(this.nCells[x].coordinates.slice(0),
                                    this.nCells[x - this.source_size(x)].coordinates.slice(0))
            
            temp_coordinates.push(drag.coordinates.last());
            temp_coordinates.increment_last(-this.source_size(x));

            interchanger = new NCell(id, temp_coordinates, drag.coordinates.last());
            if(!this.interchangerAllowed(interchanger)){
                return [];
            }
            else{
                return [interchanger];
            }
        }
    }
    else{
        return [];
    }
    
    return [new NCell(id, temp_coordinates)];
}


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

}