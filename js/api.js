/**
 * Funções para comunicação com a API
 */

/**
 * Faz uma requisição para a API
 * @param {String} action - Ação a ser executada no servidor
 * @param {Object} params - Parâmetros adicionais
 * @returns {Promise} - Promise com o resultado da requisição
 */
async function callAPI(action, params = {}) {
  try {
    mostrarLoading('Comunicando com servidor...');
    
    // Construir URL com parâmetros
    let url = new URL(CONFIG.API_URL);
    url.searchParams.append('action', action);
    
    // Adicionar outros parâmetros
    for (const key in params) {
      // Para objetos complexos, converter para JSON
      if (typeof params[key] === 'object') {
        url.searchParams.append(key, JSON.stringify(params[key]));
      } else {
        url.searchParams.append(key, params[key]);
      }
    }
    
    // Fazer a requisição
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      redirect: 'follow',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    ocultarLoading();
    return data;
  } catch (error) {
    ocultarLoading();
    console.error(`Erro na API (${action}):`, error);
    throw error;
  }
}

/**
 * Obter dados para formulário
 */
async function obterDadosFormularioAPI() {
  try {
    return await callAPI('obterDadosFormulario');
  } catch (error) {
    console.error('Erro ao obter dados do formulário:', error);
    // Retornar dados padrão em caso de erro
    return CONFIG.OPCOES_FORMULARIO;
  }
}

/**
 * Salvar turno na API
 */
async function salvarTurnoAPI(dadosTurno, equipes) {
  try {
    mostrarLoading('Salvando relatório...');
    
    // Tentar fazer upload direto para a API
    const resultado = await callAPI('salvarTurno', {
      dadosTurno: dadosTurno,
      equipes: equipes
    });
    
    ocultarLoading();
    return resultado;
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao salvar turno:', error);
    
    return {
      success: false,
      message: 'Erro ao salvar relatório: ' + error.message
    };
  }
}

/**
 * Obter dados de um relatório
 */
async function obterDadosRelatorioAPI(turnoId) {
  try {
    return await callAPI('obterDadosRelatorio', { turnoId });
  } catch (error) {
    console.error('Erro ao obter dados do relatório:', error);
    return {
      success: false,
      message: 'Erro ao recuperar dados do relatório: ' + error.message
    };
  }
}

/**
 * Gerar relatório em texto
 */
async function gerarRelatorioTextoAPI(turnoId) {
  try {
    return await callAPI('gerarRelatorioTexto', { turnoId });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return {
      success: false,
      message: 'Erro ao gerar relatório: ' + error.message
    };
  }
}

/**
 * Formatar relatório para WhatsApp
 */
async function formatarWhatsAppAPI(turnoId) {
  try {
    return await callAPI('formatarWhatsApp', { turnoId });
  } catch (error) {
    console.error('Erro ao formatar relatório para WhatsApp:', error);
    return {
      success: false,
      message: 'Erro ao formatar relatório para WhatsApp: ' + error.message
    };
  }
}

/**
 * Pesquisar relatórios
 */
async function pesquisarRelatoriosAPI(termo, tipo) {
  try {
    return await callAPI('pesquisarRelatorios', { 
      termo: termo,
      tipo: tipo 
    });
  } catch (error) {
    console.error('Erro na pesquisa:', error);
    return {
      success: false,
      message: 'Erro ao pesquisar relatórios: ' + error.message
    };
  }
}

/**
 * Gerar PDF do relatório
 */
function gerarPDF() {
  try {
    mostrarLoading('Gerando PDF...');
    
    const { jsPDF } = window.jspdf;
    const relatorioTexto = document.getElementById('relatorioTexto').textContent;
    
    if (!relatorioTexto) {
      ocultarLoading();
      alert('Não há texto do relatório para gerar o PDF.');
      return;
    }
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configurar fonte
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(10);
    
    // Quebrar texto em linhas para caber na página
    const linhas = pdf.splitTextToSize(relatorioTexto, 180);
    
    // Adicionar linhas à página
    let y = 20;
    const alturaLinha = 5;
    const maxHeightPerPage = 260;
    
    linhas.forEach(linha => {
      if (y > maxHeightPerPage) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.text(15, y, linha);
      y += alturaLinha;
    });
    
    // Salvar o PDF
    pdf.save('Relatório_Turno.pdf');
    
    ocultarLoading();
    mostrarNotificacao('PDF gerado com sucesso!');
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + error.message);
  }
}

/**
 * Exportar relatório como CSV
 */
function exportarCSV() {
  try {
    mostrarLoading('Gerando CSV...');
    
    if (!ultimoRelatorioId) {
      ocultarLoading();
      alert('ID do relatório não encontrado.');
      return;
    }
    
    obterDadosRelatorioAPI(ultimoRelatorioId)
      .then(dados => {
        if (dados.success) {
          // Gerar CSV das equipes
          const equipes = dados.equipes;
          let csvContent = "data:text/csv;charset=utf-8,";
          
          // Cabeçalhos
          let cabecalhos = Object.keys(equipes[0]);
          csvContent += cabecalhos.join(",") + "\r\n";
          
          // Dados
          equipes.forEach(equipe => {
            let row = cabecalhos.map(header => {
              let valor = equipe[header];
              // Escapar aspas e virgulas
              if (valor === null || valor === undefined) valor = '';
              valor = String(valor).replace(/"/g, '""');
              return `"${valor}"`;
            });
            csvContent += row.join(",") + "\r\n";
          });
          
          // Criar link de download
          let encodedUri = encodeURI(csvContent);
          let link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "relatorio_turno.csv");
          document.body.appendChild(link);
          
          // Clicar no link para iniciar o download
          link.click();
          document.body.removeChild(link);
          
          ocultarLoading();
          mostrarNotificacao('CSV exportado com sucesso!');
        } else {
          ocultarLoading();
          alert('Erro ao obter dados do relatório: ' + dados.message);
        }
      })
      .catch(error => {
        ocultarLoading();
        console.error('Erro ao exportar CSV:', error);
        alert('Erro ao exportar CSV: ' + error.message);
      });
  } catch (error) {
    ocultarLoading();
    console.error('Erro ao exportar CSV:', error);
    alert('Erro ao exportar CSV: ' + error.message);
  }
}
