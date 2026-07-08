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
        lotNumber: {
            type: String, // Lô SX (Batch NO từ DO)
        },
        qty: {
            type: Number, // Số lượng theo DO
        },
        qrCode: {
            type: String, // QR của lon sơn
        },
        cartonQR: {
            type: String, // QR thùng carton chứa lon này
        },
        printOrder: {
            type: Number, // Thứ tự in nhãn (người vận hành sắp xếp)
        },
        // 1: chưa kích hoạt, 2: đã kích hoạt
        qrStatus: {
            type: Number,
            default: 1,
        },
        isScanned: {
            type: Boolean,
            default: false,
        },
        scannedAt: {
            type: Date,
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
