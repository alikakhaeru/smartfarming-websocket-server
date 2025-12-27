const WebSocket = require('ws');
const express = require('express');
const app = express();

app.use(express.json());

// ==========================================
// 1. WEBSOCKET SERVER (Port 8080)
// ==========================================
const wss = new WebSocket.Server({ port: 8080 });

let totalConnections = 0; // Penghitung kumulatif untuk ID unik

wss.on('connection', (ws) => {
    totalConnections++;
    const clientId = totalConnections;
    
    console.log('--- KONEKSI BARU ---');
    console.log('Status: Client ' + clientId + ' terhubung.');
    console.log('Total Online: ' + wss.clients.size);

    // Mengirim pesan selamat datang ke Java
    ws.send(JSON.stringify({ 
        type: 'info', 
        message: 'Terhubung sebagai Client #' + clientId 
    }));

    ws.on('close', () => {
        console.log('--- KONEKSI TERPUTUS ---');
        console.log('Status: Client ' + clientId + ' keluar.');
        console.log('Sisa Online: ' + wss.clients.size);
    });

    ws.on('error', (err) => {
        console.log('Error pada Client ' + clientId + ': ' + err.message);
    });
});

// ==========================================
// 2. FUNGSI BROADCAST
// ==========================================
function broadcast(data) {
    const payload = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// ==========================================
// 3. HTTP ENDPOINT (Pintu Masuk dari PHP)
// ==========================================
app.post('/event', (req, res) => {
    const { type } = req.body;

    if (!type) {
        return res.status(400).json({ error: 'Field type diperlukan' });
    }

    console.log('--- EVENT DITERIMA ---');
    console.log('Sumber: PHP API');
    console.log('Aksi: Refresh data (' + type + ')');
    
    // Kirim sinyal update ke semua aplikasi Java
    broadcast({ type: type });

    res.json({ 
        status: 'Broadcast berhasil', 
        jumlah_client: wss.clients.size 
    });
});

// ==========================================
// 4. MENJALANKAN SERVER
// ==========================================
const HTTP_PORT = 3001;
app.listen(HTTP_PORT, () => {
    console.log('----------------------------------------------');
    console.log('SMART FARMING SERVER AKTIF');
    console.log('HTTP Bridge (PHP): http://localhost:' + HTTP_PORT + '/event');
    console.log('WebSocket (Java): ws://localhost:8080');
    console.log('----------------------------------------------');
});