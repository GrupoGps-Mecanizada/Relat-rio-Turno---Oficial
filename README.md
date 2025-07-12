// ========================================================================
// Configurações Globais
// ========================================================================
var PLANILHA_ID = '1BXQDku3C3uuOyucuAmQoV36iQMtC0bsa--4VDZQBO54'; // ID da planilha
var NOME_PLANILHA_DADOS = 'Dados';
var NOME_PLANILHA_EQUIPES = 'Equipes';
var NOME_PLANILHA_CONFIGURACOES = 'Configurações';
var NOME_PLANILHA_ESTATISTICAS = 'Estatísticas';
var NOME_PLANILHA_AUDITORIA = 'Auditoria';
var VERSAO_APP = '3.3'; // VERSÃO ATUALIZADA COM CORREÇÕES APLICADAS
var MAX_RELATORIOS_DASHBOARD = 100;

// ========================================================================
// Ponto de Entrada Principal - doGet - CORRIGIDO
// ========================================================================
/**
 * Função de ponto de entrada para a API web - SEM EXPORTAÇÃO PDF
 * @param {Object} e - Objeto de evento com parâmetros da solicitação
 * @return {ContentService.TextOutput | HtmlService.HtmlOutput} Resposta JSON ou HTML
 */
function doGet(e) {
  try {
    // Servir HTML se não houver ação especificada
    if (!e || !e.parameter || !e.parameter.action) {
      Logger.log("Servindo index.html");
      var htmlOutput = HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Sistema de Relatório de Turno v' + VERSAO_APP);
      htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
      return htmlOutput;
    }

    // Processar ações da API
    var action = e.parameter.action;
    var result = {};
    Logger.log("Ação recebida: " + action);

    switch (action) {
      case "obterDadosFormulario":
        result = obterDadosFormulario();
        break;
      case "salvarTurno":
        if (!e.parameter.dadosTurno || !e.parameter.equipes) {
          throw new Error("Parâmetros 'dadosTurno' ou 'equipes' ausentes para a ação 'salvarTurno'");
        }
        var dadosTurno = JSON.parse(e.parameter.dadosTurno);
        var equipes = JSON.parse(e.parameter.equipes);
        result = salvarTurno(dadosTurno, equipes);
        break;
      case "obterDadosRelatorio":
        if (!e.parameter.turnoId) {
          throw new Error("Parâmetro 'turnoId' ausente para a ação 'obterDadosRelatorio'");
        }
        result = obterDadosRelatorio(e.parameter.turnoId);
        break;
      case "gerarRelatorioTexto":
        if (!e.parameter.turnoId) {
          throw new Error("Parâmetro 'turnoId' ausente para a ação 'gerarRelatorioTexto'");
        }
        result = gerarRelatorioTexto(e.parameter.turnoId); // USA A VERSÃO CORRIGIDA
        break;
      case "formatarWhatsApp":
        if (!e.parameter.turnoId) {
          throw new Error("Parâmetro 'turnoId' ausente para a ação 'formatarWhatsApp'");
        }
        var dados = obterDadosRelatorio(e.parameter.turnoId);
        if (dados.success) {
          var texto = formatarRelatorioParaCompartilhamentoFormal(dados.dadosTurno, dados.equipes); // USA A VERSÃO CORRIGIDA
          result = { success: true, relatorio: texto };
        } else {
          result = dados;
        }
        break;
      case "pesquisarRelatorios":
        if (!e.parameter.termo || !e.parameter.tipo) {
          throw new Error("Parâmetros 'termo' ou 'tipo' ausentes para a ação 'pesquisarRelatorios'");
        }
        result = pesquisarRelatorios(e.parameter.termo, e.parameter.tipo);
        break;
      case "obterDadosDashboard":
        result = obterDadosDashboard();
        break;
      case "atualizarEstatisticas":
        result = atualizarEstatisticas();
        break;
      case "gerarRelatorioEquipamentos":
        result = gerarRelatorioEquipamentos();
        break;
      case "gerarRelatorioAreas":
        result = gerarRelatorioAreas();
        break;
      case "obterHistoricoEquipamento":
        if (!e.parameter.equipamento) {
          throw new Error("Parâmetro 'equipamento' ausente para a ação 'obterHistoricoEquipamento'");
        }
        result = obterHistoricoEquipamento(e.parameter.equipamento);
        break;
      case "arquivarRelatorio":
        if (!e.parameter.turnoId) {
          throw new Error("Parâmetro 'turnoId' ausente para a ação 'arquivarRelatorio'");
        }
        result = arquivarRelatorio(e.parameter.turnoId);
        break;
      default:
        result = { success: false, message: "Ação desconhecida: " + action };
        break;
    }

    // Retornar resultado da API como JSON
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Erro em doGet: " + error.message + " Stack: " + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Erro interno no servidor: " + error.message
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================================================
// Funções de Gerenciamento da Planilha
// ========================================================================

/**
 * Obtém a planilha garantindo que ela existe e tem a estrutura básica.
 */
function obterPlanilha() {
  try {
    var planilha = SpreadsheetApp.openById(PLANILHA_ID);
    Logger.log("Planilha aberta com sucesso. ID: " + PLANILHA_ID);

    var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS);
    var abaEquipes = planilha.getSheetByName(NOME_PLANILHA_EQUIPES);
    var abaConfig = planilha.getSheetByName(NOME_PLANILHA_CONFIGURACOES);
    var abaEstatisticas = planilha.getSheetByName(NOME_PLANILHA_ESTATISTICAS);
    var abaAuditoria = planilha.getSheetByName(NOME_PLANILHA_AUDITORIA);

    if (!abaDados) { abaDados = criarAbaDados(planilha); }
    if (!abaEquipes) { abaEquipes = criarAbaEquipes(planilha); }
    if (!abaConfig) { abaConfig = criarAbaConfiguracoes(planilha); }
    if (!abaEstatisticas) { abaEstatisticas = criarAbaEstatisticas(planilha); }
    if (!abaAuditoria) { abaAuditoria = criarAbaAuditoria(planilha); }

    // Atualizar versão e data na aba de configurações
    if (abaConfig) {
      var versaoCell = abaConfig.getRange('B3');
      var atualizacaoCell = abaConfig.getRange('B4');
      if (versaoCell.getValue() !== VERSAO_APP) {
        versaoCell.setValue(VERSAO_APP);
        atualizacaoCell.setValue(new Date());
      }
    }

    return planilha;
  } catch (e) {
    Logger.log('Erro ao abrir planilha existente (ID: ' + PLANILHA_ID + '): ' + e.message);
    throw e;
  }
}

/**
 * Cria a aba de Dados com formatação
 */
function criarAbaDados(planilha) {
  var cabecalhosDados = [
    'ID', 'Data', 'Horário', 'Letra', 'Supervisor', 'Timestamp', 'Status', 'UltimaModificacao'
  ];

  var abaDados = planilha.insertSheet(NOME_PLANILHA_DADOS);
  abaDados.setTabColor('#0F9D58');

  var range = abaDados.getRange(1, 1, 1, cabecalhosDados.length);
  range.setValues([cabecalhosDados]).setFontWeight('bold').setBackground('#E8F0FE').setHorizontalAlignment('center');
  abaDados.setFrozenRows(1);
  abaDados.autoResizeColumns(1, cabecalhosDados.length);
  range.createFilter();

  var statusCol = cabecalhosDados.indexOf('Status') + 1;
  if (statusCol > 0) {
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(['Ativo', 'Arquivado', 'Em Processamento'], true).setAllowInvalid(false).build();
    abaDados.getRange(2, statusCol, abaDados.getMaxRows() - 1).setDataValidation(rule);
  }

  registrarAuditoria('Sistema', 'Criou aba de Dados');
  return abaDados;
}

/**
 * Cria a aba de Equipes com formatação - ATUALIZADA
 */
function criarAbaEquipes(planilha) {
  var cabecalhosEquipes = [
    'Turno_ID', 'Tipo_Equipe', 'Numero_Equipe', 'Integrantes', 'Motorista', 'Operadores', 'Area', 'Atividade',
    'TipoAtividade', 'StatusAtividade', 'Pendencia',
    'Vaga', 'Vaga_Personalizada', 'Equipamento', 'Equipamento_Personalizada', 'Identificacao_Usiminas',
    'Troca_Equipamento', 'Motivo_Troca', 'Motivo_Outro', 'Defeito', 'Placa_Nova', 'Data_Hora_Troca',
    'Data_Hora_Fim_Troca', 'Tempo_Troca',
    'Materiais_Alta_Pressao', 'Materiais_Vacuo',
    'Pistola', 'Pistola_Cano_Longo', 'Mangueira_Torpedo', 'Pedal', 'Varetas', 'Rabicho', 'Lances_Mangueira', 'Lances_Varetas',
    'Mangotes', 'Reducoes', 'Mangotes_3_Polegadas', 'Mangotes_4_Polegadas', 'Mangotes_6_Polegadas',
    'Justificativa', 'Caixa_Bloqueio', 'Cadeados', 'Plaquetas', 'Observacoes'
  ];

  var abaEquipes = planilha.insertSheet(NOME_PLANILHA_EQUIPES);
  abaEquipes.setTabColor('#DB4437');

  var range = abaEquipes.getRange(1, 1, 1, cabecalhosEquipes.length);
  range.setValues([cabecalhosEquipes]).setFontWeight('bold').setBackground('#E8F0FE').setHorizontalAlignment('center');
  abaEquipes.setFrozenRows(1);
  abaEquipes.setFrozenColumns(1);
  abaEquipes.autoResizeColumns(1, cabecalhosEquipes.length);
  range.createFilter();

  // Validações
  var validacaoTipoEquipe = SpreadsheetApp.newDataValidation().requireValueInList(['Alta Pressão', 'Auto Vácuo / Hiper Vácuo'], true).setAllowInvalid(false).build();
  var tipoEquipeColIndex = cabecalhosEquipes.indexOf('Tipo_Equipe') + 1;
  if (tipoEquipeColIndex > 0) {
    abaEquipes.getRange(2, tipoEquipeColIndex, abaEquipes.getMaxRows() - 1, 1).setDataValidation(validacaoTipoEquipe);
  }

  var validacaoStatus = SpreadsheetApp.newDataValidation().requireValueInList(['Concluído', 'Em andamento', 'Não Iniciado'], true).setAllowInvalid(true).build();
  var statusAtividadeColIndex = cabecalhosEquipes.indexOf('StatusAtividade') + 1;
  if (statusAtividadeColIndex > 0) {
      abaEquipes.getRange(2, statusAtividadeColIndex, abaEquipes.getMaxRows() - 1, 1).setDataValidation(validacaoStatus);
  }

  var validacaoTipoAtiv = SpreadsheetApp.newDataValidation().requireValueInList(['Rotineira', 'Emergencial', 'Programada', 'Preventiva'], true).setAllowInvalid(true).build();
  var tipoAtividadeColIndex = cabecalhosEquipes.indexOf('TipoAtividade') + 1;
  if (tipoAtividadeColIndex > 0) {
      abaEquipes.getRange(2, tipoAtividadeColIndex, abaEquipes.getMaxRows() - 1, 1).setDataValidation(validacaoTipoAtiv);
  }

  var validacaoTrocaEquipamento = SpreadsheetApp.newDataValidation().requireValueInList(['Sim', 'Não'], true).setAllowInvalid(false).build();
  var trocaEquipColIndex = cabecalhosEquipes.indexOf('Troca_Equipamento') + 1;
  if (trocaEquipColIndex > 0) {
    abaEquipes.getRange(2, trocaEquipColIndex, abaEquipes.getMaxRows() - 1, 1).setDataValidation(validacaoTrocaEquipamento);
  }

  var validacaoCaixaBloqueio = SpreadsheetApp.newDataValidation().requireValueInList(['Sim', 'Não'], true).setAllowInvalid(false).build();
  var caixaBloqueioColIndex = cabecalhosEquipes.indexOf('Caixa_Bloqueio') + 1;
  if(caixaBloqueioColIndex > 0) {
    abaEquipes.getRange(2, caixaBloqueioColIndex, abaEquipes.getMaxRows() - 1, 1).setDataValidation(validacaoCaixaBloqueio);
  }

  registrarAuditoria('Sistema', 'Criou/Verificou aba de Equipes');
  return abaEquipes;
}

/**
 * Cria a aba de Configurações
 */
function criarAbaConfiguracoes(planilha) {
  var abaConfig = planilha.insertSheet(NOME_PLANILHA_CONFIGURACOES);
  abaConfig.setTabColor('#4285F4');

  abaConfig.getRange('A1:B4').setValues([
    ['ID_PLANILHA', PLANILHA_ID],
    ['DATA_CRIACAO', new Date()],
    ['VERSAO', VERSAO_APP],
    ['ULTIMA_ATUALIZACAO', new Date()]
  ]).setBorder(true, true, true, true, true, true);
  abaConfig.getRange('A1:A4').setFontWeight('bold').setBackground('#E8F0FE');
  abaConfig.getRange('B1:B4').setBackground('#F8F9FA');

  abaConfig.getRange('A6:B6').setValues([['CONFIGURAÇÕES DE RELATÓRIOS', '']]).merge().setFontWeight('bold').setBackground('#E8F0FE');
  abaConfig.getRange('A7:B10').setValues([
    ['PERÍODO_PADRÃO_DASHBOARD', 'Últimos 30 dias'],
    ['LIMITE_RELATÓRIOS_DASHBOARD', MAX_RELATORIOS_DASHBOARD.toString()],
    ['MOSTRAR_EQUIPAMENTOS_INATIVOS', 'FALSE'],
    ['FORMATO_EXPORTAÇÃO_PADRÃO', 'TEXTO']
  ]).setBorder(true, true, true, true, true, true);
  abaConfig.getRange('A7:A10').setFontWeight('bold').setBackground('#E8F0FE');
  abaConfig.getRange('B7:B10').setBackground('#F8F9FA');

  abaConfig.getRange('A12:B12').setValues([['CONFIGURAÇÕES DE SEGURANÇA', '']]).merge().setFontWeight('bold').setBackground('#E8F0FE');
  abaConfig.getRange('A13:B15').setValues([
    ['BACKUP_AUTOMÁTICO', 'TRUE'],
    ['INTERVALO_BACKUP', '7 DIAS'],
    ['RETER_REGISTROS_AUDITORIA', '180 DIAS']
  ]).setBorder(true, true, true, true, true, true);
  abaConfig.getRange('A13:A15').setFontWeight('bold').setBackground('#E8F0FE');
  abaConfig.getRange('B13:B15').setBackground('#F8F9FA');

  abaConfig.autoResizeColumns(1, 2);
  registrarAuditoria('Sistema', 'Criou aba de Configurações');
  return abaConfig;
}

/**
 * Cria a aba de Estatísticas
 */
function criarAbaEstatisticas(planilha) {
  var abaEstatisticas = planilha.insertSheet(NOME_PLANILHA_ESTATISTICAS);
  abaEstatisticas.setTabColor('#FF6D00');

  abaEstatisticas.getRange('A1:B1').setValues([['Dashboard de Estatísticas', '']]).merge().setFontWeight('bold').setBackground('#E8F0FE').setHorizontalAlignment('center');
  abaEstatisticas.getRange('A3:B3').setValues([['Estatísticas Gerais', '']]).merge().setFontWeight('bold');
  abaEstatisticas.getRange('A5:C5').setValues([['Período', 'Total Relatórios', 'Total Equipes']]).setFontWeight('bold').setBackground('#E8F0FE');
  abaEstatisticas.getRange('A8:B8').setValues([['Status das Atividades (Período)', '']]).merge().setFontWeight('bold');
  abaEstatisticas.getRange('A9:B11').setValues([['Concluído', 0], ['Em Andamento', 0], ['Não Iniciado/Pendente', 0]]).setBackground('#F8F9FA');
  abaEstatisticas.getRange('A9:A11').setFontWeight('bold');
  abaEstatisticas.getRange('A13:B13').setValues([['Equipamentos Mais Utilizados', '']]).merge().setFontWeight('bold');
  abaEstatisticas.getRange('A15:C15').setValues([['Equipamento', 'Utilizações', 'Porcentagem']]).setFontWeight('bold').setBackground('#E8F0FE');
  abaEstatisticas.getRange('A23:B23').setValues([['Áreas Mais Atendidas', '']]).merge().setFontWeight('bold');
  abaEstatisticas.getRange('A25:C25').setValues([['Área', 'Atendimentos', 'Porcentagem']]).setFontWeight('bold').setBackground('#E8F0FE');
  abaEstatisticas.getRange('A33:B33').setValues([['Trocas de Equipamentos', '']]).merge().setFontWeight('bold');
  abaEstatisticas.getRange('A35:C35').setValues([['Motivo', 'Quantidade', 'Porcentagem']]).setFontWeight('bold').setBackground('#E8F0FE');
  abaEstatisticas.getRange('A43:B43').setValues([['Última Atualização', '']]).merge().setFontWeight('bold');
  abaEstatisticas.autoResizeColumns(1, 3);
  registrarAuditoria('Sistema', 'Criou aba de Estatísticas');
  return abaEstatisticas;
}

/**
 * Cria a aba de Auditoria
 */
function criarAbaAuditoria(planilha) {
  var abaAuditoria = planilha.insertSheet(NOME_PLANILHA_AUDITORIA);
  abaAuditoria.setTabColor('#9E9E9E');
  var cabecalhos = ['Timestamp', 'Usuário', 'Ação', 'Detalhes', 'IP'];
  var range = abaAuditoria.getRange(1, 1, 1, cabecalhos.length);
  range.setValues([cabecalhos]).setFontWeight('bold').setBackground('#E8F0FE').setHorizontalAlignment('center');
  abaAuditoria.setFrozenRows(1);
  abaAuditoria.autoResizeColumns(1, cabecalhos.length);
  range.createFilter();
  abaAuditoria.protect().setDescription('Registros de Auditoria - Protegido');
  var firstEntry = [new Date(), 'Sistema', 'Inicialização', 'Aba de auditoria criada', ''];
  abaAuditoria.appendRow(firstEntry);
  return abaAuditoria;
}

/**
 * Registra ação na aba de auditoria
 */
function registrarAuditoria(usuario, acao, detalhes = '', ip = '') {
 try {
   var planilha = SpreadsheetApp.openById(PLANILHA_ID);
   var abaAuditoria = planilha.getSheetByName(NOME_PLANILHA_AUDITORIA);
   if (!abaAuditoria) {
     Logger.log('ALERTA: Aba de auditoria não encontrada para registrar evento.');
     return false;
   }
   var registro = [new Date(), usuario, acao, detalhes, ip];
   abaAuditoria.appendRow(registro);

   // Limpeza automática de logs antigos
   var configuracoes = planilha.getSheetByName(NOME_PLANILHA_CONFIGURACOES);
   if (configuracoes && abaAuditoria.getLastRow() > 1500) {
     var diasRetencao = 180;
     try {
       var valorRetencao = configuracoes.getRange('B15').getValue().toString();
       var match = valorRetencao.match(/(\d+)/);
       if (match && match[1]) diasRetencao = parseInt(match[1]);
     } catch(e) { diasRetencao = 180; }

     var dataCorte = new Date();
     dataCorte.setDate(dataCorte.getDate() - diasRetencao);
     var valores = abaAuditoria.getRange(2, 1, abaAuditoria.getLastRow() - 1, 1).getValues();
     var linhasParaExcluir = [];
     for (var i = 0; i < valores.length; i++) {
       var dataRegistro = valores[i][0];
       if (dataRegistro instanceof Date && dataRegistro < dataCorte) {
         linhasParaExcluir.push(i + 2);
       }
     }
     if (linhasParaExcluir.length > 0) {
         Logger.log("Limpando " + linhasParaExcluir.length + " registros antigos da auditoria (mais de " + diasRetencao + " dias)...");
         for (var j = linhasParaExcluir.length - 1; j >= 0; j--) {
           abaAuditoria.deleteRow(linhasParaExcluir[j]);
         }
         Logger.log("Limpeza da auditoria concluída.");
     }
   }
   return true;
 } catch (e) {
   Logger.log('Erro ao registrar auditoria: ' + e.message);
   return false;
 }
}

// ========================================================================
// Funções da API
// ========================================================================

/**
 * Obtém dados para preenchimento do formulário
 */
function obterDadosFormulario() {
  var opcoesNumeroEquipe = Array.from({length: 15}, (_, i) => 'Equipe ' + (i + 1));
  var opcoesLances = ['N/A', ...Array.from({length: 15}, (_, i) => String(i)), 'Mais de 15'];
  var opcoesCadeadosPlaquetas = ['N/A', 'Em Falta', ...Array.from({length: 30}, (_, i) => String(i)), 'Mais de 30'];
  var opcoesMangotes = ['N/A', '10 metros', '20 metros', '30 metros', '40 metros', '50 metros', '60 metros', '70 metros', '80 metros', '90 metros', '100 metros', 'Mais de 100 metros'];

  var dadosFixos = {
    opcoesTipoEquipe: ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo'],
    opcoesHorario: ['06:50 às 18:40', '18:40 às 06:50', 'ADM'],
    opcoesLetra: ['A', 'B', 'C', 'D'],
    opcoesSupervisor: ['Israel', 'Ozias', 'Wellison', 'Matozalém'],
    vagasAltaPressao: [
      'CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS', 'CAMINHÃO ALTA PRESSÃO - GPS - 02', 'CAMINHÃO ALTA PRESSÃO - GPS - 03',
      'CAMINHÃO ALTA PRESSÃO - GPS - 04', 'CAMINHÃO ALTA PRESSÃO - GPS - 05', 'CAMINHÃO ALTA PRESSÃO - GPS - 06',
      'CAMINHÃO ALTA PRESSÃO - GPS - 07', 'CAMINHÃO ALTA PRESSÃO - GPS - 08 - 24 HS', 'CAMINHÃO ALTA PRESSÃO - GPS - 09',
      'CAMINHÃO ALTA PRESSÃO - GPS - 10', 'CAMINHÃO ALTA PRESSÃO - GPS - 11', 'CAMINHÃO ALTA PRESSÃO - GPS - 12', 'OUTRA VAGA'
    ],
    equipamentosAltaPressao: [
      'PUB-2G02', 'LUX-3201', 'FLX7617', 'EZS-8765', 'EZS-8764', 'EVK-0291', 'EOF-5C06', 'EOF-5208', 'EGC-2989', 'EGC-2985',
      'EGC-2983', 'EGC-2978', 'EAM-3262', 'EAM-3256', 'EAM-3255', 'EAM-3253', 'EAM-3010', 'DSY-6475', 'DSY-6474', 'DSY-6472',
      'CZC-0453', 'OUTRO EQUIPAMENTO'
    ],
    vagasVacuo: [
      'CAMINHÃO AUTO VÁCUO - GPS - 01 - 16 HS', 'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS', 'CAMINHÃO AUTO VÁCUO - GPS - 03',
      'CAMINHÃO AUTO VÁCUO - GPS - 04', 'CAMINHÃO AUTO VÁCUO - GPS - 05', 'CAMINHÃO AUTO VÁCUO - GPS - 06',
      'CAMINHÃO AUTO VÁCUO - GPS - 07', 'CAMINHÃO AUTO VÁCUO - GPS - 08 - 24 HS', 'CAMINHÃO AUTO VÁCUO - GPS - 09',
      'CAMINHÃO AUTO VÁCUO - GPS - 10',
      'CAMINHÃO HIPER VÁCUO - GPS - 1', 'CAMINHÃO HIPER VÁCUO - GPS - 2',
      'OUTRA VAGA'
    ],
    equipamentosVacuo: [
      'PUB-2F80', 'NFF-0235', 'HJS-1097', 'FSA-3D71', 'EGC-2993', 'EGC-2979', 'EAM-3257', 'EAM-3251', 'DYB-7210', 'DSY-6577',
      'DSY-6473', 'CUB-0763', 'ANF-2676', 'FTW-4D99', 'FTD-6368', 'FMD-2200', 'FHD-9264', 'EZS-9753', 'OUTRO EQUIPAMENTO'
    ]
  };

  registrarAuditoria('Sistema', 'Consulta Dados Formulário');

  return {
    success: true,
    OPCOES_FORMULARIO: {
      ...dadosFixos,
      opcoesNumeroEquipe: opcoesNumeroEquipe,
      opcoesLances: opcoesLances,
      opcoesCadeadosPlaquetas: opcoesCadeadosPlaquetas,
      opcoesMangotes: opcoesMangotes
    }
  };
}

/**
 * Mapeia o tipo de equipe para o valor padronizado.
 */
function mapTipoEquipe(tipo) {
  if (!tipo || typeof tipo !== 'string') return 'Tipo Desconhecido';
  const tipoLowerCase = tipo.toLowerCase().trim();
  const tipoPadraoVacuo = 'Auto Vácuo / Hiper Vácuo';
  if (tipoLowerCase.includes('alta') || tipoLowerCase.includes('pressão') || tipoLowerCase.includes('pressao')) {
    return 'Alta Pressão';
  } else if (tipoLowerCase.includes('hiper') || tipoLowerCase.includes('vácuo') || tipoLowerCase.includes('vacuo') || tipoLowerCase.includes('vac')) {
     return tipoPadraoVacuo;
  }
  return tipo;
}

/**
 * Normaliza texto para comparações mais consistentes
 */
function normalizarTexto(texto) {
  if (!texto) return '';
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Salva os dados de um turno e suas equipes na planilha.
 * ATUALIZADA para salvar novos campos e calcular tempo de troca.
 */
function salvarTurno(dadosTurno, equipes) {
  try {
    if (!dadosTurno || typeof dadosTurno !== 'object' || !dadosTurno.data || !dadosTurno.horario) { 
      throw new Error("Dados do turno inválidos."); 
    }
    if (!Array.isArray(equipes)) { 
      throw new Error("Dados das equipes inválidos."); 
    }
    Logger.log('DEBUG salvarTurno: Iniciando. Dados Turno: ' + JSON.stringify(dadosTurno) + ', Nº Equipes: ' + equipes.length);

    var planilha = obterPlanilha();
    var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS);
    var abaEquipes = planilha.getSheetByName(NOME_PLANILHA_EQUIPES);
    if (!abaDados || !abaEquipes) throw new Error("Abas 'Dados' ou 'Equipes' não encontradas.");

    var id = Utilities.getUuid();
    var timestampAtual = new Date();

    // Salvar Dados do Turno
    var cabecalhosDados = abaDados.getRange(1, 1, 1, abaDados.getLastColumn()).getValues()[0];
    var dadosTurnoLinha = cabecalhosDados.map(header => {
        switch(header) {
            case 'ID': return id;
            case 'Data': return dadosTurno.data;
            case 'Horário': return dadosTurno.horario;
            case 'Letra': return dadosTurno.letra;
            case 'Supervisor': return dadosTurno.supervisor;
            case 'Timestamp': return timestampAtual;
            case 'Status': return 'Ativo';
            case 'UltimaModificacao': return timestampAtual;
            default: return '';
        }
    });
    abaDados.appendRow(dadosTurnoLinha);
    Logger.log('DEBUG salvarTurno: Dados do turno salvos com ID: ' + id);

    // Salvar Dados das Equipes
    var cabecalhosEquipes = abaEquipes.getRange(1, 1, 1, abaEquipes.getLastColumn()).getValues()[0];
    var mapaColunasEquipes = {};
    cabecalhosEquipes.forEach((h, i) => { mapaColunasEquipes[h.trim()] = i; });

    const turnoIdIndex = mapaColunasEquipes['Turno_ID'];
    const tipoEquipeIndex = mapaColunasEquipes['Tipo_Equipe'];
    const trocaIndex = mapaColunasEquipes['Troca_Equipamento'];
    const dataHoraTrocaIndex = mapaColunasEquipes['Data_Hora_Troca'];
    const dataHoraFimTrocaIndex = mapaColunasEquipes['Data_Hora_Fim_Troca'];
    const tempoTrocaIndex = mapaColunasEquipes['Tempo_Troca'];
    const materiaisAPIndex = mapaColunasEquipes['Materiais_Alta_Pressao'];
    const materiaisVacuoIndex = mapaColunasEquipes['Materiais_Vacuo'];

    equipes.forEach((equipe, index) => {
        if (!equipe || typeof equipe !== 'object') {
            Logger.log('AVISO salvarTurno: Dados da equipe ' + (index + 1) + ' inválidos. Pulando.');
            return;
        }

        const tipoOriginal = equipe.tipo || '';
        const tipoMapeado = mapTipoEquipe(tipoOriginal);

        var linha = new Array(cabecalhosEquipes.length).fill('');
        const getVal = (prop, defaultVal = '') => (equipe[prop] !== undefined && equipe[prop] !== null && String(equipe[prop]).trim() !== '') ? String(equipe[prop]) : String(defaultVal);
        const getMatVal = (matProp, defaultVal = 'N/A') => equipe.materiais && equipe.materiais[matProp] !== undefined && equipe.materiais[matProp] !== null ? String(equipe.materiais[matProp]) : String(defaultVal);
        const getVacVal = (vacProp, defaultVal = 'N/A') => equipe.materiaisVacuo && equipe.materiaisVacuo[vacProp] !== undefined && equipe.materiaisVacuo[vacProp] !== null ? String(equipe.materiaisVacuo[vacProp]) : String(defaultVal);

        // Mapeamento dos campos básicos
        if (turnoIdIndex !== undefined) linha[turnoIdIndex] = id;
        if (tipoEquipeIndex !== undefined) linha[tipoEquipeIndex] = tipoMapeado;
        
        // Mapear outros campos
        for (const prop in equipe) {
            let colunaSheet = '';
            switch (prop) {
                case 'numero': colunaSheet = 'Numero_Equipe'; break;
                case 'integrantes': colunaSheet = 'Integrantes'; break;
                case 'motorista': colunaSheet = 'Motorista'; break;
                case 'operadores': colunaSheet = 'Operadores'; break;
                case 'area': colunaSheet = 'Area'; break;
                case 'atividade': colunaSheet = 'Atividade'; break;
                case 'tipoAtividade': colunaSheet = 'TipoAtividade'; break;
                case 'statusAtividade': colunaSheet = 'StatusAtividade'; break;
                case 'pendencia': colunaSheet = 'Pendencia'; break;
                case 'vaga': colunaSheet = 'Vaga'; break;
                case 'vagaPersonalizada': colunaSheet = 'Vaga_Personalizada'; break;
                case 'equipamento': colunaSheet = 'Equipamento'; break;
                case 'equipamentoPersonalizado': colunaSheet = 'Equipamento_Personalizada'; break;
                case 'identificacaoUsiminas': colunaSheet = 'Identificacao_Usiminas'; break;
                case 'trocaEquipamento': colunaSheet = 'Troca_Equipamento'; break;
                case 'motivoTroca': colunaSheet = 'Motivo_Troca'; break;
                case 'motivoOutro': colunaSheet = 'Motivo_Outro'; break;
                case 'defeito': colunaSheet = 'Defeito'; break;
                case 'placaNova': colunaSheet = 'Placa_Nova'; break;
                case 'dataHoraTroca': colunaSheet = 'Data_Hora_Troca'; break;
                case 'dataHoraFimTroca': colunaSheet = 'Data_Hora_Fim_Troca'; break;
                case 'lancesMangueira': colunaSheet = 'Lances_Mangueira'; break;
                case 'lancesVaretas': colunaSheet = 'Lances_Varetas'; break;
                case 'mangotes3Polegadas': colunaSheet = 'Mangotes_3_Polegadas'; break;
                case 'mangotes4Polegadas': colunaSheet = 'Mangotes_4_Polegadas'; break;
                case 'mangotes6Polegadas': colunaSheet = 'Mangotes_6_Polegadas'; break;
                case 'justificativa': colunaSheet = 'Justificativa'; break;
                case 'caixaBloqueio': colunaSheet = 'Caixa_Bloqueio'; break;
                case 'cadeados': colunaSheet = 'Cadeados'; break;
                case 'plaquetas': colunaSheet = 'Plaquetas'; break;
                case 'observacoes': colunaSheet = 'Observacoes'; break;
                case 'materiais': case 'materiaisVacuo': case 'tipo': case 'index': continue;
                default: colunaSheet = prop;
            }

            const colIndex = mapaColunasEquipes[colunaSheet];
            if (colIndex !== undefined) {
                linha[colIndex] = getVal(prop);
            }
        }

        // Tratar materiais aninhados
        if (tipoMapeado === 'Alta Pressão' && equipe.materiais) {
            if (mapaColunasEquipes['Pistola'] !== undefined) linha[mapaColunasEquipes['Pistola']] = getMatVal('pistola');
            if (mapaColunasEquipes['Pistola_Cano_Longo'] !== undefined) linha[mapaColunasEquipes['Pistola_Cano_Longo']] = getMatVal('pistolaCanoLongo');
            if (mapaColunasEquipes['Mangueira_Torpedo'] !== undefined) linha[mapaColunasEquipes['Mangueira_Torpedo']] = getMatVal('mangueiraTorpedo');
            if (mapaColunasEquipes['Pedal'] !== undefined) linha[mapaColunasEquipes['Pedal']] = getMatVal('pedal');
            if (mapaColunasEquipes['Varetas'] !== undefined) linha[mapaColunasEquipes['Varetas']] = getMatVal('varetas');
            if (mapaColunasEquipes['Rabicho'] !== undefined) linha[mapaColunasEquipes['Rabicho']] = getMatVal('rabicho');
        } else if (tipoMapeado === 'Auto Vácuo / Hiper Vácuo' && equipe.materiaisVacuo) {
            if (mapaColunasEquipes['Mangotes'] !== undefined) linha[mapaColunasEquipes['Mangotes']] = getVacVal('mangotes');
            if (mapaColunasEquipes['Reducoes'] !== undefined) linha[mapaColunasEquipes['Reducoes']] = getVacVal('reducoes');
        }

        // CÁLCULO TEMPO DE TROCA CORRIGIDO
        if (trocaIndex !== undefined && linha[trocaIndex] === 'Sim' &&
            dataHoraTrocaIndex !== undefined && dataHoraFimTrocaIndex !== undefined && tempoTrocaIndex !== undefined) {

          const dataHoraTroca = linha[dataHoraTrocaIndex];
          const dataHoraFimTroca = linha[dataHoraFimTrocaIndex];

          if (dataHoraTroca && dataHoraFimTroca) {
            try {
                const inicio = new Date(dataHoraTroca);
                const fim = new Date(dataHoraFimTroca);

                if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime()) && fim > inicio) {
                    const diferencaMinutos = Math.round((fim - inicio) / (1000 * 60));
                    const horas = Math.floor(diferencaMinutos / 60);
                    const minutos = diferencaMinutos % 60;
                    linha[tempoTrocaIndex] = `${horas}h${minutos < 10 ? '0' : ''}${minutos}min`;
                    Logger.log(`DEBUG salvarTurno: Equipe ${index + 1} - Tempo de troca calculado: ${linha[tempoTrocaIndex]}`);
                } else {
                    Logger.log(`AVISO salvarTurno: Equipe ${index + 1} - Datas de troca inválidas ou fim <= início.`);
                    linha[tempoTrocaIndex] = 'Erro Datas';
                }
            } catch (calcError) {
                Logger.log(`ERRO salvarTurno: Equipe ${index + 1} - Erro ao calcular tempo de troca: ${calcError.message}`);
                linha[tempoTrocaIndex] = 'Erro Cálculo';
            }
          } else {
              linha[tempoTrocaIndex] = 'Dados Ausentes';
          }
        }

        // Colunas indicativas
        if (materiaisAPIndex !== undefined) linha[materiaisAPIndex] = tipoMapeado === 'Alta Pressão' ? 'Sim' : 'Não';
        if (materiaisVacuoIndex !== undefined) linha[materiaisVacuoIndex] = tipoMapeado === 'Auto Vácuo / Hiper Vácuo' ? 'Sim' : 'Não';

        try {
            abaEquipes.appendRow(linha);
        } catch (appendError) {
            Logger.log(`ERRO CRÍTICO ao salvar linha da equipe ${index + 1}: ${appendError.message}`);
        }
    });

    registrarAuditoria('Sistema', 'Salvar Turno', 'ID: ' + id + ', Equipes: ' + equipes.length);
    try {
        atualizarEstatisticas();
    } catch (statsError) {
        Logger.log("ERRO ao chamar atualizarEstatisticas pós-salvamento: " + statsError.message);
    }
    Logger.log('Relatório salvo com sucesso. ID: ' + id);

    return { success: true, message: 'Relatório salvo com sucesso!', relatorioId: id };

  } catch (error) {
    Logger.log('Erro CRÍTICO na função salvarTurno: ' + error.message + " Stack: " + error.stack);
    return { success: false, message: 'Erro interno ao salvar o relatório: ' + error.message };
  }
}

