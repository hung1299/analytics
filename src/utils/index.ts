import axios from "axios";
import fs from "fs";
import path from "path";
import APIConfig from "./APIConfig";

export const readDataByFileName = (name: string) => {
    const dir = path.join(process.cwd(), `src/data/${name}.json`);
    let rawData = fs.readFileSync(dir);
    let data = JSON.parse(rawData.toString());

    return data;
};

export const getBigQueryData = async (query: string) => {
    const url = process.env.DASHBOARD_API || "";
    try {
        const { data } = await axios.post(url + APIConfig.BIG_QUERY, {
            query: query,
        });
        return data;
    } catch (error) {
        console.log("ERROR", error);
        return null;
    }
};

export const getPostgesqlData = async (query: string) => {
    const url = process.env.POSTGRES_API || "";
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

export const getGA4Data = async (params: any) => {
    const url = process.env.DASHBOARD_API || "";
    try {
        const { data } = await axios.post(url + APIConfig.GA, params);
        return data;
    } catch (error) {
        console.log("ERROR", error);
        return null;
    }
};

export const isIpAddress = (text: string) => {
    const pattern =
        /(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/g;
    return pattern.test(text);
};