const redis = require('redis')
const logger = require('./loggerConfig')
const redisUrl = process.env.REDIS_PASSWORD
    ? `redis://${process.env.REDIS_USERNAME || 'default'}:${encodeURIComponent(process.env.REDIS_PASSWORD)}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    : `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`

const clientRedis = new redis.createClient({ url: redisUrl })

clientRedis.on('error', (error) => logger.error('Redis error: ' + error))
clientRedis.on('connect', () => logger.info('Redis connected!'))
clientRedis.on('ready', () => logger.info('Redis ready!'))
clientRedis.on('reconnecting', () => logger.info('Redis reconnecting!'))

const connectRedis = async () => {
    await clientRedis.connect()
}
connectRedis()
module.exports = { clientRedis }
