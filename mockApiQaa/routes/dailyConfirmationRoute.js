const express = require('express')
const router = express.Router()

// In-memory store: `${manufactureBatchlot}|${date}` → confirmation record
const confirmationStore = new Map()

// POST /v1/dmc/daily-confirmation
router.post('/', (req, res) => {
    const { manufactureBatchlot, date, totalActivated, totalScanned } = req.body

    // Validation
    const errors = []
    if (!manufactureBatchlot) errors.push('manufactureBatchlot là bắt buộc')
    if (!date) errors.push('date là bắt buộc')
    if (totalActivated === undefined || totalActivated === null) errors.push('totalActivated là bắt buộc')
    if (totalScanned === undefined || totalScanned === null) errors.push('totalScanned là bắt buộc')

    if (errors.length > 0) {
        return res.status(422).json({
            success: false,
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errors,
            errorAt: 'ValidationError',
            errorCode: 'Validation failed',
        })
    }

    // Kiểm tra định dạng date YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            error: 'Bad Request',
            message: [`Ngày xác nhận không hợp lệ: ${date}`],
            errorAt: 'DailyConfirmation',
            errorCode: 'INVALID_CONFIRMATION_DATE',
        })
    }

    if (totalActivated < 0 || totalScanned < 0) {
        return res.status(422).json({
            success: false,
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: ['Trường totalActivated phải lớn hơn hoặc bằng 0'],
            errorAt: 'ValidationError',
            errorCode: 'Validation failed',
        })
    }

    const key = `${manufactureBatchlot}|${date}`

    // Giả lập LRT tự đếm (mock: lrtActivatedCount = totalActivated để khớp mặc định)
    // Có thể điều chỉnh để test trường hợp không khớp
    const lrtActivatedCount = totalActivated

    const record = {
        manufactureBatchlot,
        date,
        dmcTotalActivated: totalActivated,
        dmcTotalScanned: totalScanned,
        lrtActivatedCount,
        isMatched: totalActivated === lrtActivatedCount,
    }

    confirmationStore.set(key, record)

    console.log(`[Mock QAA] Daily confirmation: ${manufactureBatchlot} / ${date} — DMC=${totalActivated}, LRT=${lrtActivatedCount}, matched=${record.isMatched}`)

    return res.status(200).json({
        success: true,
        statusCode: 200,
        data: record,
    })
})

module.exports = router
