let peer = null;
let localStream = null;
let chamadaAtual = null;

const urlParams = new URLSearchParams(window.location.search);
const meuId = urlParams.get('id');

if (!meuId) {
  alert('ID do cliente não informado na URL! Ex: ?id=cliente1');
  throw new Error('ID não informado');
}

// Referências
const inicioDiv = document.getElementById('inicio');
const painelDiv = document.getElementById('painel');
const entrarBtn = document.getElementById('entrar');
const clientesUl = document.getElementById('clientes');
const toque = document.getElementById('toque');

// Mostrar botão de entrar
inicioDiv.style.display = 'block';

entrarBtn.onclick = async () => {
  try {
    // Libera o audio mudo
    await toque.play().catch(() => {});
    toque.pause();
    toque.currentTime = 0;

    // Solicitar microfone agora (libera getUserMedia de uma vez)
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    // Depois que clicou: mostra painel e conecta peer
    inicioDiv.style.display = 'none';
    painelDiv.style.display = 'block';

    iniciarPeer();
  } catch (err) {
    alert('Permissão para áudio é obrigatória!');
    console.error(err);
  }
};

function iniciarPeer() {
  document.getElementById('meu-id-span').textContent = meuId;

  peer = new Peer(meuId, {
    host: location.hostname,
    port: location.port || (location.protocol === 'https:' ? 443 : 80),
    path: '/peerjs'
  });

  peer.on('open', (id) => {
    console.log('Conectado como:', id);
    carregarClientes();
  });

  peer.on('call', async (chamada) => {
    try {
      toque.muted = false;
      await toque.play().catch(e => console.log('Toque bloqueado:', e));
    } catch (err) {
      console.error('Erro ao tocar:', err);
    }

    const aceitar = confirm(`Chamada recebida de ${chamada.peer}. Atender?`);

    toque.pause();
    toque.currentTime = 0;

    if (aceitar) {
      chamada.answer(localStream); // Aqui usamos a localStream já autorizada

      chamadaAtual = chamada;

      chamada.on('stream', (stream) => {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
      });

      chamada.on('close', () => {
        encerrarChamada();
      });

      document.getElementById('chamada').style.display = 'block';
    } else {
      console.log('Chamada recusada.');
      chamada.close();
    }
  });
}

async function carregarClientes() {
  const res = await fetch('/clientes');
  const lista = await res.json();
  lista.forEach(cliente => {
    if (cliente.id !== meuId) {
      const li = document.createElement('li');
      li.textContent = `${cliente.name} (${cliente.id})`;
      li.style.cursor = 'pointer';
      li.onclick = () => iniciarChamada(cliente.id);
      clientesUl.appendChild(li);
    }
  });
}

function iniciarChamada(destinoId) {
  const chamada = peer.call(destinoId, localStream); // Aqui usamos a mesma localStream
  chamadaAtual = chamada;

  chamada.on('stream', (stream) => {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
  });

  chamada.on('close', () => {
    encerrarChamada();
  });

  document.getElementById('chamada').style.display = 'block';
}

document.getElementById('encerrar').onclick = () => {
  if (chamadaAtual) {
    chamadaAtual.close();
  }
  encerrarChamada();
};

function encerrarChamada() {
    if (chamadaAtual) {
      chamadaAtual.close();
      chamadaAtual = null;
    }
  
    document.getElementById('chamada').style.display = 'none';
  
    // (Importante) NÃO encerrar localStream aqui! Senão o usuário teria que dar permissão de novo para outra chamada.
  }
