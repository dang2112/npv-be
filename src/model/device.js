const { Schema, model } = require('mongoose')

const deviceSchema = new Schema(
    {
        deviceName: {
            type: String,
        },
        deviceType: {
            type: String,
            enum: ['PRINTER', 'SCANNER'],
            required: true,
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
    },
    { timestamps: true },
)

const DeviceModel = model('devices', deviceSchema, 'devices')

module.exports = DeviceModel
