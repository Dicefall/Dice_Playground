// All of the game's core classes and data will be found here.
// TODO: Need some kind of copyright notice or something

// Achievements
class Achievement {

    // Function for handling whatever the achievement needs
    // Also ID for registering/unregistering it from events
    handlerEventID;
    HandlerID;

    constructor(listenerType, handlerEventID) {

        this.handlerEventID = handlerEventID;
        this.HandlerID = allEvents.registerListener(listenerType, handlerEventID);
    }
}

class TieredAchievement extends Achievement {
    constructor(rewardBreakpoints, rewardValues, handlerType, handlerEventID) {
        super(handlerType, handlerEventID);

        // Breakpoints are the value being checked
        // E.g. 50 for a "get 50 scraps" achievement
        this.TierBreakpoints = rewardBreakpoints;
        this.BreakpointEarned = 0;

        // Rewards for each breakpoint
        // Indexes should match breakpoints
        this.TierValues = rewardValues;
    }
}

// Actors, pretty much anyone that will end up in combat
class Actor {

    static baseTurnRate = 5000;

    constructor(name) {
        this.Name = name;

        this.Speed = 1; // read as percentage. 50% = 0.5
        this.Attack = 10;
        this.HealthCurr = 100;
        this.HealthMax = 100;
        this.HealthRegen = 0; // Health regen per second
        this.RegenBase = 1;
        this.isAlive = true;
    
        this.SpeedBase = 1;
        this.AttackBase = 10;
        this.HealthBase = 100;

        this.turnTimerID = -1;
    }

    CombatTicker(inputTime) {
        if (Game.GameState == Lookup.GameStrings.GameStates.Core) {
            return inputTime * this.Speed;
        } else {
            return 0;
        }
    }
 }

class Hero extends Actor { 

    constructor(name) {
        super(name);

        this.Level = 1;
        this.LevelMax = 10;

        // Player character gets a base of 1
        this.HealthRegen = 1;
    }

    recalcStats() {
        let levelMulti = Math.pow(Lookup.LevelScaleFactor,this.Level);

        this.Attack = this.AttackBase * levelMulti;
        this.HealthMax = this.HealthBase * levelMulti;
        this.HealthCurr = Math.min(this.HealthCurr,this.HealthMax);
        this.HealthRegen = Math.max(this.RegenBase * levelMulti, 0);

        this.Speed = this.SpeedBase;
    }

    LevelUp() {
        if (this.Level >= this.LevelMax) {
            console.log("Currently at or above max level. Increase cap to level up. Current level cap: " + formatNumber(this.LevelMax));
            return;
        }

        let XPReq = Math.pow(Lookup.ExperienceRequirementScaleFactor,this.Level - 1) * Lookup.ExperienceRequirement;
        if (Game.Resources.XP >= XPReq) {
            Game.Resources.XP -= XPReq;
            this.Level++;

            this.recalcStats();
        } else {
            console.log("Not Enough XP, need " + formatNumber(XPReq - Game.Resources.XP) + " more.");
        }
    }

    CombatTicker(inputtime){

        if (!this.isAlive || Game.GameState == Lookup.GameStrings.GameStates.Rest) { 
            if (Game.GameState == Lookup.GameStrings.GameStates.Rest) {
                Game.Hero.HealthCurr = Math.min(Game.Hero.HealthCurr + Game.Hero.HealthRegen * inputtime / 1000, Game.Hero.HealthMax);
            }

            if (Game.Hero.HealthCurr >= Game.Hero.HealthMax) {
                Game.GameState = Lookup.GameStrings.GameStates.Core;
                Game.Hero.isAlive = true;
            }

            return 0 
        } else {
        // Don't tick down if dead
            return inputtime * this.Speed;
        }
    }

    CombatActions() {
        // This will be what fires off when an action is done in combat.

        Game.Enemies[0].HealthCurr -= Game.Hero.Attack;

        // See if you killed it
        if (Game.Enemies[0].HealthCurr <= 0)
            { allEvents.queueEvent("ENEMY_DEFEATED");}

        // Chronos.CreateTimer(this.CombatTicker.bind(Game.Hero),this.CombatActions.bind(this),Actor.baseTurnRate);
    }

}

class Creature extends Actor {
    constructor(name, isBoss = false) {
        super(name);

        let minionMod = isBoss ? 1 : 0.5;

        // Get world and cell scaling
        var worldMod = Math.pow(
            Lookup.WorldZoneScaleFactor,
            Game.World.CurrentZone - 1);
    
        var cellMod = 1 + (Lookup.WorldCellScaleFactor * (Game.World.CurrentCell - 1));

        // Apply scaling to new creature
        Lookup.Bestiary.forEach(archtype => {
            if (name === archtype.Name) {
                this.Speed *= archtype.SpeedMod;
                this.Attack *= archtype.AttackMod * worldMod * cellMod * minionMod;
                this.HealthMax *= archtype.HealthMod * worldMod * cellMod * minionMod;
                this.HealthCurr = this.HealthMax;
            }
        })

        // Add creature combat timer to the list
        this.turnTimerID = Chronos.CreateTimer(0,this);
        
    }

    CreatureCombatAction() {

        if (Game.Hero.isAlive) {
            Game.Hero.HealthCurr -= this.Attack;

            if (Game.Hero.HealthCurr <= 0) {
                Game.Hero.HealthCurr = 0;
                OnPartyWipe();
            }
        }
    }
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

// Spells and abilities
// Auras are buffs/debuffs, basically anything that gets attached to an actor
// and will effect them in some way
// Expect these to essentially be timers with effects on start and end

// Basic structure for classes/Jobs
class Job {}


// This is it, the big player data structure. Anything that will get saved
// will end up in here. 
class PlayerData {

