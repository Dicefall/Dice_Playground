// All of the game's core classes and data will be found here.
// TODO: Need some kind of copyright notice or something

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
        this.Attack = 10;
        this.HealthBase = 100;
    }
 }

class Hero extends Actor { 
    constructor(name) {
        super(name);
    }

    // --Xp to level (current/Needed)
    // --max level
    // -Class/job unlocks
    // --Class/job mastery points

}

class Creature extends Actor {
    constructor(name) {
        super(name);

        // Get world and cell scaling
        var worldMod = Math.pow(
            Game.World.WorldZoneScaleFactor - 1,
            Game.World.CurrentZone);
    
        var cellMod = 1 + (Game.World.WorldCellScaleFactor * (Game.World.CurrentCell - 1));

        // Apply scaling to new creature
        Game.EnemyTemplates.forEach(archtype => {
            if (name === archtype.Name) {
                this.Speed *= archtype.SpeedMod;
                this.Attack *= archtype.AttackMod * worldMod * cellMod;
                this.HealthMax *= archtype.HealthMod * worldMod * cellMod;
                this.HealthCurr = this.HealthMax;
            }
        })
        
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
            TutorialState: {
                TutorialStage: 0,
                TutorialControlID: 0,
            },
        };

        // Settings
        this.Settings = {
            GameSpeed: 100, // in MS
            AutoSaveFrequency: 30 * 60 * 1000, //30 minutes
            NumberNotation: "Scientific",
        };
    }
}

// This is for fixed constants for the game, such as base stats or enemy templates
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
        this.EnemyTemplates = [
            {
                Name: "Goblin",
                AttackMod: 1,
                HealthMod: 1,
                SpeedMod: 1,
            },
            {
                Name: "Dragon",
                AttackMod: 2,
                HealthMod: 5,
                SpeedMod: 1.2,
            }
        ];

        this.WorldZoneScaleFactor = 2;
        this.WorldCellScaleFactor = 0.021;

        this.TutorialTriggers = [
            "TEST_EVENT",
            "SCRAPS_RECIEVED",
        ];
    }
}

var Game = new PlayerData(); // Change var name maybe, not the most clear
var Lookup = new GameData();