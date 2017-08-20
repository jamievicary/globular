/**
 * Translates a geometry in scaffold coordinates to more aesthetic, coordinates;
 * the original geometry is modified.
 *
 * The geometry must have been generated for the diagram with the supplied
 * scaffold.
 *
 * @param {Scaffold} scaffold
 * @param {Geometry} geometry
 */
const layoutGeometry3D = (scaffold, geometry, skip = 0) => {
    // Construct the layout builder
    let builder = slice => new TrivialLayout(slice);
    for (let d = 2; d <= scaffold.dimension; d++) {
        builder = (b => slice => new FixpointLayout(slice, b, 0.5))(builder);
    }

    // Build the layout
    let layout = builder(scaffold);

    // Layout the geometry
    geometry.move(point => {
        if (point.length == 0) return point;

        let rest = layout.layoutPoint(point);
        let height = roundQuarter(point[point.length - 1]);
        return rest.concat([height]);
    });
}

const roundQuarter = (x) => {
    let quarter = getQuarter(x);

    if (quarter == 1) {
        return Math.floor(x);
    } else if (quarter == 3) {
        return Math.ceil(x);
    } else {
        return x;
    }
}

class FixpointLayout {

    constructor(scaffold, base, padding) {
        this.scaffold = scaffold;
        this.layout = [];
        this.padding = padding;

        this.base = [];
        for (let level = 0; level <= this.scaffold.size; level += 0.5) {
            this.base.push(base(scaffold.getSlice(level)));
        }

        for (let level = 0; level <= this.scaffold.size; level += 1) {
            this.layout.push(Array(this.scaffold.getSlice(level).size * 4 + 5).fill(0));
        }

        this.computeLinks();

        let max = 1000;
        let done = false;
        for (let i = 0; i < max; i++) {
            if (!this.step()) {
                done = true;
                break;
            }
        }
    }

    computeLinks() {
        this.sourceLinks = [];
        this.targetLinks = [];

        for (let level = 0; level < this.scaffold.size; level++) {
            this.sourceLinks.push(this.computeLinksLevel(level, "s"));
            this.targetLinks.push(this.computeLinksLevel(level, "t"));
        }
    }

    heightToIndex(height) {
        return (height + 0.5) / 0.25;
    }

    computeLinksLevel(level, boundary) {
        let entity = this.scaffold.entities[level];
        let action = boundary == "s" ? entity.sourceAction() : entity.targetAction();

        let halfSize = this.scaffold.getSlice(level + 0.5).size;
        let links = Array(halfSize * 4 + 5).fill(null).map(() => new Set());

        let sliceLevel = boundary == "s" ? level : level + 1;
        let sliceSize = this.scaffold.getSlice(sliceLevel).size;

        for (let height = -0.5; height <= sliceSize + 0.5; height += 0.25) {
            let updated = action.updateHeight(height);
            links[this.heightToIndex(updated)].add(this.heightToIndex(height));
        }

        return links.map(set => [...set]);
    }

    step() {
        let problem = false;

        // Ensure points are padded enough horizontally
        for (let i = 0; i < this.layout.length; i++) {
            let line = this.layout[i];

            for (let j = 1; j < line.length; j++) {
                let padding = (j % 4 == 0 || j % 4 == 1) && (j > 1 && j < line.length - 3) ? this.padding : 0;
                let minimum = line[j - 1] + padding;

                if (line[j] < minimum) {
                    problem = true;
                    line[j] = minimum;
                }
            }
        }

        for (let level = 0; level < this.scaffold.size; level++) {
            let sourceLinks = this.sourceLinks[level];
            let targetLinks = this.targetLinks[level];

            for (let i = 0; i < sourceLinks.length; i++) {
                let sourceLink = sourceLinks[i];
                let targetLink = targetLinks[i];

                if (sourceLink.length == 0 && targetLink.length != 0) {
                    debugger;
                }

                if (sourceLink.length == 0 || targetLink.length == 0) continue;

                let sourceAverage = 0;
                for (let j = 0; j < sourceLink.length; j++) {
                    sourceAverage += this.layout[level][sourceLink[j]];
                }
                sourceAverage = sourceAverage / sourceLink.length;

                let targetAverage = 0;
                for (let j = 0; j < targetLink.length; j++) {
                    targetAverage += this.layout[level + 1][targetLink[j]];
                }
                targetAverage = targetAverage / targetLink.length;

                let diff = Math.abs(sourceAverage - targetAverage);
                if (diff > 0.01) {
                    problem = true;

                    let link = sourceAverage > targetAverage ? targetLink : sourceLink;
                    let line = sourceAverage > targetAverage ? this.layout[level + 1] : this.layout[level];

                    for (let j = 0; j < link.length; j++) {
                        line[link[j]] += diff;
                    }
                }
            }
        }

        return problem;
    }

    getSlice(level) {
        if (level <= 0) {
            return this.base[0];
        } else if (level >= this.scaffold.size) {
            return this.base[this.base.length - 1];
        }

        return this.base[roundQuarter(level) * 2];
    }

    layoutPoint(point) {
        let x = point.penultimate();
        let y = point.last();

        let rest = this.getSlice(y).layoutPoint(point.slice(0, -1));

        y = roundQuarter(y);
        if (y < 0) {
            y = 0;
        } else if (y > this.scaffold.size) {
            y = this.scaffold.size;
        }

        if (x < 0) {
            return rest.concat([x]);
        } else if (x > this.scaffold.getSlice(y).size) {
            x = this.layout[Math.floor(y)].last() + (x - this.scaffold.getSlice(y).size);
            return rest.concat([x]);
        }

        if (Math.floor(y) + 0.5 == y) {
            let level = Math.floor(y);
            let sourceLink = this.sourceLinks[level][this.heightToIndex(x)];
            let targetLink = this.targetLinks[level][this.heightToIndex(x)];

            if (sourceLink.length == 0 || targetLink.length == 0) {
                throw new Error(`Point (${point.join(", ")}) can't be laid out.`);
            }

            let average = 0;
            for (let j = 0; j < sourceLink.length; j++) {
                average += this.layout[level][sourceLink[j]];
            }
            for (let j = 0; j < targetLink.length; j++) {
                average += this.layout[level + 1][targetLink[j]];
            }
            average = average / (sourceLink.length + targetLink.length);

            return rest.concat([average]);
        } else {
            return rest.concat([this.layout[y][this.heightToIndex(x)]]);
        }
    }

}

class TrivialLayout {

    constructor(base) {
        this.base = base;
    }

    layoutPoint(p) {
        return p.slice(0, -1);
    }

}
