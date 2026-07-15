const { BadReq } = require('./response/requestError')
const { errorCode } = require('./response/errorCode')

const validatePassword = (password, confirmPassword) => {
    if (!password) return

    if (confirmPassword !== undefined && password !== confirmPassword) {
        throw new BadReq(errorCode.PASSWORD_NOT_MATCH)
    }
    if (password.length < 8) {
        throw new BadReq(errorCode.PASSWORD_TOO_SHORT)
    }
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (!hasLetter || !hasNumber) {
        throw new BadReq(errorCode.PASSWORD_WEAK)
    }
}

module.exports = { validatePassword }
