/**
 * Sistema de Relatório de Turno v3.0
 * Arquivo principal de lógica da aplicação (app.js)
 */

// Variáveis globais
let equipes = [];
let dadosTurno = {};
let ultimoRelatorioId = null;
let modalEquipe = null;
let modalHelp = null;
let toastNotificacao = null;

// Dados para facilitar o trabalho offline
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
  modalEquipe = new bootstrap.Modal(modalEquipeElement);
} else {
  console.warn('Elemento modalEquipe não encontrado no DOM');
}

if (modalHelpElement) {
  modalHelp = new bootstrap.Modal(modalHelpElement);
} else {
  console.warn('Elemento modalHelp não encontrado no DOM');
}
    
    // Inicializar toast (notificação)
    const toastElement = document.getElementById('toastNotificacao');
    if (toastElement) {
      toastNotificacao = new bootstrap.Toast(toastElement);
    }
    
    // Carregar dados do formulário
    await carregarDadosFormulario();
    
    // Configurar validação de formulário
    configureFormValidation();
    
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Sincronizar com AppState se disponível
    syncWithAppState();
    
    console.log('Formulário inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar formulário:', error);
    mostrarNotificacao('Erro ao inicializar o formulário. Tente recarregar a página.', 'danger');
  }
}

/**
 * Carregar dados do formulário
 */
async function carregarDadosFormulario() {
  mostrarLoading('Carregando dados do formulário...');
  
  try {
    // Tentar buscar da API
    const result = await obterDadosFormularioAPI();
    
    if (result && result.success) {
      dadosFormulario = result;
      
      // Preencher selects
      popularSelectOpcoes('horario', result.opcoesHorario);
      popularSelectOpcoes('letra', result.opcoesLetra);
      popularSelectOpcoes('supervisor', result.opcoesSupervisor);
      popularSelectOpcoes('equipeNumero', result.opcoesNumeroEquipe);
      
      // Preencher outros selects que são usados no modal
      popularSelectOpcoes('equipeLancesMangueira', result.opcoesLances);
      popularSelectOpcoes('equipeLancesVaretas', result.opcoesLances);
      popularSelectOpcoes('equipeMangotes3Polegadas', result.opcoesMangotes);
      popularSelectOpcoes('equipeMangotes4Polegadas', result.opcoesMangotes);
      popularSelectOpcoes('equipeMangotes6Polegadas', result.opcoesMangotes);
      popularSelectOpcoes('equipeCadeados', result.opcoesCadeadosPlaquetas);
      popularSelectOpcoes('equipePlaquetas', result.opcoesCadeadosPlaquetas);
      
      console.log('Dados do formulário carregados com sucesso');
    } else {
      throw new Error('Falha ao carregar dados do formulário');
    }
  } catch (error) {
    console.error('Erro ao carregar dados do formulário:', error);
    mostrarNotificacao('Erro ao carregar opções do formulário. Usando dados padrão.', 'warning');
    
    // Usar dados padrão de CONFIG em caso de erro
    if (window.CONFIG && CONFIG.OPCOES_FORMULARIO) {
      dadosFormulario = CONFIG.OPCOES_FORMULARIO;
      
      // Preencher selects com dados padrão
      popularSelectOpcoes('horario', CONFIG.OPCOES_FORMULARIO.opcoesHorario);
      popularSelectOpcoes('letra', CONFIG.OPCOES_FORMULARIO.opcoesLetra);
      popularSelectOpcoes('supervisor', CONFIG.OPCOES_FORMULARIO.opcoesSupervisor);
      popularSelectOpcoes('equipeNumero', CONFIG.OPCOES_FORMULARIO.opcoesNumeroEquipe);
      
      // Preencher outros selects
      popularSelectOpcoes('equipeLancesMangueira', CONFIG.OPCOES_FORMULARIO.opcoesLances);
      popularSelectOpcoes('equipeLancesVaretas', CONFIG.OPCOES_FORMULARIO.opcoesLances);
      popularSelectOpcoes('equipeMangotes3Polegadas', CONFIG.OPCOES_FORMULARIO.opcoesMangotes);
      popularSelectOpcoes('equipeMangotes4Polegadas', CONFIG.OPCOES_FORMULARIO.opcoesMangotes);
      popularSelectOpcoes('equipeMangotes6Polegadas', CONFIG.OPCOES_FORMULARIO.opcoesMangotes);
      popularSelectOpcoes('equipeCadeados', CONFIG.OPCOES_FORMULARIO.opcoesCadeadosPlaquetas);
      popularSelectOpcoes('equipePlaquetas', CONFIG.OPCOES_FORMULARIO.opcoesCadeadosPlaquetas);
    }
  } finally {
    ocultarLoading();
  }
}

/**
 * Popular um select com opções
 */
function popularSelectOpcoes(elementId, opcoes) {
  const select = document.getElementById(elementId);
  if (!select) return;
  
  // Guardar valor atual se existir
  const valorAtual = select.value;
  
  // Limpar opções existentes, exceto a primeira (placeholder)
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // Adicionar novas opções
  opcoes.forEach(opcao => {
    const option = document.createElement('option');
    option.value = opcao;
    option.textContent = opcao;
    select.appendChild(option);
  });
  
  // Restaurar valor se existia
  if (valorAtual && valorAtual !== '' && select.querySelector(`option[value="${valorAtual}"]`)) {
    select.value = valorAtual;
  }
}

/**
 * Configurar validação de formulários
 */
function configureFormValidation() {
  // Formulário principal de turno
  const formTurno = document.getElementById('formTurno');
  if (formTurno) {
    formTurno.addEventListener('submit', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.checkValidity()) {
        avancarParaEquipes();
      }
      
      this.classList.add('was-validated');
    });
  }
  
  // Formulário de equipe (no modal)
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.addEventListener('submit', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.checkValidity()) {
        salvarEquipe();
      }
      
      this.classList.add('was-validated');
    });
  }
}

/**
 * Configurar listeners de eventos
 */
function setupEventListeners() {
  // Adicionar listeners para selects que precisam de comportamento especial
  const equipeVaga = document.getElementById('equipeVaga');
  if (equipeVaga) {
    equipeVaga.addEventListener('change', toggleVagaPersonalizada);
  }
  
  const equipeEquipamento = document.getElementById('equipeEquipamento');
  if (equipeEquipamento) {
    equipeEquipamento.addEventListener('change', toggleEquipamentoPersonalizado);
  }
  
  // Adicionar listeners para radios
  const radioTrocaSim = document.getElementById('equipeTrocaSim');
  const radioTrocaNao = document.getElementById('equipeTrocaNao');
  if (radioTrocaSim && radioTrocaNao) {
    radioTrocaSim.addEventListener('change', toggleTrocaEquipamento);
    radioTrocaNao.addEventListener('change', toggleTrocaEquipamento);
  }
}

/**
 * Sincronizar com AppState se disponível
 */
function syncWithAppState() {
  if (window.AppState) {
    // Inicializar estado
    AppState.update('equipes', equipes);
    AppState.update('dadosTurno', dadosTurno);
    AppState.update('ultimoRelatorioId', ultimoRelatorioId);
  }
}

/**
 * Mostrar notificação
 */
function mostrarNotificacao(mensagem, tipo = 'success') {
  console.log(`Notificação [${tipo}]: ${mensagem}`);
  
  // Verificar se o sistema de notificações modular está disponível
  if (window.ModuleLoader && ModuleLoader.isInitialized('notifications')) {
    const Notifications = ModuleLoader.get('notifications');
    Notifications[tipo](mensagem);
    return;
  }
  
  // Fallback para toast bootstrap
  const toastElement = document.getElementById('toastNotificacao');
  const toastBody = document.getElementById('toastTexto');
  
  if (toastElement && toastBody) {
    // Ajustar classe conforme o tipo
    toastElement.className = toastElement.className.replace(/bg-\w+/, '');
    toastElement.classList.add(`bg-${tipo}`);
    
    // Definir texto
    toastBody.textContent = mensagem;
    
    // Mostrar toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  } else {
    // Último recurso: alert
    alert(mensagem);
  }
}

/**
 * Mostrar indicador de carregamento
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
 * Ocultar indicador de carregamento
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
  
  if (!formTurno.checkValidity()) {
    formTurno.classList.add('was-validated');
    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  // Salvar dados do turno
  dadosTurno = {
    data: document.getElementById('data').value,
    horario: document.getElementById('horario').value,
    letra: document.getElementById('letra').value,
    supervisor: document.getElementById('supervisor').value
  };
  
  // Atualizar AppState
  if (window.AppState) {
    AppState.update('dadosTurno', dadosTurno);
  }
  
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa de equipes
  document.getElementById('stepEquipes').style.display = 'block';
  
  // Atualizar indicadores
  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
  });
  
  document.getElementById('step1Indicator').classList.add('completed');
  document.getElementById('step2Indicator').classList.add('active');
  
  // Atualizar botão de avançar
  atualizarBotaoAvancar();
}

/**
 * Voltar para a etapa de turno
 */
function voltarParaTurno() {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa de turno
  document.getElementById('stepTurno').style.display = 'block';
  
  // Atualizar indicadores
  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
  });
  
  document.getElementById('step1Indicator').classList.add('active');
}

/**
 * Avançar para a etapa de revisão
 */
