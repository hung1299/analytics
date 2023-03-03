import mongoose from "mongoose";
const dotenv = require("dotenv");
const result = dotenv.config();

const IP = process.env.IP_DB || "localhost";
const PORT = process.env.PORT_DB || 27017;
const DATABASE = process.env.DATABASE_NAME || "analytics";
const USER = process.env.USER_DB || "";
const PASS = process.env.PASS_DB || "";

const connectDatabase = (success?: Function, failure?: Function) => {
    const DB_URL = `mongodb://${IP}:${PORT}`;
    console.log("DB_URL ", DB_URL);
    let mongoSetup = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useFindAndModify: false,
        // useCreateIndex: true,
        dbName: DATABASE,
    };
    if (USER.length) {
        Object.assign(mongoSetup, {
            auth: {
                user: USER,
                password: PASS,
            },
            authSource: DATABASE,
        });
    }
    console.log("mongoSetup ", mongoSetup);

    mongoose
        .connect(DB_URL, mongoSetup)
        .then((e) => {
            console.log("MongoDB connected: ", DB_URL, " ", new Date());
            if (success) {
                success(mongoose);
            }
        })
        .catch((err) => {
            console.log("MongoDB initial connection error: ", err);
            if (failure) {
                failure();
            }
        });

    mongoose.connection.on("error", (err) => {
        console.log("MongoDB error: ", err);
    });
};

export const isProduction = () => {
    return process.env.IS_PRODUCTION == "true";
};

export default connectDatabase;
