require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const { ExpressPeerServer } = require('peer');
const generateTurnToken = require('./config/turnToken');
const clienteRoutes = require('./routes/clienteRoutes');

const app = express();

// 🔒 Certificados SSL do Let's Encrypt
const privateKey = fs.readFileSync('/etc/letsencrypt/live/webrtc.jobsconnect.com.br/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/webrtc.jobsconnect.com.br/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/webrtc.jobsconnect.com.br/chain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PeerJS via HTTPS
const peerServer = ExpressPeerServer(https.createServer(credentials, app), {
  debug: true,
  path: '/peerjs'
});
app.use('/peerjs', peerServer);

// Página principal (opcional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para gerar token TURN
app.get('/token', (req, res) => {
  try {
    const token = generateTurnToken();
    res.json(token);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar token TURN' });
  }
});

// Rotas de clientes
app.use('/clientes', clienteRoutes);

// Criar servidor HTTPS
const httpsServer = https.createServer(credentials, app);
const PORT = process.env.PORT || 443;

httpsServer.listen(PORT, () => {
  console.log(`✅ Servidor rodando via HTTPS na porta ${PORT}`);
});
