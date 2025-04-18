/**
 * Melhorias de responsividade para dispositivos móveis
 */
ModuleLoader.register('responsiveUI', function() {
  // Inicialização
  function init() {
    // Melhorar interface em dispositivos móveis
    if (isMobile()) {
      enhanceMobileUI();
    }
    
    // Observar mudanças de tamanho da janela
    window.addEventListener('resize', handleResize);
  }
  
  // Verificar se é dispositivo móvel
  function isMobile() {
    return window.innerWidth < 768;
  }
  
  // Lidar com redimensionamento da janela
  function handleResize() {
    if (isMobile()) {
      enhanceMobileUI();
    } else {
      restoreDesktopUI();
    }
  }
  
  // Melhorar interface para móveis
  function enhanceMobileUI() {
    // Ajustar tamanho dos botões para facilitar o toque
    document.querySelectorAll('.btn').forEach(btn => {
      if (!btn.classList.contains('btn-sm') && !btn.classList.contains('btn-lg')) {
        btn.classList.add('mobile-enhanced');
        btn.style.minHeight = '44px';
        btn.style.padding = '10px 15px';
      }
    });
    
    // Aumentar fonte dos formulários
    document.querySelectorAll('.form-control, .form-select').forEach(input => {
      input.classList.add('mobile-enhanced');
      input.style.fontSize = '16px'; // Evita zoom em iPhones
      input.style.height = 'auto';
      input.style.padding = '10px 12px';
    });
    
    // Simplificar cabeçalhos em cards
    document.querySelectorAll('.equipe-card .card-header').forEach(header => {
      header.classList.add('mobile-enhanced');
      
      // Verificar se já está em formato de coluna
      const isFlexColumn = header.style.flexDirection === 'column';
      
      if (!isFlexColumn) {
        header.style.flexDirection = 'column';
        header.style.alignItems = 'flex-start';
        
        const btnGroup = header.querySelector('.btn-group');
        if (btnGroup) {
          btnGroup.style.marginTop = '10px';
          btnGroup.style.width = '100%';
          btnGroup.style.display = 'flex';
          btnGroup.style.justifyContent = 'space-between';
        }
      }
    });
    
    // Otimizar tabela de resultados
    document.querySelectorAll('table').forEach(table => {
      table.classList.add('mobile-optimized');
    });
    
    // Adicionar swipe para navegação em estágios
    enableSwipeNavigation();
  }
  
  // Restaurar interface para desktop
  function restoreDesktopUI() {
    // Remover ajustes para elementos com classe mobile-enhanced
    document.querySelectorAll('.mobile-enhanced').forEach(el => {
      el.style.removeProperty('min-height');
      el.style.removeProperty('padding');
      el.style.removeProperty('font-size');
      el.style.removeProperty('height');
      el.style.removeProperty('flex-direction');
      el.style.removeProperty('align-items');
      el.style.removeProperty('margin-top');
      el.style.removeProperty('width');
      el.style.removeProperty('display');
      el.style.removeProperty('justify-content');
      
      el.classList.remove('mobile-enhanced');
    });
    
    // Restaurar tabelas
    document.querySelectorAll('.mobile-optimized').forEach(table => {
      table.classList.remove('mobile-optimized');
    });
    
    // Desativar swipe
    disableSwipeNavigation();
  }
  
  // Habilitar navegação por swipe
  function enableSwipeNavigation() {
    // Variáveis para controle de swipe
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Adicionar detector de swipe se não existir
    if (!window.swipeEnabled) {
      document.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
      }, false);
      
      document.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].clientX;
        handleSwipe();
      }, false);
      
      window.swipeEnabled = true;
    }
    
    // Função para lidar com o swipe
    function handleSwipe() {
      const swipeThreshold = 80; // Mínimo de pixels para considerar um swipe
      
      // Swipe da esquerda para direita (voltar)
      if (touchEndX - touchStartX > swipeThreshold) {
        // Navegar para trás conforme a etapa atual
        const currentStep = getCurrentStep();
        
        switch (currentStep) {
          case 'stepEquipes':
            voltarParaTurno();
            break;
          case 'stepRevisao':
            voltarParaEquipes();
            break;
          case 'stepRelatorio':
            voltarParaSucesso();
            break;
          case 'stepWhatsApp':
            voltarDoWhatsApp();
            break;
        }
      }
      
      // Swipe da direita para esquerda (avançar)
      if (touchStartX - touchEndX > swipeThreshold) {
        // Navegar para frente conforme a etapa atual
        const currentStep = getCurrentStep();
        
        switch (currentStep) {
          case 'stepTurno':
            if (document.getElementById('formTurno').checkValidity()) {
              avancarParaEquipes();
            }
            break;
          case 'stepEquipes':
            if (equipes.length > 0) {
              avancarParaRevisao();
            }
            break;
        }
      }
    }
  }
  
  // Desabilitar navegação por swipe
  function disableSwipeNavigation() {
    // Não fazer nada - manteremos os listeners para simplificar
  }
  
  // Obter a etapa atual
  function getCurrentStep() {
    const steps = ['stepTurno', 'stepEquipes', 'stepRevisao', 'stepSucesso', 'stepRelatorio', 'stepWhatsApp', 'stepPesquisa'];
    
    for (const stepId of steps) {
      const el = document.getElementById(stepId);
      if (el && el.style.display !== 'none') {
        return stepId;
      }
    }
    
    return 'stepTurno'; // Padrão
  }
  
  // Exportar funções públicas
  return {
    init,
    isMobile
  };
});
