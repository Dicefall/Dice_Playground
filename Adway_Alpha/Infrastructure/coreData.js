"use strict";
// All of the game's core classes and data will be found here.
// TODO: Need some kind of copyright notice or something

// This is it, the big player data structure. Anything that gets saved
// will end up in here. 
class PlayerData {

    constructor() {

        // Resources
        this.Resources = {
            Gold: 0,
            GoldIncome: 0,

            XP: 0,

            // Reset currency
            Essence: {
                Total: 0,
                CurrentRun: 0,
            },
        };

        // Amnesia is the opposite, so things that make you remember
        // This is the stats for your reset perks. 
        

        // Hero
        this.Hero = new Hero();

        // Current active encounter
        this.Enemy = null;
        this.CombatArea = GameDB.Constants.CombatAreas.World;

        // Note to self for later
        //  Make dungeon/arena structure follow this
        //  for spawn code to be the same
        // Current Map/World info
        this.World = {
            // For preloading or pre-spawning
            // Any data that exists for the entire zone that isn't
            // fixed for that zone. For example if a number of enemies
            // should spawn in with modifiers we can pre-arrange them.
            // Sets up procedural things.
            ActiveZone: {
                PossibleEnemies: [],
                Encounters: [],
            },
            CurrentZone: 0,
            CurrentCell: 0,
            // If I end up letting the player dip out of combat to do combat elsewhere
            //  I'll need something like this to put the enemy on a stack
            //  Probably multiples of these for different areas
            StoredEncounter: null
        };

        // Current Arena being run
        this.Arena = {
            BracketType: GameDB.Arenas.PrimitiveType.Knockout,
            Teams: [], // Essentially which enemy, order important
            TeamScores: [], // Their record, wins for elim, points for group
            CurrentRound: 0,

            StoredEncounter: null,
        }

        // Any run modifiers, unused right now
        this.RunMods = [];
        this.ModStrengths = [];

        // Upgrades purchased/unlocked
        this.Upgrades = {
            Unlocked: [],
            AvailableLevels: [],
            PurchasedLevels: [],
        };

        // Achievements
        this.Achievements = {
            TotalScore: 0,

            // Earned
            Gold: {
                // TODO: Maybe move this, feels like it shouldn't be here
                HandlerID: allEvents.registerListener(GameDB.Events.Gold.EventTrigger, GameDB.Events.Gold.EventUsed),
                TierEarned: 0
            }
        };

        // Player data regarding purchased attribute levels
        this.Attributes = {
            Strength: {
                Unlocked: true,
                Level: 0,
            },
            Constitution: {
                Unlocked: true,
                Level: 0,
            },
            Perception: {
                Unlocked: true,
                Level: 0,
            },
            Wisdom: {
                Unlocked: true,
                Level: 0,
            },
        };

        // Keeping track of what's been unlocked for this run
        //this.Runlocks = {};

        // Keeping track of global feature unlocks
        this.FeatureUnlocks = {};

        this.Stats = {
            GameVersion: {
                Major: 0,
                Minor: 6,
                Patch: 1,
            },

            LastUpdateTime: Date.now(),

            StoryState: {
                StoryStage: 0,
                StoryControlID: 0,
            },
        };

        this.CombatState = GameDB.Constants.States.Combat.Paused;

        this.statTracking = {
            RunTimeSpent: 0,
            Resets: 0,
        };

        // See Utils.js for actual rand systems.
        // Date to seed the seeds
        var seedSeed = Date.now();
        seedSeed = RandomIntMulti(seedSeed, MIN,MAX, 1);
        this.RNGSeeds = {
            Equipment: seedSeed[0],
        };

        // Settings
        this.Settings = {
            Language: 'English',
            // How frequently your browser attempts to run the game loop.
            // The game is built to run on it's own sense of time and this
            // is only for how frequently the browser tries to run things.
            // If you want to game to process smaller 
            // See GameData.GameLoopIntervalBase
            GameSpeed: 100,
            AutoSaveFrequency: 60 * 1000, // in millisconds

            // Current number notations supported:
            // Scientific, Engineering, Log
            NumberNotation: "Scientific",
            // Still working on other bases, this isn't hooked up to anything
            NumberBase: 10,

            // Game Speedup settings
            SpendIfOver: 1000*60*30, //Default to 30 minutes
            Acceleration: 5, // Default 5x acceleration when accelerating

        };
    }
}

// This is for anything specific to this instance of the game
// This will include most UI references and tab information
//  such as refernces to the main game loop for the browser.
//      Also including any calculated information that doesn't need to be saved.
class GameData {
    constructor() {
        // References to the HTML elements
        // This will likely change as the ui gets built
        this.UIElements = {
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