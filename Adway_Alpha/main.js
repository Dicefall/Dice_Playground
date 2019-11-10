function mainLoop() {
    // Resource gathering------------------------------------------------------

    // Scraps
    Game.Resources.Scraps += Game.Resources.ScrapsIncome;
    allEvents.queueEvent(allEvents.EventTypes.SCRAPS_RECIEVED);

    // Scrap conversion

    // Combat -----------------------------------------------------------------


}

// Utility Functions

// Get a hero based on it's name
function getHeroByName(heroName) {
    Game.Heroes.forEach(hero => {
        if (hero.Name === heroName) {
            return hero;
        }
    })
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
    Game.Heroes.forEach(hero => {
        hero.CurrentTurnOrder = 10000 / hero.Speed;
    });
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