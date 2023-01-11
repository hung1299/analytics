import express from "express";
import {
    getDataByEvent,
    getTrafficReferralSources,
} from "../controllers/wsz-browsing-analytics.controller";
import APIConfig from "../utils/APIConfig";

const wszBrowsingAnalyticsRouter = express.Router();

wszBrowsingAnalyticsRouter.post(
    APIConfig.GET_TRAFFIC_REFERRAL_SOURCES,
    getTrafficReferralSources
);
wszBrowsingAnalyticsRouter.post(APIConfig.GET_DATA_BY_EVENT, getDataByEvent);

export default wszBrowsingAnalyticsRouter;
