const logger = require('../config/loggerConfig')
const GoodsReceiptConfigModel = require('../model/goodsReceiptConfig')

const GOODS_RECEIPT_CONFIGS = [
    {
        name: 'quantityPerCarton',
        value: '12',
    },
    {
        name: 'scanMode',
        value: 'AUTO',
    },
    {
        name: 'requireMasterCode',
        value: 'true',
    },
]

async function goodsReceiptConfigSeeder() {
    await GoodsReceiptConfigModel.deleteMany({})
    await GoodsReceiptConfigModel.insertMany(GOODS_RECEIPT_CONFIGS)
    logger.info('Goods receipt configs seeded')
}

module.exports = goodsReceiptConfigSeeder
