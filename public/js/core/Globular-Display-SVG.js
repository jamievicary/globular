
class DisplaySVG {

    constructor() {
        this.container = null;
        this.selectPixels = null;
        this.diagram = null;
        this.manager = null;
        this.customView = false;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    setup(manager) {
        this.manager = manager;
        this.container = $(this.manager.container);

        this.container
            .mousedown(this.onMouseDown)
            .mouseup(this.onMouseUp)
            .mousemove(this.onMouseMove);
    }

    dispose() {
        this.container.empty();
        this.container.off();
    }

    getMaximumDimension() {
        return 2;
    }

    enableMouse() {
        this.container.css('pointer-events', 'all');
    }

    disableMouse() {
        this.container.css('pointer-events', 'none');
    }

    onMouseDown(event) {
        // Only interact with left mouse button
        if (event.buttons != 1) return;
        if (!gProject.initialized) return;
        if (this.diagram == null) return;

        // Check we're within the bounds    
        let b = $(this.container)[0].bounds;
        let pixels = eventToPixels(event);
        let logical = this.pixelsToGrid(pixels);
        if (logical == null || !this.isInBounds(logical)) return;

        // Store the screen coordinates of the click
        this.selectPixels = pixels;
        this.selectPosition = this.getLogicalLocation(event);
    }

    onMouseUp(event) {
        if (this.selectPixels == null) return;

        let position = this.getLogicalLocation(event);
        if (position == null) {
            this.selectPixels = null;
            this.selectPosition = null;
            return;
        }

        position.directions = null;
        gProject.dragCellUI(position);
    }

    onMouseMove(event) {
        if (!gProject.initialized) return;
        if (this.diagram == null) return;

        let pixels = eventToPixels(event);

        this.updatePopup({
            logical: this.getLogicalLocation(event),
            pixels
        });

        if (this.selectPixels == null) return;
        if (event.buttons != 1) {
            this.selectPixels = null;
            return;
        }

        let dx = -(this.selectPixels.x - pixels.x);
        let dy = this.selectPixels.y - pixels.y;

        let threshold = 50;
        if (dx * dx + dy * dy < threshold * threshold) {
            return;
        }


        var data = this.selectPosition;
        this.selectPixels = null;
        this.selectPosition = null;

        // Clicking a 2d picture
        if (this.data.dimension == 2) {
            if (this.data.dimension == this.diagram.getDimension() - 1) {
                // Clicking on an edge
                if (Math.abs(dx) < 0.7 * threshold) return;
                data.directions = [dx > 0 ? +1 : -1];
            } else if (this.data.dimension == this.diagram.getDimension()) {
                // Clicking on a vertex
                if (Math.abs(dy) < 0.7 * threshold) return;
                data.directions = [dy > 0 ? +1 : -1, dx > 0 ? +1 : -1];
            }

            // Clicking a 1d picture
        } else if (this.data.dimension == 1) {
            data.directions = [dx > 0 ? +1 : -1];
        }

        gProject.dragCellUI(data);
    }

    setDiagram(diagram, preserveView = false) {
        console.log(diagram);

        if (diagram == null) {
            this.diagram = null;
            this.data = null;
            this.container.empty();
        } else {
            this.diagram = diagram;
            this.render(preserveView);
        }
    }

    render(preserveView) {
        // Obtain the visible diagram
        this.visibleDiagram = this.manager.getVisibleDiagram();

        // Render SVG
        this.data = globular_render(
            this.container,
            this.visibleDiagram,
            this.highlight,
            this.manager.getSuppress());
        this.svgElement = this.container.find("svg")[0];

        // Update panzoom
        this.updatePanzoom(preserveView);
    }

    createControls() {
        
    }

    updatePanzoom(preserveView) {
        preserveView = this.customView && preserveView;

        // Reset view
        let pan = null;
        let zoom = null;
        if (this.panzoom != null) {
            pan = this.panzoom.getPan();
            zoom = this.panzoom.getZoom();
            this.panzoom.destroy();
        }

        // Create new view
        this.panzoom = svgPanZoom(this.svgElement, {
            onZoom: () => this.customView = true,
            onPan: () => this.customView = true
        });

        // Restore view if neccessary
        if (preserveView) {
            this.panzoom.pan(pan);
            this.panzoom.zoom(zoom);
        }
    }

    getLogicalLocation(event) {
        let pixels = eventToPixels(event);
        let coords = this.pixelsToGrid(pixels);

        // Obtain the information attached to the SVG element
        let target = event.target;
        let type = target.getAttributeNS(null, "element_type");
        let index = Number(target.getAttributeNS(null, "element_index"));
        let index2 = Number(target.getAttributeNS(null, "element_index_2"));
        let element = { type, index, index2 };

        switch (this.data.dimension) {
            case 0: return this.getLogicalLocation0D(element);
            case 1: return this.getLogicalLocation1D(element, coords);
            case 2: return this.getLogicalLocation2D(element, coords);
            default: throw new Error("Illegal display dimension.");
        }
    }

    getLogicalLocation0D({ type }) {
        if (type == "vertex") {
            return this.createLocation([0], [], type);
        }

        return null;
    }

    getLogicalLocation1D({ type, index }, coords) {
        if (type == 'vertex') {
            let vertex = this.data.vertices[index];
            return this.createLocation([vertex.level], [], type);
        }
        
        if (type == "edge") {
            let edge = this.data.edges[index];
            let fringe = this.getFringe(coords);
            let boundaryFlags = [{ source: fringe.left, target: fringe.right }];
            return this.createLocation([edge.level, 0], boundaryFlags, type);
        }

        return null;
    }

    getLogicalLocation2D({ type, index, index2 }, coords) {
            if (type == 'vertex') {
            let vertex = this.data.vertices[index];
            return this.createLocation([vertex.level], [], type);
        }

        // Determine the height of the vertex nearest to the clicked height.
        let height = Math.min(Math.floor(coords.y + 0.5), this.data.vertices.length);

        if (type == 'edge' || type == 'interchanger_edge') {
            let edgesToLeft = type == "edge"
                ? this.edgesLeftOfEdge(index, height)
                : this.edgesLeftOfInterchanger(index, index2, height, coords);
            let fringe = this.getFringe(coords);
            let boundaryFlags = [{ source: fringe.bottom, target: fringe.top }];

            return this.createLocation([height, edgesToLeft - 1], boundaryFlags, type);
        }

        if (type == 'region') {
            // There's insufficient data in the region SVG object to determine
            // the logical position. So we should do something a bit clever,
            // possibly involving using the equation for a cubic to see if we're
            // to the left or right of a region.
            // 
            // For now, what we have is good enough.

            // Count the edges that are to the left of the coordinates
            let edgesAtLevel = this.data.edges_at_level[height];
            let edgesToLeft = edgesAtLevel.filter(edge => this.data.edges[edge].x <= coords.x).length;
            edgesToLeft = Math.max(0, edgesToLeft - 1);

            // When the diagram is projected, we view it sideways with the topmost slice
            // on top; the lower slices are not visible in the diagram. Hence we always
            // point at the topmost slice.
            let depth = Math.max(0, this.visibleDiagram.getSlice([edgesToLeft, height]).cells.length - 1);

            // Traverse into deeper slices until there is a cell present the in
            // the diagram, if neccessary.
            let entityCoordinates = this.visibleDiagram.realizeCoordinate([depth, edgesToLeft, height]).reverse();
            let fringe = this.getFringe(coords);
            let boundaryFlags = [
                { source: fringe.bottom, target: fringe.top },
                { source: fringe.left, target: fringe.right }
            ];

            return this.createLocation(entityCoordinates, boundaryFlags, type);
        }

        return null;
    }

    edgesLeftOfEdge(index, height) {
        let edge = this.data.edges[index];

        // Adjust height to correct for phenomenon that edges can 'protrude'
        // above and below their true vertical bounds.
        if (edge.finish_vertex != null) height = Math.min(height, edge.finish_vertex);
        if (edge.start_vertex != null) height = Math.max(height, edge.start_vertex + 1);
        return this.data.edges_at_level[height].indexOf(index) + 1;
    }

    edgesLeftOfInterchanger(index, index2, height, coords) {
        // The interchanger is a vertex, but appears in the rendering as the crossing of
        // two edges. Hence we first must identify the edge that was actually clicked,
        // which is one of the two source or target edges, depending on the height of
        // the click.
        let effectiveHeight = Math.floor(coords.y + 1);
        let vertex = this.data.vertices[index];
        let relevantEdges;
        let localEdgeIndex;

        if (coords.y <= vertex.intersection.centre[1]) {
            relevantEdges = vertex.source_edges;
            localEdgeIndex = 1 - index2;
            effectiveHeight--;
        } else {
            relevantEdges = vertex.target_edges;
            localEdgeIndex = index2;
        }

        // In case of an Int interchanger, we got it the wrong way around
        if (vertex.type == 'Int') localEdgeIndex = 1 - localEdgeIndex;

        // Now determine the edges to the left of the clicked edge
        let edgeIndex = relevantEdges[localEdgeIndex];
        return this.data.edges_at_level[effectiveHeight].indexOf(edgeIndex) + 1;
    }

    createLocation(coordinates, boundaryFlags, type) {
        let padded = this.manager.getSlices().concat(coordinates);
        boundaryFlags = this.manager.getBoundaryFlags().concat(boundaryFlags);
        let position = this.diagram.getBoundaryCoordinates({
            allow_boundary: boundaryFlags,
            coordinates: padded
        });
        let dimension = this.diagram.getDimension() - coordinates.length + 1;
        return {
            origin: type,
            coordinates: position.coordinates,
            boundary: position.boundary,
            dimension
        };
    }

    getFringe({ x, y }) {
        let bounds = this.getBounds();
        let left = x < bounds.left + 0.25;
        let right = x > bounds.right - 0.25;
        let top = y > bounds.top - 0.25;
        let bottom = y < bounds.bottom + 0.25;
        return { left, right, top, bottom };
    }

    updatePopup(data) {
        let popup = $('#diagram-popup');
        if (this.update_in_progress || data.logical == null) {
            popup.remove();
            this.popup = null;
            return;
        }

        // Create popup if necessary
        if (popup.length == 0) {
            popup = $('<div>').attr('id', 'diagram-popup').appendTo('#diagram-canvas');
        }

        this.popup = data.logical;
        let boundary = this.diagram.getBoundary(data.logical.boundary);
        let cell = boundary.getCell(data.logical.coordinates.reverse());
        let boundary_string = (data.logical.boundary == null ? '' : data.logical.boundary.type.repeat(data.logical.boundary.depth) + ' ');
        let description = cell.id.getFriendlyName() + ' @ ' + boundary_string + JSON.stringify(data.logical.coordinates);
        let pos = $('#diagram-canvas').position();
        popup.html(description).css({
            left: 5 + pos.left + data.pixels.x,
            top: data.pixels.y - 28,
            position: 'absolute'
        });
    }

    isInBounds(grid) {
        let bounds = this.getBounds();
        if (grid.x < bounds.left || grid.x > bounds.right) return false;
        if (grid.y < bounds.bottom || grid.y > bounds.top) return false;
        return true;
    }

    getBounds() {
        return this.container[0].bounds;
    }

    gridToPixels(grid) {
        let pan = this.panzoom.getPan();
        let sizes = this.panzoom.getSizes();
        pixel.x = grid.x * sizes.realZoom + pan.x;
        pixel.y = (b.bottom - grid.y) * sizes.realZoom + pan.y;
        return pixel;
    }

    pixelsToGrid(pixels) {
        let b = this.getBounds();
        let pan = this.panzoom.getPan();
        let sizes = this.panzoom.getSizes();
        let x = (pixels.x - pan.x) / sizes.realZoom;
        let y = (pan.y - pixels.y) / sizes.realZoom;
        return { x, y };
    }

    removeHighlight() {
        this.container.children('svg').children('g').children('g').children('g').remove();
    }

    highlightBox(box, boundary) {
        globular_add_highlight(
            this.container,
            this.data,
            box,
            boundary,
            this.visibleDiagram);
    }

}

/*
Display.prototype.downloadSequence = function() {

    // If we're not ready, do nothing
    if (!this.has_controls()) return;

    // Get name for this sequence
    var prefix = prompt("Please enter a name for this sequence", "graphic");
    if (prefix == null) return;

    // If there are no slices, just export a PNG of the whole diagram
    if (this.slices.length == 0) {
        download_SVG_as_PNG(this.svg_element, this.getExportRegion(), filename + ".png");
        return;
    }

    // Start the chain of slice downloads
    this.downloadSlice(prefix, 0);

}

Display.prototype.downloadSlice = function(prefix, i) {
    
    // Move through all the slices and export them
    var slice = this.diagram;
    for (var j = 0; j < this.slices.length - 1; j++) {
        slice = slice.getSlice(this.slices[j].val());
    }

    // If we're being asked to render an invalid slice, give up
    if (i > slice.cells.length) return;
    var n = slice.cells.length.toString().length;

    this.slices[this.slices.length - 1].val(i);
    this.render();
    this.highlight_slice(this.slices.length - 1);
    var temp_this = this;
    download_SVG_as_PNG(this.svg_element, this.getExportRegion(), prefix + " " + i.toString().padToLength(n) + ".png", undefined,
        //(function(j){temp_this.downloadSlice(prefix, j + 1);})(i)
        (function(i){this.downloadSlice(prefix, i+1)}).bind(this, i)
    );
}

*/

/*
Display.prototype.getExportRegion = function() {
    var b = $(this.container)[0].bounds;
    if (b === undefined) return;
    var top_left = this.gridToPixels({
        x: b.left,
        y: b.top
    });
    var bottom_right = this.gridToPixels({
        x: b.right,
        y: b.bottom
    });
    return {
        sx: top_left.x,
        sy: top_left.y,
        sWidth: bottom_right.x - top_left.x,
        sHeight: bottom_right.y - top_left.y,
        logical_width: b.right - b.left,
        logical_height: b.top - b.bottom
    };
}
*/

function eventToPixels(event) {
    let box = event.currentTarget.getBoundingClientRect();
    let x = event.clientX - box.left;
    let y = event.clientY - box.top;
    return { x, y };
}