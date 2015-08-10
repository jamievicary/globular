"use strict";

/*
    MapDiagram Class
*/

function MapDiagram(diagram, map) {
    if (diagram === undefined) return; // We're destringifying
    this.diagram = diagram;
    this.map = map;
    // Hack for globularity
};

/*
    Extend a MapDiagram valued over S, by a function S-->T, to obtain
    a MapDiagram valued over T
*/
MapDiagram.prototype.extend = function(map) {
    var newMap = new Hashtable();
    var oldMap = this.map;
    this.map.each(function(name) {
        newMap.put(name, map.get(oldMap.get(name)));
    });
    this.map = newMap;
}

MapDiagram.prototype.getType = function() {
    return 'MapDiagram';
}

MapDiagram.prototype.getDimension = function() {
    return this.diagram.getDimension();
}



// Provides a bijection between sets of cells of two diagrams that are promised to be the same
MapDiagram.prototype.mapDiagramBijection = function(mapDiagram) {
    // Uses an auxilliary function that takes two arguments - at a later stage this coding solution can be made more elegant
    var bijection = this.nCellBijection(this, mapDiagram);

    /* 12th June 2015 - commented out to deal with name freshness
        // Check that this bijection respects types 
        var keys = bijection.keys();
        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            if (this.map.get(key) != mapDiagram.map.get(bijection.get(key))) {
                return false;
            }
        }
        */

    // Checks whether the bijection respects partial orders on k-cells for each k
    for (var i = 0; i < this.diagram.partialOrderList.length; i++) {
        // Iterates over all pairs of directly related elements in the partial orders on this    
        this.diagram.partialOrderList[i].graph.nodes.each(function(key, value) {
            for (var i = 0; i < value.length; i++) {
                // If there exists even a single pair of elements directly related in the partial order on this diagram that is not directly related 
                // in the partial order on the other diagram after applying the bijection, then the bijection does not preserve partial orders
                if (!mapDiagram.diagram.partialOrderList[i].areRelatedTransitive(bijection.get(key), bijection.get(value[i]))) {
                    return false;
                }
            }
        });

        /* 
        To get an iff relation now we need to check whether all elements directly related in the partial order on the other diagram 
        are directly related in the partial order on this diagram after application of the inverse of the computed bijection
        */
        mapDiagram.diagram.partialOrderList[i].graph.nodes.each(function(key, value) {
            for (var i = 0; i < value.length; i++) {
                /* 
                The following loop searches for names of key and value[i] after application of the inverse of the computed bijection,
                Since we don't have the inverse of the bijection computed explicite, we must do this calculation by hand
                */
                var tempKey;
                var tempValue;
                this.diagram.partialOrderList[i].graph.nodes.each(function(key2, value2) {
                    if (bijection.get(key2) === key) {
                        tempKey = key2;
                        for (var j = 0; j < value2.length; j++) {
                            if (bijection.get(value2[j]) === value[i]) {
                                tempValue = value2[i];
                            }
                        }
                    }
                });

                // If there is even a single pair of elements for which the inverse of the bijection does not preserve partial orders, the diagrams do not match
                if (!this.diagram.partialOrderList[i].areRelatedTransitive(tempKey, tempValue))
                    return false;
            }
        }.bind(this));
    }
    // If the check of preserving partial orders is successful, returns the computed bijection
    return bijection;
}

/* 
Auxilliary function that for two diagrams that are promised to be the same finds a bijection, but does not check consistency with partial orders
Reconsider whether this should be placed somewhere in a neutral place outside of this class
*/
MapDiagram.prototype.nCellBijection = function(mapDiagram1, mapDiagram2) {
    var tempBijection = new Hashtable();

    var varSig1 = mapDiagram1.diagram.diagramSignature;
    var varSig2 = mapDiagram2.diagram.diagramSignature;
    while (varSig1.k === 0) {
        if (varSig1.k != varSig2.k) {
            return false;
        }
        else {
            varSig1 = varSig1.sigma;
            varSig2 = varSig2.sigma;
        }
    }

    if (varSig1.sigma === null) { // both diagrams are just trivial diagrams of regions and we reached the end of the recursion
        // There is only one region in each diagram, hence we simply add it to the bijection
        tempBijection.put(varSig1.nCells.keys()[0], varSig2.nCells.keys()[0]);
    } // 
    else { // (diagram1.diagramSignature.sigma != null) // Otherwise we reached the end of recursion
        // Takes the final element in the list of partial orders, this is the total order on names of n-Cells

        var nCellTotalOrderD1 = mapDiagram1.diagram.partialOrderList[varSig1.n - 1].getTotalOrder();
        var nCellTotalOrderD2 = mapDiagram2.diagram.partialOrderList[varSig2.n - 1].getTotalOrder();

        // n-Cells in the total order are added to the bijection
        for (var i = 0; i < nCellTotalOrderD1.length; i++) {
            tempBijection.put(nCellTotalOrderD1[i], nCellTotalOrderD2[i])
        }

        /* 
        We look at each generator in the order given by the total ordering and 
        we recursively call the bijection procedure on its source and its target diagrams
        */
        for (var i = 0; i < nCellTotalOrderD1.length; i++) {
            // Recursive calls that return bijections for the source and the target of generators subsequent in the total order
            var tempBijectionSources = this.nCellBijection(varSig1.nCells.get(nCellTotalOrderD1[i]).source,
                varSig2.nCells.get(nCellTotalOrderD2[i]).source);
            var tempBijectionTargets = this.nCellBijection(varSig1.nCells.get(nCellTotalOrderD1[i]).target,
                varSig2.nCells.get(nCellTotalOrderD2[i]).target);

            // Chases names of elements from what they are in subdiagrams, to what they are at this level       
            tempBijectionSources.each(function(key, value) {
                tempBijection.put(varSig1.nCells.get(nCellTotalOrderD1[i]).source.map.get(key),
                    varSig2.nCells.get(nCellTotalOrderD2[i]).source.map.get(value));
            });
            tempBijectionTargets.each(function(key, value) {
                tempBijection.put(varSig1.nCells.get(nCellTotalOrderD1[i]).target.map.get(key),
                    varSig2.nCells.get(nCellTotalOrderD2[i]).target.map.get(value));
            });
        }
    }
    return tempBijection;
};


/*
Wrapper method to clean up the non-graphical user interface, introduction of a recursion flag allows us to avoid an exponential number of recursive calls
Inclusion map is an inclusion of the appropriate boundary of the attached map diagram (as indicated by the boundary boolean) into
an appropriate boundary of this map diagram (again, as indicated by the boundary boolean)
*/
MapDiagram.prototype.attachWrapped = function(attachedMapDiagram, inclusionMap, boundaryPath) {
    // var boundaryPath = new Array();
    while (attachedMapDiagram.getDimension() < this.getDimension()) {
        attachedMapDiagram.boost();
        //boundaryPath.push('s');
    }
    //boundaryPath.push(boundaryBoolean);
    return this.attach(attachedMapDiagram, inclusionMap, boundaryPath, true);
}

