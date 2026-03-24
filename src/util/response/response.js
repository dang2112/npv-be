const response = {
    badRequest: (errorCode) => {
        if (errorCode && errorCode.isJoi) {
            return {
                status: 400,
                code: 0,
                message: errorCode.message,
                data: null,
            }
        } else {
            return {
                status: 400,
                code: errorCode.code,
                message: errorCode.message,
                data: null,
            }
        }
    },
    success: (data, status) => {
        return {
            status,
            code: 1,
            message: 'OK',
            data,
        }
    },
    serverError: (error) => {
        return {
            status: 500,
            code: -1,
            message: error.message,
            data: error.stack,
        }
    },
    notFound: () => {
        return {
            status: 404,
            code: -1,
            message: 'Not found!',
            data: null,
        }
    },
    unauthorized: (message) => {
        return {
            status: 401,
            code: -1,
            message,
            data: null,
        }
    },
    forbidden: (message) => {
        return {
            status: 403,
            code: -1,
            message,
            data: null,
        }
    },
    cors: () => {
        return {
            status: 500,
            code: -1,
            message: 'Cors error!',
            data: null,
        }
    },
}

module.exports = { response }
