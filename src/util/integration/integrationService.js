const IntegrationHistoryModel = require('../../model/integrationHistory')
const integrationClient = require('./integrationClient')

const integrationService = {
    getBatchlotInfo: async (batchlot) => {
        try {
            const response = await integrationClient.getBatchlotInfo(batchlot)
            IntegrationHistoryModel.create({
                apiEndpoint: '/batchlot',
                method: 'GET',
                requestPayload: { batchlot },
                responsePayload: response.data,
                httpStatus: response.status,
                status: 'SUCCESS',
            }).catch(console.error)
            return response.data
        } catch (error) {
            IntegrationHistoryModel.create({
                apiEndpoint: '/batchlot',
                method: 'GET',
                requestPayload: { batchlot },
                responsePayload: error.response?.data,
                httpStatus: error.response?.status,
                status: 'FAILED',
            }).catch(console.error)
            throw error
        }
    },
    updateQRcode: async (qrcodes) => {
        try {
            const response = await integrationClient.updateQRcode(qrcodes)
            IntegrationHistoryModel.create({
                apiEndpoint: '/qrcode-activate',
                method: 'POST',
                requestPayload: qrcodes,
                responsePayload: response.data,
                httpStatus: response.status,
                status: 'SUCCESS',
            }).catch(console.error)
            return response
        } catch (error) {
            IntegrationHistoryModel.create({
                apiEndpoint: '/qrcode-activate',
                method: 'POST',
                requestPayload: qrcodes,
                responsePayload: error.response?.data,
                httpStatus: error.response?.status,
                status: 'FAILED',
            }).catch(console.error)
            throw error
        }
    },
}

module.exports = integrationService
