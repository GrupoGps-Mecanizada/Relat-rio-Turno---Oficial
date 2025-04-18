// Variáveis globais
let dadosTurno = {};
let equipes = [];
let ultimoRelatorioId = null;
let modalEquipe = null;
let modalHelp = null;
let dadosFormulario = CONFIG.OPCOES_FORMULARIO;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar modais
  try {
    modalEquipe = new bootstrap.Modal(document.getElementById('modalEquipe'));
    modalHelp = new bootstrap.Modal(document.getElementById('modalHelp'));
  } catch (err) {
    console.error("Erro ao inicializar modais:", err);
    // Tentar novamente após um pequeno atraso
    setTimeout(() => {
      try {
        modalEquipe = new bootstrap.Modal(document.getElementById('modalEquipe'));
        modalHelp = new bootstrap.Modal(document.getElementById('modalHelp'));
      } catch (e) {
        console.error("Falha ao inicializar modais mesmo após atraso:", e);
      }
    }, 500);
  }

  // Carregar dados do formulário
  // Primeiro tentamos carregar da API, se falhar usamos os dados padrão
  obterDadosFormularioAPI()
    .then(data => {
      if (data.success === false) {
        // Se houver erro específico na API, usamos os dados padrão
        console.log('Usando dados padrão do formulário');
        preencherSelects(dadosFormulario);
      } else {
        // Se a API retornar dados, usamos eles
        console.log('Dados do formulário carregados da API');
        preencherSelects(data);
      }
    })
    .catch(error => {
      // Em caso de erro de conexão, usamos os dados padrão
      console.error('Erro ao carregar dados do formulário:', error);
      console.log('Usando dados padrão do formulário devido a erro');
      preencherSelects(dadosFormulario);
    });
  
  // Definir data de hoje como padrão
  document.getElementById('data').valueAsDate = new Date();
  
  // Configurar validação do Bootstrap
  configValidation();
  
  // Ajustar tamanho do modal para mobile
  const modalEquipeEl = document.getElementById('modalEquipe');
  if (window.innerWidth < 768) {
    modalEquipeEl.classList.add('modal-fullscreen');
  }
  
  // Detectar mudança de orientação
  window.addEventListener('resize', function() {
    if (window.innerWidth < 768) {
      modalEquipeEl.classList.add('modal-fullscreen');
    } else {
      modalEquipeEl.classList.remove('modal-fullscreen');
    }
  });
});

// Configuração da validação de formulários
function configValidation() {
  'use strict';
  
  // Fetch all forms we want to apply validation styles to
  var forms = document.querySelectorAll('.needs-validation');
  
  // Loop over them and prevent submission
  Array.prototype.slice.call(forms).forEach(function(form) {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
}

// Funções para preencher selects com os dados do formulário
function preencherSelects(dados) {
  try {
    // Preencher horários
    const selectHorario = document.getElementById('horario');
    selectHorario.innerHTML = '<option value="" selected disabled>Selecione o horário</option>';
    dados.opcoesHorario.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      selectHorario.appendChild(option);
    });
    
    // Preencher letras
    const selectLetra = document.getElementById('letra');
    selectLetra.innerHTML = '<option value="" selected disabled>Selecione a letra</option>';
    dados.opcoesLetra.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      selectLetra.appendChild(option);
    });
    
    // Preencher supervisores
    const selectSupervisor = document.getElementById('supervisor');
    selectSupervisor.innerHTML = '<option value="" selected disabled>Selecione o supervisor</option>';
    dados.opcoesSupervisor.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      selectSupervisor.appendChild(option);
    });
    
    // Preencher números de equipe
    const selectNumeroEquipe = document.getElementById('equipeNumero');
    if (selectNumeroEquipe) {
      selectNumeroEquipe.innerHTML = '<option value="" selected disabled>Selecione o número</option>';
      dados.opcoesNumeroEquipe.forEach(opcao => {
        const option = document.createElement('option');
        option.value = opcao;
        option.textContent = opcao;
        selectNumeroEquipe.appendChild(option);
      });
    }
    
    // Salvar dados para uso posterior
    dadosFormulario = dados;
    
    console.log('Selects preenchidos com sucesso');
  } catch (error) {
    console.error('Erro ao preencher selects:', error);
  }
}

