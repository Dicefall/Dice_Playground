export default class movieListing {
    constructor(hasSeen, title, rating){
        this.hasSeen = hasSeen;
        this.title = title;
        this.rating = rating;
    }

    //Print out
    Log(){
        console.log("You have " + (this.hasSeen ? "not " : "") + "seen the movie \"" + this.title + "\". - " + this.rating + " stars.");
    }
}