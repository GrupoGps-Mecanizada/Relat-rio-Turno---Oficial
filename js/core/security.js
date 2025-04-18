/**
 * Módulo de Segurança
 * Implementa recursos de segurança e validação
 */
ModuleLoader.register('security', function() {
  // Funções de validação
  const validators = {
    // Validar entrada de texto genérica
    text: function(value, options = {}) {
      const { required = true, minLength = 0, maxLength = 1000 } = options;
      
      if (required && (!value || !value.trim())) {
        return { valid: false, message: 'Este campo é obrigatório.' };
      }
      
      if (value && value.length < minLength) {
        return { valid: false, message: `Este campo deve ter pelo menos ${minLength} caracteres.` };
      }
      
      if (value && value.length > maxLength) {
        return { valid: false, message: `Este campo deve ter no máximo ${maxLength} caracteres.` };
      }
      
      return { valid: true };
    },
    
    // Validar data
    date: function(value, options = {}) {
      const { required = true, minDate, maxDate } = options;
      
      if (required && !value) {
        return { valid: false, message: 'A data é obrigatória.' };
      }
      
      // Verificar formato de data
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { valid: false, message: 'Formato de data inválido. Use AAAA-MM-DD.' };
      }
      
      // Verificar data mínima
      if (minDate && value) {
        const dateValue = new Date(value);
        const minDateValue = new Date(minDate);
        
        if (dateValue < minDateValue) {
          return { 
            valid: false, 
            message: `A data deve ser maior ou igual a ${formatDate(minDateValue)}.` 
          };
        }
      }
      
      // Verificar data máxima
      if (maxDate && value) {
        const dateValue = new Date(value);
        const maxDateValue = new Date(maxDate);
        
        if (dateValue > maxDateValue) {
          return { 
            valid: false, 
            message: `A data deve ser menor ou igual a ${formatDate(maxDateValue)}.` 
          };
        }
      }
      
      return { valid: true };
    },
    
    // Validar email
    email: function(value, options = {}) {
      const { required = true } = options;
      
      if (required && (!value || !value.trim())) {
        return { valid: false, message: 'O email é obrigatório.' };
      }
      
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { valid: false, message: 'Email inválido.' };
      }
      
      return { valid: true };
    },
    
    // Validar placa de veículo
    placa: function(value, options = {}) {
      const { required = false } = options;
      
      if (required && (!value || !value.trim())) {
        return { valid: false, message: 'A placa é obrigatória.' };
      }
      
      if (value && !/^[A-Z]{3}[-]?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(value.toUpperCase())) {
        return { valid: false, message: 'Placa inválida. Use AAA-0000 ou AAA0A00.' };
      }
      
      return { valid: true };
    },
    
    // Validar dataHora
    dataHora: function(value, options = {}) {
      const { required = false } = options;
      
      if (required && (!value || !value.trim())) {
        return { valid: false, message: 'A data e hora são obrigatórias.' };
      }
      
      if (value && !/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(value)) {
        return { valid: false, message: 'Formato inválido. Use DD/MM/AAAA HH:MM.' };
      }
      
      return { valid: true };
    }
  };
  
  // Inicialização
  function init() {
    // Aplicar validações personalizadas aos formulários
    applyCustomValidations();
    
    // Adicionar proteções de segurança
    addSecurityHeaders();
    
    // Verificar acesso a recursos
    document.addEventListener('userLoggedIn', checkResourceAccess);
  }
  
  // Aplicar validações personalizadas aos formulários
  function applyCustomValidations() {
    // Adicionar validações ao formulário principal
    const formTurno = document.getElementById('formTurno');
    if (formTurno) {
      // Adicionar validação customizada ao enviar
      formTurno.addEventListener('submit', function(event) {
        const isValid = validateForm(this);
        
        if (!isValid) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      
      // Aplicar validadores específicos aos campos
      formTurno.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', function() {
          validateField(this);
        });
      });
    }
    
    // Adicionar validações ao formulário de equipe
    const formEquipe = document.getElementById('formEquipe');
    if (formEquipe) {
      // Adicionar validação customizada ao enviar
      formEquipe.addEventListener('submit', function(event) {
        const isValid = validateForm(this);
        
        if (!isValid) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      
      // Aplicar validadores específicos aos campos
      formEquipe.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', function() {
          validateField(this);
        });
      });
    }
  }
  
  // Validar um formulário completo
  function validateForm(form) {
    if (!form || !form.elements) return true;
    
    let isValid = true;
    
    for (let i = 0; i < form.elements.length; i++) {
      const field = form.elements[i];
      
      // Pular elementos sem nome ou desabilitados
      if (!field.name || field.disabled) continue;
      
      const fieldValid = validateField(field);
      isValid = isValid && fieldValid;
    }
    
    return isValid;
  }
  
  // Validar um campo específico
  function validateField(field) {
    if (!field || !field.name) return true;
    
    // Obter validador e opções para o campo
    const validatorInfo = getValidatorForField(field);
    
    if (!validatorInfo) return true;
    
    const { validator, options } = validatorInfo;
    const result = validator(field.value, options);
    
    // Atualizar UI com resultado da validação
    updateFieldValidation(field, result);
    
    return result.valid;
  }
  
  // Obter validador apropriado para um campo
  function getValidatorForField(field) {
    // Mapear campos para validadores
    const fieldValidators = {
      'data': { validator: validators.date, options: { required: true } },
      'horario': { validator: validators.text, options: { required: true } },
      'letra': { validator: validators.text, options: { required: true } },
      'supervisor': { validator: validators.text, options: { required: true } },
      'equipeNumero': { validator: validators.text, options: { required: true } },
      'equipeIntegrantes': { validator: validators.text, options: { required: true, minLength: 3 } },
      'equipeArea': { validator: validators.text, options: { required: true, minLength: 3 } },
      'equipeAtividade': { validator: validators.text, options: { required: true, minLength: 3 } },
      'equipeVaga': { validator: validators.text, options: { required: true } },
      'equipeVagaPersonalizada': { validator: validators.text, options: { required: false } },
      'equipeEquipamento': { validator: validators.text, options: { required: true } },
      'equipeEquipamentoPersonalizado': { validator: validators.text, options: { required: false } },
      'equipePlacaNova': { validator: validators.placa, options: { required: false } },
      'equipeDataHoraTroca': { validator: validators.dataHora, options: { required: false } }
    };
    
    return fieldValidators[field.id];
  }
  
  // Atualizar UI com resultado da validação
  function updateFieldValidation(field, result) {
    // Remover mensagens anteriores
    const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    // Atualizar classes
    field.classList.remove('is-valid', 'is-invalid');
    
    if (!result.valid) {
      field.classList.add('is-invalid');
      
      // Adicionar mensagem de erro
      const feedbackElement = document.createElement('div');
      feedbackElement.className = 'invalid-feedback';
      feedbackElement.textContent = result.message;
      
      field.parentNode.appendChild(feedbackElement);
    } else {
      field.classList.add('is-valid');
    }
  }
  
  // Adicionar cabeçalhos de segurança
  function addSecurityHeaders() {
    // Verificar se estamos em um contexto de página real (não em um iframe)
    if (window.self === window.top) {
      // Adicionar meta tags de segurança
      const metaTags = [
        { name: 'Content-Security-Policy', content: "default-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://apis.google.com https://*.googleusercontent.com https://script.google.com https://sheets.googleapis.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; img-src 'self' data: https://*.googleusercontent.com; connect-src 'self' https://script.google.com https://sheets.googleapis.com https://apis.google.com; frame-src 'self' https://accounts.google.com;" },
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-Frame-Options', content: 'DENY' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
      ];
      
      metaTags.forEach(meta => {
        if (!document.querySelector(`meta[name="${meta.name}"]`)) {
          const metaTag = document.createElement('meta');
          metaTag.setAttribute('http-equiv', meta.name);
          metaTag.setAttribute('content', meta.content);
          document.head.appendChild(metaTag);
        }
      });
    }
  }
  
  // Verificar acesso a recursos
  function checkResourceAccess() {
    // Obter estado de autenticação
    const isAuthenticated = AppState.get('isAuthenticated');
    const currentUser = AppState.get('currentUser');
    
    // Verificar se há um usuário
    if (!isAuthenticated || !currentUser) return;
    
    // Verificar se o domínio de email é permitido
    const emailDomain = currentUser.email.split('@')[1];
    const allowedDomains = ['gmail.com']; // Adicione seus domínios permitidos
    
    if (!allowedDomains.includes(emailDomain)) {
      // Mostrar alerta
      if (window.Notifications) {
        Notifications.warning(`Aviso: Seu domínio de email (${emailDomain}) não está na lista de domínios permitidos.`);
      }
    }
  }
  
  // Formatar data para exibição
  function formatDate(date) {
    if (!date) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  // Exportar funções públicas
  return {
    init,
    validateForm,
    validateField,
    validators
  };
});
