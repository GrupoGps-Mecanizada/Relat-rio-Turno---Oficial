/**
 * Arquivo principal de inicialização (main.js)
 * Integra todos os módulos e inicializa o aplicativo.
 */

// Listener principal que executa quando o HTML está pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando Sistema de Relatório de Turno v3.0...');

  try { // Adicionado try...catch para robustez na inicialização

    // Inicializar módulos básicos (Dependem de ModuleLoader.js ter sido carregado antes)
    if (window.ModuleLoader) { // Verificar se ModuleLoader existe
      ModuleLoader.initialize('cacheManager');
      ModuleLoader.initialize('state'); // AppState deve ser inicializado primeiro

      // ----- Bloco AppState.subscribe MOVIDO para cá -----
      if (window.AppState && typeof AppState.subscribe === 'function') {
        console.log("Configurando observadores de estado (AppState)...");

        // Sincronizar equipes com estado -> UI
        AppState.subscribe('equipes', function(novasEquipes) {
          console.log("Estado 'equipes' atualizado:", novasEquipes);
          // Atualiza a variável global em app.js (se ela ainda for usada)
          if(typeof window.equipes !== 'undefined') window.equipes = novasEquipes;
          // Chama funções de atualização da UI (definidas em app.js)
          if (typeof atualizarListaEquipes === 'function') atualizarListaEquipes();
          if (typeof atualizarBotaoAvancar === 'function') atualizarBotaoAvancar();
        });

        // Sincronizar dados do turno com estado
        AppState.subscribe('dadosTurno', function(novosDadosTurno) {
           console.log("Estado 'dadosTurno' atualizado:", novosDadosTurno);
           // Atualiza a variável global em app.js (se ela ainda for usada)
           if(typeof window.dadosTurno !== 'undefined') window.dadosTurno = novosDadosTurno;
        });

        // Sincronizar ID do relatório com estado
        AppState.subscribe('ultimoRelatorioId', function(novoId) {
           console.log("Estado 'ultimoRelatorioId' atualizado:", novoId);
            // Atualiza a variável global em app.js (se ela ainda for usada)
           if(typeof window.ultimoRelatorioId !== 'undefined') window.ultimoRelatorioId = novoId;
        });

      } else {
          console.warn("AppState não encontrado ou não possui o método subscribe após inicialização. A sincronização de estado pode não funcionar.");
      }
      // ----- Fim do bloco movido -----


      ModuleLoader.initialize('performanceMonitor');

      // Carregar módulos de interface
      ModuleLoader.initialize('themeManager');
      ModuleLoader.initialize('responsiveUI'); // Assumindo que existe um módulo com este nome

      // Carregar módulos de funcionalidade
      ModuleLoader.initialize('notifications');
      ModuleLoader.initialize('security');

      // Verificar se há configuração para autenticação
      if (window.CONFIG && (CONFIG.AUTH_REQUIRED || CONFIG.GOOGLE_CLIENT_ID)) {
        ModuleLoader.initialize('googleAuth');
      } else {
         // Se autenticação não for necessária, talvez inicializar o dashboard imediatamente?
         // ModuleLoader.initialize('dashboard'); // Descomentar se necessário
         console.log("Autenticação não configurada ou não requerida.");
         // Se auth não for necessária, inicializar o dashboard aqui se ele não depender do login
         if (!window.CONFIG?.AUTH_REQUIRED) {
             ModuleLoader.initialize('dashboard');
         }
      }

      // Carregar dashboard após autenticação (se necessário e se googleAuth foi carregado)
      // O evento 'userLoggedIn' deve ser disparado pelo módulo googleAuth
      document.addEventListener('userLoggedIn', function() {
         console.log("Evento 'userLoggedIn' recebido, inicializando dashboard...");
         ModuleLoader.initialize('dashboard');
      });

      // Configurar botões da barra superior que chamam funções globais/módulos
      const btnPesquisar = document.getElementById('btnPesquisar');
      if(btnPesquisar && typeof abrirPesquisa === 'function') {
          btnPesquisar.addEventListener('click', abrirPesquisa);
      }

      const btnAjuda = document.getElementById('btnAjuda');
      if(btnAjuda && typeof mostrarHelp === 'function') {
          btnAjuda.addEventListener('click', mostrarHelp);
      }

      const btnTema = document.getElementById('btnTema');
      if(btnTema && ModuleLoader.isAvailable('themeManager')) {
          btnTema.addEventListener('click', () => {
              const themeManager = ModuleLoader.get('themeManager');
              if(themeManager && typeof themeManager.toggleTheme === 'function') {
                  const isDark = themeManager.toggleTheme();
                   // Atualizar ícone e texto do botão
                  btnTema.innerHTML = isDark
                    ? '<i class="bi bi-sun"></i> <span class="d-none d-sm-inline">Modo Claro</span>'
                    : '<i class="bi bi-moon"></i> <span class="d-none d-sm-inline">Modo Escuro</span>';
              }
          });
          // Atualizar estado inicial do botão de tema
          const themeManager = ModuleLoader.get('themeManager');
           if (themeManager && typeof themeManager.isDark === 'function') {
                const isDark = themeManager.isDark();
                btnTema.innerHTML = isDark
                    ? '<i class="bi bi-sun"></i> <span class="d-none d-sm-inline">Modo Claro</span>'
                    : '<i class="bi bi-moon"></i> <span class="d-none d-sm-inline">Modo Escuro</span>';
           }
      }

       const dashboardTab = document.getElementById('dashboardTab');
       if(dashboardTab && ModuleLoader.isAvailable('dashboard')) {
           dashboardTab.addEventListener('click', () => {
               const dashboard = ModuleLoader.get('dashboard');
               if(dashboard && typeof dashboard.mostrarDashboard === 'function') {
                   dashboard.mostrarDashboard();
               }
           });
       }

       // Configurar botão de avançar etapa 1
       const btnAvancarEquipes = document.getElementById('btnAvancarEquipes');
       if(btnAvancarEquipes && typeof avancarParaEquipes === 'function') {
           btnAvancarEquipes.addEventListener('click', avancarParaEquipes);
       }


    } else {
      console.error("ModuleLoader não está definido! Verifique a ordem de carregamento dos scripts no HTML.");
      alert("Erro crítico: Falha ao carregar o inicializador de módulos. A aplicação pode não funcionar.");
      return; // Interromper inicialização se o loader falhar
    }

    // Inicializar formulário principal (chama a função definida em app.js)
    if (typeof inicializarFormulario === 'function') {
        inicializarFormulario(); // Esta função agora é chamada depois da configuração dos subscribes
    } else {
        console.error("Função inicializarFormulario não definida! Verifique se app.js foi carregado corretamente.");
    }

    // Configurar data padrão como hoje (método consistente)
    const dataInput = document.getElementById('data');
    if (dataInput) {
        try {
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000; // Offset em milissegundos
            const localDate = new Date(today.getTime() - offset);
            dataInput.value = localDate.toISOString().split('T')[0];
        } catch (e) {
            console.error("Erro ao definir data padrão:", e);
            dataInput.value = ''; // Fallback
        }
    }

     // Atualizar versão no footer e ajuda
     const appVersion = window.CONFIG?.VERSAO_APP || '3.0';
     const versionSpan = document.getElementById('appVersion');
     const helpVersionSpan = document.getElementById('helpAppVersion');
     if (versionSpan) versionSpan.textContent = appVersion;
     if (helpVersionSpan) helpVersionSpan.textContent = appVersion;


    console.log('Processo de inicialização concluído!');

  } catch (error) {
      console.error("Erro fatal durante a inicialização do sistema:", error);
      alert("Ocorreu um erro grave ao iniciar a aplicação. Por favor, recarregue a página ou contate o suporte.\n\nDetalhes: " + error.message);
  }
});

