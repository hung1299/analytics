import { model, Schema } from "mongoose";
export const referralTableName = "Referral";

const ReferralSchema = new Schema(
    {
        value: {
            type: String,
        },
    },
    { versionKey: false, timestamps: true }
);

const ReferralModel = model(referralTableName, ReferralSchema);
export default ReferralModel;
