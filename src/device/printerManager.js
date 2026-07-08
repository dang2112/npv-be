const net = require('net')
const logger = require('../config/loggerConfig')
const DeviceModel = require('../model/device')

/**
 * createPrinter — factory tạo TCP client kết nối đến máy in DOMINO.
 * DOMINO đóng vai TCP server, phần mềm chủ động kết nối vào.
 */
const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY = 5000

function createPrinter() {
    let socket = null
    let device = null
    let connected = false
    let reconnectTimer = null
    let intentionalDisconnect = false
    let reconnectAttempts = 0

    async function connect() {
        if (connected) {
            logger.warn('[Printer:DOMINO] Đã kết nối, bỏ qua lệnh connect')
            return
        }

        device = await DeviceModel.findOne({
            deviceType: 'PRINTER_DOMINO',
            isEnable: true,
        })
        if (!device) throw new Error('Không tìm thấy thiết bị máy in DOMINO')

        intentionalDisconnect = false
        reconnectAttempts = 0
        await _createConnection()
    }

    function _createConnection() {
        return new Promise((resolve, reject) => {
            socket = new net.Socket()

            socket.connect(device.port, device.host, () => {
                connected = true
                reconnectAttempts = 0
                logger.info(
                    `[Printer:DOMINO] Kết nối thành công ${device.host}:${device.port}`,
                )
                global._io?.emit('device:statusChanged', {
                    role: 'PRINTER_DOMINO',
                    connected: true,
                })
                resolve()
            })

            socket.on('data', (data) => {
                logger.info(
                    `[Printer:DOMINO] Phản hồi: ${data.toString().trim()}`,
                )
            })

            socket.on('close', () => {
                connected = false
                logger.warn('[Printer:DOMINO] Mất kết nối')
                global._io?.emit('device:statusChanged', {
                    role: 'PRINTER_DOMINO',
                    connected: false,
                })
                if (!intentionalDisconnect) _scheduleReconnect()
            })

            socket.on('error', (err) => {
                connected = false
                logger.error(`[Printer:DOMINO] Lỗi: ${err.message}`)
                reject(err)
            })
        })
    }

    function _scheduleReconnect() {
        if (reconnectTimer) return

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            logger.error(
                `[Printer:DOMINO] Đã thử ${MAX_RECONNECT_ATTEMPTS} lần, dừng kết nối lại`,
            )
            return
        }

        const delay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
            60000,
        )
        reconnectAttempts++
        logger.info(
            `[Printer:DOMINO] Thử kết nối lại lần ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} sau ${delay / 1000}s...`,
        )

        reconnectTimer = setTimeout(async () => {
            reconnectTimer = null
            try {
                await _createConnection()
            } catch (err) {
                logger.error(
                    `[Printer:DOMINO] Kết nối lại thất bại: ${err.message}`,
                )
            }
        }, delay)
    }

    async function sendJob(jobData) {
        if (!connected || !socket) throw new Error('Máy in DOMINO chưa kết nối')

        // TODO: Format lệnh in theo giao thức DOMINO (cần datasheet)
        const command = JSON.stringify(jobData) + '\r\n'

        return new Promise((resolve, reject) => {
            socket.write(command, 'utf8', (err) => {
                if (err) {
                    logger.error(
                        `[Printer:DOMINO] Lỗi gửi lệnh in: ${err.message}`,
                    )
                    reject(err)
                } else {
                    logger.info(
                        `[Printer:DOMINO] Gửi lệnh in: ${jobData.productCode}`,
                    )
                    resolve()
                }
            })
        })
    }

    function disconnect() {
        intentionalDisconnect = true
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }
        if (socket) {
            socket.destroy()
            socket = null
        }
        connected = false
        device = null
        logger.info('[Printer:DOMINO] Đã ngắt kết nối')
    }

    function getStatus() {
        return {
            connected,
            host: device?.host,
            port: device?.port,
        }
    }

    return { connect, sendJob, disconnect, getStatus }
}

module.exports = { createPrinter }
