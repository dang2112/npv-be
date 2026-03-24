const { Schema, model, Types } = require('mongoose')

const goodsIssueDetailSchema = new Schema(
    {
        goodsIssueId: {
            type: Types.ObjectId,
            ref: 'goodsIssues',
        },
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
        // 1 là chưa kích hoạt, 2 là đã kích hoạt
        qrStatus: {
            type: Number,
        },
        isScanned: {
            type: Boolean,
        },
    },
    { timestamps: true },
)

const GoodsIssueDetailModel = model(
    'goodsIssueDetails',
    goodsIssueDetailSchema,
    'goodsIssueDetails',
)

module.exports = GoodsIssueDetailModel
