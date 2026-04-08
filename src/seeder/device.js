const DeviceModel = require('../model/device')
const logger = require('../config/loggerConfig')

// 4 thiết bị cố định — upsert theo deviceRole (không ghi đè host/port đã chỉnh)
const DEVICES = [
    {
        deviceName: 'Scanner Nhập Kho',
        deviceType: 'SCANNER_IMPORT',
        host: '192.168.1.100',
        port: 23,
        isEnable: true,
        description: 'Cognex DataMan 290X - dây chuyền nhập kho',
    },
    {
        deviceName: 'Scanner Đầu Chuyền Xuất Kho',
        deviceType: 'SCANNER_EXPORT_ENTRY',
        host: '192.168.1.101',
        port: 23,
        isEnable: true,
        description: 'Scanner đầu dây chuyền xuất kho',
    },
    {
        deviceName: 'Scanner Cuối Chuyền Xuất Kho',
        deviceType: 'SCANNER_EXPORT_EXIT',
        host: '192.168.1.102',
        port: 23,
        isEnable: true,
        description: 'Scanner cuối dây chuyền xuất kho',
    },
    {
        deviceName: 'Máy In DOMINO',
        deviceType: 'PRINTER_DOMINO',
        host: '192.168.1.103',
        port: 9100,
        isEnable: true,
        description: 'Máy in nhãn DOMINO',
    },
]

async function deviceSeeder() {
    await DeviceModel.deleteMany({})
    await DeviceModel.insertMany(DEVICES)
    logger.info('Devices seeded')
}

module.exports = deviceSeeder
