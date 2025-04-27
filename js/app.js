/**
 * Sistema de Relatório de Turno v3.1
 * Arquivo principal de lógica da aplicação (app.js)
 */

// Variáveis globais (Considerar mover para AppState no futuro)
let equipes = [];
let dadosTurno = {};
let ultimoRelatorioId = null;
let modalEquipe = null; // Instância do Modal Bootstrap
let modalHelp = null; // Instância do Modal Bootstrap
let origemNavegacao = 'stepTurno'; // Armazena a origem da navegação

// Dados do formulário carregados da API ou fallback
let dadosFormulario = null;

/**
 * Inicializar formulário e configurar elementos da UI
 */
async function inicializarFormulario() {
  console.log('Inicializando formulário e elementos UI...');

  try {
    // Inicializar modais Bootstrap
    const modalEquipeElement = document.getElementById('modalEquipe');
    const modalHelpElement = document.getElementById('modalHelp');

    if (modalEquipeElement) {
      // Verificar se já não foi inicializado (caso a função seja chamada novamente)
       if (!bootstrap.Modal.getInstance(modalEquipeElement)) {
           modalEquipe = new bootstrap.Modal(modalEquipeElement);
       } else {
            modalEquipe = bootstrap.Modal.getInstance(modalEquipeElement);
       }
    } else {
      console.warn('Elemento modalEquipe não encontrado no DOM');
    }

    if (modalHelpElement) {
       if (!bootstrap.Modal.getInstance(modalHelpElement)) {
            modalHelp = new bootstrap.Modal(modalHelpElement);
       } else {
            modalHelp = bootstrap.Modal.getInstance(modalHelpElement);
       }
    } else {
      console.warn('Elemento modalHelp não encontrado no DOM');
    }

    // Carregar dados do formulário
    await carregarDadosFormulario();

    // Configurar validação de formulário
    configureFormValidation();

    // Configurar listeners de eventos (já feito em main.js para botões principais)
    setupEventListeners(); // Mover listeners específicos de formulários para cá

    console.log('Formulário inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar formulário:', error);
    // Usar a função global melhorada que usa o módulo Notifications
    mostrarNotificacao('Erro ao inicializar o formulário. Tente recarregar a página.', 'danger');
  }
}

/**
 * Carregar dados do formulário
 */
async function carregarDadosFormulario() {
  mostrarLoading('Carregando opções...');

  try {
    const result = await callAPI('obterDadosFormulario');

    // Verifica se a resposta foi bem-sucedida e se contém a chave OPCOES_FORMULARIO
    if (result && result.success && result.OPCOES_FORMULARIO) {
      dadosFormulario = result.OPCOES_FORMULARIO; // Pega os dados de dentro da chave

      // Preencher selects usando dadosFormulario
      if (dadosFormulario.opcoesHorario) popularSelectOpcoes('horario', dadosFormulario.opcoesHorario);
      if (dadosFormulario.opcoesLetra) popularSelectOpcoes('letra', dadosFormulario.opcoesLetra);
      if (dadosFormulario.opcoesSupervisor) popularSelectOpcoes('supervisor', dadosFormulario.opcoesSupervisor);
      if (dadosFormulario.opcoesNumeroEquipe) popularSelectOpcoes('equipeNumero', dadosFormulario.opcoesNumeroEquipe);

      // Preencher outros selects do modal
      if (dadosFormulario.opcoesLances) {
          popularSelectOpcoes('equipeLancesMangueira', dadosFormulario.opcoesLances);
          popularSelectOpcoes('equipeLancesVaretas', dadosFormulario.opcoesLances);
       }
       if (dadosFormulario.opcoesMangotes) {
           popularSelectOpcoes('equipeMangotes3Polegadas', dadosFormulario.opcoesMangotes);
           popularSelectOpcoes('equipeMangotes4Polegadas', dadosFormulario.opcoesMangotes);
           popularSelectOpcoes('equipeMangotes6Polegadas', dadosFormulario.opcoesMangotes);
       }
       if (dadosFormulario.opcoesCadeadosPlaquetas) {
           popularSelectOpcoes('equipeCadeados', dadosFormulario.opcoesCadeadosPlaquetas);
           popularSelectOpcoes('equipePlaquetas', dadosFormulario.opcoesCadeadosPlaquetas);
       }

      console.log('Dados do formulário carregados com sucesso via API');
    } else {
      console.warn('Falha ao carregar dados da API ou estrutura inesperada. Usando fallback.', result);
      usarDadosFormularioFallback();
    }
  } catch (error) {
    console.error('Erro crítico ao carregar dados do formulário:', error);
    mostrarNotificacao('Erro ao carregar opções do formulário. Usando dados padrão.', 'warning');
    usarDadosFormularioFallback();
  } finally {
    ocultarLoading();
  }
}

function usarDadosFormularioFallback() {
    if (window.CONFIG && CONFIG.OPCOES_FORMULARIO) {
      dadosFormulario = CONFIG.OPCOES_FORMULARIO; // Usar dados do config como fonte

      popularSelectOpcoes('horario', CONFIG.OPCOES_FORMULARIO.opcoesHorario || []);
      popularSelectOpcoes('letra', CONFIG.OPCOES_FORMULARIO.opcoesLetra || []);
      popularSelectOpcoes('supervisor', CONFIG.OPCOES_FORMULARIO.opcoesSupervisor || []);
      popularSelectOpcoes('equipeNumero', CONFIG.OPCOES_FORMULARIO.opcoesNumeroEquipe || []);

      // Preencher outros selects (certifique-se que estas chaves existem em OPCOES_FORMULARIO no config.js)
      popularSelectOpcoes('equipeLancesMangueira', CONFIG.OPCOES_FORMULARIO.opcoesLances || []);
      popularSelectOpcoes('equipeLancesVaretas', CONFIG.OPCOES_FORMULARIO.opcoesLances || []);
      popularSelectOpcoes('equipeMangotes3Polegadas', CONFIG.OPCOES_FORMULARIO.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes4Polegadas', CONFIG.OPCOES_FORMULARIO.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes6Polegadas', CONFIG.OPCOES_FORMULARIO.opcoesMangotes || []);
      popularSelectOpcoes('equipeCadeados', CONFIG.OPCOES_FORMULARIO.opcoesCadeadosPlaquetas || []);
      popularSelectOpcoes('equipePlaquetas', CONFIG.OPCOES_FORMULARIO.opcoesCadeadosPlaquetas || []);

      console.log('Dados do formulário preenchidos com fallback de CONFIG.');
    } else {
        console.error('CONFIG.OPCOES_FORMULARIO não encontrado para fallback.');
        mostrarNotificacao('Falha ao carregar opções do formulário e fallback não disponível.', 'danger');
    }
}


/**
 * Popular um select com opções
 */
function popularSelectOpcoes(elementId, opcoes) {
  const select = document.getElementById(elementId);
  if (!select) {
    console.warn(`Elemento select com ID '${elementId}' não encontrado.`);
    return;
  }
  if (!Array.isArray(opcoes)) {
    console.warn(`Opções para '${elementId}' não são um array.`);
    opcoes = []; // Evitar erro, deixar vazio
  }

  // Guardar valor atual se existir e for válido
  const valorAtual = select.value;
  const manterValor = valorAtual && valorAtual !== '';

  // Limpar opções existentes, exceto a primeira (placeholder)
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Criar conjunto para verificar duplicatas
  const valoresJaAdicionados = new Set();
  if (select.options.length > 0) {
    valoresJaAdicionados.add(select.options[0].value);
  }

  // Adicionar novas opções, verificando duplicatas
  opcoes.forEach(opcao => {
    if (opcao === null || typeof opcao === 'undefined') return; // Pular opções nulas/indefinidas

    const valorOpcao = typeof opcao === 'object' ? opcao.value : opcao; // Se for objeto {value, text}
    const textoOpcao = typeof opcao === 'object' ? opcao.text : opcao;

    // Verificar duplicatas
    if (!valoresJaAdicionados.has(valorOpcao)) {
      valoresJaAdicionados.add(valorOpcao);
      const option = document.createElement('option');
      option.value = valorOpcao;
      option.textContent = textoOpcao;
      select.appendChild(option);
    }
  });

  // Restaurar valor se existia e ainda é uma opção válida
  if (manterValor && select.querySelector(`option[value="${valorAtual}"]`)) {
    select.value = valorAtual;
  } else {
    // Se o valor antigo não existe mais, resetar para o placeholder (primeira opção)
    select.selectedIndex = 0;
  }
}

/**
 * Configurar validação de formulários Bootstrap
 */
function configureFormValidation() {
  // Formulário principal de turno
  const formTurno = document.getElementById('formTurno');
  if (formTurno) {
    formTurno.addEventListener('submit', function handleFormTurnoSubmit(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.checkValidity()) {
        avancarParaEquipes();
      } else {
        mostrarNotificacao('Por favor, preencha todos os campos obrigatórios do turno.', 'warning');
      }
      this.classList.add('was-validated');
    });
  }

  // Formulário de equipe (no modal)
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.addEventListener('submit', function handleFormEquipeSubmit(event) {
      event.preventDefault();
      event.stopPropagation();
      // Adiciona validação customizada para campos condicionais
      if (this.checkValidity() && validarCamposCondicionaisEquipe()) {
         salvarEquipe();
      } else {
          // A mensagem de erro específica já é mostrada por validarCamposCondicionaisEquipe ou pela validação padrão
      }
      this.classList.add('was-validated');
    });
  }
}

/**
 * Valida campos que são obrigatórios condicionalmente no modal de equipe
 * Retorna true se válido, false caso contrário e mostra notificações/feedback visual.
 */
function validarCamposCondicionaisEquipe() {
    let isValid = true;

    // Vaga Personalizada
    const vagaSelect = document.getElementById('equipeVaga');
    const vagaPersonalizadaInput = document.getElementById('equipeVagaPersonalizada');
    if (vagaSelect && vagaSelect.value === 'OUTRA VAGA' && vagaPersonalizadaInput && !vagaPersonalizadaInput.value.trim()) {
        mostrarNotificacao('Por favor, especifique a "Outra Vaga".', 'warning');
        vagaPersonalizadaInput.classList.add('is-invalid');
        if(isValid) vagaPersonalizadaInput.focus(); // Foca no primeiro erro
        isValid = false;
    } else if (vagaPersonalizadaInput) {
        vagaPersonalizadaInput.classList.remove('is-invalid');
    }

    // Equipamento Personalizado
    const equipSelect = document.getElementById('equipeEquipamento');
    const equipPersonalizadoInput = document.getElementById('equipeEquipamentoPersonalizado');
     if (equipSelect && equipSelect.value === 'OUTRO EQUIPAMENTO' && equipPersonalizadoInput && !equipPersonalizadoInput.value.trim()) {
        mostrarNotificacao('Por favor, especifique o "Outro Equipamento".', 'warning');
        equipPersonalizadoInput.classList.add('is-invalid');
        if(isValid) equipPersonalizadoInput.focus();
        isValid = false;
    } else if (equipPersonalizadoInput) {
        equipPersonalizadoInput.classList.remove('is-invalid');
    }

    // Detalhes da Troca
    const trocaEquipamento = document.querySelector('input[name="equipeTroca"]:checked')?.value;
    const motivoTrocaRadio = document.querySelector('input[name="equipeMotivoTroca"]:checked');
    const motivoTroca = motivoTrocaRadio?.value;
    const motivoOutroInput = document.getElementById('equipeMotivoOutro');
    const defeitoInput = document.getElementById('equipeDefeito');
    const motivoTrocaFeedback = document.getElementById('motivoTrocaFeedback');

    if (trocaEquipamento === 'Sim') {
        if (!motivoTroca) {
            if (motivoTrocaFeedback) motivoTrocaFeedback.style.display = 'block';
            mostrarNotificacao('Por favor, selecione o motivo da troca.', 'warning');
            // Tenta focar no primeiro radio do grupo
             const primeiroRadioMotivo = document.getElementById('motivoManutencao');
             if(isValid && primeiroRadioMotivo) primeiroRadioMotivo.focus();
            isValid = false;
        } else {
             if (motivoTrocaFeedback) motivoTrocaFeedback.style.display = 'none';
        }

        if ((motivoTroca === 'Outros Motivos (Justificar)' || motivoTroca === 'Defeitos Em Geral (Justificar)') && motivoOutroInput && !motivoOutroInput.value.trim()) {
            mostrarNotificacao('Por favor, especifique o "Motivo" da troca.', 'warning');
            motivoOutroInput.classList.add('is-invalid');
             if(isValid) motivoOutroInput.focus();
            isValid = false;
        } else if (motivoOutroInput) {
             motivoOutroInput.classList.remove('is-invalid');
        }

        if (defeitoInput && !defeitoInput.value.trim()) {
            mostrarNotificacao('Por favor, descreva o defeito e as medidas tomadas para a troca.', 'warning');
            defeitoInput.classList.add('is-invalid');
             if(isValid) defeitoInput.focus();
            isValid = false;
        } else if (defeitoInput) {
            defeitoInput.classList.remove('is-invalid');
        }
    }
    return isValid;
}


/**
 * Configurar listeners de eventos específicos dos campos (ex: selects que mostram/ocultam outros campos)
 * Chamado dentro de inicializarFormulario ou separadamente
 */
function setupEventListeners() {
  // Listeners para selects que precisam de comportamento especial no modal de equipe
  // É mais seguro adicionar listeners aqui ou garantir que eles sejam readicionados ao abrir o modal
  const equipeVaga = document.getElementById('equipeVaga');
  if (equipeVaga) {
    equipeVaga.removeEventListener('change', toggleVagaPersonalizada); // Evitar duplicação
    equipeVaga.addEventListener('change', toggleVagaPersonalizada);
  }

  const equipeEquipamento = document.getElementById('equipeEquipamento');
  if (equipeEquipamento) {
     equipeEquipamento.removeEventListener('change', toggleEquipamentoPersonalizado);
    equipeEquipamento.addEventListener('change', toggleEquipamentoPersonalizado);
  }

  // Listeners para radios de troca de equipamento
  const radioTrocaSim = document.getElementById('equipeTrocaSim');
  const radioTrocaNao = document.getElementById('equipeTrocaNao');
  if (radioTrocaSim) {
      radioTrocaSim.removeEventListener('change', toggleTrocaEquipamento);
      radioTrocaSim.addEventListener('change', toggleTrocaEquipamento);
  }
   if (radioTrocaNao) {
       radioTrocaNao.removeEventListener('change', toggleTrocaEquipamento);
      radioTrocaNao.addEventListener('change', toggleTrocaEquipamento);
  }

   // Listener para radio "Outros Motivos" e "Defeitos Em Geral"
   const motivoOutroRadio = document.getElementById('motivoOutro');
   const motivoDefeitosRadio = document.getElementById('motivoDefeitos');
   if (motivoOutroRadio) {
       motivoOutroRadio.removeEventListener('change', toggleMotivoOutro);
       motivoOutroRadio.addEventListener('change', toggleMotivoOutro);
   }
   if (motivoDefeitosRadio) {
       motivoDefeitosRadio.removeEventListener('change', toggleMotivoOutro);
       motivoDefeitosRadio.addEventListener('change', toggleMotivoOutro);
   }

   // Adicionar listeners para os outros radios de motivo para garantir que o campo "outro" seja escondido
   const outrosRadiosMotivo = document.querySelectorAll('input[name="equipeMotivoTroca"]:not(#motivoOutro):not(#motivoDefeitos)');
   outrosRadiosMotivo.forEach(radio => {
       radio.removeEventListener('change', toggleMotivoOutro); // Passar a mesma função
       radio.addEventListener('change', toggleMotivoOutro);
   });

    // Listener para status da atividade (para mostrar/ocultar pendência)
    const statusSelect = document.getElementById('equipeStatusAtividade');
    if (statusSelect) {
        statusSelect.removeEventListener('change', togglePendencia); // Evitar duplicação
        statusSelect.addEventListener('change', togglePendencia);
    }
}

