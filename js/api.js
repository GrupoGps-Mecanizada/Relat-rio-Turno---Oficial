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

  // Criar URL alternativa usando proxy CORS
  const useCorsBypass = true; // Definir como true para usar o contorno de CORS
  let url;
  
  if (useCorsBypass) {
    // Usar um serviço de proxy para contornar CORS
    // Opção 1: CORS Anywhere (versão pública limitada)
    // const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    
    // Opção 2: AllOrigins (serviço mais confiável para contornar CORS)
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    
    // Construir URL original
    let originalUrl = new URL(CONFIG.API_URL);
    originalUrl.searchParams.append('action', action);
    
    // Adicionar outros parâmetros
    for (const key in params) {
      if (Object.hasOwnProperty.call(params, key)) {
        if (typeof params[key] === 'object' && params[key] !== null) {
          try {
            originalUrl.searchParams.append(key, JSON.stringify(params[key]));
          } catch (e) {
            console.error(`Erro ao converter parâmetro '${key}' para JSON:`, params[key], e);
          }
        } else if (params[key] !== undefined && params[key] !== null) {
          originalUrl.searchParams.append(key, params[key]);
        }
      }
    }
    
    // Codificar URL original para o proxy
    url = corsProxy + encodeURIComponent(originalUrl.toString());
  } else {
    // Comportamento original
    url = new URL(CONFIG.API_URL);
    url.searchParams.append('action', action);
    
    for (const key in params) {
      if (!Object.hasOwnProperty.call(params, key)) continue;
      
      if (typeof params[key] === 'object' && params[key] !== null) {
        try {
          url.searchParams.append(key, JSON.stringify(params[key]));
        } catch (e) {
          console.error(`Erro ao converter parâmetro '${key}' para JSON:`, params[key], e);
        }
      } else if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    }
  }

  let timeoutId = null;
  const controller = new AbortController();

  try {
    mostrarLoading('Comunicando com servidor...');

    console.log('Chamando API:', url.toString()); // Log para debug

    // Configurar timeout
    timeoutId = setTimeout(() => {
        console.warn(`API Call (${action}) aborted due to timeout.`);
        controller.abort();
    }, 30000); // 30 segundos de timeout

    // Opções de fetch ajustadas para o proxy CORS
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Alguns proxies CORS precisam deste cabeçalho
      },
      redirect: 'follow',
      mode: useCorsBypass ? 'cors' : 'cors', // Se usar proxy, 'cors' funciona melhor
      signal: controller.signal,
      cache: 'no-cache'
    };

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);
    timeoutId = null;

    if (!response.ok) {
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

    ocultarLoading();
    return data;

  } catch (error) {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    ocultarLoading();
    console.error(`Erro na chamada da API (${action}):`, error);

    let mensagemErro = error.message;

    if (error.name === 'AbortError') {
      mensagemErro = 'Tempo limite excedido ao comunicar com o servidor (30s). Verifique sua conexão ou tente novamente.';
    } else if (error.message.includes('Failed to fetch')) {
      // Informação específica para o problema de CORS
      mensagemErro = 'Erro de comunicação com o servidor. Possível problema de CORS ou CSP.';
      console.warn("Dica: Erro 'Failed to fetch' pode ser causado por problemas de CORS no servidor.");
      
      // Se o uso de proxy falhou, sugerir soluções
      if (useCorsBypass) {
        console.error("O proxy CORS também falhou. Recomendações:");
        console.error("1. Verifique se o serviço de proxy está disponível");
        console.error("2. Considere usar outro serviço de proxy CORS");
        console.error("3. Configure o servidor Google Apps Script para permitir CORS");
      }
    } else if (error.message.includes('servidor') || error.message.includes('invalid')) {
      mensagemErro = error.message;
    } else {
      mensagemErro = "Ocorreu um erro inesperado na comunicação com o servidor.";
    }

    return {
      success: false,
      message: mensagemErro
    };
  }
}
