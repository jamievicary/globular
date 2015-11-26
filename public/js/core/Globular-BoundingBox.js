"use strict";

/*
    BoundingBox class
    Represents a subdiagram of a diagram
*/

function BoundingBox(min, max) {
    this.min = min;
    this.max = max;
    return this;
}

function BoundingBox.slice(n) {
    return {min: this.min.slice(n), max: this.max.slice(n)};
} 

function BoundingBox.copy() {
    return this.slice(0);
}