/**
 * Obtém os dados completos de um relatório (turno e equipes) pelo ID.
 * ATUALIZADA para ler os novos campos.
 */
function obterDadosRelatorio(turnoId) {
  try {
    if (!turnoId) return { success: false, message: 'ID do turno não fornecido.' };

    var planilha = obterPlanilha();
    var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS);
    var abaEquipes = planilha.getSheetByName(NOME_PLANILHA_EQUIPES);
    if (!abaDados || !abaEquipes) throw new Error("Abas 'Dados' ou 'Equipes' não encontradas.");

    // Obter dados do turno
    var dadosValores = abaDados.getDataRange().getValues();
    var cabecalhosDados = dadosValores.shift();
    var idIndexDados = cabecalhosDados.indexOf('ID');
    if (idIndexDados === -1) throw new Error("Coluna 'ID' não encontrada em 'Dados'.");

    var dadosTurno = null;
    for (const linha of dadosValores) {
      if (linha[idIndexDados] === turnoId) {
        dadosTurno = {};
        cabecalhosDados.forEach((cabecalho, j) => {
          if ((cabecalho === 'Data' || cabecalho === 'Timestamp' || cabecalho === 'UltimaModificacao') && linha[j] instanceof Date) {
              dadosTurno[cabecalho] = Utilities.formatDate(linha[j], "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
          } else {
              dadosTurno[cabecalho] = linha[j];
          }
        });
        break;
      }
    }
    if (!dadosTurno) return { success: false, message: 'Turno com ID ' + turnoId + ' não encontrado.' };

    // Obter dados das equipes
    var equipesValores = abaEquipes.getDataRange().getValues();
    var cabecalhosEquipes = equipesValores.shift();
    var turnoIdIndexEquipes = cabecalhosEquipes.indexOf('Turno_ID');
    var tipoEquipeIndex = cabecalhosEquipes.indexOf('Tipo_Equipe');
    if (turnoIdIndexEquipes === -1) throw new Error("Coluna 'Turno_ID' não encontrada em 'Equipes'.");
    if (tipoEquipeIndex === -1) throw new Error("Coluna 'Tipo_Equipe' não encontrada em 'Equipes'.");

    var equipes = [];
    for (const linha of equipesValores) {
      if (linha[turnoIdIndexEquipes] === turnoId) {
        var equipeObj = {};
        cabecalhosEquipes.forEach((cabecalho, j) => {
          if (j === tipoEquipeIndex) {
            equipeObj[cabecalho] = mapTipoEquipe(linha[j]);
          } else {
            if ((cabecalho === 'Data_Hora_Troca' || cabecalho === 'Data_Hora_Fim_Troca') && linha[j] instanceof Date) {
                equipeObj[cabecalho] = Utilities.formatDate(linha[j], "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
            } else {
                equipeObj[cabecalho] = linha[j];
            }
          }
        });
        equipes.push(equipeObj);
      }
    }

    registrarAuditoria('Sistema', 'Consulta Relatório', 'ID: ' + turnoId);
    return { success: true, dadosTurno: dadosTurno, equipes: equipes };

  } catch (error) {
    Logger.log('Erro ao obter dados do relatório (ID: ' + turnoId + '): ' + error.message + " Stack: " + error.stack);
    return { success: false, message: 'Erro ao recuperar dados do relatório: ' + error.message };
  }
}

// ========================================================================
// FUNÇÕES DE GERAÇÃO DE RELATÓRIO - CORRIGIDAS E REFORMULADAS
// ========================================================================

/**
 * Gera o relatório em formato executivo PADRONIZADO
 */
function gerarRelatorioTexto(turnoId) {
  try {
    Logger.log("==== INICIANDO GERAÇÃO DE RELATÓRIO EXECUTIVO PADRONIZADO ====");
    
    var dados = obterDadosRelatorio(turnoId);
    if (!dados.success) {
      return dados;
    }

    var turno = dados.dadosTurno;
    var equipes = dados.equipes;
    
    // Iniciar relatório executivo PADRONIZADO
    var relatorio = "RELATÓRIO DE TURNO - GPS MECANIZADA\n\n";
    
    // === RESUMO EXECUTIVO ===
    relatorio += "🔹 RESUMO EXECUTIVO 🔹\n";
    relatorio += "- Data: " + formatarData(turno.Data) + " | Turno: " + (turno.Horário || 'N/A') + " | Letra: " + (turno.Letra || 'N/A') + "\n";
    relatorio += "- Supervisor: " + (turno.Supervisor || 'N/A') + "\n";
    
    // Calcular contadores
    var totalAltaPressao = 0, totalVacuo = 0;
    var totalConcluido = 0, totalEmAndamento = 0;
    var totalIndisponibilidadeTecnica = 0;
    var tiposAtividade = {};

    // Agrupar equipes por tipo
    var equipesPorTipo = {};
    
    for (var i = 0; i < equipes.length; i++) {
      var eq = equipes[i];
      var tipo = eq.Tipo_Equipe || 'Desconhecido';
      if (!equipesPorTipo[tipo]) equipesPorTipo[tipo] = [];
      equipesPorTipo[tipo].push(eq);

      // Contagem por tipo
      if (tipo === 'Alta Pressão') totalAltaPressao++;
      else if (tipo === 'Auto Vácuo / Hiper Vácuo') totalVacuo++;

      // Contagem por status
      var statusNormalizado = normalizarTexto(eq.StatusAtividade || 'concluído');
      if (statusNormalizado === 'concluído') {
        totalConcluido++;
      } else if (statusNormalizado === 'em andamento') {
        totalEmAndamento++;
      }
      
      // Contar tipos de atividade
      var tipoAtiv = eq.TipoAtividade || 'Rotineira';
      tiposAtividade[tipoAtiv] = (tiposAtividade[tipoAtiv] || 0) + 1;

      // Calcular indisponibilidade só para manutenções técnicas
      if (eq.Troca_Equipamento === 'Sim') {
        var tempoMinutos = 0;
        var isSolicitacaoCliente = false;
        
        var motivoNormalizado = normalizarTexto(eq.Motivo_Troca || '');
        var motivoOutroNormalizado = normalizarTexto(eq.Motivo_Outro || '');

        if (motivoNormalizado.indexOf('solicitacao') > -1 || 
            motivoNormalizado.indexOf('cliente') > -1 ||
            motivoNormalizado.indexOf('solicitação') > -1) {
          isSolicitacaoCliente = true;
        } else if ((motivoNormalizado.indexOf('outros') > -1 || motivoNormalizado.indexOf('defeitos') > -1) &&
                   (motivoOutroNormalizado.indexOf('solicitacao') > -1 || 
                    motivoOutroNormalizado.indexOf('cliente') > -1 ||
                    motivoOutroNormalizado.indexOf('solicitação') > -1)) {
          isSolicitacaoCliente = true;
        }

        if (!isSolicitacaoCliente && eq.Data_Hora_Troca && eq.Data_Hora_Fim_Troca) {
          try {
            var inicio = new Date(eq.Data_Hora_Troca);
            var fim = new Date(eq.Data_Hora_Fim_Troca);
            if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime()) && fim > inicio) {
              tempoMinutos = Math.round((fim - inicio) / (1000 * 60));
              totalIndisponibilidadeTecnica += tempoMinutos;
            }
          } catch (e) {
            Logger.log("Erro ao calcular tempo das datas: " + e.message);
          }
        }
      }
    }

    // Completar resumo executivo
    relatorio += "- Equipes: " + equipes.length + " (" + totalAltaPressao + " Alta Pressão, " + totalVacuo + " Auto Vácuo)\n";
    relatorio += "- Andamento: " + totalConcluido + " Concluídas, " + totalEmAndamento + " Em Andamento\n";
    
    if (totalIndisponibilidadeTecnica > 0) {
      var horasIndisponibilidade = Math.floor(totalIndisponibilidadeTecnica / 60);
      var minutosIndisponibilidade = totalIndisponibilidadeTecnica % 60;
      relatorio += "- Indisponibilidade: " + horasIndisponibilidade + "h" + (minutosIndisponibilidade < 10 ? '0' : '') + minutosIndisponibilidade + "min (manutenções técnicas)\n";
    } else {
      relatorio += "- Indisponibilidade: 0h00min (manutenções técnicas)\n";
    }
    
    relatorio += "\n";

    // === SEÇÕES POR TIPO DE EQUIPE ===
    var ordemTipos = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo'];
    var tiposOrdenados = Object.keys(equipesPorTipo).sort(function(a, b) {
        var indexA = ordemTipos.indexOf(a);
        var indexB = ordemTipos.indexOf(b);
        if (indexA === -1) indexA = ordemTipos.length;
        if (indexB === -1) indexB = ordemTipos.length;
        return indexA - indexB;
    });

    for (var t = 0; t < tiposOrdenados.length; t++) {
      var tipo = tiposOrdenados[t];
      var equipesDoTipo = equipesPorTipo[tipo];
      var isAltaPressao = tipo === 'Alta Pressão';
      
      // Cabeçalho da seção
      relatorio += "🔸 " + tipo.toUpperCase() + " (" + equipesDoTipo.length + " EQUIPES) 🔸\n";
      
      for (var j = 0; j < equipesDoTipo.length; j++) {
        var equipe = equipesDoTipo[j];
        
        // Determinar equipamento e vaga
        var equipamento = equipe.Equipamento === 'OUTRO EQUIPAMENTO' ?
                         (equipe.Equipamento_Personalizada || 'N/A') :
                         (equipe.Equipamento || 'N/A');

        var vaga = equipe.Vaga === 'OUTRA VAGA' ?
                  (equipe.Vaga_Personalizada || 'N/A') :
                  (equipe.Vaga || 'N/A');
        
        // Extrair códigos para formato compacto
        var vagaCodigo = extrairCodigoVaga(vaga);
        var equipamentoCodigo = extrairCodigoEquipamento(equipamento);
        
        var statusNormalizado = normalizarTexto(equipe.StatusAtividade || 'concluído');
        var statusTexto = statusNormalizado === 'concluído' ? 'CONCLUÍDO' : 
                         statusNormalizado === 'em andamento' ? 'EM ANDAMENTO' : 'PENDENTE';

        // Linha principal da equipe (formato compacto)
        relatorio += "EQUIPE " + (j + 1) + " - " + vagaCodigo + "/" + equipamentoCodigo + " - " + statusTexto + "\n";
        relatorio += "Motorista: " + (equipe.Motorista || 'N/A') + " | Operadores: " + (equipe.Operadores || 'N/A') + "\n";
        relatorio += "Local: " + (equipe.Area || 'N/A') + "\n";
        relatorio += "Atividade: " + (equipe.Atividade || 'N/A') + " (" + (equipe.TipoAtividade || 'Rotineira') + ")\n";
        
        // Implementos específicos por tipo
        relatorio += "IMPLEMENTOS:\n";
        if (isAltaPressao) {
          var pistola = equipe.Pistola !== 'N/A' ? equipe.Pistola : '';
          var pistolaCL = equipe.Pistola_Cano_Longo !== 'N/A' ? equipe.Pistola_Cano_Longo : '';
          var implementos = [pistola, pistolaCL].filter(function(i) { return i && i !== 'N/A'; }).join(', ');
          
          relatorio += "- Principais: " + (implementos || 'Não informado') + "\n";
          relatorio += "- Lances: " + (equipe.Lances_Mangueira || '0') + " mangueiras, " + (equipe.Lances_Varetas || '0') + " varetas\n";
        } else {
          var mangotes = equipe.Mangotes || 'N/A';
          var reducoes = equipe.Reducoes || 'N/A';
          relatorio += "- Mangotes: " + mangotes + ", Reduções: " + reducoes + "\n";
          
          var m3 = formatarMangotes(equipe.Mangotes_3_Polegadas);
          var m4 = formatarMangotes(equipe.Mangotes_4_Polegadas);
          var m6 = formatarMangotes(equipe.Mangotes_6_Polegadas);
          relatorio += "- Volumes: " + m3 + " (3\"), " + m4 + " (4\"), " + m6 + " (6\")\n";
        }
        
        // Segurança (formato compacto)
        var caixaBloqueio = equipe.Caixa_Bloqueio === 'Sim' ? 'Sim' : 'Não';
        var cadeados = equipe.Cadeados || '0';
        var plaquetas = equipe.Plaquetas || '0';
        relatorio += "- Bloqueio: " + caixaBloqueio + " (" + cadeados + " cadeados, " + plaquetas + " plaquetas)\n";
        
        // Adicionar linha separadora entre equipes
        relatorio += "------------------------------------------\n";
      }
      
      relatorio += "\n";
    }

    // === INDICADORES DE TURNO ===
    relatorio += "🔹 INDICADORES DE TURNO 🔹\n";
    relatorio += "- Realizações: " + totalConcluido + " concluídas, " + totalEmAndamento + " em andamento\n";
    
    // Tipos de atividade
    var tiposTexto = [];
    for (var tipo in tiposAtividade) {
      tiposTexto.push(tiposAtividade[tipo] + " " + tipo);
    }
    relatorio += "- Tipos: " + tiposTexto.join(', ') + "\n";
    
    // Indisponibilidade total
    if (totalIndisponibilidadeTecnica > 0) {
      var horasTotal = Math.floor(totalIndisponibilidadeTecnica / 60);
      var minutosTotal = totalIndisponibilidadeTecnica % 60;
      relatorio += "- Indisponibilidade Total: " + horasTotal + "h" + (minutosTotal < 10 ? '0' : '') + minutosTotal + "min\n";
      relatorio += "  - Cliente: 0h00min (não conta para indisponibilidade técnica)\n";
    } else {
      relatorio += "- Indisponibilidade Total: 0h00min\n";
      relatorio += "  - Cliente: 0h00min (não conta para indisponibilidade técnica)\n";
    }
    
    relatorio += "\n";

    // Rodapé
    relatorio += "GPS Mecanizada | Sistema v" + VERSAO_APP + " | " + formatarData(new Date());

    Logger.log("==== RELATÓRIO EXECUTIVO PADRONIZADO GERADO COM SUCESSO ====");
    registrarAuditoria('Sistema', 'Gerar Relatório Executivo Padronizado', 'ID: ' + turnoId);
    return { success: true, relatorio: relatorio };

  } catch (error) {
    Logger.log('ERRO CRÍTICO ao gerar relatório executivo: ' + error.message);
    return { success: false, message: 'Erro ao gerar relatório: ' + error.message };
  }
}

