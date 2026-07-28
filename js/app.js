App.nav = (function() {
  var currentPage = 'home';
  var navItems = document.querySelectorAll('.nav-item');
  var pages = {
    home: document.getElementById('page-home'),
    radios: document.getElementById('page-radios'),
    classificados: document.getElementById('page-classificados'),
    profissionais: document.getElementById('page-profissionais'),
    eventos: document.getElementById('page-eventos'),
    config: document.getElementById('page-config')
  };

  function navigate(pageName) {
    if (!pages[pageName]) return;
    currentPage = pageName;

    Object.keys(pages).forEach(function(key) {
      if (pages[key]) pages[key].classList.remove('active');
    });
    pages[pageName].classList.add('active');

    navItems.forEach(function(item) {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === pageName) {
        item.classList.add('active');
      }
    });

    var fab = document.getElementById('fabClassif');
    var fabProf = document.getElementById('fabProf');
    var fabEventos = document.getElementById('fabEventos');
    if (fab) fab.style.display = (pageName === 'classificados') ? 'flex' : 'none';
    if (fabProf) fabProf.style.display = (pageName === 'profissionais') ? 'flex' : 'none';
    if (fabEventos) fabEventos.style.display = (pageName === 'eventos') ? 'flex' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    navItems.forEach(function(item) {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        var page = this.getAttribute('data-page');
        if (page) navigate(page);
      });
    });

    document.querySelectorAll('.stat-card[data-page], .action-card[data-page], .home-section-link[data-page]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var page = this.getAttribute('data-page');
        if (page) navigate(page);
      });
    });
  }

  return { init: init, navigate: navigate, getCurrent: function() { return currentPage; } };
})();

App.showToast = function(message) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function() {
    toast.classList.add('hidden');
  }, 3000);
};

App.showModal = function(title, bodyHtml) {
  var overlay = document.getElementById('modalOverlay');
  var titleEl = document.getElementById('modalTitle');
  var bodyEl = document.getElementById('modalBody');
  if (overlay) overlay.classList.remove('hidden');
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHtml;
  document.body.style.overflow = 'hidden';
};

App.closeModal = function() {
  var overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
};

App.refreshData = function() {
  loadAllData();
};

