import express from "express";
import {
    getAllCategories,
    getDataByEvent,
    getListWorksheetConvert,
    getTrafficReferralSources,
    getWSInfoByEvent,
    getCategoryInfoByName,
} from "../controllers/wsz-browsing-analytics.controller";
import APIConfig from "../utils/APIConfig";

const wszBrowsingAnalyticsRouter = express.Router();

wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_TRAFFIC_REFERRAL_SOURCES,
    getTrafficReferralSources
);
wszBrowsingAnalyticsRouter.post(APIConfig.GET_DATA_BY_EVENT, getDataByEvent);
wszBrowsingAnalyticsRouter.post(APIConfig.GET_ALL_CATEGORIES, getAllCategories);

wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_LIST_WORKSHEET_CONVERT,
    getListWorksheetConvert
);
wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_WS_CONVERT_INFO,
    getWSInfoByEvent
);
wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_CATEGORY_INFO_BY_NAME,
    getCategoryInfoByName
);
export default wszBrowsingAnalyticsRouter;
