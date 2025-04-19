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
        const dateValue = new Date(value + 'T00:00:00'); // Adicionar hora para evitar fuso
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
        const dateValue = new Date(value + 'T00:00:00');
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

      // Padrão Mercosul e padrão antigo
      if (value && !/^[A-Z]{3}[-]?\d{4}$/i.test(value.toUpperCase()) && !/^[A-Z]{3}\d[A-Z]\d{2}$/i.test(value.toUpperCase())) {
         return { valid: false, message: 'Placa inválida. Use AAA-0000 ou AAA0A00.' };
      }


      return { valid: true };
    },

    // Validar dataHora (DD/MM/AAAA HH:MM)
    dataHora: function(value, options = {}) {
      const { required = false } = options;

      if (required && (!value || !value.trim())) {
        return { valid: false, message: 'A data e hora são obrigatórias.' };
      }

      // Aceita DD/MM/AAAA HH:MM ou YYYY-MM-DDTHH:MM (formato datetime-local)
      if (value && !/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(value) && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return { valid: false, message: 'Formato inválido. Use DD/MM/AAAA HH:MM ou selecione no calendário.' };
      }

      return { valid: true };
    }
  };

  // Inicialização
  function init() {
    // Aplicar validações personalizadas aos formulários
    applyCustomValidations();

    // Adicionar proteções de segurança (CSP agora via meta tag no HTML)
    // addSecurityHeaders(); // Comentado ou simplificado

    // Verificar acesso a recursos
    document.addEventListener('userLoggedIn', checkResourceAccess);
    console.log("Módulo Security inicializado.");
  }

  // Aplicar validações personalizadas aos formulários
  function applyCustomValidations() {
    // Adicionar validações ao formulário principal
    const formTurno = document.getElementById('formTurno');
    if (formTurno) {
      // Validação Bootstrap já aplicada em app.js, mas podemos adicionar validação on-blur aqui
      formTurno.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', function() {
          validateField(this);
        });
         // Adicionar validação 'input' para feedback mais rápido após erro
         field.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                 validateField(this);
            }
         });
      });
    }

    // Adicionar validações ao formulário de equipe (modal)
    const formEquipe = document.getElementById('formEquipe');
    if (formEquipe) {
       // Validação Bootstrap já aplicada em app.js
       formEquipe.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', function() {
          validateField(this);
        });
         field.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                 validateField(this);
            }
         });
      });
       // Validação específica para campos não obrigatórios com formato (placa, data/hora)
       const placaNovaInput = document.getElementById('equipePlacaNova');
       if (placaNovaInput) placaNovaInput.addEventListener('blur', () => validateField(placaNovaInput));
       const dataHoraTrocaInput = document.getElementById('equipeDataHoraTroca');
       if (dataHoraTrocaInput) dataHoraTrocaInput.addEventListener('blur', () => validateField(dataHoraTrocaInput));
    }
  }

  // Validar um formulário completo (Função pode ser útil para verificações extras)
  function validateForm(form) {
    if (!form || !form.elements) return true;
    let isValid = true;
    for (let i = 0; i < form.elements.length; i++) {
      const field = form.elements[i];
      if (!field.name || field.disabled || field.type === 'hidden' || field.type === 'submit' || field.type === 'button' || field.type === 'reset') continue;
      if (!validateField(field)) {
        isValid = false;
        // Poderia focar no primeiro campo inválido
        // if(isValid) field.focus(); // Foca apenas no primeiro erro
      }
    }
    return isValid;
  }


  // Validar um campo específico usando os validators definidos
  function validateField(field) {
    if (!field || !field.name) return true;

    // Obter validador e opções para o campo
    const validatorInfo = getValidatorForField(field);

    // Se não há validador específico, usar validação padrão do navegador (ou retornar true)
    if (!validatorInfo) {
        // Usar validação HTML5 padrão
        const isValidHTML5 = field.checkValidity();
         updateFieldValidationUI(field, { valid: isValidHTML5, message: field.validationMessage });
        return isValidHTML5;
    }

    const { validator, options } = validatorInfo;
    // Passar field.value e as opções para o validador
    const result = validator(field.value, options);

    // Atualizar UI com resultado da validação
    updateFieldValidationUI(field, result);

    return result.valid;
  }

  // Mapear IDs de campos para validadores e opções
  function getValidatorForField(field) {
    const isRequired = field.hasAttribute('required');

    const fieldValidators = {
      'data': { validator: validators.date, options: { required: isRequired } },
      'horario': { validator: validators.text, options: { required: isRequired } },
      'letra': { validator: validators.text, options: { required: isRequired } },
      'supervisor': { validator: validators.text, options: { required: isRequired } },
      // Campos do Modal de Equipe
      'equipeNumero': { validator: validators.text, options: { required: isRequired } },
      'equipeIntegrantes': { validator: validators.text, options: { required: isRequired, minLength: 3 } },
      'equipeArea': { validator: validators.text, options: { required: isRequired, minLength: 3 } },
      'equipeAtividade': { validator: validators.text, options: { required: isRequired, minLength: 3 } },
      'equipeVaga': { validator: validators.text, options: { required: isRequired } },
      'equipeVagaPersonalizada': { validator: validators.text, options: { required: isRequired } }, // Required é dinâmico
      'equipeEquipamento': { validator: validators.text, options: { required: isRequired } },
      'equipeEquipamentoPersonalizado': { validator: validators.text, options: { required: isRequired } }, // Required é dinâmico
      'equipePlacaNova': { validator: validators.placa, options: { required: isRequired } }, // Geralmente não é required
      'equipeDataHoraTroca': { validator: validators.dataHora, options: { required: isRequired } }, // Geralmente não é required
      'equipeMotivoOutro': { validator: validators.text, options: { required: isRequired } }, // Required é dinâmico
      'equipeDefeito': { validator: validators.text, options: { required: isRequired } } // Required é dinâmico
      // Adicionar outros campos se necessário
    };

    // Atualizar 'required' dinamicamente para campos condicionais
    if (field.id === 'equipeVagaPersonalizada') {
        const vagaSelect = document.getElementById('equipeVaga');
        fieldValidators[field.id].options.required = (vagaSelect && vagaSelect.value === 'OUTRA VAGA');
    }
     if (field.id === 'equipeEquipamentoPersonalizado') {
        const equipSelect = document.getElementById('equipeEquipamento');
        fieldValidators[field.id].options.required = (equipSelect && equipSelect.value === 'OUTRO EQUIPAMENTO');
    }
     if (field.id === 'equipeMotivoOutro') {
         const motivoRadio = document.getElementById('motivoOutro');
         fieldValidators[field.id].options.required = (motivoRadio && motivoRadio.checked);
     }
      if (field.id === 'equipeDefeito') {
         const trocaSimRadio = document.getElementById('equipeTrocaSim');
         fieldValidators[field.id].options.required = (trocaSimRadio && trocaSimRadio.checked);
     }


    return fieldValidators[field.id];
  }

  // Atualizar UI com resultado da validação (Classes Bootstrap e mensagem)
  function updateFieldValidationUI(field, result) {
    const parent = field.closest('.mb-3') || field.parentNode; // Encontrar um elemento pai adequado
    let feedbackElement = parent.querySelector('.invalid-feedback');

    // Remover classes e mensagem antiga
    field.classList.remove('is-valid', 'is-invalid');
    if (feedbackElement) {
        feedbackElement.textContent = ''; // Limpar texto
        // feedbackElement.remove(); // Remover completamente pode ser problemático se o HTML o tiver estático
    }

    if (!result.valid) {
      field.classList.add('is-invalid');
      // Criar elemento de feedback se não existir estaticamente no HTML
      if (!feedbackElement) {
          feedbackElement = document.createElement('div');
          feedbackElement.className = 'invalid-feedback';
          // Inserir após o campo ou em local apropriado
          field.parentNode.insertBefore(feedbackElement, field.nextSibling);
      }
      feedbackElement.textContent = result.message; // Adicionar mensagem de erro
    } else {
      // Opcional: Adicionar classe 'is-valid' para feedback positivo
      // field.classList.add('is-valid');
    }
  }

  // Adicionar cabeçalhos de segurança (REMOVIDO X-Frame-Options)
  function addSecurityHeaders() {
    // Verificar se estamos em um contexto de página real (não em um iframe)
    if (window.self === window.top) {
      const metaTags = [
        // CSP é complexo e melhor definido no HTML inicial ou via header do servidor.
        // { name: 'Content-Security-Policy', content: "..." },
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        // { name: 'X-Frame-Options', content: 'DENY' }, // REMOVIDO
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
      ];

      metaTags.forEach(meta => {
        if (!document.querySelector(`meta[http-equiv="${meta.name}"]`)) {
          const metaTag = document.createElement('meta');
          metaTag.setAttribute('http-equiv', meta.name);
          metaTag.setAttribute('content', meta.content);
          // Verificar se document.head existe antes de adicionar
          if (document.head) {
              document.head.appendChild(metaTag);
          } else {
              console.warn("document.head não encontrado ao tentar adicionar meta tag de segurança.");
          }
        }
      });
    }
  }

  // Verificar acesso a recursos (Exemplo: domínio de email permitido)
  function checkResourceAccess() {
    // Obter estado de autenticação
    const AppState = window.AppState || ModuleLoader.get('state'); // Garantir acesso ao AppState
    if (!AppState) return;

    const isAuthenticated = AppState.get('isAuthenticated');
    const currentUser = AppState.get('currentUser');

    if (!isAuthenticated || !currentUser || !currentUser.email) return;

    // Verificar se o domínio de email é permitido (Exemplo)
    const emailDomain = currentUser.email.split('@')[1];
    const allowedDomains = ['gmail.com', 'seu_dominio_corporativo.com']; // Adicione domínios permitidos

    if (!allowedDomains.includes(emailDomain?.toLowerCase())) {
        const Notifications = window.Notifications || ModuleLoader.get('notifications');
        if (Notifications) {
            Notifications.warning(`Aviso: Seu domínio de email (${emailDomain}) pode não ter acesso a todos os recursos.`);
        } else {
             console.warn(`Aviso: Domínio de email (${emailDomain}) não permitido.`);
        }
    }
  }

  // Formatar data para exibição (Exemplo DD/MM/YYYY)
  function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return '';
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
