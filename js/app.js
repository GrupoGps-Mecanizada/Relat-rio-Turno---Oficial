/**
 * Sistema de Relatório de Turno v3.2
 * Arquivo principal de lógica da aplicação (app.js)
 * ATUALIZADO para incluir Data/Hora FIM da Troca e validações associadas.
 * ATUALIZADO COM NOVAS FUNÇÕES DE TELA DE SUCESSO E CÓPIA.
 * ATUALIZADO para remover jQuery de visualizarRelatorioExistente e copiarRelatorioParaAreaDeTransferencia.
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
       // Adicionado para popular selects de Vaga e Equipamento no modal
       if (dadosFormulario.vagasAltaPressao) popularSelectOpcoes('equipeVaga', dadosFormulario.vagasAltaPressao); // Exemplo, ajustar conforme necessário
       if (dadosFormulario.equipamentosAltaPressao) popularSelectOpcoes('equipeEquipamento', dadosFormulario.equipamentosAltaPressao); // Exemplo, ajustar conforme necessário

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
      // Adicionado para popular selects de Vaga e Equipamento no modal (Fallback)
      popularSelectOpcoes('equipeVaga', CONFIG.OPCOES_FORMULARIO.vagasAltaPressao || ['OUTRA VAGA']); // Exemplo
      popularSelectOpcoes('equipeEquipamento', CONFIG.OPCOES_FORMULARIO.equipamentosAltaPressao || ['OUTRO EQUIPAMENTO']); // Exemplo


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
  // Se o primeiro não for placeholder, limpar tudo
  if (select.options.length === 1 && select.options[0].value !== "" && !select.options[0].disabled) {
      select.innerHTML = '<option value="" selected disabled>Selecione...</option>'; // Resetar com placeholder padrão
  } else if (select.options.length === 0) {
       select.innerHTML = '<option value="" selected disabled>Selecione...</option>'; // Garantir placeholder se vazio
  }


  // Criar conjunto para verificar duplicatas
  const valoresJaAdicionados = new Set();
  if (select.options.length > 0 && select.options[0].value === "") { // Considera o placeholder
    // Não adiciona o placeholder ao set para permitir que ele seja adicionado se vier nas opções
  } else if (select.options.length > 0) {
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
    // O onsubmit do form chama salvarEquipe (que chama a validação primeiro)
    formEquipe.addEventListener('submit', function handleFormEquipeSubmit(event) {
      event.preventDefault();
      event.stopPropagation();
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
    let primeiroErroFocado = false;

    function focarPrimeiroErro(elemento) {
        if (!primeiroErroFocado && elemento) {
            elemento.focus();
            primeiroErroFocado = true;
        }
    }

    // Vaga Personalizada
    const vagaSelect = document.getElementById('equipeVaga');
    const vagaPersonalizadaInput = document.getElementById('equipeVagaPersonalizada');
    if (vagaSelect && vagaSelect.value === 'OUTRA VAGA' && vagaPersonalizadaInput && !vagaPersonalizadaInput.value.trim()) {
        mostrarNotificacao('Por favor, especifique a "Outra Vaga".', 'warning');
        vagaPersonalizadaInput.classList.add('is-invalid');
        focarPrimeiroErro(vagaPersonalizadaInput);
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
        focarPrimeiroErro(equipPersonalizadoInput);
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
             focarPrimeiroErro(primeiroRadioMotivo);
            isValid = false;
        } else {
             if (motivoTrocaFeedback) motivoTrocaFeedback.style.display = 'none';
        }

        // Validação Motivo Outro
        if ((motivoTroca === 'Outros Motivos (Justificar)' || motivoTroca === 'Defeitos Em Geral (Justificar)') && motivoOutroInput && !motivoOutroInput.value.trim()) {
            mostrarNotificacao('Por favor, especifique o "Motivo" da troca.', 'warning');
            motivoOutroInput.classList.add('is-invalid');
             focarPrimeiroErro(motivoOutroInput);
            isValid = false;
        } else if (motivoOutroInput) {
             motivoOutroInput.classList.remove('is-invalid');
        }

        // Validação Defeito
        if (defeitoInput && !defeitoInput.value.trim()) {
            mostrarNotificacao('Por favor, descreva o defeito e as medidas tomadas para a troca.', 'warning');
            defeitoInput.classList.add('is-invalid');
             focarPrimeiroErro(defeitoInput);
            isValid = false;
        } else if (defeitoInput) {
            defeitoInput.classList.remove('is-invalid');
        }

        // <<< INÍCIO: Validação Data/Hora Fim >>>
        // Tornar Data/Hora FIM obrigatório se a troca for Sim
        if (dataHoraFimInput && !dataHoraFimInput.value) {
            mostrarNotificacao('Por favor, informe a Data/Hora de FIM da troca.', 'warning');
            dataHoraFimInput.classList.add('is-invalid');
            focarPrimeiroErro(dataHoraFimInput);
            isValid = false;
        } else if (dataHoraFimInput) {
            dataHoraFimInput.classList.remove('is-invalid'); // Limpa se preenchido

            // Opcional: Validar se FIM é maior que INÍCIO (somente se FIM foi preenchido)
            if (dataHoraInicioInput && dataHoraInicioInput.value && dataHoraFimInput.value) {
                 try {
                     const inicio = new Date(dataHoraInicioInput.value);
                     const fim = new Date(dataHoraFimInput.value);
                     // Adiciona uma pequena tolerância (1 minuto) para evitar problemas com segundos
                     if (fim.getTime() <= inicio.getTime()) {
                         mostrarNotificacao('A Data/Hora de FIM da troca deve ser posterior à Data/Hora de INÍCIO.', 'warning');
                         dataHoraFimInput.classList.add('is-invalid'); // Marca o campo FIM como inválido
                         focarPrimeiroErro(dataHoraFimInput);
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
        }
        // <<< FIM: Validação Data/Hora Fim >>>

    } // Fim if (trocaEquipamento === 'Sim')

    // Validação de Pendência (se Status não for Concluído)
    const statusSelect = document.getElementById('equipeStatusAtividade');
    const pendenciaInput = document.getElementById('equipePendencia');
    if (statusSelect && statusSelect.value !== 'Concluído' && pendenciaInput && !pendenciaInput.value.trim()) {
        mostrarNotificacao('Por favor, informe a justificativa/pendência para o status selecionado.', 'warning');
        pendenciaInput.classList.add('is-invalid');
        focarPrimeiroErro(pendenciaInput);
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
   if (window.Notifications && typeof window.Notifications.show === 'function') {
       window.Notifications.show(mensagem, tipo);
   } else {
       // Fallback para console e talvez um alert ou toast simples
       console.log(`[Notificação Fallback - ${tipo.toUpperCase()}] ${mensagem}`);
       // Tentar usar o Toast fallback do HTML
       const toastEl = document.getElementById('toastNotificacao');
       const toastBody = document.getElementById('toastTexto');
       if (toastEl && toastBody) {
           toastBody.textContent = mensagem;
           // Remover classes de cor antigas e adicionar a nova
           toastEl.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-info');
           toastEl.classList.add(`bg-${tipo}`); // Assume que tipo corresponde a classes bg-*
           const toast = new bootstrap.Toast(toastEl);
           toast.show();
       } else {
            alert(`${tipo.toUpperCase()}: ${mensagem}`); // Último recurso
       }
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
    // Tenta focar no primeiro campo inválido do formulário de turno
    const firstInvalid = formTurno.querySelector(':invalid');
    if (firstInvalid) { firstInvalid.focus(); }
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
     window.scrollTo(0, 0); // Rola para o topo ao mudar de etapa
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
            <div class="card mb-3 equipe-card-revisao ${borderClass}"> <!-- Classe CSS ajustada -->
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

                <!-- ======================= INÍCIO BLOCO ATUALIZADO ======================= -->
                ${equipe.trocaEquipamento === 'Sim' ? `
                <div class="alert alert-warning p-2 mt-2 mb-3"> <!-- Adicionado mt-2 mb-3 -->
                  <small>
                    <strong>Detalhes da Troca:</strong><br>
                    Motivo: ${motivoTrocaDisplay || 'N/A'}<br>
                    Defeito/Medidas: ${equipe.defeito || 'N/A'}<br>
                    ${equipe.placaNova ? `Nova Placa: ${equipe.placaNova}<br>` : ''}
                    ${equipe.dataHoraTroca ? `Início: ${formatarDataHora(equipe.dataHoraTroca)}<br>` : ''}
                    ${equipe.dataHoraFimTroca ? `Fim: ${formatarDataHora(equipe.dataHoraFimTroca)}` : ''} <!-- EXIBIÇÃO DO NOVO CAMPO -->
                  </small>
                </div>
                ` : ''}
                <!-- ======================= FIM BLOCO ATUALIZADO ========================= -->

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
    // Limpar todas as classes is-invalid que podem ter ficado
    formEquipe.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    // Resetar campos que não são resetados automaticamente (como divs ocultas e seus inputs)
    toggleVagaPersonalizada();
    toggleEquipamentoPersonalizado();
    toggleTrocaEquipamento(); // Este deve limpar os campos dentro de #trocaDetalhes
    toggleMotivoOutro();      // Garante que o campo outro esteja limpo e oculto
    togglePendencia();        // Garante que a pendência esteja limpa e oculta
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
  if (dadosFormulario) { // Verifica se dadosFormulario foi carregado
      const base = dadosFormulario;
      const vagas = isAltaPressao ? (base.vagasAltaPressao || []) : (base.vagasVacuo || []);
      const equipamentos = isAltaPressao ? (base.equipamentosAltaPressao || []) : (base.equipamentosVacuo || []);

      popularSelectOpcoes('equipeVaga', [...vagas, 'OUTRA VAGA']); // Garante que 'OUTRA VAGA' exista
      popularSelectOpcoes('equipeEquipamento', [...equipamentos, 'OUTRO EQUIPAMENTO']); // Garante que 'OUTRO EQUIPAMENTO' exista

      // Popula outros selects com dados globais
      popularSelectOpcoes('equipeLancesMangueira', base.opcoesLances || []);
      popularSelectOpcoes('equipeLancesVaretas', base.opcoesLances || []);
      popularSelectOpcoes('equipeMangotes3Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes4Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes6Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeCadeados', base.opcoesCadeadosPlaquetas || []);
      popularSelectOpcoes('equipePlaquetas', base.opcoesCadeadosPlaquetas || []);
      popularSelectOpcoes('equipeNumero', base.opcoesNumeroEquipe || []); // Popula Números/Nomes
  } else {
      mostrarNotificacao("Aviso: Dados de formulário não carregados, opções podem estar limitadas.", "warning");
      // Define opções mínimas de fallback
      popularSelectOpcoes('equipeVaga', ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', ['OUTRO EQUIPAMENTO']);
      popularSelectOpcoes('equipeNumero', []); // Fallback vazio para números
      // Zerar outros selects para evitar dados inconsistentes
      popularSelectOpcoes('equipeLancesMangueira', []); popularSelectOpcoes('equipeLancesVaretas', []);
      popularSelectOpcoes('equipeMangotes3Polegadas', []); popularSelectOpcoes('equipeMangotes4Polegadas', []); popularSelectOpcoes('equipeMangotes6Polegadas', []);
      popularSelectOpcoes('equipeCadeados', []); popularSelectOpcoes('equipePlaquetas', []);
  }

  // Definir automaticamente o próximo número de equipe disponível (ex: 'Equipe 1', 'Equipe 2')
  const equipesAtuais = window.AppState?.get('equipes') || equipes;
  let proximoNumero = "Equipe 1"; // Default
  // Lógica para encontrar o próximo número sequencial baseado nos existentes que seguem o padrão "Equipe N"
  const numerosExistentes = equipesAtuais
      .map(eq => eq.numero)
      .filter(numStr => numStr && numStr.startsWith("Equipe "))
      .map(numStr => parseInt(numStr.replace("Equipe ", ""), 10))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

  let proximoNumInt = 1;
  for (const num of numerosExistentes) {
      if (num === proximoNumInt) {
          proximoNumInt++;
      } else if (num > proximoNumInt) {
          break; // Encontrou uma lacuna
      }
  }
  proximoNumero = `Equipe ${proximoNumInt}`;


  // Selecionar automaticamente o próximo número disponível ou o primeiro da lista se o padrão não for encontrado
  const equipeNumeroSelect = document.getElementById('equipeNumero');
  if (equipeNumeroSelect) {
     const options = Array.from(equipeNumeroSelect.options);
     // Tenta encontrar a opção "Equipe N" calculada
     const proximaOpcao = options.find(opt => opt.value === proximoNumero);
     if (proximaOpcao) {
         equipeNumeroSelect.value = proximoNumero;
     } else if (options.length > 1) {
         // Se não encontrou "Equipe N", seleciona a primeira opção válida (não o placeholder)
         equipeNumeroSelect.selectedIndex = 1;
     } else {
         // Se só tem o placeholder, não faz nada ou adiciona a opção "Equipe N" se necessário
         // Poderia adicionar: if (!options.find(opt => opt.value === proximoNumero)) { equipeNumeroSelect.add(new Option(proximoNumero, proximoNumero)); equipeNumeroSelect.value = proximoNumero; }
     }
  }

  // Definir valores padrão para implementos como N/A ou o primeiro valor numérico (0)
  document.querySelectorAll('#materiaisAltaPressao select, #materiaisVacuo select').forEach(select => {
      if (select.options.length > 0) {
          const naoAplicavelOption = Array.from(select.options).find(opt => opt.value === 'N/A');
          if (naoAplicavelOption) {
              select.value = 'N/A';
          } else {
              // Se não tem N/A, seleciona o primeiro (provavelmente 0 para contagens)
              select.selectedIndex = 0;
          }
      }
  });
  // Define padrão para selects numéricos como 0
  ['equipeLancesMangueira', 'equipeLancesVaretas', 'equipeMangotes3Polegadas', 'equipeMangotes4Polegadas', 'equipeMangotes6Polegadas', 'equipeCadeados', 'equipePlaquetas'].forEach(id => {
       const sel = document.getElementById(id);
       if(sel && sel.options.length > 0 && sel.options[0].value !== "" ) { // Verifica se não é placeholder
           sel.value = "0"; // Assume que 0 é uma opção válida padrão
       } else if (sel) {
           sel.selectedIndex = 0; // Usa placeholder se existir
       }
  });

  // Definir padrões para outros campos
  const statusSelect = document.getElementById('equipeStatusAtividade'); if (statusSelect) statusSelect.value = 'Concluído';
  const tipoAtivSelect = document.getElementById('equipeTipoAtividade'); if (tipoAtivSelect) tipoAtivSelect.value = 'Rotineira';
  const caixaBloqueioNao = document.getElementById('caixaBloqueioNao'); if (caixaBloqueioNao) caixaBloqueioNao.checked = true;
  const trocaNao = document.getElementById('equipeTrocaNao'); if (trocaNao) trocaNao.checked = true;


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

  // Limpar formulário antes de preencher
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.reset();
    formEquipe.classList.remove('was-validated');
    formEquipe.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    // Resetar divs que podem ter ficado visíveis
    toggleVagaPersonalizada();
    toggleEquipamentoPersonalizado();
    toggleTrocaEquipamento();
    toggleMotivoOutro();
    togglePendencia();
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

  // Preencher selects principais (Vaga, Equipamento, etc.) dinamicamente
   if (dadosFormulario) { // Verifica se dadosFormulario foi carregado
      const base = dadosFormulario;
      const vagas = isAltaPressao ? (base.vagasAltaPressao || []) : (base.vagasVacuo || []);
      const equipamentos = isAltaPressao ? (base.equipamentosAltaPressao || []) : (base.equipamentosVacuo || []);

      popularSelectOpcoes('equipeVaga', [...vagas, 'OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', [...equipamentos, 'OUTRO EQUIPAMENTO']);
      popularSelectOpcoes('equipeNumero', base.opcoesNumeroEquipe || []); // Popula Números/Nomes
      // Popula outros selects com dados globais
      popularSelectOpcoes('equipeLancesMangueira', base.opcoesLances || []);
      popularSelectOpcoes('equipeLancesVaretas', base.opcoesLances || []);
      popularSelectOpcoes('equipeMangotes3Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes4Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeMangotes6Polegadas', base.opcoesMangotes || []);
      popularSelectOpcoes('equipeCadeados', base.opcoesCadeadosPlaquetas || []);
      popularSelectOpcoes('equipePlaquetas', base.opcoesCadeadosPlaquetas || []);
  } else {
       mostrarNotificacao("Aviso: Dados de formulário não carregados, opções podem estar limitadas.", "warning");
       // Define opções mínimas de fallback
       popularSelectOpcoes('equipeVaga', ['OUTRA VAGA']);
       popularSelectOpcoes('equipeEquipamento', ['OUTRO EQUIPAMENTO']);
       popularSelectOpcoes('equipeNumero', []); // Fallback vazio para números
  }

   // Adicionar opção específica salva se não estiver na lista padrão
    function addOptionIfNotExists(selectId, value, text) {
        const select = document.getElementById(selectId);
        if (select && value && !select.querySelector(`option[value="${value}"]`)) {
             // Adiciona apenas se o valor não for vazio e não existir
             if (value.trim() !== '') {
                select.add(new Option(text || value, value));
             }
        }
    }
    addOptionIfNotExists('equipeNumero', equipe.numero); // Garante que o número/nome da equipe exista
    addOptionIfNotExists('equipeVaga', equipe.vaga); // Garante que a vaga exista
    addOptionIfNotExists('equipeEquipamento', equipe.equipamento); // Garante que o equipamento exista


   // --- Preencher campos do formulário ---
    function setFieldValue(id, value) { const field = document.getElementById(id); if (field) field.value = value ?? ''; }
    function setSelectValue(id, value) { const field = document.getElementById(id); if (field) { field.value = value ?? ''; if(field.selectedIndex === -1) field.selectedIndex = 0; } } // Usa placeholder se valor nulo
    function setRadioValue(name, value) { const radio = document.querySelector(`input[name="${name}"][value="${value}"]`); if (radio) radio.checked = true; else { const firstRadio = document.querySelector(`input[name="${name}"]`); if(firstRadio) firstRadio.checked = true; } } // Marca o primeiro se valor não encontrado

    setSelectValue('equipeNumero', equipe.numero);
    setSelectValue('equipeTipoAtividade', equipe.tipoAtividade);
    setSelectValue('equipeStatusAtividade', equipe.statusAtividade);
    setFieldValue('equipePendencia', equipe.pendencia);
    togglePendencia(); // Mostra/oculta e aplica required se necessário
    setFieldValue('equipeMotorista', equipe.motorista);
    setFieldValue('equipeOperadores', equipe.operadores);
    setFieldValue('equipeArea', equipe.area);
    setFieldValue('equipeAtividade', equipe.atividade);
    setFieldValue('equipeIdentificacaoUsiminas', equipe.identificacaoUsiminas);

    // Vaga e Equipamento
    setSelectValue('equipeVaga', equipe.vaga);
    toggleVagaPersonalizada(); // Mostra/oculta e aplica required
    if (equipe.vaga === 'OUTRA VAGA') { setFieldValue('equipeVagaPersonalizada', equipe.vagaPersonalizada); }
    setSelectValue('equipeEquipamento', equipe.equipamento);
    toggleEquipamentoPersonalizado(); // Mostra/oculta e aplica required
    if (equipe.equipamento === 'OUTRO EQUIPAMENTO') { setFieldValue('equipeEquipamentoPersonalizado', equipe.equipamentoPersonalizado); }

    // Troca de equipamento
    setRadioValue('equipeTroca', equipe.trocaEquipamento || 'Não');
    toggleTrocaEquipamento(); // Mostra/oculta os detalhes e aplica required
    if (equipe.trocaEquipamento === 'Sim') {
        setRadioValue('equipeMotivoTroca', equipe.motivoTroca);
        toggleMotivoOutro(); // Mostra/oculta o campo "outro" e aplica required
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' || equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
            setFieldValue('equipeMotivoOutro', equipe.motivoOutro);
        }
        setFieldValue('equipeDefeito', equipe.defeito);
        setFieldValue('equipePlacaNova', equipe.placaNova);
        setFieldValue('equipeDataHoraTroca', equipe.dataHoraTroca);
        // ======================= PREENCHER CAMPO FIM =======================
        setFieldValue('equipeDataHoraFimTroca', equipe.dataHoraFimTroca);
        // ===================================================================
    }

    // Materiais (Usa ?? 'N/A' para selects e ?? '0' para numéricos como padrão se valor for null/undefined)
    if (isAltaPressao) {
        setSelectValue('equipePistola', equipe.materiais?.pistola ?? 'N/A');
        setSelectValue('equipePistolaCanoLongo', equipe.materiais?.pistolaCanoLongo ?? 'N/A');
        setSelectValue('equipeMangueiraTorpedo', equipe.materiais?.mangueiraTorpedo ?? 'N/A');
        setSelectValue('equipePedal', equipe.materiais?.pedal ?? 'N/A');
        setSelectValue('equipeVaretas', equipe.materiais?.varetas ?? 'N/A');
        setSelectValue('equipeRabicho', equipe.materiais?.rabicho ?? 'N/A');
        setSelectValue('equipeLancesMangueira', equipe.lancesMangueira ?? '0');
        setSelectValue('equipeLancesVaretas', equipe.lancesVaretas ?? '0');
    } else { // Vácuo / Hiper
        setSelectValue('equipeMangotes', equipe.materiaisVacuo?.mangotes ?? 'N/A');
        setSelectValue('equipeReducoes', equipe.materiaisVacuo?.reducoes ?? 'N/A');
        setSelectValue('equipeMangotes3Polegadas', equipe.mangotes3Polegadas ?? '0');
        setSelectValue('equipeMangotes4Polegadas', equipe.mangotes4Polegadas ?? '0');
        setSelectValue('equipeMangotes6Polegadas', equipe.mangotes6Polegadas ?? '0');
    }

    // Outros campos
    setFieldValue('equipeJustificativa', equipe.justificativa);
    setRadioValue('equipeCaixaBloqueio', equipe.caixaBloqueio || 'Não');
    setSelectValue('equipeCadeados', equipe.cadeados ?? '0');
    setSelectValue('equipePlaquetas', equipe.plaquetas ?? '0');
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

  if (confirm(`Tem certeza que deseja remover a equipe "${equipesAtuais[index].numero || `Equipe ${index + 1}`}"?`)) { // Mensagem de confirmação melhorada
    const novasEquipes = equipesAtuais.filter((_, i) => i !== index);
    if (window.AppState) {
      AppState.update('equipes', novasEquipes);
      // O listener do AppState deve chamar atualizarListaEquipes e atualizarBotaoAvancar
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

  // ** VALIDAÇÃO PRIMEIRO (Bootstrap + Condicional) **
  const bootstrapValido = formEquipe.checkValidity();
  const condicionalValido = validarCamposCondicionaisEquipe();

  if (!bootstrapValido || !condicionalValido) {
    formEquipe.classList.add('was-validated'); // Mostra erros visuais do Bootstrap
    salvandoEquipe = false; // Libera flag
    if (!bootstrapValido) {
        mostrarNotificacao('Por favor, preencha todos os campos obrigatórios marcados.', 'warning');
        // Foca no primeiro campo inválido do Bootstrap
        const firstInvalidBootstrap = formEquipe.querySelector(':invalid');
        if (firstInvalidBootstrap) { firstInvalidBootstrap.focus(); }
    }
    // A validação condicional já deve ter mostrado notificações específicas e focado o erro
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
    // ======================= INICIALIZA CAMPO FIM =======================
    dataHoraFimTroca: null
    // ===================================================================
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
    // ======================= LÊ O CAMPO FIM DO FORM =====================
    novaEquipe.dataHoraFimTroca = getFieldValue('equipeDataHoraFimTroca');
    // ====================================================================
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
    // O listener do AppState deve chamar atualizarListaEquipes e atualizarBotaoAvancar
  } else {
    equipes = equipesAtualizadas;
    atualizarListaEquipes();
    atualizarBotaoAvancar();
  }

  // Fechar modal
  if (modalEquipe) {
    modalEquipe.hide();
  }

  // Resetar flag de salvamento após um pequeno delay para permitir que o modal feche
  setTimeout(() => {
    salvandoEquipe = false;
  }, 300);
}


/**
 * Atualizar lista de equipes na UI (Etapa 2)
 */
