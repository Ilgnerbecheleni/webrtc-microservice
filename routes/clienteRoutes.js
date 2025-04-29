const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rotas
router.get('/', clienteController.listarClientes);
router.post('/cadastrar', clienteController.cadastrarCliente);
router.put('/:id', clienteController.atualizarCliente);
router.delete('/:id', clienteController.deletarCliente);

module.exports = router;
