"use strict";

/*

Graph class

Comments to be added
*/


function Graph() {
    this.nodes = new Hashtable();
}

Graph.prototype.getType = function() {
    return 'Graph';
}

Graph.prototype.addNode = function(nodeId) {
    if (this.nodes.get(nodeId) === null)
        this.nodes.put(nodeId, new Array());
};

Graph.prototype.removeNode = function(nodeId) {
    this.nodes.remove(nodeId);
    this.nodes.each(function(key, value) {
        for (var i = 0; i < value.length; i++) {
            if (value[i] === nodeId) {
                value.splice(i, 1);
            }
        }
    });
};

Graph.prototype.isNodePresent = function(nodeId) {
    if (this.nodes.containsKey(nodeId))
        return true;
    return false;
};

// Adds an edge only if both the source and the target vertex have already been added
Graph.prototype.addEdge = function(outNodeId, inNodeId) {
    if (this.nodes.containsKey(outNodeId) && this.nodes.containsKey(inNodeId)) {
        var tempArray = this.nodes.get(outNodeId);
        this.nodes.remove(outNodeId);
        tempArray.push(inNodeId);
        this.nodes.put(outNodeId, tempArray);
    }
};

Graph.prototype.removeEdgeIgnoreNull = function(outNodeId, inNodeId) {
    if (outNodeId == null) return;
    if (inNodeId == null) return;
    if (this.nodes.get(outNodeId) == null) return;
    return this.removeEdge(outNodeId, inNodeId);
}

Graph.prototype.removeEdge = function(outNodeId, inNodeId) {

    var tempArray = this.nodes.get(outNodeId);
    this.nodes.remove(outNodeId);
    for (var i = 0; i < tempArray.length; i++) {
        if (tempArray[i] === inNodeId)
            tempArray.splice(i, 1);
    }
    this.nodes.put(outNodeId, tempArray);

};

// A precondition for this procedure is that both outNodeId, inNodeId are already in the graph 
Graph.prototype.isEdgePresent = function(outNodeId, inNodeId) {
    var tempArray = this.nodes.get(outNodeId);
    if (tempArray == null) {
        var x = 1;
    }
    for (var i = 0; i < tempArray.length; i++) {
        if (tempArray[i] === inNodeId) {
            return true;
        }
    }
    return false;
};


Graph.prototype.getNodeSuccessors = function(nodeId) {
    return this.nodes.get(nodeId);
};

Graph.prototype.getNodePredecessors = function(nodeId) {
    var predecessors = new Array();
    this.nodes.each(function(key, value) {
        for (var i = 0; i < value.length; i++)
            if (value[i] === nodeId)
                predecessors.push(key);
    }.bind(this));
    return predecessors;
};

Graph.prototype.bfs = function(nodeId) {
    var queue = new Queue();
    var visited = new Array();
    // Return empty set if the node is not included in the graph
    if (this.isNodePresent(!nodeId)) {
        return visited;
    }
    visited.push(nodeId);
    queue.enqueue(nodeId);
    while (!queue.isEmpty()) {
        var temp = queue.dequeue();
        // Here perform operations on the node
        var tempArray = this.nodes.get(temp);
        for (var i = 0; i < tempArray.length; i++) {
            var flag = false;
            for (var j = 0; j < visited.length; j++) {
                if (visited[j] === tempArray[i]) {
                    flag = true;
                }
            }
            if (!flag) {
                visited.push(tempArray[i]);
                queue.enqueue(tempArray[i]);
            }
        }
    }
    return visited;
};

Graph.prototype.pathExists = function(outNodeId, inNodeId) {
    var set = this.bfs(outNodeId);
    for (var i = 0; i < set.length; i++) {
        if (set[i] == inNodeId) {
            return true;
        }
    }
    return false;
};

Graph.prototype.isNodeTerminal = function(nodeId) {
    if (this.nodes.get(nodeId).length === 0)
        return true;
    return false;
};

Graph.prototype.isNodeInitial = function(nodeId) {
    if (this.getNodePredecessors(nodeId).length === 0) {
        return true;
    }
    return false;
};

Graph.prototype.getTerminalElements = function() {
    var terminal = new Array();
    var tempKeys = this.nodes.keys();
    for (var i = 0; i < tempKeys.length; i++) {
        if (this.isNodeTerminal(tempKeys[i])) {
            terminal.push(tempKeys[i]);
        }
    }
    return terminal;
};

