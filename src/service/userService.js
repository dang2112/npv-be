const bcrypt = require('bcryptjs')
const UserModel = require('../model/user')
const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const { constant } = require('../util/constant')
const { buildSearchRegex } = require('../util/regex')
const { validatePassword } = require('../util/validation')

const userService = {
    getAll: async (search = '', page = 1, limit = 10) => {
        try {
            search = buildSearchRegex(search)
            page = Number(page)
            limit = Number(limit)

            const [items, totalItems] = await Promise.all([
                UserModel.find(
                    {
                        username: {
                            $ne: 'root',
                        },
                        fullname: search,
                    },
                    { password: 0, __v: 0 },
                )
                    .populate({
                        path: 'roleId',
                        select: { _id: 1, name: 1 },
                    })
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                UserModel.countDocuments({
                    username: {
                        $ne: 'root',
                    },
                    fullname: search,
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
    create: async (user) => {
        try {
            const { fullname, username, password, confirmPassword, roleId } =
                user

            // Validate password matching and rules
            validatePassword(password, confirmPassword)

            const checkUsername = await UserModel.findOne({ username })
            if (checkUsername) {
                throw new BadReq(errorCode.USER_EXISTED)
            }

            const hashPass = await bcrypt.hash(password, 10)

            await UserModel.create({
                fullname,
                username,
                password: hashPass,
                roleId,
            })

            return null
        } catch (error) {
            throw error
        }
    },
    getById: async (userId) => {
        try {
            const data = await UserModel.findById(userId, {
                password: 0,
                __v: 0,
            }).populate({ path: 'roleId', select: { _id: 1, name: 1 } })

            if (!data) {
                throw new BadReq(errorCode.USER_NOT_FOUND)
            }

            return data
        } catch (error) {
            throw error
        }
    },
    update: async (userId, user) => {
        try {
            const { fullname, username, roleId, isLock, isLocked } = user
            const checkUsername = await UserModel.findOne({
                username,
                _id: { $ne: userId },
            })
            if (checkUsername) {
                throw new BadReq(errorCode.USER_EXISTED)
            }

            const updateFields = {
                fullname,
                username,
            }
            if (roleId !== undefined) {
                updateFields.roleId = roleId
            }

            // support both isLock and isLocked fields in update request
            const finalLocked = isLocked !== undefined ? isLocked : isLock
            if (finalLocked !== undefined) {
                updateFields.isLocked = !!finalLocked
                if (!finalLocked) {
                    updateFields.failedLoginAttempts = 0
                }
            }

            const data = await UserModel.findByIdAndUpdate(
                userId,
                updateFields,
                {
                    new: true,
                    projection: { password: 0, __v: 0 },
                },
            ).populate({ path: 'roleId', select: { _id: 1, name: 1 } })

            return data
        } catch (error) {
            throw error
        }
    },
    delete: async (userIds) => {
        try {
            await UserModel.deleteMany({ _id: { $in: userIds } })
            return null
        } catch (error) {
            throw error
        }
    },
    resetPassword: async (userId, data) => {
        try {
            const { newPassword } = data
            const user = await UserModel.findById(userId)

            if (!user) {
                throw new BadReq(errorCode.USER_NOT_FOUND)
            }

            const hashPass = await bcrypt.hash(newPassword, 10)

            await UserModel.findByIdAndUpdate(userId, {
                password: hashPass,
                failedLoginAttempts: 0,
                isLocked: false,
            })

            return null
        } catch (error) {
            throw error
        }
    },
}

module.exports = { userService }
