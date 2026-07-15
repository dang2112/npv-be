const errorCode = {
    INCORRECT_USERNAME: {
        code: 2,
        message: 'Username không tồn tại hoặc mật khẩu không chính xác.',
    },
    INCORRECT_PASSWORD: {
        code: 3,
        message: 'Username không tồn tại hoặc mật khẩu không chính xác.',
    },
    USER_NOT_FOUND: {
        code: 4,
        message: 'Không tìm thấy người dùng!',
    },
    USER_EXISTED: {
        code: 5,
        message: 'Tên đăng nhập đã tồn tại!',
    },
    ROLE_EXISTED: {
        code: 6,
        message: 'Tên vai trò đã tồn tại!',
    },
    ROLE_NOT_FOUND: {
        code: 7,
        message: 'Không tìm thấy vai trò!',
    },
    ADMIN_ROLE_PROTECTED: {
        code: 21,
        message: 'Không thể chỉnh sửa hoặc xóa vai trò Admin hệ thống!',
    },
    DEVICE_NOT_FOUND: {
        code: 8,
        message: 'Không tìm thấy thiết bị!',
    },
    DEVICE_EXISTED: {
        code: 9,
        message: 'Thiết bị đã tồn tại!',
    },
    GOODS_RECEIPT_NOT_FOUND: {
        code: 10,
        message: 'Không tìm thấy đơn nhập kho!',
    },
    GOODS_RECEIPT_EXISTED: {
        code: 11,
        message: 'Đơn nhập kho đã tồn tại!',
    },
    GOODS_RECEIPT_COMPLETED: {
        code: 13,
        message: 'Đơn nhập kho đã hoàn thành!',
    },
    INTEGRATION_HISTORY_NOT_FOUND: {
        code: 12,
        message: 'Không tìm thấy lịch sử tích hợp!',
    },
    INVALID_REQUEST: {
        code: 14,
        message: 'Yêu cầu không hợp lệ!',
    },
    AUTHENTICATION_FAILED: {
        code: 401,
        message: 'Xác thực thất bại!',
    },
    BATCHLOT_NOT_FOUND: {
        code: 404,
        message: 'Mã Batchlot không tồn tại!',
    },
    INTERNAL_SERVER_ERROR: {
        code: 500,
        message: 'Lỗi hệ thống. Vui lòng thử lại sau!',
    },
    ACCOUNT_LOCKED: {
        code: 15,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ Admin để mở khóa!',
    },
    PASSWORD_NOT_MATCH: {
        code: 16,
        message: 'Mật khẩu và xác nhận mật khẩu không trùng khớp.',
    },
    PASSWORD_TOO_SHORT: {
        code: 17,
        message: 'Mật khẩu phải chứa tối thiểu 08 ký tự.',
    },
    PASSWORD_WEAK: {
        code: 18,
        message: 'Mật khẩu phải bao gồm ít nhất 01 chữ cái và 01 chữ số.',
    },
    BATCHLOT_SCANNING_EXIST: {
        code: 20,
        message:
            'Đang có một Batch Lot khác ở trạng thái SCANNING. Vui lòng tạm dừng hoặc hoàn thành trước!',
    },
}

module.exports = { errorCode }
