// Loosely connected utility functions held together in one place
"use strict";

// Class definitions needed early ---------------------------------------------
// Actors, pretty much anyone that will end up in combat
class Actor {

    static baseTurnRate = 1500;

    constructor(name) {
        this.Name = name;

        this.Speed = 1; // read as percentage. 50% = 0.5
        this.Attack = 10;
        this.HealthCurr = 100;
        this.HealthMax = 100;
        this.isAlive = true;
    
        this.SpeedBase = 1;
        this.AttackBase = 10;
        this.HealthBase = 100;

        this.turnTimerID = -1;
    }
}

class Hero extends Actor { 

    constructor(name = "Hero") {
        super(name);

        // Level gives a big boost to attack/defense
        // but it also reduces the effectiveness of secondary stats
        this.Level = 0;

        // Stat upgrades
        this.StatLevels = {
            Attack: {
                Tier: 0,
                Level: 0
            },
            Health: {
                Tier: 0,
                Level: 0
            },
            Crit: {
                Tier: 0,
                Level: 0
            },
            CritDamage: {
                Tier: 0,
                Level: 0
            },
            Haste: {
                Tier: 0,
                Level: 0
            },
            Regen: {
                Tier: 0,
                Level: 0
            }
        };

        // Upgraded stat values
        this.CritRating = 0;
        this.HasteRating = 0;
        this.CritDmgRating = 0;
        this.RegenRating = 0;

        // Post conversion stats
        this.CritChance = 0;        // %age chance of scoring a critical strike
        this.CritDamageBonus = 0;   // Bonus damage % of a critical strike, (1+this)x bonus
        this.HealthRegen = 0.01;       // %age of health regenerated per tick
        // Speed included here as well

        // Player attack aura
        this.turnTimerID = Chronos.CreateTimer("PlayerTurn",this);
        // Regen aura
        this.regenTimerID = Chronos.CreateTimer("PlayerRegen", this);
    }

    // TODO: Double check tier up cost things (in case numLevels =0 when tiering up)
    LevelUpStat(statName, numLevels, tierUp){

        // Get cost required to level up desired stat
        var targetTier = this.StatLevels[statName].Tier + (tierUp ? 1 : 0);
        var targetLevel = tierUp ? numLevels : this.StatLevels[statName].Level + numLevels;

        var buyoutCost = Math.ceil(getTotalMultiCost(GameDB.Stats[statName].baseXPCost * Math.pow(GameDB.Stats[statName].tierUpCostScaling, targetTier),targetLevel, GameDB.Stats[statName].levelCostScaling,true));
        if (Game.Resources.XP >= buyoutCost) {
            this.StatLevels[statName].Tier = targetTier;
            this.StatLevels[statName].Level = targetLevel;
            Game.Resources.XP -= buyoutCost;
        } else {
            console.log("Error, unable to afford upgrade");
        }

        this.recalcStats();
    }

    recalcStats() {

        // Meta stat
        var primaryBoost = Math.pow(GameDB.Stats.Level.primaryMulti,this.Level);

        // 'Primary' stats, Attack and Health
        this.Attack = this.AttackBase + GameDB.Stats.Attack.baseStatGain * Math.pow(GameDB.Stats.Attack.tierUpStatFactor, this.StatLevels.Attack.Tier) * this.StatLevels.Attack.Level;
        this.Attack *= primaryBoost;

        // When max health changes, health deficit is retained.
        // Example, if you start with 80/100 health
        //  -Double your health ends up with 180/200
        //  -Cutting health in half ends up with 30/100
        //      Can feel bad for getting max health cut real low but I feel this is the best way to handle changing health pools
        var healthDeficit = this.HealthMax - this.HealthCurr;
        this.HealthMax = this.HealthBase + GameDB.Stats.Health.baseStatGain * Math.pow(GameDB.Stats.Health.tierUpStatFactor, this.StatLevels.Health.Tier) * this.StatLevels.Health.Level;
        this.HealthMax *= primaryBoost;
        this.HealthCurr = Math.max(this.HealthMax - healthDeficit,1);

        // 'Secondary' stats
        this.HasteRating = GameDB.Stats.Haste.baseStatGain * Math.pow(GameDB.Stats.Haste.tierUpStatFactor, this.StatLevels.Haste.Tier) * this.StatLevels.Haste.Level;
        this.CritRating = GameDB.Stats.Crit.baseStatGain * Math.pow(GameDB.Stats.Crit.tierUpStatFactor, this.StatLevels.Crit.Tier) * this.StatLevels.Crit.Level;
        this.CritDmgRating = GameDB.Stats.CritDmg.baseStatGain * Math.pow(GameDB.Stats.CritDmg.tierUpStatFactor, this.StatLevels.CritDamage.Tier) * this.StatLevels.CritDamage.Level;
        this.RegenRating = GameDB.Stats.Regen.baseStatGain * Math.pow(GameDB.Stats.Regen.tierUpStatFactor, this.StatLevels.Regen.Tier) * this.StatLevels.Regen.Level;

        // Secondary stats conversions from rating
        // base 25 rating per % gain, decays every level up
        var ratingDecay = GameDB.Constants.Stats.BaseRatingConversion / Math.pow(GameDB.Stats.Level.ratingConversionDecay, this.Level);

        this.Speed = 1 + 0.01 * this.HasteRating / ratingDecay;
        this.CritChance = 0.01 * this.CritRating / ratingDecay; 
        this.CritDamageBonus = 0.02 * this.CritDmgRating / ratingDecay; 
        this.HealthRegen = 0.01 + 0.01 * this.RegenRating / ratingDecay; 
    }

