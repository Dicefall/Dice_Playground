function mainLoop() {
    // Resource gathering

    // Scraps
    Game.Resources.Scraps += (Game.Resources.ScrapsIncome * (Game.Settings.GameSpeed / 1000));
    allEvents.queueEvent(allEvents.EventTypes.SCRAPS_RECIEVED);

    // Scrap conversion

    // Combat
    // For Testing
    if (Game.World.CurrentZone == 0) {
        Game.World.CurrentZone++;
        Game.World.CurrentCell = 1;
        spawnEncounter();
        newEncounter();
    }

    mainCombat();

    // Update UI
    UpdateUIElements();

    Game.Persistents.Stats.LastUpdateTime = new Date().getTime();
}

// Utility Functions

// Get a hero based on it's name, might be useful one day?
function getHeroByName(heroName) {

    var toReturn = null;

    Game.Heroes.forEach(hero => {
        if (hero.Name === heroName) {
            toReturn = hero;
        }
    })

    return toReturn;
}

// Format numbers for text displaying. Cleans a lot of display up
function formatNumber(number) {
    
    // Ooptions are:
    // Scientific, Engineering, Log, 

    // Check for infinite:
    if (!isFinite(number)) return '<i class="fas fa-infinity"></i>';
    if (number < 0) return '-' + formatNumber(-number);

    // Get base and exponent
    // Turns into: mantissa * 10 ^ exponent
    var exponent = Math.floor(Math.log10(number));
    var mantissa = number / Math.pow(10,exponent);

    // Clean up weird float precision for numbers less than 10k
    if (exponent <= 3) return Math.floor(number);
    
    switch (Game.Settings.NumberNotation) {
        case 'Scientific':
            return mantissa.toFixed(2) + 'e' + exponent.toString();
        case 'Standard':
            // TODO: See Conway and Guy's construction for standard notation

            return mantissa.toFixed(2)
        case 'Engineering':
            var precision = exponent % 3;
            return (mantissa * (Math.pow(10,precision))).toFixed(2 - precision) + 'e' + (exponent - precision);
        case 'Log':
            return 'e' + Math.log10(number).toFixed(2);
        default:
            return number;
    }
}

/* 'Standard' Suffixes
var suffices = [
	'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud',
    'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Od', 'Nd', 'V', 'Uv', 'Dv',
    'Tv', 'Qav', 'Qiv', 'Sxv', 'Spv', 'Ov', 'Nv', 'Tg', 'Utg', 'Dtg', 'Ttg',
    'Qatg', 'Qitg', 'Sxtg', 'Sptg', 'Otg', 'Ntg', 'Qaa', 'Uqa', 'Dqa', 'Tqa',
    'Qaqa', 'Qiqa', 'Sxqa', 'Spqa', 'Oqa', 'Nqa', 'Qia', 'Uqi', 'Dqi',
    'Tqi', 'Qaqi', 'Qiqi', 'Sxqi', 'Spqi', 'Oqi', 'Nqi', 'Sxa', 'Usx',
    'Dsx', 'Tsx', 'Qasx', 'Qisx', 'Sxsx', 'Spsx', 'Osx', 'Nsx', 'Spa',
    'Usp', 'Dsp', 'Tsp', 'Qasp', 'Qisp', 'Sxsp', 'Spsp', 'Osp', 'Nsp',
    'Og', 'Uog', 'Dog', 'Tog', 'Qaog', 'Qiog', 'Sxog', 'Spog', 'Oog',
    'Nog', 'Na', 'Un', 'Dn', 'Tn', 'Qan', 'Qin', 'Sxn', 'Spn', 'On',
    'Nn', 'Ct', 'Uc'
];
*/

