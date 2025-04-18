// Variáveis globais para a API
let sheetsAPI = null;
let isAPILoaded = false;

/**
 * Inicializa a API do Google Sheets
 */
function inicializarSheetsAPI() {
  return new Promise((resolve, reject) => {
    gapi.load('client', () => {
      gapi.client.init({
        apiKey: CONFIG.API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      }).then(() => {
        sheetsAPI = gapi.client.sheets;
        isAPILoaded = true;
        console.log('Google Sheets API inicializada com sucesso');
        resolve();
      }).catch(error => {
        console.error('Erro ao inicializar Google Sheets API:', error);
        reject(error);
      });
    });
  });
}

/**
 * Verifica se a planilha existe e cria se necessário
 */
async function verificarPlanilha() {
  try {
    // Verificar se consegue acessar a planilha
    await sheetsAPI.spreadsheets.get({
      spreadsheetId: CONFIG.PLANILHA_ID
    });
    console.log('Planilha encontrada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao acessar planilha:', error);
    alert('Não foi possível acessar a planilha. Verifique se o ID está correto e se você tem permissão de acesso.');
    return false;
  }
}

/**
 * Salva os dados de um turno na planilha
 */
async function salvarTurnoAPI(dadosTurno, equipes) {
  try {
    mostrarLoading('Salvando relatório...');
    
    // Verificar se a API está carregada
    if (!isAPILoaded) {
      await inicializarSheetsAPI();
    }
    
    // Verificar acesso à planilha
    const planilhaOK = await verificarPlanilha();
    if (!planilhaOK) {
      ocultarLoading();
      return { success: false, message: 'Erro ao acessar a planilha' };
    }
    
    // Gerar ID único para o turno
    const id = gerarUUID();
    
    // Preparar dados do turno
    const dadosTurnoArray = [
      id,
      dadosTurno.data,
      dadosTurno.horario,
      dadosTurno.letra,
      dadosTurno.supervisor,
      new Date().toISOString(),
      'Ativo',
      new Date().toISOString() // UltimaModificacao
    ];
    
    // Adicionar dados do turno na planilha
    await sheetsAPI.spreadsheets.values.append({
      spreadsheetId: CONFIG.PLANILHA_ID,
      range: `${CONFIG.NOME_PLANILHA_DADOS}!A:H`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [dadosTurnoArray]
      }
    });
    
    // Preparar dados das equipes
    const equipesPlanilha = equipes.map(equipe => {
      // Transformar dados da equipe no formato para a planilha
      // Este é o mesmo formato usado no código Apps Script original
      return [
        id, // ID do turno (chave estrangeira)
        equipe.tipo,
        equipe.numero,
        equipe.integrantes,
        equipe.area,
        equipe.atividade,
        equipe.vaga,
        equipe.vagaPersonalizada || '',
        equipe.equipamento,
        equipe.equipamentoPersonalizado || '',
        equipe.trocaEquipamento,
        equipe.motivoTroca || '',
        equipe.motivoOutro || '',
        equipe.defeito || '',
        equipe.placaNova || '',
        equipe.dataHoraTroca || '',
        
        // Materiais - Alta Pressão
        equipe.tipo === 'Alta Pressão' ? (equipe.materiais?.pistola || 'N/A') : 'N/A',
        equipe.tipo === 'Alta Pressão' ? (equipe.materiais?.pistolaCanoLongo || 'N/A') : 'N/A',
        equipe.tipo === 'Alta Pressão' ? (equipe.materiais?.mangueiraTorpedo || 'N/A') : 'N/A',
        equipe.tipo === 'Alta Pressão' ? (equipe.materiais?.pedal || 'N/A') : 'N/A',
        equipe.tipo === 'Alta Pressão' ? (equipe.materiais?.varetas || 'N/A') : 'N/A',
        equipe.tipo === 'Alta Pressão' ? (equipe.materiais?.rabicho || 'N/A') : 'N/A',
        
        // Materiais - Vácuo
        equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? (equipe.materiaisVacuo?.mangotes || 'N/A') : 'N/A',
        equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? (equipe.materiaisVacuo?.reducoes || 'N/A') : 'N/A',
        
        // Quantidades - Alta Pressão
        equipe.tipo === 'Alta Pressão' ? (equipe.lancesMangueira || 'N/A') : 'N/A',
        equipe.tipo === 'Alta Pressão' ? (equipe.lancesVaretas || 'N/A') : 'N/A',
        
        // Quantidades - Vácuo (em metros)
        equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? (equipe.mangotes3Polegadas || 'N/A') : 'N/A',
        equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? (equipe.mangotes4Polegadas || 'N/A') : 'N/A',
        equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? (equipe.mangotes6Polegadas || 'N/A') : 'N/A',
        
        equipe.justificativa || '',
        equipe.caixaBloqueio || 'Não',
        equipe.cadeados || 'N/A',
        equipe.plaquetas || 'N/A',
        equipe.observacoes || ''
      ];
    });
    
    // Adicionar dados das equipes na planilha
    if (equipesPlanilha.length > 0) {
      await sheetsAPI.spreadsheets.values.append({
        spreadsheetId: CONFIG.PLANILHA_ID,
        range: `${CONFIG.NOME_PLANILHA_EQUIPES}!A:AI`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: equipesPlanilha
        }
      });
    }
    
    ocultarLoading();
    
    return {
      success: true,
      message: 'Relatório de turno salvo com sucesso!',
      relatorioId: id
    };
  } catch (error) {
    console.error('Erro ao salvar turno:', error);
    ocultarLoading();
    
    return {
      success: false,
      message: 'Erro ao salvar o relatório: ' + (error.message || 'Erro desconhecido')
    };
  }
}

