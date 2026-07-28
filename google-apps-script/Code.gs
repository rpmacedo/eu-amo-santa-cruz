// -------------------------------------------------------
// BACKEND Eu amo Santa Cruz - Google Apps Script (v3 - Eventos com imagem)
// -------------------------------------------------------
// INSTRUCOES:
// 1. Crie uma planilha no Google Sheets com 5 abas:
//    - "Radios"      | id | nome | logoUrl | streamUrl | descricao | ativo
//    - "Classificados" | id | titulo | descricao | preco | imagens | contato | telefone | categoria | data | ativo | senha | userId
//    - "Profissionais" | id | nome | profissao | telefone | whatsapp | descricao | foto | bairro | cidade | data | ativo | senha | userId
//    - "Usuarios"    | id | nome | email | senha | telefone | created_at
//    - "Eventos"     | id | titulo | descricao | data | horario | local | imagens | telefone | userId | ativo
// 2. Salve esta planilha e COPIE O ID DA URL (entre /d/ e /edit)
// 3. Cole o ID na variavel SHEET_ID abaixo
// 4. Va em "Implantar" > "Nova implantacao" > "Aplicativo web"
//    - Executar como: "Voce"
//    - Quem tem acesso: "Qualquer um"
// 5. Clique em "Implantar" e autorize
// 6. COPIE A URL gerada e cole no js/api.js do seu app
// 7. Se ja tinha abas existentes, adicione as colunas "userId" em Classificados e Profissionais,
//    e crie a aba "Usuarios" com as colunas acima
// -------------------------------------------------------

var SHEET_ID = '1gqdHfdnro-aLoIRfPGSwxYZe-_NH_J2STsVrWfKNw38'; // <-- COLE AQUI O ID DA SUA PLANILHA (deixe '' se for usar a planilha ativa)

var HEADERS = {
  Radios: ['id', 'nome', 'logoUrl', 'streamUrl', 'descricao', 'ativo'],
  Classificados: ['id', 'titulo', 'descricao', 'preco', 'imagens', 'contato', 'telefone', 'categoria', 'data', 'ativo', 'senha', 'userId'],
  Profissionais: ['id', 'nome', 'profissao', 'telefone', 'whatsapp', 'descricao', 'foto', 'bairro', 'cidade', 'data', 'ativo', 'senha', 'userId'],
  Usuarios: ['id', 'nome', 'email', 'senha', 'telefone', 'created_at'],
  Eventos: ['id', 'titulo', 'descricao', 'data', 'horario', 'local', 'imagens', 'telefone', 'userId', 'ativo']
};

function getSheet_(name) {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
    return sheet;
  }
  // Garante que todas as colunas do HEADERS existem (adiciona as que faltam)
  var expected = HEADERS[name];
  if (expected) {
    var lastHeader = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var existing = {};
    for (var h = 0; h < lastHeader.length; h++) {
      existing[String(lastHeader[h]).toLowerCase().trim()] = true;
    }
    var colIndex = lastHeader.length + 1;
    for (var e = 0; e < expected.length; e++) {
      if (!existing[expected[e].toLowerCase()]) {
        sheet.getRange(1, colIndex).setValue(expected[e]);
        colIndex++;
      }
    }
  }
  return sheet;
}

