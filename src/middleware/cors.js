const cors = require('cors')
const whitelist = []
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(response.cors())
        }
    },
}
const corsMiddleware = cors()
module.exports = { corsMiddleware }
