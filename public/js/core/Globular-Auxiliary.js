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
    for (var i = 0; i < t.length; i++) {
        if (this[i + start] != t[i]) return false;
    }
    return true;
}

Array.prototype.end = function(n) {
    return this[this.length - 1 - n];
}

Array.prototype.last = function(arg) {
    if (arg != undefined) this[this.length - 1] = arg;
    else return this[this.length - 1];
};

Array.prototype.penultimate = function(arg) {
    if (arg != undefined) this[this.length - 2] = arg;
    else return this[this.length - 2];
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
    return (this == 'Int' || this == 'IntI0');
};

String.prototype.is_interchanger = function() {
    if (this.tail('-E', 'EI0')) return true;
    return (this.substr(0, 3) == 'Int');
};

String.prototype.is_invertible = function() {
    if (this.is_interchanger()) return true;
    if (this.indexOf('^0') > -1) return true;
    var checkbox = $('#invertible-' + this.getBaseType());
    if (checkbox.length == 0) return false;
    return checkbox.is(':checked');
}

String.prototype.getBaseType = function() {
    return this.strip_inverses();
}

String.prototype.getSignatureType = function() {
    if (this.tail('I0')) return this.chop(2).getSignatureType();
    if (this.tail('I1')) return this.chop(2).getSignatureType();
    if (this.tail('-E')) return this.chop(2).getSignatureType();
    if (gProject.signature.getGenerator(this) == null) return null;
    return this;
}

// Remove the trailing n characters
String.prototype.chop = function(n) {
    return this.substring(0, this.length - n);
}

// Ensure any old 'I'-style inverse markers are replaced with 'I0' markers
String.prototype.clean = function() {
    return this.replace(/I(?![\d,n])/g, 'I0');
}

String.prototype.analyze_id = function() {
    if (this.tail('I1')) {
        var r = this.chop(2).analyze_id();
        if (r == null) return null;
        r.i1 = true;
        return r;
    }
    if (this.tail('I0')) {
        var r = this.chop(2).analyze_id();
        if (r == null) return null;
        r.i0 = true;
        return r;
    }
    if (this.tail('-E')) {
        var r = this.chop(2).analyze_id();
        if (r == null) return null;
        r.dimension++;
        return r;
    }
    var generator = gProject.signature.getGenerator(this);
    if (generator == null) return {
        base_id: this,
        signature: false,
        i0: false,
        i1: false,
        dimension: 0
    }
    return {
        base_id: this,
        signature: true,
        i0: false,
        i1: false,
        dimension: generator.getDimension(),
        generator: generator
    }
}

String.prototype.toggle_inverse = function(depth) {
    if (depth == undefined) depth = 0;
    var i0 = false;
    var i1 = false;
    if (this.tail('I0I1')) {
        i0 = true;
        i1 = true;
    } else if (this.tail('I0')) {
        i0 = true;
    } else if (this.tail('I1')) {
        i1 = true;
    }
    if (depth == 0) i0 = !i0;
    if (depth == 1) i1 = !i1;
    var new_id = this.strip_inverses();
    if (i0) new_id += 'I0';
    if (i1) new_id += 'I1';
    return new_id;
}

