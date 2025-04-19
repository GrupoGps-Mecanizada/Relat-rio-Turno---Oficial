/**
 * Funções para comunicação com a API
 */

/**
 * Faz uma requisição para a API (Versão Atualizada com Timeout e Melhor Error Handling)
 * @param {String} action - Ação a ser executada no servidor
 * @param {Object} params - Parâmetros adicionais
 * @returns {Promise<Object>} - Promise com o resultado da requisição (objeto com 'success' e 'message' ou dados)
 */
async function callAPI(action, params = {}) {
  // Garantir que a URL base está configurada
  if (!window.CONFIG || !CONFIG.API_URL) {
      console.error("CONFIG.API_URL não está definida!");
      mostrarNotificacao("Erro de configuração: URL da API não definida.", "danger");
      return { success: false, message: "Erro de configuração interna." };
  }

  let timeoutId = null; // Definir fora do try para ser acessível no finally
  const controller = new AbortController(); // Definir fora do try

  try {
    mostrarLoading('Comunicando com servidor...');

    // Construir URL com parâmetros
    let url = new URL(CONFIG.API_URL);
    url.searchParams.append('action', action);

    // Adicionar outros parâmetros
    for (const key in params) {
        // Pular propriedades herdadas
        if (!Object.hasOwnProperty.call(params, key)) continue;

        // Para objetos/arrays complexos, converter para JSON
        if (typeof params[key] === 'object' && params[key] !== null) {
            try {
                url.searchParams.append(key, JSON.stringify(params[key]));
            } catch (e) {
                console.error(`Erro ao converter parâmetro '${key}' para JSON:`, params[key], e);
                // Opcional: Pular este parâmetro ou lançar erro
            }
        } else if (params[key] !== undefined && params[key] !== null) { // Evitar "undefined" ou "null" como string
            url.searchParams.append(key, params[key]);
        }
    }

    console.log('Chamando API:', url.toString()); // Log para debug

    // Fazer a requisição com timeout
    timeoutId = setTimeout(() => {
        console.warn(`API Call (${action}) aborted due to timeout.`);
        controller.abort();
    }, 30000); // 30 segundos de timeout

    const response = await fetch(url, {
      method: 'GET', // API parece usar GET para tudo, passando dados via URL
      headers: {
        // Content-Type não é relevante para GET sem corpo, mas Accept é útil
        'Accept': 'application/json'
        // 'Content-Type': 'application/json', // Não necessário para GET
      },
      redirect: 'follow', // Seguir redirecionamentos
      mode: 'cors',       // Esperado para APIs em domínios diferentes
      signal: controller.signal // Associar o AbortController
    });

    clearTimeout(timeoutId); // Limpar o timeout se a resposta chegar a tempo
    timeoutId = null; // Resetar ID

    if (!response.ok) {
        // Tentar ler corpo do erro, se houver
        let errorBody = await response.text();
        console.error(`Erro HTTP ${response.status} - ${response.statusText}. Body: ${errorBody}`);
        throw new Error(`Erro do servidor: ${response.status} - ${response.statusText}`);
    }

    // Tentar parsear JSON
    let data;
    try {
        data = await response.json();
    } catch (e) {
        console.error("Erro ao parsear JSON da API:", e);
        throw new Error("Resposta inválida do servidor.");
    }

    ocultarLoading(); // Ocultar loading apenas em sucesso total
    return data; // Retorna os dados parseados (espera-se { success: true, ... } ou { success: false, ... })

  } catch (error) {
    // Limpar timeout se ainda estiver ativo (ex: erro antes do fetch ou durante)
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    ocultarLoading(); // Garantir que o loading seja ocultado em caso de erro
    console.error(`Erro na chamada da API (${action}):`, error);

    // Melhorar mensagem de erro retornada
    let mensagemErro = error.message; // Mensagem padrão

    if (error.name === 'AbortError') {
      mensagemErro = 'Tempo limite excedido ao comunicar com o servidor (30s). Verifique sua conexão ou tente novamente.';
    } else if (error.message.includes('Failed to fetch')) {
      // Isso pode ser CORS, DNS, rede offline, etc.
      mensagemErro = 'Erro de comunicação. Verifique sua conexão com a internet ou se o servidor está acessível.';
      // Adicionar dica sobre CORS para desenvolvedores
       console.warn("Dica: Erro 'Failed to fetch' pode ser causado por problemas de CORS no servidor.");
    } else if (error.message.includes('servidor') || error.message.includes('invalid')) {
         // Usa a mensagem já tratada (Erro do servidor, Resposta inválida)
         mensagemErro = error.message;
    } else {
        // Erro genérico
        mensagemErro = "Ocorreu um erro inesperado na comunicação com o servidor.";
    }

    // Retornar objeto de erro padronizado
    return {
      success: false,
      message: mensagemErro
    };
  }
}


