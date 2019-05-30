"use strict";

var targetColor = "rgb(255, 255, 0)";
var pickers = document.querySelectorAll(".pickerButton");

function pickerClicker() {

    // Compare to target color
    if (this.style.backgroundColor == targetColor) {
        document.querySelector("#attemptResult").textContent = "Correct";

        //Set everything to right color
        for (var i = 0; i < pickers.length; i++) {
            pickers[i].style.backgroundColor = targetColor;
        }

        document.querySelector("#upperDeck").style.backgroundColor = targetColor;

    } else {
        document.querySelector("#attemptResult").textContent = "Try Again";
        this.style.backgroundColor = "#232323";
    }

    document.querySelector("#attemptResult").style.color = "black";
}

function randomColorValue() {
    // alternative color mode
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);

    return `rgb(${r}, ${g}, ${b})`;

}

function resetBoard() {

    // Set target color
    targetColor = randomColorValue();

    // Set up buttons with colors
    for (var i = 0; i < pickers.length; i++) {
        // Change color
        pickers[i].style.backgroundColor = randomColorValue();

        // add click listener
        pickers[i].addEventListener("click", pickerClicker);
    }

    // Set one to be the right one
    pickers[Math.floor(Math.random() * pickers.length)].style.backgroundColor = targetColor;

    // Display target color
    var targetColorText = document.querySelector("#colorTarget");
    targetColorText.innerText = targetColor;

    document.querySelector("#upperDeck").style.backgroundColor = "#232323";
    document.querySelector("#attemptResult").style.color = "white";
}

function main() {

    resetBoard();
    document.querySelector("#freshBoard").addEventListener("click",resetBoard);

}

//window.setTimeout(main, 1000);
main();
console.log("Main loaded");