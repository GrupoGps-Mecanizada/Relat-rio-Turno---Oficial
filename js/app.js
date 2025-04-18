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
    atividade: document.getElementById('equipeAtividade').value,
    vaga: document.getElementById('equipeVaga').value,
    equipamento: document.getElementById('equipeEquipamento').value,
    trocaEquipamento: document.querySelector('input[name="equipeTroca"]:checked').value,
    caixaBloqueio: document.querySelector('input[name="equipeCaixaBloqueio"]:checked').value,
    cadeados: document.getElementById('equipeCadeados').value,
    plaquetas: document.getElementById('equipePlaquetas').value,
    observacoes: document.getElementById('equipeObservacoes').value,
    justificativa: document.getElementById('equipeJustificativa').value
  };
  
  // Campos personalizados
  if (equipe.vaga === 'OUTRA VAGA') {
    equipe.vagaPersonalizada = document.getElementById('equipeVagaPersonalizada').value;
  }
  
  if (equipe.equipamento === 'OUTRO EQUIPAMENTO') {
    equipe.equipamentoPersonalizado = document.getElementById('equipeEquipamentoPersonalizado').value;
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
  } else {
    equipe.materiaisVacuo = {
      mangotes: document.getElementById('equipeMangotes').value,
      reducoes: document.getElementById('equipeReducoes').value
    };
    equipe.mangotes3Polegadas = document.getElementById('equipeMangotes3Polegadas').value;
    equipe.mangotes4Polegadas = document.getElementById('equipeMangotes4Polegadas').value;
    equipe.mangotes6Polegadas = document.getElementById('equipeMangotes6Polegadas').value;
  }
  
  // Adicionar campos relacionados à troca de equipamentos, se aplicável
  if (equipe.trocaEquipamento === 'Sim') {
    const motivoTrocaEl = document.querySelector('input[name="equipeMotivoTroca"]:checked');
    equipe.motivoTroca = motivoTrocaEl ? motivoTrocaEl.value : '';
    
    if (equipe.motivoTroca === 'Outros Motivos (Justificar)') {
      equipe.motivoOutro = document.getElementById('equipeMotivoOutro').value;
    }
    
    equipe.defeito = document.getElementById('equipeDefeito').value;
    equipe.placaNova = document.getElementById('equipePlacaNova').value;
    equipe.dataHoraTroca = document.getElementById('equipeDataHoraTroca').value;
  }
  
  // Verificar se estamos editando ou adicionando
  const index = parseInt(document.getElementById('equipeIndex').value);
  if (index >= 0) {
    // Editar equipe existente
    equipes[index] = equipe;
  } else {
    // Adicionar nova equipe
    equipes.push(equipe);
  }
  
  // Atualizar a listagem de equipes
  atualizarListaEquipes();
  
  // Fechar o modal usando a instância do Bootstrap
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
    // Tentar fechar de forma alternativa
    document.querySelector('.modal-backdrop')?.remove();
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
  
  // Atualizar botão de avançar
  atualizarBotaoAvancar();
  
  // Limpar o formulário e remover a validação
  setTimeout(() => {
    form.reset();
    form.classList.remove('was-validated');
  }, 100);
  
  // Mostrar notificação
  mostrarNotificacao('Equipe salva com sucesso!');
}

