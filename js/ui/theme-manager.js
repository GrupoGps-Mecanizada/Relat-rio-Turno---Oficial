/**
 * Gerenciador de temas da aplicação
 * Implementa modo escuro/claro e preferências de UI
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

    // Adicionar toggle de tema DEPOIS que o DOM estiver pronto
    // Usar setTimeout pode ser frágil, melhor garantir que o DOMContentLoaded de main.js já rodou
    // Ou chamar addThemeToggle explicitamente de main.js após a inicialização dos módulos de UI
    // Por segurança, vamos manter um pequeno timeout, mas idealmente seria chamado explicitamente.
     setTimeout(addThemeToggle, 100); // Reduzido timeout

    // Observar preferências do sistema
    watchSystemPreference();

    console.log('ThemeManager inicializado com sucesso.');
  }

  // Aplicar o tema atual ao body e atualizar AppState
  function applyTheme() {
    if (isDarkMode) {
      document.body.classList.add(DARK_CLASS);
    } else {
      document.body.classList.remove(DARK_CLASS);
    }

    // Atualizar AppState se disponível
    const AppState = window.AppState || ModuleLoader?.get('state');
    if (AppState) {
      AppState.update('darkMode', isDarkMode);
    }

    // Atualizar o botão se ele já existir
    updateToggleButton();
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
    themeButton.className = 'btn btn-outline-light'; // Usar a classe visualmente correta
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

    // Adicionar estilos CSS para modo escuro (se já não estiverem em styles.css)
    // É melhor ter esses estilos diretamente em styles.css
    ensureDarkThemeStyles();
  }

  // Atualizar ícone e texto do botão de acordo com o tema atual
  function updateToggleButton() {
    const themeButton = document.getElementById(BUTTON_ID);
    if (themeButton) {
      themeButton.innerHTML = isDarkMode
        ? '<i class="bi bi-sun"></i> <span class="d-none d-sm-inline">Modo Claro</span>'
        : '<i class="bi bi-moon"></i> <span class="d-none d-sm-inline">Modo Escuro</span>';
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

  // Garante que os estilos para o modo escuro existam (melhor ter isso em styles.css)
  function ensureDarkThemeStyles() {
      if (!document.getElementById('dark-mode-styles')) {
          const darkStyles = document.createElement('style');
          darkStyles.id = 'dark-mode-styles';
          // Colar aqui todas as regras CSS de body.dark-mode, .dark-mode .card, etc.
          // É altamente recomendado mover essas regras para o arquivo styles.css principal.
          darkStyles.textContent = `
              body.dark-mode { background-color: #121212; color: #e0e0e0; }
              .dark-mode .card { background-color: #1e1e1e; border-color: #333; }
              .dark-mode .card-header { background-color: #2c2c2c; border-bottom-color: #333; color: #e0e0e0; }
              /* Adicione TODAS as outras regras .dark-mode ... aqui */
              .dark-mode .form-control, .dark-mode .form-select { background-color: #2c2c2c; border-color: #444; color: #e0e0e0; }
              .dark-mode .form-control:focus, .dark-mode .form-select:focus { background-color: #333; border-color: var(--primary-color); }
              .dark-mode .table { color: #e0e0e0; }
              .dark-mode .table-striped > tbody > tr:nth-of-type(odd) { background-color: rgba(255, 255, 255, 0.05); }
              .dark-mode .alert-info { background-color: #0d2438; border-color: #1e4b70; color: #bee1f8; }
              /* ... etc ... */
          `;
           if (document.head) {
               document.head.appendChild(darkStyles);
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
    isDark
  };
});