/**
 * Extrai código simplificado da vaga
 */
function extrairCodigoVaga(vaga) {
  if (!vaga || vaga === 'N/A') return 'N/A';
  
  // Extrair padrões como "GPS - 01 - 24 HS" -> "AP-01 - 24 HS"
  if (vaga.includes('ALTA PRESSÃO')) {
    const match = vaga.match(/GPS - (\d+)( - 24 HS)?/);
    if (match) {
      return `AP-${match[1]}${match[2] || ''}`;
    }
    return 'AP-XX';
  } else if (vaga.includes('AUTO VÁCUO')) {
    const match = vaga.match(/GPS - (\d+)( - 16 HS)?/);
    if (match) {
      return `AV-${match[1]}${match[2] || ''}`;
    }
    return 'AV-XX';
  } else if (vaga.includes('HIPER VÁCUO')) {
    const match = vaga.match(/GPS - (\d+)/);
    if (match) {
      return `HV-${match[1]}`;
    }
    return 'HV-XX';
  }
  
  return vaga.length > 15 ? vaga.substring(0, 15) + '...' : vaga;
}

/**
 * Extrai código simplificado do equipamento
 */
function extrairCodigoEquipamento(equipamento) {
  if (!equipamento || equipamento === 'N/A') return 'N/A';
  
  // Se já é um código (ex: "EOF-5208"), retorna como está
  if (equipamento.match(/^[A-Z]{3}-\d{4}$/)) {
    return equipamento;
  }
  
  return equipamento.length > 10 ? equipamento.substring(0, 10) + '...' : equipamento;
}

