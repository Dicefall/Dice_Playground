function mainLoop() {
    // Do Time stuff
    var currTime = Date.now();
    Game.Resources.Time += (currTime - Game.Stats.LastUpdateTime);
    Game.Stats.LastUpdateTime = currTime;

    if (Game.Resources.Time < Lookup.GameLoopIntervalBase) return;

    Game.Resources.Time -= Lookup.GameLoopIntervalBase;

    // Resource gathering
    generateResources();

    // Combat
    // At start queue up the first zone
    if (Game.World.CurrentZone == 0) {
        Game.World.CurrentZone++;
        Game.World.CurrentCell = 1;
        spawnEncounter();
    }

    // check if we should be doing combat
    if (Game.GameState == Lookup.GameStrings.GameStates.Core) {
        mainCombat();
    } else if (Game.GameState == Lookup.GameStrings.GameStates.PartyWipe) {
        // whatever is supposed to happen while party is recovering
        
        // check for whatever moves party back into core state
    }

    // Update UI
    UpdateUIElements();
    allEvents.queueEvent("GAME_TICK");

    // Offline time triggers extra main loops or something
}

// Utility Functions

// Get a hero based on it's name
function getHeroByName(heroName) {

    // Keeping in just in case, design change no longer used
    return null;

    var toReturn = null;

    Game.Heroes.forEach(hero => {
        if (hero.Name === heroName) {
            toReturn = hero;
        }
    })

    return toReturn;
}

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

    Lookup.UIElements.XPCounter.innerHTML = ParseGameText(
        GameText[Game.Settings.Language].UI.XP,
        formatNumber(Game.Resources.XP)
    );

    // Testing content, Hero health values for now
    Lookup.UIElements.EnemyHealth.textContent = ParseGameText(
        '{0} HP: {1} / {2}',
        Game.Enemies[0].Name,
        formatNumber(Math.max(Game.Enemies[0].HealthCurr, 0)),
        formatNumber(Game.Enemies[0].HealthMax)
    );

    // Text output for zone/cell display
    Lookup.UIElements.WorldStats.textContent = ParseGameText(
        'You are currently in the world at zone {0} and cell {1}',
        formatNumber(Game.World.CurrentZone),
        formatNumber(Game.World.CurrentCell),
    );

    // Party status indicator
    Lookup.UIElements.PartyStatus.innerHTML = ParseGameText(
        "Party status: {0}", 
        (Game.GameState == "PARTY_WIPE") ? GameText.Icons.Skull : GameText.Icons.HeartBeat
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
    Game = JSON.parse(window.localStorage.getItem("ADWAY_Save"));

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
    Game.Hero.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + hero.Speed / 100);

    Game.Enemies.forEach(badguy => {
        badguy.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + badguy.Speed / 100);
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
        for (var i = 0; i < readyActors.length;i++){
            // < instead of <= *should* give priority to player
            if (readyActors[i].CurrentTurnOrder < readyActors[fastestActor].CurrentTurnOrder) {
                fastestActor = i;
            }
        }

        fastestActor = readyActors.splice(fastestActor, 1);

        // Take turn
        if (fastestActor.Name == "Hiro") {
            // Is hero, attack enemy
        } else {
            // is enemy, attack hero
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

    // TODO: make it more fancy, for now just spawn goblins
    Game.Enemies.push(new Creature("Goblin"));

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
        console.log("Level Up Button Pressed");
    })
    // Queue up main loop 
    Lookup.BookKeeping.MainFunctionID = window.setInterval(mainLoop, Game.Settings.GameSpeed);
    // Queue autosave
    Lookup.BookKeeping.AutoSaveFunctionID = window.setInterval(saveGameToLocal,Game.Settings.AutoSaveFrequency);

    allEvents.queueEvent("TEST_EVENT");

    console.log(Game.Resources.Time);
}

window.onload = newPage();