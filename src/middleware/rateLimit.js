const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Request quá nhiều',
    skipSuccessfulRequests: true,
    handler: (req, res, next, option) => {
        next({
            status: option.statusCode,
            code: -1,
            message: option.message,
            data: null,
        })
    },
})

module.exports = { limiter }
