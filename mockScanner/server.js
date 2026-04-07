/**
 * scanner-mockup/server.js
 *
 * Giả lập Cognex DataMan 290 Series — TCP SERVER lắng nghe kết nối từ backend.
 *
 * Kiến trúc thực tế:
 *   [Backend TCP client] ──connect──▶ [DataMan 290 TCP server host:port]
 *
 * Mockup này:
 *   [Backend TCP client] ──connect──▶ [server.js TCP server (giả lập scanner)]
 *                                              ▲
 *                                        [Web UI gửi barcode qua Socket.IO]
 *
 * Data format gửi đến backend:
 *   "<triggerCount>;<qrCode>;<readStatus>\r\n"
 *   Ví dụ: "1;2000773-001;1\r\n"
 */

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const net = require('net')
const path = require('path')

// ─── HTTP / Socket.IO (Web UI) ────────────────────────────────────────────────
const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const UI_PORT = process.env.UI_PORT || 3999

// ─── State quản lý các TCP server (mỗi "scanner role" 1 instance) ────────────

/**
 * scanners: Map<role, ScannerInstance>
 *
 * ScannerInstance {
 *   role         : string
 *   tcpServer    : net.Server | null
 *   clients      : net.Socket[]   — danh sách backend đang kết nối vào
 *   port         : number         — port TCP server đang lắng nghe
 *   listening    : boolean
 *   triggerCount : number
 * }
 */
const scanners = new Map()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function broadcast(level, message, data = null) {
    const entry = { ts: new Date().toISOString(), level, message, data }
    io.emit('log', entry)
    const prefix = `[${level.toUpperCase()}]`
    if (level === 'error') console.error(prefix, message, data || '')
    else console.log(prefix, message, data || '')
}

function emitStatus(role) {
    const s = scanners.get(role)
    if (!s) return
    io.emit('status', {
        role: s.role,
        listening: s.listening,
        port: s.port,
        clientCount: s.clients.length,
        triggerCount: s.triggerCount,
    })
}

// ─── Socket.IO events (từ Web UI) ─────────────────────────────────────────────
io.on('connection', (wsSocket) => {
    console.log(`[WS] Browser kết nối: ${wsSocket.id}`)

    // Gửi trạng thái hiện tại về cho browser mới vào
    for (const s of scanners.values()) {
        wsSocket.emit('status', {
            role: s.role,
            listening: s.listening,
            port: s.port,
            clientCount: s.clients.length,
            triggerCount: s.triggerCount,
        })
    }

    // ── START TCP SERVER (giả lập bật scanner) ────────────────────────────────
    // Payload: { role, port }
    wsSocket.on('scanner:start', ({ role, port }) => {
        if (!role || !port) {
            return broadcast('error', 'Thiếu role hoặc port')
        }

        // Nếu đã có → bỏ qua
        if (scanners.has(role) && scanners.get(role).listening) {
            return broadcast('warn', `[${role}] Đã đang lắng nghe trên port ${scanners.get(role).port}`)
        }

        const instance = {
            role,
            tcpServer: null,
            clients: [],
            port: Number(port),
            listening: false,
            triggerCount: 0,
        }
        scanners.set(role, instance)

        const tcpServer = net.createServer((clientSocket) => {
            const addr = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`
            instance.clients.push(clientSocket)
            broadcast('success', `[${role}] Backend kết nối vào: ${addr}`)
            emitStatus(role)

            clientSocket.on('data', (data) => {
                // Backend có thể gửi lệnh trigger — log lại
                broadcast('recv', `[${role}] ← Nhận từ backend: ${data.toString().trim()}`)
            })

            clientSocket.on('close', () => {
                instance.clients = instance.clients.filter(s => s !== clientSocket)
                broadcast('warn', `[${role}] Backend ngắt kết nối: ${addr}`)
                emitStatus(role)
            })

            clientSocket.on('error', (err) => {
                broadcast('error', `[${role}] Lỗi client socket: ${err.message}`)
            })
        })

        instance.tcpServer = tcpServer

        tcpServer.on('error', (err) => {
            broadcast('error', `[${role}] Lỗi TCP server: ${err.message}`)
            instance.listening = false
            emitStatus(role)
        })

        tcpServer.listen(Number(port), '0.0.0.0', () => {
            instance.listening = true
            broadcast('info', `[${role}] TCP server đang lắng nghe 0.0.0.0:${port}`)
            emitStatus(role)
        })
    })

    // ── STOP TCP SERVER (giả lập tắt scanner) ─────────────────────────────────
    wsSocket.on('scanner:stop', ({ role }) => {
        const instance = scanners.get(role)
        if (!instance) return broadcast('warn', `[${role}] Không tìm thấy instance`)

        instance.clients.forEach(s => s.destroy())
        instance.clients = []

        if (instance.tcpServer) {
            instance.tcpServer.close(() => {
                broadcast('info', `[${role}] TCP server đã dừng`)
            })
            instance.tcpServer = null
        }
        instance.listening = false
        emitStatus(role)
    })

    // ── GỬI BARCODE (giả lập scanner đọc được mã) ─────────────────────────────
    // Payload: { role, qrCode }
    wsSocket.on('scanner:send', ({ role, qrCode }) => {
        const instance = scanners.get(role)
        if (!instance?.listening) {
            return broadcast('error', `[${role}] TCP server chưa chạy`)
        }
        if (instance.clients.length === 0) {
            return broadcast('warn', `[${role}] Chưa có backend nào kết nối vào`)
        }
        if (!qrCode?.trim()) {
            return broadcast('error', `[${role}] QR code rỗng`)
        }

        instance.triggerCount++
        const payload = `${instance.triggerCount};${qrCode.trim()};1\r\n`

        let sent = 0
        instance.clients.forEach(clientSocket => {
            try {
                clientSocket.write(payload)
                sent++
            } catch (err) {
                broadcast('error', `[${role}] Gửi thất bại: ${err.message}`)
            }
        })

        if (sent > 0) {
            broadcast('send', `[${role}] → Gửi tới ${sent} backend: ${payload.trim()}`, {
                triggerCount: instance.triggerCount,
                qrCode: qrCode.trim(),
            })
            emitStatus(role)
        }
    })

    // ── NO-READ (giả lập không đọc được mã) ───────────────────────────────────
    wsSocket.on('scanner:noread', ({ role }) => {
        const instance = scanners.get(role)
        if (!instance?.listening || instance.clients.length === 0) {
            return broadcast('warn', `[${role}] Chưa sẵn sàng`)
        }

        instance.triggerCount++
        const payload = `${instance.triggerCount};;0\r\n`

        instance.clients.forEach(s => { try { s.write(payload) } catch (_) {} })
        broadcast('warn', `[${role}] → NO_READ: ${payload.trim()}`)
        emitStatus(role)
    })

    wsSocket.on('disconnect', () => {
        console.log(`[WS] Browser ngắt kết nối: ${wsSocket.id}`)
    })
})

// ─── Start Web UI server ──────────────────────────────────────────────────────
httpServer.listen(UI_PORT, () => {
    console.log(`\n╔════════════════════════════════════════════════╗`)
    console.log(`║  Scanner Mockup — Cognex DataMan 290 Series    ║`)
    console.log(`║  Web UI : http://localhost:${UI_PORT}                  ║`)
    console.log(`║  Mockup lắng nghe TCP theo cấu hình role/port  ║`)
    console.log(`╚════════════════════════════════════════════════╝\n`)
})
