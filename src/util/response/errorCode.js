const errorCode = {
    INCORRECT_USERNAME: {
        code: 2,
        message: 'Incorrect username!',
    },
    INCORRECT_PASSWORD: {
        code: 3,
        message: 'Incorrect password!',
    },
    USER_NOT_FOUND: {
        code: 4,
        message: 'User not found!',
    },
    USER_EXISTED: {
        code: 5,
        message: 'Username already exists!',
    },
    ROLE_EXISTED: {
        code: 6,
        message: 'Role name already exists!',
    },
    ROLE_NOT_FOUND: {
        code: 7,
        message: 'Role not found!',
    },
    DEVICE_NOT_FOUND: {
        code: 8,
        message: 'Device not found!',
    },
    DEVICE_EXISTED: {
        code: 9,
        message: 'Device already exists!',
    },
    GOODS_RECEIPT_NOT_FOUND: {
        code: 10,
        message: 'Goods receipt not found!',
    },
    GOODS_RECEIPT_EXISTED: {
        code: 11,
        message: 'Goods receipt already exists!',
    },
    GOODS_RECEIPT_COMPLETED: {
        code: 13,
        message: 'Goods receipt already completed!',
    },
    INTEGRATION_HISTORY_NOT_FOUND: {
        code: 12,
        message: 'Integration history not found!',
    },
    AUTHENTICATION_FAILED: {
        code: 401,
        message: 'Authentication failed!',
    },
    BATCHLOT_NOT_FOUND: {
        code: 404,
        message: 'Batchlot code does not exist!',
    },
    INTERNAL_SERVER_ERROR: {
        code: 500,
        message: 'Internal server error. Please try again later!',
    },
}

module.exports = { errorCode }