// Funções para campos condicionais
function toggleVagaPersonalizada() {
  const vagaSelect = document.getElementById('equipeVaga');
  const vagaPersonalizadaContainer = document.getElementById('vagaPersonalizadaContainer');
  const vagaPersonalizada = document.getElementById('equipeVagaPersonalizada');
  
  if (vagaSelect.value === 'OUTRA VAGA') {
    vagaPersonalizadaContainer.style.display = 'block';
    vagaPersonalizada.setAttribute('required', '');
  } else {
    vagaPersonalizadaContainer.style.display = 'none';
    vagaPersonalizada.removeAttribute('required');
  }
}

function toggleEquipamentoPersonalizado() {
  const equipamentoSelect = document.getElementById('equipeEquipamento');
  const equipamentoPersonalizadoContainer = document.getElementById('equipamentoPersonalizadoContainer');
  const equipamentoPersonalizado = document.getElementById('equipeEquipamentoPersonalizado');
  
  if (equipamentoSelect.value === 'OUTRO EQUIPAMENTO') {
    equipamentoPersonalizadoContainer.style.display = 'block';
    equipamentoPersonalizado.setAttribute('required', '');
  } else {
    equipamentoPersonalizadoContainer.style.display = 'none';
    equipamentoPersonalizado.removeAttribute('required');
  }
}

function toggleMotivoOutro() {
  const motivoOutro = document.getElementById('motivoOutro');
  const motivoOutroContainer = document.getElementById('motivoOutroContainer');
  
  if (motivoOutro && motivoOutro.checked) {
    motivoOutroContainer.style.display = 'block';
  } else {
    motivoOutroContainer.style.display = 'none';
  }
}

function toggleTrocaEquipamento() {
  const trocaSim = document.getElementById('equipeTrocaSim');
  const trocaDetalhes = document.getElementById('trocaDetalhes');
  
  if (trocaSim.checked) {
    trocaDetalhes.style.display = 'block';
  } else {
    trocaDetalhes.style.display = 'none';
    document.getElementById('motivoOutroContainer').style.display = 'none';
  }
}