// Função atualizada para editar equipe
function editarEquipe(index) {
  const equipe = equipes[index];
  
  // Definir cor do cabeçalho do modal
  const modalHeader = document.getElementById('modalEquipeHeader');
  modalHeader.className = 'modal-header ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'bg-danger' : 'bg-primary');
  modalHeader.style.color = 'white';
  
  document.getElementById('modalEquipeLabel').textContent = 'Editar Equipe ' + equipe.tipo;
  document.getElementById('equipeTipo').value = equipe.tipo;
  document.getElementById('equipeIndex').value = index;
  
  // Resetar validação
  document.getElementById('formEquipe').classList.remove('was-validated');
  
  // Mostrar campos específicos por tipo de equipe
  if (equipe.tipo === 'Alta Pressão') {
    document.getElementById('materiaisAltaPressao').style.display = 'block';
    document.getElementById('materiaisVacuo').style.display = 'none';
  } else {
    document.getElementById('materiaisAltaPressao').style.display = 'none';
    document.getElementById('materiaisVacuo').style.display = 'block';
  }
  
  // Carregar opções corretas para o tipo de equipe
  atualizarOpcoesEquipe(equipe.tipo);
  
  // Preencher o formulário com os dados da equipe
  document.getElementById('equipeNumero').value = equipe.numero;
  document.getElementById('equipeIntegrantes').value = equipe.integrantes;
  document.getElementById('equipeArea').value = equipe.area;
  document.getElementById('equipeAtividade').value = equipe.atividade;
  
  // Selecionar valores nos selects
  document.getElementById('equipeVaga').value = equipe.vaga;
  toggleVagaPersonalizada();
  if (equipe.vagaPersonalizada) {
    document.getElementById('equipeVagaPersonalizada').value = equipe.vagaPersonalizada;
  }
  
  document.getElementById('equipeEquipamento').value = equipe.equipamento;
  toggleEquipamentoPersonalizado();
  if (equipe.equipamentoPersonalizado) {
    document.getElementById('equipeEquipamentoPersonalizado').value = equipe.equipamentoPersonalizado;
  }
  
  // Configurar radiobuttons
  if (equipe.trocaEquipamento === 'Sim') {
    document.getElementById('equipeTrocaSim').checked = true;
    document.getElementById('trocaDetalhes').style.display = 'block';
    
    // Motivo da troca
    if (equipe.motivoTroca === 'Solicitação Do Cliente') {
      document.getElementById('motivoCliente').checked = true;
    } else if (equipe.motivoTroca === 'Defeitos Em Geral (Justificar)') {
      document.getElementById('motivoDefeito').checked = true;
    } else if (equipe.motivoTroca === 'Outros Motivos (Justificar)') {
      document.getElementById('motivoOutro').checked = true;
      document.getElementById('motivoOutroContainer').style.display = 'block';
      document.getElementById('equipeMotivoOutro').value = equipe.motivoOutro || '';
    }
    
    // Detalhes da troca
    document.getElementById('equipeDefeito').value = equipe.defeito || '';
    document.getElementById('equipePlacaNova').value = equipe.placaNova || '';
    document.getElementById('equipeDataHoraTroca').value = equipe.dataHoraTroca || '';
  } else {
    document.getElementById('equipeTrocaNao').checked = true;
    document.getElementById('trocaDetalhes').style.display = 'none';
  }
  
  // Materiais para Alta Pressão
  if (equipe.tipo === 'Alta Pressão') {
    document.getElementById('equipePistola').value = equipe.materiais?.pistola || 'N/A';
    document.getElementById('equipePistolaCanoLongo').value = equipe.materiais?.pistolaCanoLongo || 'N/A';
    document.getElementById('equipeMangueiraTorpedo').value = equipe.materiais?.mangueiraTorpedo || 'N/A';
    document.getElementById('equipePedal').value = equipe.materiais?.pedal || 'N/A';
    document.getElementById('equipeVaretas').value = equipe.materiais?.varetas || 'N/A';
    document.getElementById('equipeRabicho').value = equipe.materiais?.rabicho || 'N/A';
    
    // Lances
    document.getElementById('equipeLancesMangueira').value = equipe.lancesMangueira || 'N/A';
    document.getElementById('equipeLancesVaretas').value = equipe.lancesVaretas || 'N/A';
  } else if (equipe.materiaisVacuo) {
    // Materiais para Vácuo
    document.getElementById('equipeMangotes').value = equipe.materiaisVacuo.mangotes || 'N/A';
    document.getElementById('equipeReducoes').value = equipe.materiaisVacuo.reducoes || 'N/A';
    
    // Mangotes
    document.getElementById('equipeMangotes3Polegadas').value = equipe.mangotes3Polegadas || 'N/A';
    document.getElementById('equipeMangotes4Polegadas').value = equipe.mangotes4Polegadas || 'N/A';
    document.getElementById('equipeMangotes6Polegadas').value = equipe.mangotes6Polegadas || 'N/A';
  }
  
  // Justificativa
  document.getElementById('equipeJustificativa').value = equipe.justificativa || '';
  
  // Caixa de bloqueio
  if (equipe.caixaBloqueio === 'Sim') {
    document.getElementById('caixaBloqueioSim').checked = true;
  } else {
    document.getElementById('caixaBloqueioNao').checked = true;
  }
  
  // Cadeados e plaquetas
  document.getElementById('equipeCadeados').value = equipe.cadeados || 'N/A';
  document.getElementById('equipePlaquetas').value = equipe.plaquetas || 'N/A';
  
  // Observações
  document.getElementById('equipeObservacoes').value = equipe.observacoes || '';
  
  // Mostrar o modal
  try {
    if (modalEquipe) {
      modalEquipe.show();
    } else {
      // Tentar inicializar novamente
      modalEquipe = new bootstrap.Modal(document.getElementById('modalEquipe'));
      modalEquipe.show();
    }
  } catch (err) {
    console.error("Erro ao mostrar modal:", err);
    alert("Erro ao abrir o formulário de edição. Tente recarregar a página.");
  }
}

