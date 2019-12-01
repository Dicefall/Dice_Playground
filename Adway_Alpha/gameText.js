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
            MoreThanScrap: "You can't really do much with this scrap, maybe " +
                "you can separate the components of the scrap into more " +
                "workable pieces. Looks like there's some cloth, leather, " +
                "and metal we can get out of the scrap.",
            FoundMeryl: "TODO: write the next tutorial stage"
        },
        UI: {
            Scraps: "You have {0} scraps.\n",
            Metal: "You have {0} metal plates.\n",
            Leather: "You have {0} leather hides.\n",
            Cloth: "You have {0} strips of cloth.\n",

            // When I actually set up data collection for stuff
            // I should have a disclaimer for it
            DataCollectionDisclaimer: '',
        },
        Special: {
            Thanks: [
                'List of special thanks to people here'
            ]
        },
        AchievementText: {
            Scraps: {
                Names: [
                    'What the Scrap?', 
                    'That\'s the good Scrap',
                    'Scraptastic',
                    'Scraptacular',
                    'That\'s a real big piece of Scrap'
                ],
                Criteria: 'Acquire a total of {0} scraps',
            },
            Metal: {
                Names: [
                    'Metalurgy', 
                    'That\'s the good Scrap',
                    'Scraptastic',
                    'Scraptacular',
                    'That\'s a real big piece of Scrap'
                ],
                Criteria: 'Acquire a total of {0} Metal',
            }
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