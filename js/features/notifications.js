/**
 * Módulo de Notificações - Implementa sistema de alertas e notificações
 * Versão aprimorada com suporte ao tema escuro e fundos opacos
 */
ModuleLoader.register('notifications', function() {
  // Configurações
  const NOTIFICATION_DURATION = 5000; // 5 segundos
  
  // Variáveis internas
  let notificacaoAtiva = null;
  
  // Inicializar sistema de notificações
  function init() {
    console.log('Inicializando módulo Notifications...');
    
    // Adicionar o container de notificações se não existir
    if (!document.getElementById('notifications-container')) {
      const container = document.createElement('div');
      container.id = 'notifications-container';
      container.className = 'notifications-container';
      document.body.appendChild(container);
      
      // Adicionar estilos
      if (!document.getElementById('notifications-style')) {
        const style = document.createElement('style');
        style.id = 'notifications-style';
        style.textContent = `
          .notifications-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            width: 320px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .notification {
            padding: 15px;
            margin-bottom: 5px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: notification-fadein 0.3s;
            position: relative;
            transition: opacity 0.3s, transform 0.3s;
            display: flex;
            align-items: flex-start;
          }
          
          .notification.fade-out {
            opacity: 0;
            transform: translateX(30px);
          }
          
          .notification .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            opacity: 0.7;
            background: none;
            border: none;
            font-size: 16px;
            color: inherit;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }
          
          .notification .close-btn:hover {
            opacity: 1;
            background-color: rgba(0, 0, 0, 0.05);
          }
          
          .notification-icon {
            margin-right: 12px;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .notification-content {
            flex: 1;
            padding-right: 20px;
          }
          
          .notification-info {
            background-color: #e1f5fe;
            border-left: 4px solid #03a9f4;
            color: #0277bd;
          }
          
          .notification-success {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
            color: #2e7d32;
          }
          
          .notification-warning {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            color: #ef6c00;
          }
          
          .notification-error, .notification-danger {
            background-color: #ffebee;
            border-left: 4px solid #f44336;
            color: #c62828;
          }
          
          /* Estilos para modo escuro */
          body.dark-mode .notification-info {
            background-color: rgba(3, 169, 244, 0.15);
            border-left: 4px solid #03a9f4;
            color: #81d4fa;
          }
          
          body.dark-mode .notification-success {
            background-color: rgba(76, 175, 80, 0.15);
            border-left: 4px solid #4caf50;
            color: #a5d6a7;
          }
          
          body.dark-mode .notification-warning {
            background-color: rgba(255, 152, 0, 0.15);
            border-left: 4px solid #ff9800;
            color: #ffcc80;
          }
          
          body.dark-mode .notification-error,
          body.dark-mode .notification-danger {
            background-color: rgba(244, 67, 54, 0.15);
            border-left: 4px solid #f44336;
            color: #ef9a9a;
          }
          
          @keyframes notification-fadein {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Escutar eventos de mudança de tema
    document.addEventListener('themeChanged', function(event) {
      const isDarkMode = event.detail ? event.detail.darkMode : false;
      updateNotificationsTheme(isDarkMode);
    });
    
    // Exportar globalmente para compatibilidade com códigos antigos
    window.Notifications = {
      show: show,
      info: info,
      success: success,
      warning: warning,
      error: error,
      danger: error // Alias para error
    };
    
    console.log('Módulo Notifications inicializado com sucesso.');
  }
  
  // Atualizar tema das notificações existentes
  function updateNotificationsTheme(isDarkMode) {
    // Nenhuma ação necessária, os estilos CSS já lidam com isso via classes
  }
  
  // Mostrar uma notificação
  function show(message, type = 'info', duration = NOTIFICATION_DURATION) {
    const container = document.getElementById('notifications-container');
    if (!container) {
      console.warn('Container de notificações não encontrado.');
      return null;
    }
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Ícone conforme o tipo
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="bi bi-check-circle-fill"></i>';
        break;
      case 'warning':
        icon = '<i class="bi bi-exclamation-triangle-fill"></i>';
        break;
      case 'error':
      case 'danger':
        icon = '<i class="bi bi-x-circle-fill"></i>';
        break;
      default:
        icon = '<i class="bi bi-info-circle-fill"></i>';
    }
    
    // Conteúdo da notificação
    notification.innerHTML = `
      <button class="close-btn" aria-label="Fechar"><i class="bi bi-x"></i></button>
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">${message}</div>
    `;
    
    // Adicionar ao container
    container.appendChild(notification);
    
    // Adicionar evento de clique para fechar
    const closeBtn = notification.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => removeNotification(notification));
    }
    
    // Configurar remoção automática após o tempo definido
    const timeout = setTimeout(() => {
      removeNotification(notification);
    }, duration);
    
    // Armazenar referência para controle
    notification.timeout = timeout;
    
    return notification;
  }
  
  // Remover uma notificação
  function removeNotification(notification) {
    // Verificar se notificação já está sendo removida
    if (notification.isRemoving) return;
    notification.isRemoving = true;
    
    // Parar o timeout se existir
    if (notification.timeout) {
      clearTimeout(notification.timeout);
    }
    
    // Adicionar animação de saída
    notification.classList.add('fade-out');
    
    // Remover após a animação
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
  
  // Método abreviado para cada tipo
  function info(message, duration) {
    return show(message, 'info', duration);
  }
  
  function success(message, duration) {
    return show(message, 'success', duration);
  }
  
  function warning(message, duration) {
    return show(message, 'warning', duration);
  }
  
  function error(message, duration) {
    return show(message, 'error', duration);
  }
  
  // Exportar funções públicas
  return {
    init,
    show,
    info,
    success,
    warning,
    error
  };
});