    OnDeath() {
        // Health has already dropped below zero, control it here for consistency
        this.HealthCurr = 0;
        this.isAlive = false;

        // Attempting to balance death a bit
        //  If you're faster than the enemy you can still get hits in
        //  This might be trying to solve a problem that doesn't exist
        //  I still think it's part of the penalty of hp going to 0
        this.turnTimerID = Chronos.RemoveTimer(this.turnTimerID);
    }

    Revive() {

        // Probably overshot max health
        if (this.HealthCurr > this.HealthMax){
            this.HealthCurr = this.HealthMax;
        }
        this.isAlive = true;

        // Check for attack aura exist, if not start it up again.
        if (this.turnTimerID == null) {
            this.turnTimerID = Chronos.CreateTimer("PlayerTurn", this);
        }

    }

}

class Creature extends Actor {
    constructor(name) {
        super(GameDB.Creatures[name].Name);

        // Get world and cell scaling
        var worldMod = Math.pow(
            GameDB.Constants.WorldScaling.Zone,
            Game.World.CurrentZone - 1);

        this.Speed *= GameDB.Creatures[name].SpeedMod;
        this.Attack *= GameDB.Creatures[name].AttackMod * worldMod;
        this.HealthMax *= GameDB.Creatures[name].HealthMod * worldMod;
        this.HealthCurr = this.HealthMax;

        // Add creature combat timer to the list
        this.turnTimerID = Chronos.CreateTimer("EnemyTurn",this);
        
    }
}

// Zones-----------------------------------------------------------------------
function startZone(zoneNumber) {
    // Set up the zone!

    // People are going to get further than I have built
    // I've made a special zone that repeats at the end for them
    if (zoneNumber >= GameDB.Zones.length) zoneNumber = GameDB.Zones.length - 1;

    var zoneRef = {};
    Object.assign(zoneRef, GameDB.Zones[zoneNumber]);
    Game.World.ActiveZone.Encounters = [];
    Game.World.ActiveZone.PossibleEnemies = zoneRef.enemyNames.concat(zoneRef.specialEncounters)

    // Just in case I've made a mistake make sure cell counts are right.
    zoneRef.numCells = zoneRef.enemyCounters.reduce(
        function(a,b) {return a + b;}
    ) + zoneRef.specialEncounters.length;

    if (zoneRef.numCells != GameDB.Zones[zoneNumber].numCells) {
        console.log("Zone Cell Count Mismatch. Expected: " + GameDB.Zones[zoneNumber].numCells +
                    ". But Got: " + zoneRef.numCells);
    }
    
    // Generate the list of enemies for the zone
    //  List will be ints that identify the enemy that will spawn
    //  number will match the index of the enemy in the zone's list of enemies
    //  Special enemies will listed higher than regular enemies.
    //  E.g. ["Goblin", "Orc"] for normals, and ["Dragon"] for special will
    //      be compared against ["Goblin", "Orc", "Dragon"]
    for (var i = 0; i < zoneRef.numCells; i++) {

        // Check for special/scripted encounters. E.g. bosses or special
        if (zoneRef.specialCells.includes(i)) {
            Game.World.ActiveZone.Encounters.push(
                zoneRef.enemyNames.length + zoneRef.specialCells.indexOf(i)
            );
            continue;
        } else {

            // Select enemy from those remaining
            var randomEnemySelection = Math.floor(Math.random() * zoneRef.enemyNames.length);

            // Push that index onto the list, compare against actual zone db for proper index
            // Index of the entry which shares a name with the randomly selected entry
            Game.World.ActiveZone.Encounters.push(
                GameDB.Zones[zoneNumber].enemyNames.indexOf(
                    zoneRef.enemyNames[randomEnemySelection]
                )
            );

            // Count it against zone ref and clean up remaining enemies in list
            zoneRef.enemyCounters[randomEnemySelection]--;
            if (zoneRef.enemyNames[randomEnemySelection] == 0) {
                zoneRef.enemyNames.splice(randomEnemySelection,1);
                zoneRef.enemyCounters.splice(randomEnemySelection,1);
            }
            
        }
    }
}

