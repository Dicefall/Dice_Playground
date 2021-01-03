// Loosely connected utility functions held together in one place
"use strict";

// Class definitions needed early ---------------------------------------------
// Actors, pretty much anyone that will end up in combat
class Actor {

    static baseTurnRate = 1500;

    constructor(name) {
        this.Name = name;
    
        this.SpeedBase = 1;
        this.AttackBase = 5;
        this.HealthBase = 50;

        this.Speed = 1; // read as percentage. 50% = 0.5
        this.Attack = this.AttackBase;
        this.HealthCurr = this.HealthBase;
        this.HealthMax = this.HealthBase;
        this.isAlive = true;

        this.turnTimerID = -1;
    }
}

class Hero extends Actor { 

    constructor(name = "Hero") {
        super(name);

        // Level gives a big boost to attack/defense
        // but it also reduces the effectiveness of secondary stats
        this.Level = 0;

        // Give the player twice the base stats for a good head start
        this.AttackBase *= 2;
        this.HealthBase *= 2;

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

    // Add levels to a secondary stat
    LevelUpStat(statName, numLevels){

        // Get cost required to level up desired stat
        var buyoutCost = Math.ceil(
            getTotalMultiCost(
                GameDB.Stats[statName].baseXPCost * Math.pow(GameDB.Stats[statName].tierUpCostScaling, this.StatLevels[statName].Tier) * Math.pow(GameDB.Stats[statName].levelCostScaling, this.StatLevels[statName].Level),
                numLevels,
                GameDB.Stats[statName].levelCostScaling,
                true
            )
        );

        // Check if we can afford it and level it up
        if (Game.Resources.XP >= buyoutCost) {
            this.StatLevels[statName].Level += numLevels;
            Game.Resources.XP -= buyoutCost;

            this.recalcStats();
        } else {
            console.log("Error, unable to afford upgrade");
        }
    }

    // Increase secondary stat by one tier
    TierUpStat(statName) {
        var tierIndex = Game.Upgrades.indexOf(statName);

        if (tierIndex == -1) {
            console.log("Already purchased all available tiers");
            return;
        } else if (Game.Upgrades.PurchasedLevels[tierIndex] >= Game.Upgrades.AvailableLevels[tierIndex]) {
            console.log("Already purchased all available tiers");
            return;
        }

        var levelUpCost = Math.ceil(GameDB.Stats[statName].baseXPCost * Math.pow(GameDB.Stats[statName].tierUpCostScaling, this.StatLevels[statName].Tier));
        if (Game.Resources.XP >= levelUpCost) {
            // Give level
            this.StatLevels[statName].Tier++;
            this.StatLevels[statName].Level = 1;
            Game.Resources.XP -= levelUpCost;

            this.recalcStats();
        } else {
            console.log("Unable to afford tier up of " + statName);
        }
    }

    // Mostly same as LevelUpStat but specific to Level
    //  Only one at a time, 
    LevelUp() {

        var levelIndex = Game.Upgrades.Unlocked.indexOf("LevelUp");

        // Make sure the level up is available for puchase
        if (levelIndex == -1) {
            console.log("Already purchased all available levels");
            return;
        } else if (Game.Upgrades.PurchasedLevels[levelIndex] >= Game.Upgrades.AvailableLevels[levelIndex]) {
            console.log("Already purchased all available levels");
            return;
        }

        // Assuming levelling up is allowed, get cost and pay for level up
        var levelUpCost = Math.ceil(GameDB.Stats.Level.baseXPCost * Math.pow(GameDB.Stats.Level.levelCostScaling, this.Level));
        if (Game.Resources.XP >= levelUpCost) {
            // Give level
            this.Level++;
            Game.Resources.XP -= levelUpCost;

            // Re-do stats
            this.recalcStats();
        } else {
            console.log("Unable to afford levelup");
        }
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
        //  -Cutting health in half ends up with 30/50
        //      Can feel bad for getting max health cut real low but I feel this is the best way to handle changing health pools
        var healthDeficit = this.HealthMax - this.HealthCurr;
        this.HealthMax = 
            // Base and stat level
            (this.HealthBase + GameDB.Stats.Health.baseStatGain * Math.pow(GameDB.Stats.Health.tierUpStatFactor, this.StatLevels.Health.Tier) * this.StatLevels.Health.Level) *
            Math.pow(GameDB.Attributes.Constitution.Bonus,Game.Attributes.Constitution.Level) * // From Constitution Attribute
            primaryBoost; // From Level
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
        // TODO: Change this to get from game text
        super(GameText[Game.Settings.Language].CreatureNames[name]);
        this.coreName = name;

        // Get world and cell scaling
        var worldMod = Math.pow(
            GameDB.Constants.WorldScaling.Zone,
            Game.World.CurrentZone);

        this.Speed *= GameDB.Creatures[name].SpeedMod;
        this.Attack *= GameDB.Creatures[name].AttackMod * worldMod;
        this.HealthMax *= GameDB.Creatures[name].HealthMod * worldMod;
        this.HealthCurr = this.HealthMax;

        // Add creature combat timer to the list
        this.turnTimerID = Chronos.CreateTimer("EnemyTurn",this);
        
    }
}

//  Game helper functions   ---------------------------------------------------
//  Mostly one-off things like spawning worlds or the like.

// Zones
function startZone(zoneNumber) {
    // Set up the zone!

    // People are going to get further than I have built
    // I've made a special zone that repeats at the end for them
    if (zoneNumber >= GameDB.Zones.length) zoneNumber = GameDB.Zones.length - 1;

    // Non ref copy of the zone information so we can use it
    var zoneRef = JSON.parse(JSON.stringify(GameDB.Zones[zoneNumber]));
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
                // use GameDB since the zoneref is getting modified, and we're just stealing info
                GameDB.Zones[zoneNumber].enemyNames.length + zoneRef.specialCells.indexOf(i)
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
            if (zoneRef.enemyCounters[randomEnemySelection] <= 0) {
                zoneRef.enemyNames.splice(randomEnemySelection,1);
                zoneRef.enemyCounters.splice(randomEnemySelection,1);
            }
        }
    }
}

