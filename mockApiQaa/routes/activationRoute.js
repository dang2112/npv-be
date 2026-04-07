const express = require('express')
const router = express.Router()

// In-memory store: qrCode → { activationStatus, activatedAt, updatedAt }
const qrStore = new Map()

// PATCH /v1/dmc/qr-code/activation
router.patch('/', (req, res) => {
    const { qrCode, activationStatus, activatedAt } = req.body

    if (qrCode === undefined || activationStatus === undefined) {
        return res.status(422).json({
            success: false,
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: ['qrCode và activationStatus là bắt buộc'],
            errorAt: 'ValidationError',
            errorCode: 'Validation failed',
        })
    }

    if (![0, 1, -1].includes(activationStatus)) {
        return res.status(422).json({
            success: false,
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: ['activationStatus phải là 0, 1 hoặc -1'],
            errorAt: 'ValidationError',
            errorCode: 'Validation failed',
        })
    }

    if (activationStatus === 1 && !activatedAt) {
        return res.status(422).json({
            success: false,
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: ['Trường activatedAt không hợp lệ', 'Trường activatedAt là bắt buộc khi kích hoạt'],
            errorAt: 'ValidationError',
            errorCode: 'Validation failed',
        })
    }

    const now = new Date().toISOString()
    qrStore.set(qrCode, { activationStatus, activatedAt: activatedAt || null, updatedAt: now })

    console.log(`[Mock QAA] Cập nhật QR ${qrCode}: activationStatus=${activationStatus}`)

    return res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
            qrCode,
            activationStatus,
            activatedAt: activatedAt || null,
            updatedAt: now,
        },
    })
})

// GET /v1/dmc/qr-code/activation/all — chỉ dùng khi test
router.get('/all', (req, res) => {
    return res.status(200).json({
        total: qrStore.size,
        records: Object.fromEntries(qrStore),
    })
})

module.exports = router
