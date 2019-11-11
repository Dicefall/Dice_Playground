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
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Chase",
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Tali",
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Herschel",
            Speed: 15,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
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
        }
    },

    // Settings
    Settings: {
        // Tick rate in MS
        GameSpeed: 100,
        NumberNotation: "Scientific",
    },
    
}