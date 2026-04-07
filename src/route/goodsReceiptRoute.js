const express = require('express')
const goodsReceiptController = require('../controller/goodsReceiptController')
const router = express.Router()

// Data endpoints
router.get('/getScanning', goodsReceiptController.getScanning)
router.get('/getAll', goodsReceiptController.getAll)
router.get('/getById/:goodsReceiptId', goodsReceiptController.getById)
router.get('/getBatchlotInfo/:batchlot', goodsReceiptController.getBatchlotInfo)
router.get('/getCompletionSummary/:goodsReceiptId', goodsReceiptController.getCompletionSummary)

// Điều khiển dây chuyền (start/pause/complete) → qua WebSocket: receipt:startScan, receipt:pauseScan, receipt:completeScan

router.get('/getDataTest/:batchlot', goodsReceiptController.getDataTest)

module.exports = router
