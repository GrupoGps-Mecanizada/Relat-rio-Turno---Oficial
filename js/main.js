/**
 * Arquivo principal de inicialização
 * Integra todos os módulos e inicializa o aplicativo
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando Sistema de Relatório de Turno v3.0');
  
  // Inicializar módulos básicos
  ModuleLoader.initialize('cacheManager');
  ModuleLoader.initialize('state');
  ModuleLoader.initialize('performanceMonitor');
  
  // Carregar módulos de interface
  ModuleLoader.initialize('themeManager');
  ModuleLoader.initialize('responsiveUI');
  
  // Carregar módulos de funcionalidade
  ModuleLoader.initialize('notifications');
  ModuleLoader.initialize('security');
  
  // Verificar se há configuração para autenticação
  if (CONFIG.AUTH_REQUIRED || CONFIG.GOOGLE_CLIENT_ID) {
    ModuleLoader.initialize('googleAuth');
  }
  
  // Carregar dashboard após autenticação (se necessário)
  document.addEventListener('userLoggedIn', function() {
    ModuleLoader.initialize('dashboard');
  });
  
  // Inicializar formulário principal
  inicializarFormulario();
  
  // Configurar data padrão como hoje
  document.getElementById('data').valueAsDate = new Date();
  
  console.log('Sistema inicializado com sucesso!');
});

// Variáveis globais para retrocompatibilidade
let equipes = [];
let dadosTurno = {};
let ultimoRelatorioId = null;
let modalEquipe = null;
let modalHelp = null;

/**
 * Observadores de estado para conectar API antiga com novo sistema
 */
if (window.AppState) {
  // Sincronizar equipes com estado
  AppState.subscribe('equipes', function(value) {
    equipes = value;
    atualizarListaEquipes();
    atualizarBotaoAvancar();
  });
  
  // Sincronizar dados do turno com estado
  AppState.subscribe('dadosTurno', function(value) {
    dadosTurno = value;
  });
  
  // Sincronizar ID do relatório com estado
  AppState.subscribe('ultimoRelatorioId', function(value) {
    ultimoRelatorioId = value;
  });
}

/**
 * Inicializar modais do Bootstrap
 */
function initializeModals() {
  try {
    modalEquipe = new bootstrap.Modal(document.getElementById('modalEquipe'));
    modalHelp = new bootstrap.Modal(document.getElementById('modalHelp'));
  } catch (err) {
    console.error("Erro ao inicializar modals:", err);
  }
}

/**
 * Melhorias nas funções de UI existentes
 */

// Melhorar função de notificação
const originalMostrarNotificacao = window.mostrarNotificacao;
window.mostrarNotificacao = function(mensagem) {
  // Usar novo sistema de notificações se disponível
  if (window.Notifications) {
    Notifications.success(mensagem);
    return;
  }
  
  // Fallback para o sistema original
  if (originalMostrarNotificacao) {
    originalMostrarNotificacao(mensagem);
  }
};

// Melhorar função de mostrar/ocultar loading
const originalMostrarLoading = window.mostrarLoading;
window.mostrarLoading = function(mensagem) {
  // Iniciar medição de performance
  if (window.PerformanceMonitor) {
    window.currentOperation = PerformanceMonitor.startMeasure('loading_' + mensagem);
  }
  
  // Chamar função original
  if (originalMostrarLoading) {
    originalMostrarLoading(mensagem);
  }
};

const originalOcultarLoading = window.ocultarLoading;
window.ocultarLoading = function() {
  // Finalizar medição de performance
  if (window.PerformanceMonitor && window.currentOperation) {
    PerformanceMonitor.endMeasure(window.currentOperation);
    window.currentOperation = null;
  }
  
  // Chamar função original
  if (originalOcultarLoading) {
    originalOcultarLoading();
  }
};

// Expor funções necessárias globalmente
window.initializeModals = initializeModals;
