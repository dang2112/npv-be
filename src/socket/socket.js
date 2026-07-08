const { Types } = require('mongoose')
const logger = require('../config/loggerConfig')
const goodsReceiptService = require('../service/goodsReceiptService')
const deviceService = require('../service/deviceService')
const deviceManager = require('../device/deviceManager')
const GoodsReceiptModel = require('../model/goodsReceipt')
const GoodsReceiptDetailModel = require('../model/goodsReceiptDetail')

function isValidObjectId(id) {
    return Types.ObjectId.isValid(id)
}

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

let isStart = true
function connectSocket(socket) {
    logger.info(`[Socket] Client kết nối: ${socket.id}`)

    // if (isStart) {
    //     //Check nhập kho đang Scanning thì bật lại startScan
    //     (async () => {
    //         try {
    //             isStart = false;
    //             const activeReceipt = await GoodsReceiptModel.findOne({ status: "SCANNING" }).lean();
    //             if (activeReceipt) {
    //                 const status = await deviceService.getStatus();
    //                 const device = status.find(d => d.deviceType === "SCANNER_IMPORT" && d.isEnable);
    //                 if (device) {
    //                     await goodsReceiptService.startScan(activeReceipt._id)
    //                     // socket.emit('receipt:ack', {
    //                     //     event: 'receipt:startScan',
    //                     //     goodsReceiptId: activeReceipt._id,
    //                     //     success: true,
    //                     //     message: 'Đang có phiên quét hoạt động, tự động khôi phục',
    //                     // });
    //                 }
    //             }
    //         } catch (err) {
    //             logger.error(`[Socket] isStart lỗi: ${err.message}`);
    //         }
    //     })(); // <--- () này để thực thi hàm ngay lập tức
    // }

    // ── Trạng thái thiết bị (frontend gọi khi vào trang) ───────
    // socket.on('device:getStatus', async () => {
    //     try {
    //         const status = await deviceService.getStatus()
    //         const devices = status.filter(d => d.isEnable)
    //         for (const device of devices) {
    //             try {
    //                 switch (device.deviceType) {
    //                     case "SCANNER_IMPORT":
    //                         await deviceManager.connectImportLine(device);
    //                         // if (device.connected) {
    //                         //     const activeReceipt = await GoodsReceiptModel.findOne({ status: "SCANNING" }).lean();
    //                         //     await goodsReceiptService.startScan(activeReceipt._id)
    //                         // }
    //                         break;
    //                     case "SCANNER_ZIP_MASTER_CODE":
    //                         await deviceManager.connectZipMasterCode(device);
    //                         // if (device.connected) {
    //                         //     const activeReceipt = await GoodsReceiptModel.findOne({ status: "SCANNING" }).lean();
    //                         //     await goodsReceiptService.startScan(activeReceipt._id)
    //                         // }
    //                         break;
    //                 }

    //             } catch (connErr) {
    //                 logger.error(`Lỗi kết nối thiết bị ${device.deviceName}: ${connErr.message}`);
    //             }
    //         }

    //         // 2. CHỈ GỌI STARTSCAN DUY NHẤT 1 LẦN NẾU ĐANG CÓ PHIÊN HOẠT ĐỘNG
    //         const activeReceipt = await GoodsReceiptModel.findOne({ status: "SCANNING" }).lean();
    //         if (activeReceipt) {
    //             // Kiểm tra xem các thiết bị cần thiết đã kết nối chưa
    //             const isImportConnected = devices.find(d => d.deviceType === "SCANNER_IMPORT")?.connected;

    //             if (isImportConnected) {
    //                 logger.info(`[Socket] Tự động khôi phục phiên quét cho đơn: ${activeReceipt._id}`);
    //                 await goodsReceiptService.startScan(activeReceipt._id);
    //             }
    //         }

    //         socket.emit('device:status', status)
    //     } catch (err) {
    //         logger.error(`[Socket] device:getStatus lỗi: ${err.message}`)
    //     }
    // })

    socket.on('device:getStatus', async () => {
        try {
            const status = await deviceService.getStatus()
            const devices = status.filter((d) => d.isEnable)

            // 1. Thực hiện kết nối mạng TCP cho các thiết bị
            for (const device of devices) {
                try {
                    switch (device.deviceType) {
                        case 'SCANNER_IMPORT':
                            await deviceManager.connectImportLine(device)
                            break
                        case "SCANNER_ZIP_MASTER_CODE":
                            await deviceManager.connectZipMasterCode(device);
                            break;
                    }
                } catch (connErr) {
                    logger.error(
                        `Lỗi kết nối thiết bị ${device.deviceName}: ${connErr.message}`,
                    )
                }
            }

            // 2. CHECK TRẠNG THÁI REALTIME TỪ DEVICEMANAGER ĐỂ KHÔI PHỤC PHIÊN QUÉT
            const activeReceipt = await GoodsReceiptModel.findOne({
                status: 'SCANNING',
            }).lean()
            if (activeReceipt) {
                // Lấy trực tiếp từ bộ quản lý kết nối thật của hệ thống
                const isImportReady = deviceManager.importScanner.isConnected()

                if (isImportReady) {
                    logger.info(
                        `[Socket] Tự động khôi phục phiên quét duy nhất cho đơn: ${activeReceipt._id}`,
                    )
                    await goodsReceiptService.startScan(activeReceipt._id)
                }
            }

            // Lấy lại status cập nhật mới nhất để trả về cho Frontend hiển thị màu xanh Online
            const updatedStatus = await deviceService.getStatus()

            socket.emit('device:status', updatedStatus)
        } catch (err) {
            logger.error(`[Socket] device:getStatus lỗi: ${err.message}`)
        }
    })

    socket.on('scan:getCurrentCarton', async (data) => {
        try {
            const { goodsReceiptId } = data
            if (!goodsReceiptId) {
                return socket.emit('scan:error', {
                    message: 'Thiếu Goods Receipt ID',
                })
            }

            let currentList = []
            let quantityScanned = 0
            let quantityPerCarton = 0

            const receipt = await GoodsReceiptModel.findById(goodsReceiptId)
            if (!receipt) {
                return socket.emit('scan:error', {
                    message: 'Không tìm thấy đơn hàng trong hệ thống',
                })
            }
            quantityPerCarton = receipt.quantityPerCarton || 0

            const activeDetails = await GoodsReceiptDetailModel.find({
                _id: { $in: receipt.goodsReceiptDetails },
                scanStatus: 'SCANNED',
                activationStatus: 'ACTIVATED',
                zipMasterCode: null,
            }).select('qrCode')

            quantityScanned = activeDetails.length
            currentList = activeDetails.map((d) => ({
                qrCode: d.qrCode,
                status: 'success',
            }))
            // console.log(currentList)
            socket.emit('scan:cartonCompleted', {
                isCompletedToPack: quantityScanned >= quantityPerCarton,
                listScanned: currentList,
                // message: 'Khôi phục danh sách sản phẩm hiện tại thành công!'
            })
        } catch (err) {
            logger.error(
                `[Socket] Lỗi xử lý khôi phục dữ liệu khi F5: ${err.message}`,
            )
            socket.emit('scan:error', {
                message: 'Lỗi hệ thống khi khôi phục dữ liệu thùng',
            })
        }
    })

    // ── Bắt đầu quét ───────────────────────────────────────────
    socket.on('receipt:startScan', async ({ goodsReceiptId } = {}) => {
        try {
            if (!goodsReceiptId || !isValidObjectId(goodsReceiptId))
                throw new Error('goodsReceiptId không hợp lệ')
            // await goodsReceiptService.startScan(goodsReceiptId)
            // socket.emit('receipt:ack', {
            //     event: 'receipt:startScan',
            //     goodsReceiptId,
            //     success: true,
            //     message: 'Bắt đầu quét thành công',
            // })

            // // Broadcast trạng thái scanner mới cho tất cả client
            // deviceService.getStatus()
            //     .then((s) => global._io?.emit('device:statusChanged', s))
            //     .catch((err) => logger.error(`[Socket] Lấy device status lỗi: ${err.message}`))

            //Check trạng thái thiết bị trước khi bắt đầu quét
            const deviceStatus = await deviceService.getStatus()
            const deviceScanerImport = deviceStatus.find(
                (d) => d.deviceType === 'SCANNER_IMPORT',
            )

            if (deviceScanerImport && deviceScanerImport.connected) {
                await goodsReceiptService.startScan(goodsReceiptId)
                socket.emit('receipt:ack', {
                    event: 'receipt:startScan',
                    goodsReceiptId,
                    success: true,
                    message: 'Bắt đầu quét thành công',
                })
            } else {
                socket.emit('receipt:ack', {
                    event: 'receipt:startScan',
                    goodsReceiptId,
                    success: false,
                    message: 'Thiết bị quét không hoạt động',
                })
            }
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
            if (!goodsReceiptId || !isValidObjectId(goodsReceiptId))
                throw new Error('goodsReceiptId không hợp lệ')
            console.log(goodsReceiptId)
            const res = await goodsReceiptService.pauseScan(goodsReceiptId)
            console.log(res)
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

    socket.on('scanner:send', async ({ role, qrCode } = {}) => {
        try {
            console.log(qrCode)
            if (!qrCode || !String(qrCode).trim()) {
                throw new Error('qrCode không hợp lệ')
            }

            const activeReceipt = await GoodsReceiptModel.findOne({
                status: 'SCANNING',
            })
                .populate('goodsReceiptDetails')
                .lean()
            if (!activeReceipt) {
                socket.emit('receipt:ack', {
                    event: 'scanner:send',
                    success: false,
                    message: 'Không có đơn quét đang hoạt động',
                })
                return
            }

            const detailIds = activeReceipt.goodsReceiptDetails.map(
                (d) => d._id,
            )
            const qrScanned = activeReceipt.goodsReceiptDetails.filter(
                (d) =>
                    d.scanStatus === 'SCANNED' &&
                    d.activationStatus === 'ACTIVATED' &&
                    d.zipMasterCode === null,
            )
            const configScanData = {
                batchlot: activeReceipt.batchlot,
                quantityPerCarton: activeReceipt.quantityPerCarton || 0,
                quantityScanned: qrScanned.length,
                item: qrScanned.map((d) => d.qrCode),
                itemError: activeReceipt.goodsReceiptDetails
                    .filter((d) => d.activationStatus === 'ERROR')
                    .map((d) => d.qrCode),
            }

            await goodsReceiptService._handleScanData(
                activeReceipt._id,
                activeReceipt.batchlot,
                qrCode,
                detailIds,
                configScanData,
            )
        } catch (err) {
            logger.error(`[Socket] scanner:send lỗi: ${err.message}`)
            socket.emit('receipt:ack', {
                event: 'scanner:send',
                success: false,
                message: err.message,
            })
        }
    })

    // ── Hoàn thành batchlot ─────────────────────────────────────
    socket.on('receipt:completeScan', async ({ goodsReceiptId } = {}) => {
        try {
            if (!goodsReceiptId || !isValidObjectId(goodsReceiptId))
                throw new Error('goodsReceiptId không hợp lệ')
            await goodsReceiptService.completeScan(goodsReceiptId)
            const summary =
                await goodsReceiptService.getCompletionSummary(goodsReceiptId)
            socket.emit('receipt:ack', {
                event: 'receipt:completeScan',
                goodsReceiptId,
                success: true,
                message: 'Hoàn thành batchlot',
                data: summary,
            })
            deviceService
                .getStatus()
                .then((s) => global._io?.emit('device:statusChanged', s))
                .catch((err) =>
                    logger.error(
                        `[Socket] Lấy device status lỗi: ${err.message}`,
                    ),
                )
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
