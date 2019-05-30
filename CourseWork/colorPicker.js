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
}

function randomColorValue() {
    return "rgb(" + Math.floor(Math.random() * 256) + ", " + Math.floor(Math.random() * 256) + ", " + Math.floor(Math.random() * 256) + ")";
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
}

function main() {

    resetBoard();

}

window.setTimeout(main, 1000);