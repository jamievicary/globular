"use strict";

/*
PartialOrder Class

*/


function PartialOrder() {
    this.graph = new Graph();
};

PartialOrder.prototype.getType = function () {
    return 'PartialOrder';
}

// Adds an element to the partial order
PartialOrder.prototype.addElement = function (elementId) {
    if (!this.graph.isNodePresent(elementId))
        this.graph.addNode(elementId);
};

// Checks whether the given element is in the Partial Order
PartialOrder.prototype.isElementPresent = function (elementId) {
    return this.graph.isNodePresent(elementId);
};

// Removes an element from the partial order
PartialOrder.prototype.removeElement = function (elementId) {
    this.graph.removeNode(elementId);
};

// Relates two elements in this partial order, if edge is not already present
PartialOrder.prototype.addRelation = function (inElementId, outElementId) {
    if(inElementId === null || outElementId === null){
        return;
    } 
    if(inElementId === undefined || outElementId === undefined){
        return;
    } 
    if (!this.areRelatedTransitive(inElementId, outElementId)){
        this.graph.addEdge(inElementId, outElementId);
        this.ensureMinimumTransitivity(outElementId);
    }
};

// Relates two elements in this partial order, if edge is not already present
PartialOrder.prototype.removeRelation = function (inElementId, outElementId) {
    if (this.graph.isEdgePresent(inElementId, outElementId))
        this.graph.removeEdge(inElementId, outElementId);
};

// Makes all the elements in the successors array successors of the given element (provided both elements already are members of this partial order)
PartialOrder.prototype.addSuccessors = function (elementId, successors) {
    for (var i = 0; i < successors.length; i++) {
        this.addRelation(elementId, successors[i]);
    }
};

// Makes all the elements in the predecessors array predecessors of the given element (provided both elements already are members of this partial order)
PartialOrder.prototype.addPredecessors = function (elementId, predecessors) {
    for (var i = 0; i < predecessors.length; i++) {
        this.addRelation(predecessors[i], elementId);
    }
};

// Returns the set of successors (in this partial order) of a given element
PartialOrder.prototype.getElementSuccessors = function (elementId) {
    var successors = new Array();
    var tempArray = this.graph.getNodeSuccessors(elementId);
    for (var i = 0; i < tempArray.length; i++) {
        successors.push(tempArray[i]);
    }
    return successors;
};

// Returns the set of successors (in this partial order) of a given set of elements
PartialOrder.prototype.getSetSuccessors = function (elements) { // elements is an Array
    var successors = new Array();
    for (var i = 0; i < elements.length; i++) {
        var tempArray = this.getElementSuccessors(elements[i]);
        for (var j = 0; j < tempArray.length; j++) {
            if (successors.indexOf(tempArray[j]) === -1) {
                if (elements.indexOf(tempArray[j]) === -1) {
                    successors.push(tempArray[j]);
                }
            }
        }
    }
    return successors;
};

// Returns the set of predecessors (in this partial order) of a given element
PartialOrder.prototype.getElementPredecessors = function (elementId) {
    var predecessors = new Array();
    var tempArray = this.graph.getNodePredecessors(elementId);
    for (var i = 0; i < tempArray.length; i++) {
        predecessors.push(tempArray[i]);
    }
    return predecessors;
};

// Returns the set of predecessors (in this partial order) of a given set of elements
PartialOrder.prototype.getSetPredecessors = function (elements) { // elements is an Array
    var predecessors = new Array();
    for (var i = 0; i < elements.length; i++) {
        var tempArray = this.getElementPredecessors(elements[i]);
        for (var j = 0; j < tempArray.length; j++) {
            if (predecessors.indexOf(tempArray[j]) === -1) {
                if (elements.indexOf(tempArray[j]) === -1) {
                    predecessors.push(tempArray[j]);
                }
            }
        }
    }
    return predecessors;
};

PartialOrder.prototype.transitiveClosure = function () {
    var closure = this.copy();
    this.graph.nodes.each(function(key, value){
        var tempArray = this.graph.bfs(key);
        for(var i = 0; i < tempArray.length; i++){
            if(tempArray[i] === key){
                tempArray.splice(i, 1);
            }
        }
        closure.graph.nodes.remove(key);
        closure.graph.nodes.put(key, tempArray);
    }.bind(this));
    return closure;
};

PartialOrder.prototype.regainMinimalTransitivity = function () {
        this.graph.nodes.each(function(key, value){
            this.ensureMinimumTransitivity(key);
        }.bind(this));
};


// Renames the elements in the partial order according to the supplied hashtable
PartialOrder.prototype.rename = function (renaming) {
    this.graph.rename(renaming);
    // Need to not only relabel the elements themselves, but also all the references    

};

// Returns the set of all terminal elements of this partial order (i.e. elements that do not have any successors)
PartialOrder.prototype.getTerminalElements = function () {
    return this.graph.getTerminalElements();
};

// Returns the set of all initial elements of this partial order (i.e. elements that do not have any predecessors)
PartialOrder.prototype.getInitialElements = function () {
    return this.graph.getInitialElements();
};

// Returns all elements in the partial order in a array, ordered in an unspecified manner
PartialOrder.prototype.getElements = function () {
    return this.graph.nodes.keys();
};

