"use strict";

/*
    Stochastic Simulation class
*/

// Initialize the user-interface elements
/* Need to inject these elements into the UI
<li id="run-process" class="button-style-3">Run Process</li>
<li id='sto-form' class="button-style-3">Stochastic<input type="checkbox" id="stochastic-cb"></li>
*/

function timeSampler(rate) {
	return -1*(Math.log(Math.random()))/rate;
}

function dimensionHelper(processesDim, diagramDim, historyOn) {
    if(processesDim === diagramDim)
    {
        historyOn = true;
    }
    else{
        historyOn = false;
    }
}

Project.prototype.applyStochasticProcess = function(numIterations) {

    var diagram_dimension = this.diagram.getDimension();
    var process_dimension = Number($("#rp-dimension").val());
    var interchangesOn = false;
    if (process_dimension >= 3) {
        interchangesOn = true;
    }
    var history_mode;
    if (diagram_dimension == process_dimension) {
        history_mode = true;
    }
    else if (diagram_dimension + 1 == process_dimension) {
        history_mode = false;
    }
    else {
        alert("Process dimension must equal diagram dimension, or diagram dimension plus 1");
        return;
    }

    // Collect the rates
    var processes = this.signature.get_NCells(process_dimension);
    var num_stdProcess = processes.length;
    var rates = [];
    for (var i = 0; i < processes.length; i++) {
        rates[i] = this.get_rate(processes[i]) || 1;
    }
    var T = 0.5;
    if (interchangesOn) {
        var interchangers = this.diagram.getInterchangers();
        for (var i = 0; i < interchangers.length; i++) {
            processes.push(interchangers[i]);
        }
        for (var j = processes.length; j < interchangers.length + processes.length; j++) {
            rates[j] = Math.exp(-1 * interchangers[j - processes.length].tension_change / T);
        }
    }



    for (var m = 0; m < numIterations; m++) {

        //var species = this.signature.get_NCells(species_dim); //not necessarily in the same order as processes...or in the same order each time it's called
        var regularProcessesLength = processes.length;
        //var interchanges = this.diagram.getInterchangers();
        //for(var j = 0; j < interchanges.length; j++){
        //  processes.push(interchanges[i]);
        //}
        var possible_events = [];
        //var interchange_rate = 2; //to be put in by user later
        //for(var k = regularProcessesLength; k < processes.length; k++){
        //  rates[k] = interchange_rate;
        //}
        var current_state = (history_mode ? this.diagram.getTargetBoundary() : this.diagram);
        var eventsWithTimes = [];
        for (var i = 0; i < processes.length; i++) {
            if (i < num_stdProcess) {
                // Enumerate possible events, allowing loose matching
                possible_events[i] = current_state.enumerate(this.signature.getGenerator(processes[i]).source, true);
            }
            if (i >= num_stdProcess && interchangesOn) {
                possible_events[i] = 1; //each interchanger IS just one event, right?
            }
            for (var j = 0; j < possible_events[i].length; j++) {
                var event = possible_events[i][j];
                if (event.equivalence_class_size === undefined) event.equivalence_class_size = 1;
                eventsWithTimes.push({
                    event: event,
                    time: timeSampler(rates[i] / event.equivalence_class_size),
                    id: processes[i],
                    process_index: i
                });
            }
        }

        // ADD INTERCHANGERS TO THIS LIST
        var interchanger_rate = 2;
        var interchangers = this.diagram.getInterchangers();
        for (var i = 0; i < interchangers.length; i++) {
            var interchanger = interchangers[i];
            eventsWithTimes.push({
                event: interchanger.key,
                id: interchanger.id,
                time: timeSampler(interchanger_rate /*/ interchangers.length*/)
            });
        }

        // Choose the next event to occur
        var least = Number.MAX_VALUE;
        var index = 0;
        for (var x = 0; x < eventsWithTimes.length; x++) {
            var event = eventsWithTimes[x];
            if (event.time < least) {
                least = event.time;
                index = x;
            }
        }

        //so eventsWithTimes[index][0] is the event we want to execute
        if (history_mode) {
            var attached_event = this.signature.createDiagram(eventsWithTimes[index].id);
            this.diagram.attach(attached_event, 't', eventsWithTimes[index].event);
            //this.renderDiagram();
        }
        else { //rewrite
            var event = eventsWithTimes[index].event;
            var adjustments = event.adjustments;
            if (adjustments == undefined) adjustments = [];
            if (adjustments.length == 0) {
                var rewriteCell = {
                    id: eventsWithTimes[index].id,
                    coordinates: eventsWithTimes[index].event
                };
                console.log(JSON.stringify(rewriteCell));
                this.diagram.rewrite(rewriteCell, false);
            }
            else {
                // Perform the adjustments
                var x_offset = 0;
                for (var a = 0; a < adjustments.length; a++) {
                    var adjustment = adjustments[a];
                    // properties: adjustment.height, adjustment.side = 'left' or 'right'
                    var id = (adjustment.side == 'left' ? 'interchanger-right' : 'interchanger-left');
                    for (var h = event[1] + adjustment.height - 1; h >= event[1] + a; h--) {
                        var cell = this.diagram.constructInterchangerAtHeight(id, h);
                        console.log('adjustment: ' + JSON.stringify(cell));
                        this.diagram.rewrite(cell, false);
                    }
                    /*
                    for (var h = event[1] + a; h < adjustment.height; h++) {
                        var cell = this.diagram.constructInterchangerAtHeight(id, h);
                        console.log(JSON.stringify(cell));
                        this.diagram.rewrite(cell, false);
                    }
                    */
                    if (adjustment.side == 'left') {
                        var rewrite = gProject.signature.getGenerator(adjustment.id);
                        x_offset += rewrite.target.cells.length - rewrite.source.cells.length;
                    }
                }

                // Perform the actual rewrite
                var adj_coords = [event[0] + x_offset, event[1] + adjustments.length];
                var rewriteCell = {
                    id: eventsWithTimes[index].id,
                    coordinates: adj_coords
                };
                console.log(JSON.stringify(rewriteCell));
                this.diagram.rewrite(rewriteCell, false);
            }
        }
    }

    gProject.renderDiagram();
    this.saveState();
}

