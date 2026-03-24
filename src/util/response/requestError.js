class BadReq extends Error {
    constructor(err, stack = '') {
        super(err.message)
        this.code = err.code
        this.status = 400
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

module.exports = { BadReq }
