const net = require('net')
const logger = require('../config/loggerConfig')
const DeviceModel = require('../model/device')

/**
 * createScanner — factory tạo TCP server lắng nghe kết nối từ Cognex DataMan 290X.
 * @param {string} deviceRole - 'SCANNER_IMPORT' | 'SCANNER_EXPORT_ENTRY' | 'SCANNER_EXPORT_EXIT'
 */
function createScanner(deviceRole) {
    let server = null
    let sockets = []
    let running = false
    let onDataCallback = null

    async function connect(onData) {
        if (running) {
            logger.warn(`[Scanner:${deviceRole}] Đã đang chạy, bỏ qua lệnh connect`)
            onDataCallback = onData  // cập nhật callback mới nếu resume
            return
        }

        const device = await DeviceModel.findOne({ deviceRole, isEnable: true })
        if (!device) throw new Error(`Không tìm thấy thiết bị với role: ${deviceRole}`)

        onDataCallback = onData

        server = net.createServer((socket) => {
            const addr = `${socket.remoteAddress}:${socket.remotePort}`
            logger.info(`[Scanner:${deviceRole}] Kết nối từ: ${addr}`)
            sockets.push(socket)

            socket.on('data', (data) => {
                const raw = data.toString().trim()
                if (raw && onDataCallback) onDataCallback(raw)
            })

            socket.on('close', () => {
                sockets = sockets.filter((s) => s !== socket)
                logger.info(`[Scanner:${deviceRole}] Ngắt kết nối: ${addr}`)
                // Thông báo cho frontend biết scanner vừa ngắt kết nối
                global._io?.emit('device:statusChanged', { role: deviceRole, connected: sockets.length > 0 })
            })

            socket.on('error', (err) => {
                logger.error(`[Scanner:${deviceRole}] Lỗi socket ${addr}: ${err.message}`)
            })
        })

        server.on('error', (err) => {
            logger.error(`[Scanner:${deviceRole}] Lỗi server: ${err.message}`)
            running = false
        })

        await new Promise((resolve, reject) => {
            server.listen(device.port, device.host, () => {
                running = true
                logger.info(`[Scanner:${deviceRole}] Đang lắng nghe ${device.host}:${device.port}`)
                global._io?.emit('device:statusChanged', { role: deviceRole, connected: true })
                resolve()
            })
            server.once('error', reject)
        })
    }

    function pause() {
        onDataCallback = null
        logger.info(`[Scanner:${deviceRole}] Tạm dừng nhận dữ liệu`)
    }

    function resume(onData) {
        onDataCallback = onData
        logger.info(`[Scanner:${deviceRole}] Tiếp tục nhận dữ liệu`)
    }

    async function disconnect() {
        onDataCallback = null
        sockets.forEach((s) => s.destroy())
        sockets = []
        if (server) {
            await new Promise((resolve) => server.close(resolve))
            server = null
        }
        running = false
        logger.info(`[Scanner:${deviceRole}] Đã ngắt kết nối hoàn toàn`)
    }

    function isConnected() {
        return running
    }

    return { connect, pause, resume, disconnect, isConnected }
}

module.exports = { createScanner }