// Variáveis globais para retrocompatibilidade - REMOVIDAS
// let equipes = []; // Removido
// let dadosTurno = {}; // Removido
// let ultimoRelatorioId = null; // Removido
// let modalEquipe = null; // Removido - inicializado em app.js
// let modalHelp = null; // Removido - inicializado em app.js


// Bloco AppState.subscribe FOI MOVIDO para dentro do DOMContentLoaded acima


/**
 * Melhorias/Wrappers nas funções de UI existentes (mantido)
 * Garante que as novas funcionalidades (Notifications, PerformanceMonitor) sejam usadas
 * sem quebrar o código antigo se os módulos não carregarem.
 */

// Melhorar função de notificação
if (typeof window.mostrarNotificacao === 'function') { // Só sobrescreve se a original existir
    const originalMostrarNotificacao = window.mostrarNotificacao;
    window.mostrarNotificacao = function(mensagem, tipo = 'success') { // Adicionado parâmetro tipo
      // Usar novo sistema de notificações se disponível
      if (window.Notifications && typeof window.Notifications[tipo] === 'function') {
        window.Notifications[tipo](mensagem);
      } else if (window.ModuleLoader && ModuleLoader.isInitialized('notifications')) {
          // Tenta obter o módulo se a global não existir (mais robusto)
          const NotificationsModule = ModuleLoader.get('notifications');
          if (NotificationsModule && typeof NotificationsModule[tipo] === 'function') {
              NotificationsModule[tipo](mensagem);
          } else {
              originalMostrarNotificacao(mensagem); // Fallback final
              console.warn("Módulo Notifications não disponível/funcional, usando notificação original.");
          }
      }
      else {
         // Fallback para o sistema original (passando apenas a mensagem)
         originalMostrarNotificacao(mensagem);
         console.warn("Módulo Notifications não disponível, usando notificação original.");
      }
    };
    console.log("Função mostrarNotificacao aprimorada.");
}

