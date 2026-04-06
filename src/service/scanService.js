const logger = require("../config/loggerConfig")
const tcpClient = require("../tcp/tcpClient")


const scanService = {
    startScan: async () => {
        try {
            await tcpClient.startScan()
        } catch (error) {
            logger.error(`startScan Service lỗi`)
            logger.error(error)
        }
    }
}

module.exports = { scanService }