Project.prototype.displayInterchangers = function() {

    var t0 = performance.now();

    var interchangers = this.diagram.getInterchangers();
    if (interchangers.length == 0) {
        alert("No interchangers available");
        return;
    }

    //console.log(interchangers);
    //var i = Math.floor(Math.random() * interchangers.length);
    //we want the interchanger with neg change in tension (minimizing length) to be more likely
    var smallest_time = Number.MAX_VALUE;
    var chosen_index = 0;
    for (var i = 0; i < interchangers.length; i++) {
        var time = timeSampler(Math.exp(-1 * interchangers[i].tension_change / T));
        if (time < smallest_time) {
            chosen_index = i;
            smallest_time = time;
        }
    }
    this.diagram.rewrite(interchangers[chosen_index]);
    this.renderDiagram();
    this.saveState();
    //console.log("Project.displayInterchangers: " + (parseInt(performance.now() - t0)) + "ms");
};


Diagram.prototype.computeTensionChange = function(h1, h2) {
    var gen1 = this.cells[h1]; //index of array is the height; array nCells doesn't actually contain generator
    var gen2 = this.cells[h2];
    var gen1_input = gProject.signature.getGenerator(gen1.id).source.cells.length; //these will be diagrams
    var gen2_input = gProject.signature.getGenerator(gen2.id).source.cells.length;
    var gen1_output = gProject.signature.getGenerator(gen1.id).target.cells.length;
    var gen2_output = gProject.signature.getGenerator(gen2.id).target.cells.length;
    if (h1 > h2) {
        gen1_input *= -1;
        gen2_output *= -1;
    }
    else {
        gen1_output *= -1;
        gen2_input *= -1;
    }
    return gen1_input + gen2_input + gen1_output + gen2_output;
}

Diagram.prototype.getInterchangers = function() {

    var t0 = performance.now();
    var interchangers = new Array();
    for (var i = 0; i < this.cells.length - 1; i++) {
        var temp_coordinates = this.cells[i].key.slice(0);
        temp_coordinates.push(i);
        if (this.interchangerAllowed({
                id: 'Int',
                key: temp_coordinates
            })) {
            interchangers.push({
                id: "Int",
                key: temp_coordinates,
                tension_change: 0 //this.computeTensionChange(i, i + 1)
            });
        }
        if (this.interchangerAllowed({
                id: 'IntI',
                key: temp_coordinates
            })) {
            interchangers.push({
                id: "IntI",
                key: temp_coordinates,
                tension_change: 0 //this.computeTensionChange(i + 1, i)
            });
        }
    }
    return interchangers;
}

// Sets the front-end colour to what the user wants
Project.prototype.set_rate = function(id, rate) {
    this.signature.getGenerator(id).display.rate = rate;
    this.saveState();
};

// Gets the front-end colour to what the user wants
Project.prototype.get_rate = function(id) {
    return this.signature.getGenerator(id).display.rate;
};