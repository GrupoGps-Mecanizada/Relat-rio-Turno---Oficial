/**
 * Sistema simples de gerenciamento de estado
 * Permite centralizar dados e notificar componentes sobre mudanças
 */

// Registrar o módulo 'state' com o ModuleLoader
ModuleLoader.register('state', function() {
  const stateData = {
    currentUser: null,
    isAuthenticated: false,
    currentStep: 'stepTurno',
    equipes: [],
    dadosTurno: {},
    ultimoRelatorioId: null,
    darkMode: localStorage.getItem('darkMode') === 'true',
    cachedData: {}
  };
  
  const listeners = {};
  
  // Sistema de observadores simples
  function subscribe(key, callback) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
    return () => unsubscribe(key, callback);
  }
  
  function unsubscribe(key, callback) {
    if (!listeners[key]) return;
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  }
  
  // Atualizar estado e notificar observadores
  function update(key, value) {
    stateData[key] = value;
    console.log(`Estado '${key}' atualizado:`, value);
    if (listeners[key]) {
      listeners[key].forEach(callback => callback(value));
    }
    // Persistir alguns estados específicos
    if (key === 'darkMode') {
      localStorage.setItem('darkMode', value);
    }
  }
  
  function get(key) {
    return stateData[key];
  }
  
  // Método para salvar cache
  function cacheData(key, data, expirationMinutes = 30) {
    const cacheItem = {
      data: data,
      expiry: new Date().getTime() + (expirationMinutes * 60 * 1000)
    };
    
    const cache = stateData.cachedData || {};
    cache[key] = cacheItem;
    update('cachedData', cache);
  }
  
  // Método para recuperar do cache
  function getCachedData(key) {
    const cache = stateData.cachedData || {};
    const cacheItem = cache[key];
    
    if (!cacheItem) return null;
    
    // Verificar se expirou
    if (new Date().getTime() > cacheItem.expiry) {
      delete cache[key];
      update('cachedData', cache);
      return null;
    }
    
    return cacheItem.data;
  }
  
  // Função de inicialização
  function init() {
    console.log('Módulo State inicializado com sucesso.');
    
    // Expor AppState globalmente para compatibilidade
    window.AppState = {
      data: stateData,
      listeners: listeners,
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      update: update,
      get: get,
      cacheData: cacheData,
      getCachedData: getCachedData
    };
    
    return window.AppState;
  }
  
  // Retornar interface do módulo
  return {
    init: init,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    update: update,
    get: get,
    cacheData: cacheData,
    getCachedData: getCachedData
  };
});
