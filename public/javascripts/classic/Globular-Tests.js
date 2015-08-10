// Creation of a 0-signature with 11 0-cells and then creating diagrams of each of them - basis for creating more complicated diagrams
function test1() {
    var s0 = new Signature(null);
    s0.growSignature(new Generator(null, null, "A"));
    s0.growSignature(new Generator(null, null, "B"));
    s0.growSignature(new Generator(null, null, "C"));
    s0.growSignature(new Generator(null, null, "D"));
    s0.growSignature(new Generator(null, null, "E"));
    s0.growSignature(new Generator(null, null, "F"));
    s0.growSignature(new Generator(null, null, "G"));
    s0.growSignature(new Generator(null, null, "H"));
    s0.growSignature(new Generator(null, null, "I"));
    s0.growSignature(new Generator(null, null, "J"));
    s0.growSignature(new Generator(null, null, "K"));
    var dA = s0.createDiagram("A");
    var dB = s0.createDiagram("B");
    var dC = s0.createDiagram("C");
    var dD = s0.createDiagram("D");
    var dE = s0.createDiagram("E");
    var dF = s0.createDiagram("F");
    var dG = s0.createDiagram("G");
    var dH = s0.createDiagram("H");
    var dI = s0.createDiagram("I");
    var dJ = s0.createDiagram("J");
    var dK = s0.createDiagram("K");
}

// Create a 2-cell with one incoming edge and one outgoing edge
function test2() {

    var sig = new Signature(zeroSig);

    var oneGenerator = new Generator(diagA, diagB, "alfa");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagB, "beta");
    sig.growSignature(oneGenerator);

    var diagAlfa = sig.createDiagram("alfa");
    var diagBeta = sig.createDiagram("beta");

    var TwoGenerator = new Generator(diagAlfa, diagBeta, "omega");

    sig = new Signature(sig);
    sig.growSignature(TwoGenerator);

    var diag = sig.createDiagram("omega");
    diag.print();
}

// Create a 2-cell with 2 incoming edges and three outgoing edges
function test3() {            

    var sig = new Signature(zeroSig);

    var oneGenerator = new Generator(diagA, diagB, "alfa");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagB, diagC, "beta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagC, diagD, "gamma");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagH, "delta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagH, diagD, "eta");
    sig.growSignature(oneGenerator);

    var diagAlfa = sig.createDiagram("alfa");
    var diagBeta = sig.createDiagram("beta");
    var diagGamma = sig.createDiagram("gamma");
    var diagDelta = sig.createDiagram("delta");
    var diagEta = sig.createDiagram("eta");

    diagAlfa.attach(diagBeta, diagAlfa.targetBoundary, ['t'], true);
    diagAlfa.attach(diagGamma, diagAlfa.targetBoundary, ['t'], true);
    diagDelta.attach(diagEta, diagDelta.targetBoundary, ['t'], true)

    var TwoGenerator = new Generator(diagAlfa, diagDelta, "omega");

    sig = new Signature(sig);
    sig.growSignature(TwoGenerator);

    var diag = sig.createDiagram("omega");
    diag.print();
}

// Creates two 2-cells each with one incoming and outgoing edge, then 1-composes them
function test4() {

    var sig = new Signature(zeroSig);

    var oneGenerator = new Generator(diagA, diagB, "alfa");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagB, "beta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagB, diagD, "gamma");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagB, diagD, "delta");
    sig.growSignature(oneGenerator);

    var diagAlfa = sig.createDiagram("alfa");
    var diagBeta = sig.createDiagram("beta");
    var diagGamma = sig.createDiagram("gamma");
    var diagDelta = sig.createDiagram("delta");

    sig = new Signature(sig);

    var twoGenerator = new Generator(diagAlfa, diagBeta, "omega");
    sig.growSignature(twoGenerator);

    twoGenerator = new Generator(diagGamma, diagDelta, "omikron");
    sig.growSignature(twoGenerator);

    var diag = sig.createDiagram("omega");
    var diagPrime = sig.createDiagram("omikron");

    diag.attach(diagPrime, diag.targetBoundary.targetBoundary, ['t', 't'], true);
    console.log(diag);
    diag.print();
}