/*
This procedure returns a list of matches of a diagram delta' in this diagram
*/
MapDiagram.prototype.enumerate = function(matchedDiagram) {
    var matches = new Array();

    /* 
    The condition to end recursion - match two 0-diagrams. By convention each consists of just a single 0-cell (alfa and beta), so all we can do
    is to compare the types of these two 0-cells. If they are the same, we record the match, otherwise, we do nothing
    */
    if (this.diagram.diagramSignature.n === 0) {
        var zeroDiagramMap = new Hashtable();
        var alfa = matchedDiagram.diagram.diagramSignature.nCells.keys()[0]; // guaranteed to be a 1 object array by convention
        var beta = this.diagram.diagramSignature.nCells.keys()[0]; // guaranteed to be a 1 object array by convention
        if (matchedDiagram.map.get(alfa) === this.map.get(beta)) {
            zeroDiagramMap.put(alfa, beta);
            return [{
                match: zeroDiagramMap,
                bounds: [],
                bubble_bounds: []
            }];
        }
        else {
            return [];
        }
    }

    // This is the base platform for finding each match, it will be rewritten once the matches beginning at the particular height are investigated
    var intermediateBoundary = this.diagram.sourceBoundary.copy();

    // The maximum number of matches that can possibly be found
    var loopCount = this.diagram.diagramSignature.k - matchedDiagram.diagram.diagramSignature.k + 1;

    /* 
    Total orders on nCells used in deterimining how to match n-cells of this MapDiagram and the matched mapDiagram
    Also, to be used in determining how to rewrite the boundary (what n-cell to pick to the base platform of a match)
    */
    var nCellsMatchedDiagramTotalOrder = matchedDiagram.diagram.partialOrderList[matchedDiagram.diagram.diagramSignature.n - 1].getTotalOrder();
    var nCellsTotalOrder = this.diagram.partialOrderList[this.diagram.diagramSignature.n - 1].getTotalOrder();

    for (var i = 0; i < loopCount; i++) {
        var tempIntermediateBoundary = intermediateBoundary.copy();
        tempIntermediateBoundary.extend(this.map);
        var tempMatchedDiagramBoundary = matchedDiagram.diagram.sourceBoundary.copy();
        tempMatchedDiagramBoundary.extend(matchedDiagram.map);
        var boundaryMatchesList = tempIntermediateBoundary.enumerate(tempMatchedDiagramBoundary);

        // Bubble up the bubble bounds
        for (var j = 0; j < boundaryMatchesList.length; j++) {
            for (var k = 0; k < boundaryMatchesList[j].bubble_bounds.length; k++) {
                var b = boundaryMatchesList[j].bubble_bounds[k];
                boundaryMatchesList[j].bubble_bounds[k] = {
                    preceding: (b.preceding == null ? null : intermediateBoundary.map.get(b.preceding)),
                    succeeding: (b.succeeding == null ? null : intermediateBoundary.map.get(b.succeeding))
                }
            }
        }

        // We construct a match on n-cells using the total orders, we start from the current base platform (intermediate boundary) beginning at height

        var currentMatch;
        if (nCellsMatchedDiagramTotalOrder.length != 0) {
            currentMatch = this.checkMatch(nCellsTotalOrder, nCellsMatchedDiagramTotalOrder, matchedDiagram, loopCount, i, boundaryMatchesList, intermediateBoundary);
        }
        else {
            var constLength = matches.length; // Needed so that we insert matches at the end of the matches array
            for (var k = 0; k < boundaryMatchesList.length; k++) {
                var temp = boundaryMatchesList[k]
                temp.match.each(function(key, value) {
                    temp.match.remove(key);
                    temp.match.put(matchedDiagram.diagram.sourceBoundary.map.get(key), intermediateBoundary.map.get(value));
                }.bind(this));
                var preceding_id = null;
                if (i > 0) {
                    preceding_id = nCellsTotalOrder[i - 1];
                }
                var succeeding_id = null;
                if (i < loopCount - 1) {
                    succeeding_id = nCellsTotalOrder[i];
                }
                temp.bounds.push({
                    preceding: preceding_id,
                    succeeding: succeeding_id
                });
                temp.bubble_bounds.push({
                    preceding: preceding_id,
                    succeeding: succeeding_id
                })
                matches[constLength + k] = temp; // so that we do not overwrite the matches that already are found
            }
        }
        if (currentMatch != null) {

            // Add preceding and succeeding data
            var preceding_id = null;
            if (i > 0) {
                preceding_id = nCellsTotalOrder[i - 1];
            }
            var succeeding_id = null;
            if (i < loopCount - 1) {
                succeeding_id = nCellsTotalOrder[i + matchedDiagram.diagram.diagramSignature.k];
            }

            currentMatch.bounds.push({
                preceding: preceding_id,
                succeeding: succeeding_id
            });
            currentMatch.bubble_bounds.push({
                preceding: preceding_id,
                succeeding: succeeding_id
            });
            matches.push(currentMatch);
        }

        /* 
            Now the intermediate boundary is rewritten, so that we could look for a match starting from the next base platform.

            The crucial aspect of this step is to pick the right n-cell to tell us what rewrite to perform and also rewire the inclusion map,
            so that the source of the rewrite is a subdiagram of the diagram that we are rewriting (intermediate boundary),

            We pick the n-cell using the pre-computed total order. Since we're computing the (i+1)th base platform (0th platform is just the source boundary
            of this diagram), we take the ith n-cell in the total order to perform the rewrite.

            If the intermediate boundary is a 0-diagram, we simply replace it with the target of the ith nCell. Otherwise, we take the ith n-cell and its source 
            and target to be the source and the target of the rewrite, respectively.

            Rewriting is achieved through the attachment procedure - intermediate boundary is boosted one level up, 
            then a diagram of the 'rewrite' generator is attached. 

            To obtain the diagram, we create a MapDiagram of the generator (ith n-cell in the total order) - singleCellRewrite.

            To obtain the diagram we are attaching along (a subdiagram of the target boundary of the intermediate boundary diagram), we first copy the source
            diagram of the ith n-cell in the total order on this diagram - somehow 'reverse engineering' the attachment point. To make it a subdiagram of
            the target boundary of the intermediate boundary diagram, we need to find an exact match.

            Again, we can use the enumeration procedure, however to find a single exact match, we need to compose the inclusion maps of the target boundary
            of the intermediate boundary diagram and of the intermediate boundary itself. 

            That way, the co-domain of both maps is the element namespace of this diagram and an exact match can be found.

            Since currently after 'boosting up' a MapDiagram the target and source boundary inclusions are identities, we could just perform the 
            enumeration procedure right away, before we boost the diagram up and achieve the same effect. We are guaranteed to receive just a single
            match, otherwise our naming covention must have not been unique.

            The temporary map calculated in such a way makes attachmentPoint a subdiagram of the appropriate target boundary.

            Finally we want the intermediateBoundary to be an (n-1)-MapDiagram, so we just take it to be the target boundary of itself
        */
        if (i === loopCount - 1) {
            break;
        }
        if (intermediateBoundary.diagram.diagramSignature.n === 0) {
            if (nCellsTotalOrder.length != 0) {
                intermediateBoundary = this.diagram.diagramSignature.nCells.get(nCellsTotalOrder[i]).target.copy();
            }
        }
        else {
            var singleCellRewrite = this.diagram.diagramSignature.createMapDiagram(nCellsTotalOrder[i]);
            var rewriteSource = singleCellRewrite.diagram.sourceBoundary.copy();
            rewriteSource.extend(singleCellRewrite.map);
            var rewriteTarget = singleCellRewrite.diagram.targetBoundary.copy();
            rewriteTarget.extend(singleCellRewrite.map);

            var tempMapList = intermediateBoundary.enumerate(rewriteSource);

            var k = 0;
            if (tempMapList.length > 1) {

                for (k = 0; k < tempMapList.length; k++) {
                    if ((tempMapList[k].bubble_bounds[0].preceding == null)
                        && (this.diagram.partialOrderList[0].getElementPredecessors(nCellsTotalOrder[i]).length == 0)) {
                            break;
                    }
                    else if (intermediateBoundary.map.get(tempMapList[k].bubble_bounds[0].preceding) ===
                        this.diagram.partialOrderList[0].getElementPredecessors(nCellsTotalOrder[i])[0]) {
                        break;
                    }
                }
            }
            if (k == tempMapList.length) {
                alert ("Error in MapDiagram.rewrite_original");
            }

            rewriteSource.map = tempMapList[k];
            intermediateBoundary = intermediateBoundary.rewrite(rewriteSource, rewriteTarget);
        }
    }
    return matches;
}

