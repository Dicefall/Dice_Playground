// Actual text goes in here
// Set up for other languages

// Via use of the eval function we can save string literals
// to be evaluated later.

// To add new language support, copy the base english in it's entirety
// Translate what is in the quotes, comments will include information
// such as which dynamic values belong to what.

var GameText = {
    English: {
        Story: {
            Intro: 'You find yourself alone in a field surrounded by the ' +
                'aftermath of a battle. You remember none of it. The world ' +
                'is frightening, perhaps you should pick up some scraps. You ' +
                'never know what you might find.',
            FoundMeryl: "TODO: write the next tutorial stage"
        },
        UI: {
            // Scraps: 0
            Scraps: "You have {0} scraps.",

            // When I actually set up data collection for stuff
            // I should have a disclaimer for it
            DataCollectionDisclaimer: '',
        },
        Special: {
            Thanks: [
                'List of special thanks to people here'
            ]
        }
    },
}

function ParseGameText(unParsed, ...restArgs) {

    // Example replacement:
    //  Input: ParseGameText("You have {0} scraps.", "14")
    //  Output: You have 14 scraps.

    // Grab anything with the {#} format like {0} or {4} or {23}
    var regEx = /{(\d+)}/gi;

    // Replace what's captured with whatever is in restArgs
    return unParsed.replace(regEx, function(match, matchNumber) {
        return restArgs[matchNumber];
    });
}