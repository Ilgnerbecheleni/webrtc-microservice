const Database = require('better-sqlite3');

const db = new Database('clientes.db');

// Cria a tabela se não existir
db.prepare(`
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL
  )
`).run();

module.exports = db;
