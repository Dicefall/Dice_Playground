"use strict";

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

    // constructor(maxDuration, tickFrequency, onTick, onFade, auraFlags) {
    //     this.maxDuration = maxDuration;
    //     this.tickFrequency = tickFrequency;
    //     this.onTick = onTick;
    //     this.onFade = onFade;

    //     this.flags = auraFlags;
    // }
}

class MapTile {
    // Contains the information in a tile needed before the player gets to it
    // All information important for spawning enemies here
    constructor(cellName /*cellMods*/) {
        this.Name = cellName;
        //this.mods = cellMods; // Does nothing right now
    }
}

const GameDB = {
    // Events and auras here, functions are stored here
    // done this way for serialization and clarity
    Events: [
        new Event(() => { // Scraps achievement function, id == 0

            if (Game.Achievements['Scraps'] >= GameDB.Achievements[0].TierBreakpoints.length) {
                allEvents.removeEvent(GameDB.Achievements[0].HandlerID);
                return;
            }

            if (Game.Resources.Scraps >= GameDB.Achievements[0].TierBreakpoints[Game.Achievements['Scraps']]) {

                var recieveText = achievementRewardText(GameDB.Achievements["Scraps"]);

                // TODO: Move this to an actual ui reward
                console.log(recieveText);

                Game.Achievements['Scraps']++;
                Lookup.AchievementData.CalculateTotal();
            }
        }),

        new Event(() => { // Story Control, id == 1
            switch (Game.Stats.StoryState.StoryStage) {
                // Very first intro text
                case 0:
                    Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[0]);

                    // Spawn the first enemies
                    Chronos.CreateTimer("DelayedSpawn", null);

                    Game.Stats.StoryState.StoryStage++;
                    allEvents.removeEvent(
                        Game.Stats.StoryState.StoryControlID);

                    Game.Stats.StoryState.StoryControlID = allEvents.registerListener("CELL_CLEAR", 1);
                    break;
                // Get some resources, lets people look around a bit
                case 1:
                    if (Game.World.CurrentCell >= 20){
                        Game.Stats.StoryState.StoryStage++;

                        Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[1]);
                    }
                    break;
                // Intro to combat
                case 2:
                    if (Game.World.CurrentCell >= 50){
                        Game.Stats.StoryState.StoryStage++;

                        Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[2]);
                    }
                    break;
                case 3:
                    if (Game.World.CurrentCell >= 75){
                        Game.Stats.StoryState.StoryStage++;

                        Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[3]);

                        allEvents.removeEvent(
                            Game.Stats.StoryState.StoryControlID);

                        Game.Stats.StoryState.StoryControlID = allEvents.registerListener("ZONE_CLEAR", 1);
                    }
                    break;
                case 4:
                    Game.Stats.StoryState.StoryStage++;

                    Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[4]);

                    allEvents.removeEvent(
                        Game.Stats.StoryState.StoryControlID);

                    //Game.Stats.StoryState.StoryControlID = allEvents.registerListener("ZONE_CLEARED", 1);
                    break;
                case 5:
                    // Unlock new feature for getting to town the first time.
                    // Not sure what that feature is just yet, but it should probably be the equipment.
                default:
                // nothing to do here
            }
        }),

        new Event(() => { // Combat Cleaner, id == 2
            if (Game.Enemy.HealthCurr <= 0) {
                //give rewards
                var worldLootMod = Math.pow(GameDB.Constants.WorldScaling.Resources,Game.World.CurrentZone);
                Game.Resources.XP += 25 * worldLootMod;
                Game.Resources.Scraps += 5 * worldLootMod;

                Chronos.RemoveTimer(Game.Enemy.turnTimerID);
                Game.Enemy = null;

                //endEncounter();
                allEvents.queueEvent("CELL_CLEAR");

                // Move on to the next cell
                if (Game.World.CurrentCell === GameDB.Zones[Game.World.CurrentZone].numCells){
                    allEvents.queueEvent("ZONE_CLEAR");
                    Game.World.CurrentCell = 0;
                    Game.World.CurrentZone++;
                    startZone(Game.World.CurrentZone);

                    // Since rating conversions are going to change by zone
                    Game.Hero.recalcStats();
                }

                // Switch to rest for the very small time until next combat
                Game.CombatState = GameDB.Constants.States.Combat.Paused;

                // Spawn new encounter after a short delay
                // Delay is 500ms
                Chronos.CreateTimer("DelayedSpawn", null);
            }
        })
    ],
    Auras: {
        EnemyTurn: {
            Build: function() {
                this.endTime = Infinity;
                this.tickFrequency = Actor.baseTurnRate;
                this.nextTick = Chronos.Time + this.tickFrequency / this.Owner.Speed;
            },

            Flags: Aura.AuraFlags.PauseOnCombat | Aura.AuraFlags.TickHasted,
            onFade: null,
            onTick: function() {
                if (Game.Hero.isAlive) {
                    Game.Hero.HealthCurr -= Game.Enemy.Attack;
                }

                if (Game.Hero.HealthCurr <= 0) {
                    Game.Hero.OnDeath();

                    // Switch to rest state
                    Game.CombatState = GameDB.Constants.States.Combat.Paused;
                }
            }
        },

        PlayerTurn: {
            Build: function() {
                this.endTime = Infinity;
                this.tickFrequency = Actor.baseTurnRate;
                this.nextTick = Chronos.Time + this.tickFrequency / this.Owner.Speed;
            },

            Flags: Aura.AuraFlags.PauseOnCombat | Aura.AuraFlags.TickHasted,
            onFade: null,
            onTick: function() {
                // This will be what fires off when an action is done in combat.
                if (Game.Enemy == null) return;
    
                // Roll for crit
                var doesCrit = (Math.random() < Game.Hero.CritChance);
    
                Game.Enemy.HealthCurr -= Game.Hero.Attack * ((doesCrit) ? 1 + Game.Hero.CritDamageBonus : 1);

                // See if you killed it
                if (Game.Enemy.HealthCurr <= 0) { allEvents.queueEvent("ENEMY_DEFEATED"); }
            },
        },

        PlayerRegen: {
            Build: function() {
                this.endTime = Infinity;
                this.tickFrequency = 1000;
                this.nextTick = Chronos.Time + this.tickFrequency / this.Owner.Speed;
            },

            Flags: Aura.AuraFlags.TickHasted,
            onFade: null,
            onTick: function() {
                Game.Hero.HealthCurr = Math.min(Game.Hero.HealthMax, Game.Hero.HealthCurr + Game.Hero.HealthRegen * Game.Hero.HealthMax);
                if (Game.CombatState == GameDB.Constants.States.Combat.Paused) {
                    if (Game.Hero.HealthCurr == Game.Hero.HealthMax) {
                        Game.CombatState = GameDB.Constants.States.Combat.Active;
                        Game.Hero.Revive();
                    }
                }
            },
        },

        DelayedSpawn: {
            Build: function() {
                // Change this owner for later when arenas/dungeons are a thing
                this.Owner = Game.World;

                this.endTime = Chronos.Time + 500;
                this.tickFrequency = 1000;
                this.nextTick = this.endTime;
            },

            Flags: Aura.AuraFlags.TickHasted,
            onFade: null,
            onTick: function() {
                // Zone control here.
                Game.Enemy = new Creature(GameDB.Zones[Game.World.CurrentZone].enemyNames.concat(GameDB.Zones[Game.World.CurrentZone].specialEncounters)[
                    [Game.World.ActiveZone.Encounters[Game.World.CurrentCell++]]
                ]);

                Game.CombatState = GameDB.Constants.States.Combat.Active;
            },
        }
        
    },
    // Achievements here. Events added when game object is created.
    // Player information about what's earned stored on player object.
    Achievements: {
        Scraps: {
            Name: "Scraps",
            Breakpoints: [50, 100, 500, 1000, 10000],
            Value: [1, 1, 2, 2, 5],

            EventTrigger: "CURRENCY_GAINED",
            EventUsed: 0
        }
    },
    // Zones stored as array, index is important and it's set up in order
    //  Cells are 0-indexed
    Zones: [
        {   // Zone 0 - "Forgotten Battlefield"
            numCells: 100,
            enemyCounters: [20,45,19,10,5],
            enemyNames: ["Goblin", "Kobold", "Orc", "WarDog", "Ogre"],
            specialCells: [99],
            specialEncounters: ["Dragon"]
        },
        {   // Zone 1 - "Battlefield outskirts"
            numCells: 100,
            enemyCounters: [39,15,20,25],
            enemyNames: ["Goblin", "Orc", "WarDog", "Bear"],
            specialCells: [99],
            specialEncounters: ["Treant"]
        },
        {   // Zone 2 - "Wooded path"
        numCells: 100,
        enemyCounters: [5,5,5,20,20,38,7],
        enemyNames: ["Goblin", "WarDog", "Bear", "Wolf", "Deer", "Boar", "Snake"],
        specialCells: [],
        specialEncounters: []
        },
        {   // Zone 3 - "Wooded path 2"
        numCells: 100,
        enemyCounters: [5,27,23,38,7],
        enemyNames: ["Bear", "Wolf", "Deer", "Boar", "Snake"],
        specialCells: [],
        specialEncounters: []
        },
        {   // Zone 4 - "Heart of the Forest"
        numCells: 100,
        enemyCounters: [27,18,12,4,38,1],
        enemyNames: ["Boar", "Deer", "Wolf", "Bandit", "Pixie", "BanditKing"],
        specialCells: [],
        specialEncounters: []
        },
        {   // Zone 00 - "The Inexorable March of Time"
            numCells: 100,
            enemyCounters: [100],
            enemyNames: ["SpacetimeCurvature"],
            specialCells: [],
            specialEncounters: []
        }
    ],
    // Creature information, mostly names and modifiers, loot not included yet.
    Creatures: {
        Goblin: {
            AttackMod: 1,
            HealthMod: 1,
            SpeedMod: 1,
        },
        Kobold: {
            AttackMod: 0.8,
            HealthMod: 0.8,
            SpeedMod: 0.8,
        },
        Dragon: {
            AttackMod: 2,
            HealthMod: 5,
            SpeedMod: 1.2,
        },
        Ogre: {
            AttackMod: 1.4,
            HealthMod: 1.5,
            SpeedMod: 1,
        },
        Orc: {
            AttackMod: 1,
            HealthMod: 1.2,
            SpeedMod: 1,
        },
        WarDog: {
            AttackMod: 1,
            HealthMod: 0.8,
            SpeedMod: 1,
        },
        Bear: {
            AttackMod: 1.1,
            HealthMod: 1.1,
            SpeedMod: 0.8,
        },
        Wolf: {
            AttackMod: 1.1,
            HealthMod: 1.0,
            SpeedMod: 1.0,
        },
        Deer: {
            AttackMod: 0.6,
            HealthMod: 1.2,
            SpeedMod: 1.2,
        },
        Boar: {
            AttackMod: 1.2,
            HealthMod: 1.4,
            SpeedMod: 1.1,
        },
        Snake: {
            AttackMod: 1.1,
            HealthMod: 0.6,
            SpeedMod: 1.4,
        },
        Bandit: {
            AttackMod: 1,
            HealthMod: 1,
            SpeedMod: 1.1,
        },
        Treant: {
            AttackMod: 2,
            HealthMod: 5,
            SpeedMod: 0.8,
        },
        Pixie: {
            AttackMod: 0.6,
            HealthMod: 0.4,
            SpeedMod: 2.5,
        },
        BanditKing: {
            AttackMod: 2,
            HealthMod: 2,
            SpeedMod: 1.3,
        },
        SpacetimeCurvature: {
            Name: 'Spacetime Curvature',
            AttackMod: 2,
            HealthMod: 100,
            SpeedMod: 1,
        }
    },
    // Player stat progrses information such as cost, scaling values, etc
    // Some numbers stored in comments so I can refer to them later.
    //      Math.log(25) / Math.log(1.15) = 23.031
    //      Math.log(25) / Math.log(1.25) = 14.425
    //       -This is the cost point at which tier up should cost the same
    //       -as one new level. I'll be using these as rough reference points
    Stats: {
        // "Primary" stats
        Attack: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 10
        },
        Health: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 10
        },

        // "Secondary" stats, come in ratings
        Crit: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 5
        },
        Haste: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 5
        },
        Regen: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 5
        },
        CritDmg: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 5
        },

        // "Meta" stats, stats that effect other stats
        Level: {
            baseXPCost: 100,
            levelCostScaling: 1.25,
            primaryMulti: 1.15,
            ratingConversionDecay: 1.05,
        }
    },
    // Upgrades, starting off with stat tier up upgrades, others to be included.
    Upgrades: {
        CritTierUp: {
            OnPurchase: function () {
                Game.Hero.LevelUpStat('Crit',1, true);
                Game.Hero.recalcStats();
            },
            GetCost: function() {
                return GameDB.Stats.Crit.baseXPCost * Math.pow(GameDB.Stats.Crit.tierUpCostScaling, Game.Hero.StatLevels.Crit.Tier);
            },
        },
        HasteTierUp: {
            OnPurchase: function () {
                Game.Hero.LevelUpStat('Haste',1, true);
                Game.Hero.recalcStats();
            },
            GetCost: function() {
                return GameDB.Stats.Haste.baseXPCost * Math.pow(GameDB.Stats.Haste.tierUpCostScaling, Game.Hero.StatLevels.Haste.Tier);
            },
        },
        RegenTierUp: {
            OnPurchase: function () {
                Game.Hero.LevelUpStat('Regen',1, true);
                Game.Hero.recalcStats();
            },
            GetCost: function() {
                return GameDB.Stats.Regen.baseXPCost * Math.pow(GameDB.Stats.Regen.tierUpCostScaling, Game.Hero.StatLevels.Regen.Tier);
            },
        },
        AttackTierUp: {
            OnPurchase: function () {
                Game.Hero.LevelUpStat('Attack',1, true);
                Game.Hero.recalcStats();
            },
            GetCost: function() {
                return GameDB.Stats.Attack.baseXPCost * Math.pow(GameDB.Stats.Attack.tierUpCostScaling, Game.Hero.StatLevels.Attack.Tier);
            },
        },
        HealthTierUp: {
            OnPurchase: function () {
                Game.Hero.LevelUpStat('Health',1, true);
                Game.Hero.recalcStats();
            },
            GetCost: function() {
                return GameDB.Stats.Health.baseXPCost * Math.pow(GameDB.Stats.Health.tierUpCostScaling, Game.Hero.StatLevels.Health.Tier);
            },
        },
        CritDmgTierUp: {
            OnPurchase: function () {
                Game.Hero.LevelUpStat('CritDmg',1, true);
                Game.Hero.recalcStats();
            },
            GetCost: function() {
                return GameDB.Stats.CritDmg.baseXPCost * Math.pow(GameDB.Stats.CritDmg.tierUpCostScaling, Game.Hero.StatLevels.CritDmg.Tier);
            },
        },
        HeroLevelUp: {
            OnPurchase: function() {
                Game.Hero.Level++;
            },
            GetCost: function() {
                return GameDB.Stats.Level.baseXPCost * Math.pow(GameDB.Stats.Level.levelCostScaling, Game.Hero.Level);
            }
        }
    },
    // Reset upgrades, fills the roles of things like ancients from CH, perks from Trimps, etc
    //  Starting with traditional fantasy game stats like strength, agi, dex, etc
    Attributes: {
        Constitution: {
            // Health bonus
        },
        Perception: {
            // Looting bonus
        }
        // Most stats will come with multiple effects, for example a basic attack bonus and a
        //  secondary stat bonus as well. Example:
        //      Strength might give attack and crit damage (rating) or armor penetration or something.
        //      Dex might give attack and crit chance
        //  It will all depend on the flavor, it is an incremental game afterall, balance comes in scaling
        // Strength, Dexterity, Agility, Int, Spirit/Wisdom/Mind/etc, Charisma, Con, Vitality, 
        //  Will eventually move on to other things but I'd like to keep the themeing similar
        //  Try not to overlap with upgrades/tier up names. These should be more fundamental.
    },
    Equipment: {
        // Value values
        //  Small note: 18.3 item levels to make up for each quality level with 1.2 and 1.01
        QualityScaling: 1.2, // 20% per quality level (compounding) to stat budget
        LevelScaling: 1.01, // 1% per item level (compounding) to stat budget
        BaseStatBudget: 10,
        BasePrimary: 25,
        // Stamina scaling with item level may need to be different.

        // Cost/refund values
        BaseScrapCost: 100,
        QualityCostScaling: 10, // For refunding, unsure if allowing higher craft or procs
        ScrapCostLevelScaling: 1.15, // 13x cost to catch up to quality via ilvl
        RefundFactor: 0.1, // refunds some of effective scrap cost
    },
    // One off pieces of information that need somewhere to sit.
    Constants: {
        // Quality color progression
        // tbd https://cdn.discordapp.com/attachments/200624467012091904/767148900799873044/cq5dam.png
        // How things scale wrt world. Enemy stats, loot, etc.
        WorldScaling: {
            Zone: 1.25,
            Resources: 1.1, // Will come back to this soon
        },
        Stats: {
            BaseRatingConversion: 25,
        },
        Supported: {
            // Only english, see gameText.js for information about translating.
            Languages: ['English'],
            // Different kinds of notations for larger numbers.
            NumberNotations: ["Scientific", "Engineering", "Log"],
        },
        States: {
            Combat: {
                Paused: 0,
                Active: 1
            },

            Game: {
                Paused: 0,
                Active: 1,
            }
        },
        EventTypes: [
            "TEST_EVENT", //Any time I want to just testing things or this system
            "ZONE_CLEAR", //Zone is finished
            "CELL_CLEAR", //Cell is finished
            "ENEMY_DEFEATED", //Enemy is defeated
            "CURRENCY_GAINED", //Might split into others
            "ADDON_EVENT", //In case third party wants to hook into this
        ],
        // Base reset currency and maybe scaling
    },
    // Dungeons
    // Arenas
    // None yet but prepping for special challenges, maybe creatures to be hunted?
    Challenges: {},
    // Primarily for things like certain ui related specifics,
    // Nothing right now since there is no ui but an example would be:
    //  Different colors for tooltips that scale with different stats
    UI: {},
};

//export {GameDB};