// Reset functions ------------------------------------------------------------
function resetRun() {

    // Record that a reset has happened and set the run time to 0
    Game.statTracking.Resets++;
    Game.statTracking.RunTimeSpent = 0;

    // Pause combat
    Game.CombatState = GameDB.Constants.States.Combat.Paused;

    // Clean up all timers and events that are specific to the run
    // TODO: Maybe add a function to chronos to clear all unflagged timers
    Chronos.RemoveTimer(Game.Hero.turnTimerID);
    Chronos.RemoveTimer(Game.Hero.regenTimerID);

    // Reset the world to the beginning
    Game.World.CurrentZone = 0;
    Game.World.CurrentCell = 0;
    Game.World.StoredEncounter = null;
    Game.World.ActiveZone.PossibleEnemies = [];
    Game.World.ActiveZone.Encounters = [];

    // Clean up enemy
    Chronos.RemoveTimer(Game.Enemy.turnTimerID);
    Game.Enemy = null;

    // Reset all of our hero stats
    Game.Hero = new Hero();
    
    // All income and resources
    Game.Resources.Scraps = 0;
    Game.Resources.ScrapsIncome = 0;
    Game.Resources.Gold = 0;
    Game.Resources.GoldIncome = 0;
    Game.Resources.XP = 0;
}

// Math and number things   ---------------------------------------------------
// The cost to buy multiples of buildings.
function getTotalMultiCost(baseCost, multiBuyCount, costScaling, isCompounding) {
    if (!isCompounding) {
        // simplified formula: (NND - ND + 2BN) / 2
        // N (ND - D + 2BN) / 2
        return multiBuyCount * (multiBuyCount * costScaling - costScaling + 2 * baseCost) / 2;
    } else {
        // S = A * (1 - r^n) / (1 - r)
        return baseCost * ((1 - Math.pow(costScaling, multiBuyCount)) / (1 - costScaling));
    }
}

// Find out the most one can afford with given resources
function getMaxAffordable(baseCost, totalResource, costScaling, isCompounding) {

    // Take multibuy cost formula, solve for N instead of S
    if (!isCompounding) {
        return Math.floor(
            (costScaling - (2 * baseCost) + Math.sqrt(Math.pow(2 * baseCost - costScaling, 2) + (8 * costScaling * totalResource))) / 2
        );
    } else {
        // S = A * (1 - r^n) / (1 - r)
        // n = Log[base r] (1 - (1 - r) * S / A) / Log (r)
        return Math.floor(Math.log(1 - (1 - costScaling) * totalResource / baseCost) / Math.log(costScaling));
    }
}

// Format numbers for text displaying. Cleans a lot of display up
function formatNumber(number, base = Game.Settings.NumberBase) {

    // Notation Options are:
    // Scientific, Engineering, Log

    // TODO: 
    // Supporting alternate bases

    // Check for infinite:
    if (!isFinite(number)) return '∞';//return GameText.Icons.Infinity;

    // Negative
    if (number < 0) return '-' + formatNumber(-number, base);

    // Don't want negative exponents just yet
    if (number < 0.0001 && number > 0) return 'ε';

    // Get base and exponent
    // Number expressed by: mantissa * 10 ^ exponent
    var exponent = Math.floor(Math.log10(number));
    var mantissa = number / Math.pow(10, exponent);

    // Future notes for different base:
    // log b (x) = log a (x) / log a (b)
    // Example for dozenal:
    //  log 12 (x) = log 10 (x) / log 10 (12) OR
    //  log 12 (x) = ln(x) / ln(12)

    // Clean up weird float precision for numbers less than 10k
    if (exponent <= 3) return Math.floor(number);

    // For larger numbers start dealing with notations
    switch (Game.Settings.NumberNotation) {
        case 'Scientific':
            return mantissa.toFixed(2) + 'e' + exponent.toString();
        case 'Engineering':
            var precision = exponent % 3;
            return (mantissa * (Math.pow(10, precision))).toFixed(2 - precision) + 'e' + (exponent - precision);
        case 'Log':
            return 'e' + Math.log10(number).toFixed(2);
        default:
            return number;
    }
}

function PrettifyLargeBase(number, base) { // Currently supported up to 12
    if (base > 12) return "Base not supported";

    var jsRep = number.toString(Math.floor(base)); // for bases larger than 10, string goes a-z
    var regex = /[a-z]/gi;

    var alphabet = 'abcdefghijklmnopqrstuvwxyz';
    var alphaReplacer = 'φψ'; // TODO: Come up with good replacement characters
 
    return jsRep.replace(regex,function(match) {
        return alphaReplacer[alphabet.indexOf(match)];
    });
}

