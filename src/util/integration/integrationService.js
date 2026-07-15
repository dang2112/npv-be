const IntegrationHistoryModel = require('../../model/integrationHistory')
const integrationClient = require('./integrationClient')

const normalizeBatchlot = (batchlot) => String(batchlot ?? '').trim()

const integrationService = {
    /**
     * Đồng bộ Batch Lot từ QAA.
     * @param {string} manufactureBatchlot
     * @param {string} [createdAt] - ISO 8601, nếu có thì chỉ lấy QR mới hơn mốc này
     * @returns {object} data — { manufactureBatchlot, totalCount, qrCodes }
     */
    syncBatchlot: async (manufactureBatchlot, createdAt, module) => {
        const startTime = Date.now()
        const endpoint = '/v1/dmc/batchlot/sync'
        manufactureBatchlot = normalizeBatchlot(manufactureBatchlot)

        const payload = { manufactureBatchlot, ...(createdAt && { createdAt }) }
        try {
            const response = await integrationClient.syncBatchlot(
                manufactureBatchlot,
                createdAt,
            )

            const duration = Date.now() - startTime

            IntegrationHistoryModel.create({
                apiEndpoint: endpoint,
                method: 'POST',
                requestPayload: payload,
                responsePayload: response.data,
                httpStatus: response.status,
                status: 'SUCCESS',
                referenceCode: manufactureBatchlot,
                duration,
                module,
            }).catch(console.error)

            return response.data.data
        } catch (error) {
            const duration = Date.now() - startTime

            if (error.code === 'ECONNREFUSED') {
                error.message = 'Không kết nối được đến hệ thống QAA.'
            }

            IntegrationHistoryModel.create({
                apiEndpoint: endpoint,
                method: 'POST',
                requestPayload: payload,
                responsePayload: error.response?.data,
                httpStatus: error.response?.status,
                status: 'FAILED',
                referenceCode: manufactureBatchlot,
                duration,
                errorMessage: error.message,
                module,
            }).catch(console.error)
            throw error
        }
    },

    /**
     * Kích hoạt một QR Code tại QAA.
     * @param {string} qrCode
     * @param {string} activatedAt - ISO 8601
     * @param {string} referenceCode - dùng để ghi log
     */
    activateQRcode: async (qrCode, activatedAt, referenceCode, module) => {
        const startTime = Date.now()
        const endpoint = '/v1/dmc/qr-code/activation'
        const payload = { qrCode, activationStatus: 1, activatedAt }
        try {
            const response = await integrationClient.activateQRcode(
                endpoint,
                qrCode,
                activatedAt,
            )
            const duration = Date.now() - startTime
            IntegrationHistoryModel.create({
                apiEndpoint: endpoint,
                method: 'PATCH',
                requestPayload: payload,
                responsePayload: response.data,
                httpStatus: response.status,
                status: 'SUCCESS',
                referenceCode: referenceCode || qrCode,
                duration,
                module,
            }).catch(console.error)
            return response.data.data
        } catch (error) {
            const duration = Date.now() - startTime
            IntegrationHistoryModel.create({
                apiEndpoint: endpoint,
                method: 'PATCH',
                requestPayload: payload,
                responsePayload: error.response?.data,
                httpStatus: error.response?.status,
                status: 'FAILED',
                referenceCode: referenceCode || qrCode,
                duration,
                errorMessage: error.message,
                module,
            }).catch(console.error)
            throw error
        }
    },

    /**
     * Gửi xác nhận số lượng kích hoạt trong ngày để đối soát với QAA.
     * @param {string} manufactureBatchlot
     * @param {string} date - YYYY-MM-DD
     * @param {number} totalActivated
     * @param {number} totalScanned
     * @returns {object} data — { manufactureBatchlot, date, dmcTotalActivated, dmcTotalScanned, lrtActivatedCount, isMatched }
     */
    sendDailyConfirmation: async (
        manufactureBatchlot,
        date,
        totalActivated,
        totalScanned,
        module,
    ) => {
        const startTime = Date.now()
        const endpoint = '/v1/dmc/daily-confirmation'
        const payload = {
            manufactureBatchlot,
            date,
            totalActivated,
            totalScanned,
        }
        try {
            const response = await integrationClient.sendDailyConfirmation(
                manufactureBatchlot,
                date,
                totalActivated,
                totalScanned,
            )
            const duration = Date.now() - startTime

            IntegrationHistoryModel.create({
                apiEndpoint: endpoint,
                method: 'POST',
                requestPayload: payload,
                responsePayload: response.data,
                httpStatus: response.status,
                status: 'SUCCESS',
                referenceCode: manufactureBatchlot,
                duration,
                module,
            }).catch(console.error)

            return response.data.data
        } catch (error) {
            const duration = Date.now() - startTime
            IntegrationHistoryModel.create({
                apiEndpoint: endpoint,
                method: 'POST',
                requestPayload: payload,
                responsePayload: error.response?.data,
                httpStatus: error.response?.status,
                status: 'FAILED',
                referenceCode: manufactureBatchlot,
                duration,
                errorMessage: error.message,
                module,
            }).catch(console.error)
            throw error
        }
    },
}

module.exports = integrationService
