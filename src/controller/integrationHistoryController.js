const integrationHistoryService = require('../service/integrationHistorySevice')
const { response } = require('../util/response/response')

const integrationHistoryController = {
    getAll: async (req, res, next) => {
        try {
            const {
                status,
                referenceCode,
                startDate,
                endDate,
                module,
                page = 1,
                limit = 10,
            } = req.query
            const result = await integrationHistoryService.getAll(
                { status, referenceCode, startDate, endDate, module },
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
            const { integrationHistoryId } = req.params
            const result =
                await integrationHistoryService.getById(integrationHistoryId)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { ids } = req.body
            const result = await integrationHistoryService.delete(ids)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = integrationHistoryController
