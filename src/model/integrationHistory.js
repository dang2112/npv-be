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
        // SUCCESS | FAILED
        status: {
            type: String,
        },
        // Mã batchlot hoặc doCode liên quan (để filter log dễ hơn)
        referenceCode: {
            type: String,
        },
        // Module gọi API: GOODS_RECEIPT | GOODS_ISSUE
        module: {
            type: String,
        },
        // Thời gian call API (ms)
        duration: {
            type: Number,
        },
        // Error message chi tiết khi status = FAILED
        errorMessage: {
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
