"use strict";

MapDiagram.prototype.rewrite = function(rewriteSource, rewriteTarget) {
    if (this.getDimension() == 2) {
        return this.rewrite_2(rewriteSource, rewriteTarget)
    }
    else {
        return this.rewrite_original(rewriteSource, rewriteTarget);
    }
}

MapDiagram.prototype.dissect = function(chosen_platform) {
    var data = new Array();
    var totalOrder = this.diagram.partialOrderList[this.diagram.partialOrderList.length - 1].getTotalOrder();
    var intermediateBoundary = this.diagram.sourceBoundary.copy();
    var platform_copy = null;
    for (var i = 0; i < totalOrder.length; i++) {

        if (i == chosen_platform) {
            platform_copy = intermediateBoundary.copy();
        }

        var singleCellRewrite = this.diagram.diagramSignature.createMapDiagram(totalOrder[i]);
        var rewriteSource = singleCellRewrite.diagram.sourceBoundary.copy();
        rewriteSource.extend(singleCellRewrite.map);
        var rewriteTarget = singleCellRewrite.diagram.targetBoundary.copy();
        rewriteTarget.extend(singleCellRewrite.map);
        //intermediateBoundary.extend(intermediateBoundary.map);

        var tempMapList = intermediateBoundary.enumerate(rewriteSource);
        var intermediateBoundaryTotalOrder = intermediateBoundary.diagram.partialOrderList[intermediateBoundary.diagram.partialOrderList.length - 1].getTotalOrder();
        /*
        for (var j = 0; j < intermediateBoundaryTotalOrder.length; j++) {
            intermediateBoundaryTotalOrder[i] = intermediateBoundaryTotalOrder.map.get(intermediateBoundaryTotalOrder[i]);
        }
        */
        
        var k = 0;
        if (tempMapList.length > 1) {
            for (k = 0; k < tempMapList.length; k++) {
                if ((tempMapList[k].bubble_bounds[0].preceding == null) && (this.diagram.partialOrderList[0].getElementPredecessors(totalOrder[i]) == 0)) {
                    break;
                }
                else if (intermediateBoundary.map.get(tempMapList[k].bubble_bounds[0].preceding) ===
                    this.diagram.partialOrderList[0].getElementPredecessors(totalOrder[i])[0]) {
                    break;
                }
            }
        }
        if (k == tempMapList.length) {
            alert ("Error in MapDiagram.dissect");
        }

        rewriteSource.map = tempMapList[k];
        
        

        var preceding = rewriteSource.map.bounds[rewriteSource.map.bounds.length - 1].preceding;
        data.push({
            cell: this.map.get(totalOrder[i]),
            position: (preceding == null ? 0 : 1 + intermediateBoundaryTotalOrder.indexOf(preceding))
        });

        intermediateBoundary = intermediateBoundary.rewrite(rewriteSource, rewriteTarget);

    }
    return {
        chosen_platform: platform_copy,
        data: data
    };
}

// Rewriting for a 2-dimensional diagram
MapDiagram.prototype.rewrite_2 = function(rewriteSource, rewriteTarget) {

    var instructions = [];

    // Add instructions for lower part of main diagram
    var totalOrder = this.diagram.partialOrderList[1].getTotalOrder();
    var preceding_vertex = rewriteSource.map.bubble_bounds[1].preceding;
    var lowerBoundLevel = (preceding_vertex == null ? 0 : totalOrder.indexOf(preceding_vertex) + 1);

    // Dissect various diagrams
    var main_dissected = this.dissect(lowerBoundLevel);
    var target_dissected_data = rewriteTarget.dissect().data;

    // Create the instructions for the bottom part of the main diagram
    instructions = main_dissected.data.slice(0, lowerBoundLevel);

    // Modify the target_dissected_data array to correct the cell insertion positions,
    // and add to the instructions
    var preceding_edge = rewriteSource.map.bubble_bounds[0].preceding;
    var platformTotalOrder = main_dissected.chosen_platform.diagram.partialOrderList[0].getTotalOrder();
    for (var i=0; i<platformTotalOrder.length; i++) {
        platformTotalOrder[i] = main_dissected.chosen_platform.map.get(platformTotalOrder[i]);
    }
    var offset;
    if (preceding_edge == null) {
        offset = 0;
    }
    else {
        offset = platformTotalOrder.indexOf(preceding_edge) + 1;
    }
    for (var i = 0; i < target_dissected_data.length; i++) {
        instructions.push({
            cell: target_dissected_data[i].cell,
            position: offset + target_dissected_data[i].position
        });
    }

    // Add the instructions for the top part of the main diagram
    var succeeding_vertex = rewriteSource.map.bounds[1].succeeding;
    var upperBoundLevel = (succeeding_vertex == null ? totalOrder.length : totalOrder.indexOf(succeeding_vertex));
    instructions = instructions.concat(main_dissected.data.slice(upperBoundLevel, main_dissected.data.length));

    // Actually do all the attachments
    var newMapDiagram = this.diagram.sourceBoundary.copy();
    newMapDiagram.extend(this.map);
    newMapDiagram.boost();
    for (var i = 0; i < instructions.length; i++) {

        var id = instructions[i].cell;
        var attachedMapDiagram = gProject.signature.createMapDiagram(id);
        attachedMapDiagram.renameFresh();

        var extendedSource = attachedMapDiagram.diagram.sourceBoundary.copy();
        extendedSource.extend(attachedMapDiagram.map);

        var extendedCurrentTarget = newMapDiagram.diagram.targetBoundary.copy();
        extendedCurrentTarget.extend(newMapDiagram.map);

        var matches = extendedCurrentTarget.enumerate(extendedSource);

        // Attach according to instructions[i]

        var targetTotalOrder = newMapDiagram.diagram.targetBoundary.diagram.partialOrderList[0].getTotalOrder();

        for (var j = 0; j < matches.length; j++) {
            var preceding = matches[j].bubble_bounds[0].preceding;
            var index_of_match = (preceding == null ? 0 : targetTotalOrder.indexOf(preceding) + 1);
            if (index_of_match == instructions[i].position) {
                newMapDiagram = newMapDiagram.attach(attachedMapDiagram, matches[j], ['t'], true);
                break;
            }
        }
    }

    // newMapDiagram is now correct!
    return newMapDiagram;
}

