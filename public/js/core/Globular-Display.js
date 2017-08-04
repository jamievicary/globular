"use strict";
/*global gProject*/
/*global Timer*/
/*global detectLeftButton*/
/*global $*/

/*
    A Display class for rendering diagrams.
    
    Members:
        - suppress : N, levels to supress
        - coordinates : Array, indices of the display positions
        - container: div to render 
        - control: div for controls
*/

// Constructor
class DisplayManager {

    constructor(container) {
        this['_t'] = 'DisplayManager';
        this.container = $(container);
        this.display = null;
        this.displayType = null;
        this.diagram = null;
        
        this.suppressInput = null;
        this.viewInput = null;
        this.sliceInputs = [];

        this.createControls();
    }

    setDisplay(type) {
        if (this.displayType === type) {
            return;
        }

        if (this.display !== null) {
            this.display.dispose();
            this.displayControls.empty();
        }

        this.display = type == "3d" ? new Display3D() : new DisplaySVG();
        this.displayType = type;
        this.display.setup(this);
        
        this.updateControls(null, null);
        this.display.setDiagram(this.diagram, false);
    }

    hasControls() {
        return this.container.children('div.control').length > 0;
    }

    /**
     * Make sure all the coordinates and suppressions make sense, bearing in mind
     * that an attachment has just been performed at the specified location,
     * so we want to keep it in view.
     */
    updateControls(drag, controls) {
        // If there's no diagram, nothing to do
        if (this.diagram == null) return;

        // Create controls, if there are none
        if (!this.hasControls()) this.createControls();

        // Update the suppression input
        var suppress = this.suppressInput.val();
        if (controls != null) suppress = controls.project;
        suppress = Math.min(suppress, this.diagram.getDimension());
        if (suppress < 0) suppress = 0;
        this.suppressInput.val(suppress);
        update_control_width(this.suppressInput);

        // Update the view dimension input
        if (this.viewInput != null) {
            var view = Number(this.viewInput.val());
            if (drag != undefined) {
                if (drag.boost) view++;
            }
            view = Math.min(this.display.getMaximumDimension(), view, this.diagram.getDimension() - suppress);
            this.viewInput.val(view);
            update_control_width(view);
        }

        // Update the slice controls
        this.updateSliceContainer(drag, controls);
    }

    changeControls() {
        gProject.clearThumbnails();
        this.updateControls();
        this.render();
    }

    createControls() {
        let c = this.container;

        // Remove any existing controls
        $(this.container).children('div.control').remove();

        // Choose popout mode if the display is small
        let popout = (c.width() < 100 || c.height() < 100);

        // Construct the main control div
        this.control = $('<div>')
            .attr('id', 'main_view_control')
            .addClass('control')
            .addClass(popout ? 'popout' : 'inline')
            .mousedown((e) => e.stopPropagation())
            .mouseup((e) => e.stopPropagation())
            .click((e) => e.stopPropagation());
        this.container.append(this.control);

        // Construct the project control
        this.control.append(document.createTextNode('Project '));
        this.suppressInput = $('<input>')
            .attr('type', 'number')
            .addClass('control')
            .attr('min', 0)
            .mouseover((e) => e.target.focus());
        
        this.suppressInput.on('input', (event) => {
            $('#view_input').val(10);
            this.changeControls(event)
        });
        this.control.append(this.suppressInput);
        update_control_width(this.suppressInput);

        // Create a container for display specific controls
        this.displayControls = $("<div>").addClass("display_controls");
        this.control.append(this.displayControls);

        // Construct the container for the slice controls
        this.sliceDiv = $('<div>').addClass('slice_container');
        this.sliceDiv.append(document.createTextNode('Slice '));
        this.control.append(this.sliceDiv);
        this.sliceInputs = [];
    }

    updateSliceContainer(drag, controls) {
        // If the diagram is null, we shouldn't have any slice controls
        if (this.diagram == null) {
            this.sliceInputs.forEach(input => input.remove());
            this.sliceInputs = [];
            return;
        }

        // Calculate the desired number of slice controls
        let remainingDimensions = this.diagram.getDimension() - this.getSuppress() - this.display.getMaximumDimension() /*this.view_input.val()*/ ;
        if (remainingDimensions < 0) remainingDimensions = 0;

        // Remove any superfluous slice controls
        while (this.sliceInputs.length > remainingDimensions) {
            this.sliceInputs.last().remove();
            this.sliceInputs.pop();
        }

        // Add any additional slice controls with a dimension of zero
        var self = this;
        for (var i = this.sliceInputs.length; i < remainingDimensions; i++) {
            this.sliceInputs[i] =
                $('<input>')
                .addClass('control')
                .addClass('slice')
                .attr('type', 'number')
                .attr('min', 0)
                .val(0)
                .attr("index", i)
                .on('input', event => this.changeControls(event))
                .hover(
                    // Mouse over
                    (event) => {
                        event.target.focus();
                        let index = Number(event.target.getAttribute("index"));
                        this.highlightSlice(index);
                    },
                    // Mouse out
                    (event) => {
                        this.removeHighlight();
                    });

            // Store the index of the slice control
            this.sliceDiv.append(this.sliceInputs[i]);
            update_control_width(this.sliceInputs[i]);
        }

        // If a particular boundary has been requested, make sure it is within view
        if (drag != null) {
            if (drag.boundary == null) {
                // Rewrite in the interior, so advance the last slider
                if (this.sliceInputs.length > 0) {
                    var counter = this.sliceInputs.last();
                    var current = Number(counter.val());
                    counter.val(current + 1);
                    update_control_width(counter);
                }
            } else {
                if (drag.boundary.depth > 0) {
                    var slice_index = drag.boundary.depth - 1;
                    if (drag.boundary.type == 't') {
                        if (slice_index < this.sliceInputs.length) {
                            var current = Number(this.sliceInputs[slice_index].val());
                            this.sliceInputs[slice_index].val(current + 1);
                            update_control_width(this.sliceInputs[slice_index]);
                        }
                    }
                }
            }
        }

        // Ensure the slice coordinates are valid
        var slice = this.diagram; // no need to copy
        for (var i = 0; i < remainingDimensions; i++) {
            var input = this.sliceInputs[i];
            var val = input.val();
            if (controls != null) {
                if (controls.sliceInputs[i] != null) {
                    val = controls.sliceInputs[i];
                }
            }
            input.val(Math.min(val, Math.max(slice.cells.length, 1)));
            update_control_width(input);
            input.attr('max', Math.max(1, slice.cells.length));
            slice = slice.getSlice(input.val()); // no need to copy slice
        }
    }

