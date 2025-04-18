/**
 * Gerenciador de Cache
 * Implementa sistema de cache para melhorar o desempenho
 */
ModuleLoader.register('cacheManager', function() {
  // Tipo de armazenamento
  const STORAGE_TYPE = {
    LOCAL: 'localStorage',
    SESSION: 'sessionStorage',
    MEMORY: 'memory'
  };
  
  // Cache em memória
  const memoryCache = {};
  
  // Inicialização
  function init() {
    // Limpar caches expirados
    cleanExpiredCache();
    
    // Programar limpeza periódica
    setInterval(cleanExpiredCache, 10 * 60 * 1000); // A cada 10 minutos
  }
  
  // Armazenar item no cache
  function setItem(key, value, expirationMinutes = 30, storageType = STORAGE_TYPE.LOCAL) {
    try {
      // Preparar dados com expiração
      const cacheItem = {
        data: value,
        expires: new Date().getTime() + (expirationMinutes * 60 * 1000)
      };
      
      // Serializar se necessário
      const serializedData = (typeof value === 'object')
        ? JSON.stringify(cacheItem)
        : cacheItem;
        
      // Armazenar conforme o tipo
      switch(storageType) {
        case STORAGE_TYPE.LOCAL:
          localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
          break;
        case STORAGE_TYPE.SESSION:
          sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
          break;
        case STORAGE_TYPE.MEMORY:
          memoryCache[key] = cacheItem;
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao armazenar item no cache:', error);
      return false;
    }
  }
  
  // Recuperar item do cache
  function getItem(key, storageType = STORAGE_TYPE.LOCAL) {
    try {
      let cacheItem;
      
      // Recuperar conforme o tipo
      switch(storageType) {
        case STORAGE_TYPE.LOCAL:
          cacheItem = JSON.parse(localStorage.getItem(`cache_${key}`));
          break;
        case STORAGE_TYPE.SESSION:
          cacheItem = JSON.parse(sessionStorage.getItem(`cache_${key}`));
          break;
        case STORAGE_TYPE.MEMORY:
          cacheItem = memoryCache[key];
          break;
      }
      
      // Verificar se existe e não expirou
      if (cacheItem && cacheItem.expires) {
        if (new Date().getTime() < cacheItem.expires) {
          return cacheItem.data;
        } else {
          // Remover se expirou
          removeItem(key, storageType);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao recuperar item do cache:', error);
      return null;
    }
  }
  
  // Remover item do cache
  function removeItem(key, storageType = STORAGE_TYPE.LOCAL) {
    try {
      switch(storageType) {
        case STORAGE_TYPE.LOCAL:
          localStorage.removeItem(`cache_${key}`);
          break;
        case STORAGE_TYPE.SESSION:
          sessionStorage.removeItem(`cache_${key}`);
          break;
        case STORAGE_TYPE.MEMORY:
          delete memoryCache[key];
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao remover item do cache:', error);
      return false;
    }
  }
  
  // Limpar caches expirados
  function cleanExpiredCache() {
    const now = new Date().getTime();
    
    // Limpar localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('cache_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            
            if (item.expires && now > item.expires) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Ignorar item inválido
          }
        }
      }
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
    
    // Limpar sessionStorage
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        
        if (key.startsWith('cache_')) {
          try {
            const item = JSON.parse(sessionStorage.getItem(key));
            
            if (item.expires && now > item.expires) {
              sessionStorage.removeItem(key);
            }
          } catch (e) {
            // Ignorar item inválido
          }
        }
      }
    } catch (error) {
      console.error('Erro ao limpar sessionStorage:', error);
    }
    
    // Limpar memoryCache
    for (const key in memoryCache) {
      if (memoryCache[key].expires && now > memoryCache[key].expires) {
        delete memoryCache[key];
      }
    }
  }
  
  // Limpar todo o cache
  function clearAll() {
    // Limpar localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar todo o localStorage:', error);
    }
    
    // Limpar sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        
        if (key.startsWith('cache_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar todo o sessionStorage:', error);
    }
    
    // Limpar memoryCache
    for (const key in memoryCache) {
      delete memoryCache[key];
    }
  }
  
  // Exportar funções públicas
  return {
    init,
    setItem,
    getItem,
    removeItem,
    clearAll,
    STORAGE_TYPE
  };
});
