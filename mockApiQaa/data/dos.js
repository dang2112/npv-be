/**
 * Mock data cho Delivery Order (DO) — mô phỏng dữ liệu QAA trả về.
 * DO-2024-001: 3 dòng sản phẩm, nhiều lô SX khác nhau (như phiếu DO mẫu)
 */

const dos = {
    'C26TAA00005242': {
        doCode: 'C26TAA00005242',
        projectCode: '28015480',
        co: '9906413',
        total: 46,
        detail: [
            {
                no: 1,
                productCode: 'MTSMBBASEAXXX-4L5',
                productName: 'SƠN NƯỚC MATEX SẮC MÀU DỊU MÁT BASE A 4.5L',
                lotNumber: '2000773',
                qty: 8,
                remarks: 'Each - LON',
            },
            {
                no: 2,
                productCode: 'OBST-9102XXXX-5L',
                productName: 'SƠN NƯỚC ODL BÓNG SANG TRỌNG 9102 WHITE 5L',
                lotNumber: '6059885',
                qty: 4,
                remarks: 'Each - LON',
            },
            {
                no: 3,
                productCode: 'ODCKBBASEAXXX-0L9',
                productName: 'SƠN NƯỚC ODL CRVT & KHÁNG KHUẨN BASE A 0.9L',
                lotNumber: '2000762',
                qty: 6,
                remarks: 'Each - LON',
            },
            {
                no: 4,
                productCode: 'SMTXBBASEBXXX-5L',
                productName: 'SƠN NƯỚC SUPER MATEX BASE B 5L',
                lotNumber: '2000892',
                qty: 4,
                remarks: 'Each - LON',
            },
            {
                no: 5,
                productCode: 'SMTXBBASECXXX-5L',
                productName: 'SƠN NƯỚC SUPER MATEX BASE C 5L',
                lotNumber: '2000708',
                qty: 4,
                remarks: 'Each - LON',
            },
            {
                no: 6,
                productCode: 'SMTXBBASEDXXX-18L',
                productName: 'SƠN NƯỚC SUPER MATEX BASE D 18L',
                lotNumber: '2000794',
                qty: 2,
                remarks: 'Each - THÙNG',
            },
            {
                no: 7,
                productCode: 'VTXX-9102XXXX-17L',
                productName: 'SƠN NƯỚC VATEX 9102 WHITE 17L',
                lotNumber: '1007607',
                qty: 10,
                remarks: 'Each - THÙNG',
            },
            {
                no: 8,
                productCode: 'VTXX-9102XXXX-4K8',
                productName: 'SƠN NƯỚC VATEX 9102 WHITE 4.8K',
                lotNumber: '1007608',
                qty: 8,
                remarks: 'Each - LON',
            },
        ],
        status: '200',
    },

    'DO-2024-001': {
        doCode: 'DO-2024-001',
        projectCode: 'TEST-001',
        co: 'CO-TEST',
        total: 12,
        detail: [
            {
                no: 1,
                productCode: 'PROD-A',
                productName: 'Sản phẩm test A',
                lotNumber: 'LOT-001',
                qty: 6,
                remarks: 'Each - LON',
            },
            {
                no: 2,
                productCode: 'PROD-B',
                productName: 'Sản phẩm test B',
                lotNumber: 'LOT-002',
                qty: 4,
                remarks: 'Each - LON',
            },
            {
                no: 3,
                productCode: 'PROD-C',
                productName: 'Sản phẩm test C',
                lotNumber: 'LOT-003',
                qty: 2,
                remarks: 'Each - THÙNG',
            },
        ],
        status: '200',
    },
}

module.exports = dos
