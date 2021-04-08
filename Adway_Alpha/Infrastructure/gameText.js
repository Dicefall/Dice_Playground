// Any player facing text should be put in here.
// Everything from achievement text to story text to just regular UI text.

// To add new language support, copy the base english in it's entirety
// Translate only what is in the quotes, comments will include information
// such as which dynamic values belong to what. Contact me and 

// Places tagged with #LocalizeMe means you can have fun with it
// This is usually reserved for places where I make some puns and especially
// in achievement names.
"use strict";

var GameText = {
    // Any User facing text
    English: {
        Story: {
            ChapterTitles: [
                "A Day Without A Yesterday",
            ],
            ChapterOne: [],
        },

        UI: {
            // These should be obvious.
            Gold: "You have {0} Gold.\n",
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
            // TODO: Change this from old scrap names to gold ones
            Gold: {
                Names: [
                    'That\'s a real big piece of Scrap',
                    'Scraptastic',
                    'What the Scrap?', 
                    'Oh yeah. That\'s the good Scrap',
                    'Holy Scrap'
                ],
                Criteria: 'Acquire a total of {0} Gold',
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
                'Testers, ',
                'Obligatory "And you the player!"',
            ],
            Inspiration: [
                "Other media that has inspired me greatly in the creation of this game. ",
                "I'm a giant fan of the SCP foundation in general and in particular the Antimemetics Division: http://www.scp-wiki.net/antimemetics-division-hub",
                "Trimps, probably my favorite and the most inspiration with an amazing community: https://trimps.github.io/",
                "RWBY. It's rough in a lot of places, but I still love it. Absolutely phenomenal soundtracks.",
                "Dungeons and Dragons, played it a lot while I was younger and unfortunately haven't recently. ",

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
            "Wooded Path",
            "Forest Path",
            "Heart of the Forest", // 5
            "Edge of the Forest",
            "The Foothills", // Basecamp here something
            "Cliffs of Mnemosyne",
            "Ancient Mines",
            "Haunted Drift", // 10
            "Abandoned Mineshaft", // Small zone to show off different sized zones
            "Aboleth Lair",
            "Forgotten Mural", // Another small zone with some lore
            "Summit Path",
            "Mnemosyne Summit", // 15
            "The Inexorable March of Time"
        ],

        Attributes: {
            Strength: {
                Name: "Strength",
                Flavour: "You point, I punch. Makes you stronger.", // Go for the eyes boo, the eyes!
                Effect: "Increases your Attack by 5% per level."
            },
            Constitution: {
                Name: "Constitution",
                Flavour: "Nothing but a flesh wound. Makes you tougher.",
                Effect: "Increases your Health by 5% per level."
            },
            Perception: {
                Name: "Perception",
                Flavour: "Ooooh Shiny. Makes you better at finding the good stuff.",
                Effect: "Increases the amount of resources you loot from enemies by 5% per level. \n\n Resources effected: [Gold]",
            },
            Wisdom: {
                Name: "Wisdom",
                Flavour: "Wise beyond your years, mostly.",
                Effect: "Increases the amount of XP you get from all sources by 5% per level.",
            },

            // 0 is the current value gained from that specific attribute
            Current: "Currently gives you {0}",
            // Eventually extra class effects will come in, will need to add some here
            //Additional: "And additional effects based on your current Class."
        },

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
            BanditKing: 'Bandit King',

            SpacetimeCurvature: 'SpacetimeCurvature',
        },

        Upgrades: {
            CritTierUp: {
                Name: 'Precision', // Critical Strike tier up
                Desc: "You know where their weak spots are now. Aim for them. Increases your Critical Strike Tier"
            },
            CritDmgTierUp: {
                Name: 'Brutality', // Crit dmg tier up in the future
                Desc: "Don't hold back, they've already set themselves against you. Show them how brutal you can be. Increases your Critical Damage Tier"
            },
            AttackTierUp: {
                Name: 'Momentum', // Regular old attack tier up
                Desc: 'Hit them hard, and hit them fast. They wont go down easy. Increases your Attack Tier'
            },
            HealthTierUp: {
                Name: 'Fortitude', // Regular old HP
                Desc: "Stand firm, they are nothing but the wind against a mountain. Increases your Health Tier"
            },
            RegenTierUp: {
                Name: 'Persistance', // Health regen, something about coming back from gettin' beat down
                Desc: "You will get knocked down. You will get back up again. Nothing is going to keep you down. Increases your Health Regen Tier"
            },
            HasteTierUp: {
                Name: 'Instinct', // Haste, something about going faster I guess?
                Desc: "React before they act. Know what they will do before you know what you will do. Increases your Haste Tier"
            },
            LevelUp: {
                Name: 'Growth', // Name of the upgrade used for levelling up.
                Desc: "Become more than what you were before. Become more than them. Increases your Level"
            }
        },

    },
    // End of language specific

    // Moving as much of this to unicode as possible,
    Icons: {
        Skull: '☠', //'<i class="fas fa-skull"></i>',
        Infinity: '∞',
        HeartBeat: '<i class="fas fa-heartbeat"></i>',
        LevelUp: '🡹', //'<i class="fas fa-level-up-alt"></i>',
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