"use strict";

/*
    New interchanger code used in diagram class
*/

/*
    n is the number of elements on the left, m the number of elements on the right - this explanation is to be expanded
*/
Diagram.prototype.expand = function(type, x, n, m) {

    var list = new Array();

    if (type === 'Int') {
        if (n === 1 && m === 1) {
            list.push(this.atomicInterchangerSource(type, x));
        }
        if (m === 1 && n != 1) {
            list = this.expand(type, x, n, 1).concat(this.expand(type, x + 1, n, m - 1));
        }
        else {
            list = this.expand(type, x + n - 1, 1, m).concat(this.expand(type, x, n - 1, m));
        }
    }

    return list;
}

Diagram.prototype.atomicInterchangerSource = function(type, heights) {

    var x = heights[heights.length - 1];
    var list = new Array();

    if (type.tail('Int', 'IntI')) {
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
        return list;
    }

    if (type.tail('L', 'R')) {
        list = this.nCells.slice(x, x + gProject.signature.getGenerator(this.nCells[x].id).target.nCells.length);
    }

    if (type.tail('LI', 'RI')) {
        list = this.nCells.slice(x - gProject.signature.getGenerator(this.nCells[x].id).source.nCells.length, x);
    }

    if (type.tail(2) === '1I') {
        return [];
    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail(1) === '1') {
        list.push(new_type, heights[heights.length - 2]);
        if (new_type.tail(1) === 'I') {
            list.push(new_type.substr(0, new_type.length - 1), heights[heights.length - 2]);
        }
        else {
            list.push(new_type + 'I', heights[heights.length - 2]);
        }
    }

    return list;
}

Diagram.prototype.atomicInterchangerTarget = function(type, heights) {

    var x = heights[heights.length - 1];

    var list = new Array();
    var entry;

    if (type === 'Int') {
        var g = gProject.signature.getGenerator(this.nCells[x + 1].id);
        this.nCells[x].coordinates.increment_last(g.target.nCells.length - g.source.nCells.length);
        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));
    }

    if (type === 'IntI') {
        var g = gProject.signature.getGenerator(this.nCells[x].id);
        this.nCells[x + 1].coordinates.increment_last(g.source.nCells.length - g.target.nCells.length);

        list.push(new NCell(this.nCells[x + 1].id, this.nCells[x + 1].coordinates));
        list.push(new NCell(this.nCells[x].id, this.nCells[x].coordinates));

    }

    var new_type = type.slice(0, type.length - 2);

    if (type.tail(1) === 'L') {
        list = this.getSlice(x).expand(new_type, this.nCells[x].coordinates.last(),
            gProject.signature.getGenerator(this.nCells[x].id).source.nCells.length, 1);


        this.nCells[x].coordinates.increment_last(1);
        list.push(this.nCells[x].id, this.nCells[x].coordinates);
    }

    //var x = 2 + (type == 'int' ? 1 : 0);

    if (type.tail(1) === 'R') {

        list = this.getSlice(x).expand(new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1] - 1,
            1, gProject.signature.getGenerator(this.nCells[x].id).source.nCells.length);

        this.nCells[x].coordinates.increment_last(-1);
        list.push(this.nCells[x].id, this.nCells[x].coordinates);
    }


    var new_type = type.slice(0, type.length - 3);


    if (type.tail(2) === 'LI') {

        this.nCells[x].coordinates.increment_last(-1);
        list.push(this.nCells[x].id, this.nCells[x].coordinates);

        var g = gProject.signature.getGenerator(this.nCells[x].id);

        list.concat(this.getSlice(x - g.source.nCells.length - 1).expand(
            new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1] - 1,
            gProject.signature.getGenerator(this.nCells[x].id).target.nCells.length), 1);

    }

    if (type.tail(2) === 'RI') {

        this.nCells[x].coordinates.increment_last(1);
        list.push(this.nCells[x].id, this.nCells[x].coordinates);

        var g = gProject.signature.getGenerator(this.nCells[x].id);

        list.concat(this.getSlice(x - g.source.nCells.length - 1).expand(
            new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1],
            gProject.signature.getGenerator(this.nCells[x].id).target.nCells.length), 1);

    }

    if (type.tail(2) === '1I') {
        list.push(new_type, heights[heights - 2]);
        list.push(new_type + 'I', heights[heights - 2]);
    }

    var new_type = type.slice(0, type.length - 2);


    if (type.tail(1) === '1') {
        return [];
    }


    return list;
}

