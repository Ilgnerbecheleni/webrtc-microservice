let peer = null;
let localStream = null;
let chamadaAtual = null;
const modal = document.getElementById('modal-atendimento');
modal.style.display = 'none'; // <-- reforça o início escondido
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
      // Só liberar permissão
      const streamTemp = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamTemp.getTracks().forEach(track => track.stop()); // Parar imediatamente
  
      inicioDiv.style.display = 'none';
      painelDiv.style.display = 'block';
  
      await iniciarPeer(); // continuar igual
    } catch (err) {
      alert('Permissão para áudio é obrigatória!');
      console.error(err);
    }
  };

async function iniciarPeer() {
    const res = await fetch('/token');
    const token = await res.json();
  
    peer = new Peer(meuId, {
      host: location.hostname,
      port: 443,
      secure: true,
      path: '/peerjs',
      config: {
        iceServers: [
          {
            urls: token.urls,
            username: token.username,
            credential: token.credential
          }
        ]
      }
    });
  
    peer.on('open', (id) => {
      console.log('PeerJS conectado com id:', id);
      carregarClientes();
    });

  peer.on('call', async (chamada) => {
    try {
      toque.muted = false;
      modal.style.display = 'flex';
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
      chamadaAtual.close(); // Garante fechamento local
      chamadaAtual = null;
    }
  
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
  
    document.getElementById('chamada').style.display = 'none';
  }