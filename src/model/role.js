const { Schema, model, Types } = require('mongoose')
const PermissionModel = require('./permission')

const roleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        permissionIds: [
            {
                type: Types.ObjectId,
                ref: 'permissions',
            },
        ],
    },
    { timestamps: true },
)

const RoleModel = model('roles', roleSchema, 'roles')

module.exports = RoleModel
