const { Schema, model, Types } = require('mongoose')

const userSchema = new Schema(
    {
        fullname: {
            type: String,
        },
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        roleId: {
            type: Types.ObjectId,
            ref: 'roles',
        },
    },
    { timestamps: true },
)

const UserModel = model('users', userSchema, 'users')

module.exports = UserModel
