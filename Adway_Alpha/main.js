function mainLoop() {
    // Resource gathering

    generateResources();

    // Scrap conversion

    // Combat
    // For Testing
    if (Game.World.CurrentZone == 0) {
        Game.World.CurrentZone++;
        Game.World.CurrentCell = 1;
        spawnEncounter();
    }

    // check if we should be doing combat
    if (Game.GameState == "CORE") {
        mainCombat();
    }

    // Update UI
    UpdateUIElements();

    Game.Stats.LastUpdateTime = new Date().getTime();
    allEvents.queueEvent("GAME_TICK");
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

function getTotalMultiCost(baseCost, multiBuyCount, costScaling, isCompounding) {
    if (!isCompounding) {
        // simplified formula: (NND - ND + 2BN) / 2
        // N (ND - D + 2BN) / 2
        return multiBuyCount * (multiBuyCount * costScaling - costScaling + 2 * baseCost) / 2;
        //return (multiBuyCount * multiBuyCount * costScaling - multiBuyCount * costScaling + 2 * baseCost * multiBuyCount) / 2;
    } else {
        // S = A * (1 - r^n) / (1 - r)
        return baseCost * (1 - Math.pow(costScaling, multiBuyCount) / (1 - costScaling));
    }
}

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

// Check if selected actor is actually a hero

// Format numbers for text displaying. Cleans a lot of display up
function formatNumber(number) {

    // Options are:
    // Scientific, Engineering, Log, 

    // Check for infinite:
    if (!isFinite(number)) return '<i class="fas fa-infinity"></i>';

    // Negative
    if (number < 0) return '-' + formatNumber(-number);

    // Get base and exponent
    // Turns into: mantissa * 10 ^ exponent
    var exponent = Math.floor(Math.log10(number));
    var mantissa = number / Math.pow(10, exponent);

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
            return (mantissa * (Math.pow(10, precision))).toFixed(2 - precision) + 'e' + (exponent - precision);
        case 'Log':
            return 'e' + Math.log10(number).toFixed(2);
        default:
            return number;
    }
}

/* 'Standard' Suffixes
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
*/

function UpdateUIElements() {

    // Resource counter
    Lookup.UIElements.ScrapCounter.innerHTML = ParseGameText(
        GameText[Game.Settings.Language].UI.Scraps,
        formatNumber(Game.Resources.Scraps)
    );

    Lookup.UIElements.XPCounter.innerHTML = ParseGameText(
        GameText[Game.Settings.Language].UI.XP,
        formatNumber(Game.Resources.XP)
    );

    // Turn order visual testing, health values for now
    Lookup.UIElements.MerylTurnOrder.textContent = ParseGameText(
        'Meryl HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Meryl').HealthCurr), 0),
        formatNumber(getHeroByName('Meryl').HealthMax)
    );
    Lookup.UIElements.ChaseTurnOrder.textContent = ParseGameText(
        'Chase HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Chase').HealthCurr), 0),
        formatNumber(getHeroByName('Chase').HealthMax)
    );
    Lookup.UIElements.TaliTurnOrder.textContent = ParseGameText(
        'Tali HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Tali').HealthCurr), 0),
        formatNumber(getHeroByName('Tali').HealthMax)
    );
    Lookup.UIElements.HerschelTurnOrder.textContent = ParseGameText(
        'Herschel HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Herschel').HealthCurr), 0),
        formatNumber(getHeroByName('Herschel').HealthMax)
    );
    Lookup.UIElements.EnemyHealth.textContent = ParseGameText(
        '{0} HP: {1} / {2}',
        Game.Enemies[0].Name,
        formatNumber(Math.max(Game.Enemies[0].HealthCurr), 0),
        formatNumber(Game.Enemies[0].HealthMax)
    );

    Lookup.UIElements.WorldStats.textContent = ParseGameText(
        'You are currently in the world at zone {0} and cell {1}',
        formatNumber(Game.World.CurrentZone),
        formatNumber(Game.World.CurrentCell),
    );
}

// Saving Functions, currently unused
// TODO: Maybe look at the lz-string thing other games do----------------------
function saveGameToLocal() {

    // Copy game save to prep local save
    let saveString = JSON.stringify(Game);
    let saveState = JSON.parse(saveString);

    // Get rid of things that don't need to be saved shouldn't be anything

    // after editting
    saveString = JSON.stringify(saveState);

    window.localStorage.setItem("ADWAY_Save", saveString);
}

function loadGameFromLocal() {
    Game = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
}

function removeLocalSave() {
    var result = window.confirm('Are you sure you want to delete your save?');
    if (result) Game = new GameStore();
}
// ----------------------------------------------------------------------------
// Resources

function generateResources() {

    var GameSpeed = Game.Settings.GameSpeed;

    // Scraps
    Game.Resources.Scraps += (Game.Resources.ScrapsIncome * (GameSpeed / 1000));
    allEvents.queueEvent("SCRAPS_RECIEVED");

    // Conversion
    Game.Resources.Scraps -= (Game.Resources.ScrapConversionRate * (GameSpeed / 1000));

    var totalScrapConversion = (Game.Resources.ScrapToMetal + Game.Resources.ScrapToLeather + Game.Resources.ScrapToCloth) * Game.Resources.ScrapConversionRate * Game.Resources.ScrapConversionEfficiency;

    Game.Resources.Metal += totalScrapConversion * Game.Resources.ScrapToMetal;
    Game.Resources.Leather += totalScrapConversion * Game.Resources.ScrapToLeather;
    Game.Resources.Cloth += totalScrapConversion * Game.Resources.ScrapToCloth;
}

