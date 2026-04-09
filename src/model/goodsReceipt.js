const { Schema, model, Types } = require('mongoose')

const goodsReceiptSchema = new Schema(
    {
        batchlot: {
            type: String,
            index: true,
        },
        total: {
            type: Number,
        },
        goodsReceiptDetails: [
            {
                type: Types.ObjectId,
                ref: 'goodsReceiptDetails',
            },
        ],
        status: {
            type: String,
            enum: ['PENDING', 'SCANNING', 'PAUSED', 'COMPLETED'],
            default: 'PENDING',
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
