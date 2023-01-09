import express from 'express';
import { answerByQuestion } from '../controllers/web-analytics.controller';
import APIConfig from '../utils/APIConfig';

const webAnalyticRouter = express.Router();

webAnalyticRouter.post(APIConfig.GET_ANSWER_BY_QUESTION, answerByQuestion);

export default webAnalyticRouter;
