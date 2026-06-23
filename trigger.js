const net = require('net');

const SCANNER_IP = '192.168.1.111';
const SCANNER_PORT = 23;

const client = new net.Socket();

client.connect(SCANNER_PORT, SCANNER_IP, () => {
    console.log('Đã kết nối scanner');
    // Bật chế độ phản hồi để debug
    //client.write('||>SET COM.DMCC-RESPONSE 1\r\n');

    client.write('||>OUTPUT.USER1\r\n');
});

client.on('data', (data) => {
    console.log('Scanner trả về:', data.toString());
});

client.on('error', (err) => console.error('Lỗi:', err.message));