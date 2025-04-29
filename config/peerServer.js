const { ExpressPeerServer } = require('peer');
const server = require('http').Server(); // Só inicializar para criar o peerServer

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

module.exports = peerServer;
