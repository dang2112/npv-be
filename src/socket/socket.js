const logger = require('../config/loggerConfig')
const goodsReceiptService = require('../service/goodsReceiptService')
const deviceService = require('../service/deviceService')

/**
 * WebSocket events
 *
 * CLIENT → SERVER (lệnh điều khiển):
 *   receipt:startScan      { goodsReceiptId }
 *   receipt:pauseScan      { goodsReceiptId }
 *   receipt:completeScan   { goodsReceiptId }
 *   device:getStatus       {}                   ← frontend vào trang, hỏi trạng thái thiết bị
 *
 * SERVER → CLIENT (broadcast tất cả client):
 *   scan:success           { qrCode, productCode, productName, index, stats }
 *   scan:duplicate         { qrCode, productName, scannedAt }
 *   scan:error             { qrCode, reason }
 *   scan:stats             { total, scanned, remaining, errors }
 *   device:statusChanged   { importLine, exportLine }  ← khi trạng thái kết nối thiết bị thay đổi
 *
 * SERVER → CLIENT (chỉ gửi về client gọi):
 *   receipt:ack            { event, goodsReceiptId, success, message, data? }
 *   device:status          { importLine, exportLine }  ← phản hồi device:getStatus
 */
function connectSocket(socket) {
    logger.info(`[Socket] Client kết nối: ${socket.id}`)

    // ── Trạng thái thiết bị (frontend gọi khi vào trang) ───────
    socket.on('device:getStatus', async () => {
        const status = await deviceService.getStatus()
        socket.emit('device:status', status)
    })

    // ── Bắt đầu quét ───────────────────────────────────────────
    socket.on('receipt:startScan', async ({ goodsReceiptId } = {}) => {
        try {
            if (!goodsReceiptId) throw new Error('Thiếu goodsReceiptId')
            await goodsReceiptService.startScan(goodsReceiptId)
            socket.emit('receipt:ack', {
                event: 'receipt:startScan',
                goodsReceiptId,
                success: true,
                message: 'Bắt đầu quét thành công',
            })
            // Broadcast trạng thái scanner mới cho tất cả client
            deviceService.getStatus().then((s) => global._io?.emit('device:statusChanged', s))
        } catch (err) {
            logger.error(`[Socket] receipt:startScan lỗi: ${err.message}`)
            socket.emit('receipt:ack', {
                event: 'receipt:startScan',
                goodsReceiptId,
                success: false,
                message: err.message,
            })
        }
    })

    // ── Tạm dừng quét ──────────────────────────────────────────
    socket.on('receipt:pauseScan', async ({ goodsReceiptId } = {}) => {
        try {
            if (!goodsReceiptId) throw new Error('Thiếu goodsReceiptId')
            await goodsReceiptService.pauseScan(goodsReceiptId)
            socket.emit('receipt:ack', {
                event: 'receipt:pauseScan',
                goodsReceiptId,
                success: true,
                message: 'Đã tạm dừng',
            })
        } catch (err) {
            logger.error(`[Socket] receipt:pauseScan lỗi: ${err.message}`)
            socket.emit('receipt:ack', {
                event: 'receipt:pauseScan',
                goodsReceiptId,
                success: false,
                message: err.message,
            })
        }
    })

    // ── Hoàn thành batchlot ─────────────────────────────────────
    socket.on('receipt:completeScan', async ({ goodsReceiptId } = {}) => {
        try {
            if (!goodsReceiptId) throw new Error('Thiếu goodsReceiptId')
            await goodsReceiptService.completeScan(goodsReceiptId)
            const summary = await goodsReceiptService.getCompletionSummary(goodsReceiptId)
            socket.emit('receipt:ack', {
                event: 'receipt:completeScan',
                goodsReceiptId,
                success: true,
                message: 'Hoàn thành batchlot',
                data: summary,
            })
            deviceService.getStatus().then((s) => global._io?.emit('device:statusChanged', s))
        } catch (err) {
            logger.error(`[Socket] receipt:completeScan lỗi: ${err.message}`)
            socket.emit('receipt:ack', {
                event: 'receipt:completeScan',
                goodsReceiptId,
                success: false,
                message: err.message,
            })
        }
    })

    socket.on('disconnect', () => {
        logger.info(`[Socket] Client ngắt kết nối: ${socket.id}`)
    })
}

module.exports = { connectSocket }