// Combat ---------------------------------------------------------------------
// Everything combat here, including class perks and anything else that needs
// to be dealt with for combat.

// Main Combat (rewrite this at some point)
function mainCombat() {

    // Advance turn cds
    Game.Heroes.forEach(hero => {
        if (hero.isAlive) {
            hero.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + hero.Speed / 100);
        }
    });

    Game.Enemies.forEach(badguy => {
        badguy.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + badguy.Speed / 100);
    });

    // See if anyone is ready to attack
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

        // If anyone is ready to attack, they get to do something
        if (nextActor != null) {

            // See if it's a hero
            if (getHeroByName(nextActor.Name) != null) {
                // TODO simple combat for now, something something AI
                // Lots to change, just get something basic working
                Game.Enemies[0].HealthCurr = Math.max(0, Game.Enemies[0].HealthCurr - nextActor.Attack);
                allEvents.queueEvent("COMBAT_SWING", nextActor.Name, Game.Enemies[0].Name, nextActor.Attack);

            } else {
                var target;
                do {
                    target = Game.Heroes[Math.floor(Math.random() * 4)];
                } while (!target.isAlive)

                target.HealthCurr = Math.max(0, target.HealthCurr - nextActor.Attack);

                if (target.HealthCurr <= 0) {
                    target.isAlive = false;
                }
            }

            nextActor.CurrentTurnOrder += 10000;

            // Check for dead people
            // Check to see if all heroes are dead
            var partyKill = true;
            Game.Heroes.forEach(hero => {
                if (hero.isAlive === true) {
                    partyKill = false;
                }
            });
            if (partyKill) {
                Game.GameState = "PARTY_WIPE"
                break;
            }
        }        
        //end of fight bits here

        // Check to see if enemies are dead
        if (Game.Enemies[0].HealthCurr <= 0) {
            Game.Resources.XP += 20;
            allEvents.queueEvent("ENEMY_DEFEATED");
            Game.Enemies.splice(0, 1);
        }

        // No enemies left, cell over
        if (Game.Enemies.length == 0) {
            Game.World.CurrentCell++;
            Game.Resources.XP += 25;

            allEvents.queueEvent("CELL_CLEAR");

            // Whole zone over
            if (Game.World.CurrentCell >= 100) {
                Game.World.CurrentZone++;
                Game.World.CurrentCell = 1;
                allEvents.queueEvent("ZONE_CLEAR");
            }
            spawnEncounter();
        }

    } while (nextActor != null)
}

// Who knows when stats will get into a weird state that needs to be reset
function recalcStats() {

    // Base stats basically
    Game.Heroes.forEach(hero => {
        hero.Speed = 15; // No speed mods yet
        hero.Attack = 10; // no attack mods yet
        hero.HealthMax = 100; // no health mods yet

        hero.HealthCurr = Math.min(hero.HealthCurr, hero.HealthMax);
    })
}

function startWorldZone() { } // TODO: more complicated zone spawn

function spawnMap() { }

function spawnEncounter() {

    // TODO: make it more fancy, for now just spawn goblins
    Game.Enemies.push(new Creature("Goblin"));

}

// ----------------------------------------------------------------------------
function StoryControl() {

    switch (Game.Stats.StoryState.StoryStage) {
        // Very first intro text
        case 0:
            console.log(ParseGameText(GameText[Game.Settings.Language].Story.Intro));

            Game.Stats.StoryState.StoryStage++;
            allEvents.removeEvent(
                Game.Stats.StoryState.StoryControlID);

            Game.Stats.StoryState.StoryControlID =
                allEvents.registerListener(
                    Lookup.StoryTriggers[Game.Stats.StoryState.StoryStage],
                    StoryControl
                )
            break;
        // Get some resources, lets people look around a bit
        case 1:
            if (Game.Resources.Scraps >= 30) {
                console.log(ParseGameText(GameText[Game.Settings.Language].Story.FoundMeryl));

                getHeroByName('Meryl').isAvailable = true;

                allEvents.removeEvent(
                    Game.Stats.StoryState.StoryControlID);

                Game.Stats.StoryState.StoryStage++;

                // Wait 5 seconds of walking around doing nothing
                // Give player some time to look around before starting combat
                window.setTimeout(function () {
                    allEvents.queueEvent("TEST_EVENT");
                }, 5000);

                Game.Stats.StoryState.StoryControlID =
                    allEvents.registerListener(
                        Lookup.StoryTriggers[Game.Stats.StoryState.StoryStage],
                        StoryControl
                    )
            }
            break;
        // Intro to combat
        case 2:
            console.log(ParseGameText(GameText[Game.Settings.Language].Story.IntroCombat));

            Game.Stats.StoryState.StoryStage++;
            Game.GameState = "CORE";

            // Last current stage
            allEvents.removeEvent(
                Game.Stats.StoryState.StoryControlID);
            break;
        // Post first combat, introduce scaling
        case 3:
            // nothing here yet
            break;
        default:
        // nothing to do here
    }
}

window.onload = function () {

    // TODO: Load game and set visual state

    // Story Controller
    Game.Stats.StoryState.StoryControlID =
        allEvents.registerListener(
            "TEST_EVENT",
            StoryControl
        )

    // Queue up main loop 
    window.setInterval(mainLoop, Game.Settings.GameSpeed);
    // Queue autosave
    //window.setInterval(,Game.Settings.AutoSaveFrequency);

    allEvents.queueEvent("TEST_EVENT");
};