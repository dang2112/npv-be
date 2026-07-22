const { Types } = require('mongoose')

const logger = require('../config/loggerConfig')
const PermissionModel = require('../model/permission')

async function permissionSeeder() {
    await PermissionModel.deleteMany({})
    await PermissionModel.insertMany([
        // Dashboard
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb7b'),
            name: 'Dashboard',
            code: 'dashboard',
            description: '',
            parentPermissionId: null,
            apiIds: null,
        },
        // Device
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb7c'),
            name: 'Device',
            code: 'device',
            description: '',
            parentPermissionId: null,
            apiIds: null,
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b707'),
            name: 'Read',
            code: 'device-read',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7c',
            apiIds: ['69428016b05eb437b188fef2', '69428016b05eb437b188fef3'],
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b708'),
            name: 'Create',
            code: 'device-create',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7c',
            apiIds: [
                '69428016b05eb437b188fef4',
                '69427ba57dfdd70755b34fce',
                '69427ba57dfdd70755b34fcf',
                '69427ba57dfdd70755b34fd0',
                '69427ba57dfdd70755b34fd1',
                '69427ba57dfdd70755b34fd2',
            ],
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b709'),
            name: 'Update',
            code: 'device-update',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7c',
            apiIds: [
                '69428016b05eb437b188fef5',
                '69427ba57dfdd70755b34fce',
                '69427ba57dfdd70755b34fcf',
                '69427ba57dfdd70755b34fd0',
                '69427ba57dfdd70755b34fd1',
                '69427ba57dfdd70755b34fd2',
            ],
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b70a'),
            name: 'Delete',
            code: 'device-delete',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7c',
            apiIds: ['69428016b05eb437b188fef6'],
        },
        // Group
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb7d'),
            name: 'Group',
            code: 'group',
            description: '',
            parentPermissionId: null,
            apiIds: null,
        },
        // User
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb7e'),
            name: 'User',
            code: 'user',
            description: '',
            parentPermissionId: null,
            apiIds: null,
        },
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb7f'),
            name: 'Read',
            code: 'user-read',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7e',
            apiIds: ['69421efb11023ff2bc3145cb', '69421efb11023ff2bc3145cc'],
        },
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb80'),
            name: 'Create',
            code: 'user-create',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7e',
            apiIds: ['69421efb11023ff2bc3145cd'],
        },
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb81'),
            name: 'Update',
            code: 'user-update',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7e',
            apiIds: ['69421efb11023ff2bc3145ce', '6942693d89312409bc036897'],
        },
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb8c'),
            name: 'Reset Password',
            code: 'user-resetPassword',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7e',
            apiIds: ['6942693d89312409bc036897'],
        },
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb82'),
            name: 'Delete',
            code: 'user-delete',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb7e',
            apiIds: ['69421efb11023ff2bc3145cf'],
        },
        // Role
        {
            _id: new Types.ObjectId('6942498625084fa2dac94cc5'),
            name: 'Role',
            code: 'role',
            description: '',
            parentPermissionId: null,
            apiIds: null,
        },
        {
            _id: new Types.ObjectId('6942498625084fa2dac94cc6'),
            name: 'Read',
            code: 'role-read',
            description: '',
            parentPermissionId: '6942498625084fa2dac94cc5',
            apiIds: [
                '694248bc0d4895ec246b60d7',
                '694248bc0d4895ec246b60d8',
                '6942750b753cbc1aef840fc2',
            ],
        },
        {
            _id: new Types.ObjectId('6942498625084fa2dac94cc7'),
            name: 'Create',
            code: 'role-create',
            description: '',
            parentPermissionId: '6942498625084fa2dac94cc5',
            apiIds: ['694248bc0d4895ec246b60d9', '6942750b753cbc1aef840fc2'],
        },
        {
            _id: new Types.ObjectId('6942498625084fa2dac94cc8'),
            name: 'Update',
            code: 'role-update',
            description: '',
            parentPermissionId: '6942498625084fa2dac94cc5',
            apiIds: ['694248bc0d4895ec246b60da', '6942750b753cbc1aef840fc2'],
        },
        {
            _id: new Types.ObjectId('6942498625084fa2dac94cc9'),
            name: 'Delete',
            code: 'role-delete',
            description: '',
            parentPermissionId: '6942498625084fa2dac94cc5',
            apiIds: ['694248bc0d4895ec246b60db'],
        },
        // History
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb83'),
            name: 'History',
            code: 'history',
            description: '',
            parentPermissionId: null,
            apiIds: [
                '69428016b05eb437b188ff03',
                '69428016b05eb437b188ff04',
                '69428016b05eb437b188ff05',
            ],
        },
        // Import (Nhập kho)
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb86'),
            name: 'Nhập kho',
            code: 'import',
            description: '',
            parentPermissionId: null,
            apiIds: null,
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b70b'),
            name: 'Read',
            code: 'import-read',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb86',
            apiIds: [
                '69428016b05eb437b188fef7',
                '69428016b05eb437b188fef8',
                '69428016b05eb437b188fef9',
                '69428016b05eb437b188fefa',
                '69428016b05eb437b188fefb',
                '69428016b05eb437b188fefc',
            ],
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b70d'),
            name: 'Create',
            code: 'import-create',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb86',
            apiIds: ['69428016b05eb437b188fefd'],
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b70e'),
            name: 'Update',
            code: 'import-update',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb86',
            apiIds: [
                '69428016b05eb437b188fefe',
                '69428016b05eb437b188feff',
                '69428016b05eb437b188ff01',
                '69428016b05eb437b188ff02',
            ],
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b70f'),
            name: 'Delete',
            code: 'import-delete',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb86',
            apiIds: ['69428016b05eb437b188ff00'],
        },
        // Export (Xuất kho)
        {
            _id: new Types.ObjectId('69421dfb58565f5e1a66bb87'),
            name: 'Xuất kho',
            code: 'export',
            description: '',
            parentPermissionId: null,
            apiIds: null,
        },
        {
            _id: new Types.ObjectId('69427e2b31f6bfad1de5b70c'),
            name: 'Read',
            code: 'export-read',
            description: '',
            parentPermissionId: '69421dfb58565f5e1a66bb87',
            apiIds: [],
        },
    ])
    logger.info('Permission seeded')
}

module.exports = permissionSeeder
