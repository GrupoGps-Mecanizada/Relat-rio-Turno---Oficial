// Configurações do sistema - Versão melhorada usando IIFE
(function() {
  // Inicializar window.CONFIG se ainda não existir
  window.CONFIG = window.CONFIG || {};
  
  // Definir propriedades individualmente para melhor controle
  window.CONFIG.VERSAO_APP = '3.0';
  window.CONFIG.API_URL = 'https://script.google.com/macros/s/AKfycbxIPVcbA7D1WfpDDyUmnACeh5xTxPUUOEtHQlgx-lG8QG_FX7iC1BEwSQUwnxWhcxk3/exec';
  window.CONFIG.PLANILHA_ID = '1AyDfxSAFCmAqw512xSMCwXrIMj2JDryhjoySFGmkLvI';
  window.CONFIG.API_KEY = 'AIzaSyCi8G96eC3Ok9PLimQJ0OqVEe3-rJgWGaM';
  window.CONFIG.AUTH_REQUIRED = false;
  window.CONFIG.GOOGLE_CLIENT_ID = '';
  window.CONFIG.NOME_PLANILHA_DADOS = 'Dados';
  window.CONFIG.NOME_PLANILHA_EQUIPES = 'Equipes';
  window.CONFIG.NOME_PLANILHA_CONFIGURACOES = 'Configurações';
  window.CONFIG.CACHE_DURATION = 30;
  window.CONFIG.DEFAULT_THEME = 'light';
  
  // Certificar que todas as opções do formulário estão definidas
  window.CONFIG.OPCOES_FORMULARIO = {
    opcoesHorario: ['06:50 às 18:40', '18:40 às 06:50', 'ADM'],
    opcoesLetra: ['A', 'B', 'C', 'D'],
    opcoesSupervisor: ['Israel', 'Ozias', 'Wellison', 'Matozalém'],
    opcoesNumeroEquipe: Array.from({length: 15}, (_, i) => `Equipe ${i + 1}`),
    vagasAltaPressao: [
      'CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS',
      'CAMINHÃO ALTA PRESSÃO - GPS - 02',
      'CAMINHÃO ALTA PRESSÃO - GPS - 03',
      'CAMINHÃO ALTA PRESSÃO - GPS - 04',
      'CAMINHÃO ALTA PRESSÃO - GPS - 05',
      'CAMINHÃO ALTA PRESSÃO - GPS - 06',
      'CAMINHÃO ALTA PRESSÃO - GPS - 07',
      'CAMINHÃO ALTA PRESSÃO - GPS - 08 - 24 HS',
      'CAMINHÃO ALTA PRESSÃO - GPS - 09',
      'CAMINHÃO ALTA PRESSÃO - GPS - 10',
      'CAMINHÃO ALTA PRESSÃO - GPS - 11',
      'CAMINHÃO ALTA PRESSÃO - GPS - 12',
      'OUTRA VAGA'
    ],
    equipamentosAltaPressao: [
      'PUB-2G02', 'LUX-3201', 'FLX7617', 'EZS-8765', 'EZS-8764',
      'EVK-0291', 'EOF-5C06', 'EOF-5208', 'EGC-2989', 'EGC-2985',
      'EGC-2983', 'EGC-2978', 'EAM-3262', 'EAM-3256', 'EAM-3255',
      'EAM-3253', 'EAM-3010', 'DSY-6475', 'DSY-6474', 'DSY-6472',
      'CZC-0453', 'OUTRO EQUIPAMENTO'
    ],
    vagasVacuo: [
      'CAMINHÃO AUTO VÁCUO - GPS - 01 - 16 HS',
      'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS',
      'CAMINHÃO AUTO VÁCUO - GPS - 03',
      'CAMINHÃO AUTO VÁCUO - GPS - 04',
      'CAMINHÃO AUTO VÁCUO - GPS - 05',
      'CAMINHÃO AUTO VÁCUO - GPS - 06',
      'CAMINHÃO AUTO VÁCUO - GPS - 07',
      'CAMINHÃO AUTO VÁCUO - GPS - 08 - 24 HS',
      'CAMINHÃO AUTO VÁCUO - GPS - 09',
      'CAMINHÃO AUTO VÁCUO - GPS - 10',
      'CAMINHÃO HIPER VÁCUO - GPS - 1',
      'CAMINHÃO HIPER VÁCUO - GPS - 2',
      'OUTRA VAGA'
    ],
    equipamentosVacuo: [
      'PUB-2F80', 'NFF-0235', 'HJS-1097', 'FSA-3D71', 'EGC-2993',
      'EGC-2979', 'EAM-3257', 'EAM-3251', 'DYB-7210', 'DSY-6577',
      'DSY-6473', 'CUB-0763', 'ANF-2676', 'FTW-4D99', 'FTD-6368',
      'FMD-2200', 'FHD-9264', 'EZS-9753', 'OUTRO EQUIPAMENTO'
    ],
    opcoesLances: ['N/A', ...Array.from({length: 15}, (_, i) => `${i + 1}`), 'Mais de 15'],
    opcoesCadeadosPlaquetas: ['N/A', 'Em Falta', ...Array.from({length: 30}, (_, i) => `${i + 1}`), 'Mais de 30'],
    opcoesMangotes: [
      'N/A',
      '10 metros',
      '20 metros',
      '30 metros',
      '40 metros',
      '50 metros',
      '60 metros',
      '70 metros',
      '80 metros',
      '90 metros',
      '100 metros',
      'Mais de 100 metros'
    ]
  };
  
  // Log de depuração
  console.log('DEBUG: config.js executado. window.CONFIG é:', window.CONFIG);
  console.log('DEBUG: config.js executado. API_URL é:', window.CONFIG.API_URL);
  
  // Exportar CONFIG para compatibilidade com scripts que usam CONFIG diretamente
  window.CONFIG = window.CONFIG;
})();