function avancarParaRevisao() {
  if (equipes.length === 0) {
    mostrarNotificacao('Adicione pelo menos uma equipe para continuar.', 'warning');
    return;
  }
  
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa de revisão
  document.getElementById('stepRevisao').style.display = 'block';
  
  // Atualizar indicadores
  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
  });
  
  document.getElementById('step1Indicator').classList.add('completed');
  document.getElementById('step2Indicator').classList.add('completed');
  document.getElementById('step3Indicator').classList.add('active');
  
  // Preencher resumo do turno
  const resumoTurno = document.getElementById('resumoTurno');
  if (resumoTurno) {
    resumoTurno.innerHTML = `
      <div class="info-item">
        <div class="info-label">Data</div>
        <div class="info-value">${formatarData(dadosTurno.data)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${dadosTurno.horario}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Letra</div>
        <div class="info-value">${dadosTurno.letra}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Supervisor</div>
        <div class="info-value">${dadosTurno.supervisor}</div>
      </div>
    `;
  }
  
  // Preencher resumo das equipes
  const resumoEquipes = document.getElementById('resumoEquipes');
  if (resumoEquipes) {
    let html = '';
    
    equipes.forEach((equipe, index) => {
      // Determinar classe CSS para a cor da borda
      const borderClass = equipe.tipo === 'Alta Pressão' ? 'border-primary' : 'border-danger';
      
      html += `
        <div class="card mb-3 ${borderClass}">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Equipe ${index + 1}: ${equipe.numero}</h5>
            <div class="badge ${equipe.tipo === 'Alta Pressão' ? 'bg-primary' : 'bg-danger'}">${equipe.tipo}</div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-2">
                <strong>Integrantes:</strong> ${equipe.integrantes}
              </div>
              <div class="col-md-6 mb-2">
                <strong>Área:</strong> ${equipe.area}
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <strong>Atividade:</strong> ${equipe.atividade}
              </div>
              <div class="col-md-6 mb-2">
                <strong>Vaga:</strong> ${equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga}
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <strong>Equipamento:</strong> ${equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento}
              </div>
              <div class="col-md-6 mb-2">
                <strong>Troca Equipamento:</strong> ${equipe.trocaEquipamento}
              </div>
            </div>
      `;
      
      // Adicionar detalhes de troca se houver
      if (equipe.trocaEquipamento === 'Sim') {
        let motivoText = equipe.motivoTroca;
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
          motivoText = equipe.motivoOutro;
        }
        
        html += `
          <div class="alert alert-warning mt-2">
            <div><strong>Motivo da Troca:</strong> ${motivoText}</div>
        `;
        
        if (equipe.defeito) {
          html += `<div><strong>Defeito/Medidas:</strong> ${equipe.defeito}</div>`;
        }
        
        if (equipe.placaNova) {
          html += `<div><strong>Nova Placa:</strong> ${equipe.placaNova}</div>`;
        }
        
        if (equipe.dataHoraTroca) {
          html += `<div><strong>Data/Hora Troca:</strong> ${equipe.dataHoraTroca}</div>`;
        }
        
        html += `</div>`;
      }
      
      // Adicionar seção de materiais
      html += `
        <h6 class="mt-3">Materiais e Segurança</h6>
        <div class="row">
          <div class="col-md-6">
            <div class="alert alert-light">
      `;
      
      // Materiais específicos por tipo
      if (equipe.tipo === 'Alta Pressão') {
        html += `
          <div><strong>Pistola:</strong> ${equipe.materiais?.pistola || 'N/A'}</div>
          <div><strong>Pistola Cano Longo:</strong> ${equipe.materiais?.pistolaCanoLongo || 'N/A'}</div>
          <div><strong>Lances Mangueira:</strong> ${equipe.lancesMangueira || 'N/A'}</div>
          <div><strong>Lances Varetas:</strong> ${equipe.lancesVaretas || 'N/A'}</div>
        `;
      } else {
        html += `
          <div><strong>Mangotes:</strong> ${equipe.materiaisVacuo?.mangotes || 'N/A'}</div>
          <div><strong>Mangotes 3":</strong> ${equipe.mangotes3Polegadas || 'N/A'}</div>
          <div><strong>Mangotes 4":</strong> ${equipe.mangotes4Polegadas || 'N/A'}</div>
          <div><strong>Mangotes 6":</strong> ${equipe.mangotes6Polegadas || 'N/A'}</div>
        `;
      }
      
      html += `
            </div>
          </div>
          <div class="col-md-6">
            <div class="alert alert-light">
              <div><strong>Caixa Bloqueio:</strong> ${equipe.caixaBloqueio}</div>
              <div><strong>Cadeados:</strong> ${equipe.cadeados}</div>
              <div><strong>Plaquetas:</strong> ${equipe.plaquetas}</div>
            </div>
          </div>
        </div>
      `;
      
      // Adicionar observações se houver
      if (equipe.observacoes) {
        html += `
          <div class="alert alert-secondary">
            <strong>Observações:</strong> ${equipe.observacoes}
          </div>
        `;
      }
      
      // Fechar card
      html += `
          </div>
        </div>
      `;
    });
    
    resumoEquipes.innerHTML = html;
  }
}

/**
 * Voltar para a etapa de equipes
 */
function voltarParaEquipes() {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa de equipes
  document.getElementById('stepEquipes').style.display = 'block';
  
  // Atualizar indicadores
  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
  });
  
  document.getElementById('step1Indicator').classList.add('completed');
  document.getElementById('step2Indicator').classList.add('active');
}

// ========== GERENCIAMENTO DE EQUIPES ==========

/**
 * Adicionar equipe
 */
function adicionarEquipe(tipo) {
  // Limpar formulário
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.reset();
    formEquipe.classList.remove('was-validated');
  }
  
  // Definir tipo
  document.getElementById('equipeTipo').value = tipo;
  document.getElementById('equipeIndex').value = '-1'; // Nova equipe
  
  // Configurar cabeçalho do modal
  const modalHeader = document.getElementById('modalEquipeHeader');
  if (modalHeader) {
    if (tipo === 'Alta Pressão') {
      modalHeader.className = 'modal-header bg-primary text-white';
    } else {
      modalHeader.className = 'modal-header bg-danger text-white';
    }
  }
  
  // Configurar título do modal
  const modalTitle = document.getElementById('modalEquipeLabel');
  if (modalTitle) {
    modalTitle.textContent = `Adicionar Equipe - ${tipo}`;
  }
  
  // Mostrar/ocultar campos específicos por tipo
  if (tipo === 'Alta Pressão') {
    document.getElementById('materiaisAltaPressao').style.display = 'block';
    document.getElementById('materiaisVacuo').style.display = 'none';
    
    // Preencher vagas e equipamentos específicos
    if (dadosFormulario) {
      popularSelectOpcoes('equipeVaga', dadosFormulario.vagasAltaPressao);
      popularSelectOpcoes('equipeEquipamento', dadosFormulario.equipamentosAltaPressao);
    }
  } else {
    document.getElementById('materiaisAltaPressao').style.display = 'none';
    document.getElementById('materiaisVacuo').style.display = 'block';
    
    // Preencher vagas e equipamentos específicos
    if (dadosFormulario) {
      popularSelectOpcoes('equipeVaga', dadosFormulario.vagasVacuo);
      popularSelectOpcoes('equipeEquipamento', dadosFormulario.equipamentosVacuo);
    }
  }
  
  // Mostrar modal
  modalEquipe.show();
}

/**
 * Editar equipe
 */