function doGet(e) {
  var action = e.parameter.action || '';
  var output = {};

  try {
    if (action === 'test') {
      output = { success: true, message: 'API funcionando!', sheets: verificarAbas_() };
    } else if (action === 'getRadios') {
      output = { success: true, data: readSheet_('Radios') };
    } else if (action === 'getClassificados') {
      output = { success: true, data: readSheet_('Classificados') };
    } else if (action === 'getProfissionais') {
      output = { success: true, data: readSheet_('Profissionais') };
    } else if (action === 'getEventos') {
      output = { success: true, data: readSheet_('Eventos') };
    } else {
      output = {
        success: true,
        message: 'API Eu amo Santa Cruz funcionando! Use ?action=...',
        endpoints: ['test', 'getRadios', 'getClassificados', 'getProfissionais', 'getEventos', 'registerUser', 'loginUser']
      };
    }
  } catch (err) {
    output = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(output, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var output = {};

  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var action = data.action || '';

    if (action === 'addClassificado') {
      data.data = new Date().toISOString().split('T')[0];
      data.id = 'C' + Date.now();
      data.ativo = 'Sim';
      addRow_('Classificados', data);
      output = { success: true, message: 'Classificado adicionado!', id: data.id };
    } else if (action === 'addProfissional') {
      data.data = new Date().toISOString().split('T')[0];
      data.id = 'P' + Date.now();
      data.ativo = 'Sim';
      addRow_('Profissionais', data);
      output = { success: true, message: 'Profissional cadastrado!', id: data.id };
    } else if (action === 'addEvento') {
      data.id = 'E' + Date.now();
      data.ativo = 'Sim';
      addRow_('Eventos', data);
      output = { success: true, message: 'Evento adicionado!', id: data.id };
    } else if (action === 'updateClassificado') {
      updateRow_('Classificados', data);
      output = { success: true, message: 'Classificado atualizado!' };
    } else if (action === 'updateProfissional') {
      updateRow_('Profissionais', data);
      output = { success: true, message: 'Profissional atualizado!' };
    } else if (action === 'deleteClassificado') {
      deleteRow_('Classificados', data.id);
      output = { success: true, message: 'Classificado excluido!' };
    } else if (action === 'deleteProfissional') {
      deleteRow_('Profissionais', data.id);
      output = { success: true, message: 'Profissional excluido!' };
    } else if (action === 'updateEvento') {
      updateRow_('Eventos', data);
      output = { success: true, message: 'Evento atualizado!' };
    } else if (action === 'deleteEvento') {
      deleteRow_('Eventos', data.id);
      output = { success: true, message: 'Evento excluido!' };
    } else if (action === 'registerUser') {
      output = registerUser_(data);
    } else if (action === 'loginUser') {
      output = loginUser_(data);
    } else {
      output = { success: false, error: 'Acao invalida: ' + action };
    }
  } catch (err) {
    output = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(output, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function verificarAbas_() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var resultado = {};
  ['Radios', 'Classificados', 'Profissionais', 'Usuarios', 'Eventos'].forEach(function(nome) {
    var sheet = ss.getSheetByName(nome);
    if (sheet) {
      resultado[nome] = { existe: true, linhas: sheet.getLastRow() - 1 };
    } else {
      resultado[nome] = { existe: false, linhas: 0 };
    }
  });
  return resultado;
}

function findRow_(sheet, field, value) {
  var range = sheet.getDataRange().getValues();
  for (var r = 1; r < range.length; r++) {
    if (String(range[r][0]).trim() === String(value).trim()) {
      return r + 1;
    }
  }
  return -1;
}

function readSheet_(sheetName) {
  var sheet = getSheet_(sheetName);
  var range = sheet.getDataRange().getValues();
  if (range.length < 2) return [];
  var actualHeaders = range[0];
  var expectedHeaders = HEADERS[sheetName];

  // Mapeia cada coluna da planilha para o nome esperado (ignora maiusculas/minusculas)
  var colMap = {};
  for (var a = 0; a < actualHeaders.length; a++) {
    var actualName = actualHeaders[a].toString().trim();
    var found = false;
    for (var e = 0; e < expectedHeaders.length; e++) {
      if (expectedHeaders[e].toLowerCase() === actualName.toLowerCase()) {
        colMap[a] = expectedHeaders[e];
        found = true;
        break;
      }
    }
    if (!found) {
      colMap[a] = actualName;
    }
  }

  var result = [];
  for (var r = 1; r < range.length; r++) {
    var row = range[r];
    if (row[0] === '' || row[0] === null) continue;
    var obj = {};
    for (var c = 0; c < actualHeaders.length; c++) {
      if (colMap[c]) {
        var val = row[c];
        if (val instanceof Date) {
          if (val.getFullYear() === 1899) {
            // Apenas horario (ex: 19:00)
            val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'HH:mm');
          } else {
            val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          }
        }
        if (val !== null && val !== undefined) obj[colMap[c]] = String(val);
        else obj[colMap[c]] = '';
      }
    }
    result.push(obj);
  }
  return result;
}

function getHeaderRow_(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
  return range[0] || [];
}

function addRow_(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaderRow_(sheet);
  var row = new Array(headers.length).fill('');
  for (var i = 0; i < headers.length; i++) {
    var headerName = String(headers[i]).trim();
    if (obj[headerName] !== undefined) row[i] = obj[headerName];
  }
  sheet.appendRow(row);
}

function updateRow_(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaderRow_(sheet);
  var rowNum = findRow_(sheet, 'id', obj.id);
  if (rowNum < 0) throw new Error('Registro nao encontrado: ' + obj.id);
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var headerName = String(headers[i]).trim();
    row.push(obj[headerName] !== undefined ? obj[headerName] : '');
  }
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
}

function deleteRow_(sheetName, id) {
  var sheet = getSheet_(sheetName);
  var rowNum = findRow_(sheet, 'id', id);
  if (rowNum < 0) throw new Error('Registro nao encontrado: ' + id);
  sheet.deleteRow(rowNum);
}

// -------------------------------------------------------
// AUTH - Usuarios
// -------------------------------------------------------

function findUserByEmail_(email) {
  var sheet = getSheet_('Usuarios');
  var range = sheet.getDataRange().getValues();
  for (var r = 1; r < range.length; r++) {
    if (String(range[r][2]).toLowerCase().trim() === String(email).toLowerCase().trim()) {
      return { row: r + 1, data: range[r] };
    }
  }
  return null;
}

function registerUser_(data) {
  var nome = (data.nome || '').trim();
  var email = (data.email || '').trim().toLowerCase();
  var senha = data.senha || '';
  var telefone = data.telefone || '';

  if (!nome) return { success: false, error: 'Nome obrigatorio' };
  if (!email) return { success: false, error: 'Email obrigatorio' };
  if (!senha || senha.length < 4) return { success: false, error: 'Senha deve ter pelo menos 4 caracteres' };

  var existing = findUserByEmail_(email);
  if (existing) return { success: false, error: 'Email ja cadastrado' };

  var user = {
    id: 'U' + Date.now(),
    nome: nome,
    email: email,
    senha: senha,
    telefone: telefone,
    created_at: new Date().toISOString().split('T')[0]
  };
  addRow_('Usuarios', user);

  return {
    success: true,
    message: 'Conta criada com sucesso!',
    user: { id: user.id, nome: user.nome, email: user.email, telefone: user.telefone }
  };
}

function loginUser_(data) {
  var email = (data.email || '').trim().toLowerCase();
  var senha = data.senha || '';

  if (!email) return { success: false, error: 'Email obrigatorio' };
  if (!senha) return { success: false, error: 'Senha obrigatoria' };

  var found = findUserByEmail_(email);
  if (!found) return { success: false, error: 'Email nao encontrado' };

  // found.data[2] = email, found.data[3] = senha
  if (String(found.data[3]) !== senha) return { success: false, error: 'Senha incorreta' };

  return {
    success: true,
    message: 'Login realizado!',
    user: {
      id: found.data[0],
      nome: found.data[1],
      email: found.data[2],
      telefone: found.data[4]
    }
  };
}
