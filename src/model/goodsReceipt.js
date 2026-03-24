const { Schema, model, Types } = require('mongoose')

const goodsReceiptSchema = new Schema(
    {
        batchlot: {
            type: String,
        },
        total: {
            type: String,
        },
        goodsReceiptDetails: [
            {
                type: Types.ObjectId,
                ref: 'goodsReceiptDetails',
            },
        ],
        status: {
            type: String,
        },
    },
    { timestamps: true },
)

const GoodsReceiptModel = model(
    'goodsReceipts',
    goodsReceiptSchema,
    'goodsReceipts',
)

module.exports = GoodsReceiptModel
