App.profissionais = (function() {
  var data = [];
  var currentFilter = '';

  function compressImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var maxW = 300, maxH = 300;
        var w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        if (h > maxH) { w = w * maxH / h; h = maxH; }
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function init() {
    var fab = document.getElementById('fabProf');
    if (fab) fab.addEventListener('click', function() { editingId = null; showAddForm(); });

    var filterSelect = document.getElementById('profCategoryFilter');
    if (filterSelect) filterSelect.addEventListener('change', function() {
      currentFilter = this.value;
      render(data);
    });

    var filterBtn = document.getElementById('filterProfBtn');
    if (filterBtn) filterBtn.addEventListener('click', function() {
      var bar = document.getElementById('profFilterBar');
      if (bar) bar.classList.toggle('hidden');
    });

    var myBtn = document.getElementById('myProfBtn');
    if (myBtn) myBtn.addEventListener('click', showMyCadastros);
  }

  function render(items) {
    data = items || [];
    var grid = document.getElementById('profGrid');
    if (!grid) return;

    var filtered = data;
    if (currentFilter) {
      filtered = data.filter(function(p) {
        return (p.profissao || '').toLowerCase() === currentFilter.toLowerCase();
      });
    }

    if (!filtered || filtered.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<span class="material-icons-round">work</span>' +
          '<h3>Nenhum profissional encontrado</h3>' +
          '<p>' + (currentFilter ? 'Nada nesta categoria' : 'Seja o primeiro a se cadastrar!') + '</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var p = filtered[i];
      var phoneClean = String(p.telefone || '').replace(/\D/g, '');
      var whatsLink = 'https://wa.me/55' + phoneClean;
      var telLink = 'tel:+55' + phoneClean;

      var photoHtml = '';
      if (p.foto && (p.foto.startsWith('http') || p.foto.startsWith('data:'))) {
        photoHtml = '<img class="prof-photo" src="' + escapeHtml(p.foto) + '" alt="' + escapeHtml(p.nome) + '" loading="lazy">';
      } else {
        var initial = (p.nome || '?').charAt(0).toUpperCase();
        photoHtml = '<div class="prof-photo-placeholder"><span class="material-icons-round" style="font-size:32px">person</span></div>';
      }

      var whatsBtn = (p.whatsapp || '').toLowerCase() === 'sim' || (p.whatsapp || '').toLowerCase() === 's'
        ? '<a href="' + whatsLink + '" target="_blank" class="btn-whatsapp"><span class="material-icons-round" style="font-size:16px">chat</span> WhatsApp</a>'
        : '';

      html +=
        '<div class="prof-card" data-id="' + p.id + '">' +
          photoHtml +
          '<div class="prof-name">' + escapeHtml(p.nome) + '</div>' +
          '<div class="prof-profession">' + escapeHtml(p.profissao) + '</div>' +
          '<div class="prof-desc">' + escapeHtml(p.descricao || '') + '</div>' +
          '<div class="prof-location"><span class="material-icons-round" style="font-size:14px">location_on</span> ' + escapeHtml(p.bairro || '') + (p.bairro && p.cidade ? ' - ' : '') + escapeHtml(p.cidade || '') + '</div>' +
          '<div class="prof-actions">' +
            (whatsBtn || '') +
            '<a href="' + telLink + '" class="btn-phone"' + (whatsBtn ? '' : ' style="flex:1"') + '><span class="material-icons-round" style="font-size:16px">phone</span> Ligar</a>' +
          '</div>' +
        '</div>';
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.prof-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var item = null;
        for (var j = 0; j < filtered.length; j++) {
          if (String(filtered[j].id) === String(id)) { item = filtered[j]; break; }
        }
        if (item) showDetail(item);
      });
    });
  }

  var editingId = null;

  function showAddForm(editItem) {
    if (!App.auth || !App.auth.isLoggedIn()) {
      App.auth.showLoginForm();
      return;
    }
    var isEdit = !!editItem;
    App.showModal(isEdit ? 'Editar Profissional' : 'Cadastrar Profissional',
      '<form id="formProf" onsubmit="return false">' +
        '<div class="form-group">' +
          '<label class="form-label">Nome completo</label>' +
          '<input type="text" class="form-input" id="fNome" placeholder="Seu nome" value="' + (editItem ? escapeHtml(editItem.nome) : '') + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Profissão</label>' +
          '<select class="form-select" id="fProfissao">' +
            '<option value="">Selecione...</option>' +
            '<option value="Eletricista">Eletricista</option>' +
            '<option value="Pedreiro">Pedreiro</option>' +
            '<option value="Encanador">Encanador</option>' +
            '<option value="Pintor">Pintor</option>' +
            '<option value="Frete e Mudanças">Frete e Mudanças</option>' +
            '<option value="Jardineiro">Jardineiro</option>' +
            '<option value="Marceneiro">Marceneiro</option>' +
            '<option value="Mecânico">Mecânico</option>' +
            '<option value="Chaveiro">Chaveiro</option>' +
            '<option value="TI / Informática">TI / Informática</option>' +
            '<option value="Fotógrafo">Fotógrafo</option>' +
            '<option value="Personal Trainer">Personal Trainer</option>' +
            '<option value="Diarista">Diarista</option>' +
            '<option value="Babá">Babá</option>' +
            '<option value="Outros">Outros</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Telefone</label>' +
          '<input type="tel" class="form-input" id="fTel" placeholder="(81) 99999-0000" value="' + (editItem ? escapeHtml(editItem.telefone) : '') + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-check">' +
            '<input type="checkbox" id="fWhatsapp" ' + (editItem && editItem.whatsapp === 'Sim' ? 'checked' : '') + '> Tem WhatsApp' +
          '</label>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Descrição / Experiência</label>' +
          '<textarea class="form-textarea" id="fDesc" placeholder="Conte um pouco sobre seu trabalho..." required>' + (editItem ? escapeHtml(editItem.descricao) : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Bairro</label>' +
          '<input type="text" class="form-input" id="fBairro" placeholder="Seu bairro" value="' + (editItem ? escapeHtml(editItem.bairro) : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Cidade</label>' +
          '<input type="text" class="form-input" id="fCidade" placeholder="Sua cidade" value="' + (editItem ? escapeHtml(editItem.cidade) : 'Santa Cruz do Capibaribe') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Foto (opcional)</label>' +
          '<div class="image-upload-area" id="profPhotoArea">' +
            '<span class="material-icons-round">add_a_photo</span>' +
            '<p>Toque para adicionar foto</p>' +
          '</div>' +
          '<input type="file" id="fFoto" accept="image/*" style="display:none">' +
          '<div class="image-preview" id="profPhotoPreview"></div>' +
          '<input type="url" class="form-input" id="fUrlFoto" placeholder="Ou cole URL da foto" style="margin-top:4px">' +
        '</div>' +

        '<button type="submit" class="form-btn form-btn-primary" id="btnSubmitProf">' + (isEdit ? 'Salvar Alterações' : 'Cadastrar') + '</button>' +
      '</form>'
    );

    var photoUrl = '';
    var uploadArea = document.getElementById('profPhotoArea');
    var fileInput = document.getElementById('fFoto');
    var preview = document.getElementById('profPhotoPreview');
    var urlInput = document.getElementById('fUrlFoto');

    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
          compressImage(this.files[0], function(compressed) {
            preview.innerHTML = '<img src="' + compressed + '" style="width:72px;height:72px;border-radius:50%;object-fit:cover">';
            photoUrl = compressed;
          });
        }
      });
    }

    if (urlInput) {
      urlInput.addEventListener('change', function() {
        if (this.value) {
          preview.innerHTML = '<img src="' + this.value + '" style="width:72px;height:72px;border-radius:50%;object-fit:cover">';
          photoUrl = this.value;
        }
      });
    }

    var btnSubmit = document.getElementById('btnSubmitProf');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', submitForm);
    }
  }

  async function submitForm() {
    var nome = document.getElementById('fNome');
    var profissao = document.getElementById('fProfissao');
    var tel = document.getElementById('fTel');
    var whats = document.getElementById('fWhatsapp');
    var desc = document.getElementById('fDesc');
    var bairro = document.getElementById('fBairro');
    var cidade = document.getElementById('fCidade');
    var urlInput = document.getElementById('fUrlFoto');

    if (!nome || !nome.value.trim()) {
      App.showToast('Digite seu nome');
      nome.focus();
      return;
    }
    if (!profissao || !profissao.value) {
      App.showToast('Selecione sua profissão');
      profissao.focus();
      return;
    }
    if (!tel || !tel.value.trim()) {
      App.showToast('Digite seu telefone');
      tel.focus();
      return;
    }

    var preview = document.getElementById('profPhotoPreview');
    var fotoUrl = '';
    if (preview) {
      var img = preview.querySelector('img');
      if (img) fotoUrl = img.src;
    }
    if (urlInput && urlInput.value && !fotoUrl) {
      fotoUrl = urlInput.value;
    }

    var data = {
      nome: nome.value.trim(),
      profissao: profissao.value,
      telefone: tel.value.trim(),
      whatsapp: whats && whats.checked ? 'Sim' : 'Nao',
      descricao: desc ? desc.value.trim() : '',
      foto: fotoUrl,
      bairro: bairro ? bairro.value.trim() : '',
      cidade: cidade ? cidade.value.trim() : '',
      userId: App.auth && App.auth.isLoggedIn() ? App.auth.getCurrentUser().id : ''
    };

    var result;
    if (editingId) {
      data.id = editingId;
      result = await App.api.updateProfissional(data);
      editingId = null;
    } else {
      result = await App.api.addProfissional(data);
    }

    App.closeModal();
    App.showToast(result.error ? 'Salvo localmente (erro: ' + result.error + ')' : (editingId ? 'Profissional atualizado!' : 'Cadastro realizado!'));
    App.refreshData();
  }

  function showMyCadastros() {
    if (!App.auth || !App.auth.isLoggedIn()) {
      App.auth.showLoginForm();
      return;
    }
    var userId = App.auth.getCurrentUser().id;
    var meus = getMyItems(userId);
    if (meus.length === 0) {
      App.showToast('Você ainda não fez nenhum cadastro');
      return;
    }
    App.closeModal();
    render(meus);
    App.showToast('Mostrando ' + meus.length + ' cadastro(s)');
  }

  function getMyItems(userId) {
    return data.filter(function(p) { return String(p.userId) === String(userId); });
  }

  function verificarSenhaE(id, callback) {
    var item = null;
    for (var si = 0; si < data.length; si++) {
      if (String(data[si].id) === String(id)) { item = data[si]; break; }
    }
    if (item && App.auth && App.auth.isLoggedIn() && App.auth.ownsItem(item)) {
      callback(null, item);
      return;
    }

    App.showModal('Verificar Senha',
      '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">Digite a senha de administrador para continuar:</p>' +
      '<div class="form-group">' +
        '<label class="form-label">Senha</label>' +
        '<input type="password" class="form-input" id="verifySenhaInput" placeholder="Senha administrativa">' +
      '</div>' +
      '<button class="form-btn form-btn-primary" id="verifySenhaBtn">Confirmar</button>'
    );
    document.getElementById('verifySenhaBtn').addEventListener('click', function() {
      var senha = document.getElementById('verifySenhaInput').value;
      if (!senha) { App.showToast('Digite a senha'); return; }
      var adminSenha = (typeof CONFIG !== 'undefined' && CONFIG.adminSenha) || '';
      if (adminSenha && senha === adminSenha) {
        App.closeModal();
        callback(null, item);
      } else {
        App.showToast('Senha incorreta!');
      }
    });
  }

  function editarProfissional(id) {
    for (var i = 0; i < data.length; i++) {
      if (String(data[i].id) === String(id)) {
        verificarSenhaE(id, function(err, item) {
          if (err) return;
          editingId = item.id;
          showAddForm(item);
        });
        return;
      }
    }
  }

  function confirmarExclusaoProf(id) {
    verificarSenhaE(id, function(err, item) {
      if (err) return;
      App.showModal('Confirmar Exclusão',
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">Tem certeza que deseja excluir este cadastro?</p>' +
        '<p style="font-weight:600;margin-bottom:16px">' + escapeHtml(item.nome) + '</p>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="form-btn form-btn-primary" id="confirmDeleteProfBtn" style="flex:1;background:#dc2626;color:#fff">Sim, Excluir</button>' +
          '<button class="form-btn form-btn-secondary" onclick="App.closeModal()" style="flex:1">Cancelar</button>' +
        '</div>'
      );
      document.getElementById('confirmDeleteProfBtn').addEventListener('click', async function() {
        App.closeModal();
        App.showToast('Excluindo...');
        var result = await App.api.deleteProfissional(id);
        App.showToast(result.error ? 'Erro ao excluir: ' + result.error : 'Cadastro excluído!');
        App.refreshData();
      });
    });
  }

  function showDetail(item) {
    var phoneClean = String(item.telefone || '').replace(/\D/g, '');
    var whatsLink = 'https://wa.me/55' + phoneClean;
    var telLink = 'tel:+55' + phoneClean;

    var photoHtml = '';
    if (item.foto && (item.foto.startsWith('http') || item.foto.startsWith('data:'))) {
      photoHtml = '<img class="prof-detail-photo" src="' + escapeHtml(item.foto) + '" alt="' + escapeHtml(item.nome) + '">';
    } else {
      photoHtml = '<div class="prof-detail-photo" style="background:var(--bg);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;border-radius:50%;width:96px;height:96px"><span class="material-icons-round" style="font-size:48px;color:var(--text-secondary)">person</span></div>';
    }

    var adminActions = '';
    adminActions +=
      '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">' +
        '<p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Gerenciar este cadastro</p>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="form-btn form-btn-secondary" onclick="App.profissionais.editarProfissional(\'' + item.id + '\')" style="flex:1;text-align:center;font-size:13px;padding:8px">Editar</button>' +
          '<button class="form-btn" onclick="App.profissionais.confirmarExclusaoProf(\'' + item.id + '\')" style="flex:1;text-align:center;font-size:13px;padding:8px;background:#fee2e2;color:#991b1b">Excluir</button>' +
        '</div>' +
      '</div>';

    App.showModal(item.nome,
      '<div class="prof-detail-header">' +
        photoHtml +
        '<div class="prof-detail-name">' + escapeHtml(item.nome) + '</div>' +
        '<div class="prof-detail-prof">' + escapeHtml(item.profissao) + '</div>' +
      '</div>' +
      '<div class="detail-info">' +
        '<div class="detail-info-row"><span class="material-icons-round">description</span> ' + escapeHtml(item.descricao || 'Sem descrição') + '</div>' +
        '<div class="detail-info-row"><span class="material-icons-round">location_on</span> ' + escapeHtml(item.bairro || '') + (item.bairro && item.cidade ? ' - ' : '') + escapeHtml(item.cidade || '') + '</div>' +
        (item.whatsapp === 'Sim' ? '<div class="detail-info-row"><span class="material-icons-round" style="color:#25D366">check_circle</span> Disponível no WhatsApp</div>' : '') +
      '</div>' +
      '<div class="detail-actions">' +
        (item.whatsapp === 'Sim'
          ? '<a href="' + whatsLink + '" target="_blank" class="form-btn form-btn-primary" style="flex:1;text-align:center;text-decoration:none;padding:12px;border-radius:8px;background:#25D366;color:#fff;font-weight:600">WhatsApp</a>'
          : '') +
        '<a href="' + telLink + '" class="form-btn form-btn-secondary" style="flex:1;text-align:center;text-decoration:none;padding:12px;border-radius:8px;font-weight:600">Ligar</a>' +
      '</div>' +
      adminActions
    );
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

  function showDetailById(id) {
    for (var i = 0; i < data.length; i++) {
      if (String(data[i].id) === String(id)) { showDetail(data[i]); return; }
    }
  }

  return {
    init: init,
    render: render,
    showMyCadastros: showMyCadastros,
    editarProfissional: editarProfissional,
    confirmarExclusaoProf: confirmarExclusaoProf,
    showDetailById: showDetailById,
    getMyItems: getMyItems
  };
})();
