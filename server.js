const express = require('express');
const { ExpressPeerServer } = require('peer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = require('http').Server(app);

// Carregar clientes do JSON
const clients = JSON.parse(fs.readFileSync('./clients.json', 'utf8'));

// PeerJS Server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

app.use('/', peerServer);

// Servir arquivos estáticos (nossos HTML/JS)
app.use(express.static('public'));

// Middleware simples para passar o ID do cliente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/clientes', (req, res) => {
    res.json(clients);
  });

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
