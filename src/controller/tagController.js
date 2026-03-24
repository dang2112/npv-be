const tagService = require('../service/tagService')
const { response } = require('../util/response/response')

const tagController = {
    getAll: async (req, res, next) => {
        try {
            const { search = '', page = 1, limit = 10 } = req.query
            const result = await tagService.getAll(
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
            const { tagId } = req.params
            const result = await tagService.getById(tagId)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    create: async (req, res, next) => {
        try {
            const currentUser = req.user
            const tag = req.body
            const result = await tagService.create(tag, currentUser)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const currentUser = req.user
            const { tagId } = req.params
            const tag = req.body
            const result = await tagService.update(tagId, tag, currentUser)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { tagIds } = req.body
            const result = await tagService.delete(tagIds)
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    },
}

module.exports = tagController
