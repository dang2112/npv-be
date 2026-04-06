const { Schema, model } = require('mongoose')

const integrationConfigSchema = new Schema(
    {
        host: {
            type: String,
        },
        username: {
            type: String,
            // required: true,
        },
        password: {
            type: String,
            // required: true,
        },
        token: {
            type: String,
        },
        goodsReceiptApi: {
            type: String,
        },
        goodsIssueApi: {
            type: String,
        },
        getInfoDOApi: {
            type: String,
        },
    },
    { timestamps: true },
)

const IntegrationConfigModel = model(
    'integrationConfigs',
    integrationConfigSchema,
    'integrationConfigs',
)

module.exports = IntegrationConfigModel