    constructor() {

        // Resources
        this.Resources = {
            Scraps: 0,
            ScrapsIncome: 1,
            ScrapConversionRate: 0,
            ScrapConversionEfficiency: 0.5,

            ScrapToMetal: 0,
            ScrapToLeather: 0,
            ScrapToCloth: 0,
            Metal: 0,
            Leather: 0,
            Cloth: 0,

            XP: 0,

            Time: 0,
        };

        // Hero
        // TODO: Figure out name situation
        this.Hero = new Hero("Hiro");

        // List of currently alive enemies
        this.Enemies = [];

        // Current Map/World info
        this.World = {
            CurrentZone: 0,
            CurrentCell: 0,
        };

        // Achievements
        this.Achievements = {
            TotalScore: 0,

            // Earned
            Scraps: 0,
            Metal: 0,
        };

        this.Stats = {
            GameVersion: {
                Major: 0,
                Minor: 1,
                Patch: 0,
            },
            LastUpdateTime: new Date().getTime(),
            StoryState: {
                StoryStage: 0,
                StoryControlID: 0,
            },
        };

        this.GameState = Lookup.GameStrings.GameStates.Core;

        this.statTracking = {
            TotalTimeSpent: 0,
            RunTimeSpent: 0
        };

        // Settings
        this.Settings = {
            Language: 'English',
            // How frequently your browser attempts to run the game loop
            // or other pieces of the game, in milliseconds. The game is
            // still operating on the same timescales regardless of this
            // setting. See GameData.GameLoopIntervalBase
            GameSpeed: 20,
            AutoSaveFrequency: 30 * 60 * 1000, // in millisconds

            // Current number notations supported:
            // Scientific, Engineering, Log
            NumberNotation: "Scientific",
        };
    }
}

// This is for fixed constants for the game, such as base stats or enemy templates
// Anything that doesn't change from player to player will likely end up here
class GameData {
    constructor() {
        // References to the HTML elements
        // This will likely change as the ui gets built
        this.UIElements = {
            ScrapCounter: document.querySelector('#scrapDisplay'),
            XPCounter: document.querySelector('#xpDisplay'),
            PlayerOrder: document.querySelector('#PlayerOrder'),
            PlayerHpBar: document.querySelector("#PlayerHP"),
            EnemyHealth: document.querySelector('#enemyHealth'),
            WorldStats: document.querySelector('#WorldStats'),
            PartyStatus: document.querySelector('#partyStatus'),
            LogDebugMessage: document.querySelector("#lastMessage"),
            LevelUpButton: document.querySelector('#PlayerLevelUp'),
            TimeCounter: document.querySelector('#bonusTime')
        };
        
        // Supported languages
        // Obviously only english now but support for more exists
        this.Languages = [
            "English",
        ]

        // Enemy Archtypes
        // name, attack, health, speed, loot
        this.Bestiary = [
            new CreatureTemplate("Goblin", 1, 1, 1),
            new CreatureTemplate("Kobold", 0.8,0.8,0.8),
            //new CreatureTemplate("Dragon", 2, 5, 1.2)
        ];

        // Enemy scaling factors
        this.WorldZoneScaleFactor = 2; // Double enemy stats each new zone
        this.WorldCellScaleFactor = 0.021; // 2% per cell scaling
        this.WorldResourceScaleFactor = 0; // TODO something? Should scale

        // Levelling constants
        this.LevelScaleFactor = 1.1;
        this.ExperienceRequirement = 100;
        this.ExperienceRequirementScaleFactor = 1.15;
        this.JobsAPScaleFactor = 5;

        this.StoryTriggers = [
            "TEST_EVENT",
            "CURRENCY_GAINED",
            "TEST_EVENT",
        ];

        // Databases for spells/abilities/etc.
        // TODO: Figure out how I want to handle this
        this.AuraDB = [];
        this.AbilityDB = [];

        this.JobsDB = [
            new Job("Wanderer",1,1,1),
        ];

        // For internal strings only. Strings easier to debug
        // Anything being displayed to the player should be in gameText.js
        this.GameStrings = {
            // Game state control
            // Not using all caps case because I think it looks ugly
            // Might change my stance on that who knows
            GameStates: {
                Paused: "Paused",
                Rest: "Rest",
                Core: "Core",
            },
        }

        // Not the most elegant but all of the achievement stuff goes here
        this.AchievementData = {

            CalculateTotal: function () {
                // go through each and total things up
                let newTotal = 0;
        
                // Scraps
                for (var i = 0; i < Game.Achievements['Scraps']; i++) {
                    newTotal += Lookup.AchievementData.Scraps.TierValues[i];
                }
        
                Game.Achievements.TotalScore = newTotal;
            },
        
            Scraps: new TieredAchievement(
                [50, 100, 500, 1000, 10000],
                [1, 1, 2, 2, 5],
                "CURRENCY_GAINED",
                0
            ),
        }

        this.BookKeeping = {
            MainFunctionID: 0,
            AutoSaveFunctionID: 0,
            UIUpdateFunctionID: 0,
            ResourceTimerID: -1,
        }

        // How frequently the game should be processing itself.
        // This is different from the game speed in the player settings
        // This will define how fast the underlying game plays, the
        // other setting will define how frequently the browser runs
        // See PlayerData.Settings.GameSpeed
        this.GameLoopIntervalBase = 100;

        this.SupportedNumberNotations = ["Scientific", "Engineering", "Log"];
    }
}

const Lookup = new GameData();
const Game = new PlayerData();