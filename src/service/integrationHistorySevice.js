const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const IntegrationHistoryModel = require('../model/integrationHistory')

const integrationHistoryService = {
    getAll: async (filters = {}, page = 1, limit = 10) => {
        try {
            page = Number(page)
            limit = Number(limit)

            console.log(filters)

            const {
                status,
                referenceCode,
                search,
                startDate,
                endDate,
                module,
            } = filters

            const query = {}
            if (status) query.status = status

            const ref = referenceCode || search
            if (ref) {
                query.referenceCode = { $regex: ref, $options: 'i' }
            }

            if (module) query.module = module
            if (startDate || endDate) {
                query.createdAt = {}
                if (startDate) query.createdAt.$gte = new Date(startDate)
                if (endDate) query.createdAt.$lte = new Date(endDate)
            }

            const [items, totalItems] = await Promise.all([
                IntegrationHistoryModel.find(query, { __v: 0 })
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                IntegrationHistoryModel.countDocuments(query),
            ])

            return {
                items,
                page,
                totalItems,
                totalPage: Math.ceil(totalItems / limit),
            }
        } catch (error) {
            throw error
        }
    },
    getById: async (integrationHistoryId) => {
        try {
            const data =
                await IntegrationHistoryModel.findById(integrationHistoryId)

            if (!data) {
                throw new BadReq(errorCode.INTEGRATION_HISTORY_NOT_FOUND)
            }

            return data
        } catch (error) {
            throw error
        }
    },
    delete: async (ids) => {
        try {
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new BadReq(errorCode.INVALID_REQUEST)
            }
            const result = await IntegrationHistoryModel.deleteMany({
                _id: { $in: ids },
            })
            return { deletedCount: result.deletedCount }
        } catch (error) {
            throw error
        }
    },
}

module.exports = integrationHistoryService
