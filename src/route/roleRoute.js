const express = require('express')
const roleController = require('../controller/roleController')
const router = express.Router()

router.get('/getAll', roleController.getAll)
router.get('/getById/:roleId', roleController.getById)
router.post('/create', roleController.create)
router.post('/update/:roleId', roleController.update)
router.post('/delete', roleController.delete)
router.get('/getPermissionTree', roleController.getPermissionTree)

module.exports = router
