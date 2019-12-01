// All core data of the game.

// Hero Template:
// -Stats
// --Health (Current/Max)
// --Attack
// --Speed
// --Xp to level (current/Needed)
// -Class/job unlocks
// --Class/job mastery points

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

class Actor { }

class Hero extends Actor { }

class GameStore {

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
        },

            // Alternative, testing
            this.Heroes = [
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
            ],

            this.Enemies = [],

            // Current Map/World info
            this.World = {
                CurrentZone: 0,
                CurrentCell: 0,
                WorldZoneScaleFactor: 2, // Enemy Multi-per zone
                WorldCellScaleFactor: 0.021, // Enemy additive per cell
            },

            // Persistent values
            this.Persistents = {
                // Achievements
                Achievements: {
                    TotalScore: 0,

                    // Scrap Collections
                    Scraps: {
                        BreakpointEarned: 0,
                        HandlerID: 0,
                        TierBreakpoints: [10, 50, 100, 1000, 10000],
                        TierValues: [1, 1, 2, 2, 5],
                        AchievementHandler:
                            function () {

                                let base = Game.Persistents.Achievements.Scraps;

                                let nextTier = base.TierBreakpoints[base.BreakpointEarned];

                                if (Game.Resources.Scraps >= nextTier) {
                                    console.log(ParseGameText("Achievement recieved: Acquire {0} Scraps!", nextTier));

                                    Game.Persistents.Achievements.TotalScore += base.TierValues[base.BreakpointEarned++];
                                }

                                if (base.BreakpointEarned >= base.TierBreakpoints.length) {
                                    allEvents.removeEvent(base.HandlerID);
                                }
                            },
                    },

                    LargestSingle:
                    {
                        HandlerID: 0,
                        BreakpointEarned: 0,
                        ActualLargest: 0,
                        TierBreakpoints: [10, 50, 100, 1000, 10000],
                        TierValues: [1, 2, 5, 5, 15],
                        AchievementHandler:
                            function (source, dest, hitSize) {
                                let base = Game.Persistents.Achievements.LargestSingle;

                                if (hitSize > base.ActualLargest) {
                                    base.ActualLargest = hitSize;
                                    if (base.ActualLargest > base.TierBreakpoints[base.BreakpointEarned]) {
                                        console.log(ParseGameText('Achievement acquired: Largest single hit {0} or greater',
                                            formatNumber(base.TierBreakpoints[base.BreakpointEarned])));

                                        Game.Persistents.Achievements.TotalScore += base.TierValues[base.BreakpointEarned++];
                                    }

                                    if (base.BreakpointEarned > base.TierBreakpoints.length) {
                                        allEvents.removeEvent(base.HandlerID);
                                    }
                                }
                            },
                    },

                    Metal: new TieredAchievement(
                        [10, 25, 50, 100, 1000],
                        [1, 1, 2, 2, 5],
                        allEvents.EventTypes.METAL_RECIEVED,
                        function () {
                            let base = Game.Persistents.Achievements.Metal;

                            let nextTier = base.TierBreakpoints[base.BreakpointEarned];

                            if (Game.Resources.Metal >= nextTier) {
                                console.log(ParseGameText('Achievement Recieved: ' + GameText.English.AchievementText.Metal.Criteria, nextTier));

                                Game.Persistents.Achievements.TotalScore += base.TierValues[base.BreakpointEarned++];
                            }

                            if (base.BreakpointEarned >= base.TierBreakpoints.length) {
                                allEvents.removeEvent(base.HandlerID);
                            }
                        }

                    )

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
            },

            // Settings
            this.Settings = {
                // Tick rate in MS
                GameSpeed: 100,
                AutoSaveFrequency: 30 * 60 * 1000, //30 minutes
                NumberNotation: "Scientific",
            }
        }
    }

var Game = new GameStore();