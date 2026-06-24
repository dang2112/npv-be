const logger = require('../config/loggerConfig')
const GoodsReceiptConfigModel = require('../model/goodsReceiptConfig')

const GOODS_RECEIPT_CONFIGS = [
    {
        name: 'low',
        value: '4',
    },
    {
        name: 'mid',
        value: '8',
    },
    {
        name: 'high',
        value: '12',
    },
]

async function goodsReceiptConfigSeeder() {
    await GoodsReceiptConfigModel.deleteMany({})
    await GoodsReceiptConfigModel.insertMany(GOODS_RECEIPT_CONFIGS)
    logger.info('Goods receipt configs seeded')
}

module.exports = goodsReceiptConfigSeeder