/**
 * Obtém dados de um relatório específico pelo ID
 */
async function obterDadosRelatorioAPI(turnoId) {
  try {
    mostrarLoading('Carregando dados do relatório...');
    
    // Verificar se a API está carregada
    if (!isAPILoaded) {
      await inicializarSheetsAPI();
    }
    
    // Verificar acesso à planilha
    const planilhaOK = await verificarPlanilha();
    if (!planilhaOK) {
      ocultarLoading();
      return { success: false, message: 'Erro ao acessar a planilha' };
    }
    
    // Buscar dados do turno
    const responseTurno = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: CONFIG.PLANILHA_ID,
      range: `${CONFIG.NOME_PLANILHA_DADOS}!A:H`
    });
    
    const dadosValores = responseTurno.result.values || [];
    if (dadosValores.length <= 1) {
      ocultarLoading();
      return { success: false, message: 'Nenhum dado de turno encontrado' };
    }
    
    // Extrair cabeçalhos
    const cabecalhosDados = dadosValores[0];
    
    // Procurar o turno pelo ID
    let dadosTurno = null;
    for (let i = 1; i < dadosValores.length; i++) {
      if (dadosValores[i][0] === turnoId) {
        dadosTurno = {};
        for (let j = 0; j < cabecalhosDados.length; j++) {
          dadosTurno[cabecalhosDados[j]] = dadosValores[i][j];
        }
        break;
      }
    }
    
    if (!dadosTurno) {
      ocultarLoading();
      return { success: false, message: 'Turno não encontrado' };
    }
    
    // Buscar dados das equipes
    const responseEquipes = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: CONFIG.PLANILHA_ID,
      range: `${CONFIG.NOME_PLANILHA_EQUIPES}!A:AI`
    });
    
    const equipesValores = responseEquipes.result.values || [];
    if (equipesValores.length <= 1) {
      ocultarLoading();
      return { 
        success: true,
        dadosTurno: dadosTurno,
        equipes: [] 
      };
    }
    
    // Extrair cabeçalhos
    const cabecalhosEquipes = equipesValores[0];
    
    // Procurar equipes do turno
    const equipes = [];
    for (let i = 1; i < equipesValores.length; i++) {
      if (equipesValores[i][0] === turnoId) {
        const equipe = {};
        for (let j = 0; j < cabecalhosEquipes.length; j++) {
          equipe[cabecalhosEquipes[j]] = equipesValores[i][j];
        }
        equipes.push(equipe);
      }
    }
    
    ocultarLoading();
    
    return {
      success: true,
      dadosTurno: dadosTurno,
      equipes: equipes
    };
  } catch (error) {
    console.error('Erro ao obter dados do relatório:', error);
    ocultarLoading();
    
    return {
      success: false,
      message: 'Erro ao recuperar dados do relatório: ' + (error.message || 'Erro desconhecido')
    };
  }
}

