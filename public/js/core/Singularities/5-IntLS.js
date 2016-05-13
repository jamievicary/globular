"use strict";

/*global Diagram*/
/*global RegisterSingularityFamily*/
/*global gProject*/

// Data for the Int-L-S family
// This is naturality for the 4-cell pull-through


RegisterSingularityFamily({
    family: 'IntLS',
    dimension: 5,
    members: ['Int-L-S', 'Int-L-SI0',
    'IntI0-L-S', 'IntI0-L-SI0',
    'Int-LI0-S', 'Int-LI0-SI0',
    'IntI0-LI0-S', 'IntI0-LI0-SI0',
    'Int-R-S', 'Int-R-SI0',
    'IntI0-R-S', 'IntI0-R-SI0',
    'Int-RI0-S', 'Int-RI0-SI0',
    'IntI0-RI0-S', 'IntI0-RI0-SI0']
    /*
    ,
    friendly: {
        'Int-L-S': 'Pull-through pull-through interchanger above',
        'IntI0-L-S': 'Pull-through pull-through interchanger underneath',
        'Int-R-S': 'Pull-through pull-through inverse interchanger underneath',
        'IntI0-R-S': 'Pull-through pull-through inverse interchanger above'
    }
    */
});


Diagram.prototype.getSource.IntLS = function(type, key) {

    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last());

    var subtype = (type.tail('I0') ? type.substr(0, type.length - 4) : type.substr(0, type.length - 2));
    var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // The subtype is needed to identify which family to call the expansion procedure on

    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    var x, y;

    // If it's an inverse, construction is relatively straightforward
    if (type.tail('I0')) {
        y = box.min.penultimate();
        x = box.min.last() - this.source_size(key.last()) + this.target_size(key.last());
        n += -this.source_size(key.last()) + this.target_size(key.last());
        return [cell].concat(this.getSlice(key.last()).rewrite(cell).expand(subtype, {
            up: x,
            across: y,
            length: l
        }, n, m));
    }

    // Set x
    if (type.tail('Int-L-S', 'IntI0-L-S', 'Int-R-S', 'IntI0-R-S')) {
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
    } else if (type.tail('Int-LI0-S', 'IntI0-LI0-S', 'Int-RI0-S', 'IntI0-RI0-S')) {
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
    } else debugger;

    // Set y
    if (type.tail('Int-L-S', 'IntI0-L-S', 'Int-RI0-S', 'IntI0-RI0-S')) {
        y = box.min.penultimate() - 1;
    } else if (type.tail('Int-LI0-S', 'IntI0-LI0-S', 'Int-R-S', 'IntI0-R-S')) {
        y = box.min.penultimate() + 1;
    } else debugger;

    return this.getSlice(key.last() - steps_back).expand(subtype, {
        up: x,
        across: y,
        length: l
    }, n, m).concat([cell]);
};