function updateDemoBanner() {
  var banner = document.getElementById('demoBanner');
  if (!banner) return;
  if (CONFIG.useDemoData) {
    banner.classList.remove('hidden');
    banner.innerHTML =
      '<span class="material-icons-round" style="font-size:16px">info</span>' +
      ' Modo demonstracao - configurar <a href="#" id="bannerConfigLink" style="color:#fff;text-decoration:underline">API da Planilha</a>';
    document.getElementById('bannerConfigLink').addEventListener('click', function(e) {
      e.preventDefault();
      App.nav.navigate('config');
    });
  } else {
    banner.classList.add('hidden');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}



function loadAllData() {
  updateDemoBanner();

  Promise.all([
    App.api.getRadios(),
    App.api.getClassificados(),
    App.api.getProfissionais(),
    App.api.getEventos()
  ]).then(function(results) {
    var radios = results[0] || [];
    var classif = results[1] || [];
    var prof = results[2] || [];
    var eventos = results[3] || [];

    App.radios.render(radios);
    App.classificados.render(classif);
    App.profissionais.render(prof);
    App.eventos.render(eventos);

    // Home previews
    renderHomeRadios(radios.slice(0, 3));
    renderHomeClassif(classif.slice(0, 6));
    renderHomeProf(prof);
    renderHomeEventos(eventos);
    // Home stats
    var statRadios = document.getElementById('statRadios');
    var statClassif = document.getElementById('statClassificados');
    var statProf = document.getElementById('statProfissionais');
    var statEventos = document.getElementById('statEventos');
    if (statRadios) statRadios.textContent = radios.length;
    if (statClassif) statClassif.textContent = classif.length;
    if (statProf) statProf.textContent = prof.length;
    if (statEventos) statEventos.textContent = eventos.length;

  }).catch(function() {});
}

function renderHomeRadios(radios) {
  var container = document.getElementById('homeRadios');
  if (!container) return;
  var html = '';
  for (var i = 0; i < radios.length; i++) {
    var r = radios[i];
    var logo = r.logoUrl
      ? '<img class="radio-logo" src="' + escapeHtml(r.logoUrl) + '" alt="' + escapeHtml(r.nome) + '" loading="lazy">'
      : '<div class="radio-logo" style="display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--primary);background:var(--bg);border-radius:50%">📻</div>';
    html +=
      '<div class="radio-card" data-id="' + r.id + '" onclick="App.radios.handleCardClick(\'' + r.id + '\')">' +
        logo +
        '<span class="radio-name">' + escapeHtml(r.nome) + '</span>' +
        '<span class="radio-desc">' + escapeHtml(r.descricao || '') + '</span>' +
      '</div>';
  }
  container.innerHTML = html;
}
function renderHomeClassif(items) {
  var container = document.getElementById('homeClassif');
  if (!container) return;
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var c = items[i];
    var imgHtml = '';
    if (c.imagens) {
      var imgs = c.imagens.split('|');
      if (imgs.length > 0 && (imgs[0].startsWith('data:') || imgs[0].startsWith('http')))
        imgHtml = '<img class="classif-image" src="' + escapeHtml(imgs[0]) + '" alt="" loading="lazy">';
    }
    var isSold = c.ativo === 'Vendido';
    html +=
      '<div class="classif-card' + (isSold ? ' classif-sold' : '') + '" data-id="' + c.id + '" onclick="App.classificados.showDetailById(\'' + c.id + '\')">' +
        (isSold ? '<div class="sold-overlay">VENDIDO</div>' : '') +
        (imgHtml ? '<div class="classif-img-wrap">' + imgHtml + '</div>' : '<div class="classif-image-placeholder"><span class="material-icons-round">image</span></div>') +
        '<div class="classif-body">' +
          (isSold ? '<div class="sold-tag">VENDIDO</div>' : '') +
          '<div class="classif-title">' + escapeHtml(c.titulo) + '</div>' +
          '<div class="classif-price">' + formatPrice(c.preco) + '</div>' +
        '</div>' +
      '</div>';
  }
  container.innerHTML = html;
}
function renderHomeProf(items) {
  var container = document.getElementById('homeProf');
  if (!container) return;
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var p = items[i];
    var photoHtml = '';
    if (p.foto && (p.foto.startsWith('http') || p.foto.startsWith('data:'))) {
      photoHtml = '<img class="prof-photo" src="' + escapeHtml(p.foto) + '" alt="' + escapeHtml(p.nome) + '" loading="lazy">';
    } else {
      photoHtml = '<div class="prof-photo-placeholder"><span class="material-icons-round" style="font-size:24px">person</span></div>';
    }
    html +=
      '<div class="prof-card" data-id="' + p.id + '" onclick="App.profissionais.showDetailById(\'' + p.id + '\')">' +
        photoHtml +
        '<div class="prof-name">' + escapeHtml(p.nome) + '</div>' +
        '<div class="prof-profession">' + escapeHtml(p.profissao) + '</div>' +
        '<div class="prof-location"><span class="material-icons-round" style="font-size:14px">location_on</span> ' + escapeHtml(p.bairro || '') + (p.bairro && p.cidade ? ' - ' : '') + escapeHtml(p.cidade || '') + '</div>' +
      '</div>';
  }
  container.innerHTML = html;
}
function renderHomeEventos(items) {
  var container = document.getElementById('homeEventos');
  if (!container) return;
  var html = '';
  var upcoming = items.slice().sort(function(a, b) { return new Date(a.data) - new Date(b.data); });
  for (var i = 0; i < upcoming.length; i++) {
    var e = upcoming[i];
    var evDate = e.data ? formatDateSimple(e.data) : '';
    var day = evDate ? evDate.split('/')[0] : '';
    var months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    var month = '';
    if (evDate) {
      var m = parseInt(evDate.split('/')[1], 10) - 1;
      if (months[m]) month = months[m];
    }
    var imgHtml = '';
    if (e.imagens) {
      var imgs = e.imagens.split('|');
      if (imgs.length > 0 && (imgs[0].startsWith('data:') || imgs[0].startsWith('http')))
        imgHtml = '<img class="evento-image" src="' + escapeHtml(imgs[0]) + '" alt="" loading="lazy">';
    }
    html +=
      '<div class="evento-card" data-id="' + e.id + '" onclick="App.eventos.showDetailById(\'' + e.id + '\')">' +
        (imgHtml || '') +
        '<div class="evento-date-badge">' +
          '<span class="evento-date-day">' + day + '</span>' +
          '<span class="evento-date-month">' + month + '</span>' +
        '</div>' +
        '<div class="evento-body">' +
          '<div class="evento-title">' + escapeHtml(e.titulo) + '</div>' +
          '<div class="evento-info"><span class="material-icons-round">schedule</span> ' + escapeHtml(formatTimeSimple(e.horario || '')) + '</div>' +
        '</div>' +
      '</div>';
  }
  container.innerHTML = html;
}

