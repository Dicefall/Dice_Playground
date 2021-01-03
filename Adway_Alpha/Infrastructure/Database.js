"use strict";

// Events, spells, and auras, and creatures?!
// Very crude database, built for serializability.

// All timers will be auras
// Container for static aura properties
class Aura {

    // Flags for auras
    static AuraFlags = {
        PauseOnCombat: 1,
        DurationHasted: 2,
        TickHasted: 4,
        PartialFinalTick: 8,
        Dispellable: 16,
        Visible: 32
    }
}

const GameDB = {
    // Events and auras here, functions are stored here
    // done this way for serialization and clarity
    Events: {
        // Achievements first
        Gold: {
            Name: "Gold",
            Breakpoints: [50, 100, 500, 1000, 10000],
            Value: [1, 1, 2, 2, 5],

            EventTrigger: "CURRENCY_GAINED",
            EventUsed: "Gold",
            eventCB: function() { // Gold achievement function

                if (Game.Achievements['Gold'] >= GameDB.Events.Gold.TierBreakpoints.length) {
                    allEvents.removeEvent(Game.Achievements.Gold.HandlerID);
                    return;
                }
    
                if (Game.Resources.Gold >= GameDB.Events.Gold.TierBreakpoints[Game.Achievements['Gold']]) {
    
                    var recieveText = achievementRewardText(GameDB.Achievements["Gold"]);
    
                    // TODO: Move this to an actual ui reward
                    console.log(recieveText);
    
                    Game.Achievements['Gold']++;
                    CalculateTotalAchievements();
                }
            },
        },
        // Non-achievements
        StoryControl: {
            eventCB: function() { // Story Control
                switch (Game.Stats.StoryState.StoryStage) {
                    // Very first intro text
                    case 0:
                        Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[0]);
    
                        // Spawn the first enemies
                        Chronos.CreateTimer("DelayedSpawn", null);
    
                        Game.Stats.StoryState.StoryStage++;
                        allEvents.removeEvent(
                            Game.Stats.StoryState.StoryControlID);
    
                        Game.Stats.StoryState.StoryControlID = allEvents.registerListener("CELL_CLEAR", "StoryControl");
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
    
                            Game.Stats.StoryState.StoryControlID = allEvents.registerListener("ZONE_CLEAR", "StoryControl");
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
            },
        },
        CombatCleaner: {
            eventCB: function() { // Combat Cleaner
                // TODO: Arena checks
                if (Game.Enemy.HealthCurr <= 0) {
                    //give rewards
                    var worldLootMod = Math.pow(GameDB.Constants.WorldScaling.Resources,Game.World.CurrentZone);
                    var totalLootingMod = Math.pow(GameDB.Attributes.Perception.Bonus, Game.Attributes.Perception.Level);

                    Game.Resources.XP += GameDB.Constants.Base.XP * worldLootMod * totalLootingMod;
                    Game.Resources.Gold += GameDB.Constants.Base.Gold * worldLootMod * totalLootingMod;
    
                    Chronos.RemoveTimer(Game.Enemy.turnTimerID);
                    Game.Enemy = null;
    
                    allEvents.queueEvent("CELL_CLEAR");
    
                    // Move on to the next cell
                    if (Game.World.CurrentCell === GameDB.Zones[Game.World.CurrentZone].numCells){
                        allEvents.queueEvent("ZONE_CLEAR");

                        if (Game.World.CurrentZone >= 15) {
                            Game.Resources.Essence.CurrentRun += GameDB.Constants.Base.Essence * Math.pow(GameDB.Constants.WorldScaling.Essence, Game.World.CurrentZone - 15);
                        }

                        Game.World.CurrentCell = 0;
                        Game.World.CurrentZone++;
                        startZone(Game.World.CurrentZone)
                    }
    
                    // Switch to rest for the very small time until next combat
                    Game.CombatState = GameDB.Constants.States.Combat.Paused;
    
                    // Spawn new encounter after a short delay
                    // Delay is 500ms
                    Chronos.CreateTimer("DelayedSpawn", null);
                }
            }
        },
        // Unlocks assume normal zone progression, see testing suite for non-standards
        LevelUpUnlock: {
            eventCB: function() { // Level ups, new one every zone
                var unlockIndex = Game.Upgrades.Unlocked.indexOf("LevelUp");

                // If it's not found, add it all to the list
                if (unlockIndex == -1) {
                    Game.Upgrades.Unlocked.push("LevelUp");
                    Game.Upgrades.AvailableLevels.push(1);
                    Game.Upgrades.PurchasedLevels.push(0);
                } else {
                    Game.Upgrades.AvailableLevels[unlockIndex]++;
                }
            }
        },
    },
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
            onTick: function() { // This will be what fires off when an action is done in combat.
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

            Flags: 0,
            onFade: null,
            onTick: function() {
                // Zone control here.
                //  TODO: Check where in the game we are and spawn based on that
                Game.Enemy = new Creature(GameDB.Zones[Game.World.CurrentZone].enemyNames.concat(GameDB.Zones[Game.World.CurrentZone].specialEncounters)[
                    [Game.World.ActiveZone.Encounters[Game.World.CurrentCell++]]
                ]);

                Game.CombatState = GameDB.Constants.States.Combat.Active;
            },
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
        {   // Zone 3 - "Wooded path Redux"
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
        {   // Zone 5 - "Edge of the Forest"
        numCells: 100,
        enemyCounters: [30,27,18,15,5,5],
        enemyNames: ["Boar", "Deer", "Wolf", "Bandit", "Snake"],
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
            baseStatGain: 2,
            tierUpStatFactor: 10
        },
        Health: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 20,
            tierUpStatFactor: 10
        },

        // "Secondary" stats, come in ratings
        Crit: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 25,
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
        // Random ideas from notebook
        //  Armor and Armor penetration
        //  Thorns (% of attack as reflect)
        //  Evasion and some other defensives like an energy shield (like wildstar)

        // "Meta" stats, stats that effect other stats
        Level: {
            baseXPCost: 1000,
            levelCostScaling: 1.5,
            primaryMulti: 1.25,
            ratingConversionDecay: 1.05,
        }
    },
    // Reset upgrades, fills the roles of things like ancients from CH, perks from Trimps, etc
    //  Starting with traditional fantasy game stats like strength, agi, dex, etc
    Attributes: {
        // Attack bonus
        Strength: {
            Bonus: 1.05,
            Cost: 10,
            CostScaling: 1.25,
        },
        // Health bonus
        Constitution: {
            Bonus: 1.05,
            Cost: 10,
            CostScaling: 1.25,
        },
        // Looting bonus
        Perception: {
            Bonus: 1.05,
            Cost: 10,
            CostScaling: 1.25,
        },
        // XP Bonus
        Wisdom: {
            Bonus: 1.05,
            Cost: 10,
            CostScaling: 1.25,
        },
        // Stats will be based on primary aspects of the game, attack/health/etc.
        // Might need to add them for secondaries or metas as well.
        // Might come up with multiples that give the same bonus with different flavor
        //  Classes/jobs when they come in will get extra bonuses out of perks,
        //  Examples:
        //      Mage type classes might get extra attack or mana out of Intelligence
        //      A paladin might get extra health regen out of constitution or wisdom, etc
        //      A berserker class might get extra brutality levels out of strength
    },
    // Arenas
    Arenas: {
        // Elimination type vs point type
        PrimitiveType: {
            Knockout: 0,
            Group: 1,
            Hybrid: 2 // Like WC for example, group stage then knockout
        },
        // Going to keep adding some more here as we go on
        AllowedEnemies: [
            "Orc", "Pixie", "Bandit", "Ogre", "Goblin", "Kobold"
        ],
    },
    // One off pieces of information that need somewhere to sit.
    Constants: {
        // How things scale wrt world. Enemy stats, loot, etc.
        GameVersion: {
            Major: 0,
            Minor: 5,
            Patch: 0,
        },

        EventTypes: [
            "TEST_EVENT", //Any time I want to just testing things or this system
            "ZONE_CLEAR", //Zone is finished
            "CELL_CLEAR", //Cell is finished
            "ENEMY_DEFEATED", //Enemy is defeated
            "CURRENCY_GAINED", //Might split into others
            "ADDON_EVENT", //In case third party wants to hook into this easily
        ],

        Supported: {
            // Only english, see gameText.js for information about translating.
            Languages: ['English'],
            // Latest game version that is up to date with selected language
            LanguageVersions: ["0.4.0"],
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

        CombatAreas: {
            World: "World",
            Arena: "Arena",
            Dungeon: "Dungeon",
        },

        WorldScaling: {
            Zone: 2,
            Resources: 1.1, // Will come back to this soon
            Essence: 1, // Obviously will have to change this
        },
        // Base resource drop values
        Base: {
            XP: 20,
            Gold: 1,
            Essence: 20,
        },
        Stats: {
            BaseRatingConversion: 25,
        },

        // Base reset currency and maybe scaling
    },
    // Needed for the engine to function
    // None yet but prepping for special challenges, maybe creatures to be hunted?
    Challenges: {},
    // Primarily for things like certain ui related specifics,
    // Nothing right now since there is no ui but an example would be:
    //  Different colors for tooltips that scale with different stats
    UI: {
        // Quality color progression
        // tbd https://cdn.discordapp.com/attachments/200624467012091904/767148900799873044/cq5dam.png
    },
};

//export {GameDB};