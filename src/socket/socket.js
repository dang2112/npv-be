const logger = require('../config/loggerConfig')
let devices = {}
const connectSocket = (socket) => {
    logger.info('[Socket] Client đã kết nối: ' + socket.id)
    socket.on('register-device', (deviceId) => {
        console.log(deviceId)
        devices[deviceId] = socket.id
    })

    socket.on('offer', (data) => {
        console.log('Nhận sự kiện: offer')
        console.log(data)
        global._io.to(devices[data.deviceId]).emit('offer', data)
    })

    socket.on('answer', (data) => {
        console.log('Server nhận answer')
        console.log(data)
        global._io.to(data.webId).emit('answer', data.answer)
    })

    socket.on('ice', (data) => {
        // socket.to(data.to).emit("ice", data.candidate);
        global._io.emit('ice', data)
    })
    socket.on('disconnect', (data) => {
        logger.info('[Socket] Client đã kết thúc')
    })
}
module.exports = { connectSocket }
