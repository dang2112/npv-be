const logger = require("../config/loggerConfig");
const DeviceModel = require("../model/device");
const TCPServer = require("./tcpServer");

function TCPClient() {
    this.productList = [];
    this.isScanning = false;
    this.tcpServer = new TCPServer(9100);

    this.startScan = async () => {
        try {
            console.log("Start Scan--")
            console.log(this.productList)
            this.isScanning = true
            const deviceScan = await DeviceModel.findOne({ deviceType: 'SCANNER' });
            this.tcpServer.start(deviceScan.port, deviceScan.host, (data) => {
                // this.handleScanData(code, socket);
                const parts = data.split(';');
                console.log(parts)
                // const qrCode = parts[1];
                // console.log(data)
                // console.log(qrCode)
            });

            return null
        } catch (error) {
            logger.error(`TCPClient: startScan lỗi`)
            logger.error(error)
        }
    }

    this.setProductList = (data) => {
        this.productList = data;
    };

    const handleScanData = async (code, socket) => {
        if (!this.isScanning) {
            console.warn(`Hệ thống đang ở trạng thái DỪNG.`);
            return;
        }

        const product = this.productList.find(p => p.qr_code === code);

        if (product) {
            if (product.status === 'completed') {
                console.log(`[Logic] Mã ${code} đã được quét trước đó. Bỏ qua.`);
                return;
            }

            // 2. Gọi hàm Update (Giả lập gọi tới Database/API)
            try {
                console.log(`[DB] Đang cập nhật sản phẩm: ${product.name}`);
                // await updateQRCode(code); 

                // product.status = 'completed';
                // product.updatedAt = new Date();

            } catch (err) {
                console.error(`[DB] Lỗi update: ${err.message}`);
            }
        } else {
            console.error(`[Logic] CẢNH BÁO: Mã ${code} không nằm trong danh sách sản phẩm!`);
            // Gửi lệnh dừng băng tải ở đây nếu cần
        }
    };
}

const tcpClient = new TCPClient();

module.exports = tcpClient
// scannerService.start(handleScanData);

// module.exports = { setScanStatus, setProductList };