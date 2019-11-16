// EventBoard class is meant to be a centralized system for handling
// all events such as combat, resource gain, and  other triggers.
class EventBoard {

    constructor(){
        //EventBoard is a singleton
        if (typeof this.instance == "undefined"){
            this.instance = this;
            this.init();
        }

    }

    static Events() {
        return this.instance;
    }

    static GenerateEventGUID() {
        if (typeof EventBoard.nextGUID == undefined) {
            EventBoard.nextGUID = 0;
        }

        return ++(EventBoard.nextGUID);
    }

    init(){
        this.EventTypes = {
            //List of all the types of events
            TEST_EVENT: "TEST_EVENT",
            SCRAPS_RECIEVED: "SCRAPS_RECIEVED",
            COMBAT_SWING: "COMBAT_SWING"
        }

        // Map of event types, will contain callbacks for said events
        this.RootBoard = new Map();
        this.RootBoard.set(this.EventTypes.TEST_EVENT,[]);
        this.RootBoard.set(this.EventTypes.COMBAT_SWING,[]);
        this.RootBoard.set(this.EventTypes.SCRAPS_RECIEVED,[]);
    }

    // Add function to the appropriate board
    registerListener(listenFor, EventCallback){
        var toRegister = {
            eventCB: EventCallback,
            cbGUID: EventBoard.GenerateEventGUID()
        }

        this.RootBoard.get(listenFor).push(toRegister);
        console.log(`${listenFor} event registered`);

        return toRegister.cbGUID;
    }

    // Event happens, go and call each function
    queueEvent(eventType, ...restArgs){
        this.RootBoard.get(eventType).forEach(element => {
            element.eventCB(restArgs);
        });
    }

    removeEvent(removeGUID) {
        let searchIndex = 0;
        for (var eventName in this.EventTypes) {
            searchIndex = 0;
            this.RootBoard.get(eventName).forEach(element => {
                if (element.cbGUID === removeGUID) {
                    this.RootBoard.get(eventName).splice(searchIndex,1);
                    console.log(`${removeGUID} event removed`);
                    return;
                }
                searchIndex++;
            });
        }
    }

}

const allEvents = new EventBoard();