// Reset functions
function resetRun() {

    // Record that a reset has happened and set the run time to 0
    Game.statTracking.Resets++;
    Game.statTracking.RunTimeSpent = 0;

    // Pause combat
    Game.CombatState = GameDB.Constants.States.Combat.Paused;

    // Reset the world to the beginning
    Game.World.CurrentZone = 0;
    Game.World.CurrentCell = 0;
    Game.World.StoredEncounter = null;
    Game.World.ActiveZone.PossibleEnemies = [];
    Game.World.ActiveZone.Encounters = [];

    // Clean up enemy
    Chronos.RemoveTimer(Game.Enemy.turnTimerID);
    Game.Enemy = null;

    // Clean up all timers and events that are specific to the run
    // TODO: Maybe add a function to chronos to clear all unflagged timers
    Chronos.RemoveTimer(Game.Hero.turnTimerID);
    Chronos.RemoveTimer(Game.Hero.regenTimerID);

    // Reset all of our hero stats
    Game.Hero = new Hero();
    
    // All income and resources
    Game.Resources.Gold = 0;
    Game.Resources.GoldIncome = 0;
    Game.Resources.XP = 0;

    // Upgrade resetting
    Game.Upgrades.Unlocked = [];
    Game.Upgrades.AvailableLevels = [];
    Game.Upgrades.PurchasedLevels = [];

    // Attributes

    // Challenges
    Game.RunMods = [];
    Game.ModStrengths = [];
}

// To pause all of the combat based timers at once
//  Initially used for pausing everything to start moving encounters around
//  when switching between combat areas like dungeons or the world
function PauseAllCombat(pauseState = true) {
    // TODO: When buffs and stuff get added will have to iterate through those
    Chronos.PauseTimer(Game.Hero.regenTimerID, pauseState);
    Chronos.PauseTimer(Game.Hero.turnTimerID, pauseState);

    Chronos.PauseTimer(Game.Enemy.turnTimerID, pauseState);
}

// Switch combat area
function StoreCombat() {

    if (!Game.Enemy) return false;

    // Will have to do some pausing here
    PauseAllCombat(true);
    Game[Game.CombatArea].StoredEncounter = Game.Enemy;

    Game.Enemy = null;

    return true;
}

// Grab previously stored combat
function LoadStoredEnemy(area) {

    // check if that exists
    if (!Game[area].StoredEncounter) return false;

    // Restart timers/auras/etc
    Game.Enemy = Game[area].StoredEncounter;
    PauseAllCombat(false);

    Game[area].StoredEncounter = null;

    return true;
}