function removerEquipe(index) {
  if (confirm('Tem certeza que deseja remover esta equipe?')) {
    equipes.splice(index, 1);
    atualizarListaEquipes();
    atualizarBotaoAvancar();
    mostrarNotificacao('Equipe removida com sucesso!');
  }
}

// Navegação entre etapas
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
  
  // Atualizar indicadores de etapa
  document.getElementById('step1Indicator').classList.remove('active');
  document.getElementById('step1Indicator').classList.add('completed');
  document.getElementById('step2Indicator').classList.add('active');
  
  // Avançar para próxima etapa
  document.getElementById('stepTurno').style.display = 'none';
  document.getElementById('stepEquipes').style.display = 'block';
  
  // Atualizar botão de avançar
  atualizarBotaoAvancar();
}

function voltarParaTurno() {
  // Atualizar indicadores de etapa
  document.getElementById('step1Indicator').classList.add('active');
  document.getElementById('step1Indicator').classList.remove('completed');
  document.getElementById('step2Indicator').classList.remove('active');
  
  // Voltar para etapa anterior
  document.getElementById('stepEquipes').style.display = 'none';
  document.getElementById('stepTurno').style.display = 'block';
}

function avancarParaRevisao() {
  // Verificar se há equipes
  if (equipes.length === 0) {
    alert('Adicione pelo menos uma equipe antes de prosseguir.');
    return;
  }
  
  // Atualizar indicadores de etapa
  document.getElementById('step2Indicator').classList.remove('active');
  document.getElementById('step2Indicator').classList.add('completed');
  document.getElementById('step3Indicator').classList.add('active');
  
  // Gerar resumo do turno
  const resumoTurno = document.getElementById('resumoTurno');
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
  
  // Gerar resumo das equipes
  const resumoEquipes = document.getElementById('resumoEquipes');
  resumoEquipes.innerHTML = '';
  
  equipes.forEach((equipe, index) => {
    const card = document.createElement('div');
    card.className = 'card mb-3 ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'border-danger' : 'border-primary');
    
    const header = document.createElement('div');
    header.className = 'card-header ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'bg-danger' : 'bg-primary');
    header.style.color = 'white';
    header.textContent = `${equipe.tipo} - ${equipe.numero}`;
    
    const body = document.createElement('div');
    body.className = 'card-body';
    
    // Principais informações
    const principaisInfo = document.createElement('div');
    principaisInfo.className = 'row mb-3';
    principaisInfo.innerHTML = `
      <div class="col-md-6">
        <p><strong>Integrantes:</strong> ${equipe.integrantes}</p>
        <p><strong>Área:</strong> ${equipe.area}</p>
        <p><strong>Atividade:</strong> ${equipe.atividade}</p>
      </div>
      <div class="col-md-6">
        <p><strong>Vaga:</strong> ${equipe.vaga}${equipe.vagaPersonalizada ? " - " + equipe.vagaPersonalizada : ""}</p>
        <p><strong>Equipamento:</strong> ${equipe.equipamento}${equipe.equipamentoPersonalizado ? " - " + equipe.equipamentoPersonalizado : ""}</p>
        <p><strong>Troca de Equipamento:</strong> ${equipe.trocaEquipamento}</p>
      </div>
    `;
    
    body.appendChild(principaisInfo);
    
    // Detalhes adicionais
    if (equipe.trocaEquipamento === 'Sim') {
      const trocaInfo = document.createElement('div');
      trocaInfo.className = 'alert alert-warning';
      
      let motivoText = equipe.motivoTroca;
      if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
        motivoText = equipe.motivoOutro;
      }
      
      trocaInfo.innerHTML = `
        <p><strong>Motivo da Troca:</strong> ${motivoText || 'Não especificado'}</p>
        ${equipe.defeito ? `<p><strong>Defeito:</strong> ${equipe.defeito}</p>` : ''}
        ${equipe.placaNova ? `<p><strong>Placa Nova:</strong> ${equipe.placaNova}</p>` : ''}
        ${equipe.dataHoraTroca ? `<p><strong>Data/Hora da Troca:</strong> ${equipe.dataHoraTroca}</p>` : ''}
      `;
      body.appendChild(trocaInfo);
    }
    
    card.appendChild(header);
    card.appendChild(body);
    resumoEquipes.appendChild(card);
  });
  
  // Avançar para próxima etapa
  document.getElementById('stepEquipes').style.display = 'none';
  document.getElementById('stepRevisao').style.display = 'block';
}

