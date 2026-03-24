const { Schema, model } = require('mongoose')

const goodsIssueSchema = new Schema(
    {
        batchlot: {
            type: String,
        },
        total: {
            type: String,
        },
        status: {
            type: String,
        },
    },
    { timestamps: true },
)

const GoodsIssueModel = model('goodsIssues', goodsIssueSchema, 'goodsIssues')

module.exports = GoodsIssueModel
