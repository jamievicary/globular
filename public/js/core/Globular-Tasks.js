"use strict";

/*
    Workspace initialization code in continuation-passing style.
    Required for notifying progress to the user.
*/

var loading_detail_array = [];
var loading_detail_level = 0;
var current_status_div;
var show_loading_window;

function cps_perform(future_tasks, current_task) {

    // If we don't have a current task, get one from the stack
    if (current_task == undefined) {
        var current_task = future_tasks.shift();

        // If we've run out of tasks, then stop
        if (current_task == undefined) return;

        // See if we need to update the status
        if (current_task.status == undefined || !show_loading_window) {
            cps_perform(future_tasks, current_task);
        } else {

            // Ensure the required div exists
            while (loading_detail_array.length <= loading_detail_level) {
                var new_div = $('<div>').addClass('loading-detail');
                loading_detail_array.push(new_div);
                $('#loading-window').append(new_div);
            }

            // Set the status message
            loading_detail_array[loading_detail_level].html(current_task.status);

            // Continue with the task
            setTimeout(function() {
                cps_perform(future_tasks, current_task);
            }, 10);
        }
        return;
    }

    if (current_task.change_level != undefined) {
        // Change reporting level
        loading_detail_level += current_task.change_level;
    } else {
        // Perform the current task
        var extra = (current_task.f)(current_task.arg);

        // Prepand any extra tasks that have been instructed
        if (extra != undefined) {
            future_tasks = extra.concat(future_tasks);
        }
    }

    // Continue with the tasks
    cps_perform(future_tasks);
}

// Load the workspace
function cps_load_project(string) {

    // Construct continuations
    var tasks = [{
        change_level: +1
    }];
    tasks.push({
        f: cps_constructor,
        arg: string,
        status: 'Preparing to render...'
    });
    tasks.push({
        change_level: -1
    });
    tasks.push({
        f: cps_render_signature
    });
    tasks.push({
        f: cps_render_main_diagram
    });
    tasks.push({
        f: cps_finalize
    });
    return tasks;
}

function cps_constructor(string) {
    gProject = null;
    MainDisplay.visible_diagram = null;
    gProject = new Project(string);
    if (gProject.signature.getNCells(0).length == 0) gProject.addZeroCell();
}

function cps_render_signature() {

    // Do work
    var s = gProject.signature;
    var cells = gProject.signature.getAllCells();
    var tasks = [{
        change_level: +1
    }];

    // Loop over cells
    for (var i = 0; i < cells.length; i++) {
        var generator = gProject.signature.getGenerator(cells[i]);
        tasks.push({
            f: cps_import_cell,
            arg: generator,
            status: 'Rendering ' + generator.getDimension() + '-cell "' + generator.name + '"...'
        });
    }

    tasks.push({
        change_level: -1
    })

    // Return continuations
    return tasks;
}

function cps_import_main_diagram() {

    var tasks = [];
    tasks.push({
        f: cps_prepare_diagram,
        arg: gProject.diagram,
        status: "Preparing main diagram..."
    });

    tasks.push({
        f: cps_render_main_diagram,
        status: "Rendering main diagram..."
    })

    return tasks;
}


function cps_render_main_diagram() {
    // Do non-CPS work
    if (gProject.diagram == null) return;
    gProject.diagram.prepare()
    gProject.renderDiagram({
        controls: gProject.view_controls
    });
}

function cps_import_cell(generator) {

    var tasks = [];

    tasks.push({
        f: cps_prepare_generator,
        arg: generator
    });

    tasks.push({
        f: cps_render_cell,
        arg: generator
    })

    return tasks;
}

function cps_prepare_generator(generator) {
    generator.prepare();
}

function cps_prepare_diagram(diagram) {

    // Do work
    if (diagram == null) return;
    diagram.prepare(); // non-CPS

    /*
    var num_slices = Math.min(1, diagram.cells.length);
    for (var i=0; i<num_slices; i++) {

        tasks.push({
            f: cps_prepare_diagram_slice,
            arg: {slice: i, diagram: diagram},
            status: "Preparing slice " + i
        });
        
        if (i == num_slices - 1) break;
        tasks.push({
            f: cps_prepare_diagram_bounding_box,
            arg: {slice: i, diagram: diagram}
        });

    }
    */
}

function cps_render_cell(generator) {

    // Do work
    gProject.renderNCell(generator.id); // non-CPS
}

/*
function cps_prepare_diagram_slice(arg) {

    // Do the work
    arg.diagram.getSlice(arg.slice);
    
    tasks = [{
        change_level: +1
    }];
    
    tasks.push({
        change_level: -1
    })

    return tasks;
}

function cps_get_diagram_slice(diagram) {
    
}
*/

function cps_finalize() {
    $('#loading-window').hide();
    gProject.initialized = true;
    $("#add-0-cell-opt").click(function() {
        gProject.addZeroCell();
    });
    gProject.saveState();
}