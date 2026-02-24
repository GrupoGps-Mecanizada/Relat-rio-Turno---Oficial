// ============================================
// BACKEND - SISTEMA DE RELATÓRIO DE TURNO
// Google Apps Script - Deploy as Web App
// ============================================

/**
 * INSTRUÇÕES:
 * 1. Cole este código no arquivo Code.gs
 * 2. Execute setupSheets() UMA VEZ
 * 3. Deploy > Nova implantação > Web App > Acesso: Qualquer pessoa (Anyone)
 */

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

const ACCESS_LEVELS = {
  SUPERVISOR: 'supervisor',
  GESTAO: 'gestao'
};

// ============================================
// ROTAS (API)
// ============================================
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'login':
        return handleLogin(e);
      case 'getEquipamentos':
        return getEquipamentos(e);
      case 'getColaboradores':
        return getColaboradores(e); // Essencial para o Autocomplete
      case 'getVagas':
        return getVagas();
      case 'getRelatorios':
        return getRelatorios(e);
      case 'getDashboard':
        return getDashboard(e); // Essencial para os Gráficos
      default:
        return responseJSON({ success: false, error: 'Ação inválida' });
    }
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      data = e.parameter;
    }
    
    if (data.action === 'saveRelatorio') {
      return saveRelatorio(data);
    }
    
    return responseJSON({ success: false, error: 'Ação inválida' });
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ============================================
// LÓGICA DE NEGÓCIO
// ============================================

function handleLogin(e) {
  const username = e.parameter.username;
  const password = e.parameter.password;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Supervisores');
  
  if (!sheet) return responseJSON({ success: false, error: 'Planilha não configurada' });
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().toUpperCase() === username.toUpperCase() && 
        data[i][2].toString() === password &&
        data[i][5] === 'SIM') {
      return responseJSON({ 
        success: true, 
        supervisor: {
          id: data[i][0],
          nome: data[i][1],
          accessLevel: data[i][6] || 'supervisor',
          letraTurno: data[i][7] || ''
        }
      });
    }
  }
  return responseJSON({ success: false, error: 'Dados incorretos' });
}

function getEquipamentos(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Equipamentos');
  const data = sheet.getDataRange().getValues();
  const lista = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === 'ATIVO') {
      lista.push({ placa: data[i][1], tipo: data[i][2] });
    }
  }
  return responseJSON({ success: true, equipamentos: lista });
}

function getColaboradores(e) {
  const supervisor = e.parameter.supervisor;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Colaboradores');
  const data = sheet.getDataRange().getValues();
  const lista = [];
  
  for (let i = 1; i < data.length; i++) {
    // Filtra pelo supervisor E se está ativo
    if (data[i][3].toString().toUpperCase() === supervisor.toUpperCase() && data[i][5] === 'ATIVO') {
      lista.push({
        id: data[i][0],
        nome: data[i][1],
        funcao: data[i][2],
        regime: data[i][4]
      });
    }
  }
  return responseJSON({ success: true, colaboradores: lista });
}

function getVagas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Vagas');
  const data = sheet.getDataRange().getValues();
  const lista = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === 'ATIVO') {
      lista.push({ nome: data[i][1] });
    }
  }
  return responseJSON({ success: true, vagas: lista });
}

function saveRelatorio(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Relatorios_Turno');
  
  if (!sheet) sheet = createRelatoriosSheet(ss);
  
  const r = data.relatorio;
  
  // Otimização: Salva estrutura complexa como string JSON
  const rowData = [
    r.id,
    r.supervisor,
    r.letraTurno,
    r.data, // Data YYYY-MM-DD
    JSON.stringify(r.equipamentosOperando),
    r.observacoes || '',
    new Date(),
    r.criadoEm
  ];
  
  sheet.appendRow(rowData);
  
  // Formata data visualmente na planilha
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 4).setNumberFormat('dd/mm/yyyy');
  sheet.getRange(lastRow, 7).setNumberFormat('dd/mm/yyyy HH:mm:ss');
  
  return responseJSON({ success: true });
}

