function mainLoop() {

    // If game is paused do nothing and move on
    if (Game.GameState == Lookup.GameStrings.GameStates.Paused) return;

    // Do Time stuff
    var currTime = Date.now();
    Game.Resources.Time += (currTime - Game.Stats.LastUpdateTime);
    Game.Stats.LastUpdateTime = currTime;

    // Handling for possible slowdown and other effects, eg. background tab
    if (Game.Resources.Time < Lookup.GameLoopIntervalBase) return;

    // Eventually everything time based will be handled via Chronos.
    // Things that wont be handled via chronos will come after
    // This will be things like spawning new encounters, etc
    Game.Chronos.Tick(Lookup.GameLoopIntervalBase);

    // Basically the cost in terms of time of anything happening
    // TODO: Add in a speed up mechanism for running multiple times per frame
    Game.Resources.Time -= Lookup.GameLoopIntervalBase;
    Game.statTracking.RunTimeSpent += Lookup.GameLoopIntervalBase;

    // At start queue up the first zone
    // Also start up on new run
    if (Game.World.CurrentZone == 0) {
        Game.World.CurrentZone++;
        Game.World.CurrentCell = 1;
        spawnEncounter();
    }

    // Combat includes any fighting etc.
    //mainCombat();

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
    } else {
        Lookup.UIElements.EnemyHealth.textContent = ParseGameText(
            'No Enemies');
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
        (Game.GameState == Lookup.GameStrings.GameStates.Rest) ? GameText.Icons.Skull : GameText.Icons.HeartBeat
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

    // Offline Time
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
        Game.Chronos.ClearTimers();

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

    // Scraps
    Game.Resources.Scraps += (Game.Resources.ScrapsIncome);
    allEvents.queueEvent("SCRAPS_RECIEVED");

    return;
}

// Combat ---------------------------------------------------------------------
// Everything combat here, including class perks and anything else that needs
// to be dealt with for combat.

function combatCleanup() {
    // Check for which enemies died, get loot from them, give rewards
    for (var i = Game.Enemies.length - 1; i >= 0; i--) {
        if (Game.Enemies[i].HealthCurr <= 0) {
            //give rewards
            Game.Resources.XP += 25 /* Game.Enemies[i].lootMod*/;
            Game.Resources.Scraps += 5 /* Game.Enemies[i].lootMod*/;

            Game.Chronos.RemoveTimer(Game.Enemies[i].turnTimerID);
            Game.Enemies.splice(i, 1);
        }
    }

    // Prep for next encounter if needed
    if (Game.Enemies.length == 0){
        endEncounter();
    }

}

function startWorldZone(zone) { } // TODO: more complicated zone spawn

function endEncounter() {

    // Move on to the next cell
    Game.World.CurrentCell++;

    allEvents.queueEvent("CELL_CLEAR");

    //Check for zone clear
    // TODO: Generic zone sizes
    if (Game.World.CurrentCell >= 100) {
        Game.World.CurrentZone++;
        Game.World.CurrentCell = 1;
        allEvents.queueEvent("ZONE_CLEAR");
    }

    // Switch to rest for the very small time until next combat
    Game.GameState = Lookup.GameStrings.GameStates.Rest;

    // Spawn new encounter after a short delay
    // Delay is 500ms
    Game.Chronos.CreateTimer(time => {return time;},spawnEncounter,500);

}

function spawnEncounter() {

    // TODO: make it more fancy, eventually move spawn logic to the zone
    // or other system

    // For now dragon on last cell random otherwise
    // Zone control here
    if (Game.World.CurrentCell == 100) {
        Game.Enemies.push(new Creature("Dragon", true));
    } else {
        let x = Math.floor(Math.random() * Lookup.Bestiary.length);

        Game.Enemies.push(new Creature(Lookup.Bestiary[x].Name));
    }
    
    // If you're spawning enemies you should go back into core.
    Game.GameState = Lookup.GameStrings.GameStates.Core;

}

function OnPartyWipe() {
    Game.Hero.HealthCurr = 0;
    Game.Hero.isAlive = false;

    //Chronos.RemoveTimer(Game.Hero.turnTimerID);

    // Switch to rest state
    Game.GameState = Lookup.GameStrings.GameStates.Rest;
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
    // load game works, just leaving it out for testing
    //loadGameFromLocal();
    // Fix in for now, get current time for brand new game

    // Story Controller
    Game.Stats.StoryState.StoryControlID =
        allEvents.registerListener(
            "TEST_EVENT",
            StoryControl
        );

    allEvents.registerListener("ENEMY_DEFEATED",combatCleanup);

    // Example for adding buttons
    Lookup.UIElements.LevelUpButton.addEventListener('click', event => {
        //console.log("Level Up Button Pressed");
        Game.Hero.LevelUp();
    });

    // Start up game timers
    Game.Hero.turnTimerID = Game.Chronos.CreateForevertimer(Game.Hero.CombatTicker.bind(Game.Hero),Game.Hero.CombatActions.bind(Game.Hero), Actor.baseTurnRate);

    // Generate resources once every second
    Lookup.BookKeeping.ResourceTimerID = Game.Chronos.CreateForevertimer(time => { return time}, generateResources, 1000);

    // Queue up main loop 
    Lookup.BookKeeping.MainFunctionID = window.setInterval(mainLoop, Game.Settings.GameSpeed);
    // Queue autosave
    Lookup.BookKeeping.AutoSaveFunctionID = window.setInterval(saveGameToLocal, Game.Settings.AutoSaveFrequency);

    window.setInterval(UpdateUIElements,Game.Settings.GameSpeed);

    allEvents.queueEvent("TEST_EVENT");
}

//window.onload = newPage();
window.addEventListener('load', newPage);