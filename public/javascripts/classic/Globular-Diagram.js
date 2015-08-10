"use strict";

/*
Diagram class

- p: [Graph]
*/

function Diagram(diagramSignature, sourceBoundary, targetBoundary, partialOrderList) {
    this.diagramSignature = diagramSignature; // Signature
    this.sourceBoundary = sourceBoundary; // Diagram
    this.targetBoundary = targetBoundary; // Diagram
    this.partialOrderList = partialOrderList; //ordering on elements in the form of a collection of DAGs
    /*
    There is no partial order for 0-cells, partial order on 1-cells is stored at position 0 in the array and then similarly
    the partial order on k-cells is stored at the position k-1, for n-cells this is the final position in the list
    */
        this.constRenaming = new Hashtable();

};

Diagram.prototype.getType = function() {
    return 'Diagram';
}

Diagram.prototype.getDimension = function() {
    return this.diagramSignature.n;
}



/*
Rewrites a subdiagram of this diagram - rewriteSource, to a diagram over the same singature - rewriteTarget
*/
Diagram.prototype.rewrite = function(map, rewriteSource, rewriteTarget) {
    // Create building blocks of the rewritten diagram, source and target do not need to be rewritten - to discuss
    /*   var diagramSignature = this.diagramSignature.copy();
    var sourceDiagram;
    var targetDiagram;
    var partialOrderList = new Array();


    for (var i = 0; i < this.partialOrderList.length; i++) {
        partialOrderList.push(this.partialOrderList[i].copy());
    }
*/
    // If this is a rewrite between 0-cells, this deals with this case separately
    if (rewriteSource.diagram.diagramSignature.n === 0 && rewriteTarget.diagram.diagramSignature.n === 0) {
        console.log("rewriting 0-cells");
    }
    else {
        // Compute a bijection between names in source and target diagrams of both rewriteSource and rewriteTarget
        var tempSourceBijection = rewriteSource.diagram.sourceBoundary.mapDiagramBijection(rewriteTarget.diagram.sourceBoundary);
        var tempTargetBijection = rewriteSource.diagram.targetBoundary.mapDiagramBijection(rewriteTarget.diagram.targetBoundary);;

        // Lift the bijection to be between names of elements of this diagram and of the rewriteTarget
        var bijection = new Hashtable();

        tempSourceBijection.each(function(key, value) {
            bijection.put(rewriteSource.map.match.get(rewriteSource.diagram.sourceBoundary.map.get(key)),
                rewriteTarget.diagram.sourceBoundary.map.get(value));
        });

        tempTargetBijection.each(function(key, value) {
            bijection.put(rewriteSource.map.match.get(rewriteSource.diagram.targetBoundary.map.get(key)),
                rewriteTarget.diagram.targetBoundary.map.get(value));
        });

        /*
        This section of code prepares lists of general names of elements of this diagram that are in the source of the rewrite for the purpose of
        updating partial orders, we cannot remove these elements from partial orders just yet, as additional computation of predecessors and successors of the 
        interior of the source of the rewrite is necessary
        */

        // List of partial orders, organised in the same manner as partialOrderList parameter of this diagram
        var interiorElementsRewriteSource = new Array();

        var varSig = this.diagramSignature;
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
            interiorElementsPredecessor.push(this.partialOrderList[i].getSetPredecessors(interiorElementsRewriteSource[i]));
            interiorElementsSuccessor.push(this.partialOrderList[i].getSetSuccessors(interiorElementsRewriteSource[i]));
        }

        // We traverse the diagram signature once again, this time to safely remove elements from the signature, the typing function and the partial order
        varSig = this.diagramSignature;
        while (varSig.n > rewriteSource.diagram.diagramSignature.n) {
            varSig = varSig.sigma;
        }
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
                        map.remove(key);

                        // Hack to deal with 0-cells - At a later stage make this procedure more elegant
                        if (varSig.n != 0) {
                            // varSig.n is the level of the signature, partial order on n-cells is at position n-1 in the partial order list
                            this.partialOrderList[(varSig.n - 1)].removeElement(key);
                        }
                    }
                }
            }.bind(this));
            varSig = varSig.sigma;
        }

        /* 
        The next section of code adds all interior elements of the rewriteTarget to this diagram  
        The initial part makes sure that we start adding rewriteTarget elements on the right level of the diagram signature of this diagram
        At the same time we keep track of which elements are in the interior of rewriteTarget to later 
        */
        varSig = rewriteTarget.diagram.diagramSignature;
        var varSigThis = this.diagramSignature;
        while (varSigThis.n > varSig.n) {
            varSigThis = varSigThis.sigma;
        }

        var interiorElementsRewriteTarget = new Array();

        var inverseBijection = new Hashtable();
        bijection.each(function(key, value) {
            inverseBijection.put(value, key);
        });

        while (varSig != null) {
            // k-cells that appear in the interior of rewriteTarget
            var kCellInteriorElements = new Array();

            varSig.nCells.each(function(key, value) {
                // An element is in the interior of the rewriteTarget if it does not appear in the source or the target of rewriteTarget
                // But these are just the elements that do not appear in the computed bijection
                if (!bijection.containsValue(key)) { // This is because names in the rewrite target are the anti-domain of this bijection
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
                    map.put(key, rewriteTarget.map.get(key));
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
                tempPartialOrder.addSuccessors(interiorElementsRewriteTarget[i][j],
                    rewriteTarget.diagram.partialOrderList[i].getElementSuccessors(interiorElementsRewriteTarget[i][j]));
                tempPartialOrder.addPredecessors(interiorElementsRewriteTarget[i][j],
                    rewriteTarget.diagram.partialOrderList[i].getElementPredecessors(interiorElementsRewriteTarget[i][j]));
            }

            partialOrdersRewriteTargetInterior[i] = tempPartialOrder;
        }

        // Adds partial orders on the rewriteTarget to partial orders on this diagram  
        for (var i = 0; i < rewriteTarget.diagram.partialOrderList.length; i++) {
            this.partialOrderList[i].union(rewriteTarget.diagram.partialOrderList[i]);

            /* 
            Supply the missing relations making the predecessor of the interior of the rewriteSource, 
            a predecessor of all initial elements of the partial order on the interior elements of rewriteTarget
            */
            var tempInitialElements = partialOrdersRewriteTargetInterior[i].getInitialElements();
            for (var j = 0; j < tempInitialElements.length; j++) {
                if (interiorElementsPredecessor[i] != null) {
                    for (var l = 0; l < interiorElementsPredecessor[i].length; l++) {
                        this.partialOrderList[i].addRelation(interiorElementsPredecessor[i][l], tempInitialElements[j]);
                    }
                }
            }

            /* 
            Supply the missing relations making the successor of the interior of the rewriteSource, 
            a successor of all initial elements of the partial order on the interior elements of rewriteTarget
            */
            var tempTerminalElements = partialOrdersRewriteTargetInterior[i].getTerminalElements();
            for (var j = 0; j < tempTerminalElements.length; j++) {
                if (interiorElementsSuccessor[i] != null) {
                    for (var l = 0; l < interiorElementsSuccessor[i].length; l++) {
                        this.partialOrderList[i].addRelation(tempTerminalElements[j], interiorElementsSuccessor[i][l]);
                    }
                }
            }
        }
    } // end of the 'else' clause of the condition checking whether this is a rewrite of 0-diagrams

    // This is to be reimplemented, so that we do not destroy the exising copy of the diagram that is to be rewritten
    var diagCopy = this.copy();
    var mapDiag = new MapDiagram(diagCopy, map);
    return mapDiag;
}


