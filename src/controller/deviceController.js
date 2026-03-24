const deviceService = require('../service/deviceService')
const { response } = require('../util/response/response')

const deviceController = {
    getAll: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await deviceService.getAll(
                search,
                Number(page),
                Number(limit),
            )
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
    create: async (req, res, next) => {
        try {
            const device = req.body
            const result = await deviceService.create(device)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const { deviceId } = req.params
            const device = req.body
            const result = await deviceService.update(deviceId, device)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { deviceIds } = req.body
            const result = await deviceService.delete(deviceIds)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = deviceController
