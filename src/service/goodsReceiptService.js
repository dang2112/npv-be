const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const GoodsReceiptModel = require('../model/goodsReceipt')
const GoodsReceiptDetailModel = require('../model/goodsReceiptDetail')
const integrationService = require('../util/integration/integrationService')
const deviceManager = require('../device/deviceManager')
const logger = require('../config/loggerConfig')

const goodsReceiptService = {
    /**
     * Trả về batchlot đang ở trạng thái SCANNING, kèm stats + danh sách chi tiết.
     * Luôn chỉ có tối đa 1 batchlot SCANNING tại một thời điểm.
     */
    getScanning: async () => {
        const receipt = await GoodsReceiptModel.findOne({ status: 'SCANNING' }).lean()
        if (!receipt) return null
        const detail = await goodsReceiptService.getById(String(receipt._id))
        return detail
    },

    getAll: async (search = '', page = 1, limit = 10) => {
        try {
            search = RegExp(search, 'i')
            page = Number(page)
            limit = Number(limit)

            const [items, totalItems] = await Promise.all([
                GoodsReceiptModel.find({ batchlot: search }, { __v: 0 })
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                GoodsReceiptModel.countDocuments({ batchlot: search }),
            ])

            return { items, page, totalItems, totalPage: Math.ceil(totalItems / limit) }
        } catch (error) {
            throw error
        }
    },

    /**
     * Lấy danh sách chi tiết của một goods receipt với filter, phân trang và thống kê.
     * @param {string} goodsReceiptId
     * @param {string} [search] - Tìm theo mã hoặc tên sản phẩm (regex, không phân biệt hoa thường)
     * @param {string} [status] - PENDING: chưa quét | ACTIVATED: đã kích hoạt | ERROR: lỗi kích hoạt
     * @param {number} [page=1]
     * @param {number} [limit=20]
     */
    getById: async (goodsReceiptId, { search = '', status, page = 1, limit = 20 } = {}) => {
        try {
            const receipt = await GoodsReceiptModel.findById(goodsReceiptId).lean()
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            const baseFilter = { _id: { $in: receipt.goodsReceiptDetails } }

            const itemFilter = { ...baseFilter }
            if (search) {
                const searchRegex = RegExp(search, 'i')
                itemFilter.$or = [{ productCode: searchRegex }, { productName: searchRegex }]
            }
            if (status === 'PENDING') itemFilter.scanStatus = 'PENDING'
            else if (status === 'ACTIVATED') itemFilter.activationStatus = 'ACTIVATED'
            else if (status === 'ERROR') itemFilter.activationStatus = 'ERROR'

            page = Number(page)
            limit = Number(limit)

            const [items, totalItems, totalAll, activated, errors, remaining] = await Promise.all([
                GoodsReceiptDetailModel.find(itemFilter, { __v: 0 }).sort({ index: 1 }).skip((page - 1) * limit).limit(limit),
                GoodsReceiptDetailModel.countDocuments(itemFilter),
                GoodsReceiptDetailModel.countDocuments(baseFilter),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ACTIVATED' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ERROR' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, scanStatus: 'PENDING' }),
            ])

            return {
                receipt: { _id: receipt._id, batchlot: receipt.batchlot, status: receipt.status },
                stats: { total: totalAll, activated, errors, remaining },
                items,
                page,
                totalItems,
                totalPage: Math.ceil(totalItems / limit),
            }
        } catch (error) {
            throw error
        }
    },

    /**
     * Fetch thông tin batchlot từ QAA và lưu vào DB.
     * Nếu batchlot đã tồn tại → merge: chỉ thêm QR mới, giữ nguyên QR đã quét.
     */
    getBatchlotInfo: async (batchlot) => {
        try {
            const batchlotInfo = await integrationService.syncBatchlot(batchlot)
                .catch((axiosError) => {
                    const httpStatus = axiosError.response?.status || axiosError.status
                    if (httpStatus === 401) throw new BadReq(errorCode.AUTHENTICATION_FAILED)
                    if (httpStatus === 404) throw new BadReq(errorCode.BATCHLOT_NOT_FOUND)
                    throw new BadReq(errorCode.INTERNAL_SERVER_ERROR)
                })

            const existingReceipt = await GoodsReceiptModel.findOne({ batchlot }).populate('goodsReceiptDetails')

            // activationStatus=1 trong QAA = đã kích hoạt trước đó
            const mapDetail = (p) => ({
                productCode: p.itemCode,
                productName: p.itemName,
                qrCode: p.qrCode,
                scanStatus: p.activationStatus === 1 ? 'SCANNED' : 'PENDING',
                activationStatus: p.activationStatus === 1 ? 'ACTIVATED' : 'PENDING',
            })

            let receiptId
            if (!existingReceipt) {
                const inserted = await GoodsReceiptDetailModel.insertMany(batchlotInfo.qrCodes.map(mapDetail))
                const created = await GoodsReceiptModel.create({
                    batchlot: batchlotInfo.manufactureBatchlot,
                    total: batchlotInfo.totalCount,
                    goodsReceiptDetails: inserted.map((d) => d._id),
                    status: 'PENDING',
                })
                receiptId = created._id
            } else {
                // Merge: thêm QR mới chưa có trong DB, giữ nguyên QR đã quét
                const existingQRs = new Set(existingReceipt.goodsReceiptDetails.map((d) => d.qrCode))
                const newDetails = batchlotInfo.qrCodes.filter((p) => !existingQRs.has(p.qrCode)).map(mapDetail)

                if (newDetails.length > 0) {
                    const inserted = await GoodsReceiptDetailModel.insertMany(newDetails)
                    await GoodsReceiptModel.findByIdAndUpdate(existingReceipt._id, {
                        $push: { goodsReceiptDetails: { $each: inserted.map((d) => d._id) } },
                        $set: { total: batchlotInfo.totalCount },
                    })
                }
                receiptId = existingReceipt._id
            }

            return goodsReceiptService.getById(String(receiptId))
        } catch (error) {
            throw error
        }
    },

    /**
     * Bắt đầu quét: kết nối scanner, đăng ký callback xử lý từng QR.
     */
    startScan: async (goodsReceiptId) => {
        try {
            const receipt = await GoodsReceiptModel.findById(goodsReceiptId).populate('goodsReceiptDetails')
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            if (receipt.status === 'COMPLETED') {
                throw new BadReq(errorCode.GOODS_RECEIPT_COMPLETED)
            }

            // Cho phép PENDING, PAUSED, SCANNING (backend restart giữa chừng)
            if (!['PENDING', 'PAUSED', 'SCANNING'].includes(receipt.status)) {
                throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)
            }

            // Tạm dừng batchlot khác đang SCANNING (chỉ 1 batchlot được SCANNING tại một thời điểm)
            const currentScanning = await GoodsReceiptModel.findOne({
                status: 'SCANNING',
                _id: { $ne: goodsReceiptId },
            })
            if (currentScanning) {
                await GoodsReceiptModel.findByIdAndUpdate(currentScanning._id, { status: 'PAUSED' })
                logger.info(`[Scan] Tạm dừng batchlot ${currentScanning.batchlot} để chuyển sang ${receipt.batchlot}`)
            }

            await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, { status: 'SCANNING' })

            const handleScanData = async (rawData) => {
                await goodsReceiptService._handleScanData(goodsReceiptId, receipt.batchlot, rawData)
            }

            // Resume nếu scanner đang kết nối (PAUSED hoặc SCANNING còn socket)
            if (['PAUSED', 'SCANNING'].includes(receipt.status) && deviceManager.importScanner.isConnected()) {
                deviceManager.resumeImportLine(handleScanData)
            } else {
                await deviceManager.connectImportLine(handleScanData)
            }

            return null
        } catch (error) {
            throw error
        }
    },

    /**
     * Tạm dừng quét: giữ kết nối TCP nhưng không xử lý dữ liệu.
     */
    pauseScan: async (goodsReceiptId) => {
        try {
            const receipt = await GoodsReceiptModel.findById(goodsReceiptId)
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, { status: 'PAUSED' })
            deviceManager.pauseImportLine()
            return null
        } catch (error) {
            throw error
        }
    },

    /**
     * Hoàn thành batchlot.
     */
    completeScan: async (goodsReceiptId) => {
        try {
            const receipt = await GoodsReceiptModel.findById(goodsReceiptId)
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, { status: 'COMPLETED' })
            deviceManager.pauseImportLine()
            return null
        } catch (error) {
            throw error
        }
    },

    /**
     * Thống kê hoàn thành: tổng hợp theo từng ngày quét.
     */
    getCompletionSummary: async (goodsReceiptId) => {
        try {
            const receipt = await GoodsReceiptModel.findById(goodsReceiptId)
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            const details = await GoodsReceiptDetailModel.find({ _id: { $in: receipt.goodsReceiptDetails } })

            const totalScanned = details.filter((d) => d.activationStatus === 'ACTIVATED').length
            const totalErrors = details.filter((d) => d.activationStatus === 'ERROR').length

            // Group by date of scannedAt
            const byDayMap = {}
            for (const d of details) {
                if (!d.scannedAt) continue
                const dateKey = d.scannedAt.toISOString().split('T')[0]
                if (!byDayMap[dateKey]) byDayMap[dateKey] = { date: dateKey, scanned: 0, errors: 0 }
                if (d.activationStatus === 'ACTIVATED') byDayMap[dateKey].scanned++
                if (d.activationStatus === 'ERROR') byDayMap[dateKey].errors++
            }

            return {
                batchlot: receipt.batchlot,
                status: receipt.status,
                total: receipt.total,
                totalScanned,
                totalErrors,
                totalRemaining: receipt.total - totalScanned - totalErrors,
                byDay: Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date)),
            }
        } catch (error) {
            throw error
        }
    },

    /**
     * Xử lý 1 lần quét từ scanner.
     * @private
     */
    _handleScanData: async (goodsReceiptId, batchlot, rawData) => {
        try {
            // DataMan 290X thường gửi: <trigger_count>;<barcode_data>;<status>
            const parts = rawData.split(';')
            const qrCode = parts.length > 1 ? parts[1].trim() : rawData.trim()

            if (!qrCode) return

            const detail = await GoodsReceiptDetailModel.findOne({ qrCode, _id: { $in: await _getDetailIds(goodsReceiptId) } })
            const io = global._io

            if (!detail) {
                logger.warn(`[Scan] QR không thuộc batchlot: ${qrCode}`)
                io?.emit('scan:error', { qrCode, reason: 'QR không thuộc batchlot này' })
                return
            }

            if (detail.scanStatus === 'SCANNED') {
                logger.info(`[Scan] QR đã quét trước đó: ${qrCode}`)
                io?.emit('scan:duplicate', { qrCode, productName: detail.productName, scannedAt: detail.scannedAt })
                return
            }

            // Gọi QAA kích hoạt
            try {
                await integrationService.activateQRcode(qrCode, new Date().toISOString(), batchlot)
            } catch (apiErr) {
                logger.error(`[Scan] Kích hoạt QR thất bại: ${qrCode} — ${apiErr.message}`)
                await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                    scanStatus: 'SCANNED',
                    activationStatus: 'ERROR',
                    scannedAt: new Date(),
                })
                io?.emit('scan:error', { qrCode, reason: 'Kích hoạt QR thất bại tại QAA' })
                return
            }

            await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                scanStatus: 'SCANNED',
                activationStatus: 'ACTIVATED',
                scannedAt: new Date(),
            })

            // Tính lại stats
            const baseFilter = { _id: { $in: await _getDetailIds(goodsReceiptId) } }
            const [total, activated, errors, remaining] = await Promise.all([
                GoodsReceiptDetailModel.countDocuments(baseFilter),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ACTIVATED' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ERROR' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, scanStatus: 'PENDING' }),
            ])

            io?.emit('scan:success', {
                qrCode,
                productCode: detail.productCode,
                productName: detail.productName,
                index: detail.index,
                stats: { total, activated, errors, remaining },
            })
            io?.emit('scan:stats', { total, activated, errors, remaining })
        } catch (error) {
            logger.error(`[Scan] Lỗi xử lý scan data: ${error.message}`)
        }
    },

    // Test endpoint giữ lại để phát triển
    getDataTest: async (batchlot) => {
        const mockDatabase = [
            {
                batchlot: 'BL-2024-001',
                total: 8,
                detail: [
                    { itemCode: 'MTSMBBASEAXXX-4L5', itemName: 'SƠN NƯỚC MATEX SẮC MÀU DỊU MÁT BASE A 4.5L', qrCode: '2000773-001', index: '1', status: 1 },
                    { itemCode: 'MTSMBBASEAXXX-4L5', itemName: 'SƠN NƯỚC MATEX SẮC MÀU DỊU MÁT BASE A 4.5L', qrCode: '2000773-002', index: '2', status: 1 },
                    { itemCode: 'OBST-9102XXXX-5L', itemName: 'SƠN NƯỚC ODL BÓNG SANG TRỌNG 9102 WHITE 5L', qrCode: '6059885-001', index: '3', status: 1 },
                    { itemCode: 'OBST-9102XXXX-5L', itemName: 'SƠN NƯỚC ODL BÓNG SANG TRỌNG 9102 WHITE 5L', qrCode: '6059885-002', index: '4', status: 2 },
                    { itemCode: 'SMTXBBASEBXXX-5L', itemName: 'SƠN NƯỚC SUPER MATEX BASE B 5L', qrCode: '2000892-001', index: '5', status: 1 },
                    { itemCode: 'SMTXBBASEBXXX-5L', itemName: 'SƠN NƯỚC SUPER MATEX BASE B 5L', qrCode: '2000892-002', index: '6', status: 1 },
                    { itemCode: 'VTXX-9102XXXX-17L', itemName: 'SƠN NƯỚC VATEX 9102 WHITE 17L', qrCode: '1007607-001', index: '7', status: 1 },
                    { itemCode: 'VTXX-9102XXXX-17L', itemName: 'SƠN NƯỚC VATEX 9102 WHITE 17L', qrCode: '1007607-002', index: '8', status: 1 },
                ],
                status: 200,
            },
            {
                batchlot: 'BL-2024-002',
                total: 3,
                detail: [
                    { itemCode: 'PROD002', itemName: 'Sản phẩm B', qrCode: 'QR-9999-B', index: '1', status: 1 },
                    { itemCode: 'PROD002', itemName: 'Sản phẩm B', qrCode: 'QR-9998-B', index: '2', status: 2 },
                    { itemCode: 'PROD002', itemName: 'Sản phẩm B', qrCode: 'QR-9997-B', index: '3', status: 1 },
                ],
                status: 200,
            },
        ]

        const result = mockDatabase.find((item) => item.batchlot === batchlot)
        return result || { batchlot, total: 0, detail: [], status: 404, message: 'Không tìm thấy Batch Lot này' }
    },
}

async function _getDetailIds(goodsReceiptId) {
    const receipt = await GoodsReceiptModel.findById(goodsReceiptId, { goodsReceiptDetails: 1 }).lean()
    return receipt?.goodsReceiptDetails || []
}

module.exports = goodsReceiptService
