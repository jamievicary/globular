"use strict";

/*
    Some auxiliary functions
*/

// Quick way to return a random alphanumeric string of length ~10
function globular_freshName(n) {
    return n.toString() + '-' + Math.random().toString(36).slice(2);
}

// Check whether a number is an integer
function isInteger(n) {
    return n % 1 === 0;
}

// Prefix labels of an object
function prefixLabels(object, prefix) {
    var new_obj = {};
    for (var index in object) {
        if (!object.hasOwnProperty(index)) continue;
        new_obj[prefix + index] = object[index];
    }
    object = new_obj;
    return object;
}

// Suffix labels of an object
function suffixLabels(arr, suffix) {
    var new_arr = [];
    for (var i = 0; i < arr.length; i++) {
        new_arr[i] = arr[i] + suffix;
    }
    //object = new_obj;
    return new_arr;
}

function getMean(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === undefined) {
            var x = 0;
        }
    }
    var total = arr[0].slice();
    for (var i = 1; i < arr.length; i++) {
        for (var j = 0; j < total.length; j++) {
            total[j] += arr[i][j];
        }
    }
    for (var j = 0; j < total.length; j++) {
        total[j] /= arr.length;
    }
    return total;
}

function detectLeftButton(event) {
    event = event || window.event;
    var button = event.which || event.button;
    return button == 1;
}

function zero_array(n) {
    var tab = new Array();
    for (var i = 0; i < n; i++) {
        tab.push(0);
    }
    return tab;
}

function min_array(t1, t2) {
    var tab = new Array();

    if (t1.length != t2.length) {
        console.log("Arrays of different length")
    }

    for (var i = 0; i < t1.length; i++) {
        if (t1[i] <= t2[i]) {
            tab.push(t1[i]);
        } else {
            tab.push(t2[i]);
        }
    }
    return tab;
}

function diff_array(t1, t2) {
    var tab = new Array();

    if (t1.length != t2.length) {
        console.log("Arrays of differnt length")
    }

    for (var i = 0; i < t1.length; i++) {
        tab.push(t1[i] - t2[i]);
    }
    return tab;
}

Array.prototype.end = function(n) {
    return this[this.length - 1 - n];
}

Array.prototype.last = function() {
    return this[this.length - 1];
};

Array.prototype.penultimate = function() {
    return this[this.length - 2];
};

Array.prototype.incremented_array = function(value) {
    this[this.length - 1] += value;
    return this;
};

Array.prototype.increment_last = function(value) {
    this[this.length - 1] += value;
};

Array.prototype.reverse = function() {
    var t2 = new Array();
    for (var i = 0; i < this.length; i++) {
        t2.push(this[this.length - 1 - i]);
    }

    return t2;
};

String.prototype.tail = function() {
    for (var i = 0; i < arguments.length; i++) {
        var t = arguments[i];
        if (this.substr(this.length - t.length, t.length) === t) return true;
    }
    return false;
    //return this.substr(this.length - elements, this.length);
};

String.prototype.last = function() {
    if (this.length == 0) return '';
    return this.substr(this.length - 1, 1);
}

Array.prototype.fill = function(value, length) {
    this.length = 0;
    for (var i = 0; i < length; i++) {
        this[i] = value;
    }
    return this;
};

String.prototype.is_basic_interchanger = function() {
    return (this == 'Int' || this == 'IntI');
};

String.prototype.is_interchanger = function() {
    return (this.substr(0, 3) == 'Int');
};

Array.prototype.move = function(instructions) {
    for (var i = 0; i < instructions.length; i++) {
        if (i == this.length) return;
        var command = instructions.end(i);
        var index = this.length - 1 - i;
        if (command.relative != undefined) {
            this[index] += command.relative;
        }
        else {
            this[index] = command.absolute;
        }
    }
}

// Adds the components of the argument to the components of this array
Array.prototype.vector_add = function(v2) {
    if (this.length != v2.length) throw 0;
    var result = this.slice();
    for (var i=0; i<this.length; i++) {
        result[i] += v2[i];
    }
    return result;
}