function editarEquipe(index) {
  if (index < 0 || index >= equipes.length) {
    mostrarNotificacao('Equipe não encontrada.', 'error');
    return;
  }
  
  const equipe = equipes[index];
  
  // Limpar formulário
  const formEquipe = document.getElementById('formEquipe');
  if (formEquipe) {
    formEquipe.reset();
    formEquipe.classList.remove('was-validated');
  }
  
  // Definir tipo e índice
  document.getElementById('equipeTipo').value = equipe.tipo;
  document.getElementById('equipeIndex').value = index.toString();
  
  // Configurar cabeçalho do modal
  const modalHeader = document.getElementById('modalEquipeHeader');
  if (modalHeader) {
    if (equipe.tipo === 'Alta Pressão') {
      modalHeader.className = 'modal-header bg-primary text-white';
    } else {
      modalHeader.className = 'modal-header bg-danger text-white';
    }
  }
  
  // Configurar título do modal
  const modalTitle = document.getElementById('modalEquipeLabel');
  if (modalTitle) {
    modalTitle.textContent = `Editar Equipe - ${equipe.tipo}`;
  }
  
  // Mostrar/ocultar campos específicos por tipo
  if (equipe.tipo === 'Alta Pressão') {
    document.getElementById('materiaisAltaPressao').style.display = 'block';
    document.getElementById('materiaisVacuo').style.display = 'none';
    
    // Preencher vagas e equipamentos específicos
    if (dadosFormulario) {
      popularSelectOpcoes('equipeVaga', dadosFormulario.vagasAltaPressao);
      popularSelectOpcoes('equipeEquipamento', dadosFormulario.equipamentosAltaPressao);
    }
  } else {
    document.getElementById('materiaisAltaPressao').style.display = 'none';
    document.getElementById('materiaisVacuo').style.display = 'block';
    
    // Preencher vagas e equipamentos específicos
    if (dadosFormulario) {
      popularSelectOpcoes('equipeVaga', dadosFormulario.vagasVacuo);
      popularSelectOpcoes('equipeEquipamento', dadosFormulario.equipamentosVacuo);
    }
  }
  
  // Preencher campos com dados da equipe
  document.getElementById('equipeNumero').value = equipe.numero;
  document.getElementById('equipeIntegrantes').value = equipe.integrantes;
  document.getElementById('equipeArea').value = equipe.area;
  document.getElementById('equipeAtividade').value = equipe.atividade;
  document.getElementById('equipeVaga').value = equipe.vaga;
  
  if (equipe.vaga === 'OUTRA VAGA') {
    document.getElementById('vagaPersonalizadaContainer').style.display = 'block';
    document.getElementById('equipeVagaPersonalizada').value = equipe.vagaPersonalizada;
  }
  
  document.getElementById('equipeEquipamento').value = equipe.equipamento;
  
  if (equipe.equipamento === 'OUTRO EQUIPAMENTO') {
    document.getElementById('equipamentoPersonalizadoContainer').style.display = 'block';
    document.getElementById('equipeEquipamentoPersonalizado').value = equipe.equipamentoPersonalizado;
  }
  
  // Troca de equipamento
  if (equipe.trocaEquipamento === 'Sim') {
    document.getElementById('equipeTrocaSim').checked = true;
    document.getElementById('trocaDetalhes').style.display = 'block';
    
    // Preencher detalhes da troca
    if (equipe.motivoTroca) {
      const radioMotivo = document.querySelector(`input[name="equipeMotivoTroca"][value="${equipe.motivoTroca}"]`);
      if (radioMotivo) {
        radioMotivo.checked = true;
        
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)') {
          document.getElementById('motivoOutroContainer').style.display = 'block';
          document.getElementById('equipeMotivoOutro').value = equipe.motivoOutro || '';
        }
      }
    }
    
    document.getElementById('equipeDefeito').value = equipe.defeito || '';
    document.getElementById('equipePlacaNova').value = equipe.placaNova || '';
    document.getElementById('equipeDataHoraTroca').value = equipe.dataHoraTroca || '';
  } else {
    document.getElementById('equipeTrocaNao').checked = true;
  }
  
  // Materiais
  if (equipe.tipo === 'Alta Pressão' && equipe.materiais) {
    document.getElementById('equipePistola').value = equipe.materiais.pistola || 'N/A';
    document.getElementById('equipePistolaCanoLongo').value = equipe.materiais.pistolaCanoLongo || 'N/A';
    document.getElementById('equipeMangueiraTorpedo').value = equipe.materiais.mangueiraTorpedo || 'N/A';
    document.getElementById('equipePedal').value = equipe.materiais.pedal || 'N/A';
    document.getElementById('equipeVaretas').value = equipe.materiais.varetas || 'N/A';
    document.getElementById('equipeRabicho').value = equipe.materiais.rabicho || 'N/A';
    document.getElementById('equipeLancesMangueira').value = equipe.lancesMangueira || 'N/A';
    document.getElementById('equipeLancesVaretas').value = equipe.lancesVaretas || 'N/A';
  } else if (equipe.tipo !== 'Alta Pressão' && equipe.materiaisVacuo) {
    document.getElementById('equipeMangotes').value = equipe.materiaisVacuo.mangotes || 'N/A';
    document.getElementById('equipeReducoes').value = equipe.materiaisVacuo.reducoes || 'N/A';
    document.getElementById('equipeMangotes3Polegadas').value = equipe.mangotes3Polegadas || 'N/A';
    document.getElementById('equipeMangotes4Polegadas').value = equipe.mangotes4Polegadas || 'N/A';
    document.getElementById('equipeMangotes6Polegadas').value = equipe.mangotes6Polegadas || 'N/A';
  }
  
  // Outros campos
  document.getElementById('equipeJustificativa').value = equipe.justificativa || '';
  
  if (equipe.caixaBloqueio === 'Sim') {
    document.getElementById('caixaBloqueioSim').checked = true;
  } else {
    document.getElementById('caixaBloqueioNao').checked = true;
  }
  
  document.getElementById('equipeCadeados').value = equipe.cadeados || 'N/A';
  document.getElementById('equipePlaquetas').value = equipe.plaquetas || 'N/A';
  document.getElementById('equipeObservacoes').value = equipe.observacoes || '';
  
  // Mostrar modal
  modalEquipe.show();
}

/**
 * Remover equipe
 */
function removerEquipe(index) {
  if (index < 0 || index >= equipes.length) {
    mostrarNotificacao('Equipe não encontrada.', 'error');
    return;
  }
  
  // Confirmar exclusão
  if (confirm('Tem certeza que deseja remover esta equipe?')) {
    equipes.splice(index, 1);
    
    // Atualizar AppState
    if (window.AppState) {
      AppState.update('equipes', equipes);
    }
    
    // Atualizar lista de equipes
    atualizarListaEquipes();
    
    // Atualizar botão de avançar
    atualizarBotaoAvancar();
    
    mostrarNotificacao('Equipe removida com sucesso.', 'success');
  }
}

/**
 * Salvar equipe
 */