// Given an element of a boundary, computes its most general name in the diagram
Diagram.prototype.elementGeneralName = function(elementId, boundaryPath) { // boundaryPath is an array
    var tempBoundaryPath = new Array();
    for (var i = 0; i < boundaryPath.length; i++) {
        tempBoundaryPath.push(boundaryPath[i]);
    }

    // Find the boundary
    if (tempBoundaryPath.length != 0) {
        // We take the first step separately, since we call the function for a diagram, not for a full MapDiagram
        var mapDiagramBoundary;
        if (tempBoundaryPath[0] === 's') {
            mapDiagramBoundary = this.sourceBoundary;
        }
        else {
            mapDiagramBoundary = this.targetBoundary;
        }
        for (var i = 1; i < tempBoundaryPath.length; i++) {
            if (tempBoundaryPath[i] === 's') {
                mapDiagramBoundary = mapDiagramBoundary.diagram.sourceBoundary;
            }
            else {
                mapDiagramBoundary = mapDiagramBoundary.diagram.targetBoundary;
            }
        }
        // Make the boundary path one step shorter
        tempBoundaryPath.pop();
        return this.elementGeneralName(mapDiagramBoundary.map.get(elementId), tempBoundaryPath);
    }
    return elementId;
}


Diagram.prototype.rename = function(renaming) {

    // Renames the diagram signature
    this.diagramSignature.rename(renaming);

    // Applies the renaming to the partial order
    for (var i = 0; i < this.partialOrderList.length; i++) {
        this.partialOrderList[i].rename(renaming);
    }

    // Applies renaming to inclusions of the boundary diagrams into this
    if (this.sourceBoundary != null) {
        this.sourceBoundary.map.each(function(key, value) {
            if (renaming.get(value) != null) {
                this.sourceBoundary.map.remove(key);
                this.sourceBoundary.map.put(key, renaming.get(value));
            }
        }.bind(this));

        this.targetBoundary.map.each(function(key, value) {
            if (renaming.get(value) != null) {
                this.targetBoundary.map.remove(key);
                this.targetBoundary.map.put(key, renaming.get(value));
            }
        }.bind(this));
    }
}


