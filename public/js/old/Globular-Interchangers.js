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

/*
Diagram.prototype.atomicInterchangerSource = function(type, key_location) {
    var x = key_location.last();
    var list = new Array();
    if (type.tail('Int')) {
        list.push(new NCell(this.cells[x].id, this.cells[x].coordinates));
        list.push(new NCell(this.cells[x + 1].id, this.cells[x + 1].coordinates));
        return list;
    }
    if (type.tail('IntI')) {
        list.push(new NCell(this.cells[x - 1].id, this.cells[x - 1].coordinates));
        list.push(new NCell(this.cells[x].id, this.cells[x].coordinates));
        return list;
    }
    if (type.tail('L', 'R')) {
        list = this.cells.slice(x, x + this.target_size(x) + 1);
    }
    if (type.tail('LI', 'RI')) {
       list = this.cells.slice(x - this.source_size(x) , x + 1);
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
*/


Diagram.prototype.interchangerAllowed = function(type, key_location) {
    
    var x = key_location.last();
    // Sanity check - necessary for degenerate cases
    if(x < 0){
        return false;
    }
    
    var c1 = this.cells[x];
    var g1_source = this.source_size(x);
    var g1_target = this.target_size(x);
    
    if (type === 'Int') {
        if(x + 1 >= this.cells.length) return false;

        var c2 = this.cells[x + 1];
        var g2_source = this.source_size(x + 1);
        var g2_target = this.target_size(x + 1);

        return (c1.coordinates.last() >= c2.coordinates.last() + g2_source);
    }

    if (type.tail('IntI')) {
        if(x - 1 < 0) return false;

        var c3 = this.cells[x - 1];
        var g3_source = this.source_size(x - 1);
        var g3_target = this.target_size(x - 1); 

        return (c3.coordinates.last() + g3_target <= c1.coordinates.last());
    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail('L')) {
        var crossings = g1_target;
        
        if(this.cells[x].coordinates.last() === this.getSlice(x).cells.length - 1) return false;
        if(this.cells[x].coordinates.last() + this.target_size(x) - 1 != this.cells[x + 1].coordinates.last()) return false;
        
        var template = this.expand(new_type, this.cells[x].coordinates.last(), crossings, 1);
        return this.instructionsEquiv(this.cells.slice(x + 1, x + 1 + crossings), template);
    }

    if (type.tail('R')) {

        var crossings = g1_target;
        if(this.cells[x].coordinates.last() <= 0) return false;
        if(this.cells[x].coordinates.last() - 1 != this.cells[x + 1].coordinates.last()) return false;
        
        var template = this.expand(new_type, this.cells[x].coordinates.last() - 1, 1, crossings);
        return this.instructionsEquiv(this.cells.slice(x + 1, x + 1 + crossings), template);
    }


    var new_type = type.slice(0, type.length - 3);
    
    if (type.tail('LI')) {

        var crossings = g1_source;
        
        if(x <= 0 ) return false;
        if(this.cells[x].coordinates.last() - 1 != this.cells[x - 1].coordinates.last()) return false;


        var template = this.expand(new_type, this.cells[x].coordinates.last() - 1, crossings, 1);
        return this.instructionsEquiv(this.cells.slice(x - crossings, x), template);
    }

    if (type.tail('RI')) {

        var crossings = g1_source;
        
        if(this.cells[x].coordinates.last() === this.getSlice(x).cells.length - 1) return false;
        if(this.cells[x].coordinates.last() + this.source_size(x) - 1 != this.cells[x - 1].coordinates.last()) return false;
        
        var template = this.expand(new_type, this.cells[key_location.last()].coordinates.last(), 1, crossings);
        return this.instructionsEquiv(this.cells.slice(x - crossings, x), template);
    }

    if (type.tail('1I')) {
        if (this.cells[x].id === new_type) {
            if (this.cells[x + 1].id === new_type + 'I' || this.cells[x + 1].id === new_type.substr(0, new_type.length - 1))
                if(this.cells[x].key.last() + 1 === this.cells[x + 1].key.last()
                    || this.cells[x].key.last() - 1 === this.cells[x + 1].key.last()
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

/*
Diagram.prototype.rewriteInterchanger = function(nCell) {
    var rewrite = {};
    rewrite.source = new Diagram(null, this.atomicInterchangerSource(nCell.id, nCell.key));
    rewrite.target = new Diagram(null, this.atomicInterchangerTarget(nCell.id, nCell.key));
    if (rewrite.source.cells.length != 0 || rewrite.target.cells.length) return rewrite;
    alert("Illegal data passed to rewriteInterchanger");
    return [];
}
*/

/*
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
*/
/*
Diagram.prototype.test_basic = function(drag) {
    
    var id;
    var x = drag.coordinates.last();

    if(drag.coordinates.length === 1){
        
        if(x + drag.directions[0] < 0 || x + drag.directions[0] >= this.cells.length){
            return [];
        }
        
        var int_bool;
        var intI_bool;
            
        if(drag.directions[0] > 0){
            int_bool = this.interchangerAllowed('Int', [x]); 
            intI_bool = this.interchangerAllowed('IntI', [x + 1]) ;
            
            if(!int_bool && !intI_bool){
                id = this.cells[x].id + '-1I'; // Attempt to cancel out interchangers
                var k;
                if(this.cells[x].id === 'Int'){
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
                id = this.cells[x - 1].id + '-1I'; // Attempt to cancel out interchangers
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
*/

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
        else if(this.cells[drag.coordinates.last() + 1].id.substr(0, 3) === 'Int'){
            id = this.cells[drag.coordinates.last() + 1].id; 
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
        else if(this.cells[drag.coordinates.last() - 1].id.substr(0, 3) === 'Int'){
            id = this.cells[drag.coordinates.last() - 1].id; 
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
            list = this.cells[key + 1].coordinates.slice(0);
        }
        
        else if(type.tail('IntI')){
            key--;
            list = this.cells[key].coordinates.slice(0);
        }
        
       
        else if(type.tail('R')){
            list = this.cells[key + 1].coordinates.slice(0);
        }
        
        else if(type.tail('L')){
            list = this.cells[key].coordinates.slice(0);
        }
        else if(type.tail('RI')){
            key = key - diagram_pointer.source_size(key);
            list = this.cells[key].coordinates.slice(0);
        }
        else if(type.tail('LI')){
            list = this.cells[key - 1].coordinates.slice(0);
            key = key - diagram_pointer.source_size(key);
        }
        
        else{
            var list = this.cells[key].coordinates.slice(0);
        }
        
        return list.concat([key]);    
    }
    // Possibly generate a new type
    
    var new_type = type.slice(0, type.length - 2);
    
    return diagram_pointer.getSlice(key).interchangerCoordinates(new_type, key_location.slice(0, key_location.length - 1)).concat([key]);   

};