// Funções para mostrar/esconder campos por tipo de equipe
function adicionarEquipe(tipo) {
  try {
    // Definir cor do cabeçalho do modal
    const modalHeader = document.getElementById('modalEquipeHeader');
    modalHeader.className = 'modal-header ' + (tipo === 'Auto Vácuo / Hiper Vácuo' ? 'bg-danger' : 'bg-primary');
    modalHeader.style.color = 'white';
    
    // Configurar título
    document.getElementById('modalEquipeLabel').textContent = 'Adicionar Equipe ' + tipo;
    document.getElementById('equipeTipo').value = tipo;
    document.getElementById('equipeIndex').value = '-1';
    
    // Resetar formulário e validação
    const form = document.getElementById('formEquipe');
    form.reset();
    form.classList.remove('was-validated');
    
    // Garantir que os radio buttons estejam no estado padrão
    document.getElementById('equipeTrocaNao').checked = true;
    document.getElementById('caixaBloqueioNao').checked = true;
    
    // Esconder containers condicionais
    document.getElementById('vagaPersonalizadaContainer').style.display = 'none';
    document.getElementById('equipamentoPersonalizadoContainer').style.display = 'none';
    document.getElementById('trocaDetalhes').style.display = 'none';
    document.getElementById('motivoOutroContainer').style.display = 'none';
    
    // Mostrar campos específicos por tipo de equipe
    if (tipo === 'Alta Pressão') {
      document.getElementById('materiaisAltaPressao').style.display = 'block';
      document.getElementById('materiaisVacuo').style.display = 'none';
    } else {
      document.getElementById('materiaisAltaPressao').style.display = 'none';
      document.getElementById('materiaisVacuo').style.display = 'block';
    }
    
    // Carregar opções corretas para o tipo de equipe
    atualizarOpcoesEquipe(tipo);
    
    // Mostrar o modal usando a instância bootstrap
    if (modalEquipe) {
      modalEquipe.show();
    } else {
      console.error("Modal não inicializado corretamente");
      // Tentar inicializar novamente o modal
      const modalElement = document.getElementById('modalEquipe');
      if (modalElement) {
        modalEquipe = new bootstrap.Modal(modalElement);
        modalEquipe.show();
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar equipe:", error);
    alert("Erro ao abrir o formulário de equipe. Tente novamente.");
  }
}

// Função atualizada para carregar opções
function atualizarOpcoesEquipe(tipo) {
  // Obter selects
  const selectVaga = document.getElementById('equipeVaga');
  const selectEquipamento = document.getElementById('equipeEquipamento');
  const selectLancesMangueira = document.getElementById('equipeLancesMangueira');
  const selectLancesVaretas = document.getElementById('equipeLancesVaretas');
  const selectCadeados = document.getElementById('equipeCadeados');
  const selectPlaquetas = document.getElementById('equipePlaquetas');
  
  // Limpar opções atuais
  selectVaga.innerHTML = '<option value="" selected disabled>Selecione a vaga</option>';
  selectEquipamento.innerHTML = '<option value="" selected disabled>Selecione o equipamento</option>';
  
  // Reset selects quantidades
  selectLancesMangueira.innerHTML = '<option value="N/A" selected>N/A</option>';
  selectLancesVaretas.innerHTML = '<option value="N/A" selected>N/A</option>';
  selectCadeados.innerHTML = '<option value="N/A" selected>N/A</option>';
  selectPlaquetas.innerHTML = '<option value="N/A" selected>N/A</option>';
  
  // Vácuo específicos
  const selectMangotes3 = document.getElementById('equipeMangotes3Polegadas');
  const selectMangotes4 = document.getElementById('equipeMangotes4Polegadas');
  const selectMangotes6 = document.getElementById('equipeMangotes6Polegadas');
  
  if (selectMangotes3) {
    selectMangotes3.innerHTML = '<option value="N/A" selected>N/A</option>';
    selectMangotes4.innerHTML = '<option value="N/A" selected>N/A</option>';
    selectMangotes6.innerHTML = '<option value="N/A" selected>N/A</option>';
  }
  
  // Adicionar novas opções com base no tipo
  let opcoesVaga, opcoesEquipamento;
  
  if (tipo === 'Alta Pressão') {
    opcoesVaga = dadosFormulario.vagasAltaPressao;
    opcoesEquipamento = dadosFormulario.equipamentosAltaPressao;
  } else {
    opcoesVaga = dadosFormulario.vagasVacuo;
    opcoesEquipamento = dadosFormulario.equipamentosVacuo;
  }
  
  // Preencher opções de vaga e equipamento
  opcoesVaga.forEach(opcao => {
    const option = document.createElement('option');
    option.value = opcao;
    option.textContent = opcao;
    selectVaga.appendChild(option);
  });
  
  opcoesEquipamento.forEach(opcao => {
    const option = document.createElement('option');
    option.value = opcao;
    option.textContent = opcao;
    selectEquipamento.appendChild(option);
  });
  
  // Preencher opções de lances (1-15)
  dadosFormulario.opcoesLances.forEach(opcao => {
    if (opcao !== 'N/A') {
      const option1 = document.createElement('option');
      option1.value = opcao;
      option1.textContent = opcao;
      selectLancesMangueira.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = opcao;
      option2.textContent = opcao;
      selectLancesVaretas.appendChild(option2);
    }
  });
  
  // Preencher opções de cadeados e plaquetas (1-30)
  dadosFormulario.opcoesCadeadosPlaquetas.forEach(opcao => {
    if (opcao !== 'N/A') {
      const option1 = document.createElement('option');
      option1.value = opcao;
      option1.textContent = opcao;
      selectCadeados.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = opcao;
      option2.textContent = opcao;
      selectPlaquetas.appendChild(option2);
    }
  });
  
  // Preencher opções de mangotes (1-10) se for Vácuo
  if (tipo === 'Auto Vácuo / Hiper Vácuo' && selectMangotes3) {
    dadosFormulario.opcoesMangotes.forEach(opcao => {
      if (opcao !== 'N/A') {
        const option1 = document.createElement('option');
        option1.value = opcao;
        option1.textContent = opcao;
        selectMangotes3.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = opcao;
        option2.textContent = opcao;
        selectMangotes4.appendChild(option2);
        
        const option3 = document.createElement('option');
        option3.value = opcao;
        option3.textContent = opcao;
        selectMangotes6.appendChild(option3);
      }
    });
  }
}

// Função para salvar equipe
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
    integrantes: document.getElementById('equipeIntegrantes').value,
    area: document.getElementById('equipeArea').value,
    atividade: document.getElementById('equipeAt
