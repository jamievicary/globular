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

Signature.prototype.getDimension = function () {
    return this.n;
}

Signature.prototype.getType = function () {
    return 'Signature';
}

/* 
    Add a new generator to the signature, raising the dimension
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

// This is only used in rewriting
Signature.prototype.remove = function (id) {
    this.nCells.remove(id);
    this.k--;
};


// Create a diagram of a single generator
Signature.prototype.createMapDiagram = function (generatorId) {

    // First we look for the appropriate generator to create a diagram of
    var varSig = this;
    var generator = null;
    while (varSig != null) {
        if (varSig.nCells.get(generatorId) != null) {
            generator = varSig.nCells.get(generatorId).copy();
            break;
        }
        varSig = varSig.sigma;
    }
    

    // We construct the building blocks of a new MapDiagram one by one
    var map = new Hashtable();
    var diagramSignature;
    var sourceBoundary = null;
    if (generator.source != null) {
        sourceBoundary = generator.source.copy();
      //          sourceBoundary.renameFresh();

        var renaming = new Hashtable();
        var varSigBoundary = sourceBoundary.diagram.diagramSignature;
        while(varSigBoundary != null){
            varSigBoundary.nCells.each(function(key, value){
                renaming.put(key, globular_freshName(varSigBoundary.n));
            }.bind(this));
            varSigBoundary = varSigBoundary.sigma;
        }
        sourceBoundary.diagram.rename(renaming);

        sourceBoundary.map.each(function (key, value) {
        if (renaming.get(key) != null) {
            sourceBoundary.map.remove(key);
            sourceBoundary.map.put(renaming.get(key), key);
            }
        });
        
    }
    var targetBoundary = null;
    if (generator.target != null) {
        // Ensure freshness of names
        //generator.target.renameFresh();
   
        targetBoundary = generator.target.copy();
       // targetBoundary.renameFresh();
        
        renaming = new Hashtable();
        varSigBoundary = targetBoundary.diagram.diagramSignature;
        while(varSigBoundary != null){
            varSigBoundary.nCells.each(function(key, value){
                renaming.put(key, globular_freshName(varSigBoundary.n));
            }.bind(this));
            varSigBoundary = varSigBoundary.sigma;
        }
        targetBoundary.diagram.rename(renaming);

        targetBoundary.map.each(function (key, value) {
        if (renaming.get(key) != null) {
            targetBoundary.map.remove(key);
            targetBoundary.map.put(renaming.get(key), key);
            }
        });
        
        if (targetBoundary.diagram.targetBoundary != null) {

            // Optimisation ensuring that at each level, there are only two boundaries
            var globularTargetBijection = targetBoundary.diagram.targetBoundary.mapDiagramBijection(sourceBoundary.diagram.targetBoundary);
            targetBoundary.diagram.targetBoundary.diagram = sourceBoundary.diagram.targetBoundary.diagram;
            targetBoundary.diagram.targetBoundary.map.each(function (key, value) {
                if (globularTargetBijection.get(key) != null) {
                    targetBoundary.diagram.targetBoundary.map.remove(key);
                    targetBoundary.diagram.targetBoundary.map.put(globularTargetBijection.get(key), value);
                }
            });

            var globularTargetBijection = targetBoundary.diagram.sourceBoundary.mapDiagramBijection(sourceBoundary.diagram.sourceBoundary);
            targetBoundary.diagram.sourceBoundary.diagram = sourceBoundary.diagram.sourceBoundary.diagram;
            targetBoundary.diagram.sourceBoundary.map.each(function (key, value) {
                if (globularTargetBijection.get(key) != null) {
                    targetBoundary.diagram.sourceBoundary.map.remove(key);
                    targetBoundary.diagram.sourceBoundary.map.put(globularTargetBijection.get(key), value);
                }
            });
        }
    }
    var partialOrderList = new Array();

    // The generator is a 0-cell
    if (varSig.sigma === null) {
        /*
        !!! In the following lines of code the freshness of generator names is to be decided and implemented !!!
        */
        var zeroGenerator = new Generator(null, null);
        diagramSignature = new Signature(null);
        diagramSignature.addGenerator(zeroGenerator);
        map.put(zeroGenerator.identifier, generatorId);
    }
    // The generator is a k-cell, for k != 0
    else {
        var tempAddedSignature = generator.target.diagram.diagramSignature.copy();

        /*
        Both the source and the target of the generator are diagrams over this.sigma, hence we use it to start building 
        the type signature for the diagram of the generator, later we will add to it the generator itself
        */


        // Now the problem is reduced to taking a union of two diagram signatures modulo a set of elements that are to be identified

        var bijection = new Hashtable();
        // If the generator is a 1-cell, the bijection remains empty
        if (varSig.sigma.sigma != null) {
            // Compute a bijection between elements of source and target boundaries of the target and the source of the generator
            var tempSourceBijection = generator.target.diagram.sourceBoundary.mapDiagramBijection(generator.source.diagram.sourceBoundary);
            var tempTargetBijection = generator.target.diagram.targetBoundary.mapDiagramBijection(generator.source.diagram.targetBoundary);

            // Lift the bijection to be between names in the target and the source of the generator
            tempSourceBijection.each(function (key, value) {
                bijection.put(generator.target.diagram.sourceBoundary.map.get(key), generator.source.diagram.sourceBoundary.map.get(value));
            });

            tempTargetBijection.each(function (key, value) {
                bijection.put(generator.target.diagram.targetBoundary.map.get(key), generator.source.diagram.targetBoundary.map.get(value));
            });
            
            var globularRenaming = new Hashtable();
            var renamingGraph = new Graph();
        
            tempTargetBijection.each(function(key, value) {
            var tempKey = generator.target.diagram.targetBoundary.map.get(key);
            var tempValue = generator.source.diagram.targetBoundary.map.get(value);
            renamingGraph.addNode(tempKey);
            renamingGraph.addNode(tempValue);

            // Edges go both ways, to later be able to determine which elements to add to the new diagram
            renamingGraph.addEdge(tempKey, tempValue);
                if (!renamingGraph.isEdgePresent(tempValue, tempKey)) { // To avoid having a node connected to itself twice
                    renamingGraph.addEdge(tempValue, tempKey);
                }
            }.bind(this));
    
            tempSourceBijection.each(function(key, value) {
            var tempKey = generator.target.diagram.sourceBoundary.map.get(key);
            var tempValue = generator.source.diagram.sourceBoundary.map.get(value);
            renamingGraph.addNode(tempKey);
            renamingGraph.addNode(tempValue);

            // Edges go both ways, to later be able to determine which elements to add to the new diagram
            renamingGraph.addEdge(tempKey, tempValue);
                if (!renamingGraph.isEdgePresent(tempValue, tempKey)) { // To avoid having a node connected to itself twice
                    renamingGraph.addEdge(tempValue, tempKey);
                }
            }.bind(this));
    
            globularRenaming = renamingGraph.connectedComponents();

            bijection = globularRenaming;
            // Renames elements of the signature that is about to be added using the computed bijection
            tempAddedSignature.rename(bijection);
        }
        
        /*
        What we need to do is to put both signatures through the 'sieve' of the computed renaming
        
        This can be exported to a separate function
        */
        
        // (1) First we filter partial orders through the bijection
        
        for (var i = 0; i < generator.source.diagram.partialOrderList.length; i++) {
            partialOrderList.push(generator.source.diagram.partialOrderList[i].copy());
            partialOrderList[i].rename(bijection);
        }

        // Updates partial orders by adding renamed (using the computed bijection) partial orders on the target of the generator
        for (var i = 0; i < generator.target.diagram.partialOrderList.length; i++) {
            var tempPartialOrder = generator.target.diagram.partialOrderList[i].copy();
            // Renames elements in the partial order on the target of the generator according to the computed bijection
            tempPartialOrder.rename(bijection);
            partialOrderList[i].union(tempPartialOrder);
        }

        // Then we filter maps

        generator.source.map.each(function (key, value) {
            map.put(key, value);
        });

        generator.target.map.each(function (key, value) {
            map.put(key, value);
        });

        // Renames elements of the typing function that are present in the bijection
        map.each(function (key, value) {
            if (bijection.get(key) != null) {
                map.remove(key);
                map.put(bijection.get(key), value);
            }
        });

        // Rewires the typing function of the target boundary to take the renaming into account
        targetBoundary.map.each(function(key, value){
            if (bijection.get(value) != null) {
                    var tempValue = bijection.get(value);
                    targetBoundary.map.remove(key);
                    targetBoundary.map.put(key, tempValue);
                }
        });
        
        sourceBoundary.map.each(function(key, value){
            if (bijection.get(value) != null) {
                    var tempValue = bijection.get(value);
                    sourceBoundary.map.remove(key);
                    sourceBoundary.map.put(key, tempValue);
                }
        });
        
        // Then we proceed to the diagram signatures
        var tempDiagramSignature = generator.source.diagram.diagramSignature.copy();

        var diagramSignature = null;
        
        var varSig = tempDiagramSignature;
        while(varSig != null){
            diagramSignature = new Signature(diagramSignature);
            varSig = varSig.sigma;
        }
        
        // Adds all elements of the target of the generator (that are not identified with anything in the source of the generator) to the signature
        var varTempSig = tempDiagramSignature;
        var varSig = diagramSignature;

        while (varTempSig != null) {
            varTempSig.nCells.each(function (key, value) {
                if(value.source != null){ 
                    value.source.map.each(function(key2, value2){
                        if(bijection.get(value2) != null){
                            value.source.map.remove(key2);
                            value.source.map.put(key2, bijection.get(value2));
                        }
                    });
                    value.target.map.each(function(key2, value2){
                        if(bijection.get(value2) != null){
                            value.target.map.remove(key2);
                            value.target.map.put(key2, bijection.get(value2));
                        }
                    });
                }
                if (bijection.get(key) === null) {
                    varSig.addGenerator(value);
                }
                else{
                    if(bijection.get(key) === key){
                        varSig.addGenerator(value);
                    }
                }
            });
            varSig = varSig.sigma;
            varTempSig = varTempSig.sigma;
        }
        
        var varTempSig = tempAddedSignature;
        var varSig = diagramSignature;

        while (varTempSig != null) {
            varTempSig.nCells.each(function (key, value) {
                if(value.source != null){ 
                    value.source.map.each(function(key2, value2){
                        if(bijection.get(value2) != null){
                            value.source.map.remove(key2);
                            value.source.map.put(key2, bijection.get(value2));
                        }
                    });
                    value.target.map.each(function(key2, value2){
                        if(bijection.get(value2) != null){
                            value.target.map.remove(key2);
                            value.target.map.put(key2, bijection.get(value2));
                        }
                    });
                }   
                // We check whether the n-cell got renamed
                if (bijection.get(key) === null) {
                    varSig.addGenerator(value);
                }
                else{
                    if(bijection.get(key) === key && varSig.nCells.get(key) === null){
                        varSig.addGenerator(value);
                    }
                }
            });
            varSig = varSig.sigma;
            varTempSig = varTempSig.sigma;
        }



        /* 
        Lifts the diagram signature one level higher and adds the original generator (as a new data structure with a new ID) to the diagram
        Produces a trivial total ordering on this generator and adds it at the end of the partial order list, that way partial order on k-cells
        will be located in the partial order list at position k
    
        Need to separately deal with partial orders on 0-cells
        */

/*
This section of code deals with name freshness for the subdiagrams of the newly added highest order level generator. 
Elements must be renamed so that a different namespace is used as for the main diagram signature. All maps still point to the
diagram signature, hence their co-domain is not renamed for the purposes of freshness. It is however renamed in the final section
of the code to take into account globularity bijections calculated in the earlier part of the procedure

This code can be made much more tidy - the reason why ordinary renaming cannot be applied here is that we want to rename the maps
in the very specific way, so that they point to their own original diagram signature (which in the meantime became the overall
diagram signature of the new diagram)
*/
        var renaming = new Hashtable();
        var varSig = generator.source.diagram.diagramSignature;
        while(varSig != null){
            varSig.nCells.each(function(key, value){
                renaming.put(key, globular_freshName(varSig.n));
            }.bind(this));
            varSig = varSig.sigma;
        }
        generator.source.diagram.rename(renaming);

        generator.source.map.each(function (key, value) {
        if (renaming.get(key) != null) {
            generator.source.map.remove(key);
            generator.source.map.put(renaming.get(key), key);
            }
        });
        
        // These need to be separated so that we can refer to the updated value in the second condition
        generator.source.map.each(function (key, value) {
        if (bijection.get(value) != null) { // Take into account the bijection on targets
                var tempValue = bijection.get(value);
                generator.source.map.remove(key);
                generator.source.map.put(key, tempValue);
            }
        });
        
        renaming = new Hashtable();
        var varSig = generator.target.diagram.diagramSignature;
        while(varSig != null){
            varSig.nCells.each(function(key, value){
                renaming.put(key, globular_freshName(varSig.n));
            }.bind(this));
            varSig = varSig.sigma;
        }
        generator.target.diagram.rename(renaming);

        generator.target.map.each(function (key, value) {
        if (renaming.get(key) != null) {
                generator.target.map.remove(key);
                generator.target.map.put(renaming.get(key), key);
            }
        });
        
        // These need to be separated so that we can refer to the updated value in the second condition
        generator.target.map.each(function (key, value) {
        if (bijection.get(value) != null) { // Take into account the bijection on targets
                var tempValue = bijection.get(value);
                generator.target.map.remove(key);
                generator.target.map.put(key, tempValue);
            }
        });
        
            
        
        generator = new Generator(generator.source, generator.target, generator.identifier); 
        
        // !!! Reconsider whether this is sound - it violated naming convention at different levels 11th June, 2015!!!
        
        // Adds the element into the partial order on lower level cells
        if(partialOrderList.length >= 1){
            partialOrderList[partialOrderList.length - 1].addElement(generator.identifier);
        }
        
        diagramSignature = new Signature(diagramSignature);
        var generatorTrivialTotralOrder = new PartialOrder();

        diagramSignature.addGenerator(generator);
        generatorTrivialTotralOrder.addElement(generator.identifier) // Total order with a single element
        partialOrderList.push(generatorTrivialTotralOrder);
        map.put(generator.identifier, generatorId);

    }

    /*
        // If we created a diagram of a lower level generator, we need to boost up the diagram signature before we create a diagram object
        while (diagramSignature.n < this.n) {
            // We also boost up the structure of source and target diagrams
            // Copy the partial order list
            var tempPartialOrderListSourceBoundary = new Array();
            var tempPartialOrderListTargetBoundary = new Array();
            for (var i = 0; i < partialOrderList.length; i++) {
                tempPartialOrderListSourceBoundary.push(partialOrderList[i].copy());
                tempPartialOrderListTargetBoundary.push(partialOrderList[i].copy());
            }


            // Necessary to create this copy, as sourceBoundary gets updated before we can use it in updating the targetBoundary
            var tempSourceBoundary = null;
            if (sourceBoundary != null) {
                tempSourceBoundary = sourceBoundary.copy();
            }

            sourceBoundary = new MapDiagram(new Diagram(diagramSignature.copy(), sourceBoundary, targetBoundary, tempPartialOrderListSourceBoundary), map.clone());
            targetBoundary = new MapDiagram(new Diagram(diagramSignature.copy(), tempSourceBoundary, targetBoundary, tempPartialOrderListTargetBoundary), 
            map.clone());

            diagramSignature = new Signature(diagramSignature);
            partialOrderList.push(new PartialOrder());

        }
        */

    var diagram = new Diagram(diagramSignature, sourceBoundary, targetBoundary, partialOrderList);
    var mapDiagram = new MapDiagram(diagram, map);

    var counter = this.n - diagramSignature.n;

    /* 
    We boost the diagram up so that it is of the the appropriate degree. This happens if the generator that we are drawing a diagram of is of a lower level than t
    he overall level of the signature
    */

    // Commented out 29/5/2015 - for the purpose of rendering diagrams
    //while (counter > 0) {
    //    mapDiagram.boost();
    //    counter--;
    //  }

    return mapDiagram;
}

