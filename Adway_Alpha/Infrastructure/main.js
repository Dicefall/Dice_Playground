"use strict";
// import {EventBoard, Chronometer} from './Chronos.js';
// import {GameData, PlayerData} from './coreData.js';
// const allEvents = new EventBoard();
// const Chronos = new Chronometer();

// const Lookup = new GameData();
// var Game = new PlayerData();

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

    // Get rid of things that don't need to be saved, shouldn't be anything

    // after editting
    var saveString = JSON.stringify(saveGame);

    window.localStorage.setItem("ADWAY_Save", saveString);
    console.log("AutoSaved");
}

function loadGameFromLocal() {
    let returnedSave = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
    if (returnedSave == null) {
        console.log("No local save detected");
        return false;
    } else {
        console.log("Debug file size: " + window.localStorage.getItem("ADWAY_Save").length);
    }
    
    // Events and Time
    allEvents.deserializeEvents(returnedSave.events);
    Chronos.DeserializeTimers(returnedSave.chron);

    // Player data
    // Data only fields
    Game.Resources = JSON.parse(JSON.stringify(returnedSave.Game.Resources));
    Game.Achievements = JSON.parse(JSON.stringify(returnedSave.Game.Achievements));
    Game.Stats = JSON.parse(JSON.stringify(returnedSave.Game.Stats));
    Game.RNGSeeds = JSON.parse(JSON.stringify(returnedSave.Game.RNGSeeds));
    Game.Settings = JSON.parse(JSON.stringify(returnedSave.Game.Settings));
    Game.GameState = returnedSave.GameState;

    // Class based fields
    // Hero, enemies, probably world eventually
    Game.World = JSON.parse(JSON.stringify(returnedSave.Game.World));
    Game.World.ActiveZone = JSON.parse(JSON.stringify(returnedSave.Game.World.ActiveZone));

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

    // TODO: Deal with version upgrading here, so far nothing needed

    return true;
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

function newPage() {
    // load game works, just leaving it out for testing
    // if (loadGameFromLocal()) {
        // do potential catch up
    // } else {
    // Story Controller
    Game.Stats.StoryState.StoryControlID =
        allEvents.registerListener("TEST_EVENT",1); // Story Control

    // Enemy deaths, clean up combat stuff
    allEvents.registerListener("ENEMY_DEFEATED",2); // Combat Cleaner

    Zone.startZone(Game.World.CurrentZone++);

    // --------------------------------------------------------------------

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

window.addEventListener('load', newPage);