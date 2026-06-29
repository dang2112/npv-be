const goodsReceiptService = require('../service/goodsReceiptService')
const integrationService = require('../util/integration/integrationService')
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
            const { search, status, page, limit } = req.query
            const result = await goodsReceiptService.getById(goodsReceiptId, { search, status, page, limit })
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
    update: async (req, res, next) => {
        try {
            const { goodsReceiptId } = req.params
            const result = await goodsReceiptService.update(goodsReceiptId, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    activateQRcode: async (req, res, next) => {
        try {
            const { qrCode, batchlot } = req.body
            const result = integrationService.activateQRcode(qrCode, new Date().toISOString(), batchlot, 'GOODS_RECEIPT');
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getAllConfigs: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await goodsReceiptService.getAllConfigs(search, Number(page), Number(limit))
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    updateConfig: async (req, res, next) => {
        try {
            const { goodsReceiptConfigId } = req.params
            const result = await goodsReceiptService.updateConfig(goodsReceiptConfigId, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    deleteConfig: async (req, res, next) => {
        try {
            const { goodsReceiptConfigId } = req.params
            const result = await goodsReceiptService.deleteConfig(goodsReceiptConfigId)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    createConfig: async (req, res, next) => {
        try {
            const result = await goodsReceiptService.createConfig(req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = goodsReceiptController
