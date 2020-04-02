function mainLoop() {
    // Update UI
    UpdateUIElements();

    // If game is paused do nothing and move on
    if (Game.GameState == Lookup.GameStrings.GameStates.Paused) return;

    // Do Time stuff
    var currTime = Date.now();
    Game.Resources.Time += (currTime - Game.Stats.LastUpdateTime);
    Game.Stats.LastUpdateTime = currTime;

    // Handling for possible slowdown and other effects, eg. background tab
    if (Game.Resources.Time < Lookup.GameLoopIntervalBase) return;

    // Basically the cost in terms of time of anything happening
    // TODO: Add in a speed up mechanism for running multiple times per frame
    Game.Resources.Time -= Lookup.GameLoopIntervalBase;

    // Resource gathering
    generateResources();

    // At start queue up the first zone
    // Also start up on new run
    if (Game.World.CurrentZone == 0) {
        Game.World.CurrentZone++;
        Game.World.CurrentCell = 1;
        spawnEncounter();
    }

    // Combat includes any fighting etc.
    mainCombat();

    // Just in case I want to hook into this
    allEvents.queueEvent("GAME_TICK");
}

// Utility Functions-----------------------------------------------------------

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

    // Get base and exponent
    // Turns into: mantissa * 10 ^ exponent
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

