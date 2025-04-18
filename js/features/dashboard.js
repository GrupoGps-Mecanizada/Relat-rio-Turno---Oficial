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
        // Se não estiver em cache, buscar da API
        const result = await callAPI('obterEstatisticas');
        
        if (result.success) {
          dashboardData = result.dados;
          // Guardar em cache por 10 minutos
          AppState.cacheData('dashboardData', dashboardData, 10);
        } else {
          throw new Error(result.message);
        }
      }
      
      // Renderizar componentes do dashboard
      renderizarEstatisticasGerais(dashboardData.estatisticasGerais);
      renderizarGraficoEquipamentos(dashboardData.equipamentos);
      renderizarGraficoAreas(dashboardData.areas);
      renderizarUltimosRelatorios(dashboardData.ultimosRelatorios);
      
      ocultarLoading();
    } catch (error) {
      ocultarLoading();
      console.error('Erro ao carregar dados do dashboard:', error);
      alert('Erro ao carregar dados do dashboard: ' + error.message);
    }
  }
  
  // Renderizar estatísticas gerais
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
  
  // Renderizar gráfico de equipamentos
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
  
  // Renderizar gráfico de áreas
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
  
  // Renderizar lista de últimos relatórios
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
              <button type="button" class="btn btn-primary" onclick="visualizarRelatorioExistente('${relatorio.id}')">
                <i class="bi bi-eye"></i>
              </button>
              <button type="button" class="btn btn-info" onclick="formatarWhatsAppExistente('${relatorio.id}')">
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
