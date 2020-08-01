"use strict";
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

        // Stat upgrades
        this.StatLevels = {
            Attack: {
                Tier: 0,
                Level: 0
            },
            Health: {
                Tier: 0,
                Level: 0
            },
            Crit: {
                Tier: 0,
                Level: 0
            },
            Haste: {
                Tier: 0,
                Level: 0
            },
            Regen: {
                Tier: 0,
                Level: 0
            }
        };

        // Upgraded stat values
        this.CritRating = 0;
        this.HasteRating = 0;

        // Post conversion stats
        this.CritChance = 0;

        // Player character gets a base of 1
        this.HealthRegen = 1;
    }

    StatsUp(statName, numLevels, tierUp){
        // reference for clarity
        var statDBRef;
        for (var stat of GameDB.Stats) {
            if (stat.shortName === statName) {
                statDBRef = stat;
                break;
            }
        }

        // Get cost required to level up desired stat
        var targetTier = this.StatLevels[statName].Tier + (tierUp ? 1 : 0);
        var targetLevel = tierUp ? numLevels : this.StatLevels[statName].Level + numLevels;

        var buyoutCost = Math.ceil(getTotalMultiCost(statDBRef.baseXPCost * Math.pow(statDBRef.tierUpCostScaling, targetTier),targetLevel, statDBRef.levelCostScaling,true));
        if (Game.Resources.XP >= buyoutCost) {
            this.StatLevels[statName].Tier = targetTier;
            this.StatLevels[statName].Level = targetLevel;
            Game.Resources.XP -= buyoutCost;
        } else {
            console.log("Error, unable to afford upgrade");
        }

        this.recalcStats();
    }

    recalcStats() {

        // 'Primary' stats
        this.Attack = this.AttackBase + GameDB.Stats[2].baseStatGain * Math.pow(GameDB.Stats[2].tierUpStatFactor, this.StatLevels.Attack.Tier) * this.StatLevels.Attack.Level;

        var healthDeficit = this.HealthMax - this.HealthCurr;
        this.HealthMax = this.HealthBase + GameDB.Stats[3].baseStatGain * Math.pow(GameDB.Stats[3].tierUpStatFactor, this.StatLevels.Health.Tier) * this.StatLevels.Health.Level;
        this.HealthCurr = Math.max(this.HealthMax - healthDeficit,1);
        this.HealthRegen = this.RegenBase + GameDB.Stats[4].baseStatGain * Math.pow(GameDB.Stats[4].tierUpStatFactor, this.StatLevels.Regen.Tier) * this.StatLevels.Regen.Level;

        // 'Secondary' stats
        this.HasteRating = GameDB.Stats[1].baseStatGain * Math.pow(GameDB.Stats[1].tierUpStatFactor, this.StatLevels.Haste.Tier) * this.StatLevels.Haste.Level;
        this.CritRating = GameDB.Stats[0].baseStatGain * Math.pow(GameDB.Stats[0].tierUpStatFactor, this.StatLevels.Crit.Tier) * this.StatLevels.Crit.Level;

        // TODO: Secondary stat rating conversions, hard coded for now, I may have to add the zone scaling here
        this.Speed = this.SpeedBase * (1 + 0.01 * this.HasteRating / 25); // 25 rating for 1% haste
        this.CritChance = 0.01 * (this.CritRating / 25); // 25 crit rating to 1% chance
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

            Gold: 0,
            GoldIncome: 0,

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

            // Storing extra data for achievmenets if needed

        };

        this.Stats = {
            GameVersion: {
                Major: 0,
                Minor: 3,
                Patch: 0,
            },
            LastUpdateTime: new Date().getTime(),
            StoryState: {
                StoryStage: 0,
                StoryControlID: 0,
            },
        };

        this.GameState = "Core";

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
        this.WorldZoneScaleFactor = 2; // Double enemy stats each new zone
        this.WorldResourceScaleFactor = 1.1; // TODO something? Should scale

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

//export {GameData, PlayerData};