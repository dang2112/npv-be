const express = require('express')
const router = express.Router()

const roleRoute = require('./roleRoute')
const authRoute = require('./authRoute')
const userRoute = require('./userRoute')
const deviceRoute = require('./deviceRoute')
const goodsReceiptRoute = require('./goodsReceiptRoute')
const integrationHistoryRoute = require('./integrationHistoryRoute')

router.use('/role', roleRoute)
router.use('/auth', authRoute)
router.use('/user', userRoute)
router.use('/device', deviceRoute)
router.use('/goodsReceipt', goodsReceiptRoute)
router.use('/integrationHistory', integrationHistoryRoute)

module.exports = router
