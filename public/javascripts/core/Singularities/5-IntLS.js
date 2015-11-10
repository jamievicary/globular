"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-S family
// This is naturality for the 4-cell pull-through

RegisterSingularityFamily({
    family: 'IntLS',
    dimension: 5,
    members: ['Int-L-S', 'Int-L-SI',
    'IntI-L-S', 'IntI-L-SI',
    'Int-LI-S', 'Int-LI-SI',
    'IntI-LI-S', 'IntI-LI-SI',
    'Int-R-S', 'Int-R-SI',
    'IntI-R-S', 'IntI-R-SI',
    'Int-RI-S', 'Int-RI-SI',
    'IntI-RI-S', 'IntI-RI-SI']
});

Diagram.prototype.getSource.IntLS = function(type, key) {
    
    var coord = this.getInterchangerCoordinates(type, key);
    var cell = this.nCells[key.last()];
    var box = this.getSliceBoundingBox(key.last())

    var x = key.last();
    var y = box.min.penultimate();
    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    
    var source = this.getSlice(coord.last()).expand('Int-L', {up: x, across: y, length: l}, n, m).concat([cell])
    
    if (type == 'Int-L-S') return {
        list: source,
        key: source.length - 1
    }
    if (type == 'Int-L-SI') return [cell].concat(this.rewrite(cell).expand('Int-L', x + 1, y, n, l, m));
    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
}

Diagram.prototype.getTarget.IntLS = function(type, key) {
    
    var coord = this.getInterchangerCoordinates(type, key);
    var cell = this.nCells[key.last()];
    var box = this.getSliceBoundingBox(key.last())


    var x = coord.penultimate();
    var y = coord.end(2); // 3rd from the en
    var n = this.target_size(key.last());
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    
    if (type == 'Int-L-S') return [cell.move([{relative: -1}, {absolute: coord.penultimate()}])].concat(
        this.getSlice(coord.last()).rewrite(cell).expand('Int-L', {up: x, across: y, length: l}, n, m));
    if (type == 'Int-L-SI') return this.getSlice(coord.last()).expand('Int-L', expand_data, 1, coord).push(cell);
    alert ('Interchanger ' + type + ' not yet handled');
    throw 0;
}

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData.IntLS = function(type, key) {
    return this.getTarget(type, key);
}

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLS = function(drag) {
    var up = drag.directions[0] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(up ? ['Int-L-SI'] : ['Int-L-S'], key);

    // Collect the possible options
    var possible_options = [];
    var msg = 'interpretDrag.IntLS: allowed ';
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            msg += (possible_options.length != 0 ? ', ' : '') + options[i].type;
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) {
        console.log('interpretDrag.IntLS: no moves allowed');
        return null;
    }
    console.log(msg);
    return possible_options[0];
};

Diagram.prototype.interchangerAllowed.IntLS = function(type, key) {

    // Is the key cell well-separated from the adjacent structure?
   
// if (!this.wellSeparated.IntLS(type, key)) return false;

    // See if the source of the rewrite is a subset of the diagram instruction list

    
    return this.subinstructions(key, this.getSource(type, key));
}

// Check if there is enough separation between the components involved,
// a necessary extra check when scalars are involved
Diagram.prototype.wellSeparated.IntLS = function(type, key) {
    // KRZYSZTOF, WE NEED TO DISCUSS THIS
}

Diagram.prototype.getInterchangerCoordinates.IntLS = function(type, key) {
    
    var diagram_pointer = this;
    var h = key.last();
    var cell = this.nCells[h];
    var coords = cell.coordinates.slice(0);
    coords.push(h);
    
    if (type.tail('IntI-L-S', 'Int-L-S')) {
        return coords; //coords.move([{relative: -1}, {relative: -this.source_size(h)}]);
    }
}

/*
Diagram.prototype.getGeometry.IntLS = function(type, key) {

    // eg: return [[1,1]]
    var key_cell = this.nCells[key.last()];
    if (type != 'Int-L-S') {
        console.log("getInterchangerCoordinates: singularity type " + type + " not yet supported");
        throw 0;
    }

    // Assuming type == 'Int-L-S'
    var source_height;
    var source_source_width;
    var source_target_width;
    if (key_cell.id.isInterchanger()) {
        var slice = this.getSlice(key.last());
        var bbox = slice.getInterchangerBoundingBox(type);
        source_height = bbox[1];
        source_source_width = bbox[0];
        source_target_width
    } else {
        var source = gProject.signature.getGenerator(key_cell.id).getSource();
        source_height = source.nCells.length;
        source_source_width = source.getSourceBoundary().nCells.length;
    }
}

Diagram.prototype.getInterchangerBoundingBox.IntLS = function(type, key) {

    var c = this.getInterchangerCoordinates(type, key);
    if (c == null) return null;
    
    var top_length = key.last() - c.end(0) + 1;

    // eg: return [[1,1]]
    var key_cell = this.nCells[key.last()];
    if (type != 'Int-L-S') {
        console.log("getInterchangerCoordinates: singularity type " + type + " not yet supported");
        return null;
    }

    // Assuming type == 'Int-L-S'
    var source_height;
    var source_width;
    if (key_cell.id.isInterchanger()) {
        var slice = this.getSlice(key.last());
        var bbox = slice.getInterchangerBoundingBox(type);
        source_height = bbox[1];
        source_width = bbox[0];
    } else {
        var source = gProject.signature.getGenerator(key_cell.id).getSource();
        source_height = source.nCells.length;
        source_width = source.getSourceBoundary().nCells.length;
    }
    
    var key_slice = this.getSlice(key.last());
    var rewind_template = key_slice.expand('Int-LI', key_cell.coordinates.last(), [source_width, source_height], 1);
    if (rewind_template == null) return null;
    
    // Return data
    return [key.penultimate() - 1, key_cell.coordinates.last() - source_width, key.last() - rewind_template.length];

}
*/

/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {
    
}
*/
