"use strict";

/*
    Stochastic Simulation class
*/

function timeSampler(rate)
{
	return -1*(Math.log(Math.random()))/rate;
}