function UpdateUIElements(){

    // Scrap counter
    Game.UIElements.ScrapCounter.textContent = ParseGameText(
        GameText.English.UI.Scraps,
        formatNumber(Game.Resources.Scraps)
        );

    // Turn order visual testing, health values for now
    Game.UIElements.MerylTurnOrder.textContent = ParseGameText(
        'Meryl HP: {0} / {1}',
        formatNumber(getHeroByName('Meryl').HealthCurr),
        formatNumber(getHeroByName('Meryl').HealthMax)
    );
    Game.UIElements.ChaseTurnOrder.textContent = ParseGameText(
        'Chase HP: {0} / {1}',
        formatNumber(getHeroByName('Chase').HealthCurr),
        formatNumber(getHeroByName('Chase').HealthMax)
    );
    Game.UIElements.TaliTurnOrder.textContent = ParseGameText(
        'Tali HP: {0} / {1}',
        formatNumber(getHeroByName('Tali').HealthCurr),
        formatNumber(getHeroByName('Tali').HealthMax)
    );
    Game.UIElements.HerschelTurnOrder.textContent = ParseGameText(
        'Herschel HP: {0} / {1}',
        formatNumber(getHeroByName('Herschel').HealthCurr),
        formatNumber(getHeroByName('Herschel').HealthMax)
    );
    Game.UIElements.EnemyHealth.textContent = ParseGameText(
        '{0} HP: {1} / {2}',
        Game.Enemies[0].Name,
        formatNumber(Game.Enemies[0].HealthCurr),
        formatNumber(Game.Enemies[0].HealthMax)
    );

    Game.UIElements.WorldStats.textContent = ParseGameText(
        'You are currently in the world at zone {0} and cell {1}',
        formatNumber(Game.World.CurrentZone),
        formatNumber(Game.World.CurrentCell),
    );
}

// Saving Functions, currently unused
// TODO: Maybe look at the lz-string thing other games do----------------------
function saveGameToLocal() {
    window.localStorage.setItem("ADWAY_Save", JSON.stringify(Game));
}

function loadGameFromLocal() {
    Game = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
}
// ----------------------------------------------------------------------------

// Combat ---------------------------------------------------------------------
// Everything combat here, including class perks and anything else that needs
// to be dealt with for combat.

// Main Combat
function mainCombat() {

    // Advance turn cds
    Game.Heroes.forEach(hero => {
        hero.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + hero.Speed / 100);
    });

    Game.Enemies.forEach(badguy => {
        badguy.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + badguy.Speed / 100);
    });

    // Go through actors capable of acting and do the thing.
    var nextActor = null;
    do {
        nextActor = null;
        Game.Heroes.forEach(actor => {
            if (actor.CurrentTurnOrder < 0) {
                if (nextActor != null) {
                    if (actor.CurrentTurnOrder < nextActor.CurrentTurnOrder) {
                        nextActor = actor;
                    }
                } else {
                    nextActor = actor;
                }
            }
        });

        Game.Enemies.forEach(actor => {
            if (actor.CurrentTurnOrder < 0) {
                if (nextActor != null) {
                    if (actor.CurrentTurnOrder < nextActor.CurrentTurnOrder) {
                        nextActor = actor;
                    }
                } else {
                    nextActor = actor;
                }
            }
        });

        if (nextActor != null) {
            // combat actions go here

            // See if it's a hero
            if (getHeroByName(nextActor.Name) != null) {
                // TODO simple combat for now, something something AI
                Game.Enemies[0].HealthCurr -= nextActor.Attack;
            } else {
                Game.Heroes[Math.floor(Math.random() * 4)].HealthCurr -= nextActor.Attack;
            }

            nextActor.CurrentTurnOrder += 10000;
        }

    } while (nextActor != null)

    if (Game.Enemies[0].HealthCurr <= 0) {
        Game.Enemies.splice(0,1);
    }

    if (Game.Enemies.length == 0) {
        Game.World.CurrentCell++;
        spawnEncounter();
    }
}

// Start a new combat encounter
function newEncounter() {

    // Reset any per-combat stats
    Game.Heroes.forEach(hero => {
        hero.CurrentTurnOrder = 100000 / hero.Speed;
    });

}

