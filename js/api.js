// Log de depuração adicionado
console.log('DEBUG: api.js iniciando. window.CONFIG é:', window.CONFIG);

/**
 * Faz uma requisição para a API (Versão Atualizada com Timeout e Melhor Error Handling)
 * @param {String} action - Ação a ser executada no servidor
 * @param {Object} params - Parâmetros adicionais
 * @returns {Promise<Object>} - Promise com o resultado da requisição (objeto com 'success' e 'message' ou dados)
 */
async function callAPI(action, params = {}) {
  // Log de depuração adicionado
  console.log('DEBUG: Dentro de callAPI. Verificando CONFIG:', window.CONFIG, 'e CONFIG.API_URL:', window.CONFIG?.API_URL);

  // Garantir que a URL base está configurada
  if (!window.CONFIG || !CONFIG.API_URL) {
      console.error("CONFIG.API_URL não está definida!", window.CONFIG);
      mostrarNotificacao("Erro de configuração: URL da API não definida.", "danger");
      return { success: false, message: "Erro de configuração interna." };
  }

  // Garantir que a ação sempre seja especificada
  if (!action) {
    throw new Error("Parâmetro 'action' obrigatório não foi fornecido.");
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
      },
      redirect: 'follow', // Seguir redirecionamentos
      mode: 'cors',       // Esperado para APIs em domínios diferentes
      signal: controller.signal, // Associar o AbortController
      cache: 'no-cache'   // Não usar cache para garantir dados atualizados
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
