const { Types } = require('mongoose')

const logger = require('../config/loggerConfig')
const IntegrationConfigModel = require('../model/integrationConfig')

async function integrationConfigSeeder() {
    await IntegrationConfigModel.deleteMany({})
    await IntegrationConfigModel.insertMany([
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb1a'),
            host: 'http://192.168.1.99:4204',
            username: '',
            password: '',
            token: '',
            //API nhận
            goodsReceiptApi: '/assets/mock-data/activity-data.json',
            //API gửi
            goodsIssueApi: '',
            // getInfoDOApi: '/api/v1/delivery/order-info',
        },
    ])
    logger.info('integrationConfig seeded')
}

module.exports = integrationConfigSeeder