function voltarParaEquipes() {
  // Atualizar indicadores de etapa
  document.getElementById('step2Indicator').classList.add('active');
  document.getElementById('step2Indicator').classList.remove('completed');
  document.getElementById('step3Indicator').classList.remove('active');
  
  // Voltar para etapa anterior
  document.getElementById('stepRevisao').style.display = 'none';
  document.getElementById('stepEquipes').style.display = 'block';
}

function voltarParaSucesso() {
  document.getElementById('stepRelatorio').style.display = 'none';
  document.getElementById('stepSucesso').style.display = 'block';
}

function voltarDoWhatsApp() {
  document.getElementById('stepWhatsApp').style.display = 'none';
  document.getElementById('stepSucesso').style.display = 'block';
}

function voltarParaPesquisa() {
  document.getElementById('stepRelatorio').style.display = 'none';
  document.getElementById('stepPesquisa').style.display = 'block';
}

function voltarDeWhatsAppParaPesquisa() {
  document.getElementById('stepWhatsApp').style.display = 'none';
  document.getElementById('stepPesquisa').style.display = 'block';
}

// Função melhorada para atualizar a lista de equipes
function atualizarListaEquipes() {
  const listaEquipes = document.getElementById('listaEquipes');
  const semEquipes = document.getElementById('semEquipes');
  
  // Verificar se há equipes
  if (equipes.length === 0) {
    semEquipes.style.display = 'block';
    // Limpar lista, mantendo apenas o elemento semEquipes
    Array.from(listaEquipes.children).forEach(child => {
      if (child !== semEquipes) {
        listaEquipes.removeChild(child);
      }
    });
    return;
  }
  
  // Esconder mensagem de "sem equipes"
  semEquipes.style.display = 'none';
  
  // Limpar lista atual, exceto pelo elemento "semEquipes"
  Array.from(listaEquipes.children).forEach(child => {
    if (child !== semEquipes) {
      listaEquipes.removeChild(child);
    }
  });
  
  // Adicionar cada equipe à lista
  equipes.forEach((equipe, index) => {
    const equipeCard = document.createElement('div');
    equipeCard.className = 'card mb-3 equipe-card ' + (equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'equipe-vacuo' : '');
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.style.backgroundColor = equipe.tipo === 'Auto Vácuo / Hiper Vácuo' ? 'var(--danger-color)' : 'var(--primary-color)';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'd-flex justify-content-between align-items-center';
    
    const titulo = document.createElement('h5');
    titulo.className = 'mb-0 text-white';
    titulo.textContent = equipe.tipo;
    titulo.innerHTML += ` <span class="badge-equipe">${equipe.numero}</span>`;
    
    const botoes = document.createElement('div');
    botoes.className = 'btn-group';
    
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn btn-sm btn-tool';
    btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
    btnEditar.onclick = function() { editarEquipe(index); };
    
    const btnRemover = document.createElement('button');
    btnRemover.className = 'btn btn-sm btn-tool';
    btnRemover.innerHTML = '<i class="bi bi-trash"></i> Remover';
    btnRemover.onclick = function() { removerEquipe(index); };
    
    botoes.appendChild(btnEditar);
    botoes.appendChild(btnRemover);
    
    headerContent.appendChild(titulo);
    headerContent.appendChild(botoes);
    
    cardHeader.appendChild(headerContent);
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const detalhes = document.createElement('div');
    detalhes.className = 'row';
    
    // Coluna 1
    const col1 = document.createElement('div');
    col1.className = 'col-md-4';
    col1.innerHTML = `
      <p><strong>Integrantes:</strong> ${equipe.integrantes}</p>
      <p><strong>Área:</strong> ${equipe.area}</p>
      <p><strong>Atividade:</strong> ${equipe.atividade}</p>
    `;
    
    // Coluna 2
    const col2 = document.createElement('div');
    col2.className = 'col-md-4';
    
    // Vaga com suporte para personalizada
    let vagaText = equipe.vaga;
    if (equipe.vaga === 'OUTRA VAGA' && equipe.vagaPersonalizada) {
      vagaText += ` - ${equipe.vagaPersonalizada}`;
    }
    
    // Equipamento com suporte para personalizado
    let equipText = equipe.equipamento;
    if (equipe.equipamento === 'OUTRO EQUIPAMENTO' && equipe.equipamentoPersonalizado) {
      equipText += ` - ${equipe.equipamentoPersonalizado}`;
    }
    
    col2.innerHTML = `
      <p><strong>Vaga:</strong> ${shortenText(vagaText, 30)}</p>
      <p><strong>Equipamento:</strong> ${shortenText(equipText, 30)}</p>
      <p><strong>Troca de Equipamento:</strong> ${equipe.trocaEquipamento}</p>
    `;
    
    // Coluna 3
    const col3 = document.createElement('div');
    col3.className = 'col-md-4';
    col3.innerHTML = `
      <p><strong>Caixa de Bloqueio:</strong> ${equipe.caixaBloqueio}</p>
      <p><strong>Cadeados:</strong> ${equipe.cadeados}</p>
      <p><strong>Plaquetas:</strong> ${equipe.plaquetas}</p>
    `;
    
    detalhes.appendChild(col1);
    detalhes.appendChild(col2);
    detalhes.appendChild(col3);
    
    cardBody.appendChild(detalhes);
    
    // Adicionar informações extras se houver troca de equipamento
    if (equipe.trocaEquipamento === 'Sim') {
      const trocaInfo = document.createElement('div');
      trocaInfo.className = 'alert alert-warning mt-3 mb-0';
      
      let motivoText = equipe.motivoTroca;
      if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
        motivoText = equipe.motivoOutro;
      }
      
      trocaInfo.innerHTML = `<strong>Troca de equipamento:</strong> ${motivoText || 'Motivo não especificado'}`;
      cardBody.appendChild(trocaInfo);
    }
    
    equipeCard.appendChild(cardHeader);
    equipeCard.appendChild(cardBody);
    
    listaEquipes.appendChild(equipeCard);
  });
  
  // Verificar novamente se o botão de avançar deve ser habilitado
  atualizarBotaoAvancar();
}

