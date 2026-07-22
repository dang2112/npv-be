const { Types } = require('mongoose')

const logger = require('../config/loggerConfig')
const ApiModel = require('../model/api')

async function apiSeeder() {
    await ApiModel.deleteMany({})
    await ApiModel.insertMany([
        {
            _id: new Types.ObjectId('69421efb11023ff2bc3145cb'),
            api: '/user/getAll',
            description: 'Xem toàn bộ danh sách user',
        },
        {
            _id: new Types.ObjectId('69421efb11023ff2bc3145cc'),
            api: '/user/getById',
            description: 'Xem user theo id',
        },
        {
            _id: new Types.ObjectId('69421efb11023ff2bc3145cd'),
            api: '/user/create',
            description: 'Tạo user',
        },
        {
            _id: new Types.ObjectId('69421efb11023ff2bc3145ce'),
            api: '/user/update',
            description: 'Cập nhật user',
        },
        {
            _id: new Types.ObjectId('69421efb11023ff2bc3145cf'),
            api: '/user/delete',
            description: 'Xóa user',
        },
        {
            _id: new Types.ObjectId('6942693d89312409bc036897'),
            api: '/user/resetPassword',
            description: 'Reset password user',
        },

        {
            _id: new Types.ObjectId('694248bc0d4895ec246b60d7'),
            api: '/role/getAll',
            description: 'Xem toàn bộ danh sách role',
        },
        {
            _id: new Types.ObjectId('694248bc0d4895ec246b60d8'),
            api: '/role/getById',
            description: 'Xem role theo id',
        },
        {
            _id: new Types.ObjectId('694248bc0d4895ec246b60d9'),
            api: '/role/create',
            description: 'Tạo role',
        },
        {
            _id: new Types.ObjectId('694248bc0d4895ec246b60da'),
            api: '/role/update',
            description: 'Cập nhật role',
        },
        {
            _id: new Types.ObjectId('694248bc0d4895ec246b60db'),
            api: '/role/delete',
            description: 'Xóa role',
        },
        {
            _id: new Types.ObjectId('6942750b753cbc1aef840fc2'),
            api: '/role/getPermissionTree',
            description: 'Get phân quyền',
        },
        // Device
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef2'),
            api: '/device/getAll',
            description: 'Xem toàn bộ danh sách device',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef3'),
            api: '/device/getById',
            description: 'Xem device theo id',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef4'),
            api: '/device/create',
            description: 'Tạo device',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef5'),
            api: '/device/update',
            description: 'Cập nhật device',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef6'),
            api: '/device/delete',
            description: 'Xóa device',
        },
        // Tag
        {
            _id: new Types.ObjectId('69427ba57dfdd70755b34fce'),
            api: '/tag/getAll',
            description: 'Xem toàn bộ danh sách tag',
        },
        {
            _id: new Types.ObjectId('69427ba57dfdd70755b34fcf'),
            api: '/tag/getById',
            description: 'Xem tag theo id',
        },
        {
            _id: new Types.ObjectId('69427ba57dfdd70755b34fd0'),
            api: '/tag/create',
            description: 'Tạo tag',
        },
        {
            _id: new Types.ObjectId('69427ba57dfdd70755b34fd1'),
            api: '/tag/update',
            description: 'Cập nhật tag',
        },
        {
            _id: new Types.ObjectId('69427ba57dfdd70755b34fd2'),
            api: '/tag/delete',
            description: 'Xóa tag',
        },
        // Goods Receipt (Nhập kho)
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef7'),
            api: '/goodsReceipt/getAll',
            description: 'Xem danh sách lô nhập kho',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef8'),
            api: '/goodsReceipt/getById',
            description: 'Xem chi tiết lô nhập kho theo id',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fef9'),
            api: '/goodsReceipt/getScanning',
            description: 'Lấy lô nhập kho đang quét',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fefa'),
            api: '/goodsReceipt/getBatchlotInfo',
            description: 'Đồng bộ thông tin lô hàng từ QAA',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fefb'),
            api: '/goodsReceipt/getCompletionSummary',
            description: 'Thống kê hoàn thành lô hàng',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fefc'),
            api: '/goodsReceipt/getAllConfigs',
            description: 'Xem cấu hình đóng gói',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fefd'),
            api: '/goodsReceipt/createConfig',
            description: 'Tạo cấu hình đóng gói mới',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188fefe'),
            api: '/goodsReceipt/unPack',
            description: 'Hủy đóng thùng/quét lại',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188feff'),
            api: '/goodsReceipt/updateConfig',
            description: 'Cập nhật cấu hình đóng gói',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188ff00'),
            api: '/goodsReceipt/deleteConfig',
            description: 'Xóa cấu hình đóng gói',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188ff01'),
            api: '/goodsReceipt/update',
            description: 'Cập nhật đơn hàng nhập kho',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188ff02'),
            api: '/goodsReceipt/activateQRcode',
            description: 'Kích hoạt mã QR lẻ',
        },
        // Integration History (Lịch sử tích hợp)
        {
            _id: new Types.ObjectId('69428016b05eb437b188ff03'),
            api: '/integrationHistory/getAll',
            description: 'Xem lịch sử tích hợp',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188ff04'),
            api: '/integrationHistory/getById',
            description: 'Xem chi tiết lịch sử tích hợp theo id',
        },
        {
            _id: new Types.ObjectId('69428016b05eb437b188ff05'),
            api: '/integrationHistory/delete',
            description: 'Xóa lịch sử tích hợp',
        },
    ])
    logger.info('Apis seeded')
}

module.exports = apiSeeder
