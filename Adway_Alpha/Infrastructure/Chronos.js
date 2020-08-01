"use strict";
// EventBoard class is meant to be a centralized system for handling
// all events such as combat, resource gain, and  other triggers.
class EventBoard {

    static instance;

    constructor(){
        //EventBoard is a singleton
        // Just return the instance if a dum dum like me tries to make a second

        if (this.instance) {
            return this.instance;
        } else {
            this.instance = this;

            // All event types that will be supported should be included here
            // Should throw error for unsupported event type
            this.EventTypes = [
                "TEST_EVENT", //Any time I want to just testing things or this system
                "ZONE_CLEAR", //Zone is finished
                "CELL_CLEAR", //Cell is finished
                "ENEMY_DEFEATED", //Enemy is defeated
                "CURRENCY_GAINED", //Might split into others
                "ADDON_EVENT", //In case third party wants to hook into this
            ];
            
            this.init();
        }

    }

    init(){
        // Map of event types, will contain callbacks for said events
        // Before each individual board is a list of arguments it expects
        this.RootBoard = new Map();

        this.EventTypes.forEach(EType => {
            this.RootBoard.set(EType, []);
        });

        this.nextGUID = 0;
    }

    GenerateEventGUID() {return ++(this.nextGUID);}

    // This needs to be redesigned to be serializable
    // The goal is to save a way for the events to be reconstructed in their current state
    registerListener(listenFor, eventID, owner, guidOverride = -1){

        var eventCopy = {
            eventDBID: eventID,
            eventOwner: owner,
            cbGUID: (guidOverride > 0) ? guidOverride : this.GenerateEventGUID()
        }

        this.RootBoard.get(listenFor).push(eventCopy);

        console.log("Registered for " + listenFor + " events.");

        return eventCopy.cbGUID;
    }

    // Event happens, go and call each function
    queueEvent(eventType, ...restArgs){
        if (!(this.EventTypes.includes(eventType))) {
            // TODO: Error throwing
            console.log("Event type not supported: " + eventType);
            return;
        }
        this.RootBoard.get(eventType).forEach(element => {
            GameDB.Events[element.eventDBID].eventCB(...restArgs);
        });
    }

    removeEvent(removeGUID) {
        let searchIndex = 0;
        this.EventTypes.forEach(EType => {
            searchIndex = 0;
            this.RootBoard.get(EType).forEach(element => {
                if (element.cbGUID === removeGUID) {
                    this.RootBoard.get(EType).splice(searchIndex,1);
                    console.log("Event number " + removeGUID + " removed.");
                    return;
                }
                searchIndex++;
            });
        });
    }

    clearAllEvents() {
        //this.RootBoard.clear();

        this.init();
    }

    // Grab each list, turn it into an object without functions basically
    serializeEvents(){

        // TODO: This is broken, fix
        var SerializedEvents = [];

        this.EventTypes.forEach( EType => {
            //SerializedEvents.set(EType, []);

            this.RootBoard.get(EType).forEach( eventObj => {
                var seralizedEvent = {
                    eventType: EType,
                    eventDBID: eventObj.eventDBID,
                    eventGUID: eventObj.cbGUID,
                    eventOwner: eventObj.eventOwner
                }
                SerializedEvents.push(seralizedEvent);
            });
        });

        let eventFinal = {
            SEvents: SerializedEvents,
            guidCount: this.nextGUID
        }

        return eventFinal;

    };

    deserializeEvents(serializedObj){

        // Clear the board and bring in the old
        this.clearAllEvents();
        this.init();

        this.nextGUID = serializedObj.guidCount;

        for (const oldEvent of serializedObj.SEvents) {
            this.registerListener(oldEvent.eventType, oldEvent.eventDBID, oldEvent.eventOwner, oldEvent.eventGUID);
        }

    };

}

// Chronometer is an all purpose time keeping class. 

class Chronometer {

    static instance;

    constructor() {

        if (this.instance) {
            return instance;
        } else {
            this.instance = this;

            this.timerList = [];

            this.nextTimerID = 0;
        }
    }

    SortTimers() {
        // Insertion sort, should be the fastest for already mostly sorted lists
        // Move longest backwards, should also be most efficient for timers with
        // multiple ticks getting put in place more quickly
        for (var outer = this.timerList.length; outer > 1; outer--) {
            var isSorted = true;
            for (var inner = 0; inner < outer - 1; inner++) {
                if (this.timerList[inner].nextTick > this.timerList[inner + 1].nextTick) {
                    [this.timerList[inner], this.timerList[inner + 1]] =
                        [this.timerList[inner + 1], this.timerList[inner]];

                    isSorted = false;
                }
            }

            if (isSorted) return; // Exit early if no swaps were needed
        }
    }