function atualizarBotaoAvancar() {
  const btnAvancarRevisao = document.getElementById('btnAvancarRevisao');
  btnAvancarRevisao.disabled = equipes.length === 0;
}

// Funções auxiliares
function shortenText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  
  const data = new Date(dataStr);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}

// Funções para salvar e visualizar relatório
function salvarRelatorio() {
  if (equipes.length === 0) {
    alert('Adicione pelo menos uma equipe antes de salvar o relatório.');
    return;
  }
  
  mostrarLoading('Salvando relatório...');
  
  // Usar a API para salvar o relatório
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

function visualizarRelatorio() {
  if (!ultimoRelatorioId) {
    alert('ID do relatório não encontrado.');
    return;
  }
  
  mostrarLoading('Gerando relatório...');
  
  // Usar a API para gerar o relatório em texto
  gerarRelatorioTextoAPI(ultimoRelatorioId)
    .then(result => {
      ocultarLoading();
      
      if (result.success) {
        document.getElementById('relatorioTexto').textContent = result.relatorio;
        document.getElementById('stepSucesso').style.display = 'none';
        document.getElementById('stepRelatorio').style.display = 'block';
      } else {
        alert('Erro ao gerar relatório: ' + result.message);
      }
    })
    .catch(error => {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + error);
    });
}

