require('../config/mongodbConfig')
const logger = require('../config/loggerConfig')
const apiSeeder = require('./api')
const genIdSeeder = require('./genId')
const integrationConfigSeeder = require('./integrationConfig')
const permissionSeeder = require('./permission')
const roleSeeder = require('./role')
const userSeeder = require('./user')
const deviceSeeder = require('./device')
const goodsReceiptSeeder = require('./goodsReceipt')
const goodsReceiptConfigSeeder = require('./goodsReceiptConfig')

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
            case 'device': {
                await deviceSeeder()
                break
            }
            case 'goodsReceipt': {
                await goodsReceiptSeeder(args[1])
                break
            }
            case 'goodsReceiptConfig': {
                await goodsReceiptConfigSeeder()
                break
            }
            case 'all': {
                await userSeeder()
                await roleSeeder()
                await permissionSeeder()
                await apiSeeder()
                await integrationConfigSeeder()
                await deviceSeeder()
                await goodsReceiptConfigSeeder()
                break
            }
        }
        logger.info('Seeding completed')
        process.exit(0)
    } catch (error) {
        logger.error('Seeding failed:', error)
        process.exit(1)
    } finally {
    }
}

run()
