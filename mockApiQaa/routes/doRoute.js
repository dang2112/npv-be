const express = require('express')
const router = express.Router()
const dos = require('../data/dos')

// GET /do/:code
router.get('/:code', (req, res) => {
    const { code } = req.params
    const data = dos[code]

    if (!data) {
        return res.status(404).json({
            status: 404,
            message: 'Mã DO không tồn tại',
        })
    }

    return res.status(200).json(data)
})

module.exports = router
