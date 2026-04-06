const express = require('express')
const scanController = require('../controller/scanController')
const router = express.Router()

router.get('/start', scanController.startScan)


module.exports = router