//  Game save related functions -----------------------------------------------

// TODO: Maybe look at the lz-string thing other games do
function saveGameToLocal() {

    // Create save object
    var saveGame = {};
    saveGame.events = allEvents.serializeEvents();
    saveGame.chron = Chronos.SerializeTimers();
    saveGame.Game = JSON.parse(JSON.stringify(Game));

    // Get rid of things that don't need to be saved, shouldn't be anything

    // after editting
    var saveString = JSON.stringify(saveGame);

    window.localStorage.setItem("ADWAY_Save", saveString);
    console.log("AutoSaved");
}

function loadGameFromLocal() {
    let returnedSave = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
    if (returnedSave == null) {
        console.log("No local save detected");
        return false;
    } else {
        console.log("Debug file size: " + window.localStorage.getItem("ADWAY_Save").length);
    }
    
    // Events and Time
    allEvents.deserializeEvents(returnedSave.events);
    Chronos.DeserializeTimers(returnedSave.chron);

    // Player data
    // Data only fields
    Game.Resources = JSON.parse(JSON.stringify(returnedSave.Game.Resources));
    Game.Upgrades = JSON.parse(JSON.stringify(returnedSave.Game.Upgrades));
    Game.Achievements = JSON.parse(JSON.stringify(returnedSave.Game.Achievements));
    Game.Stats = JSON.parse(JSON.stringify(returnedSave.Game.Stats));
    Game.RNGSeeds = JSON.parse(JSON.stringify(returnedSave.Game.RNGSeeds));
    Game.Settings = JSON.parse(JSON.stringify(returnedSave.Game.Settings));
    Game.GameState = returnedSave.GameState;

    // Class based fields
    // Hero, enemies, probably world eventually
    Game.World = JSON.parse(JSON.stringify(returnedSave.Game.World));
    Game.World.ActiveZone = JSON.parse(JSON.stringify(returnedSave.Game.World.ActiveZone));

    // Object.assign is only a shallow copy
    Game.Hero = new Hero("Hero");
    Object.assign(Game.Hero, returnedSave.Game.Hero);

    // Make a copy of the enemy and throw new stats on it
    // Steal name and boss mod to make new one
    Game.Enemy = new Creature(oldBaddie.name, oldBaddie.isBoss);

    // Copy stats same as hero
    Object.assign(Game.Enemy, oldBaddie);

    // Unchecked/Unadded
    // Nothing left

    // Offline Time
    // Maximum of 30 days
    var missingTime = Math.min(
        Date.now() - Game.Stats.LastUpdateTime,
        1000 * 60 * 60 * 24 * 30); // 30 days in milliseconds

    Game.Stats.LastUpdateTime = Date.now();
    Game.Resources.Time += missingTime;

    // TODO: Deal with version upgrading here, so far nothing needed

    return true;
}

function removeLocalSave() {
    var result = window.confirm(GameText[Game.Settings.Language].SaveReset);
    if (result) {

        // Clean up all of the event listeners
        allEvents.clearAllEvents();
        Chronos.ClearTimers();

        // Delete localstorage save
        window.localStorage.clear();

        // Reset the base game object
        Game = new PlayerData();

        // Start up the game again
        newPage();
    }
}

//  Game helper functions   ---------------------------------------------------
//  Mostly one-off things like spawning worlds or the like.

// Deterministic Random Bit Generator -----------------------------------------
// 

function randomBigInt() {
    
    var bigString = "";
    for (var i = 0; i < 64; i++) {
        bigString += Math.floor(Math.random() * 2).toString();
    }

    return BigInt(parseInt(bigString, 2));
}

class DRNG {

    constructor(){
        // Do the init here, TODO: figure out how to get the initial entropy
        //  probably just use timestamps to start
        this.state = 0n;
        this.multi = 0n;
        this.increment = 0n;
        
        this.ReSeed();
        
    };

    Init(){

        this.state = randomBigInt();
        this.multi = randomBigInt();
        this.increment = randomBigInt();
    }
    UnInit(){
        this.state = this.multi = this.increment = 0;
    }
    ReSeed(){
        this.UnInit();
        this.Init();
    }
    Generate(){

        // LCG + PCG-XSH-RR
        // state = state * multiplier + increment;
        // output = rotate32((state ^ (state >> 18)) >> 27, state >> 59);
        // Note that the top five bits specify the rotation, leading to
        //  the constants above (64 − 5 = 59, 32 − 5 = 27, and (5 + 32)/2 = 18).
        // uint32_t output = state >> (29 - (state >> 61))
        //  note, uses top 3 bits for the window, 32 - 3 = 29
        this.state = BigInt.asUintN(64, (this.state * this.multi + this.increment));

        var rotation = this.state >> 59n; // Take the upper 5 bits as the rotation

        var output = this.state;

    }

    //HealthTest(){}
}