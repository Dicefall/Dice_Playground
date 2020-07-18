// Events, spells, and auras, and creatures?!
// Very crude database, built for serializability.

// Achievements will be implemented as events. (They'll all be awarded when a thing happens. I think that's fair)

// All timers will be auras

// Events are objects that listen for some event, and trigger some effect on that event.
class Event {

    constructor(eventFunction) {
        this.eventCB = eventFunction;
    }
}

class Aura {
    // Aura fields:

    // onTick should be things that the timer does, including things that should happen at it's end
    //  hopefully not confusing but clear in my head
    // onFade should be things that the timer needs to keep track of when it's over
    //  like remove itself from a buff list or trigger something when dispel'd

    // Example from wow: Living Bomb
    //  onTick would be the dot damage, onFade would be the ae explosion at applying it to everyone

    // Flags for auras
    static AuraFlags = {
        PauseOnCombat: 1,
        DurationHasted: 2,
        TickHasted: 4,
        PartialFinalTick: 8,
        Dispellable: 16,
        Visible: 32
    }

    constructor(maxDuration, tickFrequency, onTick, onFade, auraFlags) {
        this.maxDuration = maxDuration;
        this.tickFrequency = tickFrequency;
        this.onTick = onTick;
        this.onFade = onFade;

        this.flags = auraFlags;
    }
}

class Spell {

    static SpellFlags = {};

}

// Templates for creatures
class CreatureTemplate {
    constructor(name, attack, health, speed, loot) {
        this.Name = name;
        this.AttackMod = attack;
        this.HealthMod = health;
        this.SpeedMod = speed;
    }
}

// Achievements
class Achievement {

    constructor(achievementName, listenerType, handlerEventID) {

        this.Name = achievementName;
        this.handlerEventID = handlerEventID;
        this.HandlerID = allEvents.registerListener(listenerType, handlerEventID);
    }
}

class TieredAchievement extends Achievement {
    constructor(achievementName, rewardBreakpoints, rewardValues, handlerType, handlerEventID) {
        super(achievementName, handlerType, handlerEventID);

        // Breakpoints are the value being checked
        // E.g. 50 for a "get 50 scraps" achievement, or 100 for "get 100 scraps"
        this.TierBreakpoints = rewardBreakpoints;

        // Rewards for each breakpoint
        // Indexes should match breakpoints
        this.TierValues = rewardValues;
    }
}

class Zone {
    constructor(zoneName, cellCount, zoneEnemies, proceduralFlags, fixedSpawns) {
        this.numCells = cellCount;
        this.legalSpawns = zoneEnemies;
        this.zoneFlags = proceduralFlags;
        this.fixedEnemies = fixedSpawns;
        this.name = zoneName;
    }
}

GameDB = {
    Events: [
        new Event(() => { // Scraps achievement function, id == 0

            if (Game.Achievements['Scraps'] >= GameDB.Achievements[0].TierBreakpoints.length) {
                //allEvents.removeEvent(Lookup.AchievementData['Scraps'].HandlerID);
                return;
            }

            if (Game.Resources.Scraps >= GameDB.Achievements[0].TierBreakpoints[Game.Achievements['Scraps']]) {

                var recieveText = achievementRewardText(GameDB.Achievements[0]);

                console.log(recieveText); // TODO: Change to achievement reward system

                Game.Achievements['Scraps']++;
                Lookup.AchievementData.CalculateTotal();
            }
        }),

        new Event(() => { // Story Control, id == 1
            switch (Game.Stats.StoryState.StoryStage) {
                // Very first intro text
                case 0:
                    Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[0]);

                    // Player attack aura
                    Chronos.CreateTimer(1,Game.Hero);
                    // Regen aura
                    Chronos.CreateTimer(4, Game.Hero);
                    startWorldZone(1);

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

        new Event(() => { // Combat Cleaner, id == 2
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
            if (Game.Enemies.length == 0) {
                endEncounter();
            }
        })
    ],
    Spells: [],
    Auras: [
        new Aura( // Enemy combat actions, id == 0
            Infinity,
            Actor.baseTurnRate,
            () => {
                if (Game.Hero.isAlive) {
                    Game.Hero.HealthCurr -= Game.Enemies[0].Attack;
                }

                if (Game.Hero.HealthCurr <= 0) {
                    Game.Hero.HealthCurr = 0;
                    Game.Hero.isAlive = false;
                    
                    // Switch to rest state
                    Game.GameState = Lookup.GameStrings.GameStates.Rest;
                }
            },
            null,
            Aura.AuraFlags.PauseOnCombat | Aura.AuraFlags.DurationHasted
        ),

        new Aura( // Player GCD/Swing timer, id == 1
            Infinity,
            Actor.baseTurnRate,
            () => {
                // This will be what fires off when an action is done in combat.

                Game.Enemies[0].HealthCurr -= Game.Hero.Attack;

                // See if you killed it
                if (Game.Enemies[0].HealthCurr <= 0) { allEvents.queueEvent("ENEMY_DEFEATED"); }
            },
            null,
            Aura.AuraFlags.PauseOnCombat | Aura.AuraFlags.DurationHasted
        ),

        new Aura( // Resource ticker, id == 2
            Infinity,
            1000, // 1000ms, give resources once every second
            () => {
                // All resource generation and other effects will go in here
                Game.Resources.Scraps += (Game.Resources.ScrapsIncome);
                allEvents.queueEvent("CURRENCY_GAINED");
            },
            null,
            0
        ),

        new Aura( // Spawn delay id == 3
            500,
            500,
            () => {
                // TODO: make it more fancy, eventually move spawn logic to the zone
                // or other system

                // For now dragon on last cell random otherwise
                // Zone control here
                if (Game.World.CurrentCell == 100) {
                    Game.Enemies.push(new Creature("Dragon", true));
                } else {
                    let x = Math.floor(Math.random() * GameDB.Creatures.length);

                    Game.Enemies.push(new Creature(GameDB.Creatures[x].Name));
                }
                // If you're spawning enemies you should go back into core.
                Game.GameState = Lookup.GameStrings.GameStates.Core;
            },
            null,
            0
        ),
        new Aura( // Health regen aura id == 4
            Infinity,
            1000,
            () => {
                Game.Hero.HealthCurr = Math.min(Game.Hero.HealthMax, Game.Hero.HealthCurr + Game.Hero.HealthRegen);
                if (Game.GameState == Lookup.GameStrings.GameStates.Rest) {
                    if (Game.Hero.HealthCurr == Game.Hero.HealthMax) {
                        Game.GameState = Lookup.GameStrings.GameStates.Core;
                        Game.Hero.isAlive = true;
                    }
                }
            },
            null,
            Aura.AuraFlags.TickHasted
        )
    ],
    Creatures: [
        new CreatureTemplate("Goblin", 1, 1, 1),
        new CreatureTemplate("Kobold", 0.8,0.8,0.8),
        //new CreatureTemplate("Dragon", 2, 5, 1.2)
    ],
    Achievements: [
        new TieredAchievement(
            "Scraps",
            [50, 100, 500, 1000, 10000],
            [1, 1, 2, 2, 5],
            "CURRENCY_GAINED",
            0
        ),
    ],
    Zones: [
    ],
}