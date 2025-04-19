/**
 * Sistema de Relatório de Turno v3.0
 * Arquivo principal de lógica da aplicação (app.js)
 */

// Variáveis globais (Considerar mover para AppState no futuro)
let equipes = [];
let dadosTurno = {};
let ultimoRelatorioId = null;
let modalEquipe = null; // Instância do Modal Bootstrap
let modalHelp = null; // Instância do Modal Bootstrap
// toastNotificacao não é mais necessário se usarmos o módulo Notifications

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

    // Inicializar toast (notificação) - Removido, usar Notifications module
    // const toastElement = document.getElementById('toastNotificacao');
    // if (toastElement) {
    //   toastNotificacao = new bootstrap.Toast(toastElement);
    // }

    // Carregar dados do formulário
    await carregarDadosFormulario();

    // Configurar validação de formulário
    configureFormValidation();

    // Configurar listeners de eventos (já feito em main.js para botões principais)
    // setupEventListeners(); // Podemos mover listeners específicos de formulários para cá

    // Sincronizar com AppState se disponível (agora configurado em main.js)
    // syncWithAppState();

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
    // Tentar buscar da API
    // !! IMPORTANTE: Substitua 'getFormOptions' pelo nome da ação que seu backend espera !!
    const result = await callAPI('getFormOptions'); // <<< CORREÇÃO APLICADA AQUI

    if (result && result.success) {
      dadosFormulario = result.dados || result; // Adaptar conforme a estrutura de resposta da API

      // Preencher selects - Garantir que result.dados tenha as propriedades esperadas
      if (dadosFormulario.opcoesHorario) popularSelectOpcoes('horario', dadosFormulario.opcoesHorario);
      if (dadosFormulario.opcoesLetra) popularSelectOpcoes('letra', dadosFormulario.opcoesLetra);
      if (dadosFormulario.opcoesSupervisor) popularSelectOpcoes('supervisor', dadosFormulario.opcoesSupervisor);
      if (dadosFormulario.opcoesNumeroEquipe) popularSelectOpcoes('equipeNumero', dadosFormulario.opcoesNumeroEquipe); // Para o modal

      // Preencher outros selects que são usados no modal (verificar nomes das propriedades)
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
      // Se a API falhou ou não retornou sucesso, usar fallback
      console.warn('Falha ao carregar dados da API ou resposta sem sucesso. Usando fallback.');
      if(result && result.message) console.warn('Mensagem da API:', result.message);
      usarDadosFormularioFallback(); // Função separada para clareza
    }
  } catch (error) {
    console.error('Erro crítico ao carregar dados do formulário:', error);
    mostrarNotificacao('Erro ao carregar opções do formulário. Usando dados padrão.', 'warning');
    usarDadosFormularioFallback(); // Usar fallback em caso de erro na chamada
  } finally {
    ocultarLoading();
  }
}

/**
 * Preenche formulários com dados de fallback do CONFIG
 */