Graph.prototype.getInitialElements = function() {
    var initial = new Array();
    var tempKeys = this.nodes.keys();
    for (var i = 0; i < tempKeys.length; i++) {
        if (this.isNodeInitial(tempKeys[i])) {
            initial.push(tempKeys[i]);
        }
    }
    return initial;
}

Graph.prototype.rename = function(renaming) {
    this.nodes.each(function(key, value) {
        var tempArray = this.nodes.get(key);
        for (var i = 0; i < tempArray.length; i++) {
            if (renaming.get(tempArray[i]) != null) {
                tempArray[i] = renaming.get(tempArray[i]);
            }
        }
        // Remove the existing entry and replace it with renamed vertices (two alternatives depending on whether the node itself gets renamed)
        this.nodes.remove(key);
        if (renaming.get(key) != null) {
            this.nodes.put(renaming.get(key), tempArray);
        }
        else {
            this.nodes.put(key, tempArray);
        }
    }.bind(this));
}

Graph.prototype.totalOrder = function() {
    var totalOrder = new Array();
    if (this.nodes.keys().length === 0) {
        return totalOrder;
    }
    var tempArray = this.getInitialElements();
    if (tempArray.length != 1) {
        return null;
    }
    // Do not think about using 'pop' method here - that caused a whole bunch of problems with destroying the structure
    var varNode = tempArray[0];
    totalOrder.push(varNode);
    while (this.getNodeSuccessors(varNode).length != 0) {
        if (this.getNodeSuccessors(varNode).length != 1) {
            return null; // not a total order
        }
        varNode = this.getNodeSuccessors(varNode)[0];
        totalOrder.push(varNode);
    }
    return totalOrder;
};

Graph.prototype.copy = function() {

    var tempGraph = new Graph();
    this.nodes.each(function(key, value) {
        tempGraph.addNode(key);
    });

    this.nodes.each(function(key, value) {
        for (var i = 0; i < value.length; i++)
            tempGraph.addEdge(key, value[i]);
    });
    return tempGraph;
};

Graph.prototype.topologicalSort = function() {

    var tempGraph = this.copy();
    var topologicallySorted = new Array();
    var initial = tempGraph.getInitialElements();
    while (initial.length != 0) {
        var varNode = initial.shift();
        topologicallySorted.push(varNode);
        var tempArray = new Array();
        for (var i = 0; i < tempGraph.nodes.get(varNode).length; i++) {
            tempArray.push(tempGraph.nodes.get(varNode)[i]);
        }
        for (var i = 0; i < tempArray.length; i++) {
            tempGraph.removeEdge(varNode, tempArray[i]);
            if (tempGraph.isNodeInitial(tempArray[i])) {
                initial.push(tempArray[i]);
            }
        }
    }
    this.nodes.each(function(key, value) {
        if (value.length != 0)
            return false;
    });
    return topologicallySorted;
};

// Calculates for each node the longest path leading to that node, then returns the maximum of those
Graph.prototype.longestPath = function() {

    var paths = new Hashtable();
    var topologicalOrder = this.topologicalSort();
    for (var i = 0; i < topologicalOrder.length; i++) {
        var predecessors = this.getNodePredecessors(topologicalOrder[i]);
        var max = -1;
        for (var j = 0; j < predecessors.length; j++) {
            if (paths.get(predecessors[j]) > max) {
                max = paths.get(predecessors[j]);
            }
        }
        max++;
        paths.put(topologicalOrder[i], max);
    }
    return paths;
};

Graph.prototype.connectedComponents = function() {
    var representatives = new Hashtable();
    var visited = new Array();
    this.nodes.each(function(key, value) {
        var flag = false;
        for (var i = 0; i < visited.length; i++) {
            if (key === visited[i]) {
                flag = true;
            }
        }
        if (!flag) {
            var tempVisited = this.bfs(key);
            for (var j = 0; j < tempVisited.length; j++) {
                representatives.put(tempVisited[j], tempVisited[0]); // We put an arbitrary element as the representative of the connected component
                // Now we can just mark all elements of the tempVisited array as visited, they cannot belong to more than one connected component
                visited.push(tempVisited[j]);
            }
        }
    }.bind(this));
    return representatives;
};