/**
 * Formata valores de mangotes para exibição compacta
 */
function formatarMangotes(valor) {
  if (!valor || valor === 'N/A' || valor === '0') return '0m';
  
  // Se já tem formato "XX metros", extrair número
  const match = String(valor).match(/(\d+)\s*metros?/);
  if (match) {
    return match[1] + 'm';
  }
  
  return String(valor);
}

/**
 * Formatar relatório para compartilhamento (WhatsApp) - VERSÃO CORRIGIDA
 */
function formatarRelatorioParaCompartilhamentoFormal(dadosTurno, equipes) {
  var texto = "";
  const nl = "\n";

  if (!dadosTurno || !Array.isArray(equipes)) { 
    return "Erro: Dados inválidos para formatação WhatsApp."; 
  }

  // Função auxiliar para obter valores
  const getField = (obj, fieldGas, fieldLocal, defaultVal = 'N/A') => {
    let val = obj[fieldGas]; 
    if (val !== undefined && val !== null && String(val).trim() !== '') return val;
    val = obj[fieldLocal]; 
    if (val !== undefined && val !== null && String(val).trim() !== '') return val;
    return defaultVal;
  }

  // Cabeçalho
  texto += "*RELATÓRIO DE TURNO - GPS MECANIZADA*" + nl + nl;
  texto += `*Data:* ${formatarData(getField(dadosTurno, 'Data', 'data'))}` + nl;
  texto += `*Horário:* ${getField(dadosTurno, 'Horário', 'horario')}` + nl;
  texto += `*Letra:* ${getField(dadosTurno, 'Letra', 'letra')}` + nl;
  texto += `*Supervisor:* ${getField(dadosTurno, 'Supervisor', 'supervisor')}` + nl + nl;

  // Calcular estatísticas CORRIGIDAS
  let totalConcluido = 0, totalEmAndamento = 0, totalNaoIniciado = 0, totalTrocas = 0;
  let totalIndisponibilidadeTecnicaWpp = 0; // CORRIGIDO: Só manutenções técnicas
  
  var equipesPorTipo = {};
  equipes.forEach((eq) => {
    var tipoParaAgrupamento = mapTipoEquipe(getField(eq, 'Tipo_Equipe', 'tipo', 'Desconhecido'));
    if (!equipesPorTipo[tipoParaAgrupamento]) equipesPorTipo[tipoParaAgrupamento] = [];
    equipesPorTipo[tipoParaAgrupamento].push(eq);

    const status = getField(eq, 'StatusAtividade', 'statusAtividade', 'Concluído');
    if (status === 'Concluído') totalConcluido++; 
    else if (status.toLowerCase().includes('andamento')) totalEmAndamento++; 
    else totalNaoIniciado++;
    
    if (getField(eq, 'Troca_Equipamento', 'trocaEquipamento') === 'Sim') {
      totalTrocas++;
      
      // APLICAR LÓGICA CORRIGIDA DE INDISPONIBILIDADE
      var isSolicitacaoClienteWpp = false;
      const motivoNormWpp = normalizarTexto(getField(eq, 'Motivo_Troca', 'motivoTroca', ''));
      const motivoOutroNormWpp = normalizarTexto(getField(eq, 'Motivo_Outro', 'motivoOutro', ''));

      if (motivoNormWpp.includes('solicitacao') || motivoNormWpp.includes('cliente') || motivoNormWpp.includes('solicitação')) {
        isSolicitacaoClienteWpp = true;
      } else if ((motivoNormWpp.includes('outros') || motivoNormWpp.includes('defeitos')) &&
                 (motivoOutroNormWpp.includes('solicitacao') || motivoOutroNormWpp.includes('cliente') || motivoOutroNormWpp.includes('solicitação'))) {
        isSolicitacaoClienteWpp = true;
      }

      // SÓ SOMA NO TEMPO DE INDISPONIBILIDADE SE NÃO FOR SOLICITAÇÃO DO CLIENTE
      if (!isSolicitacaoClienteWpp) {
        const tempoTrocaStr = getField(eq, 'Tempo_Troca', '', '');
        if (tempoTrocaStr && !tempoTrocaStr.includes('Erro') && !tempoTrocaStr.includes('Ausente') && tempoTrocaStr !== 'N/A') {
          const matchTempo = tempoTrocaStr.match(/(\d+)h(\d+)min/);
          if (matchTempo) {
            const horasIndiv = parseInt(matchTempo[1], 10);
            const minutosIndiv = parseInt(matchTempo[2], 10);
            totalIndisponibilidadeTecnicaWpp += (horasIndiv * 60 + minutosIndiv);
          }
        }
      }
    }
  });

  const numEquipes = equipes.length || 1;
  const eficiencia = Math.round((totalConcluido / numEquipes) * 100);
  
  // Resumo executivo
  texto += `*RESUMO EXECUTIVO*` + nl;
  texto += `Equipes: ${numEquipes} | Eficiência: ${eficiencia}%` + nl;
  texto += `Status: ${totalConcluido} Concluídas, ${totalEmAndamento} Em Andamento` + nl;
  
  // EXIBIR INDISPONIBILIDADE CORRIGIDA
  if (totalIndisponibilidadeTecnicaWpp > 0) {
    const horasIndispCorr = Math.floor(totalIndisponibilidadeTecnicaWpp / 60);
    const minutosIndispCorr = totalIndisponibilidadeTecnicaWpp % 60;
    texto += `Indisponibilidade Técnica: ${horasIndispCorr}h${minutosIndispCorr < 10 ? '0' : ''}${minutosIndispCorr}min` + nl;
  }
  if (totalTrocas > 0) {
    texto += `Trocas: ${totalTrocas} registradas` + nl;
  }
  texto += nl;

  // Ordenar tipos
  const ordemTipos = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo'];
  const tiposOrdenados = Object.keys(equipesPorTipo).sort((a, b) => { 
    let idxA = ordemTipos.indexOf(a); 
    let idxB = ordemTipos.indexOf(b); 
    if(idxA===-1 && idxB===-1) return a.localeCompare(b); 
    if(idxA===-1) return 1; 
    if(idxB===-1) return -1; 
    return idxA - idxB; 
  });

  // Formatar equipes por tipo
  for (const tipoChaveGrupo of tiposOrdenados) {
    const equipesDoTipo = equipesPorTipo[tipoChaveGrupo];
    texto += `*${tipoChaveGrupo.toUpperCase()} (${equipesDoTipo.length})*` + nl + nl;
    
    equipesDoTipo.forEach(function(equipe, index) {
      const vaga = getField(equipe, 'Vaga', 'vaga'); 
      const vagaPers = getField(equipe, 'Vaga_Personalizada', 'vagaPersonalizada',''); 
      const vagaDisplay = vaga === 'OUTRA VAGA' ? vagaPers : vaga;
      const equip = getField(equipe, 'Equipamento', 'equipamento'); 
      const equipPers = getField(equipe, 'Equipamento_Personalizada', 'equipamentoPersonalizado',''); 
      const equipDisplay = equip === 'OUTRO EQUIPAMENTO' ? equipPers : equip;
      const statusAtividade = getField(equipe, 'StatusAtividade', 'statusAtividade', 'Concluído');
      const statusSymbol = statusAtividade === 'Concluído' ? '✅' : (statusAtividade.toLowerCase().includes('andamento') ? '⏳' : '❌');

      texto += `*Equipe ${index + 1}: ${getField(equipe, 'Numero_Equipe', 'numero')}* ${statusSymbol}` + nl;
      texto += `Motorista: ${getField(equipe, 'Motorista', 'motorista')}` + nl;
      texto += `Operador(es): ${getField(equipe, 'Operadores', 'operadores')}` + nl;
      texto += `Local: ${getField(equipe, 'Area', 'area')}` + nl;
      texto += `Atividade: ${getField(equipe, 'Atividade', 'atividade')}` + nl;
      
      const tipoAtividade = getField(equipe, 'TipoAtividade', 'tipoAtividade', 'Rotineira');
      texto += `Tipo: ${tipoAtividade}` + nl;
      
      let statusText = `Status: ${statusAtividade}`; 
      const pendencia = getField(equipe, 'Pendencia', 'pendencia', '');
      if (statusAtividade !== 'Concluído' && pendencia) statusText += ` (${pendencia})`;
      texto += `${statusText}` + nl;
      
      texto += `Vaga: ${vagaDisplay || 'N/A'}` + nl;
      texto += `Equipamento: ${equipDisplay || 'N/A'}` + nl;

      // TROCA COM LÓGICA CORRIGIDA
      if (getField(equipe, 'Troca_Equipamento', 'trocaEquipamento') === 'Sim') {
        // VERIFICAR SE É SOLICITAÇÃO DO CLIENTE
        var isSolicitacaoClienteTroca = false;
        const motivoTrocaWpp = getField(equipe, 'Motivo_Troca', 'motivoTroca', '');
        const motivoOutroWpp = getField(equipe, 'Motivo_Outro', 'motivoOutro', '');
        const motivoNormWppTroca = normalizarTexto(motivoTrocaWpp);
        const motivoOutroNormWppTroca = normalizarTexto(motivoOutroWpp);

        if (motivoNormWppTroca.includes('solicitacao') || motivoNormWppTroca.includes('cliente') || motivoNormWppTroca.includes('solicitação')) {
          isSolicitacaoClienteTroca = true;
        } else if ((motivoNormWppTroca.includes('outros') || motivoNormWppTroca.includes('defeitos')) &&
                   (motivoOutroNormWppTroca.includes('solicitacao') || motivoOutroNormWppTroca.includes('cliente') || motivoOutroNormWppTroca.includes('solicitação'))) {
          isSolicitacaoClienteTroca = true;
        }

        texto += `⚠️ *TROCA EQUIPAMENTO*` + nl;
        
        if (isSolicitacaoClienteTroca) {
          texto += `Tipo: SOLICITAÇÃO CLIENTE (não conta indisponibilidade)` + nl;
        } else {
          texto += `Tipo: MANUTENÇÃO TÉCNICA` + nl;
        }
        
        let motivoDisplay = (motivoTrocaWpp === 'Outros Motivos (Justificar)' || motivoTrocaWpp === 'Defeitos Em Geral (Justificar)') ? motivoOutroWpp : motivoTrocaWpp;
        texto += `Motivo: ${motivoDisplay || 'N/A'}` + nl;
        
        const placa = getField(equipe, 'Placa_Nova', 'placaNova', ''); 
        if (placa !== 'N/A') texto += `Novo: ${placa}` + nl;
        
        // Exibir tempo apenas se não for solicitação do cliente
        if (!isSolicitacaoClienteTroca) {
          const inicioT = getField(equipe, 'Data_Hora_Troca', 'dataHoraTroca', ''); 
          if (inicioT !== 'N/A') texto += `Início: ${formatarDataHora(inicioT)}` + nl;
          const fimT = getField(equipe, 'Data_Hora_Fim_Troca', 'dataHoraFimTroca', ''); 
          if (fimT !== 'N/A') texto += `Fim: ${formatarDataHora(fimT)}` + nl;
          const tempoT = getField(equipe, 'Tempo_Troca', '', '');
          if (tempoT && !tempoT.includes('Erro') && !tempoT.includes('Ausente') && tempoT !== 'N/A') {
            texto += `Tempo Indisponibilidade: ${tempoT}` + nl;
          } else if (inicioT !== 'N/A' && fimT !== 'N/A') {
            try { 
              const inicio = new Date(inicioT); 
              const fim = new Date(fimT); 
              if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime()) && fim > inicio) { 
                const dM = Math.round((fim-inicio)/60000); 
                const h = Math.floor(dM/60); 
                const m = dM%60; 
                texto += `Tempo Indisponibilidade: ${h}h${m<10?'0':''}${m}min`+nl; 
              } 
            } catch(e){}
          }
        }
      }

      // Observações
      const obs = getField(equipe, 'Observacoes', 'observacoes', ''); 
      if (obs !== 'N/A') texto += `Obs: ${obs}` + nl;

      texto += nl; // Espaço entre equipes
    });
  }

  // Rodapé
  texto += `*Sistema de Relatório de Turno v${VERSAO_APP}*`;

  registrarAuditoria('Sistema', 'Formatação WhatsApp Corrigida', 'ID: ' + (dadosTurno.ID || 'N/A'));
  return texto;
}

