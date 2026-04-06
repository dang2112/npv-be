const goodsReceiptService = require('../service/goodsReceiptService')
const { response } = require('../util/response/response')

const deviceController = {
    getAll: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await goodsReceiptService.getAll(
                search,
                Number(page),
                Number(limit),
            )
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getById: async (req, res, next) => {
        try {
            const { goodReceiptId } = req.params
            const result = await goodsReceiptService.getById(goodReceiptId)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getBatchlotInfo: async (req, res, next) => {
        try {
            const { batchlot } = req.params
            const result = await goodsReceiptService.getBatchlotInfo(batchlot)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    updateQRcode: async (req, res, next) => {
        try {
            const { batchlot } = req.params
            const result = await goodsReceiptService.updateQRcode(batchlot)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getDataTest: async (req, res, next) => {
        try {
            const { batchlot } = req.params
            const result = await goodsReceiptService.getDataTest(batchlot)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    }

}

module.exports = deviceController
