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
  let chartInstanceStatus = null; // <<< ADICIONADO: Instância para o novo gráfico

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
              motivos: result.motivos || [],
              supervisores: result.supervisores || {},
              ultimosRelatorios: result.ultimosRelatorios || [],
              dadosStatus: result.dadosStatus || {} // <<< ADICIONADO: Espera dados de status da API
            };
            // Guardar em cache por 10 minutos
            AppState.cacheData('dashboardData', dashboardData, 10);
          } else {
            console.warn("API não retornou dados de dashboard, tentando alternativa");
            // Tentar API alternativa apenas se a API principal falhar
            const altResult = await callAPI('pesquisarRelatorios', { tipo: 'recentes', limite: 10 });
            if (altResult && altResult.success) {
              dashboardData = transformarDadosParaDashboard(altResult); // <<< ATUALIZADO para incluir status (vazio)
              // Guardar em cache por 5 minutos (cache mais curto para dados transformados)
              AppState.cacheData('dashboardData', dashboardData, 5);
            } else {
              // Usar dados simulados APENAS como último recurso
              console.warn("Todas as APIs falharam, usando dados simulados temporariamente");
              dashboardData = gerarDadosSimulados(); // <<< ATUALIZADO para incluir status
              // Cache ainda mais curto para dados simulados
              AppState.cacheData('dashboardData', dashboardData, 2);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do dashboard:", error);
          // Usar dados simulados apenas em caso de falha total
          dashboardData = gerarDadosSimulados(); // <<< ATUALIZADO para incluir status
          // Cache muito curto para dados de erro (2 minutos)
          AppState.cacheData('dashboardData', dashboardData, 2);
        }
      }

      // Renderizar componentes
      renderizarEstatisticasGerais(dashboardData.estatisticasGerais);
      renderizarGraficoEquipamentos(dashboardData.equipamentos);
      renderizarGraficoAreas(dashboardData.areas);
      if (dashboardData.motivos && dashboardData.motivos.length > 0) {
        renderizarGraficoMotivos(dashboardData.motivos);
      }
      // <<< ADICIONADO: Chamar renderização do novo gráfico >>>
      renderizarGraficoStatus(dashboardData.dadosStatus || {}); // Passa dados de status ou objeto vazio
      // <<< FIM ADIÇÃO >>>
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
    // ... (código existente para processar equipamentos, áreas, motivos) ...
    const relatorios = resultadoPesquisa.resultados || [];
    const equipamentosMap = new Map();
    const areasMap = new Map();
    const motivosMap = new Map();
    let totalEquipes = 0;
    let totalTrocas = 0;

     // !!! IMPORTANTE: Esta fonte de dados (pesquisarRelatorios) provavelmente NÃO contém
     // informações detalhadas de status por atividade. Portanto, retornaremos dadosStatus vazio.
     // A função obterDadosDashboard no Apps Script precisaria ser a fonte principal para isso.

    relatorios.forEach(rel => {
        if (rel.equipes && Array.isArray(rel.equipes)) {
            totalEquipes += rel.equipes.length;
            rel.equipes.forEach(eq => {
                // Contar equipamentos
                const equipKey = eq.equipamento || (eq.equipamentoPersonalizado || 'Outro');
                equipamentosMap.set(equipKey, (equipamentosMap.get(equipKey) || 0) + 1);
                // Contar áreas
                const areaKey = eq.area || 'Não especificada';
                areasMap.set(areaKey, (areasMap.get(areaKey) || 0) + 1);
                // Contar trocas e motivos
                if (eq.trocaEquipamento === 'Sim') {
                    totalTrocas++;
                    let motivoKey = eq.motivoTroca || 'Não especificado';
                    if ((motivoKey === 'Outros Motivos (Justificar)' || motivoKey === 'Defeitos Em Geral (Justificar)') && eq.motivoOutro) {
                        motivoKey = eq.motivoOutro;
                    }
                    motivosMap.set(motivoKey, (motivosMap.get(motivoKey) || 0) + 1);
                }
                // Não há dados de status aqui para processar
            });
        }
    });

    const equipamentos = Array.from(equipamentosMap.entries())
      .map(([equipamento, quantidade]) => ({ equipamento, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
    const areas = Array.from(areasMap.entries())
      .map(([area, quantidade]) => ({ area, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
    const motivos = Array.from(motivosMap.entries())
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade).slice(0, 6);

    return {
      estatisticasGerais: { totalRelatorios: relatorios.length, totalEquipes, totalTrocas, totalAreas: areasMap.size },
      equipamentos,
      areas,
      motivos,
      dadosStatus: {}, // <<< ADICIONADO: Retorna vazio, pois não temos essa info aqui
      ultimosRelatorios: relatorios.map(rel => ({
        id: rel.id, data: rel.data, horario: rel.horario, letra: rel.letra, supervisor: rel.supervisor,
        totalEquipes: rel.equipes?.length || 0, origem: rel.origem || 'servidor'
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
      motivos: [
        { motivo: "Manutenção Preventiva", quantidade: Math.floor(Math.random() * 10) + 5 },
        { motivo: "Quebra", quantidade: Math.floor(Math.random() * 8) + 3 },
        { motivo: "Falha Operacional", quantidade: Math.floor(Math.random() * 7) + 2 },
        { motivo: "Troca Regular", quantidade: Math.floor(Math.random() * 5) + 4 },
        { motivo: "Outros", quantidade: Math.floor(Math.random() * 5) + 1 }
      ],
      // <<< ADICIONADO: Dados simulados para o status >>>
      dadosStatus: {
        concluido: Math.floor(Math.random() * 100) + 50, // Ex: 50 a 149
        emAndamento: Math.floor(Math.random() * 30) + 10, // Ex: 10 a 39
        naoIniciado: Math.floor(Math.random() * 15) + 5   // Ex: 5 a 19
      },
      // <<< FIM ADIÇÃO >>>
      ultimosRelatorios: [
        { id: "simulado_" + (idBase + 1), data: "20/07/2024", horario: "06:50 às 18:40", letra: "A", supervisor: "Israel", totalEquipes: 2, origem: "simulado" },
        { id: "simulado_" + (idBase + 2), data: "19/07/2024", horario: "18:40 às 06:50", letra: "B", supervisor: "Ozias", totalEquipes: 3, origem: "simulado" }
      ]
    };
  }

  // Renderizar estatísticas gerais
  function renderizarEstatisticasGerais(dados) {
    // ... (código existente sem alterações)
    const container = document.getElementById('estatisticasGerais');
    if (!container) return;
    container.innerHTML = `
      <div class="row">
        <div class="col-md-3 mb-4">
          <div class="card bg-primary text-white h-100"> <div class="card-body"> <h5 class="card-title">Total Relatórios</h5> <p class="display-4">${dados.totalRelatorios}</p> </div> </div>
        </div>
        <div class="col-md-3 mb-4">
          <div class="card bg-success text-white h-100"> <div class="card-body"> <h5 class="card-title">Equipes Registradas</h5> <p class="display-4">${dados.totalEquipes}</p> </div> </div>
        </div>
        <div class="col-md-3 mb-4">
          <div class="card bg-info text-white h-100"> <div class="card-body"> <h5 class="card-title">Trocas Equipamento</h5> <p class="display-4">${dados.totalTrocas}</p> </div> </div>
        </div>
        <div class="col-md-3 mb-4">
          <div class="card bg-warning text-dark h-100"> <div class="card-body"> <h5 class="card-title">Áreas Atendidas</h5> <p class="display-4">${dados.totalAreas}</p> </div> </div>
        </div>
      </div>`;
  }

  // Renderizar gráfico de equipamentos
  function renderizarGraficoEquipamentos(dados) {
    // ... (código existente, incluindo chartInstanceEquipamentos.destroy()) ...
    const canvas = document.getElementById('graficoEquipamentos');
    if (!canvas) return;
    if (chartInstanceEquipamentos) chartInstanceEquipamentos.destroy();
    const labels = dados.map(item => item.equipamento);
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => `hsla(${(index * 25) % 360}, 70%, 60%, 0.7)`);
    const ctx = canvas.getContext('2d');
    chartInstanceEquipamentos = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Utilização', data: values, backgroundColor: backgroundColors, borderColor: backgroundColors.map(c=>c.replace('0.7','1')), borderWidth: 1 }] },
      options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false }, title: { display: true, text: 'Equipamentos Mais Utilizados' } } }
    });
  }

  // Renderizar gráfico de áreas
  function renderizarGraficoAreas(dados) {
    // ... (código existente, incluindo chartInstanceAreas.destroy()) ...
    const canvas = document.getElementById('graficoAreas');
    if (!canvas) return;
    if (chartInstanceAreas) chartInstanceAreas.destroy();
    const labels = dados.map(item => item.area);
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => `hsla(${(index * 40) % 360}, 70%, 60%, 0.7)`);
    const ctx = canvas.getContext('2d');
    chartInstanceAreas = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: backgroundColors, borderColor: backgroundColors.map(c=>c.replace('0.7','1')), borderWidth: 1 }] },
      options: { responsive: true, plugins: { legend: { position: 'right' }, title: { display: true, text: 'Áreas Mais Atendidas' } } }
    });
  }

  // Renderizar gráfico de motivos de troca
  function renderizarGraficoMotivos(dados) {
    // ... (código existente, incluindo chartInstanceMotivos.destroy()) ...
    const container = document.getElementById('graficoMotivos');
    if (!container) { console.warn("Container para gráfico de motivos não encontrado"); return; }
    if (chartInstanceMotivos) chartInstanceMotivos.destroy();
    const labels = dados.map(item => item.motivo);
    const values = dados.map(item => item.quantidade);
    const backgroundColors = dados.map((_, index) => `hsla(${(index * 60) % 360}, 70%, 60%, 0.7)`);
    const ctx = container.getContext('2d');
    chartInstanceMotivos = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data: values, backgroundColor: backgroundColors, borderColor: backgroundColors.map(c=>c.replace('0.7','1')), borderWidth: 1 }] },
      options: { responsive: true, plugins: { legend: { position: 'right' }, title: { display: true, text: 'Motivos de Troca de Equipamento' } } }
    });
  }

  // <<< --- NOVA FUNÇÃO --- >>>
  // Adicionar ao dashboard para mostrar distribuição de status das atividades
  function renderizarGraficoStatus(dadosStatus) {
      const canvas = document.getElementById('graficoStatus');
      if (!canvas) {
          console.warn("Elemento canvas 'graficoStatus' não encontrado.");
          return;
      }

      // Destruir gráfico anterior se existir
      if (chartInstanceStatus) {
          chartInstanceStatus.destroy();
      }

      // Verificar se há dados válidos
      if (!dadosStatus || (dadosStatus.concluido === undefined && dadosStatus.emAndamento === undefined && dadosStatus.naoIniciado === undefined)) {
          console.log("Dados de status insuficientes ou ausentes para renderizar o gráfico.");
          // Opcional: Mostrar mensagem no lugar do gráfico
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa canvas
          ctx.fillStyle = '#6c757d'; // Cor cinza
          ctx.textAlign = 'center';
          ctx.fillText("Dados de status indisponíveis", canvas.width / 2, canvas.height / 2);
          return;
      }


      // Preparar dados
      const labels = ['Concluído', 'Em Andamento', 'Não Iniciado/Pendente']; // Ajuste no label
      const values = [
          dadosStatus.concluido || 0,
          dadosStatus.emAndamento || 0,
          dadosStatus.naoIniciado || 0 // Assumindo que 'naoIniciado' cobre pendentes também
      ];

      // Cores para os status (usando variáveis CSS se possível, ou fallback)
      const rootStyles = getComputedStyle(document.documentElement);
      const successColor = rootStyles.getPropertyValue('--success-color').trim() || '#2ecc71';
      const warningColor = rootStyles.getPropertyValue('--warning-color').trim() || '#f39c12';
      const dangerColor = rootStyles.getPropertyValue('--danger-color').trim() || '#e74c3c';

      const backgroundColors = [
          `${successColor}b3`, // Adiciona ~70% de opacidade (b3 em hexadecimal)
          `${warningColor}b3`,
          `${dangerColor}b3`
      ];
      const borderColors = [successColor, warningColor, dangerColor];

      // Criar gráfico
      const ctx = canvas.getContext('2d');
      chartInstanceStatus = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: labels,
              datasets: [{
                  label: 'Status', // Adicionado label ao dataset
                  data: values,
                  backgroundColor: backgroundColors,
                  borderColor: borderColors,
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false, // Permite controlar melhor o tamanho
              plugins: {
                  legend: {
                      position: 'bottom', // Posição da legenda (bottom pode ser melhor para doughnut)
                      labels: {
                          boxWidth: 12 // Tamanho da caixa de cor
                      }
                  },
                  title: {
                      display: true,
                      text: 'Distribuição de Status das Atividades',
                      padding: {
                          top: 10,
                          bottom: 15 // Mais espaço abaixo do título
                      }
                  },
                  tooltip: {
                      callbacks: {
                          label: function(context) {
                              let label = context.label || '';
                              if (label) {
                                  label += ': ';
                              }
                              if (context.parsed !== null) {
                                  // Calcular porcentagem
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
  // <<< --- FIM NOVA FUNÇÃO --- >>>


  // Renderizar lista de últimos relatórios
  function renderizarUltimosRelatorios(relatorios) {
    // ... (código existente sem alterações) ...
    const container = document.getElementById('ultimosRelatorios');
    if (!container) return;
    if (relatorios.length === 0) { container.innerHTML = '<div class="alert alert-info">Nenhum relatório recente encontrado.</div>'; return; }
    let html = '<div class="table-responsive"><table class="table table-striped table-hover table-sm">';
    html += `<thead><tr><th>Origem</th><th>Data</th><th>Horário</th><th>Letra</th><th>Supervisor</th><th>Equipes</th><th class="text-center">Ações</th></tr></thead><tbody>`;
    relatorios.forEach(rel => {
      const badgeClass = rel.origem === 'local' ? 'bg-secondary' : (rel.origem === 'simulado' ? 'bg-warning text-dark' : 'bg-info');
      const desabilitarAcoes = rel.origem === 'simulado';
      html += `
        <tr>
          <td><span class="badge ${badgeClass}">${rel.origem}</span></td><td>${rel.data}</td><td>${rel.horario}</td><td>${rel.letra}</td><td>${rel.supervisor}</td>
          <td><span class="badge bg-primary">${rel.totalEquipes}</span></td>
          <td class="text-center"> <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-primary btn-sm" onclick="visualizarRelatorioExistente('${rel.id}', '${rel.origem}', 'gerarRelatorioTexto')" title="Visualizar" ${desabilitarAcoes ? 'disabled' : ''}><i class="bi bi-eye"></i></button>
            <button type="button" class="btn btn-info text-white btn-sm" onclick="formatarWhatsAppExistente('${rel.id}', '${rel.origem}', 'formatarWhatsApp')" title="Formatar WhatsApp" ${desabilitarAcoes ? 'disabled' : ''}><i class="bi bi-whatsapp"></i></button>
          </div> </td>
        </tr>`;
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
