/**
 * Módulo de Notificações - Implementa sistema de alertas e notificações
 */
ModuleLoader.register('notifications', function() {
  // Configurações
  const NOTIFICATION_DURATION = 5000; // 5 segundos
  
  // Variáveis internas
  let notificacaoAtiva = null;
  
  // Inicializar sistema de notificações
  function init() {
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
            width: 300px;
          }
          
          .notification {
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: notification-fadein 0.3s;
            position: relative;
            transition: opacity 0.3s, transform 0.3s;
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
          }
          
          .notification .close-btn:hover {
            opacity: 1;
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
          
          .notification-error {
            background-color: #ffebee;
            border-left: 4px solid #f44336;
            color: #c62828;
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
  }
  
  // Mostrar uma notificação
  function show(message, type = 'info', duration = NOTIFICATION_DURATION) {
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
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
        icon = '<i class="bi bi-x-circle-fill"></i>';
        break;
      default:
        icon = '<i class="bi bi-info-circle-fill"></i>';
    }
    
    // Conteúdo da notificação
    notification.innerHTML = `
      <span class="close-btn"><i class="bi bi-x"></i></span>
      <div class="notification-content">
        ${icon} ${message}
      </div>
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
