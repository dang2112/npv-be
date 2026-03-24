const express = require('express')
const goodsReceiptController = require('../controller/goodsReceiptController')
const router = express.Router()

router.get('/getAll', goodsReceiptController.getAll)
router.get('/getById/:goodReceiptId', goodsReceiptController.getById)
router.post('/create', goodsReceiptController.create)
router.post('/update/:goodReceiptId', goodsReceiptController.update)
router.post('/delete', goodsReceiptController.delete)

module.exports = router
