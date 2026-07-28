App.auth = (function() {
  var SESSION_KEY = 'santacruz_session';
  var USERS_KEY = 'santacruz_usuarios';
  var currentUser = null;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function loadSession() {
    try {
      var saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        currentUser = JSON.parse(saved);
        updateHeaderUI();
      }
    } catch(e) {}
  }

  function saveSession(user) {
    currentUser = user;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch(e) {}
    updateHeaderUI();
  }

  function clearSession() {
    currentUser = null;
    try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
    updateHeaderUI();
  }

  function getUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch(e) {}
  }

  function updateHeaderUI() {
    var btn = document.getElementById('authBtn');
    var userBadge = document.getElementById('userBadge');
    var userNameEl = document.getElementById('userName');
    if (!btn) return;
    if (currentUser) {
      btn.innerHTML = '<span class="material-icons-round" style="font-size:22px">account_circle</span>';
      btn.classList.add('logged-in');
      if (userBadge) userBadge.classList.remove('hidden');
      if (userNameEl) userNameEl.textContent = currentUser.nome || currentUser.email;
    } else {
      btn.innerHTML = '<span class="material-icons-round" style="font-size:22px">person</span>';
      btn.classList.remove('logged-in');
      if (userBadge) userBadge.classList.add('hidden');
    }
  }

  function generateId() {
    return 'U' + Date.now() + Math.random().toString(36).substr(2, 4);
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return !!currentUser;
  }

  function ownsItem(item) {
    if (!currentUser || !item) return false;
    return String(item.userId) === String(currentUser.id);
  }

  function showLoginForm() {
    App.showModal('Entrar',
      '<form id="loginForm" onsubmit="return false">' +
        '<div class="form-group">' +
          '<label class="form-label">E-mail</label>' +
          '<input type="email" class="form-input" id="loginEmail" placeholder="seu@email.com" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Senha</label>' +
          '<input type="password" class="form-input" id="loginSenha" placeholder="Sua senha" required>' +
        '</div>' +
        '<button type="submit" class="form-btn form-btn-primary" id="loginBtn">Entrar</button>' +
        '<p style="text-align:center;margin-top:12px;font-size:13px;color:var(--text-secondary)">' +
          'Não tem conta? <a href="#" id="goToRegister" style="color:var(--primary);font-weight:600">Cadastre-se</a>' +
        '</p>' +
      '</form>'
    );
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('goToRegister').addEventListener('click', function(e) {
      e.preventDefault();
      App.closeModal();
      showRegisterForm();
    });
    document.getElementById('loginEmail').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('loginSenha').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
    setTimeout(function() {
      var el = document.getElementById('loginEmail');
      if (el) el.focus();
    }, 300);
  }

  async function handleLogin() {
    var email = document.getElementById('loginEmail');
    var senha = document.getElementById('loginSenha');
    var btn = document.getElementById('loginBtn');
    if (!email || !email.value.trim()) { App.showToast('Digite seu e-mail'); if (email) email.focus(); return; }
    if (!senha || !senha.value) { App.showToast('Digite sua senha'); if (senha) senha.focus(); return; }

    btn.disabled = true;
    btn.textContent = 'Entrando...';

    if (!CONFIG.useDemoData && CONFIG.apiUrl) {
      try {
        var resp = await fetch(CONFIG.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'loginUser', email: email.value.trim(), senha: senha.value })
        });
        var json = await resp.json();
        btn.disabled = false;
        btn.textContent = 'Entrar';
        if (json.success && json.user) {
          saveSession(json.user);
          App.closeModal();
          App.showToast('Bem-vindo, ' + json.user.nome + '!');
        } else {
          App.showToast(json.error || 'Erro ao fazer login');
        }
        return;
      } catch(e) { btn.disabled = false; btn.textContent = 'Entrar'; }
      return;
    }

    var users = getUsers();
    var found = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email.value.trim() && users[i].senha === senha.value) {
        found = users[i];
        break;
      }
    }
    btn.disabled = false;
    btn.textContent = 'Entrar';

    if (found) {
      saveSession({ id: found.id, nome: found.nome, email: found.email, telefone: found.telefone });
      App.closeModal();
      App.showToast('Bem-vindo, ' + found.nome + '!');
    } else {
      App.showToast('E-mail ou senha incorretos');
    }
  }

  function showRegisterForm() {
    App.showModal('Criar Conta',
      '<form id="registerForm" onsubmit="return false">' +
        '<div class="form-group">' +
          '<label class="form-label">Nome completo</label>' +
          '<input type="text" class="form-input" id="regNome" placeholder="Seu nome" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">E-mail</label>' +
          '<input type="email" class="form-input" id="regEmail" placeholder="seu@email.com" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Telefone</label>' +
          '<input type="tel" class="form-input" id="regTelefone" placeholder="(81) 99999-0000">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Senha</label>' +
          '<input type="password" class="form-input" id="regSenha" placeholder="Crie uma senha" required>' +
        '</div>' +
        '<button type="submit" class="form-btn form-btn-primary" id="registerBtn">Criar Conta</button>' +
        '<p style="text-align:center;margin-top:12px;font-size:13px;color:var(--text-secondary)">' +
          'Já tem conta? <a href="#" id="goToLogin" style="color:var(--primary);font-weight:600">Entrar</a>' +
        '</p>' +
      '</form>'
    );
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('goToLogin').addEventListener('click', function(e) {
      e.preventDefault();
      App.closeModal();
      showLoginForm();
    });
    setTimeout(function() {
      var el = document.getElementById('regNome');
      if (el) el.focus();
    }, 300);
  }

  async function handleRegister() {
    var nome = document.getElementById('regNome');
    var email = document.getElementById('regEmail');
    var telefone = document.getElementById('regTelefone');
    var senha = document.getElementById('regSenha');
    var btn = document.getElementById('registerBtn');

    if (!nome || !nome.value.trim()) { App.showToast('Digite seu nome'); if (nome) nome.focus(); return; }
    if (!email || !email.value.trim()) { App.showToast('Digite seu e-mail'); if (email) email.focus(); return; }
    if (!senha || !senha.value) { App.showToast('Crie uma senha'); if (senha) senha.focus(); return; }
    if (senha.value.length < 4) { App.showToast('A senha deve ter pelo menos 4 caracteres'); if (senha) senha.focus(); return; }

    btn.disabled = true;
    btn.textContent = 'Criando...';

    if (!CONFIG.useDemoData && CONFIG.apiUrl) {
      try {
        var resp = await fetch(CONFIG.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'registerUser',
            nome: nome.value.trim(),
            email: email.value.trim(),
            telefone: telefone.value.trim(),
            senha: senha.value
          })
        });
        var json = await resp.json();
        btn.disabled = false;
        btn.textContent = 'Criar Conta';
        if (json.success && json.user) {
          saveSession(json.user);
          App.closeModal();
          App.showToast('Conta criada! Bem-vindo, ' + json.user.nome + '!');
        } else {
          App.showToast(json.error || 'Erro ao cadastrar');
        }
        return;
      } catch(e) { btn.disabled = false; btn.textContent = 'Criar Conta'; }
      return;
    }

    var users = getUsers();
    var existing = false;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email.value.trim()) { existing = true; break; }
    }
    btn.disabled = false;
    btn.textContent = 'Criar Conta';

    if (existing) {
      App.showToast('Este e-mail já está cadastrado');
      return;
    }

    var newUser = {
      id: generateId(),
      nome: nome.value.trim(),
      email: email.value.trim(),
      telefone: telefone.value.trim(),
      senha: senha.value,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    saveSession({ id: newUser.id, nome: newUser.nome, email: newUser.email, telefone: newUser.telefone });
    App.closeModal();
    App.showToast('Conta criada! Bem-vindo, ' + newUser.nome + '!');
  }

  function showUserMenu() {
    if (!currentUser) { showLoginForm(); return; }
    App.showModal('Minha Conta',
      '<div style="text-align:center;margin-bottom:16px">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;margin:0 auto 8px">' +
          '<span class="material-icons-round" style="font-size:32px;color:#fff">person</span>' +
        '</div>' +
        '<div style="font-size:18px;font-weight:700">' + escapeHtml(currentUser.nome) + '</div>' +
        '<div style="font-size:13px;color:var(--text-secondary)">' + escapeHtml(currentUser.email) + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
        '<button class="form-btn form-btn-secondary" id="authMyClassifBtn"><span class="material-icons-round" style="font-size:18px">sell</span> Meus Anúncios</button>' +
        '<button class="form-btn form-btn-secondary" id="authMyProfBtn"><span class="material-icons-round" style="font-size:18px">work</span> Meus Cadastros</button>' +
        '<button class="form-btn" id="authLogoutBtn" style="background:#fee2e2;color:#991b1b"><span class="material-icons-round" style="font-size:18px">logout</span> Sair</button>' +
      '</div>'
    );
    document.getElementById('authMyClassifBtn').addEventListener('click', function() {
      App.closeModal();
      showMyClassif();
    });
    document.getElementById('authMyProfBtn').addEventListener('click', function() {
      App.closeModal();
      showMyProf();
    });
    document.getElementById('authLogoutBtn').addEventListener('click', function() {
      App.closeModal();
      clearSession();
      App.showToast('Você saiu da conta');
      App.refreshData();
    });
  }

  function showMyClassif() {
    if (!currentUser) { showLoginForm(); return; }
    var items = typeof App.classificados !== 'undefined' ? App.classificados.getMyItems(currentUser.id) : [];
    if (items.length === 0) {
      App.showModal('Meus Anúncios',
        '<div style="text-align:center;padding:20px;color:var(--text-secondary)">' +
          '<span class="material-icons-round" style="font-size:48px;margin-bottom:8px">sell</span>' +
          '<p>Você ainda não publicou nenhum anúncio.</p>' +
          '<p style="font-size:13px;margin-top:4px">Vá em Classificados e crie seu primeiro anúncio!</p>' +
        '</div>'
      );
      return;
    }
    if (typeof App.classificados !== 'undefined') {
      App.closeModal();
      App.nav.navigate('classificados');
      App.classificados.render(items);
      App.showToast('Mostrando ' + items.length + ' anúncio(s)');
    }
  }

  function showMyProf() {
    if (!currentUser) { showLoginForm(); return; }
    var items = typeof App.profissionais !== 'undefined' ? App.profissionais.getMyItems(currentUser.id) : [];
    if (items.length === 0) {
      App.showModal('Meus Cadastros',
        '<div style="text-align:center;padding:20px;color:var(--text-secondary)">' +
          '<span class="material-icons-round" style="font-size:48px;margin-bottom:8px">work</span>' +
          '<p>Você ainda não se cadastrou como profissional.</p>' +
          '<p style="font-size:13px;margin-top:4px">Vá em Profissionais e faça seu cadastro!</p>' +
        '</div>'
      );
      return;
    }
    if (typeof App.profissionais !== 'undefined') {
      App.closeModal();
      App.nav.navigate('profissionais');
      App.profissionais.render(items);
      App.showToast('Mostrando ' + items.length + ' cadastro(s)');
    }
  }

  function init() {
    loadSession();
    var authBtn = document.getElementById('authBtn');
    if (authBtn) {
      authBtn.addEventListener('click', function() {
        if (currentUser) {
          showUserMenu();
        } else {
          showLoginForm();
        }
      });
    }
  }

  return {
    init: init,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    ownsItem: ownsItem,
    logout: clearSession,
    showLoginForm: showLoginForm,
    showRegisterForm: showRegisterForm,
    showUserMenu: showUserMenu,
    showMyClassif: showMyClassif,
    showMyProf: showMyProf
  };
})();