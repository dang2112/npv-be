const logger = require('../config/loggerConfig')
const { createScanner } = require('./scannerManager')
const { createPrinter } = require('./printerManager')

/**
 * deviceManager — singleton điều phối kết nối thiết bị cho 2 dây chuyền.
 *
 * Nhập kho:  1 scanner  (SCANNER_IMPORT)
 * Xuất kho:  2 scanner  (SCANNER_EXPORT_ENTRY + SCANNER_EXPORT_EXIT)
 *            + 1 máy in (PRINTER_DOMINO)
 */

const importScanner = createScanner('SCANNER_IMPORT')
const exportEntryScanner = createScanner('SCANNER_EXPORT_ENTRY')
const exportExitScanner = createScanner('SCANNER_EXPORT_EXIT')
const domino = createPrinter()

// ─────────────────────────────────────────────
// NHẬP KHO
// ─────────────────────────────────────────────

async function connectImportLine(device) {
    logger.info('[DeviceManager] Kết nối dây chuyền nhập kho...')
    await importScanner.connect(device)
    logger.info('[DeviceManager] Dây chuyền nhập kho sẵn sàng')
}

function pauseImportLine() {
    importScanner.pause()
    logger.info('[DeviceManager] Tạm dừng dây chuyền nhập kho')
}

function resumeImportLine(onData) {
    importScanner.resume(onData)
    logger.info('[DeviceManager] Tiếp tục dây chuyền nhập kho')
}

async function disconnectImportLine() {
    await importScanner.disconnect()
    logger.info('[DeviceManager] Đã ngắt dây chuyền nhập kho')
}

// ─────────────────────────────────────────────
// XUẤT KHO
// ─────────────────────────────────────────────

async function connectExportLine(onEntryData, onExitData) {
    logger.info('[DeviceManager] Kết nối dây chuyền xuất kho...')

    const results = await Promise.allSettled([
        exportEntryScanner.connect(onEntryData),
        exportExitScanner.connect(onExitData),
        domino.connect(),
    ])

    const labels = ['Scanner đầu chuyền', 'Scanner cuối chuyền', 'Máy in DOMINO']
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            logger.error(`[DeviceManager] ${labels[i]} lỗi: ${r.reason?.message}`)
        }
    })

    if (results.every((r) => r.status === 'rejected')) {
        throw new Error('Tất cả thiết bị xuất kho đều không kết nối được')
    }

    logger.info('[DeviceManager] Dây chuyền xuất kho sẵn sàng')
}

function pauseExportLine() {
    exportEntryScanner.pause()
    exportExitScanner.pause()
    logger.info('[DeviceManager] Tạm dừng dây chuyền xuất kho')
}

function resumeExportLine(onEntryData, onExitData) {
    exportEntryScanner.resume(onEntryData)
    exportExitScanner.resume(onExitData)
    logger.info('[DeviceManager] Tiếp tục dây chuyền xuất kho')
}

async function disconnectExportLine() {
    await Promise.allSettled([
        exportEntryScanner.disconnect(),
        exportExitScanner.disconnect(),
    ])
    domino.disconnect()
    logger.info('[DeviceManager] Đã ngắt dây chuyền xuất kho')
}

// ─────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────

function getStatus() {
    return {
        importLine: {
            scanner: { role: 'SCANNER_IMPORT', connected: importScanner.isConnected() },
        },
        exportLine: {
            entryScanner: { role: 'SCANNER_EXPORT_ENTRY', connected: exportEntryScanner.isConnected() },
            exitScanner: { role: 'SCANNER_EXPORT_EXIT', connected: exportExitScanner.isConnected() },
            printer: { role: 'PRINTER_DOMINO', ...domino.getStatus() },
        },
    }
}

module.exports = {
    // devices (dùng trực tiếp trong service nếu cần)
    importScanner,
    exportEntryScanner,
    exportExitScanner,
    domino,

    // import line
    connectImportLine,
    pauseImportLine,
    resumeImportLine,
    disconnectImportLine,

    // export line
    connectExportLine,
    pauseExportLine,
    resumeExportLine,
    disconnectExportLine,

    // status
    getStatus,
}
