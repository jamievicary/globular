"use strict";

/*
Signature Class

*/

/*
    Creates an empty zero signature if 'null' is passed as the argument
    Allows to 'raise' a signature, i.e. create an empty n+1 signature over sig if a signature sig is passed as the argument
*/
function Signature(sig) {
    if (sig === undefined) {
        return;
    }
    this.nCells = new Hashtable();
    this.sigma = sig;
    this.k = 0; // Number of n-Cells == nCells.length
    if (sig === null) {
        this.n = 0; // Level of the signature
    } else {
        this.n = sig.n + 1; // Level of the signature
    }
};

/*
    Returns the dimension of this signature, this is the same as the dimension of the highest order generator in the signature
*/
Signature.prototype.getDimension = function () {
    return this.n;
}

Signature.prototype.getType = function () {
    return 'Signature';
}

/* 
    Adds a new generator to the signature, raising the dimension
    of the signature if required.
*/
Signature.prototype.addGenerator = function (generator) {
    var d = generator.getDimension();
    if (d == this.n) {
        this.nCells.put(generator.identifier, generator);
        this.k++;
    } else {
        this.sigma.addGenerator(generator);
    }
};

/*
    Returns a generator with a given id, regardless of the level of where this generator is
*/
Signature.prototype.getGenerator = function (generatorId) {
    
    var varSig = this;
    var generator = null;
    while (varSig != null) {
        if (varSig.nCells.get(generatorId) != null) {
            generator = varSig.nCells.get(generatorId).copy();
            break;
        }
        varSig = varSig.sigma;
    }
    
   return generator;
};

/* 
    Creates a diagram of a single generator given its name in the signature
*/
Signature.prototype.createDiagram = function (generatorId) {

    // First we look for the appropriate generator to create a diagram of
    var generator = this.getGenerator(generatorId);

    // We construct the building blocks of a new MapDiagram one by one
    var source_boundary = null;
    if (generator.source != null) {
        source_boundary = generator.source.copy();
    }
    
    var nCells = new Array();
    var coordinates = new Array();

    // The generator is not a 0-cell, n-1 zeros are added as its attachment information
    if (generator.source != null) {
        var zeros = generator.source.getDimension();
        while(zeros > 0){
            coordinates.push(0); 
            zeros--;
        }
    }

    nCells.push(new NCell(generatorId, coordinates));
    
    var diagram = new Diagram(source_boundary, nCells);
    return diagram;
}

/* 
    Returns a deep copy of this signature
*/
Signature.prototype.copy = function () {
    var tempSig;
    if (this.sigma === null) {
        tempSig = new Signature(null);
    } else {
        tempSig = new Signature(this.sigma.copy());
    }
    this.nCells.each(function (key, value) { // value is a generator, so we must do a deep copy of it
        tempSig.addGenerator(value.copy());
    });
    return tempSig;
}


/*
    Takes an integer and returns a list of lists of all the cells
*/
Signature.prototype.get_NCells = function (level) {
    var varSig = this;
    
    while (varSig.n != level) {
        varSig = varSig.sigma;
    }
    return varSig.nCells.keys();
}

/*
    Returns a list of all the cells in this signature
*/
Signature.prototype.getCells = function () {
    var tempArray = new Array();
    var varSig = this;
    
    // The overall list is arranged in the order of ascending dimensions of cells in individual arrays
    while (varSig != null) {
        tempArray.splice(0, 0, varSig.nCells.keys())
        varSig = varSig.sigma;
    }
    return tempArray;
};
