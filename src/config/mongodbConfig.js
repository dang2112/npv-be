const mongoose = require('mongoose')
const { envConfig } = require('./envConfig')
const logger = require('./loggerConfig')

const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = envConfig

const LOGIN_DB = DB_USERNAME
    ? `${DB_USERNAME}:${encodeURIComponent(DB_PASSWORD)}@`
    : ''

const ATLAS_DB = DB_HOST?.includes('mongodb.net')

const mongoURI = `mongodb${ATLAS_DB ? '+srv' : ''}://${LOGIN_DB}${DB_HOST}${ATLAS_DB ? '' : `:${DB_PORT}`}/${DB_NAME}`

const options = {
    autoIndex: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
}

let isConnectedBefore = false
let reconnectTimeout = null
async function connectMongoDB() {
    clearTimeout(reconnectTimeout)
    try {
        await mongoose.connect(mongoURI, options)
        isConnectedBefore = true
    } catch (err) {
        logger.error('MongoDB connection error!')
        logger.error(err.stack || err)
        if (!isConnectedBefore && !reconnectTimeout) {
            logger.info('Retry in 5 seconds...')
            reconnectTimeout = setTimeout(connectMongoDB, 5000)
        }
    }
}

// mongoose.connection.on('error', err => {
//     logger.error('MongoDB error!')
//     logger.error(err.stack || err)
// })

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected')
    if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null
            connectMongoDB()
        }, 5000)
    }
})

mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected')
})

mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected')
})

connectMongoDB()
