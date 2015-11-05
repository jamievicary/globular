"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-S family
// This is naturality for the 4-cell pull-through

RegisterSingularityFamily(
    'IntLS', 5,
    ['Int-L-S', 'Int-L-SI',
    'IntI-L-S', 'IntI-L-SI',
    'Int-LI-S', 'Int-LI-SI',
    'IntI-LI-S', 'IntI-LI-SI',
    'Int-R-S', 'Int-R-SI',
    'IntI-R-S', 'IntI-R-SI',
    'Int-RI-S', 'Int-RI-SI',
    'IntI-RI-S', 'IntI-RI-SI']
);

Diagram.prototype.getSou

/*
Diagram.prototype.rewriteAllowed.IntLS = function(type, key) {

    // Basic check on the key
    if (key >= this.nCells.length) return false;
    if (key < 0) return false;
    var key_cell = this.nCells[key];

    if (type == 'Int-L-S') {

        // Get the dimensions of the source of the key cell
        var source_height;
        var source_width;
        if (key_cell.id.isInterchanger()) {
            var slice = this.getSlice(key);
            var bbox = slice.getInterchangerBoundingBox(type);
            source_height = bbox[1];
            source_width = bbox[0];
        } else {
            var source = gProject.signature.getGenerator(key_cell.id).getSource();
            source_height = source.nCells.length;
            source_width = source.getSourceBoundary().nCells.length;
        }

        // Get the starting point of the chain
        var start = this.getInterchangerCoordinates(type, key);
        if (start == null) return false;
        var start_slice = this.getSlice(start.last());

        // Build up the template and verify
        var template = start_slice.expand('Int-L', start.penultimate(), [source_width, source_height], 1);
        template = template.concatenate([key_cell]);
        return this.instructionsEquiv(this.nCells.slice(start.last(), start.last() + template.length), template);

    } else {

        console.log("rewriteAllowed: Singularity type " + type + " not yet supported");
        return false;
    }

}
*/

//Diagram.prototype.getInterchangerCoordinates.IntLS = function(type, key) {
Diagram.prototype.getGeometry.IntLS = function(type, key) {

    // eg: return [[1,1]]
    var key_cell = this.nCells[key.last()];
    if (type != 'Int-L-S') {
        console.log("getInterchangerCoordinates: singularity type " + type + " not yet supported");
        return null;
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
    
    var key_slice = this.getSlice(key.last());
    var rewind_template = key_slice.expand('Int-LI', key_cell.coordinates.last(), [source_source_width, source_height], 1);
    if (rewind_template == null) return null;
    
    // Get the coordinates
    var c = [key.penultimate() - 1, key_cell.coordinates.last() - source_source_width, key.last() - rewind_template.length];
    
    // Get the bounding box
    var top_length = key.last() - c.end(0) + 1;
    var first_slice_height = source_height + 
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

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData.IntLS = function(type, key) {}

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLS = function(drag) {
    if (this.dimension < 4) return null;
    return null;
}

/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {
    
}
*/
