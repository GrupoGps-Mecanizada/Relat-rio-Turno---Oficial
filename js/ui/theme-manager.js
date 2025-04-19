/**
 * Gerenciador de temas da aplicação
 * Implementa modo escuro/claro e preferências de UI
 */
ModuleLoader.register('themeManager', function() {
  // Constantes
  const THEME_KEY = 'app_theme';
  const DARK_CLASS = 'dark-mode';
  
  // Estado inicial
  let isDarkMode = localStorage.getItem(THEME_KEY) === 'dark';
  
  // Inicialização
  function init() {
    console.log('Inicializando ThemeManager...');
    
    // Aplicar tema salvo
    applyTheme();
    
    // Adicionar toggle de tema
    setTimeout(addThemeToggle, 500); // Atraso para garantir que o DOM esteja pronto
    
    // Observar preferências do sistema
    watchSystemPreference();
    
    console.log('ThemeManager inicializado com sucesso.');
  }
  
  // Aplicar o tema atual
  function applyTheme() {
    if (isDarkMode) {
      document.body.classList.add(DARK_CLASS);
    } else {
      document.body.classList.remove(DARK_CLASS);
    }
    
    // Atualizar AppState
    if (window.AppState) {
      AppState.update('darkMode', isDarkMode);
    }
  }
  
  // Alternar entre temas
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    applyTheme();
    
    // Mostrar notificação se o sistema de notificações estiver disponível
    if (window.Notifications) {
      Notifications.info(`Modo ${isDarkMode ? 'escuro' : 'claro'} ativado`);
    } else {
      console.log(`Modo ${isDarkMode ? 'escuro' : 'claro'} ativado`);
    }
    
    return isDarkMode;
  }
  
  // Adicionar toggle de tema na interface
  function addThemeToggle() {
    // Use um seletor mais confiável
    const headerActions = document.querySelector('.botoes-direita');
    
    if (!headerActions) {
      console.warn("Elemento para botão de tema não encontrado. Tentando alternativa...");
      // Tente um seletor mais geral e confiável
      const alternativeLocation = document.querySelector('.barra-superior') || document.querySelector('.card-header');
      if (alternativeLocation) {
        const themeButton = document.createElement('button');
        themeButton.className = 'btn btn-outline-secondary ms-2 float-end';
        themeButton.id = 'theme-toggle';
        themeButton.innerHTML = isDarkMode 
          ? '<i class="bi bi-sun"></i> Modo Claro'
          : '<i class="bi bi-moon"></i> Modo Escuro';
        
        themeButton.addEventListener('click', function() {
          const newMode = toggleTheme();
          this.innerHTML = newMode 
            ? '<i class="bi bi-sun"></i> Modo Claro'
            : '<i class="bi bi-moon"></i> Modo Escuro';
        });
        
        alternativeLocation.appendChild(themeButton);
      }
      return;
    }
    
    // Criar botão de toggle
    const themeButton = document.createElement('button');
    themeButton.className = 'btn btn-tool ms-2';
    themeButton.id = 'theme-toggle';
    themeButton.innerHTML = isDarkMode 
      ? '<i class="bi bi-sun"></i> Modo Claro'
      : '<i class="bi bi-moon"></i> Modo Escuro';
    
    themeButton.addEventListener('click', function() {
      const newMode = toggleTheme();
      this.innerHTML = newMode 
        ? '<i class="bi bi-sun"></i> Modo Claro'
        : '<i class="bi bi-moon"></i> Modo Escuro';
    });
    
    headerActions.appendChild(themeButton);
    
    // Adicionar estilos para modo escuro se não existirem
    if (!document.getElementById('dark-mode-styles')) {
      const darkStyles = document.createElement('style');
      darkStyles.id = 'dark-mode-styles';
      darkStyles.textContent = `
        body.dark-mode {
          background-color: #121212;
          color: #e0e0e0;
        }
        
        .dark-mode .card {
          background-color: #1e1e1e;
          border-color: #333;
        }
        
        .dark-mode .card-header {
          background-color: #2c2c2c;
          border-bottom-color: #333;
        }
        
        .dark-mode .form-control,
        .dark-mode .form-select {
          background-color: #2c2c2c;
          border-color: #444;
          color: #e0e0e0;
        }
        
        .dark-mode .form-control:focus,
        .dark-mode .form-select:focus {
          background-color: #333;
          border-color: var(--primary-color);
        }
        
        .dark-mode .table {
          color: #e0e0e0;
        }
        
        .dark-mode .table-striped > tbody > tr:nth-of-type(odd) {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .dark-mode .alert-section {
          background-color: #2c2c2c;
          border-color: #444;
        }
        
        .dark-mode .info-item {
          background-color: #2c2c2c;
          border-color: #444;
        }
        
        .dark-mode .relatorio-text {
          background-color: #2c2c2c;
          border-color: #444;
          color: #e0e0e0;
        }
        
        .dark-mode .toast-notification {
          background-color: #333;
        }
        
        .dark-mode footer {
          color: #999 !important;
        }
        
        .dark-mode hr {
          border-color: #444;
        }
      `;
      document.head.appendChild(darkStyles);
    }
  }
  
  // Observar preferências do sistema
  function watchSystemPreference() {
    if (window.matchMedia) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Atualizar tema com base na preferência do sistema, se não tiver preferência salva
      if (!localStorage.getItem(THEME_KEY) && prefersDarkMode.matches !== isDarkMode) {
        isDarkMode = prefersDarkMode.matches;
        applyTheme();
        updateToggleButton();
      }
      
      // Listener para mudanças de preferência
      try {
        prefersDarkMode.addEventListener('change', event => {
          // Só atualizar se não tiver preferência salva
          if (!localStorage.getItem(THEME_KEY)) {
            isDarkMode = event.matches;
            applyTheme();
            updateToggleButton();
          }
        });
      } catch (e) {
        // Fallback para browsers mais antigos
        prefersDarkMode.addListener(event => {
          if (!localStorage.getItem(THEME_KEY)) {
            isDarkMode = event.matches;
            applyTheme();
            updateToggleButton();
          }
        });
      }
    }
  }
  
  // Atualizar botão de acordo com o tema atual
  function updateToggleButton() {
    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      themeButton.innerHTML = isDarkMode 
        ? '<i class="bi bi-sun"></i> Modo Claro'
        : '<i class="bi bi-moon"></i> Modo Escuro';
    }
  }
  
  // Retornar estado atual
  function isDark() {
    return isDarkMode;
  }
  
  // Exportar funções públicas
  return {
    init,
    toggleTheme,
    isDark
  };
});
