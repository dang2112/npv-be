const { Schema, model } = require('mongoose')

const goodsReceiptDetailSchema = new Schema(
    {
        productCode: {
            type: String,
        },
        productName: {
            type: String,
        },
        qrCode: {
            type: String,
        },
        index: {
            type: Number,
        },
        status: {
            type: String,
        },
    },
    { timestamps: true },
)

const GoodsReceiptDetailModel = model(
    'goodsReceiptDetails',
    goodsReceiptDetailSchema,
    'goodsReceiptDetails',
)

module.exports = GoodsReceiptDetailModel
