const joi = require('joi')

const userValidation = {
    createAndUpdateUser: joi.object({
        username: joi.string().alphanum().min(3).max(50).required(),
        password: joi
            .string()
            .pattern(
                new RegExp(/^(?=(.*[a-zA-Z]))(?=(.*\d))(?=(.*[\W_])).{3,30}$/),
            ),
        roleId: joi.string().required(),
    }),
    // changePassword: joi.object({
    //     oldPassword: joi.string().pattern(new RegExp(/^(?=(.*[a-zA-Z]))(?=(.*\d))(?=(.*[\W_])).{3,30}$/)),
    //     newPassword: joi.string().pattern(new RegExp(/^(?=(.*[a-zA-Z]))(?=(.*\d))(?=(.*[\W_])).{3,30}$/)),
    // }),
}

module.exports = userValidation
