const { Schema, model } = require('mongoose')

const integrationHistorySchema = new Schema(
    {
        apiEndpoint: {
            type: String,
        },
        method: {
            type: String,
        },
        requestPayload: {
            type: Schema.Types.Mixed,
        },
        responsePayload: {
            type: Schema.Types.Mixed,
        },
        httpStatus: {
            type: Number,
        },
        status: {
            type: String,
        },
    },
    { timestamps: true },
)

const IntegrationHistoryModel = model(
    'integrationHistories',
    integrationHistorySchema,
    'integrationHistories',
)

module.exports = IntegrationHistoryModel
