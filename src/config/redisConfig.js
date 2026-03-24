const redis = require('redis')
const logger = require('./loggerConfig')
const clientRedis = new redis.createClient({
    url: process.env.REDIS_PASSWORD
        ? `redis://${process.env.REDIS_USERNAME}:${encodeURIComponent(process.env.REDIS_PASSWORD)}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        : null,
})

clientRedis.on('error', (error) => logger.error('Redis error: ' + error))
clientRedis.on('connect', () => logger.info('Redis connected!'))
clientRedis.on('ready', () => logger.info('Redis ready!'))
clientRedis.on('reconnecting', () => logger.info('Redis reconnecting!'))

const connectRedis = async () => {
    await clientRedis.connect()
}
connectRedis()
module.exports = { clientRedis }
