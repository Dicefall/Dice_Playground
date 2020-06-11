// Building an infrastructure to display some basic sprite sheet animations in javascript

// Two options are to either use the HTML5 canvas object, or use the CSS props
// Premise is the same in either method. Single spiresheet image, change window into it each frame.

const sourceImages = [];

class AnimationEngine{
    // Could change this to individual frame height/width instead
    // frameDelays is an array of delays in MS between each frame and the next
    constructor(){

    }

    // Which canvas to draw the image on
    DrawOnCanvas(canvas, loopCount = 0){

    }

    DrawViaCSS(animElement, loopCount = 0) {

    }

}