// Calculate and assign achievement total score
function CalculateTotalAchievements() {
    // go through each and total things up
    let newTotal = 0;

    // Gold
    for (var i = 0; i < Game.Achievements['Gold'].TierEarned; i++) {
        newTotal += GameDB.Events.Gold.Value[i];
    }

    Game.Achievements.TotalScore = newTotal;
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

// Re-map the value to the desired range requested
function ReMapNumber(inValue, inMin, inMax, outMin, outMax) {
    //Steps
    //  Make value exist on 0->max scale instead of -thing -> +thing (value - min)
    //  Normalize on a 0-1 scale (divide by full range)
    //  Map to new range (multiply by size of out range)
    //  Shift to new range (add out min)
        return ((inValue - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
};

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

// Formatting time values. Take precision value and the one below it
function formatTime(timeIn, precision) {
    var timeStrings = ["Milliseconds", "Seconds", "Minutes", "Hours", "Days", "Years"];
    var timeFactors = [1000, 60, 60, 24, 365];

    if (precision == Chronometer.TimePrecision.Milliseconds) {
        return formatNumber(timeIn) + timeStrings[0];
    } else {
        var totalFactor = 1;
        for (var precisionMarker = precision - 2; precisionMarker >= 0; precisionMarker--) {
            totalFactor *= timeFactors[precisionMarker];
        }

        var majorTime = Math.floor(timeIn / totalFactor);
        var minorTime = ((timeIn / totalFactor) - majorTime) * timeFactors[precision - 2];

        return formatNumber(majorTime) + " " + timeStrings[precision - 1] + " and " + formatNumber(minorTime) + " " + timeStrings[precision - 2];
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
function saveGameToLocal() {

    // Create save object
    var saveGame = {};
    saveGame.events = allEvents.serializeEvents();
    saveGame.chron = Chronos.SerializeTimers();
    saveGame.Game = JSON.parse(JSON.stringify(Game));

    // Get rid of things that don't need to be saved, shouldn't be anything

    // after editting
    var saveString = JSON.stringify(saveGame);
    saveString = LZString.compress(saveString);

    window.localStorage.setItem("ADWAY_Save", saveString);
    console.log("AutoSaved");
}

function loadGameFromLocal() {
    let returnedSave = JSON.parse(LZString.decompress(window.localStorage.getItem("ADWAY_Save")));
    if (returnedSave == null) {
        console.log("No local save detected");
        return false;
    } else {
        console.log("Debug file size: " + window.localStorage.getItem("ADWAY_Save").length);
    }

    console.log(returnedSave);
    
    // Events and Time
    allEvents.deserializeEvents(returnedSave.events);
    Chronos.DeserializeTimers(returnedSave.chron);

    // Player data
    //  Had a thought to sneak in some tricky "only when you close and re-open" narrative stuff here
    // Data only fields
    Game.Resources = JSON.parse(JSON.stringify(returnedSave.Game.Resources));
    Game.CombatArea = JSON.parse(JSON.stringify(returnedSave.Game.CombatArea));
    Game.RunMods = JSON.parse(JSON.stringify(returnedSave.Game.RunMods));
    Game.ModStrengths = JSON.parse(JSON.stringify(returnedSave.Game.ModStrengths));
    Game.Upgrades = JSON.parse(JSON.stringify(returnedSave.Game.Upgrades));
    Game.Achievements = JSON.parse(JSON.stringify(returnedSave.Game.Achievements));
    Game.Attributes = JSON.parse(JSON.stringify(returnedSave.Game.Attributes));
    Game.FeatureUnlocks = JSON.parse(JSON.stringify(returnedSave.Game.FeatureUnlocks));
    Game.Stats = JSON.parse(JSON.stringify(returnedSave.Game.Stats));
    Game.CombatState = JSON.parse(JSON.stringify(returnedSave.Game.CombatState));
    Game.statTracking = JSON.parse(JSON.stringify(returnedSave.Game.statTracking));
    Game.RNGSeeds = JSON.parse(JSON.stringify(returnedSave.Game.RNGSeeds));
    Game.Settings = JSON.parse(JSON.stringify(returnedSave.Game.Settings));

    // May need extra with stored encounters
    Game.World = JSON.parse(JSON.stringify(returnedSave.Game.World));
    Game.Arena = JSON.parse(JSON.stringify(returnedSave.Game.Arena));

    // Hero constructor makes new timers, have to nuke them right away
    //  the Object.assign should connect the old timers back up.
    Game.Hero = new Hero("Hero");
    Chronos.RemoveTimer(Game.Hero.turnTimerID);
    Chronos.RemoveTimer(Game.Hero.regenTimerID);
    Object.assign(Game.Hero, returnedSave.Game.Hero);
    Game.Hero.recalcStats();



    // Make a copy of the enemy and throw new stats on it
    // Steal name and boss mod to make new one
    Game.Enemy = new Creature(returnedSave.Game.Enemy.coreName);
    Chronos.RemoveTimer(Game.Enemy.turnTimerID);
    Object.assign(Game.Enemy, returnedSave.Game.Enemy);

    // Offline Time
    // Maximum of 30 days
    var missingTime = Math.min(
        Date.now() - Game.Stats.LastUpdateTime,
        1000 * 60 * 60 * 24 * 30); // 30 days in milliseconds

    Game.Stats.LastUpdateTime = Date.now();
    Chronos.TimeBank += missingTime;

    // TODO: Deal with version upgrading here, so far nothing needed

    console.log(Chronos.timerList);
    return true;
}

function removeLocalSave() {
    var result = window.confirm(GameText[Game.Settings.Language].SaveReset);
    if (result) {

        // // Clean up all of the event listeners
        // allEvents.clearAllEvents();
        // Chronos.ClearTimers();

        // // Delete localstorage save
        // window.localStorage.clear();

        // var cleanSave = new PlayerData();

        // // Reset the base game object
        // Object.assign(Game,cleanSave);
        // saveGameToLocal();

        // // Start up the game again
        // newPage();

        window.localStorage.removeItem("ADWAY_Save");
        window.location.reload(true);
    }
}

// Testing Suite --------------------------------------------------------------
//  For doing things quickly and in a non-standard way here are a few helpers
//  specifically for running tests.

const Test = {
    TestUsed: false,

    // May look like it's stalled for larger amounts of time skipping
    skipTime: function(timeToSkip) {
        
        Chronos.TimeBank += timeToSkip;
        Chronos.Tick(timeToSkip);

        this.TestUsed = true;
    },

    // TODO: do I want to adjust active game values with this?
    setLevel: function(newLevel) {
        Game.Hero.Level = newLevel;

        this.TestUsed = true;
    }
    
}

// Deterministic Random Bit Generator -----------------------------------------
//  For now generously borrow from github as a tutorial.
//      Structure taken from github example: https://github.com/zeh/prando/blob/master/src/Prando.ts
//      Cutting out all of the string/char stuff since I don't need it
//  Make this into a decent class maybe, bigger pain to serialize though

// Boundaries of int32
//  Used for random number generation
const RANGE = Math.pow(2,32);
const MIN = -RANGE / 2;
const MAX = -MIN;

function RandomInt(SeedName, min, max){
    AdvanceSeed(SeedName);
    return Math.floor(ReMapNumber(Game.RNGSeeds[SeedName],MIN,MAX,min,max));
};
function RandomFloat(SeedName, min, max){
    AdvanceSeed(SeedName);
    return ReMapNumber(Game.RNGSeeds[SeedName],MIN,MAX,min,max);
};

function RandomIntMulti(seedValue, min, max, count) {
    var resultCollection = [];
    for (var i = 0; i < count; i++) {
        seedValue = XORShift32(seedValue);
        resultCollection.push(Math.floor(ReMapNumber(seedValue,MIN,MAX,min,max)));
    }
    return resultCollection;
}

// TODO: Add other random types I might want, random strings? random other characters?

// Doing this by seed name to clean things up and make code more clear in general
function AdvanceSeed(seedName) {
    Game.RNGSeeds[seedName] = XORShift32(Game.RNGSeeds[seedName]);
}

function XORShift32(num){
    // Xor shift 32 with values 13,17,5
    //  Several places told me these were good numbers so for now this is what we're using
    num ^= num << 13;
    num ^= num >> 17;
    num ^= num << 5;
    return num
}