/**
 * Obter dados para formulário
 */
async function obterDadosFormularioAPI() {
  try {
    const resultado = await callAPI('obterDadosFormulario');
    // Verificar se a chamada à API foi bem-sucedida internamente
    if (resultado && resultado.success) {
        return resultado; // Retorna o objeto completo { success: true, ...dados }
    } else {
        // Se success for false ou resultado for inválido, logar e usar fallback
        console.warn('Falha ao obter dados do formulário da API, usando fallback:', resultado?.message);
        mostrarNotificacao('Falha ao carregar opções do servidor, usando padrões.', 'warning');
        // Retornar dados padrão em caso de erro da API ou falha na chamada
        return { success: true, ...CONFIG.OPCOES_FORMULARIO }; // Simula sucesso com dados padrão
    }
  } catch (error) {
    // Este catch agora pegaria apenas erros inesperados DENTRO desta função, não da callAPI
    console.error('Erro inesperado em obterDadosFormularioAPI:', error);
    mostrarNotificacao('Erro crítico ao carregar opções do formulário.', 'danger');
    return { success: true, ...CONFIG.OPCOES_FORMULARIO }; // Simula sucesso com dados padrão
  }
}

/**
 * Salvar turno na API
 */
async function salvarTurnoAPI(dadosTurno, equipes) {
  // Não precisa de try...catch aqui, pois callAPI já trata e retorna { success: false, ... }
  // A função mostrarLoading/ocultarLoading já está dentro de callAPI
  const resultado = await callAPI('salvarTurno', {
    dadosTurno: dadosTurno,
    equipes: equipes
  });

  // Log adicional se falhar
  if (!resultado.success) {
      console.error('Falha ao salvar turno via API:', resultado.message);
      // A notificação de erro será mostrada pela função que chamou salvarTurnoAPI
  }

  return resultado; // Retorna diretamente o resultado de callAPI
}

/**
 * Obter dados de um relatório
 */
async function obterDadosRelatorioAPI(turnoId) {
  // Não precisa de try...catch
  const resultado = await callAPI('obterDadosRelatorio', { turnoId });
  if (!resultado.success) {
      console.error(`Falha ao obter dados do relatório ${turnoId}:`, resultado.message);
  }
  return resultado;
}

/**
 * Gerar relatório em texto
 */
async function gerarRelatorioTextoAPI(turnoId) {
  // Não precisa de try...catch
  const resultado = await callAPI('gerarRelatorioTexto', { turnoId });
   if (!resultado.success) {
      console.error(`Falha ao gerar texto do relatório ${turnoId}:`, resultado.message);
  }
  return resultado;
}

/**
 * Formatar relatório para WhatsApp
 */
async function formatarWhatsAppAPI(turnoId) {
  // Não precisa de try...catch
  const resultado = await callAPI('formatarWhatsApp', { turnoId });
   if (!resultado.success) {
      console.error(`Falha ao formatar WhatsApp para relatório ${turnoId}:`, resultado.message);
  }
  return resultado;
}

/**
 * Pesquisar relatórios
 */