// ========================================================================
// Funções Auxiliares e Outras APIs (continuação do código anterior)
// ========================================================================

/**
 * Pesquisa relatórios na planilha com base em termo e tipo.
 */
function pesquisarRelatorios(termo, tipo) {
  try {
    var planilha = obterPlanilha();
    var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS);
    if (!abaDados) throw new Error("Aba 'Dados' não encontrada para pesquisa.");

    var dadosValores = abaDados.getDataRange().getValues();
    if (dadosValores.length < 2) return { success: true, resultados: [] };

    var cabecalhos = dadosValores.shift();
    const getIndex = (nome) => cabecalhos.indexOf(nome);
    var idIndex = getIndex('ID'); 
    var dataIndex = getIndex('Data'); 
    var horarioIndex = getIndex('Horário');
    var letraIndex = getIndex('Letra'); 
    var supervisorIndex = getIndex('Supervisor'); 
    var statusIndex = getIndex('Status');
    
    if ([idIndex, dataIndex, horarioIndex, letraIndex, supervisorIndex].some(i=>i===-1)) {
      return { success: false, message: "Estrutura da planilha 'Dados' incorreta." };
    }

    var resultados = []; 
    var termoLower = termo.toLowerCase();

    for (const linha of dadosValores) {
      if (statusIndex !== -1 && linha[statusIndex] === 'Arquivado' && tipo !== 'id_especifico' && tipo !== 'geral') continue;
      var match = false; 
      const checkMatch = (valor) => valor && String(valor).toLowerCase().includes(termoLower);

      switch (tipo) {
        case 'id_especifico': 
        case 'geral':
          if (linha[idIndex] === termo) { 
            match = true; 
          } else if (tipo === 'geral') {
             if (checkMatch(formatarData(linha[dataIndex]))) match = true;
             else if (checkMatch(linha[horarioIndex])) match = true;
             else if (checkMatch(linha[letraIndex])) match = true;
             else if (checkMatch(linha[supervisorIndex])) match = true;
          }
          break;
        case 'data':
          var dataPlanilha = linha[dataIndex]; 
          var dataFormatada = dataPlanilha instanceof Date ? Utilities.formatDate(dataPlanilha, "UTC", 'yyyy-MM-dd') : String(dataPlanilha);
          match = dataFormatada === termo; 
          break;
        case 'mes_ano':
          var dataPlanilha = linha[dataIndex];
          if (dataPlanilha instanceof Date) { 
            var mesAnoPlanilha = Utilities.formatDate(dataPlanilha, "UTC", 'MM/yyyy'); 
            match = mesAnoPlanilha === termo; 
          } 
          break;
        case 'supervisor': 
          match = checkMatch(linha[supervisorIndex]); 
          break;
        case 'letra': 
          match = linha[letraIndex] && linha[letraIndex].toString().toLowerCase() === termoLower; 
          break;
      }

      if (match) {
        resultados.push({
          id: linha[idIndex], 
          data: formatarData(linha[dataIndex]), 
          horario: linha[horarioIndex],
          letra: linha[letraIndex], 
          supervisor: linha[supervisorIndex],
          status: statusIndex !== -1 ? linha[statusIndex] : 'Ativo', 
          origem: 'servidor'
        });
      }
    }
    
    resultados.sort((a, b) => { 
      let dateA, dateB; 
      try { dateA = a.data.split('/').reverse().join('-'); } catch(e){ dateA = ''; } 
      try { dateB = b.data.split('/').reverse().join('-'); } catch(e){ dateB = ''; } 
      return dateB.localeCompare(dateA); 
    });

    registrarAuditoria('Sistema', 'Pesquisa Relatórios', `Termo: ${termo}, Tipo: ${tipo}, Resultados: ${resultados.length}`);
    return { success: true, resultados: resultados };
  } catch (e) {
    Logger.log("Erro na pesquisa de relatórios: " + e.message + " Stack: " + e.stack);
    return { success: false, message: "Erro interno ao pesquisar relatórios: " + e.message };
  }
}

