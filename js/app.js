App.nav = (function() {
  var currentPage = 'home';
  var navItems = document.querySelectorAll('.nav-item');
  var pages = {
    home: document.getElementById('page-home'),
    radios: document.getElementById('page-radios'),
    classificados: document.getElementById('page-classificados'),
    profissionais: document.getElementById('page-profissionais'),
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
    if (fab) fab.style.display = (pageName === 'classificados') ? 'flex' : 'none';
    if (fabProf) fabProf.style.display = (pageName === 'profissionais') ? 'flex' : 'none';

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

function getWeatherIcon(code, isDay) {
  var map = {
    113: isDay ? 'wb_sunny' : 'dark_mode',
    116: 'partly_cloudy_day',
    119: 'cloud',
    122: 'cloud',
    143: 'foggy',
    176: 'umbrella',
    182: 'ac_unit',
    185: 'ac_unit',
    200: 'thunderstorm',
    227: 'ac_unit',
    230: 'ac_unit',
    248: 'foggy',
    260: 'foggy',
    263: 'umbrella',
    266: 'umbrella',
    281: 'ac_unit',
    284: 'ac_unit',
    293: 'umbrella',
    296: 'umbrella',
    299: 'umbrella',
    302: 'umbrella',
    305: 'umbrella',
    308: 'umbrella',
    311: 'ac_unit',
    314: 'ac_unit',
    317: 'ac_unit',
    320: 'ac_unit',
    323: 'ac_unit',
    326: 'ac_unit',
    329: 'ac_unit',
    332: 'ac_unit',
    335: 'ac_unit',
    338: 'ac_unit',
    341: 'thunderstorm',
    344: 'thunderstorm'
  };
  return map[code] || (isDay ? 'wb_sunny' : 'dark_mode');
}

function getWeatherClass(code) {
  if (code === 113 && !isDayTime()) return 'weather-night';
  if (code === 113) return 'weather-sunny';
  if (code === 116) return 'weather-partly-cloudy';
  if (code >= 143 && code <= 260) return 'weather-fog';
  if (code >= 176 && code <= 200) return 'weather-storm';
  if (code >= 200 && code <= 260) return 'weather-storm';
  if (code >= 263 && code <= 314) return 'weather-rainy';
  if (code >= 317 && code <= 344) return 'weather-snow';
  if (code >= 119 && code <= 122) return 'weather-cloudy';
  return 'weather-partly-cloudy';
}

function isDayTime() {
  var h = new Date().getHours();
  return h >= 6 && h < 18;
}

function fetchWeather() {
  var widget = document.getElementById('weatherWidget');
  var loading = document.getElementById('weatherLoading');
  var content = document.getElementById('weatherContent');
  if (!widget) return;

  var url = 'https://wttr.in/Santa+Cruz+do+Rio+Pardo?format=j1';
  fetch(url, { method: 'GET' })
    .then(function(resp) { return resp.json(); })
    .then(function(json) {
      if (loading) loading.classList.add('hidden');
      if (content) content.classList.remove('hidden');

      var curr = json.current_condition[0];
      var temp = curr.temp_C || '--';
      var desc = curr.weatherDesc[0].value || '';
      var humidity = curr.humidity || '--';
      var wind = curr.windspeedKmph || '--';
      var pressure = curr.pressure || '--';
      var code = parseInt(curr.weatherCode, 10);
      var isDay = curr.weatherCode !== '113' ? true : isDayTime();

      var icon = getWeatherIcon(code, isDay);
      var wClass = getWeatherClass(code);

      var elIcon = document.getElementById('weatherIcon');
      var elTemp = document.getElementById('weatherTemp');
      var elDesc = document.getElementById('weatherDesc');
      var elHumidity = document.getElementById('weatherHumidity');
      var elWind = document.getElementById('weatherWind');
      var elPressure = document.getElementById('weatherPressure');

      widget.className = 'weather-widget ' + wClass;
      if (elIcon) elIcon.textContent = icon;
      if (elTemp) elTemp.textContent = temp + '°C';
      if (elDesc) elDesc.textContent = desc;
      if (elHumidity) elHumidity.textContent = humidity + '%';
      if (elWind) elWind.textContent = wind + ' km/h';
      if (elPressure) elPressure.textContent = pressure + ' hPa';
    })
    .catch(function() {
      if (loading) {
        loading.innerHTML = '<span class="material-icons-round">cloud_off</span> Clima indisponível';
      }
    });
}

function loadAllData() {
  updateDemoBanner();
  fetchWeather();

  Promise.all([
    App.api.getRadios(),
    App.api.getClassificados(),
    App.api.getProfissionais()
  ]).then(function(results) {
    var radios = results[0] || [];
    var classif = results[1] || [];
    var prof = results[2] || [];

    App.radios.render(radios);
    App.classificados.render(classif);
    App.profissionais.render(prof);

    // Home previews
    renderHomeRadios(radios.slice(0, 3));
    renderHomeClassif(classif.slice(0, 6));
    renderHomeProf(prof);
    // Home stats
    var statRadios = document.getElementById('statRadios');
    var statClassif = document.getElementById('statClassificados');
    var statProf = document.getElementById('statProfissionais');
    if (statRadios) statRadios.textContent = radios.length;
    if (statClassif) statClassif.textContent = classif.length;
    if (statProf) statProf.textContent = prof.length;

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
  initConfigPage();

  loadAllData();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) { r.unregister(); });
    });
  }
  registerSW();
});