/**
 * Pesquisa relatórios com base em critérios
 */
async function pesquisarRelatoriosAPI(termo, tipo) {
  try {
    mostrarLoading('Pesquisando relatórios...');
    
    // Verificar se a API está carregada
    if (!isAPILoaded) {
      await inicializarSheetsAPI();
    }
    
    // Verificar acesso à planilha
    const planilhaOK = await verificarPlanilha();
    if (!planilhaOK) {
      ocultarLoading();
      return { success: false, message: 'Erro ao acessar a planilha' };
    }
    
    // Buscar todos os dados de turnos
    const response = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: CONFIG.PLANILHA_ID,
      range: `${CONFIG.NOME_PLANILHA_DADOS}!A:H`
    });
    
    const valores = response.result.values || [];
    if (valores.length <= 1) {
      ocultarLoading();
      return { success: true, resultados: [] };
    }
    
    // Extrair cabeçalhos
    const cabecalhos = valores[0];
    
    // Índices das colunas relevantes para pesquisa
    const idIndex = cabecalhos.indexOf('ID');
    const dataIndex = cabecalhos.indexOf('Data');
    const horarioIndex = cabecalhos.indexOf('Horário');
    const letraIndex = cabecalhos.indexOf('Letra');
    const supervisorIndex = cabecalhos.indexOf('Supervisor');
    
    // Filtrar resultados com base no tipo de pesquisa
    let resultados = [];
    
    for (let i = 1; i < valores.length; i++) {
      const linha = valores[i];
      let correspondencia = false;
      
      switch (tipo) {
        case 'data':
          // Comparar datas (formato YYYY-MM-DD)
          correspondencia = linha[dataIndex] === termo;
          break;
          
        case 'mes_ano':
          // Extrair mês/ano da data (formato MM/YYYY)
          const dataParts = linha[dataIndex].split('-');
          if (dataParts.length >= 2) {
            const mesAno = `${dataParts[1]}/${dataParts[0]}`;
            correspondencia = mesAno === termo;
          }
          break;
          
        case 'supervisor':
          // Pesquisar por supervisor (case insensitive)
          correspondencia = linha[supervisorIndex].toLowerCase().includes(termo.toLowerCase());
          break;
          
        case 'letra':
          // Pesquisar por letra do turno (case insensitive)
          correspondencia = linha[letraIndex].toLowerCase() === termo.toLowerCase();
          break;
          
        case 'geral':
        default:
          // Pesquisar em todos os campos
          correspondencia = linha.some(valor => 
            valor && valor.toString().toLowerCase().includes(termo.toLowerCase())
          );
          break;
      }
      
      if (correspondencia) {
        resultados.push({
          id: linha[idIndex],
          data: formatarData(linha[dataIndex]),
          horario: linha[horarioIndex],
          letra: linha[letraIndex],
          supervisor: linha[supervisorIndex]
        });
      }
    }
    
    ocultarLoading();
    
    return {
      success: true,
      resultados: resultados
    };
  } catch (error) {
    console.error('Erro na pesquisa:', error);
    ocultarLoading();
    
    return {
      success: false,
      message: 'Erro ao pesquisar relatórios: ' + (error.message || 'Erro desconhecido')
    };
  }
}

/**
 * Gera um UUID (ID único)
 */
function gerarUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
