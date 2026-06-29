const { Schema, model } = require('mongoose')

const goodsReceiptConfigSchema = new Schema(
    {
        //placeholder models, to be changed later
        name: {
            type: String,
            required: [true, 'Name is required']
        },
        value: {
            type: Number,
            required: [true, 'Value is required']
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