function UpdateUIElements() {

    // Resource counter
    Lookup.UIElements.ScrapCounter.innerHTML = ParseGameText(
        GameText[Game.Settings.Language].UI.Scraps,
        formatNumber(Game.Resources.Scraps)
    );

    Lookup.UIElements.TimeCounter.innerHTML = ParseGameText(
        GameText[Game.Settings.Language].UI.Time,
        formatNumber(Game.Resources.Time / 1000)
    );

    Lookup.UIElements.XPCounter.innerHTML = ParseGameText(
        GameText[Game.Settings.Language].UI.XP,
        formatNumber(Game.Resources.XP)
    );

    // Testing content, Hero health values for now
    Lookup.UIElements.PlayerOrder.innerHTML = ParseGameText(
        '{0} HP: {1} / {2}',
        Game.Hero.Name,
        formatNumber(Math.max(Game.Hero.HealthCurr, 0)),
        formatNumber(Game.Hero.HealthMax)
    );

    Lookup.UIElements.PlayerHpBar.value = Math.max(Game.Hero.HealthCurr, 0);
    Lookup.UIElements.PlayerHpBar.max = Game.Hero.HealthMax;

    if (Game.Enemies.length > 0) {
        Lookup.UIElements.EnemyHealth.textContent = ParseGameText(
            '{0} HP: {1} / {2}',
            Game.Enemies[0].Name,
            formatNumber(Math.max(Game.Enemies[0].HealthCurr, 0)),
            formatNumber(Game.Enemies[0].HealthMax)
        );
    }

    // Text output for zone/cell display
    Lookup.UIElements.WorldStats.textContent = ParseGameText(
        'You are currently in the world at zone {0} and cell {1}',
        formatNumber(Game.World.CurrentZone),
        formatNumber(Game.World.CurrentCell),
    );

    // Party status indicator
    Lookup.UIElements.PartyStatus.innerHTML = ParseGameText(
        "Party status: {0}",
        (Game.GameState == Lookup.GameStrings.GameStates.PartyWipe) ? GameText.Icons.Skull : GameText.Icons.HeartBeat
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
    console.log("AutoSaved");
}

function loadGameFromLocal() {
    // TODO: Deal with version upgrading here somewhere
    let tempSave = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
    if (tempSave == null) {
        console.log("No local save detected");
        return;
    }
    Game = tempSave;

    // Beginning of offline time. Goal is to either do a super fast speed up version, or just give players a resource that they can use to benefit from the missing time. Initial thoughts are extra game ticks or something.
    // Maximum of 30 days
    var missingTime = Math.min(
        Date.now() - Game.Stats.LastUpdateTime,
        1000 * 60 * 60 * 24 * 30);

    Game.Stats.LastUpdateTime = Date.now();
    Game.Resources.Time += missingTime;

}

function removeLocalSave() {
    var result = window.confirm(GameText[Game.Settings.Language].SaveReset);
    if (result) {

        // Clean up all of the event listeners
        allEvents.clearAllEvents();

        // Delete localstorage save
        window.localStorage.clear();

        // Reset the base game object
        Game = new PlayerData();

        // Start up the game again
        newPage();
    }
}
// ----------------------------------------------------------------------------
// Resources

function generateResources() {

    // All resource numbers are stored as per seconds
    // Convert from MS to S
    var GameSpeed = Lookup.GameLoopIntervalBase / 1000;

    // Scraps
    Game.Resources.Scraps += (Game.Resources.ScrapsIncome * GameSpeed);
    allEvents.queueEvent("SCRAPS_RECIEVED");

    return;

    // Conversion not in yet, don't even know what it is yet
    Game.Resources.Scraps -= (Game.Resources.ScrapConversionRate * GameSpeed);

    var totalScrapConversion = (Game.Resources.ScrapToMetal + Game.Resources.ScrapToLeather + Game.Resources.ScrapToCloth) * Game.Resources.ScrapConversionRate * Game.Resources.ScrapConversionEfficiency;

    Game.Resources.Metal += totalScrapConversion * Game.Resources.ScrapToMetal;
    Game.Resources.Leather += totalScrapConversion * Game.Resources.ScrapToLeather;
    Game.Resources.Cloth += totalScrapConversion * Game.Resources.ScrapToCloth;
}

// Combat ---------------------------------------------------------------------
// Everything combat here, including class perks and anything else that needs
// to be dealt with for combat.

// Main Combat (expect a lot of re-writes and changes)
function mainCombat() {

    // Things that happen that are combat related that always happen.
    // Health regen.
    // Higher out of combat regen?
    Game.Hero.HealthCurr = Math.min(Game.Hero.HealthCurr + Game.Hero.HealthRegen * Lookup.GameLoopIntervalBase / 1000, Game.Hero.HealthMax);

    if (Game.GameState == Lookup.GameStrings.GameStates.PartyWipe) {
        // Extra regen?
        Game.Hero.HealthCurr = Math.min(Game.Hero.HealthCurr + Game.Hero.HealthRegen * Lookup.GameLoopIntervalBase / 1000, Game.Hero.HealthMax);
        if (Game.Hero.HealthCurr == Game.Hero.HealthMax) {
            Game.GameState = Lookup.GameStrings.GameStates.Core;
            Game.Hero.isAlive = true;
        }
    } else {
        // Only Active combat things.

        // Advance turn cds
        Game.Hero.CurrentTurnOrder -= Lookup.GameLoopIntervalBase * Game.Hero.Speed;

        Game.Enemies.forEach(badguy => {
            badguy.CurrentTurnOrder -= Lookup.GameLoopIntervalBase * badguy.Speed;
        });

        // Loop through people's turns, maintain order
        var readyActors = [];
        if (Game.Hero.CurrentTurnOrder <= 0) {
            readyActors.push(Game.Hero);
        }

        Game.Enemies.forEach(badguy => {
            if (badguy.CurrentTurnOrder <= 0) {
                readyActors.push(badguy);
            }
        });

        // Put everyone that's ready into a list
        // Splice out the fastest each time, let them act
        // Check for deaths in ready actors
        // Repeat until no one left below 0
        while (readyActors.length > 0) {

            // Pick which actor that's ready is 'fastest'
            // Lowest value should act first (largest magnitude below 0)
            var fastestActor = 0;
            for (var i = 0; i < readyActors.length; i++) {
                // < instead of <= *should* give priority to player
                if (readyActors[i].CurrentTurnOrder < readyActors[fastestActor].CurrentTurnOrder) {
                    fastestActor = i;
                }
            }

            // Pull best one out of list
            fastestActor = readyActors.splice(fastestActor, 1)[0];

            // Check for dead actor
            if (!fastestActor.isAlive) { continue; }

            // Maybe change to attack specific
            fastestActor.CurrentTurnOrder += 1000;

            // Do attack
            if (fastestActor instanceof Hero) {
                // Is hero, do hero things
                Game.Enemies[0].HealthCurr -= fastestActor.Attack;
                if (Game.Enemies[0].HealthCurr <= 0) {
                    Game.Enemies[0].isAlive = false;
                }
            } else {
                // Is not hero, do badguy things
                Game.Hero.HealthCurr -= fastestActor.Attack;
                if (Game.Hero.HealthCurr <= 0) {
                    Game.Hero.HealthCurr = 0;
                    Game.Hero.isAlive = false;
                    Game.GameState = Lookup.GameStrings.GameStates.PartyWipe;
                }
            }
        }

        // Check for deaths
        for (var i = 0; i < Game.Enemies.length; i++) {
            if (!Game.Enemies[i].isAlive) {
                Game.Enemies.splice(i, 1);
                allEvents.queueEvent("ENEMY_DEFEATED");
                i--;
            }
        }

        // Check for cell clear
        // TODO: XP values
        if (Game.Enemies.length == 0) {
            Game.Resources.XP += 25;
            Game.World.CurrentCell++;

            allEvents.queueEvent("CELL_CLEAR");

            //Check for zone clear
            // TODO: Different sized zones
            if (Game.World.CurrentCell >= 100) {
                Game.World.CurrentZone++;
                Game.World.CurrentCell = 1;
                allEvents.queueEvent("ZONE_CLEAR");
            }

            spawnEncounter();
        }
    }
}

// Who knows when stats will get into a weird state that needs to be reset
function recalcHeroStats() {

    // Base stats basically
    Game.Heroes.forEach(hero => {
        hero.recalcStats();
    })
}

function startWorldZone() { } // TODO: more complicated zone spawn

function spawnMap() { }

function spawnEncounter() {

    // TODO: make it more fancy, for now just spawn goblins, dragons at max cell
    if (Game.World.CurrentCell == 100) {
        Game.Enemies.push(new Creature("Dragon"));
    } else {
        let x = Math.floor(Math.random() * Lookup.Bestiary.length);

        Game.Enemies.push(new Creature(Lookup.Bestiary[x].Name));
    }

}

function OnPartyWipe() {
    // reset level, equipment, whatever, start health regen
}

// ----------------------------------------------------------------------------
function StoryControl() {

    switch (Game.Stats.StoryState.StoryStage) {
        // Very first intro text
        case 0:
            console.log(ParseGameText(GameText[Game.Settings.Language].Story.Intro));
            Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.Intro);

            Game.Stats.StoryState.StoryStage++;
            // Just remove the tutorial for now. TODO: Re-add
            allEvents.removeEvent(
                Game.Stats.StoryState.StoryControlID);
            break;
        // Get some resources, lets people look around a bit
        case 1:
            break;
        // Intro to combat
        case 2:
            break;
        default:
        // nothing to do here
    }
}

function newPage() {
    // TODO: Load game and set visual state
    // load game works, just leaving it out for testing
    //loadGameFromLocal();
    // Fix in for now, get current time for brand new game

    // Story Controller
    Game.Stats.StoryState.StoryControlID =
        allEvents.registerListener(
            "TEST_EVENT",
            StoryControl
        );

    // Example for adding buttons
    Lookup.UIElements.LevelUpButton.addEventListener('click', event => {
        //console.log("Level Up Button Pressed");
        Game.Hero.LevelUp();
    });

    // Queue up main loop 
    Lookup.BookKeeping.MainFunctionID = window.setInterval(mainLoop, Game.Settings.GameSpeed);
    // Queue autosave
    Lookup.BookKeeping.AutoSaveFunctionID = window.setInterval(saveGameToLocal, Game.Settings.AutoSaveFrequency);

    allEvents.queueEvent("TEST_EVENT");
}

window.onload = newPage();