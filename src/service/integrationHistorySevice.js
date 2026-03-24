const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const IntegrationHistoryModel = require('../model/integrationHistory')

const integrationHistoryService = {
    getAll: async (apiEndpoint, page = 1, limit = 10) => {
        try {
            page = Number(page)
            limit = Number(limit)

            const query = {}
            if (apiEndpoint) {
                query.apiEndpoint = apiEndpoint
            }

            const [items, totalItems] = await Promise.all([
                IntegrationHistoryModel.find(query, { __v: 0 })
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                IntegrationHistoryModel.countDocuments(query),
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
}

module.exports = integrationHistoryService
