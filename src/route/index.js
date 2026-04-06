const express = require('express')
const router = express.Router()

const roleRoute = require('./roleRoute')
const authRoute = require('./authRoute')
const userRoute = require('./userRoute')
const deviceRoute = require('./deviceRoute')
const goodsReceiptRoute = require('./goodsReceiptRoute')
const integrationHistoryRoute = require('./integrationHistoryRoute')
const scanRoute = require('./scanRoute')


router.use('/role', roleRoute)
router.use('/auth', authRoute)
router.use('/user', userRoute)
router.use('/device', deviceRoute)
router.use('/goodsReceipt', goodsReceiptRoute)
router.use('/integrationHistory', integrationHistoryRoute)
router.use('/scan', scanRoute)

router.get('/batchlot/:code', (req, res) => {
    console.log('Mock batchlot info request:', req.params.code)
    return res.json({
        batchlot: 'Mã batchlot ',
        total: 100,
        details: [
            {
                itemCode: 'Mã sản phẩm 1',
                itemName: 'Tên sản phẩm 1',
                qrCode: 'QR code 1',
                index: 1,
                status: 1,
            },
            {
                itemCode: 'Mã sản phẩm 2',
                itemName: 'Tên sản phẩm 2',
                qrCode: 'QR code 2',
                index: 2,
                status: 1,
            },
            {
                itemCode: 'Mã sản phẩm 3',
                itemName: 'Tên sản phẩm 3',
                qrCode: 'QR code 3',
                index: 3,
                status: 1,
            },
        ],
        status: 200,
    })
})

module.exports = router
