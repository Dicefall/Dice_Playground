function mainLoop() {
    // Resource gathering

    generateResources();

    // Scrap conversion

    // Combat
    // For Testing
    if (Game.World.CurrentZone == 0) {
        Game.World.CurrentZone++;
        Game.World.CurrentCell = 1;
        spawnEncounter();
    }

    mainCombat();

    // Update UI
    UpdateUIElements();

    Game.Stats.LastUpdateTime = new Date().getTime();
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

// Check if selected actor is actually a hero

// Format numbers for text displaying. Cleans a lot of display up
function formatNumber(number) {
    
    // Ooptions are:
    // Scientific, Engineering, Log, 

    // Check for infinite:
    if (!isFinite(number)) return '<i class="fas fa-infinity"></i>';

    // Negative
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

    // Resource counter
    Lookup.UIElements.ScrapCounter.innerHTML = ParseGameText(
        GameText.English.UI.Scraps,
        formatNumber(Game.Resources.Scraps)
    );

    Lookup.UIElements.MetalCounter.innerHTML = ParseGameText(
        GameText.English.UI.Metal,
        formatNumber(Game.Resources.Metal)
    );

    Lookup.UIElements.LeatherCounter.textContent = ParseGameText(
        GameText.English.UI.Leather,
        formatNumber(Game.Resources.Leather)
    );

    Lookup.UIElements.ClothCounter.textContent = ParseGameText(
        GameText.English.UI.Cloth,
        formatNumber(Game.Resources.Cloth)
    );

    // Turn order visual testing, health values for now
    Lookup.UIElements.MerylTurnOrder.textContent = ParseGameText(
        'Meryl HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Meryl').HealthCurr), 0),
        formatNumber(getHeroByName('Meryl').HealthMax)
    );
    Lookup.UIElements.ChaseTurnOrder.textContent = ParseGameText(
        'Chase HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Chase').HealthCurr), 0),
        formatNumber(getHeroByName('Chase').HealthMax)
    );
    Lookup.UIElements.TaliTurnOrder.textContent = ParseGameText(
        'Tali HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Tali').HealthCurr), 0),
        formatNumber(getHeroByName('Tali').HealthMax)
    );
    Lookup.UIElements.HerschelTurnOrder.textContent = ParseGameText(
        'Herschel HP: {0} / {1}',
        formatNumber(Math.max(getHeroByName('Herschel').HealthCurr), 0),
        formatNumber(getHeroByName('Herschel').HealthMax)
    );
    Lookup.UIElements.EnemyHealth.textContent = ParseGameText(
        '{0} HP: {1} / {2}',
        Game.Enemies[0].Name,
        formatNumber(Math.max(Game.Enemies[0].HealthCurr), 0),
        formatNumber(Game.Enemies[0].HealthMax)
    );

    Lookup.UIElements.WorldStats.textContent = ParseGameText(
        'You are currently in the world at zone {0} and cell {1}',
        formatNumber(Game.World.CurrentZone),
        formatNumber(Game.World.CurrentCell),
    );
}

// Saving Functions, currently unused
// TODO: Maybe look at the lz-string thing other games do----------------------
function saveGameToLocal() {

    // Copy game save to prep local save
    let saveString = JSON.stringify(Game);
    let saveState = JSON.parse(saveString);

    // Get rid of things that don't need to be saved

    // UI references
    delete saveState.UIElements;

    window.localStorage.setItem("ADWAY_Save", JSON.stringify(Game));
}

function loadGameFromLocal() {
    Game = JSON.parse(window.localStorage.getItem("ADWAY_Save"));
}

function removeLocalSave(){
    var result = window.confirm('Are you sure you want to delete your save?');
    if (result) Game = new GameStore();
}
// ----------------------------------------------------------------------------
// Resources

function generateResources() {

    var GameSpeed = Game.Settings.GameSpeed;

    // Scraps
    Game.Resources.Scraps += (Game.Resources.ScrapsIncome * (GameSpeed / 1000));
    allEvents.queueEvent("SCRAPS_RECIEVED");

    // Conversion
    Game.Resources.Scraps -= (Game.Resources.ScrapConversionRate * (GameSpeed / 1000));

    var totalScrapConversion = (Game.Resources.ScrapToMetal + Game.Resources.ScrapToLeather + Game.Resources.ScrapToCloth) * Game.Resources.ScrapConversionRate * Game.Resources.ScrapConversionEfficiency;

    Game.Resources.Metal += totalScrapConversion * Game.Resources.ScrapToMetal;
    Game.Resources.Leather += totalScrapConversion * Game.Resources.ScrapToLeather;
    Game.Resources.Cloth += totalScrapConversion * Game.Resources.ScrapToCloth;

    allEvents.queueEvent("METAL_RECIEVED");
    allEvents.queueEvent("LEATHER_RECIEVED");
    allEvents.queueEvent("CLOTH_RECIEVED");

}

