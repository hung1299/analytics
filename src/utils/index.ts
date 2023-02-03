import axios from "axios";
import fs from "fs";
import path from "path";
import APIConfig from "./APIConfig";

export const readCategoryFileData = () => {
    const dir = path.join(process.cwd(), "src/data/category-data.json");
    let categoryData = fs.readFileSync(dir);
    let categories = JSON.parse(categoryData.toString());

    return categories;
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