function usarDadosFormularioFallback() {
    if (window.CONFIG && CONFIG.OPCOES_FORMULARIO) {
      dadosFormulario = CONFIG.OPCOES_FORMULARIO; // Usar dados do config como fonte

      // Preencher selects com dados padrão
      popularSelectOpcoes('horario', CONFIG.OPCOES_FORMULARIO.opcoesHorario || []);
      popularSelectOpcoes('letra', CONFIG.OPCOES_FORMULARIO.opcoesLetra || []);
      popularSelectOpcoes('supervisor', CONFIG.OPCOES_FORMULARIO.opcoesSupervisor || []);
      popularSelectOpcoes('equipeNumero', CONFIG.OPCOES_FORMULARIO.opcoesNumeroEquipe || []); // Para o modal

      // Preencher outros selects
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

  // Adicionar novas opções
  opcoes.forEach(opcao => {
    if (opcao === null || typeof opcao === 'undefined') return; // Pular opções nulas/indefinidas
    const option = document.createElement('option');
    const valorOpcao = typeof opcao === 'object' ? opcao.value : opcao; // Se for objeto {value, text}
    const textoOpcao = typeof opcao === 'object' ? opcao.text : opcao;
    option.value = valorOpcao;
    option.textContent = textoOpcao;
    select.appendChild(option);
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
    // Remover listener anterior se houver para evitar duplicação
    // formTurno.removeEventListener('submit', handleFormTurnoSubmit); // Precisa nomear a função
    formTurno.addEventListener('submit', function handleFormTurnoSubmit(event) { // Nomeada para possível remoção
      event.preventDefault();
      event.stopPropagation();

      if (this.checkValidity()) {
        if (typeof avancarParaEquipes === 'function') {
           avancarParaEquipes();
        }
      } else {
          mostrarNotificacao('Por favor, preencha todos os campos obrigatórios do turno.', 'warning');
      }

      this.classList.add('was-validated');
    });
  }

  // Formulário de equipe (no modal)
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
     // Remover listener anterior se houver
    // formEquipe.removeEventListener('submit', handleFormEquipeSubmit);
    formEquipe.addEventListener('submit', function handleFormEquipeSubmit(event) { // Nomeada
      event.preventDefault();
      event.stopPropagation();

      if (this.checkValidity()) {
         if (typeof salvarEquipe === 'function') {
           salvarEquipe(); // Chama a função que lê os dados e salva
         }
      } else {
          mostrarNotificacao('Por favor, preencha todos os campos obrigatórios da equipe.', 'warning');
      }

      this.classList.add('was-validated');
    });
  }
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

   // Listener para radio "Outros Motivos"
   const motivoOutroRadio = document.getElementById('motivoOutro');
   if (motivoOutroRadio) {
       motivoOutroRadio.removeEventListener('change', toggleMotivoOutro);
       motivoOutroRadio.addEventListener('change', toggleMotivoOutro);
   }
   // Adicionar listeners para os outros radios de motivo para garantir que o campo "outro" seja escondido
   const outrosRadiosMotivo = document.querySelectorAll('input[name="equipeMotivoTroca"]:not(#motivoOutro)');
   outrosRadiosMotivo.forEach(radio => {
       radio.removeEventListener('change', toggleMotivoOutro); // Passar a mesma função
       radio.addEventListener('change', toggleMotivoOutro);
   });

}


/**
 * Sincronizar com AppState se disponível
 * AGORA CONFIGURADO EM main.js
 */
/*
function syncWithAppState() {
  if (window.AppState) {
    // Inicializar estado (ou ler estado existente se persistido)
    AppState.update('equipes', equipes);
    AppState.update('dadosTurno', dadosTurno);
    AppState.update('ultimoRelatorioId', ultimoRelatorioId);
  }
}
*/

/**
 * Mostrar notificação (agora usa wrapper em main.js que chama o módulo Notifications)
 * Esta função global pode ser mantida para compatibilidade, mas o wrapper a intercepta.
 */
function mostrarNotificacao(mensagem, tipo = 'success') {
  console.log(`Notificação Fallback [${tipo}]: ${mensagem}`);
  // Tenta usar o toast Bootstrap como último recurso se o módulo falhar
  const toastElement = document.getElementById('toastNotificacao');
  const toastBody = document.getElementById('toastTexto');

  if (toastElement && toastBody && window.bootstrap && bootstrap.Toast) {
    try {
        toastElement.className = 'toast align-items-center text-white border-0'; // Reset classes
        const bgClass = tipo === 'danger' ? 'bg-danger' : (tipo === 'warning' ? 'bg-warning text-dark' : 'bg-success');
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
  } else {
      console.error(`Etapa com ID '${idEtapaAlvo}' não encontrada.`);
  }

   // Atualizar estado da etapa atual (se usar AppState)
   if(window.AppState) {
       AppState.update('currentStep', idEtapaAlvo);
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
          const borderClass = equipe.tipo === 'Alta Pressão' ? 'border-primary' : 'border-danger';
          const bgClass = equipe.tipo === 'Alta Pressão' ? 'bg-primary' : 'bg-danger';
          const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
          const vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
          const motivoTrocaDisplay = equipe.motivoTroca === 'Outros Motivos (Justificar)' ? equipe.motivoOutro : equipe.motivoTroca;

          html += `
            <div class="card mb-3 equipe-card ${borderClass}">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Equipe ${index + 1}: ${equipe.numero || 'N/A'}</h5>
                <div class="badge ${bgClass}">${equipe.tipo}</div>
              </div>
              <div class="card-body">
                <div class="row mb-2">
                  <div class="col-md-6"><strong>Integrantes:</strong> ${equipe.integrantes || 'N/A'}</div>
                  <div class="col-md-6"><strong>Área:</strong> ${equipe.area || 'N/A'}</div>
                </div>
                <div class="row mb-2">
                  <div class="col-md-6"><strong>Atividade:</strong> ${equipe.atividade || 'N/A'}</div>
                  <div class="col-md-6"><strong>Vaga:</strong> ${vagaDisplay || 'N/A'}</div>
                </div>
                 <div class="row mb-3">
                  <div class="col-md-6"><strong>Equipamento:</strong> ${equipDisplay || 'N/A'}</div>
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

                <h6 class="mt-3">Materiais e Segurança</h6>
                <div class="row">
                    <div class="col-md-6">
                       <div class="alert alert-light p-2">
                          <small>
                            <strong>Materiais:</strong><br>
                            ${equipe.tipo === 'Alta Pressão' ? `
                              Pistola: ${equipe.materiais?.pistola || 'N/A'}<br>
                              Pistola C.L.: ${equipe.materiais?.pistolaCanoLongo || 'N/A'}<br>
                              Mang. Torpedo: ${equipe.materiais?.mangueiraTorpedo || 'N/A'}<br>
                              Pedal: ${equipe.materiais?.pedal || 'N/A'}<br>
                              Varetas: ${equipe.materiais?.varetas || 'N/A'}<br>
                              Rabicho: ${equipe.materiais?.rabicho || 'N/A'}<br>
                              Lances Mang.: ${equipe.lancesMangueira || 'N/A'}<br>
                              Lances Var.: ${equipe.lancesVaretas || 'N/A'}
                            ` : `
                              Mangotes: ${equipe.materiaisVacuo?.mangotes || 'N/A'}<br>
                              Reduções: ${equipe.materiaisVacuo?.reducoes || 'N/A'}<br>
                              Mangotes 3": ${equipe.mangotes3Polegadas || 'N/A'}<br>
                              Mangotes 4": ${equipe.mangotes4Polegadas || 'N/A'}<br>
                              Mangotes 6": ${equipe.mangotes6Polegadas || 'N/A'}
                            `}
                            ${equipe.justificativa ? `<br>Justif. Falta: ${equipe.justificativa}` : ''}
                          </small>
                       </div>
                    </div>
                     <div class="col-md-6">
                       <div class="alert alert-light p-2">
                           <small>
                            <strong>Segurança:</strong><br>
                            Caixa Bloqueio: ${equipe.caixaBloqueio || 'N/A'}<br>
                            Cadeados: ${equipe.cadeados || 'N/A'}<br>
                            Plaquetas: ${equipe.plaquetas || 'N/A'}
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
  } else {
      mostrarNotificacao("Erro: Formulário de equipe não encontrado no modal.", "danger");
      return;
  }

  // Definir tipo e índice para nova equipe
  const inputTipo = document.getElementById('equipeTipo');
  const inputIndex = document.getElementById('equipeIndex');
  if(inputTipo) inputTipo.value = tipo;
  if(inputIndex) inputIndex.value = '-1'; // Indica nova equipe

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
  const materiaisAP = document.getElementById('materiaisAltaPressao');
  const materiaisVacuo = document.getElementById('materiaisVacuo');
  if (materiaisAP) materiaisAP.style.display = isAltaPressao ? 'block' : 'none';
  if (materiaisVacuo) materiaisVacuo.style.display = isAltaPressao ? 'none' : 'block';

  // Preencher selects de Vaga e Equipamento com base no tipo e nos dados carregados
  if (dadosFormulario) {
      const vagas = isAltaPressao ? dadosFormulario.vagasAltaPressao : dadosFormulario.vagasVacuo;
      const equipamentos = isAltaPressao ? dadosFormulario.equipamentosAltaPressao : dadosFormulario.equipamentosVacuo;
      popularSelectOpcoes('equipeVaga', vagas || ['OUTRA VAGA']); // Fallback mínimo
      popularSelectOpcoes('equipeEquipamento', equipamentos || ['OUTRO EQUIPAMENTO']); // Fallback mínimo
  } else {
       mostrarNotificacao("Aviso: Dados de formulário não carregados, opções de Vaga/Equipamento podem estar limitadas.", "warning");
       popularSelectOpcoes('equipeVaga', ['OUTRA VAGA']);
       popularSelectOpcoes('equipeEquipamento', ['OUTRO EQUIPAMENTO']);
  }

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
  } else {
       mostrarNotificacao("Erro: Formulário de equipe não encontrado no modal.", "danger");
      return;
  }

  // Definir tipo e índice
   const inputTipo = document.getElementById('equipeTipo');
   const inputIndex = document.getElementById('equipeIndex');
   if(inputTipo) inputTipo.value = equipe.tipo;
   if(inputIndex) inputIndex.value = index.toString();


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
  const materiaisAP = document.getElementById('materiaisAltaPressao');
  const materiaisVacuo = document.getElementById('materiaisVacuo');
  if (materiaisAP) materiaisAP.style.display = isAltaPressao ? 'block' : 'none';
  if (materiaisVacuo) materiaisVacuo.style.display = isAltaPressao ? 'none' : 'block';


  // Preencher selects de Vaga e Equipamento com base no tipo e dados carregados
  if (dadosFormulario) {
      const vagas = isAltaPressao ? dadosFormulario.vagasAltaPressao : dadosFormulario.vagasVacuo;
      const equipamentos = isAltaPressao ? dadosFormulario.equipamentosAltaPressao : dadosFormulario.equipamentosVacuo;
      popularSelectOpcoes('equipeVaga', vagas || ['OUTRA VAGA']);
      popularSelectOpcoes('equipeEquipamento', equipamentos || ['OUTRO EQUIPAMENTO']);
  } else {
      // Se dadosFormulario não carregou, usar apenas as opções básicas
       popularSelectOpcoes('equipeVaga', ['OUTRA VAGA']);
       popularSelectOpcoes('equipeEquipamento', ['OUTRO EQUIPAMENTO']);
       // Adicionar a vaga/equipamento específico da equipe salva se não for padrão
       if (equipe.vaga && equipe.vaga !== 'OUTRA VAGA') {
           const selectVaga = document.getElementById('equipeVaga');
           if(selectVaga && !selectVaga.querySelector(`option[value="${equipe.vaga}"]`)) {
               const option = new Option(equipe.vaga, equipe.vaga);
               selectVaga.add(option);
           }
       }
        if (equipe.equipamento && equipe.equipamento !== 'OUTRO EQUIPAMENTO') {
           const selectEquip = document.getElementById('equipeEquipamento');
            if(selectEquip && !selectEquip.querySelector(`option[value="${equipe.equipamento}"]`)) {
               const option = new Option(equipe.equipamento, equipe.equipamento);
               selectEquip.add(option);
           }
       }
  }

   // --- Preencher campos do formulário com dados da equipe ---
    function setFieldValue(id, value) {
        const field = document.getElementById(id);
        if (field) field.value = value || ''; // Define como string vazia se for null/undefined
    }
     function setSelectValue(id, value) {
        const field = document.getElementById(id);
        if (field) field.value = value || field.options[0]?.value || ''; // Fallback para primeira opção ou vazio
    }
    function setRadioValue(name, value) {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) radio.checked = true;
    }

    setSelectValue('equipeNumero', equipe.numero);
    setFieldValue('equipeIntegrantes', equipe.integrantes);
    setFieldValue('equipeArea', equipe.area);
    setFieldValue('equipeAtividade', equipe.atividade);

    // Vaga e Equipamento (considerando "Outra")
    setSelectValue('equipeVaga', equipe.vaga);
    toggleVagaPersonalizada(); // Atualiza visibilidade do campo personalizado
    if (equipe.vaga === 'OUTRA VAGA') {
        setFieldValue('equipeVagaPersonalizada', equipe.vagaPersonalizada);
    }

    setSelectValue('equipeEquipamento', equipe.equipamento);
    toggleEquipamentoPersonalizado(); // Atualiza visibilidade
    if (equipe.equipamento === 'OUTRO EQUIPAMENTO') {
        setFieldValue('equipeEquipamentoPersonalizado', equipe.equipamentoPersonalizado);
    }

    // Troca de equipamento
    setRadioValue('equipeTroca', equipe.trocaEquipamento);
    toggleTrocaEquipamento(); // Atualiza visibilidade dos detalhes

    if (equipe.trocaEquipamento === 'Sim') {
        setRadioValue('equipeMotivoTroca', equipe.motivoTroca);
        toggleMotivoOutro(); // Atualiza visibilidade do campo "outro motivo"
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)') {
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
    setRadioValue('equipeCaixaBloqueio', equipe.caixaBloqueio);
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
      AppState.update('equipes', novasEquipes); // Atualiza o estado central
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
  const formEquipe = document.getElementById('formEquipe');
  if (!formEquipe) {
       mostrarNotificacao("Erro: Formulário de equipe não encontrado.", "danger");
      return;
  }

  // Forçar validação Bootstrap antes de ler os dados
  if (!formEquipe.checkValidity()) {
    formEquipe.classList.add('was-validated');
    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios da equipe.', 'warning');
    return; // Não prosseguir se inválido
  }

   // --- Validações adicionais ---
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
      return;
    } else {
         if (motivoTrocaFeedback) motivoTrocaFeedback.style.display = 'none'; // Ocultar feedback se motivo foi selecionado
    }

    if (motivoTroca === 'Outros Motivos (Justificar)' && motivoOutroInput && !motivoOutroInput.value.trim()) {
      motivoOutroInput.classList.add('is-invalid'); // Mostrar feedback visual
      motivoOutroInput.focus();
      mostrarNotificacao('Por favor, especifique o motivo da troca.', 'warning');
      return;
    } else if (motivoOutroInput) {
         motivoOutroInput.classList.remove('is-invalid'); // Limpar feedback se válido
    }

    if (defeitoInput && !defeitoInput.value.trim()) {
      defeitoInput.classList.add('is-invalid');
      defeitoInput.focus();
      mostrarNotificacao('Por favor, descreva o defeito e as medidas tomadas.', 'warning');
      return;
    } else if (defeitoInput) {
        defeitoInput.classList.remove('is-invalid');
    }
  }
   // --- Fim das validações adicionais ---


  // Obter dados da equipe do formulário
    function getFieldValue(id) {
        const field = document.getElementById(id);
        return field ? field.value : null;
    }
     function getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : null;
    }

  const tipo = getFieldValue('equipeTipo');
  const index = parseInt(getFieldValue('equipeIndex') ?? '-1'); // Usar ?? para fallback

  const novaEquipe = {
    tipo: tipo,
    numero: getFieldValue('equipeNumero'),
    integrantes: getFieldValue('equipeIntegrantes'),
    area: getFieldValue('equipeArea'),
    atividade: getFieldValue('equipeAtividade'),
    vaga: getFieldValue('equipeVaga'),
    vagaPersonalizada: getFieldValue('equipeVaga') === 'OUTRA VAGA' ? getFieldValue('equipeVagaPersonalizada') : '',
    equipamento: getFieldValue('equipeEquipamento'),
    equipamentoPersonalizado: getFieldValue('equipeEquipamento') === 'OUTRO EQUIPAMENTO' ? getFieldValue('equipeEquipamentoPersonalizado') : '',
    trocaEquipamento: getRadioValue('equipeTroca'),
    caixaBloqueio: getRadioValue('equipeCaixaBloqueio'),
    justificativa: getFieldValue('equipeJustificativa'),
    cadeados: getFieldValue('equipeCadeados'),
    plaquetas: getFieldValue('equipePlaquetas'),
    observacoes: getFieldValue('equipeObservacoes'),
    // Inicializar objetos aninhados
    materiais: {},
    materiaisVacuo: {}
  };

  // Adicionar detalhes da troca se aplicável
  if (novaEquipe.trocaEquipamento === 'Sim') {
    novaEquipe.motivoTroca = motivoTroca; // Já validado acima
    if (novaEquipe.motivoTroca === 'Outros Motivos (Justificar)') {
      novaEquipe.motivoOutro = getFieldValue('equipeMotivoOutro');
    }
    novaEquipe.defeito = getFieldValue('equipeDefeito'); // Já validado acima
    novaEquipe.placaNova = getFieldValue('equipePlacaNova');
    novaEquipe.dataHoraTroca = getFieldValue('equipeDataHoraTroca');
  }

  // Adicionar materiais específicos por tipo
  if (tipo === 'Alta Pressão') {
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
    equipesAtualizadas = equipesAtuais.map((equipe, i) => i === index ? novaEquipe : equipe);
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
    atualizarListaEquipes(); // Atualizar UI manualmente
    atualizarBotaoAvancar();
  }

  // Fechar modal
  if (modalEquipe) {
      modalEquipe.hide();
  }
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
    const cardClass = equipe.tipo === 'Alta Pressão' ? 'equipe-card card border-primary' : 'equipe-card card equipe-vacuo border-danger'; // Adiciona borda aqui
    const badgeClass = equipe.tipo === 'Alta Pressão' ? 'bg-primary' : 'bg-danger';
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
      <div class="card-body p-2"> <small> <strong>Integrantes:</strong> ${equipe.integrantes || 'N/A'}<br>
            <strong>Área:</strong> ${equipe.area || 'N/A'}<br>
            <strong>Atividade:</strong> ${equipe.atividade || 'N/A'}<br>
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
  const vagaPersonalizadaContainer = document.getElementById('vagaPersonalizadaContainer');
  const equipeVagaPersonalizada = document.getElementById('equipeVagaPersonalizada');

  if (equipeVaga && vagaPersonalizadaContainer && equipeVagaPersonalizada) {
    const show = equipeVaga.value === 'OUTRA VAGA';
    vagaPersonalizadaContainer.style.display = show ? 'block' : 'none';
    equipeVagaPersonalizada.required = show; // Atributo required é booleano
    if (!show) {
        equipeVagaPersonalizada.value = ''; // Limpa o campo se for escondido
        equipeVagaPersonalizada.classList.remove('is-invalid'); // Limpa validação
    }
  }
}

/**
 * Mostrar/ocultar campo de equipamento personalizado
 */
function toggleEquipamentoPersonalizado() {
  const equipeEquipamento = document.getElementById('equipeEquipamento');
  const equipamentoPersonalizadoContainer = document.getElementById('equipamentoPersonalizadoContainer');
  const equipeEquipamentoPersonalizado = document.getElementById('equipeEquipamentoPersonalizado');

  if (equipeEquipamento && equipamentoPersonalizadoContainer && equipeEquipamentoPersonalizado) {
     const show = equipeEquipamento.value === 'OUTRO EQUIPAMENTO';
    equipamentoPersonalizadoContainer.style.display = show ? 'block' : 'none';
    equipeEquipamentoPersonalizado.required = show;
     if (!show) {
        equipeEquipamentoPersonalizado.value = '';
        equipeEquipamentoPersonalizado.classList.remove('is-invalid');
    }
  }
}

/**
 * Mostrar/ocultar campos de troca de equipamento
 */
function toggleTrocaEquipamento() {
  const trocaEquipamentoRadio = document.querySelector('input[name="equipeTroca"]:checked');
  const trocaDetalhesDiv = document.getElementById('trocaDetalhes');

  if (trocaEquipamentoRadio && trocaDetalhesDiv) {
    const show = trocaEquipamentoRadio.value === 'Sim';
    trocaDetalhesDiv.style.display = show ? 'block' : 'none';
    // Se esconder, limpar validações dos campos internos
    if (!show) {
        trocaDetalhesDiv.querySelectorAll('input, textarea').forEach(el => {
            el.classList.remove('is-invalid');
            if(el.type !== 'radio') el.value = ''; // Limpa campos, exceto radios
        });
        // Resetar radios de motivo
         const motivoRadio = document.querySelector('input[name="equipeMotivoTroca"]:checked');
         if(motivoRadio) motivoRadio.checked = false;
         toggleMotivoOutro(); // Esconder campo de outro motivo
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
  const motivoOutroContainer = document.getElementById('motivoOutroContainer');
  const equipeMotivoOutro = document.getElementById('equipeMotivoOutro');
  const motivoTrocaFeedback = document.getElementById('motivoTrocaFeedback'); // Feedback geral dos motivos

  // Esconder feedback geral ao selecionar qualquer motivo
   if (motivoTrocaFeedback) {
    motivoTrocaFeedback.style.display = 'none';
  }


  if (motivoOutroRadio && motivoOutroContainer && equipeMotivoOutro) {
    const show = motivoOutroRadio.checked;
    motivoOutroContainer.style.display = show ? 'block' : 'none';
    equipeMotivoOutro.required = show;
     if (!show) {
        equipeMotivoOutro.value = '';
        equipeMotivoOutro.classList.remove('is-invalid');
    }
  }
}


// ========== FUNÇÕES DE RELATÓRIO E SALVAMENTO ==========

/**
 * Salvar relatório (Função descontinuada, usar salvarRelatorioComFallback)
 */
/*
async function salvarRelatorio() {
  // ... (código antigo) ...
}
*/

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

    // Adicionar novo relatório (talvez limitar o número de relatórios locais?)
    relatoriosLocais.push(relatorio);
    // Exemplo: Manter apenas os últimos 20 relatórios locais
    // if(relatoriosLocais.length > 20) {
    //    relatoriosLocais = relatoriosLocais.slice(-20);
    // }

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
      const result = await callAPI('salvarRelatorio', { // Assumindo 'salvarRelatorio' como action
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
 * Visualizar relatório (usa ID salvo no estado)
 */
async function visualizarRelatorio() {
  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
  if (!idAtual) {
      mostrarNotificacao("ID do relatório não encontrado para visualização.", "warning");
      return;
  }
  // Determina se é local ou servidor pelo prefixo do ID
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
  await visualizarRelatorioExistente(idAtual, origem); // Reutiliza a função de visualização
}

/**
 * Formatar relatório para WhatsApp (usa ID salvo no estado)
 */
async function formatarWhatsApp() {
  const idAtual = window.AppState?.get('ultimoRelatorioId') || ultimoRelatorioId;
   if (!idAtual) {
      mostrarNotificacao("ID do relatório não encontrado para formatação.", "warning");
      return;
  }
  const origem = String(idAtual).startsWith('local_') ? 'local' : 'servidor';
  await formatarWhatsAppExistente(idAtual, origem); // Reutiliza a função de formatação
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
 * Voltar do WhatsApp (pode ir para Sucesso ou Pesquisa dependendo do fluxo)
 * Atualmente está igual a voltarParaSucesso
 */
function voltarDoWhatsApp() {
    voltarParaSucesso(); // Ou poderia voltar para a tela de pesquisa se veio de lá
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
      elemento.select(); // Funciona melhor em inputs/textareas
      document.execCommand('copy');
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
  }

  // Ocultar resultados anteriores
  const resultadosPesquisa = document.getElementById('resultadosPesquisa');
  if (resultadosPesquisa) {
    resultadosPesquisa.style.display = 'none';
    const tabelaResultados = document.getElementById('tabelaResultados');
    if(tabelaResultados) tabelaResultados.innerHTML = ''; // Limpar tabela
  }

  // Ajustar campo de pesquisa para o padrão
  ajustarCampoPesquisa();
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

  // Ajustar termo conforme o tipo (ex: month input retorna YYYY-MM, API pode esperar MM/YYYY)
  // ->>> ESTA PARTE PODE PRECISAR DE AJUSTE CONFORME O QUE A API ESPERA <<<-
  // Exemplo: if (tipoPesquisa === 'mes_ano' && /^\d{4}-\d{2}$/.test(termoPesquisa)) {
  //   const [ano, mes] = termoPesquisa.split('-');
  //   termoPesquisa = `${mes}/${ano}`;
  // }

  mostrarLoading('Pesquisando relatórios...');

  try {
    let resultados = [];

    if (tipoPesquisa === 'local') {
      resultados = pesquisarRelatoriosLocais(termoPesquisa.trim());
    } else {
      // Pesquisar na API
      const result = await callAPI('pesquisarRelatorios', { // Assumindo 'pesquisarRelatorios' como action
          termo: termoPesquisa.trim(),
          tipo: tipoPesquisa
      });

      if (result && result.success) {
        resultados = result.resultados || [];
        // Adicionar origem para consistência
        resultados.forEach(relatorio => {
          relatorio.origem = 'servidor';
        });
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

    // Checar ID
    if (id && String(id).toLowerCase().includes(termoLower)) return true;
    // Checar dados do turno
    if (dadosTurno.letra?.toLowerCase().includes(termoLower)) return true;
    if (dadosTurno.supervisor?.toLowerCase().includes(termoLower)) return true;
    if (dadosTurno.data?.includes(termo)) return true; // Data geralmente é exata YYYY-MM-DD
    if (formatarData(dadosTurno.data).includes(termo)) return true; // Checar formato DD/MM/YYYY
    if (dadosTurno.horario?.toLowerCase().includes(termoLower)) return true;

    // Checar dados das equipes (ex: número, integrantes, equipamento)
    return equipes.some(eq =>
      eq.numero?.toLowerCase().includes(termoLower) ||
      eq.integrantes?.toLowerCase().includes(termoLower) ||
      eq.equipamento?.toLowerCase().includes(termoLower) ||
      eq.equipamentoPersonalizado?.toLowerCase().includes(termoLower) ||
      eq.area?.toLowerCase().includes(termoLower) ||
      eq.atividade?.toLowerCase().includes(termoLower)
    );
  }).map(relatorio => ({ // Formatar para exibição na tabela
    id: relatorio.id,
    data: formatarData(relatorio.dadosTurno.data),
    horario: relatorio.dadosTurno.horario || 'N/A',
    letra: relatorio.dadosTurno.letra || 'N/A',
    supervisor: relatorio.dadosTurno.supervisor || 'N/A',
    origem: 'local'
  })).reverse(); // Mostrar os mais recentes primeiro
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

        linha.innerHTML = `
          <td><span class="badge ${badgeClass}">${relatorio.origem}</span></td>
          <td>${relatorio.data || 'N/A'}</td>
          <td>${relatorio.horario || 'N/A'}</td>
          <td>${relatorio.letra || 'N/A'}</td>
          <td>${relatorio.supervisor || 'N/A'}</td>
          <td class="text-center">
            <div class="action-buttons btn-group btn-group-sm">
              <button type="button" class="btn btn-primary" onclick="visualizarRelatorioExistente('${relatorio.id}', '${relatorio.origem}')" title="Visualizar">
                <i class="bi bi-eye"></i>
              </button>
              ${relatorio.origem === 'servidor' ? `
              <button type="button" class="btn btn-danger" onclick="gerarPDFExistente('${relatorio.id}', '${relatorio.origem}')" title="Gerar PDF">
                <i class="bi bi-file-pdf"></i>
              </button>` : '' /* Não gerar PDF de local */}
              <button type="button" class="btn btn-info text-white" onclick="formatarWhatsAppExistente('${relatorio.id}', '${relatorio.origem}')" title="Formatar WhatsApp">
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
 */
async function visualizarRelatorioExistente(id, origem = 'servidor') {
  if (!id) {
      mostrarNotificacao("ID inválido para visualização.", "danger");
      return;
  }
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
      // Buscar da API (Assumindo action 'getRelatorioTexto')
      const result = await callAPI('getRelatorioTexto', { relatorioId: id });
      if (result && result.success && result.relatorio) {
        textoRelatorio = result.relatorio;
      } else {
        throw new Error(result?.message || 'Erro ao buscar relatório do servidor.');
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

    // Configurar botão voltar para ir para a pesquisa
    const btnVoltarRelatorio = document.getElementById('btnVoltarRelatorio');
    if (btnVoltarRelatorio) {
      btnVoltarRelatorio.onclick = voltarDaVisualizacaoParaPesquisa; // Função específica
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
 * Gerar texto de relatório local (Melhorado)
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
      const motivoTrocaDisplay = equipe.motivoTroca === 'Outros Motivos (Justificar)' ? equipe.motivoOutro : equipe.motivoTroca;

      texto += `EQUIPE ${index + 1} | ${equipe.numero || 'N/A'}\n`;
      texto += subLinha;
      texto += `Integrantes: ${equipe.integrantes || 'N/A'}\n`;
      texto += `Área: ${equipe.area || 'N/A'}\n`;
      texto += `Atividade: ${equipe.atividade || 'N/A'}\n`;
      texto += `Vaga: ${vagaDisplay || 'N/A'}\n`;
      texto += `Equipamento: ${equipDisplay || 'N/A'}\n`;

      // Detalhes da Troca
      texto += '\n> Status Equipamento:\n';
      texto += `  Houve troca: ${equipe.trocaEquipamento || 'Não'}\n`;
      if (equipe.trocaEquipamento === 'Sim') {
        texto += `  - Motivo: ${motivoTrocaDisplay || 'Não especificado'}\n`;
        texto += `  - Defeito/Medidas: ${equipe.defeito || 'N/A'}\n`;
        if (equipe.placaNova) texto += `  - Placa Nova: ${equipe.placaNova}\n`;
        if (equipe.dataHoraTroca) texto += `  - Data/Hora Troca: ${equipe.dataHoraTroca}\n`;
      }

      // Materiais
      texto += '\n> Materiais Utilizados:\n';
      if (tipo === 'Alta Pressão' && equipe.materiais) {
         texto += `  - Pistola: ${equipe.materiais.pistola ?? 'N/A'}\n`; // Usar ?? para tratar null/undefined
         texto += `  - Pistola C.L.: ${equipe.materiais.pistolaCanoLongo ?? 'N/A'}\n`;
         texto += `  - Mang. Torpedo: ${equipe.materiais.mangueiraTorpedo ?? 'N/A'}\n`;
         texto += `  - Pedal: ${equipe.materiais.pedal ?? 'N/A'}\n`;
         texto += `  - Varetas: ${equipe.materiais.varetas ?? 'N/A'}\n`;
         texto += `  - Rabicho: ${equipe.materiais.rabicho ?? 'N/A'}\n`;
         texto += `  - Lances Mang.: ${equipe.lancesMangueira ?? 'N/A'}\n`;
         texto += `  - Lances Var.: ${equipe.lancesVaretas ?? 'N/A'}\n`;
      } else if (tipo !== 'Alta Pressão' && equipe.materiaisVacuo) { // Usar tipo genérico
         texto += `  - Mangotes Check: ${equipe.materiaisVacuo.mangotes ?? 'N/A'}\n`;
         texto += `  - Reduções Check: ${equipe.materiaisVacuo.reducoes ?? 'N/A'}\n`;
         texto += `  - Mangotes 3": ${equipe.mangotes3Polegadas ?? 'N/A'}\n`;
         texto += `  - Mangotes 4": ${equipe.mangotes4Polegadas ?? 'N/A'}\n`;
         texto += `  - Mangotes 6": ${equipe.mangotes6Polegadas ?? 'N/A'}\n`;
      } else {
          texto += '  (Nenhum material específico registrado)\n';
      }

      if (equipe.justificativa) {
        texto += `\n> Justificativa Materiais Falta:\n  ${equipe.justificativa}\n`;
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
  texto += `Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.0'} (Relatório Local)\n`;
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
  mostrarLoading('Gerando PDF...');

  try {
    let dadosParaPDF = { dadosTurno: null, equipes: null };

    if (origem === 'local') {
      const relatorioLocal = obterRelatorioLocal(id);
      if (!relatorioLocal) {
        throw new Error('Relatório local não encontrado para gerar PDF.');
      }
      dadosParaPDF = relatorioLocal; // Usar dados locais
       // Gerar PDF diretamente com os dados locais
       await gerarPDF(dadosParaPDF.dadosTurno, dadosParaPDF.equipes, id);
    } else {
      // Buscar dados completos do relatório da API (assumindo action 'getRelatorioCompleto')
      const result = await callAPI('getRelatorioCompleto', { relatorioId: id });
       if (result && result.success && result.dados) {
           dadosParaPDF = result.dados; // Espera { dadosTurno: ..., equipes: ... }
            // Gerar PDF com os dados da API
            await gerarPDF(dadosParaPDF.dadosTurno, dadosParaPDF.equipes, id);
       } else {
            throw new Error(result?.message || 'Erro ao buscar dados completos do relatório do servidor.');
       }
    }

  } catch (error) {
    console.error('Erro ao gerar PDF de relatório existente:', error);
    mostrarNotificacao('Erro ao gerar PDF: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}


/**
 * Gerar PDF (Função auxiliar, precisa da biblioteca jsPDF e talvez html2canvas)
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
    const doc = new jsPDF();
    let y = 15; // Posição vertical inicial

    // --- Estilos ---
    const tituloStyle = { fontSize: 18, fontStyle: 'bold', align: 'center' };
    const subTituloStyle = { fontSize: 14, fontStyle: 'bold' };
    const labelStyle = { fontSize: 10, fontStyle: 'bold' };
    const textStyle = { fontSize: 10 };
    const smallTextStyle = { fontSize: 8 };
    const lineHeight = 6;
    const smallLineHeight = 4;
    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    function checkAddPage(alturaNecessaria = 20) {
        if (y + alturaNecessaria > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    }

    // --- Cabeçalho ---
    doc.setFontSize(tituloStyle.fontSize);
    doc.setFont(undefined, 'bold');
    doc.text("RELATÓRIO DE TURNO", pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 1.5;

     doc.setFontSize(textStyle.fontSize);
     doc.setFont(undefined, 'normal');
     doc.text("GRUPO GPS - MECANIZADA", pageWidth / 2, y, { align: 'center' });
     y += lineHeight * 2;

    // --- Informações Gerais ---
    doc.setFontSize(subTituloStyle.fontSize);
     doc.setFont(undefined, 'bold');
    doc.text("INFORMAÇÕES GERAIS", margin, y);
    y += lineHeight * 1.5;
     doc.setLineWidth(0.5);
     doc.line(margin, y - lineHeight * 0.5, pageWidth - margin, y - lineHeight*0.5);


     doc.setFontSize(textStyle.fontSize);
     doc.setFont(undefined, 'normal');
    doc.text(`Data: ${formatarData(dadosTurnoPDF.data)}`, margin, y);
    doc.text(`Horário: ${dadosTurnoPDF.horario || 'N/A'}`, margin + 60, y);
    y += lineHeight;
    doc.text(`Letra: ${dadosTurnoPDF.letra || 'N/A'}`, margin, y);
    doc.text(`Supervisor: ${dadosTurnoPDF.supervisor || 'N/A'}`, margin + 60, y);
     y += lineHeight;
     doc.text(`ID Relatório: ${relatorioId || 'N/A'}`, margin, y);
     y += lineHeight * 1.5;

    // --- Equipes ---
     // Separar equipes por tipo
    const equipesPorTipo = equipesPDF.reduce((acc, equipe) => {
        const tipo = equipe.tipo || 'Outro';
        if (!acc[tipo]) acc[tipo] = [];
        acc[tipo].push(equipe);
        return acc;
    }, {});

     for (const tipo in equipesPorTipo) {
        checkAddPage(30); // Espaço para título da seção
        doc.setFontSize(subTituloStyle.fontSize);
        doc.setFont(undefined, 'bold');
        doc.text(`EQUIPES ${tipo.toUpperCase()} (${equipesPorTipo[tipo].length})`, margin, y);
        y += lineHeight * 1.5;
         doc.setLineWidth(0.2);
        doc.line(margin, y - lineHeight * 0.5, pageWidth - margin, y - lineHeight*0.5);


        equipesPorTipo[tipo].forEach((equipe, index) => {
            checkAddPage(60); // Estimar altura necessária para uma equipe
            doc.setFontSize(11); // Um pouco maior para o nome da equipe
            doc.setFont(undefined, 'bold');
            doc.text(`Equipe ${index + 1}: ${equipe.numero || 'N/A'}`, margin, y);
            y += lineHeight;

            doc.setFontSize(textStyle.fontSize);
            doc.setFont(undefined, 'normal');

             const vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
             const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
             const motivoTrocaDisplay = equipe.motivoTroca === 'Outros Motivos (Justificar)' ? equipe.motivoOutro : equipe.motivoTroca;


            doc.text(`Integrantes: ${equipe.integrantes || 'N/A'}`, margin + 5, y); y += lineHeight;
            doc.text(`Área: ${equipe.area || 'N/A'}`, margin + 5, y); y += lineHeight;
            doc.text(`Atividade: ${equipe.atividade || 'N/A'}`, margin + 5, y); y += lineHeight;
            doc.text(`Vaga: ${vagaDisplay || 'N/A'}`, margin + 5, y); y += lineHeight;
            doc.text(`Equipamento: ${equipDisplay || 'N/A'}`, margin + 5, y); y += lineHeight;

             // Troca
             checkAddPage(15);
             doc.setFont(undefined, 'bold');
             doc.text(`Troca Equipamento:`, margin + 5, y);
             doc.setFont(undefined, 'normal');
             doc.text(`${equipe.trocaEquipamento || 'Não'}`, margin + 45, y); y += lineHeight;
             if (equipe.trocaEquipamento === 'Sim') {
                doc.text(`- Motivo: ${motivoTrocaDisplay || 'N/A'}`, margin + 10, y); y += lineHeight;
                // Usar splitTextToSize para quebrar texto longo (defeito/medidas)
                 const defeitoLines = doc.splitTextToSize(`- Defeito/Medidas: ${equipe.defeito || 'N/A'}`, pageWidth - margin * 2 - 15);
                 doc.text(defeitoLines, margin + 10, y);
                 y += defeitoLines.length * lineHeight;

                if (equipe.placaNova) { checkAddPage(lineHeight); doc.text(`- Placa Nova: ${equipe.placaNova}`, margin + 10, y); y += lineHeight; }
                if (equipe.dataHoraTroca) { checkAddPage(lineHeight); doc.text(`- Data/Hora: ${equipe.dataHoraTroca}`, margin + 10, y); y += lineHeight; }
             }

             // Materiais
             checkAddPage(30);
             doc.setFont(undefined, 'bold');
             doc.text(`Materiais:`, margin + 5, y); y += lineHeight;
             doc.setFont(undefined, 'normal');
             if (tipo === 'Alta Pressão' && equipe.materiais) {
                 doc.text(`Pistola: ${equipe.materiais.pistola ?? 'N/A'}`, margin + 10, y);
                 doc.text(`Pistola C.L.: ${equipe.materiais.pistolaCanoLongo ?? 'N/A'}`, margin + 80, y); y += lineHeight;
                 doc.text(`Mang. Torpedo: ${equipe.materiais.mangueiraTorpedo ?? 'N/A'}`, margin + 10, y);
                 doc.text(`Pedal: ${equipe.materiais.pedal ?? 'N/A'}`, margin + 80, y); y += lineHeight;
                 doc.text(`Varetas: ${equipe.materiais.varetas ?? 'N/A'}`, margin + 10, y);
                 doc.text(`Rabicho: ${equipe.materiais.rabicho ?? 'N/A'}`, margin + 80, y); y += lineHeight;
                 doc.text(`Lances Mang.: ${equipe.lancesMangueira ?? 'N/A'}`, margin + 10, y);
                 doc.text(`Lances Var.: ${equipe.lancesVaretas ?? 'N/A'}`, margin + 80, y); y += lineHeight;
            } else if (tipo !== 'Alta Pressão' && equipe.materiaisVacuo) {
                 doc.text(`Mangotes Check: ${equipe.materiaisVacuo.mangotes ?? 'N/A'}`, margin + 10, y);
                 doc.text(`Reduções Check: ${equipe.materiaisVacuo.reducoes ?? 'N/A'}`, margin + 80, y); y += lineHeight;
                 doc.text(`Mangotes 3": ${equipe.mangotes3Polegadas ?? 'N/A'}`, margin + 10, y);
                 doc.text(`Mangotes 4": ${equipe.mangotes4Polegadas ?? 'N/A'}`, margin + 80, y); y += lineHeight;
                 doc.text(`Mangotes 6": ${equipe.mangotes6Polegadas ?? 'N/A'}`, margin + 10, y); y += lineHeight;
            }
             if (equipe.justificativa) {
                 checkAddPage(15);
                 const justifLines = doc.splitTextToSize(`Justificativa Falta: ${equipe.justificativa}`, pageWidth - margin * 2 - 15);
                 doc.text(justifLines, margin + 10, y);
                 y += justifLines.length * lineHeight;
             }

             // Segurança
             checkAddPage(15);
             doc.setFont(undefined, 'bold');
             doc.text(`Segurança:`, margin + 5, y); y += lineHeight;
             doc.setFont(undefined, 'normal');
             doc.text(`Caixa Bloqueio: ${equipe.caixaBloqueio ?? 'N/A'}`, margin + 10, y);
             doc.text(`Cadeados: ${equipe.cadeados ?? 'N/A'}`, margin + 80, y); y += lineHeight;
             doc.text(`Plaquetas: ${equipe.plaquetas ?? 'N/A'}`, margin + 10, y); y += lineHeight;


            // Observações
            if (equipe.observacoes) {
                 checkAddPage(15);
                 doc.setFont(undefined, 'bold');
                 doc.text(`Observações:`, margin + 5, y); y += lineHeight;
                 doc.setFont(undefined, 'normal');
                  const obsLines = doc.splitTextToSize(equipe.observacoes, pageWidth - margin * 2 - 10);
                  doc.text(obsLines, margin + 10, y);
                  y += obsLines.length * lineHeight;
            }
             y += lineHeight; // Espaço extra entre equipes
        });
     }


    // --- Rodapé (na última página) ---
     const pageCount = doc.internal.getNumberOfPages();
     doc.setPage(pageCount);
     y = pageHeight - margin - smallLineHeight * 2; // Posição no final
     doc.setLineWidth(0.5);
     doc.line(margin, y, pageWidth - margin, y);
     y += smallLineHeight * 1.5;
     doc.setFontSize(smallTextStyle.fontSize);
     doc.setFont(undefined, 'italic');
     doc.text(`Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.0'}`, margin, y);
     doc.text(`Página ${pageCount}`, pageWidth - margin, y, { align: 'right' });


    // --- Salvar PDF ---
    doc.save(`relatorio_turno_${dadosTurnoPDF.data}_${relatorioId}.pdf`);
    mostrarNotificacao('PDF gerado com sucesso!', 'success');
}


/**
 * Formatar WhatsApp de relatório existente (Local ou Servidor)
 */
async function formatarWhatsAppExistente(id, origem = 'servidor') {
   if (!id) {
      mostrarNotificacao("ID inválido para formatar.", "danger");
      return;
  }
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
      // Buscar da API (Assumindo action 'formatarWhatsApp')
      const result = await callAPI('formatarWhatsApp', { relatorioId: id });
      if (result && result.success && result.relatorio) {
        textoWhatsApp = result.relatorio;
      } else {
        throw new Error(result?.message || 'Erro ao formatar relatório do servidor.');
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

    // Configurar botão voltar para ir para a pesquisa
    const btnVoltarWhatsApp = document.getElementById('btnVoltarWhatsApp');
    if (btnVoltarWhatsApp) {
       btnVoltarWhatsApp.onclick = voltarDaVisualizacaoParaPesquisa; // Mesma função de voltar
    }
  } catch (error) {
    console.error('Erro ao formatar WhatsApp para relatório existente:', error);
    mostrarNotificacao('Erro ao formatar: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}


/**
 * Gerar texto WhatsApp para relatório local (Melhorado)
 */
function gerarTextoWhatsAppLocal(relatorio) {
  if (!relatorio || !relatorio.dadosTurno || !relatorio.equipes) {
    return 'Erro: Dados do relatório local inválidos ou ausentes.';
  }

  const { dadosTurno, equipes } = relatorio;
  let texto = '';
  const nl = '\n'; // Nova linha

  texto += "📋 *RELATÓRIO DE TURNO (LOCAL)* 📋" + nl + nl;
  texto += `📅 *Data:* ${formatarData(dadosTurno.data)}` + nl;
  texto += `🕒 *Horário:* ${dadosTurno.horario || 'N/A'}` + nl;
  texto += `🔤 *Letra:* ${dadosTurno.letra || 'N/A'}` + nl;
  texto += `👨‍💼 *Supervisor:* ${dadosTurno.supervisor || 'N/A'}` + nl + nl;

   // Separar equipes por tipo
  const equipesPorTipo = equipes.reduce((acc, equipe) => {
    const tipo = equipe.tipo || 'Outro';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(equipe);
    return acc;
  }, {});


  // Processar cada tipo
  for (const tipo in equipesPorTipo) {
      const equipesDoTipo = equipesPorTipo[tipo];
      const icone = tipo === 'Alta Pressão' ? '🔵' : '🔴'; // Ícone baseado no tipo
      texto += `${icone} *EQUIPES ${tipo.toUpperCase()} (${equipesDoTipo.length})* ${icone}` + nl + nl;

       equipesDoTipo.forEach((equipe, index) => {
          const vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
          const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
           const motivoTrocaDisplay = equipe.motivoTroca === 'Outros Motivos (Justificar)' ? equipe.motivoOutro : equipe.motivoTroca;

          texto += `▶️ *Equipe ${index + 1} (${equipe.numero || 'N/A'})* ◀️` + nl;
          texto += `👥 *Integrantes:* ${equipe.integrantes || 'N/A'}` + nl;
          texto += `📍 *Área:* ${equipe.area || 'N/A'}` + nl;
          texto += `🛠️ *Atividade:* ${equipe.atividade || 'N/A'}` + nl;
          texto += `🚚 *Vaga:* ${vagaDisplay || 'N/A'}` + nl;
          texto += `🔧 *Equipamento:* ${equipDisplay || 'N/A'}` + nl;

          // Materiais específicos (simplificado)
          if (tipo === 'Alta Pressão') {
              if(equipe.lancesMangueira && equipe.lancesMangueira !== 'N/A') texto += `- Lances Mang.: ${equipe.lancesMangueira}` + nl;
              if(equipe.lancesVaretas && equipe.lancesVaretas !== 'N/A') texto += `- Lances Var.: ${equipe.lancesVaretas}` + nl;
          } else { // Vácuo
              if(equipe.mangotes3Polegadas && equipe.mangotes3Polegadas !== 'N/A') texto += `- Mang. 3": ${equipe.mangotes3Polegadas}` + nl;
              if(equipe.mangotes4Polegadas && equipe.mangotes4Polegadas !== 'N/A') texto += `- Mang. 4": ${equipe.mangotes4Polegadas}` + nl;
              if(equipe.mangotes6Polegadas && equipe.mangotes6Polegadas !== 'N/A') texto += `- Mang. 6": ${equipe.mangotes6Polegadas}` + nl;
          }

          // Troca (se houver)
          if (equipe.trocaEquipamento === 'Sim') {
            texto += nl + "🔄 *TROCA EQUIPAMENTO:* Sim" + nl;
            texto += `- Motivo: ${motivoTrocaDisplay || 'Não especificado'}` + nl;
            if (equipe.defeito) texto += `- Defeito: ${equipe.defeito}` + nl;
            if (equipe.placaNova) texto += `- Placa Nova: ${equipe.placaNova}` + nl;
          }

          // Observações (se houver)
          if (equipe.observacoes) {
            texto += nl + `📝 *Obs:* ${equipe.observacoes}` + nl;
          }

          texto += nl; // Espaço entre equipes
        });
  }


  texto += "----------------------------" + nl;
  texto += "📱 _Relatório gerado pelo Sistema v" + (window.CONFIG?.VERSAO_APP || '3.0') + "_" + nl;
  texto += "----------------------------";

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
    // Fallback se o módulo não estiver disponível
    mostrarNotificacao('Módulo de dashboard não está disponível.', 'warning');
     voltarDoDashboard(); // Volta para o início
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
      // Adicionar 'T00:00:00' para evitar problemas de fuso horário ao converter YYYY-MM-DD
      const dataStr = String(dataInput);
      if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
           // Usar UTC para evitar problemas de fuso apenas na conversão da string
          const parts = dataStr.substring(0, 10).split('-');
          dataObj = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      } else {
          // Tentar parse genérico para outros formatos como DD/MM/YYYY ou timestamp
          dataObj = new Date(dataInput);
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
      // Tenta parsear string (ISO 8601, timestamp, etc)
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
// (Muitas já são globais por padrão se não estiverem dentro de um módulo ou IIFE)
window.inicializarFormulario = inicializarFormulario; // Chamado por main.js
window.mostrarLoading = mostrarLoading; // Usado internamente e pelo wrapper
window.ocultarLoading = ocultarLoading; // Usado internamente e pelo wrapper
window.mostrarNotificacao = mostrarNotificacao; // Usado internamente e pelo wrapper

// Navegação
window.avancarParaEquipes = avancarParaEquipes;
window.voltarParaTurno = voltarParaTurno;
window.avancarParaRevisao = avancarParaRevisao;
window.voltarParaEquipes = voltarParaEquipes;
window.voltarParaSucesso = voltarParaSucesso;
window.voltarDoWhatsApp = voltarDoWhatsApp;
window.voltarDaPesquisa = voltarDaPesquisa;
window.voltarDoDashboard = voltarDoDashboard;
window.voltarDaVisualizacaoParaPesquisa = voltarDaVisualizacaoParaPesquisa;


// Equipes (Chamadas de botões e selects no HTML)
window.adicionarEquipe = adicionarEquipe;
window.editarEquipe = editarEquipe;
window.removerEquipe = removerEquipe;
window.salvarEquipe = salvarEquipe; // Chamado pelo botão/submit do modal
// window.atualizarListaEquipes = atualizarListaEquipes; // Chamado internamente ou via AppState listener
// window.atualizarBotaoAvancar = atualizarBotaoAvancar; // Chamado internamente ou via AppState listener
window.toggleVagaPersonalizada = toggleVagaPersonalizada; // Chamado pelo onchange do select
window.toggleEquipamentoPersonalizado = toggleEquipamentoPersonalizado; // Chamado pelo onchange do select
window.toggleTrocaEquipamento = toggleTrocaEquipamento; // Chamado pelo onchange dos radios
window.toggleMotivoOutro = toggleMotivoOutro; // Chamado pelo onchange dos radios de motivo

// Relatório (Chamadas de botões)
// window.salvarRelatorio = salvarRelatorio; // Descontinuado
// window.salvarRelatorioLocal = salvarRelatorioLocal; // Chamado internamente
window.salvarRelatorioComFallback = salvarRelatorioComFallback;
window.novoRelatorio = novoRelatorio;
window.visualizarRelatorio = visualizarRelatorio;
window.formatarWhatsApp = formatarWhatsApp;
window.copiarRelatorio = copiarRelatorio;
window.copiarWhatsApp = copiarWhatsApp;
window.gerarPDF = gerarPDF; // Função auxiliar chamada por gerarPDFExistente

// Pesquisa (Chamadas de botões e selects)
window.abrirPesquisa = abrirPesquisa; // Chamado pelo botão principal
window.ajustarCampoPesquisa = ajustarCampoPesquisa; // Chamado pelo onchange do select
window.executarPesquisa = executarPesquisa; // Chamado pelo botão de pesquisa
window.visualizarRelatorioExistente = visualizarRelatorioExistente; // Chamado pelos botões nos resultados
window.gerarPDFExistente = gerarPDFExistente; // Chamado pelos botões nos resultados
window.formatarWhatsAppExistente = formatarWhatsAppExistente; // Chamado pelos botões nos resultados

// Outros (Chamadas de botões)
window.mostrarDashboard = mostrarDashboard; // Chamado pelo botão principal
window.mostrarHelp = mostrarHelp; // Chamado pelo botão principal
