const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000 });

let clients = []; // Array to hold all connected clients

wss.on('connection', (ws) => {
    console.log('New connection! Total connections:', wss.clients.size);
    clients.push(ws); // Add new client to the list

    ws.on('message', (message) => {
        const msgData = JSON.parse(message);
        console.log('Received message:', msgData);

        // Check if the message type is 'register'
        if (msgData.type === 'register') {
            ws.username = msgData.username; // Store the username on the socket
            console.log('User registered:', msgData.username);
            return; // Stop processing after registration
        }

        // If the message is not a registration, it should be a chat message
        if (msgData.sender && msgData.text) {
            // Broadcast the message to all clients
            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        user: msgData.sender, // Send the sender's username
                        text: msgData.text // Send the actual message
                    }));
                }
            });
        } else {
            console.log('Received message does not contain user or text:', msgData);
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
        clients = clients.filter(client => client !== ws); // Remove the client from the list
    });
});

console.log('WebSocket server started on ws://localhost:4000');
