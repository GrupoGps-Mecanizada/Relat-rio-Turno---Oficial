'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.relatorio = {

    init() {
        this.cacheElements();
    },

    cacheElements() {
        this.els = {
            novoView: document.getElementById('relatorio-content'),
            historicoView: document.getElementById('historico-content'),
            dashboardView: document.getElementById('dashboard-content')
        };
    },

    // ── Iniciar novo relatório ─────────────────────────────────────────────
    iniciarNovoRelatorio() {
        const u = SGE_RT.auth.currentUser;
        SGE_RT.state.currentRelatorio = {
            supervisor: u?.nome || '',
            letraTurno: u?.letraTurno || '',
            data: new Date().toISOString().split('T')[0],
            equipamentosOperando: [],
            observacoes: ''
        };
        this.adicionarEquipamento();
    },

    adicionarEquipamento() {
        if (!SGE_RT.state.currentRelatorio) this.iniciarNovoRelatorio();
        SGE_RT.state.currentRelatorio.equipamentosOperando.push({
            _tempId: Date.now() + Math.random(),
            equipamento: '',
            tipo: '',
            vaga: '',
            area: '',
            motorista: '',
            operadores: [],
            trocas: []
        });
        this.renderNovoRelatorio();
    },

    removerEquipamento(index) {
        if (!confirm('Remover este equipamento do relatório?')) return;
        SGE_RT.state.currentRelatorio.equipamentosOperando.splice(index, 1);
        this.renderNovoRelatorio();
    },

    adicionarTroca(equipIndex) {
        const eq = SGE_RT.state.currentRelatorio.equipamentosOperando[equipIndex];
        if (!eq) return;
        eq.trocas.push({
            motivo: '',
            equipamentoNovo: '',
            dataHora: new Date().toISOString().slice(0, 16),
            observacao: ''
        });
        this.renderNovoRelatorio();
    },

    removerTroca(equipIndex, trocaIndex) {
        SGE_RT.state.currentRelatorio.equipamentosOperando[equipIndex]?.trocas.splice(trocaIndex, 1);
        this.renderNovoRelatorio();
    },

    handleVagaChange(equipIndex, equipamentoId) {
        const eq = SGE_RT.state.currentRelatorio.equipamentosOperando[equipIndex];
        if (!eq) return;
        const eqDb = (SGE_RT.state.equipamentos || []).find(e => e.id === equipamentoId);
        if (eqDb) {
            eq.vaga = eqDb.placa;
            eq.tipo = eqDb.tipo;
        } else {
            eq.vaga = eq.tipo = '';
        }
        eq.motorista = '';
        eq.operadores = [];

        if (equipamentoId && SGE_RT.state.colaboradores?.length) {
            const cols = SGE_RT.state.colaboradores.filter(c => c.equipment_id === equipamentoId);
            const norm = f => (f || '').toUpperCase();
            const motoristas = cols.filter(c => norm(c.funcao).includes('MOT'));
            const operadores = cols.filter(c => norm(c.funcao).includes('OP'));
            if (motoristas.length) eq.motorista = motoristas[0].nome || '';
            if (operadores.length) eq.operadores = operadores.map(o => o.nome || '');
            if (!cols.length) SGE_RT.helpers.toast('Nenhum colaborador alocado neste equipamento', 'info');
            else SGE_RT.helpers.toast('Dados preenchidos automaticamente', 'success');
        }
        this.renderNovoRelatorio();
    },

    async salvarRelatorio() {
        const rel = SGE_RT.state.currentRelatorio;
        if (!rel?.equipamentosOperando?.length)
            return SGE_RT.helpers.toast('Adicione ao menos um equipamento', 'info');

        for (const eq of rel.equipamentosOperando) {
            if (!eq.vaga || !eq.equipamento || !eq.area)
                return SGE_RT.helpers.toast('Preencha Vaga, Placa e Área em todos os itens (*)', 'error');
        }

        if (!confirm('Confirmar o envio do relatório de turno?')) return;

        const saveBtn = document.getElementById('rt-save-btn');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando…'; }

        const res = await SGE_RT.api.salvarRelatorio(rel);

        if (saveBtn) { saveBtn.disabled = false; }

        if (res?.success) {
            SGE_RT.helpers.toast('Relatório salvo com sucesso!', 'success');
            SGE_RT.state.currentRelatorio = null;
            SGE_RT.navigation.navigateTo('historico');
        } else {
            SGE_RT.helpers.toast('Erro ao salvar. Verifique sua conexão.', 'error');
            if (saveBtn) saveBtn.textContent = 'Salvar Relatório';
        }
    },

    // ── Builders ──────────────────────────────────────────────────────────

    _buildEquipOptions(selectedId) {
        const equipamentos = SGE_RT.state.equipamentos || [];
        const equipByTipo = equipamentos.reduce((acc, e) => {
            const t = e.sigla || 'OUTROS';
            if (!acc[t]) acc[t] = [];
            acc[t].push(e);
            return acc;
        }, {});
        const groups = Object.keys(equipByTipo).sort().map(tipo => {
            const opts = equipByTipo[tipo]
                .sort((a, b) => (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true }))
                .map(e => `<option value="${e.id}" ${selectedId === e.id ? 'selected' : ''}>${e.placa}${e.escala ? ' · ' + e.escala : ''}</option>`)
                .join('');
            return `<optgroup label="${tipo}">${opts}</optgroup>`;
        });
        return `<option value="">Selecione o equipamento…</option>` + groups.join('');
    },

    _buildEquipOptionsPlaca(selectedPlaca) {
        const frota = SGE_RT.state.frota || [];
        const frotaByGrupo = frota.reduce((acc, f) => {
            const g = f.grupo || 'OUTROS';
            if (!acc[g]) acc[g] = [];
            acc[g].push(f);
            return acc;
        }, {});
        const groups = Object.keys(frotaByGrupo).sort().map(grupo => {
            const opts = frotaByGrupo[grupo]
                .sort((a, b) => a.placa.localeCompare(b.placa))
                .map(f => `<option value="${f.placa}" ${selectedPlaca === f.placa ? 'selected' : ''}>${f.placa}</option>`)
                .join('');
            return `<optgroup label="${grupo}">${opts}</optgroup>`;
        });
        return `<option value="">Selecione a placa do veículo…</option>` + groups.join('');
    },

    _buildMotivosOptions(selected) {
        const motivos = SGE_RT.CONFIG.motivosTroca || [
            'Manutenção Preventiva', 'Manutenção Corretiva', 'Avaria', 'Sinistro', 'Operacional', 'Outro'
        ];
        return `<option value="">Motivo…</option>` + motivos.map(m =>
            `<option value="${m}" ${selected === m ? 'selected' : ''}>${m}</option>`
        ).join('');
    },

    // ── RENDER: Novo Relatório ─────────────────────────────────────────────
    renderNovoRelatorio() {
        if (!this.els.novoView) this.cacheElements();
        const app = this.els.novoView;
        if (!app) return;

        if (!SGE_RT.state.currentRelatorio) {
            const u = SGE_RT.auth.currentUser;
            const equipsCount = (SGE_RT.state.equipamentos || []).length;
            const turnoInfo = u
                ? (u.accessLevel === 'gestao'
                    ? `Gestão · Todos os Equipamentos (${equipsCount})`
                    : `Turno ${u.letraTurno || '—'} · ${u.escalaJornada || 'Misto'} · ${equipsCount} equipamentos`)
                : '';

            app.innerHTML = `
                <div class="rt-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <h3>Iniciar Turno</h3>
                    <p>Registre os equipamentos operando, motoristas, operadores e qualquer ocorrência do seu turno.</p>
                    ${turnoInfo ? `<div class="rt-turno-chip" style="margin-bottom:20px;">${turnoInfo}</div>` : ''}
                    <button class="rt-btn-save" style="width:auto;padding:12px 32px;" onclick="SGE_RT.relatorio.iniciarNovoRelatorio()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        Iniciar Novo Relatório
                    </button>
                </div>
            `;
            return;
        }

        const r = SGE_RT.state.currentRelatorio;
        const u = SGE_RT.auth.currentUser;
        const equipsCount = (SGE_RT.state.equipamentos || []).length;
        const turnoInfo = u
            ? (u.accessLevel === 'gestao'
                ? `Gestor · ${equipsCount} equipamentos disponíveis`
                : `Turno ${u.letraTurno || '—'} · ${u.escalaJornada || 'Misto'} · ${equipsCount} equip.`)
            : '';

        const equipamentosHTML = r.equipamentosOperando.map((eq, idx) => {
            const eqSelectedId = (SGE_RT.state.equipamentos || []).find(e => e.placa === eq.equipamento)?.id || '';

            const operadoresHTML = (Array.isArray(eq.operadores) ? eq.operadores : []).map((nome, opIdx) => `
                <div class="rt-operador-row">
                    <input type="text" value="${this._esc(nome)}" placeholder="Nome do operador"
                        onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores[${opIdx}] = this.value">
                    <button class="rt-operador-del" title="Remover"
                        onclick="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores.splice(${opIdx},1); SGE_RT.relatorio.renderNovoRelatorio();">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
            `).join('');

            const trocasHTML = eq.trocas.map((tr, tIdx) => `
                <div class="rt-troca-item">
                    <div class="rt-field">
                        <label>Motivo *</label>
                        <select onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].trocas[${tIdx}].motivo = this.value">
                            ${this._buildMotivosOptions(tr.motivo)}
                        </select>
                    </div>
                    <div class="rt-field">
                        <label>Novo Equipamento</label>
                        <select onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].trocas[${tIdx}].equipamentoNovo = this.value">
                            ${this._buildEquipOptionsPlaca(tr.equipamentoNovo || '')}
                        </select>
                    </div>
                    <div class="rt-field">
                        <label>Hora</label>
                        <input type="time" value="${tr.dataHora.slice(11, 16)}"
                            onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].trocas[${tIdx}].dataHora = SGE_RT.state.currentRelatorio.data + 'T' + this.value">
                    </div>
                    <div style="display:flex;align-items:flex-end;">
                        <button class="rt-troca-del-btn" title="Remover troca"
                            onclick="SGE_RT.relatorio.removerTroca(${idx}, ${tIdx})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');

            return `
            <div class="rt-card">
                <div class="rt-card-header">
                    <div class="rt-card-header-left">
                        <span class="rt-equip-index">${idx + 1}</span>
                        <div>
                            <div class="rt-card-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                                ${eq.vaga ? `<span style="font-family:var(--font-mono);color:var(--accent);">${eq.vaga}</span>` : 'Equipamento ' + (idx + 1)}
                                ${eq.equipamento ? `<span style="margin-left:6px;font-size:12px;color:var(--text-3);">(${eq.equipamento})</span>` : ''}
                            </div>
                            ${eq.area ? `<div class="rt-card-subtitle">Área: ${this._esc(eq.area)}</div>` : ''}
                        </div>
                    </div>
                    <button class="rt-remove-btn" onclick="SGE_RT.relatorio.removerEquipamento(${idx})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                        Remover
                    </button>
                </div>
                <div class="rt-card-body">
                    <!-- Linha 1: Equipamento + Placa + Área -->
                    <div class="rt-grid-3">
                        <div class="rt-field">
                            <label>Vaga / Alocação *</label>
                            <select onchange="SGE_RT.relatorio.handleVagaChange(${idx}, this.value)">
                                ${this._buildEquipOptions(eqSelectedId)}
                            </select>
                        </div>
                        <div class="rt-field">
                            <label>Placa do Veículo *</label>
                            <select onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].equipamento = this.value; SGE_RT.relatorio.renderNovoRelatorio();">
                                ${this._buildEquipOptionsPlaca(eq.equipamento)}
                            </select>
                        </div>
                        <div class="rt-field">
                            <label>Área de Atuação *</label>
                            <input type="text" value="${this._esc(eq.area)}" placeholder="Ex: Galpão A, Linha 3…"
                                onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].area = this.value">
                        </div>
                    </div>

                    <!-- Linha 2: Motorista + Operadores -->
                    <div class="rt-grid-2">
                        <div class="rt-field">
                            <label>Motorista</label>
                            <input type="text" value="${this._esc(eq.motorista)}" placeholder="Nome do motorista"
                                onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].motorista = this.value">
                        </div>
                        <div class="rt-field">
                            <label>Operadores</label>
                            <div class="rt-operadores-list">
                                ${operadoresHTML}
                                <button class="rt-add-small-btn" onclick="if(!Array.isArray(SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores)) SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores = []; SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores.push(''); SGE_RT.relatorio.renderNovoRelatorio();">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    Adicionar Operador
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Trocas / Ocorrências -->
                    <div class="rt-trocas-section">
                        <div class="rt-trocas-header">
                            <span class="rt-trocas-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                Trocas / Ocorrências
                                ${eq.trocas.length ? `<span class="rt-trocas-badge">${eq.trocas.length}</span>` : ''}
                            </span>
                            <button class="rt-add-troca-btn" onclick="SGE_RT.relatorio.adicionarTroca(${idx})">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Registrar Troca
                            </button>
                        </div>
                        ${trocasHTML || `<div style="font-size:12px;color:var(--text-3);padding:6px 0;">Nenhuma ocorrência registrada.</div>`}
                    </div>
                </div>
            </div>
            `;
        }).join('');

        app.innerHTML = `
            <!-- Info bar -->
            ${turnoInfo ? `
            <div class="rt-info-bar">
                <div class="rt-info-bar-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    ${this._esc(SGE_RT.auth.currentUser?.nome || '—')}
                </div>
                <div class="rt-info-bar-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="rt-info-bar-item">${turnoInfo}</div>
            </div>` : ''}

            <!-- Dados base: Data + Turno -->
            <div class="rt-card">
                <div class="rt-card-header">
                    <div class="rt-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Dados do Turno
                    </div>
                </div>
                <div class="rt-card-body">
                    <div class="rt-grid-3">
                        <div class="rt-field">
                            <label>Data do Turno</label>
                            <input type="date" value="${r.data}" onchange="SGE_RT.state.currentRelatorio.data = this.value">
                        </div>
                        <div class="rt-field">
                            <label>Letra do Turno</label>
                            <input type="text" value="${r.letraTurno}" readonly style="font-weight:700;color:var(--accent);">
                        </div>
                        <div class="rt-field">
                            <label>Supervisor</label>
                            <input type="text" value="${this._esc(r.supervisor)}" readonly>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Equipamentos -->
            ${equipamentosHTML}

            <!-- Add button -->
            <button class="rt-add-equip-btn" onclick="SGE_RT.relatorio.adicionarEquipamento()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Adicionar Outro Equipamento
            </button>

            <!-- Observações -->
            <div class="rt-card">
                <div class="rt-card-header">
                    <div class="rt-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        Observações Gerais
                    </div>
                </div>
                <div class="rt-card-body">
                    <div class="rt-field">
                        <label>Observações (opcional)</label>
                        <textarea rows="3" placeholder="Descreva qualquer ocorrência geral do turno…"
                            onchange="SGE_RT.state.currentRelatorio.observacoes = this.value">${this._esc(r.observacoes)}</textarea>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="rt-form-actions">
                <button class="rt-btn-cancel" onclick="if(confirm('Cancelar e descartar os dados do relatório?')){ SGE_RT.state.currentRelatorio=null; SGE_RT.relatorio.renderNovoRelatorio(); }">
                    Cancelar
                </button>
                <button class="rt-btn-save" id="rt-save-btn" onclick="SGE_RT.relatorio.salvarRelatorio()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Salvar Relatório
                </button>
            </div>
        `;
    },

    // ── RENDER: Histórico ──────────────────────────────────────────────────
    async renderHistorico() {
        if (!this.els.historicoView) this.cacheElements();
        const app = this.els.historicoView;
        if (!app) return;

        const date = new Date().toISOString().split('T')[0];
        const subEl = document.getElementById('historico-date-sub');
        if (subEl) subEl.textContent = `Relatórios registrados em ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

        app.innerHTML = `
            <div class="rt-skeleton-cards">
                <div class="skeleton" style="height:110px;border-radius:12px;"></div>
                <div class="skeleton" style="height:110px;border-radius:12px;"></div>
                <div class="skeleton" style="height:110px;border-radius:12px;"></div>
            </div>`;

        const supervisorId = SGE_RT.auth.currentUser?.supervisor_id;
        const res = await SGE_RT.api.getRelatorios(supervisorId, date);

        if (!res?.success || !res.relatorios?.length) {
            app.innerHTML = `
                <div class="rt-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    <h3>Sem Relatórios Hoje</h3>
                    <p>Não há relatórios registrados para hoje. Inicie um novo turno na aba <strong>Novo Relatório</strong>.</p>
                </div>`;
            return;
        }

        SGE_RT.state.relatoriosHistorico = res.relatorios;

        app.innerHTML = res.relatorios.map(r => {
            const equipRows = r.equipamentosOperando.map(eq => `
                <div class="rt-historico-equip-row">
                    <span class="rt-equip-placa-badge">${this._esc(eq.vaga || eq.equipamento)}</span>
                    ${eq.equipamento && eq.vaga ? `<span style="font-size:11px;color:var(--text-3);font-family:var(--font-mono);margin-right:6px;">${this._esc(eq.equipamento)}</span>` : ''}
                    <span class="rt-historico-equip-area">${this._esc(eq.area)}</span>
                    ${eq.motorista ? `<span style="font-size:11px;color:var(--text-3);">🚗 ${this._esc(eq.motorista)}</span>` : ''}
                    ${eq.trocas?.length ? `<span class="rt-trocas-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:9px;height:9px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>${eq.trocas.length} ocorr.</span>` : ''}
                </div>`).join('');

            const encData = btoa(unescape(encodeURIComponent(JSON.stringify(r))));
            const idBadge = r.id_sequencial ? `#${r.id_sequencial}` : `Turno ${this._esc(r.letraTurno || '—')}`;

            return `
            <div class="rt-historico-card">
                <div class="rt-historico-header">
                    <div>
                        <div class="rt-historico-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:var(--accent);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            Relatório ${idBadge}
                            <span class="rt-turno-chip" style="font-size:10px;padding:2px 8px;">${r.equipamentosOperando.length} equip.</span>
                        </div>
                        <div class="rt-historico-meta">
                            ${new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')} · Supervisor: ${this._esc(r.supervisor)}
                        </div>
                    </div>
                    <button class="rt-whatsapp-btn" onclick="SGE_RT.relatorio.copiarWhatsApp('${encData}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Copiar
                    </button>
                </div>
                <div class="rt-historico-body">
                    ${equipRows}
                    ${r.observacoes ? `<div style="margin-top:4px;padding:8px 12px;background:var(--bg-2);border-radius:6px;font-size:12px;color:var(--text-2);border-left:3px solid var(--accent);"><strong>Obs:</strong> ${this._esc(r.observacoes)}</div>` : ''}
                </div>
            </div>`;
        }).join('');
    },

    copiarWhatsApp(encodedData) {
        try {
            const r = JSON.parse(decodeURIComponent(escape(atob(encodedData))));

            let text = `RELATÓRIO: #${r.id_sequencial || 'S/N'}\n`;
            text += `SUPER: ${r.supervisor} | LETRA: ${r.letraTurno || '—'}\n`;
            text += `DATA: ${new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}\n\n`;

            r.equipamentosOperando.forEach((eq, idx) => {
                text += `EQUIPE ${idx + 1}\n`;
                text += `VAGA: ${eq.vaga || ''} | EQUIPAMENTO: ${eq.equipamento || ''}\n`;
                text += `MOTORISTA: ${eq.motorista || ''}\n`;

                if (Array.isArray(eq.operadores) && eq.operadores.length > 0) {
                    eq.operadores.filter(Boolean).forEach((op, opIdx) => {
                        text += `OPERADOR ${opIdx + 1}: ${op}\n`;
                    });
                }

                text += `AREA DE ATENDIMENTO: ${eq.area || ''}\n`;

                if (eq.trocas?.length) {
                    eq.trocas.forEach(tr => {
                        text += `TROCA: ${tr.motivo} -> ${tr.equipamentoNovo || 'S/EQ'}\n`;
                    });
                }
                text += `\n`;
            });

            if (r.observacoes) {
                text += `OBS: ${r.observacoes}\n`;
            }

            navigator.clipboard.writeText(text.trim());
            SGE_RT.helpers.toast('Copiado para a área de transferência!', 'success');
        } catch (e) {
            SGE_RT.helpers.toast('Erro ao copiar. Tente novamente.', 'error');
            console.error(e);
        }
    },

    // ── RENDER: Dashboard ──────────────────────────────────────────────────
    async renderDashboard() {
        if (!this.els.dashboardView) this.cacheElements();
        const app = this.els.dashboardView;
        if (!app) return;

        app.innerHTML = `
            <div class="page-header">
                <div>
                    <div class="page-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        Dashboard Operacional
                    </div>
                    <div class="page-sub">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>
            <div class="rt-kpi-grid">
                <div class="skeleton" style="height:88px;border-radius:12px;"></div>
                <div class="skeleton" style="height:88px;border-radius:12px;"></div>
                <div class="skeleton" style="height:88px;border-radius:12px;"></div>
            </div>
            <div class="rt-charts-grid">
                <div class="skeleton" style="height:280px;border-radius:12px;"></div>
                <div class="skeleton" style="height:280px;border-radius:12px;"></div>
            </div>`;

        const date = new Date().toISOString().split('T')[0];
        const res = await SGE_RT.api.getDashboard(date);
        if (!res?.success) return SGE_RT.helpers.toast('Erro ao carregar dashboard', 'error');
        const data = res.data;

        app.innerHTML = `
            <div class="page-header">
                <div>
                    <div class="page-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        Dashboard Operacional
                    </div>
                    <div class="page-sub">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            <!-- KPIs — mesmo padrão do Efetivo -->
            <div class="rt-kpi-grid">
                <div class="kpi-card" style="--kpi-accent:var(--accent);--glow-color:var(--accent-glow)">
                    <div class="kpi-icon" style="background:var(--accent-glow);color:var(--accent);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </div>
                    <div class="kpi-body">
                        <h4>Equipamentos</h4>
                        <div class="kpi-val">${data.totalEquipamentos || 0}</div>
                        <div class="kpi-sub">Operando hoje</div>
                    </div>
                </div>
                <div class="kpi-card" style="--kpi-accent:var(--orange);--glow-color:rgba(224,135,42,0.07)">
                    <div class="kpi-icon" style="background:rgba(224,135,42,0.1);color:var(--orange);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line></svg>
                    </div>
                    <div class="kpi-body">
                        <h4>Trocas / Ocorr.</h4>
                        <div class="kpi-val">${data.totalTrocas || 0}</div>
                        <div class="kpi-sub">Registradas hoje</div>
                    </div>
                </div>
                <div class="kpi-card" style="--kpi-accent:var(--green);--glow-color:rgba(46,158,90,0.07)">
                    <div class="kpi-icon" style="background:rgba(46,158,90,0.1);color:var(--green);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="9 15 12 18 15 15"></polyline></svg>
                    </div>
                    <div class="kpi-body">
                        <h4>Relatórios</h4>
                        <div class="kpi-val">${data.totalRelatorios || 0}</div>
                        <div class="kpi-sub">Entregues hoje</div>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="rt-charts-grid">
                <div class="rt-chart-card">
                    <div class="rt-chart-header">
                        <div class="rt-chart-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                            Motivos de Troca
                        </div>
                    </div>
                    <div class="rt-chart-body"><canvas id="chartMotivos" style="max-height:220px;"></canvas></div>
                </div>
                <div class="rt-chart-card">
                    <div class="rt-chart-header">
                        <div class="rt-chart-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                            Top Equipamentos
                        </div>
                    </div>
                    <div class="rt-chart-body"><canvas id="chartEquip" style="max-height:220px;"></canvas></div>
                </div>
            </div>`;

        // Draw charts
        if (window.Chart) {
            setTimeout(() => {
                const motivosKeys = Object.keys(data.trocasMotivos || {});
                const motivosVals = Object.values(data.trocasMotivos || {});
                const palette = ['#4a7fd7', '#e0872a', '#d64545', '#2e9e5a', '#8b5ec9', '#1a9eb8', '#c99a1a'];

                if (document.getElementById('chartMotivos')) {
                    new Chart(document.getElementById('chartMotivos'), {
                        type: 'doughnut',
                        data: {
                            labels: motivosKeys.length ? motivosKeys : ['Sem dados'],
                            datasets: [{ data: motivosVals.length ? motivosVals : [1], backgroundColor: motivosVals.length ? palette.slice(0, motivosKeys.length) : ['#e8ebf0'], borderWidth: 0 }]
                        },
                        options: { responsive: true, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } } }
                    });
                }
                if (document.getElementById('chartEquip')) {
                    new Chart(document.getElementById('chartEquip'), {
                        type: 'bar',
                        data: {
                            labels: Object.keys(data.topEquipamentos || {}).slice(0, 6),
                            datasets: [{ label: 'Ocorrências', data: Object.values(data.topEquipamentos || {}).slice(0, 6), backgroundColor: '#4a7fd7', borderRadius: 5 }]
                        },
                        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 11 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } }
                    });
                }
            }, 100);
        }
    },

    // ── Helpers ───────────────────────────────────────────────────────────
    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