// Melhorar função de mostrar/ocultar loading
if (typeof window.mostrarLoading === 'function') { // Só sobrescreve se a original existir
    const originalMostrarLoading = window.mostrarLoading;
    window.mostrarLoading = function(mensagem = 'Processando...') { // Default message
      // Iniciar medição de performance
      if (window.PerformanceMonitor && typeof PerformanceMonitor.startMeasure === 'function') {
          try {
            // Remover caracteres inválidos para nome da medição
            const measureName = 'loading_' + String(mensagem).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
            window.currentOperation = PerformanceMonitor.startMeasure(measureName);
        } catch(e) { console.error("Erro ao iniciar medição de performance:", e); }

      } else if (window.ModuleLoader && ModuleLoader.isInitialized('performanceMonitor')) {
          // Tenta obter o módulo se a global não existir
          const perfMonitor = ModuleLoader.get('performanceMonitor');
           if(perfMonitor && typeof perfMonitor.startMeasure === 'function') {
                 try {
                    const measureName = 'loading_' + String(mensagem).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
                    window.currentOperation = perfMonitor.startMeasure(measureName);
                } catch(e) { console.error("Erro ao iniciar medição de performance:", e); }
           }
      }
      // Chamar função original
      originalMostrarLoading(mensagem);
    };
     console.log("Função mostrarLoading aprimorada.");
}

if (typeof window.ocultarLoading === 'function') { // Só sobrescreve se a original existir
    const originalOcultarLoading = window.ocultarLoading;
    window.ocultarLoading = function() {
      // Finalizar medição de performance
      let perfMonitorInstance = null;
      if (window.PerformanceMonitor && typeof PerformanceMonitor.endMeasure === 'function') {
          perfMonitorInstance = PerformanceMonitor;
      } else if (window.ModuleLoader && ModuleLoader.isInitialized('performanceMonitor')) {
           perfMonitorInstance = ModuleLoader.get('performanceMonitor');
      }

      if (perfMonitorInstance && typeof perfMonitorInstance.endMeasure === 'function' && window.currentOperation) {
         try {
             perfMonitorInstance.endMeasure(window.currentOperation);
         } catch(e) { console.error("Erro ao finalizar medição de performance:", e); }
         window.currentOperation = null; // Limpar operação atual
      }
      // Chamar função original
      originalOcultarLoading();
    };
     console.log("Função ocultarLoading aprimorada.");
}
