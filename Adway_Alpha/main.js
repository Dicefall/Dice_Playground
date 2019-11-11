function mainLoop() {
    // Resource gathering

    // Scraps
    Game.Resources.Scraps += (Game.Resources.ScrapsIncome * (Game.Settings.GameSpeed / 1000));
    allEvents.queueEvent(allEvents.EventTypes.SCRAPS_RECIEVED);

    // Scrap conversion

    // Combat
    // Advance turn cds
    Game.Heroes.forEach(hero => {
        hero.CurrentTurnOrder -= Game.Settings.GameSpeed * hero.Speed;
    });

    Game.Enemies.forEach(badguy => {
        badguy.CurrentTurnOrder -= Game.Settings.GameSpeed * badguy.Speed;
    })

    // Go through actors capable of acting and do the thing.
    var nextActor = null;
    do {
        nextActor = null;
        Game.Heroes.forEach(actor => {
            if (actor.CurrentTurnOrder < 0) {
                if (nextActor != null) {
                    if (actor.CurrentTurnOrder < nextActor.CurrentTurnOrder) {
                        nextActor = actor;
                    }
                } else {
                    nextActor = actor;
                }
            }
        });

        Game.Enemies.forEach(actor => {
            if (actor.CurrentTurnOrder < 0) {
                if (nextActor != null) {
                    if (actor.CurrentTurnOrder < nextActor.CurrentTurnOrder) {
                        nextActor = actor;
                    }
                } else {
                    nextActor = actor;
                }
            }
        });

        if (nextActor != null) {
            nextActor.CurrentTurnOrder += 1000;
        }

    } while (nextActor != null)

    // Update UI
    UpdateUIElements();

    Game.Persistents.Stats.LastUpdateTime = Date().getTime();
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

// Format numbers for text displaying. Cleans a lot of display up
function formatNumber(number) {
    
    // Ooptions are:
    // Scientific, Engineering, "Standard", More?

    // Check for infinite:
    if (!isFinite(number)) return '<i class="fas fa-infinity"></i>';
    if (number < 0) return '-' + formatNumber(-number);

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
            return (mantissa * (Math.pow(10,precision))).toFixed(2 - precision) + 'e' + (exponent - precision);
        default:
            return number;
    }
}

/*function prettify(number) {	

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
	}
}
*/

function UpdateUIElements(){

    // Scrap counter
    document.querySelector('#scrapDisplay').textContent = 
        ParseGameText(
            GameText.English.UI.Scraps,
            formatNumber(Game.Resources.Scraps)
            );

    // Turn order visual testing
    document.querySelector('#MerylOrder').textContent = 
        ParseGameText(
            'Meryl\'s current turn counter: {0}',
            formatNumber(getHeroByName('Meryl').CurrentTurnOrder)
        );
}

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

// Start a new combat encounter
function newEncounter() {

    // Reset any per-combat stats
    Game.Heroes.forEach(hero => {
        hero.CurrentTurnOrder = 10000 / hero.Speed;
    });

    // Get enemy(s) and set them up
}

// Who knows when stats will get into a weird state that needs to be reset
function recalcStats() {

    // Base stats basically
    Game.Heroes.forEach(hero => {
        hero.Speed = 15; // No speed mods yet
        hero.Attack = 10; // no attack mods yet
        hero.HealthMax = 100; // no health mods yet
    })
}

function startWorldZone(){}

function spawnMap(){}

function spawnEncounter(){}

// ----------------------------------------------------------------------------

var goldAchievementGetID = 0;

function tieredScrapAchievement(){

    let nextTier = Game.Persistents.Achievements.Scraps.TierBreakpoints[Game.Persistents.Achievements.Scraps.BreakpointEarned]

    if (Game.Resources.Scraps >= nextTier)
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