"use strict";

/*
    Stochastic Simulation class
*/

var stateList = //something related to enumerate;

//assigns to each possible event a time from the uniform distro/rand function
function assignTimes(possibleEvents) {
	for(var i = 0; i < possibleEvents.length; i++) {
		possibleEvents[i] = [possibleEvents[i], Math.random()];
	} 
	return possibleEvents;
};

/* 
	returns the index in the given list of [event, time]s with the lowest time (or one of the events with the lowest time if there are more than one)
*/
function giveNextEvent(eventList) {
	//first extract all the event times
	var eventTimes = [];
	for(var x = 0; x < eventList.length; x++) {
	        eventTimes.push(eventList[x][1]);
	}
	var least = 2;
	var index = -1;
	for(var x = 0; x < eventTimes.length; x++) {
		if (eventTimes[x] < least) {
		    least = eventTimes[x];
		    index = x;
		}
	}
	return index;
};

//executes the event by updating the state list
function execute(nextEvent) {
    
};


/*
	Main method: this is what will be called when the Simulation button is hit
*/
function Simulation() {
	/*	
		by default all processes will be involved...later can set processes not involved to have rate constant = 0 
	*/	
	var rateConstant = 1; //one rate to rule them all...for now

	var eventList = assignTimes(stateList);
	var nextEventIndex = giveNextEvent(eventList);
	var newState = execute(nextEventIndex); /*does this have to act on an object? this??*/
	stateList = newState; //unless you want to make input global or something...maybe that's why all the this stuff?
	
};




/*
    Jamie's stuff:
    
// ................

function choose_a_random_rewrite() {
    // ..
}

function someone_clicked_the_button() {
    //b ......
}
*/