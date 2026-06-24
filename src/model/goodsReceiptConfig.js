const { Schema, model } = require('mongoose')

const goodsReceiptConfigSchema = new Schema(
    {
        //placeholder models, to be changed later
        name: {
            type: String,
        },
        value: {
            type: String,
        },
    },
    { timestamps: true },
)

const GoodsReceiptConfigModel = model(
    'goodsReceiptConfigs',
    goodsReceiptConfigSchema,
    'goodsReceiptConfigs',
)

module.exports = GoodsReceiptConfigModel
