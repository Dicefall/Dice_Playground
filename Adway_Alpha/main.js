function mainLoop() {
    // Resource gathering------------------------------------------------------

    // Scraps
    Game.Resources.Scraps += Game.Resources.ScrapsIncome;
    allEvents.queueEvent(allEvents.EventTypes.SCRAPS_RECIEVED);

    // Scrap conversion

    // Combat -----------------------------------------------------------------

}


// Saving Functions 
// TODO: Maybe look at the lz-string thing other games do----------------------
function saveGameToLocal() {
    window.localStorage.setItem("ADWAY_Save", JSON.stringify(Game));
}

function loadGameFromLocal() {
    Game = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
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
    loadGameFromLocal();

    //Testing
    goldAchievementGetID = allEvents.registerListener(
        allEvents.EventTypes.SCRAPS_RECIEVED,
        tieredGoldAchievement);

    // Queue up main loop 
    window.setInterval(mainLoop,100);

};