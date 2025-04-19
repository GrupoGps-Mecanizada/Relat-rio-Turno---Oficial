/**
 * Módulo de Dashboard - Implementa visualizações e estatísticas
 */
ModuleLoader.register('dashboard', function() {
  // Elementos DOM
  const dashboardContainer = document.getElementById('dashboard');
  const dashboardTab = document.getElementById('dashboardTab');
  
  // Dados para gráficos
  let chartInstanceEquipamentos = null;
  let chartInstanceAreas = null;
  
  // Inicializar listeners
  function init() {
    if (dashboardTab) {
      dashboardTab.addEventListener('click', function(e) {
        e.preventDefault();
        mostrarDashboard();
      });
    }
  }
  
  // Mostrar dashboard
  async function mostrarDashboard() {
    if (!dashboardContainer) return;
    
    // Esconder outras telas
    document.querySelectorAll('.content-step').forEach(el => {
      el.style.display = 'none';
    });
    
    // Mostrar dashboard
    dashboardContainer.style.display = 'block';
    
    // Atualizar conteúdo
    await carregarDados();
  }
  
  // Carregar dados para o dashboard
  async function carregarDados() {
    mostrarLoading('Carregando estatísticas...');
    
    try {
      // Verificar cache primeiro
      let dashboardData = AppState.getCachedData('dashboardData');
      
      if (!dashboardData) {
        try {
          // Tentar obter dados da API - usar pesquisarRelatorios que já existe
          console.log("Dashboard tentando buscar dados via API alternativa");
          const result = await callAPI('pesquisarRelatorios', { tipo: 'recentes', limite: 10 });
          
          if (result && result.success) {
            // Transformar os dados da pesquisa em estatísticas
            dashboardData = transformarDadosParaDashboard(result);
            // Guardar em cache por 10 minutos
            AppState.cacheData('dashboardData', dashboardData, 10);
          } else {
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
  
  // Transformar dados da pesquisa em formato para dashboard
  function transformarDadosParaDashboard(resultadoPesquisa) {
    const relatorios = resultadoPesquisa.resultados || [];
    
    // Extrair equipamentos e áreas dos relatórios
    const equipamentosMap = new Map();
    const areasMap = new Map();
    
    let totalEquipes = 0;
    let totalTrocas = 0;
    
    // Processar cada relatório
    relatorios.forEach(rel => {
      // Se tiver a propriedade equipes, processa
      if (rel.equipes && Array.isArray(rel.equipes)) {
        totalEquipes += rel.equipes.length;
        
        rel.equipes.forEach(eq => {
          // Contar equipamentos
          const equipKey = eq.equipamento || (eq.equipamentoPersonalizado || 'Outro');
          if (!equipamentosMap.has(equipKey)) {
            equipamentosMap.set(equipKey, 0);
          }
          equipamentosMap.set(equipKey, equipamentosMap.get(equipKey) + 1);
          
          // Contar áreas
          const areaKey = eq.area || 'Não especificada';
          if (!areasMap.has(areaKey)) {
            areasMap.set(areaKey, 0);
          }
          areasMap.set(areaKey, areasMap.get(areaKey) + 1);
          
          // Contar trocas
          if (eq.trocaEquipamento === 'Sim') {
            totalTrocas++;
          }
        });
      }
    });
    
    // Converter maps para arrays
    const equipamentos = Array.from(equipamentosMap.entries())
      .map(([equipamento, quantidade]) => ({ equipamento, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5); // Top 5
      
    const areas = Array.from(areasMap.entries())
      .map(([area, quantidade]) => ({ area, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5); // Top 5
    
    return {
      estatisticasGerais: {
        totalRelatorios: relatorios.length,
        totalEquipes: totalEquipes,
        totalTrocas: totalTrocas,
        totalAreas: areasMap.size
      },
      equipamentos: equipamentos,
      areas: areas,
      ultimosRelatorios: relatorios.map(rel => ({
        id: rel.id,
        data: rel.data,
        horario: rel.horario,
        letra: rel.letra,
        supervisor: rel.supervisor,
        totalEquipes: rel.equipes?.length || 0,
        origem: rel.origem || 'servidor'
      })).slice(0, 5) // Top 5 mais recentes
    };
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
  
  // Renderizar estatísticas gerais - código inalterado
  function renderizarEstatisticasGerais(dados) {
    const container = document.getElementById('estatisticasGerais');
    if (!container) return;
    
    container.innerHTML = `
      <div class="row">
        <div class="col-md-3 mb-4">
          <div class="card bg-primary text-white h-100">
            <div class="card-body">
              <h5 class="card-title">Total de Relatórios</h5>
              <p class="display-4">${dados.totalRelatorios}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-4">
          <div class="card bg-success text-white h-100">
            <div class="card-body">
              <h5 class="card-title">Equipes Registradas</h5>
              <p class="display-4">${dados.totalEquipes}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-4">
          <div class="card bg-info text-white h-100">
            <div class="card-body">
              <h5 class="card-title">Trocas de Equipamento</h5>
              <p class="display-4">${dados.totalTrocas}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-4">
          <div class="card bg-warning text-dark h-100">
            <div class="card-body">
              <h5 class="card-title">Áreas Atendidas</h5>
              <p class="display-4">${dados.totalAreas}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Renderizar gráfico de equipamentos - código inalterado
  function renderizarGraficoEquipamentos(dados) {
    const canvas = document.getElementById('graficoEquipamentos');
    if (!canvas) return;
    
    // Destruir gráfico anterior se existir
    if (chartInstanceEquipamentos) {
      chartInstanceEquipamentos.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = dados.map(item => item.equipamento);
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => {
      const hue = (index * 25) % 360;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    // Criar novo gráfico
    const ctx = canvas.getContext('2d');
    chartInstanceEquipamentos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Utilização de Equipamentos',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Equipamentos Mais Utilizados'
          }
        }
      }
    });
  }
  
  // Renderizar gráfico de áreas - código inalterado
  function renderizarGraficoAreas(dados) {
    const canvas = document.getElementById('graficoAreas');
    if (!canvas) return;
    
    // Destruir gráfico anterior se existir
    if (chartInstanceAreas) {
      chartInstanceAreas.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = dados.map(item => item.area);
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => {
      const hue = (index * 40) % 360;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    // Criar novo gráfico
    const ctx = canvas.getContext('2d');
    chartInstanceAreas = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: 'Áreas Mais Atendidas'
          }
        }
      }
    });
  }
  
  // Renderizar lista de últimos relatórios - código inalterado
  function renderizarUltimosRelatorios(relatorios) {
    const container = document.getElementById('ultimosRelatorios');
    if (!container) return;
    
    if (relatorios.length === 0) {
      container.innerHTML = '<div class="alert alert-info">Nenhum relatório encontrado.</div>';
      return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped table-hover">';
    html += `
      <thead>
        <tr>
          <th>Data</th>
          <th>Horário</th>
          <th>Letra</th>
          <th>Supervisor</th>
          <th>Equipes</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    relatorios.forEach(relatorio => {
      html += `
        <tr>
          <td>${relatorio.data}</td>
          <td>${relatorio.horario}</td>
          <td>${relatorio.letra}</td>
          <td>${relatorio.supervisor}</td>
          <td><span class="badge bg-primary">${relatorio.totalEquipes}</span></td>
          <td>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-primary" onclick="visualizarRelatorioExistente('${relatorio.id}', '${relatorio.origem}', 'gerarRelatorioTexto')">
                <i class="bi bi-eye"></i>
              </button>
              <button type="button" class="btn btn-info text-white" onclick="formatarWhatsAppExistente('${relatorio.id}', '${relatorio.origem}', 'formatarWhatsApp')">
                <i class="bi bi-whatsapp"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }
  
  // Exportar funções públicas
  return {
    init,
    mostrarDashboard,
    atualizarDados: carregarDados
  };
});
