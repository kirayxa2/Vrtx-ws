const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    // 1. Добавляем обработку корня для Health Check (чтобы платформа видела, что сервер ЖИВ)
    if (req.url === '/') {
        res.writeHead(200);
        res.end('Server is active');
    } 
    // 2. Логика broadcast
    else if (req.method === 'POST' && req.url === '/broadcast') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const announcement = JSON.parse(body);
                const json = JSON.stringify(announcement);
                const base64 = Buffer.from(json).toString('base64');
                
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(base64);
                    }
                });
                
                res.writeHead(200);
                res.end('OK');
            } catch (e) {
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
    } 
    // 3. Всё остальное — 404
    else {
        res.writeHead(404);
        res.end();
    }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});

// 4. Привязка к 0.0.0.0 — чтобы контейнер слушал входящие запросы снаружи
server.listen(PORT, '0.0.0.0', () => {
    console.log('Server is listening on port ' + PORT);
});

setInterval(() => {
    console.log('Keep-alive: Server is still alive');
}, 30000); // Раз в 30 секунд в лог, чтобы процесс не казался "зависшим"
