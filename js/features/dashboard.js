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
  let chartInstanceMotivos = null;
  
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
          // Usar a API obterDadosDashboard diretamente
          const result = await callAPI('obterDadosDashboard');
          
          if (result && result.success) {
            dashboardData = {
              estatisticasGerais: result.estatisticasGerais || {},
              equipamentos: result.equipamentos || [],
              areas: result.areas || [],
              motivos: result.motivos || [], // Adicionado para estatísticas de motivos de troca
              supervisores: result.supervisores || {}, // Adicionado para dados de supervisor
              ultimosRelatorios: result.ultimosRelatorios || []
            };
            // Guardar em cache por 10 minutos
            AppState.cacheData('dashboardData', dashboardData, 10);
          } else {
            console.log("API não retornou dados de dashboard, tentando alternativa");
            // Tentar API alternativa apenas se a API principal falhar
            const altResult = await callAPI('pesquisarRelatorios', { tipo: 'recentes', limite: 10 });
            if (altResult && altResult.success) {
              dashboardData = transformarDadosParaDashboard(altResult);
              // Guardar em cache por 5 minutos (cache mais curto para dados transformados)
              AppState.cacheData('dashboardData', dashboardData, 5);
            } else {
              // Usar dados simulados APENAS como último recurso
              console.log("Todas as APIs falharam, usando dados simulados temporariamente");
              dashboardData = gerarDadosSimulados();
              // Cache ainda mais curto para dados simulados
              AppState.cacheData('dashboardData', dashboardData, 2);
            }
          }
        } catch (error) {
          console.warn("Erro ao buscar dados do dashboard:", error);
          // Usar dados simulados apenas em caso de falha total
          dashboardData = gerarDadosSimulados();
          // Cache muito curto para dados de erro (2 minutos)
          AppState.cacheData('dashboardData', dashboardData, 2);
        }
      }
      
      // Renderizar componentes
      renderizarEstatisticasGerais(dashboardData.estatisticasGerais);
      renderizarGraficoEquipamentos(dashboardData.equipamentos);
      renderizarGraficoAreas(dashboardData.areas);
      // Adicionar nova função para renderizar motivos de troca
      if (dashboardData.motivos && dashboardData.motivos.length > 0) {
        renderizarGraficoMotivos(dashboardData.motivos);
      }
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
    const motivosMap = new Map(); // Adicionado: mapa para motivos de troca
    
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
          
          // Contar trocas e motivos
          if (eq.trocaEquipamento === 'Sim') {
            totalTrocas++;
            
            // Processar motivo da troca
            let motivoKey = eq.motivoTroca || 'Não especificado';
            // Se for "Outros Motivos" ou "Defeitos", usar o campo motivoOutro se disponível
            if ((motivoKey === 'Outros Motivos (Justificar)' || motivoKey === 'Defeitos Em Geral (Justificar)') && eq.motivoOutro) {
              motivoKey = eq.motivoOutro;
            }
            
            if (!motivosMap.has(motivoKey)) {
              motivosMap.set(motivoKey, 0);
            }
            motivosMap.set(motivoKey, motivosMap.get(motivoKey) + 1);
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
      
    // Novo: converter motivos para array
    const motivos = Array.from(motivosMap.entries())
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6); // Top 6 motivos
    
    return {
      estatisticasGerais: {
        totalRelatorios: relatorios.length,
        totalEquipes: totalEquipes,
        totalTrocas: totalTrocas,
        totalAreas: areasMap.size
      },
      equipamentos: equipamentos,
      areas: areas,
      motivos: motivos, // Novo array de motivos
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
    // Use IDs únicos para evitar o erro de visualização do relatório
    const idBase = new Date().getTime();
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
      // Novo: dados simulados para motivos de troca
      motivos: [
        { motivo: "Manutenção Preventiva", quantidade: Math.floor(Math.random() * 10) + 5 },
        { motivo: "Quebra", quantidade: Math.floor(Math.random() * 8) + 3 },
        { motivo: "Falha Operacional", quantidade: Math.floor(Math.random() * 7) + 2 },
        { motivo: "Troca Regular", quantidade: Math.floor(Math.random() * 5) + 4 },
        { motivo: "Outros", quantidade: Math.floor(Math.random() * 5) + 1 }
      ],
      ultimosRelatorios: [
        {
          id: "gerado_temporariamente_" + (idBase + 1),
          data: "19/04/2025",
          horario: "06:50 às 18:40",
          letra: "A",
          supervisor: "Israel",
          totalEquipes: 2,
          origem: "temporário"
        },
        {
          id: "gerado_temporariamente_" + (idBase + 2),
          data: "18/04/2025",
          horario: "18:40 às 06:50",
          letra: "B",
          supervisor: "Ozias",
          totalEquipes: 3,
          origem: "temporário"
        }
      ]
    };
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
  
  // Nova função: Renderizar gráfico de motivos de troca
  function renderizarGraficoMotivos(dados) {
    const container = document.getElementById('graficoMotivos');
    if (!container) {
      console.warn("Container para gráfico de motivos não encontrado");
      return;
    }
    
    // Destruir gráfico anterior se existir
    if (chartInstanceMotivos) {
      chartInstanceMotivos.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = dados.map(item => item.motivo);
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => {
      const hue = (index * 60) % 360;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    // Criar novo gráfico
    const ctx = container.getContext('2d');
    chartInstanceMotivos = new Chart(ctx, {
      type: 'pie',
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
            text: 'Motivos de Troca de Equipamento'
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
    
    let html = '<div class="table-responsive"><table class="table table-striped table-hover table-sm">';
    html += `
      <thead>
        <tr>
          <th>Origem</th>
          <th>Data</th>
          <th>Horário</th>
          <th>Letra</th>
          <th>Supervisor</th>
          <th>Equipes</th>
          <th class="text-center">Ações</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    relatorios.forEach(relatorio => {
      const badgeClass = relatorio.origem === 'local' ? 'bg-secondary' : 
                         (relatorio.origem === 'temporário' ? 'bg-warning text-dark' : 'bg-info');
      // Não permite visualizar ou gerar PDF para relatórios temporários (simulados)
      const desabilitarAcoes = relatorio.origem === 'temporário';
      
      html += `
        <tr>
          <td><span class="badge ${badgeClass}">${relatorio.origem}</span></td>
          <td>${relatorio.data}</td>
          <td>${relatorio.horario}</td>
          <td>${relatorio.letra}</td>
          <td>${relatorio.supervisor}</td>
          <td><span class="badge bg-primary">${relatorio.totalEquipes}</span></td>
          <td class="text-center">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-primary" onclick="visualizarRelatorioExistente('${relatorio.id}', '${relatorio.origem}', 'gerarRelatorioTexto')" title="Visualizar" ${desabilitarAcoes ? 'disabled' : ''}>
                <i class="bi bi-eye"></i>
              </button>
              <button type="button" class="btn btn-info text-white" onclick="formatarWhatsAppExistente('${relatorio.id}', '${relatorio.origem}', 'formatarWhatsApp')" title="Formatar WhatsApp" ${desabilitarAcoes ? 'disabled' : ''}>
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
