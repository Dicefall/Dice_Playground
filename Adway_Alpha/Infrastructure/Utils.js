// Loosely connected utility functions held together in one place

// The cost to buy multiples of buildings.
function getTotalMultiCost(baseCost, multiBuyCount, costScaling, isCompounding) {
    if (!isCompounding) {
        // simplified formula: (NND - ND + 2BN) / 2
        // N (ND - D + 2BN) / 2
        return multiBuyCount * (multiBuyCount * costScaling - costScaling + 2 * baseCost) / 2;
    } else {
        // S = A * (1 - r^n) / (1 - r)
        return baseCost * (1 - Math.pow(costScaling, multiBuyCount) / (1 - costScaling));
    }
}

// Find out the most one can afford with given resources
function getMaxAffordable(baseCost, totalResource, costScaling, isCompounding) {

    // Take multibuy cost formula, solve for N instead of S
    if (!isCompounding) {
        return Math.floor(
            (costScaling - (2 * baseCost) + Math.sqrt(Math.pow(2 * baseCost - costScaling, 2) + (8 * costScaling * totalResource))) / 2
        );
    } else {
        return Math.floor(Math.log(1 - (1 - costScaling) * totalResource / baseCost) / Math.log(costScaling));

    }
}

// Format numbers for text displaying. Cleans a lot of display up
function formatNumber(number) {

    // Options are:
    // Scientific, Engineering, Log, 

    // Check for infinite:
    if (!isFinite(number)) return GameText.Icons.Infinity;

    // Negative
    if (number < 0) return '-' + formatNumber(-number);

    // Don't want negative exponents just yet
    if (number < 0.0001 && number > 0) return 'ε';

    // Handling below 1, looks weird to see 0 when it's small but still > 0
    //if (number < 1) return number.toFixed(2);

    // Get base and exponent
    // Number expressed by: mantissa * 10 ^ exponent
    var exponent = Math.floor(Math.log10(number));
    var mantissa = number / Math.pow(10, exponent);

    // Clean up weird float precision for numbers less than 10k
    if (exponent <= 3) return Math.floor(number);

    // For larger numbers start dealing with notations
    switch (Game.Settings.NumberNotation) {
        case 'Scientific':
            return mantissa.toFixed(2) + 'e' + exponent.toString();
        case 'Standard':
            // TODO: See Conway and Guy's construction for standard notation

            return mantissa.toFixed(2)
        case 'Engineering':
            var precision = exponent % 3;
            return (mantissa * (Math.pow(10, precision))).toFixed(2 - precision) + 'e' + (exponent - precision);
        case 'Log':
            return 'e' + Math.log10(number).toFixed(2);
        default:
            return number;
    }
}