Diagram.prototype.getTarget.IntLS = function(type, key) {

    var subtype = (type.tail('I0') ? type.substr(0, type.length - 4) : type.substr(0, type.length - 2));
    var cell = this.cells[key.last()].copy();
    var box = this.getSliceBoundingBox(key.last());
    var steps = 0;

    if (!type.tail('I0')) {
        steps = this.getSlice(key.last()).pseudoExpand(subtype, box, 1);
    }

    var alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
    var l = alpha_box.max.penultimate() - alpha_box.min.penultimate();
    var n = alpha_box.max.last() - alpha_box.min.last();
    

    var m = 1;
    var x, y;

    if (type == 'Int-L-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{//relative: 0
            relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)
            
        }, {relative: -m}, {relative: -l}]);
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('Int-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'IntI0-L-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([
            { relative: 0
                //relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)
                }, {relative: -m}, {relative: -l}]);
        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('IntI0-L', {up: x, across: y, length: l}, n, m));
    }
    if (type == 'Int-LI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{
            //relative: 0
            relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1)

        }, {
            relative: m
        }, {
            relative: l
        }]);

        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();

        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('Int-LI0', {
            up: x,
            across: y,
            length: l
        }, n, m));
    }
    if (type == 'IntI0-LI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{
            relative: 0
                //relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1)
            },
            {
                relative: m
            }, {
                relative: l
            }]);

        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();

        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('IntI0-LI0', {
            up: x,
            across: y,
            length: l
        }, n, m));
    }
    if (type == 'Int-R-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{
            relative: 0 
             //   relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)
            },
            {
                relative: m
            }, {
                relative: -l
            }]);

        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();

        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('Int-R', {
            up: x,
            across: y,
            length: l
        }, n, m));
    }
    if (type == 'IntI0-R-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{
            relative: -(this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1))

            //relative: 0
        }, {
            relative: m
        }, {
            relative: -l
        }]);

        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();

        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('IntI0-R', {
            up: x,
            across: y,
            length: l
        }, n, m));
    }
    if (type == 'Int-RI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{
        //        relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)
            relative: 0

            },
            {
                relative: -m
            }, {
                relative: l
            }]);

        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();

        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('Int-RI0', {
            up: x,
            across: y,
            length: l
        }, n, m));
    }
    if (type == 'IntI0-RI0-S') {
        n += this.target_size(key.last()) - this.source_size(key.last());
        cell.move([{
            relative: -(this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1))
            
            //relative: 0
        }, {
            relative: -m
        }, {
            relative: l
        }]);

        alpha_box = this.getSlice(key.last() - steps).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();

        return [cell].concat(this.getSlice(key.last() - steps).copy().rewrite(cell).expand('IntI0-RI0', {
            up: x,
            across: y,
            length: l
        }, n, m));
    }
    if (type == 'Int-L-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
            relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)

//            relative: 0
        }, {
            relative: m
        }, {
            relative: l
        }]);

        return this.getSlice(key.last()).expand('Int-L', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }
    if (type == 'IntI0-L-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
            relative: 0

//                relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)
            },
            {
                relative: m
            }, {
                relative: l
            }]);

        return this.getSlice(key.last()).expand('IntI0-L', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }
    if (type == 'Int-LI0-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
//            relative: 0
            relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)

        }, {
            relative: -m
        }, {
            relative: -l
        }]);

        return this.getSlice(key.last()).expand('Int-LI0', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }
    if (type == 'IntI0-LI0-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
            relative: 0
            //    relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1)
            },
            {
                relative: -m
            }, {
                relative: -l
            }]);

        return this.getSlice(key.last()).expand('IntI0-LI0', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }
    if (type == 'Int-R-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
            relative: 0

//                relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1)
            },
            {
                relative: -m
            }, {
                relative: l
            }]);

        return this.getSlice(key.last()).expand('Int-R', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }
    if (type == 'IntI0-R-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
            relative: -(this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() - 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() - 1))
            
          //  relative: 0
        }, {
            relative: -m
        }, {
            relative: l
        }]);

        return this.getSlice(key.last()).expand('IntI0-R', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }
    if (type == 'Int-RI0-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
//               relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)
                relative: 0
            },
            {
                relative: m
            }, {
                relative: -l
            }]);

        return this.getSlice(key.last()).expand('Int-RI0', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }
    if (type == 'IntI0-RI0-SI0') {
        alpha_box = this.getSlice(key.last()).getBoundingBox(cell);
        x = alpha_box.min.last();
        y = alpha_box.min.penultimate();
        cell.move([{
            relative: this.getSlice(key.last()).getSlice(alpha_box.min.last()).target_size(alpha_box.min.penultimate() + 1) - this.getSlice(key.last()).getSlice(alpha_box.min.last()).source_size(alpha_box.min.penultimate() + 1)
        }, {
            relative: m
        }, {
            relative: -l
        }]);
        return this.getSlice(key.last()).expand('IntI0-RI0', {
            up: x,
            across: y,
            length: l
        }, n, m).concat([cell]);
    }

    alert('Interchanger ' + type + ' not yet handled');
    throw 0;
}

// Data to insert result of rewrite into diagram
Diagram.prototype.rewritePasteData.IntLS = function(type, key) {
    return this.getTarget(type, key);
}