// Produces a copy of this
Diagram.prototype.copy = function() {

    var diagramSignature = this.diagramSignature.copy();
    var sourceBoundary;
    if (this.sourceBoundary === null) {
        sourceBoundary = null;
    }
    else {
        sourceBoundary = this.sourceBoundary.copy();
    }
    var targetBoundary;
    if (this.targetBoundary === null) {
        targetBoundary = null;
    }
    else {
        targetBoundary = this.targetBoundary.copy();
    }
    var partialOrderList = new Array();
    for (var i = 0; i < this.partialOrderList.length; i++) {
        partialOrderList.push(this.partialOrderList[i].copy());
    }

    var diagram = new Diagram(diagramSignature, sourceBoundary, targetBoundary, partialOrderList);
    return diagram;
}




/*
Prints out a picture of a 2D diagram (for now)
For each edge we store: x-coordinate, y start coordinate, y end coordinate
For each node we store: x-start coordinate, x end coordinate, y coordinate
*/

Diagram.prototype.render = function(container) {
    var canvas = document.createElement('canvas');
    container.appendChild(canvas);
}


/*
Computes data necessary for rendering 3D pictures of 3-Diagrams
*/

Diagram.prototype.print3D = function(types) {

    // Each holds 5 coordinates
    var ThreeDLayoutEdges = new Hashtable();
    var ThreeDLayoutVertices = new Hashtable();
    var ThreeDLayoutRegions = new Hashtable();

    // Computes a hashtable such that for each edge, it stores the maximum distance from this edge to an initial element in the partial order
    var xCoordinateEdges = new Hashtable();
    var yStartCoordinateEdges = new Hashtable();
    var yEndCoordinateEdges = new Hashtable();
    var zStartCoordinateEdges = new Hashtable();
    var zEndCoordinateEdges = new Hashtable();

    var zCoordinateSheets = new Hashtable();
    var xStartCoordinateSheets = new Hashtable();
    var xEndCoordinateSheets = new Hashtable();
    var yStartCoordinateSheets = new Hashtable();
    var yEndCoordinateSheets = new Hashtable();

    var yCoordinateVertices = new Hashtable();
    var xStartCoordinateVertices = new Hashtable();
    var xEndCoordinateVertices = new Hashtable();
    var zStartCoordinateVertices = new Hashtable();
    var zEndCoordinateVertices = new Hashtable();

    // Assume this is a 3-Diagram

    var orderOnVertices = this.partialOrderList[2].getTotalOrder();

    for (var i = 0; i < orderOnVertices.length; i++) {
        yCoordinateVertices.put(orderOnVertices[i], i + 1);
    }
    xCoordinateEdges = this.partialOrderList[1].longestPath();
    zCoordinateSheets = this.partialOrderList[0].longestPath();

    // Puts default start/end coordinates for edges
    this.diagramSignature.sigma.nCells.each(function(key, value) {
        yEndCoordinateEdges.put(key, orderOnVertices.length + 1);
        yStartCoordinateEdges.put(key, 0);
    });

    // Pad edges by one unit to facilitate creation of the grid

    xCoordinateEdges.each(function(key, value) {
        value++;
        xCoordinateEdges.put(key, value);
    });

    // Calculates the maximum x-coordinate needed
    var tempMaxXCoordinate = -1;
    xCoordinateEdges.each(function(key, value) {
        if (value > tempMaxXCoordinate) {
            tempMaxXCoordinate = value;
        }
    });

    // Preprocessing completed

    // Calculates y-coordinates for edges and x-coordinates for vertices
    this.diagramSignature.nCells.each(function(key, value) {
        var min = 100;
        var max = -1;

        // For every outgoing edge we find out its x coordinate and find the maximum and minimum of those
        value.source.diagram.diagramSignature.nCells.each(function(key2, value2) {
            if (xCoordinateEdges.get(value.source.map.get(key2)) < min) {
                min = xCoordinateEdges.get(value.source.map.get(key2));
            }
            if (xCoordinateEdges.get(value.source.map.get(key2)) > max) {
                max = xCoordinateEdges.get(value.source.map.get(key2));
            }
            // Set the end coordinate of the given edge (as it is in the source of this vertex)
            yEndCoordinateEdges.put(value.source.map.get(key2), yCoordinateVertices.get(key));
        });
        // Similarly for all incoming edges, we find the overall maximum and minimum
        value.target.diagram.diagramSignature.nCells.each(function(key2, value2) {
            if (xCoordinateEdges.get(value.target.map.get(key2)) < min) {
                min = xCoordinateEdges.get(value.target.map.get(key2));
            }
            if (xCoordinateEdges.get(value.target.map.get(key2)) > max) {
                max = xCoordinateEdges.get(value.target.map.get(key2));
            }
            // Set the start coordinate of the given edge (as it is in the target of this vertex)
            yStartCoordinateEdges.put(value.target.map.get(key2), yCoordinateVertices.get(key));
        });
        xStartCoordinateVertices.put(key, min);
        xEndCoordinateVertices.put(key, max);
    });


    // Calculates z-coordinates for edges
    this.diagramSignature.sigma.nCells.each(function(key, value) {
        var min = 100;
        var max = -1;
        // For every outgoing sheet we find out its z coordinate and find the maximum and minimum of those
        value.source.diagram.diagramSignature.nCells.each(function(key2, value2) {
            if (zCoordinateSheets.get(value.source.map.get(key2)) < min) {
                min = zCoordinateSheets.get(value.source.map.get(key2));
            }
            if (zCoordinateSheets.get(value.source.map.get(key2)) > max) {
                max = zCoordinateSheets.get(value.source.map.get(key2));
            }
        });
        // Similarly for all incoming sheets, we find the overall maximum and minimum
        value.target.diagram.diagramSignature.nCells.each(function(key2, value2) {
            if (zCoordinateSheets.get(value.target.map.get(key2)) < min) {
                min = zCoordinateSheets.get(value.target.map.get(key2));
            }
            if (zCoordinateSheets.get(value.target.map.get(key2)) > max) {
                max = zCoordinateSheets.get(value.target.map.get(key2));
            }
        });
        zStartCoordinateEdges.put(key, min);
        zEndCoordinateEdges.put(key, max);
    });

    // Calculates z-coordinates for vertices
    this.diagramSignature.nCells.each(function(key, value) {
        var min = 100;
        var max = -1;
        // For every outgoibng edge we find out its z start and end coordinate and find the maximum and minimum of those
        value.source.diagram.diagramSignature.nCells.each(function(key2, value2) {
            if (zStartCoordinateEdges.get(value.source.map.get(key2)) < min) {
                min = zStartCoordinateEdges.get(value.source.map.get(key2));
            }
            if (zEndCoordinateEdges.get(value.source.map.get(key2)) > max) {
                max = zEndCoordinateEdges.get(value.source.map.get(key2));
            }
        });
        // Similarly for all incoming edges, we find the overall maximum and minimum
        value.target.diagram.diagramSignature.nCells.each(function(key2, value2) {
            if (zStartCoordinateEdges.get(value.target.map.get(key2)) < min) {
                min = zStartCoordinateEdges.get(value.target.map.get(key2));
            }
            if (zEndCoordinateEdges.get(value.target.map.get(key2)) > max) {
                max = zEndCoordinateEdges.get(value.target.map.get(key2));
            }
        });
        zStartCoordinateVertices.put(key, min);
        zEndCoordinateVertices.put(key, max);
    });


    // Determine which grid squares correspond to which 0-cells, this association is kept track of in the hashtable ThreeDLayoutRegions

    // First, necessary to calculate the boundaries of the grid, this is done by considering maximum x, y coordinates of edges
    // For each z coordinate we simply assume the largest size of the grid possible
    var maxY = -1;
    var maxX = -1;

    this.diagramSignature.sigma.nCells.each(function(key, value) {
        if (xCoordinateEdges.get(key) > maxX) {
            maxX = xCoordinateEdges.get(key);
        }
        if (yEndCoordinateEdges.get(key) > maxY) {
            maxY = yEndCoordinateEdges.get(key);
        }
    });

    maxX++; // Pad an additional unit of space on the right hand side

    var maxZ = -1;

    this.diagramSignature.sigma.sigma.nCells.each(function(key, value) {
        if (zCoordinateSheets.get(key) > maxZ) {
            maxZ = zCoordinateSheets.get(key);
        }
    });

    maxZ++; // Pad an additional unit of space (depth)

    var tempGridLayout = new Hashtable();
    for (var k = 0; k < maxZ; k++) {
        for (var i = 0; i < maxY; i++) {
            for (var j = 0; j < maxX; j++) {
                var tempTwoCellSource = null;
                var tempTwoCellTarget = null;

                this.diagramSignature.sigma.nCells.each(function(key, value) {
                    if (yStartCoordinateEdges.get(key) <= i && i < yEndCoordinateEdges.get(key) &&
                        zStartCoordinateEdges.get(key) <= k && k <= zEndCoordinateEdges.get(key) &&
                        j >= xCoordinateEdges.get(key)) {
                        if (tempTwoCellTarget === null) {
                            tempTwoCellTarget = key
                        }
                        else if (xCoordinateEdges.get(key) > xCoordinateEdges.get(tempOneCellTarget)) {
                            tempTwoCellTarget = key;
                        }
                    }
                    else if (yStartCoordinateEdges.get(key) <= i && i < yEndCoordinateEdges.get(key) &&
                        zStartCoordinateEdges.get(key) <= k && k <= zEndCoordinateEdges.get(key) &&
                        j < xCoordinateEdges.get(key)) {
                        if (tempTwoCellSource === null) {
                            tempTwoCellSource = key
                        }
                        else if (xCoordinateEdges.get(key) < xCoordinateEdges.get(tempOneCellSource)) {
                            tempTwoCellSource = key;
                        }
                    }
                });

                var tempOneCel = null;
                if (tempTwoCellSource === null) {
                    this.diagramSignature.sigma.nCells.get(tempTwoCellTarget).target.diagram.diagramSignature.nCells.each(function(key, value) {
                        if (zCoordinateSheets.get(
                                types.get(
                                    this.diagramSignature.sigma.nCells.get(
                                        tempTwoCellTarget).target.map.get(key))) === k) {

                            tempOneCel = types.get(this.diagramSignature.sigma.nCells.get(tempTwoCellTarget).target.map.get(key));
                        }
                    }.bind(this));
                }
                else {
                    this.diagramSignature.sigma.nCells.get(tempTwoCellSource).source.diagram.diagramSignature.nCells.each(function(key, value) {
                        if (zCoordinateSheets.get(
                                types.get(
                                    this.diagramSignature.sigma.nCells.get(
                                        tempTwoCellSource).source.map.get(key))) === k) {

                            tempOneCel = types.get(this.diagramSignature.sigma.nCells.get(tempTwoCellSource).source.map.get(key));
                        }
                    }.bind(this));

                }

                // There is a one cell associated with the currently considered grid square
                if (tempOneCel != null) {
                    var tempGridElements = ThreeDLayoutRegions.get(tempOneCel);

                    if (tempGridElements === null) {
                        tempGridElements = new Array();
                    }
                    tempGridElements.push([j, i, k]);

                    ThreeDLayoutRegions.put(tempOneCel, tempGridElements);
                }
            }
        }
    }

    // Putting the data for edges and vertices in one place
    this.diagramSignature.nCells.each(function(key, value) {
        ThreeDLayoutVertices.put(key, [xStartCoordinateVertices.get(key), xEndCoordinateVertices.get(key),
            yCoordinateVertices.get(key),
            zStartCoordinateVertices.get(key), zEndCoordinateVertices.get(key)
        ]);
    });
    this.diagramSignature.sigma.nCells.each(function(key, value) {
        ThreeDLayoutEdges.put(key, [xCoordinateEdges.get(key),
            yStartCoordinateEdges.get(key), yEndCoordinateEdges.get(key),
            zStartCoordinateEdges.get(key), zEndCoordinateEdges.get(key)
        ]);
    });

    console.log(JSON.stringify([ThreeDLayoutRegions, ThreeDLayoutEdges, ThreeDLayoutVertices]));

    return JSON.stringify([ThreeDLayoutRegions, ThreeDLayoutEdges, ThreeDLayoutVertices]);
    /* 
    At this stage:
        - for 3D graphics, hashtables with x-, y-, z- coordinates for vertices, edges and sheets contain all the necessary information to print a 3-diagram
        
    All there is to be done to print 3D pictures of 3-diagrams is to use a suitable graphical engine
    */
}

Diagram.prototype.render = function() {
    this.print2D();
}