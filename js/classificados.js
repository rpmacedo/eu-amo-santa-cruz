App.classificados = (function() {
  var data = [];
  var currentFilter = '';

  function parseImages(str) {
    if (!str) return [];
    str = String(str).trim();
    if (!str) return [];
    if (str.indexOf('|') > -1) {
      var parts = str.split('|');
      var result = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.startsWith('data:') || p.startsWith('http')) result.push(p);
      }
      return result;
    }
    if (str.startsWith('data:')) return [str];
    var parts = str.split(',');
    var result = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (p.startsWith('data:') || p.startsWith('http')) result.push(p);
    }
    return result;
  }

  function compressImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var maxW = 400, maxH = 400;
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
    var fab = document.getElementById('fabClassif');
    if (fab) fab.addEventListener('click', showAddForm);

    var filterSelect = document.getElementById('classifCategoryFilter');
    if (filterSelect) filterSelect.addEventListener('change', function() {
      currentFilter = this.value;
      render(data);
    });

    var filterBtn = document.getElementById('filterClassifBtn');
    if (filterBtn) filterBtn.addEventListener('click', function() {
      var bar = document.getElementById('classifFilterBar');
      if (bar) bar.classList.toggle('hidden');
    });

    var myBtn = document.getElementById('myClassifBtn');
    if (myBtn) myBtn.addEventListener('click', showMyClassif);
  }

  function toCurrency(val) {
    if (!val) return '';
    var s = String(val).replace(/[R$\s]/g, '').replace(/\./g, '');
    var num = parseFloat(s.replace(',', '.'));
    if (isNaN(num) || num <= 0) return val;
    return 'R$ ' + Math.round(num).toLocaleString('pt-BR') + ',00';
  }

  function formatPrice(val) {
    if (!val) return 'Grátis';
    return toCurrency(val);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (!isNaN(d)) {
      return String(d.getDate()).padStart(2, '0') + '/' +
             String(d.getMonth() + 1).padStart(2, '0') + '/' +
             d.getFullYear();
    }
    return dateStr;
  }

  function render(items) {
    data = items || [];
    var grid = document.getElementById('classifGrid');
    if (!grid) return;

    var filtered = data;
    if (currentFilter) {
      filtered = data.filter(function(c) {
        return (c.categoria || '').toLowerCase() === currentFilter.toLowerCase();
      });
    }

    if (!filtered || filtered.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<span class="material-icons-round">sell</span>' +
          '<h3>Nenhum anúncio encontrado</h3>' +
          '<p>' + (currentFilter ? 'Nada nesta categoria' : 'Seja o primeiro a anunciar!') + '</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      var imgHtml = '';
      var extraCount = 0;
      if (c.imagens) {
        var imgs = parseImages(c.imagens);
        if (imgs.length > 0) {
          imgHtml = '<div class="classif-img-wrap">';
          imgHtml += '<img class="classif-image" src="' + escapeHtml(imgs[0]) + '" alt="' + escapeHtml(c.titulo) + '" loading="lazy">';
          if (imgs.length > 1) {
            imgHtml += '<span class="img-count-badge"><span class="material-icons-round" style="font-size:14px">collections</span> ' + imgs.length + '</span>';
          }
          imgHtml += '</div>';
        }
      }
      if (!imgHtml) {
        imgHtml = '<div class="classif-image-placeholder"><span class="material-icons-round">image</span></div>';
      }

      var isSold = c.ativo === 'Vendido';
      html +=
        '<div class="classif-card' + (isSold ? ' classif-sold' : '') + '" data-id="' + c.id + '">' +
          (isSold ? '<div class="sold-overlay">VENDIDO</div>' : '') +
          imgHtml +
          '<div class="classif-body">' +
            (isSold ? '<div class="sold-tag">VENDIDO</div>' : '') +
            '<div class="classif-title">' + escapeHtml(c.titulo) + '</div>' +
            '<div class="classif-price">' + formatPrice(c.preco) + '</div>' +
            '<div class="classif-desc">' + escapeHtml(c.descricao || '') + '</div>' +
            '<div class="classif-meta">' +
              '<span class="classif-category">' + escapeHtml(c.categoria || 'Geral') + '</span>' +
              '<span>' + formatDate(c.data) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.classif-card').forEach(function(card) {
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

  function showAddForm(editItem) {
    if (!App.auth || !App.auth.isLoggedIn()) {
      App.auth.showLoginForm();
      return;
    }
    var isEdit = !!editItem;
    App.showModal(isEdit ? 'Editar Anúncio' : 'Novo Anúncio', 
      '<form id="formClassif" onsubmit="return false">' +
        '<div class="form-group">' +
          '<label class="form-label">Título</label>' +
          '<input type="text" class="form-input" id="fTitulo" placeholder="Ex: Celular Samsung S23" value="' + (editItem ? escapeHtml(editItem.titulo) : '') + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Descrição</label>' +
          '<textarea class="form-textarea" id="fDescricao" placeholder="Descreva o produto ou serviço..." required>' + (editItem ? escapeHtml(editItem.descricao) : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Preço</label>' +
          '<input type="text" class="form-input" id="fPreco" placeholder="R$ 0,00" value="' + (editItem ? toCurrency(editItem.preco) : '') + '" inputmode="decimal">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Categoria</label>' +
          '<select class="form-select" id="fCategoria">' +
            '<option value="">Selecione...</option>' +
            '<option value="Veículos">Veículos</option>' +
            '<option value="Imóveis">Imóveis</option>' +
            '<option value="Eletrônicos">Eletrônicos</option>' +
            '<option value="Moda e Beleza">Moda e Beleza</option>' +
            '<option value="Casa e Jardim">Casa e Jardim</option>' +
            '<option value="Esportes">Esportes</option>' +
            '<option value="Serviços">Serviços</option>' +
            '<option value="Outros">Outros</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Fotos <span class="form-hint">máx. 6 | clique na estrela para escolher a capa</span></label>' +
          '<div class="image-upload-area" id="imageUploadArea">' +
            '<span class="material-icons-round">add_photo_alternate</span>' +
            '<p>Toque para adicionar fotos</p>' +
          '</div>' +
          '<input type="file" id="fImagens" accept="image/*" multiple style="display:none">' +
          '<div class="image-preview" id="imagePreview"></div>' +
          '<div class="image-preview-url">' +
            '<input type="url" class="form-input" id="fUrlImagem" placeholder="Ou cole URL da imagem">' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Seu nome</label>' +
          '<input type="text" class="form-input" id="fContato" placeholder="Seu nome" value="' + (editItem ? escapeHtml(editItem.contato) : '') + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Telefone / WhatsApp</label>' +
          '<input type="tel" class="form-input" id="fTelefone" placeholder="(81) 99999-0000" value="' + (editItem ? escapeHtml(editItem.telefone) : '') + '" required>' +
        '</div>' +

        '<button type="submit" class="form-btn form-btn-primary" id="btnSubmitClassif">' + (isEdit ? 'Salvar Alterações' : 'Publicar Anúncio') + '</button>' +
      '</form>'
    );

    var images = [];
    var coverIndex = 0;
    var uploadArea = document.getElementById('imageUploadArea');
    var fileInput = document.getElementById('fImagens');
    var preview = document.getElementById('imagePreview');
    var urlInput = document.getElementById('fUrlImagem');

    function renderThumbnails() {
      preview.innerHTML = '';
      for (var i = 0; i < images.length; i++) {
        var wrap = document.createElement('div');
        wrap.className = 'img-thumb-wrap';
        var img = document.createElement('img');
        img.className = 'img-thumb';
        img.src = images[i];
        wrap.appendChild(img);
        var star = document.createElement('button');
        star.type = 'button';
        star.className = 'img-cover-btn' + (i === coverIndex ? ' active' : '');
        star.innerHTML = '<span class="material-icons-round">' + (i === coverIndex ? 'star' : 'star_border') + '</span>';
        star.title = 'Definir como capa';
        (function(idx) {
          star.addEventListener('click', function(e) {
            e.stopPropagation();
            coverIndex = idx;
            renderThumbnails();
          });
        })(i);
        wrap.appendChild(star);
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'img-remove-btn';
        remove.innerHTML = '<span class="material-icons-round">close</span>';
        (function(idx) {
          remove.addEventListener('click', function(e) {
            e.stopPropagation();
            images.splice(idx, 1);
            if (coverIndex >= images.length) coverIndex = images.length - 1;
            if (coverIndex < 0) coverIndex = 0;
            renderThumbnails();
          });
        })(i);
        wrap.appendChild(remove);
        preview.appendChild(wrap);
      }
    }

    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function() {
        var remaining = 6 - images.length;
        if (remaining <= 0) {
          App.showToast('Máximo de 6 fotos atingido');
          return;
        }
        var toProcess = Math.min(this.files.length, remaining);
        var processed = 0;
        for (var i = 0; i < toProcess; i++) {
          compressImage(this.files[i], function(compressed) {
            images.push(compressed);
            processed++;
            if (processed >= toProcess) renderThumbnails();
            else if (processed === 1) renderThumbnails();
          });
        }
        if (toProcess > 0) renderThumbnails();
      });
    }

    if (urlInput) {
      urlInput.addEventListener('change', function() {
        if (this.value && images.length < 6) {
          images.push(this.value);
          renderThumbnails();
          this.value = '';
        } else if (images.length >= 6) {
          App.showToast('Máximo de 6 fotos atingido');
        }
      });
    }

    var precoInput = document.getElementById('fPreco');
    if (precoInput) {
      precoInput.addEventListener('input', function() {
        var val = this.value.replace(/\D/g, '');
        this.value = val ? parseInt(val, 10).toLocaleString('pt-BR') : '';
      });
      precoInput.addEventListener('focus', function() { this.select(); });
    }

    var btnSubmit = document.getElementById('btnSubmitClassif');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', submitForm);
    }
  }

  var editingId = null;

  async function submitForm() {
    var titulo = document.getElementById('fTitulo');
    var descricao = document.getElementById('fDescricao');
    var preco = document.getElementById('fPreco');
    var categoria = document.getElementById('fCategoria');
    var contato = document.getElementById('fContato');
    var telefone = document.getElementById('fTelefone');
    var urlInput = document.getElementById('fUrlImagem');

    if (!titulo || !titulo.value.trim()) {
      App.showToast('Digite o título do anúncio');
      titulo.focus();
      return;
    }
    if (!contato || !contato.value.trim()) {
      App.showToast('Digite seu nome');
      contato.focus();
      return;
    }
    if (!telefone || !telefone.value.trim()) {
      App.showToast('Digite seu telefone');
      telefone.focus();
      return;
    }

    var preview = document.getElementById('imagePreview');
    var images = [];
    var coverIndex = 0;
    if (preview) {
      var wraps = preview.querySelectorAll('.img-thumb-wrap');
      for (var gi = 0; gi < wraps.length; gi++) {
        var imgEl = wraps[gi].querySelector('img');
        if (imgEl) images.push(imgEl.src);
        if (wraps[gi].querySelector('.img-cover-btn.active')) coverIndex = gi;
      }
    }
    if (urlInput && urlInput.value && images.indexOf(urlInput.value) === -1) {
      images.push(urlInput.value);
    }
    if (coverIndex > 0 && images.length > 1) {
      var cover = images.splice(coverIndex, 1)[0];
      images.unshift(cover);
    }

    var data = {
      titulo: titulo.value.trim(),
      descricao: descricao ? descricao.value.trim() : '',
      preco: preco ? String(Math.round(parseFloat(preco.value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0)) : '',
      categoria: categoria ? categoria.value : 'Outros',
      imagens: images.join('|'),
      contato: contato.value.trim(),
      telefone: telefone.value.trim(),
      userId: App.auth && App.auth.isLoggedIn() ? App.auth.getCurrentUser().id : ''
    };

    var btn = document.getElementById('btnSubmitClassif');
    if (btn) {
      btn.disabled = true;
      btn.textContent = editingId ? 'Salvando...' : 'Publicando...';
    }

    var result;
    if (editingId) {
      data.id = editingId;
      result = await App.api.updateClassificado(data);
    } else {
      result = await App.api.addClassificado(data);
    }

    App.closeModal();
    editingId = null;
    if (btn) { btn.disabled = false; btn.textContent = 'Publicar Anúncio'; }
    App.showToast(result.error ? 'Erro: ' + result.error : (editingId ? 'Anúncio atualizado!' : 'Anúncio publicado!'));
    App.refreshData();
  }

  function showDetail(item) {
    var imgsHtml = '';
    if (item.imagens) {
      var imgs = parseImages(item.imagens);
      if (imgs.length > 0) {
        imgsHtml = '<div class="detail-gallery">';
        for (var gi = 0; gi < imgs.length; gi++) {
          imgsHtml += '<img class="detail-image' + (gi === 0 ? ' detail-image-cover' : '') + '" src="' + escapeHtml(imgs[gi]) + '" alt="' + escapeHtml(item.titulo) + '">';
        }
        imgsHtml += '</div>';
      }
    }
    if (!imgsHtml) {
      imgsHtml = '<div class="detail-image" style="background:var(--bg);display:flex;align-items:center;justify-content:center;color:var(--text-secondary)"><span class="material-icons-round" style="font-size:48px">image</span></div>';
    }

    var whatsLink = 'https://wa.me/55' + String(item.telefone).replace(/\D/g, '');
    var telLink = 'tel:' + String(item.telefone).replace(/\D/g, '');
    var isSold = item.ativo === 'Vendido';
    var statusBadge = isSold ? '<div class="sold-badge">VENDIDO</div>' : '';

    App.showModal(item.titulo,
      imgsHtml +
      statusBadge +
      '<div class="detail-title">' + escapeHtml(item.titulo) + '</div>' +
      '<div class="detail-price">' + formatPrice(item.preco) + '</div>' +
      '<div class="detail-desc">' + escapeHtml(item.descricao || 'Sem descrição') + '</div>' +
      '<div class="detail-info">' +
        '<div class="detail-info-row"><span class="material-icons-round">category</span> ' + escapeHtml(item.categoria || 'Geral') + '</div>' +
        '<div class="detail-info-row"><span class="material-icons-round">person</span> ' + escapeHtml(item.contato || 'Anônimo') + '</div>' +
        '<div class="detail-info-row"><span class="material-icons-round">calendar_today</span> ' + formatDate(item.data) + '</div>' +
      '</div>' +
      '<div class="detail-actions">' +
        '<a href="' + whatsLink + '" target="_blank" class="form-btn form-btn-primary" style="flex:1;text-align:center;text-decoration:none;padding:12px;border-radius:8px;background:#25D366;color:#fff;font-weight:600">Falar no WhatsApp</a>' +
        '<a href="' + telLink + '" class="form-btn form-btn-secondary" style="flex:1;text-align:center;text-decoration:none;padding:12px;border-radius:8px;font-weight:600">Ligar</a>' +
      '</div>' +
      '<div class="admin-actions" style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="form-btn form-btn-secondary" id="btnEditClassif" style="flex:1"><span class="material-icons-round" style="font-size:16px">edit</span> Editar</button>' +
        (!isSold ? '<button class="form-btn" id="btnSoldClassif" style="flex:1;background:#f59e0b;color:#fff"><span class="material-icons-round" style="font-size:16px">check_circle</span> Marcar como Vendido</button>' : '') +
        '<button class="form-btn" id="btnDeleteClassif" style="flex:1;background:#dc2626;color:#fff"><span class="material-icons-round" style="font-size:16px">delete</span> Excluir</button>' +
      '</div>'
    );

    document.getElementById('btnEditClassif').addEventListener('click', function() { verificarSenhaE(item, 'edit'); });
    var btnSold = document.getElementById('btnSoldClassif');
    if (btnSold) btnSold.addEventListener('click', function() { verificarSenhaE(item, 'sold'); });
    document.getElementById('btnDeleteClassif').addEventListener('click', function() { verificarSenhaE(item, 'delete'); });
  }

  function verificarSenhaE(item, acao) {
    if (App.auth && App.auth.isLoggedIn() && App.auth.ownsItem(item)) {
      executarAcao(acao, item);
      return;
    }
    App.showModal('Confirme sua senha',
      '<div class="form-group">' +
        '<label class="form-label">Digite a senha de administrador</label>' +
        '<input type="password" class="form-input" id="fConfirmaSenha" placeholder="Senha administrativa">' +
      '</div>' +
      '<button class="form-btn form-btn-primary" id="btnConfirmaSenha">Confirmar</button>'
    );
    document.getElementById('btnConfirmaSenha').addEventListener('click', function() {
      var senha = document.getElementById('fConfirmaSenha').value;
      var adminSenha = CONFIG.adminSenha || '';
      if (adminSenha && senha === adminSenha) {
        App.closeModal();
        executarAcao(acao, item);
      } else {
        App.showToast('Senha incorreta!');
      }
    });
  }

  function executarAcao(acao, item) {
    App.closeModal();
    if (acao === 'edit') {
      editarClassificado(item);
    } else if (acao === 'sold') {
      marcarVendido(item);
    } else if (acao === 'delete') {
      confirmarExclusao(item);
    }
  }

  function editarClassificado(item) {
    editingId = item.id;
    showAddForm(item);
    if (item.imagens) {
      var imgs = parseImages(item.imagens);
      if (imgs.length > 0) {
        var preview = document.getElementById('imagePreview');
        var images = [];
        imgs.forEach(function(src, idx) {
          images.push(src);
          var wrap = document.createElement('div');
          wrap.className = 'img-thumb-wrap';
          var img = document.createElement('img');
          img.className = 'img-thumb';
          img.src = src;
          wrap.appendChild(img);
          var star = document.createElement('button');
          star.type = 'button';
          star.className = 'img-cover-btn' + (idx === 0 ? ' active' : '');
          star.innerHTML = '<span class="material-icons-round">' + (idx === 0 ? 'star' : 'star_border') + '</span>';
          (function(i) { star.addEventListener('click', function(e) { e.stopPropagation(); }); })(idx);
          wrap.appendChild(star);
          preview.appendChild(wrap);
        });
      }
    }
  }

  async function marcarVendido(item) {
    item.ativo = 'Vendido';
    var result = await App.api.updateClassificado(item);
    App.showToast(result.error ? 'Erro: ' + result.error : 'Marcado como vendido!');
    App.refreshData();
  }

  function confirmarExclusao(item) {
    App.showModal('Confirmar exclusão',
      '<p style="margin-bottom:16px">Tem certeza que deseja excluir "<strong>' + escapeHtml(item.titulo) + '</strong>"?</p>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="form-btn form-btn-secondary" id="btnCancelarExcluir" style="flex:1">Cancelar</button>' +
        '<button class="form-btn" id="btnConfirmarExcluir" style="flex:1;background:#dc2626;color:#fff">Excluir</button>' +
      '</div>'
    );
    document.getElementById('btnCancelarExcluir').addEventListener('click', function() { App.closeModal(); });
    document.getElementById('btnConfirmarExcluir').addEventListener('click', async function() {
      App.closeModal();
      await App.api.deleteClassificado(item.id);
      App.showToast('Anúncio excluído!');
      App.refreshData();
    });
  }

  function showMyClassif() {
    if (!App.auth || !App.auth.isLoggedIn()) {
      App.auth.showLoginForm();
      return;
    }
    var userId = App.auth.getCurrentUser().id;
    var mine = getMyItems(userId);
    if (mine.length === 0) {
      App.showToast('Você ainda não publicou nenhum anúncio');
      return;
    }
    currentFilter = '';
    render(mine);
    App.showToast('Mostrando ' + mine.length + ' anúncio(s)');
  }

  function getMyItems(userId) {
    return data.filter(function(c) { return String(c.userId) === String(userId); });
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
    showMyClassif: showMyClassif,
    showDetailById: showDetailById,
    getMyItems: getMyItems
  };
})();
