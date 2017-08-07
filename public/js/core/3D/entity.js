class CellEntity {

    constructor(key, source, target, meta = null) {
        this.key = key;
        this.source = source;
        this.target = target;
        this.meta = meta;
    }

    static of(diagram, level) {
        // Obtain cell at the given level
        let cell = diagram.cells[level];

        // Source span
        let sourceStart = 0;
        let sourceEnd = 1;

        if (cell.box && cell.box.min.length > 0) {
            sourceStart = cell.box.min.last();
            sourceEnd = cell.box.max.last();
        }

        let sourceSpan = new Span(sourceStart, sourceEnd);

        // Target
        let target;
        if (cell.id.is_interchanger()) {
            target = new Diagram(null, diagram.getSlice(level).rewritePasteData(cell.id, cell.key));
        } else {
            target = gProject.signature.getGenerator(cell.id).target;        
        }

        // Target span
        let targetStart = sourceStart;
        let targetLength = target ? target.cells.length : 0;
        let targetEnd = targetStart + targetLength;
        let targetSpan = new Span(targetStart, targetEnd);

        // Cone?
        //let cone = cell.id != "Int" && cell.id != "IntI0";

        // Key
        let key = cell.box.min;

        // Meta information
        let meta = getMeta(diagram, level);

        return new CellEntity(key, sourceSpan, targetSpan, meta);
    }

    static topProjected(diagram) {
        while (true) {
            if (diagram.cells.length > 0) {
                let meta = getMeta(diagram, diagram.cells.length - 1);
                let source = new Span(0, 0);
                let target = new Span(0, 0);
                let key = [];
                return new CellEntity(key, source, target, meta);
            } else {
                diagram = diagram.getSourceBoundary();
            }
        }
    }

}

class IdentityEntity {

    constructor() {}

    get source() {
        throw new Error();
    }

    get target() {
        throw new Error();
    }

    get key() {
        throw new Error();
    }

    get meta() {
        throw new Error();
    }

}