Diagram.prototype.interchangerAllowed = function(nCell) {

    var x = nCell.coordinates[nCell.coordinates.length - 1];
    var type = nCell.id;

    var c1 = this.nCells[x];
    var c2 = this.nCells[x + 1];
    var g1 = gProject.signature.getGenerator(this.nCells[x].id);
    var g2 = gProject.signature.getGenerator(this.nCells[x + 1].id);

    if (nCell.id === 'Int') {
        return (c1.coordinates[c1.coordinates.length - 1] >= c2.coordinates[c2.coordinates.length - 1] + g2.source.nCells.length);
    }

    if (nCell.id === 'IntI') {
        return (c1.coordinates[c1.coordinates.length - 1] + g1.target.nCells.length <= c2.coordinates[c2.coordinates.length - 1]);
    }

    var new_type = type.slice(0, type.length - 2);


    if (nCell.id.tail(1) === 'L') {

        var crossings = g1.target.nCells.length;
        var template = this.getSlice(x).expand(new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1],
            crossings, 1);

        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }

    if (nCell.id.tail(1) === 'R') {

        var crossings = g1.target.nCells.length;
        var template = this.getSlice(x).expand(new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1] - 1,
            1, crossings);

        return this.instructionsEquiv(this.nCells.slice(x + 1, x + 1 + crossings), template);
    }

    var new_type = type.slice(0, type.length - 3);


    if (nCell.id.tail(2) === 'LI') {

        var crossings = g1.source.nCells.length;
        var template = this.getSlice(x - crossings - 1).expand(
            new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1] - 1,
            crossings, 1);

        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }

    if (nCell.id.tail(2) === 'RI') {

        var crossings = g1.source.nCells.length;
        var template = this.getSlice(x - crossings - 1).expand(
            new_type, this.nCells[x].coordinates[this.nCells[x].coordinates.length - 1],
            1, crossings);

        return this.instructionsEquiv(this.nCells.slice(x - crossings, x), template);
    }


    if (nCell.id.tail(2) === '1I') {
        if (this.nCells[x].id === new_type) {
            if (this.nCells[x + 1] === new_type + 'I' || this.nCells[x + 1] === new_type.substr(0, new_type.length - 1))
                return true;
        }
        return false;
    }

    var new_type = type.slice(0, type.length - 2);

    if (nCell.id.tail(1) === '1') {
        return true;
    }

}

Diagram.prototype.instructionsEquiv = function(list1, list2) {

    for (var i = 0; i < crossings; i++) {
        if (!this.nCellEquiv(list1[i], list2[i]))
            return false;
    }
    return true;
}

Diagram.prototype.nCellEquiv = function(cell_one, cell_two) {

    if (cell_one.id != cell_two.id) return false;
    if (cell_one.coordinates.length != cell_two.coordinates.length) return false;
    for (var i = 0; i < cell_one.coordinates.length; i++) {
        if (cell_one.coordinates[i] != cell_two.coordinates[i]) return false;
    }

    // NEEED OFFSET, Do you really? (with inclusion of slices in preprocessing for Expansion - I don't think so)

    return true;
}

Diagram.prototype.rewriteInterchanger = function(nCell) {

    var rewrite = {};

    rewrite.source = new Diagram(null, this.atomicInterchangerSource(nCell.id, nCell.coordinates));
    rewrite.target = new Diagram(null, this.atomicInterchangerTarget(nCell.id, nCell.coordinates));

    if (rewrite.source.nCells.length != 0 || rewrite.target.nCells.length) return rewrite;

    alert("Illegal data passed to rewriteInterchanger");

    return [];
}
