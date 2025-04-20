/**
 * Gerenciador de temas da aplicação - Versão 2.0
 * Implementa modo escuro/claro com transições suaves e cores aprimoradas
 */
ModuleLoader.register('themeManager', function() {
  // Constantes
  const THEME_KEY = 'app_theme';
  const DARK_CLASS = 'dark-mode';
  const BUTTON_ID = 'theme-toggle-button'; // ID específico para o botão

  // Estado inicial (lê do localStorage ou usa fallback de CONFIG ou do sistema)
  let preferredTheme = localStorage.getItem(THEME_KEY);
  let isDarkMode = false;

  if (preferredTheme) {
      isDarkMode = preferredTheme === 'dark';
  } else if (window.CONFIG?.DEFAULT_THEME) {
      isDarkMode = window.CONFIG.DEFAULT_THEME === 'dark';
  } else {
      // Fallback para preferência do sistema
      isDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }


  // Inicialização
  function init() {
    console.log('Inicializando ThemeManager...');

    // Aplicar tema inicial
    applyTheme();

    // Adicionar CSS para transições suaves
    addSmoothTransitions();
    
    // Adicionar toggle de tema DEPOIS que o DOM estiver pronto
    // Usar setTimeout pode ser frágil, melhor garantir que o DOMContentLoaded de main.js já rodou
    // Ou chamar addThemeToggle explicitamente de main.js após a inicialização dos módulos de UI
    // Por segurança, vamos manter um pequeno timeout, mas idealmente seria chamado explicitamente.
    setTimeout(addThemeToggle, 100); // Reduzido timeout

    // Observar preferências do sistema
    watchSystemPreference();

    console.log('ThemeManager inicializado com sucesso. Modo escuro ativo:', isDarkMode);
  }

  // Aplicar o tema atual ao body e atualizar AppState
  function applyTheme() {
    if (isDarkMode) {
      document.body.classList.add(DARK_CLASS);
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.body.classList.remove(DARK_CLASS);
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }

    // Atualizar AppState se disponível
    const AppState = window.AppState || ModuleLoader?.get('state');
    if (AppState) {
      AppState.update('darkMode', isDarkMode);
    }

    // Atualizar o botão se ele já existir
    updateToggleButton();
    
    // Acionar evento de mudança de tema para outros componentes escutarem
    const event = new CustomEvent('themeChanged', { detail: { darkMode: isDarkMode } });
    document.dispatchEvent(event);
  }

  // Alternar entre temas
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light'); // Salvar preferência do usuário
    applyTheme(); // Aplica e atualiza o botão

    // Mostrar notificação
    const Notifications = window.Notifications || ModuleLoader?.get('notifications');
    const themeName = isDarkMode ? 'escuro' : 'claro';
    if (Notifications) {
      Notifications.info(`Modo ${themeName} ativado`);
    } else {
      console.log(`Modo ${themeName} ativado`);
    }

    return isDarkMode;
  }

  // Adicionar CSS para fazer transições suaves entre modos
  function addSmoothTransitions() {
    if (!document.getElementById('theme-transitions')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'theme-transitions';
      styleEl.textContent = `
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }

  // Adicionar toggle de tema na interface (MAIS SEGURO)
  function addThemeToggle() {
    // 1. Verificar se o botão JÁ EXISTE pelo ID
    if (document.getElementById(BUTTON_ID)) {
        console.log("Botão de tema já existe.");
        updateToggleButton(); // Apenas garantir que o texto/ícone esteja correto
        return;
    }

    // 2. Encontrar o container para o botão
    const headerActionsContainer = document.querySelector('.botoes-direita'); // Usar o seletor correto

    if (!headerActionsContainer) {
      console.warn("Container '.botoes-direita' para botão de tema não encontrado.");
      return; // Não adiciona se não encontrar o container
    }

    // 3. Criar o botão
    const themeButton = document.createElement('button');
    themeButton.className = 'btn btn-outline-light btn-action'; // Usar a classe visualmente correta
    themeButton.id = BUTTON_ID; // Definir o ID
    themeButton.title = 'Alternar Tema'; // Tooltip

    // 4. Definir conteúdo inicial (delegado para updateToggleButton)
    // updateToggleButton() será chamado no final de applyTheme e init

    // 5. Adicionar listener de evento
    themeButton.addEventListener('click', () => {
        toggleTheme(); // Chama a função que alterna e atualiza tudo
    });

    // 6. Adicionar o botão ao container
    headerActionsContainer.appendChild(themeButton);

    // 7. Garantir que o texto/ícone inicial esteja correto
    updateToggleButton();
  }

  // Atualizar ícone e texto do botão de acordo com o tema atual
  function updateToggleButton() {
    const themeButton = document.getElementById(BUTTON_ID);
    if (themeButton) {
      themeButton.innerHTML = isDarkMode
        ? '<i class="bi bi-sun"></i> <span class="d-none d-sm-inline">Modo Claro</span>'
        : '<i class="bi bi-moon"></i> <span class="d-none d-sm-inline">Modo Escuro</span>';
        
      // Adicionar efeito de brilho no modo escuro
      if (isDarkMode) {
        themeButton.classList.add('theme-button-glow');
      } else {
        themeButton.classList.remove('theme-button-glow');
      }
    }
  }


  // Observar preferências de cor do sistema operacional
  function watchSystemPreference() {
    if (!window.matchMedia) return; // Sair se não suportado

    const prefersDarkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Listener para mudanças na preferência do sistema
    const listener = (event) => {
        // Só atualiza se o usuário NÃO tiver definido uma preferência manualmente no localStorage
        if (!localStorage.getItem(THEME_KEY)) {
            console.log("Preferência de cor do sistema mudou. Atualizando tema...");
            isDarkMode = event.matches;
            applyTheme(); // Aplica e atualiza o botão
        }
    };

    // Adicionar listener moderno (ou fallback)
    try {
      prefersDarkModeQuery.addEventListener('change', listener);
    } catch (e) {
      try {
          prefersDarkModeQuery.addListener(listener); // Fallback para navegadores mais antigos
      } catch(fallbackError) {
          console.error("Não foi possível adicionar listener para 'prefers-color-scheme'.", fallbackError);
      }
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
    isDark,
    applyTheme
  };
});