function formatarWhatsApp() {
  if (!ultimoRelatorioId) {
    alert('ID do relatório não encontrado.');
    return;
  }
  
  mostrarLoading('Formatando para WhatsApp...');
  
  // Usar a API para formatar o relatório para WhatsApp
  formatarWhatsAppAPI(ultimoRelatorioId)
    .then(result => {
      ocultarLoading();
      
      if (result.success) {
        document.getElementById('whatsAppTexto').textContent = result.relatorio;
        document.getElementById('stepSucesso').style.display = 'none';
        document.getElementById('stepWhatsApp').style.display = 'block';
      } else {
        alert('Erro ao formatar para WhatsApp: ' + result.message);
      }
    })
    .catch(error => {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + error);
    });
}

function copiarRelatorio() {
  const relatorioTexto = document.getElementById('relatorioTexto');
  const texto = relatorioTexto.textContent;
  
  // Tentar múltiplos métodos de cópia, do mais moderno ao mais compatível
  function mostrarSucesso() {
    mostrarNotificacao('Relatório copiado com sucesso!');
  }
  
  // Método 1: API Clipboard moderna
  try {
    navigator.clipboard.writeText(texto)
      .then(() => {
        mostrarSucesso();
        return true;
      })
      .catch(() => {
        // Se falhar, tenta método 2
        usarMetodoFallback();
      });
  } catch (e) {
    // Se método 1 não estiver disponível, tenta método 2
    usarMetodoFallback();
  }
  
  // Método 2: execCommand (compatibilidade)
  function usarMetodoFallback() {
    try {
      // Criar elemento temporário
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      // Selecionar e copiar
      textarea.select();
      textarea.setSelectionRange(0, 99999); // Para mobile
      const sucesso = document.execCommand('copy');
      
      // Limpar
      document.body.removeChild(textarea);
      
      if (sucesso) {
        mostrarSucesso();
      } else {
        // Se ainda falhar, mostra interface alternativa
        mostrarAlternativa();
      }
    } catch (e) {
      mostrarAlternativa();
    }
  }
  
  // Método 3: Interface alternativa se tudo falhar
  function mostrarAlternativa() {
    // Usar a API Web Share se disponível (principalmente em mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Relatório de Turno',
        text: texto
      })
      .then(() => {
        mostrarSucesso();
      })
      .catch((error) => {
        console.error('Erro ao compartilhar:', error);
        alert('Não foi possível copiar ou compartilhar automaticamente. Por favor, selecione o texto manualmente e copie.');
      });
    } else {
      // Destacar o texto para facilitar a seleção manual
      relatorioTexto.focus();
      relatorioTexto.select();
      alert('Selecione o texto manualmente e copie (Ctrl+C ou Menu de contexto)');
    }
  }
}

function copiarWhatsApp() {
  // Mesmo código do copiarRelatorio, mas adaptado para o texto de WhatsApp
  const whatsAppTexto = document.getElementById('whatsAppTexto');
  const texto = whatsAppTexto.textContent;
  
  // Tentar múltiplos métodos de cópia
  function mostrarSucesso() {
    mostrarNotificacao('Texto copiado com sucesso! Cole no WhatsApp.');
  }
  
  // Método 1: API Clipboard moderna
  try {
    navigator.clipboard.writeText(texto)
      .then(() => {
        mostrarSucesso();
        return true;
      })
      .catch(() => {
        // Se falhar, tenta método 2
        usarMetodoFallback();
      });
  } catch (e) {
    // Se método 1 não estiver disponível, tenta método 2
    usarMetodoFallback();
  }
  
  // Método 2: execCommand (compatibilidade)
  function usarMetodoFallback() {
    try {
      // Criar elemento temporário
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      // Selecionar e copiar
      textarea.select();
      textarea.setSelectionRange(0, 99999); // Para mobile
      const sucesso = document.execCommand('copy');
      
      // Limpar
      document.body.removeChild(textarea);
      
      if (sucesso) {
        mostrarSucesso();
      } else {
        // Se ainda falhar, mostra interface alternativa
        mostrarAlternativa();
      }
    } catch (e) {
      mostrarAlternativa();
    }
  }
  
  // Método 3: Interface alternativa
  function mostrarAlternativa() {
    // Usar a API Web Share se disponível (principalmente em mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Relatório de Turno - WhatsApp',
        text: texto
      })
      .then(() => {
        mostrarSucesso();
      })
      .catch((error) => {
        console.error('Erro ao compartilhar:', error);
        alert('Não foi possível copiar ou compartilhar automaticamente. Por favor, selecione o texto manualmente e copie.');
      });
    } else {
      // Destacar o texto para facilitar a seleção manual
      whatsAppTexto.focus();
      whatsAppTexto.select();
      alert('Selecione o texto manualmente e copie (Ctrl+C ou Menu de contexto)');
    }
  }
}

