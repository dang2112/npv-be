const joi = require('joi')

const roleValidation = {
    createOrUpdate: joi.object({
        name: joi.string().alphanum().max(50).required(),
        note: joi.string().allow('', null),
        listPermissionId: joi.array().items(joi.number()).required(),
    }),
}

module.exports = roleValidation
