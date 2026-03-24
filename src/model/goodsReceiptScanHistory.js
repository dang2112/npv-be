const { Schema, model } = require('mongoose')

const goodsReceiptScanHistorySchema = new Schema(
    {
        qrCode: {
            type: String,
        },
    },
    { timestamps: true },
)

const GoodsReceiptScanHistoryModel = model(
    'goodsReceiptScanHistories',
    goodsReceiptScanHistorySchema,
    'goodsReceiptScanHistories',
)

module.exports = GoodsReceiptScanHistoryModel