function atualizarListaEquipes() {
  const listaEquipesDiv = document.getElementById('listaEquipes');
  const semEquipesDiv = document.getElementById('semEquipes');

  if (!listaEquipesDiv) return;

  const equipesAtuais = window.AppState?.get('equipes') || equipes;

  if (semEquipesDiv) {
    semEquipesDiv.style.display = equipesAtuais.length === 0 ? 'flex' : 'none'; // Usa flex para centralizar
  }

  // Limpar apenas os cards de equipe existentes
  listaEquipesDiv.querySelectorAll('.equipe-card').forEach(card => card.remove());

  equipesAtuais.forEach((equipe, index) => {
    const isAltaPressao = equipe.tipo === 'Alta Pressão';
    const cardClass = isAltaPressao ? 'equipe-card card border-primary' : 'equipe-card card equipe-vacuo border-danger';
    const badgeClass = isAltaPressao ? 'bg-primary' : 'bg-danger';
    const statusClass = equipe.statusAtividade === 'Concluído' ? 'text-success' : (equipe.statusAtividade === 'Em andamento' ? 'text-warning' : 'text-danger');
    const statusIcon = equipe.statusAtividade === 'Concluído' ? 'bi-check-circle-fill' : (equipe.statusAtividade === 'Em andamento' ? 'bi-arrow-repeat' : 'bi-exclamation-octagon-fill');

    const card = document.createElement('div');
    card.className = `${cardClass} mb-3 shadow-sm`; // Adiciona sombra leve

    card.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center py-2"> <!-- Reduz padding -->
        <h5 class="mb-0 fs-6">${equipe.numero || `Equipe ${index+1}`} <span class="badge ${badgeClass} ms-2">${equipe.tipo}</span></h5>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-outline-warning btn-action-sm" onclick="editarEquipe(${index})" title="Editar Equipe">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button type="button" class="btn btn-outline-danger btn-action-sm" onclick="removerEquipe(${index})" title="Remover Equipe">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </div>
      <div class="card-body p-2"> <!-- Reduz padding -->
        <small>
            <strong>Motorista:</strong> ${equipe.motorista || 'N/A'}<br>
            <strong>Operador(es):</strong> ${equipe.operadores || 'N/A'}<br>
            <strong>Área:</strong> ${equipe.area || 'N/A'}<br>
            <strong>Atividade:</strong> ${equipe.atividade || 'N/A'}<br>
            <strong class="${statusClass}"><i class="bi ${statusIcon} me-1"></i> Status:</strong> <span class="${statusClass}">${equipe.statusAtividade || 'Concluído'} ${equipe.pendencia ? `(${equipe.pendencia})` : ''}</span><br>
            <strong>Troca Equip.:</strong> ${equipe.trocaEquipamento || 'N/A'}
        </small>
      </div>
    `;

    // Adiciona o card antes da div #semEquipes (se ela existir) ou no final
    if (semEquipesDiv) {
        listaEquipesDiv.insertBefore(card, semEquipesDiv);
    } else {
        listaEquipesDiv.appendChild(card);
    }
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
        input.classList.remove('is-invalid'); // Remove validação se oculto
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
        input.classList.remove('is-invalid'); // Remove validação se oculto
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

    // Limpar campos e validações dentro de #trocaDetalhes se escondido
    detalhesDiv.querySelectorAll('input[type="text"], input[type="datetime-local"], textarea').forEach(el => {
        el.required = show && el.id !== 'equipePlacaNova'; // Torna obrigatório se visível (exceto placa)
        if (!show) {
            el.value = '';
            el.classList.remove('is-invalid'); // Remove validação visual
        }
    });
    // Limpar radios e feedback de motivo se escondido
    detalhesDiv.querySelectorAll('input[type="radio"][name="equipeMotivoTroca"]').forEach(radio => {
         radio.required = show; // Torna o grupo de radios obrigatório
         if (!show) radio.checked = false;
    });
    toggleMotivoOutro(); // Garante que o campo outro seja tratado
    const motivoFeedback = document.getElementById('motivoTrocaFeedback');
    if(motivoFeedback && !show) motivoFeedback.style.display = 'none';
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
  const motivoFeedback = document.getElementById('motivoTrocaFeedback'); // Para esconder o feedback geral

  // Esconde feedback geral se um motivo foi selecionado
  if (motivoFeedback && document.querySelector('input[name="equipeMotivoTroca"]:checked')) {
    motivoFeedback.style.display = 'none';
  }

  if (container && input) {
    const show = (motivoOutroRadio && motivoOutroRadio.checked) ||
                 (motivoDefeitosRadio && motivoDefeitosRadio.checked);
    container.style.display = show ? 'block' : 'none';
    input.required = show; // Torna obrigatório apenas se visível
    if (!show) {
      input.value = '';
      input.classList.remove('is-invalid'); // Remove validação se oculto
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
        pendenciaInput.required = show; // Torna obrigatório apenas se visível
        if (!show) {
            pendenciaInput.value = '';
            pendenciaInput.classList.remove('is-invalid'); // Remove validação se oculto
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

    // Validação mínima antes de salvar localmente
    if (equipesAtuais.length === 0) {
       mostrarNotificacao('Não é possível salvar localmente: Adicione pelo menos uma equipe.', 'warning'); return false;
    }
    if (!dadosTurnoAtual.data || !dadosTurnoAtual.horario || !dadosTurnoAtual.letra || !dadosTurnoAtual.supervisor) {
        mostrarNotificacao('Não é possível salvar localmente: Dados do turno incompletos.', 'warning'); return false;
    }

    const localId = 'local_' + new Date().getTime();
    const relatorio = { id: localId, dadosTurno: dadosTurnoAtual, equipes: equipesAtuais, timestamp: new Date().toISOString(), origem: 'local' };

    let relatoriosLocais = [];
    try {
      const relatoriosJson = localStorage.getItem('relatorios_locais');
      if (relatoriosJson) { relatoriosLocais = JSON.parse(relatoriosJson); if (!Array.isArray(relatoriosLocais)) relatoriosLocais = []; }
    } catch (e) { console.error('Erro ao carregar relatórios locais:', e); relatoriosLocais = []; }

    relatoriosLocais.push(relatorio);
    // Limitar o número de relatórios locais armazenados
    if(relatoriosLocais.length > (window.CONFIG?.MAX_LOCAL_REPORTS || 20)) {
         relatoriosLocais = relatoriosLocais.slice(relatoriosLocais.length - (window.CONFIG?.MAX_LOCAL_REPORTS || 20));
         console.log("Histórico local truncado para os últimos " + (window.CONFIG?.MAX_LOCAL_REPORTS || 20) + " relatórios.");
    }
    localStorage.setItem('relatorios_locais', JSON.stringify(relatoriosLocais));

    const idParaEstado = localId;
    if (window.AppState) { AppState.update('ultimoRelatorioId', idParaEstado); } else { ultimoRelatorioId = idParaEstado; }

    // Não mostra tela de sucesso aqui, pois é chamado como fallback
    mostrarNotificacao('Relatório salvo localmente com sucesso!', 'success');
    return true; // Indica sucesso no salvamento local
  } catch (error) {
    console.error('Erro ao salvar relatório localmente:', error);
    mostrarNotificacao('Erro ao salvar localmente: ' + error.message, 'danger');
    return false; // Indica falha no salvamento local
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

    // Validações antes de tentar salvar
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
        // Log detalhado do erro da API
        console.error("Falha ao salvar na API:", result);
        throw new Error(result?.message || 'Erro desconhecido ao salvar na API. Verifique o console para detalhes.');
      }
    } catch (apiError) {
      console.error('Erro ao salvar na API:', apiError);
      mostrarNotificacao('Falha ao salvar no servidor. Tentando salvar localmente...', 'warning');
      // Tenta salvar localmente como fallback
      if (salvarRelatorioLocal()) {
          idRelatorioSalvo = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId; // Pega o ID local gerado
          salvoLocalmente = true;
           // Notificação de sucesso local já foi mostrada por salvarRelatorioLocal
      } else {
        // Se falhar localmente também, lança um erro final
        throw new Error('Falha ao salvar remotamente e localmente. Verifique os dados e a conexão.');
      }
    }

    // Atualiza o ID do último relatório no estado, seja ele local ou do servidor
    if (idRelatorioSalvo) {
        if (window.AppState) AppState.update('ultimoRelatorioId', idRelatorioSalvo);
        else ultimoRelatorioId = idRelatorioSalvo;
    }
    // Mostra a tela de sucesso, indicando se foi salvo localmente ou não
     mostrarTelaSucesso(idRelatorioSalvo, salvoLocalmente); // Esta função agora chamará configurarBotoesSucesso
    return true;
  } catch (error) {
    console.error('Erro final ao salvar relatório:', error);
    mostrarNotificacao('Erro ao salvar relatório: ' + error.message, 'danger');
    return false;
  } finally {
    ocultarLoading();
    // Aumenta um pouco o delay para garantir que a UI atualize
    setTimeout(() => { salvandoRelatorio = false; }, 500);
  }
}

/**
 * Mostrar tela de sucesso e atualizar mensagem
 */
function mostrarTelaSucesso(idSalvo = null, foiLocal = false) {
  if (window.AppState) {
    AppState.update('currentStep', 'stepSucesso');
    AppState.update('ultimoRelatorioId', idSalvo);
  } else {
    ultimoRelatorioId = idSalvo; // Fallback para variável global
  }
  
  navegarParaEtapa('stepSucesso'); // Mantido para navegação visual

  // O resto da função permanece igual...
  const mensagemSucessoStatus = document.getElementById('mensagemSucessoStatus');
  if (mensagemSucessoStatus) {
      mensagemSucessoStatus.textContent = foiLocal
          ? `Relatório salvo localmente. ID: ${idSalvo || 'N/A'}`
          : `Relatório #${idSalvo || 'N/A'} registrado com sucesso no servidor!`;
      // Adiciona classe visual para diferenciar
      mensagemSucessoStatus.classList.toggle('text-warning', foiLocal);
      mensagemSucessoStatus.classList.toggle('text-success', !foiLocal);
  }

  // Resto da função...
  
  // Chame a função de configuração após renderizar a tela
  setTimeout(function() {
    configurarBotoesSucesso();
  }, 200);
}

/**
 * Função para configurar os botões da tela de sucesso
 * Esta função deve ser chamada quando a tela de sucesso é exibida
 */
function configurarBotoesSucesso() {
  console.log("Configurando botões da tela de sucesso...");
  
  const btnVisualizarEl = document.getElementById('btnVisualizar');
  const btnCopiarEl = document.getElementById('btnCopiar');
  const btnNovoEl = document.getElementById('btnNovo');

  if (!btnVisualizarEl && !btnCopiarEl && !btnNovoEl) {
    console.warn("Botões da tela de sucesso não encontrados.");
    return;
  }

  // Remover event listeners anteriores (versão sem jQuery)
  if (btnVisualizarEl) {
    const oldBtnVisualizar = btnVisualizarEl.cloneNode(true);
    if (btnVisualizarEl.parentNode) {
      btnVisualizarEl.parentNode.replaceChild(oldBtnVisualizar, btnVisualizarEl);
    }
  }
  
  if (btnCopiarEl) {
    const oldBtnCopiar = btnCopiarEl.cloneNode(true);
    if (btnCopiarEl.parentNode) {
      btnCopiarEl.parentNode.replaceChild(oldBtnCopiar, btnCopiarEl);
    }
  }
  
  if (btnNovoEl) {
    const oldBtnNovo = btnNovoEl.cloneNode(true);
    if (btnNovoEl.parentNode) {
      btnNovoEl.parentNode.replaceChild(oldBtnNovo, btnNovoEl);
    }
  }
  
  // É necessário pegar a referência dos botões NOVOS após o cloneNode
  const newBtnVisualizarEl = document.getElementById('btnVisualizar');
  const newBtnCopiarEl = document.getElementById('btnCopiar');
  const newBtnNovoEl = document.getElementById('btnNovo');
  
  const relatorioId = window.AppState ? AppState.get('ultimoRelatorioId') : window.ultimoRelatorioId;

  // Configurar o botão Visualizar
  if (newBtnVisualizarEl) {
    newBtnVisualizarEl.addEventListener('click', function() {
      console.log("Botão Visualizar clicado");
      if (relatorioId) {
        visualizarRelatorio();
      } else {
        mostrarNotificacao('ID do relatório não encontrado para visualização.', 'error');
      }
    });
    newBtnVisualizarEl.disabled = !relatorioId;
  }
  
  // Configurar o botão Copiar
  if (newBtnCopiarEl) {
    newBtnCopiarEl.addEventListener('click', function() {
      console.log("Botão Copiar clicado");
      if (relatorioId) {
        const origem = String(relatorioId).startsWith('local_') ? 'local' : 'servidor';
        setOrigemNavegacao('stepSucesso');
        visualizarRelatorioExistente(relatorioId, origem, 'gerarRelatorioTexto', true); // copiarAutomaticamente = true
      } else {
        mostrarNotificacao('ID do relatório não encontrado para cópia.', 'error');
      }
    });
    newBtnCopiarEl.disabled = !relatorioId;
  }
  
  // Configurar o botão Novo Relatório
  if (newBtnNovoEl) {
    newBtnNovoEl.addEventListener('click', function() {
      console.log("Botão Novo Relatório clicado");
      novoRelatorio();
    });
    newBtnNovoEl.disabled = false;
  }
  
  console.log("Botões da tela de sucesso configurados com sucesso!");
}

/**
 * Função para copiar o relatório visualizado para a área de transferência - VERSÃO SEM JQUERY
 */
function copiarRelatorioParaAreaDeTransferencia() {
  console.log("Tentando copiar relatório para área de transferência...");
  const relatorioTextEl = document.getElementById('relatorioTexto');
  const relatorioText = relatorioTextEl ? relatorioTextEl.textContent : '';
  
  if (!relatorioText || relatorioText.trim() === '') {
    mostrarNotificacao('Nenhum texto de relatório encontrado para copiar.', 'error');
    console.warn("Elemento #relatorioTexto não tem conteúdo ou não foi encontrado.");
    return;
  }
  
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = relatorioText;
  document.body.appendChild(tempTextArea);
  
  tempTextArea.select();
  let copiadoComSucesso = false;
  try {
    copiadoComSucesso = document.execCommand('copy');
  } catch (err) {
    console.error("Erro ao executar document.execCommand('copy'):", err);
    copiadoComSucesso = false;
  }
  
  document.body.removeChild(tempTextArea);
  
  if (copiadoComSucesso) {
    mostrarNotificacao('Relatório copiado para a área de transferência!', 'success');
    
    const dicaContainer = document.getElementById('dicaPosCopiaCont');
    if (dicaContainer) {
        dicaContainer.innerHTML = `
            <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle-fill me-2"></i> Relatório copiado! 
            <strong>Dica:</strong> Abra seu aplicativo de mensagens para colar o relatório.
            </div>
        `;
    } else {
        console.warn("#dicaPosCopiaCont não encontrado no DOM para exibir dica.");
    }
  } else {
    mostrarNotificacao('Falha ao copiar relatório. Tente manualmente (Ctrl+C).', 'error');
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
    // O listener do AppState deve chamar atualizarListaEquipes e atualizarBotaoAvancar
  } else {
      dadosTurno = {}; equipes = []; ultimoRelatorioId = null;
      atualizarListaEquipes(); atualizarBotaoAvancar();
  }

  // Limpar formulário de turno e validação
  const formTurno = document.getElementById('formTurno');
   if(formTurno) { formTurno.reset(); formTurno.classList.remove('was-validated'); }

  // Definir data atual como padrão
  const dataInput = document.getElementById('data');
  if (dataInput) {
    try {
      const today = new Date(); const offset = today.getTimezoneOffset() * 60000;
      dataInput.value = new Date(today.getTime() - offset).toISOString().split('T')[0];
    } catch (e) { console.error("Erro ao definir data padrão:", e); dataInput.value = ''; }
  }
  // Resetar selects do turno para placeholder
  ['horario', 'letra', 'supervisor'].forEach(id => {
      const sel = document.getElementById(id); if (sel) sel.selectedIndex = 0;
  });

  // Limpar lista de equipes na UI (caso não use AppState)
   if (!window.AppState) {
        const listaEquipesDiv = document.getElementById('listaEquipes');
        const semEquipesDiv = document.getElementById('semEquipes');
        if (listaEquipesDiv) listaEquipesDiv.querySelectorAll('.equipe-card').forEach(card => card.remove());
        if (semEquipesDiv) semEquipesDiv.style.display = 'flex';
        atualizarBotaoAvancar(); // Garante que o botão de avançar seja desabilitado
   }


  navegarParaEtapa('stepTurno');
  atualizarIndicadoresEtapa(1);
}

/**
 * Função auxiliar para gerenciar a navegação (armazenar de onde veio)
 */
function setOrigemNavegacao(origem) {
  if (window.AppState) { AppState.update('origemNavegacao', origem); }
  else { window.origemNavegacao = origem; }
}

/**
 * Função para obter origem da navegação
 */
function getOrigemNavegacao() {
  // Prioriza AppState se disponível
  return (window.AppState ? AppState.get('origemNavegacao') : window.origemNavegacao) || 'stepTurno'; // Fallback para stepTurno
}

/**
 * Função que determina para onde voltar (usada pelos botões "Voltar" das telas de visualização)
 */
function voltarParaTelaOrigem() {
  const origem = getOrigemNavegacao();
  // Se a origem for a tela de sucesso, volta para lá
  if (origem === 'stepSucesso') {
      voltarParaSucesso();
  }
  // Se a origem for a tela de pesquisa, volta para lá
  else if (origem === 'stepPesquisa') {
      voltarDaVisualizacaoParaPesquisa();
  }
  // Se a origem for a tela de dashboard (visualizando relatório de lá)
  else if (origem === 'dashboard') {
        voltarDoDashboard(); // Ou talvez para uma view específica do dashboard? Ajustar se necessário.
  }
  // Fallback: Volta para a tela de sucesso (pode acontecer se a origem não for definida corretamente)
  else {
      console.warn("Origem de navegação desconhecida ou não definida, voltando para tela de Sucesso como fallback.");
      voltarParaSucesso();
  }
}

/**
 * Visualizar relatório (usa ID salvo no estado da tela de Sucesso)
 */
async function visualizarRelatorio() {
  setOrigemNavegacao('stepSucesso'); // Define que veio da tela de sucesso
  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
  if (!idAtual) { mostrarNotificacao("ID do relatório não encontrado.", "warning"); return; }
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
  await visualizarRelatorioExistente(idAtual, origem, 'gerarRelatorioTexto', false); // copiarAutomaticamente é false
}

/**
 * Formatar relatório para WhatsApp (usa ID salvo no estado da tela de Sucesso)
 */
async function formatarWhatsApp() {
  setOrigemNavegacao('stepSucesso'); // Define que veio da tela de sucesso
  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
   if (!idAtual) { mostrarNotificacao("ID do relatório não encontrado.", "warning"); return; }
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
  await formatarWhatsAppExistente(idAtual, origem, 'formatarWhatsApp');
}

/**
 * Voltar para a tela de sucesso (vinda da visualização/whatsapp iniciados da tela de Sucesso)
 */
function voltarParaSucesso() {
    const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
    const origem = idAtual && String(idAtual).startsWith('local_') ? 'local' : (idAtual ? 'servidor' : null);
    mostrarTelaSucesso(idAtual, origem === 'local'); // Esta função chama configurarBotoesSucesso novamente
}

/**
 * Voltar da visualização do relatório ou WhatsApp para a tela de origem (função genérica chamada pelos botões)
 */
function voltarDoWhatsApp() { voltarParaTelaOrigem(); }
function voltarDoRelatorio() { voltarParaTelaOrigem(); }


/**
 * Copiar texto para a área de transferência (Função genérica)
 */
function copiarTextoParaClipboard(elementId, tipoTexto) {
  const elemento = document.getElementById(elementId);
  if (!elemento) { mostrarNotificacao(`Erro: Elemento ${elementId} não encontrado.`, "danger"); return; }
  // Usa textContent para <pre>, value para <textarea>/<input>
  const textoParaCopiar = elemento.textContent || elemento.value || '';

  if (!textoParaCopiar) {
    mostrarNotificacao(`Nenhum ${tipoTexto} para copiar.`, 'warning');
    return;
  }

  if (!navigator.clipboard) {
    // Fallback para navegadores antigos ou contextos inseguros
    try {
      const ta = document.createElement('textarea'); ta.value = textoParaCopiar;
      ta.style.position = 'absolute'; ta.style.left = '-9999px'; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      mostrarNotificacao(`${tipoTexto} copiado! (Método antigo)`, 'success');
    } catch (err) { console.error('Falha ao copiar (fallback):', err); mostrarNotificacao(`Não foi possível copiar automaticamente. Selecione e copie manualmente (Ctrl+C).`, 'warning'); }
    return;
  }
  // Método moderno (requer HTTPS ou localhost)
  navigator.clipboard.writeText(textoParaCopiar).then(() => {
    mostrarNotificacao(`${tipoTexto} copiado para a área de transferência!`, 'success');
  }).catch(err => { console.error(`Erro ao copiar ${tipoTexto}:`, err); mostrarNotificacao(`Falha ao copiar ${tipoTexto}. Verifique as permissões do navegador.`, 'danger'); });
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
  termoPesquisaInput.value = ''; // Limpa valor ao trocar tipo
  termoPesquisaInput.required = true; // Campo é sempre obrigatório

  switch (tipo) {
    case 'data': labelPesquisaLabel.textContent = 'Data (AAAA-MM-DD)'; termoPesquisaInput.type = 'date'; termoPesquisaInput.placeholder = ''; break;
    case 'mes_ano': labelPesquisaLabel.textContent = 'Mês/Ano (AAAA-MM)'; termoPesquisaInput.type = 'month'; termoPesquisaInput.placeholder = ''; break;
    case 'supervisor': labelPesquisaLabel.textContent = 'Nome do Supervisor'; termoPesquisaInput.type = 'text'; termoPesquisaInput.placeholder = 'Digite o nome'; break;
    case 'letra': labelPesquisaLabel.textContent = 'Letra do Turno'; termoPesquisaInput.type = 'text'; termoPesquisaInput.placeholder = 'A, B, C...'; termoPesquisaInput.maxLength = 1; break; // Limita a 1 caractere
    case 'local': labelPesquisaLabel.textContent = 'Pesquisar em Relatórios Locais'; termoPesquisaInput.type = 'search'; termoPesquisaInput.placeholder = 'Termo, data, supervisor...'; break; // Usa 'search' para UX
    case 'geral': // Termo Geral ou ID
    default: labelPesquisaLabel.textContent = 'Termo de Pesquisa ou ID'; termoPesquisaInput.type = 'search'; termoPesquisaInput.placeholder = 'Digite ID ou termo geral'; termoPesquisaInput.maxLength = 50; break; // Limita tamanho
  }
}

/** Executar pesquisa (API ou Local) */
async function executarPesquisa() {
  const formPesquisa = document.getElementById('formPesquisa');
  if (!formPesquisa.checkValidity()) {
      formPesquisa.classList.add('was-validated');
      mostrarNotificacao('Por favor, preencha o campo de pesquisa.', 'warning');
      const termoInput = document.getElementById('termoPesquisa');
      if(termoInput) termoInput.focus();
      return;
  }

  const tipoPesquisa = document.getElementById('tipoPesquisa').value; let termoPesquisa = document.getElementById('termoPesquisa').value;
  let termoParaAPI = termoPesquisa.trim();

  // Formatar Mês/Ano para MM/AAAA se necessário (ajustar se API esperar outro formato)
  if (tipoPesquisa === 'mes_ano' && /^\d{4}-\d{2}$/.test(termoParaAPI)) { const [ano, mes] = termoParaAPI.split('-'); termoParaAPI = `${mes}/${ano}`; }

  mostrarLoading('Pesquisando relatórios...');
  try {
    let resultados = [];
    if (tipoPesquisa === 'local') {
      resultados = pesquisarRelatoriosLocais(termoPesquisa.trim());
    } else {
      const result = await callAPI('pesquisarRelatorios', { termo: termoParaAPI, tipo: tipoPesquisa });
      if (result && result.success) {
          resultados = result.resultados || [];
          // Adiciona origem 'servidor' para cada resultado da API
          resultados.forEach(r => { r.origem = 'servidor'; });
       } else {
           console.error("Erro da API de pesquisa:", result);
           throw new Error(result?.message || 'Erro ao pesquisar no servidor.');
       }
    }
    exibirResultadosPesquisa(resultados);
    if(resultados.length === 0) {
        mostrarNotificacao('Nenhum relatório encontrado com os critérios informados.', 'info');
    } else {
        mostrarNotificacao(`${resultados.length} relatório(s) encontrado(s).`, 'success');
    }
  } catch (error) { console.error('Erro ao executar pesquisa:', error); mostrarNotificacao('Erro ao pesquisar: ' + error.message, 'danger'); exibirResultadosPesquisa([]); }
  finally { ocultarLoading(); }
}

/** Pesquisar relatórios salvos localmente */
function pesquisarRelatoriosLocais(termo) {
  let relatoriosLocais = [];
  try { const json = localStorage.getItem('relatorios_locais'); if (json) { relatoriosLocais = JSON.parse(json); if (!Array.isArray(relatoriosLocais)) relatoriosLocais = []; } }
  catch (e) { console.error('Erro ao carregar relatórios locais para pesquisa:', e); return []; }

  if (!termo) return []; // Retorna vazio se termo for vazio

  const termoLower = termo.toLowerCase();

  // Função auxiliar para verificar se um valor contém o termo
  const check = (v) => v && String(v).toLowerCase().includes(termoLower);

  return relatoriosLocais.filter(relatorio => {
    // Verifica ID, dados do turno e dados das equipes
    const { dadosTurno, equipes = [], id } = relatorio; if (!dadosTurno) return false;

    if (check(id)) return true;
    if (check(dadosTurno.letra)) return true;
    if (check(dadosTurno.supervisor)) return true;
    if (check(dadosTurno.data)) return true; // Verifica AAAA-MM-DD
    if (check(formatarData(dadosTurno.data))) return true; // Verifica DD/MM/AAAA
    if (check(dadosTurno.horario)) return true;

    // Verifica cada campo relevante dentro de cada equipe
    return equipes.some(eq =>
        check(eq.numero) || check(eq.motorista) || check(eq.operadores) || check(eq.area) || check(eq.atividade) || check(eq.tipoAtividade) || check(eq.statusAtividade) || check(eq.pendencia) || check(eq.vaga) || check(eq.vagaPersonalizada) || check(eq.equipamento) || check(eq.equipamentoPersonalizado) || check(eq.identificacaoUsiminas) || check(eq.motivoTroca) || check(eq.motivoOutro) || check(eq.defeito) || check(eq.placaNova) || check(eq.observacoes) || check(formatarDataHora(eq.dataHoraTroca)) || check(formatarDataHora(eq.dataHoraFimTroca)) // Inclui datas de troca formatadas
    );
  })
  // Mapeia para o formato esperado pela tabela de resultados
  .map(relatorio => ({
      id: relatorio.id,
      data: formatarData(relatorio.dadosTurno.data),
      horario: relatorio.dadosTurno.horario || 'N/A',
      letra: relatorio.dadosTurno.letra || 'N/A',
      supervisor: relatorio.dadosTurno.supervisor || 'N/A',
      origem: 'local'
  }))
  // Ordena por data decrescente (mais recente primeiro)
    .sort((a, b) => {
        try {
            let dA = a.data.split('/').reverse().join('-'); // Converte DD/MM/YYYY para YYYY-MM-DD
            let dB = b.data.split('/').reverse().join('-');
            return dB.localeCompare(dA); // Compara YYYY-MM-DD
        } catch (e) { return 0; } // Fallback se data inválida
    });
}


/** Exibir resultados da pesquisa na tabela */
function exibirResultadosPesquisa(resultados) {
  const resDiv = document.getElementById('resultadosPesquisa'); const tbody = document.getElementById('tabelaResultados'); const semResDiv = document.getElementById('semResultados');
  if (!resDiv || !tbody || !semResDiv) return;

  resDiv.style.display = 'block'; // Mostra a área de resultados
  semResDiv.style.display = (!resultados || resultados.length === 0) ? 'block' : 'none'; // Mostra/oculta mensagem "sem resultados"
  tbody.innerHTML = ''; // Limpa resultados anteriores

  if (resultados && resultados.length > 0) {
      resultados.forEach(r => {
        const linha = document.createElement('tr');
        const badgeClass = r.origem === 'local' ? 'bg-secondary' : 'bg-info text-dark'; // Badge para servidor com texto escuro
        const podePDF = r.origem === 'servidor'; // PDF só para servidor

        linha.innerHTML = `
          <td><span class="badge ${badgeClass}">${r.origem}</span></td>
          <td>${r.data || 'N/A'}</td>
          <td>${r.horario || 'N/A'}</td>
          <td>${r.letra || 'N/A'}</td>
          <td>${r.supervisor || 'N/A'}</td>
          <td class="text-center">
            <div class="action-buttons btn-group btn-group-sm" role="group" aria-label="Ações do Relatório">
              <button type="button" class="btn btn-primary btn-action-sm" onclick="visualizarRelatorioExistente('${r.id}', '${r.origem}', 'gerarRelatorioTexto', false)" title="Visualizar Relatório">
                <i class="bi bi-eye"></i> <span class="d-none d-md-inline">Ver</span>
              </button>
              <button type="button" class="btn btn-danger btn-action-sm" onclick="gerarPDFExistente('${r.id}', '${r.origem}')" title="${podePDF ? 'Gerar PDF' : 'PDF não disponível para relatórios locais'}" ${!podePDF ? 'disabled' : ''}>
                <i class="bi bi-file-pdf"></i> <span class="d-none d-md-inline">PDF</span>
              </button>
              <button type="button" class="btn btn-info text-white btn-action-sm" onclick="formatarWhatsAppExistente('${r.id}', '${r.origem}', 'formatarWhatsApp')" title="Formatar para WhatsApp">
                <i class="bi bi-whatsapp"></i> <span class="d-none d-md-inline">Zap</span>
              </button>
            </div>
          </td>`;
        tbody.appendChild(linha);
      });
  }
}

/**
 * Visualizar um relatório específico (local ou servidor) - VERSÃO SEM JQUERY
 */
async function visualizarRelatorioExistente(id, origem = 'servidor', apiAction = 'gerarRelatorioTexto', copiarAutomaticamente = false) {
  if (!id) { mostrarNotificacao("ID inválido.", "danger"); return; }
  // Armazena a etapa atual como origem para poder voltar
  if (getOrigemNavegacao() !== 'stepSucesso') {
    setOrigemNavegacao(window.AppState?.get('currentStep') || 'stepPesquisa');
  }
  
  mostrarLoading('Carregando relatório...');
  try {
    let textoRelatorio = ''; 
    let relatorioCompleto = null;
    
    if (origem === 'local') {
      relatorioCompleto = obterRelatorioLocal(id); 
      if (!relatorioCompleto) throw new Error('Relatório local não encontrado.');
      textoRelatorio = gerarTextoRelatorioLocal(relatorioCompleto);
    } else { // Origem 'servidor'
      const result = await callAPI(apiAction, { turnoId: id });
      if (result && result.success && result.relatorio) { 
        textoRelatorio = result.relatorio; 
      } else { 
        throw new Error(result?.message || `Erro ao buscar relatório do servidor (${apiAction}).`); 
      }
    }

    // Atualiza o ID do último relatório visualizado
    if (window.AppState) AppState.update('ultimoRelatorioIdVisualizado', id);

    navegarParaEtapa('stepRelatorio');
    
    const elRelatorioTexto = document.getElementById('relatorioTexto'); 
    if (elRelatorioTexto) {
        elRelatorioTexto.textContent = textoRelatorio;
        
        // Limpa dica de cópia anterior ao visualizar novo relatório
        const dicaContainer = document.getElementById('dicaPosCopiaCont');
        if (dicaContainer) dicaContainer.innerHTML = '';
    }
    
    const btnVoltar = document.getElementById('btnVoltarRelatorio'); 
    if (btnVoltar) btnVoltar.onclick = voltarDoRelatorio;

    // Após mostrar o relatório, copiar se solicitado
    if (copiarAutomaticamente) {
      setTimeout(function() {
        copiarRelatorioParaAreaDeTransferencia();
      }, 500);
    }

  } catch (error) { 
      console.error('Erro ao visualizar relatório:', error); 
      mostrarNotificacao('Erro ao carregar relatório: ' + error.message, 'danger'); 
      if (getOrigemNavegacao() === 'stepSucesso') {
          voltarParaSucesso();
      }
  } finally { 
      ocultarLoading(); 
  }
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

  // Ordenar tipos (Alta Pressão primeiro, depois Vácuo/Hiper)
  const ordemTipos = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo'];
  const tiposOrdenados = Object.keys(equipesPorTipo).sort((a, b) => {
      const indexA = ordemTipos.indexOf(a);
      const indexB = ordemTipos.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b); // Alfabético para tipos desconhecidos
      if (indexA === -1) return 1; // Desconhecidos no final
      if (indexB === -1) return -1; // Desconhecidos no final
      return indexA - indexB; // Ordena pela ordem definida
  });


  for (const tipo of tiposOrdenados) {
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
        // ======================= EXIBE FIM DA TROCA =======================
        if (equipe.dataHoraFimTroca) texto += `  - Fim Troca: ${formatarDataHora(equipe.dataHoraFimTroca)}\n`;
        // ==================================================================
        // Tenta calcular tempo para exibição local
        if (equipe.dataHoraTroca && equipe.dataHoraFimTroca) {
            try {
                const inicio = new Date(equipe.dataHoraTroca); const fim = new Date(equipe.dataHoraFimTroca);
                if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime()) && fim > inicio) {
                   const diffMins = Math.round((fim - inicio) / 60000); const h = Math.floor(diffMins / 60); const m = diffMins % 60;
                   // ======================= EXIBE TEMPO CALCULADO ====================
                   texto += `  - Tempo Indisp.: ${h}h${m < 10 ? '0' : ''}${m}min\n`;
                   // ==================================================================
                }
            } catch(e) { console.warn("Erro ao calcular tempo de troca local:", e); }
        }
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
      } else { // Vácuo / Hiper
         texto += `  - Mangotes: ${equipe.materiaisVacuo?.mangotes ?? 'N/A'}\n`;
         texto += `  - Reduções: ${equipe.materiaisVacuo?.reducoes ?? 'N/A'}\n`;
         texto += `  - Mangotes 3": ${equipe.mangotes3Polegadas ?? 'N/A'}\n`;
         texto += `  - Mangotes 4": ${equipe.mangotes4Polegadas ?? 'N/A'}\n`;
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
  texto += `Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.2'} (Relatório Local)\n`; // Versão Atualizada
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
     const result = await callAPI('obterDadosRelatorio', { turnoId: id }); // Chama API para obter dados brutos
     if (result && result.success && result.dadosTurno && result.equipes) {
         // Mapeia os dados brutos da API para a estrutura JS esperada
         dadosParaPDF.dadosTurno = mapearChavesObjeto(result.dadosTurno, {
              'ID': 'id', 'Data': 'data', 'Horário': 'horario', 'Letra': 'letra', 'Supervisor': 'supervisor', 'Timestamp': 'timestamp', 'Status': 'status', 'UltimaModificacao': 'ultimaModificacao'
         });
         dadosParaPDF.equipes = result.equipes.map(eq => mapearChavesObjeto(eq, {
              'Turno_ID': 'turnoId', 'Tipo_Equipe': 'tipo', 'Numero_Equipe': 'numero', 'Integrantes': 'integrantes', 'Motorista': 'motorista', 'Operadores': 'operadores', 'Area': 'area', 'Atividade': 'atividade',
              'TipoAtividade': 'tipoAtividade', 'StatusAtividade': 'statusAtividade', 'Pendencia': 'pendencia',
              'Vaga': 'vaga', 'Vaga_Personalizada': 'vagaPersonalizada', 'Equipamento': 'equipamento', 'Equipamento_Personalizada': 'equipamentoPersonalizado', 'Identificacao_Usiminas': 'identificacaoUsiminas', 'Troca_Equipamento': 'trocaEquipamento', 'Motivo_Troca': 'motivoTroca', 'Motivo_Outro': 'motivoOutro', 'Defeito': 'defeito', 'Placa_Nova': 'placaNova',
              // ======================= MAPEAMENTO CAMPOS NOVOS =======================
              'Data_Hora_Troca': 'dataHoraTroca',          // Início (já existia)
              'Data_Hora_Fim_Troca': 'dataHoraFimTroca',    // Fim da Troca
              'Tempo_Troca': 'tempoTroca',                  // Tempo calculado (string do GAS)
              // ========================================================================
              // Materiais AP
              'Pistola': 'pistola', 'Pistola_Cano_Longo': 'pistolaCanoLongo', 'Mangueira_Torpedo': 'mangueiraTorpedo', 'Pedal': 'pedal', 'Varetas': 'varetas', 'Rabicho': 'rabicho', 'Lances_Mangueira': 'lancesMangueira', 'Lances_Varetas': 'lancesVaretas',
              // Materiais Vacuo
              'Mangotes': 'mangotes', 'Reducoes': 'reducoes', 'Mangotes_3_Polegadas': 'mangotes3Polegadas', 'Mangotes_4_Polegadas': 'mangotes4Polegadas', 'Mangotes_6_Polegadas': 'mangotes6Polegadas',
              // Segurança e Obs
              'Justificativa': 'justificativa', 'Caixa_Bloqueio': 'caixaBloqueio', 'Cadeados': 'cadeados', 'Plaquetas': 'plaquetas', 'Observacoes': 'observacoes'
         }));
          // Agrupa materiais dentro de cada equipe após mapeamento
          dadosParaPDF.equipes.forEach(eq => {
              if(eq.tipo === 'Alta Pressão') { eq.materiais = { pistola: eq.pistola, pistolaCanoLongo: eq.pistolaCanoLongo, mangueiraTorpedo: eq.mangueiraTorpedo, pedal: eq.pedal, varetas: eq.varetas, rabicho: eq.rabicho }; }
              else { eq.materiaisVacuo = { mangotes: eq.mangotes, reducoes: eq.reducoes }; }
               // Remove chaves individuais de material se agrupadas (opcional, para limpar)
              delete eq.pistola; delete eq.pistolaCanoLongo; // ...etc para AP e Vácuo
              delete eq.mangotes; delete eq.reducoes;
          });
          // Chama a função que realmente gera o PDF com os dados mapeados
          await gerarPDF(dadosParaPDF.dadosTurno, dadosParaPDF.equipes, id);
     } else {
         console.error("Erro ao obter dados para PDF:", result);
         throw new Error(result?.message || 'Erro ao buscar dados do relatório para gerar PDF.');
      }
  } catch (error) { console.error('Erro ao gerar PDF:', error); mostrarNotificacao('Erro ao gerar PDF: ' + error.message, 'danger'); }
  finally { ocultarLoading(); }
}

