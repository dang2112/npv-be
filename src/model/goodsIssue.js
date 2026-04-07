const { Schema, model, Types } = require('mongoose')

const goodsIssueSchema = new Schema(
    {
        doCode: {
            type: String,
        },
        total: {
            type: Number,
        },
        goodsIssueDetails: [
            {
                type: Types.ObjectId,
                ref: 'goodsIssueDetails',
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

const GoodsIssueModel = model('goodsIssues', goodsIssueSchema, 'goodsIssues')

module.exports = GoodsIssueModel
