const { response } = require('../util/response/response')
const { userService } = require('../service/userService')

const userController = {
    getAll: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await userService.getAll(
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
            const { userId } = req.params
            const result = await userService.getById(userId)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const user = req.body
            const result = await userService.create(user)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const { userId } = req.params
            const user = req.body
            const result = await userService.update(userId, user)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            const { userId } = req.params
            const result = await userService.resetPassword(userId, req.body)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { userIds } = req.body
            const result = await userService.delete(userIds)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = userController
