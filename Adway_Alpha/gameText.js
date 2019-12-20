// Actual text goes in here
// Set up for other languages

// Via use of the eval function we can save string literals
// to be evaluated later.

// To add new language support, copy the base english in it's entirety
// Translate only what is in the quotes, comments will include information
// such as which dynamic values belong to what.

class JobDescription {
    constructor(flavourText, abilityText, masteryText, requirementText) {
        this.JobFlavour = flavourText;
        this.Abilities = abilityText;
        this.Mastery = masteryText;
        this.Requirements = requirementText;
    }
}

var GameText = {
    English: {
        Story: {
            // Going for the theme of every chapter follows "A Day Without"
            ChapterTitles: [
                "A Yesterday",
            ],
            Intro: 'You find yourself alone in a field surrounded by the aftermath of a battle. You remember none of it. The world is frightening, perhaps you should pick up some scraps. You never know what you might find.',
            // This is awful, rewrite
            FoundMeryl: "You finally find someone else that's alive on this battlefield. She's looking around and staring intently into the air. She looks in different places constantly but always with an intense focus. She sees you and begins to walk over to you.",
            MerylFindsYou: "As she gets close to you she begins to talk. 'That's a first, I didn't think anyone else would have made it this time. You probably don't remember anything from before and strangely, neither do I. Well I do but you see, I don't. No matter, I'm looking for some others that should be out here too.' She looks at the heaps of scrap you're carring. 'Good idea, lets pick up some more of those while we go looking. Oh and by the way, I'm Meryl'",
            IntroCombat: "You run into some hostile creatures while you and Meryl go searching for her friends. She really knows how to handle herself in a fight. You on the other hand seem to have trouble with the 'point end goes this way' part.",

        },
        
        // Game text for Job related information. Job descriptions, requirements
        // ability unlock descriptions, and mastery descriptions
        JobDescriptions: {
            Wanderer: new JobDescription(
                "One who wanders, unsure of why, or what they are looking for. Generalist, good place to start.",
                [],
                "",
                "None"
            ),
        },

        UI: {
            // These should be obvious.
            Scraps: "You have {0} scraps.\n",
            Metal: "You have {0} metal plates.\n",
            Leather: "You have {0} leather hides.\n",
            Cloth: "You have {0} strips of cloth.\n",
            XP: "You have {0} XP.\n",
        },

        // When I actually set up data collection for stuff
        // I should have a disclaimer for it
        DataCollectionDisclaimer: 'Adway does not collect any data about any players or their game state. For now.',

        SaveReset: "Are you sure you want to delete your save? This is a permenant reset and your save will not be recoverable.",

        AchievementText: {
            // 0 is name, 1 is criteria/description
            Recieved: "You have earned the achievement: {0} - {1}",
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
        },
        Special: {
            Thanks: [
                'List of special thanks to people here',
                'Ghostfrog for a lot of math help'
            ]
        },
    },

    Icons: {
        Skull: '<i class="fas fa-skull"></i>',
        Infinity: '<i class="fas fa-infinity"></i>',
        HeartBeat: '<i class="fas fa-heartbeat"></i>',
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