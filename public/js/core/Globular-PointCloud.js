/*
    Turns a diagram into a point cloud
*/

/*
Diagram.prototype.getRandomPoint = function() {
    var h = Math.random() * (this.generators.length + 1);
    var diagram_level = Math.floor(h + 0.5);
    var subdiagram = this.getSlice(diagram_level);
    var command = this.generators[Math.floor(h)];
    var generator = gProject.signature.getGenerator(command.id);
    var size;
    var coordinate = command.coordinate;

    if (h - Math.floor(h) < 0.5) {
        // We care about the source
        size = generator.source.getFullDimensions();
    }
    else {
        size = generator.target.getFullDimension();
    }
    var scale_factor = 2 * Math.abs(h - Math.floor(h) - 0.5);
    var subdiagram_point = subdiagram.getRandomPointCompress(coordinate, size, scale_factor);
    var
}
*/

// Gets a random point from a subfeature of the given dimension
Diagram.prototype.getRandomPoint = function(dimension) {
    if (dimension == this.getDimension()) {
        var height = Math.floor(Math.random() * this.generators.length);
        
    }
}

// Calculate the total volume of things of each dimension
Diagram.prototype.calculateTotalVolume = function(dimension) {
    if (dimension == diagram.getDimension()) {
        return this.generators.length;
    }
    
}