/**
 * Mostrar notificação (agora usa wrapper em main.js que chama o módulo Notifications)
 * Esta função global pode ser mantida para compatibilidade, mas o wrapper a intercepta.
 */
function mostrarNotificacao(mensagem, tipo = 'success') {
  // A lógica agora está no wrapper em main.js que chama o módulo Notifications
  // Mantendo um log fallback aqui caso o wrapper falhe por algum motivo
  console.log(`[Fallback Notificação - ${tipo.toUpperCase()}] ${mensagem}`);
  // Tenta usar o toast Bootstrap como último recurso se o módulo/wrapper falhar
  const toastElement = document.getElementById('toastNotificacao');
  const toastBody = document.getElementById('toastTexto');
  if (toastElement && toastBody && window.bootstrap && bootstrap.Toast) {
    try {
        toastElement.className = 'toast align-items-center text-white border-0'; // Reset classes
        const bgClass = tipo === 'danger' ? 'bg-danger' : (tipo === 'warning' ? 'bg-warning text-dark' : (tipo === 'info' ? 'bg-info' : 'bg-success'));
        toastElement.classList.add(bgClass);
        toastBody.textContent = mensagem;
        const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
        toast.show();
    } catch (e) {
        console.error("Erro ao mostrar toast fallback:", e);
        alert(mensagem); // Recurso final
    }
  } else {
    alert(mensagem); // Recurso finalíssimo
  }
}


/**
 * Mostrar indicador de carregamento (agora usa wrapper em main.js)
 */
function mostrarLoading(mensagem = 'Processando...') {
  const loading = document.querySelector('.loading');
  const loadingText = document.querySelector('.loading-text');

  if (loading) {
    if (loadingText) {
      loadingText.textContent = mensagem;
    }
    loading.style.display = 'flex';
  }
  // A medição de performance é iniciada pelo wrapper em main.js
}

/**
 * Ocultar indicador de carregamento (agora usa wrapper em main.js)
 */
function ocultarLoading() {
  const loading = document.querySelector('.loading');

  if (loading) {
    loading.style.display = 'none';
  }
  // A medição de performance é finalizada pelo wrapper em main.js
}

// ========== NAVEGAÇÃO ENTRE ETAPAS ==========

/**
 * Avançar para a etapa de equipes
 */
function avancarParaEquipes() {
  const formTurno = document.getElementById('formTurno');

  // Usar a validação HTML5 do form antes de avançar
  if (!formTurno || !formTurno.checkValidity()) {
    // Adiciona a classe para mostrar os feedbacks de validação do Bootstrap
    if(formTurno) formTurno.classList.add('was-validated');
    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios do turno.', 'warning');
    // Forçar o trigger do submit para mostrar os erros visuais se ainda não foram mostrados
    formTurno?.requestSubmit?.(); // Tenta forçar a validação visual
    return;
  }

  // Salvar dados do turno na variável global (ou AppState)
  const dataInput = document.getElementById('data');
  const horarioSelect = document.getElementById('horario');
  const letraSelect = document.getElementById('letra');
  const supervisorSelect = document.getElementById('supervisor');

  if (!dataInput || !horarioSelect || !letraSelect || !supervisorSelect) {
      mostrarNotificacao("Erro: Elementos do formulário de turno não encontrados.", "danger");
      return;
  }

  dadosTurno = {
    data: dataInput.value,
    horario: horarioSelect.value,
    letra: letraSelect.value,
    supervisor: supervisorSelect.value
  };

  // Atualizar AppState (se estiver sendo usado diretamente)
  if (window.AppState) {
    AppState.update('dadosTurno', dadosTurno);
  }

  // Navegação visual
  navegarParaEtapa('stepEquipes');

  // Atualizar indicadores de etapa
  atualizarIndicadoresEtapa(2);

  // Atualizar botão de avançar da etapa de equipes
  atualizarBotaoAvancar();
}

/**
 * Voltar para a etapa de turno
 */
function voltarParaTurno() {
  navegarParaEtapa('stepTurno');
  atualizarIndicadoresEtapa(1);
}

/**
 * Avançar para a etapa de revisão
 */
function avancarParaRevisao() {
  // Usar AppState ou variável global
  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  if (equipesAtuais.length === 0) {
    mostrarNotificacao('Adicione pelo menos uma equipe para continuar.', 'warning');
    return;
  }

  navegarParaEtapa('stepRevisao');
  atualizarIndicadoresEtapa(3);
  preencherResumosRevisao(); // Preencher os dados na tela de revisão
}

/**
 * Voltar para a etapa de equipes
 */
function voltarParaEquipes() {
  navegarParaEtapa('stepEquipes');
  atualizarIndicadoresEtapa(2);
}

/**
 * Função auxiliar para navegar entre etapas
 */
function navegarParaEtapa(idEtapaAlvo) {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    if(step) step.style.display = 'none';
  });

  // Mostrar etapa alvo
  const etapaAlvo = document.getElementById(idEtapaAlvo);
  if (etapaAlvo) {
    etapaAlvo.style.display = 'block';
     // Atualizar estado da etapa atual (se usar AppState)
     if(window.AppState) {
         AppState.update('currentStep', idEtapaAlvo);
     }
  } else {
      console.error(`Etapa com ID '${idEtapaAlvo}' não encontrada.`);
  }
}

/**
 * Função auxiliar para atualizar indicadores de etapa
 */
function atualizarIndicadoresEtapa(numeroEtapaAtiva) {
    const indicadores = {
        1: document.getElementById('step1Indicator'),
        2: document.getElementById('step2Indicator'),
        3: document.getElementById('step3Indicator')
    };

    for (let i = 1; i <= 3; i++) {
        const indicador = indicadores[i];
        if (indicador) {
            indicador.classList.remove('active', 'completed');
            if (i < numeroEtapaAtiva) {
                indicador.classList.add('completed');
            } else if (i === numeroEtapaAtiva) {
                indicador.classList.add('active');
            }
        }
    }
}


/**
 * Preenche os resumos na tela de revisão
 */
function preencherResumosRevisao() {
  const dadosTurnoAtual = window.AppState?.get('dadosTurno') || dadosTurno;
  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  // Preencher resumo do turno
  const resumoTurno = document.getElementById('resumoTurno');
  if (resumoTurno) {
    resumoTurno.innerHTML = `
      <div class="info-item">
        <div class="info-label">Data</div>
        <div class="info-value">${formatarData(dadosTurnoAtual.data)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${dadosTurnoAtual.horario || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Letra</div>
        <div class="info-value">${dadosTurnoAtual.letra || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Supervisor</div>
        <div class="info-value">${dadosTurnoAtual.supervisor || 'N/A'}</div>
      </div>
    `;
  }

  // Preencher resumo das equipes
  const resumoEquipes = document.getElementById('resumoEquipes');
  if (resumoEquipes) {
    let html = '';
    if (equipesAtuais.length === 0) {
        html = '<div class="alert alert-secondary">Nenhuma equipe adicionada.</div>';
    } else {
        equipesAtuais.forEach((equipe, index) => {
          const isAltaPressao = equipe.tipo === 'Alta Pressão';
          const borderClass = isAltaPressao ? 'border-primary' : 'border-danger';
          const bgClass = isAltaPressao ? 'bg-primary' : 'bg-danger';
          const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
          const vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
          const motivoTrocaDisplay = equipe.motivoTroca === 'Defeitos Em Geral (Justificar)' || equipe.motivoTroca === 'Outros Motivos (Justificar)' ? equipe.motivoOutro : equipe.motivoTroca;

          html += `
            <div class="card mb-3 equipe-card ${borderClass}">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Equipe ${index + 1}: ${equipe.numero || 'N/A'}</h5>
                <div class="badge ${bgClass}">${equipe.tipo}</div>
              </div>
              <div class="card-body">
                <div class="row mb-2">
                  <div class="col-md-6"><strong>Motorista:</strong> ${equipe.motorista || 'N/A'}</div>
                  <div class="col-md-6"><strong>Operador(es):</strong> ${equipe.operadores || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                  <div class="col-md-6"><strong>Área:</strong> ${equipe.area || 'N/A'}</div>
                  <div class="col-md-6"><strong>Atividade:</strong> ${equipe.atividade || 'N/A'}</div>
                </div>
                 <!-- Adiciona Tipo e Status da Atividade aqui -->
                <div class="row mb-2">
                    <div class="col-md-6"><strong>Tipo Ativ.:</strong> ${equipe.tipoAtividade || 'Rotineira'}</div>
                    <div class="col-md-6"><strong>Status:</strong> ${equipe.statusAtividade || 'Concluído'} ${equipe.pendencia ? `<span class="text-muted">(${equipe.pendencia})</span>` : ''}</div>
                </div>
                <!-- Fim Tipo e Status da Atividade -->
                <div class="row mb-2">
                  <div class="col-md-6"><strong>Vaga:</strong> ${vagaDisplay || 'N/A'}</div>
                  <div class="col-md-6"><strong>Equipamento:</strong> ${equipDisplay || 'N/A'}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-md-6"><strong>ID Usiminas:</strong> ${equipe.identificacaoUsiminas || 'N/A'}</div>
                  <div class="col-md-6"><strong>Troca Equip.:</strong> ${equipe.trocaEquipamento || 'N/A'}</div>
                </div>

                ${equipe.trocaEquipamento === 'Sim' ? `
                <div class="alert alert-warning p-2">
                  <small>
                    <strong>Detalhes da Troca:</strong><br>
                    Motivo: ${motivoTrocaDisplay || 'N/A'}<br>
                    Defeito/Medidas: ${equipe.defeito || 'N/A'}<br>
                    ${equipe.placaNova ? `Nova Placa: ${equipe.placaNova}<br>` : ''}
                    ${equipe.dataHoraTroca ? `Data/Hora: ${equipe.dataHoraTroca}` : ''}
                  </small>
                </div>
                ` : ''}

                <h6 class="mt-3">Implementos e Segurança</h6>
                <div class="row">
                    <div class="col-md-6">
                       <div class="alert alert-light p-2">
                          <small>
                            <strong>Implementos:</strong><br>
                            ${isAltaPressao ? `
                              Pistola: ${equipe.materiais?.pistola ?? 'N/A'}<br>
                              Pistola C.L.: ${equipe.materiais?.pistolaCanoLongo ?? 'N/A'}<br>
                              Mang. Torpedo: ${equipe.materiais?.mangueiraTorpedo ?? 'N/A'}<br>
                              Pedal: ${equipe.materiais?.pedal ?? 'N/A'}<br>
                              Varetas: ${equipe.materiais?.varetas ?? 'N/A'}<br>
                              Rabicho: ${equipe.materiais?.rabicho ?? 'N/A'}<br>
                              Lances Mang.: ${equipe.lancesMangueira ?? 'N/A'}<br>
                              Lances Var.: ${equipe.lancesVaretas ?? 'N/A'}
                            ` : `
                              Mangotes: ${equipe.materiaisVacuo?.mangotes ?? 'N/A'}<br>
                              Reduções: ${equipe.materiaisVacuo?.reducoes ?? 'N/A'}<br>
                              Mangotes 3": ${equipe.mangotes3Polegadas ?? 'N/A'}<br>
                              Mangotes 4": ${equipe.mangotes4Polegadas ?? 'N/A'}<br>
                              Mangotes 6": ${equipe.mangotes6Polegadas ?? 'N/A'}
                            `}
                            ${equipe.justificativa ? `<br>Justif. Falta: ${equipe.justificativa}` : ''}
                          </small>
                       </div>
                    </div>
                     <div class="col-md-6">
                       <div class="alert alert-light p-2">
                           <small>
                            <strong>Segurança:</strong><br>
                            Caixa Bloqueio: ${equipe.caixaBloqueio ?? 'N/A'}<br>
                            Cadeados: ${equipe.cadeados ?? 'N/A'}<br>
                            Plaquetas: ${equipe.plaquetas ?? 'N/A'}
                           </small>
                       </div>
                    </div>
                </div>

                ${equipe.observacoes ? `
                <div class="alert alert-secondary p-2 mt-2">
                  <small><strong>Observações:</strong> ${equipe.observacoes}</small>
                </div>
                ` : ''}

              </div>
            </div>
          `;
        });
    }
    resumoEquipes.innerHTML = html;
  }
}


// ========== GERENCIAMENTO DE EQUIPES ==========

/**
 * Adicionar equipe (Abre o Modal)
 */
