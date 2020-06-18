function mainLoop() {

    // Do Time stuff
    var currTime = Date.now();
    Game.Resources.Time += (currTime - Game.Stats.LastUpdateTime);
    Game.Stats.LastUpdateTime = currTime;

    // If game is paused do nothing and move on
    if (Game.GameState == Lookup.GameStrings.GameStates.Paused) return;

    // Handling for possible slowdown and other effects, eg. background tab
    if (Game.Resources.Time < Lookup.GameLoopIntervalBase) return;

    // Eventually everything time based will be handled via Chronos.
    // Things that wont be handled via chronos will come after
    // This will be things like spawning new encounters, etc
    Chronos.Tick(Lookup.GameLoopIntervalBase);

    // Basically the cost in terms of time of anything happening
    // TODO: Add in a speed up mechanism for running multiple times per frame
    Game.Resources.Time -= Lookup.GameLoopIntervalBase;
    Game.statTracking.RunTimeSpent += Lookup.GameLoopIntervalBase;

    // Just in case I want to hook into this
    //allEvents.queueEvent("GAME_TICK");
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

    // Create save object
    var saveGame = {};
    saveGame.events = allEvents.serializeEvents();
    saveGame.chron = Chronos.SerializeTimers();
    saveGame.Game = JSON.parse(JSON.stringify(Game));

    // Get rid of things that don't need to be saved shouldn't be anything

    // after editting
    saveString = JSON.stringify(saveGame);

    window.localStorage.setItem("ADWAY_Save", saveString);
    console.log("AutoSaved");
}

function loadGameFromLocal() {
    // TODO: Deal with version upgrading here somewhere
    let returnedSave = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
    if (returnedSave == null) {
        console.log("No local save detected");
        return;
    }
    
    // Events and Time
    allEvents.deserializeEvents(returnedSave.events);
    Chronos.DeserializeTimers(returnedSave.chron);

    // Player data
    // Data only fields
    Game.Resources = JSON.parse(JSON.stringify(returnedSave.Game.Resources));
    Game.Achievements = JSON.parse(JSON.stringify(returnedSave.Game.Achievements));
    Game.Stats = JSON.parse(JSON.stringify(returnedSave.Game.Stats));
    Game.Settings = JSON.parse(JSON.stringify(returnedSave.Game.Settings));
    Game.GameState = returnedSave.GameState;

    // Class based fields
    // Hero, enemies, probably world eventually
    Game.World = JSON.parse(JSON.stringify(returnedSave.Game.World));

    // Object.assign is only a shallow copy
    Game.Hero = new Hero("Hiro");
    Object.assign(Game.Hero, returnedSave.Game.Hero);

    // Make new copies of all the enemies    
    returnedSave.Game.Enemies.forEach((oldBaddie, index) => {
        // Steal name and boss mod to make new one
        Game.Enemies.push(new Creature(oldBaddie.name, oldBaddie.isBoss));

        // Copy stats same as hero
        Object.assign(Game.Enemies[index], oldBaddie);
    });

    // Offline Time
    // Maximum of 30 days
    var missingTime = Math.min(
        Date.now() - Game.Stats.LastUpdateTime,
        1000 * 60 * 60 * 24 * 30); // 30 days in milliseconds

    Game.Stats.LastUpdateTime = Date.now();
    Game.Resources.Time += missingTime;

}

function removeLocalSave() {
    var result = window.confirm(GameText[Game.Settings.Language].SaveReset);
    if (result) {

        // Clean up all of the event listeners
        allEvents.clearAllEvents();
        Chronos.ClearTimers();

        // Delete localstorage save
        window.localStorage.clear();

        // Reset the base game object
        Game = new PlayerData();

        // Start up the game again
        newPage();
    }
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

            Chronos.RemoveTimer(Game.Enemies[i].turnTimerID);
            Game.Enemies.splice(i, 1);
        }
    }

    // Prep for next encounter if needed
    if (Game.Enemies.length == 0){
        endEncounter();
    }

}

function startWorldZone(zone) {
    Game.World.CurrentZone = zone;
    Game.World.CurrentCell = 0;
    endEncounter();
 } // TODO: more complicated zone spawn, just set new cell and spawn an encounter for now

function endEncounter() { // TODO: Major change to this, will redo when world spawning advances

    allEvents.queueEvent("CELL_CLEAR");

    //Check for zone clear
    // TODO: Generic zone sizes
    if (Game.World.CurrentCell >= 100) {
        startWorldZone(Game.World.CurrentZone++);
        allEvents.queueEvent("ZONE_CLEAR");
    }

    // Move on to the next cell
    Game.World.CurrentCell++;

    // Switch to rest for the very small time until next combat
    Game.GameState = Lookup.GameStrings.GameStates.Rest;

    // Spawn new encounter after a short delay
    // Delay is 500ms
    //Chronos.CreateTimer(time => {return time;},spawnEncounter,500);
    Chronos.CreateTimer(3, null);
    

}

function OnPartyWipe() {
    Game.Hero.HealthCurr = 0;
    Game.Hero.isAlive = false;

    //Chronos.RemoveTimer(Game.Hero.turnTimerID);

    // Switch to rest state
    Game.GameState = Lookup.GameStrings.GameStates.Rest;
}

function newPage() {
    // load game works, just leaving it out for testing
    //loadGameFromLocal();
    // Fix in for now, get current time for brand new game

    // Story Controller
    Game.Stats.StoryState.StoryControlID =
        allEvents.registerListener("TEST_EVENT",1); // Story Control

    allEvents.registerListener("ENEMY_DEFEATED",2); // Combat Cleaner

    // Example for adding buttons
    Lookup.UIElements.LevelUpButton.addEventListener('click', event => {
        //console.log("Level Up Button Pressed");
        Game.Hero.LevelUp();
    });

    // Queue up main loop 
    Lookup.BookKeeping.MainFunctionID = window.setInterval(mainLoop, Game.Settings.GameSpeed);
    // Queue autosave
    Lookup.BookKeeping.AutoSaveFunctionID = window.setInterval(saveGameToLocal, Game.Settings.AutoSaveFrequency);

    window.setInterval(UpdateUIElements,Game.Settings.GameSpeed);

    allEvents.queueEvent("TEST_EVENT");
}

//window.onload = newPage();
window.addEventListener('load', newPage);