MapDiagram.prototype.checkMatch = function(nCellsTotalOrder, nCellsMatchedDiagramTotalOrder, matchedDiagram, loopCount, currentPlatform, boundaryMatchesList, intermediateBoundary) {

    var currentMatch = new Hashtable();
    for (var j = 0; j < nCellsMatchedDiagramTotalOrder.length; j++) {
        if (this.map.get(nCellsTotalOrder[currentPlatform + j]) != matchedDiagram.map.get(nCellsMatchedDiagramTotalOrder[j])) {
            return null;
        }
        currentMatch.put(nCellsMatchedDiagramTotalOrder[j], nCellsTotalOrder[currentPlatform + j]);
    }

    /*
        We attempt to construct a bijection on the basis of the n-cell assignment 'current match'. We take each individual pair of matched n-cells
        and match their source and target diagrams using the procedure that either returns a bijection between cells or throws an exception if one
        cannot be found.

        Then all pairs of elements matched in that way are put as the current match (after having their names lifted via .map 
        to be as they are in the overall diagrams)
    */
    for (var j = 0; j < nCellsMatchedDiagramTotalOrder.length; j++) {

        // Recursive calls that return bijections for the source and the target of generators subsequent in the total order
        var tempBijectionSources = this.nCellBijection(
            matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).source,
            this.diagram.diagramSignature.nCells.get(nCellsTotalOrder[currentPlatform + j]).source);

        var tempBijectionTargets = this.nCellBijection(
            matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).target,
            this.diagram.diagramSignature.nCells.get(nCellsTotalOrder[currentPlatform + j]).target);

        /*
            Chases names of elements from what they are in subdiagrams, to what they are at this level       
    
            To make sure that an element in the target of j-th cell gets mapped to the same element in this diagram as the corresponding element in the source
            of the (j+1)-th cell, we have to check whether at the stage of lifting we are trying to put another assignment 
            for a given element in the matched diagram, furthermore, if this other assignment is different than the initial assignment, then
            it must be that case that the match does not respect the source and target structure in the total order
        */

        var keys = tempBijectionSources.keys();
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            var value = tempBijectionSources.get(key);
            if (!currentMatch.containsKey(matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).source.map.get(key))) {
                currentMatch.put(
                    matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).source.map.get(key),
                    this.diagram.diagramSignature.nCells.get(nCellsTotalOrder[currentPlatform + j]).source.map.get(value)
                );
            }
            else {
                // We check whether the two assignment values are the same - if not, the match is invalid
                if (currentMatch.get(matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).source.map.get(key)) !=
                    this.diagram.diagramSignature.nCells.get(nCellsTotalOrder[currentPlatform + j]).source.map.get(value)) {
                    return null; // Return failure
                }
            }
        }

        // Similarly for targets
        keys = tempBijectionTargets.keys();
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            var value = tempBijectionTargets.get(key);
            if (!currentMatch.containsKey(matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).target.map.get(key))) {
                currentMatch.put(
                    matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).target.map.get(key),
                    this.diagram.diagramSignature.nCells.get(nCellsTotalOrder[currentPlatform + j]).target.map.get(value)
                );
            }
            else {
                // We check whether the two assignment values are the same - if not, the match is invalid
                if (currentMatch.get(matchedDiagram.diagram.diagramSignature.nCells.get(nCellsMatchedDiagramTotalOrder[j]).target.map.get(key)) !=
                    this.diagram.diagramSignature.nCells.get(nCellsTotalOrder[currentPlatform + j]).target.map.get(value)) {
                    return null; // Throw an exception
                }
            }
        }
    }

    // If there are no top-level cells, then just establish the match by hand
    // HACK - not generally good for higher dimensions - will break when the source of a 3-generator is the identity of an identity
    if (nCellsMatchedDiagramTotalOrder.length == 0) {
        var key_matched = matchedDiagram.diagram.diagramSignature.sigma.nCells.keys()[0];
        var key_main = intermediateBoundary.map.get(intermediateBoundary.diagram.diagramSignature.nCells.keys()[0]);

        // Check if they have the same type
        if (matchedDiagram.map.get(key_matched) != this.map.get(key_main)) {
            return null;
        }

        currentMatch.put(key_matched, key_main);
    }

    /*
        5/6/2015
        [THINK MORE] Still need to add k-cells k<n to the current match, using boundary matches
    
        Or in other words - if an element has not been added to the current match via the source/target structure (i.e. is not in the
        currentMatch hashtable), then take its match from the particular boundary match when typing is checked (when we iterate over matches
        at lower levels).
    */


    /*
        Now we must check whether the current match is consistent with any of the matches computed on the boundary.
        This is necessary, since even though the match we found is consistent with respect to typing, it does not take into account 
        that there might be (n-1)-cells obstructing the match, which have not been recorded, since there may be no n-cells that they connect with.

        Note that current match is a function between elements of the matched diagram and this diagram. 
        Additionally boundaryMatchesList contains all valid functions from the source boundary of the matched diagram to intermediate boundary 
        (starting platform of a match), which in turn via its map function is contained in this diagram.

        For a match to be consistent, this relationship must commute i.e. an element of the boundary of the matched diagram
        has to be sent to the same element of this diagram both via the matched diagram boundary inclusion and the 'current match' 
        and also via boundaryMatch and this diagram boundary inclusion
        
        Only ONE of these boundaryMatchesList matches can be correct.
    */
    var loopFlag = true;
    var j = 0;
    while (loopFlag && j < boundaryMatchesList.length) {
        var matchFlag = true;
        var varSig = matchedDiagram.diagram.sourceBoundary.diagram.diagramSignature;
        while (varSig != null) {
            var keys = varSig.nCells.keys();
            for (var k = 0; k < keys.length; k++) {
                var key = keys[k];
                var value = varSig.nCells.get(key);
                if (intermediateBoundary.map.get(boundaryMatchesList[j].match.get(key)) != currentMatch.get(matchedDiagram.diagram.sourceBoundary.map.get(key))) {
                    matchFlag = false;
                }
            }
            varSig = varSig.sigma;
        }
        if (matchFlag) {
            loopFlag = false;
        }
        else {
            j++;
        }
    }

    /*
    var j;
    for (j = 0; j < boundaryMatchesList.length; j++) {
        var varSig = matchedDiagram.diagram.sourceBoundary.diagram.diagramSignature;
        while (varSig != null) {
            var keys = varSig.nCells.keys();
            for (var k = 0; k < keys.length; k++) {
                var key = keys[k];
                var value = varSig.nCells.get(key);
                if (intermediateBoundary.map.get(boundaryMatchesList[j].match.get(key)) != currentMatch.get(matchedDiagram.diagram.sourceBoundary.map.get(key))) {
                    continue;
                }
            }
            varSig = varSig.sigma;
        }
        
        // If we've fallen through to here then we've found the right match
        break;
    }
    */

    // If it doesn't correspond to any bounds match, then return null (is this possible???)
    if (j == boundaryMatchesList.length) {
        return null;
    }

    return {
        match: currentMatch,
        bounds: boundaryMatchesList[j].bounds,
        bubble_bounds: boundaryMatchesList[j].bubble_bounds
    };
}

