"use strict";

// Events, spells, and auras, and creatures?!
// Very crude database, built for serializability.

// All timers will be auras
// Container for static aura properties
class Aura {

    // Flags for auras
    static AuraFlags = {
        PauseOnCombat: 1,
        DurationHasted: 2,
        TickHasted: 4,
        PartialFinalTick: 8,
        Dispellable: 16,
        Visible: 32
    }
}

const GameDB = {
    // Events and auras here, functions are stored here
    // done this way for serialization and clarity
    Events: {
        // Achievements first
        Gold: {
            Name: "Gold",
            Breakpoints: [50, 100, 500, 1000, 10000],
            Value: [1, 1, 2, 2, 5],

            EventTrigger: "CURRENCY_GAINED",
            EventUsed: "Gold",
            eventCB: function() { // Gold achievement function

                if (Game.Achievements['Gold'] >= GameDB.Events.Gold.TierBreakpoints.length) {
                    allEvents.removeEvent(Game.Achievements.Gold.HandlerID);
                    return;
                }
    
                if (Game.Resources.Gold >= GameDB.Events.Gold.TierBreakpoints[Game.Achievements['Gold']]) {
    
                    var recieveText = achievementRewardText(GameDB.Achievements["Gold"]);
    
                    // TODO: Move this to an actual ui reward
                    console.log(recieveText);
    
                    Game.Achievements['Gold']++;
                    CalculateTotalAchievements();
                }
            },
        },
        // Non-achievements
        StoryControl: {
            eventCB: function() { // Story Control
                switch (Game.Stats.StoryState.StoryStage) {
                    // Very first intro text
                    case 0:
                        Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[0]);
    
                        // Spawn the first enemies
                        Chronos.CreateTimer("DelayedSpawn", null);
    
                        Game.Stats.StoryState.StoryStage++;
                        allEvents.removeEvent(
                            Game.Stats.StoryState.StoryControlID);
    
                        Game.Stats.StoryState.StoryControlID = allEvents.registerListener("CELL_CLEAR", "StoryControl");
                        break;
                    // Get some resources, lets people look around a bit
                    case 1:
                        if (Game.World.CurrentCell >= 20){
                            Game.Stats.StoryState.StoryStage++;
    
                            Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[1]);
                        }
                        break;
                    // Intro to combat
                    case 2:
                        if (Game.World.CurrentCell >= 50){
                            Game.Stats.StoryState.StoryStage++;
    
                            Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[2]);
                        }
                        break;
                    case 3:
                        if (Game.World.CurrentCell >= 75){
                            Game.Stats.StoryState.StoryStage++;
    
                            Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[3]);
    
                            allEvents.removeEvent(
                                Game.Stats.StoryState.StoryControlID);
    
                            Game.Stats.StoryState.StoryControlID = allEvents.registerListener("ZONE_CLEAR", "StoryControl");
                        }
                        break;
                    case 4:
                        Game.Stats.StoryState.StoryStage++;
    
                        Lookup.UIElements.LogDebugMessage.textContent = ParseGameText(GameText[Game.Settings.Language].Story.ChapterOne[4]);
    
                        allEvents.removeEvent(
                            Game.Stats.StoryState.StoryControlID);
    
                        //Game.Stats.StoryState.StoryControlID = allEvents.registerListener("ZONE_CLEARED", 1);
                        break;
                    case 5:
                        // Unlock new feature for getting to town the first time.
                        // Not sure what that feature is just yet, but it should probably be the equipment.
                    default:
                    // nothing to do here
                }
            },
        },
        CombatCleaner: {
            eventCB: function() { // Combat Cleaner
                // TODO: Arena checks
                if (Game.Enemy.HealthCurr <= 0) {
                    //give rewards
                    var worldLootMod = Math.pow(GameDB.Constants.WorldScaling.Resources,Game.World.CurrentZone);

                    // XP from any enemies defeated
                    Game.Resources.XP += GameDB.Constants.Base.XP * worldLootMod * GameDB.Attributes.Wisdom.getTotalBonus();
                    // No gold from arenas until the end of it
                    if (Game.CombatArea != GameDB.Constants.CombatAreas.Arena) {
                        Game.Resources.Gold += GameDB.Constants.Base.Gold * worldLootMod * GameDB.Attributes.Perception.getTotalBonus();
                    }
    
                    allEvents.queueEvent("CELL_CLEAR");
    
                    // Move on to the next cell
                    if (Game.CombatArea == GameDB.Constants.CombatAreas.World){
                        if (Game.World.CurrentCell === GameDB.Zones[Game.World.CurrentZone].numCells){
                            allEvents.queueEvent("ZONE_CLEAR");

                            if (Game.World.CurrentZone >= 15) {
                                Game.Resources.Essence.CurrentRun += GameDB.Constants.Base.Essence * Math.pow(GameDB.Constants.WorldScaling.Essence, Game.World.CurrentZone - 15);
                            }

                            Game.World.CurrentCell = 0;
                            Game.World.CurrentZone++;
                            startZone(Game.World.CurrentZone)
                        }
                    } else if (Game.CombatArea == GameDB.Constants.CombatAreas.Arena){ // Arena stuff here
                        // Do arena based rewards
                        if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Group){
                            Game.Arena.TeamScores[ Game.Arena.Teams.indexOf('Player') ] += 3;
                        } else {
                            Game.Arena.TeamScores[ Game.Arena.Teams.indexOf('Player') ] += 1;
                        }

                        // Go onto the next round
                        Game.Arena.CurrentRound++;

                        // Check for arena being done
                        var arenaEnd = false;
                        if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Group && Game.Arena.CurrentRound >= Game.Arena.Teams.length - 1){
                            arenaEnd = true;
                        }
                        if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Knockout && Game.Arena.CurrentRound >= Math.log(Game.Arena.Teams.length) / Math.log(2)){
                            arenaEnd = true;
                        }

                        clearEnemy();

                        // If the arena is over, trigger the end of the arena for rewards, etc
                        if (arenaEnd) GameDB.Arenas.end();

                    }

                    clearEnemy();
    
                    // Spawn new encounter after a short delay
                    // Delay is 500ms
                    Chronos.CreateTimer("DelayedSpawn", null);
                }
            }
        },
        // Unlocks assume normal zone progression, see testing suite for non-standards
        LevelUpUnlock: {
            eventCB: function() { // Level ups, new one every zone
                var unlockIndex = Game.Upgrades.Unlocked.indexOf("LevelUp");

                // If it's not found, add it all to the list
                if (unlockIndex == -1) {
                    Game.Upgrades.Unlocked.push("LevelUp");
                    Game.Upgrades.AvailableLevels.push(1);
                    Game.Upgrades.PurchasedLevels.push(0);
                } else {
                    Game.Upgrades.AvailableLevels[unlockIndex]++;
                }
            }
        },
    },
    Auras: {
        EnemyTurn: {
            Build: function() {
                this.endTime = Infinity;
                this.tickFrequency = Actor.baseTurnRate;
                this.nextTick = Chronos.Time + this.tickFrequency / this.Owner.Speed;
            },

            Flags: Aura.AuraFlags.PauseOnCombat | Aura.AuraFlags.TickHasted,
            onFade: null,
            onTick: function() {
                if (Game.Hero.isAlive) {
                    Game.Hero.HealthCurr -= Game.Enemy.Attack;
                }

                if (Game.Hero.HealthCurr <= 0) {
                    Game.Hero.OnDeath();

                    // Switch to rest state
                    Game.CombatState = GameDB.Constants.States.Combat.Paused;
                }
            }
        },

        PlayerTurn: {
            Build: function() {
                this.endTime = Infinity;
                this.tickFrequency = Actor.baseTurnRate;
                this.nextTick = Chronos.Time + this.tickFrequency / this.Owner.Speed;
            },

            Flags: Aura.AuraFlags.PauseOnCombat | Aura.AuraFlags.TickHasted,
            onFade: null,
            onTick: function() { // This will be what fires off when an action is done in combat.
                if (Game.Enemy == null) return;
    
                // Roll for crit
                var doesCrit = (Math.random() < Game.Hero.CritChance);
    
                Game.Enemy.HealthCurr -= Game.Hero.Attack * ((doesCrit) ? 1 + Game.Hero.CritDamageBonus : 1);

                // See if you killed it
                if (Game.Enemy.HealthCurr <= 0) { allEvents.queueEvent("ENEMY_DEFEATED"); }
            },
        },

        PlayerRegen: {
            Build: function() {
                this.endTime = Infinity;
                this.tickFrequency = 1000;
                this.nextTick = Chronos.Time + this.tickFrequency / this.Owner.Speed;
            },

            Flags: Aura.AuraFlags.TickHasted,
            onFade: null,
            onTick: function() {
                Game.Hero.HealthCurr = Math.min(Game.Hero.HealthMax, Game.Hero.HealthCurr + Game.Hero.HealthRegen * Game.Hero.HealthMax);
                if (Game.Hero.isAlive == false) {
                    if (Game.Hero.HealthCurr == Game.Hero.HealthMax) {
                        Game.CombatState = GameDB.Constants.States.Combat.Active;
                        Game.Hero.Revive();
                    }
                }
            },
        },

        DelayedSpawn: {
            Build: function() {
                // Change this owner for later when arenas/dungeons are a thing
                this.Owner = Game.World;

                this.endTime = Chronos.Time + 500;
                this.tickFrequency = 1000;
                this.nextTick = this.endTime;
            },

            Flags: 0,
            onFade: null,
            onTick: function() {
                // Zone control here.
                //  TODO: Check where in the game we are and spawn based on that
                if (Game.CombatArea == GameDB.Constants.CombatAreas.World) { // World
                    // Grab the encounter id from the zone list + special encounter list, do that and increase cell.
                    Game.Enemy = new Creature(GameDB.Zones[Game.World.CurrentZone].enemyNames.concat(GameDB.Zones[Game.World.CurrentZone].specialEncounters)[
                        [Game.World.ActiveZone.Encounters[Game.World.CurrentCell++]]
                    ]);
                } else if (Game.CombatArea == GameDB.Constants.CombatAreas.Arena) { // Arena
                    var opponent = -1;
                    if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Knockout) {
                        // Elimination/knockout style
                        // Find first person with round # == score
                        // Find second person with round # == score
                        // Set enemy if one of those people is the player
                        // Do match and set score if neither is player
                        var homeTeam = null;
                        var awayTeam = null;
                        var playerMatch = false;
                        for (var i = 0; i < Game.Arena.Teams.length; i++) {
                            // Skip over teams that have already been knocked out
                            if (Game.Arena.TeamScores[i] < Game.Arena.CurrentRound) continue;
                            // Check for player match
                            if (playerMatch) {
                                opponent = i;
                                playerMatch = false;
                                continue;
                            }
                            if (Game.Arena.Teams[i] == 'Player'){
                                if (homeTeam != null){
                                    opponent = homeTeam;
                                    homeTeam = null;
                                } else {
                                    playerMatch = true;
                                }
                                continue;
                            }
                            // If we already have a home team, store it as away
                            //  Otherwise store it as home team
                            if (homeTeam != null) {
                                awayTeam = i;
                            } else {
                                homeTeam = i;
                            }

                            // If we've got both teams do the comparison
                            if (awayTeam != null) {
                                if (GameDB.Arenas.getClashResult(Game.Arena.Teams[homeTeam], Game.Arena.Teams[awayTeam]) == "Win"){
                                    Game.Arena.TeamScores[homeTeam]++;
                                } else {
                                    Game.Arena.TeamScores[awayTeam]++;
                                }
                                // Reset team selection
                                homeTeam = null;
                                awayTeam = null;
                            }
                        }

                        console.log(Game.Arena.TeamScores);
                        
                    } else {
                        // Round robin or group style
                        // Other teams scores are already calculated when tournament spawns
                        // Just need to get which opponent is the current one
                        opponent = Game.Arena.CurrentRound;
                        if (opponent >= Game.Arena.Teams.indexOf('Player')) opponent++;

                    }

                    if (opponent == -1) {
                         console.log("Opponent Calculation failure");
                         console.log(Game.Arena.Teams);
                         console.log(Game.Arena.TeamScores);
                    }
                    
                    // Select from available enemies
                    Game.Enemy = new Creature(Game.Arena.Teams[opponent]);

                }

                Game.CombatState = GameDB.Constants.States.Combat.Active;
            },
        }
        
    },
    // Zones stored as array, index is important and it's set up in order
    //  Cells are 0-indexed
    Zones: [
        {   // Zone 1 - "Forgotten Battlefield"
            numCells: 100,
            enemyCounters: [20,45,19,10,5],
            enemyNames: ["Goblin", "Kobold", "Orc", "WarDog", "Ogre"],
            specialCells: [99],
            specialEncounters: ["Dragon"]
        },
        {   // Zone 2 - "Battlefield outskirts"
            numCells: 100,
            enemyCounters: [39,15,20,25],
            enemyNames: ["Goblin", "Orc", "WarDog", "Bear"],
            specialCells: [99],
            specialEncounters: ["Treant"]
        },
        {   // Zone 3 - "Wooded path"
        numCells: 100,
        enemyCounters: [5,5,5,20,20,38,7],
        enemyNames: ["Goblin", "WarDog", "Bear", "Wolf", "Deer", "Boar", "Snake"],
        specialCells: [],
        specialEncounters: []
        },
        {   // Zone 4 - "Wooded path Redux"
        numCells: 100,
        enemyCounters: [5,27,23,38,7],
        enemyNames: ["Bear", "Wolf", "Deer", "Boar", "Snake"],
        specialCells: [],
        specialEncounters: []
        },
        {   // Zone 5 - "Heart of the Forest"
        numCells: 100,
        enemyCounters: [27,18,12,4,38,1],
        enemyNames: ["Boar", "Deer", "Wolf", "Bandit", "Pixie", "BanditKing"],
        specialCells: [],
        specialEncounters: []
        },
        {   // Zone 6 - "Edge of the Forest"
        numCells: 100,
        enemyCounters: [30,27,18,15,5,5],
        enemyNames: ["Boar", "Deer", "Wolf", "Bandit", "Snake"],
        specialCells: [],
        specialEncounters: []
        },
        {   // Zone 00 - "The Inexorable March of Time"
            numCells: 100,
            enemyCounters: [100],
            enemyNames: ["SpacetimeCurvature"],
            specialCells: [],
            specialEncounters: []
        }
        
        /*ZoneNames: [
            "Forgotten Battlefield",
            "Battlefield outskirts",
            "Wooded Path",
            "Forest Path",
            "Heart of the Forest", // 5
            "Edge of the Forest",
            "The Foothills", // Basecamp here something
            "Cliffs of Mnemosyne",
            "Ancient Mines",
            "Haunted Drift", // 10
            "Abandoned Mineshaft", // Small zone to show off different sized zones
            "Aboleth Lair",
            "Forgotten Mural", // Another small zone with some lore
            "Summit Path",
            "Mnemosyne Summit", // 15
            "The Inexorable March of Time"
        ],*/
    ],
    // Creature information, mostly names and modifiers, loot not included yet.
    Creatures: {
        Goblin: {
            AttackMod: 1,
            HealthMod: 1,
            SpeedMod: 1,
        },
        Kobold: {
            AttackMod: 0.8,
            HealthMod: 0.8,
            SpeedMod: 0.8,
        },
        Dragon: {
            AttackMod: 2,
            HealthMod: 5,
            SpeedMod: 1.2,
        },
        Ogre: {
            AttackMod: 1.4,
            HealthMod: 1.5,
            SpeedMod: 1,
        },
        Orc: {
            AttackMod: 1,
            HealthMod: 1.2,
            SpeedMod: 1,
        },
        WarDog: {
            AttackMod: 1,
            HealthMod: 0.8,
            SpeedMod: 1,
        },
        Bear: {
            AttackMod: 1.1,
            HealthMod: 1.1,
            SpeedMod: 0.8,
        },
        Wolf: {
            AttackMod: 1.1,
            HealthMod: 1.0,
            SpeedMod: 1.0,
        },
        Deer: {
            AttackMod: 0.6,
            HealthMod: 1.2,
            SpeedMod: 1.2,
        },
        Boar: {
            AttackMod: 1.2,
            HealthMod: 1.4,
            SpeedMod: 1.1,
        },
        Snake: {
            AttackMod: 1.1,
            HealthMod: 0.6,
            SpeedMod: 1.4,
        },
        Bandit: {
            AttackMod: 1,
            HealthMod: 1,
            SpeedMod: 1.1,
        },
        Treant: {
            AttackMod: 2,
            HealthMod: 5,
            SpeedMod: 0.8,
        },
        Pixie: {
            AttackMod: 0.6,
            HealthMod: 0.4,
            SpeedMod: 2.5,
        },
        BanditKing: {
            AttackMod: 2,
            HealthMod: 2,
            SpeedMod: 1.3,
        },
        SpacetimeCurvature: {
            Name: 'Spacetime Curvature',
            AttackMod: 2,
            HealthMod: 100,
            SpeedMod: 1,
        }
    },
    // Player stat progrses information such as cost, scaling values, etc
    // Some numbers stored in comments so I can refer to them later.
    //      Math.log(25) / Math.log(1.15) = 23.031
    //      Math.log(25) / Math.log(1.25) = 14.425
    //       -This is the cost point at which tier up should cost the same
    //       -as one new level. I'll be using these as rough reference points
    Stats: {
        // "Primary" stats
        Attack: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 2,
            tierUpStatFactor: 10
        },
        Health: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 20,
            tierUpStatFactor: 10
        },

        // "Secondary" stats, come in ratings
        Crit: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 25,
            tierUpStatFactor: 5
        },
        Haste: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 5
        },
        Regen: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 5
        },
        CritDmg: {
            baseXPCost: 100,
            levelCostScaling: 1.15,
            tierUpCostScaling: 25,
            baseStatGain: 10,
            tierUpStatFactor: 5
        },
        // Random ideas from notebook
        //  Armor and Armor penetration
        //  Thorns (% of attack as reflect)
        //  Evasion and some other defensives like an energy shield (like wildstar)

        // "Meta" stats, stats that effect other stats
        Level: {
            baseXPCost: 1000,
            levelCostScaling: 1.5,
            primaryMulti: 1.25,
            ratingConversionDecay: 1.05,
        }
    },
    // Reset upgrades, fills the roles of things like ancients from CH, perks from Trimps, etc
    //  Starting with traditional fantasy game stats like strength, agi, dex, etc
    Attributes: {
        // Attack bonus
        Strength: {
            Bonus: 1.1,
            Cost: 10,
            CostScaling: 1.25,
            getTotalBonus: function() {
                return Math.pow(GameDB.Attributes.Strength.Bonus, Game.Attributes.Strength.Level);
            }
        },
        // Health bonus
        Constitution: {
            Bonus: 1.1,
            Cost: 10,
            CostScaling: 1.25,
            getTotalBonus: function() {
                return Math.pow(GameDB.Attributes.Constitution.Bonus, Game.Attributes.Constitution.Level);
            }
        },
        // Looting bonus
        //  Should not count arena rewards
        Perception: {
            Bonus: 1.05,
            Cost: 10,
            CostScaling: 1.25,
            getTotalBonus: function() {
                return Math.pow(GameDB.Attributes.Perception.Bonus, Game.Attributes.Perception.Level);
            }
        },
        // XP Bonus
        Wisdom: {
            Bonus: 1.05,
            Cost: 10,
            CostScaling: 1.25,
            getTotalBonus: function() {
                return Math.pow(GameDB.Attributes.Wisdom.Bonus, Game.Attributes.Wisdom.Level);
            }
        },
        // Stats will be based on primary aspects of the game, attack/health/etc.
        // Might need to add them for secondaries or metas as well.
        // Might come up with multiples that give the same bonus with different flavor
        //  Classes/jobs when they come in will get extra bonuses out of perks,
        //  Examples:
        //      Mage type classes might get extra attack or mana out of Intelligence
        //      A paladin might get extra health regen out of constitution or wisdom, etc
        //      A berserker class might get extra brutality levels out of strength
        // Future Attributes:
        //  Charisma: For when I add reputations
    },
    // Arenas
    Arenas: {
        // Elimination type vs point type
        PrimitiveType: {
            Knockout: "Knockout",
            Group: "Group",
            Hybrid: "Hybrid" // Like WC for example, group stage then knockout
        },
        // Going to keep adding some more here as we go on
        AllowedEnemies: [
            "Orc", "Pixie", "Bandit", "Ogre", "Goblin", "Kobold"
        ],
        // Point values for arena scores in group stage defaults.
        //  Going with pretty standard score totals here
        GroupPoints: {
            Win: 3,
            Draw: 1,
            Lose: 0
        },
        // Start an arena run
        start: function(/**/){

            // TODO: move this into params when front end starts happening
            var constructionParams = {
                Type: GameDB.Arenas.PrimitiveType.Group,
                NumTeams: 8
            }
            //------------------------------------------------------------

            StoreCombat();

            // Bracket type
            Game.Arena.BracketType = constructionParams.Type;
            // TODO: Validate team size
            // Generate list of enemies (teams)
            //  Leave one space for the player
            for (var i = 0; i < constructionParams.NumTeams - 1; i++){
                Game.Arena.Teams.push(GameDB.Arenas.AllowedEnemies[Math.floor(Math.random() * GameDB.Arenas.AllowedEnemies.length)]);
            }

            // Initialize scores
            //  adjust initial scores potentially, maybe
            for (var opp of Game.Arena.Teams) {
                Game.Arena.TeamScores.push(0);
            }

            // Run the entire tournament except for the player
            //  This lets us cheat and pre-construct the scores
            // For knockout maybe a bit complicated,
            // For points, calc each set of points but leave player out
            if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Group){
                // Each team plays each other team once (can be modified later)
                for (var i = 0; i < Game.Arena.Teams.length - 1; i++){
                    // Only play teams not already played, can be changed later if I want a home team advantage
                    for (var k = i; k < Game.Arena.Teams.length; k++){
                        // Get result of match
                        //  Returns "Win, Draw, Lose" based on home team result
                        var matchResult = GameDB.Arenas.getClashResult(Game.Arena.Teams[i], Game.Arena.Teams[k]);

                        // Give home team points based on result
                        Game.Arena.TeamScores[i] += GameDB.Arenas.GroupPoints[matchResult];

                        // Flip result for away team
                        if (matchResult == "Win") {matchResult = "Lose"}
                        else if(matchResult == "Lose") {matchResult = "Win"}
                        
                        // Give away team points based on result
                        Game.Arena.TeamScores[k] += GameDB.Arenas.GroupPoints[matchResult];
                    }
                }
            }
            // Only do this for the group stage, knockout style happens between rounds

            // Make sure we're at the beginning of the tournament
            Game.Arena.CurrentRound = 0;

            // Add player into the list
            var playerPos = Math.floor(Math.random() * constructionParams.NumTeams);
            Game.Arena.Teams.splice(playerPos,0,'Player');
            Game.Arena.TeamScores.splice(playerPos,0,0);

            // Score tournament after player has been seeded
            if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Knockout){
                // Go through each rough
                // TODO: Add case for non power of 2 knockout tournament
                //  e.g. by rounds or whatnot
                var numRounds = Math.floor(Math.log(constructionParams.NumTeams) / Math.log(2));
            }

            Game.CombatArea = GameDB.Constants.CombatAreas.Arena;

            PauseAllCombat(false);

            Chronos.CreateTimer("DelayedSpawn", Game.Arena);
        },
        // Returns a string with the home team result as Win, Draw, Lose
        getClashResult: function(homeTeam, awayTeam) {
            var homeTeamStrength = 1
            var awayTeamStrength = 1;
            homeTeamStrength *= GameDB.Creatures[homeTeam].AttackMod
                * GameDB.Creatures[homeTeam].HealthMod
                * GameDB.Creatures[homeTeam].SpeedMod
                * (Math.random() * 0.2 + 0.9);
            
            awayTeamStrength *= GameDB.Creatures[awayTeam].AttackMod
                * GameDB.Creatures[awayTeam].HealthMod
                * GameDB.Creatures[awayTeam].SpeedMod
                * (Math.random() * 0.2 + 0.9);
            
            // Home team advantage win if a tie, highly unlikely
            if (homeTeamStrength >= awayTeamStrength) {return "Win";}
            else if (homeTeamStrength < awayTeamStrength) {return "Lose";}
            
            return "Error: Something went wrong in strength comparison";
        },
        // Clean up arena data and hand out rewards
        end: function(){
            // Check victory conditions and get position
            var playerRanking = Game.Arena.Teams.length;
            if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Knockout){
                // Check which round he made it too
                playerRanking = Math.log(Game.Arena.Teams.length) / Math.log(2) - Game.Arena.CurrentRound;
                playerRanking = Math.pow(2,playerRanking);
            } else if (Game.Arena.BracketType == GameDB.Arenas.PrimitiveType.Group){
                console.log(Game.Arena.Teams);
                console.log(Game.Arena.TeamScores);
                var playerTeam = Game.Arena.Teams.indexOf('Player');
                playerRanking = 1;
                for (var i = 0; i < Game.Arena.Teams.length; i++) {
                    if (i != playerTeam) {
                        if (Game.Arena.TeamScores[playerTeam] < Game.Arena.TeamScores[i]) {
                            playerRanking++;
                        }
                    }
                }
            }

            // Rewards
            //  Big bonus of gold and xp based on ranking. Formula for now, subject to change.
            //  May need to throw in an extra kicker to make it more appealing
            //      [Normal Gold/xp reward] * [Total number of teams in tournament] / [Rank in tournament]

            // Calculate values
            // Anything that will apply to all rewards from the arena
            var arenaRewardScaling = 1;
            // From zone/level
            arenaRewardScaling *= Math.pow(GameDB.Constants.WorldScaling.Resources,Game.World.CurrentZone);
            // From placement at the end of the arena
            arenaRewardScaling *= Game.Arena.Teams.length / playerRanking;

            // XP Rewards
            var xpReward = GameDB.Constants.Base.XP;
            // Wisdom Attribute
            xpReward *= GameDB.Attributes.Wisdom.getTotalBonus();

            // Gold Rewards
            var goldReward = GameDB.Constants.Base.Gold;
            // Perception attribute
            //  TODO: Want to make perception not effect this but give something else, flavor doesn't work for me
            //      Might be a balance thing to just leave it in
            goldReward *= GameDB.Attributes.Perception.getTotalBonus();

            // Actually give it to the player
            Game.Resources.XP += xpReward * arenaRewardScaling;
            Game.Resources.Gold += goldReward * arenaRewardScaling;

            // Clear out arena info
            Game.Arena.Teams = [];
            Game.Arena.TeamScores = [];
            Game.Arena.CurrentRound = 0;

            // Check whether we're going back to world or more arenas
            // if more arenas
            //  startArena()
            // else
            LoadStoredEnemy(GameDB.Constants.CombatAreas.World);
            Game.CombatArea = GameDB.Constants.CombatAreas.World;
        }
    },
    // One off pieces of information that need somewhere to sit.
    Constants: {
        // How things scale wrt world. Enemy stats, loot, etc.
        GameVersion: {
            Major: 0,
            Minor: 6,
            Patch: 1,
        },

        EventTypes: [
            "TEST_EVENT", //Any time I want to just testing things or this system
            "ZONE_CLEAR", //Zone is finished
            "CELL_CLEAR", //Cell is finished
            "ENEMY_DEFEATED", //Enemy is defeated
            "CURRENCY_GAINED", //Might split into others
            "ADDON_EVENT", //In case third party wants to hook into this easily
        ],

        Supported: {
            // Only english, see gameText.js for information about translating.
            Languages: ['English'],
            // Latest game version that is up to date with selected language
            LanguageVersions: ["0.6.0"],
            // Different kinds of notations for larger numbers.
            NumberNotations: ["Scientific", "Engineering", "Log"],
            MaxBase: 10,
        },

        States: {
            Combat: {
                Paused: "Paused",
                Active: "Active"
            },

            Game: {
                Paused: "Paused",
                Active: "Active",
            }
        },

        CombatAreas: {
            World: "World",
            Arena: "Arena",
            Dungeon: "Dungeon",
        },

        WorldScaling: {
            Zone: 2, // Enemy stats
            Resources: 1.1, // Resource income scaling
            Essence: 1.05, // Dial in on this eventually
        },
        // Base resource drop values
        Base: {
            XP: 20,
            Gold: 1,
            Essence: 20,
        },
        Stats: {
            BaseRatingConversion: 25,
        },

        getOwnerByName(ownerName){
            switch (ownerName) {
                case 'Hero':
                    return Game.Hero;
                case 'Enemy':
                    return Game.Enemy;
            }
        }

        // Base reset currency and maybe scaling
    },
    // Needed for the engine to function
    // None yet but prepping for special challenges, maybe creatures to be hunted?
    Challenges: {},
    // Primarily for things like certain ui related specifics,
    // Nothing right now since there is no ui but an example would be:
    //  Different colors for tooltips that scale with different stats
    UI: {
        // Quality color progression
        // tbd https://cdn.discordapp.com/attachments/200624467012091904/767148900799873044/cq5dam.png
    },
};

//export {GameDB};