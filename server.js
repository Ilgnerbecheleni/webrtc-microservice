require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Server } = require('http');
const peerServer = require('./config/peerServer');
const generateTurnToken = require('./config/turnToken');
const clienteRoutes = require('./routes/clienteRoutes');

const app = express();
const server = Server(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/peerjs', peerServer);
app.use(express.static('public'));

// Página principal
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// API para gerar token TURN
app.get('/token', (req, res) => {
  const token = generateTurnToken();
  res.json(token);
});

// Rotas de clientes
app.use('/clientes', clienteRoutes);

// Porta
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