function novoRelatorio() {
  // Confirmar com o usuário
  if (!confirm('Deseja iniciar um novo relatório? Os dados do relatório atual não poderão ser editados.')) {
    return;
  }
  
  // Resetar formulários
  document.getElementById('formTurno').reset();
  document.getElementById('formTurno').classList.remove('was-validated');
  document.getElementById('data').valueAsDate = new Date();
  
  // Limpar equipes
  equipes = [];
  atualizarListaEquipes();
  atualizarBotaoAvancar();
  
  // Resetar indicadores de etapa
  document.getElementById('step1Indicator').classList.add('active');
  document.getElementById('step1Indicator').classList.remove('completed');
  document.getElementById('step2Indicator').classList.remove('active');
  document.getElementById('step2Indicator').classList.remove('completed');
  document.getElementById('step3Indicator').classList.remove('active');
  document.getElementById('step3Indicator').classList.remove('completed');
  
  // Voltar para a primeira etapa
  document.getElementById('stepSucesso').style.display = 'none';
  document.getElementById('stepTurno').style.display = 'block';
}

// Funções para pesquisa de relatórios
function ajustarCampoPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa').value;
  const termoPesquisa = document.getElementById('termoPesquisa');
  const labelPesquisa = document.getElementById('labelPesquisa');
  
  switch(tipoPesquisa) {
    case 'data':
      labelPesquisa.textContent = 'Data (DD/MM/AAAA)';
      termoPesquisa.type = 'date';
      break;
    case 'mes_ano':
      labelPesquisa.textContent = 'Mês/Ano (MM/AAAA)';
      termoPesquisa.type = 'month';
      break;
    case 'supervisor':
      labelPesquisa.textContent = 'Nome do supervisor';
      termoPesquisa.type = 'text';
      break;
    case 'letra':
      labelPesquisa.textContent = 'Letra do turno';
      termoPesquisa.type = 'text';
      break;
    case 'geral':
    default:
      labelPesquisa.textContent = 'Termo de pesquisa';
      termoPesquisa.type = 'text';
      break;
  }
}

function abrirPesquisa() {
  // Mostrar a tela de pesquisa
  document.getElementById('stepTurno').style.display = 'none';
  document.getElementById('stepPesquisa').style.display = 'block';
  
  // Esconder resultados anteriores
  document.getElementById('resultadosPesquisa').style.display = 'none';
  document.getElementById('semResultados').style.display = 'none';
  
  // Resetar o formulário
  document.getElementById('formPesquisa').reset();
  ajustarCampoPesquisa();
}

function voltarDaPesquisa() {
  document.getElementById('stepPesquisa').style.display = 'none';
  document.getElementById('stepTurno').style.display = 'block';
}

