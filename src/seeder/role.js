const { Types } = require('mongoose')

const logger = require('../config/loggerConfig')
const RoleModel = require('../model/role')

async function roleSeeder() {
    await RoleModel.deleteMany({})
    await RoleModel.insertMany([
        {
            _id: new Types.ObjectId('69421efb11023ff2bc3145cb'),
            name: 'Admin',
            description: '',
            permissionIds: [
                // Dashboard
                '69421dfb58565f5e1a66bb7b',
                // Device
                '69421dfb58565f5e1a66bb7c',
                '69427e2b31f6bfad1de5b707',
                '69427e2b31f6bfad1de5b708',
                '69427e2b31f6bfad1de5b709',
                '69427e2b31f6bfad1de5b70a',

                // Group
                '69421dfb58565f5e1a66bb7d',
                // User
                '69421dfb58565f5e1a66bb7e',
                '69421dfb58565f5e1a66bb7f',
                '69421dfb58565f5e1a66bb80',
                '69421dfb58565f5e1a66bb81',
                '69421dfb58565f5e1a66bb82',
                // Role
                '6942498625084fa2dac94cc5',
                '6942498625084fa2dac94cc6',
                '6942498625084fa2dac94cc7',
                '6942498625084fa2dac94cc8',
                '6942498625084fa2dac94cc9',
                // History
                '69421dfb58565f5e1a66bb83',
                // Import
                '69421dfb58565f5e1a66bb86',
                '69427e2b31f6bfad1de5b70b', // import-read
                '69427e2b31f6bfad1de5b70d', // import-create
                '69427e2b31f6bfad1de5b70e', // import-update
                '69427e2b31f6bfad1de5b70f', // import-delete
                // Export
                '69421dfb58565f5e1a66bb87',
                '69427e2b31f6bfad1de5b70c', // export-read
            ],
        },
        {
            _id: new Types.ObjectId('69421efb11023ff2bc3145ca'),
            name: 'User',
            description: '',
            permissionIds: [
                // Dashboard
                '69421dfb58565f5e1a66bb7b',
                // Import
                '69421dfb58565f5e1a66bb86',
                '69427e2b31f6bfad1de5b70b', // import-read
                '69427e2b31f6bfad1de5b70d', // import-create
                '69427e2b31f6bfad1de5b70e', // import-update
                '69427e2b31f6bfad1de5b70f', // import-delete
                // Export
                '69421dfb58565f5e1a66bb87',
                '69427e2b31f6bfad1de5b70c', // export-read
            ],
        },
    ])
    logger.info('Role seeded')
}

module.exports = roleSeeder
