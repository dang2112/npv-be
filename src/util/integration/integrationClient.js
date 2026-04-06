const axios = require('axios')

const { envConfig } = require('../../config/envConfig')

const client = axios.create({
    // baseURL: envConfig.QAAS_API_URL,
    baseURL: "http://192.168.1.39:2611",
    headers: {
        Authorization: `Bearer ${envConfig.QAAS_API_KEY}`,
    },
})
const integrationClient = {
    // getBatchlotInfo: async (batchlot) =>
    //     await client.get(`/batchlot/${batchlot}`),
    getBatchlotInfo: async (batchlot) =>
        await client.get(`/npv-dat-my/api/goodsReceipt/getDataTest/${batchlot}`),

    updateQRcode: async (data) => await client.post('/qrcode-activate', data),
}

module.exports = integrationClient
