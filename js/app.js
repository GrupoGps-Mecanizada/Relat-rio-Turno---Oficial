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
    // Tentar novamente após um atraso
    setTimeout(() => {
      try {
        modalEquipe = new bootstrap.Modal(document.getElementById('modalEquipe'));
        modalHelp = new bootstrap.Modal(document.getElementById('modalHelp'));
      } catch (e) {
        console.error("Falha ao inicializar modais mesmo após atraso:", e);
      }
    }, 500);
  }

  // Inicializar a API do Google Sheets
  inicializarSheetsAPI()
    .then(() => {
      console.log('API inicializada, preenchendo dados do formulário');
      preencherSelects(dadosFormulario);
    })
    .catch(error => {
      console.error('Erro ao inicializar API:', error);
      alert('Erro ao inicializar a conexão com o Google Sheets. Verifique a configuração da API.');
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

// Função para preencher selects com os dados do formulário
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
    
    console.log('Selects preenchidos com sucesso');
  } catch (error) {
    console.error('Erro ao preencher selects:', error);
  }
}

// ... O resto do código JavaScript aqui, adaptado do original ...
// Todas as funções principais como avancarParaEquipes(), salvarEquipe(), etc.

// Exemplo de função adaptada para usar a API do Google Sheets:
function salvarRelatorio() {
  if (equipes.length === 0) {
    alert('Adicione pelo menos uma equipe antes de salvar o relatório.');
    return;
  }
  
  mostrarLoading('Salvando relatório...');
  
  // Usar a função que se comunica com a API do Google Sheets
  salvarTurnoAPI(dadosTurno, equipes)
    .then(result => {
      ocultarLoading();
      
      if (result.success) {
        ultimoRelatorioId = result.relatorioId;
        
        // Atualizar indicadores de etapa
        document.getElementById('step3Indicator').classList.remove('active');
        document.getElementById('step3Indicator').classList.add('completed');
        
        // Avançar para tela de sucesso
        document.getElementById('stepRevisao').style.display = 'none';
        document.getElementById('stepSucesso').style.display = 'block';
      } else {
        alert('Erro ao salvar relatório: ' + result.message);
      }
    })
    .catch(error => {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + error);
    });
}

// Funções de loading e tratamento de erros
function mostrarLoading(mensagem = 'Processando, aguarde...') {
  const loading = document.querySelector('.loading');
  const loadingText = document.querySelector('.loading-text');
  loadingText.textContent = mensagem;
  loading.style.display = 'flex';
}

function ocultarLoading() {
  document.querySelector('.loading').style.display = 'none';
}

function mostrarNotificacao(mensagem) {
  const toast = document.getElementById('toastNotificacao');
  const toastTexto = document.getElementById('toastTexto');
  
  toastTexto.textContent = mensagem;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Funções auxiliares
function formatarData(dataStr) {
  if (!dataStr) return '';
  
  const data = new Date(dataStr);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}
