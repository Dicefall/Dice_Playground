// All of the game's core classes and data will be found here.
// TODO: Need some kind of copyright notice or something

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
}

class Hero extends Actor { 

    constructor(name) {
        super(name);

        this.Level = 1;
        this.LevelMax = 50;

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
            console.log("Not Enough XP, need " + formatNumber(XPReq - Game.Resources.XP) + " more for a total of " + formatNumber(XPReq) + " XP.");
        }
    }

}

class Creature extends Actor {
    constructor(name) {
        super(name);

        // Get world and cell scaling
        var worldMod = Math.pow(
            Lookup.WorldZoneScaleFactor,
            Game.World.CurrentZone - 1);

        for (var creature of GameDB.Creatures) {
            if (creature.Name === name) {
                this.Speed *= creature.SpeedMod;
                this.Attack *= creature.AttackMod * worldMod;
                this.HealthMax *= creature.HealthMod * worldMod;
                this.HealthCurr = this.HealthMax;
                break;
            }
        }

        // Add creature combat timer to the list
        this.turnTimerID = Chronos.CreateTimer(0,this);
        
    }
}

// This is it, the big player data structure. Anything that will get saved
// will end up in here. 
class PlayerData {

    constructor() {

        // Resources
        this.Resources = {
            Scraps: 0,
            ScrapsIncome: 0,

            XP: 0,

            Time: 0,
        };

        // Hero
        // TODO: Figure out name situation
        this.Hero = new Hero("Hero");

        // List of currently alive enemies
        this.Enemies = [];

        // Current Map/World info
        this.World = {
            // For preloading or pre-spawning
            // Any data that exists for the entire zone that isn't
            // fixed for that zone. For example if a number of enemies
            // should spawn in with modifiers we can pre-arrange them.
            // Sets up procedural things.
            ActiveZone: {
                Encounters: [],
            },
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
                Minor: 2,
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

        // See Utils.js for actual rand systems.
        // TODO: Generate real seeds
        this.RNGSeeds = {
      
        };

        // Settings
        this.Settings = {
            Language: 'English',
            // How frequently your browser attempts to run the game loop.
            // The game is built to run on it's own sense of time and this
            // is only for how frequently the browser tries to run things.
            // If you want to game to process smaller 
            // See GameData.GameLoopIntervalBase
            GameSpeed: 20,
            AutoSaveFrequency: 60 * 1000, // in millisconds

            // Current number notations supported:
            // Scientific, Engineering, Log
            NumberNotation: "Scientific",
            // Still working on other bases, this isn't hooked up to anything
            NumberBase: 10,
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
        ];

        // Supported notations for displaying numbers
        this.SupportedNumberNotations = ["Scientific", "Engineering", "Log"];

        // Enemy scaling factors
        // TODO: Move this to zone structure in database
        this.WorldZoneScaleFactor = 2; // Double enemy stats each new zone
        this.WorldCellScaleFactor = 0.021; // 2.1% per cell scaling
        this.WorldResourceScaleFactor = 0; // TODO something? Should scale

        // Levelling constants
        this.LevelScaleFactor = 1.1;
        this.ExperienceRequirement = 100;
        this.ExperienceRequirementScaleFactor = 1.15;

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
                    newTotal += GameDB.Achievements[0].TierValues[i];
                }
        
                Game.Achievements.TotalScore = newTotal;
            }
        }

        this.BookKeeping = {
            MainFunctionID: 0,
            AutoSaveFunctionID: 0,
            UIUpdateFunctionID: 0,
        }

        // How big a single update frame is in the game. This should have no
        // effect on the game and will only change how big of a chunk gets
        // proccessed at a time. Currently this is not changeable but may be
        // in the future. Lower values will use more resources.
        // See PlayerData.Settings.GameSpeed
        this.GameLoopIntervalBase = 100;
    }
}

const Lookup = new GameData();
const Game = new PlayerData();