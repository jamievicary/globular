"use strict";

/*
    New interchanger code used in diagram class
*/

/*
    n is the number of elements on the left, m the number of elements on the right - this explanation is to be expanded
*/
Diagram.prototype.expand = function(type, x, n, m) {

    var list = new Array();
    
    if (type === 'Int') {
        if (n === 1 && m === 1){ list.push(this.atomicInterchangerSource(type, x)); }
        if (m === 1 && n != 1) { list = this.expand(type, x, n, 1).concat(this.expand(type, x + 1, n, m-1)); }
        else { list = this.expand(type, x + n - 1, 1, m).concat(this.expand(type, x, n-1, m)); }
    }
    
    return list;
    
}

Diagram.prototype.atomicInterchangerSource = function(type, x) {
    
    var list = new Array();
    var entry;
    
    if(type === 'Int'){
        
        entry = new NCell(this.nCells[x].id, this.nCells[x].coordinates);
        list.push(entry);
        
        entry = new NCell(this.nCells[x+1].id, this.nCells[x+1].coordinates);
        list.push(entry);
       
    }
    
    if(type === 'Int-I'){
        
        entry = new NCell(this.nCells[x].id, this.nCells[x].coordinates);
        list.push(entry);
        
        entry = new NCell(this.nCells[x+1].id, this.nCells[x+1].coordinates);
        list.push(entry);
       
    }
    
    var new_type = type.slice(0, type.length - 2);
    
    if(type[type.length - 1] === 'L'){
        list.push(this.nCells[x].id, 0);
        list.concat(this.expand(new_type, 0, gProject.signature.getGenerator(this.nCells[x].id).target.nCells.length), 1);
    }
    
    if(type[type.length - 1] === 'R'){
        list.push(this.nCells[x].id, 1);
        list.concat(this.expand(new_type, 0, 1, gProject.signature.getGenerator(this.nCells[x].id).target.nCells.length));
    }
    
    /*
    if(type[type.length - 1] === 'I'){
        return this.atomicInterchangerTarget(new_type, x);
    }
    */
    
    return list;
}

Diagram.prototype.atomicInterchangerTarget = function(type, x) {

    var list = new Array();
    var entry;
    
    if(type === 'Int'){
        var g = gProject.signature.getGenerator(this.nCells[x+1].id);
        var temp_coordinates = this.nCells[x].coordinates;
        temp_coordinates[temp_coordinates.length - 1] = temp_coordinates[temp_coordinates.length - 1] - 
                                                        g.source.nCells.length + g.target.nCells.length;
        
        entry = new NCell(this.nCells[x+1].id, this.nCells[x+1].coordinates);
        list.push(entry);
        
        entry = new NCell(this.nCells[x].id, temp_coordinates);
        list.push(entry);
       
    }
    
    if(type === 'Int-I'){
        var g = gProject.signature.getGenerator(this.nCells[x].id);
        var temp_coordinates = this.nCells[x+1].coordinates;
        temp_coordinates[temp_coordinates.length - 1] = temp_coordinates[temp_coordinates.length - 1] - 
                                                        g.target.nCells.length + g.source.nCells.length;
        
        entry = new NCell(this.nCells[x+1].id, temp_coordinates);
        list.push(entry);
        
        entry = new NCell(this.nCells[x].id, this.nCells[x].coordinates);
        list.push(entry);
       
    }

    var new_type = type.slice(0, type.length - 2);
    
    if(type[type.length - 1] === 'L'){
        list = this.expand(new_type, 0, gProject.signature.getGenerator(this.nCells[x].id).source.nCells.length, 1);
        list.push(this.nCells[x].id, 1);
    }
    
    if(type[type.length - 1] === 'R'){
        list = this.expand(new_type, 0, 1, gProject.signature.getGenerator(this.nCells[x].id).source.nCells.length);
        list.push(this.nCells[x].id, 0);    }
    /*
    if(type[type.length - 1] === 'I'){
        return this.atomicInterchangerSource(new_type, x);
    }
    */
    return list;
}

