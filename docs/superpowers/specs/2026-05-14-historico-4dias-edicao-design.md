# Design: Histórico 4 Dias + Edição de Relatórios

## Contexto
Supervisores precisam visualizar os últimos 4 dias de relatórios (não só hoje) e poder editar relatórios já enviados.

## Feature 1: Histórico dos últimos 4 dias

**API (`getRelatorios`):** Busca as últimas 4 datas em paralelo (hoje, ontem, anteontem, 3 dias atrás) usando `Promise.all`. Retorna lista única ordenada por data desc.

**UI (`renderHistorico`):** Agrupa cards por data com separadores: "Hoje", "Ontem", "DD/MM".

## Feature 2: Edição de relatórios

**Fluxo:**
1. Botão "Editar" em cada card do histórico
2. `carregarEdicao(encodedData)` carrega os dados no `SGE_RT.state.currentRelatorio` com campo `id` (UUID do registro)
3. Navega para aba "Novo Relatório"
4. Form exibe "Editando Relatório #N" + botão "Salvar Alterações"
5. `enviarRelatorio` detecta `id` presente → chama `atualizarRelatorio`

**API (`atualizarRelatorio`):**
- UPDATE no master record (`relatorio_gps_mec_relatorios_turno`)
- DELETE nos equipamentos existentes + INSERT dos novos (`relatorio_gps_mec_relatorio_equipamentos`)
- Retorna `{ success: true }`

## Arquivos alterados
- `js/api.js`: `getRelatorios` (range 4 datas), novo `atualizarRelatorio`
- `js/relatorio.js`: `renderHistorico` (separadores + botão editar), `carregarEdicao` (novo), `renderNovoRelatorio` (modo edição), `enviarRelatorio` (branch edição)
