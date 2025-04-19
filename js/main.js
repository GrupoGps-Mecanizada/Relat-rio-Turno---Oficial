/**
 * Arquivo principal de inicialização (main.js)
 * Integra todos os módulos e inicializa o aplicativo.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando Sistema de Relatório de Turno v3.0...');

  try {
    // Garantir que ModuleLoader existe
    if (!window.ModuleLoader) {
        console.error("ModuleLoader não está definido! Verifique a ordem de carregamento dos scripts no HTML.");
        alert("Erro crítico: Falha ao carregar o inicializador de módulos. A aplicação pode não funcionar.");
        return;
    }

    // Inicializar módulos básicos
    ModuleLoader.initialize('cacheManager');
    ModuleLoader.initialize('state'); // AppState deve ser inicializado aqui

    // ----- MOVER Bloco de Subscrição PARA CÁ -----
    if (window.AppState && typeof AppState.subscribe === 'function') {
        console.log("Configurando observadores de estado (AppState)...");

        // Sincronizar equipes com estado -> UI
        AppState.subscribe('equipes', function(novasEquipes) {
            console.log("Estado 'equipes' atualizado via subscribe:", novasEquipes);
            // Atualiza a variável global em app.js (se ainda for usada como fallback)
             if (typeof window.equipes !== 'undefined') window.equipes = novasEquipes || [];
            // Chama funções de atualização da UI (definidas em app.js)
            if (typeof atualizarListaEquipes === 'function') atualizarListaEquipes();
            if (typeof atualizarBotaoAvancar === 'function') atualizarBotaoAvancar();
        });

        // Sincronizar dados do turno com estado
        AppState.subscribe('dadosTurno', function(novosDadosTurno) {
            console.log("Estado 'dadosTurno' atualizado via subscribe:", novosDadosTurno);
             if (typeof window.dadosTurno !== 'undefined') window.dadosTurno = novosDadosTurno || {};
        });

        // Sincronizar ID do relatório com estado
        AppState.subscribe('ultimoRelatorioId', function(novoId) {
            console.log("Estado 'ultimoRelatorioId' atualizado via subscribe:", novoId);
             if (typeof window.ultimoRelatorioId !== 'undefined') window.ultimoRelatorioId = novoId;
        });

         // Sincronizar darkMode (se necessário em algum lugar além do themeManager)
         AppState.subscribe('darkMode', function(isDark) {
             console.log("Estado 'darkMode' atualizado via subscribe:", isDark);
             // A classe no body já é gerenciada pelo themeManager
         });

    } else {
        // Este log não deve mais aparecer se state.js inicializar corretamente
        console.warn("AppState não encontrado ou não possui o método subscribe logo após inicialização do módulo state.");
    }
    // ----- FIM do Bloco Movido -----


    // Inicializar outros módulos
    ModuleLoader.initialize('performanceMonitor');
    ModuleLoader.initialize('themeManager'); // Inicializa ANTES de responsiveUI
    ModuleLoader.initialize('responsiveUI');
    ModuleLoader.initialize('notifications');
    ModuleLoader.initialize('security'); // Inicializa ANTES de auth

    // Carregar Auth e Dashboard condicionalmente
    const authRequired = window.CONFIG?.AUTH_REQUIRED ?? false;
    const googleClientId = window.CONFIG?.GOOGLE_CLIENT_ID ?? '';

    if (authRequired || googleClientId) {
        console.log("Configuração de autenticação encontrada, inicializando googleAuth...");
        ModuleLoader.initialize('googleAuth');

        // Ouvir evento de login para inicializar o dashboard
        document.addEventListener('userLoggedIn', function(event) {
            console.log("Evento 'userLoggedIn' recebido, inicializando dashboard...");
            console.log("Usuário:", event.detail?.name);
            ModuleLoader.initialize('dashboard');
        });
        // Se o usuário já estiver logado na inicialização (verificado dentro de googleAuth.init),
        // o evento 'userLoggedIn' pode não ser disparado aqui.
        // Considere inicializar o dashboard também dentro do googleAuth.init se o usuário já estiver logado.
        // Ou verificar o estado de autenticação aqui após inicializar googleAuth.
         const GoogleAuth = ModuleLoader.get('googleAuth');
         if (GoogleAuth && GoogleAuth.isUserAuthenticated()) {
              console.log("Usuário já autenticado na inicialização, inicializando dashboard...");
              ModuleLoader.initialize('dashboard');
         }


    } else {
        console.log("Autenticação não configurada ou não requerida.");
        // Se a autenticação não é necessária, inicializar o dashboard diretamente?
         // ModuleLoader.initialize('dashboard'); // Descomente se o dashboard não depender de login
    }


    // Inicializar a lógica principal da aplicação (formulários, etc.)
    if (typeof inicializarFormulario === 'function') {
      inicializarFormulario(); // Chama a função principal do app.js
    } else {
      console.error("Função inicializarFormulario não definida! Verifique se app.js foi carregado corretamente.");
       alert("Erro crítico: Falha ao carregar a lógica principal da aplicação.");
       return;
    }

    // Configurar Data Padrão - movido para dentro de inicializarFormulario ou novoRelatorio em app.js
    // const dataInput = document.getElementById('data'); ...

    // Configurar listeners de botões globais (header, etc.)
    setupGlobalButtonListeners();


    console.log('Processo de inicialização do main.js concluído!');

  } catch (error) {
    console.error("Erro fatal durante a inicialização do sistema:", error);
    alert("Ocorreu um erro grave ao iniciar a aplicação. Por favor, recarregue a página ou contate o suporte.\n\nDetalhes: " + error.message);
  }
});


/**
 * Configura listeners para botões globais que não pertencem a uma etapa específica
 */