// Renames signature elements using the hashtable provided
Signature.prototype.rename = function (renaming) {
    var varSig = this;
    while (varSig != null) {
        varSig.nCells.each(function (key, value) {
            varSig.nCells.remove(key);

            // If necessary renames the element itself
            if (renaming.get(key) != null) {
                key = renaming.get(key);
                value.identifier = key;
            }

            // Renames all the references made by the element (if there are any)
            if (value.source != null) {
                value.source.map.each(function (subDiagramName, oldGeneralName) {
                    if (renaming.get(oldGeneralName) != null) {
                        value.source.map.remove(subDiagramName);
                        value.source.map.put(subDiagramName, renaming.get(oldGeneralName))
                    }
                });
            }
            if (value.target != null) // In fact if the source is null, then the target must be null as well, and vice versa (value is a 0-cell)
            {
                value.target.map.each(function (subDiagramName, oldGeneralName) {
                    if (renaming.get(oldGeneralName) != null) {
                        value.target.map.remove(subDiagramName);
                        value.target.map.put(subDiagramName, renaming.get(oldGeneralName))
                    }
                });
            }
            varSig.nCells.put(key, value);
        });
        varSig = varSig.sigma;
    }
}

// Returns a deep copy of this signature
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

// Returns a an identity function on this signature
Signature.prototype.identityFunction = function () {
    var identity = new Hashtable();
    var varSig = this;
    while (varSig != null) {
        varSig.nCells.each(function (key, value) {
            identity.put(key, key);
        });
        varSig = varSig.sigma;
    }
    return identity;
}

