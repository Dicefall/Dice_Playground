// Events, spells, and auras, and creatures?!
// Very crude database, built for serializability.

// Achievements will be implemented as events. (They'll all be awarded when a thing happens. I think that's fair)

// All timers will be auras

// Events are objects that listen for some event, and trigger some effect on that event.
class Event {

    constructor(eventFunction){
        this.eventCB = eventFunction;
    }
}

class Aura {
    //
}

class Spell {

}

GameDB = {
    Events: [
        new Event(() => { // Scraps achievement function, id == 0
                    
            if (Game.Achievements['Scraps'] >= Lookup.AchievementData.Scraps.TierBreakpoints.length) {
                //allEvents.removeEvent(Lookup.AchievementData['Scraps'].HandlerID);
                return;
            }

            let nextTier = Lookup.AchievementData.Scraps.TierBreakpoints[Game.Achievements['Scraps']];

            if (Game.Resources.Scraps >= nextTier) {

                var recieveText = ParseGameText(
                    ParseGameText(
                        GameText[Game.Settings.Language].AchievementText.Recieved,
                        GameText[Game.Settings.Language].AchievementText.Scraps.Names[Game.Achievements['Scraps']],
                        GameText[Game.Settings.Language].AchievementText.Scraps.Criteria),
                    nextTier);

                console.log(recieveText);

                Game.Achievements['Scraps']++;
                Lookup.AchievementData.CalculateTotal();
            }
        }),

        new Event( () => { // Story/Tutorial Control, id == 1
            switch (Game.Stats.StoryState.StoryStage) {
                // Very first intro text
                case 0:
                    console.log(ParseGameText(GameText[Game.Settings.Language].Story.Intro));
                    Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.Intro);
        
                    Game.Stats.StoryState.StoryStage++;
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
        }),

        new Event( () => { // Combat Cleaner, id == 2
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
        })
    ],
    Spells: [],
    Auras: []
}