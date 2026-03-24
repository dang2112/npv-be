const express = require('express')
const authController = require('../controller/authController')

const router = express.Router()

router.post('/login', authController.login)
router.get('/getUserLoginDetail', authController.getUserLoginDetail)
router.post('/changePassword', authController.changePassword)
router.post('/logout', authController.logout)

module.exports = router
