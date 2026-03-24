const joi = require('joi')

const authValidation = {
    login: joi.object({
        username: joi.string().alphanum().min(3).max(50).required(),
        password: joi
            .string()
            .pattern(
                new RegExp(/^(?=(.*[a-zA-Z]))(?=(.*\d))(?=(.*[\W_])).{3,30}$/),
            ),
    }),
    changePassword: joi.object({
        oldPassword: joi
            .string()
            .pattern(
                new RegExp(/^(?=(.*[a-zA-Z]))(?=(.*\d))(?=(.*[\W_])).{3,30}$/),
            ),
        newPassword: joi
            .string()
            .pattern(
                new RegExp(/^(?=(.*[a-zA-Z]))(?=(.*\d))(?=(.*[\W_])).{3,30}$/),
            ),
    }),
}

module.exports = authValidation
