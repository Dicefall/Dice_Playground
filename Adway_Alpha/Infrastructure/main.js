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
    Chronos.TimeBank += (currTime - Game.Stats.LastUpdateTime);
    Game.Stats.LastUpdateTime = currTime;

    // If game is paused do nothing and move on
    if (Game.GameState == Lookup.GameStrings.GameStates.Paused) return;

    // Handling for possible slowdown and other effects, eg. background tab
    if (Chronos.TimeBank < Lookup.GameLoopIntervalBase) return;

    // Eventually everything time based will be handled via Chronos.
    // Things that wont be handled via chronos will come after
    // This will be things like spawning new encounters, etc
    Chronos.Tick(Lookup.GameLoopIntervalBase);

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
        formatNumber(Chronos.TimeBank / 1000)
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

    // TODO: Fix ui for change of enemy structure
    if (Game.Enemy != null) {
        Lookup.UIElements.EnemyHealth.textContent = ParseGameText(
            '{0} HP: {1} / {2}',
            Game.Enemy.Name,
            formatNumber(Math.max(Game.Enemy.HealthCurr, 0)),
            formatNumber(Game.Enemy.HealthMax)
        );
    } else {
        Lookup.UIElements.EnemyHealth.textContent = ParseGameText(
            'No Enemies');
    }

    // Text output for zone/cell display, display at +1
    Lookup.UIElements.WorldStats.textContent = ParseGameText(
        'You are currently in the world at zone {0} and cell {1}',
        formatNumber(Game.World.CurrentZone + 1),
        formatNumber(Game.World.CurrentCell + 1),
    );

    // Party status indicator
    Lookup.UIElements.PartyStatus.innerHTML = ParseGameText(
        "Party status: {0}",
        (Game.CombatState == GameDB.Constants.States.Combat.Paused) ? GameText.Icons.Skull : GameText.Icons.HeartBeat
    );
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

    startZone(Game.World.CurrentZone);

    // --------------------------------------------------------------------

    // Example for adding buttons
    // Lookup.UIElements.LevelUpButton.addEventListener('click', event => {
    //     //console.log("Level Up Button Pressed");
    //     //Game.Hero.LevelUp();
    //     Game.Hero.LevelUpStat('Health',1,false);
    // });

    // Queue up main loop 
    Lookup.BookKeeping.MainFunctionID = window.setInterval(mainLoop, Game.Settings.GameSpeed);
    // Queue autosave
    Lookup.BookKeeping.AutoSaveFunctionID = window.setInterval(saveGameToLocal, Game.Settings.AutoSaveFrequency);

    window.setInterval(UpdateUIElements,Game.Settings.GameSpeed);

    allEvents.queueEvent("TEST_EVENT");
}

window.addEventListener('load', newPage);