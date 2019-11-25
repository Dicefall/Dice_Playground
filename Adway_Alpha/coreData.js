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
            HealthCurr: 100,
            HealthMax: 100,
            isAlive: true,
            CurrentTurnOrder: 0,

            SpeedBase: 15,
            AttackBase: 10,
            HealthBase: 100,
        },
        {
            Name: "Chase",
            Level: 1,
            Speed: 14,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            isAlive: true,
            CurrentTurnOrder: 0,

            SpeedBase: 14,
            AttackBase: 10,
            HealthBase: 100,
        },
        {
            Name: "Tali",
            Level: 1,
            Speed: 16,
            Attack: 10,
            HealthMax: 100,
            HealthCurr: 100,
            isAlive: true,
            CurrentTurnOrder: 0,

            SpeedBase: 16,
            AttackBase: 10,
            HealthBase: 100,
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

            SpeedBase: 15,
            AttackBase: 10,
            HealthBase: 100,
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
        CurrentZone: 0,
        CurrentCell: 0,
        WorldZoneScaleFactor: 2, // Enemy Multi-per zone
        WorldCellScaleFactor: 0.021, // Enemy additive per cell
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
                AchievementHandler: 
                    function () {

                        let nextTier = Game.Persistents.Achievements.Scraps.TierBreakpoints[Game.Persistents.Achievements.Scraps.BreakpointEarned]

                        if (Game.Resources.Scraps >= nextTier) {
                            console.log(ParseGameText("Achievement recieved: Acquire {0} Scraps!", nextTier));

                            Game.Persistents.Achievements.TotalScore +=
                                Game.Persistents.Achievements.Scraps.TierValues[
                                Game.Persistents.Achievements.Scraps.BreakpointEarned++
                                ]
                        }

                        if (Game.Persistents.Achievements.Scraps.BreakpointEarned >= Game.Persistents.Achievements.Scraps.TierBreakpoints.length) {
                            allEvents.removeEvent(this.HandlerID);
                        }
                    },
                BreakpointEarned: 0,
                TierBreakpoints: [
                    10, 50, 100, 1000, 10000
                ],
                TierValues: [
                    1, 1, 2, 2, 5
                ],
            },

            LargestSingle: {
                HandlerID: 0,
                AchievementHandler: 
                    function (hitSize) {
                        if (hitSize > this.ActualLargest) {
                            this.ActualLargest = hitSize;
                            if (this.ActualLargest > this.TierBreakpoints[this.BreakpointEarned]) {
                                console.log(ParseGameText('Achievement acquired: Largest single hit {0} or greater',
                                formatNumber(this.TierBreakpoints[this.BreakpointEarned])));
                                this.BreakpointEarned++;
                            }

                            if (this.BreakpointEarned > this.TierBreakpoints.length) {
                                allEvents.removeEvent(this.HandlerID);
                            }
                        }
                    },
                BreakpointEarned: 0,
                ActualLargest: 0,
                TierBreakpoints: [
                    10, 50, 100, 1000, 10000
                ],
                TierValues: [
                    1, 2, 5, 5, 15
                ]
            }
        },

        Stats: {
            GameVersion: "NaNi",
            LastUpdateTime: 0,
            TutorialState: {
                TutorialStage: 0,
                TutorialControlID: 0,
            },
        }
    },

    UIElements: {
        ScrapCounter: document.querySelector('#scrapDisplay'),
        MerylTurnOrder: document.querySelector('#MerylOrder'),
        ChaseTurnOrder: document.querySelector('#ChaseOrder'),
        TaliTurnOrder: document.querySelector('#TaliOrder'),
        HerschelTurnOrder: document.querySelector('#HershelOrder'),
        EnemyHealth: document.querySelector('#enemyHealth'),
        WorldStats: document.querySelector('#WorldStats'),
    },

    // Settings
    Settings: {
        // Tick rate in MS
        GameSpeed: 100,
        NumberNotation: "Scientific",
    },
    
}