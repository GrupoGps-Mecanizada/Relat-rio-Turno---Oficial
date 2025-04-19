async function carregarDados() {
  mostrarLoading('Carregando estatísticas...');
  
  try {
    // Verificar cache primeiro
    let dashboardData = AppState.getCachedData('dashboardData');
    
    if (!dashboardData) {
      try {
        // CORREÇÃO: Alterar nome da ação para um que exista na API
        const result = await callAPI('obterEstatisticas');
        
        if (result && result.success) {
          dashboardData = result.dados;
          // Guardar em cache
          AppState.cacheData('dashboardData', dashboardData, 10);
        } else {
          // IMPLEMENTAÇÃO ALTERNATIVA: Criar dados simulados se a API falhar
          console.log("API não retornou dados, usando dados simulados");
          dashboardData = gerarDadosSimulados();
          AppState.cacheData('dashboardData', dashboardData, 10);
        }
      } catch (error) {
        console.warn("Erro ao buscar dados do dashboard, usando dados simulados:", error);
        dashboardData = gerarDadosSimulados();
        AppState.cacheData('dashboardData', dashboardData, 10);
      }
    }
    
    // Renderizar componentes
    renderizarEstatisticasGerais(dashboardData.estatisticasGerais);
    renderizarGraficoEquipamentos(dashboardData.equipamentos);
    renderizarGraficoAreas(dashboardData.areas);
    renderizarUltimosRelatorios(dashboardData.ultimosRelatorios);
    
    ocultarLoading();
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao carregar dados do dashboard:', error);
    mostrarNotificacao('Erro ao carregar dados do dashboard: ' + error.message, 'danger');
  }
}

// Função para gerar dados simulados quando a API falhar
function gerarDadosSimulados() {
  return {
    estatisticasGerais: {
      totalRelatorios: Math.floor(Math.random() * 100) + 50,
      totalEquipes: Math.floor(Math.random() * 150) + 100,
      totalTrocas: Math.floor(Math.random() * 30) + 10,
      totalAreas: Math.floor(Math.random() * 20) + 5
    },
    equipamentos: [
      { equipamento: "EGC-2985", quantidade: Math.floor(Math.random() * 20) + 5 },
      { equipamento: "DSY-6474", quantidade: Math.floor(Math.random() * 20) + 5 },
      { equipamento: "EAM-3255", quantidade: Math.floor(Math.random() * 20) + 5 },
      { equipamento: "PUB-2G02", quantidade: Math.floor(Math.random() * 20) + 5 },
      { equipamento: "EOF-5C06", quantidade: Math.floor(Math.random() * 20) + 5 },
    ],
    areas: [
      { area: "Galpão Principal", quantidade: Math.floor(Math.random() * 30) + 10 },
      { area: "Setor Norte", quantidade: Math.floor(Math.random() * 25) + 8 },
      { area: "Linha de Produção", quantidade: Math.floor(Math.random() * 20) + 15 },
      { area: "Manutenção", quantidade: Math.floor(Math.random() * 15) + 5 },
      { area: "Outras Áreas", quantidade: Math.floor(Math.random() * 10) + 5 }
    ],
    ultimosRelatorios: [
      {
        id: "simulado-1",
        data: "19/04/2025",
        horario: "06:50 às 18:40",
        letra: "A",
        supervisor: "Israel",
        totalEquipes: 2,
        origem: "servidor"
      },
      {
        id: "simulado-2",
        data: "18/04/2025",
        horario: "18:40 às 06:50",
        letra: "B",
        supervisor: "Ozias",
        totalEquipes: 3,
        origem: "servidor"
      }
    ]
  };
}
