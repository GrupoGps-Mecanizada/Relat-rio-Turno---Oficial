# Sistema de Relatório de Turno (v3.3)

## Visão Geral

O **Sistema de Relatório de Turno** é uma aplicação web completa, projetada para digitalizar e otimizar o processo de criação de relatórios de turno para equipes de operações, como as da GPS Mecanizada. A aplicação guia o usuário através de um formulário multi-etapas para coletar informações detalhadas sobre o turno, as equipes, atividades, equipamentos e ocorrências.

O frontend é uma Single Page Application (SPA) moderna, construída com HTML, CSS e JavaScript puro, enquanto o backend é alimentado por **Google Apps Script**, utilizando uma **Planilha Google** como banco de dados. Esta arquitetura permite uma solução robusta, de baixo custo e facilmente personalizável.

---

## 🚀 Funcionalidades Principais

* **Formulário Multi-Etapas:** Interface intuitiva que divide a criação do relatório em etapas lógicas: Informações do Turno, Detalhes das Equipes e Revisão.
* **Adição Dinâmica de Equipes:** Permite adicionar múltiplas equipes (Alta Pressão, Vácuo/Hiper Vácuo), cada uma com seus próprios detalhes específicos.
* **Validação de Dados:** Validação em tempo real e condicional dos campos do formulário para garantir a integridade dos dados.
* **Persistência de Dados:** Os relatórios são salvos de forma segura em uma Planilha Google, que atua como banco de dados.
* **Salvamento Local (Fallback):** Caso a API do Google não esteja acessível, o sistema salva o relatório localmente no navegador do usuário, evitando a perda de dados.
* **Geração de Relatórios:**
    * **Formato Executivo:** Gera um relatório de texto completo e bem formatado para visualização.
    * **Formato WhatsApp:** Cria uma versão compacta e formatada, pronta para ser copiada e compartilhada em aplicativos de mensagens.
    * **Exportação para PDF:** Capacidade de gerar um PDF profissional diretamente do relatório salvo no servidor.
* **Pesquisa Avançada:** Ferramenta de pesquisa para encontrar relatórios antigos por ID, data, supervisor, letra do turno ou em relatórios salvos localmente.
* **Dashboard de Análise:** Apresenta estatísticas visuais sobre a operação, como utilização de equipamentos, áreas mais atendidas e status das atividades (requer login Google, se ativado).
* **Autenticação Google (Opcional):** Suporte para login com Google para proteger o acesso a funcionalidades como o dashboard.
* **Tema Claro/Escuro:** Gerenciador de tema para alternar entre os modos claro e escuro, com salvamento da preferência do usuário.
* **Interface Responsiva:** O layout se adapta a diferentes tamanhos de tela, de desktops a dispositivos móveis.

---

## 🏗️ Arquitetura

O projeto é dividido em duas partes principais: o **Frontend**, que é a interface com o usuário hospedada no GitHub (ou em qualquer servidor web), e o **Backend**, que é o Google App Script que processa e armazena os dados.

### Frontend (Interface do Usuário)

O frontend é uma aplicação de página única (SPA) com uma arquitetura modular.

* **`index.html`**: É o ponto de entrada único da aplicação. Contém a estrutura HTML para todas as etapas do formulário e modais.
* **`css/`**: Contém os arquivos de estilo.
    * `styles.css` e `enhanced-styles.css`: Estilização principal e aprimoramentos visuais da aplicação.
* **`js/`**: Contém toda a lógica da aplicação em JavaScript.
    * **`main.js`**: O "maestro" da aplicação. É responsável por inicializar todos os outros módulos na ordem correta quando o DOM é carregado.
    * **`app.js`**: O coração da aplicação. Gerencia a navegação entre as etapas do formulário, a lógica de adição/edição de equipes, a validação de campos e a preparação dos dados para envio.
    * **`api.js`**: Centraliza a comunicação com o backend. A função `callAPI` é a ponte entre o frontend e o Google App Script, tratando das requisições e respostas.
    * **`config.js`**: Arquivo de configuração crucial onde a URL do App Script (API) e outras configurações globais são definidas.
    * **`core/`**: Módulos que formam a base da aplicação.
        * `module-loader.js`: Um sistema simples para registrar e inicializar os diferentes módulos de forma organizada.
        * `state.js`: Um gerenciador de estado centralizado (`AppState`) para armazenar dados como `dadosTurno` e `equipes`, garantindo que a informação seja consistente em toda a aplicação.
        * Outros: `cache-manager.js`, `performance-monitor.js`, `security.js` para melhorias de desempenho e segurança.
    * **`features/`**: Módulos para funcionalidades específicas.
        * `notifications.js`: Controla a exibição de notificações e alertas para o usuário.
        * `dashboard.js`: Gerencia a busca de dados e a renderização dos gráficos e estatísticas no dashboard.
    * **`ui/`**: Módulos dedicados à experiência do usuário.
        * `theme-manager.js`: Controla a troca de tema (claro/escuro).
        * `responsive-enhancements.js`: Aplica melhorias para a usabilidade em dispositivos móveis.
    * **`auth/`**: Contém a lógica de autenticação.
        * `google-auth.js`: Implementa o fluxo de login com Google.

### Backend (Google App Script)

O arquivo `Code.gs` atua como um servidor web e uma API REST, utilizando a infraestrutura do Google.

* **Ponto de Entrada `doGet(e)`**: Esta é a função principal que o Google executa quando a URL do Web App é acessada. Ela analisa o parâmetro `action` na URL para decidir qual função executar.
* **Interação com Planilhas Google**: O script utiliza o serviço `SpreadsheetApp` para ler e escrever dados na Planilha Google configurada pelo `PLANILHA_ID`. A planilha funciona como um banco de dados, com abas separadas para `Dados` (turnos), `Equipes`, `Configurações`, etc..
* **Ações Principais**:
    * `salvarTurno`: Recebe os dados do formulário (JSON), gera um ID único para o relatório, e salva as informações nas abas `Dados` e `Equipes`.
    * `obterDadosRelatorio`: Busca todas as informações de um relatório específico com base no seu ID.
    * `pesquisarRelatorios`: Realiza buscas na planilha com base em diferentes critérios.
    * `obterDadosDashboard`: Agrega dados de múltiplos relatórios para gerar as estatísticas do dashboard.
    * `gerarRelatorioTexto` / `formatarWhatsApp`: Busca os dados de um relatório e os formata em texto puro para visualização ou compartilhamento.

---

## 📂 Estrutura de Arquivos (GitHub)