function formatDateSimple(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (!isNaN(d)) {
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' +
           d.getFullYear();
  }
  var m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  m = dateStr.match(/(\w{3}) (\w{3}) (\d{2}) (\d{4})/);
  if (m) {
    var months = {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06',
                  'Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'};
    return m[3] + '/' + (months[m[2]] || '01') + '/' + m[4];
  }
  return dateStr;
}

function formatTimeSimple(timeStr) {
  if (!timeStr) return '';
  var d = new Date(timeStr);
  if (!isNaN(d)) {
    return String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0');
  }
  var m = timeStr.match(/(\d{2}):(\d{2})/);
  if (m) return m[1] + ':' + m[2];
  return timeStr;
}

function formatPrice(val) {
  if (!val) return 'Grátis';
  var s = String(val).replace(/[R$\s]/g, '').replace(/\./g, '');
  var num = parseFloat(s.replace(',', '.'));
  if (isNaN(num) || num <= 0) return 'R$ ' + val;
  return 'R$ ' + Math.round(num).toLocaleString('pt-BR') + ',00';
}

function registerSW() {
  // SW desabilitado durante desenvolvimento
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.register('sw.js?v=6').catch(function() {});
  // }
}

function initConfigPage() {
  var statusEl = document.getElementById('configStatus');
  var urlInput = document.getElementById('configUrl');
  var testBtn = document.getElementById('configTestBtn');
  var saveBtn = document.getElementById('configSaveBtn');
  var errorDetails = document.getElementById('configErrorDetails');

  var adminSenhaInput = document.getElementById('configAdminSenha');
  if (urlInput) urlInput.value = CONFIG.apiUrl;
  if (adminSenhaInput) adminSenhaInput.value = CONFIG.adminSenha || '';

  // Mostrar status atual ao carregar a pagina
  if (statusEl) {
    if (CONFIG.useDemoData) {
      statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">info</span> Modo demonstração ativo';
      statusEl.className = 'config-status config-testing';
    } else if (CONFIG.apiUrl) {
      statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">link</span> URL configurada: ' + CONFIG.apiUrl.substring(0, 60) + '...';
      statusEl.className = 'config-status config-ok';
    }
  }

  if (testBtn) {
    testBtn.addEventListener('click', async function() {
      if (statusEl) {
        statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">sync</span> Testando...';
        statusEl.className = 'config-status config-testing';
      }
      CONFIG.apiUrl = urlInput ? urlInput.value.trim() : '';
      if (adminSenhaInput) CONFIG.adminSenha = adminSenhaInput.value;
      var result = await App.api.testConnection();
      var debugSection = document.getElementById('debugSection');
      var debugResp = document.getElementById('debugRawResponse');
      if (App.apiInfo.lastResponse && debugResp) {
        try {
          debugResp.textContent = JSON.stringify(JSON.parse(App.apiInfo.lastResponse), null, 2);
        } catch(e) {
          debugResp.textContent = App.apiInfo.lastResponse;
        }
        if (debugSection) debugSection.style.display = 'block';
      }
      if (statusEl) {
        if (result.success) {
          statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">check_circle</span> ' + result.message;
          statusEl.className = 'config-status config-ok';
          CONFIG.useDemoData = false;
          salvarConfig();
          App.showToast('API conectada!');
          App.refreshData();
        } else {
          statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">error</span> ' + result.message;
          statusEl.className = 'config-status config-error';
          if (errorDetails) {
            errorDetails.textContent = result.detail || App.apiInfo.lastResponse || App.apiInfo.lastError || '';
            errorDetails.classList.remove('hidden');
          }
        }
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async function() {
      var url = urlInput ? urlInput.value.trim() : '';
      if (!url) {
        App.showToast('Digite a URL da API');
        return;
      }
      CONFIG.apiUrl = url;
      CONFIG.useDemoData = false;
      if (adminSenhaInput) CONFIG.adminSenha = adminSenhaInput.value;
      salvarConfig();
      App.showToast('Testando conexao...');
      var result = await App.api.testConnection();
      if (statusEl) {
        if (result.success) {
          statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">check_circle</span> ' + result.message;
          statusEl.className = 'config-status config-ok';
          App.showToast('Conectado! Carregando dados...');
          App.refreshData();
          setTimeout(function() { App.nav.navigate('home'); }, 800);
        } else {
          statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">error</span> ' + result.message;
          statusEl.className = 'config-status config-error';
          if (result.detail && errorDetails) {
            errorDetails.textContent = result.detail;
            errorDetails.classList.remove('hidden');
          }
        }
      }
    });
  }

  var resetBtn = document.getElementById('configResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      CONFIG.apiUrl = '';
      CONFIG.useDemoData = true;
      CONFIG.adminSenha = '';
      salvarConfig();
      if (urlInput) urlInput.value = '';
      if (adminSenhaInput) adminSenhaInput.value = '';
      if (statusEl) {
        statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px">info</span> Modo demonstração ativado';
        statusEl.className = 'config-status config-testing';
      }
      if (errorDetails) errorDetails.classList.add('hidden');
      App.showToast('Voltou ao modo demonstração');
      App.refreshData();
      App.nav.navigate('home');
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  App.nav.init();

  var modalClose = document.getElementById('modalClose');
  var modalOverlay = document.getElementById('modalOverlay');
  if (modalClose) modalClose.addEventListener('click', App.closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', function(e) {
    if (e.target === this) App.closeModal();
  });

  var refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      App.showToast('Atualizando...');
      App.refreshData();
    });
  }

  var configBtn = document.getElementById('configBtn');
  if (configBtn) {
    configBtn.addEventListener('click', function() {
      App.nav.navigate('config');
    });
  }

  App.auth.init();
  App.radios.init();
  App.classificados.init();
  App.profissionais.init();
  App.eventos.init();
  initConfigPage();

  var myEventosBtn = document.getElementById('myEventosBtn');
  if (myEventosBtn) {
    myEventosBtn.addEventListener('click', function() {
      if (!App.auth.isLoggedIn()) { App.auth.showLoginForm(); return; }
      var myItems = App.eventos.getMyItems(App.auth.getCurrentUser().id);
      if (myItems.length === 0) { App.showToast('Voce nao tem eventos cadastrados'); return; }
      App.eventos.render(myItems);
    });
  }

  loadAllData();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) { r.unregister(); });
    });
  }
  registerSW();
});