function salvarEquipe() {
  const formEquipe = document.getElementById('formEquipe');
  
  if (!formEquipe.checkValidity()) {
    formEquipe.classList.add('was-validated');
    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  // Verificar se houve troca de equipamento e validar campos adicionais
  const trocaEquipamento = document.querySelector('input[name="equipeTroca"]:checked').value;
  if (trocaEquipamento === 'Sim') {
    const motivoTroca = document.querySelector('input[name="equipeMotivoTroca"]:checked')?.value;
    
    if (!motivoTroca) {
      document.getElementById('motivoTrocaFeedback').style.display = 'block';
      mostrarNotificacao('Por favor, selecione o motivo da troca.', 'warning');
      return;
    }
    
    if (motivoTroca === 'Outros Motivos (Justificar)' && !document.getElementById('equipeMotivoOutro').value) {
      document.getElementById('equipeMotivoOutro').classList.add('is-invalid');
      mostrarNotificacao('Por favor, especifique o motivo da troca.', 'warning');
      return;
    }
    
    if (!document.getElementById('equipeDefeito').value) {
      document.getElementById('equipeDefeito').classList.add('is-invalid');
      mostrarNotificacao('Por favor, descreva o defeito e as medidas tomadas.', 'warning');
      return;
    }
  }
  
  // Obter dados da equipe
  const tipo = document.getElementById('equipeTipo').value;
  const index = parseInt(document.getElementById('equipeIndex').value);
  
  const equipe = {
    tipo: tipo,
    numero: document.getElementById('equipeNumero').value,
    integrantes: document.getElementById('equipeIntegrantes').value,
    area: document.getElementById('equipeArea').value,
    atividade: document.getElementById('equipeAtividade').value,
    vaga: document.getElementById('equipeVaga').value,
    vagaPersonalizada: document.getElementById('equipeVaga').value === 'OUTRA VAGA' ? document.getElementById('equipeVagaPersonalizada').value : '',
    equipamento: document.getElementById('equipeEquipamento').value,
    equipamentoPersonalizado: document.getElementById('equipeEquipamento').value === 'OUTRO EQUIPAMENTO' ? document.getElementById('equipeEquipamentoPersonalizado').value : '',
    trocaEquipamento: document.querySelector('input[name="equipeTroca"]:checked').value,
    caixaBloqueio: document.querySelector('input[name="equipeCaixaBloqueio"]:checked').value,
    justificativa: document.getElementById('equipeJustificativa').value,
    cadeados: document.getElementById('equipeCadeados').value,
    plaquetas: document.getElementById('equipePlaquetas').value,
    observacoes: document.getElementById('equipeObservacoes').value
  };
  
  // Adicionar detalhes da troca se aplicável
  if (equipe.trocaEquipamento === 'Sim') {
    equipe.motivoTroca = document.querySelector('input[name="equipeMotivoTroca"]:checked').value;
    
    if (equipe.motivoTroca === 'Outros Motivos (Justificar)') {
      equipe.motivoOutro = document.getElementById('equipeMotivoOutro').value;
    }
    
    equipe.defeito = document.getElementById('equipeDefeito').value;
    equipe.placaNova = document.getElementById('equipePlacaNova').value;
    equipe.dataHoraTroca = document.getElementById('equipeDataHoraTroca').value;
  }
  
  // Adicionar materiais específicos por tipo
  if (tipo === 'Alta Pressão') {
    equipe.materiais = {
      pistola: document.getElementById('equipePistola').value,
      pistolaCanoLongo: document.getElementById('equipePistolaCanoLongo').value,
      mangueiraTorpedo: document.getElementById('equipeMangueiraTorpedo').value,
      pedal: document.getElementById('equipePedal').value,
      varetas: document.getElementById('equipeVaretas').value,
      rabicho: document.getElementById('equipeRabicho').value
    };
    
    equipe.lancesMangueira = document.getElementById('equipeLancesMangueira').value;
    equipe.lancesVaretas = document.getElementById('equipeLancesVaretas').value;
  } else {
    equipe.materiaisVacuo = {
      mangotes: document.getElementById('equipeMangotes').value,
      reducoes: document.getElementById('equipeReducoes').value
    };
    
    equipe.mangotes3Polegadas = document.getElementById('equipeMangotes3Polegadas').value;
    equipe.mangotes4Polegadas = document.getElementById('equipeMangotes4Polegadas').value;
    equipe.mangotes6Polegadas = document.getElementById('equipeMangotes6Polegadas').value;
  }
  
  // Salvar equipe
  if (index >= 0) {
    // Editar equipe existente
    equipes[index] = equipe;
    mostrarNotificacao('Equipe atualizada com sucesso.', 'success');
  } else {
    // Adicionar nova equipe
    equipes.push(equipe);
    mostrarNotificacao('Equipe adicionada com sucesso.', 'success');
  }
  
  // Atualizar AppState
  if (window.AppState) {
    AppState.update('equipes', equipes);
  }
  
  // Atualizar lista de equipes
  atualizarListaEquipes();
  
  // Atualizar botão de avançar
  atualizarBotaoAvancar();
  
  // Fechar modal
  modalEquipe.hide();
}

/**
 * Atualizar lista de equipes
 */
function atualizarListaEquipes() {
  const listaEquipes = document.getElementById('listaEquipes');
  const semEquipes = document.getElementById('semEquipes');
  
  if (!listaEquipes) return;
  
  // Mostrar ou ocultar mensagem "sem equipes"
  if (semEquipes) {
    semEquipes.style.display = equipes.length === 0 ? 'block' : 'none';
  }
  
  // Limpar lista atual
  const cards = listaEquipes.querySelectorAll('.equipe-card');
  cards.forEach(card => {
    if (card !== semEquipes) {
      card.remove();
    }
  });
  
  // Adicionar cards das equipes
  equipes.forEach((equipe, index) => {
    const cardClass = equipe.tipo === 'Alta Pressão' ? 'equipe-card card' : 'equipe-card card equipe-vacuo';
    const card = document.createElement('div');
    card.className = cardClass;
    
    card.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">${equipe.numero} <span class="badge badge-equipe">${equipe.tipo}</span></h5>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-warning" onclick="editarEquipe(${index})">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button type="button" class="btn btn-danger" onclick="removerEquipe(${index})">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div><strong>Integrantes:</strong> ${equipe.integrantes}</div>
        <div><strong>Área:</strong> ${equipe.area}</div>
        <div><strong>Atividade:</strong> ${equipe.atividade}</div>
        <div><strong>Troca Equipamento:</strong> ${equipe.trocaEquipamento}</div>
      </div>
    `;
    
    listaEquipes.appendChild(card);
  });
}

/**
 * Atualizar botão de avançar para revisão
 */
function atualizarBotaoAvancar() {
  const btnAvancarRevisao = document.getElementById('btnAvancarRevisao');
  
  if (btnAvancarRevisao) {
    btnAvancarRevisao.disabled = equipes.length === 0;
  }
}

// ========== FUNÇÕES DE CONTROLE DE FORMULÁRIO ==========

/**
 * Mostrar/ocultar campo de vaga personalizada
 */
function toggleVagaPersonalizada() {
  const equipeVaga = document.getElementById('equipeVaga');
  const vagaPersonalizadaContainer = document.getElementById('vagaPersonalizadaContainer');
  const equipeVagaPersonalizada = document.getElementById('equipeVagaPersonalizada');
  
  if (equipeVaga && vagaPersonalizadaContainer && equipeVagaPersonalizada) {
    if (equipeVaga.value === 'OUTRA VAGA') {
      vagaPersonalizadaContainer.style.display = 'block';
      equipeVagaPersonalizada.setAttribute('required', '');
    } else {
      vagaPersonalizadaContainer.style.display = 'none';
      equipeVagaPersonalizada.removeAttribute('required');
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
    if (equipeEquipamento.value === 'OUTRO EQUIPAMENTO') {
      equipamentoPersonalizadoContainer.style.display = 'block';
      equipeEquipamentoPersonalizado.setAttribute('required', '');
    } else {
      equipamentoPersonalizadoContainer.style.display = 'none';
      equipeEquipamentoPersonalizado.removeAttribute('required');
    }
  }
}

/**
 * Mostrar/ocultar campos de troca de equipamento
 */
function toggleTrocaEquipamento() {
  const trocaEquipamento = document.querySelector('input[name="equipeTroca"]:checked');
  const trocaDetalhes = document.getElementById('trocaDetalhes');
  
  if (trocaEquipamento && trocaDetalhes) {
    if (trocaEquipamento.value === 'Sim') {
      trocaDetalhes.style.display = 'block';
    } else {
      trocaDetalhes.style.display = 'none';
    }
  }
}

/**
 * Mostrar/ocultar campo de motivo outro
 */
function toggleMotivoOutro() {
  const motivoOutro = document.getElementById('motivoOutro');
  const motivoOutroContainer = document.getElementById('motivoOutroContainer');
  const equipeMotivoOutro = document.getElementById('equipeMotivoOutro');
  
  if (motivoOutro && motivoOutroContainer && equipeMotivoOutro) {
    if (motivoOutro.checked) {
      motivoOutroContainer.style.display = 'block';
      equipeMotivoOutro.setAttribute('required', '');
    } else {
      motivoOutroContainer.style.display = 'none';
      equipeMotivoOutro.removeAttribute('required');
    }
  }
  
  // Ocultar mensagem de feedback
  const motivoTrocaFeedback = document.getElementById('motivoTrocaFeedback');
  if (motivoTrocaFeedback) {
    motivoTrocaFeedback.style.display = 'none';
  }
}

// ========== FUNÇÕES DE RELATÓRIO E SALVAMENTO ==========

/**
 * Salvar relatório
 */
async function salvarRelatorio() {
  mostrarLoading('Salvando relatório...');
  
  try {
    // Validar dados antes de enviar
    if (equipes.length === 0) {
      throw new Error('Adicione pelo menos uma equipe para salvar o relatório.');
    }
    
    // Validar dados do turno
    if (!dadosTurno.data || !dadosTurno.horario || !dadosTurno.letra || !dadosTurno.supervisor) {
      throw new Error('Dados do turno incompletos. Por favor, volte e preencha todos os campos.');
    }
    
    // Enviar dados para a API
    const result = await salvarTurnoAPI(dadosTurno, equipes);
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao salvar o relatório.');
    }
    
    // Guardar ID do relatório
    ultimoRelatorioId = result.relatorioId;
    
    // Atualizar AppState
    if (window.AppState) {
      AppState.update('ultimoRelatorioId', ultimoRelatorioId);
    }
    
    // Mostrar tela de sucesso
    mostrarTelaSucesso();
    
    // Atualizar mensagem de sucesso
    const mensagemSucessoStatus = document.getElementById('mensagemSucessoStatus');
    if (mensagemSucessoStatus) {
      mensagemSucessoStatus.textContent = `Relatório #${ultimoRelatorioId} registrado com sucesso!`;
    }
    
    mostrarNotificacao('Relatório salvo com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar relatório:', error);
    mostrarNotificacao('Erro ao salvar relatório: ' + error.message, 'danger');
    
    // Sugerir salvamento local
    if (confirm('Não foi possível salvar no servidor. Deseja salvar localmente?')) {
      salvarRelatorioLocal();
    }
  } finally {
    ocultarLoading();
  }
}

/**
 * Salvar relatório local
 */
function salvarRelatorioLocal() {
  try {
    // Gerar ID local
    const localId = 'local_' + new Date().getTime();
    
    // Criar objeto de relatório
    const relatorio = {
      id: localId,
      dadosTurno: dadosTurno,
      equipes: equipes,
      timestamp: new Date().toISOString(),
      origem: 'local'
    };
    
    // Buscar relatórios existentes
    let relatoriosLocais = [];
    try {
      const relatoriosJson = localStorage.getItem('relatorios_locais');
      if (relatoriosJson) {
        relatoriosLocais = JSON.parse(relatoriosJson);
      }
    } catch (e) {
      console.error('Erro ao carregar relatórios locais:', e);
      relatoriosLocais = [];
    }
    
    // Adicionar novo relatório
    relatoriosLocais.push(relatorio);
    
    // Salvar na localStorage
    localStorage.setItem('relatorios_locais', JSON.stringify(relatoriosLocais));
    
    // Guardar ID do relatório
    ultimoRelatorioId = localId;
    
    // Atualizar AppState
    if (window.AppState) {
      AppState.update('ultimoRelatorioId', ultimoRelatorioId);
    }
    
    // Mostrar tela de sucesso
    mostrarTelaSucesso();
    
    // Atualizar mensagem de sucesso
    const mensagemSucessoStatus = document.getElementById('mensagemSucessoStatus');
    if (mensagemSucessoStatus) {
      mensagemSucessoStatus.textContent = `Relatório salvo localmente. ID: ${localId}`;
    }
    
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
    // Validar dados antes de enviar
    if (equipes.length === 0) {
      throw new Error('Adicione pelo menos uma equipe para salvar o relatório.');
    }
    
    // Validar dados do turno
    if (!dadosTurno.data || !dadosTurno.horario || !dadosTurno.letra || !dadosTurno.supervisor) {
      throw new Error('Dados do turno incompletos. Por favor, volte e preencha todos os campos.');
    }
    
    // Tentar salvar na API
    try {
      const result = await salvarTurnoAPI(dadosTurno, equipes);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao salvar o relatório na API.');
      }
      
      // Guardar ID do relatório
      ultimoRelatorioId = result.relatorioId;
      
      // Atualizar AppState
      if (window.AppState) {
        AppState.update('ultimoRelatorioId', ultimoRelatorioId);
      }
      
      // Mostrar tela de sucesso
      mostrarTelaSucesso();
      
      // Atualizar mensagem de sucesso
      const mensagemSucessoStatus = document.getElementById('mensagemSucessoStatus');
      if (mensagemSucessoStatus) {
        mensagemSucessoStatus.textContent = `Relatório #${ultimoRelatorioId} registrado com sucesso!`;
      }
      
      mostrarNotificacao('Relatório salvo com sucesso!', 'success');
      return true;
    } catch (apiError) {
      console.error('Erro ao salvar na API, tentando localmente:', apiError);
      
      // Tentar salvar localmente
      const salvamentoLocal = salvarRelatorioLocal();
      if (!salvamentoLocal) {
        throw new Error('Falha ao salvar remotamente e localmente.');
      }
      
      return true;
    }
  } catch (error) {
    console.error('Erro ao salvar relatório:', error);
    mostrarNotificacao('Erro ao salvar relatório: ' + error.message, 'danger');
    return false;
  } finally {
    ocultarLoading();
  }
}

