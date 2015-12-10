"use strict";

/*
Hashtable Class
*/

// Creates a new empty hashtable
function Hashtable() {
    this['_t'] = 'Hashtable';
};

Hashtable.prototype.getType = function() {
    return 'Hashtable';
}

Hashtable.prototype.put = function(key, value) {
    this[key] = value;
};

Hashtable.prototype.remove = function(key) {
    delete this[key];
};


Hashtable.prototype.containsValue = function(value) {
    for (var k in this) {
        // use hasOwnProperty to filter out keys from the Object.prototype
        if (this.hasOwnProperty(k)) {
            if (this[k] === value) {
                return true;
            }
        }
    }
    return false;
};

Hashtable.prototype.containsKey = function(key) {
    for (var k in this) {
        // use hasOwnProperty to filter out keys from the Object.prototype
        if (this.hasOwnProperty(k)) {
            if (k === key) {
                return true;
            }
        }
    }
    return false;
};

Hashtable.prototype.get = function(key) {
    if (this.containsKey(key)) {
        return this[key];
    }
    else {
        //    console.log(key, "is not contained in the hashtable");
        return null;
    }
};

Hashtable.prototype.keys = function() {
    var keys = new Array();
    for (var k in this) {
        // use hasOwnProperty to filter out keys from the Object.prototype
        if (this.hasOwnProperty(k)) {
            keys.push(k);
        }
    }
    return keys;
};

Hashtable.prototype.entries = function() {
    var keys = new Array();
    for (var k in this) {
        // use hasOwnProperty to filter out keys from the Object.prototype
        if (this.hasOwnProperty(k)) {
            keys.push([k, this[k]]);
        }
    }
    return keys;
};

Hashtable.prototype.each = function(f) { // f is a function
    for (var k in this) {
        // use hasOwnProperty to filter out keys from the Object.prototype
        if (this.hasOwnProperty(k)) {
            //alert('key is: ' + k + ', value is: ' + this[k]);
            if (k == 'put') {
                var z = 0;
            }
            f(k, this[k]);
        }
    }
};

Hashtable.prototype.copy = function() {
    var newHash = new Hashtable();
    this.each(function(key, value) {
        newHash.put(key, value);
    });
    return newHash;
//    var newObject = jQuery.extend(true, {}, this);
//    return newObject;
};

Hashtable.prototype.equals = function() {
    var newObject = jQuery.extend(true, {}, this);
    return newObject;
};

// Takes another hashtable and a renaming function and returns a union with respect to keys quotiented by the names identified by the renaming functin
Hashtable.prototype.unionKeys = function(table, renaming) {
    var unionedHashtable = new Hashtable();
    // Adds elements of this hashtable
    this.each(function(key, value) {
        // If an element is not in the renaming array - it get added right away
        if (renaming.get(key) != null) {
            // If not, we only add it if it's not already present in the unioned hashtable
            if (!unionedHashtable.containsKey(renaming.get(key))) {
                key = renaming.get(key);
                unionedHashtable.put(key, value);
            }
        }
        else {
            unionedHashtable.put(key, value);
        }
    });
    // Adds elements of table
    table.each(function(key, value) {
        // If an element is not in the renaming array - it get added right away
        if (renaming.get(key) != null) {
            // If not, we only add it if it's not already present in the unioned hashtable
            if (!unionedHashtable.containsKey(renaming.get(key))) {
                key = renaming.get(key);
                unionedHashtable.put(key, value);
            }
        }
        else {
            unionedHashtable.put(key, value);
        }
    });
    return unionedHashtable;
};

// Takes another hashtable and a renaming function and returns a union with respect to values quotiented by the names identified by the renaming functin
Hashtable.prototype.unionValues = function(table, renaming) {
    var unionedHashtable = new Hashtable();
    // Adds elements of this hashtable
    this.each(function(key, value) {
        // If an element is not in the renaming array - it get added right away
        if (renaming.get(value) != null) {
            // If not, we only add it if it's not already present in the unioned hashtable
            if (!unionedHashtable.containsValue(renaming.get(value))) {
                value = renaming.get(value);
                unionedHashtable.put(key, value);
            }
        }
        else {
            unionedHashtable.put(key, value);
        }
    });
    // Adds elements of table
    table.each(function(key, value) {
        // If an element is not in the renaming array - it get added right away
        if (renaming.get(value) != null) {
            // If not, we only add it if it's not already present in the unioned hashtable
            if (!unionedHashtable.containsValue(renaming.get(value))) {
                value = renaming.get(value);
                unionedHashtable.put(key, value);
            }
        }
        else {
            unionedHashtable.put(key, value);
        }
    });
    return unionedHashtable;
};