function adicionarEquipe(tipo) {
  if (!modalEquipe) {
      mostrarNotificacao("Erro: Modal de equipe não inicializado.", "danger");
      return;
  }
  // Limpar formulário
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.reset();
    formEquipe.classList.remove('was-validated');
    // Resetar campos que não são resetados automaticamente (como divs ocultas)
    toggleVagaPersonalizada();
    toggleEquipamentoPersonalizado();
    toggleTrocaEquipamento(); // Garante que os detalhes da troca estejam ocultos
    toggleMotivoOutro(); // Garante que o campo "outro motivo" esteja oculto
    togglePendencia(); // Garante que pendencia esteja oculto
  } else {
      mostrarNotificacao("Erro: Formulário de equipe não encontrado no modal.", "danger");
      return;
  }

  // Definir tipo e índice para nova equipe
   document.getElementById('equipeTipo').value = tipo;
   document.getElementById('equipeIndex').value = '-1'; // Indica nova equipe

  // Configurar cabeçalho e título do modal
  const modalHeader = document.getElementById('modalEquipeHeader');
  const modalTitle = document.getElementById('modalEquipeLabel');
  const isAltaPressao = tipo === 'Alta Pressão';

  if (modalHeader) {
    modalHeader.className = `modal-header text-white ${isAltaPressao ? 'bg-primary' : 'bg-danger'}`;
  }
  if (modalTitle) {
    modalTitle.textContent = `Adicionar Equipe - ${tipo}`;
  }

  // Mostrar/ocultar campos específicos por tipo
  document.getElementById('materiaisAltaPressao').style.display = isAltaPressao ? 'block' : 'none';
  document.getElementById('materiaisVacuo').style.display = isAltaPressao ? 'none' : 'block';

  // Preencher selects de Vaga e Equipamento com base no tipo e nos dados carregados/fallback
  if (dadosFormulario && (dadosFormulario.vagasAltaPressao || dadosFormulario.opcoesHorario)) { // Verifica se o objeto principal existe e tem dados
      const base = dadosFormulario; // 'base' agora é o próprio objeto de opções
      const vagas = isAltaPressao ? base.vagasAltaPressao : base.vagasVacuo;
      const equipamentos = isAltaPressao ? base.equipamentosAltaPressao : base.equipamentosVacuo;

      popularSelectOpcoes('equipeVaga', vagas || ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', equipamentos || ['OUTRO EQUIPAMENTO']);
      // Preencher selects de materiais comuns que usam opções do config
      popularSelectOpcoes('equipeLancesMangueira', base.opcoesLances || []);
      popularSelectOpcoes('equipeLancesVaretas', base.opcoesLances || []);
      popularSelectOpcoes('equipeMangotes3Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes4Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes6Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeCadeados', base.opcoesCadeadosPlaquetas || []);
      popularSelectOpcoes('equipePlaquetas', base.opcoesCadeadosPlaquetas || []);
      console.log("Populando modal (adicionar) com dados carregados:", base); // Log para confirmar
  } else {
      // Este bloco só roda se dadosFormulario for nulo/vazio
      mostrarNotificacao("Aviso: Dados de formulário não carregados, opções podem estar limitadas.", "warning");
      popularSelectOpcoes('equipeVaga', ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', ['OUTRO EQUIPAMENTO']);
      popularSelectOpcoes('equipeLancesMangueira', ['N/A']); popularSelectOpcoes('equipeLancesVaretas', ['N/A']);
      popularSelectOpcoes('equipeMangotes3Polegadas', ['N/A']); popularSelectOpcoes('equipeMangotes4Polegadas', ['N/A']); popularSelectOpcoes('equipeMangotes6Polegadas', ['N/A']);
      popularSelectOpcoes('equipeCadeados', ['N/A', 'Em Falta']); popularSelectOpcoes('equipePlaquetas', ['N/A', 'Em Falta']);
  }

  // Definir automaticamente o próximo número de equipe disponível
  const equipesAtuais = window.AppState?.get('equipes') || equipes;
  let proximoNumero = "Equipe 1"; // Valor padrão

  if (equipesAtuais.length > 0) {
    // Mapear números de equipe para formato numérico
    const numerosAtivos = equipesAtuais
      .map(eq => {
        const match = eq.numero?.match(/Equipe (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0)
      .sort((a, b) => a - b);

    // Encontrar o próximo número disponível (primeiro espaço vago)
    let proximo = 1;
    for (const num of numerosAtivos) {
      if (num > proximo) break;
      proximo = num + 1;
    }

    proximoNumero = `Equipe ${proximo}`;
  }

  // Selecionar automaticamente o próximo número disponível
  const equipeNumeroSelect = document.getElementById('equipeNumero');
  if (equipeNumeroSelect) {
    // Adicionar opção se não existir
    if (!Array.from(equipeNumeroSelect.options).some(opt => opt.value === proximoNumero)) {
      const option = new Option(proximoNumero, proximoNumero);
      equipeNumeroSelect.add(option);
    }
    equipeNumeroSelect.value = proximoNumero;
  }

  // Definir valores padrão para todos os campos de implementos como N/A
  document.querySelectorAll('#materiaisAltaPressao select, #materiaisVacuo select').forEach(select => {
    if (select.options.length > 0 && select.options[0].value !== 'N/A') {
      // Garantir que N/A seja a primeira opção e selecionada
      const noneOption = document.createElement('option');
      noneOption.value = 'N/A';
      noneOption.text = 'N/A';
      select.prepend(noneOption);
    }
    select.selectedIndex = 0; // Selecionar a primeira opção (N/A)
  });

  // Garantir que listeners específicos do modal estejam ativos
  setupEventListeners();

  // Mostrar modal
  modalEquipe.show();
}


/**
 * Editar equipe (Preenche e abre o Modal)
 */
function editarEquipe(index) {
   if (!modalEquipe) {
      mostrarNotificacao("Erro: Modal de equipe não inicializado.", "danger");
      return;
  }

  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  if (index < 0 || index >= equipesAtuais.length) {
    mostrarNotificacao('Equipe não encontrada para edição.', 'error');
    return;
  }

  const equipe = equipesAtuais[index];

  // Limpar formulário antes de preencher
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.reset();
    formEquipe.classList.remove('was-validated');
    // Remover classes 'is-invalid' de validações anteriores
    formEquipe.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  } else {
       mostrarNotificacao("Erro: Formulário de equipe não encontrado no modal.", "danger");
      return;
  }

  // Definir tipo e índice
   document.getElementById('equipeTipo').value = equipe.tipo;
   document.getElementById('equipeIndex').value = index.toString();

  // Configurar cabeçalho e título
  const modalHeader = document.getElementById('modalEquipeHeader');
  const modalTitle = document.getElementById('modalEquipeLabel');
  const isAltaPressao = equipe.tipo === 'Alta Pressão';

   if (modalHeader) {
    modalHeader.className = `modal-header text-white ${isAltaPressao ? 'bg-primary' : 'bg-danger'}`;
  }
  if (modalTitle) {
    modalTitle.textContent = `Editar Equipe - ${equipe.tipo}`;
  }

  // Mostrar/ocultar campos específicos por tipo
  document.getElementById('materiaisAltaPressao').style.display = isAltaPressao ? 'block' : 'none';
  document.getElementById('materiaisVacuo').style.display = isAltaPressao ? 'none' : 'block';

  // Preencher selects de Vaga e Equipamento com base no tipo e nos dados carregados/fallback
  if (dadosFormulario && (dadosFormulario.vagasAltaPressao || dadosFormulario.opcoesHorario)) { // Verifica se o objeto principal existe e tem dados
      const base = dadosFormulario; // 'base' agora é o próprio objeto de opções
      const vagas = isAltaPressao ? base.vagasAltaPressao : base.vagasVacuo;
      const equipamentos = isAltaPressao ? base.equipamentosAltaPressao : base.equipamentosVacuo;

      popularSelectOpcoes('equipeVaga', vagas || ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', equipamentos || ['OUTRO EQUIPAMENTO']);
      // Preencher selects de materiais comuns que usam opções do config
      popularSelectOpcoes('equipeLancesMangueira', base.opcoesLances || []);
      popularSelectOpcoes('equipeLancesVaretas', base.opcoesLances || []);
      popularSelectOpcoes('equipeMangotes3Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes4Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes6Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeCadeados', base.opcoesCadeadosPlaquetas || []);
      popularSelectOpcoes('equipePlaquetas', base.opcoesCadeadosPlaquetas || []);
      console.log("Populando modal (editar) com dados carregados:", base); // Log para confirmar
  } else {
      // Este bloco só roda se dadosFormulario for nulo/vazio
      mostrarNotificacao("Aviso: Dados de formulário não carregados, opções podem estar limitadas.", "warning");
      popularSelectOpcoes('equipeVaga', ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', ['OUTRO EQUIPAMENTO']);
      popularSelectOpcoes('equipeLancesMangueira', ['N/A']); popularSelectOpcoes('equipeLancesVaretas', ['N/A']);
      popularSelectOpcoes('equipeMangotes3Polegadas', ['N/A']); popularSelectOpcoes('equipeMangotes4Polegadas', ['N/A']); popularSelectOpcoes('equipeMangotes6Polegadas', ['N/A']);
      popularSelectOpcoes('equipeCadeados', ['N/A', 'Em Falta']); popularSelectOpcoes('equipePlaquetas', ['N/A', 'Em Falta']);
  }

   // Adicionar a opção específica salva se não estiver na lista padrão
    function addOptionIfNotExists(selectId, value, text) {
        const select = document.getElementById(selectId);
        // Adiciona apenas se o select existe, o valor existe, e a opção *não* existe
        if (select && value && !select.querySelector(`option[value="${value}"]`)) {
            select.add(new Option(text || value, value));
            console.log(`Opção '${value}' adicionada a '${selectId}' para edição.`);
        }
    }
    addOptionIfNotExists('equipeVaga', equipe.vaga);
    addOptionIfNotExists('equipeEquipamento', equipe.equipamento);


   // --- Preencher campos do formulário com dados da equipe ---
    function setFieldValue(id, value) { const field = document.getElementById(id); if (field) field.value = value ?? ''; }
    function setSelectValue(id, value) { const field = document.getElementById(id); if (field) { field.value = value ?? ''; if(field.selectedIndex === -1) field.selectedIndex = 0; } }
    function setRadioValue(name, value) { const radio = document.querySelector(`input[name="${name}"][value="${value}"]`); if (radio) radio.checked = true; else { const firstRadio = document.querySelector(`input[name="${name}"]`); if(firstRadio) firstRadio.checked = true; } } // Seleciona o primeiro se valor não encontrado

    setSelectValue('equipeNumero', equipe.numero);
    setSelectValue('equipeTipoAtividade', equipe.tipoAtividade);
    setSelectValue('equipeStatusAtividade', equipe.statusAtividade);
    setFieldValue('equipePendencia', equipe.pendencia);
    togglePendencia(); // Atualizar visibilidade do campo de pendência
    setFieldValue('equipeMotorista', equipe.motorista);
    setFieldValue('equipeOperadores', equipe.operadores);
    setFieldValue('equipeArea', equipe.area);
    setFieldValue('equipeAtividade', equipe.atividade);
    setFieldValue('equipeIdentificacaoUsiminas', equipe.identificacaoUsiminas);

    // Vaga e Equipamento (considerando "Outra")
    setSelectValue('equipeVaga', equipe.vaga);
    toggleVagaPersonalizada(); // Atualiza visibilidade do campo personalizado
    if (equipe.vaga === 'OUTRA VAGA') { setFieldValue('equipeVagaPersonalizada', equipe.vagaPersonalizada); }
    setSelectValue('equipeEquipamento', equipe.equipamento);
    toggleEquipamentoPersonalizado(); // Atualiza visibilidade
    if (equipe.equipamento === 'OUTRO EQUIPAMENTO') { setFieldValue('equipeEquipamentoPersonalizado', equipe.equipamentoPersonalizado); }

    // Troca de equipamento
    setRadioValue('equipeTroca', equipe.trocaEquipamento || 'Não'); // Default 'Não'
    toggleTrocaEquipamento(); // Atualiza visibilidade dos detalhes
    if (equipe.trocaEquipamento === 'Sim') {
        setRadioValue('equipeMotivoTroca', equipe.motivoTroca);
        toggleMotivoOutro(); // Atualiza visibilidade do campo "outro motivo"
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' || equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
            setFieldValue('equipeMotivoOutro', equipe.motivoOutro);
        }
        setFieldValue('equipeDefeito', equipe.defeito);
        setFieldValue('equipePlacaNova', equipe.placaNova);
        setFieldValue('equipeDataHoraTroca', equipe.dataHoraTroca);
    }

    // Materiais
    if (isAltaPressao && equipe.materiais) {
        setSelectValue('equipePistola', equipe.materiais.pistola);
        setSelectValue('equipePistolaCanoLongo', equipe.materiais.pistolaCanoLongo);
        setSelectValue('equipeMangueiraTorpedo', equipe.materiais.mangueiraTorpedo);
        setSelectValue('equipePedal', equipe.materiais.pedal);
        setSelectValue('equipeVaretas', equipe.materiais.varetas);
        setSelectValue('equipeRabicho', equipe.materiais.rabicho);
        setSelectValue('equipeLancesMangueira', equipe.lancesMangueira);
        setSelectValue('equipeLancesVaretas', equipe.lancesVaretas);
    } else if (!isAltaPressao && equipe.materiaisVacuo) {
        setSelectValue('equipeMangotes', equipe.materiaisVacuo.mangotes);
        setSelectValue('equipeReducoes', equipe.materiaisVacuo.reducoes);
        setSelectValue('equipeMangotes3Polegadas', equipe.mangotes3Polegadas);
        setSelectValue('equipeMangotes4Polegadas', equipe.mangotes4Polegadas);
        setSelectValue('equipeMangotes6Polegadas', equipe.mangotes6Polegadas);
    }

    // Outros campos
    setFieldValue('equipeJustificativa', equipe.justificativa);
    setRadioValue('equipeCaixaBloqueio', equipe.caixaBloqueio || 'Não'); // Default 'Não'
    setSelectValue('equipeCadeados', equipe.cadeados);
    setSelectValue('equipePlaquetas', equipe.plaquetas);
    setFieldValue('equipeObservacoes', equipe.observacoes);

    // Garantir que listeners específicos do modal estejam ativos
    setupEventListeners();

    // Mostrar modal
    modalEquipe.show();
}


/**
 * Remover equipe
 */
function removerEquipe(index) {
  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  if (index < 0 || index >= equipesAtuais.length) {
    mostrarNotificacao('Equipe não encontrada para remoção.', 'error');
    return;
  }

  // Confirmar exclusão
  if (confirm('Tem certeza que deseja remover esta equipe?')) {
    // Criar uma nova lista sem o item removido
    const novasEquipes = equipesAtuais.filter((_, i) => i !== index);

    // Atualizar AppState (preferencial) ou variável global
    if (window.AppState) {
      AppState.update('equipes', novasEquipes); // Atualiza o estado central (dispara listeners em main.js)
    } else {
        equipes = novasEquipes; // Fallback para variável global
        atualizarListaEquipes(); // Atualizar UI manualmente se não usar AppState
        atualizarBotaoAvancar();
    }
    // A subscrição em main.js deve chamar atualizarListaEquipes e atualizarBotaoAvancar automaticamente se AppState for usado

    mostrarNotificacao('Equipe removida com sucesso.', 'success');
  }
}


/**
 * Salvar equipe (Lê dados do modal e atualiza o estado)
 */
function salvarEquipe() {
  // Evitar dupla submissão
  if (salvandoEquipe) {
    console.log("Operação de salvar equipe já em andamento, ignorando requisição duplicada");
    return;
  }

  salvandoEquipe = true;

  const formEquipe = document.getElementById('formEquipe');
  if (!formEquipe) {
    salvandoEquipe = false;
    mostrarNotificacao("Erro: Formulário de equipe não encontrado.", "danger");
    return;
  }

  // Forçar validação Bootstrap E validação condicional antes de ler os dados
  if (!formEquipe.checkValidity() || !validarCamposCondicionaisEquipe()) {
    formEquipe.classList.add('was-validated');
    salvandoEquipe = false;
    return; // Não prosseguir se inválido
  }

  // --- Obter dados da equipe do formulário ---
  function getFieldValue(id) { const field = document.getElementById(id); return field ? field.value : null; }
  function getRadioValue(name) { const radio = document.querySelector(`input[name="${name}"]:checked`); return radio ? radio.value : null; }

  const tipo = getFieldValue('equipeTipo');
  const index = parseInt(getFieldValue('equipeIndex') ?? '-1'); // Usar ?? para fallback
  const isAltaPressao = tipo === 'Alta Pressão';

  const novaEquipe = {
    tipo: tipo,
    numero: getFieldValue('equipeNumero'),
    motorista: getFieldValue('equipeMotorista'),
    operadores: getFieldValue('equipeOperadores'),
    area: getFieldValue('equipeArea'),
    atividade: getFieldValue('equipeAtividade'),
    // Novos campos
    tipoAtividade: getFieldValue('equipeTipoAtividade'),
    statusAtividade: getFieldValue('equipeStatusAtividade'),
    pendencia: getFieldValue('equipeStatusAtividade') !== 'Concluído' ? getFieldValue('equipePendencia') : '', // Só salva pendencia se não concluído
    // Fim novos campos
    vaga: getFieldValue('equipeVaga'),
    vagaPersonalizada: getFieldValue('equipeVaga') === 'OUTRA VAGA' ? getFieldValue('equipeVagaPersonalizada') : '',
    equipamento: getFieldValue('equipeEquipamento'),
    equipamentoPersonalizado: getFieldValue('equipeEquipamento') === 'OUTRO EQUIPAMENTO' ? getFieldValue('equipeEquipamentoPersonalizado') : '',
    identificacaoUsiminas: getFieldValue('equipeIdentificacaoUsiminas'),
    trocaEquipamento: getRadioValue('equipeTroca'),
    caixaBloqueio: getRadioValue('equipeCaixaBloqueio'),
    justificativa: getFieldValue('equipeJustificativa'),
    cadeados: getFieldValue('equipeCadeados'),
    plaquetas: getFieldValue('equipePlaquetas'),
    observacoes: getFieldValue('equipeObservacoes'),
    // Inicializar objetos/propriedades aninhados para evitar erros
    materiais: {},
    materiaisVacuo: {},
    lancesMangueira: null,
    lancesVaretas: null,
    mangotes3Polegadas: null,
    mangotes4Polegadas: null,
    mangotes6Polegadas: null,
    motivoTroca: null,
    motivoOutro: null,
    defeito: null,
    placaNova: null,
    dataHoraTroca: null
  };

  // Adicionar detalhes da troca se aplicável
  if (novaEquipe.trocaEquipamento === 'Sim') {
    novaEquipe.motivoTroca = getRadioValue('equipeMotivoTroca'); // Já validado
    if (novaEquipe.motivoTroca === 'Outros Motivos (Justificar)' || novaEquipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
      novaEquipe.motivoOutro = getFieldValue('equipeMotivoOutro');
    }
    novaEquipe.defeito = getFieldValue('equipeDefeito'); // Já validado
    novaEquipe.placaNova = getFieldValue('equipePlacaNova');
    novaEquipe.dataHoraTroca = getFieldValue('equipeDataHoraTroca');
  }

  // Adicionar materiais específicos por tipo
  if (isAltaPressao) {
    novaEquipe.materiais = {
      pistola: getFieldValue('equipePistola'),
      pistolaCanoLongo: getFieldValue('equipePistolaCanoLongo'),
      mangueiraTorpedo: getFieldValue('equipeMangueiraTorpedo'),
      pedal: getFieldValue('equipePedal'),
      varetas: getFieldValue('equipeVaretas'),
      rabicho: getFieldValue('equipeRabicho')
    };
    novaEquipe.lancesMangueira = getFieldValue('equipeLancesMangueira');
    novaEquipe.lancesVaretas = getFieldValue('equipeLancesVaretas');
  } else { // Auto Vácuo / Hiper Vácuo
    novaEquipe.materiaisVacuo = {
      mangotes: getFieldValue('equipeMangotes'),
      reducoes: getFieldValue('equipeReducoes')
    };
    novaEquipe.mangotes3Polegadas = getFieldValue('equipeMangotes3Polegadas');
    novaEquipe.mangotes4Polegadas = getFieldValue('equipeMangotes4Polegadas');
    novaEquipe.mangotes6Polegadas = getFieldValue('equipeMangotes6Polegadas');
  }

  // Obter lista atual de equipes (preferencialmente do AppState)
  let equipesAtuais = window.AppState?.get('equipes') || [...equipes]; // Cria cópia se usar global
  let equipesAtualizadas;

  // Salvar equipe (Adicionar ou Editar)
  if (index >= 0 && index < equipesAtuais.length) {
    // Editar equipe existente
    equipesAtualizadas = equipesAtuais.map((eq, i) => i === index ? novaEquipe : eq);
    mostrarNotificacao('Equipe atualizada com sucesso.', 'success');
  } else {
    // Adicionar nova equipe
    equipesAtualizadas = [...equipesAtuais, novaEquipe];
    mostrarNotificacao('Equipe adicionada com sucesso.', 'success');
  }

  // Atualizar o estado central (preferencial) ou a variável global
  if (window.AppState) {
    AppState.update('equipes', equipesAtualizadas); // Dispara os listeners em main.js
  } else {
    equipes = equipesAtualizadas; // Fallback global
    atualizarListaEquipes(); // Atualizar UI manually
    atualizarBotaoAvancar();
  }

  // Fechar modal
  if (modalEquipe) {
    modalEquipe.hide();
  }

  // Resetar flag de salvamento
  setTimeout(() => {
    salvandoEquipe = false;
  }, 300); // Pequeno delay para garantir que o modal feche completamente
}

/**
 * Atualizar lista de equipes na UI
 */
function atualizarListaEquipes() {
  const listaEquipesDiv = document.getElementById('listaEquipes');
  const semEquipesDiv = document.getElementById('semEquipes');

  if (!listaEquipesDiv) return;

  // Obter equipes do AppState (preferencial) ou global
  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  // Mostrar ou ocultar mensagem "sem equipes"
  if (semEquipesDiv) {
    semEquipesDiv.style.display = equipesAtuais.length === 0 ? 'block' : 'none';
  }

  // Limpar lista atual (exceto o div 'semEquipes')
  listaEquipesDiv.querySelectorAll('.equipe-card').forEach(card => card.remove());

  // Adicionar cards das equipes
  equipesAtuais.forEach((equipe, index) => {
    const isAltaPressao = equipe.tipo === 'Alta Pressão';
    const cardClass = isAltaPressao ? 'equipe-card card border-primary' : 'equipe-card card equipe-vacuo border-danger'; // Adiciona borda aqui
    const badgeClass = isAltaPressao ? 'bg-primary' : 'bg-danger';
    const statusClass = equipe.statusAtividade === 'Concluído' ? 'text-success' : 'text-warning'; // Classe para status
    const statusIcon = equipe.statusAtividade === 'Concluído' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'; // Icone para status

    const card = document.createElement('div');
    card.className = `${cardClass} mb-3`; // Adiciona margem inferior

    card.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">${equipe.numero || 'N/A'} <span class="badge ${badgeClass} ms-2">${equipe.tipo}</span></h5>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-warning" onclick="editarEquipe(${index})" title="Editar Equipe">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button type="button" class="btn btn-danger" onclick="removerEquipe(${index})" title="Remover Equipe">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </div>
      <div class="card-body p-2">
        <small>
            <strong>Motorista:</strong> ${equipe.motorista || 'N/A'}<br>
            <strong>Operador(es):</strong> ${equipe.operadores || 'N/A'}<br>
            <strong>Área:</strong> ${equipe.area || 'N/A'}<br>
            <strong>Atividade:</strong> ${equipe.atividade || 'N/A'}<br>
            <strong class="${statusClass}"><i class="bi ${statusIcon}"></i> Status:</strong> <span class="${statusClass}">${equipe.statusAtividade || 'Concluído'} ${equipe.pendencia ? `(${equipe.pendencia})` : ''}</span><br>
            <strong>Troca Equip.:</strong> ${equipe.trocaEquipamento || 'N/A'}
        </small>
      </div>
    `;

    listaEquipesDiv.appendChild(card);
  });
}


/**
 * Atualizar estado (habilitado/desabilitado) do botão de avançar para revisão
 */
function atualizarBotaoAvancar() {
  const btnAvancarRevisao = document.getElementById('btnAvancarRevisao');
  if (btnAvancarRevisao) {
     const equipesAtuais = window.AppState?.get('equipes') || equipes;
    btnAvancarRevisao.disabled = equipesAtuais.length === 0;
  }
}

// ========== FUNÇÕES DE CONTROLE DE FORMULÁRIO (Modal) ==========

/**
 * Mostrar/ocultar campo de vaga personalizada
 */
function toggleVagaPersonalizada() {
  const equipeVaga = document.getElementById('equipeVaga');
  const container = document.getElementById('vagaPersonalizadaContainer');
  const input = document.getElementById('equipeVagaPersonalizada');

  if (equipeVaga && container && input) {
    const show = equipeVaga.value === 'OUTRA VAGA';
    container.style.display = show ? 'block' : 'none';
    input.required = show; // Atributo required é booleano
    if (!show) {
        input.value = ''; // Limpa o campo se for escondido
        input.classList.remove('is-invalid'); // Limpa validação
    }
  }
}

/**
 * Mostrar/ocultar campo de equipamento personalizado
 */
function toggleEquipamentoPersonalizado() {
  const equipeEquipamento = document.getElementById('equipeEquipamento');
  const container = document.getElementById('equipamentoPersonalizadoContainer');
  const input = document.getElementById('equipeEquipamentoPersonalizado');

  if (equipeEquipamento && container && input) {
     const show = equipeEquipamento.value === 'OUTRO EQUIPAMENTO';
    container.style.display = show ? 'block' : 'none';
    input.required = show;
     if (!show) {
        input.value = '';
        input.classList.remove('is-invalid');
    }
  }
}

/**
 * Mostrar/ocultar campos de troca de equipamento
 */
function toggleTrocaEquipamento() {
  const trocaSimRadio = document.getElementById('equipeTrocaSim'); // Checa se o "Sim" está marcado
  const detalhesDiv = document.getElementById('trocaDetalhes');

  if (trocaSimRadio && detalhesDiv) {
    const show = trocaSimRadio.checked;
    detalhesDiv.style.display = show ? 'block' : 'none';
    // Limpar campos e validações se escondido
    if (!show) {
        detalhesDiv.querySelectorAll('input[type="text"], input[type="datetime-local"], textarea').forEach(el => {
            el.value = '';
            el.classList.remove('is-invalid');
        });
        detalhesDiv.querySelectorAll('input[type="radio"][name="equipeMotivoTroca"]').forEach(radio => {
             radio.checked = false;
             // Não remover is-invalid dos radios aqui, pois pode ser útil manter o feedback se o usuário clicar "Não" após erro
        });
        toggleMotivoOutro(); // Garante que o campo outro seja escondido
        const motivoFeedback = document.getElementById('motivoTrocaFeedback');
        if(motivoFeedback) motivoFeedback.style.display = 'none'; // Esconder feedback geral
    }
  }
}


/**
 * Mostrar/ocultar campo de motivo outro (chamado pelos radios de motivo)
 */
function toggleMotivoOutro() {
  const motivoOutroRadio = document.getElementById('motivoOutro');
  const motivoDefeitosRadio = document.getElementById('motivoDefeitos');
  const container = document.getElementById('motivoOutroContainer');
  const input = document.getElementById('equipeMotivoOutro');
  const motivoFeedback = document.getElementById('motivoTrocaFeedback'); // Feedback geral dos motivos

  // Esconder feedback geral ao selecionar qualquer motivo válido
  if (motivoFeedback && document.querySelector('input[name="equipeMotivoTroca"]:checked')) {
    motivoFeedback.style.display = 'none';
  }

  if (container && input) {
    // Mostrar campo para "Outros Motivos" ou "Defeitos Em Geral"
    const show = (motivoOutroRadio && motivoOutroRadio.checked) ||
                 (motivoDefeitosRadio && motivoDefeitosRadio.checked);

    container.style.display = show ? 'block' : 'none';
    input.required = show;

    if (!show) {
      input.value = '';
      input.classList.remove('is-invalid');
    }
  }
}

/**
 * Mostrar/ocultar campo de pendência baseado no status da atividade
 */
function togglePendencia() {
    const statusSelect = document.getElementById('equipeStatusAtividade');
    const pendenciaContainer = document.getElementById('pendenciaContainer');
    const pendenciaInput = document.getElementById('equipePendencia');

    if (statusSelect && pendenciaContainer && pendenciaInput) {
        const show = statusSelect.value !== 'Concluído'; // Mostra se NÃO for concluído
        pendenciaContainer.style.display = show ? 'block' : 'none';
        pendenciaInput.required = show; // Obrigatório se não concluído
        if (!show) {
            pendenciaInput.value = ''; // Limpa o campo se for escondido
            pendenciaInput.classList.remove('is-invalid'); // Limpa validação
        }
    }
}


// ========== FUNÇÕES DE RELATÓRIO E SALVAMENTO ==========

/**
 * Salvar relatório local (usado como fallback)
 */
function salvarRelatorioLocal() {
  try {
    const dadosTurnoAtual = window.AppState?.get('dadosTurno') || dadosTurno;
    const equipesAtuais = window.AppState?.get('equipes') || equipes;

    // Gerar ID local
    const localId = 'local_' + new Date().getTime();

    // Criar objeto de relatório
    const relatorio = {
      id: localId,
      dadosTurno: dadosTurnoAtual,
      equipes: equipesAtuais,
      timestamp: new Date().toISOString(),
      origem: 'local'
    };

    // Buscar relatórios existentes
    let relatoriosLocais = [];
    try {
      const relatoriosJson = localStorage.getItem('relatorios_locais');
      if (relatoriosJson) {
        relatoriosLocais = JSON.parse(relatoriosJson);
         if (!Array.isArray(relatoriosLocais)) relatoriosLocais = []; // Garantir que é array
      }
    } catch (e) {
      console.error('Erro ao carregar relatórios locais:', e);
      relatoriosLocais = [];
    }

    // Adicionar novo relatório
    relatoriosLocais.push(relatorio);
    // Manter apenas os últimos 20 relatórios locais (exemplo)
    if(relatoriosLocais.length > 20) {
       relatoriosLocais = relatoriosLocais.slice(-20);
    }

    // Salvar na localStorage
    localStorage.setItem('relatorios_locais', JSON.stringify(relatoriosLocais));

    // Guardar ID do relatório
    const idParaEstado = localId; // Usar o ID local
    if (window.AppState) {
      AppState.update('ultimoRelatorioId', idParaEstado);
    } else {
        ultimoRelatorioId = idParaEstado;
    }

    // Mostrar tela de sucesso
    mostrarTelaSucesso(idParaEstado, true); // Passa ID e indica que é local

    mostrarNotificacao('Relatório salvo localmente com sucesso!', 'success');
    return true;
  } catch (error) {
    console.error('Erro ao salvar relatório localmente:', error);
    mostrarNotificacao('Erro ao salvar localmente: ' + error.message, 'danger');
    return false;
  }
}

/**
 * Salvar relatório com fallback (tentativa API, depois local)
 */
async function salvarRelatorioComFallback() {
  // Evitar submissões múltiplas
  if (salvandoRelatorio) {
    console.log("Operação de salvamento já em andamento, ignorando requisição duplicada");
    return;
  }

  salvandoRelatorio = true;
  mostrarLoading('Salvando relatório...');

  try {
     const dadosTurnoAtual = window.AppState?.get('dadosTurno') || dadosTurno;
     const equipesAtuais = window.AppState?.get('equipes') || equipes;

    // Validar dados antes de enviar
    if (equipesAtuais.length === 0) {
      throw new Error('Adicione pelo menos uma equipe para salvar o relatório.');
    }
    if (!dadosTurnoAtual.data || !dadosTurnoAtual.horario || !dadosTurnoAtual.letra || !dadosTurnoAtual.supervisor) {
      throw new Error('Dados do turno incompletos. Por favor, volte e preencha todos os campos.');
    }

    // Tentar salvar na API
    let idRelatorioSalvo = null;
    let salvoLocalmente = false;

    try {
      console.log("Tentando salvar na API...");
      // Confirmar nome da action com SCRIPT APP GOOGLE.txt -> é 'salvarTurno'
      const result = await callAPI('salvarTurno', {
          dadosTurno: dadosTurnoAtual,
          equipes: equipesAtuais
      });

      if (result && result.success && result.relatorioId) {
        idRelatorioSalvo = result.relatorioId;
        console.log(`Relatório salvo na API com ID: ${idRelatorioSalvo}`);
        mostrarNotificacao('Relatório salvo com sucesso no servidor!', 'success');
      } else {
        // Lança erro para cair no catch e tentar salvar localmente
        throw new Error(result?.message || 'Erro desconhecido ao salvar na API.');
      }
    } catch (apiError) {
      console.error('Erro ao salvar na API:', apiError);
      mostrarNotificacao('Falha ao salvar no servidor. Tentando salvar localmente...', 'warning');

      // Tentar salvar localmente
      if (salvarRelatorioLocal()) { // salvarRelatorioLocal já mostra notificações
          idRelatorioSalvo = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId; // Pega o ID local
          salvoLocalmente = true;
      } else {
        // Se falhar localmente também, lançar erro final
        throw new Error('Falha ao salvar remotamente e localmente.');
      }
    }

     // Atualizar estado com o ID (seja da API ou local)
    if (idRelatorioSalvo) {
        if (window.AppState) {
            AppState.update('ultimoRelatorioId', idRelatorioSalvo);
        } else {
            ultimoRelatorioId = idRelatorioSalvo;
        }
    }

     // Mostrar tela de sucesso (passando o ID e se foi local)
     mostrarTelaSucesso(idRelatorioSalvo, salvoLocalmente);

    return true; // Indicar sucesso geral (API ou local)

  } catch (error) {
    console.error('Erro final ao salvar relatório:', error);
    mostrarNotificacao('Erro ao salvar relatório: ' + error.message, 'danger');
    // Manter o usuário na tela de revisão para não perder dados
    return false;
  } finally {
    ocultarLoading();
    setTimeout(() => {
      salvandoRelatorio = false;
    }, 500); // Reset após delay para garantir
  }
}

/**
 * Mostrar tela de sucesso e atualizar mensagem
 */
function mostrarTelaSucesso(idSalvo = null, foiLocal = false) {
  navegarParaEtapa('stepSucesso');

  // Atualizar mensagem de sucesso
  const mensagemSucessoStatus = document.getElementById('mensagemSucessoStatus');
  if (mensagemSucessoStatus) {
      if (foiLocal) {
          mensagemSucessoStatus.textContent = `Relatório salvo localmente. ID: ${idSalvo || 'N/A'}`;
      } else {
           mensagemSucessoStatus.textContent = `Relatório #${idSalvo || 'N/A'} registrado com sucesso no servidor!`;
      }
  }

  // Garantir que o ID esteja disponível para os botões de ação
  const idAtual = idSalvo || (window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId);
  if (!idAtual) {
      console.warn("ID do relatório não definido na tela de sucesso.");
      // Desabilitar botões que dependem do ID?
       document.querySelectorAll('#stepSucesso button:not(:last-child)').forEach(btn => btn.disabled = true);
  } else {
       // Habilitar botões
       document.querySelectorAll('#stepSucesso button').forEach(btn => btn.disabled = false);
       // Ajustar o onclick do botão PDF para ter os parâmetros corretos
        const btnPDF = document.querySelector('#stepSucesso button[onclick^="gerarPDFExistente"]');
        if (btnPDF) {
            const origemPDF = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
            btnPDF.onclick = () => gerarPDFExistente(idAtual, origemPDF);
            // Desabilitar se for local
            if (origemPDF === 'local') {
                 btnPDF.disabled = true;
                 btnPDF.title = "PDF não disponível para relatórios locais.";
            } else {
                 btnPDF.title = "Gerar PDF do último relatório salvo";
            }
        }
  }
}


/**
 * Criar novo relatório (reseta o estado)
 */
function novoRelatorio() {
  // Reiniciar dados no AppState (preferencial) ou global
  if (window.AppState) {
    AppState.update('dadosTurno', {});
    AppState.update('equipes', []);
    AppState.update('ultimoRelatorioId', null);
  } else {
      dadosTurno = {};
      equipes = [];
      ultimoRelatorioId = null;
      // Atualizar UI manualmente se não usar AppState
      atualizarListaEquipes();
      atualizarBotaoAvancar();
  }


  // Limpar formulário de turno
  const formTurno = document.getElementById('formTurno');
   if(formTurno) {
        formTurno.reset();
        formTurno.classList.remove('was-validated');
   }

  // Configurar data padrão como hoje
  const dataInput = document.getElementById('data');
  if (dataInput) {
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const localDate = new Date(today.getTime() - offset);
      dataInput.value = localDate.toISOString().split('T')[0];
    } catch (e) {
      console.error("Erro ao definir data padrão:", e);
      dataInput.value = '';
    }
  }

  // Voltar para a primeira etapa
  navegarParaEtapa('stepTurno');
  atualizarIndicadoresEtapa(1);
}

/**
 * Função auxiliar para gerenciar a navegação
 */
function setOrigemNavegacao(origem) {
  if (window.AppState) {
    AppState.update('origemNavegacao', origem);
  } else {
    window.origemNavegacao = origem;
  }
}

/**
 * Função para obter origem da navegação
 */
function getOrigemNavegacao() {
  return window.AppState ? AppState.get('origemNavegacao') : window.origemNavegacao;
}

/**
 * Função que determina para onde voltar
 */
function voltarParaTelaOrigem() {
  const origem = getOrigemNavegacao();
  if (origem === 'stepSucesso') {
    voltarParaSucesso();
  } else if (origem === 'stepPesquisa') {
    voltarDaVisualizacaoParaPesquisa();
  } else {
    // Fallback para sucesso
    voltarParaSucesso();
  }
}

/**
 * Visualizar relatório (usa ID salvo no estado)
 */
async function visualizarRelatorio() {
  // Salvar origem antes de navegar
  setOrigemNavegacao('stepSucesso');

  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
  if (!idAtual) {
      mostrarNotificacao("ID do relatório não encontrado para visualização.", "warning");
      return;
  }
  // Determina se é local ou servidor pelo prefixo do ID
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
  // Ação correta da API é 'gerarRelatorioTexto'
  await visualizarRelatorioExistente(idAtual, origem, 'gerarRelatorioTexto');
}

/**
 * Formatar relatório para WhatsApp (usa ID salvo no estado)
 */
async function formatarWhatsApp() {
  // Salvar origem antes de navegar
  setOrigemNavegacao('stepSucesso');

  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
   if (!idAtual) {
      mostrarNotificacao("ID do relatório não encontrado para formatação.", "warning");
      return;
  }
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
   // Ação correta da API é 'formatarWhatsApp'
  await formatarWhatsAppExistente(idAtual, origem, 'formatarWhatsApp');
}

/**
 * Voltar para a tela de sucesso (vinda da visualização/whatsapp)
 */
function voltarParaSucesso() {
    const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
    const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
    mostrarTelaSucesso(idAtual, origem === 'local'); // Mostra a tela de sucesso novamente
}

/**
 * Voltar da visualização do relatório ou WhatsApp para a tela de origem
 */
function voltarDoWhatsApp() {
    voltarParaTelaOrigem();
}

function voltarDoRelatorio() {
    voltarParaTelaOrigem();
}


/**
 * Copiar texto para a área de transferência (Função genérica)
 */
function copiarTextoParaClipboard(elementId, tipoTexto) {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    mostrarNotificacao(`Erro: Elemento ${elementId} não encontrado para cópia.`, "danger");
    return;
  }

  const textoParaCopiar = elemento.textContent || elemento.value || ''; // Pega de pre ou input/textarea

  if (!navigator.clipboard) {
    // Fallback para navegadores sem Clipboard API (menos seguro)
    try {
      const ta = document.createElement('textarea');
      ta.value = textoParaCopiar;
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      mostrarNotificacao(`${tipoTexto} copiado para a área de transferência! (Método antigo)`, 'success');
    } catch (err) {
      console.error('Falha ao copiar (fallback):', err);
      mostrarNotificacao(`Não foi possível copiar automaticamente. Selecione e copie manualmente (Ctrl+C).`, 'warning');
    }
    return;
  }

  // Usar Clipboard API (moderno e seguro)
  navigator.clipboard.writeText(textoParaCopiar).then(() => {
    mostrarNotificacao(`${tipoTexto} copiado para a área de transferência!`, 'success');
  }).catch(err => {
    console.error(`Erro ao copiar ${tipoTexto}:`, err);
    mostrarNotificacao(`Falha ao copiar ${tipoTexto}. Verifique as permissões do navegador.`, 'danger');
  });
}


/**
 * Copiar relatório gerado
 */
function copiarRelatorio() {
    copiarTextoParaClipboard('relatorioTexto', 'Relatório');
}

/**
 * Copiar texto formatado para WhatsApp
 */
function copiarWhatsApp() {
     copiarTextoParaClipboard('whatsAppTexto', 'Texto WhatsApp');
}


// ========== FUNÇÕES DE PESQUISA ==========

/**
 * Abrir tela de pesquisa
 */
function abrirPesquisa() {
  navegarParaEtapa('stepPesquisa');

  // Reiniciar formulário de pesquisa
  const formPesquisa = document.getElementById('formPesquisa');
  if (formPesquisa) {
    formPesquisa.reset();
    // Resetar tipo de input se necessário
    ajustarCampoPesquisa();
  }

  // Ocultar resultados anteriores
  const resultadosPesquisa = document.getElementById('resultadosPesquisa');
  if (resultadosPesquisa) {
    resultadosPesquisa.style.display = 'none';
    const tabelaResultados = document.getElementById('tabelaResultados');
    if(tabelaResultados) tabelaResultados.innerHTML = ''; // Limpar tabela
    const semResultadosDiv = document.getElementById('semResultados');
    if(semResultadosDiv) semResultadosDiv.style.display = 'none'; // Esconder msg "sem resultados"
  }
}

/**
 * Ajustar campo de pesquisa conforme o tipo selecionado
 */
function ajustarCampoPesquisa() {
  const tipoPesquisaSelect = document.getElementById('tipoPesquisa');
  const termoPesquisaInput = document.getElementById('termoPesquisa');
  const labelPesquisaLabel = document.getElementById('labelPesquisa');

  if (!tipoPesquisaSelect || !termoPesquisaInput || !labelPesquisaLabel) return;

  const tipo = tipoPesquisaSelect.value;

  switch (tipo) {
    case 'data':
      labelPesquisaLabel.textContent = 'Data (AAAA-MM-DD)';
      termoPesquisaInput.type = 'date';
      termoPesquisaInput.placeholder = '';
      termoPesquisaInput.value = ''; // Limpar valor ao trocar tipo
      break;
    case 'mes_ano':
      labelPesquisaLabel.textContent = 'Mês/Ano (AAAA-MM)';
      termoPesquisaInput.type = 'month'; // Input type="month" retorna YYYY-MM
      termoPesquisaInput.placeholder = '';
      termoPesquisaInput.value = '';
      break;
    case 'supervisor':
      labelPesquisaLabel.textContent = 'Nome do Supervisor';
      termoPesquisaInput.type = 'text';
      termoPesquisaInput.placeholder = 'Digite o nome do supervisor';
      termoPesquisaInput.value = '';
      break;
    case 'letra':
      labelPesquisaLabel.textContent = 'Letra do Turno';
      termoPesquisaInput.type = 'text';
      termoPesquisaInput.placeholder = 'A, B, C, D, etc.';
      termoPesquisaInput.value = '';
      break;
    case 'local':
      labelPesquisaLabel.textContent = 'Pesquisar em Relatórios Locais';
      termoPesquisaInput.type = 'text';
      termoPesquisaInput.placeholder = 'Digite termo, data, supervisor...';
      termoPesquisaInput.value = '';
      break;
    default: // geral (ID, termo genérico)
      labelPesquisaLabel.textContent = 'Termo de Pesquisa ou ID';
      termoPesquisaInput.type = 'text';
      termoPesquisaInput.placeholder = 'Digite ID ou termo geral';
      termoPesquisaInput.value = '';
  }
}


/**
 * Executar pesquisa (API ou Local)
 */
async function executarPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa').value;
  let termoPesquisa = document.getElementById('termoPesquisa').value;

  // Validar termo
  if (!termoPesquisa || !termoPesquisa.trim()) {
    mostrarNotificacao('Por favor, digite um termo de pesquisa.', 'warning');
    return;
  }

  // Ajustar termo 'month' para MM/YYYY se a API esperar assim (ajuste conforme necessidade)
  let termoParaAPI = termoPesquisa.trim();
  if (tipoPesquisa === 'mes_ano' && /^\d{4}-\d{2}$/.test(termoParaAPI)) {
    const [ano, mes] = termoParaAPI.split('-');
    termoParaAPI = `${mes}/${ano}`; // Ex: Converte 2023-10 para 10/2023
  }

  mostrarLoading('Pesquisando relatórios...');

  try {
    let resultados = [];
    /*
    // --- Bloco de código para pesquisa por status (parece incompleto/deslocado) ---
    // Este bloco estava solto aqui, precisa ser integrado à lógica de pesquisa se for necessário.
    // Presumo que a intenção era adicionar um `case 'status':` no switch de ajuste ou
    // ter uma lógica separada para pesquisa por status na API ou localmente.
    // Por ora, comentei para não causar erro.
    if (tipoPesquisa === 'status') {
       // match = linha[statusAtividadeIndex] &&
       //         linha[statusAtividadeIndex].toString().toLowerCase().includes(termoLower);
       console.warn("Pesquisa por 'status' não implementada completamente.");
       // Implementar busca por status aqui (API ou local)
    }
    // --- Fim do Bloco ---
    */

    if (tipoPesquisa === 'local') {
      resultados = pesquisarRelatoriosLocais(termoPesquisa.trim());
    } else {
      // Pesquisar na API - Action 'pesquisarRelatorios' (confirmar com Apps Script)
      const result = await callAPI('pesquisarRelatorios', {
          termo: termoParaAPI, // Envia o termo original ou ajustado
          tipo: tipoPesquisa
      });

      if (result && result.success) {
        resultados = result.resultados || [];
        // Adicionar origem para consistência
        resultados.forEach(relatorio => { relatorio.origem = 'servidor'; });
      } else {
        throw new Error(result?.message || 'Erro ao pesquisar relatórios no servidor.');
      }
    }

    exibirResultadosPesquisa(resultados);
     if(resultados.length === 0) {
         mostrarNotificacao('Nenhum relatório encontrado.', 'info');
     }

  } catch (error) {
    console.error('Erro ao executar pesquisa:', error);
    mostrarNotificacao('Erro ao pesquisar: ' + error.message, 'danger');
     exibirResultadosPesquisa([]); // Limpar resultados em caso de erro
  } finally {
    ocultarLoading();
  }
}

/**
 * Pesquisar relatórios salvos localmente
 */
function pesquisarRelatoriosLocais(termo) {
  let relatoriosLocais = [];
  try {
    const relatoriosJson = localStorage.getItem('relatorios_locais');
    if (relatoriosJson) {
      relatoriosLocais = JSON.parse(relatoriosJson);
       if (!Array.isArray(relatoriosLocais)) relatoriosLocais = [];
    }
  } catch (e) {
    console.error('Erro ao carregar relatórios locais para pesquisa:', e);
    return []; // Retorna vazio se houver erro
  }

  // Filtrar por termo (busca simples em campos chave)
  const termoLower = termo.toLowerCase();
  return relatoriosLocais.filter(relatorio => {
    const { dadosTurno, equipes = [], id } = relatorio;
    if (!dadosTurno) return false;

    // Função auxiliar para busca case-insensitive
    const checkMatch = (valor) => valor && String(valor).toLowerCase().includes(termoLower);

    // Checar ID
    if (checkMatch(id)) return true;
    // Checar dados do turno
    if (checkMatch(dadosTurno.letra)) return true;
    if (checkMatch(dadosTurno.supervisor)) return true;
    if (checkMatch(dadosTurno.data)) return true; // Checa YYYY-MM-DD
    if (checkMatch(formatarData(dadosTurno.data))) return true; // Checa DD/MM/YYYY
    if (checkMatch(dadosTurno.horario)) return true;

    // Checar campos das equipes
    return equipes.some(eq =>
        checkMatch(eq.numero) ||
        checkMatch(eq.motorista) ||
        checkMatch(eq.operadores) ||
        checkMatch(eq.area) ||
        checkMatch(eq.atividade) ||
        checkMatch(eq.tipoAtividade) || // Incluir novos campos na busca
        checkMatch(eq.statusAtividade) ||
        checkMatch(eq.pendencia) ||
        checkMatch(eq.vaga) ||
        checkMatch(eq.vagaPersonalizada) ||
        checkMatch(eq.equipamento) ||
        checkMatch(eq.equipamentoPersonalizado) ||
        checkMatch(eq.identificacaoUsiminas) ||
        checkMatch(eq.motivoTroca) || // Incluir motivos na busca
        checkMatch(eq.motivoOutro) ||
        checkMatch(eq.defeito) ||
        checkMatch(eq.placaNova) ||
        checkMatch(eq.observacoes)
    );
}).map(relatorio => ({ // Formatar para exibição na tabela
  id: relatorio.id,
  data: formatarData(relatorio.dadosTurno.data),
  horario: relatorio.dadosTurno.horario || 'N/A',
  letra: relatorio.dadosTurno.letra || 'N/A',
  supervisor: relatorio.dadosTurno.supervisor || 'N/A',
  origem: 'local'
})).sort((a, b) => { // Ordenar por data desc (mais recente primeiro)
  const dateA = a.data.split('/').reverse().join('');
  const dateB = b.data.split('/').reverse().join('');
  return dateB.localeCompare(dateA);
});
}


/**
 * Exibir resultados da pesquisa na tabela
 */
function exibirResultadosPesquisa(resultados) {
  const resultadosPesquisaDiv = document.getElementById('resultadosPesquisa');
  const tabelaResultadosBody = document.getElementById('tabelaResultados');
  const semResultadosDiv = document.getElementById('semResultados');

  if (!resultadosPesquisaDiv || !tabelaResultadosBody || !semResultadosDiv) return;

  // Mostrar/ocultar containers
  resultadosPesquisaDiv.style.display = 'block';
  semResultadosDiv.style.display = (!resultados || resultados.length === 0) ? 'block' : 'none';

  // Limpar tabela
  tabelaResultadosBody.innerHTML = '';

  // Preencher tabela
  if (resultados && resultados.length > 0) {
      resultados.forEach(relatorio => {
        const linha = document.createElement('tr');
        const badgeClass = relatorio.origem === 'local' ? 'bg-secondary' : 'bg-info'; // Info para servidor
        const podeGerarPDF = relatorio.origem === 'servidor'; // Só gera PDF de relatórios do servidor

        linha.innerHTML = `
          <td><span class="badge ${badgeClass}">${relatorio.origem}</span></td>
          <td>${relatorio.data || 'N/A'}</td>
          <td>${relatorio.horario || 'N/A'}</td>
          <td>${relatorio.letra || 'N/A'}</td>
          <td>${relatorio.supervisor || 'N/A'}</td>
          <td class="text-center">
            <div class="action-buttons btn-group btn-group-sm">
              <button type="button" class="btn btn-primary" onclick="visualizarRelatorioExistente('${relatorio.id}', '${relatorio.origem}', 'gerarRelatorioTexto')" title="Visualizar">
                <i class="bi bi-eye"></i>
              </button>
              <button type="button" class="btn btn-danger" onclick="gerarPDFExistente('${relatorio.id}', '${relatorio.origem}')" title="Gerar PDF" ${!podeGerarPDF ? 'disabled' : ''}>
                <i class="bi bi-file-pdf"></i>
              </button>
              <button type="button" class="btn btn-info text-white" onclick="formatarWhatsAppExistente('${relatorio.id}', '${relatorio.origem}', 'formatarWhatsApp')" title="Formatar WhatsApp">
                <i class="bi bi-whatsapp"></i>
              </button>
            </div>
          </td>
        `;
        tabelaResultadosBody.appendChild(linha);
      });
  }
}

/**
 * Visualizar um relatório específico (local ou servidor)
 * @param {string} id ID do relatório
 * @param {string} origem 'local' ou 'servidor'
 * @param {string} apiAction Nome da action na API para buscar o texto (ex: 'gerarRelatorioTexto')
 */
async function visualizarRelatorioExistente(id, origem = 'servidor', apiAction = 'gerarRelatorioTexto') {
  if (!id) {
      mostrarNotificacao("ID inválido para visualização.", "danger");
      return;
  }

  // Salvar origem para navegação de retorno
  setOrigemNavegacao(window.AppState?.get('currentStep') || 'stepSucesso');

  mostrarLoading('Carregando relatório...');

  try {
    let textoRelatorio = '';
    let relatorioCompleto = null; // Para guardar dados se for local

    if (origem === 'local') {
      relatorioCompleto = obterRelatorioLocal(id);
      if (!relatorioCompleto) {
        throw new Error('Relatório local não encontrado.');
      }
      textoRelatorio = gerarTextoRelatorioLocal(relatorioCompleto); // Gerar texto a partir dos dados
    } else {
      // Buscar da API
      const result = await callAPI(apiAction, { turnoId: id }); // Usa a action passada
      if (result && result.success && result.relatorio) {
        textoRelatorio = result.relatorio;
      } else {
        throw new Error(result?.message || `Erro ao buscar relatório (${apiAction}) do servidor.`);
      }
    }

    // Atualizar estado com o ID visualizado (para botão voltar funcionar)
    if(window.AppState) AppState.update('ultimoRelatorioId', id);
    else ultimoRelatorioId = id;


    // Mostrar na tela
    navegarParaEtapa('stepRelatorio');
    const relatorioTextoElement = document.getElementById('relatorioTexto');
    if (relatorioTextoElement) {
      relatorioTextoElement.textContent = textoRelatorio;
    }

    // Configurar botão voltar para usar a função correta
    const btnVoltarRelatorio = document.getElementById('btnVoltarRelatorio');
    if (btnVoltarRelatorio) {
      btnVoltarRelatorio.onclick = voltarDoRelatorio;
    }
  } catch (error) {
    console.error('Erro ao visualizar relatório existente:', error);
    mostrarNotificacao('Erro ao visualizar relatório: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Obter dados de um relatório local por ID
 */
function obterRelatorioLocal(id) {
  let relatoriosLocais = [];
  try {
    const relatoriosJson = localStorage.getItem('relatorios_locais');
    if (relatoriosJson) {
      relatoriosLocais = JSON.parse(relatoriosJson);
       if (!Array.isArray(relatoriosLocais)) relatoriosLocais = [];
    }
  } catch (e) {
    console.error('Erro ao carregar relatório local:', e);
    return null;
  }
  return relatoriosLocais.find(relatorio => relatorio.id === id) || null;
}


/**
 * Gerar texto de relatório local (Melhorado e mais detalhado) - ATUALIZADO
 */
function gerarTextoRelatorioLocal(relatorio) {
  if (!relatorio || !relatorio.dadosTurno || !relatorio.equipes) {
    return 'Erro: Dados do relatório local inválidos ou ausentes.';
  }

  const { dadosTurno, equipes, id, timestamp } = relatorio;
  let texto = ''; // <--- Usar 'texto' como no resto da função
  const linhaSeparadora = '='.repeat(72) + '\n';
  const subLinha = '-'.repeat(72) + '\n';

  texto += linhaSeparadora;
  texto += '                     RELATÓRIO DE TURNO (LOCAL)\n';
  texto += '                   GRUPO GPS - MECANIZADA\n';
  texto += linhaSeparadora + '\n';

  texto += 'INFORMAÇÕES GERAIS\n';
  texto += subLinha;
  texto += `Data: ${formatarData(dadosTurno.data)}\n`;
  texto += `Horário: ${dadosTurno.horario || 'N/A'}\n`;
  texto += `Letra do turno: ${dadosTurno.letra || 'N/A'}\n`;
  texto += `Supervisor: ${dadosTurno.supervisor || 'N/A'}\n`;
  texto += `ID Relatório Local: ${id || 'N/A'}\n`;
  texto += `Salvo em: ${formatarDataHora(timestamp)}\n`; // Usa a data de salvamento
  texto += subLinha + '\n';

  // Separar equipes por tipo
  const equipesPorTipo = equipes.reduce((acc, equipe) => {
    const tipo = equipe.tipo || 'Outro';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(equipe);
    return acc;
  }, {});

  // Processar cada tipo de equipe
  for (const tipo in equipesPorTipo) {
    const equipesDoTipo = equipesPorTipo[tipo];
    texto += linhaSeparadora;
    texto += `          EQUIPES DE ${tipo.toUpperCase()} (${equipesDoTipo.length})\n`;
    texto += linhaSeparadora + '\n';

    equipesDoTipo.forEach((equipe, index) => {
      const vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
      const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
      const motivoTrocaDisplay = (equipe.motivoTroca === 'Outros Motivos (Justificar)' || equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') ? equipe.motivoOutro : equipe.motivoTroca;
      const isAltaPressao = tipo === 'Alta Pressão';

      texto += `EQUIPE ${index + 1} | ${equipe.numero || 'N/A'}\n`;
      texto += subLinha;
      texto += `Motorista: ${equipe.motorista || 'N/A'}\n`;
      texto += `Operador(es): ${equipe.operadores || 'N/A'}\n`;
      texto += `Área: ${equipe.area || 'N/A'}\n`;
      texto += `Atividade: ${equipe.atividade || 'N/A'}\n`;

      // <<< --- CÓDIGO ADICIONADO --- >>>
      texto += `> Tipo de Atividade: ${equipe.tipoAtividade || 'Rotineira'}\n`;
      texto += `> Status: ${equipe.statusAtividade || 'Concluído'}\n`;
      if (equipe.statusAtividade && equipe.statusAtividade !== 'Concluído' && equipe.pendencia) {
        texto += `  - Pendência: ${equipe.pendencia}\n`;
      }
      // <<< --- FIM DO CÓDIGO ADICIONADO --- >>>

      texto += `Vaga: ${vagaDisplay || 'N/A'}\n`;
      texto += `Equipamento: ${equipDisplay || 'N/A'}\n`;
      if (equipe.identificacaoUsiminas) texto += `Identificação Usiminas: ${equipe.identificacaoUsiminas}\n`;

      // Detalhes da Troca
      texto += '\n> Status Equipamento:\n';
      texto += `  Houve troca: ${equipe.trocaEquipamento || 'Não'}\n`;
      if (equipe.trocaEquipamento === 'Sim') {
        texto += `  - Motivo: ${motivoTrocaDisplay || 'Não especificado'}\n`;
        texto += `  - Defeito/Medidas: ${equipe.defeito || 'N/A'}\n`;
        if (equipe.placaNova) texto += `  - Placa Nova: ${equipe.placaNova}\n`;
        if (equipe.dataHoraTroca) texto += `  - Data/Hora Troca: ${formatarDataHora(equipe.dataHoraTroca)}\n`; // Formata aqui também
      }

      // Implementos
      texto += '\n> Implementos:\n';
      if (isAltaPressao) {
         texto += `  - Pistola: ${equipe.materiais?.pistola ?? 'N/A'}\n`;
         texto += `  - Pistola C.L.: ${equipe.materiais?.pistolaCanoLongo ?? 'N/A'}\n`;
         texto += `  - Mang. Torpedo: ${equipe.materiais?.mangueiraTorpedo ?? 'N/A'}\n`;
         texto += `  - Pedal: ${equipe.materiais?.pedal ?? 'N/A'}\n`;
         texto += `  - Varetas: ${equipe.materiais?.varetas ?? 'N/A'}\n`;
         texto += `  - Rabicho: ${equipe.materiais?.rabicho ?? 'N/A'}\n`;
         texto += `  - Lances Mang.: ${equipe.lancesMangueira ?? 'N/A'}\n`;
         texto += `  - Lances Var.: ${equipe.lancesVaretas ?? 'N/A'}\n`;
      } else { // Vácuo / Hiper Vácuo
         texto += `  - Mangotes: ${equipe.materiaisVacuo?.mangotes ?? 'N/A'}\n`;
         texto += `  - Reduções: ${equipe.materiaisVacuo?.reducoes ?? 'N/A'}\n`;
         texto += `  - Mangotes 3": ${equipe.mangotes3Polegadas ?? 'N/A'}\n`;
         texto += `  - Mangotes 4": ${equipe.mangotes4Polegadas ?? 'N/A'}\n`;
         texto += `  - Mangotes 6": ${equipe.mangotes6Polegadas ?? 'N/A'}\n`;
      }

      if (equipe.justificativa) {
        texto += `\n> Justificativa Implementos Falta:\n  ${equipe.justificativa}\n`;
      }

      // Segurança
      texto += '\n> Segurança:\n';
      texto += `  - Caixa Bloqueio: ${equipe.caixaBloqueio ?? 'N/A'}\n`;
      texto += `  - Cadeados: ${equipe.cadeados ?? 'N/A'}\n`;
      texto += `  - Plaquetas: ${equipe.plaquetas ?? 'N/A'}\n`;

      if (equipe.observacoes) {
        texto += `\n> Observações Adicionais:\n  ${equipe.observacoes}\n`;
      }

      texto += subLinha + '\n';
    });
  }

  // Rodapé
  texto += linhaSeparadora;
  texto += `Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.1'} (Relatório Local)\n`;
  texto += linhaSeparadora;

  return texto;
}

/**
 * Gerar PDF de relatório existente (Servidor ou Local)
 */
async function gerarPDFExistente(id, origem = 'servidor') {
   if (!id) {
      mostrarNotificacao("ID inválido para gerar PDF.", "danger");
      return;
  }
   if (origem === 'local') {
       mostrarNotificacao("Geração de PDF não disponível para relatórios locais.", "warning");
       return; // Não gerar PDF de local
   }

  mostrarLoading('Gerando PDF...');

  try {
    let dadosParaPDF = { dadosTurno: null, equipes: null };

    // Buscar dados completos do relatório da API - Action 'obterDadosRelatorio' (confirmar no Apps Script)
     const result = await callAPI('obterDadosRelatorio', { turnoId: id });
     if (result && result.success && result.dadosTurno && result.equipes) {
         // Mapear chaves do Apps Script (ex: 'Tipo_Equipe') para as esperadas pelo gerarPDF (ex: 'tipo')
         dadosParaPDF.dadosTurno = mapearChavesObjeto(result.dadosTurno, { 'ID': 'id', 'Data': 'data', 'Horário': 'horario', 'Letra': 'letra', 'Supervisor': 'supervisor', 'Timestamp': 'timestamp', 'Status': 'status', 'UltimaModificacao': 'ultimaModificacao' });
         dadosParaPDF.equipes = result.equipes.map(eq => mapearChavesObjeto(eq, {
              'Turno_ID': 'turnoId', 'Tipo_Equipe': 'tipo', 'Numero_Equipe': 'numero', 'Integrantes': 'integrantes', 'Motorista': 'motorista', 'Operadores': 'operadores', 'Area': 'area', 'Atividade': 'atividade',
              // Novos campos mapeados
              'TipoAtividade': 'tipoAtividade', 'StatusAtividade': 'statusAtividade', 'Pendencia': 'pendencia',
              // Resto dos campos
              'Vaga': 'vaga', 'Vaga_Personalizada': 'vagaPersonalizada', 'Equipamento': 'equipamento', 'Equipamento_Personalizada': 'equipamentoPersonalizado', 'Identificacao_Usiminas': 'identificacaoUsiminas', 'Troca_Equipamento': 'trocaEquipamento', 'Motivo_Troca': 'motivoTroca', 'Motivo_Outro': 'motivoOutro', 'Defeito': 'defeito', 'Placa_Nova': 'placaNova', 'Data_Hora_Troca': 'dataHoraTroca',
              // Campos de tempo adicionados (se existirem no GAS)
              'Data_Hora_Fim_Troca': 'dataHoraFimTroca', 'Tempo_Troca': 'tempoTroca',
              // Materiais AP
              'Pistola': 'pistola', 'Pistola_Cano_Longo': 'pistolaCanoLongo', 'Mangueira_Torpedo': 'mangueiraTorpedo', 'Pedal': 'pedal', 'Varetas': 'varetas', 'Rabicho': 'rabicho', 'Lances_Mangueira': 'lancesMangueira', 'Lances_Varetas': 'lancesVaretas',
              // Materiais Vacuo
              'Mangotes': 'mangotes', 'Reducoes': 'reducoes', 'Mangotes_3_Polegadas': 'mangotes3Polegadas', 'Mangotes_4_Polegadas': 'mangotes4Polegadas', 'Mangotes_6_Polegadas': 'mangotes6Polegadas',
              // Segurança e Obs
              'Justificativa': 'justificativa', 'Caixa_Bloqueio': 'caixaBloqueio', 'Cadeados': 'cadeados', 'Plaquetas': 'plaquetas', 'Observacoes': 'observacoes'
         }));

          // Agrupar materiais corretamente após mapeamento
          dadosParaPDF.equipes.forEach(eq => {
              if(eq.tipo === 'Alta Pressão') {
                  eq.materiais = { pistola: eq.pistola, pistolaCanoLongo: eq.pistolaCanoLongo, mangueiraTorpedo: eq.mangueiraTorpedo, pedal: eq.pedal, varetas: eq.varetas, rabicho: eq.rabicho };
              } else {
                   eq.materiaisVacuo = { mangotes: eq.mangotes, reducoes: eq.reducoes };
              }
          });


          await gerarPDF(dadosParaPDF.dadosTurno, dadosParaPDF.equipes, id);
     } else {
          throw new Error(result?.message || 'Erro ao buscar dados completos do relatório do servidor.');
     }

  } catch (error) {
    console.error('Erro ao gerar PDF de relatório existente:', error);
    mostrarNotificacao('Erro ao gerar PDF: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Função auxiliar para mapear chaves de um objeto (útil para converter nomes de colunas do GAS para nomes de propriedades JS)
 */
function mapearChavesObjeto(obj, mapa) {
    if (!obj) return {}; // Retorna objeto vazio se o original for nulo/undefined
    const novoObj = {};
    for (const chaveOriginal in obj) {
        if (Object.hasOwnProperty.call(obj, chaveOriginal)) {
            // Tenta encontrar a chave JS correspondente no mapa
            const chaveJsMapeada = mapa[chaveOriginal];
            // Se encontrou, usa a chave JS. Senão, mantém a chave original (para compatibilidade)
            const chaveFinal = chaveJsMapeada !== undefined ? chaveJsMapeada : chaveOriginal;
            novoObj[chaveFinal] = obj[chaveOriginal];
        }
    }
    // Garante que todas as chaves JS esperadas pelo mapa existam, mesmo que vazias (vindas do GAS)
    Object.values(mapa).forEach(chaveJsEsperada => {
        if (novoObj[chaveJsEsperada] === undefined) {
            novoObj[chaveJsEsperada] = null; // Ou '', dependendo do que for melhor
        }
    });
    return novoObj;
}

/**
 * Gerar PDF (Função auxiliar, precisa da biblioteca jsPDF) - ATUALIZADO para incluir novos campos
 */
async function gerarPDF(dadosTurnoPDF, equipesPDF, relatorioId) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
         mostrarNotificacao('Erro: Biblioteca jsPDF não carregada.', 'danger');
         return;
    }
    if (!dadosTurnoPDF || !equipesPDF) {
         mostrarNotificacao('Erro: Dados insuficientes para gerar PDF.', 'danger');
         return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p', // portrait
        unit: 'mm',       // millimeters
        format: 'a4'      // A4 size
    });
    let y = 15; // Posição vertical inicial em mm
    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 5; // Espaçamento entre linhas em mm
    const smallLineHeight = 4;

    // Função para adicionar texto com quebra de linha
    const addWrappedText = (label, value, indent = 5, isBold = false) => {
      if (value === null || value === undefined || value === '') value = 'N/A';
      const fullText = `${label}: ${value}`;
      const textWidth = contentWidth - indent - 5; // Largura disponível

      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(fullText, textWidth);

      checkAddPage(lines.length * lineHeight); // Verifica espaço antes de adicionar
      doc.text(lines, margin + indent, y);
      y += lines.length * lineHeight;
       doc.setFont(undefined, 'normal'); // Resetar para normal
    };

    function checkAddPage(alturaNecessaria = 20) {
        if (y + alturaNecessaria > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    }

    // --- Cabeçalho ---
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("RELATÓRIO DE TURNO", pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 1.5;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("GRUPO GPS - MECANIZADA", pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    // --- Informações Gerais ---
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("INFORMAÇÕES GERAIS", margin, y);
    y += lineHeight * 0.8;
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y); // Linha abaixo do título
    y += lineHeight * 1.2;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${formatarData(dadosTurnoPDF.data)}`, margin, y);
    doc.text(`Horário: ${dadosTurnoPDF.horario || 'N/A'}`, margin + 70, y);
    y += lineHeight;
    doc.text(`Letra: ${dadosTurnoPDF.letra || 'N/A'}`, margin, y);
    doc.text(`Supervisor: ${dadosTurnoPDF.supervisor || 'N/A'}`, margin + 70, y);
    y += lineHeight;
    doc.text(`ID Relatório: ${relatorioId || 'N/A'}`, margin, y);
    y += lineHeight * 1.5;

    // --- Equipes ---
    const equipesPorTipo = equipesPDF.reduce((acc, equipe) => {
        const tipo = equipe.tipo || 'Outro'; if (!acc[tipo]) acc[tipo] = []; acc[tipo].push(equipe); return acc;
    }, {});

     for (const tipo in equipesPorTipo) {
        checkAddPage(30); // Espaço para título da seção
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`EQUIPES ${tipo.toUpperCase()} (${equipesPorTipo[tipo].length})`, margin, y);
        y += lineHeight * 0.8;
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight * 1.2;

        equipesPorTipo[tipo].forEach((equipe, index) => {
            checkAddPage(80); // Estimar altura mínima para uma equipe (aumentado)
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Equipe ${index + 1}: ${equipe.numero || 'N/A'}`, margin, y);
            y += lineHeight * 1.2;

            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            const vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
            const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
            const motivoTrocaDisplay = (equipe.motivoTroca === 'Outros Motivos (Justificar)' || equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') ? equipe.motivoOutro : equipe.motivoTroca;
            const isAltaPressao = equipe.tipo === 'Alta Pressão';

            addWrappedText('Motorista', equipe.motorista);
            addWrappedText('Operador(es)', equipe.operadores);
            addWrappedText('Área', equipe.area);
            addWrappedText('Atividade', equipe.atividade);

            // <<< --- NOVOS CAMPOS NO PDF --- >>>
            addWrappedText('Tipo Atividade', equipe.tipoAtividade || 'Rotineira', 5, true); // Destaca label
            addWrappedText('Status', equipe.statusAtividade || 'Concluído', 5, true);
            if (equipe.statusAtividade && equipe.statusAtividade !== 'Concluído' && equipe.pendencia) {
                addWrappedText('Pendência', equipe.pendencia, 10); // Recuo para pendência
            }
             // <<< --- FIM NOVOS CAMPOS NO PDF --- >>>

            addWrappedText('Vaga', vagaDisplay);
            addWrappedText('Equipamento', equipDisplay);
            if (equipe.identificacaoUsiminas) {
                addWrappedText('ID Usiminas', equipe.identificacaoUsiminas);
            }

            // Troca
            checkAddPage(10);
            doc.setFont(undefined, 'bold'); doc.text(`Troca Equipamento:`, margin + 5, y);
            doc.setFont(undefined, 'normal'); doc.text(`${equipe.trocaEquipamento || 'Não'}`, margin + 45, y); y += lineHeight;
            if (equipe.trocaEquipamento === 'Sim') {
                addWrappedText('- Motivo', motivoTrocaDisplay || 'N/A', 10);
                addWrappedText('- Defeito/Medidas', equipe.defeito || 'N/A', 10);
                if (equipe.placaNova) { addWrappedText('- Placa Nova', equipe.placaNova, 10); }
                if (equipe.dataHoraTroca) { addWrappedText('- Início Troca', formatarDataHora(equipe.dataHoraTroca), 10); } // Formatar
                 if (equipe.dataHoraFimTroca) { addWrappedText('- Fim Troca', formatarDataHora(equipe.dataHoraFimTroca), 10); } // Formatar
                 if (equipe.tempoTroca) { addWrappedText('- Tempo Indisp.', equipe.tempoTroca, 10); } // Mostrar tempo calculado
            }

            // Implementos
            checkAddPage(30);
            doc.setFont(undefined, 'bold'); doc.text(`Implementos:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal');
            if (isAltaPressao) {
                addWrappedText('- Pistola', equipe.materiais?.pistola ?? 'N/A', 10); addWrappedText('- Pistola C.L.', equipe.materiais?.pistolaCanoLongo ?? 'N/A', 10); addWrappedText('- Mang. Torpedo', equipe.materiais?.mangueiraTorpedo ?? 'N/A', 10); addWrappedText('- Pedal', equipe.materiais?.pedal ?? 'N/A', 10); addWrappedText('- Varetas', equipe.materiais?.varetas ?? 'N/A', 10); addWrappedText('- Rabicho', equipe.materiais?.rabicho ?? 'N/A', 10); addWrappedText('- Lances Mang.', equipe.lancesMangueira ?? 'N/A', 10); addWrappedText('- Lances Var.', equipe.lancesVaretas ?? 'N/A', 10);
            } else {
                addWrappedText('- Mangotes', equipe.materiaisVacuo?.mangotes ?? 'N/A', 10); addWrappedText('- Reduções', equipe.materiaisVacuo?.reducoes ?? 'N/A', 10); addWrappedText('- Mangotes 3"', equipe.mangotes3Polegadas ?? 'N/A', 10); addWrappedText('- Mangotes 4"', equipe.mangotes4Polegadas ?? 'N/A', 10); addWrappedText('- Mangotes 6"', equipe.mangotes6Polegadas ?? 'N/A', 10);
            }
            if (equipe.justificativa) { addWrappedText('Justificativa Falta', equipe.justificativa, 10); }

            // Segurança
            checkAddPage(15);
            doc.setFont(undefined, 'bold'); doc.text(`Segurança:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal');
            addWrappedText('- Caixa Bloqueio', equipe.caixaBloqueio ?? 'N/A', 10); addWrappedText('- Cadeados', equipe.cadeados ?? 'N/A', 10); addWrappedText('- Plaquetas', equipe.plaquetas ?? 'N/A', 10);

            // Observações
            if (equipe.observacoes) {
                checkAddPage(15);
                doc.setFont(undefined, 'bold'); doc.text(`Observações:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal');
                addWrappedText('', equipe.observacoes, 10); // Sem label adicional
            }
            y += lineHeight * 0.5; // Espaço extra entre equipes
            doc.setLineWidth(0.1); // Linha fina entre equipes
            doc.line(margin, y, pageWidth - margin, y);
            y += lineHeight * 1.5;
        });
    }


    // --- Rodapé (na última página) ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        let footerY = pageHeight - margin;
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - smallLineHeight * 1.5, pageWidth - margin, footerY - smallLineHeight * 1.5); // Linha acima do rodapé
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text(`Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.1'}`, margin, footerY);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
    }


    // --- Salvar PDF ---
    const supervisor = dadosTurnoPDF.supervisor || 'Supervisor';
    const letra = dadosTurnoPDF.letra || 'X';
    const dataFormatada = formatarData(dadosTurnoPDF.data).replace(/\//g, '-');
    doc.save(`${supervisor}_${letra}_${dataFormatada}.pdf`);
    mostrarNotificacao('PDF gerado com sucesso!', 'success');
}

/**
 * Formatar WhatsApp de relatório existente (Local ou Servidor)
 * @param {string} id ID do relatório
 * @param {string} origem 'local' ou 'servidor'
 * @param {string} apiAction Nome da action na API para buscar os dados (ex: 'formatarWhatsApp')
 */
async function formatarWhatsAppExistente(id, origem = 'servidor', apiAction = 'formatarWhatsApp') {
   if (!id) {
      mostrarNotificacao("ID inválido para formatar.", "danger");
      return;
  }

  // Salvar origem para navegação de retorno
  setOrigemNavegacao(window.AppState?.get('currentStep') || 'stepSucesso');

  mostrarLoading('Formatando para WhatsApp...');

  try {
    let textoWhatsApp = '';
    let relatorioCompleto = null;

    if (origem === 'local') {
      relatorioCompleto = obterRelatorioLocal(id);
      if (!relatorioCompleto) {
        throw new Error('Relatório local não encontrado para formatar.');
      }
      textoWhatsApp = gerarTextoWhatsAppLocal(relatorioCompleto); // Gerar texto a partir dos dados
    } else {
      // Buscar da API
      const result = await callAPI(apiAction, { turnoId: id }); // Usa action passada
      if (result && result.success && result.relatorio) {
        textoWhatsApp = result.relatorio;
      } else {
        throw new Error(result?.message || `Erro ao formatar relatório (${apiAction}) do servidor.`);
      }
    }

    // Atualizar estado com o ID visualizado
    if(window.AppState) AppState.update('ultimoRelatorioId', id);
    else ultimoRelatorioId = id;

    // Mostrar na tela
    navegarParaEtapa('stepWhatsApp');
    const whatsAppTextoElement = document.getElementById('whatsAppTexto');
    if (whatsAppTextoElement) {
      whatsAppTextoElement.textContent = textoWhatsApp;
    }

    // Configurar botão voltar para ir para a pesquisa (ou outra tela)
    const btnVoltarWhatsApp = document.getElementById('btnVoltarWhatsApp');
    if (btnVoltarWhatsApp) {
       btnVoltarWhatsApp.onclick = voltarDoWhatsApp;
    }
  } catch (error) {
    console.error('Erro ao formatar WhatsApp para relatório existente:', error);
    mostrarNotificacao('Erro ao formatar: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Gerar texto WhatsApp para relatório local (Formato formal e elegante)
 */
function gerarTextoWhatsAppLocal(relatorio) {
  if (!relatorio || !relatorio.dadosTurno || !relatorio.equipes) {
    return 'Erro: Dados do relatório local inválidos ou ausentes.';
  }

  // Mapear dados locais para o formato esperado pela função de formatação
  // (Neste caso, a função formatarRelatorioParaCompartilhamentoFormal já lida com ambos formatos)
  return formatarRelatorioParaCompartilhamentoFormal(relatorio.dadosTurno, relatorio.equipes);
}

/**
 * Formatar o relatório para compartilhamento (WhatsApp) - Versão Formal sem Emojis
 * ATUALIZADO para incluir novos campos
 */
function formatarRelatorioParaCompartilhamentoFormal(dadosTurno, equipes) {
  var texto = "";
  const nl = "\n"; // Nova linha
  const separadorPrincipal = "====================================" + nl;
  const separadorSecao = "------------------------------------" + nl;

  if (!dadosTurno || !Array.isArray(equipes)) {
      return "Erro: Dados inválidos para formatação.";
  }

  // Cabeçalho do Relatório
  texto += "*RELATÓRIO DE TURNO - GPS MECANIZADA*" + nl;
  texto += separadorPrincipal + nl;
  texto += `*Data:* ${formatarData(dadosTurno.Data || dadosTurno.data)}` + nl;
  texto += `*Horário:* ${dadosTurno.Horário || dadosTurno.horario || 'N/A'}` + nl;
  texto += `*Letra:* ${dadosTurno.Letra || dadosTurno.letra || 'N/A'}` + nl;
  texto += `*Supervisor:* ${dadosTurno.Supervisor || dadosTurno.supervisor || 'N/A'}` + nl + nl;

  // Agrupar equipes por tipo
  var equipesPorTipo = equipes.reduce((acc, eq) => {
      var tipo = eq.Tipo_Equipe || eq.tipo || 'Tipo Desconhecido';
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(eq);
      return acc;
  }, {});

  // Formatar cada tipo de equipe
  for (const tipo in equipesPorTipo) {
      const equipesDoTipo = equipesPorTipo[tipo];
      texto += `*EQUIPES ${tipo.toUpperCase()} (${equipesDoTipo.length})*` + nl;
      texto += separadorSecao + nl;

      equipesDoTipo.forEach(function(equipe, index) {
          // Compatibilidade com diferentes formatos de campo (GAS vs Local)
          const getField = (fieldGas, fieldLocal, defaultVal = 'N/A') => {
              const valGas = equipe[fieldGas];
              if (valGas !== undefined && valGas !== null && valGas !== '') return valGas;
              const valLocal = equipe[fieldLocal];
              if (valLocal !== undefined && valLocal !== null && valLocal !== '') return valLocal;
              return defaultVal;
          }

          texto += `*Equipe ${index + 1}:* ${getField('Numero_Equipe', 'numero')}` + nl;
          texto += `  Motorista: ${getField('Motorista', 'motorista')}` + nl;
          texto += `  Operador(es): ${getField('Operadores', 'operadores')}` + nl;
          texto += `  Área: ${getField('Area', 'area')}` + nl;
          texto += `  Atividade: ${getField('Atividade', 'atividade')}` + nl;

          // <<< --- NOVOS CAMPOS --- >>>
          texto += `  Tipo Ativ.: ${getField('TipoAtividade', 'tipoAtividade', 'Rotineira')}` + nl;
          const statusAtividade = getField('StatusAtividade', 'statusAtividade', 'Concluído');
          const pendencia = getField('Pendencia', 'pendencia', '');
          texto += `  Status: ${statusAtividade}${pendencia && statusAtividade !== 'Concluído' ? ` (${pendencia})` : ''}` + nl;
          // <<< --- FIM NOVOS CAMPOS --- >>>

          const vaga = getField('Vaga','vaga');
          const vagaPersonalizada = getField('Vaga_Personalizada','vagaPersonalizada', '');
          let vagaDisplay = vaga + (vagaPersonalizada ? ` (${vagaPersonalizada})` : "");
          texto += `  Vaga: ${vagaDisplay || 'N/A'}` + nl;

          const equipamento = getField('Equipamento','equipamento');
          const equipPersonalizado = getField('Equipamento_Personalizada','equipamentoPersonalizado', '');
          let equipDisplay = equipamento + (equipPersonalizado ? ` (${equipPersonalizado})` : "");
          texto += `  Equipamento: ${equipDisplay || 'N/A'}` + nl;

          const identificacaoUsiminas = getField('Identificacao_Usiminas', 'identificacaoUsiminas', '');
          if (identificacaoUsiminas) {
            texto += `  ID Usiminas: ${identificacaoUsiminas}` + nl;
          }

          // Materiais específicos (simplificado)
          if (tipo === 'Alta Pressão' || tipo.toUpperCase().includes('ALTA')) {
              const lancesMangueira = getField('Lances_Mangueira', 'lancesMangueira');
              const lancesVaretas = getField('Lances_Varetas', 'lancesVaretas');
              if(lancesMangueira && lancesMangueira !== 'N/A')
                texto += `  Lances Mang.: ${lancesMangueira}` + nl;
              if(lancesVaretas && lancesVaretas !== 'N/A')
                texto += `  Lances Varetas: ${lancesVaretas}` + nl;
          } else if (tipo.includes('Vácuo') || tipo.includes('Hiper')) { // Vácuo / Hiper Vácuo
              const mangotes3 = getField('Mangotes_3_Polegadas', 'mangotes3Polegadas');
              const mangotes4 = getField('Mangotes_4_Polegadas', 'mangotes4Polegadas');
              const mangotes6 = getField('Mangotes_6_Polegadas', 'mangotes6Polegadas');
              if(mangotes3 && mangotes3 !== 'N/A')
                texto += `  Mangotes 3": ${mangotes3}` + nl;
              if(mangotes4 && mangotes4 !== 'N/A')
                texto += `  Mangotes 4": ${mangotes4}` + nl;
              if(mangotes6 && mangotes6 !== 'N/A')
                texto += `  Mangotes 6": ${mangotes6}` + nl;
          }

          // Troca (se houver)
          const trocaEquipamento = getField('Troca_Equipamento', 'trocaEquipamento', 'Não');
          if (trocaEquipamento === 'Sim') {
              texto += nl + "  *Troca de Equipamento: Sim*" + nl;
              const motivoTroca = getField('Motivo_Troca', 'motivoTroca', '');
              const motivoOutro = getField('Motivo_Outro', 'motivoOutro', '');
              let motivoTrocaDisplay = (motivoTroca === 'Outros Motivos (Justificar)' || motivoTroca === 'Defeitos Em Geral (Justificar)') ? motivoOutro : motivoTroca;
              texto += `    Motivo: ${motivoTrocaDisplay || 'Não especificado'}` + nl;

              const defeito = getField('Defeito', 'defeito', '');
              if (defeito) texto += `    Defeito/Medidas: ${defeito}` + nl;

              const placaNova = getField('Placa_Nova', 'placaNova', '');
              if (placaNova) texto += `    Placa Nova: ${placaNova}` + nl;

              const dataHoraTroca = getField('Data_Hora_Troca', 'dataHoraTroca', '');
              if (dataHoraTroca) texto += `    Data/Hora: ${formatarDataHora(dataHoraTroca)}` + nl;

              const tempoTroca = getField('Tempo_Troca', 'tempoTroca', ''); // Pegar tempo calculado se existir
              if (tempoTroca && !tempoTroca.includes('Erro') && !tempoTroca.includes('Ausente')) {
                  texto += `    Tempo Indisp.: ${tempoTroca}` + nl;
              }
          }

          // Observações (se houver)
          const observacoes = getField('Observacoes', 'observacoes', '');
          if (observacoes) {
              texto += nl + `  *Observações:* ${observacoes}` + nl;
          }

          texto += nl; // Espaço entre equipes
      });
  }

  // Rodapé
  texto += separadorPrincipal;
  texto += `Relatório gerado automaticamente pelo Sistema v${window.CONFIG?.VERSAO_APP || '3.1'}`;

  return texto;
}

/**
 * Voltar da pesquisa para a tela inicial (ou para a própria pesquisa?)
 * Ajustado para voltar para a tela de pesquisa
 */
function voltarDaVisualizacaoParaPesquisa() {
    navegarParaEtapa('stepPesquisa');
    // Não limpar pesquisa, usuário pode querer refinar
}

/**
 * Voltar da pesquisa para a tela inicial (Função separada)
 */
function voltarDaPesquisa() { // Usado pelo botão 'Voltar ao Início' na pesquisa
  navegarParaEtapa('stepTurno');
  atualizarIndicadoresEtapa(1);
}


// ========== FUNÇÕES DE DASHBOARD ==========

/**
 * Mostrar dashboard (usa o módulo)
 */
function mostrarDashboard() {
  // Verificar se o módulo de dashboard está disponível e inicializado
  if (window.ModuleLoader && ModuleLoader.isInitialized('dashboard')) {
    const Dashboard = ModuleLoader.get('dashboard');
    if (Dashboard && typeof Dashboard.mostrarDashboard === 'function') {
        Dashboard.mostrarDashboard(); // Chama a função do módulo
    } else {
         mostrarNotificacao('Erro ao carregar função do Dashboard.', 'danger');
         voltarDoDashboard(); // Volta para o início se falhar
    }
  } else {
    // Tentar inicializar se não estiver inicializado (útil se o login acontecer depois do load inicial)
    const dashboardInstance = ModuleLoader.initialize('dashboard');
     if (dashboardInstance && typeof dashboardInstance.mostrarDashboard === 'function') {
         dashboardInstance.mostrarDashboard();
     } else {
        // Fallback se o módulo não estiver disponível ou falhar na inicialização
        mostrarNotificacao('Módulo de dashboard não está disponível ou falhou ao carregar.', 'warning');
        voltarDoDashboard(); // Volta para o início
     }
  }
}

/**
 * Voltar do dashboard para a tela inicial
 */
function voltarDoDashboard() {
  navegarParaEtapa('stepTurno');
  atualizarIndicadoresEtapa(1);
}

/**
 * Mostrar modal de ajuda
 */
function mostrarHelp() {
  if (modalHelp) {
    modalHelp.show();
  } else {
       mostrarNotificacao("Modal de ajuda não encontrado.", "warning");
  }
}


// ========== FUNÇÕES UTILITÁRIAS ==========

/**
 * Formatar data (DD/MM/YYYY) - Robusto
 */
function formatarData(dataInput) {
  if (!dataInput) return 'N/A';

  try {
    let dataObj;
    // Se já for objeto Date
    if (dataInput instanceof Date) {
      dataObj = dataInput;
    } else {
      // Tentar converter string YYYY-MM-DD ou outras variações
      const dataStr = String(dataInput);
      if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
           // Usar UTC para evitar problemas de fuso apenas na conversão da string
          const parts = dataStr.substring(0, 10).split('-');
          dataObj = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      } else if (dataStr.includes('/')) { // Tentar DD/MM/YYYY
          const parts = dataStr.split('/');
          if(parts.length === 3) {
                // Assume DD/MM/YYYY
               dataObj = new Date(Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)));
          } else {
              dataObj = new Date(dataStr); // Tentar parse genérico
          }
      } else {
          // Tentar parse genérico para timestamps ou outros formatos
          dataObj = new Date(dataStr);
      }
    }

    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) {
      // console.warn("Formato de data inválido para formatação:", dataInput);
      return String(dataInput); // Retornar original se inválido
    }

    // Formatar como DD/MM/YYYY (usando UTC para pegar dia/mês/ano corretos após conversão)
    const dia = String(dataObj.getUTCDate()).padStart(2, '0');
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); // Meses são 0-11
    const ano = dataObj.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
  } catch (e) {
    console.error("Erro ao formatar data:", dataInput, e);
    return String(dataInput); // Retorna original em caso de erro
  }
}


/**
 * Formatar data e hora (DD/MM/YYYY HH:mm) - Robusto
 */
function formatarDataHora(dataHoraInput) {
  if (!dataHoraInput) return 'N/A';

  try {
    let dataObj;

    if (dataHoraInput instanceof Date) {
      dataObj = dataHoraInput;
    } else {
      // Tenta parsear string (ISO 8601 YYYY-MM-DDTHH:mm, timestamp, etc)
      dataObj = new Date(dataHoraInput);
    }

    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) {
      // console.warn("Formato de data/hora inválido:", dataHoraInput);
      return String(dataHoraInput);
    }

    // Formatar como DD/MM/YYYY HH:mm (Usando hora local do navegador)
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    const hora = String(dataObj.getHours()).padStart(2, '0');
    const minutos = String(dataObj.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
  } catch (e) {
    console.error("Erro ao formatar data/hora:", dataHoraInput, e);
    return String(dataHoraInput);
  }
}


// --- Exportar funções que são chamadas pelo HTML (onclick) ou outros scripts ---
window.inicializarFormulario = inicializarFormulario;
window.avancarParaEquipes = avancarParaEquipes;
window.voltarParaTurno = voltarParaTurno;
window.avancarParaRevisao = avancarParaRevisao;
window.voltarParaEquipes = voltarParaEquipes;
window.salvarRelatorioComFallback = salvarRelatorioComFallback;
window.novoRelatorio = novoRelatorio;
window.visualizarRelatorio = visualizarRelatorio;
window.formatarWhatsApp = formatarWhatsApp;
window.voltarParaSucesso = voltarParaSucesso;
window.voltarDoWhatsApp = voltarDoWhatsApp;
window.voltarDoRelatorio = voltarDoRelatorio;
window.copiarRelatorio = copiarRelatorio;
window.copiarWhatsApp = copiarWhatsApp;
window.adicionarEquipe = adicionarEquipe;
window.editarEquipe = editarEquipe;
window.removerEquipe = removerEquipe;
window.salvarEquipe = salvarEquipe;
window.toggleVagaPersonalizada = toggleVagaPersonalizada;
window.toggleEquipamentoPersonalizado = toggleEquipamentoPersonalizado;
window.toggleTrocaEquipamento = toggleTrocaEquipamento;
window.toggleMotivoOutro = toggleMotivoOutro;
window.togglePendencia = togglePendencia; // Exportar nova função
window.abrirPesquisa = abrirPesquisa;
window.ajustarCampoPesquisa = ajustarCampoPesquisa;
window.executarPesquisa = executarPesquisa;
window.visualizarRelatorioExistente = visualizarRelatorioExistente;
window.gerarPDFExistente = gerarPDFExistente;
window.formatarWhatsAppExistente = formatarWhatsAppExistente;
window.voltarDaVisualizacaoParaPesquisa = voltarDaVisualizacaoParaPesquisa;
window.voltarDaPesquisa = voltarDaPesquisa;
window.mostrarDashboard = mostrarDashboard;
window.voltarDoDashboard = voltarDoDashboard;
window.mostrarHelp = mostrarHelp;
// Funções auxiliares como formatarData, mostrarLoading, etc., não precisam ser exportadas se só usadas internamente.

// Flag para evitar múltiplos salvamentos
let salvandoEquipe = false;
let salvandoRelatorio = false;

// --- Inicializar listeners específicos do formulário após o carregamento inicial ---
// Isso garante que os listeners sejam adicionados mesmo se inicializarFormulario for chamado mais tarde.
document.addEventListener('DOMContentLoaded', () => {
    const statusSelect = document.getElementById('equipeStatusAtividade');
    if (statusSelect) {
        statusSelect.removeEventListener('change', togglePendencia); // Evitar duplicação
        statusSelect.addEventListener('change', togglePendencia);
    }
    // Chamar setupEventListeners aqui também pode ser uma boa prática para garantir
    // que listeners de campos dinâmicos (como os de troca) estejam presentes.
     setupEventListeners();
});
