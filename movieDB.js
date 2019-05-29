import {movieListing} from "./movieListing.js"

var movies = [
    new movieListing(true,"Field of Dreams",4.5), 
    new movieListing(true, "Howl's Moving Castle", 5),
    new movieListing(false, "Kimi No Wa",11), 
    new movieListing(true, "Game of Thrones", 2)];

function mainFunc()
{
    movies.forEach(element => {
        element.Log();
    });
}


window.setTimeout(mainFunc,500);