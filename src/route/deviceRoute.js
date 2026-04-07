const express = require('express')
const deviceController = require('../controller/deviceController')
const router = express.Router()

router.get('/getAll', deviceController.getAll)
router.get('/getById/:deviceId', deviceController.getById)
router.post('/update/:deviceId', deviceController.update)

module.exports = router
