let peer = null;
let localStream = null;
let chamadaAtual = null;
let verificarChamadaInterval = null; // <-- Aqui: controlar o setInterval
const modal = document.getElementById('modal-atendimento');
modal.style.display = 'none'; // Garante início escondido
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
    const streamTemp = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    streamTemp.getTracks().forEach(track => track.stop()); // Parar imediatamente

    inicioDiv.style.display = 'none';
    painelDiv.style.display = 'block';

    await iniciarPeer();
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
    chamadaAtual = chamada;

    const infoChamada = document.getElementById('info-chamada');
    const btnAceitar = document.getElementById('aceitar-chamada');
    const btnRecusar = document.getElementById('recusar-chamada');

    try {
      toque.muted = false;
      await toque.play().catch(e => console.log('Toque bloqueado:', e));
    } catch (err) {
      console.error('Erro ao tocar o som:', err);
    }

    infoChamada.textContent = `Chamada recebida de ${chamada.peer}`;
    modal.style.display = 'flex';

    btnAceitar.onclick = async () => {
      modal.style.display = 'none';
      toque.pause();
      toque.currentTime = 0;

      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        chamada.answer(localStream);

        chamada.on('stream', (stream) => {
          const audio = new Audio();
          audio.srcObject = stream;
          audio.play();
        });

        chamada.on('close', () => {
          encerrarChamada();
        });

        document.getElementById('chamada').style.display = 'block';
      } catch (err) {
        console.error('Erro ao atender chamada:', err);
      }
    };

    btnRecusar.onclick = () => {
      modal.style.display = 'none';
      toque.pause();
      toque.currentTime = 0;
      chamada.close();
      chamadaAtual = null;
    };
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

async function iniciarChamada(destinoId) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const chamada = peer.call(destinoId, localStream);
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
    iniciarVerificacaoChamada(); // Inicia verificação de chamada
  } catch (err) {
    console.error('Erro ao iniciar chamada:', err);
  }
}

document.getElementById('encerrar').onclick = () => {
  encerrarChamada();
};

function encerrarChamada() {
  if (chamadaAtual) {
    chamadaAtual.close();
    chamadaAtual = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  document.getElementById('chamada').style.display = 'none';
}

function iniciarVerificacaoChamada() {
    if (verificarChamadaInterval) {
      clearInterval(verificarChamadaInterval); // limpa o antigo se existir
    }
  
    verificarChamadaInterval = setInterval(() => {
        clearInterval(verificarChamadaInterval); // Limpa o intervalo anterior
        if (!chamadaAtual) {
        document.getElementById('chamada').style.display = 'none';
      } else {
        try {
          if (chamadaAtual.peerConnection) {
            const state = chamadaAtual.peerConnection.connectionState || chamadaAtual.peerConnection.iceConnectionState;
            if (state === 'closed' || state === 'failed' || state === 'disconnected') {
              console.log('Chamada detectada como encerrada automaticamente.');
              encerrarChamada();
            }
          }
        } catch (err) {
          console.warn('Erro ao verificar estado da chamada:', err);
        }
      }
    }, 2000); // a cada 2 segundos
  }
  