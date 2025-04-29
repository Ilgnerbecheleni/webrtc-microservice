const express = require('express');
const { ExpressPeerServer } = require('peer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // <-- aqui adicionamos
const app = express();
const server = require('http').Server(app);
const cors = require('cors');
// Carregar clientes do JSON
const clients = JSON.parse(fs.readFileSync('./clients.json', 'utf8'));

// PeerJS Server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

app.use('/', peerServer);
app.use(cors()); // Habilitar CORS para todas as rotas
// Servir arquivos estáticos (nossos HTML/JS)
app.use(express.static('public'));

// Middleware simples para passar o ID do cliente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Constantes para TURN
const TURN_SECRET = 'meusegredo123456'; // mesmo que no turnserver.conf
const TURN_REALM = 'jobsconnect.com.br';

// API para gerar token TURN
app.get('/token', (req, res) => {
  const expiry = Math.floor(Date.now() / 1000) + 3600; // +1h
  const username = `${expiry}`;
  
  const hmac = crypto.createHmac('sha1', TURN_SECRET);
  hmac.update(username);
  const credential = hmac.digest('base64');

  res.json({
    username,
    credential,
    ttl: 3600,
    urls: [
      `stun:webrtc.jobsconnect.com.br:3478`,
      `turn:webrtc.jobsconnect.com.br:3478?transport=udp`,
      `turn:webrtc.jobsconnect.com.br:3478?transport=tcp`
    ]
  });
});
app.get('/clientes', (req, res) => {
    res.json(clients);
  });

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
