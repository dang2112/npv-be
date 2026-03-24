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
    ])
    logger.info('Apis seeded')
}

module.exports = apiSeeder
