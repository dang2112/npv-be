const express = require('express')
const integrationHistoryController = require('../controller/integrationHistoryController')
const router = express.Router()

router.get('/getAll', integrationHistoryController.getAll)
router.get(
    '/getById/:integrationHistoryId',
    integrationHistoryController.getById,
)
router.post('/delete', integrationHistoryController.delete)

module.exports = router
