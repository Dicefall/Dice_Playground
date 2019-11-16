// All core data of the game.

// Hero Template:
// -Stats
// --Health (Current/Max)
// --Attack
// --Speed
// --Xp to level (current/Needed)
// -Class/job unlocks
// --Class/job mastery points

var Game = {

    // Resources
    Resources: {
        Scraps: 0,
        ScrapsIncome: 1,

        Metal: 0,
        Leather: 0,
        Cloth:  0,
    },

    // Alternative, testing
    Heroes: [
        {
            Name: "Meryl",
            Level: 1,
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            isAlive: true,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Chase",
            Level: 1,
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            isAlive: true,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Tali",
            Level: 1,
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            isAlive: true,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Herschel",
            Level: 1,
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            isAlive: true,
            CurrentTurnOrder: 0,
        },
    ],

    EnemyTemplates: [
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
    ],

    Enemies: [],

    // Current Map/World info
    World: {
        CurrentZone: 1,
        
    },

    // Per run values

    // Persistent values
    Persistents: {
        // Achievements
        Achievements: {
            TotalScore: 0,

            // Scrap Collections
            Scraps: {
                HandlerID: 0,
                BreakpointEarned: 0,
                TierBreakpoints: [
                    10, 50, 100, 1000, 10000
                ]
            }
        },

        Stats: {
            GameVersion: "NaNi",
            LastUpdateTime: 0,
            TutorialState: {
                TutorialStage: 0,
                TutorialControlID: 0,
            }
        }
    },

    UIElements: {
        ScrapCounter: document.querySelector('#scrapDisplay'),
        MerylTurnOrder: document.querySelector('#MerylOrder'),
        ChaseTurnOrder: document.querySelector('#ChaseOrder'),
        TaliTurnOrder: document.querySelector('#TaliOrder'),
        HerschelTurnOrder: document.querySelector('#HershelOrder'),
    },

    // Settings
    Settings: {
        // Tick rate in MS
        GameSpeed: 100,
        NumberNotation: "Scientific",
    },
    
}