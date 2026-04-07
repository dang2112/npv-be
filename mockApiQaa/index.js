const express = require('express')

const app = express()
const PORT = 3099
const API_KEY = 'mock-api-key-qaa'

app.use(express.json())

// Auth middleware — kiểm tra x-api-key header
app.use((req, res, next) => {
    if (req.path === '/health') return next()
    const apiKey = req.headers['x-api-key']
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            error: 'Unauthorized',
            message: [],
            errorAt: 'ApiKeyGuard',
            errorCode: 'Invalid or missing API key',
        })
    }
    next()
})

app.use('/v1/dmc/batchlot', require('./routes/batchlotRoute'))
app.use('/v1/dmc/qr-code/activation', require('./routes/activationRoute'))
app.use('/v1/dmc/daily-confirmation', require('./routes/dailyConfirmationRoute'))

// Giữ lại /do cho các mục đích khác (Delivery Order)
app.use('/do', require('./routes/doRoute'))

// Health check (không cần auth)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'Mock QAA API (Lubrytics)', port: PORT })
})

app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: [`Endpoint không tồn tại: ${req.method} ${req.path}`],
        errorAt: 'Router',
        errorCode: 'ENDPOINT_NOT_FOUND',
    })
})

app.listen(PORT, () => {
    console.log(`[Mock QAA] Server chạy tại http://localhost:${PORT}`)
    console.log(`[Mock QAA] API Key (x-api-key): ${API_KEY}`)
    console.log(`[Mock QAA] Endpoints:`)
    console.log(`  POST  /v1/dmc/batchlot/sync`)
    console.log(`  PATCH /v1/dmc/qr-code/activation`)
    console.log(`  POST  /v1/dmc/daily-confirmation`)
    console.log(`  GET   /do/:code`)
})
