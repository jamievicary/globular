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
    for (var i=0; i<arr.length; i++) {
        new_arr[i] = arr[i] + suffix;
    }
    //object = new_obj;
    return new_arr;
}

function getMean(arr) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i] === undefined) {
            var x = 0;
        }
    }
    var total = arr[0].slice();
    for (var i=1; i<arr.length; i++) {
        for (var j=0; j<total.length; j++) {
            total[j] += arr[i][j];
        }
    }
    for (var j=0; j<total.length; j++) {
        total[j] /= arr.length;
    }
    return total;
}

function detectLeftButton(event) {
    event = event || window.event;
    var button = event.which || event.button;
    return button == 1;
}

Array.prototype.last = function() {
    return this[this.length - 1];
};

Array.prototype.increment_last = function(value) {
    this[this.length - 1] += value;
};

String.prototype.tail = function() {
    for (var i=0; i<arguments.length; i++) {
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
    for (var i=0; i<length; i++) {
        this[i] = value;
    }
    return this;
}