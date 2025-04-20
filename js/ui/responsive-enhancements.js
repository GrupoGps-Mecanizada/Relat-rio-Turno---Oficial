/**
 * Melhorias de responsividade para dispositivos móveis
 * Versão 2.0 - Implementação aprimorada para uma experiência móvel superior
 */
ModuleLoader.register('responsiveUI', function() {
  // Configurações
  const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  };
  
  let currentBreakpoint = '';
  let touchEnabled = false;
  let swipeEnabled = false;
  
  // Inicialização
  function init() {
    console.log('Inicializando ResponsiveUI...');
    
    // Determinar breakpoint atual
    updateCurrentBreakpoint();
    
    // Verificar se é um dispositivo de toque
    touchEnabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    
    // Adicionar classe ao body para identificar o tipo de dispositivo
    if (touchEnabled) {
      document.body.classList.add('touch-device');
    }
    
    // Melhorar interface em dispositivos móveis
    enhanceUI();
    
    // Observar mudanças de tamanho da janela
    window.addEventListener('resize', handleResize);
    
    // Lidar com orientação em dispositivos móveis
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Habilitar navegação por swipe
    if (touchEnabled) {
      enableSwipeNavigation();
    }
    
    // Melhorar a experiência de formulários em dispositivos móveis
    enhanceMobileFormsExperience();
    
    // Adicionar botão de voltar ao topo em páginas longas
    addBackToTopButton();
    
    // Escutar eventos de mudança de tema
    document.addEventListener('themeChanged', handleThemeChange);
    
    console.log('ResponsiveUI inicializado com sucesso. Breakpoint atual:', currentBreakpoint);
  }
  
  // Atualizar o breakpoint atual com base no tamanho da janela
  function updateCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width < breakpoints.sm) {
      currentBreakpoint = 'xs';
    } else if (width < breakpoints.md) {
      currentBreakpoint = 'sm';
    } else if (width < breakpoints.lg) {
      currentBreakpoint = 'md';
    } else if (width < breakpoints.xl) {
      currentBreakpoint = 'lg';
    } else if (width < breakpoints.xxl) {
      currentBreakpoint = 'xl';
    } else {
      currentBreakpoint = 'xxl';
    }
    
    // Atualizar data-attribute no body para facilitar seletores CSS
    document.body.setAttribute('data-breakpoint', currentBreakpoint);
    
    return currentBreakpoint;
  }
  
  // Verificar se é dispositivo móvel
  function isMobile() {
    return currentBreakpoint === 'xs' || currentBreakpoint === 'sm';
  }
  
  // Verificar se é tablet
  function isTablet() {
    return currentBreakpoint === 'md';
  }
  
  // Lidar com redimensionamento da janela
  function handleResize() {
    const previousBreakpoint = currentBreakpoint;
    const newBreakpoint = updateCurrentBreakpoint();
    
    // Se mudou de breakpoint, aplicar adaptações
    if (previousBreakpoint !== newBreakpoint) {
      console.log(`Breakpoint alterado: ${previousBreakpoint} -> ${newBreakpoint}`);
      enhanceUI();
    }
  }
  
  // Lidar com mudança de orientação
  function handleOrientationChange() {
    console.log('Orientação alterada');
    // Pequeno delay para garantir que as dimensões foram atualizadas
    setTimeout(() => {
      updateCurrentBreakpoint();
      enhanceUI();
    }, 100);
  }
  
  // Lidar com mudanças de tema
  function handleThemeChange(event) {
    const isDarkMode = event.detail.darkMode;
    console.log('Tema alterado: ' + (isDarkMode ? 'escuro' : 'claro'));
    
    // Fazer ajustes específicos de tema se necessário
    // Por exemplo, ajustar contraste em dispositivos móveis no modo escuro
    if (isMobile() && isDarkMode) {
      enhanceMobileDarkMode();
    }
  }
  
  // Melhorar interface responsivamente
  function enhanceUI() {
    // Limpar adaptações anteriores
    resetUIEnhancements();
    
    // Aplicar melhorias específicas por breakpoint
    if (isMobile()) {
      enhanceMobileUI();
    } else if (isTablet()) {
      enhanceTabletUI();
    } else {
      enhanceDesktopUI();
    }
    
    // Adaptações comuns para todos os breakpoints
    enhanceCommonUI();
  }
  
  // Resetar melhorias de UI para aplicar novas
  function resetUIEnhancements() {
    // Remover classes e estilos específicos de adaptação
    document.querySelectorAll('.mobile-enhanced, .tablet-enhanced, .desktop-enhanced').forEach(el => {
      el.classList.remove('mobile-enhanced', 'tablet-enhanced', 'desktop-enhanced');
      
      // Limpar estilos inline adicionados
      const responsiveStyles = [
        'min-height', 'padding', 'font-size', 'height', 'flex-direction',
        'align-items', 'margin-top', 'width', 'display', 'justify-content'
      ];
      
      responsiveStyles.forEach(style => {
        if (el.style[style] && el._originalStyles && el._originalStyles[style] !== undefined) {
          el.style[style] = el._originalStyles[style];
        } else if (el.style[style]) {
          el.style.removeProperty(style);
        }
      });
    });
  }
  
  // Salvar estilos originais antes de modificá-los
  function saveOriginalStyles(element, styles) {
    if (!element._originalStyles) {
      element._originalStyles = {};
    }
    
    styles.forEach(style => {
      const camelCase = style.replace(/-([a-z])/g, g => g[1].toUpperCase());
      if (element._originalStyles[camelCase] === undefined) {
        element._originalStyles[camelCase] = element.style[camelCase];
      }
    });
  }
  
  // Melhorar interface para móveis
  function enhanceMobileUI() {
    console.log('Aplicando melhorias para UI Mobile');
    
    // Ajustar tamanho dos botões para facilitar o toque
    document.querySelectorAll('.btn:not(.btn-sm):not(.btn-lg)').forEach(btn => {
      saveOriginalStyles(btn, ['min-height', 'padding']);
      btn.classList.add('mobile-enhanced');
      btn.style.minHeight = '44px';
      btn.style.padding = '10px 15px';
    });
    
    // Aumentar fonte dos formulários
    document.querySelectorAll('.form-control, .form-select, .enhanced-input').forEach(input => {
      saveOriginalStyles(input, ['font-size', 'height', 'padding']);
      input.classList.add('mobile-enhanced');
      input.style.fontSize = '16px'; // Evita zoom em iPhones
      input.style.height = 'auto';
      input.style.padding = '10px 12px';
    });
    
    // Simplificar cabeçalhos em cards
    document.querySelectorAll('.equipe-card .card-header, .card-header.d-flex').forEach(header => {
      saveOriginalStyles(header, ['flex-direction', 'align-items']);
      header.classList.add('mobile-enhanced');
      
      // Verificar se já está em formato de coluna
      const isFlexColumn = header.style.flexDirection === 'column';
      
      if (!isFlexColumn) {
        header.style.flexDirection = 'column';
        header.style.alignItems = 'flex-start';
        
        const btnGroup = header.querySelector('.btn-group, .action-group');
        if (btnGroup) {
          saveOriginalStyles(btnGroup, ['margin-top', 'width', 'display', 'justify-content']);
          btnGroup.classList.add('mobile-enhanced');
          btnGroup.style.marginTop = '10px';
          btnGroup.style.width = '100%';
          btnGroup.style.display = 'flex';
          btnGroup.style.justifyContent = 'space-between';
        }
      }
    });
    
    // Ajustar modais para melhor visualização em telas pequenas
    document.querySelectorAll('.modal-dialog').forEach(modal => {
      modal.classList.add('mobile-enhanced');
      modal.style.margin = '10px';
      modal.style.maxWidth = 'calc(100% - 20px)';
    });
    
    // Melhorar a exibição de tabelas
    document.querySelectorAll('table').forEach(table => {
      table.classList.add('mobile-enhanced');
      
      // Adicionar classe para tabelas responsivas se não existir um container
      if (!table.closest('.table-responsive')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive mobile-enhanced';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
    
    // Reduzir o padding em containers para aproveitar o espaço
    document.querySelectorAll('.container, .card-body').forEach(container => {
      saveOriginalStyles(container, ['padding']);
      container.classList.add('mobile-enhanced');
      
      const currentPadding = window.getComputedStyle(container).padding;
      if (currentPadding && parseInt(currentPadding) > 15) {
        container.style.padding = '15px';
      }
    });
    
    // Ajustar botões de navegação para serem mais visíveis
    document.querySelectorAll('.navigation-buttons, .action-buttons-group').forEach(navBtns => {
      navBtns.classList.add('mobile-enhanced');
      if (navBtns.classList.contains('d-flex')) {
        navBtns.classList.remove('d-flex');
        navBtns.classList.add('d-grid');
        navBtns.style.gap = '10px';
      }
    });
    
    // Otimizar visualização de step indicator
    const stepIndicator = document.querySelector('.step-indicator');
    if (stepIndicator) {
      stepIndicator.classList.add('mobile-enhanced');
      
      // Substituir texto por ícones em dispositivos muito pequenos
      if (currentBreakpoint === 'xs') {
        document.querySelectorAll('.step-title').forEach(title => {
          title.classList.add('d-none');
        });
      }
    }
  }
  
  // Melhorar contraste para modo escuro em dispositivos móveis
  function enhanceMobileDarkMode() {
    // Aumentar contraste para elementos importantes em modo escuro mobile
    document.querySelectorAll('.form-control, .form-select, .enhanced-input').forEach(input => {
      if (input.classList.contains('mobile-enhanced')) {
        input.style.backgroundColor = '#333';
        input.style.color = '#fff';
      }
    });
    
    // Melhorar visibilidade de botões no modo escuro
    document.querySelectorAll('.btn-primary, .btn-success').forEach(btn => {
      if (btn.classList.contains('mobile-enhanced')) {
        btn.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.25)';
      }
    });
  }
  
  // Melhorar interface para tablets
  function enhanceTabletUI() {
    console.log('Aplicando melhorias para UI Tablet');
    
    // Ajustes moderados para tablets
    document.querySelectorAll('.btn:not(.btn-sm):not(.btn-lg)').forEach(btn => {
      saveOriginalStyles(btn, ['min-height', 'padding']);
      btn.classList.add('tablet-enhanced');
      btn.style.minHeight = '40px'; // Ligeiramente menor que em mobile
    });
    
    // Ajustar modais para melhor visualização em tablets
    document.querySelectorAll('.modal-dialog').forEach(modal => {
      modal.classList.add('tablet-enhanced');
      if (modal.classList.contains('modal-xl')) {
        modal.style.maxWidth = '90%';
      }
    });
    
    // Ajustar layout de formulários em duas colunas quando possível
    document.querySelectorAll('.modal-body .row').forEach(row => {
      row.classList.add('tablet-enhanced');
      
      // Se estiver no modo escuro, adicionar uma borda mais visível entre colunas
      if (document.body.classList.contains('dark-mode')) {
        const firstCol = row.querySelector('.col-md-6:first-child');
        if (firstCol && firstCol.classList.contains('border-end')) {
          firstCol.style.borderRight = '1px solid #444 !important';
        }
      }
    });
  }
  
  // Melhorar interface para desktop
  function enhanceDesktopUI() {
    console.log('Aplicando melhorias para UI Desktop');
    
    // Otimizações para desktop
    document.querySelectorAll('.card, .modal-content').forEach(card => {
      card.classList.add('desktop-enhanced');
      
      // Adicionar efeito de hover suave
      card.addEventListener('mouseenter', () => {
        if (!card._hasHoverEffect) {
          card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
          card._hasHoverEffect = true;
        }
        
        if (card.classList.contains('chart-card') || card.classList.contains('equipe-card')) {
          card.style.transform = 'translateY(-5px)';
          card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
    
    // Melhorar a experiência de botões importantes
    document.querySelectorAll('.btn-primary, .btn-success').forEach(btn => {
      btn.classList.add('desktop-enhanced');
      
      // Adicionar efeito de hover melhorado
      btn.addEventListener('mouseenter', () => {
        if (!btn._hasHoverEffect) {
          btn.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
          btn._hasHoverEffect = true;
        }
        
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.boxShadow = '';
      });
    });
  }
  
  // Melhorias comuns a todos os dispositivos
  function enhanceCommonUI() {
    // Melhorar foco em elementos interativos
    document.querySelectorAll('button, input, select, textarea, a').forEach(el => {
      if (!el._hasFocusStyle) {
        el.addEventListener('focus', () => {
          if (document.body.classList.contains('dark-mode')) {
            el.style.outline = '2px solid rgba(66, 153, 225, 0.6)';
          } else {
            el.style.outline = '2px solid rgba(66, 153, 225, 0.4)';
          }
        });
        
        el.addEventListener('blur', () => {
          el.style.outline = '';
        });
        
        el._hasFocusStyle = true;
      }
    });
    
    // Melhorar visualização de cards de equipe
    document.querySelectorAll('.equipe-card').forEach(card => {
      if (!card.classList.contains('enhanced-card')) {
        card.classList.add('enhanced-card');
        
        // Adicionar borda colorida de acordo com o tipo de equipe
        const tipoEquipe = card.getAttribute('data-tipo-equipe');
        if (tipoEquipe) {
          if (tipoEquipe.includes('Alta Pressão')) {
            card.style.borderLeft = '4px solid var(--success-color, #28a745)';
          } else if (tipoEquipe.includes('Vácuo') || tipoEquipe.includes('Hiper')) {
            card.style.borderLeft = '4px solid var(--danger-color, #dc3545)';
          }
        }
      }
    });
  }
  
  // Melhorar experiência de formulários em dispositivos móveis
  function enhanceMobileFormsExperience() {
    if (!isMobile()) return; // Aplicar apenas para mobile
    
    // Evitar zoom em inputs (iOS)
    document.querySelectorAll('input, select, textarea').forEach(el => {
      // Garantir que a fonte seja pelo menos 16px em dispositivos móveis
      el.style.fontSize = '16px';
      
      // Atualizar placeholder para ser mais legível em mobile
      if (el.hasAttribute('placeholder')) {
        const placeholder = el.getAttribute('placeholder');
        el.setAttribute('data-original-placeholder', placeholder);
        
        // Simplificar placeholder em telas muito pequenas
        if (currentBreakpoint === 'xs' && placeholder.length > 20) {
          const shorterPlaceholder = placeholder.split(',')[0].trim();
          el.setAttribute('placeholder', shorterPlaceholder + '...');
        }
      }
    });
    
    // Melhorar validação visual
    document.querySelectorAll('form').forEach(form => {
      if (!form._hasEnhancedValidation) {
        form.addEventListener('submit', function() {
          if (!this.checkValidity()) {
            // Destaque visual para campos inválidos
            this.querySelectorAll(':invalid').forEach(field => {
              field.classList.add('shake-animation');
              
              // Remover classe de animação após término
              setTimeout(() => {
                field.classList.remove('shake-animation');
              }, 600);
              
              // Rolar para o primeiro campo inválido
              const firstInvalid = this.querySelector(':invalid');
              if (firstInvalid) {
                firstInvalid.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            });
          }
        });
        
        // Adicionar estilos para animação de shake
        if (!document.getElementById('shake-animation-style')) {
          const style = document.createElement('style');
          style.id = 'shake-animation-style';
          style.textContent = `
            @keyframes shakeField {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-5px); }
              40%, 80% { transform: translateX(5px); }
            }
            .shake-animation {
              animation: shakeField 0.6s ease;
              border-color: #dc3545 !important;
            }
          `;
          document.head.appendChild(style);
        }
        
        form._hasEnhancedValidation = true;
      }
    });
  }
  
  // Habilitar navegação por swipe
  function enableSwipeNavigation() {
    if (swipeEnabled) return; // Evitar duplicação
    
    // Variáveis para controle de swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    // Adicionar detector de swipe
    document.addEventListener('touchstart', function(event) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, false);
    
    document.addEventListener('touchend', function(event) {
      touchEndX = event.changedTouches[0].clientX;
      touchEndY = event.changedTouches[0].clientY;
      handleSwipe();
    }, false);
    
    // Função para lidar com o swipe
    function handleSwipe() {
      const swipeThreshold = 80; // Mínimo de pixels para considerar um swipe
      const swipeVerticalThreshold = 100; // Limite vertical para evitar navegação acidental durante scroll
      
      // Verificar se o movimento vertical não é muito grande
      const verticalDistance = Math.abs(touchEndY - touchStartY);
      if (verticalDistance > swipeVerticalThreshold) {
        return; // Provavelmente um scroll, não um swipe
      }
      
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
            const formTurno = document.getElementById('formTurno');
            if (formTurno && formTurno.checkValidity()) {
              // Simular clique no botão
              const advanceButton = document.getElementById('btnAvancarEquipes');
              if (advanceButton) advanceButton.click();
            } else if (formTurno) {
              // Trigger de validação para mostrar erros
              const submitEvent = new Event('submit', { cancelable: true });
              formTurno.dispatchEvent(submitEvent);
            }
            break;
          case 'stepEquipes':
            // Verificar se há equipes adicionadas
            const btnAvancarRevisao = document.getElementById('btnAvancarRevisao');
            if (btnAvancarRevisao && !btnAvancarRevisao.disabled) {
              btnAvancarRevisao.click();
            }
            break;
        }
      }
    }
    
    swipeEnabled = true;
    console.log('Navegação por swipe habilitada');
    
    // Adicionar indicação visual de swipe para usuários
    addSwipeIndicator();
  }
  
  // Adicionar indicador visual para navegação por swipe
  function addSwipeIndicator() {
    if (document.getElementById('swipe-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'swipe-indicator';
    indicator.className = 'swipe-indicator';
    indicator.innerHTML = `
      <div class="swipe-icon">
        <i class="bi bi-arrow-left-right"></i>
      </div>
      <div class="swipe-text">Deslize para navegar</div>
    `;
    
    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
      .swipe-indicator {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 15px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .swipe-icon {
        font-size: 1.2rem;
        animation: swipeAnim 1.5s infinite;
      }
      .swipe-text {
        font-size: 0.9rem;
      }
      @keyframes swipeAnim {
        0% { transform: translateX(-3px); }
        50% { transform: translateX(3px); }
        100% { transform: translateX(-3px); }
      }
      body.dark-mode .swipe-indicator {
        background-color: rgba(255, 255, 255, 0.2);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    
    // Mostrar o indicador apenas uma vez
    setTimeout(() => {
      indicator.style.opacity = '1';
      
      // Esconder após alguns segundos
      setTimeout(() => {
        indicator.style.opacity = '0';
        
        // Remover do DOM após a transição
        setTimeout(() => {
          indicator.remove();
        }, 300);
      }, 3000);
    }, 1000);
  }
  
  // Obter a etapa atual
  function getCurrentStep() {
    const steps = ['stepTurno', 'stepEquipes', 'stepRevisao', 'stepSucesso', 'stepRelatorio', 'stepWhatsApp', 'stepPesquisa', 'dashboard'];
    
    for (const stepId of steps) {
      const el = document.getElementById(stepId);
      if (el && el.style.display !== 'none') {
        return stepId;
      }
    }
    
    return 'stepTurno'; // Padrão
  }
  
  // Adicionar botão de voltar ao topo
  function addBackToTopButton() {
    if (document.getElementById('back-to-top-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'back-to-top-btn';
    btn.className = 'back-to-top-btn';
    btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    btn.title = 'Voltar ao topo';
    
    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
      .back-to-top-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--primary-color, #0d6efd);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.2rem;
        z-index: 999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
      .back-to-top-btn.visible {
        opacity: 0.8;
        visibility: visible;
      }
      .back-to-top-btn:hover {
        opacity: 1;
        transform: translateY(-5px);
      }
      body.dark-mode .back-to-top-btn {
        background-color: var(--primary-light, #3c7ab9);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(btn);
    
    // Funcionalidade de voltar ao topo
    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    // Mostrar/esconder o botão com base no scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
  }
  
  // Exportar funções públicas
  return {
    init,
    isMobile,
    isTablet,
    getCurrentStep
  };
});
