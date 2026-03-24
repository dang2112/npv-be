const axios = require('axios')

const { envConfig } = require('../../config/envConfig')

const client = axios.create({
    baseURL: envConfig.QAAS_API_URL,
    headers: {
        Authorization: `Bearer ${envConfig.QAAS_API_KEY}`,
    },
})
const integrationClient = {
    getBatchlotInfo: async (batchlot) =>
        await client.get(`/batchlot/${batchlot}`),

    updateQRcode: async (data) => await client.post('/qrcode-activate', data),
}

module.exports = integrationClient
