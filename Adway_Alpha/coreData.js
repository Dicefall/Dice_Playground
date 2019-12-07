// All of the game's core classes and data will be found here.
// TODO: Need some kind of copyright notice or something

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
        this.XP = 0;
    }

    recalcStats() {
        let levelMulti = Math.pow(Lookup.LevelScaleFactor,this.Level);

        this.Attack = this.AttackBase * levelMulti;
        this.HealthMax = this.HealthBase * levelMulti;
        this.HealthCurr = Math.min(this.HealthCurr,this.HealthMax);

        this.Speed = this.SpeedBase;
    }

    LevelUp() {
        this.XP = 0;
        this.Level++;

        this.recalcStats();
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

class CreatureTemplate {
    constructor(name, attack, health, speed, loot) {
        this.Name = name;
        this.AttackMod = attack;
        this.HealthMod = health;
        this.SpeedMod = speed;
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
            GameVersion: "NaNi",
            LastUpdateTime: 0,
            StoryState: {
                StoryStage: 0,
                StoryControlID: 0,
            },
        };

        this.GameState = "PRE_COMBAT";

        // Settings
        this.Settings = {
            // Languages supported, current list:
            // English
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
            MetalCounter: document.querySelector('#metalDisplay'),
            LeatherCounter: document.querySelector('#leatherDisplay'),
            ClothCounter: document.querySelector('#clothDisplay'),
            MerylTurnOrder: document.querySelector('#MerylOrder'),
            ChaseTurnOrder: document.querySelector('#ChaseOrder'),
            TaliTurnOrder: document.querySelector('#TaliOrder'),
            HerschelTurnOrder: document.querySelector('#HershelOrder'),
            EnemyHealth: document.querySelector('#enemyHealth'),
            WorldStats: document.querySelector('#WorldStats'),
        };

        // Enemy Archtypes
        this.Bestiary = [
            new CreatureTemplate('Goblin', 1, 1, 1),
            new CreatureTemplate('Dragon', 2, 5, 1.2),
            new CreatureTemplate("Kobold", 0.8,0.8,0.8)
        ];

        // Enemy scaling factors
        this.WorldZoneScaleFactor = 2;
        this.WorldCellScaleFactor = 0.021;
        this.WorldResourceScaleFactor = 0; // TODO something?

        // Levelling constants
        this.LevelScaleFactor = 1.1;
        this.ExperienceRequirement = 100;
        this.ExperienceRequirementScaleFactor = 1.15;

        this.StoryTriggers = [
            "TEST_EVENT",
            "SCRAPS_RECIEVED",
            "TEST_EVENT",
        ];

        // Not the most elegant but all of the achievement stuff goes here
        this.AchievementData = {

            CalculateTotal: function () {
                // go through each and total things up
                let newTotal = 0;
        
                // Scraps
                for (var i = 0; i < Game.Achievements['Scraps']; i++) {
                    newTotal += Lookup.AchievementData.Scraps.TierValues[i];
                }
        
                // Metal
                for (var i = 0; i < Game.Achievements['Metal']; i++) {
                    newTotal += Lookup.AchievementData.Metal.TierValues[i];
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
        
            Metal: new TieredAchievement(
                [10, 25, 50, 100, 1000],
                [1, 1, 2, 2, 5],
                "SCRAPS_RECIEVED",
                function () {
        
                    if (Game.Achievements['Metal'] >= Lookup.AchievementData.Metal.TierBreakpoints.length) {
                        allEvents.removeEvent(Lookup.AchievementData['Metal'].HandlerID);
                        return;
                    }

                    let nextTier = Lookup.AchievementData.Metal.TierBreakpoints[Game.Achievements['Metal']];
        
                    if (Game.Resources.Metal >= nextTier) {
                        console.log(ParseGameText("Achievement recieved: Acquire {0} Metal!", nextTier));
        
                        Game.Achievements['Metal']++;
                        Lookup.AchievementData.CalculateTotal();
                    }
                }
            ),
        }
    }
}

var Game = new PlayerData();
var Lookup = new GameData();