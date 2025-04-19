/**
 * Modificações para app.js
 * Adicione este código no início do arquivo app.js
 */

// Inicializar arrays globais
if (!window.equipes) {
  window.equipes = [];
}

/**
 * Lógica principal da aplicação do Sistema de Relatório de Turno
 * Versão 3.0 (Atualizada com Patch)
 */

// Variáveis globais (manter a declaração original, mas a inicialização acima garante que 'equipes' seja um array)
let equipes = window.equipes; // Usar a variável inicializada (ou re-inicializada)
let dadosTurno = {};
let ultimoRelatorioId = null;
let modalEquipe = null;
let modalHelp = null;
let opcoesForms = null;
let currentOperation = null; // Para performance monitor

/**
 * Função para inicializar o formulário com dados da API
 */
async function inicializarFormulario() {
  try {
    mostrarLoading('Carregando dados...');

    // Verificar cache primeiro se o módulo estiver disponível
    let dados = null;
    if (window.AppState) {
      dados = AppState.getCachedData('opcoesForms');
    }

    // Se não estiver em cache, buscar da API
    if (!dados) {
      dados = await obterDadosFormularioAPI();

      // Salvar em cache se disponível
      if (window.AppState) {
        AppState.cacheData('opcoesForms', dados, 60); // 60 minutos
      }
    }

    // Armazenar para uso global
    opcoesForms = dados;

    // Preencher opções de horários
    const selectHorario = document.getElementById('horario');
    selectHorario.innerHTML = '<option value="" selected disabled>Selecione o horário</option>';
    dados.opcoesHorario.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      selectHorario.appendChild(option);
    });

    // Preencher opções de letra
    const selectLetra = document.getElementById('letra');
    selectLetra.innerHTML = '<option value="" selected disabled>Selecione a letra</option>';
    dados.opcoesLetra.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      selectLetra.appendChild(option);
    });

    // Preencher opções de supervisor
    const selectSupervisor = document.getElementById('supervisor');
    selectSupervisor.innerHTML = '<option value="" selected disabled>Selecione o supervisor</option>';
    dados.opcoesSupervisor.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      selectSupervisor.appendChild(option);
    });

    ocultarLoading();
  } catch (error) {
    console.error('Erro ao inicializar formulário:', error);
    ocultarLoading();
    alert('Erro ao carregar dados do formulário. Tente novamente mais tarde.');
  }
}

/**
 * Função para adicionar uma nova equipe
 */
function adicionarEquipe(tipo) {
  // Resetar o formulário
  document.getElementById('formEquipe').reset();
  document.getElementById('formEquipe').classList.remove('was-validated');

  // Definir cor do cabeçalho do modal
  const modalHeader = document.getElementById('modalEquipeHeader');
  modalHeader.className = 'modal-header ' + (tipo === 'Auto Vácuo / Hiper Vácuo' ? 'bg-danger text-white' : 'bg-primary text-white'); // Added text-white
  // modalHeader.style.color = 'white'; // Class handles color now

  // Definir tipo de equipe e limpar índice para nova equipe
  document.getElementById('modalEquipeLabel').textContent = 'Adicionar Equipe ' + tipo;
  document.getElementById('equipeTipo').value = tipo;
  document.getElementById('equipeIndex').value = -1; // Garantir que é -1 para nova equipe

  // Mostrar campos específicos por tipo de equipe
  if (tipo === 'Alta Pressão') {
    document.getElementById('materiaisAltaPressao').style.display = 'block';
    document.getElementById('materiaisVacuo').style.display = 'none';
  } else {
    document.getElementById('materiaisAltaPressao').style.display = 'none';
    document.getElementById('materiaisVacuo').style.display = 'block';
  }

  // Atualizar opções específicas do tipo de equipe
  atualizarOpcoesEquipe(tipo);

  // Esconder detalhes de troca de equipamento e campos personalizados
  document.getElementById('equipeTrocaNao').checked = true; // Default to 'Não'
  document.getElementById('trocaDetalhes').style.display = 'none';
  document.getElementById('vagaPersonalizadaContainer').style.display = 'none';
  document.getElementById('equipamentoPersonalizadoContainer').style.display = 'none';
  document.getElementById('motivoOutroContainer').style.display = 'none'; // Hide other reason too

  try {
    // Mostrar o modal
    if (!modalEquipe) {
      modalEquipe = new bootstrap.Modal(document.getElementById('modalEquipe'));
    }
    modalEquipe.show();
  } catch (err) {
    console.error("Erro ao mostrar modal:", err);
    alert("Erro ao abrir o formulário. Tente recarregar a página.");
  }
}

/**
 * Função para atualizar opções específicas do tipo de equipe
 */
