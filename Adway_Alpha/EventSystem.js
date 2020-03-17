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

const allEvents = new EventBoard();