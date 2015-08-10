"use strict";

/*
    Stringifies and destringifies objects, dealing properly with self-references
*/

/*
var Buffer = require('buffer').Buffer;
var LZ4 = require('lz4');
*/

function lz4_start() {
    Buffer = require('buffer').Buffer;
    LZ4 = require('lz4');
}

function lz4_decompress(compresseddata) {
    var uintarray = new Uint8Array(compresseddata);
    var compressedBlock = new Buffer(uintarray);
    var uncompressedBlock = new Buffer(compressedBlock.length * 10);
    var n = LZ4.decodeBlock(compressedBlock, uncompressedBlock);
    uncompressedBlock = uncompressedBlock.slice(0, n);
    return uncompressedBlock.toString();
}

function lz4_compress(data) {
    var input = new Buffer(data);
    var output = new Buffer(LZ4.encodeBound(input.length));
    var compressedSize = LZ4.encodeBlock(input, output)
    output = output.slice(0, compressedSize)
    return output;
}

function globular_stringify(object) {
    var library = [];
    var head = globular_explode(object, library);
    var output_library = [];
    for (var i = 0; i < library.length; i++) {
        output_library[i] = library[i].entry;
    }
    return JSON.stringify({
        'head': head,
        'library': output_library
    });
}

function globular_destringify(string, store) {
    var object = JSON.parse(string);
    globular_rebuild(object.head, object.library, [], store);
    return store;
}

function globular_rebuild(object, library, constructed, store) {
    if (object == null) return null;
    if (object._l != undefined) {
        return globular_from_library(object._l, library, constructed, store);
    }
    return object;
    //return store;
}

function globular_from_library(index, library, constructed, store) {
    var stored_object = constructed[index];
    if (stored_object != undefined) return stored_object;
    
    var new_object;
    if (store != undefined) {
        new_object = store;
    }

    // Construct the new object
    var library_object = library[index];
    if (globular_is_array(library_object)) {
        new_object = [];
        for (var i = 0; i < library_object.length; i++) {
            new_object.push(globular_rebuild(library_object[i], library, constructed));
        }
    }
    else {
        if ((library_object._t != undefined) && (store == undefined)) {
            new_object = eval('new ' + library_object._t + '()');
            //delete library_object['_t'];
        }
        else {
            if (store == undefined) {
                new_object = {};
            }
        }
        delete library_object['_t'];
        for (var name in library_object) {
            new_object[name] = globular_rebuild(library_object[name], library, constructed);
            if (new_object[name] === undefined) {
                var z = 1;
            }
        }
    }

    constructed[index] = new_object;
    return new_object;
}

function globular_explode(object, library) {

    if (object == null) return object;
    if (typeof object === 'number') return object;
    if (typeof object === 'string') return object;
    if (typeof object === 'boolean') return object;
    if (typeof object === 'symbol') return object; // ???
    if (typeof object === 'undefined') return object;
    if (typeof object === 'function') {
        return ''; // ???
    }

    // If we've got this far, the object is a genuine Javascript object,
    // either a collection or an array.

    // If it's already in the library, just send a reference to it
    var index = globular_library_contains(library, object);
    if (index >= 0) {
        return {
            '_l': index
        };
    }

    // Construct library entry for this object
    var entry;
    if (globular_is_array(object)) {
        // The object is an array
        entry = [];
        for (var i = 0; i < object.length; i++) {
            var value = object[i];
            entry.push(globular_explode(value, library));
        }
    }
    else {
        // The object is an ordinary object
        entry = {};
        for (var name in object) {
            if (!object.hasOwnProperty(name)) continue;
            var value = object[name];
            if (typeof value === 'function') continue;
            entry[name] = globular_explode(value, library);
        }
        if (object.getType != undefined) {
            entry['_t'] = object.getType();
        }
    }

    library.push({
        'entry': entry,
        'reference': object
    });
    return {
        '_l': library.length - 1
    };

}

function globular_library_contains(library, object) {
    var length = library.length;
    for (var i = 0; i < length; i++) {
        if (library[i].reference == object) return i;
    }
    return -1;
}

function globular_is_array(object) {
    return object.constructor.toString().indexOf("Array") > -1;
}