    highlightSlice(index) {
        // Get bounding box for entire action
        var location = this.getSlices();
        var box = this.diagram.getLocationBoundingBox(location);
        if (box == null) return; // no box to display

        // Get display data for bounding box
        var display_data = this.diagram.getLocationBoundaryBox(null, box, this.getSlices().reverse());
        if (display_data == null) return; // the box is invisible on the current slice

        this.highlightBox(display_data.box, display_data.boundary);
    }

    // Highlight a portion of the diagram
    highlightNextSlice() {
        // Don't highlight if we're on the last slice
        let sliceControl = this.sliceInputs.last();
        if (sliceControl.val() == sliceControl.attr('max')) return;

        // Get the bounding box of the cell which is next to act
        let slices = this.getSlices().slice(0, -1);
        let slice = this.diagram.getSlice(slices.reverse());
        let height = sliceControl.val();

        // If the value is out of range (e.g. if we're on the source slice of an identity diagram,
        // do nothing)
        if (height >= slice.cells.length) return;
        let box = slice.cells[height].box;

        // Apply the highlight
        this.highlightBox(box);
    }

    removeHighlight() {
        this.display.removeHighlight();
    }

    highlightAction(action, boundary) {
        // Decide what to actually highlight. If we're cancelling something on the boundary, highlight that instead.
        var real_boundary, real_action;
        if (action.preattachment == null) {
            real_boundary = boundary;
            real_action = action;
        } else {
            real_boundary = boundary;
            if (action.preattachment.boundary != null) {
                if (real_boundary == null) real_boundary = {
                    depth: 0
                };
                real_boundary.depth += action.preattachment.boundary.depth;
                real_boundary.type = action.preattachment.boundary.type;
            }
            real_action = action.preattachment;
        }

        // Get bounding box for entire action
        var slice = this.diagram;
        if (real_boundary != null) {
            for (var i = 0; i < real_boundary.depth - 1; i++) {
                slice = slice.getSourceBoundary();
            }
            if (real_boundary.type == 's') slice = slice.getSourceBoundary();
            else slice = slice.getTargetBoundary();
        }
        var boundary_box = slice.getBoundingBox(real_action);
        if (boundary_box == null) return;

        // Get display data for bounding box
        var display_data = this.diagram.getLocationBoundaryBox(real_boundary, boundary_box, this.padCoordinates([]).reverse());
        if (display_data == null) return;

        this.highlightBox(display_data.box, display_data.boundary);
    }

    // Highlight a portion of the diagram
    highlightBox(box, boundary) {
        // Remove an existing highlight
        this.removeHighlight();
        
        // Add the highlight to the diagram
        this.display.highlightBox(box, boundary);   
    }

    // Attach the given diagram to the window, showing at least the specified boundary
    setDiagram(data /*diagram, boundary, controls*/ ) {
        data = data || { diagram: null, preserve_view: false };

        this.diagram = data.diagram;

        if (data.diagram != null) {
            this.updateControls(data.drag, data.controls);
        }

        this.display.setDiagram(data.diagram, data.preserve_view);
    }

    render() {
        this.display.render();
    }

    getSlices() {
        if (this.sliceInputs === null) {
            return null;
        }

        return this.sliceInputs.map(input => Number(input.val()));
    }

    getSuppress() {
        if (this.suppressInput === null) {
            return null;
        }

        return Number(this.suppressInput.val());
    }

    getVisibleDiagram() {
        if (this.diagram === null) {
            return null;
        }

        return this.diagram.getSlice(this.getSlices().reverse());
    }

    getBoundaryFlags() {
        return this.sliceInputs.map(input => {
            let source = input.val() == input.attr("min");
            let target = input.val() == input.attr("max");
            return { source, target };
        });
    }

    getControls() {
        let project = this.getSuppress();
        let slices = this.getSlices();
        return { project, slices };
    }

}


// Make the number scrollers the correct width
function update_control_width(input) {
    var length = String(input.val()).length;
    var width = 24 + 6 * length;
    $(input).css('max-width', width + 'px');
}

