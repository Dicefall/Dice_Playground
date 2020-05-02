// EventBoard class is meant to be a centralized system for handling
// all events such as combat, resource gain, and  other triggers.
class EventBoard {

    constructor(){
        //EventBoard is a singleton
        if (typeof this.instance == "undefined"){
            this.instance = this;

            this.EventTypes = [
                "TEST_EVENT",
                "SCRAPS_RECIEVED",
                "ADDON_EVENT", // Maybe makes it easy for script devs to hook in
                "GAME_TICK",
                "ZONE_CLEAR",
                "CELL_CLEAR",
                "ENEMY_DEFEATED",
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

    // Add function to the appropriate board
    registerListener(listenFor, EventCallback){
        var toRegister = {
            eventCB: EventCallback,
            cbGUID: this.GenerateEventGUID()
        }

        this.RootBoard.get(listenFor).push(toRegister);
        console.log("Registered for " + listenFor + " events.");

        return toRegister.cbGUID;
    }

    // Event happens, go and call each function
    queueEvent(eventType, ...restArgs){
        if (!(this.EventTypes.includes(eventType))) {
            console.log("Event type not supported: " + eventType);
            return;
        }
        this.RootBoard.get(eventType).forEach(element => {
            element.eventCB(...restArgs);
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
        // for (var eventName in this.EventTypes) {
        //     this.RootBoard.get(eventName).clear();
        // }
        this.init();
    }

}

// Chronometer is an all purpose time keeping class. 

class Chronometer {
    constructor() {

        this.timerList = [];

        this.nextTimerID = 0;
    }

    SortTimers() {
        let isListSorted = false;
        while (!isListSorted) {

            // Assume sorted to start
            isListSorted = true;

            // go from second element down to the last
            // check if it's smaller than the one before it
            for (var i = 1; i < this.timerList.length; i++) {
                if (this.timerList[i].remainingDuration < this.timerList[i - 1].remainingDuration) {
                    //this.timerList.splice(i - 1, 0, this.timerList.splice(i,1));
                    [this.timerList[i - 1], this.timerList[i]] = [this.timerList[i], this.timerList[i - 1]];
                    isListSorted = false;
                }
            }
        }
    }

    // Timers will have their own tick and tock functions
    // Tick(time) and Tock()

    // This is the Chronometer global tick
    // this will go through all timers on the list and tick them down
    Tick(elapsedTime) {

        // Don't need to do anything if there are no timers
        if (this.timerList.length == 0) return;
        
        // tick timers down
        this.timerList.forEach(timer => {
            timer.remainingDuration -= timer.tick(elapsedTime);
        });
        
        // sort timers
        // -since list should remain mostly sorted, going with insertion sort
        this.SortTimers();

        // tock timers in order

        // Swapping to a while loop instead

        while (this.timerList[0].remainingDuration <= 0) {
            var currentTimer = this.timerList[0];

            currentTimer.tock();

            if (currentTimer.isForever) {
                currentTimer.remainingDuration += currentTimer.initDuration;
                this.SortTimers();
            } else {
                this.RemoveTimer(currentTimer.timerID);
            }
        }

    }

    // Information needed:
    // -Function for handling tick down time
    // -What to call at the end of the timer
    // -How long the timer is
    CreateTimer(tickFunc, tockFunc, totalDuration){

        var newTimer = {
            timerID: this.GenerateTimerID(),
            remainingDuration: totalDuration,
            tick: tickFunc,
            tock: tockFunc,
            isForever: false,
            initDuration: totalDuration

        }

        // insert into list at appropriate spot

        this.timerList.push(newTimer);
        this.SortTimers();

        console.log("Timer created with id:" + newTimer.timerID);

        return newTimer.timerID;
    }

    CreateForevertimer(tickFunc, tockFunc, frequency){

        var newTimer = {
            timerID: this.GenerateTimerID(),
            remainingDuration: frequency,
            tick: tickFunc,
            tock: tockFunc,
            isForever: true,
            initDuration: frequency
        }

        this.timerList.push(newTimer);
        this.SortTimers();

        return newTimer.timerID;
    }

    // TODO: Make infinite timer

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
        this.timerList = [];
    }
}

const allEvents = new EventBoard();