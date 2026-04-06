const net = require('net');
const logger = require('../config/loggerConfig');

class TCPServer {
    start(port, host, onDataReceived) {
        const server = net.createServer((socket) => {
            socket.on('data', (data) => {
                const rawString = data.toString().trim();
                if (onDataReceived) {
                    onDataReceived(rawString, socket);
                }

            });

            socket.on('error', (err) => {
                logger.error(`[TCP] Lỗi Socket: ${err.message}`);
            });
        });

        server.listen(port, host, () => {
            logger.info(`[TCP] Service đang chạy ${host}:${port}`);
        });
    }
}

module.exports = TCPServer;