// Who knows when stats will get into a weird state that needs to be reset
function recalcStats() {

    // Base stats basically
    Game.Heroes.forEach(hero => {
        hero.Speed = 15; // No speed mods yet
        hero.Attack = 10; // no attack mods yet
        hero.HealthMax = 100; // no health mods yet

        hero.HealthCurr = Math.min(hero.HealthCurr,hero.HealthMax);
    })
}

function startWorldZone(){}

function spawnMap(){}

function spawnEncounter(){
    
    // Each zone is 50% stronger than previous zone baseline
    var worldMod = Math.pow(
        Game.World.WorldZoneScaleFactor,
        Game.World.CurrentZone);

    // TODO come up with something here
    var cellMod = Math.pow(
        Game.World.WorldCellScaleFactor,
        Game.World.CurrentCell);

    // TODO: make it more fancy, for now just spawn goblins
    Game.Enemies.push(
        {
            Name: "Goblin",
            Speed: 15 * Game.EnemyTemplates[0].SpeedMod,
            Attack: 1 * Game.EnemyTemplates[0].AttackMod * worldMod * cellMod,
            HealthMax: 50 * Game.EnemyTemplates[0].HealthMod * worldMod * cellMod,
            HealthCurr: 50 * Game.EnemyTemplates[0].HealthMod * worldMod * cellMod,
            CurrentTurnOrder: 10000,
        }
    )
    
}

// ----------------------------------------------------------------------------

function tieredScrapAchievement(){

    let nextTier = Game.Persistents.Achievements.Scraps.TierBreakpoints[Game.Persistents.Achievements.Scraps.BreakpointEarned]

    if (Game.Resources.Scraps >= nextTier)
    {
        console.log(ParseGameText("Achievement recieved: Acquire {0} Scraps!",nextTier));

        Game.Persistents.Achievements.TotalScore += 
            Game.Persistents.Achievements.Scraps.TierValues[
                Game.Persistents.Achievements.Scraps.BreakpointEarned++
            ]

        if (Game.Persistents.Achievements.Scraps.BreakpointEarned >= Game.Persistents.Achievements.Scraps.TierBreakpoints.length) {
            allEvents.removeEvent(
                Game.Persistents.Achievements.Scraps.HandlerID);
        }
    }
}

function tutorialControl(){
    
    switch (Game.Persistents.Stats.TutorialState.TutorialStage) {
        case 0:
            console.log(ParseGameText(GameText.English.Story.Intro));
            Game.Persistents.Stats.TutorialState.TutorialStage++;
            allEvents.removeEvent(
                Game.Persistents.Stats.TutorialState.TutorialControlID);
            
            Game.Persistents.Stats.TutorialState.TutorialControlID = 
                allEvents.registerListener(
                    allEvents.EventTypes.SCRAPS_RECIEVED,
                    tutorialControl
                )
            break;
        case 1:
            if (Game.Resources.Scraps >= 50) {
                console.log(ParseGameText(GameText.English.Story.FoundMeryl));
                allEvents.removeEvent(
                    Game.Persistents.Stats.TutorialState.TutorialControlID);
                
                Game.Persistents.Stats.TutorialState.TutorialStage++;
                // no more tutorial bits just yet

            }
            
            break;
        default:
            // nothing to do here
    }
}

window.onload = function() {
    
    // Get previous save from localstorage, check later for online save
    //loadGameFromLocal();

    //Testing
    Game.Persistents.Achievements.Scraps.HandlerID = 
        allEvents.registerListener(
            allEvents.EventTypes.SCRAPS_RECIEVED,
            tieredScrapAchievement);
    
    // Tutorial Controller
    Game.Persistents.Stats.TutorialState.TutorialControlID = 
        allEvents.registerListener(
            allEvents.EventTypes.TEST_EVENT,
            tutorialControl
        )
    
    // Queue up main loop 
    window.setInterval(mainLoop, Game.Settings.GameSpeed);
    allEvents.queueEvent(allEvents.EventTypes.TEST_EVENT);

};