/**
 * Sistema de Relatório de Turno v3.1
 * Arquivo principal de lógica da aplicação (app.js)
 * ATUALIZADO para incluir Data/Hora FIM da Troca
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
    // IMPORTANTE: O listener do submit chama salvarEquipe, que agora também chama a validação condicional.
    // Removemos a chamada direta a salvarEquipe daqui para evitar dupla execução.
    // O onsubmit no HTML foi removido para usar este listener.
    formEquipe.addEventListener('submit', function handleFormEquipeSubmit(event) {
      event.preventDefault();
      event.stopPropagation();
      // A validação condicional agora é chamada DENTRO de salvarEquipe
      salvarEquipe(); // Chama a função que agora inclui a validação
      // A classe 'was-validated' é adicionada dentro de salvarEquipe se a validação falhar
    });
  }
}

/**
 * Valida campos que são obrigatórios condicionalmente no modal de equipe
 * Retorna true se válido, false caso contrário e mostra notificações/feedback visual.
 * ATUALIZADO: Inclui validação para Data/Hora FIM da Troca.
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
    // <<< NOVO: Inputs de Data/Hora Início e Fim >>>
    const dataHoraInicioInput = document.getElementById('equipeDataHoraTroca');
    const dataHoraFimInput = document.getElementById('equipeDataHoraFimTroca');
    // <<< FIM NOVO >>>


    if (trocaEquipamento === 'Sim') {
        // Validação Motivo Troca
        if (!motivoTroca) {
            if (motivoTrocaFeedback) motivoTrocaFeedback.style.display = 'block';
            mostrarNotificacao('Por favor, selecione o motivo da troca.', 'warning');
             const primeiroRadioMotivo = document.getElementById('motivoManutencao');
             if(isValid && primeiroRadioMotivo) primeiroRadioMotivo.focus();
            isValid = false;
        } else {
             if (motivoTrocaFeedback) motivoTrocaFeedback.style.display = 'none';
        }

        // Validação Motivo Outro
        if ((motivoTroca === 'Outros Motivos (Justificar)' || motivoTroca === 'Defeitos Em Geral (Justificar)') && motivoOutroInput && !motivoOutroInput.value.trim()) {
            mostrarNotificacao('Por favor, especifique o "Motivo" da troca.', 'warning');
            motivoOutroInput.classList.add('is-invalid');
             if(isValid) motivoOutroInput.focus();
            isValid = false;
        } else if (motivoOutroInput) {
             motivoOutroInput.classList.remove('is-invalid');
        }

        // Validação Defeito
        if (defeitoInput && !defeitoInput.value.trim()) {
            mostrarNotificacao('Por favor, descreva o defeito e as medidas tomadas para a troca.', 'warning');
            defeitoInput.classList.add('is-invalid');
             if(isValid) defeitoInput.focus();
            isValid = false;
        } else if (defeitoInput) {
            defeitoInput.classList.remove('is-invalid');
        }

        // <<< INÍCIO: Validação Data/Hora Fim >>>
        // Tornar Data/Hora FIM obrigatório se a troca for Sim
        if (dataHoraFimInput && !dataHoraFimInput.value) {
            mostrarNotificacao('Por favor, informe a Data/Hora de FIM da troca.', 'warning');
            dataHoraFimInput.classList.add('is-invalid');
            if(isValid) dataHoraFimInput.focus();
            isValid = false;
        } else if (dataHoraFimInput) {
            dataHoraFimInput.classList.remove('is-invalid');
        }

        // Opcional: Validar se FIM é maior que INÍCIO
        if (dataHoraInicioInput && dataHoraFimInput && dataHoraInicioInput.value && dataHoraFimInput.value) {
             try {
                 const inicio = new Date(dataHoraInicioInput.value);
                 const fim = new Date(dataHoraFimInput.value);
                 if (fim <= inicio) {
                     mostrarNotificacao('A Data/Hora de FIM da troca deve ser posterior à Data/Hora de INÍCIO.', 'warning');
                     dataHoraFimInput.classList.add('is-invalid'); // Marca o campo FIM como inválido
                     if(isValid) dataHoraFimInput.focus();
                     isValid = false;
                 } else {
                     // Se a data for válida, remove a classe (caso tenha sido adicionada antes)
                      dataHoraFimInput.classList.remove('is-invalid');
                 }
             } catch (e) {
                 // Se houver erro ao converter as datas, ignora essa validação específica
                 console.warn("Erro ao comparar datas de troca:", e);
             }
        }
        // <<< FIM: Validação Data/Hora Fim >>>

    } // Fim if (trocaEquipamento === 'Sim')

    // Validação de Pendência (se Status não for Concluído)
    const statusSelect = document.getElementById('equipeStatusAtividade');
    const pendenciaInput = document.getElementById('equipePendencia');
    if (statusSelect && statusSelect.value !== 'Concluído' && pendenciaInput && !pendenciaInput.value.trim()) {
        mostrarNotificacao('Por favor, informe a justificativa/pendência para o status selecionado.', 'warning');
        pendenciaInput.classList.add('is-invalid');
        if(isValid) pendenciaInput.focus();
        isValid = false;
    } else if (pendenciaInput) {
         pendenciaInput.classList.remove('is-invalid');
    }

    return isValid;
}


/**
 * Configurar listeners de eventos específicos dos campos (ex: selects que mostram/ocultam outros campos)
 * Chamado dentro de inicializarFormulario ou separadamente
 */
function setupEventListeners() {
  // Listeners para selects que precisam de comportamento especial no modal de equipe
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

   // Listener para Status da Atividade (para mostrar/ocultar pendência)
   const statusSelect = document.getElementById('equipeStatusAtividade');
    if (statusSelect) {
        statusSelect.removeEventListener('change', togglePendencia); // Evitar duplicação
        statusSelect.addEventListener('change', togglePendencia);
    }
}

/**
 * Mostrar notificação (agora usa wrapper em main.js que chama o módulo Notifications)
 */
function mostrarNotificacao(mensagem, tipo = 'success') {
  // A lógica agora está no wrapper em main.js que chama o módulo Notifications
  console.log(`[Notificação - ${tipo.toUpperCase()}] ${mensagem}`); // Mantém log
  // O wrapper em main.js cuidará de chamar o módulo Notifications
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
}

/**
 * Ocultar indicador de carregamento (agora usa wrapper em main.js)
 */
function ocultarLoading() {
  const loading = document.querySelector('.loading');

  if (loading) {
    loading.style.display = 'none';
  }
}

// ========== NAVEGAÇÃO ENTRE ETAPAS ==========

/**
 * Avançar para a etapa de equipes
 */
