App.eventos = (function() {
  var data = [];
  var editingId = null;
  var evImage = null;

  function init() {
    var fab = document.getElementById('fabEventos');
    if (fab) fab.addEventListener('click', function() { editingId = null; showAddForm(); });
  }

  function render(items) {
    data = items || [];
    data = data.slice().sort(function(a, b) { return new Date(a.data) - new Date(b.data); });
    var grid = document.getElementById('eventosGrid');
    if (!grid) return;

    if (!data || data.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<span class="material-icons-round">event</span>' +
          '<h3>Nenhum evento encontrado</h3>' +
          '<p>Seja o primeiro a cadastrar um evento!</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < data.length; i++) {
      var e = data[i];
      var evDate = e.data ? formatDate(e.data) : 'Data a definir';
      var isPast = e.data ? isPastDate(e.data) : false;
      var imgHtml = '';
      if (e.imagens) {
        var imgs = e.imagens.split('|');
        if (imgs.length > 0 && (imgs[0].startsWith('data:') || imgs[0].startsWith('http')))
          imgHtml = '<img class="evento-image" src="' + escapeHtml(imgs[0]) + '" alt="" loading="lazy">';
      }
      html +=
        '<div class="evento-card' + (isPast ? ' evento-past' : '') + '" data-id="' + e.id + '">' +
          (imgHtml ? imgHtml : '') +
          '<div class="evento-date-badge">' +
            '<span class="evento-date-day">' + getDay(evDate) + '</span>' +
            '<span class="evento-date-month">' + getMonth(evDate) + '</span>' +
          '</div>' +
          '<div class="evento-body">' +
            '<div class="evento-title">' + escapeHtml(e.titulo) + '</div>' +
            '<div class="evento-info"><span class="material-icons-round">schedule</span> ' + escapeHtml(formatTime(e.horario) || 'Horário não informado') + '</div>' +
            (e.local ? '<div class="evento-info"><span class="material-icons-round">location_on</span> ' + escapeHtml(e.local) + '</div>' : '') +
            '<div class="evento-desc">' + escapeHtml(e.descricao || '') + '</div>' +
          '</div>' +
        '</div>';
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.evento-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var item = null;
        for (var j = 0; j < data.length; j++) {
          if (String(data[j].id) === String(id)) { item = data[j]; break; }
        }
        if (item) showDetail(item);
      });
    });
  }

  function compressImage(file, callback) {
    if (!file) return;
    if (file.size < 300 * 1024) {
      var reader = new FileReader();
      reader.onload = function(e) { callback(e.target.result); };
      reader.readAsDataURL(file);
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var maxW = 1200, maxH = 1200;
        var w = img.width, h = img.height;
        if (w > maxW || h > maxH) {
          var ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio); h = Math.round(h * ratio);
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function getDay(dateStr) {
    return dateStr.split('/')[0] || '';
  }
  function getMonth(dateStr) {
    var months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    var m = parseInt(dateStr.split('/')[1], 10) - 1;
    return months[m] || '';
  }

  function isPastDate(dateStr) {
    if (!dateStr) return false;
    var parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    var today = new Date();
    today.setHours(0,0,0,0);
    return d < today;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (!isNaN(d)) {
      return String(d.getDate()).padStart(2, '0') + '/' +
             String(d.getMonth() + 1).padStart(2, '0') + '/' +
             d.getFullYear();
    }
    // Fallback: extrai dd/mm/aaaa de qualquer formato como "Sat Dec 30 1899 19:00:00 GMT-0306"
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

  function formatTime(timeStr) {
    if (!timeStr) return '';
    var d = new Date(timeStr);
    if (!isNaN(d)) {
      return String(d.getHours()).padStart(2, '0') + ':' +
             String(d.getMinutes()).padStart(2, '0');
    }
    // Fallback: extrai HH:mm de qualquer formato
    var m = timeStr.match(/(\d{2}):(\d{2})/);
    if (m) return m[1] + ':' + m[2];
    return timeStr;
  }

  function showAddForm(editItem) {
    if (!App.auth || !App.auth.isLoggedIn()) {
      App.auth.showLoginForm();
      return;
    }
    var isEdit = !!editItem;

    App.showModal(isEdit ? 'Editar Evento' : 'Novo Evento',
      '<form id="formEvento" onsubmit="return false">' +
        '<div class="form-group">' +
          '<label class="form-label">Título do Evento</label>' +
          '<input type="text" class="form-input" id="fEvTitulo" placeholder="Ex: Festa Julina" value="' + (editItem ? escapeHtml(editItem.titulo) : '') + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Descrição</label>' +
          '<textarea class="form-textarea" id="fEvDesc" placeholder="Descreva o evento..." required>' + (editItem ? escapeHtml(editItem.descricao) : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Data do Evento</label>' +
          '<input type="date" class="form-input" id="fEvData" value="' + (editItem ? editItem.data : '') + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Horário</label>' +
          '<input type="time" class="form-input" id="fEvHorario" value="' + (editItem ? escapeHtml(editItem.horario || '') : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Local</label>' +
          '<input type="text" class="form-input" id="fEvLocal" placeholder="Onde vai ser?" value="' + (editItem ? escapeHtml(editItem.local || '') : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Imagem</label>' +
          '<div class="image-upload-area" id="evImageUploadArea">' +
            '<span class="material-icons-round">add_photo_alternate</span>' +
            '<p>Toque para adicionar foto</p>' +
          '</div>' +
          '<input type="file" id="fEvImagem" accept="image/*" style="display:none">' +
          '<div class="image-preview" id="evImagePreview"></div>' +
          '<div class="image-preview-url">' +
            '<input type="url" class="form-input" id="fEvUrlImagem" placeholder="Ou cole URL da imagem">' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Telefone p/ Contato</label>' +
          '<input type="tel" class="form-input" id="fEvTel" placeholder="(81) 99999-0000" value="' + (editItem ? escapeHtml(editItem.telefone || '') : '') + '">' +
        '</div>' +
        '<button type="submit" class="form-btn form-btn-primary" id="btnSubmitEvento">' + (isEdit ? 'Salvar Alterações' : 'Criar Evento') + '</button>' +
      '</form>'
    );

    evImage = null;
    var uploadArea = document.getElementById('evImageUploadArea');
    var fileInput = document.getElementById('fEvImagem');
    var preview = document.getElementById('evImagePreview');
    var urlInput = document.getElementById('fEvUrlImagem');

    if (editItem && editItem.imagens) {
      var existing = editItem.imagens.split('|')[0];
      if (existing && (existing.startsWith('data:') || existing.startsWith('http'))) {
        evImage = existing;
        preview.innerHTML = '<div class="img-thumb-wrap"><img class="img-thumb" src="' + escapeHtml(existing) + '"><button type="button" class="img-remove-btn" id="evImgRemove"><span class="material-icons-round">close</span></button></div>';
        document.getElementById('evImgRemove').addEventListener('click', function() { evImage = null; preview.innerHTML = ''; });
      }
    }

    if (uploadArea) uploadArea.addEventListener('click', function() { if (fileInput) fileInput.click(); });
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          compressImage(this.files[0], function(dataUrl) {
            evImage = dataUrl;
            preview.innerHTML = '<div class="img-thumb-wrap"><img class="img-thumb" src="' + dataUrl + '"><button type="button" class="img-remove-btn" id="evImgRemove"><span class="material-icons-round">close</span></button></div>';
            document.getElementById('evImgRemove').addEventListener('click', function() { evImage = null; preview.innerHTML = ''; });
          });
        }
      });
    }
    if (urlInput) {
      urlInput.addEventListener('change', function() {
        if (this.value) {
          evImage = this.value;
          preview.innerHTML = '<div class="img-thumb-wrap"><img class="img-thumb" src="' + escapeHtml(this.value) + '"><button type="button" class="img-remove-btn" id="evImgRemove"><span class="material-icons-round">close</span></button></div>';
          document.getElementById('evImgRemove').addEventListener('click', function() { evImage = null; preview.innerHTML = ''; urlInput.value = ''; });
        }
      });
    }

    var btnSubmit = document.getElementById('btnSubmitEvento');
    if (btnSubmit) btnSubmit.addEventListener('click', submitForm);
  }

  async function submitForm() {
    var titulo = document.getElementById('fEvTitulo');
    var desc = document.getElementById('fEvDesc');
    var dataEv = document.getElementById('fEvData');
    var horario = document.getElementById('fEvHorario');
    var local = document.getElementById('fEvLocal');
    var tel = document.getElementById('fEvTel');
    var btn = document.getElementById('btnSubmitEvento');

    if (!titulo || !titulo.value.trim()) { App.showToast('Digite o título do evento'); if (titulo) titulo.focus(); return; }
    if (!desc || !desc.value.trim()) { App.showToast('Digite a descrição'); if (desc) desc.focus(); return; }
    if (!dataEv || !dataEv.value) { App.showToast('Selecione a data'); if (dataEv) dataEv.focus(); return; }

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    var imagens = evImage || '';
    var data = {
      titulo: titulo.value.trim(),
      descricao: desc.value.trim(),
      data: dataEv.value,
      horario: horario ? horario.value : '',
      local: local ? local.value.trim() : '',
      imagens: imagens,
      telefone: tel ? tel.value.trim() : '',
      userId: App.auth && App.auth.isLoggedIn() ? App.auth.getCurrentUser().id : ''
    };

    var result;
    if (editingId) {
      data.id = editingId;
      result = await App.api.updateEvento(data);
    } else {
      result = await App.api.addEvento(data);
    }

    App.closeModal();
    editingId = null;
    btn.disabled = false;
    btn.textContent = 'Criar Evento';
    App.showToast(result.error ? 'Erro: ' + result.error : (editingId ? 'Evento atualizado!' : 'Evento criado!'));
    App.refreshData();
  }

  function showDetail(item) {
    var evDate = item.data ? formatDate(item.data) : 'Data a definir';
    var isPast = item.data ? isPastDate(item.data) : false;

    var adminActions = '';
    if (App.auth && App.auth.isLoggedIn() && App.auth.ownsItem(item)) {
      adminActions =
        '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px">' +
          '<button class="form-btn form-btn-secondary" id="editEventoBtn" style="flex:1">Editar</button>' +
          '<button class="form-btn" id="deleteEventoBtn" style="flex:1;background:#dc2626;color:#fff">Excluir</button>' +
        '</div>';
    }

    var imgsHtml = '';
    if (item.imagens) {
      var imgs = item.imagens.split('|');
      if (imgs.length > 0 && (imgs[0].startsWith('data:') || imgs[0].startsWith('http')))
        imgsHtml = '<img class="detail-image detail-image-cover" src="' + escapeHtml(imgs[0]) + '" alt="' + escapeHtml(item.titulo) + '" style="max-height:240px;width:100%;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:12px">';
    }

    App.showModal(item.titulo,
      imgsHtml +
      '<div class="evento-detail-header">' +
        '<div class="evento-detail-date">' +
          '<span class="material-icons-round" style="font-size:48px;color:var(--primary)">event</span>' +
          '<div style="font-size:24px;font-weight:800;color:var(--primary)">' + evDate + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="detail-info">' +
        '<div class="detail-info-row"><span class="material-icons-round">description</span> ' + escapeHtml(item.descricao || 'Sem descrição') + '</div>' +
        (item.horario ? '<div class="detail-info-row"><span class="material-icons-round">schedule</span> ' + escapeHtml(formatTime(item.horario)) + '</div>' : '') +
        (item.local ? '<div class="detail-info-row"><span class="material-icons-round">location_on</span> ' + escapeHtml(item.local) + '</div>' : '') +
        (item.telefone ? '<div class="detail-info-row"><span class="material-icons-round">phone</span> ' + escapeHtml(item.telefone) + '</div>' : '') +
      '</div>' +
      adminActions
    );

    var editBtn = document.getElementById('editEventoBtn');
    if (editBtn) editBtn.addEventListener('click', function() { App.closeModal(); editingId = item.id; showAddForm(item); });
    var deleteBtn = document.getElementById('deleteEventoBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', function() { App.closeModal(); confirmDelete(item); });
  }

  function confirmDelete(item) {
    App.showModal('Confirmar Exclusão',
      '<p style="margin-bottom:16px">Excluir evento "<strong>' + escapeHtml(item.titulo) + '</strong>"?</p>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="form-btn form-btn-secondary" id="cancelDelEvento" style="flex:1">Cancelar</button>' +
        '<button class="form-btn" id="confirmDelEvento" style="flex:1;background:#dc2626;color:#fff">Excluir</button>' +
      '</div>'
    );
    document.getElementById('cancelDelEvento').addEventListener('click', function() { App.closeModal(); });
    document.getElementById('confirmDelEvento').addEventListener('click', async function() {
      App.closeModal();
      var result = await App.api.deleteEvento(item.id);
      App.showToast(result.error ? 'Erro: ' + result.error : 'Evento excluído!');
      App.refreshData();
    });
  }

  function getMyItems(userId) {
    return data.filter(function(e) { return String(e.userId) === String(userId); });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function showDetailById(id) {
    for (var i = 0; i < data.length; i++) {
      if (String(data[i].id) === String(id)) { showDetail(data[i]); return; }
    }
  }

  return {
    init: init,
    render: render,
    showDetailById: showDetailById,
    getMyItems: getMyItems
  };
})();