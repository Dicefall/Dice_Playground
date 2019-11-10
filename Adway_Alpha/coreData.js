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
            CurrentTurnOrder: 0,
        },
        {
            Name: "Chase",
            Speed: 15,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Tali",
            Speed: 15,
            CurrentTurnOrder: 0,
        },
        {
            Name: "Herschel",
            Speed: 15,
            CurrentTurnOrder: 0,
        },
    ],

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

            // 
        }
    },

    // Settings
    Settings: {
        GameSpeed: 1,
    },
    
}