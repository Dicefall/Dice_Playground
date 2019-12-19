// Hey a bunch of weird misc JS functions for game things here

function critcCalc(critChance) {

    var totalHits = 0;

    //Approximate average over 1000 attempts:
    for (var i = 0; i<1000; i++) {

        var consecutiveCrits = 0;
        while (consecutiveCrits < 10) {
            totalHits++;
            if (Math.random() < critChance) {
                consecutiveCrits++;
            } else {
                consecutiveCrits = 0;
            }
        }
    }

    return totalHits / 1000;
}

function ghostCalc(critChance) {


    //(1 - p^10) / ((1 - p) * p^10)
    var expectedResult =  (1 - Math.pow(critChance,10)) / ((1 - critChance) * Math.pow(critChance,10));

    return expectedResult;
}

function specCalc(critChance) {
    
    // sum 1 -> 10: 1 / (c ^ n)
    var expectedResult = 0;
    for (var i = 1; i <= 10; i++) {
        expectedResult += (1 / Math.pow(critChance,i));
    }

    return expectedResult;
}


// NGU

function WandoosBreakpoint(energyLevel, magicLevel) {
    // "When is it better to switch to higher os level"
    // Considerations: energy/magic being put in, time
    // Assuming not at max energy

    let wandoos98 = Math.pow((1 + (energyLevel/100)) * (1 + (magicLevel/25)),0.8);

    energyLevel /= 1000;
    magicLevel /= 1000;

    let wandoosMEH = (1 + (energyLevel/5)) * (1 + (magicLevel*2));

    energyLevel /= 1000;
    magicLevel /= 1000;

    let wandoosXL = Math.pow((1 + (energyLevel*6)) * (1 + (magicLevel * 40)),1.5);

    return (wandoos98 > wandoosMEH ?
        wandoos98 > wandoosXL ? "Wandoos 98" : "Wandoos XL" :
        wandoosMEH > wandoosXL ? "Wandoos MEH" : "Wandoos XL");
}

function arithmeticSum(B, D, N) {
    //try different stuff

    var gfAverage = N * (B + (B + D * (N -1))) / 2;
    // N(DN - D + 2B) / 2
    // (NND - ND + 2BN) / 2

    var myWeirdness = B * N + (D * (N * (N - 1) / 2));
    // BN + (DNN - DN) / 2
    // (NND - ND + 2BN) / 2

    var stackexchange = (N / 2) * ((2 * B) + D * (N - 1));
    // (DN - D + 2B) * N / 2
    // (NND - ND + 2BN) / 2

    var taketwo = (N * N * D - N * D + 2*B*N) / 2;
    // NND - ND + 2BN / 2
    // (NND + (2B - D)N + 0) / 2

    console.log(gfAverage);
    console.log(myWeirdness);
    console.log(stackexchange);
    console.log(taketwo);

}

function boundedArithmeticMax(B, D, maxValue) {
    // trying stuff

    // (NND + (2B - D)N + 0) / 2
    // NND + N(2B - D) - 2V = 0

    // N = -(2B - D) + sqrt( pow(2B-D) - 4(D)(-2V)) / 2D
    // N = D - 2B + sqrt(4BB + DD + 8DV) / 2D
    var gfHelp;


    return (Math.sqrt(Math.pow(D - 2*B,2) + 2*D*maxValue) - 2*B + D) / (2*D);
}

// geometric cost
// A = initial value
// R = ratio
// S = sum
// N = number of terms

// S = a * (1 - r^n) / (1 - r)
// isolate N and solve
// 1 - ((1-r) * S / A) = r^n
// log (R) (1 - ((1-r) * s / A)) = N

// ln ((1 - ((1-r) * s / A)) / ln R

function getMaxGeoBuy(baseCost, ratio, maxValue){
    var A = baseCost;
    var R = ratio;
    var S = maxValue;

    return Math.log(1 - (1-R) * S / A) / Math.log(R);
}

