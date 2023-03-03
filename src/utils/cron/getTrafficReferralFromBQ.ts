import { isIpAddress } from "./../index";
import { getBigQueryData } from "..";
import ReferralModel from "../../mongo/referral.mongo";

const getTrafficReferralSource = async () => {
    try {
        const startDate = "20220801";

        let endDate: any = new Date();
        const dd = String(endDate.getDate()).padStart(2, "0");
        const mm = String(endDate.getMonth() + 1).padStart(2, "0");
        const yyyy = endDate.getFullYear();
        endDate = yyyy + mm + dd;
        const query =
            "SELECT DISTINCT traffic_source.source FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
            startDate +
            "' AND '" +
            endDate +
            "' AND traffic_source.name = '(referral)'";
        let data = await getBigQueryData(query);
        await ReferralModel.deleteMany({});
        await ReferralModel.insertMany(
            data
                .filter((d: any) => {
                    let result = true;
                    if (isIpAddress(d.source)) {
                        result = false;
                    }
                    [
                        "localhost",
                        "vercel",
                        "hero",
                        "zalo",
                        "telegram",
                        "coccoc",
                        "skype",
                    ].forEach((s) => {
                        if (d.source.includes(s)) {
                            result = false;
                        }
                    });
                    return result;
                })
                .map((d: any) => ({ value: d.source }))
        );
    } catch (error) {
        console.log("error", error);
    }
};

export default getTrafficReferralSource;