function setupGlobalButtonListeners() {
    const btnPesquisar = document.getElementById('btnPesquisar');
    const btnAjuda = document.getElementById('btnAjuda');
    const dashboardTab = document.getElementById('dashboardTab');
    // O botão de tema é configurado pelo themeManager

    if(btnPesquisar && typeof abrirPesquisa === 'function') {
        btnPesquisar.addEventListener('click', abrirPesquisa);
    }
    if(btnAjuda && typeof mostrarHelp === 'function') {
        btnAjuda.addEventListener('click', mostrarHelp);
    }
     if(dashboardTab && typeof mostrarDashboard === 'function') {
        dashboardTab.addEventListener('click', mostrarDashboard);
    }
}


// Variáveis globais para retrocompatibilidade - EVITAR USAR DIRETAMENTE
// Devem ser gerenciadas preferencialmente via AppState
// let equipes = [];
// let dadosTurno = {};
// let ultimoRelatorioId = null;


// --- Wrappers/Melhorias nas funções de UI (mantidos por enquanto) ---
// Garantem que os módulos sejam usados se disponíveis, sem quebrar código antigo

// Melhorar função de notificação
if (typeof window.mostrarNotificacao === 'function') {
    const originalMostrarNotificacao = window.mostrarNotificacao;
    window.mostrarNotificacao = function(mensagem, tipo = 'info') { // tipo 'info' como padrão
      const Notifications = window.Notifications || ModuleLoader?.get('notifications');
      const tipoValido = ['success', 'info', 'warning', 'error', 'danger'].includes(tipo) ? tipo : 'info';
      // Corrigir 'danger' para 'error' se o módulo só tiver 'error'
      const tipoModulo = (tipoValido === 'danger' && Notifications && !Notifications.danger) ? 'error' : tipoValido;

      if (Notifications && typeof Notifications[tipoModulo] === 'function') {
          try {
            Notifications[tipoModulo](mensagem);
          } catch (e) {
               console.error("Erro ao chamar Notifications module:", e);
               originalMostrarNotificacao(mensagem, tipo); // Fallback para a original global
          }
      } else {
         console.warn("Módulo Notifications não disponível ou função inválida, usando notificação original/fallback.");
         originalMostrarNotificacao(mensagem, tipo); // Fallback para a original global
      }
    };
    console.log("Função global 'mostrarNotificacao' aprimorada para usar Módulo Notifications.");
}

// Melhorar função de mostrar/ocultar loading com PerformanceMonitor
let currentOperationMeasurement = null; // Armazenar medição atual

if (typeof window.mostrarLoading === 'function') {
    const originalMostrarLoading = window.mostrarLoading;
    window.mostrarLoading = function(mensagem = 'Processando...') {
      const PerformanceMonitor = ModuleLoader?.get('performanceMonitor');
      if (PerformanceMonitor && typeof PerformanceMonitor.startMeasure === 'function') {
        try {
            // Limpar medição anterior se existir
             if (currentOperationMeasurement) {
                 console.warn("Chamada mostrarLoading aninhada detectada. Finalizando medição anterior.");
                 PerformanceMonitor.endMeasure(currentOperationMeasurement);
             }
            // Criar nome válido para a medição
            const measureName = 'loading_' + String(mensagem).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
            currentOperationMeasurement = PerformanceMonitor.startMeasure(measureName);
        } catch(e) { console.error("Erro ao iniciar medição de performance:", e); }
      }
      originalMostrarLoading(mensagem); // Chamar função original de app.js
    };
     console.log("Função global 'mostrarLoading' aprimorada para usar Módulo PerformanceMonitor.");
}

if (typeof window.ocultarLoading === 'function') {
    const originalOcultarLoading = window.ocultarLoading;
    window.ocultarLoading = function() {
       const PerformanceMonitor = ModuleLoader?.get('performanceMonitor');
      if (PerformanceMonitor && typeof PerformanceMonitor.endMeasure === 'function' && currentOperationMeasurement) {
         try {
             PerformanceMonitor.endMeasure(currentOperationMeasurement);
         } catch(e) { console.error("Erro ao finalizar medição de performance:", e); }
         currentOperationMeasurement = null; // Limpar operação atual
      } else if (currentOperationMeasurement) {
          // Se o monitor não estiver disponível mas a medição foi iniciada, limpar a referência
          console.warn("PerformanceMonitor não encontrado para finalizar medição.");
          currentOperationMeasurement = null;
      }
      originalOcultarLoading(); // Chamar função original de app.js
    };
     console.log("Função global 'ocultarLoading' aprimorada para usar Módulo PerformanceMonitor.");
}
