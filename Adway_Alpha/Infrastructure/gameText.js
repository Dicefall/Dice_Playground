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
            ChapterTitles: [
                "A Day Without A Yesterday",
            ],
            ChapterOne: [
            "You find yourself alone in a field surrounded by the aftermath of a battle. You remember none of it. There are a few green skinned monsters walking around cleaning up what's left of the fighting. One spots you.",
            "Finally, you spot someone who isn't trying to kill you. She walks over and introduces herself as Meryl. 'Where are the others? The last time I...Of course you don't remember. You probably don't even remember me.' She sighs loudly. 'Alright, lets get moving. You wont believe me unless you see it, you never do.' She turns around and motions for you to follow her.",
            "Meryl doesn't look all there, you know, in the head. She's constantly looking off into space focusing on something very far away. She's caught you staring a few times but it doesn't seem like that's anything new for her.",
            "In the brief moments between fighting one greenskin and the next, Meryl tells you where she's leading you. 'First place to go is back to Forest Glen, to get prepared for the climb. After that it's climbing Mount <<<fancy mountain name>>>. It'll all be clear then.' You don't know why but you believe her. If nothing else it feels like she's on your team. She hasn't tried to kill you yet so what have you got to lose.",
            "Was that a dragon?! A dragon?! This shouldn't surprise you, but it does. You just fought a dragon. I wonder if there will be more of them",
            // Zone change over
            "You find a secluded thicket to hide in for the night. Meryl found it for you, or led you to it. She seemed to know where she was going but was also surprised when she stumbled upon it. She's a weird one.",
            "Before going to sleep Meryl tells you a bit more about what's going on. 'I don't want you to be startled when we get to Forest Glen. People will know you, but you wont know them. You've just forgotten. It happens every time and it's no need to be startled. Maybe the others will have gotten there and we can get back to the plan, which of course you also can't remember.' She rolls her eyes and sighs again. She does that a lot.",
            "It was a good night's sleep. You're ready to keep going. Meryl is surprised when she sees you in the morning and looks around as if then expecting more people. 'Just you?' You nod and shrug back. 'You never were much of a talker.' You're not sure how to respond to that, so you just finish packing up and start the trip to Forest Glen",
            "Meryl remains quiet the rest of the trip. You don't mind so much though since you're mostly busy trying to stay alive.",
            "Wait, that's neither a forest nor a glen. You ask Meryl why it's called Forest Glen when it's clearly neither of those things. 'It was once. We've done this so many times now, it's outgrown it's name. No reason to change it though, has a nice ring to it.",
            // Reach town, some explaination, and move on
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
                'Grabz for a lot of JS help early on',
                'SpectralFlame, help with various topics',
                'Zek, actually making me spend more time working on it',
                'GreenSatellite, answering questions about how he did things so I knew how not to do it',
                'Testers?',
                'Obligatory "And you the player!"',
            ],
            Inspiration: [
                "Other media that has inspired me greatly in the creation of this game. ",
                "I'm a giant fan of the SCP foundation in general and in particular the Antimemetics Division: http://www.scp-wiki.net/antimemetics-division-hub",
                "Trimps, probably my favorite and the most inspiration with an amazing community: https://trimps.github.io/",

                "Countless other media I consumed while making this, it's hard to point to everything."
            ]
        },

        StatNames: {
            Crit: "Critical Strike",
            CritDmg: "Critical Damage",
            Haste: "Haste",
            Attack: "Attack",
            Health: "Health",
            Regen: "Health Regen"
        },

        ZoneNames: [
            "Forgotten Battlefield",
            "Battlefield outskirts",
            "The Inexorable March of Time"
        ],

        CreatureNames: {
            Goblin: 'Goblin',
            Kobold: 'Kobold',
            Dragon: 'Dragon',
            Ogre: 'Ogre',
            Orc: 'Orc',
            WarDog: 'War Dog',
            Bear: 'Grizzly Bear',
            Wolf: 'Wolf',
            Deer: 'Deer',
            Boar: 'Boar',
            Snake: 'Snake',
            Bandit: 'Bandit',
            Treant: 'Treant',
            Pixie: 'Pixie',

            SpacetimeCurvature: 'SpacetimeCurvature',
        },

        Upgrades: {
            CritTierUp: {
                Name: 'Precision', // Critical Strike tier up
                Desc: "You know where their weak spots are now. Aim for them. Increases your Critical Strike Tier by 1"
            },
            CritDmgTierUp: {
                Name: 'Brutality', // Not used but will be for crit dmg tier up in the future
                Desc: "Don't hold back, they've already set themselves against you. Show them how brutal you can be. Increases your Critical Damage Tier by 1"
            },
            AttackTierUp: {
                Name: 'Momentum', // Regular old attack tier up
                Desc: 'Hit them hard, and hit them fast. They wont go down easy. Increases your Attack Tier by 1'
            },
            HealthTierUp: {
                Name: 'Fortitude', // Regular old HP
                Desc: "Stand firm, they are nothing but the wind against a mountain. Increases your Health Tier by 1"
            },
            RegenTierUp: {
                Name: 'Persistance', // Health regen, something about coming back from gettin' beat down
                Desc: "You will get knocked down. You will get back up again. Nothing is going to keep you down. Increases your Health Regen Tier by 1"
            },
            HasteTierUp: {
                Name: 'Instinct', // Haste, something about going faster I guess?
                Desc: "React before they act. Know what they will do before you know what you will do. Increases your Haste Tier by 1"
            }
        },

    },

    // Moving as much of this to unicode as possible,
    Icons: {
        Skull: '<i class="fas fa-skull"></i>',
        Infinity: '∞',
        HeartBeat: '<i class="fas fa-heartbeat"></i>',
        LevelUp: '<i class="fas fa-level-up-alt"></i>',
    },
    
}

// TODO: Rewrite this when achievement structure changes away from classes
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