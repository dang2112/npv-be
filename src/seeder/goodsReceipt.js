const path = require('path')

const GoodsReceiptModel = require('../model/goodsReceipt')
const GoodsReceiptDetailModel = require('../model/goodsReceiptDetail')
const logger = require('../config/loggerConfig')

const batchlots = require(
    path.join(__dirname, '..', '..', 'mockApiQaa', 'data', 'batchlots'),
)

const mapDetail = (qr, index) => {
    const activated = qr.activationStatus === 1

    return {
        productCode: qr.itemCode,
        productName: qr.itemName,
        qrCode: qr.qrCode,
        index: index + 1,
        zipMasterCode: qr.zipMasterCode || null,
        scanStatus: activated ? 'SCANNED' : 'PENDING',
        activationStatus: activated ? 'ACTIVATED' : 'PENDING',
        scannedAt: activated ? qr.activatedAt || null : null,
    }
}

async function goodsReceiptSeeder(batchlot = 'BL-2026-001') {
    const data = batchlots[batchlot]
    if (!data) {
        const available = Object.keys(batchlots).join(', ')
        throw new Error(
            `Batchlot ${batchlot} not found. Available batchlots: ${available}`,
        )
    }

    const existing = await GoodsReceiptModel.findOne({ batchlot }).lean()
    if (existing) {
        await GoodsReceiptDetailModel.deleteMany({
            _id: { $in: existing.goodsReceiptDetails },
        })
        await GoodsReceiptModel.deleteOne({ _id: existing._id })
    }

    const insertedDetails = await GoodsReceiptDetailModel.insertMany(
        data.qrCodes.map(mapDetail),
    )
    const receipt = await GoodsReceiptModel.create({
        batchlot: data.manufactureBatchlot,
        total: insertedDetails.length,
        goodsReceiptDetails: insertedDetails.map((detail) => detail._id),
        status: 'PENDING',
    })

    logger.info(
        `Goods receipt seeded: ${receipt.batchlot} (${insertedDetails.length} QR codes)`,
    )
    return receipt
}

module.exports = goodsReceiptSeeder