/**
 * Mostrar tela de sucesso
 */
function mostrarTelaSucesso() {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa de sucesso
  document.getElementById('stepSucesso').style.display = 'block';
}

/**
 * Criar novo relatório
 */
function novoRelatorio() {
  // Reiniciar dados
  dadosTurno = {};
  equipes = [];
  ultimoRelatorioId = null;
  
  // Atualizar AppState
  if (window.AppState) {
    AppState.update('dadosTurno', dadosTurno);
    AppState.update('equipes', equipes);
    AppState.update('ultimoRelatorioId', ultimoRelatorioId);
  }
  
  // Limpar formulários
  document.getElementById('formTurno').reset();
  document.getElementById('formTurno').classList.remove('was-validated');
  
  // Configurar data padrão como hoje
  const dataInput = document.getElementById('data');
  if (dataInput) {
    try {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000; // Offset em milissegundos
      const localDate = new Date(today.getTime() - offset);
      dataInput.value = localDate.toISOString().split('T')[0];
    } catch (e) {
      console.error("Erro ao definir data padrão:", e);
      dataInput.value = ''; // Fallback
    }
  }
  
  // Mostrar etapa inicial
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  document.getElementById('stepTurno').style.display = 'block';
  
  // Atualizar indicadores
  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
  });
  
  document.getElementById('step1Indicator').classList.add('active');
}

/**
 * Visualizar relatório
 */
async function visualizarRelatorio() {
  mostrarLoading('Gerando relatório...');
  
  try {
    // Verificar se temos ID do relatório
    if (!ultimoRelatorioId) {
      throw new Error('ID do relatório não encontrado.');
    }
    
    // Obter texto do relatório da API
    const result = await gerarRelatorioTextoAPI(ultimoRelatorioId);
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao gerar relatório.');
    }
    
    // Ocultar todas as etapas
    document.querySelectorAll('.content-step').forEach(step => {
      step.style.display = 'none';
    });
    
    // Mostrar etapa de relatório
    document.getElementById('stepRelatorio').style.display = 'block';
    
    // Preencher texto do relatório
    const relatorioTexto = document.getElementById('relatorioTexto');
    if (relatorioTexto) {
      relatorioTexto.textContent = result.relatorio;
    }
    
    // Configurar botão voltar
    const btnVoltarRelatorio = document.getElementById('btnVoltarRelatorio');
    if (btnVoltarRelatorio) {
      btnVoltarRelatorio.onclick = voltarParaSucesso;
    }
  } catch (error) {
    console.error('Erro ao visualizar relatório:', error);
    mostrarNotificacao('Erro ao visualizar relatório: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Formatar relatório para WhatsApp
 */
async function formatarWhatsApp() {
  mostrarLoading('Formatando para WhatsApp...');
  
  try {
    // Verificar se temos ID do relatório
    if (!ultimoRelatorioId) {
      throw new Error('ID do relatório não encontrado.');
    }
    
    // Obter texto formatado para WhatsApp
    const result = await formatarWhatsAppAPI(ultimoRelatorioId);
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao formatar para WhatsApp.');
    }
    
    // Ocultar todas as etapas
    document.querySelectorAll('.content-step').forEach(step => {
      step.style.display = 'none';
    });
    
    // Mostrar etapa de WhatsApp
    document.getElementById('stepWhatsApp').style.display = 'block';
    
    // Preencher texto do WhatsApp
    const whatsAppTexto = document.getElementById('whatsAppTexto');
    if (whatsAppTexto) {
      whatsAppTexto.textContent = result.relatorio;
    }
    
    // Configurar botão voltar
    const btnVoltarWhatsApp = document.getElementById('btnVoltarWhatsApp');
    if (btnVoltarWhatsApp) {
      btnVoltarWhatsApp.onclick = voltarParaSucesso;
    }
  } catch (error) {
    console.error('Erro ao formatar para WhatsApp:', error);
    mostrarNotificacao('Erro ao formatar para WhatsApp: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Voltar para a tela de sucesso
 */
function voltarParaSucesso() {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa de sucesso
  document.getElementById('stepSucesso').style.display = 'block';
}

/**
 * Voltar para Dashboard do WhatsApp
 */
function voltarDoWhatsApp() {
  voltarParaSucesso();
}

/**
 * Copiar relatório para a área de transferência
 */
function copiarRelatorio() {
  const relatorioTexto = document.getElementById('relatorioTexto');
  
  if (relatorioTexto) {
    try {
      navigator.clipboard.writeText(relatorioTexto.textContent)
        .then(() => {
          mostrarNotificacao('Relatório copiado para a área de transferência!', 'success');
        })
        .catch(err => {
          throw new Error('Falha ao copiar: ' + err.message);
        });
    } catch (error) {
      console.error('Erro ao copiar relatório:', error);
      
      // Fallback para seleção manual
      const range = document.createRange();
      range.selectNode(relatorioTexto);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          mostrarNotificacao('Relatório copiado para a área de transferência!', 'success');
        } else {
          mostrarNotificacao('Pressione Ctrl+C para copiar o texto selecionado.', 'info');
        }
      } catch (e) {
        mostrarNotificacao('Pressione Ctrl+C para copiar o texto selecionado.', 'info');
      }
      
      window.getSelection().removeAllRanges();
    }
  }
}

/**
 * Copiar texto WhatsApp para a área de transferência
 */
function copiarWhatsApp() {
  const whatsAppTexto = document.getElementById('whatsAppTexto');
  
  if (whatsAppTexto) {
    try {
      navigator.clipboard.writeText(whatsAppTexto.textContent)
        .then(() => {
          mostrarNotificacao('Texto copiado para a área de transferência!', 'success');
        })
        .catch(err => {
          throw new Error('Falha ao copiar: ' + err.message);
        });
    } catch (error) {
      console.error('Erro ao copiar texto WhatsApp:', error);
      
      // Fallback para seleção manual
      const range = document.createRange();
      range.selectNode(whatsAppTexto);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          mostrarNotificacao('Texto copiado para a área de transferência!', 'success');
        } else {
          mostrarNotificacao('Pressione Ctrl+C para copiar o texto selecionado.', 'info');
        }
      } catch (e) {
        mostrarNotificacao('Pressione Ctrl+C para copiar o texto selecionado.', 'info');
      }
      
      window.getSelection().removeAllRanges();
    }
  }
}

// ========== FUNÇÕES DE PESQUISA ==========

/**
 * Abrir tela de pesquisa
 */
function abrirPesquisa() {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa de pesquisa
  document.getElementById('stepPesquisa').style.display = 'block';
  
  // Reiniciar formulário de pesquisa
  const formPesquisa = document.getElementById('formPesquisa');
  if (formPesquisa) {
    formPesquisa.reset();
  }
  
  // Ocultar resultados
  const resultadosPesquisa = document.getElementById('resultadosPesquisa');
  if (resultadosPesquisa) {
    resultadosPesquisa.style.display = 'none';
  }
  
  // Ajustar campo de pesquisa
  ajustarCampoPesquisa();
}

/**
 * Ajustar campo de pesquisa conforme o tipo
 */
function ajustarCampoPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa');
  const termoPesquisa = document.getElementById('termoPesquisa');
  const labelPesquisa = document.getElementById('labelPesquisa');
  
  if (!tipoPesquisa || !termoPesquisa || !labelPesquisa) return;
  
  const tipo = tipoPesquisa.value;
  
  switch (tipo) {
    case 'data':
      labelPesquisa.textContent = 'Data (YYYY-MM-DD)';
      termoPesquisa.type = 'date';
      termoPesquisa.placeholder = '';
      break;
    case 'mes_ano':
      labelPesquisa.textContent = 'Mês/Ano (MM/YYYY)';
      termoPesquisa.type = 'month';
      termoPesquisa.placeholder = '';
      break;
    case 'supervisor':
      labelPesquisa.textContent = 'Nome do Supervisor';
      termoPesquisa.type = 'text';
      termoPesquisa.placeholder = 'Digite o nome do supervisor';
      break;
    case 'letra':
      labelPesquisa.textContent = 'Letra do Turno';
      termoPesquisa.type = 'text';
      termoPesquisa.placeholder = 'A, B, C, D, etc.';
      break;
    case 'local':
      labelPesquisa.textContent = 'Termo de Pesquisa Local';
      termoPesquisa.type = 'text';
      termoPesquisa.placeholder = 'Pesquisar relatórios locais';
      break;
    default: // geral
      labelPesquisa.textContent = 'Termo de Pesquisa';
      termoPesquisa.type = 'text';
      termoPesquisa.placeholder = 'Digite o termo de pesquisa';
  }
}