async function pesquisarRelatoriosAPI(termo, tipo) {
  // Não precisa de try...catch
  const resultado = await callAPI('pesquisarRelatorios', {
    termo: termo,
    tipo: tipo
  });
   if (!resultado.success) {
      console.error(`Falha ao pesquisar relatórios (Termo: ${termo}, Tipo: ${tipo}):`, resultado.message);
  }
  return resultado;
}

/**
 * Obter estatísticas para o dashboard
 */
async function obterEstatisticasAPI() {
  // Não precisa de try...catch
  const resultado = await callAPI('obterEstatisticas');
   if (!resultado.success) {
      console.error(`Falha ao obter estatísticas:`, resultado.message);
  }
  return resultado;
}


// ===============================================
// Funções de Geração no Cliente (PDF, CSV)
// ===============================================

/**
 * Gerar PDF do relatório (geração no cliente)
 * Assume que 'dadosTurno' e 'equipes' são passados ou obtidos de outra forma.
 * A função original usava o texto já formatado, esta é uma alternativa se tiver os dados brutos.
 */
async function gerarPDF(dadosTurno = null, equipes = null, relatorioId = null) {
    mostrarLoading('Gerando PDF...');
    try {
        // Se não receber dados, tenta buscar pelo ID
        if (!dadosTurno || !equipes) {
            if (!relatorioId && window.ultimoRelatorioId) {
                relatorioId = window.ultimoRelatorioId;
            }
            if (!relatorioId) {
                throw new Error('Dados ou ID do relatório não fornecidos para gerar PDF.');
            }
            const dadosApi = await obterDadosRelatorioAPI(relatorioId);
            if (!dadosApi.success) {
                throw new Error('Falha ao obter dados do relatório: ' + dadosApi.message);
            }
            dadosTurno = dadosApi.dadosTurno;
            equipes = dadosApi.equipes;
        }

        if (!dadosTurno || !equipes || equipes.length === 0) {
            throw new Error('Dados incompletos para gerar PDF.');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const margin = 15;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const usableWidth = pageWidth - 2 * margin;
        let y = margin; // Posição Y atual

        // Função para adicionar texto e avançar Y, adicionando nova página se necessário
        const addText = (text, size, style, indent = 0, spaceAfter = 2) => {
            if (y + size / 2 > pageHeight - margin) { // Estima altura da linha
                pdf.addPage();
                y = margin;
            }
            pdf.setFontSize(size);
            pdf.setFont('helvetica', style); // Usar helvetica (padrão jsPDF)
            // Quebrar texto longo
            const lines = pdf.splitTextToSize(String(text), usableWidth - indent);
            pdf.text(lines, margin + indent, y);
            y += (lines.length * size * 0.35) + spaceAfter; // Ajustar multiplicador conforme necessário
        };

         // Cabeçalho do Relatório
         addText('Relatório de Turno', 16, 'bold', 0, 6);

         // Informações do Turno
         addText('Informações do Turno', 12, 'bold', 0, 4);
         addText(`Data: ${formatarData(dadosTurno.data)}`, 10, 'normal', 5, 2);
         addText(`Horário: ${dadosTurno.horario}`, 10, 'normal', 5, 2);
         addText(`Letra: ${dadosTurno.letra}`, 10, 'normal', 5, 2);
         addText(`Supervisor: ${dadosTurno.supervisor}`, 10, 'normal', 5, 6);

         // Equipes
         addText('Equipes', 12, 'bold', 0, 4);

         equipes.forEach((equipe, index) => {
            addText(`Equipe ${index + 1}: ${equipe.tipo} - Nº ${equipe.numero}`, 11, 'bold', 5, 3);
            addText(`Integrantes: ${equipe.integrantes}`, 10, 'normal', 10, 1);
            addText(`Área: ${equipe.area}`, 10, 'normal', 10, 1);
            addText(`Atividade: ${equipe.atividade}`, 10, 'normal', 10, 1);
            let vagaDisplay = equipe.vaga === 'OUTRA VAGA' ? equipe.vagaPersonalizada : equipe.vaga;
            addText(`Vaga: ${vagaDisplay || 'N/A'}`, 10, 'normal', 10, 1);
            let equipDisplay = equipe.equipamento === 'OUTRO EQUIPAMENTO' ? equipe.equipamentoPersonalizado : equipe.equipamento;
            addText(`Equipamento: ${equipDisplay || 'N/A'}`, 10, 'normal', 10, 1);
            addText(`Troca Equip.: ${equipe.trocaEquipamento}`, 10, 'normal', 10, 1);

             if (equipe.trocaEquipamento === 'Sim') {
                let motivoText = equipe.motivoTroca;
                if (equipe.motivoTroca === 'Outros Motivos (Justificar)' && equipe.motivoOutro) {
                    motivoText = equipe.motivoOutro;
                }
                addText(`-> Motivo Troca: ${motivoText || 'Não especificado'}`, 9, 'italic', 15, 1);
                if (equipe.defeito) addText(`-> Defeito/Medidas: ${equipe.defeito}`, 9, 'italic', 15, 1);
                if (equipe.placaNova) addText(`-> Nova Placa: ${equipe.placaNova}`, 9, 'italic', 15, 1);
                if (equipe.dataHoraTroca) addText(`-> Data/Hora Troca: ${formatarDataHora(equipe.dataHoraTroca)}`, 9, 'italic', 15, 1);
            }

             addText(`Caixa Bloqueio: ${equipe.caixaBloqueio} | Cadeados: ${equipe.cadeados} | Plaquetas: ${equipe.plaquetas}`, 10, 'normal', 10, 1);

             // Adicionar materiais específicos (simplificado)
             if(equipe.tipo === 'Alta Pressão' && equipe.materiais) {
                 addText(`Materiais AP: Pistola(${equipe.materiais.pistola}), Pedal(${equipe.materiais.pedal}), L.Mang(${equipe.lancesMangueira}), L.Var(${equipe.lancesVaretas})`, 9, 'normal', 10, 1);
             } else if (equipe.tipo !== 'Alta Pressão' && equipe.materiaisVacuo) {
                  addText(`Materiais Vácuo: Mangotes(${equipe.materiaisVacuo.mangotes}), M3"(${equipe.mangotes3Polegadas}), M4"(${equipe.mangotes4Polegadas}), M6"(${equipe.mangotes6Polegadas})`, 9, 'normal', 10, 1);
             }

             if (equipe.justificativa) addText(`Justificativa Materiais: ${equipe.justificativa}`, 9, 'italic', 10, 1);
             if (equipe.observacoes) addText(`Observações: ${equipe.observacoes}`, 9, 'italic', 10, 1);

             y += 4; // Espaço extra entre equipes
         });

        // Salvar o PDF
        const fileName = `Relatorio_Turno_${dadosTurno.data}_${dadosTurno.letra}.pdf`;
        pdf.save(fileName);

        mostrarNotificacao('PDF gerado com sucesso!');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        mostrarNotificacao('Erro ao gerar PDF: ' + error.message, 'danger');
    } finally {
         ocultarLoading();
    }
}


/**
 * Exportar relatório como CSV (geração no cliente)
 * Assume que 'dadosTurno' e 'equipes' são passados ou obtidos de outra forma.
 */
async function exportarCSV(dadosTurno = null, equipes = null, relatorioId = null) {
  mostrarLoading('Gerando CSV...');
  try {
    // Se não receber dados, tenta buscar pelo ID
    if (!dadosTurno || !equipes) {
        if (!relatorioId && window.ultimoRelatorioId) {
            relatorioId = window.ultimoRelatorioId;
        }
        if (!relatorioId) {
            throw new Error('Dados ou ID do relatório não fornecidos para gerar CSV.');
        }
        const dadosApi = await obterDadosRelatorioAPI(relatorioId);
        if (!dadosApi.success) {
            throw new Error('Falha ao obter dados do relatório: ' + dadosApi.message);
        }
        dadosTurno = dadosApi.dadosTurno;
        equipes = dadosApi.equipes;
    }

    if (!dadosTurno || !equipes || equipes.length === 0) {
        throw new Error('Dados incompletos para gerar CSV.');
    }

    // Processar os dados para CSV
    // Definir cabeçalhos fixos para consistência
    const cabecalhos = [
        "Data Turno", "Horario Turno", "Letra Turno", "Supervisor Turno",
        "Tipo Equipe", "Numero Equipe", "Integrantes", "Area", "Atividade",
        "Vaga", "Vaga Personalizada", "Equipamento", "Equipamento Personalizado",
        "Troca Equipamento", "Motivo Troca", "Motivo Outro", "Defeito/Medidas", "Placa Nova", "Data/Hora Troca",
        "Material AP Pistola", "Material AP Cano Longo", "Material AP Mang Torpedo", "Material AP Pedal", "Material AP Varetas", "Material AP Rabicho", "Lances Mangueira", "Lances Varetas",
        "Material Vacuo Mangotes", "Material Vacuo Reducoes", "Mangotes 3 Pol", "Mangotes 4 Pol", "Mangotes 6 Pol",
        "Justificativa Materiais", "Caixa Bloqueio", "Cadeados", "Plaquetas", "Observacoes"
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    // Adicionar BOM para UTF-8 no Excel
    // csvContent = "\uFEFF" + csvContent;

    // Função auxiliar para escapar valores CSV
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '""';
        let str = String(value);
        // Se contiver vírgula, aspas ou quebra de linha, colocar entre aspas duplas
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            // Escapar aspas duplas internas duplicando-as
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        }
        // Se não precisar de escape, pode retornar sem aspas (opcional)
        return `"${str}"`; // Retornar sempre com aspas para segurança
    };


    csvContent += cabecalhos.map(h => escapeCSV(h)).join(",") + "\r\n";

    // Adicionar dados de cada equipe
    equipes.forEach(equipe => {
        const linha = [
            dadosTurno.data, dadosTurno.horario, dadosTurno.letra, dadosTurno.supervisor,
            equipe.tipo, equipe.numero, equipe.integrantes, equipe.area, equipe.atividade,
            equipe.vaga, equipe.vagaPersonalizada || '', equipe.equipamento, equipe.equipamentoPersonalizado || '',
            equipe.trocaEquipamento, equipe.motivoTroca || '', equipe.motivoOutro || '', equipe.defeito || '', equipe.placaNova || '', equipe.dataHoraTroca || '',
            equipe.materiais?.pistola || 'N/A', equipe.materiais?.pistolaCanoLongo || 'N/A', equipe.materiais?.mangueiraTorpedo || 'N/A', equipe.materiais?.pedal || 'N/A', equipe.materiais?.varetas || 'N/A', equipe.materiais?.rabicho || 'N/A', equipe.lancesMangueira || 'N/A', equipe.lancesVaretas || 'N/A',
            equipe.materiaisVacuo?.mangotes || 'N/A', equipe.materiaisVacuo?.reducoes || 'N/A', equipe.mangotes3Polegadas || 'N/A', equipe.mangotes4Polegadas || 'N/A', equipe.mangotes6Polegadas || 'N/A',
            equipe.justificativa || '', equipe.caixaBloqueio, equipe.cadeados, equipe.plaquetas, equipe.observacoes || ''
        ];
        csvContent += linha.map(valor => escapeCSV(valor)).join(",") + "\r\n";
    });

    // Criar link de download
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `Relatorio_Turno_${dadosTurno.data}_${dadosTurno.letra}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link); // Necessário para Firefox

    // Clicar no link para iniciar o download
    link.click();
    document.body.removeChild(link); // Limpar o link

    mostrarNotificacao('CSV exportado com sucesso!');

  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    mostrarNotificacao('Erro ao exportar CSV: ' + error.message, 'danger');
  } finally {
    ocultarLoading();
  }
}
