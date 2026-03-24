const RoleModel = require('../model/role')
const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const PermissionModel = require('../model/permission')

const roleService = {
    getAll: async (search = '', page = 1, limit = 10) => {
        try {
            search = RegExp(search, 'i')
            page = Number(page)
            limit = Number(limit)
            const [items, totalItems] = await Promise.all([
                RoleModel.find(
                    {
                        name: search,
                    },
                    { permissionIds: 0, __v: 0 },
                )
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                RoleModel.countDocuments({
                    name: search,
                }),
            ])

            const data = {
                items: items,
                page,
                totalItems,
                totalPage: Math.ceil(totalItems / limit),
            }
            return data
        } catch (error) {
            throw error
        }
    },
    create: async (role) => {
        try {
            const { name, description, permisisonIds } = role
            const checkName = await RoleModel.findOne({ name })
            if (checkName) {
                throw new BadReq(errorCode.ROLE_EXISTED)
            }
            await RoleModel.create({
                name,
                description,
                permisisonIds,
            })
            return checkName
        } catch (error) {
            throw error
        }
    },
    getById: async (roleId) => {
        try {
            const role = await RoleModel.findById(roleId, {
                __v: 0,
            })
            if (!role) {
                throw new BadReq(errorCode.ROLE_NOT_FOUND)
            }

            return role
        } catch (error) {
            throw error
        }
    },
    update: async (roleId, role) => {
        try {
            const { name, description, permissionIds } = role

            const checkName = await RoleModel.findOne({
                name,
                _id: { $ne: roleId },
            })
            if (checkName) {
                throw new BadReq(errorCode.ROLE_EXISTED)
            }
            const data = await RoleModel.findByIdAndUpdate(
                roleId,
                {
                    name,
                    description,
                    permissionIds,
                },
                {
                    new: true,
                    projection: { __v: 0 },
                },
            )
            return data
        } catch (error) {
            throw error
        }
    },
    delete: async (roleIds) => {
        try {
            await RoleModel.findByIdAndDelete(roleIds)
            return null
        } catch (error) {
            throw error
        }
    },
    getPermissionTree: async () => {
        try {
            const permissions = await PermissionModel.aggregate([
                { $match: { parentPermissionId: null } },
                {
                    $graphLookup: {
                        from: 'permissions',
                        startWith: '$_id',
                        connectFromField: '_id',
                        connectToField: 'parentPermissionId',
                        as: 'childPermission',
                        maxDepth: 1, // 1 = chỉ lấy con trực tiếp
                        depthField: 'level',
                    },
                },
                {
                    $project: {
                        name: 1,
                        code: 1,
                        description: 1,
                        childPermission: {
                            name: 1,
                            code: 1,
                            description: 1,
                        },
                    },
                },
            ])
            return permissions
        } catch (error) {
            throw error
        }
    },
}

module.exports = roleService