/**
 * Executar pesquisa
 */
async function executarPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa').value;
  let termoPesquisa = document.getElementById('termoPesquisa').value;
  
  // Ajustar termo conforme o tipo
  if (tipoPesquisa === 'data' && termoPesquisa) {
    // Já está no formato YYYY-MM-DD
  } else if (tipoPesquisa === 'mes_ano' && termoPesquisa) {
    // Converter de YYYY-MM para MM/YYYY
    const partes = termoPesquisa.split('-');
    if (partes.length === 2) {
      termoPesquisa = `${partes[1]}/${partes[0]}`;
    }
  }
  
  // Validar termo
  if (!termoPesquisa) {
    mostrarNotificacao('Por favor, digite um termo de pesquisa.', 'warning');
    return;
  }
  
  // Pesquisar relatórios
  mostrarLoading('Pesquisando relatórios...');
  
  try {
    let resultados = [];
    
    // Pesquisar localmente ou na API
    if (tipoPesquisa === 'local') {
      resultados = pesquisarRelatoriosLocais(termoPesquisa);
    } else {
      // Pesquisar na API
      const result = await pesquisarRelatoriosAPI(termoPesquisa, tipoPesquisa);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao pesquisar relatórios.');
      }
      
      resultados = result.resultados || [];
      
      // Adicionar origem
      resultados.forEach(relatório => {
        relatório.origem = 'servidor';
      });
    }
    
    // Exibir resultados
    exibirResultadosPesquisa(resultados);
  } catch (error) {
    console.error('Erro ao pesquisar relatórios:', error);
    mostrarNotificacao('Erro ao pesquisar relatórios: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Pesquisar relatórios locais
 */
function pesquisarRelatoriosLocais(termo) {
  // Buscar relatórios existentes
  let relatoriosLocais = [];
  try {
    const relatoriosJson = localStorage.getItem('relatorios_locais');
    if (relatoriosJson) {
      relatoriosLocais = JSON.parse(relatoriosJson);
    }
  } catch (e) {
    console.error('Erro ao carregar relatórios locais:', e);
    relatoriosLocais = [];
  }
  
  // Filtrar por termo
  const termoLower = termo.toLowerCase();
  return relatoriosLocais.filter(relatório => {
    const { dadosTurno } = relatório;
    
    // Buscar em vários campos
    return (
      dadosTurno.letra?.toLowerCase().includes(termoLower) ||
      dadosTurno.supervisor?.toLowerCase().includes(termoLower) ||
      dadosTurno.data?.includes(termo) ||
      dadosTurno.horario?.toLowerCase().includes(termoLower) ||
      relatório.id?.toLowerCase().includes(termoLower)
    );
  }).map(relatório => ({
    id: relatório.id,
    data: formatarData(relatório.dadosTurno.data),
    horario: relatório.dadosTurno.horario,
    letra: relatório.dadosTurno.letra,
    supervisor: relatório.dadosTurno.supervisor,
    origem: 'local'
  }));
}

/**
 * Exibir resultados da pesquisa
 */
function exibirResultadosPesquisa(resultados) {
  const resultadosPesquisa = document.getElementById('resultadosPesquisa');
  const tabelaResultados = document.getElementById('tabelaResultados');
  const semResultados = document.getElementById('semResultados');
  
  if (!resultadosPesquisa || !tabelaResultados || !semResultados) return;
  
  // Mostrar/ocultar containers
  resultadosPesquisa.style.display = 'block';
  semResultados.style.display = resultados.length === 0 ? 'block' : 'none';
  
  // Limpar tabela
  tabelaResultados.innerHTML = '';
  
  // Preencher tabela
  resultados.forEach(relatório => {
    const linha = document.createElement('tr');
    
    linha.innerHTML = `
      <td><span class="badge ${relatório.origem === 'local' ? 'bg-secondary' : 'bg-primary'}">${relatório.origem}</span></td>
      <td>${relatório.data}</td>
      <td>${relatório.horario}</td>
      <td>${relatório.letra}</td>
      <td>${relatório.supervisor}</td>
      <td class="text-center">
        <div class="action-buttons">
          <button type="button" class="btn btn-sm btn-primary" onclick="visualizarRelatorioExistente('${relatório.id}', '${relatório.origem}')">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn btn-sm btn-danger" onclick="gerarPDFExistente('${relatório.id}', '${relatório.origem}')">
            <i class="bi bi-file-pdf"></i>
          </button>
          <button type="button" class="btn btn-sm btn-info" onclick="formatarWhatsAppExistente('${relatório.id}', '${relatório.origem}')">
            <i class="bi bi-whatsapp"></i>
          </button>
        </div>
      </td>
    `;
    
    tabelaResultados.appendChild(linha);
  });
}

/**
 * Visualizar relatório existente
 */
async function visualizarRelatorioExistente(id, origem = 'servidor') {
  mostrarLoading('Carregando relatório...');
  
  try {
    // Guardar ID do relatório atual
    ultimoRelatorioId = id;
    
    // Atualizar AppState
    if (window.AppState) {
      AppState.update('ultimoRelatorioId', ultimoRelatorioId);
    }
    
    let textoRelatório = '';
    
    if (origem === 'local') {
      // Carregar relatório local
      const relatorioLocal = obterRelatorioLocal(id);
      if (!relatorioLocal) {
        throw new Error('Relatório local não encontrado.');
      }
      
      // Gerar texto manualmente (simplificado)
      textoRelatório = gerarTextoRelatorioLocal(relatorioLocal);
    } else {
      // Carregar da API
      const result = await gerarRelatorioTextoAPI(id);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao gerar relatório.');
      }
      
      textoRelatório = result.relatorio;
    }
    
    // Ocultar todas as etapas
    document.querySelectorAll('.content-step').forEach(step => {
      step.style.display = 'none';
    });
    
    // Mostrar etapa de relatório
    document.getElementById('stepRelatorio').style.display = 'block';
    
    // Preencher texto do relatório
    const relatorioTexto = document.getElementById('relatorioTexto');
    if (relatorioTexto) {
      relatorioTexto.textContent = textoRelatório;
    }
    
    // Configurar botão voltar
    const btnVoltarRelatorio = document.getElementById('btnVoltarRelatorio');
    if (btnVoltarRelatorio) {
      btnVoltarRelatorio.onclick = voltarDaPesquisa;
    }
  } catch (error) {
    console.error('Erro ao visualizar relatório existente:', error);
    mostrarNotificacao('Erro ao visualizar relatório: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Obter relatório local por ID
 */
function obterRelatorioLocal(id) {
  // Buscar relatórios existentes
  let relatoriosLocais = [];
  try {
    const relatoriosJson = localStorage.getItem('relatorios_locais');
    if (relatoriosJson) {
      relatoriosLocais = JSON.parse(relatoriosJson);
    }
  } catch (e) {
    console.error('Erro ao carregar relatórios locais:', e);
    return null;
  }
  
  // Buscar por ID
  return relatoriosLocais.find(relatório => relatório.id === id) || null;
}

/**
 * Gerar texto de relatório local
 */
function gerarTextoRelatorioLocal(relatório) {
  if (!relatório || !relatório.dadosTurno || !relatório.equipes) {
    return 'Relatório inválido.';
  }
  
  const { dadosTurno, equipes } = relatório;
  let texto = '';
  const linhaSeparadora = '='.repeat(72) + '\n';
  
  texto += linhaSeparadora;
  texto += '                     RELATÓRIO DE TURNO\n';
  texto += '                   GRUPO GPS - MECANIZADA\n';
  texto += linhaSeparadora + '\n';
  
  texto += 'INFORMAÇÕES GERAIS\n';
  texto += '-'.repeat(72) + '\n';
  texto += 'Data: ' + formatarData(dadosTurno.data) + '\n';
  texto += 'Horário: ' + (dadosTurno.horario || 'N/A') + '\n';
  texto += 'Letra do turno: ' + (dadosTurno.letra || 'N/A') + '\n';
  texto += 'Supervisor: ' + (dadosTurno.supervisor || 'N/A') + '\n';
  texto += 'ID do Relatório: ' + (relatório.id || 'N/A') + '\n';
  texto += 'Gerado em: ' + new Date().toLocaleString('pt-BR') + ' (LOCAL)\n';
  texto += '-'.repeat(72) + '\n\n';
  
  // Separar equipes por tipo
  const equipesPorTipo = {};
  
  equipes.forEach(equipe => {
    const tipo = equipe.tipo || 'Tipo Desconhecido';
    if (!equipesPorTipo[tipo]) {
      equipesPorTipo[tipo] = [];
    }
    equipesPorTipo[tipo].push(equipe);
  });
  
  // Processar cada tipo de equipe
  for (const tipo in equipesPorTipo) {
    const equipesDoTipo = equipesPorTipo[tipo];
    
    texto += linhaSeparadora;
    texto += `          EQUIPES DE ${tipo.toUpperCase()} (${equipesDoTipo.length})\n`;
    texto += linhaSeparadora + '\n';
    
    equipesDoTipo.forEach((equipe, index) => {
      texto += `EQUIPE ${index + 1} | ${equipe.numero || 'N/A'}\n`;
      texto += '-'.repeat(72) + '\n';
      texto += `Integrantes: ${equipe.integrantes || 'N/A'}\n`;
      texto += `Área: ${equipe.area || 'N/A'}\n`;
      texto += `Atividade: ${equipe.atividade || 'N/A'}\n`;
      
      const vagaDisplay = equipe.vaga === 'OUTRA VAGA' 
        ? (equipe.vagaPersonalizada || equipe.vaga) 
        : equipe.vaga;
      texto += `Vaga: ${vagaDisplay || 'N/A'}\n`;
      
      const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' 
        ? (equipe.equipamentoPersonalizado || equipe.equipamento) 
        : equipe.equipamento;
      texto += `Equipamento: ${equipDisplay || 'N/A'}\n`;
      
      // Detalhes da Troca
      texto += '\n> Status Equipamento:\n';
      
      if (equipe.trocaEquipamento === 'Sim') {
        texto += '  Houve troca: SIM\n';
        
        let motivo = equipe.motivoTroca;
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
          motivo = equipe.motivoOutro;
        }
        
        texto += `  - Motivo: ${motivo || 'Não especificado'}\n`;
        
        if (equipe.defeito) {
          texto += `  - Defeito/Medidas: ${equipe.defeito}\n`;
        }
        
        if (equipe.placaNova) {
          texto += `  - Placa Nova: ${equipe.placaNova}\n`;
        }
        
        if (equipe.dataHoraTroca) {
          texto += `  - Data/Hora Troca: ${equipe.dataHoraTroca}\n`;
        }
      } else {
        texto += '  Houve troca: NÃO\n';
      }
      
      // Materiais
      texto += '\n> Materiais Utilizados:\n';
      
      if (tipo === 'Alta Pressão' && equipe.materiais) {
        texto += `  - Pistola: ${equipe.materiais.pistola || 'N/A'}\n`;
        texto += `  - Pistola Cano Longo: ${equipe.materiais.pistolaCanoLongo || 'N/A'}\n`;
        texto += `  - Mang. Torpedo: ${equipe.materiais.mangueiraTorpedo || 'N/A'}\n`;
        texto += `  - Pedal: ${equipe.materiais.pedal || 'N/A'}\n`;
        texto += `  - Varetas: ${equipe.materiais.varetas || 'N/A'}\n`;
        texto += `  - Rabicho: ${equipe.materiais.rabicho || 'N/A'}\n`;
        texto += `  - Lances Mangueira: ${equipe.lancesMangueira || 'N/A'}\n`;
        texto += `  - Lances Varetas: ${equipe.lancesVaretas || 'N/A'}\n`;
      } else if (tipo !== 'Alta Pressão' && equipe.materiaisVacuo) {
        texto += `  - Mangotes: ${equipe.materiaisVacuo.mangotes || 'N/A'}\n`;
        texto += `  - Reduções: ${equipe.materiaisVacuo.reducoes || 'N/A'}\n`;
        texto += `  - Mangotes 3": ${equipe.mangotes3Polegadas || 'N/A'}\n`;
        texto += `  - Mangotes 4": ${equipe.mangotes4Polegadas || 'N/A'}\n`;
        texto += `  - Mangotes 6": ${equipe.mangotes6Polegadas || 'N/A'}\n`;
      }
      
      if (equipe.justificativa) {
        texto += `\n> Justificativa Materiais Falta:\n  ${equipe.justificativa}\n`;
      }
      
      // Segurança
      texto += '\n> Segurança:\n';
      texto += `  - Caixa Bloqueio: ${equipe.caixaBloqueio || 'Não'}\n`;
      texto += `  - Cadeados: ${equipe.cadeados || 'N/A'}\n`;
      texto += `  - Plaquetas: ${equipe.plaquetas || 'N/A'}\n`;
      
      if (equipe.observacoes) {
        texto += `\n> Observações Adicionais:\n  ${equipe.observacoes}\n`;
      }
      
      texto += '-'.repeat(72) + '\n\n';
    });
  }
  
  // Rodapé
  texto += linhaSeparadora;
  texto += `Sistema de Relatório de Turno v${window.CONFIG?.VERSAO_APP || '3.0'}\n`;
  texto += 'Este documento é oficial e foi gerado localmente.\n';
  texto += linhaSeparadora;
  
  return texto;
}

/**
 * Gerar PDF de relatório existente
 */
async function gerarPDFExistente(id, origem = 'servidor') {
  mostrarLoading('Gerando PDF...');
  
  try {
    // Guardar ID do relatório atual
    ultimoRelatorioId = id;
    
    // Atualizar AppState
    if (window.AppState) {
      AppState.update('ultimoRelatorioId', ultimoRelatorioId);
    }
    
    if (origem === 'local') {
      // Carregar relatório local
      const relatorioLocal = obterRelatorioLocal(id);
      if (!relatorioLocal) {
        throw new Error('Relatório local não encontrado.');
      }
      
      // Gerar PDF com dados locais
      await gerarPDF(relatorioLocal.dadosTurno, relatorioLocal.equipes);
    } else {
      // Carregar da API e gerar PDF
      await gerarPDF(null, null, id);
    }
  } catch (error) {
    console.error('Erro ao gerar PDF de relatório existente:', error);
    mostrarNotificacao('Erro ao gerar PDF: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Formatar WhatsApp de relatório existente
 */
async function formatarWhatsAppExistente(id, origem = 'servidor') {
  mostrarLoading('Formatando para WhatsApp...');
  
  try {
    // Guardar ID do relatório atual
    ultimoRelatorioId = id;
    
    // Atualizar AppState
    if (window.AppState) {
      AppState.update('ultimoRelatorioId', ultimoRelatorioId);
    }
    
    let textoWhatsApp = '';
    
    if (origem === 'local') {
      // Carregar relatório local
      const relatorioLocal = obterRelatorioLocal(id);
      if (!relatorioLocal) {
        throw new Error('Relatório local não encontrado.');
      }
      
      // Gerar texto WhatsApp manualmente (simplificado)
      textoWhatsApp = gerarTextoWhatsAppLocal(relatorioLocal);
    } else {
      // Carregar da API
      const result = await formatarWhatsAppAPI(id);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao formatar para WhatsApp.');
      }
      
      textoWhatsApp = result.relatorio;
    }
    
    // Ocultar todas as etapas
    document.querySelectorAll('.content-step').forEach(step => {
      step.style.display = 'none';
    });
    
    // Mostrar etapa de WhatsApp
    document.getElementById('stepWhatsApp').style.display = 'block';
    
    // Preencher texto do WhatsApp
    const whatsAppTexto = document.getElementById('whatsAppTexto');
    if (whatsAppTexto) {
      whatsAppTexto.textContent = textoWhatsApp;
    }
    
    // Configurar botão voltar
    const btnVoltarWhatsApp = document.getElementById('btnVoltarWhatsApp');
    if (btnVoltarWhatsApp) {
      btnVoltarWhatsApp.onclick = voltarDaPesquisa;
    }
  } catch (error) {
    console.error('Erro ao formatar WhatsApp para relatório existente:', error);
    mostrarNotificacao('Erro ao formatar para WhatsApp: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}

/**
 * Gerar texto WhatsApp para relatório local
 */
function gerarTextoWhatsAppLocal(relatório) {
  if (!relatório || !relatório.dadosTurno || !relatório.equipes) {
    return 'Relatório inválido.';
  }
  
  const { dadosTurno, equipes } = relatório;
  let texto = '';
  const nl = '\n'; // Nova linha
  
  texto += "📋 *RELATÓRIO DE TURNO* 📋" + nl + nl;
  texto += `📅 *Data:* ${formatarData(dadosTurno.data)}` + nl;
  texto += `🕒 *Horário:* ${dadosTurno.horario || 'N/A'}` + nl;
  texto += `🔤 *Letra:* ${dadosTurno.letra || 'N/A'}` + nl;
  texto += `👨‍💼 *Supervisor:* ${dadosTurno.supervisor || 'N/A'}` + nl + nl;
  
  // Separar equipes por tipo
  const equipesPorTipo = {};
  
  equipes.forEach(equipe => {
    const tipo = equipe.tipo || 'Tipo Desconhecido';
    if (!equipesPorTipo[tipo]) {
      equipesPorTipo[tipo] = [];
    }
    equipesPorTipo[tipo].push(equipe);
  });
  
  // Processar equipes de Alta Pressão
  if (equipesPorTipo['Alta Pressão']) {
    texto += `🔵 *EQUIPES ALTA PRESSÃO (${equipesPorTipo['Alta Pressão'].length})* 🔵` + nl + nl;
    
    equipesPorTipo['Alta Pressão'].forEach((equipe, index) => {
      texto += `▶️ *Equipe ${index + 1} (${equipe.numero || 'N/A'})* ◀️` + nl;
      texto += `👥 *Integrantes:* ${equipe.integrantes || 'N/A'}` + nl;
      texto += `📍 *Área:* ${equipe.area || 'N/A'}` + nl;
      texto += `🛠️ *Atividade:* ${equipe.atividade || 'N/A'}` + nl;
      
      const vagaDisplay = equipe.vaga === 'OUTRA VAGA' 
        ? (equipe.vagaPersonalizada || equipe.vaga) 
        : equipe.vaga;
      texto += `🚚 *Vaga:* ${vagaDisplay || 'N/A'}` + nl;
      
      const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' 
        ? (equipe.equipamentoPersonalizado || equipe.equipamento) 
        : equipe.equipamento;
      texto += `🔧 *Equipamento:* ${equipDisplay || 'N/A'}` + nl;
      
      if (equipe.trocaEquipamento === 'Sim') {
        texto += nl + "🔄 *TROCA EQUIPAMENTO:* Sim" + nl;
        
        let motivo = equipe.motivoTroca;
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
          motivo = equipe.motivoOutro;
        }
        
        texto += `- *Motivo:* ${motivo || 'Não especificado'}` + nl;
        
        if (equipe.defeito) {
          texto += `- *Defeito:* ${equipe.defeito}` + nl;
        }
        
        if (equipe.placaNova) {
          texto += `- *Placa Nova:* ${equipe.placaNova}` + nl;
        }
        
        if (equipe.dataHoraTroca) {
          texto += `- *Data/Hora:* ${equipe.dataHoraTroca}` + nl;
        }
      }
      
      if (equipe.observacoes) {
        texto += nl + `📝 *Obs:* ${equipe.observacoes}` + nl;
      }
      
      texto += nl; // Espaço entre equipes
    });
  }
  
  // Processar equipes de Vácuo
  if (equipesPorTipo['Auto Vácuo / Hiper Vácuo']) {
    texto += `🔴 *EQUIPES VÁCUO/HIPER VÁCUO (${equipesPorTipo['Auto Vácuo / Hiper Vácuo'].length})* 🔴` + nl + nl;
    
    equipesPorTipo['Auto Vácuo / Hiper Vácuo'].forEach((equipe, index) => {
      texto += `▶️ *Equipe ${index + 1} (${equipe.numero || 'N/A'})* ◀️` + nl;
      texto += `👥 *Integrantes:* ${equipe.integrantes || 'N/A'}` + nl;
      texto += `📍 *Área:* ${equipe.area || 'N/A'}` + nl;
      texto += `🛠️ *Atividade:* ${equipe.atividade || 'N/A'}` + nl;
      
      const vagaDisplay = equipe.vaga === 'OUTRA VAGA' 
        ? (equipe.vagaPersonalizada || equipe.vaga) 
        : equipe.vaga;
      texto += `🚚 *Vaga:* ${vagaDisplay || 'N/A'}` + nl;
      
      const equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' 
        ? (equipe.equipamentoPersonalizado || equipe.equipamento) 
        : equipe.equipamento;
      texto += `🔧 *Equipamento:* ${equipDisplay || 'N/A'}` + nl;
      
      // Detalhes Vácuo
      if (equipe.mangotes3Polegadas && equipe.mangotes3Polegadas !== 'N/A') {
        texto += `- *Mangotes 3":* ${equipe.mangotes3Polegadas}` + nl;
      }
      
      if (equipe.mangotes4Polegadas && equipe.mangotes4Polegadas !== 'N/A') {
        texto += `- *Mangotes 4":* ${equipe.mangotes4Polegadas}` + nl;
      }
      
      if (equipe.mangotes6Polegadas && equipe.mangotes6Polegadas !== 'N/A') {
        texto += `- *Mangotes 6":* ${equipe.mangotes6Polegadas}` + nl;
      }
      
      if (equipe.trocaEquipamento === 'Sim') {
        texto += nl + "🔄 *TROCA EQUIPAMENTO:* Sim" + nl;
        
        let motivo = equipe.motivoTroca;
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
          motivo = equipe.motivoOutro;
        }
        
        texto += `- *Motivo:* ${motivo || 'Não especificado'}` + nl;
        
        if (equipe.defeito) {
          texto += `- *Defeito:* ${equipe.defeito}` + nl;
        }
        
        if (equipe.placaNova) {
          texto += `- *Placa Nova:* ${equipe.placaNova}` + nl;
        }
        
        if (equipe.dataHoraTroca) {
          texto += `- *Data/Hora:* ${equipe.dataHoraTroca}` + nl;
        }
      }
      
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
 * Voltar da pesquisa para a tela inicial
 */
function voltarDaPesquisa() {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa inicial
  document.getElementById('stepTurno').style.display = 'block';
  
  // Atualizar indicadores
  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
  });
  
  document.getElementById('step1Indicator').classList.add('active');
}

// ========== FUNÇÕES DE DASHBOARD ==========

/**
 * Mostrar dashboard
 */
function mostrarDashboard() {
  // Verificar se o módulo de dashboard está disponível
  if (window.ModuleLoader && ModuleLoader.isInitialized('dashboard')) {
    const Dashboard = ModuleLoader.get('dashboard');
    Dashboard.mostrarDashboard();
    return;
  }
  
  // Fallback simples se o módulo não estiver disponível
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar dashboard
  document.getElementById('dashboard').style.display = 'block';
  
  // Carregar dados básicos
  mostrarNotificacao('Módulo de dashboard não está disponível. Exibindo versão limitada.', 'warning');
}

/**
 * Voltar do dashboard
 */
function voltarDoDashboard() {
  // Ocultar todas as etapas
  document.querySelectorAll('.content-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Mostrar etapa inicial
  document.getElementById('stepTurno').style.display = 'block';
  
  // Atualizar indicadores
  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
  });
  
  document.getElementById('step1Indicator').classList.add('active');
}

/**
 * Mostrar ajuda
 */
function mostrarHelp() {
  if (modalHelp) {
    modalHelp.show();
  }
}

// ========== FUNÇÕES UTILITÁRIAS ==========

/**
 * Formatar data (DD/MM/YYYY)
 */
function formatarData(data) {
  if (!data) return 'N/A';
  
  try {
    let dataObj;
    
    // Tentar diferentes formatos de entrada
    if (data instanceof Date) {
      dataObj = data;
    } else if (typeof data === 'string' && data.includes('-')) { // Formato YYYY-MM-DD
      dataObj = new Date(data + 'T00:00:00'); // Adicionar hora para evitar problemas de fuso
    } else if (typeof data === 'string' && data.includes('/')) { // Formato DD/MM/YYYY
      const partes = data.split('/');
      if (partes.length === 3) {
        // Ano, Mês (0-11), Dia
        dataObj = new Date(partes[2], partes[1] - 1, partes[0]);
      } else {
        dataObj = new Date(data); // Tentar parse direto
      }
    } else {
      dataObj = new Date(data); // Tentar parse direto
    }
    
    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) {
      console.warn("Formato de data inválido:", data);
      return String(data); // Retornar original se inválido
    }
    
    // Formatar como DD/MM/YYYY
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  } catch (e) {
    console.warn("Erro ao formatar data:", e);
    return String(data);
  }
}

/**
 * Formatar data e hora (DD/MM/YYYY HH:mm)
 */
function formatarDataHora(dataHora) {
  if (!dataHora) return 'N/A';
  
  try {
    let dataObj;
    
    if (dataHora instanceof Date) {
      dataObj = dataHora;
    } else {
      dataObj = new Date(dataHora); // Tentar parsear string
    }
    
    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) {
      console.warn("Formato de data/hora inválido:", dataHora);
      return String(dataHora);
    }
    
    // Formatar como DD/MM/YYYY HH:mm
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    const hora = String(dataObj.getHours()).padStart(2, '0');
    const minutos = String(dataObj.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
  } catch (e) {
    console.warn("Erro ao formatar data/hora:", e);
    return String(dataHora);
  }
}

// Exportar funções para uso global
window.inicializarFormulario = inicializarFormulario;
window.mostrarLoading = mostrarLoading;
window.ocultarLoading = ocultarLoading;
window.mostrarNotificacao = mostrarNotificacao;

// Funções de navegação
window.avancarParaEquipes = avancarParaEquipes;
window.voltarParaTurno = voltarParaTurno;
window.avancarParaRevisao = avancarParaRevisao;
window.voltarParaEquipes = voltarParaEquipes;
window.voltarParaSucesso = voltarParaSucesso;
window.voltarDoWhatsApp = voltarDoWhatsApp;
window.voltarDaPesquisa = voltarDaPesquisa;
window.voltarDoDashboard = voltarDoDashboard;

// Funções de equipes
window.adicionarEquipe = adicionarEquipe;
window.editarEquipe = editarEquipe;
window.removerEquipe = removerEquipe;
window.salvarEquipe = salvarEquipe;
window.atualizarListaEquipes = atualizarListaEquipes;
window.atualizarBotaoAvancar = atualizarBotaoAvancar;
window.toggleVagaPersonalizada = toggleVagaPersonalizada;
window.toggleEquipamentoPersonalizado = toggleEquipamentoPersonalizado;
window.toggleTrocaEquipamento = toggleTrocaEquipamento;
window.toggleMotivoOutro = toggleMotivoOutro;

// Funções de relatório
window.salvarRelatorio = salvarRelatorio;
window.salvarRelatorioLocal = salvarRelatorioLocal;
window.salvarRelatorioComFallback = salvarRelatorioComFallback;
window.novoRelatorio = novoRelatorio;
window.visualizarRelatorio = visualizarRelatorio;
window.formatarWhatsApp = formatarWhatsApp;
window.copiarRelatorio = copiarRelatorio;
window.copiarWhatsApp = copiarWhatsApp;

// Funções de pesquisa
window.abrirPesquisa = abrirPesquisa;
window.ajustarCampoPesquisa = ajustarCampoPesquisa;
window.executarPesquisa = executarPesquisa;
window.visualizarRelatorioExistente = visualizarRelatorioExistente;
window.gerarPDFExistente = gerarPDFExistente;
window.formatarWhatsAppExistente = formatarWhatsAppExistente;

// Outras funções
window.mostrarDashboard = mostrarDashboard;
window.mostrarHelp = mostrarHelp;
