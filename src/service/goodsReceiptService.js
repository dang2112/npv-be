const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const GoodsReceiptModel = require('../model/goodsReceipt')
const integrationService = require('../util/integration/integrationService')
const GoodsReceiptDetailModel = require('../model/goodsReceiptDetail')
const tcpClient = require('../tcp/tcpClient')


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
            // if (batchlotInfo.status !== 200) {
            //     throw new BadReq(errorCode.GOODS_RECEIPT_EXISTED)
            // }
            if (batchlotInfo.status == 401) {
                throw new BadReq(errorCode.AUTHENTICATION_FAILED)
            } else if (batchlotInfo.status == 404) {
                throw new BadReq(errorCode.BATCHLOT_NOT_FOUND)
            } else if (batchlotInfo.status == 500) {
                throw new BadReq(errorCode.INTERNAL_SERVER_ERROR)
            }

            const goodsReceiptDetails = []
            for (let product of batchlotInfo.detail) {
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

            //Lưu LIST PRODUCT vào List TCP để quét
            tcpClient.setProductList(goodsReceiptDetails)
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
    getDataTest: async (batchlot) => {
        try {
            console.log("batchlot nèeee:", batchlot)
            const mockDatabase = [
                {
                    "batchlot": "111",
                    "total": 2,
                    "detail": [
                        { "itemCode": "PROD001", "itemName": "Sản phẩm A", "qrCode": "QR-0001-A", "index": "1", "status": 1 },
                        { "itemCode": "PROD001", "itemName": "Sản phẩm A", "qrCode": "QR-0002-A", "index": "2", "status": 2 }
                    ],
                    "status": 200
                },
                {
                    "batchlot": "222",
                    "total": 1,
                    "detail": [
                        { "itemCode": "PROD002", "itemName": "Sản phẩm B", "qrCode": "QR-9999-B", "index": "1", "status": 1 }
                    ],
                    "status": 200
                },
                {
                    "batchlot": "333",
                    "total": 3,
                    "detail": [
                        { "itemCode": "PROD003", "itemName": "Sản phẩm C", "qrCode": "QR-8881-C", "index": "1", "status": 1 },
                        { "itemCode": "PROD003", "itemName": "Sản phẩm C", "qrCode": "QR-8882-C", "index": "2", "status": 1 },
                        { "itemCode": "PROD003", "itemName": "Sản phẩm C", "qrCode": "QR-8883-C", "index": "3", "status": 2 }
                    ],
                    "status": 200
                }
            ];
            // Tìm kiếm dữ liệu dựa trên batchlot truyền vào
            const result = mockDatabase.find(item => item.batchlot === batchlot);
            console.log("result")
            console.log(result)
            // Nếu tìm thấy thì trả về dữ liệu, nếu không trả về lỗi 404 giả lập
            if (result) {
                return result;
            } else {
                return {
                    "batchlot": batchlot,
                    "total": 0,
                    "detail": [],
                    "status": 404,
                    "message": "Không tìm thấy Batch Lot này"
                };
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = goodsReceiptService