    // This is the Chronometer global tick
    // this will go through all timers on the list and tick them down
    // TODO: Granularity and state changes
    Tick(elapsedTime) {

        Game.statTracking.RunTimeSpent += elapsedTime;
        Game.statTracking.TotalTimeSpent += elapsedTime;

        // Don't need to do anything if there are no timers
        if (this.timerList.length == 0) return;

        // Check for pauses:
        this.timerList.forEach( timer => {
            if (GameDB.Auras[timer.spellID].flags & Aura.AuraFlags.PauseOnCombat) {
                if (Game.GameState == Lookup.GameStrings.GameStates.Rest) {
                    timer.nextTick += elapsedTime;
                    timer.endTime += elapsedTime;
                }
            }
        })
        
        // sort timers
        // -since list should remain mostly sorted, going with insertion sort
        this.SortTimers();

        // tock timers in order
        while (this.timerList[0].nextTick < Game.statTracking.TotalTimeSpent) {

            // Placeholder ref for cleaner code
            var currentTimer = this.timerList[0];

            // Aura's tick function, will need to check for partial effects eventually
            if (GameDB.Auras[currentTimer.spellID].onTick) GameDB.Auras[currentTimer.spellID].onTick();

            // After timer has ticked, either find out the next time to tick or if it should go away
            // TODO: Hasted ticks

            // Check if we've reached the end of the timer, this is checked by checking:
            //  If we're past the end time AND the 'next tick' value is the same as the end time.
            if (currentTimer.endTime < Game.statTracking.TotalTimeSpent && currentTimer.endTime == currentTimer.nextTick) {
                if (GameDB.Auras[currentTimer.spellID].onFade) GameDB.Auras[currentTimer.spellID].onFade();
                console.log("Aura Fading: " + currentTimer.spellID);
                this.timerList.splice(0,1);
                if (this.timerList.length == 0) {
                    return;
                }
                // TODO: clear it from the owner's aura list as well to make sure it gets cleaned up
            // Check if the next tick would go over the final end time. Set it to be the same and set up partial tick info
            } else if (currentTimer.nextTick + GameDB.Auras[currentTimer.spellID].tickFrequency >= currentTimer.endTime) {
                currentTimer.nextTick = currentTimer.endTime;
                if (GameDB.Auras[currentTimer.spellID].flags & Aura.AuraFlags.PartialFinalTick) {
                    // set info important to partial ticks
                }
            // This should leave only the case where we get another full tick
            } else {
                currentTimer.nextTick += GameDB.Auras[currentTimer.spellID].tickFrequency;
            }

            // Sort to make sure fresh ticks go to the back
            this.SortTimers();
        }

    }

    CreateTimer(timerDBID, timerOwner, guidOverride = -1){

        var newTimer = {
            Owner: timerOwner, // Does nothing for now, included for future support for actual 'auras'
            spellID: timerDBID,
            timerID: (guidOverride > 0) ? guidOverride : this.GenerateTimerID(),

            startTime: Game.statTracking.TotalTimeSpent,
            endTime: Game.statTracking.TotalTimeSpent + GameDB.Auras[timerDBID].maxDuration *
                ((GameDB.Auras[timerDBID].AuraFlags & Aura.AuraFlags.DurationHasted) ? 1 / timerOwner.Speed : 1), // check for hasted duration
            nextTick: Game.statTracking.TotalTimeSpent + GameDB.Auras[timerDBID].tickFrequency *
                ((GameDB.Auras[timerDBID].AuraFlags & Aura.AuraFlags.TickHasted) ? 1 / timerOwner.Speed : 1),

        }

        this.timerList.push(newTimer);
        this.SortTimers();

        return newTimer.timerID;
    }

    
    RemoveTimer(removeID) {

        for (var i = 0; i < this.timerList.length; i++) {
            if (this.timerList[i].timerID == removeID) {
                this.timerList.splice(i,1);
                return;
            }
        }

    }

    GenerateTimerID(){
        return ++(this.nextTimerID);
    }

    ClearTimers(){
        this.timerList = []; // TODO: may need to remove other refs
    }

    SerializeTimers(){
        var serialized = {
            Timers: this.timerList,
            IDCounter: this.nextTimerID
        }
        return serialized;
    };

    DeserializeTimers(Data){
        this.nextTimerID = Data.IDCounter;
        Data.Timers.forEach( timer => {

            // Essentially redo the create-timer but just copy fields
            var newTimer = {
                Owner: timer.Owner, // Does nothing for now, included for future support for actual 'auras'
                spellID: timer.spellID,
                timerID: timer.timerID,
    
                startTime: timer.startTime,
                endTime: timer.endTime,
                nextTick: timer.nextTick
            }

            this.timerList.push(newTimer);
        })

        this.SortTimers();
    };
}

const allEvents = new EventBoard();
const Chronos = new Chronometer();

//export {EventBoard, Chronometer};