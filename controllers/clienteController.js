const db = require('../config/database');

// ➡️ Listar clientes
function listarClientes(req, res) {
  const clientes = db.prepare('SELECT id, nome FROM clientes').all();
  res.json(clientes);
}

// ➡️ Cadastrar novo cliente
function cadastrarCliente(req, res) {
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
}

// ➞ Atualizar cliente
function atualizarCliente(req, res) {
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
}

// ➞ Deletar cliente
function deletarCliente(req, res) {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM clientes WHERE id = ?').run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  res.json({ success: true });
}

module.exports = {
  listarClientes,
  cadastrarCliente,
  atualizarCliente,
  deletarCliente
};
