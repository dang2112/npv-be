const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const GoodsReceiptModel = require('../model/goodsReceipt')
const integrationService = require('../util/integration/integrationService')
const GoodsReceiptDetailModel = require('../model/goodsReceiptDetail')

const goodsReceiptService = {
    getAll: async (search = '', page = 1, limit = 10) => {
        try {
            search = RegExp(search, 'i')
            page = Number(page)
            limit = Number(limit)

            const [items, totalItems] = await Promise.all([
                GoodsReceiptModel.find(
                    {
                        batchlot: search,
                    },
                    { __v: 0 },
                )
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                GoodsReceiptModel.countDocuments({
                    batchlot: search,
                }),
            ])

            const data = {
                items: items,
                page,
                totalItems,
                totalPage: Math.ceil(totalItems / limit),
            }
            return data
        } catch (error) {
            throw error
        }
    },
    getById: async (goodsReceiptId) => {
        try {
            const data = await GoodsReceiptModel.findById(
                goodsReceiptId,
            ).populate('goodsReceiptDetails')

            if (!data) {
                throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)
            }

            return data
        } catch (error) {
            throw error
        }
    },
    getBatchlotInfo: async (batchlot) => {
        try {
            const batchlotInfo =
                await integrationService.getBatchlotInfo(batchlot)
            if (batchlotInfo.status !== 200) {
                throw new BadReq(errorCode.GOODS_RECEIPT_EXISTED)
            }
            const goodsReceiptDetails = []
            for (let product of batchlotInfo.details) {
                const goodsReceiptDetail = {
                    productCode: product.productCode,
                    productName: product.productName,
                    qrCode: product.qrCode,
                    index: product.index,
                    status: product.status,
                }
                goodsReceiptDetails.push(goodsReceiptDetail)
            }
            const insertedDetails =
                await GoodsReceiptDetailModel.insertMany(goodsReceiptDetails)
            const goodsReceiptDetailIds = insertedDetails.map(
                (detail) => detail._id,
            )
            await GoodsReceiptModel.create({
                batchlot: batchlotInfo.batchlot,
                total: batchlotInfo.total,
                goodsReceiptDetails: goodsReceiptDetailIds,
                status: batchlotInfo.status,
            })

            return batchlotInfo
        } catch (error) {
            throw error
        }
    },
    updateQRcode: async (qrCodes) => {
        try {
            // await integrationService.updateQRcode(qrCodes)
            // TODO: Cập nhật thông tin QR code vào DB goodsReceiptDetails
            // await GoodsReceiptModel.create(batchlotInfo.data)
            return null
        } catch (error) {
            throw error
        }
    },
}

module.exports = goodsReceiptService
