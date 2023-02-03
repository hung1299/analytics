import { Request, Response } from "express";
import {
    getResultByEvent,
    getSheetCategories,
} from "../services/wsz-browsing-analytics.service";
import { getBigQueryData } from "../utils";

// List Bad Worksheet Convert Info
export const getListWorksheetConvert = async (req: Request, res: Response) => {
    let result: string[] = [];
    try {
        let { startDate, endDate } = req.body;
        let query =
            "SELECT DISTINCT(ep1.value.string_value) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
            startDate +
            "' AND '" +
            endDate +
            "' AND event_name = 'page_view' AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%utm_source=livews_correct_answer' AND geo.country != 'Vietnam' ";

        let data = await getBigQueryData(query);
        result = data.map((d: any) => d.string_value);
    } catch (error) {
        console.log("error", error);
    }

    return res.status(200).json({ result: result });
};

export const getWSInfoByEvent = async (req: Request, res: Response) => {
    let result = 0;
    try {
        let { startDate, endDate, worksheetUrl, event } = req.body;
        if(startDate && endDate && worksheetUrl && event) {
            if(!["page_view", "submit_worksheet", "play_worksheet"].includes(event)) {
                throw new Error("Event not found");
            }
            
            let query =
                "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
                startDate +
                "' AND '" +
                endDate +
                "' AND event_name = '" + event + "' AND ep1.key = 'page_location' AND ep1.value.string_value = '" + worksheetUrl + "' AND geo.country != 'Vietnam' ";
    
            const data: any = await getBigQueryData(query);
            if (data) {
                result = parseInt(data[0]["f0_"]);
            }
        }
    } catch (error) {
        console.log("error", error);
        result = -1;
    }

    return res.status(200).json({ result: result });
}
// ---- //

export const getTrafficReferralSources = async (
    req: Request,
    res: Response
) => {
    let result = [
        "all",
        "facebook",
        "pinterest",
        "liveworksheet",
        "reddit",
        "yahoo",
    ];
    try {
        let { startDate, endDate } = req.body;
        startDate = "20220801";
        endDate = "20220923";
        const query =
            "SELECT DISTINCT traffic_source.source FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
            startDate +
            "' AND '" +
            endDate +
            "' AND traffic_source.name = '(referral)'";
        let data = await getBigQueryData(query);
        const EXCLUDE_SOURCES = [
            "vercel",
            "localhost:3000",
            "facebook",
            "pinterest",
            "liveworksheet",
            "reddit",
            "yahoo",
        ];

        data = data.filter((item: any) => {
            for (let i = 0; i < EXCLUDE_SOURCES.length; i++) {
                if (item.source.indexOf(EXCLUDE_SOURCES[i]) > -1) {
                    return false;
                }
            }
            return true;
        });

        result = result.concat(data.map((item: any) => item.source));
    } catch (error) {
        console.log(error);
    }
    return res.status(200).json({ result: result });
};

export const getDataByEvent = async (req: Request, res: Response) => {
    let result = -1;
    try {
        const {
            startDate,
            endDate,
            device,
            sourceName,
            sourceSource,
            country,
            event,
            action,
        } = req.body;
        if (
            startDate &&
            endDate &&
            device &&
            sourceName &&
            sourceSource &&
            country &&
            event
        ) {
            result = await getResultByEvent({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
                event,
                action,
            });
        }
    } catch (error) {
        console.log(error);
    }
    return res.status(200).json({ result: result });
};

export const getAllCategories = async (req: Request, res: Response) => {
    const result = getSheetCategories();

    return res.status(200).json(result);
};