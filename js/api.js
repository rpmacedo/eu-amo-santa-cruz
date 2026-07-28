// Config salva no navegador (localStorage)
var CONFIG = carregarConfig();

function carregarConfig() {
  var padrao = { apiUrl: '', useDemoData: true, adminSenha: '', userToken: '' };
  try {
    var salvo = localStorage.getItem('santacruz_config');
    if (salvo) {
      var obj = JSON.parse(salvo);
      padrao.apiUrl = obj.apiUrl || '';
      padrao.useDemoData = obj.useDemoData !== false;
      padrao.adminSenha = obj.adminSenha || '';
      padrao.userToken = obj.userToken || '';
    }
  } catch (e) {}
  return padrao;
}

function salvarConfig() {
  try {
    localStorage.setItem('santacruz_config', JSON.stringify({
      apiUrl: CONFIG.apiUrl,
      useDemoData: CONFIG.useDemoData,
      adminSenha: CONFIG.adminSenha,
      userToken: CONFIG.userToken || ''
    }));
  } catch (e) {}
}

var DEMO = {
  radios: [
    { id: 'R1', nome: 'Radio Mix FM', logoUrl: '', streamUrl: 'https://streaming.mixfm.com.br/mixfm', descricao: 'A radio que toca o que voce gosta', ativo: 'Sim' },
    { id: 'R2', nome: 'Radio Transamerica', logoUrl: '', streamUrl: 'https://streaming.transamerica.com.br/transamerica', descricao: 'Hits e musicas internacionais', ativo: 'Sim' },
    { id: 'R3', nome: 'Radio Jovem Pan', logoUrl: '', streamUrl: 'https://streaming.jovempan.com.br/jovempan', descricao: 'Informacao e entretenimento', ativo: 'Sim' },
    { id: 'R4', nome: 'Radio Globo', logoUrl: '', streamUrl: 'https://streaming.globo.com.br/globo', descricao: 'A radio do Brasil', ativo: 'Sim' }
  ],
  classificados: [
    { id: 'C1', titulo: 'Celular Samsung Galaxy S23', descricao: 'Celular seminovo, otimo estado, acompanha carregador e capa', preco: '2500', imagens: '', contato: 'Carlos', telefone: '(81) 99999-0001', categoria: 'Eletronicos', data: '2026-07-20', ativo: 'Sim', senha: '' },
    { id: 'C2', titulo: 'Sofa 3 lugares', descricao: 'Sofa confortavel, pouco usado, tecido impermeavel', preco: '1200', imagens: '', contato: 'Maria', telefone: '(81) 99999-0002', categoria: 'Casa e Jardim', data: '2026-07-19', ativo: 'Sim', senha: '' },
    { id: 'C3', titulo: 'Fiat Uno 2015', descricao: 'Carro bem conservado, revisao em dia, vidro eletrico', preco: '18000', imagens: '', contato: 'Joao', telefone: '(81) 99999-0003', categoria: 'Veiculos', data: '2026-07-18', ativo: 'Sim', senha: '' }
  ],
  profissionais: [
    { id: 'P1', nome: 'Joao Silva', profissao: 'Eletricista', telefone: '(81) 99999-0010', whatsapp: 'Sim', descricao: 'Instalacoes e reparos eletricos em geral', foto: '', bairro: 'Centro', cidade: 'Santa Cruz do Capibaribe', data: '2026-07-20', ativo: 'Sim', senha: '' },
    { id: 'P2', nome: 'Pedro Santos', profissao: 'Pedreiro', telefone: '(81) 99999-0011', whatsapp: 'Sim', descricao: 'Construcao e reformas, acabamento de qualidade', foto: '', bairro: 'Sao Miguel', cidade: 'Santa Cruz do Capibaribe', data: '2026-07-19', ativo: 'Sim', senha: '' },
    { id: 'P3', nome: 'Maria Oliveira', profissao: 'Diarista', telefone: '(81) 99999-0012', whatsapp: 'Sim', descricao: 'Limpeza e organizacao residencial, horario flexivel', foto: '', bairro: 'Bairro Novo', cidade: 'Santa Cruz do Capibaribe', data: '2026-07-18', ativo: 'Sim', senha: '' },
    { id: 'P4', nome: 'Carlos Freitas', profissao: 'Frete e Mudancas', telefone: '(81) 99999-0013', whatsapp: 'Sim', descricao: 'Fretes e mudancas em geral, carro fechado', foto: '', bairro: 'Centro', cidade: 'Santa Cruz do Capibaribe', data: '2026-07-17', ativo: 'Sim', senha: '' }
  ]
};