/*
This crucial procedure takes as input a diagram that we want to attach to the boundary of this, a subdiagram of the appropriate boundary of this and a path to 
this boundary in this (in the form of a string in {s, t})
*/
MapDiagram.prototype.attach = function(attachedMapDiagram, inclusionMap, boundaryPath, recursionFlag) {

    // Skeletal data for the composite MapDiagram that will be gradually computed throughout the procedure
    var map;
    var diagramSignature;
    var sourceBoundary = new MapDiagram(new Diagram(), new Hashtable());
    var targetBoundary = new MapDiagram(new Diagram(), new Hashtable());
    var partialOrderList = new Array()

    for (var i = 0; i < this.diagram.partialOrderList.length; i++) {
        partialOrderList.push(this.diagram.partialOrderList[i].copy());
    }

    // First, using the path string we find the appropriate boundary of this diagram and of the attached diagram
    var boundaryMapDiagram = this;
    var attachedMapDiagramBoundary = attachedMapDiagram;

    /* 
    Need to prepare a fresh string - the same as boundaryPath, but with the opposite final element, this is to be used in calculating the general name of an element 
    within the attached Diagram. This could potentially be more elegant by holding pointers to partent diagrams.
    */

    /*
    var attachedMapDiagramBoundaryPath = new Array();
    for (var i = 0; i < boundaryPath.length; i++) {
        attachedMapDiagramBoundaryPath.push(boundaryPath[i]);
    }
    var tempLastElement = attachedMapDiagramBoundaryPath.pop();
    if (tempLastElement === 's') {
        attachedMapDiagramBoundaryPath.push('t');
    }
    else {
        attachedMapDiagramBoundaryPath.push('s');
    }
    */

    var final_s = (boundaryPath[boundaryPath.length - 1] == 's');
    var attachedMapDiagramBoundaryPath = new Array();
    for (var i = 0; i < boundaryPath.length - 1; i++) {
        attachedMapDiagramBoundaryPath[i] = boundaryPath[i];
    }
    attachedMapDiagramBoundaryPath[attachedMapDiagramBoundaryPath.length] = (final_s ? 't' : 's');
    if (final_s) {
        attachedMapDiagramBoundary = attachedMapDiagramBoundary.diagram.targetBoundary;
    }
    else {
        attachedMapDiagramBoundary = attachedMapDiagramBoundary.diagram.sourceBoundary;
    }

    /* 
    Flag that is set to true if we attach the diagram to the source boundary of this diagram and to false otherwise
    Whether we attach to the source or target of a generator depends on the last element of the boundaryPath string
    */
    var boundaryFlag;
    for (var i = 0; i < boundaryPath.length; i++) {
        if (boundaryPath[i] === 's') {
            boundaryMapDiagram = boundaryMapDiagram.diagram.sourceBoundary;
            //attachedMapDiagramBoundary = attachedMapDiagramBoundary.diagram.targetBoundary;
            boundaryFlag = true;
        }
        else {
            boundaryMapDiagram = boundaryMapDiagram.diagram.targetBoundary;
            //attachedMapDiagramBoundary = attachedMapDiagramBoundary.diagram.sourceBoundary;
            boundaryFlag = false;
        }
    }

    /*
    Calculates a correspondence between a boundary of the attached diagram and a subdiagram of a boundary of this diagram  
    Eventually, this must be a graph, since a single element could be sent to more than one element, so a simple bijection would not suffice.
    However, at first, as a result of computing a diagram bijection - we do get a 1-to-1 correspondence. This happens only when we proceed
    to considering names in the overall diagram
    */
    //var initialBijection = new Hashtable();
    // var tempBijection = new Hashtable();
    var renamingGraph = new Graph();
    var renaming;

    //initialBijection = attachedMapDiagramBoundary.mapDiagramBijection(boundaryMapSubDiagram);

    /* 
    Lift the initial renaming to be a correspondence between names of elements in the boundary of the attached diagram and names of elements in a boundary of this
    diagram
    */
    //inclusionMap.each(function (key, value) {
    //  tempBijection.put(key, boundaryMapSubDiagram.map.get(value));
    // tempRenaming.put(attachedMapDiagramBoundary.map.get(key), boundaryMapDiagram.map.get(value));
    //    });

    // Lift the renaming to be a correspondence between names of elements in the attachedDiagram and names of elements in this diagram
    inclusionMap.match.each(function(key, value) {
        var tempKey = attachedMapDiagram.elementGeneralName(key, attachedMapDiagramBoundaryPath);
        var tempValue = this.elementGeneralName(value, boundaryPath)
        renamingGraph.addNode(tempKey);
        renamingGraph.addNode(tempValue);

        // Edges go both ways, to later be able to determine which elements to add to the new diagram
        renamingGraph.addEdge(tempKey, tempValue);
        if (!renamingGraph.isEdgePresent(tempValue, tempKey)) { // To avoid having a node connected to itself twice
            renamingGraph.addEdge(tempValue, tempKey);
        }
    }.bind(this));

    /*
    If there exists a path between two elements in the renaming graph, then they are identified in the new diagram
    I.e. Each connected component of the renaming graph corresponds to a single element in the overall diagram 
    */

    renaming = renamingGraph.connectedComponents();

    // Globularity hack
    this.diagram.constRenaming = renaming;
    /*
    Takes a union of two diagram signatures using the precomputed renaming function
    Both diagram signatures are assumed to have names fresh with respect to the other signature
    Renaming hashtable contains information about the elements that need to be identified when union is taken
    A similar style of union operations is subsequently performed for other components of the new MapDiagram that is being created
    */
    // Ensure freshness of names of the attached MapDiagram
    // attachedMapDiagram.renameFresh();
    diagramSignature = this.diagram.diagramSignature.union(attachedMapDiagram.diagram.diagramSignature, renaming);

    // Takes a union of two maps using the precomputed renaming function
    map = this.map.unionKeys(attachedMapDiagram.map, renaming);

    // Renames values in the inclusion maps for both the source and the target boundary
    //this.diagram.sourceBoundary.map = this.diagram.sourceBoundary.map.unionValues(attachedMapDiagram.diagram.sourceBoundary.map, renaming);
    //this.diagram.targetBoundary.map = this.diagram.targetBoundary.map.unionValues(attachedMapDiagram.diagram.targetBoundary.map, renaming);
    this.diagram.sourceBoundary.map.each(function(key, value) {
        if (renaming.get(value) != null) {
            this.diagram.sourceBoundary.map.remove(key);
            this.diagram.sourceBoundary.map.put(key, renaming.get(value));
        }
    }.bind(this));
    this.diagram.targetBoundary.map.each(function(key, value) {
        if (renaming.get(value) != null) {
            this.diagram.targetBoundary.map.remove(key);
            this.diagram.targetBoundary.map.put(key, renaming.get(value));
        }
    }.bind(this));
    /*
    this.diagram.sourceBoundary.diagram.diagramSignature.nCells.each(function(key, value) {
        if (value.getDimension() > 0) {
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
    }.bind(this));*/
    /*
    this.diagram.targetBoundary.diagram.diagramSignature.nCells.each(function(key, value) {
        if (value.getDimension() > 0) {
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
    }.bind(this));*/

    // Same for the attached diagram
    /*
        attachedMapDiagram.diagram.sourceBoundary.map.each(function(key, value) {
            if (renaming.get(value) != null) {
                attachedMapDiagram.diagram.sourceBoundary.map.remove(key);
                attachedMapDiagram.diagram.sourceBoundary.map.put(key, renaming.get(value));
            }
        }.bind(this));
        attachedMapDiagram.diagram.sourceBoundary.diagram.diagramSignature.nCells.each(function(key, value) {
            if (value.getDimension() > 0) {
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
        }.bind(this));
        attachedMapDiagram.diagram.targetBoundary.map.each(function(key, value) {
            if (renaming.get(value) != null) {
                attachedMapDiagram.diagram.targetBoundary.map.remove(key);
                attachedMapDiagram.diagram.targetBoundary.map.put(key, renaming.get(value));
            }
        }.bind(this));
        attachedMapDiagram.diagram.targetBoundary.diagram.diagramSignature.nCells.each(function(key, value) {
            if (value.getDimension() > 0) {
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
        }.bind(this));
        */

    // Updates Partial Orders    
    /* 
    The process is separated into three clauses, we start with n-cells which are located in the partial order list at position n-1
    For k-cells, the partial order is contained at position k-1 in the partial order list
    The process of combining partial orders on i-cells for each i, has two stages. The initial stage is to take a union of both partial orders,
    the second stage is to supply the necessary additional relations that arise due to the theoretical model
    */

    var varSig = this.diagram.diagramSignature;

    /* 
    There is a total order on k-cells and it is contained at position (varSig.n-1) in the parital order list
    This procedure appends the total orders depending on whether we are attaching to the source or the target    
    */

    // First we append the total order, then we update the partial order on n-cells of this to be that order
    var tempTotalOrder;
    if (boundaryFlag) {
        tempTotalOrder = attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)].copy();
        tempTotalOrder.appendTotalOrder(this.diagram.partialOrderList[(varSig.n - 1)]);
        partialOrderList[(varSig.n - 1)] = tempTotalOrder;
    }
    else {
        tempTotalOrder = this.diagram.partialOrderList[(varSig.n - 1)].copy();
        tempTotalOrder.appendTotalOrder(attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)]);
        partialOrderList[(varSig.n - 1)] = tempTotalOrder;
    }
    varSig = varSig.sigma;

    // Pointers to appropriate boundaries - they will always be opposite for each level    
    var boundaryAttachedMapDiagram = attachedMapDiagram;
    var boundaryThisMapDiagram = this;

    // These are for being able to chase the overall name of boundary elements    
    var tempBoundaryPathThisMapDiagram = new Array();
    var tempBoundaryPathAttachedMapDiagram = new Array();

    var boundaryPathCounter = 0

    // Now we vary over k-cells all the way to 1-cells (there is no partial order on 0-cells)
    while (varSig.n > this.getDimension() - boundaryPath.length) {
        if (boundaryPath[boundaryPathCounter] === 's') {
            boundaryThisMapDiagram = boundaryThisMapDiagram.diagram.sourceBoundary;
            boundaryAttachedMapDiagram = boundaryAttachedMapDiagram.diagram.targetBoundary;

            tempBoundaryPathThisMapDiagram.push('s');
            tempBoundaryPathAttachedMapDiagram.push('t');
        }
        else {
            boundaryThisMapDiagram = boundaryThisMapDiagram.diagram.targetBoundary;
            boundaryAttachedMapDiagram = boundaryAttachedMapDiagram.diagram.sourceBoundary;

            tempBoundaryPathThisMapDiagram.push('t');
            tempBoundaryPathAttachedMapDiagram.push('s');
        }

        // Variables that will hold the element that has to be made a predecessor (successor) of all initial (terminal) elements 
        var tempPredecessor;
        var tempSuccessor;

        if (boundaryPath[boundaryPathCounter] === 's') // We are attaching the target of the attached diagram to the source of this diagram
        {
            // Both promised by convention to be arrays with one element
            tempPredecessor = boundaryAttachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getTerminalElements()[0];
            tempSuccessor = boundaryThisMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getInitialElements()[0];

            // Chases names of both elements in the overall diagram
            tempPredecessor = attachedMapDiagram.elementGeneralName(tempPredecessor, tempBoundaryPathAttachedMapDiagram);
            tempSuccessor = this.elementGeneralName(tempSuccessor, tempBoundaryPathThisMapDiagram)

            /* 
            Calculates initial elements of the partial order on k-cells in this diagram and 
            adds them as successors of the terminal element in the partial order on k-cells in this diagram
            */
            var tempInitialElementsThisDiagram = this.diagram.partialOrderList[(varSig.n - 1)].getInitialElements();

            // Do not add these elements earlier so as not to disturb calculating initial elements of the partial order on this
            partialOrderList[(varSig.n - 1)] = this.diagram.partialOrderList[(varSig.n - 1)].unionRenaming(
                attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)], renaming).copy();
            partialOrderList[(varSig.n - 1)].addSuccessors(tempPredecessor, tempInitialElementsThisDiagram);

            /* 
            Calculates terminal elements of the partial order on k-cells in the attached diagram and
            adds them as predecessors of the initial elements in the partial order on k-cells in this diagram
            */
            var tempTerminalElementsAttachedDiagram = attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getTerminalElements();
            partialOrderList[(varSig.n - 1)].addPredecessors(tempSuccessor, tempTerminalElementsAttachedDiagram);
        }
        // We are attaching the source of the attached diagram to the target of this diagram
        else {
            // Both promised by convention to be arrays with one element
            tempPredecessor = boundaryAttachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getInitialElements()[0];

            /*
            // Why?
            var tempPartialOrder = boundaryThisDiagram.partialOrderList[(varSig.n - 1)].copy();
            boundaryThisDiagram.diagramSignature.nCells.each(function (key, value) {
                if (!this.partialOrderList[(varSig.n - 1)].isElementPresent(this.elementGeneralName(key, tempBoundaryPathThisDiagram))) {
                    tempPartialOrder.removeElement(key);
                }
            }.bind(this));
            */

            tempSuccessor = boundaryThisMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getTerminalElements()[0];

            // Chases names of both elements in the overall diagram
            tempPredecessor = attachedMapDiagram.elementGeneralName(tempPredecessor, tempBoundaryPathAttachedMapDiagram);
            tempSuccessor = this.elementGeneralName(tempSuccessor, tempBoundaryPathThisMapDiagram)

            /* 
            Calculates terminal elements of the partial order on k-cells in this diagram and 
            adds them as predecessors of the initial element in the partial order on k-cells in this diagram
            */
            var tempTerminalElementsThisDiagram = this.diagram.partialOrderList[(varSig.n - 1)].getTerminalElements();

            // Do not add these elements earlier so as not to disturb calculating terminal elements  of the partial order on this
            partialOrderList[(varSig.n - 1)] = this.diagram.partialOrderList[(varSig.n - 1)].unionRenaming(
                attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)], renaming).copy();
            partialOrderList[(varSig.n - 1)].addPredecessors(tempPredecessor, tempTerminalElementsThisDiagram);

            /* 
            Calculates initial elements of the partial order on k-cells in the attached diagram and
            adds them as successors of the terminal element in the partial order on k-cells in this diagram
            */
            var tempInitialElementsAttachedDiagram = attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getInitialElements();
            partialOrderList[(varSig.n - 1)].addSuccessors(tempSuccessor, tempInitialElementsAttachedDiagram);

        }
        boundaryPathCounter++;
        varSig = varSig.sigma;
    }

    while (varSig.n > 0) {
        // This clause is necessary to keep track of the relation between the source-target boundary structure and the overall diagram
        if (boundaryPath[boundaryPathCounter] === 's') {
            boundaryThisMapDiagram = boundaryThisMapDiagram.diagram.sourceBoundary;
            boundaryAttachedMapDiagram = boundaryAttachedMapDiagram.diagram.targetBoundary;

            tempBoundaryPathThisMapDiagram.push('s');
            tempBoundaryPathAttachedMapDiagram.push('t');
        }
        else {
            boundaryThisMapDiagram = boundaryThisMapDiagram.diagram.targetBoundary;
            boundaryAttachedMapDiagram = boundaryAttachedMapDiagram.diagram.sourceBoundary;

            tempBoundaryPathThisMapDiagram.push('t');
            tempBoundaryPathAttachedMapDiagram.push('s');
        }
        boundaryPathCounter++;


        var identifiedBoundaryCells = new Array();

        /* 
        This assumes that renaming tells us which elements should elements in both merged diagrams be renamed to
        For instance, an element of the boundary of this diagram, could also get renamed to another element of this
        Any element that is involved in idendification is present in the renaming array, as it stands
        */
        boundaryThisMapDiagram.diagram.diagramSignature.nCells.each(function(key, value) {
            if (renaming.containsKey(this.elementGeneralName(key, tempBoundaryPathThisMapDiagram))) {
                identifiedBoundaryCells.push(key);
            }
        }.bind(this));

        // Calculates the unique predecessor and the unique successor of this set of identified k-cells in the partial order on this diagram

        // Possibly need to get general names of these elements in the overall diagram

        /*
        var boundaryPredecessor = boundaryThisMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getSetPredecessors(identifiedBoundaryCells)[0];
        var boundarySuccessor = boundaryThisMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getSetSuccessors(identifiedBoundaryCells)[0];
        */

        /* 
        This section of code uses the inclusion information that was previously computed to correctly
        embed the attached partial order in this partial order.
        
        First, overall element names of bound elements are chased (using a copy, so that the inclusion function 
        can later be used in recursive calls and in rewriting), then appropriate relations are added
        */
        var inclusionBounds = this.topLevelBounds(inclusionMap.bounds, boundaryPath);
        /*new Array();
        for(var k = 0; k < inclusionMap.bounds.length; k++){
            inclusionBounds[k] = {
                preceding: inclusionMap.bounds[k].preceding,
                succeeding: inclusionMap.bounds[k].succeeding
            }

        }
        var tempPath = new Array();
        var boundsCounter = inclusionMap.bounds.length - 1; // We ommit the final element
        while (boundsCounter >= 0) {
            tempPath.push(boundaryPath[(boundaryPath.length - 1) - boundsCounter]);
            inclusionBounds[boundsCounter].preceding = this.elementGeneralName(inclusionBounds[boundsCounter].preceding, tempPath);
            inclusionBounds[boundsCounter].succeeding = this.elementGeneralName(inclusionBounds[boundsCounter].succeeding, tempPath);
            boundsCounter--;
        }*/

        var boundaryPredecessor = inclusionBounds[varSig.n - 1].preceding;
        var boundarySuccessor = inclusionBounds[varSig.n - 1].succeeding;

        /*
        boundaryPredecessor = this.elementGeneralName(boundaryPredecessor, tempBoundaryPathThisMapDiagram);
        boundarySuccessor = this.elementGeneralName(boundarySuccessor, tempBoundaryPathThisMapDiagram);
        */

        // Adds all elements of the attached diagram to the partial order on this diagram, taking into account the renaming
        partialOrderList[(varSig.n - 1)] = this.diagram.partialOrderList[(varSig.n - 1)].unionRenaming(
            attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)], renaming);

        // Initial and terminal elements of the set of k-cells in the partial order on the attached diagram
        var attachedDiagramInitialElements = attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getInitialElements();
        var attachedDiagramTerminalElements = attachedMapDiagram.diagram.partialOrderList[(varSig.n - 1)].getTerminalElements();

        // Finally adding the missing connections to complete the embedding
        if (boundaryPredecessor != null) {
            partialOrderList[(varSig.n - 1)].addSuccessors(boundaryPredecessor, attachedDiagramInitialElements);
        }
        if (boundarySuccessor != null) {
            partialOrderList[(varSig.n - 1)].addPredecessors(boundarySuccessor, attachedDiagramTerminalElements);
        }
        varSig = varSig.sigma;
    }

    // Condition to break recursion
    //if (this.diagram.diagramSignature.n === boundaryMapSubDiagram.diagram.diagramSignature.n + 1) {
    if (boundaryPath.length === 1) {
        if (boundaryPath[0] === 't') {
            sourceBoundary = this.diagram.sourceBoundary;

            if (sourceBoundary.getDimension() === 0) {
                var tempHashtable = new Hashtable();
                var tempKey = sourceBoundary.diagram.diagramSignature.nCells.keys()[0];
                tempHashtable.put(attachedMapDiagram.diagram.sourceBoundary.diagram.diagramSignature.nCells.keys()[0], tempKey);
                tempHashtable.put(tempKey, tempKey);
                sourceBoundary.diagram.constRenaming = tempHashtable;
            }

            if (sourceBoundary.getDimension() === 0) // The boundary is just a 0-diagram
            {
                targetBoundary = attachedMapDiagram.diagram.targetBoundary;
                var tempHashtable = new Hashtable();
                var tempKey = attachedMapDiagram.diagram.targetBoundary.diagram.diagramSignature.nCells.keys()[0];
                tempHashtable.put(targetBoundary.diagram.diagramSignature.nCells.keys()[0], tempKey);
                tempHashtable.put(tempKey, tempKey);
                targetBoundary.diagram.constRenaming = tempHashtable;
            }
            else {
                var boundarySubDiagramTemp = attachedMapDiagram.diagram.sourceBoundary.copy();
                var targetBoundaryCopy = this.diagram.targetBoundary.copy();

                boundarySubDiagramTemp.map = inclusionMap;
                targetBoundary = targetBoundaryCopy.rewrite(boundarySubDiagramTemp, attachedMapDiagram.diagram.targetBoundary);
            }
        }
        else {
            targetBoundary = this.diagram.targetBoundary;

            if (targetBoundary.getDimension() === 0) {
                var tempHashtable = new Hashtable();
                var tempKey = targetBoundary.diagram.diagramSignature.nCells.keys()[0];
                tempHashtable.put(attachedMapDiagram.diagram.targetBoundary.diagram.diagramSignature.nCells.keys()[0], tempKey);
                tempHashtable.put(tempKey, tempKey);
                targetBoundary.diagram.constRenaming = tempHashtable;
            }

            if (targetBoundary.getDimension() === 0) // The boundary is just a 0-diagram, possibly later move this to the rewriting procedure
            {
                sourceBoundary = attachedMapDiagram.diagram.sourceBoundary;
                var tempHashtable = new Hashtable();
                var tempKey = attachedMapDiagram.diagram.sourceBoundary.diagram.diagramSignature.nCells.keys()[0];
                tempHashtable.put(sourceBoundary.diagram.diagramSignature.nCells.keys()[0], tempKey);
                tempHashtable.put(tempKey, tempKey);
                sourceBoundary.diagram.constRenaming = tempHashtable;
            }
            else {
                var boundarySubDiagramTemp = attachedMapDiagram.diagram.targetBoundary.copy();
                var sourceBoundaryCopy = this.diagram.sourceBoundary.copy();
                boundarySubDiagramTemp.map = inclusionMap;
                sourceBoundary = sourceBoundaryCopy.rewrite(boundarySubDiagramTemp, attachedMapDiagram.diagram.sourceBoundary);
            }
        }
    }
    // We are still rewriting higher order boundaries
    else {
        /*
        The recursion flag is used so that we don't unnecessarily make 2^n steps, globularity ensures that at each level, 
        there is only one source boundary and only one target boundary 
        */
        if (recursionFlag) {
            // Deletes the first element, shifts the rest of the array and shortens the path
            var boundaryPathCopy = new Array() //= boundaryPath.shift();
            for (var i = 0; i < boundaryPath.length; i++) {
                boundaryPathCopy.push(boundaryPath[i]);
            }
            boundaryPathCopy.shift();
            // Need to copy the boundary path to avoid cross references
            var boundaryPathSource = new Array();
            var boundaryPathTarget = new Array();
            for (var i = 0; i < boundaryPathCopy.length; i++) {
                boundaryPathSource.push(boundaryPathCopy[i]);
                boundaryPathTarget.push(boundaryPathCopy[i]);
            }

            var tempTargetBoundary = this.diagram.targetBoundary.copy();
            var tempAttachedBoundary = attachedMapDiagram.diagram.targetBoundary.copy();

            sourceBoundary = this.diagram.sourceBoundary.attach(attachedMapDiagram.diagram.sourceBoundary, inclusionMap, boundaryPathSource, true);

            sourceBoundary.diagram.constRenaming = this.diagram.sourceBoundary.diagram.constRenaming;
            // targetBoundary = this.diagram.targetBoundary.attach(attachedMapDiagram.diagram.targetBoundary, inclusionMap, boundaryPathTarget, false);

            targetBoundary = tempTargetBoundary.attach(tempAttachedBoundary, inclusionMap, boundaryPathTarget, false);

            targetBoundary.diagram.constRenaming = tempTargetBoundary.diagram.constRenaming;


            // We perform the following at this level, since we will not be rewriting these boundaries explicilty due to globularity conditions
            targetBoundary.diagram.targetBoundary.diagram = sourceBoundary.diagram.targetBoundary.diagram;
            targetBoundary.diagram.sourceBoundary.diagram = sourceBoundary.diagram.sourceBoundary.diagram;

            // Calculating the inclusion functions due to globularity conditions


            if (sourceBoundary.diagram.targetBoundary.diagram.constRenaming != null) {

                targetBoundary.diagram.targetBoundary.map =
                    this.diagram.targetBoundary.diagram.targetBoundary.map.unionKeys(attachedMapDiagram.diagram.targetBoundary.diagram.targetBoundary.map,
                        sourceBoundary.diagram.targetBoundary.diagram.constRenaming);
            }

            if (sourceBoundary.diagram.sourceBoundary.diagram.constRenaming != null) {
                targetBoundary.diagram.sourceBoundary.map =
                    this.diagram.targetBoundary.diagram.sourceBoundary.map.unionKeys(attachedMapDiagram.diagram.targetBoundary.diagram.sourceBoundary.map,
                        sourceBoundary.diagram.sourceBoundary.diagram.constRenaming);
            }

            // Special fix for additional regions in the map

            targetBoundary.diagram.targetBoundary.map.each(function(key, value) {
                if (targetBoundary.diagram.targetBoundary.diagram.diagramSignature.nCells.get(key) === null) {
                    targetBoundary.diagram.targetBoundary.map.remove(key);
                }
            }.bind(this));

            targetBoundary.diagram.sourceBoundary.map.each(function(key, value) {
                if (targetBoundary.diagram.sourceBoundary.diagram.diagramSignature.nCells.get(key) === null) {
                    targetBoundary.diagram.sourceBoundary.map.remove(key);
                }
            }.bind(this));


            // Const renaming this
            if (this.getDimension() === 2) {
                targetBoundary.diagram.targetBoundary.map.each(function(key, value) {
                    if (targetBoundary.diagram.constRenaming.get(value) != null) {
                        targetBoundary.diagram.targetBoundary.map.remove(key);
                        targetBoundary.diagram.targetBoundary.map.put(key, targetBoundary.diagram.constRenaming.get(value));
                    }
                }.bind(this));

                targetBoundary.diagram.sourceBoundary.map.each(function(key, value) {
                    if (targetBoundary.diagram.constRenaming.get(value) != null) {
                        targetBoundary.diagram.sourceBoundary.map.remove(key);
                        targetBoundary.diagram.sourceBoundary.map.put(key, targetBoundary.diagram.constRenaming.get(value));
                    }
                }.bind(this));

            }
            /*     
            
            this.diagram.targetBoundary.diagram.targetBoundary.diagram = sourceBoundary.diagram.targetBoundary.diagram;
            this.diagram.targetBoundary.diagram.sourceBoundary.diagram = sourceBoundary.diagram.sourceBoundary.diagram;

            // Calculating the inclusion functions due to globularity conditions
            
            this.diagram.targetBoundary.diagram.targetBoundary.map =
                this.diagram.targetBoundary.diagram.targetBoundary.map.unionKeys(attachedMapDiagram.diagram.targetBoundary.diagram.targetBoundary.map,
                    sourceBoundary.diagram.targetBoundary.diagram.constRenaming);

            this.diagram.targetBoundary.diagram.sourceBoundary.map =
                this.diagram.targetBoundary.diagram.sourceBoundary.map.unionKeys(attachedMapDiagram.diagram.targetBoundary.diagram.sourceBoundary.map,
                    sourceBoundary.diagram.sourceBoundary.diagram.constRenaming);

        */
        }
    }

    var diagram = new Diagram(diagramSignature, sourceBoundary, targetBoundary, partialOrderList);
    diagram.constRenaming = renaming;
    var mapDiagram = new MapDiagram(diagram, map);
    return mapDiagram;
};

