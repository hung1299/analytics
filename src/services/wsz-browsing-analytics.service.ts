import axios from "axios";
import ReferralModel from "../mongo/referral.mongo";
import { getBigQueryData, getGA4Data, readDataByFileName } from "../utils";
import Constants from "../utils/constant";
const NOT_SUPPORTED = -2;

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
    params?: any;
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

const getQueryPGCondition = async ({
    query,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let allReferral = await ReferralModel.find({});
    let data = allReferral.map((r) => r.value);
    // source
    if (sourceName === "google_ads") {
        query +=
            " AND traffic_source_medium = 'cpc' AND traffic_source = 'google'";
    } else if (sourceName !== "landing") {
        if (sourceName === "(referral)" && sourceSource !== "all") {
            if (sourceSource === "facebook") {
                query += " AND traffic_source LIKE '%face%' ";
            } else {
                query += " AND traffic_source LIKE '%" + sourceSource + "%' ";
            }
        } else if (sourceName === "(direct)") {
            query += " AND traffic_source = '(direct)' ";
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

const parseDate = (date: number) => {
    const text = date.toString();
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6)}`;
};

const getGA4Params = ({
    startDate,
    endDate,
    params,
    device,
    sourceName,
    country,
}: IParams) => {
    const result = {
        ...params,
        startDate: parseDate(startDate ?? 20221115),
        endDate: parseDate(endDate ?? 20221124),
        appType: {
            type: "web",
            streamId: "293685876",
        },
        dimensions: ["country"],
        dimensionFilter: {
            expressions: [
                {
                    expressions: [
                        {
                            key: "country",
                            value: "Vietnam",
                            matchType: "EXACT",
                        },
                    ],
                    filterType: "not",
                },
            ],
            filterType: "and",
        },
        metricAvgs: ["total"],
    };
    if (device !== "all") {
        result["dimensions"].push("deviceCategory");
        result["dimensionFilter"]["expressions"].push({
            key: "deviceCategory",
            value: device,
            matchType: "EXACT",
        });
    }
    if (country === "US only") {
        result["dimensionFilter"]["expressions"].push({
            key: "country",
            value: "United States",
            matchType: "EXACT",
        });
    }
    if (sourceName !== "all") {
        result["dimensions"].push("firstUserSource");
        result["dimensionFilter"]["expressions"].push({
            key: "firstUserSource",
            value: sourceName,
            matchType: "EXACT",
        });
    }
    return result;
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

// ******* OVERVIEW ******* //
const getAVGEngagementTime = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    if (["landing", "google_ads"].indexOf(sourceName) > -1) {
        return NOT_SUPPORTED;
    }
    const params = getGA4Params({
        startDate,
        endDate,
        params: {
            metrics: ["activeUsers", "userEngagementDuration"],
        },
        device,
        sourceName,
        sourceSource,
        country,
    });
    try {
        const data = await getGA4Data(params);
        if (!data?.totals) {
            return 0;
        }
        const result =
            parseInt(data["totals"][1]["userEngagementDuration"]) /
            parseInt(data["totals"][0]["activeUsers"]);
        return result;
    } catch (error) {
        return -1;
    }
};

const getReturnUsers = async ({
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
        "' AND event_name = 'session_start' AND ep1.key = 'ga_session_number' AND ep1.value.int_value > 1";
    if (country == "All Countries except VN") {
        query += " AND geo.country != 'Vietnam' ";
    } else if (country == "US only") {
        query += " AND geo.country = 'United States' ";
    }
    const data: any = await getBigQueryData(query);
    if (data) {
        return parseInt(data[0]["f0_"]);
    }
    return 0;
};

const getBounceRate = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    if (["landing", "google_ads"].indexOf(sourceName) > -1) {
        return NOT_SUPPORTED;
    }
    const params = getGA4Params({
        startDate,
        endDate,
        params: {
            metrics: ["bounceRate"],
        },
        device,
        sourceName,
        sourceSource,
        country,
    });
    try {
        const data = await getGA4Data(params);
        if (!data?.totals) {
            return 0;
        }
        const result = parseFloat(data["totals"][0]["bounceRate"]);
        return parseFloat(result.toFixed(2));
    } catch (error) {
        return -1;
    }
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

const getNbClickWorksheetFromSearch = async ({
    startDate,
    endDate,
    device,
    sourceName,
    sourceSource,
    country,
}: IParams) => {
    let query =
        "SELECT COUNT(*) FROM `micro-enigma-235001.analytics_293685876.events_*` CROSS JOIN UNNEST(event_params) ep1 CROSS JOIN UNNEST(event_params) ep2 WHERE _TABLE_SUFFIX BETWEEN '" +
        startDate +
        "' AND '" +
        endDate +
        "' AND event_name = 'page_view' AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%printable-interactive%' AND ep2.key = 'page_referrer' AND ep2.value.string_value LIKE 'https://worksheetzone.org/search%'";
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

export const getResultByEvent = async ({
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
        case "overview_avg_engagement_time":
            return await getAVGEngagementTime({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "overview_return_users":
            return await getReturnUsers({
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                country,
            });
        case "overview_bounce_rate":
            return await getBounceRate({
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
        case "search_number_click_ws":
            return await getNbClickWorksheetFromSearch({
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

const getCategories = () => {
    const allMainTopics = readDataByFileName("category-data");
    const wszTopics = allMainTopics.find(
        (c: any) => c._id == Constants.ENGLISH_CATEGORY_ID
    );

    let mainCategories = wszTopics.children.filter((c: any) => {
        return Constants.CATEGORY_CHILD_IDS.includes(c._id);
    });

    const getSeoCategory = (children: any) => {
        let seoCategory: any = [];
        children.map((firstSubTopic: any) => {
            if (firstSubTopic.type === 1) {
                seoCategory.push({
                    _id: firstSubTopic._id,
                    name: firstSubTopic.name,
                });
            }
            let secondSubTopicList = firstSubTopic.children;
            secondSubTopicList.map((secondSubTopic: any) => {
                if (secondSubTopic.type === 1) {
                    seoCategory.push({
                        _id: secondSubTopic._id,
                        name: secondSubTopic.name,
                    });
                }
                let thirdSubTopicList = secondSubTopic.children;
                thirdSubTopicList.map((thirdSubTopic: any) => {
                    if (thirdSubTopic.type === 1) {
                        seoCategory.push({
                            _id: thirdSubTopic._id,
                            name: thirdSubTopic.name,
                        });
                    }
                });
            });
        });
        seoCategory.sort((a: any, b: any) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        return seoCategory;
    };

    mainCategories = mainCategories.map((c: any) => {
        return {
            _id: c._id,
            name: c.name,
            children: getSeoCategory(c.children),
        };
    });
    return mainCategories;
};

export const getSheetCategories = () => {
    const allCategories = getCategories();
    const result: any = [];
    allCategories.forEach((mainCategory: any) => {
        mainCategory.children.forEach((childCategory: any, index: number) => {
            const childName = childCategory.name;
            if (index === 0) {
                result.push([mainCategory.name, childName]);
            } else {
                result.push(["", childName]);
            }
        });
    });

    return result;
};

export const getInfosByCategoryName = async ({
    startDate,
    endDate,
    topicName,
}: {
    startDate: string;
    endDate: string;
    topicName: string;
}) => {
    const wszUrl = "https://api.worksheetzone.org/api";
    let mainCategory = getCategories().find((c: any) => c.name === topicName);
    if (!mainCategory) return [];
    let listPromises = [];

    const promise = axios.post(wszUrl + "/get-number-downloaded-worksheet", {
        endDate,
        startDate,
    });

    listPromises = mainCategory.children.map((c: any) => {
        return axios.post(wszUrl + "/get-worksheets-by-category-id", {
            categoryId: c._id,
            grade: "",
            language: "",
            limit: 100000,
            loadFull: false,
            offset: 0,
            worksheetId: [],
            worksheetType: 2,
        });
    });

    listPromises.unshift(promise);

    let data = await Promise.all(listPromises)
        .then((res) => res.map((r) => r.data))
        .catch((e) => {
            console.log(e);
            return [];
        });
    const numberDownLoadedWs = data.shift();

    data = data.map((wsByCategory: any, index: number) => {
        let totalDownloaded = 0;
        wsByCategory.worksheets.forEach((w: any) => {
            const wsInfo = numberDownLoadedWs.find(
                (info: any) => info._id === w._id
            );
            totalDownloaded += wsInfo ? wsInfo.numberDownload : 0;
        });
        return {
            ...mainCategory.children[index],
            numberOfWorksheets: wsByCategory.numberOfWorksheets,
            totalDownloaded,
        };
    });

    return data.map((d: any) => [d.numberOfWorksheets, d.totalDownloaded]);
};
