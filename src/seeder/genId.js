const { Types } = require('mongoose')

const logger = require('../config/loggerConfig')

async function genIdSeeder() {
    for (let i = 0; i < 10; i++) {
        console.log(new Types.ObjectId())
    }
    logger.info('Gen id seeded')
}

module.exports = genIdSeeder
