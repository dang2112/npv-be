const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const DeviceModel = require('../model/device')
const deviceManager = require('../device/deviceManager')

// Map deviceType → trạng thái connected tương ứng trong deviceManager.getStatus()
const TYPE_CONNECTED_MAP = (runtime) => ({
    SCANNER_IMPORT: runtime.importLine.scanner.connected,
    SCANNER_EXPORT_ENTRY: runtime.exportLine.entryScanner.connected,
    SCANNER_EXPORT_EXIT: runtime.exportLine.exitScanner.connected,
    PRINTER_DOMINO: runtime.exportLine.printer.connected,
})

const deviceService = {
    getAll: async (search = '', page = 1, limit = 10) => {
        try {
            search = RegExp(search, 'i')
            page = Number(page)
            limit = Number(limit)

            const [items, totalItems] = await Promise.all([
                DeviceModel.find({ deviceName: search }, { __v: 0 })
                    .sort({ createdAt: 1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                DeviceModel.countDocuments({ deviceName: search }),
            ])

            return { items, page, totalItems, totalPage: Math.ceil(totalItems / limit) }
        } catch (error) {
            throw error
        }
    },

    getById: async (deviceId) => {
        try {
            const data = await DeviceModel.findById(deviceId, { __v: 0 })
            if (!data) throw new BadReq(errorCode.DEVICE_NOT_FOUND)
            return data
        } catch (error) {
            throw error
        }
    },

    update: async (deviceId, device) => {
        try {
            const checkDevice = await DeviceModel.findById(deviceId)
            if (!checkDevice) throw new BadReq(errorCode.DEVICE_NOT_FOUND)

            const checkName = await DeviceModel.findOne({ deviceName: device.deviceName, _id: { $ne: deviceId } })
            if (checkName) throw new BadReq(errorCode.DEVICE_EXISTED)

            if (device.host && device.port && device.isEnable) {
                await deviceManager.connectImportLine(device)
            }

            if (device.isEnable) {
                switch (checkDevice.deviceType) {
                    case 'SCANNER_IMPORT':
                        await deviceManager.connectImportLine(checkDevice)
                        break;
                }
            } else {
                switch (checkDevice.deviceType) {
                    case 'SCANNER_IMPORT':
                        await deviceManager.disconnectImportLine()
                        break;
                }

            }
            const data = await DeviceModel.findByIdAndUpdate(deviceId, device, { new: true, projection: { __v: 0 } })
            return data
        } catch (error) {
            throw error
        }
    },

    /**
     * Trả về danh sách 4 thiết bị từ DB, mỗi thiết bị kèm trạng thái kết nối runtime.
     */
    getStatus: async () => {
        try {
            const devices = await DeviceModel.find({}, { __v: 0 }).sort({ createdAt: 1 }).lean()
            const connectedMap = TYPE_CONNECTED_MAP(deviceManager.getStatus())
            return devices.map((d) => ({ ...d, connected: connectedMap[d.deviceType] ?? false }))
        } catch (error) {
            throw error
        }
    },
}

module.exports = deviceService
