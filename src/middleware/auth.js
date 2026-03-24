const jwt = require('jsonwebtoken')
const { logger } = require('../config/loggerConfig')
const { clientRedis } = require('../config/redisConfig')
const { response } = require('../util/response/response')
const { constant } = require('../util/constant')
const { envConfig } = require('../config/envConfig')

const authenticated = async (req, res, next) => {
    try {
        if (req.originalUrl.split('?')[0].endsWith('login')) {
            return next()
        }
        const { authorization } = req.headers
        if (!authorization) {
            return res.status(401).json(response.unauthorized('Không có token'))
        }
        const accessToken = authorization.split(' ')[1]
        let decoded
        try {
            decoded = jwt.verify(
                accessToken,
                envConfig.JWT_ACCESS_TOKEN_PRIVATE_KEY,
            )
        } catch (error) {
            return res.status(401).json(response.unauthorized(error.message))
        }
        const token = await clientRedis.get(
            `${constant.REDIS_PREFIX_ACCESS_TOKEN}_${decoded.user._id}_${decoded.ts}`,
        )

        if (!token) {
            return res.status(401).json(response.unauthorized('Không có token'))
        }
        req.user = decoded.user
        req.tokenTs = decoded.user
        next()
    } catch (error) {
        logger.error(error)
        next(response.serverError(error))
    }
}

const checkPermission = async (req, res, next) => {
    try {
        let permission = false
        const listApiNotCheck = [
            '/login',
            '/getUserLoginDetail',
            '/getTechnicianLoginDetail',
            '/changePassword',
            '/logout',
        ]
        let url = req.originalUrl.split('?')[0]
        const mongoIdRegex = /^[a-f\d]{24}$/i
        const arrayUrl = url.split('/')
        if (mongoIdRegex.test(arrayUrl[arrayUrl.length - 1])) {
            arrayUrl.pop()
            url = arrayUrl.join('/')
        }
        if (listApiNotCheck.every((api) => !url.endsWith(api))) {
            const listApi = await clientRedis.get(
                `${constant.REDIS_PREFIX_PERMISSION}_${req.userId}`,
            )
            if (!listApi) {
                return res
                    .status(401)
                    .json(response.unauthorized('Không có token'))
            }
            for (let api of JSON.parse(listApi)) {
                if (url.endsWith(api)) {
                    permission = true
                    break
                }
            }
        } else {
            permission = true
        }
        if (!permission) {
            return res.status(403).json(response.forbidden('Không có quyền'))
        }
        next()
    } catch (error) {
        next(response.serverError(error))
        logger.error(error)
    }
}

module.exports = { authenticated, checkPermission }
