class Achievement {
    constructor(listenerType, handlerFunc) {

        this.handlerFunc = handlerFunc;
        this.HandlerID = allEvents.registerListener(listenerType, handlerFunc);
    }
}

class TieredAchievement extends Achievement {
    constructor(rewardBreakpoints, rewardValues, handlerType, handlerFunc) {
        super(handlerType, handlerFunc);

        this.TierBreakpoints = rewardBreakpoints;
        this.BreakpointEarned = 0;

        this.TierValues = rewardValues;
    }
}

var AchievementData = {

    CalculateTotal: function () {
        // go through each and total things up
        let newTotal = 0;

        // Scraps
        for (var i = 0; i < Game.Achievements['Scraps']; i++) {
            newTotal += AchievementData.Scraps.TierValues[i];
        }

        // Metal
        for (var i = 0; i < Game.Achievements['Metal']; i++) {
            newTotal += AchievementData.Metal.TierValues[i];
        }

        Game.Achievements.TotalScore = newTotal;
    },

    Scraps: new TieredAchievement(
        [10, 50, 100, 1000, 10000],
        [1, 1, 2, 2, 5],
        "SCRAPS_RECIEVED",
        function () {

            let nextTier = AchievementData.Scraps.TierBreakpoints[Game.Achievements['Scraps']];

            if (Game.Resources.Scraps >= nextTier) {
                console.log(ParseGameText("Achievement recieved: Acquire {0} Scraps!", nextTier));

                Game.Achievements['Scraps']++;
                AchievementData.CalculateTotal();
            }

            if (Game.Achievements['Scraps'] >= AchievementData.Scraps.TierBreakpoints.length) {
                allEvents.removeEvent(base.HandlerID);
            }
        }
    ),

    Metal: new TieredAchievement(
        [10, 25, 50, 100, 1000],
        [1, 1, 2, 2, 5],
        "METAL_RECIEVED",
        function () {

            let nextTier = AchievementData.Metal.TierBreakpoints[Game.Achievements['Metal']];

            if (Game.Resources.Metal >= nextTier) {
                console.log(ParseGameText("Achievement recieved: Acquire {0} Metal!", nextTier));

                Game.Achievements['Metal']++;
                AchievementData.CalculateTotal();
            }

            if (Game.Achievements['Metal'] >= AchievementData.Metal.TierBreakpoints.length) {
                allEvents.removeEvent(base.HandlerID);
            }
        }
    ),
}