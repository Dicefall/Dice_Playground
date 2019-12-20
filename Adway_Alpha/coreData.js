// All of the game's core classes and data will be found here.
// TODO: Need some kind of copyright notice or something

// Achievements
class Achievement {
    constructor(listenerType, handlerFunc) {

        this.handlerFunc = handlerFunc;
        this.HandlerID = allEvents.registerListener(listenerType, handlerFunc);
    }
}

class TieredAchievement extends Achievement {
    constructor(rewardBreakpoints, rewardValues, handlerType, handlerFunc) {
        super(handlerType, handlerFunc);

        this.TierBreakpoints = rewardBreakpoints;
        this.BreakpointEarned = 0;

        this.TierValues = rewardValues;
    }
}

// Actors, pretty much anyone that will end up in combat
class Actor {
    constructor(name) {
        this.Name = name;

        this.Level = 1;
        this.Speed = 15;
        this.Attack = 10;
        this.HealthCurr = 100;
        this.HealthMax = 100;
        this.isAlive = true;
        this.CurrentTurnOrder = 10000;

        this.SpeedBase = 15;
        this.AttackBase = 10;
        this.HealthBase = 100;
    }
 }

class Hero extends Actor { 
    constructor(name) {
        super(name);

        this.isAvailable = false;

        this.LevelMax = 10;
        this.CurrentJob = Lookup.JobsDB[0]; // Default to wanderer

        // Storage will be either name or job ID and a number for level
        this.JobLevels = [];
    }

    recalcStats() {
        let levelMulti = Math.pow(Lookup.LevelScaleFactor,this.Level);

        this.Attack = this.AttackBase * levelMulti;
        this.HealthMax = this.HealthBase * levelMulti;
        this.HealthCurr = Math.min(this.HealthCurr,this.HealthMax);

        this.Speed = this.SpeedBase;
    }

    LevelUp() {
        let XPReq = Math.pow(Lookup.ExperienceRequirementScaleFactor,this.Level - 1) * Lookup.ExperienceRequirement;
        if (Game.Resources.XP >= XPReq) {
            Game.Resources.XP -= XPReq;
            this.Level++;

            this.recalcStats();
        } else {
            console.log("Not Enough XP, need " + formatNumber(XPReq - Game.Resources.XP) + " more.");
        }
    }

    // -Class/job unlocks
    // --Class/job mastery points
}

class Creature extends Actor {
    constructor(name) {
        super(name);

        // Get world and cell scaling
        var worldMod = Math.pow(
            Lookup.WorldZoneScaleFactor,
            Game.World.CurrentZone - 1);
    
        var cellMod = 1 + (Lookup.WorldCellScaleFactor * (Game.World.CurrentCell - 1));

        // Apply scaling to new creature
        Lookup.Bestiary.forEach(archtype => {
            if (name === archtype.Name) {
                this.Speed *= archtype.SpeedMod;
                this.Attack *= archtype.AttackMod * worldMod * cellMod;
                this.HealthMax *= archtype.HealthMod * worldMod * cellMod;
                this.HealthCurr = this.HealthMax;
            }
        })
        
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
class Aura {
    constructor(target) {
        this.owner = target;


    }
}

// Job Abilities, Will limit this to active ones for now
class Ability {
    constructor(name){

        // For some flavor
        this.Name = name;
    }
}

// Basic structure for classes/Jobs
class Job {
    constructor(name, atk, hp, spd, spellIDs, AbilityAIFunc, requirementFuncs){
        this.Name = name;

        this.JobAttackMod = atk;
        this.JobHealthMod = hp;
        this.JobSpeedMod = spd;

        this.Requirements = requirementFuncs;

        this.UsableSpells = spellIDs;

        this.JobAI = AbilityAIFunc;

    }
}

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
        };

        // Heroes
        this.Heroes = [
            new Hero("Meryl"),
            new Hero("Chase"),
            new Hero("Tali"),
            new Hero("Herschel")
        ];

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
            LastUpdateTime: 0,
            StoryState: {
                StoryStage: 0,
                StoryControlID: 0,
            },
        };

        this.GameState = Lookup.GameStrings.GameStates.Core;

        // Settings
        this.Settings = {
            Language: 'English',
            GameSpeed: 100, // in MS
            AutoSaveFrequency: 30 * 60 * 1000, //30 minutes in millisconds

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
        this.UIElements = {
            ScrapCounter: document.querySelector('#scrapDisplay'),
            XPCounter: document.querySelector('#xpDisplay'),
            MerylTurnOrder: document.querySelector('#MerylOrder'),
            ChaseTurnOrder: document.querySelector('#ChaseOrder'),
            TaliTurnOrder: document.querySelector('#TaliOrder'),
            HerschelTurnOrder: document.querySelector('#HershelOrder'),
            EnemyHealth: document.querySelector('#enemyHealth'),
            WorldStats: document.querySelector('#WorldStats'),
            PartyStatus: document.querySelector('#partyStatus'),
        };
        
        // Supported languages
        // Obviously only english now but support for more exists
        this.Languages = [
            "English",
        ]

        // Enemy Archtypes
        // Attack, HP, Speed, ...
        this.Bestiary = [
            new CreatureTemplate('Goblin', 1, 1, 1),
            new CreatureTemplate('Dragon', 2, 5, 1.2),
            new CreatureTemplate("Kobold", 0.8,0.8,0.8)
        ];

        // Enemy scaling factors
        this.WorldZoneScaleFactor = 2; // Double enemy stats each new zone
        this.WorldCellScaleFactor = 0.021; // 2% per cell scaling
        this.WorldResourceScaleFactor = 0; // TODO something? Should scale

        // Levelling constants
        this.LevelScaleFactor = 1.1;
        this.ExperienceRequirement = 100;
        this.ExperienceRequirementScaleFactor = 1.15;

        this.StoryTriggers = [
            "TEST_EVENT",
            "SCRAPS_RECIEVED",
            "TEST_EVENT",
        ];

        // Databases for spells/abilities/etc.
        // TODO: Figure out how I want to handle this
        this.AuraDB = [];
        this.AbilityDB = [];

        this.JobsDB = [
            new Job("Wanderer",1,1,1),
        ];

        // For internal strings only. Not needed but lets the browser throw
        // errors if I've made a mistake elsewhere. Strings easier to debug
        // Anything being displayed to the player should be in gameText.js
        this.GameStrings = {
            // Game state control
            // Not using all caps case because I think it looks ugly
            // Might change my stance on that who knows
            GameStates: {
                Paused: "Paused",
                PartyWipe: "Party_Wipe",
                Core: "Core",
                PreCombat: "Pre_Combat", // Not sure what this is for yet
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
                "SCRAPS_RECIEVED",
                function () {
                    
                    if (Game.Achievements['Scraps'] >= Lookup.AchievementData.Scraps.TierBreakpoints.length) {
                        allEvents.removeEvent(Lookup.AchievementData['Scraps'].HandlerID);
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
                }
            ),
        }
    }
}

const Lookup = new GameData();
var Game = new PlayerData();