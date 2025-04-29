require('dotenv').config();
const express = require('express');
const { ExpressPeerServer } = require('peer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const server = require('http').Server(app);

// Inicializar Banco de Dados
const db = new Database('clientes.db');

// Criar tabela se não existir
db.prepare(`
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL
  )
`).run();

// PeerJS Server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

// Middlewares
app.use('/', peerServer);
app.use(cors());
app.use(express.json()); // Agora podemos receber JSON em POST
app.use(express.static('public'));

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Constantes TURN
const TURN_SECRET = 'meusegredo123456';
const TURN_REALM = 'jobsconnect.com.br';

// API para gerar token TURN
app.get('/token', (req, res) => {
  const expiry = Math.floor(Date.now() / 1000) + 3600;

  const hmac = crypto.createHmac('sha1', TURN_SECRET);
  hmac.update(`${expiry}`);
  const credential = hmac.digest('base64');

  res.json({
    username: `${expiry}`,
    credential,
    ttl: 3600,
    urls: [
      `stun:webrtc.jobsconnect.com.br:3478`,
      `turn:webrtc.jobsconnect.com.br:3478?transport=udp`,
      `turn:webrtc.jobsconnect.com.br:3478?transport=tcp`
    ]
  });
});

// ➡️ API: Listar clientes
app.get('/clientes', (req, res) => {
  const clientes = db.prepare('SELECT id, nome FROM clientes').all();
  res.json(clientes);
});

// ➡️ API: Cadastrar novo cliente
app.post('/cadastrar', (req, res) => {
  const { id, nome } = req.body;

  if (!id || !nome) {
    return res.status(400).json({ error: 'ID e Nome são obrigatórios.' });
  }

  try {
    db.prepare('INSERT INTO clientes (id, nome) VALUES (?, ?)').run(id, nome);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(409).json({ error: 'ID já existente.' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
    }
  }
});

// ➞ API: Atualizar cliente
app.put('/clientes/:id', (req, res) => {
  const { nome } = req.body;
  const { id } = req.params;

  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }

  const info = db.prepare('UPDATE clientes SET nome = ? WHERE id = ?').run(nome, id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  res.json({ success: true });
});

// ➞ API: Deletar cliente
app.delete('/clientes/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM clientes WHERE id = ?').run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  res.json({ success: true });
});


// Porta
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
