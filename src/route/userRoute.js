const express = require('express')
const userController = require('../controller/userController')
const router = express.Router()

router.get('/getAll', userController.getAll)
router.get('/getById/:userId', userController.getById)
router.post('/create', userController.create)
router.post('/update/:userId', userController.update)
router.post('/resetPassword/:userId', userController.resetPassword)
router.post('/delete', userController.delete)

module.exports = router