function avancarParaEquipes() {
  const formTurno = document.getElementById('formTurno');

  // Usar a validação HTML5 do form antes de avançar
  if (!formTurno || !formTurno.checkValidity()) {
    if(formTurno) formTurno.classList.add('was-validated');
    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios do turno.', 'warning');
    formTurno?.requestSubmit?.();
    return;
  }

  // Salvar dados do turno
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

  if (window.AppState) {
    AppState.update('dadosTurno', dadosTurno);
  }

  navegarParaEtapa('stepEquipes');
  atualizarIndicadoresEtapa(2);
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
  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  if (equipesAtuais.length === 0) {
    mostrarNotificacao('Adicione pelo menos uma equipe para continuar.', 'warning');
    return;
  }

  navegarParaEtapa('stepRevisao');
  atualizarIndicadoresEtapa(3);
  preencherResumosRevisao();
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
  document.querySelectorAll('.content-step').forEach(step => {
    if(step) step.style.display = 'none';
  });
  const etapaAlvo = document.getElementById(idEtapaAlvo);
  if (etapaAlvo) {
    etapaAlvo.style.display = 'block';
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
 * ATUALIZADO: Mostra Data/Hora Fim da Troca
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
                <div class="row mb-2">
                    <div class="col-md-6"><strong>Tipo Ativ.:</strong> ${equipe.tipoAtividade || 'Rotineira'}</div>
                    <div class="col-md-6"><strong>Status:</strong> ${equipe.statusAtividade || 'Concluído'} ${equipe.pendencia ? `<span class="text-muted">(${equipe.pendencia})</span>` : ''}</div>
                </div>
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
                    ${equipe.dataHoraTroca ? `Início: ${formatarDataHora(equipe.dataHoraTroca)}<br>` : ''} <!-- Label Ajustado -->
                    ${equipe.dataHoraFimTroca ? `Fim: ${formatarDataHora(equipe.dataHoraFimTroca)}` : ''} <!-- NOVO: Mostra Fim -->
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
    toggleTrocaEquipamento();
    toggleMotivoOutro();
    togglePendencia();
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
  if (dadosFormulario && (dadosFormulario.vagasAltaPressao || dadosFormulario.opcoesHorario)) {
      const base = dadosFormulario;
      const vagas = isAltaPressao ? base.vagasAltaPressao : base.vagasVacuo;
      const equipamentos = isAltaPressao ? base.equipamentosAltaPressao : base.equipamentosVacuo;
      popularSelectOpcoes('equipeVaga', vagas || ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', equipamentos || ['OUTRO EQUIPAMENTO']);
      popularSelectOpcoes('equipeLancesMangueira', base.opcoesLances || []);
      popularSelectOpcoes('equipeLancesVaretas', base.opcoesLances || []);
      popularSelectOpcoes('equipeMangotes3Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes4Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes6Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeCadeados', base.opcoesCadeadosPlaquetas || []);
      popularSelectOpcoes('equipePlaquetas', base.opcoesCadeadosPlaquetas || []);
  } else {
      mostrarNotificacao("Aviso: Dados de formulário não carregados, opções podem estar limitadas.", "warning");
      popularSelectOpcoes('equipeVaga', ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', ['OUTRO EQUIPAMENTO']);
      // ... outros selects de fallback
  }

  // Definir automaticamente o próximo número de equipe disponível
  const equipesAtuais = window.AppState?.get('equipes') || equipes;
  let proximoNumero = "Equipe 1";

  if (equipesAtuais.length > 0) {
    const numerosAtivos = equipesAtuais
      .map(eq => { const match = eq.numero?.match(/Equipe (\d+)/); return match ? parseInt(match[1]) : 0; })
      .filter(num => num > 0).sort((a, b) => a - b);
    let proximo = 1;
    for (const num of numerosAtivos) { if (num > proximo) break; proximo = num + 1; }
    proximoNumero = `Equipe ${proximo}`;
  }

  // Selecionar automaticamente o próximo número disponível
  const equipeNumeroSelect = document.getElementById('equipeNumero');
  if (equipeNumeroSelect) {
    if (!Array.from(equipeNumeroSelect.options).some(opt => opt.value === proximoNumero)) {
      equipeNumeroSelect.add(new Option(proximoNumero, proximoNumero));
    }
    equipeNumeroSelect.value = proximoNumero;
  }

  // Definir valores padrão para implementos
  document.querySelectorAll('#materiaisAltaPressao select, #materiaisVacuo select').forEach(select => {
    if (select.options.length > 0 && select.options[0].value !== 'N/A') {
      select.prepend(new Option('N/A', 'N/A'));
    }
    select.selectedIndex = 0; // Selecionar N/A
  });

  // Garantir listeners
  setupEventListeners();

  // Mostrar modal
  modalEquipe.show();
}


/**
 * Editar equipe (Preenche e abre o Modal)
 * ATUALIZADO: Preenche Data/Hora Fim Troca
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

  // Limpar formulário
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.reset();
    formEquipe.classList.remove('was-validated');
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

  // Preencher selects principais (Vaga, Equipamento, etc.)
  if (dadosFormulario && (dadosFormulario.vagasAltaPressao || dadosFormulario.opcoesHorario)) {
      const base = dadosFormulario;
      const vagas = isAltaPressao ? base.vagasAltaPressao : base.vagasVacuo;
      const equipamentos = isAltaPressao ? base.equipamentosAltaPressao : base.equipamentosVacuo;
      popularSelectOpcoes('equipeVaga', vagas || ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', equipamentos || ['OUTRO EQUIPAMENTO']);
      // ... outros selects ...
  } else {
      mostrarNotificacao("Aviso: Dados de formulário não carregados, opções podem estar limitadas.", "warning");
      // ... fallbacks ...
  }

   // Adicionar opção específica salva se não estiver na lista padrão
    function addOptionIfNotExists(selectId, value, text) {
        const select = document.getElementById(selectId);
        if (select && value && !select.querySelector(`option[value="${value}"]`)) {
            select.add(new Option(text || value, value));
        }
    }
    addOptionIfNotExists('equipeVaga', equipe.vaga);
    addOptionIfNotExists('equipeEquipamento', equipe.equipamento);


   // --- Preencher campos do formulário ---
    function setFieldValue(id, value) { const field = document.getElementById(id); if (field) field.value = value ?? ''; }
    function setSelectValue(id, value) { const field = document.getElementById(id); if (field) { field.value = value ?? ''; if(field.selectedIndex === -1) field.selectedIndex = 0; } }
    function setRadioValue(name, value) { const radio = document.querySelector(`input[name="${name}"][value="${value}"]`); if (radio) radio.checked = true; else { const firstRadio = document.querySelector(`input[name="${name}"]`); if(firstRadio) firstRadio.checked = true; } }

    setSelectValue('equipeNumero', equipe.numero);
    setSelectValue('equipeTipoAtividade', equipe.tipoAtividade);
    setSelectValue('equipeStatusAtividade', equipe.statusAtividade);
    setFieldValue('equipePendencia', equipe.pendencia);
    togglePendencia();
    setFieldValue('equipeMotorista', equipe.motorista);
    setFieldValue('equipeOperadores', equipe.operadores);
    setFieldValue('equipeArea', equipe.area);
    setFieldValue('equipeAtividade', equipe.atividade);
    setFieldValue('equipeIdentificacaoUsiminas', equipe.identificacaoUsiminas);

    // Vaga e Equipamento
    setSelectValue('equipeVaga', equipe.vaga);
    toggleVagaPersonalizada();
    if (equipe.vaga === 'OUTRA VAGA') { setFieldValue('equipeVagaPersonalizada', equipe.vagaPersonalizada); }
    setSelectValue('equipeEquipamento', equipe.equipamento);
    toggleEquipamentoPersonalizado();
    if (equipe.equipamento === 'OUTRO EQUIPAMENTO') { setFieldValue('equipeEquipamentoPersonalizado', equipe.equipamentoPersonalizado); }

    // Troca de equipamento
    setRadioValue('equipeTroca', equipe.trocaEquipamento || 'Não');
    toggleTrocaEquipamento();
    if (equipe.trocaEquipamento === 'Sim') {
        setRadioValue('equipeMotivoTroca', equipe.motivoTroca);
        toggleMotivoOutro();
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' || equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
            setFieldValue('equipeMotivoOutro', equipe.motivoOutro);
        }
        setFieldValue('equipeDefeito', equipe.defeito);
        setFieldValue('equipePlacaNova', equipe.placaNova);
        setFieldValue('equipeDataHoraTroca', equipe.dataHoraTroca);
        setFieldValue('equipeDataHoraFimTroca', equipe.dataHoraFimTroca); // <<< PREENCHER CAMPO FIM >>>
    }

    // Materiais
    if (isAltaPressao && equipe.materiais) {
        // ... preenchimento materiais AP ...
        setSelectValue('equipePistola', equipe.materiais.pistola);
        setSelectValue('equipePistolaCanoLongo', equipe.materiais.pistolaCanoLongo);
        // ... etc ...
        setSelectValue('equipeLancesMangueira', equipe.lancesMangueira);
        setSelectValue('equipeLancesVaretas', equipe.lancesVaretas);
    } else if (!isAltaPressao && equipe.materiaisVacuo) {
        // ... preenchimento materiais Vacuo ...
        setSelectValue('equipeMangotes', equipe.materiaisVacuo.mangotes);
        // ... etc ...
        setSelectValue('equipeMangotes6Polegadas', equipe.mangotes6Polegadas);
    }

    // Outros campos
    setFieldValue('equipeJustificativa', equipe.justificativa);
    setRadioValue('equipeCaixaBloqueio', equipe.caixaBloqueio || 'Não');
    setSelectValue('equipeCadeados', equipe.cadeados);
    setSelectValue('equipePlaquetas', equipe.plaquetas);
    setFieldValue('equipeObservacoes', equipe.observacoes);

    // Garantir listeners
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

  if (confirm('Tem certeza que deseja remover esta equipe?')) {
    const novasEquipes = equipesAtuais.filter((_, i) => i !== index);
    if (window.AppState) {
      AppState.update('equipes', novasEquipes);
    } else {
        equipes = novasEquipes;
        atualizarListaEquipes();
        atualizarBotaoAvancar();
    }
    mostrarNotificacao('Equipe removida com sucesso.', 'success');
  }
}


/**
 * Salvar equipe (Lê dados do modal e atualiza o estado)
 * ATUALIZADO: Lê Data/Hora Fim Troca e chama validação primeiro.
 */
function salvarEquipe() {
  // Evitar dupla submissão
  if (salvandoEquipe) {
    console.log("Operação de salvar equipe já em andamento...");
    return;
  }
  salvandoEquipe = true; // Marca como salvando

  const formEquipe = document.getElementById('formEquipe');
  if (!formEquipe) {
    salvandoEquipe = false;
    mostrarNotificacao("Erro: Formulário de equipe não encontrado.", "danger");
    return;
  }

  // ** VALIDAÇÃO PRIMEIRO **
  if (!formEquipe.checkValidity() || !validarCamposCondicionaisEquipe()) {
    formEquipe.classList.add('was-validated'); // Mostra erros visuais do Bootstrap
    salvandoEquipe = false; // Libera flag
    // A validação condicional já deve ter mostrado notificações específicas
    return; // Não prosseguir se inválido
  }

  // --- Obter dados da equipe do formulário ---
  function getFieldValue(id) { const field = document.getElementById(id); return field ? field.value : null; }
  function getRadioValue(name) { const radio = document.querySelector(`input[name="${name}"]:checked`); return radio ? radio.value : null; }

  const tipo = getFieldValue('equipeTipo');
  const index = parseInt(getFieldValue('equipeIndex') ?? '-1');
  const isAltaPressao = tipo === 'Alta Pressão';

  const novaEquipe = {
    tipo: tipo,
    numero: getFieldValue('equipeNumero'),
    motorista: getFieldValue('equipeMotorista'),
    operadores: getFieldValue('equipeOperadores'),
    area: getFieldValue('equipeArea'),
    atividade: getFieldValue('equipeAtividade'),
    tipoAtividade: getFieldValue('equipeTipoAtividade'),
    statusAtividade: getFieldValue('equipeStatusAtividade'),
    pendencia: getFieldValue('equipeStatusAtividade') !== 'Concluído' ? getFieldValue('equipePendencia') : '',
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
    // Inicializar objetos/propriedades aninhados
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
    dataHoraTroca: null,
    dataHoraFimTroca: null // <<< Inicializa o novo campo >>>
  };

  // Adicionar detalhes da troca se aplicável
  if (novaEquipe.trocaEquipamento === 'Sim') {
    novaEquipe.motivoTroca = getRadioValue('equipeMotivoTroca');
    if (novaEquipe.motivoTroca === 'Outros Motivos (Justificar)' || novaEquipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
      novaEquipe.motivoOutro = getFieldValue('equipeMotivoOutro');
    }
    novaEquipe.defeito = getFieldValue('equipeDefeito');
    novaEquipe.placaNova = getFieldValue('equipePlacaNova');
    novaEquipe.dataHoraTroca = getFieldValue('equipeDataHoraTroca');
    novaEquipe.dataHoraFimTroca = getFieldValue('equipeDataHoraFimTroca'); // <<< LER O NOVO CAMPO >>>
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
  } else {
    novaEquipe.materiaisVacuo = {
      mangotes: getFieldValue('equipeMangotes'),
      reducoes: getFieldValue('equipeReducoes')
    };
    novaEquipe.mangotes3Polegadas = getFieldValue('equipeMangotes3Polegadas');
    novaEquipe.mangotes4Polegadas = getFieldValue('equipeMangotes4Polegadas');
    novaEquipe.mangotes6Polegadas = getFieldValue('equipeMangotes6Polegadas');
  }

  // Obter lista atual e atualizar
  let equipesAtuais = window.AppState?.get('equipes') || [...equipes];
  let equipesAtualizadas;

  if (index >= 0 && index < equipesAtuais.length) {
    equipesAtualizadas = equipesAtuais.map((eq, i) => i === index ? novaEquipe : eq);
    mostrarNotificacao('Equipe atualizada com sucesso.', 'success');
  } else {
    equipesAtualizadas = [...equipesAtuais, novaEquipe];
    mostrarNotificacao('Equipe adicionada com sucesso.', 'success');
  }

  // Atualizar estado
  if (window.AppState) {
    AppState.update('equipes', equipesAtualizadas);
  } else {
    equipes = equipesAtualizadas;
    atualizarListaEquipes();
    atualizarBotaoAvancar();
  }

  // Fechar modal
  if (modalEquipe) {
    modalEquipe.hide();
  }

  // Resetar flag de salvamento após um pequeno delay
  setTimeout(() => {
    salvandoEquipe = false;
  }, 300);
}


/**
 * Atualizar lista de equipes na UI
 */
function atualizarListaEquipes() {
  const listaEquipesDiv = document.getElementById('listaEquipes');
  const semEquipesDiv = document.getElementById('semEquipes');

  if (!listaEquipesDiv) return;

  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  if (semEquipesDiv) {
    semEquipesDiv.style.display = equipesAtuais.length === 0 ? 'block' : 'none';
  }

  listaEquipesDiv.querySelectorAll('.equipe-card').forEach(card => card.remove());

  equipesAtuais.forEach((equipe, index) => {
    const isAltaPressao = equipe.tipo === 'Alta Pressão';
    const cardClass = isAltaPressao ? 'equipe-card card border-primary' : 'equipe-card card equipe-vacuo border-danger';
    const badgeClass = isAltaPressao ? 'bg-primary' : 'bg-danger';
    const statusClass = equipe.statusAtividade === 'Concluído' ? 'text-success' : 'text-warning';
    const statusIcon = equipe.statusAtividade === 'Concluído' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';

    const card = document.createElement('div');
    card.className = `${cardClass} mb-3`;

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
    input.required = show;
    if (!show) {
        input.value = '';
        input.classList.remove('is-invalid');
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
 * ATUALIZADO: Limpa campo FIM e validação associada.
 */
function toggleTrocaEquipamento() {
  const trocaSimRadio = document.getElementById('equipeTrocaSim');
  const detalhesDiv = document.getElementById('trocaDetalhes');

  if (trocaSimRadio && detalhesDiv) {
    const show = trocaSimRadio.checked;
    detalhesDiv.style.display = show ? 'block' : 'none';
    // Limpar campos e validações se escondido
    if (!show) {
        // Inclui datetime-local para limpar campos de INÍCIO e FIM
        detalhesDiv.querySelectorAll('input[type="text"], input[type="datetime-local"], textarea').forEach(el => {
            el.value = '';
            el.classList.remove('is-invalid'); // Remove validação visual
        });
        detalhesDiv.querySelectorAll('input[type="radio"][name="equipeMotivoTroca"]').forEach(radio => {
             radio.checked = false;
        });
        toggleMotivoOutro();
        const motivoFeedback = document.getElementById('motivoTrocaFeedback');
        if(motivoFeedback) motivoFeedback.style.display = 'none';
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
  const motivoFeedback = document.getElementById('motivoTrocaFeedback');

  if (motivoFeedback && document.querySelector('input[name="equipeMotivoTroca"]:checked')) {
    motivoFeedback.style.display = 'none';
  }

  if (container && input) {
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
        const show = statusSelect.value !== 'Concluído';
        pendenciaContainer.style.display = show ? 'block' : 'none';
        pendenciaInput.required = show;
        if (!show) {
            pendenciaInput.value = '';
            pendenciaInput.classList.remove('is-invalid');
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

    const localId = 'local_' + new Date().getTime();
    const relatorio = { id: localId, dadosTurno: dadosTurnoAtual, equipes: equipesAtuais, timestamp: new Date().toISOString(), origem: 'local' };

    let relatoriosLocais = [];
    try {
      const relatoriosJson = localStorage.getItem('relatorios_locais');
      if (relatoriosJson) { relatoriosLocais = JSON.parse(relatoriosJson); if (!Array.isArray(relatoriosLocais)) relatoriosLocais = []; }
    } catch (e) { console.error('Erro ao carregar relatórios locais:', e); relatoriosLocais = []; }

    relatoriosLocais.push(relatorio);
    if(relatoriosLocais.length > 20) { relatoriosLocais = relatoriosLocais.slice(-20); }
    localStorage.setItem('relatorios_locais', JSON.stringify(relatoriosLocais));

    const idParaEstado = localId;
    if (window.AppState) { AppState.update('ultimoRelatorioId', idParaEstado); } else { ultimoRelatorioId = idParaEstado; }

    mostrarTelaSucesso(idParaEstado, true);
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
  if (salvandoRelatorio) { console.log("Salvamento já em andamento..."); return; }
  salvandoRelatorio = true;
  mostrarLoading('Salvando relatório...');

  try {
     const dadosTurnoAtual = window.AppState?.get('dadosTurno') || dadosTurno;
     const equipesAtuais = window.AppState?.get('equipes') || equipes;

    if (equipesAtuais.length === 0) throw new Error('Adicione pelo menos uma equipe.');
    if (!dadosTurnoAtual.data || !dadosTurnoAtual.horario || !dadosTurnoAtual.letra || !dadosTurnoAtual.supervisor) throw new Error('Dados do turno incompletos.');

    let idRelatorioSalvo = null;
    let salvoLocalmente = false;

    try {
      console.log("Tentando salvar na API...");
      const result = await callAPI('salvarTurno', { dadosTurno: dadosTurnoAtual, equipes: equipesAtuais });
      if (result && result.success && result.relatorioId) {
        idRelatorioSalvo = result.relatorioId;
        console.log(`Relatório salvo na API com ID: ${idRelatorioSalvo}`);
        mostrarNotificacao('Relatório salvo com sucesso no servidor!', 'success');
      } else {
        throw new Error(result?.message || 'Erro desconhecido ao salvar na API.');
      }
    } catch (apiError) {
      console.error('Erro ao salvar na API:', apiError);
      mostrarNotificacao('Falha ao salvar no servidor. Tentando salvar localmente...', 'warning');
      if (salvarRelatorioLocal()) {
          idRelatorioSalvo = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
          salvoLocalmente = true;
      } else {
        throw new Error('Falha ao salvar remotamente e localmente.');
      }
    }

    if (idRelatorioSalvo) {
        if (window.AppState) AppState.update('ultimoRelatorioId', idRelatorioSalvo);
        else ultimoRelatorioId = idRelatorioSalvo;
    }
     mostrarTelaSucesso(idRelatorioSalvo, salvoLocalmente);
    return true;
  } catch (error) {
    console.error('Erro final ao salvar relatório:', error);
    mostrarNotificacao('Erro ao salvar relatório: ' + error.message, 'danger');
    return false;
  } finally {
    ocultarLoading();
    setTimeout(() => { salvandoRelatorio = false; }, 500);
  }
}

/**
 * Mostrar tela de sucesso e atualizar mensagem
 */
function mostrarTelaSucesso(idSalvo = null, foiLocal = false) {
  navegarParaEtapa('stepSucesso');

  const mensagemSucessoStatus = document.getElementById('mensagemSucessoStatus');
  if (mensagemSucessoStatus) {
      mensagemSucessoStatus.textContent = foiLocal
          ? `Relatório salvo localmente. ID: ${idSalvo || 'N/A'}`
          : `Relatório #${idSalvo || 'N/A'} registrado com sucesso no servidor!`;
  }

  const idAtual = idSalvo || (window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId);
  document.querySelectorAll('#stepSucesso button').forEach(btn => btn.disabled = !idAtual); // Desabilita se não tiver ID

  if (idAtual) {
      const btnPDF = document.querySelector('#stepSucesso button[onclick^="gerarPDFExistente"]');
      if (btnPDF) {
          const origemPDF = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
          btnPDF.onclick = () => gerarPDFExistente(idAtual, origemPDF);
          btnPDF.disabled = (origemPDF === 'local'); // Desabilita se for local
          btnPDF.title = (origemPDF === 'local') ? "PDF não disponível para relatórios locais." : "Gerar PDF do último relatório salvo";
      }
  }
}


/**
 * Criar novo relatório (reseta o estado)
 */
function novoRelatorio() {
  if (window.AppState) {
    AppState.update('dadosTurno', {});
    AppState.update('equipes', []);
    AppState.update('ultimoRelatorioId', null);
  } else {
      dadosTurno = {}; equipes = []; ultimoRelatorioId = null;
      atualizarListaEquipes(); atualizarBotaoAvancar();
  }

  const formTurno = document.getElementById('formTurno');
   if(formTurno) { formTurno.reset(); formTurno.classList.remove('was-validated'); }

  const dataInput = document.getElementById('data');
  if (dataInput) {
    try {
      const today = new Date(); const offset = today.getTimezoneOffset() * 60000;
      dataInput.value = new Date(today.getTime() - offset).toISOString().split('T')[0];
    } catch (e) { console.error("Erro ao definir data padrão:", e); dataInput.value = ''; }
  }

  navegarParaEtapa('stepTurno');
  atualizarIndicadoresEtapa(1);
}

/**
 * Função auxiliar para gerenciar a navegação
 */
function setOrigemNavegacao(origem) {
  if (window.AppState) { AppState.update('origemNavegacao', origem); }
  else { window.origemNavegacao = origem; }
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
  if (origem === 'stepSucesso') voltarParaSucesso();
  else if (origem === 'stepPesquisa') voltarDaVisualizacaoParaPesquisa();
  else voltarParaSucesso(); // Fallback
}

/**
 * Visualizar relatório (usa ID salvo no estado)
 */
async function visualizarRelatorio() {
  setOrigemNavegacao('stepSucesso');
  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
  if (!idAtual) { mostrarNotificacao("ID do relatório não encontrado.", "warning"); return; }
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
  await visualizarRelatorioExistente(idAtual, origem, 'gerarRelatorioTexto');
}

/**
 * Formatar relatório para WhatsApp (usa ID salvo no estado)
 */
async function formatarWhatsApp() {
  setOrigemNavegacao('stepSucesso');
  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
   if (!idAtual) { mostrarNotificacao("ID do relatório não encontrado.", "warning"); return; }
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
  await formatarWhatsAppExistente(idAtual, origem, 'formatarWhatsApp');
}

/**
 * Voltar para a tela de sucesso (vinda da visualização/whatsapp)
 */
function voltarParaSucesso() {
    const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
    const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
    mostrarTelaSucesso(idAtual, origem === 'local');
}

/**
 * Voltar da visualização do relatório ou WhatsApp para a tela de origem
 */
function voltarDoWhatsApp() { voltarParaTelaOrigem(); }
function voltarDoRelatorio() { voltarParaTelaOrigem(); }


/**
 * Copiar texto para a área de transferência (Função genérica)
 */
function copiarTextoParaClipboard(elementId, tipoTexto) {
  const elemento = document.getElementById(elementId);
  if (!elemento) { mostrarNotificacao(`Erro: Elemento ${elementId} não encontrado.`, "danger"); return; }
  const textoParaCopiar = elemento.textContent || elemento.value || '';

  if (!navigator.clipboard) {
    try {
      const ta = document.createElement('textarea'); ta.value = textoParaCopiar;
      ta.style.position = 'absolute'; ta.style.left = '-9999px'; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      mostrarNotificacao(`${tipoTexto} copiado! (Método antigo)`, 'success');
    } catch (err) { console.error('Falha ao copiar (fallback):', err); mostrarNotificacao(`Copie manualmente (Ctrl+C).`, 'warning'); }
    return;
  }
  navigator.clipboard.writeText(textoParaCopiar).then(() => {
    mostrarNotificacao(`${tipoTexto} copiado!`, 'success');
  }).catch(err => { console.error(`Erro ao copiar ${tipoTexto}:`, err); mostrarNotificacao(`Falha ao copiar ${tipoTexto}.`, 'danger'); });
}

/** Copiar relatório gerado */
function copiarRelatorio() { copiarTextoParaClipboard('relatorioTexto', 'Relatório'); }
/** Copiar texto formatado para WhatsApp */
function copiarWhatsApp() { copiarTextoParaClipboard('whatsAppTexto', 'Texto WhatsApp'); }


// ========== FUNÇÕES DE PESQUISA ==========

/** Abrir tela de pesquisa */
function abrirPesquisa() {
  navegarParaEtapa('stepPesquisa');
  const formPesquisa = document.getElementById('formPesquisa'); if (formPesquisa) { formPesquisa.reset(); ajustarCampoPesquisa(); }
  const resultadosPesquisa = document.getElementById('resultadosPesquisa');
  if (resultadosPesquisa) {
    resultadosPesquisa.style.display = 'none';
    const tabelaResultados = document.getElementById('tabelaResultados'); if(tabelaResultados) tabelaResultados.innerHTML = '';
    const semResultadosDiv = document.getElementById('semResultados'); if(semResultadosDiv) semResultadosDiv.style.display = 'none';
  }
}

/** Ajustar campo de pesquisa conforme o tipo selecionado */
function ajustarCampoPesquisa() {
  const tipoPesquisaSelect = document.getElementById('tipoPesquisa'); const termoPesquisaInput = document.getElementById('termoPesquisa'); const labelPesquisaLabel = document.getElementById('labelPesquisa');
  if (!tipoPesquisaSelect || !termoPesquisaInput || !labelPesquisaLabel) return;
  const tipo = tipoPesquisaSelect.value;
  termoPesquisaInput.value = '';
  switch (tipo) {
    case 'data': labelPesquisaLabel.textContent = 'Data (AAAA-MM-DD)'; termoPesquisaInput.type = 'date'; termoPesquisaInput.placeholder = ''; break;
    case 'mes_ano': labelPesquisaLabel.textContent = 'Mês/Ano (AAAA-MM)'; termoPesquisaInput.type = 'month'; termoPesquisaInput.placeholder = ''; break;
    case 'supervisor': labelPesquisaLabel.textContent = 'Nome do Supervisor'; termoPesquisaInput.type = 'text'; termoPesquisaInput.placeholder = 'Digite o nome'; break;
    case 'letra': labelPesquisaLabel.textContent = 'Letra do Turno'; termoPesquisaInput.type = 'text'; termoPesquisaInput.placeholder = 'A, B, C...'; break;
    case 'local': labelPesquisaLabel.textContent = 'Pesquisar em Relatórios Locais'; termoPesquisaInput.type = 'text'; termoPesquisaInput.placeholder = 'Termo, data, supervisor...'; break;
    default: labelPesquisaLabel.textContent = 'Termo de Pesquisa ou ID'; termoPesquisaInput.type = 'text'; termoPesquisaInput.placeholder = 'Digite ID ou termo geral';
  }
}

/** Executar pesquisa (API ou Local) */
async function executarPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa').value; let termoPesquisa = document.getElementById('termoPesquisa').value;
  if (!termoPesquisa || !termoPesquisa.trim()) { mostrarNotificacao('Digite um termo de pesquisa.', 'warning'); return; }
  let termoParaAPI = termoPesquisa.trim();
  if (tipoPesquisa === 'mes_ano' && /^\d{4}-\d{2}$/.test(termoParaAPI)) { const [ano, mes] = termoParaAPI.split('-'); termoParaAPI = `${mes}/${ano}`; }

  mostrarLoading('Pesquisando relatórios...');
  try {
    let resultados = [];
    if (tipoPesquisa === 'local') {
      resultados = pesquisarRelatoriosLocais(termoPesquisa.trim());
    } else {
      const result = await callAPI('pesquisarRelatorios', { termo: termoParaAPI, tipo: tipoPesquisa });
      if (result && result.success) { resultados = result.resultados || []; resultados.forEach(r => { r.origem = 'servidor'; }); }
      else { throw new Error(result?.message || 'Erro ao pesquisar no servidor.'); }
    }
    exibirResultadosPesquisa(resultados);
    if(resultados.length === 0) mostrarNotificacao('Nenhum relatório encontrado.', 'info');
  } catch (error) {
    console.error('Erro ao executar pesquisa:', error); mostrarNotificacao('Erro ao pesquisar: ' + error.message, 'danger'); exibirResultadosPesquisa([]);
  } finally { ocultarLoading(); }
}

/** Pesquisar relatórios salvos localmente */
function pesquisarRelatoriosLocais(termo) {
  let relatoriosLocais = [];
  try { const json = localStorage.getItem('relatorios_locais'); if (json) { relatoriosLocais = JSON.parse(json); if (!Array.isArray(relatoriosLocais)) relatoriosLocais = []; } }
  catch (e) { console.error('Erro ao carregar relatórios locais:', e); return []; }
  const termoLower = termo.toLowerCase();
  return relatoriosLocais.filter(relatorio => {
    const { dadosTurno, equipes = [], id } = relatorio; if (!dadosTurno) return false;
    const check = (v) => v && String(v).toLowerCase().includes(termoLower);
    if (check(id)) return true; if (check(dadosTurno.letra)) return true; if (check(dadosTurno.supervisor)) return true;
    if (check(dadosTurno.data)) return true; if (check(formatarData(dadosTurno.data))) return true; if (check(dadosTurno.horario)) return true;
    return equipes.some(eq => check(eq.numero) || check(eq.motorista) || check(eq.operadores) || check(eq.area) || check(eq.atividade) || check(eq.tipoAtividade) || check(eq.statusAtividade) || check(eq.pendencia) || check(eq.vaga) || check(eq.vagaPersonalizada) || check(eq.equipamento) || check(eq.equipamentoPersonalizado) || check(eq.identificacaoUsiminas) || check(eq.motivoTroca) || check(eq.motivoOutro) || check(eq.defeito) || check(eq.placaNova) || check(eq.observacoes));
  }).map(relatorio => ({ id: relatorio.id, data: formatarData(relatorio.dadosTurno.data), horario: relatorio.dadosTurno.horario || 'N/A', letra: relatorio.dadosTurno.letra || 'N/A', supervisor: relatorio.dadosTurno.supervisor || 'N/A', origem: 'local' }))
    .sort((a, b) => { let dA = a.data.split('/').reverse().join('-'); let dB = b.data.split('/').reverse().join('-'); return dB.localeCompare(dA); });
}


/** Exibir resultados da pesquisa na tabela */
function exibirResultadosPesquisa(resultados) {
  const resDiv = document.getElementById('resultadosPesquisa'); const tbody = document.getElementById('tabelaResultados'); const semResDiv = document.getElementById('semResultados');
  if (!resDiv || !tbody || !semResDiv) return;
  resDiv.style.display = 'block'; semResDiv.style.display = (!resultados || resultados.length === 0) ? 'block' : 'none';
  tbody.innerHTML = '';
  if (resultados && resultados.length > 0) {
      resultados.forEach(r => {
        const linha = document.createElement('tr'); const badgeClass = r.origem === 'local' ? 'bg-secondary' : 'bg-info'; const podePDF = r.origem === 'servidor';
        linha.innerHTML = `
          <td><span class="badge ${badgeClass}">${r.origem}</span></td> <td>${r.data || 'N/A'}</td> <td>${r.horario || 'N/A'}</td> <td>${r.letra || 'N/A'}</td> <td>${r.supervisor || 'N/A'}</td>
          <td class="text-center">
            <div class="action-buttons btn-group btn-group-sm">
              <button type="button" class="btn btn-primary" onclick="visualizarRelatorioExistente('${r.id}', '${r.origem}', 'gerarRelatorioTexto')" title="Visualizar"><i class="bi bi-eye"></i></button>
              <button type="button" class="btn btn-danger" onclick="gerarPDFExistente('${r.id}', '${r.origem}')" title="Gerar PDF" ${!podePDF ? 'disabled' : ''}><i class="bi bi-file-pdf"></i></button>
              <button type="button" class="btn btn-info text-white" onclick="formatarWhatsAppExistente('${r.id}', '${r.origem}', 'formatarWhatsApp')" title="Formatar WhatsApp"><i class="bi bi-whatsapp"></i></button>
            </div>
          </td>`;
        tbody.appendChild(linha);
      });
  }
}

/** Visualizar um relatório específico (local ou servidor) */
async function visualizarRelatorioExistente(id, origem = 'servidor', apiAction = 'gerarRelatorioTexto') {
  if (!id) { mostrarNotificacao("ID inválido.", "danger"); return; }
  setOrigemNavegacao(window.AppState?.get('currentStep') || 'stepSucesso');
  mostrarLoading('Carregando relatório...');
  try {
    let textoRelatorio = ''; let relatorioCompleto = null;
    if (origem === 'local') {
      relatorioCompleto = obterRelatorioLocal(id); if (!relatorioCompleto) throw new Error('Relatório local não encontrado.');
      textoRelatorio = gerarTextoRelatorioLocal(relatorioCompleto);
    } else {
      const result = await callAPI(apiAction, { turnoId: id });
      if (result && result.success && result.relatorio) { textoRelatorio = result.relatorio; }
      else { throw new Error(result?.message || `Erro ao buscar relatório (${apiAction}).`); }
    }
    if(window.AppState) AppState.update('ultimoRelatorioId', id); else ultimoRelatorioId = id;
    navegarParaEtapa('stepRelatorio');
    const el = document.getElementById('relatorioTexto'); if (el) el.textContent = textoRelatorio;
    const btn = document.getElementById('btnVoltarRelatorio'); if (btn) btn.onclick = voltarDoRelatorio;
  } catch (error) { console.error('Erro ao visualizar:', error); mostrarNotificacao('Erro: ' + error.message, 'danger'); }
  finally { ocultarLoading(); }
}

/** Obter dados de um relatório local por ID */
function obterRelatorioLocal(id) {
  let relatoriosLocais = [];
  try { const json = localStorage.getItem('relatorios_locais'); if (json) { relatoriosLocais = JSON.parse(json); if (!Array.isArray(relatoriosLocais)) relatoriosLocais = []; } }
  catch (e) { console.error('Erro ao carregar relatório local:', e); return null; }
  return relatoriosLocais.find(r => r.id === id) || null;
}


/**
 * Gerar texto de relatório local (Melhorado e mais detalhado)
 * ATUALIZADO: Inclui Data/Hora Fim e Tempo Calculado
 */
function gerarTextoRelatorioLocal(relatorio) {
  if (!relatorio || !relatorio.dadosTurno || !relatorio.equipes) {
    return 'Erro: Dados do relatório local inválidos ou ausentes.';
  }

  const { dadosTurno, equipes, id, timestamp } = relatorio;
  let texto = '';
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
  texto += `Salvo em: ${formatarDataHora(timestamp)}\n`;
  texto += subLinha + '\n';

  const equipesPorTipo = equipes.reduce((acc, equipe) => {
    const tipo = equipe.tipo || 'Outro'; if (!acc[tipo]) acc[tipo] = []; acc[tipo].push(equipe); return acc;
  }, {});

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
      texto += `> Tipo de Atividade: ${equipe.tipoAtividade || 'Rotineira'}\n`;
      texto += `> Status: ${equipe.statusAtividade || 'Concluído'}\n`;
      if (equipe.statusAtividade && equipe.statusAtividade !== 'Concluído' && equipe.pendencia) { texto += `  - Pendência: ${equipe.pendencia}\n`; }
      texto += `Vaga: ${vagaDisplay || 'N/A'}\n`;
      texto += `Equipamento: ${equipDisplay || 'N/A'}\n`;
      if (equipe.identificacaoUsiminas) texto += `Identificação Usiminas: ${equipe.identificacaoUsiminas}\n`;

      // Detalhes da Troca (com Fim e Tempo)
      texto += '\n> Status Equipamento:\n';
      texto += `  Houve troca: ${equipe.trocaEquipamento || 'Não'}\n`;
      if (equipe.trocaEquipamento === 'Sim') {
        texto += `  - Motivo: ${motivoTrocaDisplay || 'Não especificado'}\n`;
        texto += `  - Defeito/Medidas: ${equipe.defeito || 'N/A'}\n`;
        if (equipe.placaNova) texto += `  - Placa Nova: ${equipe.placaNova}\n`;
        if (equipe.dataHoraTroca) texto += `  - Início Troca: ${formatarDataHora(equipe.dataHoraTroca)}\n`;
        if (equipe.dataHoraFimTroca) texto += `  - Fim Troca: ${formatarDataHora(equipe.dataHoraFimTroca)}\n`; // NOVO: Fim
        // Tenta calcular tempo para exibição local
        if (equipe.dataHoraTroca && equipe.dataHoraFimTroca) {
            try {
                const inicio = new Date(equipe.dataHoraTroca); const fim = new Date(equipe.dataHoraFimTroca);
                if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime()) && fim > inicio) {
                   const diffMins = Math.round((fim - inicio) / 60000); const h = Math.floor(diffMins / 60); const m = diffMins % 60;
                   texto += `  - Tempo Indisp.: ${h}h${m < 10 ? '0' : ''}${m}min\n`; // NOVO: Tempo
                }
            } catch(e) {}
        }
      }

      // Implementos
      texto += '\n> Implementos:\n';
      if (isAltaPressao) {
         texto += `  - Pistola: ${equipe.materiais?.pistola ?? 'N/A'}\n`;
         // ... outros AP ...
         texto += `  - Lances Var.: ${equipe.lancesVaretas ?? 'N/A'}\n`;
      } else {
         texto += `  - Mangotes: ${equipe.materiaisVacuo?.mangotes ?? 'N/A'}\n`;
         // ... outros Vacuo ...
         texto += `  - Mangotes 6": ${equipe.mangotes6Polegadas ?? 'N/A'}\n`;
      }
      if (equipe.justificativa) { texto += `\n> Justificativa Implementos Falta:\n  ${equipe.justificativa}\n`; }

      // Segurança
      texto += '\n> Segurança:\n';
      texto += `  - Caixa Bloqueio: ${equipe.caixaBloqueio ?? 'N/A'}\n`;
      texto += `  - Cadeados: ${equipe.cadeados ?? 'N/A'}\n`;
      texto += `  - Plaquetas: ${equipe.plaquetas ?? 'N/A'}\n`;

      if (equipe.observacoes) { texto += `\n> Observações Adicionais:\n  ${equipe.observacoes}\n`; }
      texto += subLinha + '\n';
    });
  }

  texto += linhaSeparadora;
  texto += `Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.1'} (Relatório Local)\n`;
  texto += linhaSeparadora;
  return texto;
}

/**
 * Gerar PDF de relatório existente (Servidor)
 * ATUALIZADO: Espera receber e mapeia Data/Hora Fim e Tempo Troca
 */
async function gerarPDFExistente(id, origem = 'servidor') {
   if (!id || origem === 'local') {
      mostrarNotificacao(origem === 'local' ? "PDF não disponível para relatórios locais." : "ID inválido para gerar PDF.", "warning");
      return;
   }
  mostrarLoading('Gerando PDF...');
  try {
    let dadosParaPDF = { dadosTurno: null, equipes: null };
     const result = await callAPI('obterDadosRelatorio', { turnoId: id });
     if (result && result.success && result.dadosTurno && result.equipes) {
         dadosParaPDF.dadosTurno = mapearChavesObjeto(result.dadosTurno, { /* ... mapeamento turno ... */ 'ID': 'id', 'Data': 'data', 'Horário': 'horario', 'Letra': 'letra', 'Supervisor': 'supervisor', 'Timestamp': 'timestamp', 'Status': 'status', 'UltimaModificacao': 'ultimaModificacao' });
         dadosParaPDF.equipes = result.equipes.map(eq => mapearChavesObjeto(eq, {
              /* ... mapeamento equipes existente ... */
              'Turno_ID': 'turnoId', 'Tipo_Equipe': 'tipo', 'Numero_Equipe': 'numero', 'Integrantes': 'integrantes', 'Motorista': 'motorista', 'Operadores': 'operadores', 'Area': 'area', 'Atividade': 'atividade',
              'TipoAtividade': 'tipoAtividade', 'StatusAtividade': 'statusAtividade', 'Pendencia': 'pendencia',
              'Vaga': 'vaga', 'Vaga_Personalizada': 'vagaPersonalizada', 'Equipamento': 'equipamento', 'Equipamento_Personalizada': 'equipamentoPersonalizado', 'Identificacao_Usiminas': 'identificacaoUsiminas', 'Troca_Equipamento': 'trocaEquipamento', 'Motivo_Troca': 'motivoTroca', 'Motivo_Outro': 'motivoOutro', 'Defeito': 'defeito', 'Placa_Nova': 'placaNova',
              'Data_Hora_Troca': 'dataHoraTroca',          // Início
              'Data_Hora_Fim_Troca': 'dataHoraFimTroca',    // <<< NOVO: Fim >>>
              'Tempo_Troca': 'tempoTroca',                  // <<< NOVO: Tempo >>>
              // Materiais AP
              'Pistola': 'pistola', 'Pistola_Cano_Longo': 'pistolaCanoLongo', 'Mangueira_Torpedo': 'mangueiraTorpedo', 'Pedal': 'pedal', 'Varetas': 'varetas', 'Rabicho': 'rabicho', 'Lances_Mangueira': 'lancesMangueira', 'Lances_Varetas': 'lancesVaretas',
              // Materiais Vacuo
              'Mangotes': 'mangotes', 'Reducoes': 'reducoes', 'Mangotes_3_Polegadas': 'mangotes3Polegadas', 'Mangotes_4_Polegadas': 'mangotes4Polegadas', 'Mangotes_6_Polegadas': 'mangotes6Polegadas',
              // Segurança e Obs
              'Justificativa': 'justificativa', 'Caixa_Bloqueio': 'caixaBloqueio', 'Cadeados': 'cadeados', 'Plaquetas': 'plaquetas', 'Observacoes': 'observacoes'
         }));
          dadosParaPDF.equipes.forEach(eq => { // Agrupa materiais
              if(eq.tipo === 'Alta Pressão') { eq.materiais = { pistola: eq.pistola, pistolaCanoLongo: eq.pistolaCanoLongo, mangueiraTorpedo: eq.mangueiraTorpedo, pedal: eq.pedal, varetas: eq.varetas, rabicho: eq.rabicho }; }
              else { eq.materiaisVacuo = { mangotes: eq.mangotes, reducoes: eq.reducoes }; }
          });
          await gerarPDF(dadosParaPDF.dadosTurno, dadosParaPDF.equipes, id);
     } else { throw new Error(result?.message || 'Erro ao buscar dados do relatório.'); }
  } catch (error) { console.error('Erro ao gerar PDF:', error); mostrarNotificacao('Erro ao gerar PDF: ' + error.message, 'danger'); }
  finally { ocultarLoading(); }
}

/** Função auxiliar para mapear chaves de um objeto */
function mapearChavesObjeto(obj, mapa) {
    if (!obj) return {}; const novoObj = {};
    for (const chaveOriginal in obj) {
        if (Object.hasOwnProperty.call(obj, chaveOriginal)) {
            const chaveJsMapeada = mapa[chaveOriginal];
            const chaveFinal = chaveJsMapeada !== undefined ? chaveJsMapeada : chaveOriginal;
            novoObj[chaveFinal] = obj[chaveOriginal];
        }
    }
    Object.values(mapa).forEach(chaveJsEsperada => { if (novoObj[chaveJsEsperada] === undefined) novoObj[chaveJsEsperada] = null; });
    return novoObj;
}

/**
 * Gerar PDF (Função auxiliar, precisa da biblioteca jsPDF)
 * ATUALIZADO: Inclui Data/Hora Fim e Tempo Troca
 */
async function gerarPDF(dadosTurnoPDF, equipesPDF, relatorioId) {
    if (!window.jspdf || !window.jspdf.jsPDF) { mostrarNotificacao('Erro: jsPDF não carregada.', 'danger'); return; }
    if (!dadosTurnoPDF || !equipesPDF) { mostrarNotificacao('Erro: Dados insuficientes.', 'danger'); return; }

    const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let y = 15; const margin = 10; const pageHeight = doc.internal.pageSize.height; const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - margin * 2; const lineHeight = 5; const smallLineHeight = 4;

    const addWrappedText = (label, value, indent = 5, isBold = false) => {
      if (value === null || value === undefined || value === '') value = 'N/A';
      const fullText = `${label ? label + ': ' : ''}${value}`; // Label opcional
      const textWidth = contentWidth - indent - (label ? 5 : 0); // Ajusta largura baseada no label
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(fullText, textWidth);
      checkAddPage(lines.length * lineHeight);
      doc.text(lines, margin + indent, y); y += lines.length * lineHeight;
      doc.setFont(undefined, 'normal');
    };
    function checkAddPage(alturaNecessaria = 20) { if (y + alturaNecessaria > pageHeight - margin) { doc.addPage(); y = margin; } }

    // Cabeçalho
    doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.text("RELATÓRIO DE TURNO", pageWidth / 2, y, { align: 'center' }); y += lineHeight * 1.5;
    doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.text("GRUPO GPS - MECANIZADA", pageWidth / 2, y, { align: 'center' }); y += lineHeight * 2;
    // Informações Gerais
    doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text("INFORMAÇÕES GERAIS", margin, y); y += lineHeight * 0.8; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += lineHeight * 1.2;
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text(`Data: ${formatarData(dadosTurnoPDF.data)}`, margin, y); doc.text(`Horário: ${dadosTurnoPDF.horario || 'N/A'}`, margin + 70, y); y += lineHeight;
    doc.text(`Letra: ${dadosTurnoPDF.letra || 'N/A'}`, margin, y); doc.text(`Supervisor: ${dadosTurnoPDF.supervisor || 'N/A'}`, margin + 70, y); y += lineHeight;
    doc.text(`ID Relatório: ${relatorioId || 'N/A'}`, margin, y); y += lineHeight * 1.5;

    // Equipes
    const equipesPorTipo = equipesPDF.reduce((acc, eq) => { const tipo = eq.tipo || 'Outro'; if (!acc[tipo]) acc[tipo] = []; acc[tipo].push(eq); return acc; }, {});
     for (const tipo in equipesPorTipo) {
        checkAddPage(30); doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text(`EQUIPES ${tipo.toUpperCase()} (${equipesPorTipo[tipo].length})`, margin, y); y += lineHeight * 0.8; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += lineHeight * 1.2;
        equipesPorTipo[tipo].forEach((equipe, index) => {
            checkAddPage(90); // Aumentar estimativa para incluir tempo
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.text(`Equipe ${index + 1}: ${equipe.numero || 'N/A'}`, margin, y); y += lineHeight * 1.2;
            doc.setFontSize(9); doc.setFont(undefined, 'normal');
            const vagaDisp = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga; const equipDisp = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
            const motivoTrocaDisp = (equipe.motivoTroca === 'Outros Motivos (Justificar)' || equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') ? equipe.motivoOutro : equipe.motivoTroca; const isAP = equipe.tipo === 'Alta Pressão';
            addWrappedText('Motorista', equipe.motorista); addWrappedText('Operador(es)', equipe.operadores); addWrappedText('Área', equipe.area); addWrappedText('Atividade', equipe.atividade);
            addWrappedText('Tipo Atividade', equipe.tipoAtividade || 'Rotineira', 5, true); addWrappedText('Status', equipe.statusAtividade || 'Concluído', 5, true); if (equipe.statusAtividade !== 'Concluído' && equipe.pendencia) addWrappedText('Pendência', equipe.pendencia, 10);
            addWrappedText('Vaga', vagaDisp); addWrappedText('Equipamento', equipDisp); if (equipe.identificacaoUsiminas) addWrappedText('ID Usiminas', equipe.identificacaoUsiminas);
            // Troca (com Fim e Tempo)
            checkAddPage(25); doc.setFont(undefined, 'bold'); doc.text(`Troca Equip.:`, margin + 5, y); doc.setFont(undefined, 'normal'); doc.text(`${equipe.trocaEquipamento || 'Não'}`, margin + 45, y); y += lineHeight;
            if (equipe.trocaEquipamento === 'Sim') {
                addWrappedText('- Motivo', motivoTrocaDisp || 'N/A', 10); addWrappedText('- Defeito/Medidas', equipe.defeito || 'N/A', 10);
                if (equipe.placaNova) addWrappedText('- Placa Nova', equipe.placaNova, 10);
                if (equipe.dataHoraTroca) addWrappedText('- Início Troca', formatarDataHora(equipe.dataHoraTroca), 10);
                if (equipe.dataHoraFimTroca) addWrappedText('- Fim Troca', formatarDataHora(equipe.dataHoraFimTroca), 10); // <<< NOVO: Fim >>>
                if (equipe.tempoTroca) addWrappedText('- Tempo Indisp.', equipe.tempoTroca, 10); // <<< NOVO: Tempo >>>
            }
            // Implementos
            checkAddPage(30); doc.setFont(undefined, 'bold'); doc.text(`Implementos:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal');
            if (isAP) { /* ... materiais AP ... */ } else { /* ... materiais Vacuo ... */ } if (equipe.justificativa) addWrappedText('Justificativa Falta', equipe.justificativa, 10);
            // Segurança
            checkAddPage(15); doc.setFont(undefined, 'bold'); doc.text(`Segurança:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal'); addWrappedText('- Caixa Bloqueio', equipe.caixaBloqueio ?? 'N/A', 10); addWrappedText('- Cadeados', equipe.cadeados ?? 'N/A', 10); addWrappedText('- Plaquetas', equipe.plaquetas ?? 'N/A', 10);
            // Observações
            if (equipe.observacoes) { checkAddPage(15); doc.setFont(undefined, 'bold'); doc.text(`Observações:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal'); addWrappedText('', equipe.observacoes, 10); }
            y += lineHeight * 0.5; doc.setLineWidth(0.1); doc.line(margin, y, pageWidth - margin, y); y += lineHeight * 1.5;
        });
    }
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) { doc.setPage(i); let footerY = pageHeight - margin; doc.setLineWidth(0.2); doc.line(margin, footerY - smallLineHeight * 1.5, pageWidth - margin, footerY - smallLineHeight * 1.5); doc.setFontSize(8); doc.setFont(undefined, 'italic'); doc.text(`Sistema v${window.CONFIG?.VERSAO_APP || '3.1'}`, margin, footerY); doc.text(`Página ${i}/${pageCount}`, pageWidth - margin, footerY, { align: 'right' }); }
    // Salvar
    const sup = dadosTurnoPDF.supervisor || 'Sup'; const letra = dadosTurnoPDF.letra || 'X'; const dataFmt = formatarData(dadosTurnoPDF.data).replace(/\//g, '-');
    doc.save(`${sup}_${letra}_${dataFmt}.pdf`);
    mostrarNotificacao('PDF gerado com sucesso!', 'success');
}

/** Formatar WhatsApp de relatório existente (Local ou Servidor) */
async function formatarWhatsAppExistente(id, origem = 'servidor', apiAction = 'formatarWhatsApp') {
   if (!id) { mostrarNotificacao("ID inválido.", "danger"); return; }
   setOrigemNavegacao(window.AppState?.get('currentStep') || 'stepSucesso');
   mostrarLoading('Formatando para WhatsApp...');
   try {
     let textoWhatsApp = ''; let relatorioCompleto = null;
     if (origem === 'local') {
       relatorioCompleto = obterRelatorioLocal(id); if (!relatorioCompleto) throw new Error('Relatório local não encontrado.');
       textoWhatsApp = gerarTextoWhatsAppLocal(relatorioCompleto); // Usa a função que chama a principal
     } else {
       const result = await callAPI(apiAction, { turnoId: id });
       if (result && result.success && result.relatorio) { textoWhatsApp = result.relatorio; }
       else { throw new Error(result?.message || `Erro ao formatar (${apiAction}).`); }
     }
     if(window.AppState) AppState.update('ultimoRelatorioId', id); else ultimoRelatorioId = id;
     navegarParaEtapa('stepWhatsApp');
     const el = document.getElementById('whatsAppTexto'); if (el) el.textContent = textoWhatsApp;
     const btn = document.getElementById('btnVoltarWhatsApp'); if (btn) btn.onclick = voltarDoWhatsApp;
   } catch (error) { console.error('Erro ao formatar WhatsApp:', error); mostrarNotificacao('Erro: ' + error.message, 'danger'); }
   finally { ocultarLoading(); }
}

/** Gerar texto WhatsApp para relatório local (usa a função principal de formatação) */
function gerarTextoWhatsAppLocal(relatorio) {
  if (!relatorio || !relatorio.dadosTurno || !relatorio.equipes) { return 'Erro: Dados locais inválidos.'; }
  // A função formatarRelatorioParaCompartilhamentoFormal agora lida com ambos os formatos
  return formatarRelatorioParaCompartilhamentoFormal(relatorio.dadosTurno, relatorio.equipes);
}

/**
 * Formatar o relatório para compartilhamento (WhatsApp) - Versão Formal
 * ATUALIZADO: Inclui Data/Hora Fim e Tempo Troca (usa dados do GAS ou locais)
 */
function formatarRelatorioParaCompartilhamentoFormal(dadosTurno, equipes) {
  var texto = ""; const nl = "\n"; const sepPrincipal = "====================================" + nl; const sepSecao = "------------------------------------" + nl;
  if (!dadosTurno || !Array.isArray(equipes)) return "Erro: Dados inválidos.";

  // Função auxiliar para pegar campo (GAS ou Local)
  const getField = (eq, fieldGas, fieldLocal, defaultVal = 'N/A') => {
      let val = eq[fieldGas]; // Tenta GAS primeiro
      if (val !== undefined && val !== null && val !== '') return val;
      val = eq[fieldLocal]; // Tenta Local
      if (val !== undefined && val !== null && val !== '') return val;
      return defaultVal; // Retorna padrão
  }

  // Cabeçalho
  texto += "*RELATÓRIO DE TURNO - GPS MECANIZADA*" + nl + sepPrincipal + nl;
  texto += `*Data:* ${formatarData(getField(dadosTurno, 'Data', 'data'))}` + nl;
  texto += `*Horário:* ${getField(dadosTurno, 'Horário', 'horario')}` + nl;
  texto += `*Letra:* ${getField(dadosTurno, 'Letra', 'letra')}` + nl;
  texto += `*Supervisor:* ${getField(dadosTurno, 'Supervisor', 'supervisor')}` + nl + nl;

  // Agrupar equipes
  var equipesPorTipo = equipes.reduce((acc, eq) => { var tipo = getField(eq, 'Tipo_Equipe', 'tipo', 'Desconhecido'); if (!acc[tipo]) acc[tipo] = []; acc[tipo].push(eq); return acc; }, {});
  const ordemTipos = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo']; const tiposOrdenados = Object.keys(equipesPorTipo).sort((a, b) => (ordemTipos.indexOf(a) === -1 ? 99 : ordemTipos.indexOf(a)) - (ordemTipos.indexOf(b) === -1 ? 99 : ordemTipos.indexOf(b)));

  for (const tipo of tiposOrdenados) {
      const equipesDoTipo = equipesPorTipo[tipo];
      texto += `*EQUIPES ${tipo.toUpperCase()} (${equipesDoTipo.length})*` + nl + sepSecao + nl;
      equipesDoTipo.forEach((equipe, index) => {
          const vaga = getField(equipe, 'Vaga', 'vaga'); const vagaP = getField(equipe, 'Vaga_Personalizada', 'vagaPersonalizada', ''); let vagaD = vaga === 'OUTRA VAGA' ? vagaP : vaga;
          const equip = getField(equipe, 'Equipamento', 'equipamento'); const equipP = getField(equipe, 'Equipamento_Personalizada', 'equipamentoPersonalizado', ''); let equipD = equip === 'OUTRO EQUIPAMENTO' ? equipP : equip;
          const status = getField(equipe, 'StatusAtividade', 'statusAtividade', 'Concluído'); const pend = getField(equipe, 'Pendencia', 'pendencia', '');
          texto += `*Equipe ${index + 1}:* ${getField(equipe, 'Numero_Equipe', 'numero')}` + nl;
          texto += `  Motorista: ${getField(equipe, 'Motorista', 'motorista')}` + nl; texto += `  Operador(es): ${getField(equipe, 'Operadores', 'operadores')}` + nl; texto += `  Área: ${getField(equipe, 'Area', 'area')}` + nl; texto += `  Atividade: ${getField(equipe, 'Atividade', 'atividade')}` + nl;
          texto += `  Tipo Ativ.: ${getField(equipe, 'TipoAtividade', 'tipoAtividade', 'Rotineira')}` + nl; texto += `  Status: ${status}${pend && status !== 'Concluído' ? ` (${pend})` : ''}` + nl;
          texto += `  Vaga: ${vagaD || 'N/A'}` + nl; texto += `  Equipamento: ${equipD || 'N/A'}` + nl;
          const idUsiminas = getField(equipe, 'Identificacao_Usiminas', 'identificacaoUsiminas', ''); if (idUsiminas) texto += `  ID Usiminas: ${idUsiminas}` + nl;
          // Materiais
          if (tipo === 'Alta Pressão') { /* ... Lógica materiais AP ... */ } else if (tipo === 'Auto Vácuo / Hiper Vácuo') { /* ... Lógica materiais Vacuo ... */ }
          // Troca (com Fim e Tempo)
          const troca = getField(equipe, 'Troca_Equipamento', 'trocaEquipamento', 'Não');
          if (troca === 'Sim') {
              texto += nl + "  *Troca de Equipamento: Sim*" + nl;
              const motivo = getField(equipe, 'Motivo_Troca', 'motivoTroca', ''); const motivoO = getField(equipe, 'Motivo_Outro', 'motivoOutro', ''); let motivoD = (motivo === 'Outros Motivos (Justificar)' || motivo === 'Defeitos Em Geral (Justificar)') ? motivoO : motivo;
              texto += `    Motivo: ${motivoD || 'Não especificado'}` + nl;
              const defeito = getField(equipe, 'Defeito', 'defeito', ''); if (defeito) texto += `    Defeito/Medidas: ${defeito}` + nl;
              const placa = getField(equipe, 'Placa_Nova', 'placaNova', ''); if (placa) texto += `    Placa Nova: ${placa}` + nl;
              const inicioT = getField(equipe, 'Data_Hora_Troca', 'dataHoraTroca', ''); if (inicioT) texto += `    Início: ${formatarDataHora(inicioT)}` + nl;
              const fimT = getField(equipe, 'Data_Hora_Fim_Troca', 'dataHoraFimTroca', ''); if (fimT) texto += `    Fim: ${formatarDataHora(fimT)}` + nl; // <<< NOVO: Fim >>>
              const tempoT = getField(equipe, 'Tempo_Troca', '', ''); // Tenta pegar Tempo_Troca do GAS
              if (tempoT && !tempoT.includes('Erro') && !tempoT.includes('Ausente')) { texto += `    Tempo Indisp.: ${tempoT}` + nl; } // <<< NOVO: Tempo >>>
              else if (inicioT && fimT) { // Tenta calcular se Tempo_Troca não veio pronto (ex: relatório local)
                  try { const inicio = new Date(inicioT); const fim = new Date(fimT); if (!isNaN(inicio) && !isNaN(fim) && fim > inicio) { const dM = Math.round((fim-inicio)/60000); const h = Math.floor(dM/60); const m = dM%60; texto += `    Tempo Indisp.: ${h}h${m<10?'0':''}${m}min`+nl; } } catch(e){}
              }
          }
          // Observações
          const obs = getField(equipe, 'Observacoes', 'observacoes', ''); if (obs) texto += nl + `  *Observações:* ${obs}` + nl;
          texto += nl;
      });
  }
  // Rodapé
  texto += sepPrincipal + `Sistema v${window.CONFIG?.VERSAO_APP || '3.1'}`;
  return texto;
}

/** Voltar da pesquisa */
function voltarDaVisualizacaoParaPesquisa() { navegarParaEtapa('stepPesquisa'); }
function voltarDaPesquisa() { navegarParaEtapa('stepTurno'); atualizarIndicadoresEtapa(1); }


// ========== FUNÇÕES DE DASHBOARD ==========
function mostrarDashboard() {
  if (window.ModuleLoader && ModuleLoader.isInitialized('dashboard')) {
    const Dashboard = ModuleLoader.get('dashboard');
    if (Dashboard && typeof Dashboard.mostrarDashboard === 'function') Dashboard.mostrarDashboard();
    else { mostrarNotificacao('Erro ao carregar Dashboard.', 'danger'); voltarDoDashboard(); }
  } else {
    const instance = ModuleLoader.initialize('dashboard');
     if (instance && typeof instance.mostrarDashboard === 'function') instance.mostrarDashboard();
     else { mostrarNotificacao('Dashboard não disponível.', 'warning'); voltarDoDashboard(); }
  }
}
function voltarDoDashboard() { navegarParaEtapa('stepTurno'); atualizarIndicadoresEtapa(1); }
function mostrarHelp() { if (modalHelp) modalHelp.show(); else mostrarNotificacao("Ajuda não encontrada.", "warning"); }


// ========== FUNÇÕES UTILITÁRIAS ==========
/** Formatar data (DD/MM/YYYY) */
function formatarData(dataInput) {
  if (!dataInput) return 'N/A';
  try {
    let dataObj;
    if (dataInput instanceof Date) dataObj = dataInput;
    else { const dataStr = String(dataInput); if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) { const parts = dataStr.substring(0, 10).split('-'); dataObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))); } else if (dataStr.includes('/')) { const parts = dataStr.split('/'); if(parts.length === 3) dataObj = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))); else dataObj = new Date(dataStr); } else dataObj = new Date(dataStr); }
    if (isNaN(dataObj.getTime())) return String(dataInput);
    const dia = String(dataObj.getUTCDate()).padStart(2, '0'); const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); const ano = dataObj.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (e) { console.error("Erro formatarData:", dataInput, e); return String(dataInput); }
}
/** Formatar data e hora (DD/MM/YYYY HH:mm) */
function formatarDataHora(dataHoraInput) {
  if (!dataHoraInput) return 'N/A';
  try {
    let dataObj; if (dataHoraInput instanceof Date) dataObj = dataHoraInput; else dataObj = new Date(dataHoraInput);
    if (isNaN(dataObj.getTime())) return String(dataHoraInput);
    const dia = String(dataObj.getDate()).padStart(2, '0'); const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); const ano = dataObj.getFullYear(); const hora = String(dataObj.getHours()).padStart(2, '0'); const minutos = String(dataObj.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
  } catch (e) { console.error("Erro formatarDataHora:", dataHoraInput, e); return String(dataHoraInput); }
}


// --- Exportar funções para o escopo global (necessário para onclick no HTML) ---
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
window.salvarEquipe = salvarEquipe; // O listener do form agora chama esta
window.toggleVagaPersonalizada = toggleVagaPersonalizada;
window.toggleEquipamentoPersonalizado = toggleEquipamentoPersonalizado;
window.toggleTrocaEquipamento = toggleTrocaEquipamento;
window.toggleMotivoOutro = toggleMotivoOutro;
window.togglePendencia = togglePendencia;
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

// Flags para evitar múltiplos salvamentos
let salvandoEquipe = false;
let salvandoRelatorio = false;

// --- Inicializar listeners específicos do formulário após o carregamento inicial ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); // Garante que todos os listeners sejam adicionados
});