MapDiagram.prototype.topLevelBounds = function(bounds, boundaryPath) {
    var boundsCopy = new Array();
    for (var k = 0; k < bounds.length; k++) {
        boundsCopy[k] = {
            preceding: bounds[k].preceding,
            succeeding: bounds[k].succeeding
        }
    }

    var boundsCounter = boundsCopy.length - 1; // We ommit the final element
    var tempPath = new Array();
    while (boundsCounter >= 0) {
        tempPath.push(boundaryPath[(boundaryPath.length - 1) - boundsCounter]);
        boundsCopy[boundsCounter].preceding = this.elementGeneralName(boundsCopy[boundsCounter].preceding, tempPath);
        boundsCopy[boundsCounter].succeeding = this.elementGeneralName(boundsCopy[boundsCounter].succeeding, tempPath);
        boundsCounter--;
    }
    return boundsCopy;
};


// Gets the total order of top-level cells, valued by the map function
MapDiagram.prototype.getMappedTotalOrder = function() {
    var p_list = this.diagram.partialOrderList;
    var p_top = p_list[p_list.length - 1];
    var arr = p_top.getTotalOrder();
    for (var i = 0; i < arr.length; i++) {
        arr[i] = this.map.get(arr[i]);
    }
    return arr;
}


// Boosts the MapDiagram to be the identity one level higher
MapDiagram.prototype.boost = function() {
    var partialOrderList = new Array();
    for (var i = 0; i < this.diagram.partialOrderList.length; i++) {
        partialOrderList.push(this.diagram.partialOrderList[i].copy());
    }
    var tempPartialOrderListSourceBoundary = new Array();
    var tempPartialOrderListTargetBoundary = new Array();
    for (var i = 0; i < this.diagram.partialOrderList.length; i++) {
        tempPartialOrderListSourceBoundary.push(this.diagram.partialOrderList[i].copy());
        tempPartialOrderListTargetBoundary.push(this.diagram.partialOrderList[i].copy());
    }

    // Necessary to create this copy, as sourceBoundary gets updated before we can use it in updating the targetBoundary
    var tempSourceBoundary = null;
    if (this.diagram.sourceBoundary != null) {
        tempSourceBoundary = this.diagram.sourceBoundary.copy();
    }

    // Construct identity map, to value the source and target into the main diagram
    var identity_map = this.map.copy();
    this.map.each(function(key, value) {
        identity_map.put(key, key);
    })

    var sourceBoundary = new MapDiagram(
        new Diagram(
            this.diagram.diagramSignature.copy(),
            this.diagram.sourceBoundary,
            this.diagram.targetBoundary,
            tempPartialOrderListSourceBoundary
        ),
        identity_map
    );
    var targetBoundary = new MapDiagram(
        new Diagram(
            this.diagram.diagramSignature.copy(),
            tempSourceBoundary,
            this.diagram.targetBoundary,
            tempPartialOrderListTargetBoundary
        ),
        identity_map.copy()
    );

    var diagramSignature = new Signature(this.diagram.diagramSignature);
    partialOrderList.push(new PartialOrder());
    var diagram = new Diagram(diagramSignature, sourceBoundary, targetBoundary, partialOrderList);
    this.diagram = diagram;
};


