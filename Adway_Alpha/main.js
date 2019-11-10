function mainLoop() {
    // Resource gathering

    // Scraps
    Game.Resources.Scraps += Game.Resources.ScrapsIncome;
    allEvents.queueEvent(allEvents.EventTypes.SCRAPS_RECIEVED);

    // Scrap conversion

    // Combat 

    // Update UI
    document.querySelector("#scrapDisplay").textContent = 
        ParseGameText(GameText.English.UI.Scraps,Game.Resources.Scraps);

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

function tieredGoldAchievement(){
    if (Game.Resources.Scraps >= 100)
    {
        console.log("Achievement recieved: Acquire 100 Scraps!");
        allEvents.removeEvent(goldAchievementGetID);
    }
}

window.onload = function() {
    
    // Get previous save from localstorage, check later for online save
    //loadGameFromLocal();

    //Testing
    goldAchievementGetID = allEvents.registerListener(
        allEvents.EventTypes.SCRAPS_RECIEVED,
        tieredGoldAchievement);

    // Queue up main loop 
    window.setInterval(mainLoop,100);

};