function getRelatorios(e) {
  const supervisor = e.parameter.supervisor;
  const date = e.parameter.date;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Relatorios_Turno');
  if (!sheet) return responseJSON({ success: true, relatorios: [] });
  
  const data = sheet.getDataRange().getValues();
  const lista = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][3]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    if (data[i][1].toString().toUpperCase() === supervisor.toUpperCase() && rowDate === date) {
      let equipamentos = [];
      try { equipamentos = JSON.parse(data[i][4]); } catch(e) {}
      
      lista.push({
        id: data[i][0],
        supervisor: data[i][1],
        letraTurno: data[i][2],
        data: rowDate,
        equipamentosOperando: equipamentos,
        observacoes: data[i][5]
      });
    }
  }
  
  return responseJSON({ success: true, relatorios: lista });
}

function getDashboard(e) {
  const date = e.parameter.date;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Relatorios_Turno');
  
  if (!sheet) return responseJSON({ success: false, error: 'Sem dados' });
  
  const data = sheet.getDataRange().getValues();
  
  let totalRelatorios = 0;
  let totalEquipamentos = 0;
  let totalTrocas = 0;
  const equipamentosCount = {};
  const motivosTrocas = {};
  
  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][3]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    if (rowDate === date) {
      totalRelatorios++;
      try {
        const eqs = JSON.parse(data[i][4]);
        totalEquipamentos += eqs.length;
        
        eqs.forEach(eq => {
          const nomeEq = eq.equipamento || 'Indefinido';
          equipamentosCount[nomeEq] = (equipamentosCount[nomeEq] || 0) + 1;
          
          if (eq.trocas && eq.trocas.length) {
            eq.trocas.forEach(tr => {
              totalTrocas++;
              const m = tr.motivo || 'Outro';
              motivosTrocas[m] = (motivosTrocas[m] || 0) + 1;
            });
          }
        });
      } catch(err) {}
    }
  }
  
  // Formata para o gráfico de barras
  const topEquipamentos = Object.entries(equipamentosCount)
    .map(([equipamento, quantidade]) => ({ equipamento, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 8); // Top 8
  
  return responseJSON({
    success: true,
    data: {
      totalRelatorios,
      totalEquipamentos,
      totalTrocas,
      equipamentosMaisUsados: topEquipamentos,
      motivosTrocas
    }
  });
}

// ============================================
// SETUP
// ============================================
function createRelatoriosSheet(ss) {
  const sheet = ss.insertSheet('Relatorios_Turno');
  const headers = ['ID', 'Supervisor', 'Letra Turno', 'Data', 'Equipamentos (JSON)', 'Observações', 'Timestamp', 'Criado Em'];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1e40af').setFontColor('white');
  return sheet;
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Supervisores
  if (!ss.getSheetByName('Supervisores')) {
    const s = ss.insertSheet('Supervisores');
    s.appendRow(['ID', 'Nome', 'Senha', 'Email', 'Telefone', 'Ativo', 'Nível', 'Letra Turno']);
    s.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1e40af').setFontColor('white');
    // Admin padrão
    s.appendRow(['ADM', 'ADMIN', '123', '-', '-', 'SIM', 'gestao', '-']);
  }
  
  // Equipamentos
  if (!ss.getSheetByName('Equipamentos')) {
    const s = ss.insertSheet('Equipamentos');
    s.appendRow(['ID', 'Placa', 'Tipo', 'Status', 'Obs']);
    s.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#1e40af').setFontColor('white');
    s.appendRow(['EQ1', 'ABC-1234', 'VÁCUO', 'ATIVO', '']);
  }
  
  // Colaboradores
  if (!ss.getSheetByName('Colaboradores')) {
    const s = ss.insertSheet('Colaboradores');
    s.appendRow(['ID', 'Nome', 'Função', 'Supervisor', 'Regime', 'Status']);
    s.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1e40af').setFontColor('white');
    s.appendRow(['C1', 'JOÃO SILVA', 'MOTORISTA', 'ADMIN', 'ADM', 'ATIVO']);
  }
  
  // Vagas
  if (!ss.getSheetByName('Vagas')) {
    const s = ss.insertSheet('Vagas');
    s.appendRow(['ID', 'Nome', 'Status']);
    s.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#1e40af').setFontColor('white');
    s.appendRow(['V1', 'VAGA 01', 'ATIVO']);
  }
}