String.prototype.strip_inverses = function() {
    var new_id = this;
    if (new_id.tail('I1')) new_id = new_id.chop(2);
    if (new_id.tail('I0')) new_id = new_id.chop(2);
    return new_id;
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
    if (this.tail('-EI0')) return this.chop(4).getFriendlyName() + ", cancel";

    // Is it an inverse cancellation?
    if (this.tail('-E')) return this.chop(2).getFriendlyName() + ", insert";

    // Is it an inverse?
    if (this.tail('I0')) return this.chop(2).getFriendlyName() + " inverse";

    // Is it a flip?
    if (this.tail('I1')) return this.chop(2).getFriendlyName() + " flip";

    // Is it a generator?
    var generator = gProject.signature.getGenerator(this);
    if (generator != null) return generator.name;

    // Is it a named singularity?
    var family = GetSingularityFamily(this);
    if (family != undefined) return SingularityData[family].friendly[this];

    // Don't understand this
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

function bbox_slice(box, a, b) {
    return {
        min: box.min.slice(a, b),
        max: box.max.slice(a, b)
    }
}

function getBoundingBoxSource(box) {
    return {
        min: box.min.slice(0, box.min.length - 1),
        max: box.max.slice(0, box.max.length - 1)
    }
}

function boundingBoxesEqual(b1, b2) {
    return (b1.min.vector_equals(b2.min) && b1.max.vector_equals(b2.max));
}

// Decompose the geometry of an interchanger vertex
function bezier_decompose(p, q, r, s, i) {
    var centre = (p + q) / 2;
    var a = q - centre;
    var b = s - centre;
    var t = bezier_intersect_t(a / b);
    var bl = bezier_initial_part({
        P1: [p, i],
        P2: [p, i + 0.5],
        P3: [s, i + 0.5],
        P4: [s, i + 1]
    }, t);
    var tr = bezier_initial_part({
        P1: [s, i + 1],
        P2: [s, i + 0.5],
        P3: [p, i + 0.5],
        P4: [p, i]
    }, 1 - t);
    var tl = {
        P1: [r, i + 1],
        P2: [2 * centre - tr.P2[0], tr.P2[1]],
        P3: [2 * centre - tr.P3[0], tr.P3[1]],
        P4: tr.P4.slice()
    }
    var br = {
        P1: [q, i],
        P2: [2 * centre - bl.P2[0], bl.P2[1]],
        P3: [2 * centre - bl.P3[0], bl.P3[1]],
        P4: bl.P4.slice()
    }

    return {
        centre: bl.P4.slice(),
        bl: bl,
        br: br,
        tr: tr,
        tl: tl
    }
}

// Returns an initial part of a bezier using de Casteljau's algorithm
// See http://stackoverflow.com/questions/11703283/cubic-bezier-curve-segment
function bezier_initial_part(bezier, t) {
    var b = bezier;
    var u = 1 - t;
    var uu = u * u;
    var uuu = uu * u;
    var tt = t * t;
    var ttt = tt * t;
    var P1 = b.P1.slice();
    var P2 = [u * b.P1[0] + t * b.P2[0],
              u * b.P1[1] + t * b.P2[1]];
    var P3 = [uu * b.P1[0] + 2 * t * u * b.P2[0] + tt * b.P3[0],
              uu * b.P1[1] + 2 * t * u * b.P2[1] + tt * b.P3[1]];
    var P4 = [uuu * b.P1[0] + 3 * t * uu * b.P2[0] + 3 * tt * u * b.P3[0] + ttt * b.P4[0],
              uuu * b.P1[1] + 3 * t * uu * b.P2[1] + 3 * tt * u * b.P3[1] + ttt * b.P4[1]];
    return {
        P1: P1,
        P2: P2,
        P3: P3,
        P4: P4
    };
}

var PI = 3.141592654;

// Working this out took me about 6 fucking hours
function bezier_intersect_t(r) {
    //var X = 0.5 + Math.sin((PI/6) - (2/3) * Math.atan(1/Math.sqrt(r)));
    return 0.5 + Math.sin((PI / 6) - (2 / 3) * Math.atan(1 / Math.sqrt(r)));
    var t = 0.5 + ((1 + r) / (2 * X)) + (X / (2 * (1 + r)));
    return t;
}


// Working this out took me
function bezier_intersect_X(r) {
    return
    /*
    var rr = r * r;
    var rrr = rr * r;
    var rrrr = rrr * r;
    var rrrrr = rrrr * r;
    var X = Math.cbrt(1 + r - rr - rrr + 2 * Math.sqrt(-r - 4 * rr - 6 * rrr - 4 * rrrr - 5 * rrrrr));
    return X;
    */
}

function Timer(caller) {
    this.start_time = performance.now();
    this.caller = caller;
}

Timer.prototype.Report = function() {
    var time = Math.floor(performance.now() - this.start_time);
    console.log("Timing: " + this.caller + ": " + time + "ms");
}

var Buffer = require('buffer').Buffer;
var LZ4 = require('lz4');

function globular_lz4_compress(string) {
    var timer = new Timer('globular_lz4_compress');
    console.log('  string.length = ' + string.length);
    var uncompressed = string + string; // WHY??
    var input = new Buffer(uncompressed);
    var output = new Buffer(LZ4.encodeBound(input.length));
    var compressedSize = LZ4.encodeBlock(input, output);
    console.log('  compressedSize = ' + compressedSize);
    if (compressedSize == 0) return {
        uncompressed: string
    };
    //output = output.slice(0, compressedSize);
    var compressed_output = new Uint8Array(compressedSize);
    //output, 0, compressedSize);
    for (var i=0; i<compressedSize; i++) {
        compressed_output[i] = output[i];
    }

    var compressed_string = Uint8ToStringVersion2(compressed_output);
    console.log('  compressed_string.length = ' + compressed_string.length);
    var b64 = btoa(compressed_string);
    console.log('  b64.length = ' + b64.length);
    timer.Report();
    return {
        compressed: b64,
        original_length: string.length
    };
}

/*
function globular_lz4_compress(string) {
    var timer = new Timer('globular_lz4_compress');
    console.log('  string.length = ' + string.length);
    var uncompressed = string + string; // WHY??
    var input = new Buffer(uncompressed);
    var output = new Buffer(LZ4.encodeBound(input.length));
    var compressedSize = LZ4.encodeBlock(input, output);
    console.log('  compressedSize = ' + compressedSize);
    if (compressedSize == 0) return {
        uncompressed: string
    };
    output = output.slice(0, compressedSize);
    var compressed_string = Uint8ToString(output);
    console.log('  compressed_string.length = ' + compressed_string.length);
    var b64 = btoa(compressed_string);
    console.log('  b64.length = ' + b64.length);
    timer.Report();
    return {
        compressed: b64,
        original_length: string.length
    };
}
*/

/*
function globular_lz4_compress(string) {
    var timer = new Timer('globular_lz4_compress');
    console.log('  string.length = ' + string.length);
    var uncompressed = string + string; // WHY??
    var input = new Buffer(uncompressed);
    var output = new Buffer(LZ4.encodeBound(input.length));
    var compressedSize = LZ4.encodeBlock(input, output);
    console.log('  compressedSize = ' + compressedSize);
    if (compressedSize == 0) return {
        uncompressed: string
    };
    output = output.slice(0, compressedSize);
    var compressed_output = new Uint8Array(compressedSize);
    //output, 0, compressedSize);
    for (var i=0; i<compressedSize; i++) {
        compressed_output[i] = output[i];
    }
    //compressed_output = output.slice(0, compressedSize);
    console.log("Compressed data", compressed_output);
    var compressed_string = Uint8ToString(compressed_output, encoding_ascii);
    console.log('  compressed_string.length = ' + compressed_string.length);
    var b64 = btoa(compressed_string);
    console.log('  b64.length = ' + b64.length);
    timer.Report();
    return {
        compressed: b64,
        original_length: string.length
    };
}
*/

function globular_lz4_decompress(object) {
    var timer = new Timer('globular_lz4_decompress');
    if (object.compressed == undefined) return object;
    var b64 = object.compressed;
    var str = atob(object.compressed);
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    var uncompressed_uint8 = new Buffer(object.original_length);
    var size = LZ4.decodeBlock(bufView, uncompressed_uint8);
    var uncompressed_string = Uint8ToString(uncompressed_uint8, 'utf8');
    timer.Report();
    return uncompressed_string;
}

var encoding_ascii = 'iso-8859-2';
function Uint8ToString(u8a, encoding) {
    var decoder = new TextDecoder(encoding);
    var decoded = decoder.decode(u8a);
    //var b64encoded = btoa(decoded);
    return decoded;
    /*
    var CHUNK_SZ = 0x8000;
    var c = [];
    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    }
    return c.join("");
    */
}

function Uint8ToStringVersion2(u8a) {
    var CHUNK_SZ = 0x8000;
    var c = [];
    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    }
    return c.join("");
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


function json_replacer(key, value) {
    return value;
}

function decimal_part(number) {
    return number - Math.floor(number)
}

String.prototype.padToLength = function(n) {
    var padded = this;
    while (padded.length < n) {
        padded = '0' + padded;
    }
    return padded;
}