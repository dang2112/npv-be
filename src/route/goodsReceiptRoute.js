const express = require('express')
const goodsReceiptController = require('../controller/goodsReceiptController')
const router = express.Router()

router.get('/getScanning', goodsReceiptController.getScanning)
router.get('/getAll', goodsReceiptController.getAll)

//config apis
router.get('/getAllConfigs', goodsReceiptController.getAllConfigs)

//parameterized apis
router.get('/getById/:goodsReceiptId', goodsReceiptController.getById)
router.get('/getBatchlotInfo/:batchlot', goodsReceiptController.getBatchlotInfo)
router.get('/getCompletionSummary/:goodsReceiptId', goodsReceiptController.getCompletionSummary)
// Điều khiển dây chuyền (start/pause/complete) → qua WebSocket: receipt:startScan, receipt:pauseScan, receipt:completeScan

router.put('/update/:goodsReceiptId', goodsReceiptController.update)
router.put('/activateQRcode', goodsReceiptController.activateQRcode)

module.exports = router
