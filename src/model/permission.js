const { Schema, model, Types } = require('mongoose')

const permissionSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
        },
        parentPermissionId: {
            type: Types.ObjectId,
            ref: 'permissions',
            default: null,
        },
        apiIds: [
            {
                type: Types.ObjectId,
                ref: 'apis',
            },
        ],
    },
    { timestamps: true },
)

const PermissionModel = model('permissions', permissionSchema, 'permissions')

module.exports = PermissionModel