Diagram.prototype.interchangerAllowed = function(nCell) {

    var x = nCell.coordinates[nCell.coordinates.length - 1];

    var c1 = this.nCells[x];
    var c2 = this.nCells[x+1];
    var g1 = gProject.signature.getGenerator(this.nCells[x].id);
    var g2 = gProject.signature.getGenerator(this.nCells[x+1].id);
    
    if(nCell.id === 'Int'){

        return (c1.coordinates[c1.coordinates.length - 1] >= c2.coordinates[c2.coordinates.length - 1] + g2.source.nCells.length);

    }
    
    if(nCell.id === 'Int-I'){

        return (c1.coordinates[c1.coordinates.length - 1] + g1.target.nCells.length <= c2.coordinates[c2.coordinates.length - 1]);

    }
    
    if(nCell.id === 'Int-L'){
        
        var crossings = g1.target.nCells.length;
        var template = this.expand('Int', 0, crossings, 1);

        for(var i = 0; i < crossings; i++){
            
            if(!this.nCellEquiv(this.nCells[x + 1 + i], template[i]))
                return false;
        }
    
    return true;    
    }
    
}

Diagram.prototype.nCellEquiv = function(cell_one, cell_two) {

    if(cell_one.id != cell_two.id)  return false;
    if(cell_one.coordinates.length != cell_two.coordinates.length) return false;
    for(var i = 0; i < cell_one.coordinates.length; i++){
        if(cell_one.coordinates[i] != cell_two.coordinates[i]) return false;
    }
    
    // NEEED OFFSET

    return true;
}

Diagram.prototype.rewriteInterchanger = function(nCell) {

    var rewrite = {};

    rewrite.source = new Diagram(null, this.atomicInterchangerSource(nCell.id, nCell.coordinates[nCell.coordinates.length - 1]));
    rewrite.target = new Diagram(null, this.atomicInterchangerTarget(nCell.id, nCell.coordinates[nCell.coordinates.length - 1]));

    if(rewrite.source.nCells.length != 0)    return rewrite;

    alert("Illegal data passed to rewriteInterchanger");

    return [];
    
}



// NEW SCHEME - check if interchanger is allowed for this diagram
Diagram.prototype.interchangerAllowedManual = function(cell) {

    var height = cell.coordinates[cell.coordinates.length - 1];
    var type = cell.id;

    if (this.getDimension() != 2) return false;
    if (height < 0) return false;
    if (height >= this.nCells.length - 1) return false;

    // Get data about rewrites
    var g1 = this.nCells[height];
    var r1 = gProject.signature.getGenerator(g1.id);
    var g2 = this.nCells[height + 1];
    var r2 = gProject.signature.getGenerator(g2.id);

    // Check that cells are able to be interchanged
    if (type == 'interchanger-left') {
        return (g1.coordinates[g1.coordinates.length - 1] + r1.target.nCells.length <= g2.coordinates[g2.coordinates.length - 1]);
    }
    else if (type == 'interchanger-right') {
        return (g1.coordinates[g1.coordinates.length - 1] >= g2.coordinates[g2.coordinates.length - 1] + r2.source.nCells.length);
    }
    else {
        alert("Illegal type passed to interchangerAllowed");
        return false;
    }
}


// NEW SYSTEM - Apply an interchanger at a given height
Diagram.prototype.rewriteInterchangerManual = function(cell) {

    if (!this.interchangerAllowed(cell)) {
        alert("Illegal data passed to rewriteInterchanger");
        return;
    }

    // Get data about rewrites
    var height = cell.coordinates[cell.coordinates.length - 1];
    var type = cell.id;
    var g1 = this.nCells[height];
    var r1 = gProject.signature.getGenerator(g1.id);
    var g2 = this.nCells[height + 1];
    var r2 = gProject.signature.getGenerator(g2.id);

    var g1_new_position, g2_new_position;
    if (type == 'interchanger-left') {
        g1_new_position = g1.coordinates[g1.coordinates.length - 1];
        g2_new_position = g2.coordinates[g2.coordinates.length - 1] + r1.source.nCells.length - r1.target.nCells.length;
    }
    else if (type == 'interchanger-right') {
        g1_new_position = g1.coordinates[g1.coordinates.length - 1] - r2.source.nCells.length + r2.target.nCells.length;
        g2_new_position = g2.coordinates[g2.coordinates.length - 1];
    }
    else {
        alert("Illegal data passed to rewriteInterchanger");
    }

    // Rewrite the diagram
    this.nCells[height].coordinates[this.nCells[height].coordinates.length - 1] = g1_new_position;
    this.nCells[height + 1].coordinates[this.nCells[height + 1].coordinates.length - 1] = g2_new_position;
    var temp = this.nCells[height];
    this.nCells[height] = this.nCells[height + 1];
    this.nCells[height + 1] = temp;

}
