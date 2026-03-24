const { Types } = require('mongoose')

const UserModel = require('../model/user')
const logger = require('../config/loggerConfig')

async function userSeeder() {
    await UserModel.deleteMany({})
    await UserModel.insertMany([
        {
            _id: new Types.ObjectId('68650a52d2be83be41cbd8f1'),
            fullname: 'root',
            username: 'root',
            password:
                '$2b$10$VbLYkTVZG0gy7gNoaJZCduG4B8OS8670Goz1XjRu6xC71YdJgIJF6',
            role: null,
        },
        {
            _id: new Types.ObjectId('68650a52d2be83be41cbd8f2'),
            fullname: 'admin',
            username: 'admin',
            password:
                '$2b$10$VbLYkTVZG0gy7gNoaJZCduG4B8OS8670Goz1XjRu6xC71YdJgIJF6',
            roleId: '69421efb11023ff2bc3145cb',
        },
    ])
    logger.info('Users seeded')
}

module.exports = userSeeder
