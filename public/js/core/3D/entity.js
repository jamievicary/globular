class Entity {

    constructor(source, target, cone = true) {
        this.source = source;
        this.target = target;
        this.cone = cone;
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
        let cone = cell.id != "Int" && cell.id != "IntI0";

        return new Entity(sourceSpan, targetSpan, cone);
    }

}