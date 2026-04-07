const express = require('express')
const router = express.Router()

// Giả lập danh sách QR đã kích hoạt (in-memory)
const activatedQRs = new Set()

// POST /qrcode-activate
router.post('/', (req, res) => {
    const { qrcodes } = req.body

    if (!qrcodes || !Array.isArray(qrcodes) || qrcodes.length === 0) {
        return res.status(400).json({
            status: 400,
            message: 'Danh sách qrcodes không hợp lệ',
        })
    }

    const errors = []

    for (const qr of qrcodes) {
        if (activatedQRs.has(qr)) {
            // Đã kích hoạt trước đó — vẫn cho phép (idempotent)
            console.log(`[Mock QAA] QR đã kích hoạt trước đó: ${qr}`)
        } else {
            activatedQRs.add(qr)
            console.log(`[Mock QAA] Kích hoạt QR: ${qr}`)
        }
    }

    if (errors.length > 0) {
        return res.status(404).json({
            status: '404',
            message: 'Cập nhật thất bại',
            errors,
        })
    }

    return res.status(200).json({
        status: '200',
        message: 'Đã cập nhật thành công',
        errors: [],
    })
})

// GET /qrcode-activate/activated — endpoint phụ để kiểm tra trạng thái (chỉ dùng khi test)
router.get('/activated', (req, res) => {
    return res.status(200).json({
        total: activatedQRs.size,
        qrcodes: Array.from(activatedQRs),
    })
})

module.exports = router
