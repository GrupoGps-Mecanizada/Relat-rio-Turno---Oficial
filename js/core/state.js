/**
 * Sistema simples de gerenciamento de estado
 * Permite centralizar dados e notificar componentes sobre mudanças
 */
const AppState = {
  data: {
    currentUser: null,
    isAuthenticated: false,
    currentStep: 'stepTurno',
    equipes: [],
    dadosTurno: {},
    ultimoRelatorioId: null,
    darkMode: localStorage.getItem('darkMode') === 'true',
    cachedData: {}
  },
  
  listeners: {},
  
  // Sistema de observadores simples
  subscribe(key, callback) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => this.unsubscribe(key, callback);
  },
  
  unsubscribe(key, callback) {
    if (!this.listeners[key]) return;
    this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
  },
  
  // Atualizar estado e notificar observadores
  update(key, value) {
    this.data[key] = value;
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(value));
    }
    // Persistir alguns estados específicos
    if (key === 'darkMode') {
      localStorage.setItem('darkMode', value);
    }
  },
  
  get(key) {
    return this.data[key];
  },
  
  // Método para salvar cache
  cacheData(key, data, expirationMinutes = 30) {
    const cacheItem = {
      data: data,
      expiry: new Date().getTime() + (expirationMinutes * 60 * 1000)
    };
    
    const cache = this.data.cachedData || {};
    cache[key] = cacheItem;
    this.update('cachedData', cache);
  },
  
  // Método para recuperar do cache
  getCachedData(key) {
    const cache = this.data.cachedData || {};
    const cacheItem = cache[key];
    
    if (!cacheItem) return null;
    
    // Verificar se expirou
    if (new Date().getTime() > cacheItem.expiry) {
      delete cache[key];
      this.update('cachedData', cache);
      return null;
    }
    
    return cacheItem.data;
  }
};

// Exportar o módulo para uso global
window.AppState = AppState;
