App.radios = (function() {
  var audio = document.getElementById('audioElement');
  var player = document.getElementById('audioMiniPlayer');
  var playerLogo = document.getElementById('playerLogo');
  var playerName = document.getElementById('playerName');
  var playerStatus = document.getElementById('playerStatus');
  var playBtn = document.getElementById('playerPlayBtn');
  var stopBtn = document.getElementById('playerStopBtn');
  var volumeSlider = document.getElementById('playerVolume');
  var currentRadio = null;
  var isPlaying = false;

  function init() {
    if (!audio) return;
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);

    playBtn.addEventListener('click', togglePlay);
    stopBtn.addEventListener('click', stop);
    volumeSlider.addEventListener('input', function() {
      audio.volume = parseFloat(this.value);
    });

    document.addEventListener('click', function() {
      if (audio.paused && audio.src) {
        audio.play().catch(function() {});
      }
    }, { once: true });

    var grid = document.getElementById('radioGrid');
    if (grid) {
      grid.addEventListener('click', function(e) {
        var card = e.target.closest('.radio-card');
        if (card) {
          var id = card.getAttribute('data-id');
          handleCardClick(id);
        }
      });
    }
  }

  function onError() {
    setStatus('Erro ao carregar');
    isPlaying = false;
    updatePlayBtn();
    App.showToast('Nao foi possivel carregar esta radio');
  }

  function onCanPlay() {
    setStatus('Pronto');
  }

  function onWaiting() {
    setStatus('Carregando...');
  }

  function onPlaying() {
    setStatus('Tocando agora');
    isPlaying = true;
    updatePlayBtn();
  }

  function onPause() {
    if (audio.currentTime > 0 || !audio.src) return;
    setStatus('Pausado');
    isPlaying = false;
    updatePlayBtn();
  }

  function onEnded() {
    isPlaying = false;
    updatePlayBtn();
    setStatus('Finalizado');
  }

  function setStatus(text) {
    if (playerStatus) playerStatus.textContent = text;
  }

  function updatePlayBtn() {
    if (!playBtn) return;
    playBtn.textContent = isPlaying ? 'pause' : 'play_arrow';
  }

  function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) {
      audio.play().catch(function(e) {
        App.showToast('Clique na tela primeiro para ativar o audio');
      });
    } else {
      audio.pause();
    }
  }

  function play(radio) {
    if (!radio) {
      App.showToast('Radio nao encontrada');
      return;
    }
    if (!radio.streamUrl || radio.streamUrl === '') {
      App.showToast('URL da radio vazia - preencha a coluna streamUrl na planilha');
      return;
    }
    currentRadio = radio;

    playerLogo.src = radio.logoUrl || '';
    playerLogo.alt = radio.nome || 'Radio';
    playerName.textContent = radio.nome || 'Radio';

    App.showToast('Carregando: ' + radio.nome);
    player.classList.remove('hidden');

    audio.src = radio.streamUrl;
    audio.volume = parseFloat(volumeSlider.value);
    audio.play().catch(function(e) {
      App.showToast('Nao foi possivel tocar: ' + radio.streamUrl.substring(0, 50) + '...');
    });

    isPlaying = true;
    updatePlayBtn();
    setStatus('Conectando...');

    document.querySelectorAll('.radio-card').forEach(function(card) {
      card.classList.remove('playing');
    });
    var card = document.querySelector('.radio-card[data-id="' + radio.id + '"]');
    if (card) card.classList.add('playing');

    if (player) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    player.classList.add('hidden');
    isPlaying = false;
    currentRadio = null;
    updatePlayBtn();

    document.querySelectorAll('.radio-card').forEach(function(card) {
      card.classList.remove('playing');
    });
  }

  var _radiosCache = [];

  function render(radios) {
    var grid = document.getElementById('radioGrid');
    if (!grid) return;

    _radiosCache = radios || [];

    if (!radios || radios.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<span class="material-icons-round">radio</span>' +
          '<h3>Nenhuma radio cadastrada</h3>' +
          '<p>Adicione radios na planilha do Google</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < radios.length; i++) {
      var r = radios[i];
      var logoHtml = r.logoUrl
        ? '<img class="radio-logo" src="' + escapeHtml(r.logoUrl) + '" alt="' + escapeHtml(r.nome) + '" loading="lazy">'
        : '<div class="radio-logo" style="display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--primary);background:var(--bg);border-radius:50%;width:80px;height:80px;margin:0 auto 12px">📻</div>';
      html +=
        '<div class="radio-card" data-id="' + r.id + '" data-stream="' + escapeHtml(r.streamUrl) + '">' +
          logoHtml +
          '<span class="radio-name">' + escapeHtml(r.nome) + '</span>' +
          '<span class="radio-desc">' + escapeHtml(r.descricao || '') + '</span>' +
          '<div class="radio-playing">' +
            '<span class="playing-dot"></span> Tocando agora' +
          '</div>' +
        '</div>';
    }
    grid.innerHTML = html;
  }

  function handleCardClick(id) {
    var radio = null;
    for (var j = 0; j < _radiosCache.length; j++) {
      if (String(_radiosCache[j].id) === String(id)) { radio = _radiosCache[j]; break; }
    }
    if (radio) {
      if (currentRadio && String(currentRadio.id) === String(id) && isPlaying) {
        stop();
      } else {
        play(radio);
      }
    } else {
      App.showToast('Radio nao encontrada');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init: init,
    render: render,
    play: play,
    stop: stop,
    handleCardClick: handleCardClick,
    getCurrent: function() { return currentRadio; },
    isPlaying: function() { return isPlaying; }
  };
})();