/**
 * Arquiva um relatório alterando seu status.
 */
function arquivarRelatorio(turnoId) {
 try {
   if (!turnoId) return { success: false, message: 'ID do relatório não fornecido para arquivamento.' };
   var planilha = obterPlanilha(); 
   var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS);
   if (!abaDados) throw new Error("Aba 'Dados' não encontrada.");
   
   var dadosRange = abaDados.getDataRange(); 
   var dadosValores = dadosRange.getValues();
   if (dadosValores.length < 2) return { success: false, message: 'Nenhum dado encontrado para arquivar.' };
   
   var cabecalhos = dadosValores[0]; 
   var idIndex = cabecalhos.indexOf('ID'); 
   var statusIndex = cabecalhos.indexOf('Status'); 
   var ultimaModifIndex = cabecalhos.indexOf('UltimaModificacao');
   if (idIndex === -1 || statusIndex === -1) throw new Error("Colunas 'ID' ou 'Status' não encontradas.");
   
   var rowIndex = -1;
   for (var i = 1; i < dadosValores.length; i++) { 
     if (dadosValores[i][idIndex] === turnoId) { 
       rowIndex = i + 1; 
       break; 
     } 
   }
   if (rowIndex === -1) return { success: false, message: 'Relatório não encontrado: ' + turnoId };
   
   abaDados.getRange(rowIndex, statusIndex + 1).setValue('Arquivado');
   if (ultimaModifIndex !== -1) abaDados.getRange(rowIndex, ultimaModifIndex + 1).setValue(new Date());
   
   registrarAuditoria('Sistema', 'Arquivar Relatório', 'ID: ' + turnoId);
   return { success: true, message: 'Relatório arquivado com sucesso.' };
 } catch (error) {
   Logger.log('Erro ao arquivar relatório: ' + error.message + " Stack: " + error.stack);
   return { success: false, message: 'Erro ao arquivar relatório: ' + error.message };
 }
}