// Combat ---------------------------------------------------------------------
// Everything combat here, including class perks and anything else that needs
// to be dealt with for combat.

// Main Combat
function mainCombat() {

    // Advance turn cds
    Game.Heroes.forEach(hero => {
        if (hero.isAlive) {
            hero.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + hero.Speed / 100);
        }
    });

    Game.Enemies.forEach(badguy => {
        badguy.CurrentTurnOrder -= Game.Settings.GameSpeed * (1 + badguy.Speed / 100);
    });

    // See if anyone is ready to attack
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

        // If anyone is ready to attack, they get to do something
        if (nextActor != null) {

            // See if it's a hero
            if (getHeroByName(nextActor.Name) != null) {
                // TODO simple combat for now, something something AI
                // Lots to change, just get something basic working
                Game.Enemies[0].HealthCurr = Math.max(0, Game.Enemies[0].HealthCurr - nextActor.Attack);
                allEvents.queueEvent("COMBAT_SWING", nextActor.Name, Game.Enemies[0].Name, nextActor.Attack);

            } else {
                var target;
                do {
                    target = Game.Heroes[Math.floor(Math.random() * 4)];
                } while (!target.isAlive)

                target.HealthCurr = Math.max(0, target.HealthCurr - nextActor.Attack);

                if (target.HealthCurr <= 0) {
                    target.isAlive = false;
                }
            }

            nextActor.CurrentTurnOrder += 10000;
        }

        // Check for dead people and end of fight bits here

        // Check to see if all heroes are dead
        var partyKill = true;
        Game.Heroes.forEach(hero => {
            if (hero.isAlive === true) {
                partyKill = false;
            }
        });
        if (partyKill) {
            // TODO: something when party dies
            break;
        }

        // Check to see if enemies are dead
        if (Game.Enemies[0].HealthCurr <= 0) {
            Game.Enemies.splice(0,1);
        }

        // No enemies left, cell over
        if (Game.Enemies.length == 0) {
            Game.World.CurrentCell++;
        
            // Whole zone over
            if (Game.World.CurrentCell >= 100) {
                Game.World.CurrentZone++;
                Game.World.CurrentCell = 1;
            }
        spawnEncounter();
        }

    } while (nextActor != null)
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

function startWorldZone(){} // TODO: more complicated zone spawn

function spawnMap(){}

function spawnEncounter(){
    
    // TODO: make it more fancy, for now just spawn goblins
    Game.Enemies.push(new Creature("Goblin"));
    
}

// ----------------------------------------------------------------------------

function StoryControl(){

    switch (Game.Stats.StoryState.StoryStage) {
        case 0:
            console.log(ParseGameText(GameText.English.Story.Intro));
            Game.Stats.StoryState.StoryStage++;
            allEvents.removeEvent(
                Game.Stats.StoryState.StoryControlID);
            
            Game.Stats.StoryState.StoryControlID = 
                allEvents.registerListener(
                    Lookup.StoryTriggers[Game.Stats.StoryState.StoryStage],
                    StoryControl
                )
            break;
        case 1:
            if (Game.Resources.Scraps >= 30) {
                console.log(ParseGameText(GameText.English.Story.MoreThanScrap));
                allEvents.removeEvent(
                    Game.Stats.StoryState.StoryControlID);
                
                Game.Stats.StoryState.StoryStage++;
                // no more Story bits just yet

            }
            
            break;
        default:
            // nothing to do here
    }
}

window.onload = function() {
    
    // TODO: Load game and set visual state
        
    // Story Controller
    Game.Stats.StoryState.StoryControlID = 
        allEvents.registerListener(
            "TEST_EVENT",
            StoryControl
        )
    
    // Queue up main loop 
    window.setInterval(mainLoop, Game.Settings.GameSpeed);
    // Queue autosave
    //window.setInterval(,Game.Settings.AutoSaveFrequency);

    allEvents.queueEvent("TEST_EVENT");
};