/*
Adds all elements of the added partial order that are not already in this partial order
If elements in the added partial order have already been renamed, procedure may be used for taking unions
*/
PartialOrder.prototype.union = function (addedPartialOrder) {
    var addedElements = addedPartialOrder.graph.nodes.keys();

    for (var i = 0; i < addedElements.length; i++) {
        this.addElement(addedElements[i]);
    }

    for (var i = 0; i < addedElements.length; i++) {
        this.addPredecessors(addedElements[i], addedPartialOrder.getElementPredecessors(addedElements[i]));
        this.addSuccessors(addedElements[i], addedPartialOrder.getElementSuccessors(addedElements[i]))
    }
};

PartialOrder.prototype.unionRenaming = function (addedPartialOrder, renaming) {
    var unionedPartialOrder = new PartialOrder();

    // We create copies of both partial orders to be unioned and rename them using the renaming provided
    var tempThisPartialOrder = this.copy();
    var tempAddedPartialOrder = addedPartialOrder.copy();
    tempThisPartialOrder.rename(renaming);
    tempAddedPartialOrder.rename(renaming);

    var elements = tempThisPartialOrder.graph.nodes.keys();
    var addedElements = addedPartialOrder.graph.nodes.keys();

    /* 
    First we add elements from both partial orders taking into account the renaming   
    If an element is not present in the renaming function, then it is added without any further   
    */
    for (var i = 0; i < elements.length; i++) {
        if (!unionedPartialOrder.isElementPresent(elements[i])) {
            unionedPartialOrder.addElement(elements[i]);
        }
    }
    for (var i = 0; i < addedElements.length; i++) {
        if (!unionedPartialOrder.isElementPresent(addedElements[i])) {
            unionedPartialOrder.addElement(addedElements[i]);
        }
    }

    // We add relations, since a relation is only added if it's not already present in the Partial Order, this gives us a union
    for (var i = 0; i < elements.length; i++) {
        unionedPartialOrder.addPredecessors(elements[i], tempThisPartialOrder.getElementPredecessors(elements[i]));
        unionedPartialOrder.addSuccessors(elements[i], tempThisPartialOrder.getElementSuccessors(elements[i]))
    }

    for (var i = 0; i < addedElements.length; i++) {
        unionedPartialOrder.addPredecessors(addedElements[i], tempAddedPartialOrder.getElementPredecessors(addedElements[i]));
        unionedPartialOrder.addSuccessors(addedElements[i], tempAddedPartialOrder.getElementSuccessors(addedElements[i]))
    }

    return unionedPartialOrder;
};

// We change the definition, this is to ensure that these two nodes are not related in the transitive closure
PartialOrder.prototype.areRelatedTransitive = function (outNodeId, inNodeId) {
    var tempArray = this.graph.bfs(outNodeId);
    for(var i = 0; i < tempArray.length; i++){
        if(tempArray[i] === inNodeId){
            return true;
        }
    }
    return false;
};

// Ensure that adding this edge will not create an immediate transitive cycle elsewhere in the graph
PartialOrder.prototype.ensureMinimumTransitivity = function (inNodeId) {

    // All potential edges that we may have to remove (immediate predecessors)
    var tempElements = this.getElementPredecessors(inNodeId); 
    var copyPartialOrder = this.copy();
    for(var i = 0; i < tempElements.length; i++){
        var flag = false;
        copyPartialOrder.removeRelation(tempElements[i], inNodeId);
        var tempReachable = copyPartialOrder.graph.bfs(tempElements[i]);
        for(var k = 0; k < tempReachable.length; k++){
            if(tempReachable[k] === inNodeId){
                flag = true;
            }
        }
        if(!flag){
            copyPartialOrder.graph.addEdge(tempElements[i], inNodeId);
        }
        else{
        this.removeRelation(tempElements[i], inNodeId);
        }
    }
};

PartialOrder.prototype.areRelated = function (outNodeId, inNodeId) {
    return this.graph.isEdgePresent(outNodeId, inNodeId);
}

// If this partial order is in fact a total order, returns the total order as an ordered array
PartialOrder.prototype.getTotalOrder = function () {
    return this.graph.totalOrder();
};

PartialOrder.prototype.appendTotalOrder = function (partialOrder) {

    var tempAppendedTotalOrder = partialOrder.getTotalOrder(); // Array
    var thisTotalOrder = this.getTotalOrder();
    var terminalElement = this.getTerminalElements()[0];

    if (tempAppendedTotalOrder != null && thisTotalOrder != null) {
        for (var i = 0; i < tempAppendedTotalOrder.length; i++)
            this.addElement(tempAppendedTotalOrder[i]);
        // Add a relation between the unique terminal element of this total order and the initial element of the added total order
        // if the appended totalOrder is nonempty
        if (tempAppendedTotalOrder.length != 0 && thisTotalOrder.length != 0) {
            this.addRelation(terminalElement, tempAppendedTotalOrder[0]);
        }

        // Add the (n-1) relations between elements of the added total order
        for (var i = 1; i < tempAppendedTotalOrder.length; i++)
            this.addRelation(tempAppendedTotalOrder[i - 1], tempAppendedTotalOrder[i]);
    } else {
        return null; // Turn this into some informative exception   
    }
};

PartialOrder.prototype.longestPath = function () {
    return this.graph.longestPath();
};

PartialOrder.prototype.copy = function () {
    var tempPartialOrder = new PartialOrder();
    tempPartialOrder.graph = this.graph.copy();
    return tempPartialOrder;
};