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
      
      // Verificar se AppState foi inicializado corretamente
      if (!window.AppState) {
        console.error("AppState não inicializado corretamente!");
        // Criar um AppState básico de fallback
        window.AppState = {
          // Estado interno
          _state: {},
          // Callbacks registrados
          _subscribers: {},
          
          // Obter valor do estado
          get: function(key) {
            return this._state[key];
          },
          
          // Definir valor no estado
          update: function(key, value) {
            this._state[key] = value;
            // Notificar subscribers
            if (this._subscribers[key]) {
              this._subscribers[key].forEach(callback => {
                try {
                  callback(value);
                } catch (e) {
                  console.error(`Erro em subscriber para '${key}':`, e);
                }
              });
            }
            return value;
          },
          
          // Registrar callback para mudanças
          subscribe: function(key, callback) {
            if (!this._subscribers[key]) {
              this._subscribers[key] = [];
            }
            this._subscribers[key].push(callback);
          }
        };
        console.warn("Implementado AppState básico de fallback.");
      }
      
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
      }

      // Carregar dashboard após autenticação (se necessário e se googleAuth foi carregado)
      // O evento 'userLoggedIn' deve ser disparado pelo módulo googleAuth
      document.addEventListener('userLoggedIn', function() {
         console.log("Evento 'userLoggedIn' recebido, inicializando dashboard...");
         ModuleLoader.initialize('dashboard');
      });

    } else {
      console.error("ModuleLoader não está definido! Verifique a ordem de carregamento dos scripts no HTML.");
      // Opcional: Mostrar um erro para o usuário
      alert("Erro crítico: Falha ao carregar o inicializador de módulos. A aplicação pode não funcionar.");
      return; // Interromper inicialização se o loader falhar
    }

    // Inicializar formulário principal (chama a função definida em app.js)
    if (typeof inicializarFormulario === 'function') {
        inicializarFormulario();
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

    console.log('Processo de inicialização concluído!');

  } catch (error) {
      console.error("Erro fatal durante a inicialização do sistema:", error);
      // Opcional: Mostrar mensagem de erro mais visível para o usuário
      alert("Ocorreu um erro grave ao iniciar a aplicação. Por favor, recarregue a página ou contate o suporte.\n\nDetalhes: " + error.message);
  }
});

// Variáveis globais para retrocompatibilidade - REMOVIDAS
// As variáveis equipes, dadosTurno, etc., devem ser gerenciadas pelo app.js ou AppState.
// let equipes = []; // Removido
// let dadosTurno = {}; // Removido
// let ultimoRelatorioId = null; // Removido
// let modalEquipe = null; // Removido - inicializado em app.js
// let modalHelp = null; // Removido - inicializado em app.js

/**
 * Observadores de estado para conectar AppState com funções legadas (se necessário)
 * Esta parte assume que app.js define as funções globais e AppState existe.
 */
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
    console.warn("AppState não encontrado ou não possui o método subscribe. A sincronização de estado pode não funcionar.");
}

/**
 * Inicializar modais do Bootstrap - REMOVIDO
 * Assumindo que app.js cuida disso no seu DOMContentLoaded.
 */
// function initializeModals() { ... } // Removido
// window.initializeModals = initializeModals; // Removido

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
      } else {
         // Fallback para o sistema original (passando apenas a mensagem)
         originalMostrarNotificacao(mensagem);
         // Opcional: Simular tipos no fallback (ex: mudar cor do toast antigo)
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
      if (window.PerformanceMonitor && typeof PerformanceMonitor.endMeasure === 'function' && window.currentOperation) {
         try {
             PerformanceMonitor.endMeasure(window.currentOperation);
         } catch(e) { console.error("Erro ao finalizar medição de performance:", e); }
         window.currentOperation = null; // Limpar operação atual
      }
      // Chamar função original
      originalOcultarLoading();
    };
     console.log("Função ocultarLoading aprimorada.");
}
