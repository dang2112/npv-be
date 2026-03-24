const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const DeviceModel = require('../model/device')

const deviceService = {
    getAll: async (search = '', page = 1, limit = 10) => {
        try {
            search = RegExp(search, 'i')
            page = Number(page)
            limit = Number(limit)

            const [items, totalItems] = await Promise.all([
                DeviceModel.find(
                    {
                        deviceName: search,
                    },
                    { __v: 0 },
                )
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                DeviceModel.countDocuments({
                    deviceName: search,
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
    create: async (device) => {
        try {
            const { deviceName } = device
            const checkName = await DeviceModel.findOne({ deviceName })
            if (checkName) {
                throw new BadReq(errorCode.DEVICE_EXISTED)
            }

            await DeviceModel.create(device)

            return null
        } catch (error) {
            throw error
        }
    },
    getById: async (deviceId) => {
        try {
            const data = await DeviceModel.findById(deviceId, {
                __v: 0,
            })

            if (!data) {
                throw new BadReq(errorCode.DEVICE_NOT_FOUND)
            }

            return data
        } catch (error) {
            throw error
        }
    },
    update: async (deviceId, device) => {
        try {
            const { deviceName } = device
            const checkDevice = await DeviceModel.findById(deviceId)
            if (!checkDevice) {
                throw new BadReq(errorCode.DEVICE_NOT_FOUND)
            }
            const checkName = await DeviceModel.findOne({
                deviceName,
                _id: { $ne: deviceId },
            })
            if (checkName) {
                throw new BadReq(errorCode.DEVICE_EXISTED)
            }
            const data = await DeviceModel.findByIdAndUpdate(deviceId, device, {
                new: true,
                projection: { __v: 0 },
            })
            return data
        } catch (error) {
            throw error
        }
    },
    delete: async (deviceIds) => {
        try {
            await DeviceModel.deleteMany({ _id: { $in: deviceIds } })
            return null
        } catch (error) {
            throw error
        }
    },
}

module.exports = deviceService