/*
Rewrites a subMapdiagram of this mapDiagram - rewriteSource, to a mapDiagram over the same singature - rewriteTarget
*/
MapDiagram.prototype.rewrite_original = function(rewriteSource, rewriteTarget) {

    // Empty region rewritten to a series of edges
    if (rewriteSource.getDimension() === 1 && rewriteSource.diagram.diagramSignature.k === 0) {
        var cellName = rewriteSource.diagram.diagramSignature.sigma.nCells.keys()[0];
        var cellCopy = new Generator(null, null);
        rewriteSource.diagram.diagramSignature.addGenerator(cellCopy);

        var mainCellName = rewriteSource.map.match.get(cellName);
        var mainCellCopy = new Generator(null, null);

        this.diagram.diagramSignature.addGenerator(mainCellCopy);
        rewriteSource.map.match.put(cellCopy.identifier, mainCellCopy.identifier);
        this.map.put(mainCellCopy.identifier, this.map.get(mainCellName));

        /*
        // We select to manually modify the target diagram of the source of the rewrite
        var tempKey = rewriteSource.diagram.sourceBoundary.map.keys()[0];
        rewriteSource.diagram.sourceBoundary.map.remove(tempKey);
        rewriteSource.diagram.sourceBoundary.map.put(tempKey, cellCopy.identifier);
*/

        // We select to manually modify the target diagram of the source of the rewrite
        var tempKey = rewriteSource.diagram.targetBoundary.map.keys()[0];
        rewriteSource.diagram.targetBoundary.map.remove(tempKey);
        rewriteSource.diagram.targetBoundary.map.put(tempKey, cellCopy.identifier);

        if (this.diagram.targetBoundary.map.containsValue(mainCellName)) {

            // We select to manually modify the target diagram of this
            tempKey = this.diagram.targetBoundary.map.keys()[0];
            this.diagram.targetBoundary.map.remove(tempKey);
            this.diagram.targetBoundary.map.put(tempKey, mainCellCopy.identifier);

        }
        else {
            this.diagram.diagramSignature.nCells.each(function(key, value) {
                value.source.map.each(function(key2, value2) {
                    if (value2 === mainCellName) {
                        value.source.map.remove(key2);
                        value.source.map.put(key2, mainCellCopy.identifier);
                    }
                });
            }.bind(this));
        }
        /*
        if(this.diagram.sourceBoundary.map.containsValue(mainCellName)){
            
            // We select to manually modify the target diagram of this
            tempKey = this.diagram.sourceBoundary.map.keys()[0];
            this.diagram.sourceBoundary.map.remove(tempKey);
            this.diagram.sourceBoundary.map.put(tempKey, mainCellCopy.identifier);
            
        } 
        */
    }


    if (rewriteSource.getDimension() === 2) {
        rewriteSource.diagram.sourceBoundary.diagram.diagramSignature.nCells.each(function(key, value) {
            rewriteSource.diagram.targetBoundary.diagram.diagramSignature.nCells.each(function(key2, value2) {
                /*
                Check whether there is an edge that is in both source and target boundaries of the rewrite, 
                i.e. not connected to an n-cell within the source of the rewrite
                */
                if (rewriteSource.diagram.sourceBoundary.map.get(key) === rewriteSource.diagram.targetBoundary.map.get(key2)) {
                    var sourceEdgeName = rewriteSource.diagram.sourceBoundary.map.get(key);
                    var copiedEdge = rewriteSource.diagram.diagramSignature.sigma.nCells.get(sourceEdgeName);
                    var sourceCopy = copiedEdge.source.copy();
                    var targetCopy = copiedEdge.target.copy();
                    var sourceEdgeCopy = new Generator(sourceCopy, targetCopy);
                    rewriteSource.diagram.diagramSignature.addGenerator(sourceEdgeCopy);
                    rewriteSource.diagram.targetBoundary.map.remove(key2);
                    rewriteSource.diagram.targetBoundary.map.put(key2, sourceEdgeCopy.identifier);

                    // Now need to modify the main mapDiagram itself

                    var mainEdgeName = rewriteSource.map.match.get(sourceEdgeName);
                    var mainEdge = this.diagram.diagramSignature.sigma.nCells.get(mainEdgeName);
                    var sourceCopy = mainEdge.source.copy();
                    var targetCopy = mainEdge.target.copy();

                    var mainEdgeCopy = new Generator(sourceCopy, targetCopy);
                    this.diagram.diagramSignature.addGenerator(mainEdgeCopy);
                    this.diagram.targetBoundary.map.each(function(key3, value3) {
                        if (value3 === mainEdgeName) {
                            this.diagram.targetBoundary.map.remove(key3);
                            this.diagram.targetBoundary.map.put(key3, mainEdgeCopy.identifier);
                        }
                    }.bind(this));

                    this.diagram.diagramSignature.nCells.each(function(key3, value3) {
                        value3.source.map.each(function(key4, value4) {
                            if (value4 === mainEdgeName) {
                                value3.source.map.remove(key4);
                                value3.source.map.put(key4, mainEdgeCopy.identifier);
                            }
                        }.bind(this));
                    }.bind(this));
                    rewriteSource.map.match.put(sourceEdgeCopy.identifier, mainEdgeCopy.identifier);
                    this.map.put(mainEdgeCopy.identifier, this.map.get(mainEdgeName));

                    for (var i = 0; i < this.diagram.partialOrderList.length; i++) {
                        if (this.diagram.partialOrderList[i].isElementPresent(mainEdgeName)) {
                            this.diagram.partialOrderList[i].addElement(mainEdgeCopy.identifier);
                            this.diagram.partialOrderList[i].addPredecessors(mainEdgeCopy.identifier,
                                this.diagram.partialOrderList[i].getElementPredecessors(mainEdgeName));
                            this.diagram.partialOrderList[i].addSuccessors(mainEdgeCopy.identifier,
                                this.diagram.partialOrderList[i].getElementSuccessors(mainEdgeName));
                        }
                    }
                }
            }.bind(this));
        }.bind(this));

        if (rewriteSource.diagram.sourceBoundary.map.get(rewriteSource.diagram.sourceBoundary.diagram.sourceBoundary.map.get(
                rewriteSource.diagram.sourceBoundary.diagram.sourceBoundary.diagram.diagramSignature.nCells.keys()[0])) ===
            rewriteSource.diagram.sourceBoundary.map.get(rewriteSource.diagram.sourceBoundary.diagram.targetBoundary.map.get(
                rewriteSource.diagram.sourceBoundary.diagram.targetBoundary.diagram.diagramSignature.nCells.keys()[0]))
        ) {
            var cellName = rewriteSource.diagram.sourceBoundary.map.get(rewriteSource.diagram.sourceBoundary.diagram.sourceBoundary.map.get(
                rewriteSource.diagram.sourceBoundary.diagram.sourceBoundary.diagram.diagramSignature.nCells.keys()[0]));

            var cellCopy = new Generator(null, null);
            rewriteSource.diagram.diagramSignature.addGenerator(cellCopy);

            var mainCellName = rewriteSource.map.match.get(cellName);
            var mainCellCopy = new Generator(null, null);

            this.diagram.diagramSignature.addGenerator(mainCellCopy);
            rewriteSource.map.match.put(cellCopy.identifier, mainCellCopy.identifier);
            this.map.put(mainCellCopy.identifier, this.map.get(mainCellName));

            /*
                // We select to manually modify the target diagram of the source of the rewrite
                var tempKey = rewriteSource.diagram.sourceBoundary.map.keys()[0];
                rewriteSource.diagram.sourceBoundary.map.remove(tempKey);
                rewriteSource.diagram.sourceBoundary.map.put(tempKey, cellCopy.identifier);
        */

            // We select to manually modify the target diagram of the source of the rewrite
            var tempKey;

            rewriteSource.diagram.targetBoundary.map.each(function(key, value) {
                if (value === cellName) {
                    tempKey = key;
                }
            }.bind(this));

            rewriteSource.diagram.targetBoundary.map.remove(tempKey);
            rewriteSource.diagram.targetBoundary.map.put(tempKey, cellCopy.identifier);

            if (this.diagram.targetBoundary.map.containsValue(mainCellName)) {

                // We select to manually modify the target diagram of this
                //tempKey = this.diagram.targetBoundary.map.keys()[0];

                this.diagram.targetBoundary.map.each(function(key, value) {
                    if (value === mainCellName) {
                        tempKey = key;
                    }
                }.bind(this));

                this.diagram.targetBoundary.map.remove(tempKey);
                this.diagram.targetBoundary.map.put(tempKey, mainCellCopy.identifier);

            }
            else {
                this.diagram.diagramSignature.nCells.each(function(key, value) {
                    value.source.map.each(function(key2, value2) {
                        if (value2 === mainCellName) {
                            value.source.map.remove(key2);
                            value.source.map.put(key2, mainCellCopy.identifier);
                        }
                    });
                }.bind(this));
            }
        }


    }



    if (rewriteSource.diagram.diagramSignature.n === 0 && rewriteTarget.diagram.diagramSignature.n === 0) {
        console.log("rewriting 0-cells");
    }
    else {
        // Compute a bijection between names in source and target diagrams of both rewriteSource and rewriteTarget
        var tempSourceBijection = rewriteSource.diagram.sourceBoundary.mapDiagramBijection(rewriteTarget.diagram.sourceBoundary);
        var tempTargetBijection = rewriteSource.diagram.targetBoundary.mapDiagramBijection(rewriteTarget.diagram.targetBoundary);;

        // Lift the bijection to be between names of elements of this diagram and of the rewriteTarget
        var bijection = new Hashtable();
        var sourceBijection = new Hashtable();
        var targetBijection = new Hashtable();

        var inverseBijection = new Hashtable();
        // These are actually not bijections - change names

        tempSourceBijection.each(function(key, value) {
            bijection.put(rewriteSource.map.match.get(rewriteSource.diagram.sourceBoundary.map.get(key)),
                rewriteTarget.diagram.sourceBoundary.map.get(value));

            inverseBijection.put(rewriteTarget.diagram.sourceBoundary.map.get(value),
                rewriteSource.map.match.get(rewriteSource.diagram.sourceBoundary.map.get(key)));
        });

        tempTargetBijection.each(function(key, value) {
            bijection.put(rewriteSource.map.match.get(rewriteSource.diagram.targetBoundary.map.get(key)),
                rewriteTarget.diagram.targetBoundary.map.get(value));

            inverseBijection.put(rewriteTarget.diagram.targetBoundary.map.get(value),
                rewriteSource.map.match.get(rewriteSource.diagram.targetBoundary.map.get(key)));
        });


        // Prepare the renaming graph

        var renaming = new Hashtable();
        var renamingGraph = new Graph();

        bijection.each(function(key, value) {
            renamingGraph.addNode(key);
            renamingGraph.addNode(value);

            // Edges go both ways, to later be able to determine which elements to add to the new diagram
            renamingGraph.addEdge(key, value);
            if (!renamingGraph.isEdgePresent(value, key)) { // To avoid having a node connected to itself twice
                renamingGraph.addEdge(value, key);
            }
        }.bind(this));

        renaming = renamingGraph.connectedComponents();
        this.diagram.constRenaming = renaming;
        inverseBijection = renaming;

        /*
        This section of code prepares lists of general names of elements of this diagram that are in the source of the rewrite for the purpose of
        updating partial orders, we cannot remove these elements from partial orders just yet, as additional computation of predecessors and successors of the 
        interior of the source of the rewrite is necessary
        */

        // List of partial orders, organised in the same manner as partialOrderList parameter of this diagram
        var interiorElementsRewriteSource = new Array();

        var varSig = this.diagram.diagramSignature;
        while (varSig.n > rewriteSource.diagram.diagramSignature.n) {
            varSig = varSig.sigma;
        }
        while (varSig != null) {
            // k-cells that appear in the interior of rewriteSource
            var kCellInteriorElements = new Array();
            // An element of this is in the interior of rewriteSource if it is an element of rewriteSource and is not an element of any of its boundaries
            varSig.nCells.each(function(key, value) {
                if (rewriteSource.map.match.containsValue(key)) // Boolean function, Element of this is in rewriteSource
                {
                    if (bijection.get(key) === null) // Element of this is not in the boundary of rewriteSource
                    {
                        kCellInteriorElements.push(key);
                    }
                }
            }.bind(this));
            // There is no partial order on 0-cells, so no need to put them into the auxiliary array needed for partial order updates
            // As we go deeper into the signature, by convention we always put partial orders on the first position in the array
            if (varSig.n != 0) {
                interiorElementsRewriteSource.splice(0, 0, kCellInteriorElements);
            }
            varSig = varSig.sigma;
        }

        /* 
        Computes successors and predecessors of the interior of rewriteSource in partial orders, by convention we ensure that these are unique for each partial 
        order. This is because we assume interchangers will be applied before the rewrite to ensure that the property holds
        */
        var interiorElementsPredecessor = new Array();
        var interiorElementsSuccessor = new Array();
        for (var i = 0; i < interiorElementsRewriteSource.length; i++) {
            // var temp = this.partialOrderList[i].getSetPredecessors(interiorElementsRewriteSource[i]);
            interiorElementsPredecessor.push(this.diagram.partialOrderList[i].getSetPredecessors(interiorElementsRewriteSource[i]));
            interiorElementsSuccessor.push(this.diagram.partialOrderList[i].getSetSuccessors(interiorElementsRewriteSource[i]));
        }

        // We traverse the diagram signature once again, this time to safely remove elements from the signature, the typing function and the partial order
        varSig = this.diagram.diagramSignature;
        while (varSig.n > rewriteSource.diagram.diagramSignature.n) {
            varSig = varSig.sigma;
        }

        var transitiveClosures = new Array();

        for (var j = 0; j < varSig.n; j++) {
            transitiveClosures[j] = this.diagram.partialOrderList[j].transitiveClosure();
        }

        /*
        for(var j = 0; j < varSig.n; j++){
            transitiveClosures[j].regainMinimalTransitivity();
        }
        
        */

        while (varSig != null) {
            // An element of this is in the interior of rewriteSource if it is an element of rewriteSource and is not an element of any of its boundaries
            varSig.nCells.each(function(key, value) {
                if (rewriteSource.map.match.containsValue(key)) // Boolean function, Element of this is in rewriteSource
                // Here the element might have a different name withing diagram source, but the map tells us it has name 'key' in the overall diagram
                {
                    if (bijection.get(key) === null) // Element of this is not in the boundary of rewriteSource
                    {
                        // Safe to directly remove, as there are no outside references to this element
                        varSig.remove(key);
                        this.map.remove(key);

                        // Hack to deal with 0-cells - At a later stage make this procedure more elegant
                        if (varSig.n != 0) {
                            // varSig.n is the level of the signature, partial order on n-cells is at position n-1 in the partial order list
                            /* 
                            For the total order we make sure that if there are no n-cells in the rewrite target, then 
                            do not violate having a total order
                            
                            +++ Think more about what this means for partial orders in identity rewrites +++
                            */
                            for (var j = 0; j < (varSig.n - 1); j++) {
                                transitiveClosures[j].removeElement(key);
                            }

                            var tempSuccessors = transitiveClosures[(varSig.n - 1)].getElementSuccessors(key);
                            var tempPredecessors = transitiveClosures[(varSig.n - 1)].getElementPredecessors(key);
                            transitiveClosures[(varSig.n - 1)].removeElement(key);

                            if (rewriteTarget.getDimension() === 2 && rewriteTarget.diagram.diagramSignature.k === 0) {
                                transitiveClosures[(varSig.n - 1)].addPredecessors(tempSuccessors[0], tempPredecessors);
                                transitiveClosures[(varSig.n - 1)].addSuccessors(tempPredecessors[0], tempSuccessors);
                            }
                            if (rewriteTarget.getDimension() === 1 && rewriteTarget.diagram.diagramSignature.k === 0) {
                                transitiveClosures[(varSig.n - 1)].addPredecessors(tempSuccessors[0], tempPredecessors);
                                transitiveClosures[(varSig.n - 1)].addSuccessors(tempPredecessors[0], tempSuccessors);
                            }
                            /*
                            
                            for(var j = 0; j < (varSig.n - 1); j++){
                                this.diagram.partialOrderList[j].removeElement(key);
                            }
                            
                            var tempSuccessors = this.diagram.partialOrderList[(varSig.n - 1)].getElementSuccessors(key);
                            var tempPredecessors = this.diagram.partialOrderList[(varSig.n - 1)].getElementPredecessors(key);
                            this.diagram.partialOrderList[(varSig.n - 1)].removeElement(key);
                            
                            if(rewriteTarget.getDimension() === 2 && rewriteTarget.diagram.diagramSignature.k === 0){
                                this.diagram.partialOrderList[(varSig.n - 1)].addPredecessors(tempSuccessors[0], tempPredecessors);
                                this.diagram.partialOrderList[(varSig.n - 1)].addSuccessors(tempPredecessors[0], tempSuccessors);
                            }
                            if(rewriteTarget.getDimension() === 1 && rewriteTarget.diagram.diagramSignature.k === 0){
                                this.diagram.partialOrderList[(varSig.n - 1)].addPredecessors(tempSuccessors[0], tempPredecessors);
                                this.diagram.partialOrderList[(varSig.n - 1)].addSuccessors(tempPredecessors[0], tempSuccessors);
                            }  */

                        }
                    }
                }
            }.bind(this));
            varSig = varSig.sigma;
        }


        /*
        First we need to put the elements in this diagram through the sieve of the renaming procedure
        */

        // Create building blocks of the rewritten diagram, source and target do not need to be rewritten - ocassionally they do
        var diagramSignature = null;
        var sourceDiagram;
        var targetDiagram;
        var partialOrderList = new Array();
        var map = new Hashtable();

        varSig = this.diagram.diagramSignature;
        while (varSig != null) {
            diagramSignature = new Signature(diagramSignature);
            varSig = varSig.sigma;
        }

        varSig = this.diagram.diagramSignature;
        var varDiagSig = diagramSignature;
        while (varSig != null) {
            varSig.nCells.each(function(key, value) {
                if (value.source != null) {
                    value.source.map.each(function(key2, value2) {
                        if (renaming.get(value2) != null) {
                            value.source.map.remove(key2);
                            value.source.map.put(key2, renaming.get(value2));
                        }
                    }.bind(this));
                    value.target.map.each(function(key2, value2) {
                        if (renaming.get(value2) != null) {
                            value.target.map.remove(key2);
                            value.target.map.put(key2, renaming.get(value2));
                        }
                    }.bind(this));
                }
                if (renaming.get(key) === null || renaming.get(key) === key) {
                    varDiagSig.addGenerator(value);
                    map.put(key, this.map.get(key));
                }
                else {
                    this.diagram.sourceBoundary.map.each(function(key2, value2) {
                        if (value2 === key) { // Implicitly renaming.get(value2) != null
                            this.diagram.sourceBoundary.map.remove(key2);
                            this.diagram.sourceBoundary.map.put(key2, renaming.get(value2));
                        }
                    }.bind(this));
                    this.diagram.targetBoundary.map.each(function(key2, value2) {
                        if (value2 === key) { // Implicitly renaming.get(value2) != null
                            this.diagram.targetBoundary.map.remove(key2);
                            this.diagram.targetBoundary.map.put(key2, renaming.get(value2));
                        }
                    }.bind(this));
                    for (var k = 0; k < transitiveClosures.length; k++) {
                        if (transitiveClosures[k].isElementPresent(key)) {
                            transitiveClosures[k].addSuccessors(renaming.get(key), transitiveClosures[k].getElementSuccessors(key));
                            transitiveClosures[k].addPredecessors(renaming.get(key), transitiveClosures[k].getElementPredecessors(key));
                            transitiveClosures[k].removeElement(key);
                        }
                    }

                    /*
                    for(var k = 0; k < this.diagram.partialOrderList.length; k++){
                        this.diagram.partialOrderList[k].removeElement(key);  
                    */


                }
            }.bind(this));
            varSig = varSig.sigma;
            varDiagSig = varDiagSig.sigma;
        }

        this.diagram.diagramSignature = diagramSignature;
        this.map = map;
        // This needs more attention
        for (var k = 0; k < transitiveClosures.length; k++) {
            transitiveClosures[k].rename(renaming);

            /*
            for(var k = 0; k < this.diagram.partialOrderList.length; k++){
            this.diagram.partialOrderList[k].rename(renaming);  
            */
        }

        /* 
        The next section of code adds all interior elements of the rewriteTarget to this diagram  
        The initial part makes sure that we start adding rewriteTarget elements on the right level of the diagram signature of this diagram
        At the same time we keep track of which elements are in the interior of rewriteTarget to later 
        */

        for (var j = 0; j < transitiveClosures.length; j++) {
            transitiveClosures[j].regainMinimalTransitivity();
        }

        this.diagram.partialOrderList = transitiveClosures;

        varSig = rewriteTarget.diagram.diagramSignature;
        var varSigThis = this.diagram.diagramSignature;
        while (varSigThis.n > varSig.n) {
            varSigThis = varSigThis.sigma;
        }

        var interiorElementsRewriteTarget = new Array();


        while (varSig != null) {
            // k-cells that appear in the interior of rewriteTarget
            var kCellInteriorElements = new Array();

            varSig.nCells.each(function(key, value) {
                // An element is in the interior of the rewriteTarget if it does not appear in the source or the target of rewriteTarget
                // But these are just the elements that do not appear in the computed bijection
                if (!bijection.containsValue(key)) {
                    if (value.source != null) {
                        value.source.map.each(function(key2, value2) {
                            if (inverseBijection.get(value2) != null) {
                                value.source.map.put(key2, inverseBijection.get(value2));
                            }
                        });
                        value.target.map.each(function(key2, value2) {
                            if (inverseBijection.get(value2) != null) {
                                value.target.map.put(key2, inverseBijection.get(value2));
                            }
                        });
                    }
                    varSigThis.addGenerator(value, key);
                    this.map.put(key, rewriteTarget.map.get(key));
                    //Assuming the target of a rewrite is over the same signature

                    // Put the element in the set holding the interior            
                    kCellInteriorElements.push(key);
                }
            }.bind(this));

            if (varSig.n != 0) {
                interiorElementsRewriteTarget.splice(0, 0, kCellInteriorElements);
            }
            varSig = varSig.sigma;
            varSigThis = varSigThis.sigma;
        }


        // Applies the bijection to rename elements in partial orders on the rewriteTarget
        for (var i = 0; i < rewriteTarget.diagram.partialOrderList.length; i++) {
            rewriteTarget.diagram.partialOrderList[i].rename(inverseBijection);
        }

        /*
        We need initial elements of partial orders on the interior of rewriteTarget, to get that we must take suborders of partial orders on the entire 
        rewriteTarget since initial elements can only be calculated for partial orders and not for sets
        */

        // Creates separate partial orders on elements in the interior of rewriteSource
        var partialOrdersRewriteTargetInterior = new Array();
        for (var i = 0; i < interiorElementsRewriteTarget.length; i++) {
            var tempPartialOrder = new PartialOrder();

            // Adds individual interior elements to the newly created partial order
            for (var j = 0; j < interiorElementsRewriteTarget[i].length; j++) {
                tempPartialOrder.addElement(interiorElementsRewriteTarget[i][j]);
            }

            /* 
            Now that all elements are added we add relations, this depends on the fact that the underlying PartialOrder data structure 
            only adds a relation if both elements are already present in the partial order
            */
            for (var j = 0; j < interiorElementsRewriteTarget[i].length; j++) {
                var tempSuccessors = rewriteTarget.diagram.partialOrderList[i].getElementSuccessors(interiorElementsRewriteTarget[i][j]);
                for (var k = 0; k < tempSuccessors.length; k++) {
                    if (!tempPartialOrder.isElementPresent(tempSuccessors[k])) {
                        tempSuccessors.splice(k, 1);
                    }
                }

                tempPartialOrder.addSuccessors(interiorElementsRewriteTarget[i][j], tempSuccessors);

                var tempPredecessors = rewriteTarget.diagram.partialOrderList[i].getElementPredecessors(interiorElementsRewriteTarget[i][j]);
                for (var k = 0; k < tempPredecessors.length; k++) {
                    if (!tempPartialOrder.isElementPresent(tempPredecessors[k])) {
                        tempPredecessors.splice(k, 1);
                    }
                }
                tempPartialOrder.addPredecessors(interiorElementsRewriteTarget[i][j], tempPredecessors);
            }

            partialOrdersRewriteTargetInterior[i] = tempPartialOrder;
        }

        // Adds partial orders on the rewriteTarget to partial orders on this diagram  
        for (var i = 0; i < rewriteTarget.diagram.partialOrderList.length; i++) {
            this.diagram.partialOrderList[i].union(rewriteTarget.diagram.partialOrderList[i]);

            /* 
            Supply the missing relations making the predecessor of the interior of the rewriteSource, 
            a predecessor of all initial elements of the partial order on the interior elements of rewriteTarget
            */
            for (k = i; k < rewriteTarget.diagram.partialOrderList.length; k++) {
                var tempInitialElements = partialOrdersRewriteTargetInterior[k].getInitialElements();

                for (var j = 0; j < tempInitialElements.length; j++) {

                    if (rewriteSource.map.bubble_bounds[i].preceding != null) {
                        this.diagram.partialOrderList[i].addRelation(rewriteSource.map.bubble_bounds[i].preceding, tempInitialElements[j]);
                    }

                    /*
                    if (interiorElementsPredecessor[i] != null) {
                        for (var l = 0; l < interiorElementsPredecessor[i].length; l++) {
                            this.diagram.partialOrderList[i].addRelation(interiorElementsPredecessor[i][l], tempInitialElements[j]);
                        }
                    }
                    */

                }

                /* 
                Supply the missing relations making the successor of the interior of the rewriteSource, 
                a successor of all initial elements of the partial order on the interior elements of rewriteTarget
                */
                var tempTerminalElements = partialOrdersRewriteTargetInterior[k].getTerminalElements();
                for (var j = 0; j < tempTerminalElements.length; j++) {
                    if (rewriteSource.map.bubble_bounds[i].succeeding != null) {
                        this.diagram.partialOrderList[i].addRelation(tempTerminalElements[j], rewriteSource.map.bubble_bounds[i].succeeding);
                    }
                    /*
                    if (interiorElementsSuccessor[i] != null) {
                        for (var l = 0; l < interiorElementsSuccessor[i].length; l++) {
                            this.diagram.partialOrderList[i].addRelation(tempTerminalElements[j], interiorElementsSuccessor[i][l]);
                        }
                    }
                    */
                }
            }
        }
    } // end of the 'else' clause of the condition checking whether this is a rewrite of 0-diagrams

    /*
    This is a special clause to deal with rewriting a 2 diagram into an identity edge
    We remove duplicate edges that are identified through the renaming
    
    if(rewriteTarget.getDimension() === 2 && rewriteTarget.diagram.diagramSignature.k === 0){
        var visited = new Hashtable();
        this.diagram.diagramSignature.sigma.nCells.each(function(key, value){
            if(renaming.get(key) != null){
                if(renaming.get(key) != key){ // We rename all the other elements to the name of this element
                    this.diagram.diagramSignature.nCells.each(function(key2, value2){
                        value2.source.map.each(function(key3, value3){
                            if(value3 === key){
                                value2.source.map.remove(key3);
                                value2.source.map.put(key3, renaming.get(key));
                            }
                        }.bind(this));
                        value2.target.map.each(function(key3, value3){
                            if(value3 === key){
                                value2.target.map.remove(key3);
                                value2.target.map.put(key3, renaming.get(key));
                            } 
                        }.bind(this));
                    }.bind(this));   
                    
                    this.diagram.sourceBoundary.map.each(function(key2, value2){
                        if(value2 === key){
                            this.diagram.sourceBoundary.map.remove(key2);
                            this.diagram.sourceBoundary.map.put(key2, renaming.get(key));
                        }
                    }.bind(this));
                    
                    this.diagram.targetBoundary.map.each(function(key2, value2){
                        if(value2 === key){
                            this.diagram.targetBoundary.map.remove(key2);
                            this.diagram.targetBoundary.map.put(key2, renaming.get(key));
                        }
                    }.bind(this));
                    
                    this.diagram.diagramSignature.sigma.remove(key);
                    
                    // This needs more attention
                    for(var k = 0; k < this.diagram.partialOrderList.length; k++){
                        this.diagram.partialOrderList[k].removeElement(key);   
                    }
                    var tempType = this.map.get(key);
                    this.map.remove(key);
                    this.map.put(renaming.get(key), tempType);
                }
            }
            else{
                visited.put(renaming.get(key), true);
            }
        }.bind(this));
    }
    */

    /*
    This is a special clause to deal with rewrites of 1-diagrams that delete all the edges
    if(rewriteTarget.getDimension() === 1 && rewriteTarget.diagram.diagramSignature.k === 0){
         this.diagram.diagramSignature.sigma.nCells.each(function(key, value){
             if(renaming.get(key) != key){
                this.diagram.diagramSignature.sigma.remove(key);
                this.map.remove(key);
             }
             this.diagram.sourceBoundary.map.each(function(key2, value2){
                 if(renaming.get(value2) != null){
                     this.diagram.sourceBoundary.map.remove(key2);
                     this.diagram.sourceBoundary.map.put(key2, renaming.get(value2));
                 }
             }.bind(this));
             this.diagram.targetBoundary.map.each(function(key2, value2){
                 if(renaming.get(value2) != null){
                     this.diagram.targetBoundary.map.remove(key2);
                     this.diagram.targetBoundary.map.put(key2, renaming.get(value2));
                 }
             }.bind(this));
         }.bind(this));       
    }
*/
    // This is to be reimplemented, so that we do not destroy the exising copy of the diagram that is to be rewritten
    var mapDiag = this.copy();
    mapDiag.diagram.constRenaming = this.diagram.constRenaming;
    return mapDiag;
}
