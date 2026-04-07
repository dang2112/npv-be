const net = require('net')
const logger = require('../config/loggerConfig')
const DeviceModel = require('../model/device')

/**
 * createScanner — factory tạo TCP client kết nối đến Cognex DataMan 290X.
 *
 * Kiến trúc:
 *   [DataMan 290 — TCP server tại device.host:device.port]
 *        ▲
 *        │ TCP connect
 *   [Backend — TCP client]
 *
 * @param {string} deviceRole - 'SCANNER_IMPORT' | 'SCANNER_EXPORT_ENTRY' | 'SCANNER_EXPORT_EXIT'
 */
function createScanner(deviceRole) {
    let tcpSocket = null
    let running = false
    let onDataCallback = null
    let reconnectTimer = null
    let deviceConfig = null

    async function connect(onData) {
        if (running) {
            logger.warn(`[Scanner:${deviceRole}] Đã đang chạy, bỏ qua lệnh connect`)
            onDataCallback = onData
            return
        }

        const device = await DeviceModel.findOne({ deviceType: deviceRole, isEnable: true })
        if (!device) throw new Error(`Không tìm thấy thiết bị với role: ${deviceRole}`)

        deviceConfig = device
        onDataCallback = onData
        running = true

        _doConnect()
    }

    function _doConnect() {
        if (!running || !deviceConfig) return

        const { host, port } = deviceConfig

        tcpSocket = new net.Socket()

        tcpSocket.connect(port, host, () => {
            logger.info(`[Scanner:${deviceRole}] Kết nối thành công → ${host}:${port}`)
            tcpSocket.setTimeout(0) // tắt timeout sau khi kết nối thành công
            global._io?.emit('device:statusChanged', { role: deviceRole, connected: true })
        })

        tcpSocket.on('data', (data) => {
            const raw = data.toString().trim()
            if (raw && onDataCallback) onDataCallback(raw)
        })

        tcpSocket.on('close', () => {
            logger.warn(`[Scanner:${deviceRole}] Mất kết nối`)
            global._io?.emit('device:statusChanged', { role: deviceRole, connected: false })
            tcpSocket = null

            // Tự reconnect sau 3 giây nếu vẫn đang running
            if (running) {
                reconnectTimer = setTimeout(() => {
                    logger.info(`[Scanner:${deviceRole}] Thử kết nối lại...`)
                    _doConnect()
                }, 3000)
            }
        })

        tcpSocket.on('error', (err) => {
            logger.error(`[Scanner:${deviceRole}] Lỗi TCP: ${err.message}`)
            // 'close' sẽ được gọi ngay sau 'error', reconnect xử lý ở đó
        })

        tcpSocket.setTimeout(10000) // 10s timeout khi đang kết nối ban đầu
        tcpSocket.on('timeout', () => {
            logger.warn(`[Scanner:${deviceRole}] Timeout kết nối`)
            tcpSocket.destroy()
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
        running = false
        onDataCallback = null
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
        if (tcpSocket) { tcpSocket.destroy(); tcpSocket = null }
        logger.info(`[Scanner:${deviceRole}] Đã ngắt kết nối hoàn toàn`)
    }

    function isConnected() {
        return running && tcpSocket !== null && !tcpSocket.destroyed
    }

    return { connect, pause, resume, disconnect, isConnected }
}

module.exports = { createScanner }
