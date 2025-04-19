<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
  <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
  <title>Sistema de Relatório de Turno</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div class="container app-container">
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2><i class="bi bi-clipboard-check me-2"></i>Sistema de Relatório de Turno</h2>
        <div>
          <button class="btn btn-tool" id="dashboardTab">
            <i class="bi bi-graph-up"></i> Dashboard
          </button>
          <button class="btn btn-tool" onclick="abrirPesquisa()">
            <i class="bi bi-search"></i> Pesquisar
          </button>
          <button class="btn btn-tool" onclick="mostrarHelp()">
            <i class="bi bi-question-circle"></i> Ajuda
          </button>
        </div>
      </div>
    </div>

    <div class="step-indicator d-none d-md-flex">
      <div id="step1Indicator" class="step-item active">
        <div class="step-number">1</div>
        <div class="step-title">Informações do Turno</div>
      </div>
      <div id="step2Indicator" class="step-item">
        <div class="step-number">2</div>
        <div class="step-title">Equipes</div>
      </div>
      <div id="step3Indicator" class="step-item">
        <div class="step-number">3</div>
        <div class="step-title">Revisão e Finalização</div>
      </div>
    </div>

    <div id="stepTurno" class="content-step" style="display: block;">
      <div class="card">
        <div class="card-header">
          <h3>Etapa 1: Informações Básicas do Turno</h3>
        </div>
        <div class="card-body">
          <div class="alert-section mb-4">
            <i class="bi bi-info-circle me-2"></i>
            Complete as informações básicas do turno antes de prosseguir para o registro das equipes.
          </div>

          <form id="formTurno" class="needs-validation" novalidate>
            <div class="row mb-4">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="data" class="form-label">Data do turno *</label>
                <input type="date" class="form-control" id="data" required>
                <div class="invalid-feedback">Por favor, informe a data do turno.</div>
              </div>
              <div class="col-md-6">
                <label for="horario" class="form-label">Horário do turno *</label>
                <select class="form-select" id="horario" required>
                  <option value="" selected disabled>Selecione o horário</option>
                  </select>
                <div class="invalid-feedback">Por favor, selecione o horário do turno.</div>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="letra" class="form-label">Letra do turno *</label>
                <select class="form-select" id="letra" required>
                  <option value="" selected disabled>Selecione a letra</option>
                  </select>
                <div class="invalid-feedback">Por favor, selecione a letra do turno.</div>
              </div>
              <div class="col-md-6">
                <label for="supervisor" class="form-label">Supervisor responsável *</label>
                <select class="form-select" id="supervisor" required>
                  <option value="" selected disabled>Selecione o supervisor</option>
                  </select>
                <div class="invalid-feedback">Por favor, selecione o supervisor responsável.</div>
              </div>
            </div>

            <div class="d-flex justify-content-end mt-4">
              <button type="button" class="btn btn-primary" onclick="avancarParaEquipes()">
                Próximo: Adicionar Equipes <i class="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div id="stepEquipes" class="content-step" style="display: none;">
      <div class="card">
        <div class="card-header">
          <h3>Etapa 2: Equipes do Turno</h3>
        </div>
        <div class="card-body">
          <div class="alert-section mb-4">
            <i class="bi bi-info-circle me-2"></i>
            Adicione as equipes que trabalharam durante este turno. É necessário adicionar pelo menos uma equipe.
          </div>

          <div class="d-flex flex-wrap gap-2 mb-4">
            <button type="button" class="btn btn-primary" onclick="adicionarEquipe('Alta Pressão')">
              <i class="bi bi-plus-circle me-2"></i> Adicionar Equipe Alta Pressão
            </button>
            <button type="button" class="btn btn-danger" onclick="adicionarEquipe('Auto Vácuo / Hiper Vácuo')">
              <i class="bi bi-plus-circle me-2"></i> Adicionar Equipe Vácuo/Hiper Vácuo
            </button>
          </div>

          <div id="listaEquipes" class="mb-4">
            <div class="alert alert-info text-center" id="semEquipes">
              <i class="bi bi-info-circle me-2"></i> Nenhuma equipe adicionada. Adicione pelo menos uma equipe para prosseguir.
            </div>
          </div>

          <div class="d-flex justify-content-between mt-4">
            <button type="button" class="btn btn-secondary" onclick="voltarParaTurno()">
              <i class="bi bi-arrow-left me-2"></i> Voltar
            </button>
            <button type="button" class="btn btn-success" onclick="avancarParaRevisao()" id="btnAvancarRevisao" disabled>
              Revisar e Finalizar <i class="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="stepRevisao" class="content-step" style="display: none;">
      <div class="card">
        <div class="card-header">
          <h3>Etapa 3: Revisão e Finalização</h3>
        </div>
        <div class="card-body">
          <div class="alert-section mb-4">
            <i class="bi bi-info-circle me-2"></i>
            Revise todas as informações antes de salvar o relatório. Após salvar, não será possível editar o relatório.
          </div>

          <h4 class="mb-3">Informações do Turno</h4>
          <div class="info-grid mb-4" id="resumoTurno">
            </div>

          <h4 class="mb-3">Equipes</h4>
          <div id="resumoEquipes">
            </div>

          <div class="d-flex justify-content-between mt-4">
            <button type="button" class="btn btn-secondary" onclick="voltarParaEquipes()">
              <i class="bi bi-arrow-left me-2"></i> Voltar para Equipes
            </button>
            <button type="button" class="btn btn-success" onclick="salvarRelatorio()" id="btnSalvar">
              <i class="bi bi-save me-2"></i> Salvar Relatório
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="stepSucesso" class="content-step" style="display: none;">
      <div class="card">
        <div class="card-header bg-success text-white"> <h3>Relatório Salvo com Sucesso</h3>
        </div>
        <div class="card-body text-center">
          <div class="mb-4">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 5rem;"></i>
            <h4 class="mt-3">Relatório de Turno Salvo com Sucesso!</h4>
            <p class="text-muted">O relatório foi registrado e armazenado com segurança.</p>
          </div>

          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Você pode acessar o relatório em diferentes formatos:
          </div>

          <div class="d-flex justify-content-center gap-3 flex-wrap mb-4">
            <button type="button" class="btn btn-primary" onclick="visualizarRelatorio()">
              <i class="bi bi-file-text me-2"></i> Visualizar Texto
            </button>
            <button type="button" class="btn btn-danger" onclick="gerarPDF()">
              <i class="bi bi-file-pdf me-2"></i> Gerar PDF
            </button>
            <button type="button" class="btn btn-success" onclick="exportarCSV()">
              <i class="bi bi-file-spreadsheet me-2"></i> Exportar CSV
            </button>
            <button type="button" class="btn btn-info" onclick="formatarWhatsApp()">
              <i class="bi bi-whatsapp me-2"></i> Formato WhatsApp
            </button>
          </div>

          <button type="button" class="btn btn-secondary" onclick="novoRelatorio()">
            <i class="bi bi-plus-circle me-2"></i> Criar Novo Relatório
          </button>
        </div>
      </div>
    </div>

    <div id="stepRelatorio" class="content-step" style="display: none;">
      <div class="card">
        <div class="card-header">
          <h3>Relatório de Turno</h3>
        </div>
        <div class="card-body">
          <div class="mb-4">
            <pre id="relatorioTexto" class="relatorio-text"></pre>
          </div>

          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-secondary" onclick="voltarParaSucesso()" id="btnVoltarRelatorio">
              <i class="bi bi-arrow-left me-2"></i> Voltar
            </button>
            <button type="button" class="btn btn-primary" onclick="copiarRelatorio()">
              <i class="bi bi-clipboard me-2"></i> Copiar Relatório
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="stepWhatsApp" class="content-step" style="display: none;">
      <div class="card">
        <div class="card-header bg-info text-white"> <h3><i class="bi bi-whatsapp me-2"></i> Relatório Formato WhatsApp</h3>
        </div>
        <div class="card-body">
          <div class="alert alert-info mb-4">
            <i class="bi bi-info-circle me-2"></i>
            Este formato inclui emojis e formatações compatíveis com o WhatsApp.
            Copie o texto abaixo e cole diretamente no WhatsApp.
          </div>

          <div class="mb-4">
            <pre id="whatsAppTexto" class="relatorio-text whatsapp-message"></pre>
          </div>

          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-secondary" onclick="voltarDoWhatsApp()" id="btnVoltarWhatsApp">
              <i class="bi bi-arrow-left me-2"></i> Voltar
            </button>
            <button type="button" class="btn btn-info" onclick="copiarWhatsApp()">
              <i class="bi bi-clipboard me-2"></i> Copiar para WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="stepPesquisa" class="content-step" style="display: none;">
      <div class="card">
        <div class="card-header">
          <h3><i class="bi bi-search me-2"></i> Pesquisar Relatórios</h3>
        </div>
        <div class="card-body">
          <div class="alert-section mb-4">
            <i class="bi bi-info-circle me-2"></i>
            Pesquise relatórios anteriores por diferentes critérios.
          </div>

          <form id="formPesquisa" class="mb-4">
            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="tipoPesquisa" class="form-label">Tipo de pesquisa</label>
                <select class="form-select" id="tipoPesquisa" onchange="ajustarCampoPesquisa()">
                  <option value="geral">Pesquisa Geral</option>
                  <option value="data">Por Data</option>
                  <option value="mes_ano">Por Mês/Ano</option>
                  <option value="supervisor">Por Supervisor</option>
                  <option value="letra">Por Letra do Turno</option>
                </select>
              </div>
              <div class="col-md-6">
                <label for="termoPesquisa" class="form-label" id="labelPesquisa">Termo de pesquisa</label>
                <input type="text" class="form-control" id="termoPesquisa">
              </div>
            </div>

            <div class="d-flex justify-content-end">
              <button type="button" class="btn btn-secondary me-2" onclick="voltarDaPesquisa()">
                <i class="bi bi-arrow-left me-2"></i> Voltar
              </button>
              <button type="button" class="btn btn-primary" onclick="executarPesquisa()">
                <i class="bi bi-search me-2"></i> Pesquisar
              </button>
            </div>
          </form>

          <div id="resultadosPesquisa" style="display: none;">
            <h4 class="mb-3">Resultados da Pesquisa</h4>
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Letra</th>
                    <th>Supervisor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody id="tabelaResultados">
                  </tbody>
              </table>
            </div>

            <div class="alert alert-info text-center" id="semResultados" style="display: none;"> <i class="bi bi-info-circle me-2"></i>
              Nenhum resultado encontrado para sua pesquisa.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="dashboard" class="content-step" style="display: none;">
      <div class="card">
        <div class="card-header">
          <h3><i class="bi bi-graph-up me-2"></i> Dashboard de Relatórios</h3> </div>
        <div class="card-body">
          <div class="alert alert-info mb-4">
            <i class="bi bi-info-circle me-2"></i>
            Visualize estatísticas e tendências dos relatórios de turno.
          </div>

          <div id="estatisticasGerais" class="mb-4">
            </div>

          <div class="row mb-4">
            <div class="col-md-6 mb-4 mb-md-0">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title text-center mb-3">Utilização de Equipamentos</h5> <canvas id="graficoEquipamentos" width="400" height="300"></canvas>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card">
                <div class="card-body">
                   <h5 class="card-title text-center mb-3">Áreas Atendidas</h5> <canvas id="graficoAreas" width="400" height="300"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Últimos Relatórios</h5>
            </div>
            <div class="card-body">
              <div id="ultimosRelatorios">
                <div class="alert alert-secondary text-center">Nenhum relatório recente encontrado.</div> </div>
            </div>
          </div>
           <div class="d-flex justify-content-end mt-4"> <button type="button" class="btn btn-secondary" onclick="voltarDoDashboard()">
                   <i class="bi bi-arrow-left me-2"></i> Voltar
               </button>
           </div>
        </div>
      </div>
    </div>

    <footer class="text-center mt-4 mb-2 text-muted">
      <hr class="my-3">
      <p class="mb-0">
        <i class="bi bi-code-slash me-1"></i>
        <strong>Desenvolvido por Warlison Abreu</strong>
        <span class="mx-1">•</span>
        <small>v3.0</small>
      </p>
    </footer>
  </div>

  <div class="modal fade" id="modalEquipe" tabindex="-1" aria-labelledby="modalEquipeLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header" id="modalEquipeHeader">
          <h5 class="modal-title" id="modalEquipeLabel">Adicionar/Editar Equipe</h5> <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <form id="formEquipe" class="needs-validation" novalidate>
            <input type="hidden" id="equipeTipo">
            <input type="hidden" id="equipeIndex" value="-1">

            <h6 class="mb-3 text-primary">Informações da Equipe</h6>
            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="equipeNumero" class="form-label">Número Da Equipe *</label>
                <select class="form-select" id="equipeNumero" required>
                  <option value="" selected disabled>Selecione o número</option>
                  </select>
                <div class="invalid-feedback">Por favor, selecione o número da equipe.</div>
              </div>
              <div class="col-md-6">
                <label for="equipeIntegrantes" class="form-label">Nomes dos integrantes *</label>
                <input type="text" class="form-control" id="equipeIntegrantes" required placeholder="Separados por vírgula"> <div class="invalid-feedback">Por favor, informe os nomes dos integrantes.</div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="equipeArea" class="form-label">Área de atendimento *</label>
                <input type="text" class="form-control" id="equipeArea" required>
                <div class="invalid-feedback">Por favor, informe a área de atendimento.</div>
              </div>
              <div class="col-md-6">
                <label for="equipeAtividade" class="form-label">Atividade Realizada *</label>
                <input type="text" class="form-control" id="equipeAtividade" required>
                <div class="invalid-feedback">Por favor, informe a atividade realizada.</div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="equipeVaga" class="form-label">Vaga *</label>
                <select class="form-select" id="equipeVaga" required onchange="toggleVagaPersonalizada()">
                  <option value="" selected disabled>Selecione a vaga</option>
                  <option value="Outra">Outra (Especificar)</option> </select>
                <div class="invalid-feedback">Por favor, selecione a vaga.</div>
              </div>
              <div class="col-md-6" id="vagaPersonalizadaContainer" style="display: none;">
                <label for="equipeVagaPersonalizada" class="form-label">Especifique a vaga *</label>
                <input type="text" class="form-control" id="equipeVagaPersonalizada">
                <div class="invalid-feedback">Por favor, informe a vaga personalizada.</div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="equipeEquipamento" class="form-label">Equipamento Utilizado *</label>
                <select class="form-select" id="equipeEquipamento" required onchange="toggleEquipamentoPersonalizado()">
                  <option value="" selected disabled>Selecione o equipamento</option>
                  <option value="Outro">Outro (Especificar)</option> </select>
                <div class="invalid-feedback">Por favor, selecione o equipamento utilizado.</div>
              </div>
              <div class="col-md-6" id="equipamentoPersonalizadoContainer" style="display: none;">
                <label for="equipeEquipamentoPersonalizado" class="form-label">Especifique o equipamento *</label>
                <input type="text" class="form-control" id="equipeEquipamentoPersonalizado">
                <div class="invalid-feedback">Por favor, informe o equipamento personalizado.</div>
              </div>
            </div>
            <hr>

            <h6 class="mb-3 text-primary">Troca de Equipamento</h6>
            <div class="mb-3">
              <label class="form-label">Houve trocas de equipamentos? *</label>
              <div class="form-check form-check-inline"> <input class="form-check-input" type="radio" name="equipeTroca" id="equipeTrocaSim" value="Sim" onchange="toggleTrocaEquipamento()">
                <label class="form-check-label" for="equipeTrocaSim">Sim</label>
              </div>
              <div class="form-check form-check-inline"> <input class="form-check-input" type="radio" name="equipeTroca" id="equipeTrocaNao" value="Não" checked onchange="toggleTrocaEquipamento()">
                <label class="form-check-label" for="equipeTrocaNao">Não</label>
              </div>
            </div>

            <div id="trocaDetalhes" style="display: none;">
              <div class="mb-3">
                <label class="form-label">Motivo da troca *</label> <div class="form-check">
                  <input class="form-check-input" type="radio" name="equipeMotivoTroca" id="motivoCliente" value="Solicitação Do Cliente" onchange="toggleMotivoOutro()">
                  <label class="form-check-label" for="motivoCliente">Solicitação Do Cliente</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="equipeMotivoTroca" id="motivoDefeito" value="Defeitos Em Geral (Justificar)" onchange="toggleMotivoOutro()">
                  <label class="form-check-label" for="motivoDefeito">Defeitos Em Geral</label> </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="equipeMotivoTroca" id="motivoOutro" value="Outros Motivos (Justificar)" onchange="toggleMotivoOutro()">
                  <label class="form-check-label" for="motivoOutro">Outros Motivos</label> </div>
                 <input type="radio" class="btn-check" name="equipeMotivoTroca" id="motivoNenhum" value="" checked autocomplete="off"> <div class="invalid-feedback d-block" id="motivoTrocaFeedback" style="display: none;">Por favor, selecione o motivo da troca.</div> </div>

              <div class="mb-3" id="motivoOutroContainer" style="display: none;">
                <label for="equipeMotivoOutro" class="form-label">Especifique o motivo *</label>
                <input type="text" class="form-control" id="equipeMotivoOutro">
                 <div class="invalid-feedback">Por favor, especifique o motivo da troca.</div>
              </div>

              <div class="mb-3">
                <label for="equipeDefeito" class="form-label">Especifique o Defeito e as Medidas Tomadas *</label> <textarea class="form-control" id="equipeDefeito" rows="3"></textarea>
                 <div class="invalid-feedback">Por favor, detalhe o defeito e as medidas tomadas.</div>
              </div>

              <div class="row mb-3">
                 <div class="col-md-6 mb-3 mb-md-0"> <label for="equipeDataHoraTroca" class="form-label">Data/Hora da troca *</label> <input type="datetime-local" class="form-control" id="equipeDataHoraTroca"> <div class="invalid-feedback">Por favor, informe a data e hora da troca.</div>
                </div>
                <div class="col-md-6">
                  <label for="equipePlacaNova" class="form-label">Placa do novo equipamento *</label> <input type="text" class="form-control" id="equipePlacaNova">
                   <div class="invalid-feedback">Por favor, informe a placa do novo equipamento.</div>
                </div>
              </div>
            </div>
            <hr>

            <h6 class="mb-3 text-primary">Materiais Utilizados e Segurança</h6>
            <div id="materiaisAltaPressao">
              <h5 class="mb-3">Alta Pressão</h5>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Pistola</label>
                  <select class="form-select" id="equipePistola">
                     <option value="N/A" selected>N/A</option> <option value="Sim">Sim</option>
                     <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Pistola - Cano Longo</label>
                  <select class="form-select" id="equipePistolaCanoLongo">
                     <option value="N/A" selected>N/A</option>
                     <option value="Sim">Sim</option>
                     <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Mangueira Torpedo/Torpedo</label>
                  <select class="form-select" id="equipeMangueiraTorpedo">
                     <option value="N/A" selected>N/A</option>
                     <option value="Sim">Sim</option>
                     <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Pedal</label>
                  <select class="form-select" id="equipePedal">
                    <option value="N/A" selected>N/A</option>
                    <option value="Sim">Sim</option>
                    <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Varetas</label>
                  <select class="form-select" id="equipeVaretas">
                     <option value="N/A" selected>N/A</option>
                     <option value="Sim">Sim</option>
                     <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Rabicho</label>
                  <select class="form-select" id="equipeRabicho">
                     <option value="N/A" selected>N/A</option>
                     <option value="Sim">Sim</option>
                     <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
              </div>

              <div class="row mb-3">
                 <div class="col-md-6 mb-3 mb-md-0">
                   <label for="equipeLancesMangueira" class="form-label">Lances De Mangueira</label>
                   <select class="form-select" id="equipeLancesMangueira">
                     <option value="N/A" selected>N/A</option>
                     </select>
                 </div>
                 <div class="col-md-6">
                   <label for="equipeLancesVaretas" class="form-label">Lances de Varetas</label>
                   <select class="form-select" id="equipeLancesVaretas">
                     <option value="N/A" selected>N/A</option>
                     </select>
                 </div>
               </div>
            </div>

            <div id="materiaisVacuo" style="display: none;">
               <h5 class="mb-3">Vácuo / Hiper Vácuo</h5>
              <div class="row mb-3">
                <div class="col-md-6 mb-3 mb-md-0">
                  <label class="form-label">Mangotes</label>
                  <select class="form-select" id="equipeMangotes">
                     <option value="N/A" selected>N/A</option>
                     <option value="Sim">Sim</option>
                     <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Reduções</label>
                  <select class="form-select" id="equipeReducoes">
                    <option value="N/A" selected>N/A</option>
                    <option value="Sim">Sim</option>
                    <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
              </div>

               <h6 class="mb-3">Quantidades de Mangotes</h6>
              <div class="row mb-3">
                <div class="col-md-4 mb-3 mb-md-0">
                  <label for="equipeMangotes3Polegadas" class="form-label">3 Polegadas</label>
                  <select class="form-select" id="equipeMangotes3Polegadas">
                    <option value="N/A" selected>N/A</option>
                    </select>
                </div>
                <div class="col-md-4 mb-3 mb-md-0">
                  <label for="equipeMangotes4Polegadas" class="form-label">4 Polegadas</label>
                  <select class="form-select" id="equipeMangotes4Polegadas">
                    <option value="N/A" selected>N/A</option>
                    </select>
                </div>
                <div class="col-md-4">
                  <label for="equipeMangotes6Polegadas" class="form-label">6 Polegadas</label>
                  <select class="form-select" id="equipeMangotes6Polegadas">
                    <option value="N/A" selected>N/A</option>
                    </select>
                </div>
              </div>
            </div>

             <div class="mb-3">
              <label for="equipeJustificativa" class="form-label">Justificativa (Implementos em Falta)</label>
              <textarea class="form-control" id="equipeJustificativa" rows="2" placeholder="Justificar apenas se algum material estiver 'Em Falta'"></textarea>
            </div>
            <hr>

             <h5 class="mb-3">Segurança (Bloqueio)</h5>
            <div class="mb-3">
              <label class="form-label">Utilizou caixa de bloqueio? *</label>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="equipeCaixaBloqueio" id="caixaBloqueioSim" value="Sim">
                <label class="form-check-label" for="caixaBloqueioSim">Sim</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="equipeCaixaBloqueio" id="caixaBloqueioNao" value="Não" checked>
                <label class="form-check-label" for="caixaBloqueioNao">Não</label>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6 mb-3 mb-md-0">
                <label for="equipeCadeados" class="form-label">Quantidade de Cadeados</label>
                <select class="form-select" id="equipeCadeados">
                  <option value="N/A" selected>N/A</option>
                   <option value="0">0</option> </select>
              </div>
              <div class="col-md-6">
                <label for="equipePlaquetas" class="form-label">Quantidade de Plaquetas</label>
                <select class="form-select" id="equipePlaquetas">
                  <option value="N/A" selected>N/A</option>
                   <option value="0">0</option> </select>
              </div>
            </div>
            <hr>

            <div class="mb-3">
              <label for="equipeObservacoes" class="form-label">Observações adicionais</label>
              <textarea class="form-control" id="equipeObservacoes" rows="3" placeholder="Qualquer outra informação relevante sobre a equipe ou atividade"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary" onclick="salvarEquipe()">Salvar Equipe</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalHelp" tabindex="-1" aria-labelledby="modalHelpLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable"> <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modalHelpLabel"><i class="bi bi-question-circle me-2"></i>Ajuda do Sistema</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <h5>Como utilizar o Sistema de Relatório de Turno</h5>
          <p>Este sistema foi desenvolvido para facilitar o registro das informações de turno e das atividades das equipes, permitindo gerar relatórios padronizados e consultar dados históricos.</p>

          <h6 class="mt-4">Navegação Principal</h6>
           <ul class="list-unstyled">
             <li><i class="bi bi-clipboard-check me-2"></i><strong>Novo Relatório:</strong> A tela inicial para criar um novo relatório (Etapa 1).</li>
             <li><i class="bi bi-graph-up me-2"></i><strong>Dashboard:</strong> Visualiza estatísticas e gráficos sobre os relatórios.</li>
             <li><i class="bi bi-search me-2"></i><strong>Pesquisar:</strong> Busca relatórios antigos por diversos filtros.</li>
             <li><i class="bi bi-question-circle me-2"></i><strong>Ajuda:</strong> Exibe esta janela.</li>
           </ul>


          <h6 class="mt-4">Etapa 1: Informações do Turno</h6>
          <p>Preencha os dados básicos do turno: Data, Horário (selecione na lista), Letra do Turno (A, B, C, D, etc.) e o Supervisor responsável (selecione na lista).</p>
          <p>Todos os campos são obrigatórios. Clique em "Próximo" para continuar.</p>

          <h6 class="mt-3">Etapa 2: Equipes</h6>
          <p>Clique nos botões "Adicionar Equipe Alta Pressão" ou "Adicionar Equipe Vácuo/Hiper Vácuo" para abrir o formulário da equipe.</p>
          <p>Preencha todos os detalhes solicitados no formulário (modal) para cada equipe que trabalhou no turno. Campos com * são obrigatórios.</p>
          <ul>
             <li><strong>Informações Básicas:</strong> Número da equipe, nomes dos integrantes, área atendida e atividade principal.</li>
             <li><strong>Vaga e Equipamento:</strong> Selecione a vaga e o equipamento principal utilizado. Se não estiver na lista, selecione "Outra" e especifique.</li>
             <li><strong>Troca de Equipamento:</strong> Marque "Sim" se houve troca. Preencha o motivo, detalhes do defeito/medidas, data/hora e placa do novo equipamento.</li>
             <li><strong>Materiais:</strong> Indique se os materiais listados foram utilizados ("Sim"), não aplicáveis ("N/A") ou estavam indisponíveis ("Em Falta"). Para materiais "Em Falta", justifique no campo específico. Indique as quantidades de lances/mangotes.</li>
             <li><strong>Segurança:</strong> Indique se a caixa de bloqueio foi usada e a quantidade de cadeados/plaquetas.</li>
             <li><strong>Observações:</strong> Adicione qualquer informação extra relevante.</li>
          </ul>
           <p>Após preencher, clique em "Salvar Equipe". A equipe aparecerá na lista. Você pode adicionar múltiplas equipes. Adicione pelo menos uma equipe para poder avançar.</p>
           <p>Clique em "Revisar e Finalizar" quando todas as equipes tiverem sido adicionadas.</p>


          <h6 class="mt-3">Etapa 3: Revisão e Finalização</h6>
          <p>Confira cuidadosamente todas as informações do turno e das equipes listadas. Se precisar corrigir algo, use o botão "Voltar para Equipes" para editar ou adicionar/remover equipes.</p>
          <p><strong>Atenção:</strong> Após clicar em "Salvar Relatório", ele não poderá mais ser editado.</p>
          <p>Quando tudo estiver correto, clique em "Salvar Relatório".</p>

           <h6 class="mt-3">Tela de Sucesso e Ações</h6>
           <p>Após salvar, você verá uma mensagem de confirmação e terá as seguintes opções:</p>
          <ul>
            <li><i class="bi bi-file-text me-2"></i> <strong>Visualizar Texto:</strong> Mostra o relatório completo em formato de texto simples. Permite copiar o texto.</li>
            <li><i class="bi bi-file-pdf me-2"></i> <strong>Gerar PDF:</strong> Cria um arquivo PDF do relatório para download ou impressão.</li>
            <li><i class="bi bi-file-spreadsheet me-2"></i> <strong>Exportar CSV:</strong> Gera um arquivo CSV (compatível com planilhas como Excel) com os dados do relatório.</li>
            <li><i class="bi bi-whatsapp me-2"></i> <strong>Formato WhatsApp:</strong> Exibe o relatório formatado com emojis e marcações ideais para colar no WhatsApp. Permite copiar o texto.</li>
            <li><i class="bi bi-plus-circle me-2"></i> <strong>Criar Novo Relatório:</strong> Retorna à Etapa 1 para iniciar um novo registro.</li>
          </ul>

          <h6 class="mt-3">Pesquisa de Relatórios</h6>
          <p>Acesse pelo botão <i class="bi bi-search"></i> no cabeçalho. Permite encontrar relatórios salvos anteriormente.</p>
          <ul>
             <li>Selecione o <strong>Tipo de pesquisa</strong> (Geral, Data, Mês/Ano, Supervisor, Letra).</li>
             <li>Digite o <strong>Termo de pesquisa</strong> (ou selecione a data/mês).</li>
             <li>Clique em "Pesquisar". Os resultados aparecerão em uma tabela.</li>
             <li>Você pode clicar nos botões de ação (<i class="bi bi-eye"></i>, <i class="bi bi-file-pdf"></i>, <i class="bi bi-whatsapp"></i>) para visualizar ou exportar o relatório encontrado.</li>
          </ul>

          <h6 class="mt-3">Dashboard</h6>
           <p>Acesse pelo botão <i class="bi bi-graph-up"></i> no cabeçalho. Apresenta:</p>
           <ul>
             <li>Resumo de estatísticas (total de relatórios, etc.).</li>
             <li>Gráficos sobre uso de equipamentos e áreas mais atendidas.</li>
             <li>Lista dos últimos relatórios registrados para acesso rápido.</li>
           </ul>

          <div class="alert alert-warning mt-4"> <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Importante:</strong> Certifique-se de que todos os campos marcados com * são preenchidos corretamente para evitar erros ao salvar.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendi</button>
        </div>
      </div>
    </div>
  </div>

  <div class="loading" style="display: none;">
     <div class="loading-content"> <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
         <span class="visually-hidden">Carregando...</span> </div>
      <div class="loading-text mt-3">Processando, aguarde...</div>
     </div>
  </div>

  <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100"> <div id="toastNotificacao" class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true"> <div class="d-flex">
               <div class="toast-body">
                   <i class="bi bi-check-circle-fill me-2"></i> <span id="toastTexto"></span> </div>
               <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
           </div>
       </div>
   </div>


  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

  <script src="js/config.js"></script>
  <script src="js/core/state.js"></script>
  <script src="js/core/cache-manager.js"></script>
  <script src="js/core/performance-monitor.js"></script>
  <script src="js/core/security.js"></script>
  <script src="js/core/module-loader.js"></script> <script src="js/ui/theme-manager.js"></script>
  <script src="js/ui/responsive-enhancements.js"></script>
  <script src="js/features/notifications.js"></script> <script src="js/features/dashboard.js"></script> <script src="js/auth/google-auth.js"></script> <script src="js/api.js"></script>
  <script src="js/app.js"></script>

  <script src="js/main.js"></script> </body>
</html>
