const { Schema, model } = require('mongoose')

const deviceSchema = new Schema(
    {
        deviceName: {
            type: String,
        },
        // Định danh vai trò cố định của thiết bị
        deviceType: {
            type: String,
            enum: [
                'SCANNER_IMPORT', // scanner nhập kho (Cognex DataMan 290X)
                'SCANNER_ZIP_MASTER_CODE',
                'SCANNER_EXPORT_ENTRY', // scanner đầu dây chuyền xuất kho
                'SCANNER_EXPORT_EXIT', // scanner cuối dây chuyền xuất kho
                'PRINTER_DOMINO', // máy in nhãn DOMINO
            ],
            required: true,
            unique: true,
        },
        host: {
            type: String,
        },
        port: {
            type: Number,
        },
        isEnable: {
            type: Boolean,
            required: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true },
)

const DeviceModel = model('devices', deviceSchema, 'devices')

module.exports = DeviceModel
