const express = require('express')
const goodsReceiptController = require('../controller/goodsReceiptController')
const router = express.Router()

router.get('/getAll', goodsReceiptController.getAll)
router.get('/getById/:goodReceiptId', goodsReceiptController.getById)
router.get('/getBatchlotInfo/:batchlot', goodsReceiptController.getBatchlotInfo)
router.post('/updateQRcode', goodsReceiptController.updateQRcode)

module.exports = router
