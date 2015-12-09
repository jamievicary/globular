"use strict";

/*
    Stringifies and destringifies objects, remembering class structures
*/

function globular_stringify(object, minimize) {
    if (minimize == undefined) minimize = false;
    var raw = globular_raw(object, minimize);
    return JSON.stringify(raw);
}

function globular_destringify(object) {
    return globular_classify(object);
}

function globular_classify(object) {

    // Return basic objects unmodified
    if (object == null) return object;
    if (typeof object === 'number') return object;
    if (typeof object === 'string') return object;
    if (typeof object === 'boolean') return object;
    if (typeof object === 'symbol') return object; // ???
    if (typeof object === 'undefined') return object;

    if (!globular_is_array(object) && object._t != undefined) {
        var new_object = eval('new ' + object._t + '()');
        for (var name in object) {
            if (!object.hasOwnProperty(name)) continue;
            if (name == '_t') continue;
            new_object[name] = globular_classify(object[name]);
        }
        return new_object;
    }
    else {
        for (var name in object) {
            if (!object.hasOwnProperty(name)) continue;
            object[name] = globular_classify(object[name]);
        }
        return object;
    }
}

function globular_raw(object, minimize) {

    if (object == null) return object;
    if (typeof object === 'number') return object;
    if (typeof object === 'string') return object;
    if (typeof object === 'boolean') return object;
    if (typeof object === 'symbol') return object; // ???
    if (typeof object === 'undefined') return object;
    if (typeof object === 'function') {
        return '';
    }

    // Construct raw representation of the object
    var raw = (globular_is_array(object) ? [] : {});
    for (var name in object) {
        if (!object.hasOwnProperty(name)) continue;
        var value = object[name];
        if (value != null) { if (value.ignore && minimize) continue };
        if (typeof value === 'function') continue;
        raw[name] = globular_raw(value);
    }
    
    // If it's an object, make sure it remembers its class type, if it has one
    if (!globular_is_array(object)) {
        if (object.getType != undefined) {
            raw._t = object.getType();
        }
    }
    
    return raw;
}

function globular_is_array(object) {
    return (Object.prototype.toString.call(object) === '[object Array]');
}