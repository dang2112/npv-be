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
            index: true,
        },
        index: {
            type: Number,
        },
        zipMasterCode: {
            type: String,
            default: null,
        },
        // Trạng thái quét vật lý từ scanner
        // PENDING: chưa quét, SCANNED: đã quét
        scanStatus: {
            type: String,
            enum: ['PENDING', 'SCANNED'],
            default: 'PENDING',
        },
        // Trạng thái kích hoạt qua API QAA
        // PENDING: chưa kích hoạt, ACTIVATED: đã kích hoạt thành công, ERROR: kích hoạt thất bại
        activationStatus: {
            type: String,
            enum: ['PENDING', 'ACTIVATED', 'ERROR'],
            default: 'PENDING',
        },
        scannedAt: {
            type: Date,
            default: null,
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