/** Função auxiliar para mapear chaves de um objeto (case-insensitive opcional) */
function mapearChavesObjeto(obj, mapa, caseInsensitive = false) {
    if (!obj) return {}; const novoObj = {};
    const mapaLookup = caseInsensitive ? new Map(Object.entries(mapa).map(([k, v]) => [k.toLowerCase(), v])) : new Map(Object.entries(mapa));

    for (const chaveOriginal in obj) {
        if (Object.hasOwnProperty.call(obj, chaveOriginal)) {
            const chaveLookup = caseInsensitive ? chaveOriginal.toLowerCase() : chaveOriginal;
            const chaveJsMapeada = mapaLookup.get(chaveLookup);
            // Usa a chave mapeada se existir, senão usa a original convertida para camelCase (tentativa)
            const chaveFinal = chaveJsMapeada !== undefined ? chaveJsMapeada
                             : chaveOriginal.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase()); // Converte snake_case para camelCase
            novoObj[chaveFinal] = obj[chaveOriginal];
        }
    }
    // Garante que todas as chaves esperadas no mapa existam no novo objeto (com valor null se ausente)
    Object.values(mapa).forEach(chaveJsEsperada => { if (novoObj[chaveJsEsperada] === undefined) novoObj[chaveJsEsperada] = null; });
    return novoObj;
}

