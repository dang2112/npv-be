const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const helmet = require('helmet')
const compression = require('compression')

require('./config/mongodbConfig')
require('./config/redisConfig')
const { seedDevices } = require('./seeder/deviceSeeder')
seedDevices()

const { envConfig } = require('./config/envConfig')
const { limiter } = require('./middleware/rateLimit')
const { authenticated } = require('./middleware/auth')
const { corsMiddleware } = require('./middleware/cors')
const { BadReq } = require('./util/response/requestError')
const { response } = require('./util/response/response')
const { connectSocket } = require('./socket/socket')
const logger = require('./config/loggerConfig')
const routes = require('./route')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
    },
})

app.use(limiter)
app.use(helmet())
app.use(corsMiddleware)
app.use(compression({ threshold: 100 * 1000 }))
app.use(express.json())

app.use(authenticated)
app.use(envConfig.BASE_URL, routes)

app.use((req, res, next) => {
    next(response.notFound())
})
app.use((error, req, res, next) => {
    if (error instanceof BadReq) {
        return res.status(error.status).json(response.badRequest(error))
    }
    logger.error(error)
    return res.status(error.status || 500).json(response.serverError(error))
})

global._io = io
io.on('connection', connectSocket)

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason)
    logger.error(reason?.stack || reason)
})
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error)
    logger.error(error?.stack || error)
})

const port = envConfig.PORT
server.listen(port, () => {
    logger.info(`Server listing at port ${port}`)
})
