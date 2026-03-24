const { Schema, model, Types } = require('mongoose')

const apiSchema = new Schema(
    {
        api: {
            type: String,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true },
)

const ApiModel = model('apis', apiSchema, 'apis')

module.exports = ApiModel