/**
 * Gerar PDF (Função auxiliar, precisa da biblioteca jsPDF)
 * ATUALIZADO: Inclui Data/Hora Fim e Tempo Troca
 */
async function gerarPDF(dadosTurnoPDF, equipesPDF, relatorioId) {
    if (!window.jspdf || !window.jspdf.jsPDF) { mostrarNotificacao('Erro: Biblioteca jsPDF não carregada.', 'danger'); return; }
    if (!dadosTurnoPDF || !equipesPDF) { mostrarNotificacao('Erro: Dados insuficientes para gerar PDF.', 'danger'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let y = 15; // Posição Y inicial
    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 5;       // Altura de linha padrão
    const smallLineHeight = 4;  // Altura de linha menor

    /** Adiciona texto com quebra de linha automática */
    const addWrappedText = (label, value, indent = 5, isBold = false, fontSize = 9) => {
      if (value === null || value === undefined || String(value).trim() === '') value = 'N/A'; // Trata nulos e vazios
      const fullText = `${label ? label + ': ' : ''}${String(value).trim()}`;
      const textWidth = contentWidth - indent - (label ? margin : 0); // Ajusta largura

      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');

      const lines = doc.splitTextToSize(fullText, textWidth);
      checkAddPage(lines.length * (fontSize / 2.5)); // Estima altura baseada no tamanho da fonte
      doc.text(lines, margin + indent, y);
      y += lines.length * (fontSize / 2.5); // Avança Y baseado no número de linhas e tamanho
      doc.setFont(undefined, 'normal'); // Reseta estilo
    };

    /** Verifica se precisa adicionar nova página */
    function checkAddPage(alturaNecessaria = 20) {
      if (y + alturaNecessaria > pageHeight - margin) { // Verifica se conteúdo cabe
        doc.addPage();
        y = margin; // Reseta Y para margem superior
        // Adicionar cabeçalho/rodapé repetido se necessário aqui
      }
    }

    // --- Desenhar PDF ---

    // Cabeçalho da Página
    doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.text("RELATÓRIO DE TURNO", pageWidth / 2, y, { align: 'center' }); y += lineHeight * 1.5;
    doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.text("GRUPO GPS - MECANIZADA", pageWidth / 2, y, { align: 'center' }); y += lineHeight * 2;

    // Informações Gerais do Turno
    doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text("INFORMAÇÕES GERAIS", margin, y); y += lineHeight * 0.8; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += lineHeight * 1.2;
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text(`Data: ${formatarData(dadosTurnoPDF.data)}`, margin, y); doc.text(`Horário: ${dadosTurnoPDF.horario || 'N/A'}`, margin + 70, y); y += lineHeight;
    doc.text(`Letra: ${dadosTurnoPDF.letra || 'N/A'}`, margin, y); doc.text(`Supervisor: ${dadosTurnoPDF.supervisor || 'N/A'}`, margin + 70, y); y += lineHeight;
    doc.text(`ID Relatório: ${relatorioId || 'N/A'}`, margin, y);
    if (dadosTurnoPDF.timestamp) doc.text(`Gerado em: ${formatarDataHora(dadosTurnoPDF.timestamp)}`, margin + 70, y); y += lineHeight * 1.5;

    // Detalhes das Equipes
    const equipesPorTipo = equipesPDF.reduce((acc, eq) => { const tipo = eq.tipo || 'Outro'; if (!acc[tipo]) acc[tipo] = []; acc[tipo].push(eq); return acc; }, {});
    const ordemTiposPDF = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo']; // Ordem desejada
    const tiposOrdenadosPDF = Object.keys(equipesPorTipo).sort((a, b) => { const idxA = ordemTiposPDF.indexOf(a); const idxB = ordemTiposPDF.indexOf(b); if(idxA===-1 && idxB===-1) return a.localeCompare(b); if(idxA===-1) return 1; if(idxB===-1) return -1; return idxA - idxB; });

     for (const tipo of tiposOrdenadosPDF) {
        checkAddPage(30); // Espaço para título da seção
        doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text(`EQUIPES ${tipo.toUpperCase()} (${equipesPorTipo[tipo].length})`, margin, y); y += lineHeight * 0.8; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += lineHeight * 1.2;

        equipesPorTipo[tipo].forEach((equipe, index) => {
            checkAddPage(100); // Estimativa de altura por equipe (ajustar conforme necessário)
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.text(`Equipe ${index + 1}: ${equipe.numero || 'N/A'}`, margin, y); y += lineHeight * 1.2;
            doc.setFontSize(9); doc.setFont(undefined, 'normal');

            const vagaDisp = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga; const equipDisp = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
            const motivoTrocaDisp = (equipe.motivoTroca === 'Outros Motivos (Justificar)' || equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') ? equipe.motivoOutro : equipe.motivoTroca; const isAP = equipe.tipo === 'Alta Pressão';

            addWrappedText('Motorista', equipe.motorista, 5); addWrappedText('Operador(es)', equipe.operadores, 5); addWrappedText('Área', equipe.area, 5); addWrappedText('Atividade', equipe.atividade, 5);
            addWrappedText('Tipo Atividade', equipe.tipoAtividade || 'Rotineira', 5, true); addWrappedText('Status', equipe.statusAtividade || 'Concluído', 5, true); if (equipe.statusAtividade !== 'Concluído' && equipe.pendencia) addWrappedText('Pendência', equipe.pendencia, 10);
            addWrappedText('Vaga', vagaDisp, 5); addWrappedText('Equipamento', equipDisp, 5); if (equipe.identificacaoUsiminas) addWrappedText('ID Usiminas', equipe.identificacaoUsiminas, 5);

            // Troca (com Fim e Tempo)
            checkAddPage(30); // Mais espaço para detalhes da troca
            addWrappedText('Troca Equip.', equipe.trocaEquipamento || 'Não', 5, true);
            if (equipe.trocaEquipamento === 'Sim') {
                addWrappedText('Motivo', motivoTrocaDisp || 'N/A', 10); addWrappedText('Defeito/Medidas', equipe.defeito || 'N/A', 10);
                if (equipe.placaNova) addWrappedText('Placa Nova', equipe.placaNova, 10);
                if (equipe.dataHoraTroca) addWrappedText('Início Troca', formatarDataHora(equipe.dataHoraTroca), 10);
                // ======================= ADICIONA FIM E TEMPO AO PDF =======================
                if (equipe.dataHoraFimTroca) addWrappedText('Fim Troca', formatarDataHora(equipe.dataHoraFimTroca), 10);
                if (equipe.tempoTroca && !equipe.tempoTroca.includes('Erro') && !equipe.tempoTroca.includes('Ausente')) addWrappedText('Tempo Indisp.', equipe.tempoTroca, 10);
                 // Poderia adicionar cálculo local como fallback se tempoTroca for nulo/inválido e as datas existirem
                // =========================================================================
            }

            // Implementos
            checkAddPage(35); // Espaço para implementos
            doc.setFont(undefined, 'bold'); doc.text(`Implementos:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal');
            if (isAP && equipe.materiais) {
                addWrappedText('- Pistola', equipe.materiais.pistola ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Pistola C.L.', equipe.materiais.pistolaCanoLongo ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Mang. Torpedo', equipe.materiais.mangueiraTorpedo ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Pedal', equipe.materiais.pedal ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Varetas', equipe.materiais.varetas ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Rabicho', equipe.materiais.rabicho ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Lances Mang.', equipe.lancesMangueira ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Lances Var.', equipe.lancesVaretas ?? 'N/A', 10, false, smallLineHeight);
            } else if (!isAP && equipe.materiaisVacuo) {
                addWrappedText('- Mangotes', equipe.materiaisVacuo.mangotes ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Reduções', equipe.materiaisVacuo.reducoes ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Mangotes 3"', equipe.mangotes3Polegadas ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Mangotes 4"', equipe.mangotes4Polegadas ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Mangotes 6"', equipe.mangotes6Polegadas ?? 'N/A', 10, false, smallLineHeight);
            }
            if (equipe.justificativa) addWrappedText('Justificativa Falta', equipe.justificativa, 10, false, smallLineHeight);

            // Segurança
            checkAddPage(20); // Espaço para segurança
            doc.setFont(undefined, 'bold'); doc.text(`Segurança:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal');
            addWrappedText('- Caixa Bloqueio', equipe.caixaBloqueio ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Cadeados', equipe.cadeados ?? 'N/A', 10, false, smallLineHeight); addWrappedText('- Plaquetas', equipe.plaquetas ?? 'N/A', 10, false, smallLineHeight);

            // Observações
            if (equipe.observacoes) { checkAddPage(15); doc.setFont(undefined, 'bold'); doc.text(`Observações:`, margin + 5, y); y += lineHeight; doc.setFont(undefined, 'normal'); addWrappedText('', equipe.observacoes, 10); }

            y += lineHeight * 0.5; // Pequeno espaço antes da linha
            doc.setLineWidth(0.1); doc.line(margin, y, pageWidth - margin, y); y += lineHeight * 1.5; // Espaço após a linha
        });
    }

    // Rodapé em todas as páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        let footerY = pageHeight - margin / 2; // Posição do rodapé
        // Linha acima do rodapé
        doc.setLineWidth(0.2); doc.line(margin, footerY - smallLineHeight * 1.5, pageWidth - margin, footerY - smallLineHeight * 1.5);
        doc.setFontSize(8); doc.setFont(undefined, 'italic');
        // Texto do rodapé
        doc.text(`Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.2'}`, margin, footerY); // Versão Atualizada
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
    }

    // Salvar o PDF
    const sup = (dadosTurnoPDF.supervisor || 'Sup').replace(/[^a-z0-9]/gi, '_'); // Limpa nome supervisor
    const letra = dadosTurnoPDF.letra || 'X';
    const dataFmt = formatarData(dadosTurnoPDF.data).replace(/\//g, '-') || 'data'; // Formata data
    const nomeArquivo = `Relatorio_${sup}_${letra}_${dataFmt}.pdf`;

    doc.save(nomeArquivo);
    mostrarNotificacao('PDF gerado com sucesso!', 'success');
}

/** Formatar WhatsApp de relatório existente (Local ou Servidor) */
async function formatarWhatsAppExistente(id, origem = 'servidor', apiAction = 'formatarWhatsApp') {
   if (!id) { mostrarNotificacao("ID inválido.", "danger"); return; }
   setOrigemNavegacao(window.AppState?.get('currentStep') || 'stepPesquisa'); // Assume origem da pesquisa
   mostrarLoading('Formatando para WhatsApp...');
   try {
     let textoWhatsApp = ''; let relatorioCompleto = null;
     if (origem === 'local') {
       relatorioCompleto = obterRelatorioLocal(id); if (!relatorioCompleto) throw new Error('Relatório local não encontrado.');
       // Usa a função principal de formatação com os dados locais
       textoWhatsApp = formatarRelatorioParaCompartilhamentoFormal(relatorioCompleto.dadosTurno, relatorioCompleto.equipes);
     } else { // Origem 'servidor'
       const result = await callAPI(apiAction, { turnoId: id }); // API já retorna formatado
       if (result && result.success && result.relatorio) { textoWhatsApp = result.relatorio; }
       else { throw new Error(result?.message || `Erro ao formatar WhatsApp via API (${apiAction}).`); }
     }

     if(window.AppState) AppState.update('ultimoRelatorioIdVisualizado', id); // Atualiza último ID visualizado

     navegarParaEtapa('stepWhatsApp');
     const el = document.getElementById('whatsAppTexto'); if (el) el.textContent = textoWhatsApp;
     const btn = document.getElementById('btnVoltarWhatsApp'); if (btn) btn.onclick = voltarDoWhatsApp;
   } catch (error) { console.error('Erro ao formatar WhatsApp:', error); mostrarNotificacao('Erro ao formatar para WhatsApp: ' + error.message, 'danger'); }
   finally { ocultarLoading(); }
}

/** Gerar texto WhatsApp para relatório local (usa a função principal de formatação) */
function gerarTextoWhatsAppLocal(relatorio) {
  if (!relatorio || !relatorio.dadosTurno || !relatorio.equipes) { return 'Erro: Dados locais inválidos para formatação WhatsApp.'; }
  // Reutiliza a função principal de formatação
  return formatarRelatorioParaCompartilhamentoFormal(relatorio.dadosTurno, relatorio.equipes);
}

/**
 * Formatar o relatório para compartilhamento (WhatsApp) - Versão Formal
 * ATUALIZADO: Inclui Data/Hora Fim e Tempo Troca (usa dados do GAS ou locais)
 */
function formatarRelatorioParaCompartilhamentoFormal(dadosTurno, equipes) {
  var texto = ""; const nl = "\n"; const sepPrincipal = "====================================" + nl; const sepSecao = "------------------------------------" + nl;
  if (!dadosTurno || !Array.isArray(equipes)) return "Erro: Dados inválidos para formatação WhatsApp.";

  // Função auxiliar para pegar campo (prioriza GAS, depois Local)
  const getField = (obj, fieldGas, fieldLocal, defaultVal = 'N/A') => {
      let val = obj[fieldGas]; // Tenta chave GAS (se obj for do GAS)
      if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      val = obj[fieldLocal]; // Tenta chave Local (se obj for local ou GAS falhou)
      if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      return defaultVal; // Retorna padrão se ambos falharem ou forem vazios
  }

  // Cabeçalho
  texto += "*RELATÓRIO DE TURNO - GPS MECANIZADA*" + nl + sepPrincipal + nl;
  texto += `*Data:* ${formatarData(getField(dadosTurno, 'Data', 'data'))}` + nl;
  texto += `*Horário:* ${getField(dadosTurno, 'Horário', 'horario')}` + nl;
  texto += `*Letra:* ${getField(dadosTurno, 'Letra', 'letra')}` + nl;
  texto += `*Supervisor:* ${getField(dadosTurno, 'Supervisor', 'supervisor')}` + nl + nl;

  // Agrupar equipes
  var equipesPorTipo = equipes.reduce((acc, eq) => { var tipo = getField(eq, 'Tipo_Equipe', 'tipo', 'Desconhecido'); if (!acc[tipo]) acc[tipo] = []; acc[tipo].push(eq); return acc; }, {});
  const ordemTiposWpp = ['Alta Pressão', 'Auto Vácuo / Hiper Vácuo']; // Ordem desejada
  const tiposOrdenadosWpp = Object.keys(equipesPorTipo).sort((a, b) => { const idxA = ordemTiposWpp.indexOf(a); const idxB = ordemTiposWpp.indexOf(b); if(idxA===-1 && idxB===-1) return a.localeCompare(b); if(idxA===-1) return 1; if(idxB===-1) return -1; return idxA - idxB; });


  for (const tipo of tiposOrdenadosWpp) {
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
          const idUsiminas = getField(equipe, 'Identificacao_Usiminas', 'identificacaoUsiminas', ''); if (idUsiminas !== 'N/A') texto += `  ID Usiminas: ${idUsiminas}` + nl;

          // Materiais (Simplificado para WhatsApp)
           if (tipo === 'Alta Pressão') {
               const lancesM = getField(equipe, 'Lances_Mangueira', 'lancesMangueira', '0');
               const lancesV = getField(equipe, 'Lances_Varetas', 'lancesVaretas', '0');
               texto += `  Materiais AP: L.Mang: ${lancesM}, L.Var: ${lancesV}` + nl; // Exemplo simplificado
           } else if (tipo === 'Auto Vácuo / Hiper Vácuo') {
               const mang3 = getField(equipe, 'Mangotes_3_Polegadas', 'mangotes3Polegadas', '0');
               const mang4 = getField(equipe, 'Mangotes_4_Polegadas', 'mangotes4Polegadas', '0');
               const mang6 = getField(equipe, 'Mangotes_6_Polegadas', 'mangotes6Polegadas', '0');
               texto += `  Materiais Vácuo: M(3"): ${mang3}, M(4"): ${mang4}, M(6"): ${mang6}` + nl; // Exemplo simplificado
           }
           const justif = getField(equipe, 'Justificativa', 'justificativa', '');
           if (justif !== 'N/A') texto += `    Just. Falta: ${justif}`+nl;


          // Troca (com Fim e Tempo)
          const troca = getField(equipe, 'Troca_Equipamento', 'trocaEquipamento', 'Não');
          if (troca === 'Sim') {
              texto += nl + "  *Troca de Equipamento: Sim*" + nl;
              const motivo = getField(equipe, 'Motivo_Troca', 'motivoTroca', ''); const motivoO = getField(equipe, 'Motivo_Outro', 'motivoOutro', ''); let motivoD = (motivo === 'Outros Motivos (Justificar)' || motivo === 'Defeitos Em Geral (Justificar)') ? motivoO : motivo;
              texto += `    Motivo: ${motivoD || 'Não especificado'}` + nl;
              const defeito = getField(equipe, 'Defeito', 'defeito', ''); if (defeito !== 'N/A') texto += `    Defeito/Medidas: ${defeito}` + nl;
              const placa = getField(equipe, 'Placa_Nova', 'placaNova', ''); if (placa !== 'N/A') texto += `    Placa Nova: ${placa}` + nl;
              const inicioT = getField(equipe, 'Data_Hora_Troca', 'dataHoraTroca', ''); if (inicioT !== 'N/A') texto += `    Início: ${formatarDataHora(inicioT)}` + nl;
               // ======================= ADICIONA FIM E TEMPO AO WHATSAPP =======================
              const fimT = getField(equipe, 'Data_Hora_Fim_Troca', 'dataHoraFimTroca', ''); if (fimT !== 'N/A') texto += `    Fim: ${formatarDataHora(fimT)}` + nl;
              const tempoT = getField(equipe, 'Tempo_Troca', '', ''); // Tenta pegar Tempo_Troca do GAS
              if (tempoT && !tempoT.includes('Erro') && !tempoT.includes('Ausente') && tempoT !== 'N/A') { texto += `    Tempo Indisp.: ${tempoT}` + nl; }
              else if (inicioT !== 'N/A' && fimT !== 'N/A') { // Tenta calcular se Tempo_Troca não veio pronto (ex: relatório local)
                  try { const inicio = new Date(inicioT); const fim = new Date(fimT); if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime()) && fim > inicio) { const dM = Math.round((fim-inicio)/60000); const h = Math.floor(dM/60); const m = dM%60; texto += `    Tempo Indisp.: ${h}h${m<10?'0':''}${m}min`+nl; } } catch(e){}
              }
              // ==============================================================================
          }
          // Observações
          const obs = getField(equipe, 'Observacoes', 'observacoes', ''); if (obs !== 'N/A') texto += nl + `  *Observações:* ${obs}` + nl;
          texto += nl; // Espaço entre equipes
      });
  }
  // Rodapé
  texto += sepPrincipal + `Sistema v${window.CONFIG?.VERSAO_APP || '3.2'}`; // Versão Atualizada
  return texto;
}

/** Voltar da visualização/WhatsApp para a tela de pesquisa */
function voltarDaVisualizacaoParaPesquisa() { navegarParaEtapa('stepPesquisa'); }
/** Voltar da tela de pesquisa para o início */
function voltarDaPesquisa() { novoRelatorio(); } // Volta para a etapa 1 e reseta


// ========== FUNÇÕES DE DASHBOARD ==========
function mostrarDashboard() {
  setOrigemNavegacao('dashboard'); // Define a origem
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
// Volta do dashboard para a etapa inicial (Turno)
function voltarDoDashboard() { novoRelatorio(); }

// Mostrar modal de ajuda
function mostrarHelp() { if (modalHelp) modalHelp.show(); else mostrarNotificacao("Ajuda não encontrada.", "warning"); }


// ========== FUNÇÕES UTILITÁRIAS ==========
/** Formatar data (DD/MM/YYYY) */
function formatarData(dataInput) {
  if (!dataInput) return 'N/A';
  try {
    let dataObj;
    const dataStr = String(dataInput);
    // Tenta identificar AAAA-MM-DD (com ou sem T...)
    if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
      const parts = dataStr.substring(0, 10).split('-');
      // Usa UTC para evitar problemas de timezone ao criar a data apenas com ano, mês, dia
      dataObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    } else if (dataInput instanceof Date) {
        dataObj = dataInput; // Já é um objeto Date
    } else {
      // Tenta outras formas (DD/MM/YYYY, etc.) ou fallback para o construtor padrão
      // Cuidado: new Date(string) pode ter comportamento inconsistente entre navegadores
      dataObj = new Date(dataStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')); // Tenta converter DD/MM/YYYY para YYYY-MM-DD
       if (isNaN(dataObj.getTime())) dataObj = new Date(dataStr); // Última tentativa
    }

    // Verifica se a data resultante é válida
    if (isNaN(dataObj.getTime())) return String(dataInput); // Retorna original se inválida

    // Formata usando UTC para consistência
    const dia = String(dataObj.getUTCDate()).padStart(2, '0');
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
    const ano = dataObj.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (e) { console.error("Erro formatarData:", dataInput, e); return String(dataInput); }
}

/** Formatar data e hora (DD/MM/YYYY HH:mm) */
function formatarDataHora(dataHoraInput) {
  if (!dataHoraInput) return 'N/A';
  try {
    let dataObj; if (dataHoraInput instanceof Date) dataObj = dataHoraInput; else dataObj = new Date(dataHoraInput); // Tenta converter string
    if (isNaN(dataObj.getTime())) return String(dataHoraInput); // Retorna original se inválida

    // Formata usando o timezone local do navegador
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    const hora = String(dataObj.getHours()).padStart(2, '0');
    const minutos = String(dataObj.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
  } catch (e) { console.error("Erro formatarDataHora:", dataHoraInput, e); return String(dataHoraInput); }
}


// --- Exportar funções para o escopo global (necessário para onclick no HTML) ---
// Mantém a exportação para compatibilidade, mas idealmente os eventos seriam adicionados via JS
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
window.visualizarRelatorioExistente = visualizarRelatorioExistente; // Agora é a versão sem jQuery
window.gerarPDFExistente = gerarPDFExistente;
window.formatarWhatsAppExistente = formatarWhatsAppExistente;
window.voltarDaVisualizacaoParaPesquisa = voltarDaVisualizacaoParaPesquisa;
window.voltarDaPesquisa = voltarDaPesquisa;
window.mostrarDashboard = mostrarDashboard;
window.voltarDoDashboard = voltarDoDashboard;
window.mostrarHelp = mostrarHelp;
window.copiarRelatorioParaAreaDeTransferencia = copiarRelatorioParaAreaDeTransferencia; // Agora é a versão sem jQuery


// Flags para evitar múltiplos salvamentos/submissões rápidas
let salvandoEquipe = false;
let salvandoRelatorio = false;

// --- Inicializar listeners específicos do formulário após o carregamento inicial ---
// Garante que os listeners para os toggles do modal sejam adicionados corretamente
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Adiciona listener para atualizar lista de equipes se AppState for usado
    if (window.AppState) {
        AppState.subscribe('equipes', (newState) => {
            console.log("Estado 'equipes' atualizado, renderizando lista.");
            atualizarListaEquipes();
            atualizarBotaoAvancar();
        });
         AppState.subscribe('dadosTurno', (newState) => {
            console.log("Estado 'dadosTurno' atualizado.");
            // Poderia pré-preencher o form de turno se necessário ao voltar
        });
        AppState.subscribe('currentStep', (newState) => {
            console.log("Estado 'currentStep' atualizado para:", newState);
             // Poderia adicionar lógica aqui baseada na etapa atual
        });
    }

    // Verifica se jQuery está presente (apenas para fins de log, já que estamos removendo seu uso)
    if (typeof $ === 'function') {
        console.log("jQuery ainda está carregado na página.");
    } else {
        console.log("jQuery não está carregado. Isso é o esperado para as novas atualizações.");
    }
});
