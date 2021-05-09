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
            
            this.init();
        }

    }

    init(){
        // Map of event types, will contain callbacks for said events
        // Before each individual board is a list of arguments it expects
        this.RootBoard = new Map();

        // See GameDB.Constants.EventTypes for list of event types
        GameDB.Constants.EventTypes.forEach(EType => {
            this.RootBoard.set(EType, []);
        });

        this.nextGUID = 0;
    }

    GenerateEventGUID() {return ++(this.nextGUID);}

    // Add a listener to the system, guidOverride should not be used
    //  Except for deserialization
    registerListener(listenFor, eventID, owner, guidOverride = -1){

        var eventCopy = {
            eventDBID: eventID,
            eventOwner: owner, // Should be soft ref
            cbGUID: (guidOverride > 0) ? guidOverride : this.GenerateEventGUID()
        }

        this.RootBoard.get(listenFor).push(eventCopy);

        console.log("Registered for " + listenFor + " events.");

        return eventCopy.cbGUID;
    }

    // Event happens, go and call each function
    queueEvent(eventType, ...restArgs){
        if (!(GameDB.Constants.EventTypes.includes(eventType))) {
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
        GameDB.Constants.EventTypes.forEach(EType => {
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

        GameDB.Constants.EventTypes.forEach( EType => {
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
    static TimePrecision = {
        Milliseconds: 1,
        Seconds: 2,
        Minutes: 3,
        Hours: 4,
        Days: 5,
        Years: 6,
    };

    constructor() {

        if (this.instance) {
            return instance;
        } else {
            this.instance = this;

            this.timerList = [];

            this.nextTimerID = 0;

            this.Time = 0;
            this.TimeBank = 0;
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
    // TODO: Clashing timers?
    // TODO: Add in UI call for extremely long timers
    //          Thinking just add an aura during tick that updates every so often
    Tick(elapsedTime) {

        // Granularity Re-write
        if (this.timerList.length == 0) {
            this.Time += elapsedTime;
            this.TimeBank -= elapsedTime;    
            return;
        }

        // Get when the tick will end
        var tickEnd = this.Time + elapsedTime;

        // Relying on timers being in order
        this.SortTimers();

        // Main tick logic
        //  Find next thing that's going to tick
        //      Include checking for paused/stalled out/whatever
        //      Next thing can include the tick end
        //  Advance time to that tick
        //      Include shifting end time of paused timers here
        //  Do the tick
        //  Resort timers
        //  Repeat until no more timers

        do {
            //  Find next thing that's going to tick
            //      Include checking for paused/stalled out/whatever
            //      Next thing can include the tick end
            var microTick;
            var nextTicker = this.GetNextTicker();
            
            // Cover no tickables case in case everything is paused but might be in the right window
            //  Check first to avoid -1 index issues
            if (nextTicker == -1) {
                microTick = tickEnd - this.Time;
            } else if (this.timerList[nextTicker].nextTick >= tickEnd) {
                microTick = tickEnd - this.Time;
            } else {
                microTick = this.timerList[nextTicker].nextTick - this.Time;
            }

            //  Advance time to that tick
            //      Include shifting end time of paused timers here
            this.Time += microTick;
            this.TimeBank -= microTick;

            // Check for pauses:
            this.timerList.forEach( timer => {
                if (this.isTimerPaused(timer)) {
                    timer.nextTick += microTick;
                    timer.endTime += microTick;
                }
            });

            // Time to exit?
            //      timer tick == this end, shouldn't matter because of math
            if (this.Time == tickEnd) break;

            // Do the ticking
            var currentTimer = this.timerList[nextTicker];
            if (GameDB.Auras[currentTimer.spellID].onTick) GameDB.Auras[currentTimer.spellID].onTick.bind(currentTimer)();

            //  Check for if this tick should have been the last one
            //      If it's last one, clean it up and continue
            //      else move tick to the next one
            if (currentTimer.nextTick >= currentTimer.endTime) {
                if (GameDB.Auras[currentTimer.spellID].onFade) GameDB.Auras[currentTimer.spellID].onFade.bind(currentTimer)();
                this.timerList.splice(0,1);
                if (this.timerList.length == 0) {
                    continue;
                }
            } else {
                // Check for hasted tick rate, multiply by tick frequency
                currentTimer.nextTick += currentTimer.tickFrequency * 
                    (GameDB.Auras[currentTimer.spellID].flags & Aura.AuraFlags.TickHasted ? 
                        1 / currentTimer.Owner.Speed : // TODO, fix owner for soft ref
                        1
                    );
            }

            //  Check for next tick > end time
            //      If yes, clamp
            if (currentTimer.nextTick >= currentTimer.endTime) {
                currentTimer.nextTick = currentTimer.endTime;
                // any partial tick stuff should go here
            }

            // Relying on timers being in order
            this.SortTimers();
            
        // Exit condition just for safety, earlier break condition *should* cover cases
        } while(this.Time < tickEnd);

    }

    CreateTimer(timerDBID, timerOwner, guidOverride = -1){

        var newTimer = {
            Owner: timerOwner, // TODO: Should be soft ref
            spellID: timerDBID,
            timerID: (guidOverride > 0) ? guidOverride : this.GenerateTimerID(),
            isPaused: false,

            startTime: this.Time
        }

        GameDB.Auras[newTimer.spellID].Build.bind(newTimer)();

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

    PauseTimer(pauseID, pauseState = true) {
        for (var i = 0; i < this.timerList.length; i++) {
            if (this.timerList[i].timerID == pauseID) {
                this.timerList[i].isPaused = pauseState;
                return;
            }
        }
    }

    SerializeTimers(){

        // TODO: Custom fields
        var serialized = {
            Timers: this.timerList,
            IDCounter: this.nextTimerID,
            Time: this.Time,
            TimeBank: this.TimeBank,
        }
        
        return serialized;
    };

    DeserializeTimers(Data){
        this.ClearTimers();
        this.nextTimerID = Data.IDCounter;
        this.Time = Data.Time;
        this.TimeBank = Data.TimeBank;

        Data.Timers.forEach( timer => {

            // Essentially redo the create-timer but just copy fields
            // TODO: generalize for custom fields

            var newTimer = Object.assign({}, timer);
            if (newTimer.endTime == null) {newTimer.endTime = Infinity;}

            this.timerList.push(newTimer);
        });

        this.SortTimers();
    };

    // For cleanliness, moving this big chunk down here.
    // Returns index of the next non-paused, non-suppressed, etc, timer
    //  -1 for no valid timers
    GetNextTicker() {

        for (var i = 0; i < this.timerList.length; i++) {
            if (!this.isTimerPaused(this.timerList[i])) {
                return i;
            }
        }

        return -1;
    }

    // I've been re-using this a lot, lets make it consolidated
    isTimerPaused(timerRef) {

        if (timerRef.isPaused) return true;

        if (GameDB.Auras[timerRef.spellID].Flags & Aura.AuraFlags.PauseOnCombat
            && Game.CombatState == GameDB.Constants.States.Combat.Paused) {
                return true;
            }

        
        return false;
    }
}

const allEvents = new EventBoard();
const Chronos = new Chronometer();

//export {EventBoard, Chronometer};