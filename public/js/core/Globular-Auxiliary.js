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

Array.prototype.tail = function(t) {
    if (t.length > this.length) return false;
    var start = this.length - t.length;
    for (var i=0; i<t.length; i++) {
        if (this[i + start] != t[i]) return false;
    }
    return true;
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
    if (this.tail('-E', '-EI')) return true;
    return (this.substr(0, 3) == 'Int');
};

String.prototype.is_invertible = function() {
    if (this.is_interchanger()) return true;
    var checkbox = $('#invertible-' + this.getBaseType());
    if (checkbox.length == 0) return false;
    return checkbox.is(':checked');
}

String.prototype.is_inverse = function() {
    return (this[this.length - 1] == 'I');
}

String.prototype.getBaseType = function() {
    if (this.tail('I')) return this.substr(0, this.length - 1);
    return this;
}

String.prototype.getSignatureType = function() {
    if (this.tail('I')) return this.substr(0, this.length - 1).getSignatureType();
    if (this.tail('-E')) return this.substr(0, this.length - 2).getSignatureType();
    if (gProject.signature.getGenerator(this) == null) return null;
    return this;
}

String.prototype.toggle_inverse = function() {
    if (this.tail('I')) return this.substr(0, this.length - 1);
    return this + 'I';
}

String.prototype.repeat = function(n) {
    var result = "";
    for (var i = 0; i < n; i++) {
        result += this;
    }
    return result;
}

String.prototype.getFriendlyName = function() {
    
    // Is it a cancellation?
    if (this.tail('-EI')) return this.substr(0, this.length - 3).getFriendlyName() + ", cancel";
    
    // Is it an inverse cancellation?
    if (this.tail('-E')) return this.substr(0, this.length - 2).getFriendlyName() + ", insert";
    
    // Is it an inverse?
    if (this.tail('I')) return this.substr(0, this.length - 1).getFriendlyName() + " inverse";

    // Is it a generator?
    var generator = gProject.signature.getGenerator(this);
    if (generator != null) return generator.name;
    
    // Is it a named singularity?
    var family = GetSingularityFamily(this);
    if (family != undefined) return SingularityData[family].friendly[this];
    
    // Can't understand this
    return 'UNKNOWN';
}

Array.prototype.move = function(instructions) {
    for (var i = 0; i < instructions.length; i++) {
        if (i == this.length) return;
        var command = instructions.end(i);
        var index = this.length - 1 - i;
        if (command.relative != undefined) {
            this[index] += command.relative;
        } else {
            this[index] = command.absolute;
        }
    }
    return this;
}

// Adds the components of the argument to the components of this array
Array.prototype.vector_add = function(v2) {
    var result = this.slice();
    var n = Math.min(this.length, v2.length);
    for (var i = 0; i < n; i++) {
        result[result.length - 1 - i] += v2.end(i);
    }
    return result;
}

// Check two arrays for equality componentwise
Array.prototype.vector_equals = function(v2) {
    if (this.length != v2.length) return false;
    for (var i = 0; i < this.length; i++) {
        if (this[i] != v2[i]) return false;
    }
    return true;
};

Array.prototype.set = function(attr, val) {
    this.attr = val;
    return this;
};

Array.prototype.has_suffix = function(a2) {
    for (var i = 0; i < a2.length; i++) {
        if (this.end(i) != a2.end(i)) return false;
    }
    return true;
}

Number.prototype.magnitude = function() {
    return this;
}

Array.prototype.magnitude = function() {
    return this.length - 1;
}

function hsl(hue, saturation, lightness) {
    return $.husl.toHex(hue, saturation, lightness);
};

var GlobularColours = [
    /* Mid   */
    [hsl(250, 100, 60) /*blue*/ , hsl(10, 100, 60) /*red*/ , hsl(120, 100, 60) /*green*/ ],
    /* Light */
    [hsl(0, 0, 100) /*white*/ , hsl(0, 0, 80) /*light gray*/ ],
    /* Dark  */
    [hsl(0, 0, 0) /*black*/ , hsl(265, 100, 30) /*dark blue*/ , hsl(10, 100, 30) /*dark red*/ , hsl(130, 100, 30) /*dark green*/ ]
];

function globular_is_array(object) {
    return (Object.prototype.toString.call(object) === '[object Array]');
    //return object.constructor.toString().indexOf("Array") > -1;
}