// Given an element of a boundary, computes its most general name in the diagram
MapDiagram.prototype.elementGeneralName = function(elementId, boundaryPath) { // boundaryPath is an array

    // Creates a copy of the boundary path, so that we could operate on it freely - to be optimised later, we do not need to copy each time in the recursive call
    var tempBoundaryPath = new Array();
    for (var i = 0; i < boundaryPath.length; i++) {
        tempBoundaryPath.push(boundaryPath[i]);
    }

    // Find the boundary
    if (tempBoundaryPath.length === 0) return elementId;

    /// pseudocode
    // return this.target.elementGeneralName(elementId, splice(boundaryPath, 1)); 


    var mapDiagramBoundary = this;
    for (var i = 0; i < tempBoundaryPath.length; i++) {
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
};

MapDiagram.prototype.rename = function(renaming) {
    // Renames the diagram signature
    this.diagram.rename(renaming);

    // Applies the renaming to the typing function on this   
    this.map.each(function(key, value) {
        if (renaming.get(key) != null) {
            this.map.remove(key);
            this.map.put(renaming.get(key), value);
        }
    }.bind(this));

};

MapDiagram.prototype.renameFresh = function() {

    var renaming = new Hashtable();
    var varSig = this.diagram.diagramSignature;
    while (varSig != null) {
        varSig.nCells.each(function(key, value) {
            renaming.put(key, globular_freshName(varSig.n));
        }.bind(this));
        varSig = varSig.sigma;
    }
    // Renames the diagram signature
    this.rename(renaming);
}

MapDiagram.prototype.renameFreshBoundaries = function(flag) {
    /*this.renameFresh();    
     if(this.diagram.sourceBoundary != null){
            this.diagram.sourceBoundary.renameFreshBoundaries();
            this.diagram.targetBoundary.renameFreshBoundaries();
    }*/

    var renaming = new Hashtable();

    var varSig = this.diagram.diagramSignature;
    while (varSig != null) {
        varSig.nCells.each(function(key, value) {
            renaming.put(key, globular_freshName(varSig.n));
        }.bind(this));
        varSig = varSig.sigma;
    }
    this.diagram.constRenaming = renaming;

    this.rename(renaming);
    if (this.diagram.sourceBoundary != null) {
        if (flag) {
            this.diagram.sourceBoundary.renameFreshBoundaries(true);
            this.diagram.targetBoundary.renameFreshBoundaries(false);
        }
        else {
            this.diagram.sourceBoundary.map.each(function(key, value) {
                if (this.diagram.sourceBoundary.diagram.constRenaming.get(key) != null) {
                    this.diagram.sourceBoundary.map.remove(key);
                    this.diagram.sourceBoundary.map.put(this.diagram.sourceBoundary.diagram.constRenaming.get(key), value);
                }
            }.bind(this));
            this.diagram.targetBoundary.map.each(function(key, value) {
                if (this.diagram.targetBoundary.diagram.constRenaming.get(key) != null) {
                    this.diagram.targetBoundary.map.remove(key);
                    this.diagram.targetBoundary.map.put(this.diagram.targetBoundary.diagram.constRenaming.get(key), value);
                }
            }.bind(this));
        }
    }

}


// Returns a copy with fresh names
MapDiagram.prototype.copy = function() {
    var diagram = this.diagram.copy();
    var map = this.map.copy();

    var mapDiagram = new MapDiagram(diagram, map);
    return mapDiagram;
};


MapDiagram.prototype.render = function(div, tempColours, highlightInfo) {

    if (this.diagram === undefined) {
        return;
    }

    var layout;

    if (this.getDimension() == 0) {
        layout = this.layout_0();
    }
    else if (this.getDimension() == 1) {
        layout = this.layout_1();
    }
    else if (this.getDimension() == 2) {
        layout = this.layout_2();
    }

    if (this.getDimension() < 3) {
        globular_render(div, layout, tempColours, highlightInfo);
        return JSON.stringify(layout);
    }
    else {
        // Can't lay out!
        return null;
    }

}

// Layout a diagram of a 0-generator
MapDiagram.prototype.layout_0 = function() {
    var LayoutVertices = new Hashtable();
    var LayoutBounds = new Hashtable();
    var tempKeys = this.diagram.diagramSignature.nCells.keys();
    LayoutVertices.put(tempKeys[0], [0, 0, 0]);
    LayoutBounds = {
        min_x: -1,
        max_x: 1,
        min_y: -1,
        max_y: 1
    };

    return {
        vertices: LayoutVertices,
        bounds: LayoutBounds
    };
}

// Layout a 1-dimensional diagram
MapDiagram.prototype.layout_1 = function() {

    var LayoutEdges = new Hashtable();
    var LayoutVertices = new Hashtable();
    var LayoutBounds = {};

    var orderOnEdges = this.diagram.partialOrderList[0].getTotalOrder();

    // Store layout data
    LayoutBounds.min_x = -1;
    LayoutBounds.max_x = 1;
    LayoutBounds.min_y = 0;
    LayoutBounds.max_y = orderOnEdges.length + 1;

    for (var i = 0; i < orderOnEdges.length; i++) {
        LayoutVertices.put(orderOnEdges[i], [0, 0, i + 1]);
    }

    // Now we fill out the 0-cell grid
    for (var i = 0; i < orderOnEdges.length; i++) {
        var cell = // 0-cell name in the diagram signature - not its type
            this.diagram.diagramSignature.nCells.get(orderOnEdges[i]).source.map.get(
                this.diagram.diagramSignature.nCells.get(orderOnEdges[i]).source.diagram.diagramSignature.nCells.keys()[0]);
        LayoutEdges.put(cell, [0, i, i + 1]);
    }

    // Do the final edge, which we take from the target 0-diagram
    var cell = this.diagram.targetBoundary.map.entries()[0][1];
    LayoutEdges.put(cell, [0, orderOnEdges.length, orderOnEdges.length + 1]);

    return {
        edges: LayoutEdges,
        vertices: LayoutVertices,
        bounds: LayoutBounds
    };
}

MapDiagram.prototype.layout_2 = function() {
    var xCoordinateEdges = new Hashtable();
    var yStartCoordinateEdges = new Hashtable();
    var yEndCoordinateEdges = new Hashtable();

    var yCoordinateVertices = new Hashtable();
    var xStartCoordinateVertices = new Hashtable();
    var xEndCoordinateVertices = new Hashtable();

    var LayoutEdges = new Hashtable();
    var LayoutVertices = new Hashtable();
    var LayoutRegions = new Hashtable();
    var LayoutBounds = new Hashtable();

    var orderOnVertices = this.diagram.partialOrderList[1].getTotalOrder();
    var orderOnEdges = this.diagram.partialOrderList[0].getTotalOrder();

    // If it's an identity of an identity, give hard-coded response
    if ((orderOnEdges != null) && (orderOnVertices != null)) {
        if ((orderOnEdges.length == 0) && (orderOnVertices.length == 0)) {
            var zero_cell = this.diagram.diagramSignature.sigma.sigma.nCells.keys()[0];
            LayoutRegions.put(zero_cell, [
                [0, 0]
            ]);
            return {
                regions: LayoutRegions,
                edges: [],
                vertices: [],
                bounds: {
                    min_x: 0,
                    max_x: 1,
                    min_y: 0,
                    max_y: 1
                }
            };
        }
    }

    for (var i = 0; i < orderOnVertices.length; i++) {
        yCoordinateVertices.put(orderOnVertices[i], i + 1);
    }
    xCoordinateEdges = this.diagram.partialOrderList[0].longestPath();
    // Pad the layout
    xCoordinateEdges.each(function(key, value) {
        value++;
        xCoordinateEdges.put(key, value);
    });

    // Puts default start/end coordinates for edges
    this.diagram.diagramSignature.sigma.nCells.each(function(key, value) {
        yEndCoordinateEdges.put(key, orderOnVertices.length + 1);
        yStartCoordinateEdges.put(key, 0);
    });

    this.diagram.diagramSignature.nCells.each(function(key, value) {
        var min = Number.MAX_VALUE;
        var max = -Number.MAX_VALUE;

        // For every outgoing edge we find out its x coordinate and find the maximum and minimum of those
        value.source.diagram.diagramSignature.nCells.each(function(key2, value2) {
            min = Math.min(min, xCoordinateEdges.get(value.source.map.get(key2)));
            max = Math.max(max, xCoordinateEdges.get(value.source.map.get(key2)));
            // Set the end coordinate of the given edge (as it is in the source of this vertex)
            yEndCoordinateEdges.put(value.source.map.get(key2), yCoordinateVertices.get(key));
        });
        // Similarly for all incoming edges, we find the overall maximum and minimum
        value.target.diagram.diagramSignature.nCells.each(function(key2, value2) {
            min = Math.min(min, xCoordinateEdges.get(value.target.map.get(key2)));
            max = Math.max(max, xCoordinateEdges.get(value.target.map.get(key2)));
            // Set the start coordinate of the given edge (as it is in the target of this vertex)
            yStartCoordinateEdges.put(value.target.map.get(key2), yCoordinateVertices.get(key));
        });
        if (min == Number.MAX_VALUE) { // The vertex has no outgoing or incoming edges i.e. it is a scalar 
            min = xCoordinateEdges.get(key);
            max = xCoordinateEdges.get(key);
        }
        LayoutVertices.put(key, [min, max, yCoordinateVertices.get(key)]);
    });

    // Gather coordinates for edges
    this.diagram.diagramSignature.sigma.nCells.each(function(key, value) {
        LayoutEdges.put(key, [xCoordinateEdges.get(key), yStartCoordinateEdges.get(key), yEndCoordinateEdges.get(key)])
    }.bind(this));


    // Determine which grid squares correspond to which 0-cells, this association is kept track of in the hashtable LayoutRegions

    // First, necessary to calculate the boundaries of the grid, this is done by considering maximum x, y coordinates of edges
    var maxY = -1;
    var maxX = -1;

    this.diagram.diagramSignature.sigma.nCells.each(function(key, value) {
        maxX = Math.max(maxX, xCoordinateEdges.get(key));
        maxY = Math.max(maxY, yEndCoordinateEdges.get(key));
    });
    LayoutVertices.each(function(key, value) {
        maxX = Math.max(maxX, value[1]);
        maxY = Math.max(maxY, value[2] + 1);
    });

    maxX++; // Pad an additional unit of space on the right hand side

    /*
    For each 1x1 square in the grid (represented by its bottom left coordinates) we determine the 0-cell it belongs to.
    To do that, we first determine what edges are at the same y-height, then we figure out what is the closest edge to the right (tempOneCellSource).
    This may however not exist (if the region is not a source of any edge). Because of that, we additionally need to keep track of the closest
    edge to the left (tempOneCellTarget). At least one of these 2 edges is guaranteed to exist. Finally, we figure out what the type of the 0-cell is and
    put the grid square in an array associated with this 0-cell in the hashtable LayoutRegions
    */
    var tempGridLayout = new Hashtable();
    for (var i = 0; i < maxY; i++) {
        for (var j = 0; j < maxX; j++) {
            var tempOneCellSource = null;
            var tempOneCellTarget = null;

            this.diagram.diagramSignature.sigma.nCells.each(function(key, value) {
                if (yStartCoordinateEdges.get(key) <= i && i < yEndCoordinateEdges.get(key) && j >= xCoordinateEdges.get(key)) {
                    if (tempOneCellTarget === null) {
                        tempOneCellTarget = key
                    }
                    else if (xCoordinateEdges.get(key) > xCoordinateEdges.get(tempOneCellTarget)) {
                        tempOneCellTarget = key;
                    }
                }
                else if (yStartCoordinateEdges.get(key) <= i && i < yEndCoordinateEdges.get(key) && j < xCoordinateEdges.get(key)) {
                    if (tempOneCellSource === null) {
                        tempOneCellSource = key
                    }
                    else if (xCoordinateEdges.get(key) < xCoordinateEdges.get(tempOneCellSource)) {
                        tempOneCellSource = key;
                    }
                }
            });

            var tempZeroCel;
            if (tempOneCellTarget != null) {
                tempZeroCel =
                    this.diagram.diagramSignature.sigma.nCells.get(tempOneCellTarget).target.map.get(
                        this.diagram.diagramSignature.sigma.nCells.get(tempOneCellTarget).target.diagram.diagramSignature.nCells.keys()[0]);
            }
            else if (tempOneCellSource != null) {
                tempZeroCel =
                    this.diagram.diagramSignature.sigma.nCells.get(tempOneCellSource).source.map.get(
                        this.diagram.diagramSignature.sigma.nCells.get(tempOneCellSource).source.diagram.diagramSignature.nCells.keys()[0]);
            }
            else {
                // Here we assign the Zero cell the same as for the region directly below - this is not yet complete - reexamine  

                // Find the appropriate 0-cell label, and chase it up to the top level
                var tt_id = this.diagram.targetBoundary.diagram.targetBoundary.diagram.diagramSignature.nCells.keys()[0];
                var t_id = this.diagram.targetBoundary.diagram.targetBoundary.map.get(tt_id);
                var id = this.diagram.targetBoundary.map.get(t_id);
                tempZeroCel = id;

                /*
                LayoutRegions.each(function(key, value) {
                    for (var k = 0; k < value.length; k++) {
                        if (value[k] === [i - 1, j]) {
                            tempZeroCell = key;
                        }
                    }
                });
                */
            }
            var tempGridElements = LayoutRegions.get(tempZeroCel);

            if (tempGridElements === null) {
                tempGridElements = new Array();
            }
            tempGridElements.push([j, i]);

            LayoutRegions.put(tempZeroCel, tempGridElements);
        }
    }

    return {
        regions: LayoutRegions,
        edges: LayoutEdges,
        vertices: LayoutVertices,
        bounds: {
            min_x: 0,
            max_x: maxX,
            min_y: 0,
            max_y: maxY
        }
    };
}

/* 
At this stage:
    - for 2D graphics: 2DLayoutEdges and 2DLayoutVertices contain all the necessary information to print a 2-diagram
    
Below, we use canvas to demonstrate what 2D printing could look like, one three.js is incorporated into the project, this
method will feed the necessary layout data into it
*/

/*

    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    //Create regions with different colors
    var red, green, blue;
    var random;
    LayoutRegions.each(function (key, value) {
        // Generate colours at random
        blue = (Math.floor(Math.random() * 1000)) % 256;
        red = (Math.floor(Math.random() * 1000)) % 256;
        green = (Math.floor(Math.random() * 1000)) % 256;
        ctx.fillStyle = "rgb(" + red + ", " + green + ", " + blue + ")";

        for (var i = 0; i < value.length; i++) {
            ctx.fillRect(value[i][0] * 100 + 100, value[i][1] * 100, 100, 100);
        }
        ctx.stroke();
    }.bind(this));
    ctx.fillStyle = "rgb(0, 0, 0)";

    LayoutEdges.each(function (key, value) {
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(value[0] * 100 + 100, value[1] * 100);
        ctx.lineTo(value[0] * 100 + 100, value[2] * 100);
        ctx.fillText(this.map.get(key), value[0] * 100 + 100 + 5, value[2] * 100 - 25);
        // Prints names of regions assuming that the typing function on 0-diagrams is the identity function
        ctx.fillText(this.map.get(this.diagram.diagramSignature.sigma.nCells.get(key).source.map.get(
            this.diagram.diagramSignature.sigma.nCells.get(key).source.diagram.diagramSignature.nCells.keys()[0])), value[0] * 100 + 100 - 10, value[2] * 100 - 45);
        ctx.fillText(this.map.get(this.diagram.diagramSignature.sigma.nCells.get(key).target.map.get(
            this.diagram.diagramSignature.sigma.nCells.get(key).target.diagram.diagramSignature.nCells.keys()[0])), value[0] * 100 + 100 + 10, value[2] * 100 - 45);
        ctx.stroke();
    }.bind(this));


    LayoutVertices.each(function (key, value) {
        var epsilon = 0;
        if (value[0] === value[1]) {
            epsilon = 25
        }
        ctx.strokeStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(value[0] * 100 + 100 - epsilon, value[2] * 100 - 25);
        ctx.lineTo(value[1] * 100 + 100 + epsilon, value[2] * 100 - 25);
        ctx.lineTo(value[1] * 100 + 100 + epsilon, value[2] * 100 + 25);
        ctx.lineTo(value[0] * 100 + 100 - epsilon, value[2] * 100 + 25);
        ctx.lineTo(value[0] * 100 + 100 - epsilon, value[2] * 100 - 25);
        ctx.fillText(this.map.get(key), value[0] * 100 + 100 + 35, value[2] * 100 + 5);

        ctx.stroke();
    }.bind(this));
*/
//  console.log(JSON.stringify([LayoutRegions, LayoutEdges, LayoutVertices]));
