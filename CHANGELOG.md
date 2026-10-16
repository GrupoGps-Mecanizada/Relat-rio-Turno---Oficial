# CHANGELOG — Relatório de Turno

## v1.2.0 — 2026-10-16
### Mudou
- **Login novo da Central** (`SGE.acesso.entrar` do sge-core) no lugar do `sso_client.js` e do token próprio. O sistema só abre com a sessão real de quem entrou; sem ela, vai para o login da Central. Erro de rede não deixa entrar.
- O banco é lido e gravado **com a sessão da pessoa** (uma conexão só, a mesma do login), e não mais como anônimo. Prepara o fechamento da leitura sem login das tabelas gps_mec (P-035).
- Nível pela régua única: Administrador → ADM, Gestor → GESTAO (veem tudo), os outros → SUPERVISOR.
### Saiu
- Botão DEV e `sge-session-ping.js` (o radar da Central agora vem do sge-core).