/**
 * Obtém dados agregados para o dashboard.
 */
function obterDadosDashboard() {
  try {
    var planilha = obterPlanilha(); 
    var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS); 
    var abaEquipes = planilha.getSheetByName(NOME_PLANILHA_EQUIPES);
    if (!abaDados || !abaEquipes) throw new Error("Abas 'Dados' ou 'Equipes' não encontradas.");

    var dadosValores = abaDados.getDataRange().getValues();
    if (dadosValores.length < 2) return { success: true, message: "Sem dados suficientes.", ...getEmptyDashboardData() };
    
    var cabecalhosDados = dadosValores.shift();
    var indicesDados = { 
      id: cabecalhosDados.indexOf('ID'), 
      ts: cabecalhosDados.indexOf('Timestamp'), 
      st: cabecalhosDados.indexOf('Status'), 
      sup: cabecalhosDados.indexOf('Supervisor'), 
      data: cabecalhosDados.indexOf('Data'), 
      hora: cabecalhosDados.indexOf('Horário'), 
      letra: cabecalhosDados.indexOf('Letra') 
    };
    if ([indicesDados.id, indicesDados.ts].some(i=>i===-1)) throw new Error("Colunas 'ID' ou 'Timestamp' ausentes em 'Dados'.");

    var dadosFiltrados = dadosValores.filter(linha => indicesDados.st === -1 || linha[indicesDados.st] !== 'Arquivado');
    dadosFiltrados.sort((a, b) => (b[indicesDados.ts] instanceof Date ? b[indicesDados.ts].getTime() : 0) - (a[indicesDados.ts] instanceof Date ? a[indicesDados.ts].getTime() : 0));
    var relatoriosRecentes = dadosFiltrados.slice(0, MAX_RELATORIOS_DASHBOARD); 
    var idsRelatoriosRecentes = relatoriosRecentes.map(linha => linha[indicesDados.id]);

    var equipesValores = abaEquipes.getDataRange().getValues();
    if (equipesValores.length < 2) return { success: true, message: "Sem dados de equipes.", ...getEmptyDashboardData() };
    
    var cabecalhosEquipes = equipesValores.shift();
    var indicesEquipes = { 
      tId: cabecalhosEquipes.indexOf('Turno_ID'), 
      eq: cabecalhosEquipes.indexOf('Equipamento'), 
      eqP: cabecalhosEquipes.indexOf('Equipamento_Personalizada'), 
      area: cabecalhosEquipes.indexOf('Area'), 
      tr: cabecalhosEquipes.indexOf('Troca_Equipamento'), 
      mTr: cabecalhosEquipes.indexOf('Motivo_Troca'), 
      mO: cabecalhosEquipes.indexOf('Motivo_Outro'), 
      stA: cabecalhosEquipes.indexOf('StatusAtividade') 
    };
    if ([indicesEquipes.tId, indicesEquipes.eq, indicesEquipes.area, indicesEquipes.tr].some(i => i === -1)) {
      throw new Error("Colunas essenciais ausentes em 'Equipes'.");
    }
    if (indicesEquipes.stA === -1) Logger.log("AVISO Dashboard: Coluna 'StatusAtividade' não encontrada.");

    var equipesRelevantes = equipesValores.filter(linha => idsRelatoriosRecentes.includes(linha[indicesEquipes.tId]));
    var contagemEquipamentos = new Map(), contagemAreas = new Map(), contagemMotivosTroca = new Map(), totalTrocas = 0;
    let countStatusConcluido = 0, countStatusEmAndamento = 0, countStatusNaoIniciado = 0;

    equipesRelevantes.forEach(linha => {
      var equip = linha[indicesEquipes.eq]; 
      if (equip === 'OUTRO EQUIPAMENTO' && indicesEquipes.eqP !== -1 && linha[indicesEquipes.eqP]) { 
        equip = linha[indicesEquipes.eqP]; 
      } 
      if (equip && equip !== 'N/A') contagemEquipamentos.set(equip, (contagemEquipamentos.get(equip) || 0) + 1);
      
      var area = linha[indicesEquipes.area]; 
      if (area && area !== 'N/A') contagemAreas.set(area, (contagemAreas.get(area) || 0) + 1);
      
      if (linha[indicesEquipes.tr] === 'Sim') { 
        totalTrocas++; 
        if (indicesEquipes.mTr !== -1) { 
          var motivo = linha[indicesEquipes.mTr]; 
          if ((motivo === "Outros Motivos (Justificar)" || motivo === "Defeitos Em Geral (Justificar)") && indicesEquipes.mO !== -1 && linha[indicesEquipes.mO]) {
            motivo = linha[indicesEquipes.mO]; 
          }
          if (motivo) contagemMotivosTroca.set(motivo, (contagemMotivosTroca.get(motivo) || 0) + 1); 
        } 
      }
      
      if (indicesEquipes.stA !== -1) { 
        const status = linha[indicesEquipes.stA] ? String(linha[indicesEquipes.stA]).trim() : 'Concluído'; 
        if (status === 'Concluído') countStatusConcluido++; 
        else if (status.toLowerCase() === 'em andamento') countStatusEmAndamento++; 
        else if (status) countStatusNaoIniciado++; 
        else countStatusConcluido++; 
      }
    });

    const topN = (map, keyName, limit = 5) => Array.from(map.entries()).map(([item, quantidade]) => ({ [keyName]: item, quantidade })).sort((a, b) => b.quantidade - a.quantidade).slice(0, limit);
    var ultimosRelatorios = relatoriosRecentes.slice(0, 5).map(linha => ({ 
      id: linha[indicesDados.id], 
      data: formatarData(linha[indicesDados.data]), 
      horario: linha[indicesDados.hora], 
      letra: linha[indicesDados.letra], 
      supervisor: linha[indicesDados.sup], 
      totalEquipes: equipesRelevantes.filter(eqLinha => eqLinha[indicesEquipes.tId] === linha[indicesDados.id]).length, 
      origem: 'servidor' 
    }));
    
    var supervisionamentoPorSupervisor = {}; 
    if (indicesDados.sup !== -1) { 
      relatoriosRecentes.forEach(linha => { 
        var supervisor = linha[indicesDados.sup]; 
        if(supervisor) { 
          if(!supervisionamentoPorSupervisor[supervisor]) supervisionamentoPorSupervisor[supervisor] = { totalRelatorios: 0, totalEquipes: 0}; 
          supervisionamentoPorSupervisor[supervisor].totalRelatorios++; 
          supervisionamentoPorSupervisor[supervisor].totalEquipes += equipesRelevantes.filter(eqLinha => eqLinha[indicesEquipes.tId] === linha[indicesDados.id]).length; 
        } 
      }); 
    }

    registrarAuditoria('Sistema', 'Consulta Dashboard');
    return {
      success: true,
      estatisticasGerais: { 
        totalRelatorios: relatoriosRecentes.length, 
        totalEquipes: equipesRelevantes.length, 
        totalTrocas: totalTrocas, 
        totalAreas: contagemAreas.size 
      },
      dadosStatus: { 
        concluido: countStatusConcluido, 
        emAndamento: countStatusEmAndamento, 
        naoIniciado: countStatusNaoIniciado 
      },
      equipamentos: topN(contagemEquipamentos, 'equipamento'), 
      areas: topN(contagemAreas, 'area'), 
      motivos: topN(contagemMotivosTroca, 'motivo', 6),
      supervisores: supervisionamentoPorSupervisor, 
      ultimosRelatorios: ultimosRelatorios
    };
  } catch (error) {
    Logger.log("Erro ao obter dados do dashboard: " + error.message + " Stack: " + error.stack);
    const emptyData = getEmptyDashboardData(); 
    return { success: false, message: "Erro ao calcular estatísticas: " + error.message, ...emptyData };
  }
}

/**
 * Atualizar estatísticas na aba específica
 */
