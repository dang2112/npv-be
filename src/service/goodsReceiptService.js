const { BadReq } = require('../util/response/requestError')
const { errorCode } = require('../util/response/errorCode')
const GoodsReceiptModel = require('../model/goodsReceipt')
const GoodsReceiptDetailModel = require('../model/goodsReceiptDetail')
const GoodsReceiptConfigModel = require('../model/goodsReceiptConfig')
const integrationService = require('../util/integration/integrationService')
const deviceManager = require('../device/deviceManager')
const logger = require('../config/loggerConfig')
const { buildSearchRegex } = require('../util/regex')

const normalizeBatchlot = (batchlot) => String(batchlot ?? '').trim()

const isBatchlotNotFoundError = (error) => {
    const responseData = error.response?.data
    return (
        error.response?.status === 404 &&
        (responseData?.errorCode === 'BATCHLOT_QR_NOT_FOUND' ||
            responseData?.errorAt === 'SyncBatchlot')
    )
}

const goodsReceiptService = {
    /**
     * Trả về batchlot đang ở trạng thái SCANNING, kèm stats + danh sách chi tiết.
     * Luôn chỉ có tối đa 1 batchlot SCANNING tại một thời điểm.
     */
    getScanning: async () => {
        const receipt = await GoodsReceiptModel.findOne({
            status: 'SCANNING',
        }).lean()
        if (!receipt) return null
        return goodsReceiptService.getById(String(receipt._id))
    },

    getAll: async (search = '', page = 1, limit = 10) => {
        try {
            search = buildSearchRegex(search)
            page = Number(page)
            limit = Number(limit)

            const [items, totalItems] = await Promise.all([
                GoodsReceiptModel.find({ batchlot: search }, { __v: 0 })
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                GoodsReceiptModel.countDocuments({ batchlot: search }),
            ])

            return {
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
     * Lấy danh sách chi tiết của một goods receipt với filter, phân trang và thống kê.
     * @param {string} goodsReceiptId
     * @param {string} [search] - Tìm theo mã hoặc tên sản phẩm (regex, không phân biệt hoa thường)
     * @param {string} [status] - PENDING: chưa quét | ACTIVATED: đã kích hoạt | ERROR: lỗi kích hoạt
     * @param {number} [page=1]
     * @param {number} [limit=20]
     */
    getById: async (
        goodsReceiptId,
        { search = '', status, page = 1, limit = 20 } = {},
    ) => {
        try {
            const receipt =
                await GoodsReceiptModel.findById(goodsReceiptId).lean()
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            const baseFilter = { _id: { $in: receipt.goodsReceiptDetails } }

            const itemFilter = { ...baseFilter }
            if (search) {
                const searchRegex = buildSearchRegex(search)
                itemFilter.$or = [
                    { productCode: searchRegex },
                    { productName: searchRegex },
                ]
            }
            if (status === 'PENDING') itemFilter.scanStatus = 'PENDING'
            else if (status === 'ACTIVATED')
                itemFilter.activationStatus = 'ACTIVATED'
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

            const [items, totalItems, totalAll, activated, errors, remaining] =
                await Promise.all([
                    // SỬ DỤNG AGGREGATE ĐỂ CUSTOM SORT
                    GoodsReceiptDetailModel.aggregate([
                        { $match: itemFilter },
                        {
                            $addFields: {
                                sortPriority: {
                                    $switch: {
                                        branches: [
                                            {
                                                case: {
                                                    $eq: [
                                                        '$activationStatus',
                                                        'ERROR',
                                                    ],
                                                },
                                                then: 1,
                                            },
                                            {
                                                case: {
                                                    $eq: [
                                                        '$scanStatus',
                                                        'PENDING',
                                                    ],
                                                },
                                                then: 2,
                                            },
                                            {
                                                case: {
                                                    $eq: [
                                                        '$activationStatus',
                                                        'ACTIVATED',
                                                    ],
                                                },
                                                then: 3,
                                            },
                                        ],
                                        default: 4,
                                    },
                                },
                            },
                        },
                        { $sort: { sortPriority: 1, index: 1 } }, // Ưu tiên trạng thái trước, index sau
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'integrationHistories',
                                let: { refCode: '$qrCode' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: [
                                                    '$referenceCode',
                                                    '$$refCode',
                                                ],
                                            },
                                            status: 'FAILED', // Chỉ lấy các log thất bại
                                        },
                                    },
                                    { $sort: { createdAt: -1 } }, // Lấy log mới nhất
                                    { $limit: 1 },
                                ],
                                as: 'errorLog',
                            },
                        },
                        {
                            $addFields: {
                                errorMessage: {
                                    $arrayElemAt: ['$errorLog.errorMessage', 0],
                                },
                            },
                        },
                        { $project: { sortPriority: 0, __v: 0 } },
                    ]),
                    GoodsReceiptDetailModel.countDocuments(itemFilter),
                    GoodsReceiptDetailModel.countDocuments(baseFilter),
                    GoodsReceiptDetailModel.countDocuments({
                        ...baseFilter,
                        activationStatus: 'ACTIVATED',
                    }),
                    GoodsReceiptDetailModel.countDocuments({
                        ...baseFilter,
                        activationStatus: 'ERROR',
                    }),
                    GoodsReceiptDetailModel.countDocuments({
                        ...baseFilter,
                        scanStatus: 'PENDING',
                    }),
                ])
            return {
                receipt: {
                    _id: receipt._id,
                    batchlot: receipt.batchlot,
                    status: receipt.status,
                    quantityPerCarton: receipt.quantityPerCarton,
                },
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
            batchlot = normalizeBatchlot(batchlot)
            const batchlotInfo = await integrationService
                .syncBatchlot(batchlot, undefined, 'GOODS_RECEIPT')
                .catch((axiosError) => {
                    const httpStatus =
                        axiosError.response?.status || axiosError.status
                    if (httpStatus === 401)
                        throw new BadReq(errorCode.AUTHENTICATION_FAILED)
                    if (isBatchlotNotFoundError(axiosError))
                        throw new BadReq(errorCode.BATCHLOT_NOT_FOUND)
                    throw new BadReq(errorCode.INTERNAL_SERVER_ERROR)
                })

            const existingReceipt = await GoodsReceiptModel.findOne({
                batchlot,
            }).populate('goodsReceiptDetails')

            // activationStatus=1 trong QAA = đã kích hoạt trước đó
            const mapDetail = (p) => ({
                productCode: p.itemCode,
                productName: p.itemName,
                qrCode: p.qrCode,
                scanStatus: p.activationStatus === 1 ? 'SCANNED' : 'PENDING',
                activationStatus:
                    p.activationStatus === 1 ? 'ACTIVATED' : 'PENDING',
                zipMasterCode: p.zipMasterCode || null,
            })

            let receiptId

            if (!existingReceipt) {
                const inserted = await GoodsReceiptDetailModel.insertMany(
                    batchlotInfo.qrCodes.map(mapDetail),
                )
                const created = await GoodsReceiptModel.create({
                    batchlot: batchlotInfo.manufactureBatchlot,
                    total: batchlotInfo.totalCount,
                    goodsReceiptDetails: inserted.map((d) => d._id),
                    status: 'PENDING',
                })
                receiptId = created._id
            } else {
                // Merge: thêm QR mới chưa có trong DB, giữ nguyên QR đã quét
                const existingQRs = new Set(
                    existingReceipt.goodsReceiptDetails.map((d) => d.qrCode),
                )
                const newDetails = batchlotInfo.qrCodes
                    .filter((p) => !existingQRs.has(p.qrCode))
                    .map(mapDetail)
                if (newDetails.length > 0) {
                    const inserted =
                        await GoodsReceiptDetailModel.insertMany(newDetails)
                    await GoodsReceiptModel.findByIdAndUpdate(
                        existingReceipt._id,
                        {
                            $push: {
                                goodsReceiptDetails: {
                                    $each: inserted.map((d) => d._id),
                                },
                            },
                            $set: { total: batchlotInfo.totalCount },
                        },
                    )
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
            const receipt = await GoodsReceiptModel.findById(
                goodsReceiptId,
            ).populate('goodsReceiptDetails')

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

            await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                status: 'SCANNING',
            })
            const detailIds = receipt.goodsReceiptDetails.map((d) => d._id)
            const qrScanned = receipt.goodsReceiptDetails.filter(
                (d) =>
                    d.scanStatus === 'SCANNED' &&
                    d.activationStatus === 'ACTIVATED' &&
                    d.zipMasterCode === null,
            )

            const qrScannedCodes = qrScanned.map((d) => d.qrCode)

            const configScanData = {
                batchlot: receipt.batchlot,
                quantityPerCarton: receipt.quantityPerCarton || 0,
                // quantityScanned: receipt.quantityScanned || 0,
                quantityScanned: qrScannedCodes.length || 0,
                item: qrScanned.map((d) => d.qrCode),
                // item: qrScanned,
                itemError: [],
            }

            const handleScanData = async (rawData) => {
                await goodsReceiptService._handleScanData(
                    goodsReceiptId,
                    receipt.batchlot,
                    rawData,
                    detailIds,
                    configScanData,
                )
            }

            // Resume nếu scanner đang kết nối (PAUSED hoặc SCANNING còn socket)
            if (
                ['PAUSED', 'SCANNING'].includes(receipt.status) &&
                deviceManager.importScanner.isConnected()
            ) {
                deviceManager.resumeImportLine(handleScanData)
                deviceManager.resumeZipMasterCode(handleScanData)
            } else {
                await deviceManager.connectImportLine(handleScanData)
                await deviceManager.connectZipMasterCode(handleScanData)
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
            await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                status: 'PAUSED',
            })
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

            await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                status: 'COMPLETED',
            })
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

            const details = await GoodsReceiptDetailModel.find({
                _id: { $in: receipt.goodsReceiptDetails },
            })

            const totalScanned = details.filter(
                (d) => d.activationStatus === 'ACTIVATED',
            ).length
            const totalErrors = details.filter(
                (d) => d.activationStatus === 'ERROR',
            ).length // Thống kê theo trạng thái lỗi quét

            const uniqueMasterCodes = [
                ...new Set(details.map((d) => d.zipMasterCode).filter(Boolean)),
            ]
            const totalMasterCodeZipped = uniqueMasterCodes.length

            const totalQrCodeZippedSuccess = details.filter(
                (d) => d.activationStatus === 'ACTIVATED' && d.zipMasterCode,
            ).length

            const totalQrCodeNotZippedOrError = details.filter(
                (d) =>
                    (d.activationStatus === 'ACTIVATED' && !d.zipMasterCode) ||
                    d.activationStatus === 'ERROR',
            ).length

            // --- GROUP BY DAY (Sửa lỗi lệch múi giờ và tính thêm Master Code) ---
            const byDayMap = {}
            const dateFormatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            })

            for (const d of details) {
                if (!d.scannedAt) continue

                const dateKey = dateFormatter.format(new Date(d.scannedAt))
                if (!byDayMap[dateKey]) {
                    byDayMap[dateKey] = {
                        date: dateKey,
                        scanned: 0,
                        errors: 0,
                        // Thêm dữ liệu master code cho từng ngày
                        masterCodeCount: new Set(),
                        masterCodeErrorCount: 0,
                    }
                }

                if (d.activationStatus === 'ACTIVATED')
                    byDayMap[dateKey].scanned++
                if (d.activationStatus === 'ERROR') byDayMap[dateKey].errors++

                if (d.zipMasterCode) {
                    byDayMap[dateKey].masterCodeCount.add(d.zipMasterCode)
                }
            }

            // Chuyển Set về Number để trả về đúng format phẳng cho FE
            const byDayList = Object.values(byDayMap).map((day) => ({
                date: day.date,
                scanned: day.scanned,
                errors: day.errors,
                masterCodeCount: day.masterCodeCount.size,
                masterCodeErrorCount: day.masterCodeErrorCount,
            }))

            // Sắp xếp ngày tăng dần
            byDayList.sort((a, b) => {
                const parseDate = (dStr) => {
                    const [d, m, y] = dStr.split('/')
                    return new Date(`${y}-${m}-${d}`)
                }
                return parseDate(a.date) - parseDate(b.date)
            })

            // --- KHỚP Y CHANG FORMAT BAN ĐẦU CỦA BẠN + EXTEND THÊM Ô MỚI ---
            return {
                batchlot: receipt.batchlot,
                status: receipt.status,
                total: receipt.total || details.length,

                // Giữ nguyên 3 biến cũ của bạn
                totalScanned,
                totalErrors,
                totalRemaining:
                    (receipt.total || details.length) -
                    totalScanned -
                    totalErrors,

                // Thêm các biến mới bọc ngoài cho 6 ô UI dễ map
                totalMasterCodeZipped, // Số lượng Master Code đã ZIP
                totalQrCodeZippedSuccess, // Số lượng QR Code đã zip thành công
                totalQrCodeNotZippedOrError, // Số lượng QR Code chưa zip / lỗi

                // Giữ nguyên tên biến mảng cũ của bạn
                byDay: byDayList,
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
    _handleScanData: async (
        goodsReceiptId,
        batchlot,
        rawData,
        detailIds,
        configScanData,
    ) => {
        try {
            console.log('rawData')
            console.log(rawData)
            if (!rawData) return
            const io = global._io
            configScanData.item ??= []
            configScanData.itemError ??= []
            // 1. Phân tách và làm sạch dữ liệu
            let qrCode = rawData.trim()
            let isZipMasterCode = false
            const partsMasterCode = rawData.split('-')
            if (
                partsMasterCode.length > 1 &&
                partsMasterCode[0].startsWith('MC')
            ) {
                isZipMasterCode = true
                const quantityInCode = Number(partsMasterCode[0].substring(2))
                if (quantityInCode !== configScanData.quantityPerCarton) {
                    logger.warn(
                        `[Scan] Mã Master Code không khớp với cấu hình hệ thống`,
                    )
                    io?.emit('scan:error', {
                        qrCode,
                        listScanned: configScanData.item.map((code) => ({
                            qrCode: code,
                            status: 'success',
                        })),
                        message: `Mã Master Code sai định dạng số lượng (Yêu cầu loại chứa ${configScanData.quantityPerCarton} SP)`,
                    })
                    return
                }
            } else if (rawData.includes(';')) {
                const parts = rawData.split(';')
                qrCode = parts.length > 1 ? parts[1].trim() : rawData.trim()
            }

            const scannerSocket = global.scannerSockets?.['SCANNER_IMPORT']

            const baseFilter = { _id: { $in: detailIds } }
            const [dbItems, dbErrors] = await Promise.all([
                GoodsReceiptDetailModel.find({
                    ...baseFilter,
                    scanStatus: 'SCANNED',
                    activationStatus: 'ACTIVATED',
                    $or: [{ zipMasterCode: null }, { zipMasterCode: '' }],
                }).lean(),
                GoodsReceiptDetailModel.find({
                    ...baseFilter,
                    scanStatus: 'SCANNED',
                    activationStatus: 'ERROR',
                    $or: [{ zipMasterCode: null }, { zipMasterCode: '' }],
                }).lean(),
            ])

            configScanData.item = dbItems.map((d) => d.qrCode)
            configScanData.itemError = dbErrors.map((d) => d.qrCode)
            // COUNT Số lượng khi quét ( bao gồm cả ERROR và SUCCESS )
            // const currentScannedCount =
            //   configScanData.item.length + configScanData.itemError.length

            const isCartonFull =
                configScanData.item.length >= configScanData.quantityPerCarton

            // 2. XỬ LÝ KHI THÙNG ĐÃ ĐẦY (Chờ quét Master Code)
            if (isCartonFull) {
                if (isZipMasterCode) {
                    logger.info(`[Zip MasterCode] Đóng thùng với mã: ${qrCode}`)
                    if (configScanData.item.length > 0) {
                        await GoodsReceiptDetailModel.updateMany(
                            {
                                qrCode: { $in: configScanData.item },
                                ...baseFilter,
                            },
                            { $set: { zipMasterCode: qrCode } },
                        )
                    }
                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: true,
                        mastercode: qrCode,
                        listScanned: configScanData.item.map((code) => ({
                            qrCode: code,
                            status: 'success',
                        })),
                        message: `Đã đóng thùng thành công`,
                    })

                    // Nhả chặn khi nhận được mã Master Code (phát tín hiệu thêm 1 lần)
                    if (scannerSocket) {
                        scannerSocket.write('||>OUTPUT.USER1\r\n')
                        logger.info(
                            `[Scan] Nhả chặn thùng khi nhận được mã Master Code: ${qrCode}`,
                        )
                    }

                    // Reset State an toàn sau khi đã ghi nhận Master Code vào DB thành công
                    configScanData.item = []
                    configScanData.itemError = []
                    configScanData.quantityScanned = 0
                    await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                        quantityScanned: 0,
                    })
                    return
                } else {
                    logger.warn(
                        `[Scan] Thùng đã đầy sản phẩm, từ chối quét thêm QR lẻ: ${qrCode}`,
                    )
                    io?.emit('scan:error', {
                        qrCode,
                        message:
                            'Thùng đã đủ số lượng, vui lòng quét Master Code để đóng thùng trước!',
                    })
                    return
                }
            }

            // 3. XỬ LÝ KHI THÙNG CHƯA ĐẦY MÀ LẠI QUÉT MASTER CODE TRƯỚC
            if (isZipMasterCode) {
                logger.error(
                    `[Zip MasterCode] Mã Master Code nhưng thùng chưa đủ số lượng: ${qrCode}`,
                )
                io?.emit('scan:error', {
                    qrCode,
                    message:
                        'Thùng chưa đủ số lượng sản phẩm, không thể đóng Master Code.',
                })
                return
            }

            // 4. KIỂM TRA SẢN PHẨM TRONG HỆ THỐNG TRƯỚC KHI XỬ LÝ (CHẶN SỚM)
            const detail = await GoodsReceiptDetailModel.findOne({
                qrCode,
                ...baseFilter,
            })
            if (qrCode !== 'NoRead' && !detail) {
                logger.warn(`[Scan] QR không thuộc batchlot: ${qrCode}`)
                if (scannerSocket) {
                    scannerSocket.write('||>OUTPUT.USER1\r\n')
                    logger.warn(
                        `[Scan] Đã phát lệnh chặn do QR không thuộc batchlot`,
                    )
                }
                io?.emit('scan:error', {
                    qrCode,
                    message: 'QR không thuộc batchlot này',
                })
                return
            }

            // XỬ LÝ NOREAD ( Không đọc được mã vạch )
            if (
                qrCode === 'NoRead' ||
                qrCode === 'NO READ' ||
                qrCode === 'NO-READ'
            ) {
                logger.warn(`[Scan] Mã QR: ${qrCode}`)
                configScanData.quantityScanned++
                configScanData.itemError.push(qrCode)

                io?.emit('scan:error', {
                    qrCode,
                    listScanned: configScanData.item.map((code) => ({
                        qrCode: code,
                        status: 'success',
                    })),
                    message: `Không đọc được mã QR`,
                })

                // Đếm lại tổng số lượng đã quét hiện tại (sau khi đã push NoRead)
                const newTotalScanned =
                    configScanData.item.length + configScanData.itemError.length

                // Nếu đầy thùng thì xuất lệnh chặn
                if (newTotalScanned >= configScanData.quantityPerCarton) {
                    logger.info(
                        `[Scan] Đạt giới hạn thùng do có mã NoRead (${newTotalScanned}/${configScanData.quantityPerCarton}). Dừng băng tải.`,
                    )
                    if (scannerSocket) {
                        scannerSocket.write('||>OUTPUT.USER1\r\n')
                    }
                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: true,
                        listScanned: [
                            ...(configScanData.item || []).map((code) => ({
                                qrCode: code,
                                status: 'success',
                            })),
                            ...(configScanData.itemError || []).map((code) => ({
                                qrCode: code,
                                status: 'error',
                            })),
                        ],
                    })
                } else {
                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: false,
                        listScanned: [
                            ...(configScanData.item || []).map((code) => ({
                                qrCode: code,
                                status: 'success',
                            })),
                            ...(configScanData.itemError || []).map((code) => ({
                                qrCode: code,
                                status: 'error',
                            })),
                        ],
                    })
                }
                return
            }

            // Xử lý DUPLICATE (trùng lặp)
            if (
                detail.activationStatus === 'ACTIVATED' &&
                detail.scanStatus === 'SCANNED'
            ) {
                logger.info(
                    `[Scan] QR đã quét và kích hoạt thành công trước đó: ${qrCode}`,
                )
                io?.emit('scan:duplicate', {
                    qrCode,
                    productName: detail.productName,
                    message: 'Mã QR đã được quét và kích hoạt trước đó.',
                })

                if (scannerSocket) {
                    scannerSocket.write('||>OUTPUT.USER1\r\n')
                    logger.warn(`[Scan] Đã phát lệnh chặn do quét trùng mã QR`)
                }
                // Không tăng count (configScanData.quantityScanned++) để tránh sai số lượng thùng
                return
            }

            // 5. GỌI API KÍCH HOẠT QR CODE (CHỈ KHI THÀNH CÔNG MỚI ĐƯỢC TÍNH VÀO TIẾN TRÌNH THÙNG)
            try {
                await integrationService.activateQRcode(
                    qrCode,
                    new Date().toISOString(),
                    batchlot,
                    'GOODS_RECEIPT',
                )
                // Chỉ chạy khi API kích hoạt trả về SUCCESS
                configScanData.quantityScanned++
                configScanData.item.push(qrCode)
                // Mã này nằm trong danh sách lỗi (nếu có trước đó), hãy xóa nó đi!
                if (
                    configScanData.itemError &&
                    configScanData.itemError.includes(qrCode)
                ) {
                    configScanData.itemError = configScanData.itemError.filter(
                        (code) => code !== qrCode,
                    )
                }
                // Cập nhật số lượng tổng đã kích hoạt thành công vào đơn hàng tổng
                await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                    quantityScanned: configScanData.quantityScanned,
                })
                // Cập nhật trạng thái chi tiết sản phẩm thành ACTIVATED
                await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                    scanStatus: 'SCANNED',
                    activationStatus: 'ACTIVATED',
                    scannedAt: new Date(),
                })
                io?.emit('scan:success', {
                    qrCode,
                    productCode: detail.productCode,
                    productName: detail.productName,
                    index: detail.index,
                    scannedAt: new Date(),
                })

                // Đếm lại tổng số lượng đã quét hiện tại
                const newTotalScanned =
                    configScanData.item.length + configScanData.itemError.length

                // Kiểm tra xem mã vừa quét có làm đầy thùng luôn không
                if (newTotalScanned >= configScanData.quantityPerCarton) {
                    logger.info(
                        `[Scan] Đã quét đủ số lượng thực tế thành công (${newTotalScanned}/${configScanData.quantityPerCarton}). Dừng băng tải.`,
                    )
                    if (scannerSocket) {
                        scannerSocket.write('||>OUTPUT.USER1\r\n')
                    }
                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: true,
                        listScanned: configScanData.item.map((code) => ({
                            qrCode: code,
                            status: 'success',
                        })),
                        message: 'Vui lòng quét Master code',
                    })
                } else {
                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: false,
                        listScanned: configScanData.item.map((code) => ({
                            qrCode: code,
                            status: 'success',
                        })),
                    })
                }
                // Tính toán stats cập nhật cho client
                const [total, activated, errors, remaining] = await Promise.all(
                    [
                        GoodsReceiptDetailModel.countDocuments(baseFilter),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ACTIVATED',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ERROR',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            scanStatus: 'PENDING',
                        }),
                    ],
                )
                io?.emit('scan:stats', { total, activated, errors, remaining })
            } catch (apiErr) {
                logger.error(
                    `[Scan] Kích hoạt QR thất bại tại QAA: ${qrCode} — ${apiErr.message}`,
                )
                // Nếu API lỗi, cập nhật trạng thái ERROR vào DB và KHÔNG TĂNG configScanData.quantityScanned
                await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                    scanStatus: 'SCANNED',
                    activationStatus: 'ERROR',
                    scannedAt: new Date(),
                })
                const [total, activated, errors, remaining] = await Promise.all(
                    [
                        GoodsReceiptDetailModel.countDocuments(baseFilter),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ACTIVATED',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ERROR',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            scanStatus: 'PENDING',
                        }),
                    ],
                )
                if (!configScanData.itemError.includes(qrCode)) {
                    configScanData.itemError.push(qrCode)
                }
                io?.emit('scan:error', {
                    qrCode,
                    reason: `Kích hoạt QR thất bại tại QAA: ${apiErr.message}`,
                    productCode: detail.productCode,
                    productName: detail.productName,
                    index: detail.index,
                    stats: { total, activated, errors, remaining },
                    listScannedError: configScanData.itemError,
                })
                const newTotalScanned =
                    configScanData.item.length + configScanData.itemError.length
                const currentList = [
                    ...configScanData.item.map((code) => ({
                        qrCode: code,
                        status: 'success',
                    })),
                    ...configScanData.itemError.map((code) => ({
                        qrCode: code,
                        status: 'error',
                    })),
                ]
                if (newTotalScanned >= configScanData.quantityPerCarton) {
                    logger.warn(
                        `[Scan] Đạt giới hạn thùng do có mã lỗi (${newTotalScanned}/${configScanData.quantityPerCarton}). Dừng băng tải.`,
                    )
                    if (scannerSocket) {
                        scannerSocket.write('||>OUTPUT.USER1\r\n') // Phải phát lệnh dừng vật lý để hàng lỗi không chạy tiếp qua thùng sau
                    }
                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: true,
                        listScanned: [
                            ...(configScanData.item || []).map((code) => ({
                                qrCode: code,
                                status: 'success',
                            })),
                            ...(configScanData.itemError || []).map((code) => ({
                                qrCode: code,
                                status: 'error',
                            })),
                        ],
                    })
                } else {
                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: false,
                        listScanned: currentList,
                    })
                }
            }
        } catch (error) {
            logger.error(
                `[Scan] Lỗi hệ thống nghiêm trọng trong _handleScanData: ${error.message}`,
            )
        }
    },

    unPack: async (goodsReceiptId, masterCode) => {
        try {
            const receipt = await GoodsReceiptModel.findById(goodsReceiptId)
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            let filter = {
                _id: { $in: receipt.goodsReceiptDetails },
            }

            if (masterCode) {
                filter.zipMasterCode = masterCode
            } else {
                filter.scanStatus = 'SCANNED'
                filter.$or = [{ zipMasterCode: null }, { zipMasterCode: '' }]
            }
            const updatedCount = await GoodsReceiptDetailModel.updateMany(
                filter,
                {
                    $set: {
                        scanStatus: 'PENDING',
                        activationStatus: 'PENDING',
                        scannedAt: null,
                        zipMasterCode: null,
                    },
                },
            )

            // Nếu mở thùng hiện tại (không truyền masterCode), reset số lượng đang quét về 0
            if (!masterCode) {
                await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                    quantityScanned: 0,
                })
            }

            // Phát socket cập nhật stats cho FE
            const io = global._io
            if (io) {
                const baseFilter = { _id: { $in: receipt.goodsReceiptDetails } }
                const [total, activated, errors, remaining] = await Promise.all(
                    [
                        GoodsReceiptDetailModel.countDocuments(baseFilter),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ACTIVATED',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ERROR',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            scanStatus: 'PENDING',
                        }),
                    ],
                )
                io.emit('scan:stats', { total, activated, errors, remaining })

                // Nếu là thùng hiện tại, reset danh sách quét trên UI
                if (!masterCode) {
                    io.emit('scan:cartonCompleted', {
                        isCompletedToPack: false,
                        listScanned: [],
                    })
                }
            }

            return {
                message: `Đã mở thùng thành công. Số lượng sản phẩm được mở thùng: ${updatedCount.modifiedCount}`,
            }
        } catch (error) {
            throw error
        }
    },
    update: async (goodsReceiptId, updateData) => {
        try {
            const { quantityPerCarton } = updateData
            const receipt = await GoodsReceiptModel.findById(goodsReceiptId)
            if (!receipt) throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)

            // Reset tất cả các sản phẩm đang quét dở dang (chưa đóng thùng) về trạng thái mặc định
            await GoodsReceiptDetailModel.updateMany(
                {
                    _id: { $in: receipt.goodsReceiptDetails },
                    scanStatus: 'SCANNED',
                    $or: [{ zipMasterCode: null }, { zipMasterCode: '' }],
                },
                {
                    $set: {
                        scanStatus: 'PENDING',
                        activationStatus: 'PENDING',
                        scannedAt: null,
                        zipMasterCode: null,
                    },
                },
            )

            const updatedReceipt = await GoodsReceiptModel.findByIdAndUpdate(
                goodsReceiptId,
                { quantityPerCarton, quantityScanned: 0 },
                {
                    new: true,
                    select: 'quantityPerCarton quantityScanned goodsReceiptDetails',
                },
            )

            // Phát socket cập nhật stats cho FE
            const io = global._io
            if (io) {
                const baseFilter = {
                    _id: { $in: updatedReceipt.goodsReceiptDetails },
                }
                const [total, activated, errors, remaining] = await Promise.all(
                    [
                        GoodsReceiptDetailModel.countDocuments(baseFilter),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ACTIVATED',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            activationStatus: 'ERROR',
                        }),
                        GoodsReceiptDetailModel.countDocuments({
                            ...baseFilter,
                            scanStatus: 'PENDING',
                        }),
                    ],
                )
                io.emit('scan:stats', { total, activated, errors, remaining })
                io.emit('scan:cartonCompleted', {
                    isCompletedToPack: false,
                    listScanned: [],
                })
            }

            return updatedReceipt
        } catch (error) {
            throw error
        }
    },
    //get all pack list configurations
    getAllConfigs: async (search = '', page = 1, limit = 10) => {
        try {
            search = buildSearchRegex(search)
            page = Number(page)
            limit = Number(limit)

            const [items, totalItems] = await Promise.all([
                GoodsReceiptConfigModel.find({ name: search }, { __v: 0 })
                    .sort({ value: 1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                GoodsReceiptConfigModel.countDocuments({ name: search }),
            ])

            return {
                items,
                page,
                totalItems,
                totalPage: Math.ceil(totalItems / limit),
            }
        } catch (error) {
            throw error
        }
    },

    //update 1 pack list configuration
    updateConfig: async (goodsReceiptConfigId, updateData) => {
        try {
            const receiptConfig =
                await GoodsReceiptConfigModel.findByIdAndUpdate(
                    goodsReceiptConfigId,
                    { $set: updateData },
                    {
                        new: true,
                        runValidators: true,
                    },
                )
            if (!receiptConfig)
                throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)
            return receiptConfig
        } catch (error) {
            throw error
        }
    },

    //delete 1 pack list configuration
    deleteConfig: async (goodsReceiptConfigId) => {
        try {
            const receiptConfig = await GoodsReceiptConfigModel.deleteOne({
                _id: goodsReceiptConfigId,
            })
            if (!receiptConfig)
                throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)
            return receiptConfig
        } catch (error) {
            throw error
        }
    },

    createConfig: async (updateData) => {
        try {
            const receiptConfig = await GoodsReceiptConfigModel.create({
                name: updateData.name,
                value: updateData.value,
            })
            if (!receiptConfig)
                throw new BadReq(errorCode.GOODS_RECEIPT_NOT_FOUND)
            return receiptConfig
        } catch (error) {
            throw error
        }
    },
}

module.exports = goodsReceiptService