// Creates two 2-cells each with one incoming and outgoing edge, then 2-composes them
function test5() {

    var sig = new Signature(zeroSig);

    var oneGenerator = new Generator(diagA, diagB, "alfa");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagB, "beta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagB, "gamma");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagB, "delta");
    sig.growSignature(oneGenerator);

    var diagAlfa = sig.createDiagram("alfa");
    var diagBeta = sig.createDiagram("beta");
    var diagGamma = sig.createDiagram("gamma");
    var diagDelta = sig.createDiagram("delta");

    sig = new Signature(sig);

    var twoGenerator = new Generator(diagAlfa, diagBeta, "omega");
    sig.growSignature(twoGenerator);

    twoGenerator = new Generator(diagGamma, diagDelta, "omikron");
    sig.growSignature(twoGenerator);

    var diag = sig.createDiagram("omega");
    var diagPrime = sig.createDiagram("omikron");

    diag.attach(diagPrime, diag.targetBoundary, ['t'], true);
    console.log(diag);
    diag.print();
}

// Composition of a 2-diagram and a 1-diagram boosted up to identity
function test6() {

    var sig = new Signature(zeroSig);

    var oneGenerator = new Generator(diagA, diagB, "alfa");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagC, "beta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagC, "gamma");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagB, "delta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagC, diagB, "eta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagC, diagB, "epsilon");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagB, diagE, "kappa");
    sig.growSignature(oneGenerator);

    var diagAlfa = sig.createDiagram("alfa");
    var diagBeta = sig.createDiagram("beta");
    var diagGamma = sig.createDiagram("gamma");
    var diagDelta = sig.createDiagram("delta");
    var diagEta = sig.createDiagram("eta");
    var diagEpsilon = sig.createDiagram("epsilon");

    diagBeta.attach(diagEta, diagDelta.targetBoundary, ['t'], true);
    diagGamma.attach(diagEpsilon, diagDelta.targetBoundary, ['t'], true);


    sig = new Signature(sig);

    var twoGenerator = new Generator(diagAlfa, diagBeta, "omega");
    sig.growSignature(twoGenerator);

    twoGenerator = new Generator(diagGamma, diagDelta, "omikron");
    sig.growSignature(twoGenerator);

    var diagId = sig.createDiagram("kappa");
    console.log(diagId);


    var diag = sig.createDiagram("omega");
    var diagPrime = sig.createDiagram("omikron");

    diag.attach(diagId, diag.targetBoundary.targetBoundary, ['t', 't'], true);

    diag.print();
}

function test7() {
    var sig = new Signature(zeroSig);

    var oneGenerator = new Generator(diagA, diagB, "alfa");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagC, "beta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagC, "gamma");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagA, diagB, "delta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagC, diagB, "eta");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagC, diagB, "epsilon");
    sig.growSignature(oneGenerator);

    oneGenerator = new Generator(diagB, diagE, "kappa");
    sig.growSignature(oneGenerator);

    var diagAlfa = sig.createDiagram("alfa");
    var diagBeta = sig.createDiagram("beta");
    var diagGamma = sig.createDiagram("gamma");
    var diagDelta = sig.createDiagram("delta");
    var diagEta = sig.createDiagram("eta");
    var diagEpsilon = sig.createDiagram("epsilon");
    var diagEtaPrime = sig.createDiagram("eta");
    var diagEpsilonPrime = sig.createDiagram("epsilon");
    var diagKappaPrime = sig.createDiagram("kappa");

    diagBeta.attach(diagEta, diagDelta.targetBoundary, ['t'], true);
    diagGamma.attach(diagEpsilon, diagDelta.targetBoundary, ['t'], true);


    sig = new Signature(sig);

    var twoGenerator = new Generator(diagAlfa, diagBeta, "omega");
    sig.growSignature(twoGenerator);

    twoGenerator = new Generator(diagGamma, diagDelta, "omikron");
    sig.growSignature(twoGenerator);

    // In the current setup essential to create these diagrams here (after raising the signature level), to 
    //ensure that they are boosted up
    var diagKappa = sig.createDiagram("kappa");
    var diagBetaPrime = sig.createDiagram("beta");
    var diagOmega = sig.createDiagram("omega");

    diagOmega.attach(diagKappa, diagOmega.targetBoundary.targetBoundary, ['t', 't'], true);

    diagEtaPrime.attach(diagKappaPrime, diagEtaPrime.targetBoundary, ['t'], true);

    twoGenerator = new Generator(diagEtaPrime, diagEpsilonPrime, "iota");
    sig.growSignature(twoGenerator);

    var diagIota = sig.createDiagram("iota");

    diagBetaPrime.attach(diagIota, diagBetaPrime.targetBoundary.targetBoundary, ['t', 't'], true);

    diagOmega.attach(diagBetaPrime, diagOmega.targetBoundary, ['t'], true);

    console.log(diagOmega);
    diagOmega.print();    
}