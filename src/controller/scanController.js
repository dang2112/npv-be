const { scanService } = require("../service/scanService")
const { response } = require("../util/response/response")

const scanController = {
    startScan: async (req, res, next) => {
        try {
            const result = await scanService.startScan()
            return res.status(200).json(response.success(result))
        } catch (error) {
            next(error)
        }
    }
}

module.exports = scanController