const WebSocket = require('ws');
const http      = require('http');
const express   = require('express');
const app       = express();
const server    = http.createServer(app);

// Define the WebSocket server on the created HTTP server
const wss = new WebSocket.Server({ server });

// Store connected clients with their IDs
const clients = {};  
app.use(express.json());
app.post('/joblinknotify', (req, res) => {
    console.log('here');
    const { jobCode, fosUserId } = req.body;
    console.log(`[RECEIVED] Notification for Job: ${jobCode} for FOS User ID: ${fosUserId}`);
    console.log(`[INFO] Number of connected clients: ${wss.clients.size}`);
    let notificationSent = false;
    wss.clients.forEach(client => {  
        if (client.readyState === WebSocket.OPEN && client.fosUserId === fosUserId) { 
            client.send(JSON.stringify({
                type: 'jobNotification',
                jobCode: jobCode,
                fosUserId: fosUserId
            }));
            console.log(`[SENT] Notification to FOS User ID: ${fosUserId} for Job: ${jobCode}`);
            notificationSent = true;
        }
    }); 
    if (!notificationSent) {
        console.log(`[INFO] No active WebSocket clients found for FOS User ID: ${fosUserId}`);
    } 
    res.status(200).send('Notification sent');
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('[INFO] New WebSocket connection established.'); 
    ws.on('message', (message) => {
        console.log(`[RECEIVED] Incoming message: ${message}`);
        try {
            const data = JSON.parse(message); 
            if (data.type === 'register' && data.fosUserId) {
                ws.fosUserId = data.fosUserId; 
                clients[ws.fosUserId] = ws;
                console.log(`[REGISTER] FOS User ID registered: ${ws.fosUserId}`);
                ws.send(JSON.stringify({ type: 'registrationConfirmed', fosUserId: ws.fosUserId }));
            }
        } catch (error) {
            console.error('[ERROR] Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`[INFO] Connection closed for FOS User ID: ${ws.fosUserId || 'unknown'}`);
        if (ws.fosUserId) {
            delete clients[ws.fosUserId];
        }
    });
});

server.listen(4000, () => {
    console.log('[INFO] WebSocket server is listening on port 4000');
});
