const goodsReceiptService = require('../service/goodsReceiptService')
const { response } = require('../util/response/response')

const goodsReceiptController = {
    getScanning: async (req, res, next) => {
        try {
            const result = await goodsReceiptService.getScanning()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },

    getAll: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await goodsReceiptService.getAll(search, Number(page), Number(limit))
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },

    getById: async (req, res, next) => {
        try {
            const { goodsReceiptId } = req.params
            const { productCode, status, page, limit } = req.query
            const result = await goodsReceiptService.getById(goodsReceiptId, { productCode, status, page, limit })
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

    getCompletionSummary: async (req, res, next) => {
        try {
            const { goodsReceiptId } = req.params
            const result = await goodsReceiptService.getCompletionSummary(goodsReceiptId)
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
    },
}

module.exports = goodsReceiptController