/* 
Takes a union of two signatures of the same level and returns it, names in sigOne and sigTwo are assumed to be fresh, the renaming tells us what
elements need to be identified - it returns the representative of the connected component that the element is in (CC in the renamingGraph)
*/
Signature.prototype.union = function (sigTwo, renaming) {
    // First we create an empty Signature of an appropriate level
    var sig = new Signature(null);
    while (sig.n < this.n) {
        sig = new Signature(sig);
    }

    // We create a copy of this signature
    var sigOne = this.copy();

    // We add individual elements of sigOne
    var varSig = sig;
    var varSigOne = sigOne;
    while (varSigOne != null) {
        varSigOne.nCells.each(function (key, value) {

            // If the element is identified with something, we need to rename it to see whether it should be added, otherwise, we just add it
            if (renaming.get(key) != null) {

                // We only add the element if another element identified with it has not already been added
                if (!varSig.nCells.containsKey(renaming.get(key))) {
                    key = renaming.get(key);
                    value.identifier = key;

                    // Renames all the references made by the element (if there are any)
                    if (value.source != null) {
                        value.source.map.each(function (subDiagramName, oldGeneralName) {
                            if (renaming.get(oldGeneralName) != null) {
                                value.source.map.remove(subDiagramName);
                                value.source.map.put(subDiagramName, renaming.get(oldGeneralName))
                            }
                        });
                    }
                    // In fact if the source is null, then the target must be null as well, and vice versa (value is a 0-cell)
                    if (value.target != null) {
                        value.target.map.each(function (subDiagramName, oldGeneralName) {
                            if (renaming.get(oldGeneralName) != null) {
                                value.target.map.remove(subDiagramName);
                                value.target.map.put(subDiagramName, renaming.get(oldGeneralName))
                            }
                        });
                    }
                    varSig.addGenerator(value);
                }
            } else {
                // Renames all the references made by the element (if there are any)
                if (value.source != null) {
                    value.source.map.each(function (subDiagramName, oldGeneralName) {
                        if (renaming.get(oldGeneralName) != null) {
                            value.source.map.remove(subDiagramName);
                            value.source.map.put(subDiagramName, renaming.get(oldGeneralName))
                        }
                    });
                }
                // In fact if the source is null, then the target must be null as well, and vice versa (value is a 0-cell)
                if (value.target != null) {
                    value.target.map.each(function (subDiagramName, oldGeneralName) {
                        if (renaming.get(oldGeneralName) != null) {
                            value.target.map.remove(subDiagramName);
                            value.target.map.put(subDiagramName, renaming.get(oldGeneralName))
                        }
                    });
                }
                varSig.addGenerator(value);
            }
        });
        varSigOne = varSigOne.sigma;
        varSig = varSig.sigma;
    }

    // We add individual elements of sigTwo

    varSig = sig;
    var varSigTwo = sigTwo;
    while (varSigTwo != null) {
        varSigTwo.nCells.each(function (key, value) {

            // If the element is identified with something, we need to rename it to see whether it should be added, otherwise, we just add it
            if (renaming.get(key) != null) {

                // We only add the element if another element identified with it has not already been added
                if (!varSig.nCells.containsKey(renaming.get(key))) {
                    key = renaming.get(key);
                    value.identifier = key;

                    // Renames all the references made by the element (if there are any)
                    if (value.source != null) {
                        value.source.map.each(function (subDiagramName, oldGeneralName) {
                            if (renaming.get(oldGeneralName) != null) {
                                value.source.map.remove(subDiagramName);
                                value.source.map.put(subDiagramName, renaming.get(oldGeneralName))
                            }
                        });
                    }
                    // In fact if the source is null, then the target must be null as well, and vice versa (value is a 0-cell)
                    if (value.target != null) {
                        value.target.map.each(function (subDiagramName, oldGeneralName) {
                            if (renaming.get(oldGeneralName) != null) {
                                value.target.map.remove(subDiagramName);
                                value.target.map.put(subDiagramName, renaming.get(oldGeneralName))
                            }
                        });
                    }
                    varSig.addGenerator(value);
                }
            } else { // Renames all the references made by the element (if there are any)
                if (value.source != null) {
                    value.source.map.each(function (subDiagramName, oldGeneralName) {
                        if (renaming.get(oldGeneralName) != null) {
                            value.source.map.remove(subDiagramName);
                            value.source.map.put(subDiagramName, renaming.get(oldGeneralName))
                        }
                    });
                }
                // In fact if the source is null, then the target must be null as well, and vice versa (value is a 0-cell)
                if (value.target != null) {
                    value.target.map.each(function (subDiagramName, oldGeneralName) {
                        if (renaming.get(oldGeneralName) != null) {
                            value.target.map.remove(subDiagramName);
                            value.target.map.put(subDiagramName, renaming.get(oldGeneralName))
                        }
                    });
                }
                varSig.addGenerator(value);
            }
        });
        varSigTwo = varSigTwo.sigma;
        varSig = varSig.sigma;
    }

    return sig;
}

// Takes an integer and returns the number of n-cells
Signature.prototype.getCells = function () {
    var tempArray = new Array();
    var varSig = this;
    while (varSig != null) {
        tempArray.splice(0, 0, varSig.nCells.keys())
        varSig = varSig.sigma;
    }
    return tempArray;
};
