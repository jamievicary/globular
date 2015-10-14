"use strict";

/*
    NCell class
*/


/*
    Creates an N-Cell of type 'id' whose location in a diagram is specified by coordinate
    This is to allow uniform treatment of interchangers and other cells
*/
function NCell(id, coordinates) {
    
    this.id = id;
    this.coordinates = coordinates;
};

NCell.prototype.copy = function() {
    
    var temp_array = new Array();    
    for(var i = 0; i < this.coordinates.length; i++){
        temp_array[i] = this.coordinates[i];
    }
    
    return new NCell(this.id, temp_array);
}

NCell.prototype.source_size = function() {
    
    if(this.id.substr(0, 3) === 'Int'){
        console.log("Interchanger not in the signature");
    }
    else{
        return gProject.signature.getGenerator(this.id).source.nCells.length;
    }
   
}

NCell.prototype.target_size = function() {
    
    if(this.id.substr(0, 3) === 'Int'){
        console.log("Interchanger not in the signature");
    }
    else{
        return gProject.signature.getGenerator(this.id).target.nCells.length;
    }
   
}