function atualizarEstatisticas() {
 try {
   var planilha = obterPlanilha(); 
   var abaEstatisticas = planilha.getSheetByName(NOME_PLANILHA_ESTATISTICAS);
   if (!abaEstatisticas) return { success: false, message: 'Aba Estatísticas não encontrada' };

   var dashboard = obterDadosDashboard();
   if (!dashboard.success) return dashboard;

   var hoje = new Date(); 
   var periodoFim = Utilities.formatDate(hoje, Session.getScriptTimeZone(), 'dd/MM/yyyy');
   var diasPeriodo = 30; 
   var periodoInicio = Utilities.formatDate(new Date(hoje.getTime() - diasPeriodo * 24 * 60 * 60 * 1000), Session.getScriptTimeZone(), 'dd/MM/yyyy');
   var periodo = periodoInicio + ' a ' + periodoFim;

   ['A6:C6', 'A9:B11', 'A15:C19', 'A25:C29', 'A35:C39', 'B43'].forEach(range => abaEstatisticas.getRange(range).clearContent());

   abaEstatisticas.getRange('A6:C6').setValues([[periodo, dashboard.estatisticasGerais.totalRelatorios, dashboard.estatisticasGerais.totalEquipes]]);
   if (dashboard.dadosStatus) {
       abaEstatisticas.getRange('B9').setValue(dashboard.dadosStatus.concluido || 0);
       abaEstatisticas.getRange('B10').setValue(dashboard.dadosStatus.emAndamento || 0);
       abaEstatisticas.getRange('B11').setValue(dashboard.dadosStatus.naoIniciado || 0);
   }
   
   const formatPercent = (count, total) => total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0.0%';
   if (dashboard.equipamentos?.length > 0) abaEstatisticas.getRange(15, 1, dashboard.equipamentos.length, 3).setValues(dashboard.equipamentos.map(i => [i.equipamento, i.quantidade, formatPercent(i.quantidade, dashboard.estatisticasGerais.totalEquipes)]));
   if (dashboard.areas?.length > 0) abaEstatisticas.getRange(25, 1, dashboard.areas.length, 3).setValues(dashboard.areas.map(i => [i.area, i.quantidade, formatPercent(i.quantidade, dashboard.estatisticasGerais.totalEquipes)]));
   if (dashboard.motivos?.length > 0) abaEstatisticas.getRange(35, 1, dashboard.motivos.length, 3).setValues(dashboard.motivos.map(i => [i.motivo, i.quantidade, formatPercent(i.quantidade, dashboard.estatisticasGerais.totalTrocas)]));
   abaEstatisticas.getRange('B43').setValue(Utilities.formatDate(hoje, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'));

   registrarAuditoria('Sistema', 'Estatísticas Atualizadas');
   return { success: true, message: 'Estatísticas atualizadas com sucesso.', ...dashboard };
 } catch (error) {
   Logger.log("Erro ao atualizar estatísticas: " + error.message + " Stack: " + error.stack);
   return { success: false, message: "Erro ao atualizar estatísticas: " + error.message };
 }
}

/**
 * Função para gerar relatório de equipamentos
 */
function gerarRelatorioEquipamentos() {
 try {
   var planilha = obterPlanilha(); 
   var abaEquipes = planilha.getSheetByName(NOME_PLANILHA_EQUIPES); 
   var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS);
   if (!abaEquipes || !abaDados) return { success: false, message: "Abas necessárias não encontradas." };
   
   var equipesValores = abaEquipes.getDataRange().getValues(); 
   var dadosValores = abaDados.getDataRange().getValues();
   if (equipesValores.length < 2 || dadosValores.length < 2) return { success: true, message: "Sem dados suficientes.", tiposEquipamentos: [] };
   
   registrarAuditoria('Sistema', 'Relatório de Equipamentos'); 
   return { success: true, message: "Relatório de equipamentos gerado." };
 } catch (error) { 
   Logger.log("Erro ao gerar relatório de equipamentos: " + error.message + " Stack: " + error.stack); 
   return { success: false, message: "Erro ao gerar relatório de equipamentos: " + error.message }; 
 }
}

/**
 * Função para gerar relatório de áreas
 */
function gerarRelatorioAreas() {
 try {
   var planilha = obterPlanilha(); 
   var abaEquipes = planilha.getSheetByName(NOME_PLANILHA_EQUIPES); 
   var abaDados = planilha.getSheetByName(NOME_PLANILHA_DADOS);
   if (!abaEquipes || !abaDados) return { success: false, message: "Abas necessárias não encontradas." };
   
   registrarAuditoria('Sistema', 'Relatório de Áreas'); 
   return { success: true, message: "Relatório de áreas gerado." };
 } catch (error) { 
   Logger.log("Erro ao gerar relatório de áreas: " + error.message + " Stack: " + error.stack); 
   return { success: false, message: "Erro ao gerar relatório de áreas: " + error.message }; 
 }
}

/**
 * Obtém histórico de um equipamento específico
 */
function obterHistoricoEquipamento(equipamento) {
 try {
   if (!equipamento) return { success: false, message: 'Equipamento não especificado.' };
   registrarAuditoria('Sistema', 'Histórico Equipamento', 'Equipamento: ' + equipamento);
   return { success: true, equipamento: equipamento, estatisticas: { totalUtilizacoes: 0, totalTrocas: 0, percentualTrocas: '0%', areas: [], motivos: [] }, utilizacoes: [] };
 } catch (error) { 
   Logger.log("Erro ao obter histórico do equipamento: " + error.message + " Stack: " + error.stack); 
   return { success: false, message: "Erro ao obter histórico do equipamento: " + error.message }; 
 }
}

/** Retorna estrutura vazia para o dashboard em caso de erro ou falta de dados */
function getEmptyDashboardData() {
 return {
   estatisticasGerais: { totalRelatorios: 0, totalEquipes: 0, totalTrocas: 0, totalAreas: 0 },
   dadosStatus: { concluido: 0, emAndamento: 0, naoIniciado: 0 },
   equipamentos: [], areas: [], motivos: [], supervisores: {}, ultimosRelatorios: []
 };
}

// ========================================================================
// Funções Utilitárias
// ========================================================================

/** Formatar data (DD/MM/YYYY) */
function formatarData(dataInput) {
  if (!dataInput) return 'N/A';
  try {
    let dataObj;
    const dataStr = String(dataInput);
    if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
      const parts = dataStr.substring(0, 10).split('-');
      dataObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    } else if (dataInput instanceof Date) {
        dataObj = dataInput;
    } else {
      dataObj = new Date(dataStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
       if (isNaN(dataObj.getTime())) dataObj = new Date(dataStr);
    }

    if (isNaN(dataObj.getTime())) return String(dataInput);

    const dia = String(dataObj.getUTCDate()).padStart(2, '0');
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
    const ano = dataObj.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (e) { 
    console.error("Erro formatarData:", dataInput, e); 
    return String(dataInput); 
  }
}

/** Formatar data e hora (DD/MM/YYYY HH:mm) */
function formatarDataHora(dataHoraInput) {
  if (!dataHoraInput) return 'N/A';
  try {
    let dataObj; 
    if (dataHoraInput instanceof Date) dataObj = dataHoraInput; 
    else dataObj = new Date(dataHoraInput);
    if (isNaN(dataObj.getTime())) return String(dataHoraInput);

    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    const hora = String(dataObj.getHours()).padStart(2, '0');
    const minutos = String(dataObj.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
  } catch (e) { 
    console.error("Erro formatarDataHora:", dataHoraInput, e); 
    return String(dataHoraInput); 
  }
}

// ========================================================================
// Função Include (Manter se usada em outros lugares ou HTML)
// ========================================================================
function include(filename) {
 return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ========================================================================
// FUNÇÃO DE MIGRAÇÃO - EXECUTAR APENAS UMA VEZ SE NECESSÁRIO
// ========================================================================

/**
 * FUNÇÃO DE MIGRAÇÃO ÚNICA - ATUALIZADA:
 * Corrige os valores antigos de 'Tipo_Equipe' na planilha 'Equipes'.
 * Adiciona as colunas 'Data_Hora_Fim_Troca' e 'Tempo_Troca' se não existirem.
 */
function migrarEstruturaETiposEquipe() {
  try {
    const planilha = obterPlanilha();
    const abaEquipes = planilha.getSheetByName(NOME_PLANILHA_EQUIPES);
    if (!abaEquipes) {
      Logger.log("ERRO: Aba Equipes não encontrada para migração.");
      SpreadsheetApp.getUi().alert("ERRO: Aba Equipes não encontrada para migração.");
      return;
    }

    const range = abaEquipes.getDataRange();
    const values = range.getValues();
    const cabecalhos = values[0];

    // Adicionar Novas Colunas se Necessário
    let colunasAdicionadas = false;
    const colunasNecessarias = ['Data_Hora_Fim_Troca', 'Tempo_Troca'];
    const ultimaColuna = cabecalhos.length;
    let colunasParaAdicionar = [];

    colunasNecessarias.forEach(colNome => {
        if (cabecalhos.indexOf(colNome) === -1) {
            colunasParaAdicionar.push(colNome);
        }
    });

    if (colunasParaAdicionar.length > 0) {
        abaEquipes.insertColumnsAfter(ultimaColuna, colunasParaAdicionar.length);
        abaEquipes.getRange(1, ultimaColuna + 1, 1, colunasParaAdicionar.length)
                  .setValues([colunasParaAdicionar])
                  .setFontWeight('bold')
                  .setBackground('#E8F0FE')
                  .setHorizontalAlignment('center');
        Logger.log(`Colunas adicionadas: ${colunasParaAdicionar.join(', ')}`);
        colunasAdicionadas = true;
        SpreadsheetApp.flush();
    }

    // Migrar Tipos de Equipe
    const tipoIndex = cabecalhos.indexOf('Tipo_Equipe');
    if (tipoIndex === -1) {
      Logger.log("ERRO: Coluna 'Tipo_Equipe' não encontrada na aba Equipes.");
       SpreadsheetApp.getUi().alert("ERRO: Coluna 'Tipo_Equipe' não encontrada na aba Equipes.");
       if (colunasAdicionadas) SpreadsheetApp.getUi().alert("Novas colunas de tempo foram adicionadas, mas a migração de tipos falhou.");
       return;
    }

    let changesMadeTipos = 0;
    const tipoPadraoVacuo = 'Auto Vácuo / Hiper Vácuo';
    const valoresAntigosNormalizados = ['hiper vácuo', 'hiper vacuo', 'vácuo', 'vacuo', 'auto vácuo'];
    const dadosParaAtualizar = [];

    for (let i = 1; i < values.length; i++) {
      const tipoAtual = values[i][tipoIndex];
      if (tipoAtual !== null && tipoAtual !== undefined) {
          const tipoNormalizado = String(tipoAtual).trim().toLowerCase();
          if (valoresAntigosNormalizados.includes(tipoNormalizado) && tipoAtual !== tipoPadraoVacuo) {
             dadosParaAtualizar.push([i + 1, tipoIndex + 1, tipoPadraoVacuo]);
             changesMadeTipos++;
          }
      }
    }

    if (changesMadeTipos > 0) {
        dadosParaAtualizar.forEach(update => {
            abaEquipes.getRange(update[0], update[1]).setValue(update[2]);
        });
        SpreadsheetApp.flush();
        Logger.log(`Migração de Tipos de Equipe concluída. ${changesMadeTipos} registros atualizados para '${tipoPadraoVacuo}'.`);
    } else {
        Logger.log("Migração de Tipos de Equipe: Nenhum registro precisou de atualização.");
    }

    let msgFinal = "";
    if (colunasAdicionadas) msgFinal += `Colunas ${colunasParaAdicionar.join(', ')} adicionadas. `;
    if (changesMadeTipos > 0) msgFinal += `${changesMadeTipos} tipos de equipe foram atualizados.`;
    else if (colunasAdicionadas) msgFinal += "Nenhum tipo de equipe precisou ser atualizado.";
    else msgFinal = "Nenhuma alteração na estrutura ou tipos de equipe foi necessária.";

    SpreadsheetApp.getUi().alert(msgFinal);

  } catch (error) {
    Logger.log("ERRO CRÍTICO durante a migração: " + error.message + " Stack: " + error.stack);
    SpreadsheetApp.getUi().alert("ERRO CRÍTICO durante a migração: " + error.message);
  }
}