function executarPesquisa() {
  const tipoPesquisa = document.getElementById('tipoPesquisa').value;
  let termoPesquisa = document.getElementById('termoPesquisa').value.trim();
  
  if (!termoPesquisa) {
    alert('Por favor, informe um termo de pesquisa.');
    return;
  }
  
  // Formatar o termo conforme o tipo de pesquisa
  if (tipoPesquisa === 'mes_ano') {
    // Converter formato YYYY-MM para MM/YYYY
    const partes = termoPesquisa.split('-');
    if (partes.length === 2) {
      termoPesquisa = partes[1] + '/' + partes[0];
    }
  }
  
  mostrarLoading('Pesquisando relatórios...');
  
  // Usar a API para pesquisar relatórios
  pesquisarRelatoriosAPI(termoPesquisa, tipoPesquisa)
    .then(result => {
      ocultarLoading();
      
      if (result.success) {
        // Mostrar área de resultados
        document.getElementById('resultadosPesquisa').style.display = 'block';
        
        // Limpar resultados anteriores
        const tabelaResultados = document.getElementById('tabelaResultados');
        tabelaResultados.innerHTML = '';
        
        if (result.resultados.length === 0) {
          // Mostrar mensagem de sem resultados
          document.getElementById('semResultados').style.display = 'block';
        } else {
          // Ocultar mensagem de sem resultados
          document.getElementById('semResultados').style.display = 'none';
          
          // Adicionar cada relatório encontrado à tabela
          result.resultados.forEach(function(relatorio) {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
              <td>${relatorio.data}</td>
              <td>${relatorio.horario}</td>
              <td>${relatorio.letra}</td>
              <td>${relatorio.supervisor}</td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button type="button" class="btn btn-primary" onclick="visualizarRelatorioExistente('${relatorio.id}')">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button type="button" class="btn btn-info" onclick="formatarWhatsAppExistente('${relatorio.id}')">
                    <i class="bi bi-whatsapp"></i>
                  </button>
                </div>
              </td>
            `;
            
            tabelaResultados.appendChild(tr);
          });
        }
      } else {
        alert('Erro na pesquisa: ' + result.message);
      }
    })
    .catch(error => {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + error);
    });
}

// Funções para manipular relatórios existentes
function visualizarRelatorioExistente(relatorioId) {
  mostrarLoading('Carregando relatório...');
  
  // Usar a API para visualizar o relatório
  gerarRelatorioTextoAPI(relatorioId)
    .then(result => {
      ocultarLoading();
      
      if (result.success) {
        document.getElementById('relatorioTexto').textContent = result.relatorio;
        document.getElementById('stepPesquisa').style.display = 'none';
        document.getElementById('stepRelatorio').style.display = 'block';
        
        // Atualizar botão de voltar
        document.getElementById('btnVoltarRelatorio').setAttribute('onclick', 'voltarParaPesquisa()');
      } else {
        alert('Erro ao carregar relatório: ' + result.message);
      }
    })
    .catch(error => {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + error);
    });
}

function formatarWhatsAppExistente(relatorioId) {
  mostrarLoading('Formatando para WhatsApp...');
  
  // Usar a API para formatar o relatório para WhatsApp
  formatarWhatsAppAPI(relatorioId)
    .then(result => {
      ocultarLoading();
      
      if (result.success) {
        document.getElementById('whatsAppTexto').textContent = result.relatorio;
        document.getElementById('stepPesquisa').style.display = 'none';
        document.getElementById('stepWhatsApp').style.display = 'block';
        
        // Atualizar botão de voltar
        document.getElementById('btnVoltarWhatsApp').setAttribute('onclick', 'voltarDeWhatsAppParaPesquisa()');
      } else {
        alert('Erro ao formatar para WhatsApp: ' + result.message);
      }
    })
    .catch(error => {
      ocultarLoading();
      console.error('Erro:', error);
      alert('Ocorreu um erro: ' + error);
    });
}

// Função para mostrar ajuda
function mostrarHelp() {
  if (modalHelp) {
    modalHelp.show();
  } else {
    // Tentar inicializar novamente
    try {
      modalHelp = new bootstrap.Modal(document.getElementById('modalHelp'));
      modalHelp.show();
    } catch (err) {
      console.error("Erro ao mostrar modal de ajuda:", err);
      alert("O sistema de ajuda não está disponível no momento. Tente recarregar a página.");
    }
  }
}

// Funções para notificações
function mostrarNotificacao(mensagem) {
  const toast = document.getElementById('toastNotificacao');
  const toastTexto = document.getElementById('toastTexto');
  
  toastTexto.textContent = mensagem;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
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
