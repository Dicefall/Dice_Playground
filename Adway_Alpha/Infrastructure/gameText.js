// Any player facing text should be put in here.
// Everything from achievement text to story text to just regular UI text.

// To add new language support, copy the base english in it's entirety
// Translate only what is in the quotes, comments will include information
// such as which dynamic values belong to what.

// Places tagged with #LocalizeMe means you can have fun with it
// This is usually reserved for places where I make some puns and especially
// in achievement names.
"use strict";

var GameText = {
    English: {
        Story: {
            // Going for the theme of every chapter follows "A Day Without",
            // Same for challenges eventually
            ChapterTitles: [
                "A Yesterday",
            ],
            ChapterOne: ['You find yourself alone in a field surrounded by the aftermath of a battle. You remember none of it. The world is frightening, perhaps you should pick up some scraps. You never know what you might find.',
            'Not final! Find meryl, she points you to town. Head back there'
            ]
        },

        UI: {
            // These should be obvious.
            Scraps: "You have {0} scraps.\n",
            Metal: "You have {0} metal plates.\n",
            Leather: "You have {0} leather hides.\n",
            Cloth: "You have {0} strips of cloth.\n",
            XP: "You have {0} XP.\n",
            Time: "You have {0} extra seconds.\n"
        },

        // When I actually set up data collection for stuff
        // I should have a disclaimer for it
        DataCollectionDisclaimer: 'Adway does not collect any data about any players or their game state. For now. This disclaimer will be updated and there will be mentions in the patch notes for any future data collection. There will always be an option to turn off data collection should it be included.',

        SaveReset: "Are you sure you want to delete your save? This is a permenant reset and your save will not be recoverable. It is recommended to create a backup of your save before you do this.",

        // 0 is name, 1 is criteria/description
        AchievementRecieved:  "You have earned the achievement: {0} - {1}",

        AchievementText: {
            Scraps: {
                //#LocalizeMe Any puns related to "scrap" I've gone with the obvious scrap/crap
                Names: [
                    'That\'s a real big piece of Scrap',
                    'Scraptastic',
                    'What the Scrap?', 
                    'Oh yeah. That\'s the good Scrap',
                    'Holy Scrap'
                ],
                Criteria: 'Acquire a total of {0} scraps',
            },
        },
        Special: {
            Thanks: [
                'List of special thanks to people here',
                'Ghostfrog for a lot of math help',
                'Grabz for endless JS help',
                'SpectralFlame, help with various topics',
                'Testers?',
                'Obligatory "And you the player!"'
            ],
            Inspiration: [
                "Other media that has inspired me greatly in the creation of this game. ",
                "I'm a giant fan of the SCP foundation in general and in particular the Antimemetics Division: http://www.scp-wiki.net/antimemetics-division-hub",
                "Trimps, probably my favorite and the most inspiration with an amazing community: https://trimps.github.io/",
            ]
        },

        StatNames: [
            "Critical Strike",
            "Haste",
            "Attack",
            "Health",
            "Health Regen"
        ]
    },

    Icons: {
        Skull: '<i class="fas fa-skull"></i>',
        Infinity: '∞',//'<i class="fas fa-infinity"></i>',
        HeartBeat: '<i class="fas fa-heartbeat"></i>',
        LevelUp: '<i class="fas fa-level-up-alt"></i>',
    },
}

function achievementRewardText(achievement) {
    var rewardText = "";

    // Check if not an achievement at all, then check which kind it is
    if (achievement instanceof TieredAchievement) {
        var tierEarned = Game.Achievements[achievement.Name];

        rewardText = ParseGameText(
            ParseGameText(
                GameText[Game.Settings.Language].AchievementRecieved,
                GameText[Game.Settings.Language].AchievementText[achievement.Name].Names[tierEarned],
                GameText[Game.Settings.Language].AchievementText[achievement.Name].Criteria
            ),
            achievement.TierBreakpoints[tierEarned]
        );
    } else if (achievement instanceof Achievement) {
        rewardText = ParseGameText(
                GameText.AchievementRecieved,
                GameText[Game.Settings.Language].AchievementText[achievement.Name].Name,
                GameText[Game.Settings.Language].AchievementText[achievement.Name].Criteria
            );
    } else {
        // Not an achievement data type
            rewardText = "Error: Not an Achievement.";
    }

    return rewardText;
}

function ParseGameText(unParsed, ...restArgs) {

    // Example replacement:
    //  Input: ParseGameText("You have {0} scraps.", "14")
    //  Output: You have 14 scraps.

    // Grab anything with the {#} format like {0} or {4} or {23}
    // TODO: store this somewhere instead of building it repeatedly
    var regEx = /{(\d+)}/gi;

    // Replace what's captured with whatever is in restArgs
    return unParsed.replace(regEx, function(match, matchNumber) {
        return restArgs[matchNumber];
    });
}