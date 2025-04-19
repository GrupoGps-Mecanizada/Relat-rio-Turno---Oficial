/**
 * Sistema de Autenticação Google
 * Implementa login com Google e gerenciamento de sessão
 */
ModuleLoader.register('googleAuth', function() {
  // Ler configurações do objeto CONFIG global
  const CLIENT_ID = window.CONFIG?.GOOGLE_CLIENT_ID || ''; // Usa a config global
  const API_KEY = window.CONFIG?.API_KEY || '';          // Usa a config global
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.email';

  // Estado da autenticação
  let isInitialized = false;
  let isGapiLoaded = false;
  let isAuthenticated = false;
  let currentUser = null;
  let authInstance = null; // Guardar instância do Auth2

  // Inicialização
  function init() {
    console.log("Inicializando googleAuth...");
    // Verificar se ID de cliente e API Key foram configurados corretamente em config.js
    if (!CLIENT_ID || !API_KEY) {
      const authRequired = window.CONFIG?.AUTH_REQUIRED ?? false;
      console.warn('Atenção: GOOGLE_CLIENT_ID ou API_KEY não configurados em config.js ou estão vazios.');
      if (authRequired) {
         console.error("Autenticação Google é necessária mas não está configurada corretamente.");
         if(window.Notifications) Notifications.error("Erro crítico: Autenticação Google não configurada.");
      }
      // Se não configurado, não prosseguir com a inicialização do GAPI
      return;
    }

    // Adicionar script do Google API e inicializar cliente
    loadGapiScript()
      .then(() => {
          console.log("GAPI script carregado.");
          isGapiLoaded = true;
          // Carregar módulos client:auth2
          return new Promise((resolve, reject) => {
              gapi.load('client:auth2', {
                  callback: resolve,
                  onerror: reject,
                  timeout: 5000, // Timeout para o load
                  ontimeout: reject
              });
          });
      })
      .then(() => {
        console.log("Módulos client:auth2 carregados. Inicializando cliente GAPI...");
        // Inicializar o cliente GAPI
        return gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
        });
      })
      .then(() => {
        console.log("Cliente GAPI inicializado. Obtendo instância Auth2...");
        // Obter a instância do GoogleAuth object.
        authInstance = gapi.auth2.getAuthInstance();
        isInitialized = true; // Marcado como inicializado APÓS obter instância
        console.log("Instância Auth2 obtida.");

        // Adicionar botão de login/logout ao cabeçalho
        addLoginButton(); // Adiciona o botão independente do estado inicial

        // Verificar estado de autenticação inicial
        const isSignedIn = authInstance.isSignedIn.get();
        console.log("Estado inicial de autenticação:", isSignedIn);
        updateSignInStatus(isSignedIn); // Atualiza UI e estado interno

        // Ouvir mudanças de estado de autenticação
        authInstance.isSignedIn.listen(updateSignInStatus);

        console.log("Autenticação Google configurada com sucesso.");

      })
      .catch(error => {
        console.error('Erro detalhado ao inicializar autenticação Google:', error);
        let userMessage = 'Erro ao inicializar a autenticação com Google.';
        if (error?.details) { // GAPI pode fornecer detalhes
            userMessage += ` Detalhes: ${error.details}`;
        } else if (error?.type === 'timeout') {
             userMessage = 'Tempo esgotado ao carregar componentes de autenticação.';
        } else if (typeof error === 'string' && error.includes('idpiframe')) {
            userMessage = 'Erro ao carregar recursos de autenticação. Verifique bloqueadores de pop-up ou cookies de terceiros.';
        }
        if(window.Notifications) Notifications.error(userMessage, 'danger');
         // Tentar desabilitar o botão de login se a inicialização falhar
         const loginButton = document.getElementById('google-login-btn');
         if (loginButton) {
             loginButton.disabled = true;
             loginButton.textContent = "Auth Indisponível";
             loginButton.title = userMessage;
         }
      });
  }

  // Carregar script do Google API de forma assíncrona
  function loadGapiScript() {
    return new Promise((resolve, reject) => {
      // Verificar se já está carregado ou em processo
      if (typeof gapi !== 'undefined' && isGapiLoaded) {
        resolve();
        return;
      }
      if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
          // Script já existe, aguardar carregar (pode precisar de um listener mais robusto)
           console.log("Script GAPI já existe, aguardando onload...");
           // Simplificado: Assume que vai carregar. Idealmente, teria um callback global.
           // Por ora, vamos confiar que o gapi.load resolverá.
           resolve(); // Resolve imediatamente, confiando no gapi.load posterior
           return;
      }

      console.log("Adicionando script GAPI...");
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
          console.log("Script GAPI carregado via onload.");
          resolve();
      };
      script.onerror = (err) => {
           console.error("Erro ao carregar script GAPI:", err);
           reject(err);
      };

      // Adicionar ao head ou body
      (document.head || document.body).appendChild(script);
    });
  }

  // Adicionar botão de login/logout no cabeçalho
  function addLoginButton() {
     // Verificar se o botão já existe
     if (document.getElementById('google-login-btn')) {
         return;
     }

    // Usar um seletor mais confiável para o container dos botões
    const headerActionsContainer = document.querySelector('.botoes-direita'); // Ajuste se necessário

    if (headerActionsContainer) {
      // Criar botão de login/logout
      const loginButton = document.createElement('button');
      loginButton.id = 'google-login-btn'; // ID para referência
      loginButton.className = 'btn btn-outline-light ms-2'; // Classe inicial
      loginButton.innerHTML = 'Carregando Auth...'; // Texto inicial
      loginButton.disabled = true; // Desabilitado até GAPI inicializar

      loginButton.addEventListener('click', () => {
        if (!isInitialized || !authInstance) {
            alert('Sistema de autenticação ainda não inicializado completamente. Tente novamente em alguns segundos.');
            return;
        }
        if (isAuthenticated) {
            signOut();
        } else {
            signIn();
        }
      });

      // Adicionar o botão ao container
      headerActionsContainer.appendChild(loginButton);

    } else {
         console.warn("Container '.botoes-direita' não encontrado para adicionar botão de login.");
    }
  }

  // Atualizar estado de autenticação (chamado pelo listener e na inicialização)
  function updateSignInStatus(isSignedIn) {
    console.log("Atualizando status de autenticação para:", isSignedIn);
    isAuthenticated = isSignedIn;
    const AppState = window.AppState || ModuleLoader?.get('state');

    // Atualizar o botão de login/logout
    const loginButton = document.getElementById('google-login-btn');
    if (loginButton) {
        loginButton.disabled = false; // Habilitar o botão agora que sabemos o estado
      if (isSignedIn) {
        loginButton.innerHTML = '<i class="bi bi-box-arrow-right"></i> <span class="d-none d-sm-inline">Sair</span>';
        loginButton.title = "Sair da conta Google";
        // loginButton.classList.remove('btn-primary'); // Mantendo outline-light
        // loginButton.classList.add('btn-outline-secondary');

        // Processar login e obter informações do usuário
        handleSignIn();

      } else {
        loginButton.innerHTML = '<i class="bi bi-google"></i> <span class="d-none d-sm-inline">Login Google</span>';
        loginButton.title = "Login com Google";
        // loginButton.classList.remove('btn-outline-secondary');
        // loginButton.classList.add('btn-primary'); // Manter outline-light

        // Limpar dados do usuário no estado global e local
        currentUser = null;
        if (AppState) {
            AppState.update('currentUser', null);
            AppState.update('isAuthenticated', false);
        }
         // Remover display do usuário se existir
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.remove();
        }
         // Disparar evento de logout
         document.dispatchEvent(new CustomEvent('userLoggedOut'));
         if(window.Notifications) Notifications.info("Você foi desconectado.");
      }
    } else {
         console.warn("Botão de login Google não encontrado para atualizar status.");
    }
  }

  // Iniciar processo de login
  function signIn() {
    if (!isInitialized || !authInstance) {
      console.error('Autenticação Google não inicializada para signIn.');
       if(window.Notifications) Notifications.error("Autenticação não está pronta.");
      return Promise.reject('Auth não inicializado.');
    }
    console.log("Iniciando fluxo de signIn...");
    // authInstance.signIn() retorna uma Promise
    return authInstance.signIn().catch(error => {
        console.error("Erro durante o signIn:", error);
        let message = "Erro ao tentar fazer login.";
        if (error?.error === 'popup_closed_by_user') {
            message = "Login cancelado pelo usuário.";
        } else if (error?.error === 'access_denied') {
            message = "Acesso negado. Permissões não concedidas.";
        }
         if(window.Notifications) Notifications.warning(message);
         // Rejeitar a promise para que chamadas await possam tratar
         return Promise.reject(error);
    });
  }

  // Encerrar sessão
  function signOut() {
    if (!isInitialized || !authInstance) {
      console.error('Autenticação Google não inicializada para signOut.');
      if(window.Notifications) Notifications.error("Autenticação não está pronta.");
      return Promise.reject('Auth não inicializado.');
    }
    console.log("Iniciando fluxo de signOut...");
    // authInstance.signOut() retorna uma Promise
    return authInstance.signOut().catch(error => {
        console.error("Erro durante o signOut:", error);
        if(window.Notifications) Notifications.error("Erro ao tentar sair.");
        return Promise.reject(error);
    });
  }

  // Processar dados após login bem-sucedido
  function handleSignIn() {
    if (!isInitialized || !authInstance || !authInstance.isSignedIn.get()) {
        console.warn("handleSignIn chamado quando não autenticado ou não inicializado.");
        return;
    }

    const googleUser = authInstance.currentUser.get();
    const profile = googleUser.getBasicProfile();
    const authResponse = googleUser.getAuthResponse(true); // true para incluir access_token

    if (!profile) {
        console.error("Não foi possível obter o perfil básico do Google.");
        // Tentar deslogar?
        signOut();
        return;
    }

    currentUser = {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl(),
      token: authResponse.id_token, // id_token é geralmente usado para verificar no backend
      accessToken: authResponse.access_token // access_token para chamar APIs Google
    };

    isAuthenticated = true; // Redundante, mas confirma
    console.log("Usuário autenticado:", currentUser.name, `(${currentUser.email})`);

    // Atualizar estado global
    const AppState = window.AppState || ModuleLoader?.get('state');
     if (AppState) {
         AppState.update('currentUser', currentUser);
         AppState.update('isAuthenticated', true);
     }

    // Adicionar/Atualizar informações do usuário no cabeçalho
    updateUserDisplay();

    // Disparar evento de login para outros módulos ouvirem
    document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: currentUser }));

    // Mostrar notificação de boas-vindas
    if (window.Notifications) {
      Notifications.success(`Bem-vindo, ${currentUser.name}!`);
    }
  }

  // Atualizar exibição do usuário logado no cabeçalho
  function updateUserDisplay() {
    if (!currentUser) return;

    const headerActionsContainer = document.querySelector('.botoes-direita');
    if (!headerActionsContainer) return; // Sair se o container não existe

    // Verificar se o display do usuário já existe
    let userDisplay = document.getElementById('user-display');

    if (!userDisplay) {
      // Criar elemento para mostrar usuário
      userDisplay = document.createElement('div');
      userDisplay.id = 'user-display';
      userDisplay.className = 'user-display ms-2 d-flex align-items-center'; // Usar classes Bootstrap se possível

      // Estilos básicos (melhor ter no CSS principal)
       userDisplay.style.gap = '8px';
       userDisplay.style.padding = '4px 8px';
       userDisplay.style.borderRadius = '20px';
       userDisplay.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
       userDisplay.style.maxWidth = '200px'; // Limitar largura

      // Adicionar ao lado do botão de login/logout
      const loginButton = document.getElementById('google-login-btn');
      if (loginButton) {
          loginButton.insertAdjacentElement('afterend', userDisplay);
      } else {
          headerActionsContainer.appendChild(userDisplay); // Adicionar ao final se o botão não for encontrado
      }
    }

    // Atualizar conteúdo
    userDisplay.innerHTML = `
      <img src="${currentUser.imageUrl}" alt="${currentUser.name}" class="user-avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
      <span class="user-name text-white" style="font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${currentUser.name}
      </span>
    `;
    userDisplay.title = currentUser.email; // Adicionar email no tooltip
  }

  // Verificar se usuário está autenticado
  function isUserAuthenticated() {
    // Garante que a verificação use a instância Auth2 mais recente, se disponível
    return (isInitialized && authInstance) ? authInstance.isSignedIn.get() : isAuthenticated;
  }

  // Obter usuário atual
  function getCurrentUser() {
    // Retornar uma cópia para evitar modificação externa? Por enquanto, retorna a referência.
    return currentUser;
  }

  // Obter token de acesso (útil para chamar APIs Google)
  function getAccessToken() {
      if (!isUserAuthenticated() || !authInstance) return null;
      const googleUser = authInstance.currentUser.get();
      const authResponse = googleUser.getAuthResponse(true);
      // Verificar se o token expirou e tentar renovar? GAPI lida com isso automaticamente em chamadas gapi.client
      return authResponse?.access_token;
  }


  // Exportar funções públicas
  return {
    init,
    signIn,
    signOut,
    isUserAuthenticated,
    getCurrentUser,
    getAccessToken // Expor se necessário para chamadas diretas à API Google
  };
});
