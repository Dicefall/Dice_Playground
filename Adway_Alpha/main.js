function mainLoop() {
    // Resource gathering

    // Scraps
    Game.Resources.Scraps += (Game.Resources.ScrapsIncome * (Game.Settings.GameSpeed / 1000));
    allEvents.queueEvent(allEvents.EventTypes.SCRAPS_RECIEVED);

    // Scrap conversion

    // Combat 

    // Update UI
    document.querySelector('#scrapDisplay').textContent = 
        ParseGameText(
            GameText.English.UI.Scraps,
            formatNumber(Game.Resources.Scraps)
            );

}

// Utility Functions

// Get a hero based on it's name, might be useful one day?
function getHeroByName(heroName) {

    var toReturn = null;

    Game.Heroes.forEach(hero => {
        if (hero.Name === heroName) {
            toReturn = hero;
        }
    })

    return toReturn;
}

// Format numbers for text displaying. Cleans a lot of stuff up
function formatNumber(number) {
    
    // Ooptions are:
    // Scientific, Engineering, "Standard", More?

    // Check for infinite:
    if (!isFinite(number)) return '<i class="fas fa-infinity"></i>';

    // Get base and exponent
    // Turns into: mantissa * 10 ^ exponent
    var exponent = Math.floor(Math.log10(number));
    var mantissa = number / Math.pow(10,exponent);

    // Clean up weird float precision for numbers less than 10k
    if (exponent <= 3) return Math.floor(number);
    
    switch (Game.Settings.NumberNotation) {
        case 'Scientific':
            return mantissa.toFixed(2) + 'e' + exponent.toString();
        case 'Standard':
            // TODO: See Conway and Guy's construction for standard notation

            return mantissa.toFixed(2)
        case 'Engineering':
            var precision = exponent % 3;
            return (mantissa * (10 ^ precision)).toFixed(2 - precision) + 'e' + (exponent - precision);
        default:
            return number;
    }
}

/*function prettify(number) {

	if (number >= 1000 && number < 10000) return Math.floor(number);
	if (number == 0) return prettifySub(0);
	if (number < 0) return "-" + prettify(-number);
	if (number < 0.005) return (+number).toExponential(2);

	var base = Math.floor(Math.log(number)/Math.log(1000));
	if (base <= 0) return prettifySub(number);

	if(game.options.menu.standardNotation.enabled == 5) {
		//Thanks ZXV
		var logBase = game.global.logNotBase;
		var exponent = Math.log(number) / Math.log(logBase);
		return prettifySub(exponent) + "L" + logBase;
	}


	number /= Math.pow(1000, base);
	if (number >= 999.5) {
		// 999.5 rounds to 1000 and we don’t want to show “1000K” or such
		number /= 1000;
		++base;
	}
	if (game.options.menu.standardNotation.enabled == 3){
		var suffices = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
		if (base <= suffices.length) suffix = suffices[base -1];
		else {
			var suf2 = (base % suffices.length) - 1;
			if (suf2 < 0) suf2 = suffices.length - 1;
			suffix = suffices[Math.ceil(base / suffices.length) - 2] + suffices[suf2];
		}
	}
	else {
		var suffices = [
			'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud',
            'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Od', 'Nd', 'V', 'Uv', 'Dv',
            'Tv', 'Qav', 'Qiv', 'Sxv', 'Spv', 'Ov', 'Nv', 'Tg', 'Utg', 'Dtg', 'Ttg',
            'Qatg', 'Qitg', 'Sxtg', 'Sptg', 'Otg', 'Ntg', 'Qaa', 'Uqa', 'Dqa', 'Tqa',
            'Qaqa', 'Qiqa', 'Sxqa', 'Spqa', 'Oqa', 'Nqa', 'Qia', 'Uqi', 'Dqi',
            'Tqi', 'Qaqi', 'Qiqi', 'Sxqi', 'Spqi', 'Oqi', 'Nqi', 'Sxa', 'Usx',
            'Dsx', 'Tsx', 'Qasx', 'Qisx', 'Sxsx', 'Spsx', 'Osx', 'Nsx', 'Spa',
            'Usp', 'Dsp', 'Tsp', 'Qasp', 'Qisp', 'Sxsp', 'Spsp', 'Osp', 'Nsp',
            'Og', 'Uog', 'Dog', 'Tog', 'Qaog', 'Qiog', 'Sxog', 'Spog', 'Oog',
            'Nog', 'Na', 'Un', 'Dn', 'Tn', 'Qan', 'Qin', 'Sxn', 'Spn', 'On',
            'Nn', 'Ct', 'Uc'
		];
		var suffix;
		if (game.options.menu.standardNotation.enabled == 2 || (game.options.menu.standardNotation.enabled == 1 && base > suffices.length) || (game.options.menu.standardNotation.enabled == 4 && base > 31))
			suffix = "e" + ((base) * 3);
		else if (game.options.menu.standardNotation.enabled && base <= suffices.length)
			suffix = suffices[base-1];
		else
		{
			var exponent = parseFloat(numberTmp).toExponential(2);
			exponent = exponent.replace('+', '');
			return exponent;
		}
	}
	return prettifySub(number) + suffix;
}
*/

// Saving Functions, currently unused
// TODO: Maybe look at the lz-string thing other games do----------------------
function saveGameToLocal() {
    window.localStorage.setItem("ADWAY_Save", JSON.stringify(Game));
}

function loadGameFromLocal() {
    Game = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
}
// ----------------------------------------------------------------------------

// Combat ---------------------------------------------------------------------
// Everything combat here, including class perks and anything else that needs
// to be dealt with for combat.

// Main Combat
function mainCombat() {

}

// Turn order
function advanceTurns(){
    
}

// Start a new combat encounter
function newEncounter() {

    // Reset any per-combat stats
    Game.Heroes.forEach(hero => {
        hero.CurrentTurnOrder = 10000 / hero.Speed;
    });

    // Get enemy(s) and set them up
}


// ----------------------------------------------------------------------------

var goldAchievementGetID = 0;

function tieredScrapAchievement(){

    let nextTier = Game.Persistents.Achievements.Scraps.TierBreakpoints[Game.Persistents.Achievements.Scraps.BreakpointEarned]

    while (Game.Resources.Scraps >= nextTier)
    {
        //console.log("Achievement recieved: Acquire 100 Scraps!");
        console.log(ParseGameText("Achievement recieved: Acquire {0} Scraps!",nextTier));
        Game.Persistents.Achievements.Scraps.BreakpointEarned++;

        if (Game.Persistents.Achievements.Scraps.BreakpointEarned >= Game.Persistents.Achievements.Scraps.TierBreakpoints.length) {
            allEvents.removeEvent(
                Game.Persistents.Achievements.Scraps.HandlerID);
        }
    }
}

window.onload = function() {
    
    // Get previous save from localstorage, check later for online save
    //loadGameFromLocal();

    //Testing
    Game.Persistents.Achievements.Scraps.HandlerID = 
        allEvents.registerListener(
            allEvents.EventTypes.SCRAPS_RECIEVED,
            tieredScrapAchievement);

    // Queue up main loop 
    window.setInterval(mainLoop, Game.Settings.GameSpeed);

};