// Interpret drag of this type
Diagram.prototype.interpretDrag.IntLS = function(drag) {
    if (drag.directions == null) return [];
    var up = drag.directions[0] > 0;
    var key = [drag.coordinates[0]];
    var options = this.getDragOptions(up ?
    ['Int-L-SI0', 'IntI0-L-SI0', 'Int-R-SI0', 'IntI0-R-SI0', 'Int-LI0-SI0', 'IntI0-LI0-SI0', 'Int-RI0-SI0', 'IntI0-RI0-SI0']
    :
    ['Int-L-S', 'IntI0-L-S', 'Int-R-S', 'IntI0-R-S', 'Int-LI0-S', 'IntI0-LI0-S', 'Int-RI0-S', 'IntI0-RI0-S'],
    key);


    // Collect the possible options
    var possible_options = [];
    //msg = 'interpretDrag.IntLS: allowed '
    for (var i = 0; i < options.length; i++) {
        if (options[i].possible) {
            //msg += (possible_options.length != 0 ? ', ' : '') + options[i].type;
            possible_options.push(options[i]);
        }
    }

    // Maybe it's already determined what to do
    if (possible_options.length == 0) return [];
    //console.log(msg);
    return possible_options;
};

Diagram.prototype.interchangerAllowed.IntLS = function(type, key) {

    var cell = this.cells[key.last()];
    var box = this.getSliceBoundingBox(key.last());
    var slice = this.getSlice(key.last());

    var subtype = (type.tail('I0') ? type.substr(0, type.length - 4) : type.substr(0, type.length - 2));
    var subsubtype = (subtype.tail('I0') ? subtype.substr(0, subtype.length - 4) : subtype.substr(0, subtype.length - 2));

    var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // The subtype is needed to identify which family to call the expansion procedure on

    var n = box.max.last() - box.min.last();
    var l = box.max.penultimate() - box.min.penultimate();
    var m = 1;
    var x, y;

    var g1_source = this.source_size(key.last());
    var g1_target = this.target_size(key.last());
    var space_above = (key.last() < this.cells.length - g1_target);
    var space_below = (key.last() >= g1_source);
    var space_left = (cell.box.min.last() > 0);
    var space_right = (cell.box.min.last() + g1_source < slice.cells.length);
    //var space_right = (cell.box.min.last() + slice.target_size(key.penultimate()) < slice.cells.length);


    var space_behind = (box.min.penultimate() > 0);
    var subslice = slice.getSlice(box.min.last());
    var space_infront = (box.max.penultimate() < subslice.cells.length);

    // For the target we need to modify the key of alpha
    if (type === 'Int-L-S') {
        if (!(space_below && space_left && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;
    } else if (type === 'IntI0-L-S') {
        if (!(space_below && space_left && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;
    } else if (type === 'Int-LI0-S') {
        if (!(space_below && space_right && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;
    } else if (type === 'IntI0-LI0-S') {
        if (!(space_below && space_right && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;
    } else if (type === 'Int-R-S') {
        if (!(space_below && space_left && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;
    } else if (type === 'IntI0-R-S') {
        if (!(space_below && space_left && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
        x = box.min.last() - (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() + 1;
    } else if (type === 'Int-RI0-S') {
        if (!(space_below && space_right && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;
    } else if (type === 'IntI0-RI0-S') {
        if (!(space_below && space_right && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
        x = box.min.last() + (box.max.penultimate() - box.min.penultimate());
        y = box.min.penultimate() - 1;
    } else if (type.tail('Int-L-SI0')) {
        if (!(space_above && space_right && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
    } else if (type.tail('IntI0-L-SI0')) {
        if (!(space_above && space_right && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
    } else if (type.tail('Int-LI0-SI0')) {
        if (!(space_above && space_left && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
    } else if (type.tail('IntI0-LI0-SI0')) {
        if (!(space_above && space_left && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
    } else if (type.tail('Int-R-SI0')) {
        if (!(space_above && space_right && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
    } else if (type.tail('IntI0-R-SI0')) {
        if (!(space_above && space_right && space_behind)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(subslice.getLocationBoundingBox([box.min.penultimate() - 1]), getBoundingBoxSource(box))) return false;
    } else if (type.tail('Int-RI0-SI0')) {
        if (!(space_above && space_left && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnRight(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
    } else if (type.tail('IntI0-RI0-SI0')) {
        if (!(space_above && space_left && space_infront)) return false;
        if (!subslice.boundingBoxesSlideDownOnLeft(getBoundingBoxSource(box), subslice.getLocationBoundingBox([box.max.penultimate()]))) return false;
    } else debugger;
    
    var key_start;
    if (type.tail('I0')) {
        x = box.min.last();
        y = box.min.penultimate();
        n += this.target_size(key.last()) - this.source_size(key.last());
        var expanded_list = this.getSlice(key.last()).copy().rewrite(cell).expand(subtype, {up: x, across: y, length: l}, n, m);
        if (!expanded_list) {return false;}
        var source = [cell].concat(expanded_list);
        key_start = 0;
        
        // Special code for empty sources
        if(g1_source === 0 || g1_target === 0){
            var temp_slice = this.getSlice(key.last());
            if(subtype.tail('I0')){
                var offset = -1;
                if(cell.key.last() + offset - (l - 1) < 0) {return false;}
                for(var i = 0; i < l; i++){
                    var aaa = temp_slice.cells[cell.key.last() + offset - i];
                    if(aaa.id != subsubtype) {return false;}
                    var intI_modifier = 0;
                    if (aaa.id === 'IntI0') {intI_modifier = -1;}
                    if(subtype.tail('LI0')){
                        if(!(aaa.key.last() + intI_modifier === box.min.penultimate() - 1 + i)) {return false;}
                    } else if(subtype.tail('RI0')){
                        if(!(aaa.key.last() + intI_modifier === box.min.penultimate() + l - 1 - i)) {return false;}
                    }
                }
                
            }else{
                var offset = n - (this.target_size(key.last()) - this.source_size(key.last()));
                if(cell.key.last() + offset + l - 1 >= temp_slice.cells.length) {return false;}
                for(var i = 0; i < l; i++){
                    var aaa = temp_slice.cells[cell.key.last() + offset + i];
                    if(aaa.id != subsubtype) {return false;}  
                    var intI_modifier = 0;
                    if (aaa.id === 'IntI0') {intI_modifier = -1;}
                    if(subtype.tail('L')){
                        if(!(aaa.key.last() + intI_modifier === box.min.penultimate() + l - 1 - i)) {return false;}
                    } else if(subtype.tail('R')){
                        if(!(aaa.key.last() + intI_modifier === box.min.penultimate() - 1 + i)) {return false;}
                    }
                }
            }
        }


    } else {
        if(x < 0 || key.last() - steps_back < 0 || (x >= this.getSlice(key.last() - steps_back).cells.length && g1_source != 0)) {return false;}
        var expanded_list = this.getSlice(key.last() - steps_back).expand(subtype, {up: x, across: y, length: l}, n, m);
        if (!expanded_list) {return false;}
        var source = expanded_list.concat([cell]);
        key_start = source.length - 1;
        
        // Special code for empty sources
        if(g1_source === 0 || g1_target === 0){
            var temp_slice = this.getSlice(key.last());
            if(subtype.tail('I0')){
                var offset = n;
                if(cell.key.last() + offset + l - 1 >= temp_slice.cells.length) {return false;}
                for(var i = 0; i < l; i++){
                    var aaa = temp_slice.cells[cell.key.last() + offset + i];
                    if(aaa.id != subsubtype) {return false;}
                    var intI_modifier = 0;
                    if (aaa.id === 'IntI0') {intI_modifier = -1;}
                    if(subtype.tail('LI0')){
                        if(!(aaa.key.last() + intI_modifier === box.min.penultimate() + l - 1 - i)) {return false;}
                    } else if(subtype.tail('RI0')){
                        if(!(aaa.key.last() + intI_modifier=== box.min.penultimate() - 1 + i)) {return false;}
                    }
                }
                
            }else{
                var offset = -1;
                if(cell.key.last() + offset - (l - 1) < 0) {return false;}
                for(var i = 0; i < l; i++){
                    var aaa = temp_slice.cells[cell.key.last() + offset - i];
                    if(aaa.id != subsubtype) {return false;}
                    var intI_modifier = 0;
                    if (aaa.id === 'IntI0') {intI_modifier = -1;}
                    if(subtype.tail('L')){
                        if(!(aaa.key.last() + intI_modifier === box.min.penultimate() - 1 + i)) {return false;}
                    } else if(subtype.tail('R')){
                        if(!(aaa.key.last() + intI_modifier === box.min.penultimate() + l - 1 - i)) {return false;}
                    }
                }
            }
        }
        
        /*
        var offset = (subtype.tail('I0')) ? n: -1;
        var aaa = this.getSlice(key.last()).cells[cell.key.last() + offset].id;
        if(aaa!= subsubtype) {return false;}
        */
    }

    // Inspect instruction list
    return this.subinstructions(key, {list: source, key: key_start});

};


Diagram.prototype.getInterchangerBoundingBox.IntLS = function(type, key) {

    var box = this.getSliceBoundingBox(key.last());
    var subtype = (type.tail('I0') ? type.substr(0, type.length - 4) : type.substr(0, type.length - 2));

    if (type.tail('I0')) {
        var correction = this.pullUpMinMax(key.last() + 1, key.last(), box.min.last(), box.max.last());

        box.max[box.max.length - 1] = correction.max;
        box.min[box.min.length - 1] = correction.min;

        var steps_front = this.getSlice(key.last() + 1).pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    } else {
        var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    }

    var alpha_box = this.getLocationBoundingBox(key.last());
    var edge_box; // Which edge exactly do we need?

    if (type.tail('L-S')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1,
                box.min.last() - (box.max.penultimate() - box.min.penultimate()), // we subtract the # of crossings
                key.last() - steps_back]);
    }
    if (type.tail('L-SI0')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1,
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]); // We need the '+1' to account for the cell itself, not just the 'pull-throughs'
    }
    if (type.tail('LI0-S')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1,
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() - steps_back]);
    }
    if (type.tail('LI0-SI0')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1,
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]);
    }
    if (type.tail('R-S')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1,
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() - steps_back]);
    }
    if (type.tail('R-SI0')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1,
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]);
    }
    if (type.tail('RI0-S')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() - 1,
                box.min.last() + (box.max.penultimate() - box.min.penultimate()),
                key.last() - steps_back]);
    }
    if (type.tail('RI0-SI0')) {
        edge_box = this.getLocationBoundingBox([box.min.penultimate() + 1,
                box.min.last() - (box.max.penultimate() - box.min.penultimate()),
                key.last() + steps_front + 1]);
    }


    return this.unionBoundingBoxes(alpha_box, edge_box);
};


Diagram.prototype.getInterchangerCoordinates.IntLS = function(type, key) {
    return this.getInterchangerBoundingBox(type, key).min;

}

Diagram.prototype.getInverseKey.IntLS = function(type, key) {
    
    var box = this.getSliceBoundingBox(key.last());
    var subtype = (type.tail('I0') ? type.substr(0, type.length - 4) : type.substr(0, type.length - 2));

    if (type.tail('I0')) {
/*
    
        var correction = this.pullUpMinMax(key.last() + 1, key.last(), box.min.last(), box.max.last());
        box.max[box.max.length - 1] = correction.max;
        box.min[box.min.length - 1] = correction.min;
    
    var a = this.target_size(key.last());
    var b = this.source_size(key.last())
        box.max[box.max.length - 1] += this.source_size(key.last()) - this.target_size(key.last());
*/
    
        var steps_front = this.getSlice(key.last() + 1).pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    } else {
        var steps_back = this.getSlice(key.last()).pseudoExpand(subtype, box, 1); // type just needed to correctly identify the family
    }

    if (type.tail('L-S')) {return [key.last() - steps_back]}
    if (type.tail('L-SI0')){return [key.last() + steps_front]}
    if (type.tail('LI0-S')){return [key.last() - steps_back]}
    if (type.tail('LI0-SI0')){return [key.last() + steps_front]}
    if (type.tail('R-S')) {return [key.last() - steps_back]}
    if (type.tail('R-SI0')){return [key.last() + steps_front]}
    if (type.tail('RI0-S')){return [key.last() - steps_back]}
    if (type.tail('RI0-SI0')){return [key.last() + steps_front]}
}


/* NEEDED FOR 5-CATEGORIES
Diagram.prototype.expand(type, start, n, m) {
    
}
*/
