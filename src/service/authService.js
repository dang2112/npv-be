const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { clientRedis } = require('../config/redisConfig')
const UserModel = require('../model/user')
const { envConfig } = require('../config/envConfig')
const { errorCode } = require('../util/response/errorCode')
const { BadReq } = require('../util/response/requestError')
const { constant } = require('../util/constant')
const RoleModel = require('../model/role')
const ApiModel = require('../model/api')
const PermissionModel = require('../model/permission')

const authService = {
    login: async (username, password) => {
        try {
            const user = await UserModel.findOne({ username }).lean()
            if (!user) {
                throw new BadReq(errorCode.INCORRECT_USERNAME)
            }
            const comparePassword = await bcrypt.compare(
                password,
                user.password,
            )

            if (!comparePassword) {
                throw new BadReq(errorCode.INCORRECT_PASSWORD)
            }
            delete user.password
            const ts = Date.now()
            const accessToken = jwt.sign(
                { user: user, ts },
                envConfig.JWT_ACCESS_TOKEN_PRIVATE_KEY,
                { expiresIn: Number(envConfig.JWT_ACCESS_TOKEN_EXPIRES) },
            )

            // set redis
            await clientRedis.set(
                `${constant.REDIS_PREFIX_ACCESS_TOKEN}_${user._id}_${ts}`,
                accessToken,
                {
                    EX: envConfig.JWT_ACCESS_TOKEN_EXPIRES,
                },
            )

            let apis = []
            if (user.username == constant.USER_ROOT) {
                apis = await ApiModel.find()
                apis = apis.map((api) => api.api)
            } else {
                const role = await RoleModel.findById(user.roleId).populate({
                    path: 'permissionIds',
                    populate: 'apiIds',
                })
                if (role.permissionIds) {
                    for (let permission of role.permissionIds) {
                        if (permission.apiIds) {
                            apis.push(
                                ...permission?.apiIds?.map((api) => api.api),
                            )
                        }
                    }
                }
            }

            await clientRedis.set(
                `${constant.REDIS_PREFIX_PERMISSION}_${user.id}`,
                JSON.stringify(apis),
                {
                    EX: envConfig.JWT_ACCESS_TOKEN_EXPIRES,
                },
            )

            return accessToken
        } catch (error) {
            throw error
        }
    },
    logout: async (payloadToken) => {
        try {
            await clientRedis.del(
                `${constant.REDIS_PREFIX_ACCESS_TOKEN}_${payloadToken.user}_${payloadToken.ts}`,
            )
            return null
        } catch (error) {
            throw error
        }
    },
    getUserLoginDetail: async (currentUser) => {
        try {
            const user = await UserModel.findById(currentUser._id, {
                password: 0,
                __v: 0,
            }).lean()
            if (!user) {
                throw new BadReq(errorCode.USER_NOT_FOUND)
            }

            if (user.username == constant.USER_ROOT) {
                const permissions = await PermissionModel.find()

                const permissionCodeList = new Set()
                permissions.forEach((permission) => {
                    permissionCodeList.add(permission.code)
                })
                user.permissionCodeList = [...permissionCodeList]
            } else {
                const role = await RoleModel.findById(user.roleId).populate(
                    'permissionIds',
                    'code',
                )
                const permissionCodeList = new Set()
                role.permissionIds.forEach((permission) => {
                    permissionCodeList.add(permission?.code)
                })
                user.permissionCodeList = [...permissionCodeList]
            }
            const role = process.env.ROLE || 'ROLE_IMPORT'
            user.role = role
            return user
        } catch (error) {
            throw error
        }
    },
    changePassword: async (currentUser, newPassword) => {
        try {
            const user = await UserModel.findById(currentUser._id)
            if (!user) {
                throw new BadReq(errorCode.USER_NOT_FOUND)
            }
            const hashPass = await bcrypt.hash(newPassword, 10)
            await UserModel.findByIdAndUpdate(currentUser._id, {
                password: hashPass,
            })
            return null
        } catch (error) {
            throw error
        }
    },
}

module.exports = authService
