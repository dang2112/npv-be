const express = require('express')
const deviceController = require('../controller/deviceController')
const router = express.Router()

router.get('/getAll', deviceController.getAll)
router.get('/getById/:deviceId', deviceController.getById)
router.post('/create', deviceController.create)
router.post('/update/:deviceId', deviceController.update)
router.post('/delete', deviceController.delete)

module.exports = router