function atualizarOpcoesEquipe(tipo) {
  if (!opcoesForms) {
      console.warn("Dados de opções de formulário não carregados.");
      return;
  }

  const dados = opcoesForms;

  // Preencher número da equipe
  const selectNumeroEquipe = document.getElementById('equipeNumero');
  selectNumeroEquipe.innerHTML = '<option value="" selected disabled>Selecione o número</option>';
  dados.opcoesNumeroEquipe.forEach(opcao => {
    const option = document.createElement('option');
    option.value = opcao;
    option.textContent = opcao;
    selectNumeroEquipe.appendChild(option);
  });

  // Preencher opções de vaga conforme o tipo
  const selectVaga = document.getElementById('equipeVaga');
  selectVaga.innerHTML = '<option value="" selected disabled>Selecione a vaga</option>';

  const vagas = tipo === 'Alta Pressão' ? dados.vagasAltaPressao : dados.vagasVacuo;
  vagas.forEach(opcao => {
    const option = document.createElement('option');
    option.value = opcao;
    option.textContent = opcao;
    selectVaga.appendChild(option);
  });
  // Adicionar opção 'OUTRA VAGA' se não existir (garantia)
  if (!vagas.includes('OUTRA VAGA')) {
      const outraOption = document.createElement('option');
      outraOption.value = 'OUTRA VAGA';
      outraOption.textContent = 'Outra (Especificar)';
      selectVaga.appendChild(outraOption);
  }


  // Preencher opções de equipamento conforme o tipo
  const selectEquipamento = document.getElementById('equipeEquipamento');
  selectEquipamento.innerHTML = '<option value="" selected disabled>Selecione o equipamento</option>';

  const equipamentos = tipo === 'Alta Pressão' ? dados.equipamentosAltaPressao : dados.equipamentosVacuo;
  equipamentos.forEach(opcao => {
    const option = document.createElement('option');
    option.value = opcao;
    option.textContent = opcao;
    selectEquipamento.appendChild(option);
  });
   // Adicionar opção 'OUTRO EQUIPAMENTO' se não existir (garantia)
   if (!equipamentos.includes('OUTRO EQUIPAMENTO')) {
    const outraOption = document.createElement('option');
    outraOption.value = 'OUTRO EQUIPAMENTO';
    outraOption.textContent = 'Outro (Especificar)';
    selectEquipamento.appendChild(outraOption);
}

  // Preencher opções de lances
  const selectLancesMangueira = document.getElementById('equipeLancesMangueira');
  const selectLancesVaretas = document.getElementById('equipeLancesVaretas');

  [selectLancesMangueira, selectLancesVaretas].forEach(select => {
    select.innerHTML = ''; // Limpar antes de adicionar
    dados.opcoesLances.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      // Definir 'N/A' como selecionado por padrão
      if (opcao === 'N/A') {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });

  // Preencher opções de mangotes
  const mangotesSelects = [
    document.getElementById('equipeMangotes3Polegadas'),
    document.getElementById('equipeMangotes4Polegadas'),
    document.getElementById('equipeMangotes6Polegadas')
  ];

  mangotesSelects.forEach(select => {
    select.innerHTML = ''; // Limpar antes de adicionar
    dados.opcoesMangotes.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      // Definir 'N/A' como selecionado por padrão
      if (opcao === 'N/A') {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });

  // Preencher opções de cadeados e plaquetas
  const selectCadeados = document.getElementById('equipeCadeados');
  const selectPlaquetas = document.getElementById('equipePlaquetas');

  [selectCadeados, selectPlaquetas].forEach(select => {
    select.innerHTML = ''; // Limpar antes de adicionar
    dados.opcoesCadeadosPlaquetas.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
       // Definir 'N/A' como selecionado por padrão
       if (opcao === 'N/A') {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

/**
 * Função para salvar a equipe atual
 */
function salvarEquipe() {
  // Validar formulário
  const form = document.getElementById('formEquipe');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  // Coletar dados da equipe
  const tipo = document.getElementById('equipeTipo').value;
  const equipe = {
    tipo: tipo,
    numero: document.getElementById('equipeNumero').value,
    integrantes: document.getElementById('equipeIntegrantes').value.trim(),
    area: document.getElementById('equipeArea').value.trim(),
    atividade: document.getElementById('equipeAtividade').value.trim(),
    vaga: document.getElementById('equipeVaga').value,
    equipamento: document.getElementById('equipeEquipamento').value,
    trocaEquipamento: document.querySelector('input[name="equipeTroca"]:checked').value,
    caixaBloqueio: document.querySelector('input[name="equipeCaixaBloqueio"]:checked').value,
    cadeados: document.getElementById('equipeCadeados').value,
    plaquetas: document.getElementById('equipePlaquetas').value,
    observacoes: document.getElementById('equipeObservacoes').value.trim(),
    justificativa: document.getElementById('equipeJustificativa').value.trim()
  };

  // Campos personalizados
  equipe.vagaPersonalizada = ''; // Inicializar
  if (equipe.vaga === 'OUTRA VAGA') {
    equipe.vagaPersonalizada = document.getElementById('equipeVagaPersonalizada').value.trim();
  }

  equipe.equipamentoPersonalizado = ''; // Inicializar
  if (equipe.equipamento === 'OUTRO EQUIPAMENTO') {
    equipe.equipamentoPersonalizado = document.getElementById('equipeEquipamentoPersonalizado').value.trim();
  }

  // Dados específicos por tipo
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
  } else { // Auto Vácuo / Hiper Vácuo
    equipe.materiaisVacuo = {
      mangotes: document.getElementById('equipeMangotes').value,
      reducoes: document.getElementById('equipeReducoes').value
    };
    equipe.mangotes3Polegadas = document.getElementById('equipeMangotes3Polegadas').value;
    equipe.mangotes4Polegadas = document.getElementById('equipeMangotes4Polegadas').value;
    equipe.mangotes6Polegadas = document.getElementById('equipeMangotes6Polegadas').value;
  }

  // Adicionar campos relacionados à troca de equipamentos, se aplicável
  // Inicializar campos de troca
  equipe.motivoTroca = '';
  equipe.motivoOutro = '';
  equipe.defeito = '';
  equipe.placaNova = '';
  equipe.dataHoraTroca = '';

  if (equipe.trocaEquipamento === 'Sim') {
    const motivoTrocaEl = document.querySelector('input[name="equipeMotivoTroca"]:checked');
    equipe.motivoTroca = motivoTrocaEl ? motivoTrocaEl.value : '';

    if (equipe.motivoTroca === 'Outros Motivos (Justificar)') {
      equipe.motivoOutro = document.getElementById('equipeMotivoOutro').value.trim();
    }

    equipe.defeito = document.getElementById('equipeDefeito').value.trim();
    equipe.placaNova = document.getElementById('equipePlacaNova').value.trim();
    // Usar valor do input datetime-local diretamente
    equipe.dataHoraTroca = document.getElementById('equipeDataHoraTroca').value;
  }

  // Verificar se estamos editando ou adicionando
  const index = parseInt(document.getElementById('equipeIndex').value);

  // --- INÍCIO DA MODIFICAÇÃO APLICADA DO PATCH ---
  if (index >= 0) {
    // Editar equipe existente
    equipes[index] = equipe;
  } else {
    // Adicionar nova equipe
    equipes.push(equipe);
  }

  // Garantir que a equipe seja exibida na lista
  console.log('Equipes atualizadas:', equipes); // Log do patch
  atualizarListaEquipes(); // Chamada incondicional do patch
  atualizarBotaoAvancar(); // Chamada incondicional do patch

  // Atualizar o estado global
  if (window.AppState) {
    AppState.update('equipes', [...equipes]); // Atualização de estado do patch usando spread operator
  }
  // --- FIM DA MODIFICAÇÃO APLICADA DO PATCH ---

  // Fechar o modal
  try {
    if (modalEquipe) {
      modalEquipe.hide();
    } else {
      // Tentar fechar de outra forma
      const modalElement = document.getElementById('modalEquipe');
      if (modalElement && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getInstance(modalElement)?.hide();
      }
    }
  } catch (error) {
    console.error("Erro ao fechar modal:", error);
    // Tentar fechar de forma alternativa se houver problemas
    document.querySelector('.modal-backdrop')?.remove();
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.getElementById('modalEquipe').style.display = 'none'; // Hide manually as fallback
  }

  // Limpar o formulário e remover a validação após o modal fechar
  setTimeout(() => {
    form.reset();
    form.classList.remove('was-validated');
    // Resetar displays condicionais que podem ter sido abertos
    document.getElementById('trocaDetalhes').style.display = 'none';
    document.getElementById('vagaPersonalizadaContainer').style.display = 'none';
    document.getElementById('equipamentoPersonalizadoContainer').style.display = 'none';
    document.getElementById('motivoOutroContainer').style.display = 'none';
  }, 300); // Aumentar ligeiramente o timeout para garantir que o modal fechou

  // Mostrar notificação
  mostrarNotificacao(`Equipe ${index >= 0 ? 'editada' : 'adicionada'} com sucesso!`);
}


/**
 * Função para editar uma equipe existente
 */
function editarEquipe(index) {
  if (index < 0 || index >= equipes.length) {
      console.error("Índice de equipe inválido para edição:", index);
      return;
  }
  const equipe = equipes[index];

  // Definir cor do cabeçalho do modal
  const modalHeader = document.getElementById('modalEquipeHeader');
  modalHeader.className = 'modal-header ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'bg-danger text-white' : 'bg-primary text-white'); // Added text-white

  document.getElementById('modalEquipeLabel').textContent = 'Editar Equipe ' + equipe.tipo;
  document.getElementById('equipeTipo').value = equipe.tipo;
  document.getElementById('equipeIndex').value = index;

  // Resetar validação
  document.getElementById('formEquipe').classList.remove('was-validated');

  // Mostrar campos específicos por tipo de equipe
  if (equipe.tipo === 'Alta Pressão') {
    document.getElementById('materiaisAltaPressao').style.display = 'block';
    document.getElementById('materiaisVacuo').style.display = 'none';
  } else { // Auto Vácuo / Hiper Vácuo
    document.getElementById('materiaisAltaPressao').style.display = 'none';
    document.getElementById('materiaisVacuo').style.display = 'block';
  }

  // Carregar opções corretas para o tipo de equipe (essencial antes de setar valores)
  atualizarOpcoesEquipe(equipe.tipo);

  // Preencher o formulário com os dados da equipe (APÓS atualizarOpcoesEquipe)
  document.getElementById('equipeNumero').value = equipe.numero;
  document.getElementById('equipeIntegrantes').value = equipe.integrantes;
  document.getElementById('equipeArea').value = equipe.area;
  document.getElementById('equipeAtividade').value = equipe.atividade;

  // Selecionar valores nos selects
  document.getElementById('equipeVaga').value = equipe.vaga;
  toggleVagaPersonalizada(); // Chamar para mostrar/esconder o campo personalizado
  if (equipe.vaga === 'OUTRA VAGA') {
    document.getElementById('equipeVagaPersonalizada').value = equipe.vagaPersonalizada || '';
  }

  document.getElementById('equipeEquipamento').value = equipe.equipamento;
  toggleEquipamentoPersonalizado(); // Chamar para mostrar/esconder o campo personalizado
  if (equipe.equipamento === 'OUTRO EQUIPAMENTO') {
    document.getElementById('equipeEquipamentoPersonalizado').value = equipe.equipamentoPersonalizado || '';
  }

  // Configurar radiobuttons de troca
  document.getElementById('equipeTrocaSim').checked = equipe.trocaEquipamento === 'Sim';
  document.getElementById('equipeTrocaNao').checked = equipe.trocaEquipamento !== 'Sim';
  toggleTrocaEquipamento(); // Atualizar visibilidade da seção de detalhes

  // Preencher detalhes da troca SE aplicável
  if (equipe.trocaEquipamento === 'Sim') {
    // Resetar radios de motivo antes de setar
    document.querySelectorAll('input[name="equipeMotivoTroca"]').forEach(radio => radio.checked = false);
    document.getElementById('motivoOutroContainer').style.display = 'none'; // Esconder por padrão
    document.getElementById('equipeMotivoOutro').value = ''; // Limpar campo

    if (equipe.motivoTroca === 'Solicitação Do Cliente') {
      document.getElementById('motivoCliente').checked = true;
    } else if (equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
      document.getElementById('motivoDefeito').checked = true;
    } else if (equipe.motivoTroca === 'Outros Motivos (Justificar)') {
      document.getElementById('motivoOutro').checked = true;
      toggleMotivoOutro(); // Mostrar container
      document.getElementById('equipeMotivoOutro').value = equipe.motivoOutro || '';
    } else {
        // Caso o motivo salvo seja inválido ou vazio, não marca nenhum
    }

    document.getElementById('equipeDefeito').value = equipe.defeito || '';
    document.getElementById('equipePlacaNova').value = equipe.placaNova || '';
    // Formato datetime-local espera YYYY-MM-DDTHH:mm
    document.getElementById('equipeDataHoraTroca').value = equipe.dataHoraTroca || '';
  }

  // Materiais para Alta Pressão
  if (equipe.tipo === 'Alta Pressão') {
    document.getElementById('equipePistola').value = equipe.materiais?.pistola || 'N/A';
    document.getElementById('equipePistolaCanoLongo').value = equipe.materiais?.pistolaCanoLongo || 'N/A';
    document.getElementById('equipeMangueiraTorpedo').value = equipe.materiais?.mangueiraTorpedo || 'N/A';
    document.getElementById('equipePedal').value = equipe.materiais?.pedal || 'N/A';
    document.getElementById('equipeVaretas').value = equipe.materiais?.varetas || 'N/A';
    document.getElementById('equipeRabicho').value = equipe.materiais?.rabicho || 'N/A';
    document.getElementById('equipeLancesMangueira').value = equipe.lancesMangueira || 'N/A';
    document.getElementById('equipeLancesVaretas').value = equipe.lancesVaretas || 'N/A';
  } else { // Auto Vácuo / Hiper Vácuo
    document.getElementById('equipeMangotes').value = equipe.materiaisVacuo?.mangotes || 'N/A';
    document.getElementById('equipeReducoes').value = equipe.materiaisVacuo?.reducoes || 'N/A';
    document.getElementById('equipeMangotes3Polegadas').value = equipe.mangotes3Polegadas || 'N/A';
    document.getElementById('equipeMangotes4Polegadas').value = equipe.mangotes4Polegadas || 'N/A';
    document.getElementById('equipeMangotes6Polegadas').value = equipe.mangotes6Polegadas || 'N/A';
  }

  // Justificativa
  document.getElementById('equipeJustificativa').value = equipe.justificativa || '';

  // Caixa de bloqueio
  document.getElementById('caixaBloqueioSim').checked = equipe.caixaBloqueio === 'Sim';
  document.getElementById('caixaBloqueioNao').checked = equipe.caixaBloqueio !== 'Sim';

  // Cadeados e plaquetas
  document.getElementById('equipeCadeados').value = equipe.cadeados || 'N/A';
  document.getElementById('equipePlaquetas').value = equipe.plaquetas || 'N/A';

  // Observações
  document.getElementById('equipeObservacoes').value = equipe.observacoes || '';

  // Mostrar o modal
  try {
    if (!modalEquipe) {
      modalEquipe = new bootstrap.Modal(document.getElementById('modalEquipe'));
    }
    modalEquipe.show();
  } catch (err) {
    console.error("Erro ao mostrar modal:", err);
    alert("Erro ao abrir o formulário de edição. Tente recarregar a página.");
  }
}


/**
 * Função para remover uma equipe
 */
function removerEquipe(index) {
  if (index < 0 || index >= equipes.length) {
      console.error("Índice de equipe inválido para remoção:", index);
      return;
  }
  const equipeNumero = equipes[index].numero; // Pega o número para a mensagem
  if (confirm(`Tem certeza que deseja remover a equipe ${equipeNumero}?`)) {
    equipes.splice(index, 1); // Remove o item no índice especificado

    // Atualizar o estado se o módulo estiver disponível
    if (window.AppState) {
      // Passar uma cópia do array modificado para o AppState
      AppState.update('equipes', [...equipes]);
    } else {
      // Se não temos AppState, atualizar manualmente a UI
      atualizarListaEquipes();
      atualizarBotaoAvancar();
    }

    mostrarNotificacao(`Equipe ${equipeNumero} removida com sucesso!`);
  }
}


/**
 * Versão corrigida da função atualizarListaEquipes() - APLICADA DO PATCH
 * Substitua a função existente por esta:
 */
function atualizarListaEquipes() {
  console.log('Atualizando lista de equipes:', equipes); // Log para debug do patch

  const listaEquipes = document.getElementById('listaEquipes');
  const semEquipes = document.getElementById('semEquipes');

  if (!listaEquipes || !semEquipes) {
    console.error('Elementos DOM não encontrados para atualizar lista de equipes');
    return;
  }

  // Verificar se há equipes
  if (!equipes || equipes.length === 0) {
    semEquipes.style.display = 'block'; // Mostrar mensagem

    // Limpar lista, mantendo apenas o elemento semEquipes
    Array.from(listaEquipes.children).forEach(child => {
      if (child !== semEquipes) {
        child.remove(); // Usar remove() que é mais moderno que removeChild
      }
    });
    atualizarBotaoAvancar(); // Atualizar botão mesmo sem equipes
    return; // Sair da função
  }

  // Se chegou aqui, há equipes
  semEquipes.style.display = 'none'; // Esconder mensagem de "sem equipes"

  // Limpar lista atual, exceto pelo elemento "semEquipes"
  Array.from(listaEquipes.children).forEach(child => {
    if (child !== semEquipes) {
      child.remove();
    }
  });

  // Adicionar cada equipe à lista
  equipes.forEach((equipe, index) => {
    const equipeCard = document.createElement('div');
    // Classe base + classe condicional para vácuo
    equipeCard.className = 'card mb-3 equipe-card ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'equipe-vacuo' : '');

    const cardHeader = document.createElement('div');
    // Define a classe do header baseada no tipo para usar CSS vars
    cardHeader.className = 'card-header ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'bg-danger text-white' : 'bg-primary text-white');
    // cardHeader.style.backgroundColor = equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'var(--danger-color)' : 'var(--primary-color)'; // Removido em favor da classe

    const headerContent = document.createElement('div');
    headerContent.className = 'd-flex justify-content-between align-items-center';

    const titulo = document.createElement('h5');
    titulo.className = 'mb-0'; // text-white é herdado do header
    titulo.textContent = equipe.tipo; // Texto base
    // Adicionar o número da equipe como um span ou badge
    const badge = document.createElement('span');
    badge.className = 'badge bg-light text-dark ms-2'; // Usar badge do Bootstrap
    badge.textContent = equipe.numero;
    titulo.appendChild(badge);
    // titulo.innerHTML += ` <span class="badge-equipe">${equipe.numero}</span>`; // Alternativa original

    const botoes = document.createElement('div');
    botoes.className = 'btn-group btn-group-sm'; // Adicionado btn-group-sm

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button'; // Definir tipo
    btnEditar.className = 'btn btn-light btn-sm'; // Usar btn-light para contraste com header
    btnEditar.innerHTML = '<i class="bi bi-pencil-square me-1"></i> Editar'; // Adicionado espaçamento
    btnEditar.onclick = function() { editarEquipe(index); };

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button'; // Definir tipo
    btnRemover.className = 'btn btn-light btn-sm'; // Usar btn-light para contraste
    btnRemover.innerHTML = '<i class="bi bi-trash me-1"></i> Remover'; // Adicionado espaçamento
    btnRemover.onclick = function() { removerEquipe(index); };

    botoes.appendChild(btnEditar);
    botoes.appendChild(btnRemover);

    headerContent.appendChild(titulo);
    headerContent.appendChild(botoes);

    cardHeader.appendChild(headerContent);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body small'; // Usar 'small' para texto menor

    const detalhes = document.createElement('div');
    detalhes.className = 'row';

    // Coluna 1
    const col1 = document.createElement('div');
    col1.className = 'col-md-4 mb-2 mb-md-0'; // Espaçamento inferior em telas pequenas
    col1.innerHTML = `
      <p class="mb-1"><strong>Integrantes:</strong> ${shortenText(equipe.integrantes, 40)}</p>
      <p class="mb-1"><strong>Área:</strong> ${shortenText(equipe.area, 30)}</p>
      <p class="mb-0"><strong>Atividade:</strong> ${shortenText(equipe.atividade, 30)}</p>
    `;

    // Coluna 2
    const col2 = document.createElement('div');
    col2.className = 'col-md-4 mb-2 mb-md-0';

    // Vaga com suporte para personalizada
    let vagaText = equipe.vaga;
    if (equipe.vaga === 'OUTRA VAGA' && equipe.vagaPersonalizada) {
      vagaText = equipe.vagaPersonalizada; // Mostrar só o personalizado se for 'OUTRA'
    }

    // Equipamento com suporte para personalizado
    let equipText = equipe.equipamento;
    if (equipe.equipamento === 'OUTRO EQUIPAMENTO' && equipe.equipamentoPersonalizado) {
      equipText = equipe.equipamentoPersonalizado; // Mostrar só o personalizado se for 'OUTRO'
    }

    col2.innerHTML = `
      <p class="mb-1"><strong>Vaga:</strong> ${shortenText(vagaText, 30)}</p>
      <p class="mb-1"><strong>Equipamento:</strong> ${shortenText(equipText, 30)}</p>
      <p class="mb-0"><strong>Troca Equip.:</strong> ${equipe.trocaEquipamento}</p>
    `;

    // Coluna 3
    const col3 = document.createElement('div');
    col3.className = 'col-md-4';
    col3.innerHTML = `
      <p class="mb-1"><strong>Caixa Bloqueio:</strong> ${equipe.caixaBloqueio}</p>
      <p class="mb-1"><strong>Cadeados:</strong> ${equipe.cadeados}</p>
      <p class="mb-0"><strong>Plaquetas:</strong> ${equipe.plaquetas}</p>
    `;

    detalhes.appendChild(col1);
    detalhes.appendChild(col2);
    detalhes.appendChild(col3);

    cardBody.appendChild(detalhes);

    // Adicionar informações extras se houver troca de equipamento
    if (equipe.trocaEquipamento === 'Sim') {
      const trocaInfo = document.createElement('div');
      trocaInfo.className = 'alert alert-warning mt-2 mb-0 p-2 small'; // Alert menor

      let motivoText = equipe.motivoTroca;
      if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
        motivoText = equipe.motivoOutro; // Usar o texto do outro motivo
      } else if (equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
          motivoText = 'Defeito Geral'; // Texto mais curto
      } else if (equipe.motivoTroca === 'Solicitação Do Cliente') {
          motivoText = 'Solic. Cliente'; // Texto mais curto
      }


      trocaInfo.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i><strong>Troca:</strong> ${shortenText(motivoText, 30) || 'Motivo não especificado'}`;
      // Adicionar mais detalhes se necessário, talvez em um tooltip ou ao clicar
      // Ex: trocaInfo.title = `Detalhes: ${equipe.defeito || ''} | Nova Placa: ${equipe.placaNova || ''}`;
      cardBody.appendChild(trocaInfo);
    }

    equipeCard.appendChild(cardHeader);
    equipeCard.appendChild(cardBody);

    listaEquipes.appendChild(equipeCard);
  });

  // Verificar novamente se o botão de avançar deve ser habilitado
  atualizarBotaoAvancar();
}


/**
 * Função para atualizar o estado do botão de avançar
 */
function atualizarBotaoAvancar() {
  const btnAvancarRevisao = document.getElementById('btnAvancarRevisao');
  if (btnAvancarRevisao) { // Verificar se o botão existe na etapa atual
      btnAvancarRevisao.disabled = !equipes || equipes.length === 0;
  }
}


/**
 * Funções para navegação entre etapas
 */
function avancarParaEquipes() {
  // Validar formulário
  const form = document.getElementById('formTurno');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  // Coletar dados do turno
  dadosTurno = {
    data: document.getElementById('data').value,
    horario: document.getElementById('horario').value,
    letra: document.getElementById('letra').value,
    supervisor: document.getElementById('supervisor').value
  };

  // Atualizar o estado se o módulo estiver disponível
  if (window.AppState) {
    AppState.update('dadosTurno', dadosTurno);
    AppState.update('currentStep', 'stepEquipes');
  }

  // Atualizar indicadores de etapa
  document.getElementById('step1Indicator').classList.remove('active');
  document.getElementById('step1Indicator').classList.add('completed');
  document.getElementById('step2Indicator').classList.add('active');
  document.getElementById('step3Indicator').classList.remove('active'); // Garantir que não esteja ativo

  // Avançar para próxima etapa
  mostrarEtapa('stepEquipes');

  // Atualizar botão de avançar (importante chamar aqui também)
  atualizarBotaoAvancar();
}

function voltarParaTurno() {
  // Atualizar indicadores de etapa
  document.getElementById('step1Indicator').classList.add('active');
  document.getElementById('step1Indicator').classList.remove('completed');
  document.getElementById('step2Indicator').classList.remove('active');
  document.getElementById('step2Indicator').classList.remove('completed'); // Remover completado também

  // Atualizar o estado se o módulo estiver disponível
  if (window.AppState) {
    AppState.update('currentStep', 'stepTurno');
  }

  // Voltar para etapa anterior
  mostrarEtapa('stepTurno');
}

function avancarParaRevisao() {
  // Verificar se há equipes
  if (!equipes || equipes.length === 0) {
    alert('Adicione pelo menos uma equipe antes de prosseguir.');
    return;
  }

  // Atualizar indicadores de etapa
  document.getElementById('step2Indicator').classList.remove('active');
  document.getElementById('step2Indicator').classList.add('completed');
  document.getElementById('step3Indicator').classList.add('active');

  // Atualizar o estado se o módulo estiver disponível
  if (window.AppState) {
    AppState.update('currentStep', 'stepRevisao');
  }

  // Gerar resumo do turno
  const resumoTurno = document.getElementById('resumoTurno');
  resumoTurno.innerHTML = `
    <div class="info-item">
      <div class="info-label"><i class="bi bi-calendar-event me-1"></i>Data</div>
      <div class="info-value">${formatarData(dadosTurno.data)}</div>
    </div>
    <div class="info-item">
      <div class="info-label"><i class="bi bi-clock me-1"></i>Horário</div>
      <div class="info-value">${dadosTurno.horario}</div>
    </div>
    <div class="info-item">
      <div class="info-label"><i class="bi bi-type me-1"></i>Letra</div>
      <div class="info-value">${dadosTurno.letra}</div>
    </div>
    <div class="info-item">
      <div class="info-label"><i class="bi bi-person-check me-1"></i>Supervisor</div>
      <div class="info-value">${dadosTurno.supervisor}</div>
    </div>
  `;

  // Gerar resumo das equipes
  const resumoEquipes = document.getElementById('resumoEquipes');
  resumoEquipes.innerHTML = ''; // Limpar antes de preencher

  equipes.forEach((equipe, index) => {
    const card = document.createElement('div');
    card.className = 'card mb-3 ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'border-danger' : 'border-primary');

    const header = document.createElement('div');
    header.className = 'card-header d-flex justify-content-between align-items-center ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'bg-danger text-white' : 'bg-primary text-white');
    header.innerHTML = `
        <span>${equipe.tipo} - Nº ${equipe.numero}</span>
        <button type="button" class="btn btn-sm btn-light" onclick="editarEquipe(${index}); mostrarEtapa('stepEquipes');">
            <i class="bi bi-pencil-square me-1"></i> Editar Equipe
        </button>
    `;


    const body = document.createElement('div');
    body.className = 'card-body';

    let vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
    let equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;

    // Principais informações
    const principaisInfo = document.createElement('div');
    principaisInfo.className = 'row mb-2';
    principaisInfo.innerHTML = `
      <div class="col-md-6">
        <p><strong>Integrantes:</strong> ${equipe.integrantes}</p>
        <p><strong>Área:</strong> ${equipe.area}</p>
        <p class="mb-0"><strong>Atividade:</strong> ${equipe.atividade}</p>
      </div>
      <div class="col-md-6">
        <p><strong>Vaga:</strong> ${vagaDisplay || 'N/A'}</p>
        <p><strong>Equipamento:</strong> ${equipDisplay || 'N/A'}</p>
        <p class="mb-0"><strong>Troca de Equip.:</strong> ${equipe.trocaEquipamento}</p>
      </div>
    `;

    body.appendChild(principaisInfo);

    // Detalhes adicionais (Troca, Materiais Faltando, Segurança, Observações)
    let detalhesAdicionaisHTML = '';

    // Troca
    if (equipe.trocaEquipamento === 'Sim') {
        let motivoText = equipe.motivoTroca;
        if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
            motivoText = equipe.motivoOutro;
        }
        detalhesAdicionaisHTML += `
        <div class="alert alert-warning p-2 small">
            <p class="mb-1"><strong><i class="bi bi-arrow-repeat me-1"></i>Troca Realizada:</strong> Motivo: ${motivoText || 'Não especificado'}</p>
            ${equipe.defeito ? `<p class="mb-1"> &nbsp; &nbsp; Defeito/Medidas: ${shortenText(equipe.defeito, 100)}</p>` : ''}
            ${equipe.placaNova ? `<p class="mb-1"> &nbsp; &nbsp; Nova Placa: ${equipe.placaNova}</p>` : ''}
            ${equipe.dataHoraTroca ? `<p class="mb-0"> &nbsp; &nbsp; Data/Hora: ${formatarDataHora(equipe.dataHoraTroca)}</p>` : ''}
        </div>`;
    }

    // Materiais e Justificativa
    if (equipe.justificativa) {
        detalhesAdicionaisHTML += `<p class="small text-danger mb-1"><strong><i class="bi bi-tools me-1"></i>Justificativa Materiais:</strong> ${equipe.justificativa}</p>`;
    }

    // Segurança
    detalhesAdicionaisHTML += `<p class="small mb-1"><strong><i class="bi bi-lock me-1"></i>Segurança:</strong> Caixa Bloqueio: ${equipe.caixaBloqueio} | Cadeados: ${equipe.cadeados} | Plaquetas: ${equipe.plaquetas}</p>`;

    // Observações
    if (equipe.observacoes) {
        detalhesAdicionaisHTML += `<p class="small mb-0"><strong><i class="bi bi-chat-left-text me-1"></i>Observações:</strong> ${equipe.observacoes}</p>`;
    }


    if(detalhesAdicionaisHTML) {
        const detalhesDiv = document.createElement('div');
        detalhesDiv.className = 'mt-2 border-top pt-2';
        detalhesDiv.innerHTML = detalhesAdicionaisHTML;
        body.appendChild(detalhesDiv);
    }


    card.appendChild(header);
    card.appendChild(body);
    resumoEquipes.appendChild(card);
  });

  // Avançar para próxima etapa
  mostrarEtapa('stepRevisao');
}


function voltarParaEquipes() {
  // Atualizar indicadores de etapa
  document.getElementById('step2Indicator').classList.add('active');
  document.getElementById('step2Indicator').classList.remove('completed');
  document.getElementById('step3Indicator').classList.remove('active');

  // Atualizar o estado se o módulo estiver disponível
  if (window.AppState) {
    AppState.update('currentStep', 'stepEquipes');
  }

  // Voltar para etapa anterior
  mostrarEtapa('stepEquipes');
}

function voltarParaSucesso() {
  // Não há etapa anterior óbvia para o sucesso, talvez voltar ao dashboard ou pesquisa?
  // Por enquanto, apenas mostra a tela de sucesso novamente (pode ser útil se veio de outra tela)
  mostrarEtapa('stepSucesso');
}

function voltarDoWhatsApp() {
  // Assumindo que veio da tela de sucesso
  mostrarEtapa('stepSucesso');
}

// Funções para voltar da visualização/WhatsApp para a Pesquisa
function voltarParaPesquisa() {
    // Oculta a tela de relatório/whatsapp e mostra a de pesquisa
    document.getElementById('stepRelatorio').style.display = 'none';
    document.getElementById('stepWhatsApp').style.display = 'none';
    mostrarEtapa('stepPesquisa');

    // Atualiza o estado
    if (window.AppState) {
        AppState.update('currentStep', 'stepPesquisa');
    }
}

// Esta função pode ser redundante se a anterior for usada para ambos os casos.
// Mantendo por compatibilidade com o código original que a chamava.
function voltarDeWhatsAppParaPesquisa() {
    voltarParaPesquisa(); // Reutiliza a lógica
}


/**
 * Função para mostrar uma etapa específica
 */
function mostrarEtapa(etapaParaMostrar) {
  // Ocultar todas as etapas primeiro
  document.querySelectorAll('.content-step').forEach(el => {
    el.style.display = 'none';
  });

  // Mostrar a etapa solicitada
  const etapaElement = document.getElementById(etapaParaMostrar);
  if (etapaElement) {
    etapaElement.style.display = 'block';
  } else {
      console.error(`Elemento da etapa "${etapaParaMostrar}" não encontrado.`);
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

/**
 * Função para salvar o relatório
 */
async function salvarRelatorio() {
  if (!equipes || equipes.length === 0) {
    alert('Adicione pelo menos uma equipe antes de salvar o relatório.');
    return;
  }

  mostrarLoading('Salvando relatório...');

  try {
    // Usar a API para salvar o relatório
    const result = await salvarTurnoAPI(dadosTurno, equipes);
    ocultarLoading();

    if (result.success) {
      ultimoRelatorioId = result.relatorioId;

      // Atualizar o estado se o módulo estiver disponível
      if (window.AppState) {
        AppState.update('ultimoRelatorioId', ultimoRelatorioId);
        AppState.update('currentStep', 'stepSucesso');
        // Limpar dados do formulário atual no estado após salvar com sucesso
        AppState.update('dadosTurno', {});
        AppState.update('equipes', []);
      } else {
          // Limpar manualmente se não houver AppState
          dadosTurno = {};
          equipes = [];
      }


      // Atualizar indicadores de etapa
      document.getElementById('step3Indicator').classList.remove('active');
      document.getElementById('step3Indicator').classList.add('completed');

      // Avançar para tela de sucesso
      mostrarEtapa('stepSucesso');
      mostrarNotificacao('Relatório salvo com sucesso!'); // Notificação extra
    } else {
      alert('Erro ao salvar relatório: ' + result.message);
    }
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao salvar relatório:', error);
    alert('Ocorreu um erro ao salvar o relatório: ' + (error.message || error));
  }
}


/**
 * Função para visualizar o relatório em texto
 */
async function visualizarRelatorio() {
  if (!ultimoRelatorioId) {
    alert('ID do relatório não encontrado. Salve um relatório primeiro.');
    return;
  }

  mostrarLoading('Gerando relatório...');

  try {
    // Usar a API para gerar o relatório em texto
    const result = await gerarRelatorioTextoAPI(ultimoRelatorioId);
    ocultarLoading();

    if (result.success) {
      document.getElementById('relatorioTexto').textContent = result.relatorio;

      // Atualizar o estado se o módulo estiver disponível
      if (window.AppState) {
        AppState.update('currentStep', 'stepRelatorio');
      }

       // Garantir que o botão Voltar leve para Sucesso
       document.getElementById('btnVoltarRelatorio').setAttribute('onclick', 'voltarParaSucesso()');

      mostrarEtapa('stepRelatorio');
    } else {
      alert('Erro ao gerar relatório: ' + result.message);
    }
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao visualizar relatório:', error);
    alert('Ocorreu um erro ao gerar o relatório: ' + (error.message || error));
  }
}


/**
 * Função para formatar o relatório para WhatsApp
 */
async function formatarWhatsApp() {
  if (!ultimoRelatorioId) {
    alert('ID do relatório não encontrado. Salve um relatório primeiro.');
    return;
  }

  mostrarLoading('Formatando para WhatsApp...');

  try {
    // Usar a API para formatar o relatório para WhatsApp
    const result = await formatarWhatsAppAPI(ultimoRelatorioId);
    ocultarLoading();

    if (result.success) {
      document.getElementById('whatsAppTexto').textContent = result.relatorio;

      // Atualizar o estado se o módulo estiver disponível
      if (window.AppState) {
        AppState.update('currentStep', 'stepWhatsApp');
      }

       // Garantir que o botão Voltar leve para Sucesso
       document.getElementById('btnVoltarWhatsApp').setAttribute('onclick', 'voltarDoWhatsApp()');

      mostrarEtapa('stepWhatsApp');
    } else {
      alert('Erro ao formatar para WhatsApp: ' + result.message);
    }
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao formatar para WhatsApp:', error);
    alert('Ocorreu um erro ao formatar para WhatsApp: ' + (error.message || error));
  }
}


/**
 * Função para copiar o relatório para a área de transferência
 */
function copiarRelatorio() {
  const relatorioTexto = document.getElementById('relatorioTexto');
  const texto = relatorioTexto.textContent;

  copiarTextoParaClipboard(texto, 'Relatório copiado com sucesso!');
}

/**
 * Função para copiar o texto do WhatsApp
 */
function copiarWhatsApp() {
  const whatsAppTexto = document.getElementById('whatsAppTexto');
  const texto = whatsAppTexto.textContent;

  copiarTextoParaClipboard(texto, 'Texto copiado com sucesso! Cole no WhatsApp.');
}

/**
 * Função genérica para copiar texto para a área de transferência
 */
function copiarTextoParaClipboard(texto, mensagemSucesso) {
    if (!texto) {
        mostrarNotificacao('Nada para copiar.', 'warning');
        return;
    }

    // Método 1: API Clipboard moderna (preferencial)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto)
            .then(() => {
                mostrarNotificacao(mensagemSucesso);
            })
            .catch(err => {
                console.warn('Falha ao copiar com API Clipboard:', err);
                copiarComExecCommand(texto, mensagemSucesso); // Tentar fallback
            });
    } else {
        // Método 2: execCommand (fallback)
        copiarComExecCommand(texto, mensagemSucesso);
    }
}

function copiarComExecCommand(texto, mensagemSucesso) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed'; // Fora da tela
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const sucesso = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (sucesso) {
            mostrarNotificacao(mensagemSucesso);
        } else {
            console.warn('Falha ao copiar com execCommand.');
            mostrarAlternativaCopia(texto); // Mostrar fallback final
        }
    } catch (err) {
        console.error('Erro ao copiar com execCommand:', err);
        mostrarAlternativaCopia(texto); // Mostrar fallback final
    }
}

// Método 3: Interface alternativa se tudo falhar
function mostrarAlternativaCopia(texto) {
  // Usar a API Web Share se disponível (principalmente em mobile)
  if (navigator.share) {
    navigator.share({
      title: 'Relatório de Turno',
      text: texto
    })
    .then(() => {
      mostrarNotificacao('Relatório compartilhado!');
    })
    .catch((error) => {
      if (error.name !== 'AbortError') { // Ignorar se o usuário cancelar
        console.error('Erro ao compartilhar:', error);
        alert('Não foi possível copiar ou compartilhar automaticamente. Por favor, selecione o texto manualmente e copie (Ctrl+C).');
      }
    });
  } else {
    // Destacar o texto para facilitar a seleção manual
    // Precisamos saber qual <pre> está visível
    const preVisivel = document.getElementById('relatorioTexto').style.display !== 'none'
        ? document.getElementById('relatorioTexto')
        : document.getElementById('whatsAppTexto').style.display !== 'none'
            ? document.getElementById('whatsAppTexto')
            : null;

    if(preVisivel) {
        try {
            preVisivel.focus();
            // Selecionar conteúdo do <pre> é um pouco diferente
            const range = document.createRange();
            range.selectNodeContents(preVisivel);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        } catch(e) {
            console.error("Erro ao selecionar texto do <pre>", e);
        }
    }
    alert('Não foi possível copiar automaticamente. Selecione o texto manualmente e copie (Ctrl+C ou Menu de contexto)');
  }
}


/**
 * Função para iniciar um novo relatório
 */
function novoRelatorio() {
  // Confirmar com o usuário se já existem dados ou equipes
  let confirmNeeded = false;
  if ( (dadosTurno && Object.keys(dadosTurno).length > 0 && dadosTurno.data) || (equipes && equipes.length > 0) ) {
      confirmNeeded = true;
  }

  if (!confirmNeeded || confirm('Deseja iniciar um novo relatório? Os dados não salvos serão perdidos.')) {

    // Resetar formulários
    const formTurno = document.getElementById('formTurno');
    if(formTurno) {
        formTurno.reset();
        formTurno.classList.remove('was-validated');
    }
    const dataInput = document.getElementById('data');
    if (dataInput) {
      // Tentar setar data para hoje, considerando fuso horário local
      try {
          const today = new Date();
          // Ajustar para o fuso horário local antes de converter para YYYY-MM-DD
          const offset = today.getTimezoneOffset() * 60000; // Offset em milissegundos
          const localDate = new Date(today.getTime() - offset);
          dataInput.value = localDate.toISOString().split('T')[0];
      } catch (e) {
          console.error("Erro ao setar data padrão:", e);
          dataInput.value = ''; // Fallback para vazio
      }
    }

    // Limpar variáveis globais
    equipes = [];
    dadosTurno = {};
    ultimoRelatorioId = null; // Resetar ID também

    // Atualizar o estado se o módulo estiver disponível
    if (window.AppState) {
      AppState.update('equipes', []);
      AppState.update('dadosTurno', {});
      AppState.update('ultimoRelatorioId', null);
      AppState.update('currentStep', 'stepTurno');
    }

    // Atualizar interface
    atualizarListaEquipes();
    atualizarBotaoAvancar();

    // Resetar indicadores de etapa
    document.getElementById('step1Indicator').classList.add('active');
    document.getElementById('step1Indicator').classList.remove('completed');
    document.getElementById('step2Indicator').classList.remove('active', 'completed');
    document.getElementById('step3Indicator').classList.remove('active', 'completed');

    // Voltar para a primeira etapa
    mostrarEtapa('stepTurno');
  }
}


/**
 * Funções para pesquisa de relatórios
 */
function ajustarCampoPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa').value;
  const termoPesquisa = document.getElementById('termoPesquisa');
  const labelPesquisa = document.getElementById('labelPesquisa');

  // Salvar valor atual antes de mudar o tipo
  const valorAtual = termoPesquisa.value;

  switch (tipoPesquisa) {
    case 'data':
      labelPesquisa.textContent = 'Data'; // Simplificado
      termoPesquisa.type = 'date';
      termoPesquisa.placeholder = '';
      // Tentar manter o valor se for uma data válida (pode não funcionar entre tipos)
      termoPesquisa.value = valorAtual && !isNaN(Date.parse(valorAtual)) ? valorAtual : '';
      break;
    case 'mes_ano':
      labelPesquisa.textContent = 'Mês/Ano'; // Simplificado
      termoPesquisa.type = 'month';
       termoPesquisa.placeholder = '';
      termoPesquisa.value = valorAtual.includes('-') ? valorAtual : ''; // Manter se for YYYY-MM
      break;
    case 'supervisor':
      labelPesquisa.textContent = 'Nome do supervisor';
      termoPesquisa.type = 'text';
      termoPesquisa.placeholder = 'Digite o nome...';
      termoPesquisa.value = valorAtual; // Manter valor
      break;
    case 'letra':
      labelPesquisa.textContent = 'Letra do turno';
      termoPesquisa.type = 'text';
       termoPesquisa.placeholder = 'Digite a letra (A, B, C...)';
      termoPesquisa.value = valorAtual; // Manter valor
      break;
    case 'geral':
    default:
      labelPesquisa.textContent = 'Termo de pesquisa';
      termoPesquisa.type = 'text';
      termoPesquisa.placeholder = 'Digite data, supervisor, equipe...';
      termoPesquisa.value = valorAtual; // Manter valor
      break;
  }
}

function abrirPesquisa() {
  // Mostrar a tela de pesquisa
  mostrarEtapa('stepPesquisa');

  // Esconder resultados anteriores
  document.getElementById('resultadosPesquisa').style.display = 'none';
  document.getElementById('semResultados').style.display = 'none';
  document.getElementById('tabelaResultados').innerHTML = ''; // Limpar tabela

  // Resetar o formulário
  const formPesquisa = document.getElementById('formPesquisa');
  if(formPesquisa) {
      formPesquisa.reset();
  }
  ajustarCampoPesquisa(); // Ajustar para o tipo padrão (geral)

  // Atualizar o estado se o módulo estiver disponível
  if (window.AppState) {
    AppState.update('currentStep', 'stepPesquisa');
  }
}

function voltarDaPesquisa() {
  // Voltar para a etapa inicial (Turno) ou para o Dashboard?
  // O código original voltava para 'stepTurno'. Mantendo isso.
  const proximaEtapa = window.AppState?.get('previousStep') || 'stepTurno'; // Tenta voltar para anterior ou padrão

  // Atualizar o estado se o módulo estiver disponível
  if (window.AppState) {
    AppState.update('currentStep', proximaEtapa);
  }

  mostrarEtapa(proximaEtapa);
}

async function executarPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa').value;
  let termoPesquisa = document.getElementById('termoPesquisa').value.trim();

  if (!termoPesquisa) {
    alert('Por favor, informe um termo de pesquisa.');
    return;
  }

  // Formatar data (YYYY-MM-DD) para DD/MM/YYYY se necessário pela API
  // A API original parecia esperar DD/MM/AAAA para 'data'.
  // Se a API esperar YYYY-MM-DD, remover esta conversão.
  /*
  if (tipoPesquisa === 'data') {
      try {
          const partes = termoPesquisa.split('-'); // YYYY-MM-DD
          if (partes.length === 3) {
              termoPesquisa = `${partes[2]}/${partes[1]}/${partes[0]}`; // DD/MM/YYYY
          }
      } catch(e) { console.error("Erro ao formatar data para pesquisa:", e); }
  }
  */

  // Formatar mês/ano (YYYY-MM) para MM/YYYY se necessário pela API
  if (tipoPesquisa === 'mes_ano') {
    try {
        const partes = termoPesquisa.split('-'); // YYYY-MM
        if (partes.length === 2) {
            termoPesquisa = `${partes[1]}/${partes[0]}`; // MM/YYYY
        }
    } catch(e) { console.error("Erro ao formatar mês/ano para pesquisa:", e); }
  }

  mostrarLoading('Pesquisando relatórios...');

  try {
    // Usar a API para pesquisar relatórios
    const result = await pesquisarRelatoriosAPI(termoPesquisa, tipoPesquisa);
    ocultarLoading();

    if (result.success) {
      // Mostrar área de resultados
      document.getElementById('resultadosPesquisa').style.display = 'block';

      // Limpar resultados anteriores
      const tabelaResultados = document.getElementById('tabelaResultados');
      tabelaResultados.innerHTML = '';

      if (!result.resultados || result.resultados.length === 0) {
        // Mostrar mensagem de sem resultados
        document.getElementById('semResultados').style.display = 'block';
        document.querySelector('#resultadosPesquisa .table-responsive').style.display = 'none'; // Ocultar tabela vazia
      } else {
        // Ocultar mensagem de sem resultados e mostrar tabela
        document.getElementById('semResultados').style.display = 'none';
         document.querySelector('#resultadosPesquisa .table-responsive').style.display = 'block';

        // Adicionar cada relatório encontrado à tabela
        result.resultados.forEach(function(relatorio) {
          if (!relatorio || !relatorio.id) return; // Pular resultados inválidos

          const tr = document.createElement('tr');

          tr.innerHTML = `
            <td>${relatorio.data || 'N/A'}</td>
            <td>${relatorio.horario || 'N/A'}</td>
            <td>${relatorio.letra || 'N/A'}</td>
            <td>${relatorio.supervisor || 'N/A'}</td>
            <td>
              <div class="btn-group btn-group-sm" role="group" aria-label="Ações do Relatório">
                <button type="button" class="btn btn-primary" title="Visualizar Relatório" onclick="visualizarRelatorioExistente('${relatorio.id}')">
                  <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn btn-success" title="Gerar PDF" onclick="gerarPDFExistente('${relatorio.id}')">
                  <i class="bi bi-file-pdf"></i>
                </button>
                <button type="button" class="btn btn-info" title="Formato WhatsApp" onclick="formatarWhatsAppExistente('${relatorio.id}')">
                  <i class="bi bi-whatsapp"></i>
                </button>
                 <button type="button" class="btn btn-secondary" title="Exportar CSV" onclick="exportarCSVExistente('${relatorio.id}')">
                  <i class="bi bi-file-spreadsheet"></i>
                </button>
              </div>
            </td>
          `;

          tabelaResultados.appendChild(tr);
        });
      }
    } else {
      alert('Erro na pesquisa: ' + result.message);
      document.getElementById('resultadosPesquisa').style.display = 'none'; // Ocultar em caso de erro
    }
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao executar pesquisa:', error);
    alert('Ocorreu um erro ao pesquisar: ' + (error.message || error));
    document.getElementById('resultadosPesquisa').style.display = 'none'; // Ocultar em caso de erro
  }
}


// Funções para manipular relatórios existentes (da pesquisa)
async function visualizarRelatorioExistente(relatorioId) {
  if (!relatorioId) return;
  mostrarLoading('Carregando relatório...');

  try {
      const result = await gerarRelatorioTextoAPI(relatorioId);
      ocultarLoading();
      if (result.success) {
          document.getElementById('relatorioTexto').textContent = result.relatorio;
          // Configurar botão voltar para ir para a pesquisa
          document.getElementById('btnVoltarRelatorio').setAttribute('onclick', 'voltarParaPesquisa()');
          mostrarEtapa('stepRelatorio');
          if (window.AppState) AppState.update('currentStep', 'stepRelatorio');
      } else {
          alert('Erro ao carregar relatório: ' + result.message);
      }
  } catch (error) {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + (error.message || error));
  }
}

async function formatarWhatsAppExistente(relatorioId) {
  if (!relatorioId) return;
  mostrarLoading('Formatando para WhatsApp...');

   try {
      const result = await formatarWhatsAppAPI(relatorioId);
      ocultarLoading();
      if (result.success) {
          document.getElementById('whatsAppTexto').textContent = result.relatorio;
          // Configurar botão voltar para ir para a pesquisa
          document.getElementById('btnVoltarWhatsApp').setAttribute('onclick', 'voltarParaPesquisa()');
          mostrarEtapa('stepWhatsApp');
          if (window.AppState) AppState.update('currentStep', 'stepWhatsApp');
      } else {
          alert('Erro ao formatar para WhatsApp: ' + result.message);
      }
  } catch (error) {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + (error.message || error));
  }
}

// --- Novas funções para PDF e CSV de relatórios existentes ---
async function gerarPDFExistente(relatorioId) {
    if (!relatorioId) return;
    mostrarLoading('Gerando PDF...');
    try {
        // Assumindo que a API pode gerar o PDF diretamente ou fornecer dados para gerar no cliente
        // Se a API retorna um link/blob:
        // const pdfData = await gerarPDFAPI(relatorioId);
        // window.open(pdfData.url); // Ou criar link de download

        // Se precisar gerar no cliente (requer dados do relatório):
        const dadosResult = await obterDadosRelatorioAPI(relatorioId); // Precisa criar essa API
        if (dadosResult.success) {
            gerarPDF(dadosResult.dadosTurno, dadosResult.equipes); // Reutiliza a função de gerar PDF
        } else {
            alert('Erro ao obter dados para PDF: ' + dadosResult.message);
        }
    } catch (error) {
        console.error('Erro ao gerar PDF existente:', error);
        alert('Erro ao gerar PDF: ' + (error.message || error));
    } finally {
        ocultarLoading();
    }
}

async function exportarCSVExistente(relatorioId) {
    if (!relatorioId) return;
    mostrarLoading('Exportando CSV...');
    try {
        // Assumindo que a API pode gerar o CSV diretamente ou fornecer dados para gerar no cliente
        // Se a API retorna um link/blob:
        // const csvData = await exportarCSVAPI(relatorioId);
        // criarLinkDownload(csvData.blob, csvData.filename);

        // Se precisar gerar no cliente (requer dados do relatório):
        const dadosResult = await obterDadosRelatorioAPI(relatorioId); // Precisa criar essa API
        if (dadosResult.success) {
            exportarCSV(dadosResult.dadosTurno, dadosResult.equipes); // Reutiliza a função de exportar CSV
        } else {
            alert('Erro ao obter dados para CSV: ' + dadosResult.message);
        }
    } catch (error) {
        console.error('Erro ao exportar CSV existente:', error);
        alert('Erro ao exportar CSV: ' + (error.message || error));
    } finally {
        ocultarLoading();
    }
}
// --- Fim das novas funções ---


/**
 * Função para mostrar ajuda
 */
function mostrarHelp() {
  try {
    if (!modalHelp) {
      modalHelp = new bootstrap.Modal(document.getElementById('modalHelp'));
    }
    modalHelp.show();
  } catch (err) {
    console.error("Erro ao mostrar modal de ajuda:", err);
    // Tentar inicializar de novo se falhou antes
    try {
        modalHelp = new bootstrap.Modal(document.getElementById('modalHelp'));
        modalHelp.show();
    } catch (e) {
         alert("O sistema de ajuda não está disponível no momento. Tente recarregar a página.");
    }
  }
}

/**
 * Funções para mostrar e ocultar indicador de carregamento
 */
function mostrarLoading(mensagem = 'Processando, aguarde...') {
  const loading = document.querySelector('.loading');
  const loadingText = document.querySelector('.loading-text');

  if (loading && loadingText) {
    loadingText.textContent = mensagem;
    loading.style.display = 'flex'; // Usar flex para centralizar o conteúdo
  } else {
      console.warn("Elemento de loading não encontrado.");
  }

  // Iniciar medição de performance se o módulo estiver disponível
  if (window.PerformanceMonitor) {
    currentOperation = PerformanceMonitor.startMeasure('loading_' + mensagem.replace(/\s+/g, '_'));
  }
}

function ocultarLoading() {
  const loading = document.querySelector('.loading');
  if (loading) {
    loading.style.display = 'none';
  }

  // Finalizar medição de performance se o módulo estiver disponível
  if (window.PerformanceMonitor && currentOperation) {
    try {
      PerformanceMonitor.endMeasure(currentOperation);
    } catch(e) {
      console.warn("Erro ao finalizar medição de performance:", e);
    }
    currentOperation = null;
  }
}

/**
 * Função para mostrar notificações (usando Bootstrap Toast)
 */
function mostrarNotificacao(mensagem, tipo = 'success') { // Adicionado tipo (success, warning, danger)
  // Usar sistema de notificações avançado se disponível
  if (window.Notifications && typeof window.Notifications[tipo] === 'function') {
    window.Notifications[tipo](mensagem);
    return;
  }

  // Sistema de notificações básico com Bootstrap Toast
  const toastElement = document.getElementById('toastNotificacao');
  const toastTexto = document.getElementById('toastTexto');
  const toastIcon = toastElement?.querySelector('i'); // Obter ícone

  if (toastElement && toastTexto && toastIcon) {
      // Configurar cor e ícone baseado no tipo
      let bgClass = 'bg-success';
      let iconClass = 'bi-check-circle-fill';
      if (tipo === 'warning') {
          bgClass = 'bg-warning';
          iconClass = 'bi-exclamation-triangle-fill';
      } else if (tipo === 'danger') {
          bgClass = 'bg-danger';
          iconClass = 'bi-x-octagon-fill';
      }
      toastElement.classList.remove('bg-success', 'bg-warning', 'bg-danger');
      toastElement.classList.add(bgClass);
      toastIcon.className = `bi ${iconClass} me-2`;

      toastTexto.textContent = mensagem;

      // Inicializar e mostrar o toast
      try {
          const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
          toast.show();
      } catch(e) {
          console.error("Erro ao mostrar toast:", e);
          // Fallback simples
          toastElement.classList.add('show');
           setTimeout(() => {
              toastElement.classList.remove('show');
           }, 3000);
      }

  } else {
      // Fallback para alert se o toast não funcionar
      console.warn("Elemento Toast não configurado corretamente, usando alert.");
      alert(mensagem);
  }
}


/**
 * Toggle para campos personalizados no formulário
 */
function toggleVagaPersonalizada() {
  const vagaSelect = document.getElementById('equipeVaga');
  const vagaPersonalizadaContainer = document.getElementById('vagaPersonalizadaContainer');
  const vagaPersonalizadaInput = document.getElementById('equipeVagaPersonalizada');

  if (vagaSelect && vagaPersonalizadaContainer && vagaPersonalizadaInput) {
      if (vagaSelect.value === 'OUTRA VAGA') {
        vagaPersonalizadaContainer.style.display = 'block';
        vagaPersonalizadaInput.required = true;
      } else {
        vagaPersonalizadaContainer.style.display = 'none';
        vagaPersonalizadaInput.required = false;
        vagaPersonalizadaInput.value = ''; // Limpar valor ao esconder
      }
  }
}

function toggleEquipamentoPersonalizado() {
  const equipamentoSelect = document.getElementById('equipeEquipamento');
  const equipamentoPersonalizadoContainer = document.getElementById('equipamentoPersonalizadoContainer');
  const equipamentoPersonalizadoInput = document.getElementById('equipeEquipamentoPersonalizado');

   if (equipamentoSelect && equipamentoPersonalizadoContainer && equipamentoPersonalizadoInput) {
      if (equipamentoSelect.value === 'OUTRO EQUIPAMENTO') {
        equipamentoPersonalizadoContainer.style.display = 'block';
        equipamentoPersonalizadoInput.required = true;
      } else {
        equipamentoPersonalizadoContainer.style.display = 'none';
        equipamentoPersonalizadoInput.required = false;
        equipamentoPersonalizadoInput.value = ''; // Limpar valor ao esconder
      }
   }
}

function toggleTrocaEquipamento() {
  const trocaSim = document.getElementById('equipeTrocaSim');
  const trocaDetalhes = document.getElementById('trocaDetalhes');
  const camposObrigatoriosTroca = trocaDetalhes?.querySelectorAll('input[required], textarea[required], select[required]'); // Atualizar seleção

  if (trocaSim && trocaDetalhes) {
      if (trocaSim.checked) {
        trocaDetalhes.style.display = 'block';
        // Tornar campos dentro de trocaDetalhes obrigatórios (se necessário)
        // Ex: document.getElementById('equipeDefeito').required = true;
        //     document.getElementById('equipePlacaNova').required = true;
        //     document.getElementById('equipeDataHoraTroca').required = true;
         camposObrigatoriosTroca?.forEach(el => el.required = true);
      } else {
        trocaDetalhes.style.display = 'none';
        // Remover obrigatoriedade
        // Ex: document.getElementById('equipeDefeito').required = false;
        //     document.getElementById('equipePlacaNova').required = false;
        //     document.getElementById('equipeDataHoraTroca').required = false;
         camposObrigatoriosTroca?.forEach(el => el.required = false);
        // Limpar campos da troca ao esconder
        document.getElementById('equipeDefeito').value = '';
        document.getElementById('equipePlacaNova').value = '';
        document.getElementById('equipeDataHoraTroca').value = '';
        document.getElementById('equipeMotivoOutro').value = '';
        document.querySelectorAll('input[name="equipeMotivoTroca"]').forEach(radio => radio.checked = false);
        toggleMotivoOutro(); // Esconder campo de outro motivo
      }
  }
}


function toggleMotivoOutro() {
  const motivoOutroRadio = document.getElementById('motivoOutro');
  const motivoOutroContainer = document.getElementById('motivoOutroContainer');
  const motivoOutroInput = document.getElementById('equipeMotivoOutro');

  if (motivoOutroRadio && motivoOutroContainer && motivoOutroInput) {
      if (motivoOutroRadio.checked) {
        motivoOutroContainer.style.display = 'block';
        motivoOutroInput.required = true;
      } else {
        motivoOutroContainer.style.display = 'none';
        motivoOutroInput.required = false;
        motivoOutroInput.value = ''; // Limpar valor ao esconder
      }
  }
}

/**
 * Funções utilitárias
 */
function shortenText(text, maxLength) {
  if (typeof text !== 'string') return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatarData(dataStr) {
  // Entrada pode ser YYYY-MM-DD ou já formatada
  if (!dataStr || typeof dataStr !== 'string') return 'N/A';

  if (dataStr.includes('/')) return dataStr; // Já formatada

  try {
    // Adiciona 'T00:00:00' para evitar problemas de fuso ao criar o Date
    const data = new Date(dataStr + 'T00:00:00');
    // Verifica se a data é válida
    if (isNaN(data.getTime())) {
        return 'Data inválida';
    }
    // getUTCDate, getUTCMonth, getUTCFullYear para evitar problemas de fuso
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0'); // Meses são 0-indexed
    const ano = data.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (e) {
    console.error("Erro ao formatar data:", dataStr, e);
    return 'Erro Data';
  }
}

function formatarDataHora(dateTimeStr) {
    if (!dateTimeStr || typeof dateTimeStr !== 'string') return 'N/A';
    try {
        // Input é esperado como YYYY-MM-DDTHH:mm
        const dataHora = new Date(dateTimeStr);
        if (isNaN(dataHora.getTime())) {
            return 'Data/Hora inválida';
        }

        const dia = String(dataHora.getDate()).padStart(2, '0');
        const mes = String(dataHora.getMonth() + 1).padStart(2, '0');
        const ano = dataHora.getFullYear();
        const hora = String(dataHora.getHours()).padStart(2, '0');
        const minuto = String(dataHora.getMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    } catch (e) {
        console.error("Erro ao formatar data/hora:", dateTimeStr, e);
        return 'Erro Data/Hora';
    }
}


// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {

  // --- INÍCIO DA LÓGICA DE INICIALIZAÇÃO DO PATCH ---
  // Verificar estado no carregamento da página
  // Se o AppState já estiver inicializado, recuperar dados do estado
  if (window.AppState) {
    // Obter dados do estado, se existirem
    const estadoEquipes = AppState.get('equipes');
    if (estadoEquipes && Array.isArray(estadoEquipes)) {
      window.equipes = estadoEquipes; // Atualizar a variável global
      equipes = estadoEquipes; // Garantir que a variável local também seja atualizada
    }
     const estadoTurno = AppState.get('dadosTurno');
     if (estadoTurno && typeof estadoTurno === 'object') {
         dadosTurno = estadoTurno;
         // Preencher campos do turno se estiver na etapa 1
         if(AppState.get('currentStep') === 'stepTurno') {
             document.getElementById('data').value = dadosTurno.data || '';
             document.getElementById('horario').value = dadosTurno.horario || '';
             document.getElementById('letra').value = dadosTurno.letra || '';
             document.getElementById('supervisor').value = dadosTurno.supervisor || '';
         }
     }
     ultimoRelatorioId = AppState.get('ultimoRelatorioId') || null;

    // Restaurar etapa atual
    const currentStep = AppState.get('currentStep') || 'stepTurno';
    mostrarEtapa(currentStep);
    // Atualizar indicadores de etapa conforme o estado (lógica mais complexa pode ser necessária aqui)
     if (currentStep === 'stepEquipes' || currentStep === 'stepRevisao' || currentStep === 'stepSucesso') {
         document.getElementById('step1Indicator').classList.add('completed');
         document.getElementById('step1Indicator').classList.remove('active');
     }
     if (currentStep === 'stepRevisao' || currentStep === 'stepSucesso') {
         document.getElementById('step2Indicator').classList.add('completed');
         document.getElementById('step2Indicator').classList.remove('active');
     }
     if (currentStep === 'stepSucesso') {
         document.getElementById('step3Indicator').classList.add('completed');
          document.getElementById('step3Indicator').classList.remove('active');
     }
     if (currentStep === 'stepTurno') document.getElementById('step1Indicator').classList.add('active');
     if (currentStep === 'stepEquipes') document.getElementById('step2Indicator').classList.add('active');
     if (currentStep === 'stepRevisao') document.getElementById('step3Indicator').classList.add('active');


    // Atualizar UI com pequeno atraso para garantir que elementos DOM estão prontos
    // (Removido o setTimeout, confiando que DOMContentLoaded é suficiente)
    atualizarListaEquipes(); // Atualizar lista com dados do estado
    atualizarBotaoAvancar(); // Atualizar botão com dados do estado

  } else {
       // Se não houver AppState, garantir que comece na primeira etapa
       mostrarEtapa('stepTurno');
       // Configurar data padrão como hoje (código original movido para cá)
       const dataInput = document.getElementById('data');
       if (dataInput) {
           try {
               const today = new Date();
               const offset = today.getTimezoneOffset() * 60000;
               const localDate = new Date(today.getTime() - offset);
               dataInput.value = localDate.toISOString().split('T')[0];
           } catch (e) {
               console.error("Erro ao setar data padrão:", e);
               dataInput.value = '';
           }
       }
  }
  // --- FIM DA LÓGICA DE INICIALIZAÇÃO DO PATCH ---


  // Inicializar modais do Bootstrap (código original)
  try {
    // Garantir que os elementos existem antes de criar os modais
    const modalEquipeEl = document.getElementById('modalEquipe');
    const modalHelpEl = document.getElementById('modalHelp');
    if (modalEquipeEl) {
        modalEquipe = new bootstrap.Modal(modalEquipeEl);
    }
    if (modalHelpEl) {
        modalHelp = new bootstrap.Modal(modalHelpEl);
    }
  } catch (err) {
    console.error("Erro ao inicializar modals:", err);
  }

  // Inicializar o formulário com dados da API (código original)
  inicializarFormulario();

  // Adicionar listener para a aba Dashboard (se existir o botão)
  const dashboardTab = document.getElementById('dashboardTab');
  if(dashboardTab && window.Dashboard && typeof Dashboard.abrir === 'function') {
      dashboardTab.addEventListener('click', Dashboard.abrir);
  } else if (dashboardTab) {
      // Fallback se o módulo Dashboard não carregar
       dashboardTab.addEventListener('click', () => {
           mostrarEtapa('dashboard'); // Simplesmente mostra a div
           if(window.AppState) AppState.update('currentStep', 'dashboard');
       });
       // Adicionar um botão voltar simples ao dashboard se não houver módulo
       const dashboardDiv = document.getElementById('dashboard');
       const voltarBtn = dashboardDiv?.querySelector('.btn-secondary[onclick="voltarDoDashboard()"]');
       if(dashboardDiv && !voltarBtn) {
           const footer = dashboardDiv.querySelector('.card-body');
           if(footer) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-secondary mt-4';
                btn.innerHTML = '<i class="bi bi-arrow-left me-2"></i> Voltar';
                btn.onclick = voltarDaPesquisa; // Reutiliza a função de voltar
                // Adicionar antes de qualquer outro elemento no final do card-body
                const lastCard = footer.querySelector('.card:last-of-type');
                if(lastCard) {
                    lastCard.insertAdjacentElement('afterend', btn);
                } else {
                    footer.appendChild(btn);
                }
           }
       }
  }

}); // Fim do DOMContentLoaded
