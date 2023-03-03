var cron = require("node-cron");
import getTrafficReferralSource from "./getTrafficReferralFromBQ";

export const onStartCronJob = () => {
    cron.schedule("0 0 * * 7", async function () {
        // cron.schedule("1 * * * * *", async function () {
        await getTrafficReferralSource();
    }),
        {
            timezone: "Asia/Ho_Chi_Minh",
        };
};
