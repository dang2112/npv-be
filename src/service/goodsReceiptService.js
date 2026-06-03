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
        return goodsReceiptService.getById(String(receipt._id))
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

            // const [items, totalItems, totalAll, activated, errors, remaining] = await Promise.all([
            //     GoodsReceiptDetailModel.find(itemFilter, { __v: 0 }).sort({ index: 1 }).skip((page - 1) * limit).limit(limit),
            //     GoodsReceiptDetailModel.countDocuments(itemFilter),
            //     GoodsReceiptDetailModel.countDocuments(baseFilter),
            //     GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ACTIVATED' }),
            //     GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ERROR' }),
            //     GoodsReceiptDetailModel.countDocuments({ ...baseFilter, scanStatus: 'PENDING' }),
            // ])

            const [items, totalItems, totalAll, activated, errors, remaining] = await Promise.all([
                // SỬ DỤNG AGGREGATE ĐỂ CUSTOM SORT
                GoodsReceiptDetailModel.aggregate([
                    { $match: itemFilter },
                    {
                        $addFields: {
                            sortPriority: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$activationStatus", "ERROR"] }, then: 1 },
                                        { case: { $eq: ["$scanStatus", "PENDING"] }, then: 2 },
                                        { case: { $eq: ["$activationStatus", "ACTIVATED"] }, then: 3 }
                                    ],
                                    default: 4
                                }
                            }
                        }
                    },
                    { $sort: { sortPriority: 1, index: 1 } }, // Ưu tiên trạng thái trước, index sau
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    { $project: { sortPriority: 0, __v: 0 } }
                ]),
                GoodsReceiptDetailModel.countDocuments(itemFilter),
                GoodsReceiptDetailModel.countDocuments(baseFilter),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ACTIVATED' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ERROR' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, scanStatus: 'PENDING' }),
            ]);

            return {
                receipt: { _id: receipt._id, batchlot: receipt.batchlot, status: receipt.status, quantityPerCarton: receipt.quantityPerCarton },
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
            const batchlotInfo = await integrationService.syncBatchlot(batchlot, undefined, 'GOODS_RECEIPT')
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
            // if (receipt.status === 'COMPLETED') {
            //     throw new BadReq(errorCode.GOODS_RECEIPT_COMPLETED)
            // }

            // Cho phép PENDING, PAUSED, SCANNING (backend restart giữa chừng)
            // if (!['PENDING', 'PAUSED', 'SCANNING'].includes(receipt.status)) {
            //     throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)
            // }

            // Atomic: tạm dừng tất cả batchlot SCANNING khác trong 1 lệnh
            // Dùng updateMany thay vì findOne + update riêng để tránh race condition
            await GoodsReceiptModel.updateMany(
                { status: 'SCANNING', _id: { $ne: goodsReceiptId } },
                { $set: { status: 'PAUSED' } },
            )

            await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, { status: 'SCANNING' })

            const detailIds = receipt.goodsReceiptDetails.map((d) => d._id)
            const configScanData = {
                batchlot: receipt.batchlot,
                quantityPerCarton: receipt.quantityPerCarton || 0,
                quantityScanned: receipt.quantityScanned || 0,
            }
            const handleScanData = async (rawData) => {
                await goodsReceiptService._handleScanData(goodsReceiptId, receipt.batchlot, rawData, detailIds, configScanData)
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
            await deviceManager.disconnectImportLine()
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
     * @param {string} goodsReceiptId
     * @param {string} batchlot
     * @param {string} rawData
     * @param {ObjectId[]} detailIds - danh sách _id của goodsReceiptDetails (truyền từ startScan để tránh query thừa)
     */
    _handleScanData: async (goodsReceiptId, batchlot, rawData, detailIds, configScanData) => {
        try {
            if (configScanData.quantityScanned > configScanData.quantityPerCarton) {
                logger.info(`[Scan] Số lượng quét đã đủ trên carton, vui lòng đổi carton mới`)
                const io = global._io
                io?.emit('scan:cartonCompleted', { scannedEnough: true, message: 'Số lượng quét đã đủ trên carton, vui lòng đổi carton mới' })
                return
            }
            // DataMan 290X thường gửi: <trigger_count>;<barcode_data>;<status>
            const parts = rawData.split(';')
            const qrCode = parts.length > 1 ? parts[1].trim() : rawData.trim()

            if (!qrCode) return
            const baseFilter = { _id: { $in: detailIds } }
            const detail = await GoodsReceiptDetailModel.findOne({ qrCode, ...baseFilter })
            const io = global._io

            if (!detail) {
                logger.warn(`[Scan] QR không thuộc batchlot: ${qrCode}`)
                io?.emit('scan:error', { qrCode, reason: 'QR không thuộc batchlot này' })
                return
            }

            // if (detail.scanStatus === 'SCANNED') {
            //     logger.info(`[Scan] QR đã quét trước đó: ${qrCode}`)
            //     io?.emit('scan:duplicate', { qrCode, productName: detail.productName, scannedAt: detail.scannedAt })
            //     return
            // }

            // Gọi QAA kích hoạt
            try {
                await integrationService.activateQRcode(qrCode, new Date().toISOString(), batchlot, 'GOODS_RECEIPT')
                console.log('Kích hoạt QR thành công')
                configScanData.quantityScanned++
                // Cập nhật số lượng đã quét thành công
                await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                    quantityScanned: configScanData.quantityScanned,
                })
                if (configScanData.quantityPerCarton === configScanData.quantityScanned) {
                    logger.info(`[Scan] Đã quét đủ số lượng trên carton, tự động pause để đổi carton mới`)
                    // ĐIỀU KHIỂN STOPPER dừng lại
                    io?.emit('scan:cartonCompleted', { scannedEnough: true })
                    await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                        quantityScanned: 0,
                    })
                }
            } catch (apiErr) {
                logger.error(`[Scan] Kích hoạt QR thất bại: ${qrCode} — ${apiErr.message}`)
                await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                    scanStatus: 'SCANNED',
                    activationStatus: 'ERROR',
                    scannedAt: new Date(),
                })

                // io?.emit('scan:error', { qrCode, reason: 'Kích hoạt QR thất bại tại QAA' })
                // Tính lại stats (dùng detailIds đã có sẵn)
                const [total, activated, errors, remaining] = await Promise.all([
                    GoodsReceiptDetailModel.countDocuments(baseFilter),
                    GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ACTIVATED' }),
                    GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ERROR' }),
                    GoodsReceiptDetailModel.countDocuments({ ...baseFilter, scanStatus: 'PENDING' }),
                ])
                io?.emit('scan:error', {
                    qrCode,
                    reason: 'Kích hoạt QR thất bại tại QAA',
                    productCode: detail.productCode,
                    productName: detail.productName,
                    index: detail.index,
                    stats: { total, activated, errors, remaining },
                })

                // io?.emit('scan:error', {
                //     qrCode,
                //     reason: 'Kích hoạt QR thất bại tại QAA',
                //     total: currentTotal,
                //     stats: {
                //         activated: activatedCount,
                //         errors: errorCount,
                //         remaining: remainingCount
                //     }
                // });
                return
            }

            await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                scanStatus: 'SCANNED',
                activationStatus: 'ACTIVATED',
                scannedAt: new Date(),
            })

            // Tính lại stats (dùng detailIds đã có sẵn)
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
                scannedAt: new Date(),
                stats: { total, activated, errors, remaining },
            })
            io?.emit('scan:stats', { total, activated, errors, remaining })
        } catch (error) {
            logger.error(`[Scan] Lỗi xử lý scan data: ${error.message}`)
        }
    },

    update: async (goodsReceiptId, updateData) => {
        try {
            const { quantityPerCarton } = updateData
            const receipt = await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, { quantityPerCarton }, {
                new: true,
                select: 'quantityPerCarton'
            })
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)
            return receipt
        } catch (error) {
            throw error
        }
    }
}

module.exports = goodsReceiptService
