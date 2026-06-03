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
const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY = 3000

function createScanner(deviceRole) {
    let tcpSocket = null
    let running = false
    let onDataCallback = null
    let reconnectTimer = null
    let deviceConfig = null
    let reconnectAttempts = 0

    async function connect(device) {
        await disconnect(); // ngắt kết nối cũ trước khi kết nối mới

        // if (running) {
        //     // logger.warn(`[Scanner:${deviceRole}] Đã đang chạy, bỏ qua lệnh connect`)
        //     // onDataCallback = onData
        // }

        // const device = await DeviceModel.findOne({ deviceType: deviceRole, isEnable: true })
        if (!device) throw new Error(`Không tìm thấy thiết bị với role: ${deviceRole}`)
        deviceConfig = device
        // onDataCallback = onData
        running = true
        reconnectAttempts = 0

        _doConnect()
    }

    function _doConnect() {
        // console.log("_doConnect")
        if (!running || !deviceConfig) return

        const { host, port } = deviceConfig
        if (host == undefined || port == undefined) {
            logger.warn(`[Lỗi Device Config]`)
        }

        if (tcpSocket) {
            tcpSocket.removeAllListeners();
            tcpSocket.destroy();
        }

        tcpSocket = new net.Socket()

        // Timeout chỉ áp dụng trong giai đoạn kết nối ban đầu
        tcpSocket.setTimeout(10000)
        tcpSocket.on('timeout', () => {
            logger.warn(`[Scanner:${deviceRole}] Timeout kết nối`)
            tcpSocket.destroy()
        })

        tcpSocket.connect(port, host, async () => {
            logger.info(`[Scanner:${deviceRole}] Kết nối thành công → ${host}:${port}`)
            tcpSocket.setTimeout(0) // tắt timeout sau khi kết nối thành công
            reconnectAttempts = 0   // reset counter khi kết nối thành công
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

            if (!running) return

            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                logger.error(`[Scanner:${deviceRole}] Đã thử ${MAX_RECONNECT_ATTEMPTS} lần, dừng kết nối lại`)
                running = false
                return
            }

            // Exponential backoff: 3s, 6s, 12s, ... tối đa 60s
            const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 60000)
            reconnectAttempts++
            logger.info(`[Scanner:${deviceRole}] Thử kết nối lại lần ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} sau ${delay / 1000}s...`)
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null
                _doConnect()
            }, delay)
        })

        tcpSocket.on('error', (err) => {
            logger.error(`[Scanner:${deviceRole}] Lỗi TCP: ${err.message}`)
            // 'close' sẽ được gọi ngay sau 'error', reconnect xử lý ở đó
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
        if (tcpSocket) {
            tcpSocket.removeAllListeners();
            tcpSocket.destroy();
            tcpSocket = null
        }
        global._io?.emit('device:statusChanged', { role: deviceRole, connected: false })
        logger.info(`[Scanner:${deviceRole}] Đã ngắt kết nối hoàn toàn`)
    }

    function isConnected() {
        return running && tcpSocket !== null && !tcpSocket.destroyed
    }

    return { connect, pause, resume, disconnect, isConnected }
}

module.exports = { createScanner }
