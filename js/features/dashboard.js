/**
 * Módulo de Dashboard - Implementa visualizações e estatísticas
 * ATUALIZADO para incluir gráfico de Status de Atividade.
 */
ModuleLoader.register('dashboard', function() {
  // Elementos DOM
  const dashboardContainer = document.getElementById('dashboard');
  const dashboardTab = document.getElementById('dashboardTab');

  // Dados para gráficos
  let chartInstanceEquipamentos = null;
  let chartInstanceAreas = null;
  let chartInstanceMotivos = null;
  let chartInstanceStatus = null; // ADICIONADO: Instância para o novo gráfico de Status

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
      if (el.id !== 'dashboard') { // Não esconde o próprio dashboard
        el.style.display = 'none';
      }
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
      let origemDados = 'Cache'; // Para depuração

      if (!dashboardData) {
        try {
          // Usar a API obterDadosDashboard diretamente
          const result = await callAPI('obterDadosDashboard');
          origemDados = 'API Principal';

          if (result && result.success) {
            dashboardData = {
              estatisticasGerais: result.estatisticasGerais || {},
              equipamentos: result.equipamentos || [],
              areas: result.areas || [],
              motivos: result.motivos || [],
              supervisores: result.supervisores || {},
              ultimosRelatorios: result.ultimosRelatorios || [],
              // ======================= INÍCIO ATUALIZAÇÃO =======================
              dadosStatus: result.dadosStatus || {} // Espera dados de status da API
              // ======================= FIM ATUALIZAÇÃO =========================
            };
            // Guardar em cache por 10 minutos
            AppState.cacheData('dashboardData', dashboardData, 10);
             Logger.log("Dashboard: Dados carregados da API Principal.");
          } else {
            Logger.log("Dashboard: API Principal falhou ou retornou sem sucesso. Tentando alternativa.");
            origemDados = 'API Alternativa (Pesquisa)';
            // Tentar API alternativa apenas se a API principal falhar
            // NOTA: A pesquisa pode não trazer todos os dados necessários (ex: status)
            const altResult = await callAPI('pesquisarRelatorios', { tipo: 'recentes', limite: 100 }); // Busca mais relatórios para tentar gerar stats
            if (altResult && altResult.success) {
              dashboardData = transformarDadosParaDashboard(altResult); // Transforma dados da pesquisa
              // Guardar em cache por 5 minutos (cache mais curto para dados transformados)
              AppState.cacheData('dashboardData', dashboardData, 5);
              Logger.log("Dashboard: Dados transformados da API de Pesquisa.");
            } else {
              Logger.log("Dashboard: APIs falharam. Usando dados simulados.");
              origemDados = 'Simulado';
              // Usar dados simulados APENAS como último recurso
              dashboardData = gerarDadosSimulados(); // Gera dados simulados
              // Cache ainda mais curto para dados simulados
              AppState.cacheData('dashboardData', dashboardData, 2);
            }
          }
        } catch (error) {
          Logger.log("Dashboard: Erro crítico ao buscar dados. Usando dados simulados.", error);
          origemDados = 'Simulado (Erro)';
          // Usar dados simulados apenas em caso de falha total
          dashboardData = gerarDadosSimulados();
          // Cache muito curto para dados de erro (2 minutos)
          AppState.cacheData('dashboardData', dashboardData, 2);
        }
      } else {
          Logger.log("Dashboard: Dados carregados do Cache.");
      }

      Logger.log("Dashboard: Renderizando componentes com dados de:", origemDados);

      // Renderizar componentes
      renderizarEstatisticasGerais(dashboardData.estatisticasGerais || {}); // Passa objeto vazio se não existir
      renderizarGraficoEquipamentos(dashboardData.equipamentos || []); // Passa array vazio se não existir
      renderizarGraficoAreas(dashboardData.areas || []); // Passa array vazio se não existir

      // Verifica se existe container e dados para o gráfico de motivos
      const motivosContainer = document.getElementById('graficoMotivosContainer'); // Supõe um container
      if (motivosContainer) {
          if (dashboardData.motivos && dashboardData.motivos.length > 0) {
              motivosContainer.style.display = 'block'; // Mostra o container
              renderizarGraficoMotivos(dashboardData.motivos);
          } else {
              motivosContainer.style.display = 'none'; // Esconde se não há dados
              Logger.log("Dashboard: Sem dados para gráfico de motivos.");
          }
      } else {
          Logger.log("Dashboard: Container 'graficoMotivosContainer' não encontrado.");
      }


      // ======================= INÍCIO ATUALIZAÇÃO =======================
      // Verifica se existe container e dados para o gráfico de status
      const statusContainer = document.getElementById('graficoStatusContainer'); // Supõe um container
      if (statusContainer) {
         // Verifica se dadosStatus existe e tem pelo menos uma chave com valor > 0
         const hasStatusData = dashboardData.dadosStatus && Object.values(dashboardData.dadosStatus).some(v => v > 0);
         if (hasStatusData) {
              statusContainer.style.display = 'block'; // Mostra o container
              renderizarGraficoStatus(dashboardData.dadosStatus); // Passa os dados
          } else {
              statusContainer.style.display = 'none'; // Esconde se não há dados
              Logger.log("Dashboard: Sem dados para gráfico de status.");
          }
      } else {
           Logger.log("Dashboard: Container 'graficoStatusContainer' não encontrado.");
      }
      // ======================= FIM ATUALIZAÇÃO =========================

      renderizarUltimosRelatorios(dashboardData.ultimosRelatorios || []); // Passa array vazio se não existir

      ocultarLoading();
    } catch (error) {
      ocultarLoading();
      console.error('Erro geral ao carregar e renderizar dashboard:', error);
      mostrarNotificacao('Erro ao carregar dados do dashboard: ' + error.message, 'danger');
       // Limpa containers em caso de erro geral para não mostrar dados antigos/incorretos
       limparDashboardUI();
    }
  }

  // Limpa a UI do dashboard (usado em caso de erro)
  function limparDashboardUI() {
      const estatisticasGerais = document.getElementById('estatisticasGerais');
      const ultimosRelatorios = document.getElementById('ultimosRelatorios');
      if (estatisticasGerais) estatisticasGerais.innerHTML = '<div class="alert alert-danger">Não foi possível carregar as estatísticas.</div>';
      if (ultimosRelatorios) ultimosRelatorios.innerHTML = '<div class="alert alert-danger">Não foi possível carregar os últimos relatórios.</div>';
      // Limpar canvases dos gráficos
      ['graficoEquipamentos', 'graficoAreas', 'graficoMotivos', 'graficoStatus'].forEach(id => {
          const canvas = document.getElementById(id);
          if (canvas) {
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
      });
      // Destruir instâncias dos gráficos
      if (chartInstanceEquipamentos) chartInstanceEquipamentos.destroy(); chartInstanceEquipamentos = null;
      if (chartInstanceAreas) chartInstanceAreas.destroy(); chartInstanceAreas = null;
      if (chartInstanceMotivos) chartInstanceMotivos.destroy(); chartInstanceMotivos = null;
      if (chartInstanceStatus) chartInstanceStatus.destroy(); chartInstanceStatus = null; // Limpa instância do status
  }


  // Transformar dados da pesquisa em formato para dashboard
  function transformarDadosParaDashboard(resultadoPesquisa) {
    const relatorios = resultadoPesquisa.resultados || [];
    const equipamentosMap = new Map(); 
    const areasMap = new Map(); 
    const motivosMap = new Map();
    let totalEquipes = 0; 
    let totalTrocas = 0;

    // Esta fonte (pesquisa) NÃO contém dados de status de atividade
    // Retornaremos dadosStatus vazio

    relatorios.forEach(rel => {
      // Precisamos obter os detalhes das equipes para essa transformação
      // A API de pesquisa atual não retorna as equipes completas.
      // Idealmente, a API 'obterDadosDashboard' seria a fonte principal.
      // Como fallback, vamos simular contagens básicas se 'pesquisarRelatorios' não retornar equipes.
      if (rel.totalEquipes) { 
        totalEquipes += rel.totalEquipes; 
      } // Usa a contagem se vier da API

      // Se a API de pesquisa fosse modificada para retornar equipes, o loop seria aqui:
      /*
        if (rel.equipes && Array.isArray(rel.equipes)) {
            totalEquipes += rel.equipes.length;
            rel.equipes.forEach(eq => {
                // Contar equipamentos...
                // Contar áreas...
                // Contar trocas e motivos...
            });
        }
      */
    });

    // Como não temos detalhes das equipes, os gráficos ficarão vazios ou imprecisos
    Logger.log("Dashboard: Transformação de dados da pesquisa - detalhes das equipes não disponíveis.");

    return {
      estatisticasGerais: { 
        totalRelatorios: relatorios.length, 
        totalEquipes, 
        totalTrocas: 0, 
        totalAreas: 0 
      }, // Stats limitados
      equipamentos: [], 
      areas: [], 
      motivos: [], // Sem dados para gráficos
      dadosStatus: {}, // ADICIONADO: Retorna vazio
      ultimosRelatorios: relatorios.map(rel => ({
        id: rel.id, 
        data: rel.data, 
        horario: rel.horario, 
        letra: rel.letra, 
        supervisor: rel.supervisor,
        totalEquipes: rel.totalEquipes || 0, 
        origem: rel.origem || 'servidor'
      })).slice(0, 5)
    };
  }

  // Função para gerar dados simulados quando a API falhar
  function gerarDadosSimulados() {
    const idBase = new Date().getTime();
    return {
      estatisticasGerais: { 
        totalRelatorios: Math.floor(Math.random() * 100) + 50, 
        totalEquipes: Math.floor(Math.random() * 150) + 100, 
        totalTrocas: Math.floor(Math.random() * 30) + 10, 
        totalAreas: Math.floor(Math.random() * 20) + 5 
      },
      equipamentos: [ 
        { equipamento: "SIM-EGC-001", quantidade: Math.floor(Math.random() * 20) + 5 }, 
        { equipamento: "SIM-DSY-002", quantidade: Math.floor(Math.random() * 20) + 5 }, 
        { equipamento: "SIM-EAM-003", quantidade: Math.floor(Math.random() * 20) + 5 }, 
        { equipamento: "SIM-PUB-004", quantidade: Math.floor(Math.random() * 20) + 5 }, 
        { equipamento: "SIM-EOF-005", quantidade: Math.floor(Math.random() * 20) + 5 } 
      ],
      areas: [ 
        { area: "Área Simulada A", quantidade: Math.floor(Math.random() * 30) + 10 }, 
        { area: "Área Simulada B", quantidade: Math.floor(Math.random() * 25) + 8 }, 
        { area: "Área Simulada C", quantidade: Math.floor(Math.random() * 20) + 15 }, 
        { area: "Área Simulada D", quantidade: Math.floor(Math.random() * 15) + 5 }, 
        { area: "Outras Áreas", quantidade: Math.floor(Math.random() * 10) + 5 } 
      ],
      motivos: [ 
        { motivo: "Manutenção Preventiva", quantidade: Math.floor(Math.random() * 10) + 5 }, 
        { motivo: "Quebra Simulada", quantidade: Math.floor(Math.random() * 8) + 3 }, 
        { motivo: "Falha Aleatória", quantidade: Math.floor(Math.random() * 7) + 2 }, 
        { motivo: "Troca Programada", quantidade: Math.floor(Math.random() * 5) + 4 }, 
        { motivo: "Outros", quantidade: Math.floor(Math.random() * 5) + 1 } 
      ],
      // ======================= INÍCIO ATUALIZAÇÃO =======================
      dadosStatus: { // Dados simulados para o status
        concluido: Math.floor(Math.random() * 100) + 50, // Ex: 50 a 149
        emAndamento: Math.floor(Math.random() * 30) + 10, // Ex: 10 a 39
        naoIniciado: Math.floor(Math.random() * 15) + 5   // Ex: 5 a 19
      },
      // ======================= FIM ATUALIZAÇÃO =========================
      ultimosRelatorios: [ 
        { 
          id: "simulado_" + (idBase + 1), 
          data: "21/07/2024", 
          horario: "06:50 às 18:40", 
          letra: "A", 
          supervisor: "Supervisor Sim", 
          totalEquipes: 2, 
          origem: "simulado" 
        }, 
        { 
          id: "simulado_" + (idBase + 2), 
          data: "20/07/2024", 
          horario: "18:40 às 06:50", 
          letra: "B", 
          supervisor: "Outro Sup Sim", 
          totalEquipes: 3, 
          origem: "simulado" 
        } 
      ]
    };
  }

  // Renderizar estatísticas gerais
  function renderizarEstatisticasGerais(dados) {
    const container = document.getElementById('estatisticasGerais');
    if (!container) return;
    // Usar dados?.chave ?? 0 para evitar erros se 'dados' for undefined/null
    container.innerHTML = `
      <div class="row g-3"> <!-- g-3 para espaçamento -->
        <div class="col-6 col-md-3 mb-3"> <!-- mb-3 para espaçamento vertical -->
          <div class="card text-white h-100 shadow-sm" style="background-color: var(--primary-color, #0d6efd);">
           <div class="card-body text-center"> 
             <div class="stat-icon mb-2"><i class="bi bi-clipboard-data fs-2"></i></div> 
             <h6 class="card-title">Total Relatórios</h6> 
             <p class="display-6 fw-bold">${dados?.totalRelatorios ?? 0}</p> 
           </div>
          </div>
        </div>
        <div class="col-6 col-md-3 mb-3">
          <div class="card text-white h-100 shadow-sm" style="background-color: var(--success-color, #198754);">
            <div class="card-body text-center"> 
              <div class="stat-icon mb-2"><i class="bi bi-people-fill fs-2"></i></div> 
              <h6 class="card-title">Equipes Registradas</h6> 
              <p class="display-6 fw-bold">${dados?.totalEquipes ?? 0}</p> 
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3 mb-3">
          <div class="card text-white h-100 shadow-sm" style="background-color: var(--info-color, #0dcaf0);">
             <div class="card-body text-center"> 
               <div class="stat-icon mb-2"><i class="bi bi-arrow-repeat fs-2"></i></div> 
               <h6 class="card-title">Trocas Equipamento</h6> 
               <p class="display-6 fw-bold">${dados?.totalTrocas ?? 0}</p> 
             </div>
          </div>
        </div>
        <div class="col-6 col-md-3 mb-3">
          <div class="card text-dark h-100 shadow-sm" style="background-color: var(--warning-color, #ffc107);">
            <div class="card-body text-center"> 
              <div class="stat-icon mb-2"><i class="bi bi-geo-alt-fill fs-2"></i></div> 
              <h6 class="card-title">Áreas Atendidas</h6> 
              <p class="display-6 fw-bold">${dados?.totalAreas ?? 0}</p> 
            </div>
          </div>
        </div>
      </div>`;
  }

  // Renderizar gráfico de equipamentos
  function renderizarGraficoEquipamentos(dados) {
    const canvas = document.getElementById('graficoEquipamentos');
    if (!canvas) { 
      console.warn("Canvas 'graficoEquipamentos' não encontrado."); 
      return; 
    }
    if (chartInstanceEquipamentos) chartInstanceEquipamentos.destroy(); // Destroi anterior
    if (!dados || dados.length === 0) { // Verifica se há dados
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6c757d'; 
        ctx.textAlign = 'center';
        ctx.fillText("Sem dados de equipamentos", canvas.width / 2, canvas.height / 2);
        return;
    }
    const labels = dados.map(item => item.equipamento); 
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => `hsla(${(index * 30 + 210) % 360}, 75%, 60%, 0.7)`); // Tons azulados/roxos
    const borderColors = backgroundColors.map(c => c.replace('0.7', '1'));
    const ctx = canvas.getContext('2d');
    chartInstanceEquipamentos = new Chart(ctx, {
      type: 'bar',
      data: { 
        labels, 
        datasets: [{ 
          label: 'Utilizações', 
          data: values, 
          backgroundColor: backgroundColors, 
          borderColor: borderColors, 
          borderWidth: 1 
        }] 
      },
      options: { 
        indexAxis: 'y', 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { 
          x: { 
            beginAtZero: true, 
            ticks: { precision: 0 } 
          } 
        }, 
        plugins: { 
          legend: { display: false }, 
          title: { display: false }, 
          tooltip: { 
            callbacks: { 
              label: (c) => ` ${c.dataset.label}: ${c.formattedValue}` 
            } 
          } 
        } 
      } // Eixo Y, sem título/legenda, tooltip simples
    });
  }

  // Renderizar gráfico de áreas
  function renderizarGraficoAreas(dados) {
    const canvas = document.getElementById('graficoAreas');
    if (!canvas) { 
      console.warn("Canvas 'graficoAreas' não encontrado."); 
      return; 
    }
    if (chartInstanceAreas) chartInstanceAreas.destroy();
     if (!dados || dados.length === 0) { // Verifica se há dados
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6c757d'; 
        ctx.textAlign = 'center';
        ctx.fillText("Sem dados de áreas", canvas.width / 2, canvas.height / 2);
        return;
    }
    const labels = dados.map(item => item.area); 
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => `hsla(${(index * 50 + 30) % 360}, 70%, 65%, 0.7)`); // Tons variados
    const borderColors = backgroundColors.map(c => c.replace('0.7', '1'));
    const ctx = canvas.getContext('2d');
    chartInstanceAreas = new Chart(ctx, {
      type: 'doughnut',
      data: { 
        labels, 
        datasets: [{ 
          data: values, 
          backgroundColor: backgroundColors, 
          borderColor: borderColors, 
          borderWidth: 1 
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { 
            position: 'right', 
            labels: { 
              boxWidth: 12, 
              padding: 15 
            } 
          }, 
          title: { display: false }, 
          tooltip: { 
            callbacks: { 
              label: (c) => ` ${c.label}: ${c.formattedValue}` 
            } 
          } 
        } 
      } // Legenda direita, sem título, tooltip simples
    });
  }

  // Renderizar gráfico de motivos de troca
  function renderizarGraficoMotivos(dados) {
    const canvas = document.getElementById('graficoMotivos'); // Assume canvas existe no container
    if (!canvas) { 
      console.warn("Canvas 'graficoMotivos' não encontrado."); 
      return; 
    }
    if (chartInstanceMotivos) chartInstanceMotivos.destroy();
     if (!dados || dados.length === 0) { // Verifica se há dados
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6c757d'; 
        ctx.textAlign = 'center';
        ctx.fillText("Sem dados de motivos de troca", canvas.width / 2, canvas.height / 2);
        return;
    }
    const labels = dados.map(item => item.motivo); 
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => `hsla(${(index * 60 + 120) % 360}, 70%, 60%, 0.7)`); // Tons esverdeados/amarelados
    const borderColors = backgroundColors.map(c => c.replace('0.7', '1'));
    const ctx = canvas.getContext('2d');
    chartInstanceMotivos = new Chart(ctx, {
      type: 'pie',
      data: { 
        labels, 
        datasets: [{ 
          data: values, 
          backgroundColor: backgroundColors, 
          borderColor: borderColors, 
          borderWidth: 1 
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { 
            position: 'right', 
            labels: { 
              boxWidth: 12, 
              padding: 15 
            } 
          }, 
          title: { display: false }, 
          tooltip: { 
            callbacks: { 
              label: (c) => ` ${c.label}: ${c.formattedValue}` 
            } 
          } 
        } 
      } // Legenda direita, sem título, tooltip simples
    });
  }

  // ======================= INÍCIO NOVA FUNÇÃO =======================
  /**
   * Renderiza o gráfico de distribuição de status das atividades.
   * @param {object} dadosStatus Objeto com { concluido: number, emAndamento: number, naoIniciado: number }
   */
  function renderizarGraficoStatus(dadosStatus) {
      const canvas = document.getElementById('graficoStatus'); // Assume canvas existe no container
      if (!canvas) {
          console.warn("Elemento canvas 'graficoStatus' não encontrado.");
          return;
      }

      // Destruir gráfico anterior se existir
      if (chartInstanceStatus) {
          chartInstanceStatus.destroy();
      }

      // Verificar se há dados válidos (pelo menos um status com valor > 0)
      if (!dadosStatus || ( (dadosStatus.concluido ?? 0) === 0 && (dadosStatus.emAndamento ?? 0) === 0 && (dadosStatus.naoIniciado ?? 0) === 0) ) {
          Logger.log("Dashboard: Dados de status zerados ou ausentes. Não renderizando gráfico.");
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa canvas
          ctx.fillStyle = '#6c757d'; // Cor cinza
          ctx.textAlign = 'center';
          ctx.font = '12px Roboto'; // Define uma fonte
          ctx.fillText("Sem dados de status", canvas.width / 2, canvas.height / 2);
          return;
      }

      // Preparar dados
      const labels = ['Concluído', 'Em Andamento', 'Não Iniciado/Pend.']; // Label ajustado
      const values = [
          dadosStatus.concluido || 0,
          dadosStatus.emAndamento || 0,
          dadosStatus.naoIniciado || 0 // Cobre pendentes/não iniciados
      ];

      // Cores para os status
      const rootStyles = getComputedStyle(document.documentElement);
      const successColor = rootStyles.getPropertyValue('--success-color').trim() || '#2ecc71';
      const warningColor = rootStyles.getPropertyValue('--warning-color').trim() || '#f39c12';
      const dangerColor = rootStyles.getPropertyValue('--danger-color').trim() || '#e74c3c';

      const backgroundColors = [ 
        `${successColor}b3`, 
        `${warningColor}b3`, 
        `${dangerColor}b3` 
      ]; // ~70% opacidade
      const borderColors = [successColor, warningColor, dangerColor];

      // Criar gráfico
      const ctx = canvas.getContext('2d');
      chartInstanceStatus = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: labels,
              datasets: [{
                  label: 'Status',
                  data: values,
                  backgroundColor: backgroundColors,
                  borderColor: borderColors,
                  borderWidth: 1,
                  hoverOffset: 4 // Efeito ao passar o mouse
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '60%', // Tamanho do buraco no centro (ajuste conforme gosto)
              plugins: {
                  legend: {
                      position: 'bottom',
                      labels: { 
                        boxWidth: 12, 
                        padding: 20 
                      } // Mais padding na legenda
                  },
                  title: { display: false }, // Título omitido para layout mais limpo no card
                  tooltip: {
                      callbacks: {
                          label: function(context) {
                              let label = context.label || ''; 
                              if (label) { 
                                label += ': '; 
                              }
                              if (context.parsed !== null) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                                  label += `${context.formattedValue} (${percentage})`;
                              }
                              return label;
                          }
                      }
                  }
              }
          }
      });
  }
  // ======================= FIM NOVA FUNÇÃO =========================

  // Renderizar lista de últimos relatórios
  function renderizarUltimosRelatorios(relatorios) {
    const container = document.getElementById('ultimosRelatorios');
    if (!container) { 
      console.warn("Container 'ultimosRelatorios' não encontrado."); 
      return; 
    }
    if (!relatorios || relatorios.length === 0) { 
      container.innerHTML = '<div class="alert alert-light text-center p-4"><i class="bi bi-info-circle fs-3 mb-2 d-block"></i>Nenhum relatório recente encontrado.</div>'; 
      return; 
    }

    let html = '<div class="table-responsive recent-reports-table"><table class="table table-striped table-hover table-sm align-middle">'; // align-middle para centralizar verticalmente
    html += `<thead class="table-light"><tr><th>Origem</th><th>Data</th><th>Horário</th><th>Letra</th><th>Sup.</th><th class="text-center">Equipes</th><th class="text-center">Ações</th></tr></thead><tbody>`;

    relatorios.forEach(rel => {
      const badgeClass = rel.origem === 'local' ? 'bg-secondary' : (rel.origem === 'simulado' ? 'bg-warning text-dark' : 'bg-info text-dark');
      const desabilitarAcoes = rel.origem === 'simulado';
      html += `
        <tr>
          <td><span class="badge ${badgeClass}">${rel.origem}</span></td>
          <td>${rel.data || 'N/A'}</td>
          <td>${rel.horario || 'N/A'}</td>
          <td>${rel.letra || 'N/A'}</td>
          <td>${rel.supervisor || 'N/A'}</td>
          <td class="text-center"><span class="badge rounded-pill bg-primary">${rel.totalEquipes || 0}</span></td>
          <td class="text-center">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-primary btn-action-sm" onclick="visualizarRelatorioExistente('${rel.id}', '${rel.origem}', 'gerarRelatorioTexto')" title="Visualizar Relatório" ${desabilitarAcoes ? 'disabled' : ''}><i class="bi bi-eye"></i></button>
              <button type="button" class="btn btn-outline-info btn-action-sm" onclick="formatarWhatsAppExistente('${rel.id}', '${rel.origem}', 'formatarWhatsApp')" title="Formatar para WhatsApp" ${desabilitarAcoes ? 'disabled' : ''}><i class="bi bi-whatsapp"></i></button>
              ${rel.origem === 'servidor' ? `<button type="button" class="btn btn-outline-danger btn-action-sm" onclick="gerarPDFExistente('${rel.id}', '${rel.origem}')" title="Gerar PDF"><i class="bi bi-file-pdf"></i></button>` : ''}
            </div>
          </td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html; // Atualiza o container com a tabela
  }

  // Exportar funções públicas
  return {
    init,
    mostrarDashboard,
    atualizarDados: carregarDados // Permite atualização externa se necessário
  };
});
