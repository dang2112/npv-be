require('../config/mongodbConfig')
const logger = require('../config/loggerConfig')
const apiSeeder = require('./api')
const genIdSeeder = require('./genId')
const integrationConfigSeeder = require('./integrationConfig')
const permissionSeeder = require('./permission')
const roleSeeder = require('./role')
const userSeeder = require('./user')

const args = process.argv.slice(2)

async function run() {
    try {
        switch (args[0]) {
            case 'user': {
                await userSeeder()
                break
            }
            case 'role': {
                await roleSeeder()
                break
            }
            case 'permission': {
                await permissionSeeder()
                break
            }
            case 'api': {
                await apiSeeder()
                break
            }
            case 'genId': {
                await genIdSeeder()
                break
            }
            case 'integrationConfig': {
                await integrationConfigSeeder()
                break
            }
            case 'all': {
                await userSeeder()
                await roleSeeder()
                await permissionSeeder()
                await apiSeeder()
                await integrationConfigSeeder()
                break
            }
        }
        logger.info('Seeding completed')
    } catch (error) {
        logger.error('Seeding failed:', error)
    } finally {
        process.exit(1)
    }
}

run()
