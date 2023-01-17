import express from "express";
import {
    getDataByEvent,
    getListWorksheetConvert,
    getTrafficReferralSources,
    getWSInfoByEvent,
} from "../controllers/wsz-browsing-analytics.controller";
import APIConfig from "../utils/APIConfig";

const wszBrowsingAnalyticsRouter = express.Router();

wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_TRAFFIC_REFERRAL_SOURCES,
    getTrafficReferralSources
);
wszBrowsingAnalyticsRouter.post(APIConfig.GET_DATA_BY_EVENT, getDataByEvent);

wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_LIST_WORKSHEET_CONVERT,
    getListWorksheetConvert
);
wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_WS_CONVERT_INFO,
    getWSInfoByEvent
);
export default wszBrowsingAnalyticsRouter;
