const express = require('express')
const router = express.Router()
const batchlots = require('../data/batchlots')

// POST /v1/dmc/batchlot/sync
router.post('/sync', (req, res) => {
    const { manufactureBatchlot, createdAt } = req.body

    if (!manufactureBatchlot) {
        return res.status(422).json({
            success: false,
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: ['manufactureBatchlot là bắt buộc'],
            errorAt: 'ValidationError',
            errorCode: 'Validation failed',
        })
    }

    const data = batchlots[manufactureBatchlot]

    if (!data) {
        return res.status(404).json({
            success: false,
            statusCode: 404,
            error: 'Not Found',
            message: [`Không tìm thấy QR Code cho Batch Lot: ${manufactureBatchlot}`],
            errorAt: 'SyncBatchlot',
            errorCode: 'BATCHLOT_QR_NOT_FOUND',
        })
    }

    let qrCodes = data.qrCodes

    // Đồng bộ tăng dần: lọc theo createdAt nếu có
    if (createdAt) {
        const since = new Date(createdAt)
        if (isNaN(since.getTime())) {
            return res.status(422).json({
                success: false,
                statusCode: 422,
                error: 'Unprocessable Entity',
                message: ['createdAt không đúng định dạng ISO 8601'],
                errorAt: 'ValidationError',
                errorCode: 'Validation failed',
            })
        }
        qrCodes = qrCodes.filter((qr) => new Date(qr.createdAt) > since)
    }

    return res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
            manufactureBatchlot: data.manufactureBatchlot,
            totalCount: qrCodes.length,
            qrCodes,
        },
    })
})

module.exports = router
