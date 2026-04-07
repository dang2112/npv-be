const deviceService = require('../service/deviceService')
const { response } = require('../util/response/response')

const deviceController = {
    getAll: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await deviceService.getAll(search, Number(page), Number(limit))
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },

    getById: async (req, res, next) => {
        try {
            const { deviceId } = req.params
            const result = await deviceService.getById(deviceId)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },

    update: async (req, res, next) => {
        try {
            const { deviceId } = req.params
            const result = await deviceService.update(deviceId, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = deviceController
