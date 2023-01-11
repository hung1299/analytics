import { Request, Response } from "express";
import axios from "axios";

interface IParams {
    query?: string;
    startDate?: number;
    endDate?: number;
    device: string;
    sourceName: string;
    sourceSource: string;
    country: string;
    event?: string;
    action?: string;
}

const getQueryCondition = ({
    query,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    // source
    if (sourceName === "google_ads") {
        query +=
            " AND traffic_source.medium = 'cpc' AND traffic_source.source = 'google'";
    } else if (sourceName !== "landing") {
        if (sourceName === "(referral)" && sourceSource !== "all") {
            if (sourceSource === "facebook") {
                query += " AND traffic_source.source LIKE '%face%' ";
            } else {
                query +=
                    " AND traffic_source.source LIKE '%" + sourceSource + "%' ";
            }
        } else if (sourceName === "(direct)") {
            query += " AND traffic_source.source = '(direct)' ";
        }
    } else {
        query = query?.replace(
            "WHERE",
            "CROSS JOIN UNNEST(event_params) epSource WHERE"
        );
        query +=
            " AND epSource.key = 'ws_first_visit' AND epSource.value.string_value = 'landing'";
    }

    // device
    if (device !== "all") {
        query += " AND device.category = '" + device + "' ";
    }
    if (country == "All Countries except VN") {
        query += " AND geo.country != 'Vietnam' ";
    } else if (country == "US only") {
        query += " AND geo.country = 'United States' ";
    }
    if (!query) {
        return "";
    }
    return query;
};

const getBigQueryData = async (query: string) => {
    const url = process.env.DASHBOARD_API || "";
    try {
        const { data } = await axios.post(url, {
            query: query,
        });
        return data;
    } catch (error) {
        console.log("ERROR", error);
        return null;
    }
};

// ******* TOTAL USERS ******* //
const getTotalUsers = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

// ******* SEARCH ******* //
const getNbUsersSearch = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'view_search_results'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getNbSearches = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(*) FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'view_search_results'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

// ******* PREVIEW WORKSHEETS ******* //
const getNbUsersPreviewWorksheets = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'page_view' AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%printable-interactive%'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getNbPreviewsWorksheet = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(*) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'page_view' AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%printable-interactive%'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getNbPreviewsWorksheetFromGrid = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(*) FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'click_worksheet'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getNbPreviewsWorksheetFromRelatedSection = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(*) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'click_worksheet' AND ep1.key = 'page_referrer' AND ep1.value.string_value LIKE '%printable-interactive%'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

// ******* PLAY INTERACTIVE / ACTIONS ******* //
const getNbUsersByAction = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
    action,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = '" +
        action +
        "'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getNbPlayedWorksheets = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(ep1.value.string_value)) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'play_worksheet' AND ep1.key = 'worksheet_id'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getNbUsersPlayWorksheetsInFullMode = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'play_worksheet' AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%play=true%'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

// ******* VIEW COLLECTION ******* //
const getNbUsersViewCollection = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'page_view' AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%collection%'";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

// ******* LOGIN ******* //
const getNbUsersLogin = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001.analytics_293685876.events_*` WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name IN ('login_by_email', 'login_with_google')";
    query = getQueryCondition({
        query,
        device,
        sourceName,
        sourceSource,
        country,
    });
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getResultByEvent = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
    event,
    action,
}: IParams) => {
    switch (event) {
        case "total_users":
            return await getTotalUsers({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "search_users":
            return await getNbUsersSearch({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "search_number_search":
            return await getNbSearches({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "preview_ws_users":
            return await getNbUsersPreviewWorksheets({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "preview_ws_number":
            return await getNbPreviewsWorksheet({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "preview_ws_related_ws":
            return await getNbPreviewsWorksheetFromGrid({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "play_interactive_users":
            return await getNbUsersByAction({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
                action,
            });
        case "play_interactive_number_ws":
            return await getNbPlayedWorksheets({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "actions_downloads":
        case "actions_submit":
        case "actions_share":
        case "actions_save":
            return await getNbUsersByAction({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
                action,
            });
        case "view_collection_users":
            return await getNbUsersViewCollection({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
                action,
            });
        case "logins_users":
            return await getNbUsersLogin({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
                action,
            });
        default:
            return -1;
    }
};

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
