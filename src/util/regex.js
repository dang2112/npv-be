const escapeRegExp = (value = '') => {
    //when entering special characters (in search etc) these special characters will cause problems -> escape them all
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const buildSearchRegex = (value = '') => {
    return RegExp(escapeRegExp(value), 'i')
}

module.exports = {
    buildSearchRegex,
    escapeRegExp,
}
