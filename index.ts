import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import webAnalyticRouter from './src/routes/web-analytics.router';
import bodyParser from "body-parser";
import wszBrowsingAnalyticsRouter from "./src/routes/wsz-browsing-analytics.router";
import connectDatabase from "./src/utils/mongodb";
import { onStartCronJob } from "./src/utils/cron";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5006;

app.use(bodyParser.json({ limit: "500mb" }));
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: "500mb",
        parameterLimit: 50000,
    })
);

app.use("/web-analytics", webAnalyticRouter);
app.use("/wsz-browsing-analytics", wszBrowsingAnalyticsRouter);

app.use("/api", wszBrowsingAnalyticsRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("SERVER IS WORKING");
});

connectDatabase(() => {
    console.log("DB is running");
});

onStartCronJob();

app.listen(port, () => {
  console.log(`Server is running at PORT: ${port}`);
});