var App = window.App || {};
App.apiInfo = { mode: 'demo', lastError: '', apiUrl: '' };

App.api = {
  isDemoMode: function() { return CONFIG.useDemoData; },

  getMode: function() {
    if (CONFIG.useDemoData) return 'demo';
    if (!CONFIG.apiUrl) return 'no-url';
    return 'api';
  },

  async testConnection() {
    if (CONFIG.useDemoData) return { success: false, message: 'Modo demo - configure abaixo' };
    if (!CONFIG.apiUrl) return { success: false, message: 'Cole a URL da API primeiro' };
    try {
      var resp = await fetch(CONFIG.apiUrl + '?action=test', { method: 'GET' });
      if (!resp.ok) return { success: false, message: 'HTTP ' + resp.status + ' - URL pode estar errada' };
      var text = await resp.text();
      App.apiInfo.lastResponse = text.substring(0, 1000);
      var json = JSON.parse(text);
      if (json.success) {
        App.apiInfo.mode = 'api';
        var info = '';
        if (json.sheets) {
          for (var nome in json.sheets) {
            info += nome + ': ' + json.sheets[nome].linhas + ' itens, ';
          }
        }
        return { success: true, message: 'API funcionando! ' + info };
      }
      return { success: false, message: 'Erro na API: ' + (json.error || 'resposta inesperada'), detail: text.substring(0, 500) };
    } catch (e) {
      return { success: false, message: 'Falha: ' + e.message + '. Verifique: 1) URL correta 2) Script implantado 3) Acesso "Qualquer um"' };
    }
  },

  async fetchData(endpoint) {
    console.log('fetchData:', { endpoint, useDemoData: CONFIG.useDemoData, apiUrl: CONFIG.apiUrl, protocol: location.protocol });
    if (CONFIG.useDemoData) { console.log('fetchData: demo mode'); return { demo: true, data: null }; }
    if (!CONFIG.apiUrl) { console.log('fetchData: no URL'); return { demo: true, data: null }; }
    try {
      var controller = new AbortController();
      var timeout = setTimeout(function() { controller.abort(); }, 15000);
      var resp = await fetch(CONFIG.apiUrl + '?action=' + endpoint, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      var text = await resp.text();
      App.apiInfo.lastResponse = text.substring(0, 300);
      var json = JSON.parse(text);
      if (json.success && json.data) {
        App.apiInfo.mode = 'api';
        return { demo: false, data: json.data };
      }
      App.apiInfo.lastError = 'API: ' + text.substring(0, 200);
      return { demo: true, data: null };
    } catch (e) {
      App.apiInfo.lastError = endpoint + ': ' + e.message;
      return { demo: true, data: null };
    }
  },

  async sendData(endpoint, payload) {
    console.log('sendData:', { endpoint, useDemoData: CONFIG.useDemoData, apiUrl: CONFIG.apiUrl, protocol: location.protocol });
    if (CONFIG.useDemoData) { console.log('sendData: demo mode - skipping'); return { demo: true, success: true }; }
    if (!CONFIG.apiUrl) { console.log('sendData: no apiUrl - skipping'); return { demo: true, success: true }; }
    try {
      payload.action = endpoint;
      var controller = new AbortController();
      var timeout = setTimeout(function() { controller.abort(); }, 15000);
      console.log('sendData: fetching POST', CONFIG.apiUrl);
      var resp = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      console.log('sendData: response status', resp.status);
      if (!resp.ok) {
        App.apiInfo.lastError = endpoint + ': HTTP ' + resp.status;
        return { demo: true, success: true, error: 'HTTP ' + resp.status };
      }
      var text = await resp.text();
      console.log('sendData: response body', text.substring(0, 300));
      var json = JSON.parse(text);
      if (!json.success) {
        App.apiInfo.lastError = endpoint + ': ' + (json.error || 'resposta inesperada');
        return { demo: true, success: true, error: json.error || 'erro desconhecido' };
      }
      console.log('sendData: SUCCESS');
      return { demo: false, success: true };
    } catch (e) {
      console.log('sendData: CATCH error', e.message);
      App.apiInfo.lastError = endpoint + ': ' + e.message;
      return { demo: true, success: true, error: e.message };
    }
  },

  async getRadios() {
    var result = await this.fetchData('getRadios');
    if (result.demo || !result.data || result.data.length === 0) return DEMO.radios.filter(function(r) { return r.ativo === 'Sim'; });
    return result.data;
  },

  async getClassificados() {
    var result = await this.fetchData('getClassificados');
    if (result.demo || !result.data || result.data.length === 0) return DEMO.classificados.filter(function(c) { return c.ativo === 'Sim'; });
    return result.data;
  },

  async getProfissionais() {
    var result = await this.fetchData('getProfissionais');
    if (result.demo || !result.data || result.data.length === 0) return DEMO.profissionais.filter(function(p) { return p.ativo === 'Sim'; });
    return result.data;
  },

  async addClassificado(data) {
    data.id = 'C' + Date.now();
    data.data = new Date().toISOString().split('T')[0];
    data.ativo = 'Sim';
    data.senha = data.senha || '';
    var result = await this.sendData('addClassificado', data);
    DEMO.classificados.unshift(data);
    return { success: true, demo: result.demo, error: result.error };
  },

  async addProfissional(data) {
    data.id = 'P' + Date.now();
    data.data = new Date().toISOString().split('T')[0];
    data.ativo = 'Sim';
    data.senha = data.senha || '';
    var result = await this.sendData('addProfissional', data);
    DEMO.profissionais.unshift(data);
    return { success: true, demo: result.demo, error: result.error };
  },

  async updateClassificado(data) {
    var result = await this.sendData('updateClassificado', data);
    var idx = DEMO.classificados.findIndex(function(c) { return c.id === data.id; });
    if (idx >= 0) DEMO.classificados[idx] = data;
    return { success: true, demo: result.demo, error: result.error };
  },

  async updateProfissional(data) {
    var result = await this.sendData('updateProfissional', data);
    var idx = DEMO.profissionais.findIndex(function(p) { return p.id === data.id; });
    if (idx >= 0) DEMO.profissionais[idx] = data;
    return { success: true, demo: result.demo, error: result.error };
  },

  async deleteClassificado(id) {
    var result = await this.sendData('deleteClassificado', { id: id, action: 'deleteClassificado' });
    DEMO.classificados = DEMO.classificados.filter(function(c) { return c.id !== id; });
    return { success: true, demo: result.demo, error: result.error };
  },

  async deleteProfissional(id) {
    var result = await this.sendData('deleteProfissional', { id: id, action: 'deleteProfissional' });
    DEMO.profissionais = DEMO.profissionais.filter(function(p) { return p.id !== id; });
    return { success: true, demo: result.demo, error: result.error };
  },

  async registerUser(userData) {
    try {
      if (!CONFIG.useDemoData && CONFIG.apiUrl) {
        var result = await this.sendData('registerUser', userData);
        if (result.success && !result.demo) return result;
      }
      return { demo: true, success: true };
    } catch (e) { return { demo: true, success: true, error: e.message }; }
  },

  async loginUser(credentials) {
    try {
      if (!CONFIG.useDemoData && CONFIG.apiUrl) {
        var resp = await fetch(CONFIG.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'loginUser', email: credentials.email, senha: credentials.senha })
        });
        var json = await resp.json();
        if (json.success && json.user) return { success: true, user: json.user, demo: false };
      }
      return { demo: true, success: false };
    } catch (e) { return { demo: true, success: false, error: e.message }; }
  }
};
