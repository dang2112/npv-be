const { Schema, model, Types } = require('mongoose')

const cartonMappingSchema = new Schema(
    {
        goodsIssueId: {
            type: Types.ObjectId,
            ref: 'goodsIssues',
            required: true,
        },
        cartonQR: {
            type: String,
            required: true,
        },
        productQRs: [
            {
                type: String,
            },
        ],
        // OPEN: đang nhận lon sơn, CONFIRMED: scanner cuối đã xác nhận
        status: {
            type: String,
            enum: ['OPEN', 'CONFIRMED'],
            default: 'OPEN',
        },
        confirmedAt: {
            type: Date,
        },
    },
    { timestamps: true },
)

const CartonMappingModel = model(
    'cartonMappings',
    cartonMappingSchema,
    'cartonMappings',
)

module.exports = CartonMappingModel
