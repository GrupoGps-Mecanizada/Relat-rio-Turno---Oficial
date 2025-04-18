/**
 * Sistema de Autenticação Google
 * Implementa login com Google e gerenciamento de sessão
 */
ModuleLoader.register('googleAuth', function() {
  // Configurações
  const CLIENT_ID = ''; // Precisa ser preenchido com seu Client ID do Google
  const API_KEY = ''; // Precisa ser preenchido com sua API Key do Google
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.email';
  
  // Estado da autenticação
  let isInitialized = false;
  let isAuthenticated = false;
  let currentUser = null;
  
  // Inicialização
  function init() {
    // Verificar se ID de cliente foi configurado
    if (!CLIENT_ID || !API_KEY) {
      console.error('Atenção: CLIENT_ID ou API_KEY não configurados para autenticação Google.');
      return;
    }
    
    // Adicionar script do Google API
    loadGapiScript()
      .then(() => {
        return new Promise((resolve) => {
          gapi.load('client:auth2', resolve);
        });
      })
      .then(() => {
        return gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
        });
      })
      .then(() => {
        isInitialized = true;
        
        // Verificar estado de autenticação
        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
          handleSignIn();
        } else {
          // Adicionar login no cabeçalho
          addLoginButton();
        }
        
        // Ouvir mudanças de estado
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
      })
      .catch(error => {
        console.error('Erro ao inicializar autenticação Google:', error);
      });
  }
  
  // Carregar script do Google API
  function loadGapiScript() {
    return new Promise((resolve, reject) => {
      // Verificar se já está carregado
      if (typeof gapi !== 'undefined') {
        resolve();
        return;
      }
      
      // Adicionar script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      
      document.head.appendChild(script);
    });
  }
  
  // Adicionar botão de login no cabeçalho
  function addLoginButton() {
    const headerActions = document.querySelector('.card-header .btn-tool').parentNode;
    
    if (headerActions) {
      // Criar botão de login
      const loginButton = document.createElement('button');
      loginButton.id = 'google-login-btn';
      loginButton.className = 'btn btn-primary ms-2';
      loginButton.innerHTML = '<i class="bi bi-google"></i> Login com Google';
      
      loginButton.addEventListener('click', () => {
        if (isInitialized) {
          if (isAuthenticated) {
            signOut();
          } else {
            signIn();
          }
        } else {
          alert('Sistema de autenticação ainda não inicializado. Tente novamente em alguns segundos.');
        }
      });
      
      headerActions.appendChild(loginButton);
    }
  }
  
  // Atualizar estado de autenticação
  function updateSignInStatus(isSignedIn) {
    isAuthenticated = isSignedIn;
    
    // Atualizar botão de login
    const loginButton = document.getElementById('google-login-btn');
    
    if (loginButton) {
      if (isSignedIn) {
        loginButton.innerHTML = '<i class="bi bi-box-arrow-right"></i> Sair';
        loginButton.classList.remove('btn-primary');
        loginButton.classList.add('btn-outline-secondary');
        
        // Obter informações do usuário
        handleSignIn();
      } else {
        loginButton.innerHTML = '<i class="bi bi-google"></i> Login com Google';
        loginButton.classList.remove('btn-outline-secondary');
        loginButton.classList.add('btn-primary');
        
        // Limpar dados do usuário
        currentUser = null;
        AppState.update('currentUser', null);
        AppState.update('isAuthenticated', false);
      }
    }
  }
  
  // Iniciar login
  function signIn() {
    if (!isInitialized) {
      console.error('API do Google não inicializada');
      return Promise.reject('API do Google não inicializada');
    }
    
    return gapi.auth2.getAuthInstance().signIn();
  }
  
  // Encerrar sessão
  function signOut() {
    if (!isInitialized) {
      console.error('API do Google não inicializada');
      return Promise.reject('API do Google não inicializada');
    }
    
    return gapi.auth2.getAuthInstance().signOut();
  }
  
  // Processar login
  function handleSignIn() {
    if (!isInitialized) return;
    
    const googleUser = gapi.auth2.getAuthInstance().currentUser.get();
    const profile = googleUser.getBasicProfile();
    
    currentUser = {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl(),
      token: googleUser.getAuthResponse().id_token
    };
    
    isAuthenticated = true;
    
    // Atualizar estado global
    AppState.update('currentUser', currentUser);
    AppState.update('isAuthenticated', true);
    
    // Adicionar informações do usuário ao cabeçalho
    updateUserDisplay();
    
    // Evento de login
    const event = new CustomEvent('userLoggedIn', { detail: currentUser });
    document.dispatchEvent(event);
    
    // Mostrar notificação
    if (window.Notifications) {
      Notifications.success(`Bem-vindo, ${currentUser.name}!`);
    }
  }
  
  // Atualizar exibição do usuário logado
  function updateUserDisplay() {
    if (!currentUser) return;
    
    // Verificar se já existe
    let userDisplay = document.getElementById('user-display');
    
    if (!userDisplay) {
      // Criar elemento para mostrar usuário
      userDisplay = document.createElement('div');
      userDisplay.id = 'user-display';
      userDisplay.className = 'user-display ms-3';
      
      // Adicionar ao cabeçalho
      const headerActions = document.querySelector('.card-header .btn-tool').parentNode;
      if (headerActions) {
        headerActions.appendChild(userDisplay);
      }
      
      // Adicionar estilos
      if (!document.getElementById('user-display-style')) {
        const style = document.createElement('style');
        style.id = 'user-display-style';
        style.textContent = `
          .user-display {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border-radius: 20px;
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .user-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            object-fit: cover;
          }
          
          .user-name {
            font-size: 14px;
            font-weight: 500;
            color: white;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Atualizar conteúdo
    userDisplay.innerHTML = `
      <img src="${currentUser.imageUrl}" alt="${currentUser.name}" class="user-avatar">
      <span class="user-name">${currentUser.name}</span>
    `;
  }
  
  // Verificar se usuário está autenticado
  function isUserAuthenticated() {
    return isAuthenticated;
  }
  
  // Obter usuário atual
  function getCurrentUser() {
    return currentUser;
  }
  
  // Exportar funções públicas
  return {
    init,
    signIn,
    signOut,
    isUserAuthenticated,
    getCurrentUser
  };
});
