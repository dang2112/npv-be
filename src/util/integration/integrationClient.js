const axios = require('axios')

const { envConfig } = require('../../config/envConfig')

const client = axios.create({
    baseURL: envConfig.QAAS_API_URL,
    headers: {
        'x-api-key': envConfig.QAAS_API_KEY,
        'Content-Type': 'application/json',
    },
})

const integrationClient = {
    // POST /v1/dmc/batchlot/sync
    syncBatchlot: async (manufactureBatchlot, createdAt) => {
        const body = { manufactureBatchlot }
        if (createdAt) body.createdAt = createdAt
        return await client.post('/v1/dmc/batchlot/sync', body)
    },

    // PATCH /v1/dmc/qr-code/activation
    activateQRcode: async (qrCode, activatedAt) =>
        await client.patch('/v1/dmc/qr-code/activation', {
            qrCode,
            activationStatus: 1,
            activatedAt,
        }),

    // POST /v1/dmc/daily-confirmation
    sendDailyConfirmation: async (manufactureBatchlot, date, totalActivated, totalScanned) =>
        await client.post('/v1/dmc/daily-confirmation', {
            manufactureBatchlot,
            date,
            totalActivated,
            totalScanned,
        }),
}

module.exports = integrationClient
