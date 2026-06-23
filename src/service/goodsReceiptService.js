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
                            },
                        }
                    },
                    { $sort: { sortPriority: 1, index: 1 } }, // Ưu tiên trạng thái trước, index sau
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "integrationHistories",
                            let: { refCode: "$qrCode" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ["$referenceCode", "$$refCode"] },
                                        status: "FAILED" // Chỉ lấy các log thất bại
                                    }
                                },
                                { $sort: { createdAt: -1 } }, // Lấy log mới nhất
                                { $limit: 1 }
                            ],
                            as: "errorLog"
                        }
                    },
                    {
                        $addFields: {
                            errorMessage: { $arrayElemAt: ["$errorLog.errorMessage", 0] }
                        }
                    },
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
            const mapDetail = (p) => (
                {
                    productCode: p.itemCode,
                    productName: p.itemName,
                    qrCode: p.qrCode,
                    scanStatus: p.activationStatus === 1 ? 'SCANNED' : 'PENDING',
                    activationStatus: p.activationStatus === 1 ? 'ACTIVATED' : 'PENDING',
                    zipMasterCode: p.zipMasterCode || null,
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
            const qrScanned = receipt.goodsReceiptDetails.filter(
                (d) => d.scanStatus === 'SCANNED' && d.activationStatus === 'ACTIVATED' && d.zipMasterCode === null
            );

            const qrScannedCodes = qrScanned.map((d) => d.qrCode);


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
                await goodsReceiptService._handleScanData(goodsReceiptId, receipt.batchlot, rawData, detailIds, configScanData)
            }

            // Resume nếu scanner đang kết nối (PAUSED hoặc SCANNING còn socket)
            if (['PAUSED', 'SCANNING'].includes(receipt.status) && deviceManager.importScanner.isConnected()) {
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
            console.log("Raw Data nhận được:", rawData);
            if (!rawData) return;

            // ĐƯA LÊN ĐẦU HÀM: Khai báo 'io' ngay lập tức để toàn bộ hàm phía dưới đều dùng được
            const io = global._io;

            let qrCode = "";
            let isZipMasterCode = false;
            const partsMasterCode = rawData.split('-');

            // 1. Phân tách thiết bị và làm sạch dữ liệu QR
            if (partsMasterCode.length > 1 && partsMasterCode[0].startsWith('MC')) {
                isZipMasterCode = true;
                qrCode = rawData.trim();
                const quantityInCode = Number(partsMasterCode[0].substring(2));
                // Kiểm tra xem số lượng định dạng trên mã thùng có khớp với cấu hình hệ thống không
                if (quantityInCode !== configScanData.quantityPerCarton) {
                    logger.warn(`[Scan] Mã Master Code không khớp với cấu hình hệ thống`);

                    io?.emit('scan:error', {
                        qrCode: qrCode,
                        listScanned: configScanData.item.map(code => ({ qrCode: code, status: 'success' })),
                        message: `Mã Master Code sai định dạng số lượng sản phẩm (Yêu cầu loại chứa ${configScanData.quantityPerCarton} sản phẩm)`
                    });
                    return; // Ngắt luồng, không xử lý mã thùng sai cấu hình
                }
            } else {
                isZipMasterCode = false;
                if (rawData.includes(';')) {
                    const parts = rawData.split(';');
                    qrCode = parts.length > 1 ? parts[1].trim() : rawData.trim();
                } else {
                    qrCode = rawData.trim();
                }
            }

            // 2. ZIP MASTER CODE
            if (configScanData.quantityScanned >= configScanData.quantityPerCarton) {
                logger.info(`[Scan] Số lượng quét đã đủ, vui lòng quét Master Code`);
                io?.emit('scan:cartonCompleted', {
                    isCompletedToPack: true,
                    listScanned: configScanData.item.map(code => ({ qrCode: code, status: 'success' })),
                    message: 'Số lượng sản phẩm đã đủ vui lòng quét Master Code'
                });

                // ĐIỀU KHIỂN STOPPER dừng lại qua cổng TCP Cognex
                const scannerSocket = global.scannerSockets?.['SCANNER_IMPORT'];
                if (scannerSocket) {
                    scannerSocket.write('||>OUTPUT.USER1\r\n');
                    logger.info('[Scan] Đã gửi TRIGGER USER1 tới Cognex');
                }


                // Nếu người dùng quét mã thùng Zebra khi carton đã đầy
                if (isZipMasterCode) {
                    logger.info(`[Zebra TC51] Mã ZipMasterCode: ${qrCode}`);

                    if (configScanData.item.length > 0) {
                        // Cập nhật mã thùng thực tế vừa quét cho toàn bộ sản phẩm đang chờ đóng carton
                        await GoodsReceiptDetailModel.updateMany(
                            { qrCode: { $in: configScanData.item } },
                            { $set: { zipMasterCode: qrCode } }
                        );

                        io?.emit('scan:cartonCompleted', {
                            isCompletedToPack: true,
                            mastercode: qrCode,
                            listScanned: configScanData.item.map(code => ({ qrCode: code, status: 'success' })),
                            message: `Đã đóng thùng thành công với mã: ${qrCode}`
                        });

                        // // Reset bộ đếm carton tạm thời
                        configScanData.item = [];
                        configScanData.quantityScanned = 0;

                        // Cập nhật lại số lượng quét trên đơn về 0 để chuẩn bị cho carton mới
                        await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, { quantityScanned: 0 });
                    }
                }
                return;
            }

            // 3. CHẶN NẾU THÙNG ĐANG TRỐNG MÀ LẠI QUÉT MÃ THÙNG TRƯỚC
            if (isZipMasterCode) {
                logger.error(`[Zebra TC51] Mã ZipMasterCode nhưng thùng đang trống: ${qrCode}`);
                io?.emit('scan:error', { qrCode, reason: 'Thùng đang trống, vui lòng quét sản phẩm trước.' });
                return;
            }

            // 4. QUÉT SẢN PHẨM
            if (!qrCode) return;

            const baseFilter = { _id: { $in: detailIds } };
            const detail = await GoodsReceiptDetailModel.findOne({ qrCode, ...baseFilter });
            if (!detail) {
                logger.warn(`[Scan] QR không thuộc batchlot: ${qrCode}`);
                io?.emit('scan:error', { qrCode, message: 'QR không thuộc batchlot này' });
                return;
            }
            // Kiểm tra trùng mã lẻ nếu cần (bỏ comment nếu muốn chặn quét trùng)
            if (detail.activationStatus === "SUCCESS" && detail.scanStatus === 'SCANNED') {
                logger.info(`[Scan] QR đã quét trước đó: ${qrCode}`)
                io?.emit('scan:duplicate', { qrCode, productName: detail.productName, scannedAt: detail.scannedAt, message: "Mã QR đã được quét trước đó" })
                io?.emit('scan:cartonCompleted', {
                    isCompletedToPack: false,
                    listScanned: configScanData.item.map(code => ({ qrCode: code, status: 'success' }))
                });
                return
            }
            // 5. GỌI QAA KÍCH HOẠT QR CODE
            try {
                await integrationService.activateQRcode(qrCode, new Date().toISOString(), batchlot, 'GOODS_RECEIPT');
                configScanData.quantityScanned++;

                // Cập nhật số lượng đã quét thành công vào DB đơn tổng
                await GoodsReceiptModel.findByIdAndUpdate(goodsReceiptId, {
                    quantityScanned: configScanData.quantityScanned,
                });

                configScanData.item.push(qrCode);

                io?.emit('scan:cartonCompleted', {
                    isCompletedToPack: false,
                    listScanned: configScanData.item.map(code => ({ qrCode: code, status: 'success' }))
                });

                // Nếu vừa vặn quét đủ số lượng cho 1 carton, ra lệnh dừng stopper tự động
                if (configScanData.quantityPerCarton === configScanData.quantityScanned) {
                    logger.info(`[Scan] Đã quét đủ số lượng trên carton, tự động dừng băng tải để đổi carton mới`);

                    // ĐIỀU KHIỂN STOPPER dừng lại qua cổng TCP Cognex
                    const scannerSocket = global.scannerSockets?.['SCANNER_IMPORT'];
                    if (scannerSocket) {
                        scannerSocket.write('||>OUTPUT.USER1\r\n');
                        logger.info('[Scan] Đã gửi TRIGGER OFF tới Cognex');
                    }

                    io?.emit('scan:cartonCompleted', {
                        isCompletedToPack: true,
                        listScanned: configScanData.item.map(code => ({ qrCode: code, status: 'success' })),
                        message: 'Vui lòng quét Master code'
                    });
                }

            } catch (apiErr) {
                logger.error(`[Scan] Kích hoạt QR thất bại: ${qrCode} — ${apiErr.message}`);

                await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                    scanStatus: 'SCANNED',
                    activationStatus: 'ERROR',
                    scannedAt: new Date(),
                });

                const [total, activated, errors, remaining] = await Promise.all([
                    GoodsReceiptDetailModel.countDocuments(baseFilter),
                    GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ACTIVATED' }),
                    GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ERROR' }),
                    GoodsReceiptDetailModel.countDocuments({ ...baseFilter, scanStatus: 'PENDING' }),
                ]);

                // Đảm bảo mảng itemError tồn tại trước khi push
                configScanData.itemError ??= [];
                if (!configScanData.itemError.includes(qrCode)) {
                    configScanData.itemError.push(qrCode);
                }

                io?.emit('scan:error', {
                    qrCode,
                    reason: 'Kích hoạt QR thất bại tại QAA',
                    productCode: detail.productCode,
                    productName: detail.productName,
                    index: detail.index,
                    stats: { total, activated, errors, remaining },
                    listScannedError: configScanData.itemError
                });

                const listScannedBefore = [
                    ...configScanData.item.map(code => ({ qrCode: code, status: 'success' })),
                    ...configScanData.itemError.map(code => ({ qrCode: code, status: 'error' })),
                ];

                io?.emit('scan:cartonCompleted', {
                    isCompletedToPack: false,
                    listScanned: listScannedBefore
                });

                return;
            }

            // 6. CẬP NHẬT TRẠNG THÁI KHI KÍCH HOẠT THÀNH CÔNG VÀ TÍNH TOÁN STATS
            await GoodsReceiptDetailModel.findByIdAndUpdate(detail._id, {
                scanStatus: 'SCANNED',
                activationStatus: 'ACTIVATED',
                scannedAt: new Date(),
            });

            const [total, activated, errors, remaining] = await Promise.all([
                GoodsReceiptDetailModel.countDocuments(baseFilter),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ACTIVATED' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, activationStatus: 'ERROR' }),
                GoodsReceiptDetailModel.countDocuments({ ...baseFilter, scanStatus: 'PENDING' }),
            ]);

            io?.emit('scan:success', {
                qrCode,
                productCode: detail.productCode,
                productName: detail.productName,
                index: detail.index,
                scannedAt: new Date(),
                stats: { total, activated, errors, remaining },
            });

            io?.emit('scan:stats', { total, activated, errors, remaining });

        } catch (error) {
            logger.error(`[Scan] Lỗi hệ thống nghiêm trọng trong _handleScanData: ${error.message}`);
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
