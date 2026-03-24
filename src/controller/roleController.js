const roleService = require('../service/roleService')
const { response } = require('../util/response/response')

const roleController = {
    getAll: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await roleService.getAll(
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
            const { roleId } = req.params
            const result = await roleService.getById(roleId)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const user = req.body
            const result = await roleService.create(user)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const { roleId } = req.params
            const user = req.body
            const result = await roleService.update(roleId, user)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { roleIds } = req.body
            const result = await roleService.delete(roleIds)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    getPermissionTree: async (req, res, next) => {
        try {
            const result = await roleService.getPermissionTree()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = roleController
