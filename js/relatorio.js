'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.relatorio = {
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.els = {
            novoView: document.getElementById('relatorio-content'),
            historicoView: document.getElementById('historico-content'),
            dashboardView: document.getElementById('dashboard-content')
        };
    },

    bindEvents() { },

    iniciarNovoRelatorio() {
        if (!SGE_RT.auth.currentUser) return;

        SGE_RT.state.currentRelatorio = {
            supervisor: SGE_RT.auth.currentUser.nome,
            letraTurno: SGE_RT.auth.currentUser.letraTurno || '',
            data: new Date().toISOString().split('T')[0],
            equipamentosOperando: [],
            observacoes: ''
        };
        this.adicionarEquipamento();
    },

    adicionarEquipamento() {
        if (!SGE_RT.state.currentRelatorio) this.iniciarNovoRelatorio();

        SGE_RT.state.currentRelatorio.equipamentosOperando.push({
            _tempId: Date.now(),
            equipamento: '', // Placa
            tipo: '',        // Tipo (sigla)
            vaga: '',        // Usually placa, but we keep it separated for compatibility
            area: '',
            motorista: '',
            operadores: [],
            trocas: []
        });
        this.renderNovoRelatorio();
    },

    removerEquipamento(index) {
        if (confirm("Remover este equipamento?")) {
            SGE_RT.state.currentRelatorio.equipamentosOperando.splice(index, 1);
            this.renderNovoRelatorio();
        }
    },

    adicionarTroca(equipIndex) {
        const equip = SGE_RT.state.currentRelatorio.equipamentosOperando[equipIndex];
        equip.trocas.push({
            motivo: '',
            equipamentoNovo: '',
            dataHora: new Date().toISOString().slice(0, 16),
            observacao: ''
        });
        this.renderNovoRelatorio();
    },

    removerTroca(equipIndex, trocaIndex) {
        SGE_RT.state.currentRelatorio.equipamentosOperando[equipIndex].trocas.splice(trocaIndex, 1);
        this.renderNovoRelatorio();
    },

    // Handles the selection of the primary equipment (Vaga)
    handleVagaChange(equipIndex, equipamentoId) {
        const eq = SGE_RT.state.currentRelatorio.equipamentosOperando[equipIndex];

        // Define Vaga / Placa info based on selected DB equipment
        const eqDb = SGE_RT.state.equipamentos.find(e => e.id === equipamentoId);
        if (eqDb) {
            eq.equipamento = eqDb.placa;
            eq.vaga = eqDb.placa;
            eq.tipo = eqDb.tipo;
        } else {
            eq.equipamento = '';
            eq.vaga = '';
            eq.tipo = '';
        }

        // Limpa os campos de pessoal antes de buscar
        eq.motorista = '';
        eq.operadores = [];

        if (!equipamentoId || !SGE_RT.state.colaboradores) {
            this.renderNovoRelatorio();
            return;
        }

        // Busca colaboradores que estão atribuídos a esse equipamento específico
        let cols = SGE_RT.state.colaboradores.filter(c => c.equipment_id === equipamentoId);

        // Separar Função Motorista e Operador
        // Dependendo de como a nomenclatura é (MOTORISTA, OPERADOR, MOTORISTA PIPA, etc)
        const normalizeFunc = f => (f || '').toUpperCase();

        const motoristas = cols.filter(c => normalizeFunc(c.funcao).includes('MOT'));
        const operadores = cols.filter(c => normalizeFunc(c.funcao).includes('OP'));

        if (motoristas.length > 0) {
            eq.motorista = motoristas[0].nome || '';
        }

        if (operadores.length > 0) {
            eq.operadores = operadores.map(op => op.nome || '');
        }

        this.renderNovoRelatorio();

        if (cols.length === 0) {
            SGE_RT.helpers.toast(`Nenhum colaborador alocado neste equipamento`, 'warning');
        } else {
            SGE_RT.helpers.toast(`Dados preenchidos (Alocação Supabase)`, 'success');
        }
    },

    async salvarRelatorio() {
        const rel = SGE_RT.state.currentRelatorio;
        if (!rel.equipamentosOperando.length) return SGE_RT.helpers.toast("Adicione ao menos um equipamento", "warning");

        // Validate
        for (let eq of rel.equipamentosOperando) {
            if (!eq.equipamento || !eq.area) return SGE_RT.helpers.toast("Preencha os campos obrigatórios (*)", "warning");
        }

        if (!confirm("Confirmar o envio do relatório?")) return;

        SGE_RT.helpers.showLoadingScreen(true, "Salvando relatório...");

        const res = await SGE_RT.api.salvarRelatorio(rel);

        SGE_RT.helpers.showLoadingScreen(false);

        if (res && res.success) {
            SGE_RT.helpers.toast("Relatório salvo com sucesso!", "success");
            SGE_RT.state.currentRelatorio = null;
            // Move to Historico
            const histBtn = document.querySelector('[data-view="historico"]');
            if (histBtn) histBtn.click();
        } else {
            SGE_RT.helpers.toast(`Erro ao salvar. Verifique sua conexão.`, "error");
        }
    },

    renderNovoRelatorio() {
        if (!this.els.novoView) this.cacheElements();
        const app = this.els.novoView;
        if (!app) return;

        if (!SGE_RT.state.currentRelatorio) {
            app.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px; height:64px; color:var(--primary); margin: 0 auto;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <h2>Começar Turno</h2>
                    <p>Inicie um novo relatório para registrar as atividades, equipamentos e ocorrências do seu turno.</p>
                    <button class="primary-btn" onclick="SGE_RT.relatorio.iniciarNovoRelatorio()">Iniciar Relatório</button>
                </div>
            `;
            return;
        }

        const r = SGE_RT.state.currentRelatorio;
        const equipamentos = SGE_RT.state.equipamentos || [];
        const motivosTroca = SGE_RT.CONFIG.motivosTroca || [];

        // ── Agrupa equipamentos por sigla (tipo) para o <optgroup> ──────────
        const equipByTipo = equipamentos.reduce((acc, e) => {
            const t = e.sigla || 'OUTROS';
            if (!acc[t]) acc[t] = [];
            acc[t].push(e);
            return acc;
        }, {});

        const buildEquipOptions = (selectedId) => {
            const groups = Object.keys(equipByTipo).sort().map(tipo => {
                const opts = equipByTipo[tipo]
                    .sort((a, b) => (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true }))
                    .map(e => `<option value="${e.id}" ${selectedId === e.id ? 'selected' : ''}>${e.placa}${e.escala ? ' · ' + e.escala : ''}</option>`)
                    .join('');
                return `<optgroup label="${tipo}">${opts}</optgroup>`;
            });
            return `<option value="">Selecione...</option>` + groups.join('');
        };

        // Versão para trocas: value = placa (string), pois trocas.equipamentoNovo armazena a placa
        const buildEquipOptionsPlaca = (selectedPlaca) => {
            const groups = Object.keys(equipByTipo).sort().map(tipo => {
                const opts = equipByTipo[tipo]
                    .sort((a, b) => (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true }))
                    .map(e => `<option value="${e.placa}" ${selectedPlaca === e.placa ? 'selected' : ''}>${e.placa}${e.escala ? ' · ' + e.escala : ''}</option>`)
                    .join('');
                return `<optgroup label="${tipo}">${opts}</optgroup>`;
            });
            return `<option value="">Selecione...</option>` + groups.join('');
        };


        const equipamentosHTML = r.equipamentosOperando.map((eq, idx) => {
            // Check if this equipment has a selected ID based on its placa
            const eqSelectedId = equipamentos.find(e => e.placa === eq.equipamento)?.id || '';

            return `
            <div class="equipamento-card">
                <div class="equipamento-card-header">
                    <h3>Equipamento ${idx + 1} - Detalhes da Operação</h3>
                    <button class="remove-btn" onclick="SGE_RT.relatorio.removerEquipamento(${idx})">Remover</button>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Equipamento / Alocação *</label>
                        <select onchange="SGE_RT.relatorio.handleVagaChange(${idx}, this.value)">
                            ${buildEquipOptions(eqSelectedId)}
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Área de Atuação *</label>
                        <input type="text" value="${eq.area}" onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].area = this.value" placeholder="Ex: Galpão A, Linha 3...">
                    </div>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Motorista</label>
                        <input type="text" id="motorista_input_${eq._tempId}" value="${eq.motorista}" onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].motorista = this.value" placeholder="Nome do motorista">
                    </div>
                    <div class="input-group">
                        <label>Operadores</label>
                        ${(Array.isArray(eq.operadores) ? eq.operadores : []).map((opName, opIdx) => `
                            <div style="display:flex; gap:8px; margin-bottom:8px;">
                                <input type="text" value="${opName}" onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores[${opIdx}] = this.value" placeholder="Operador ${opIdx + 1}" style="flex:1;">
                                <button class="remove-btn" style="padding: 0 12px;" onclick="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores.splice(${opIdx}, 1); SGE_RT.relatorio.renderNovoRelatorio();">✕</button>
                            </div>
                        `).join('')}
                        <button class="secondary-btn" style="padding: 6px 12px; font-size: 11px; width: fit-content;" onclick="if(!Array.isArray(SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores)) SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores = []; SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].operadores.push(''); SGE_RT.relatorio.renderNovoRelatorio();">+ Adicionar Operador</button>
                    </div>
                </div>

                <div class="trocas-section">
                    <div class="troca-header">
                        <h4>Trocas / Ocorrências</h4>
                        <button class="add-troca-btn" onclick="SGE_RT.relatorio.adicionarTroca(${idx})">+ Adicionar</button>
                    </div>
                    
                    ${eq.trocas.map((tr, tIdx) => `
                        <div class="troca-item">
                            <div class="input-group">
                                <label>Motivo</label>
                                <select onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].trocas[${tIdx}].motivo = this.value">
                                    <option value="">Selecione...</option>
                                    ${motivosTroca.map(m => `<option value="${m}" ${tr.motivo === m ? 'selected' : ''}>${m}</option>`).join('')}
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Novo Equip.</label>
                                <select onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].trocas[${tIdx}].equipamentoNovo = this.value">
                                    ${buildEquipOptionsPlaca(tr.equipamentoNovo || '')}
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Hora</label>
                                <input type="time" value="${tr.dataHora.slice(11, 16)}" onchange="SGE_RT.state.currentRelatorio.equipamentosOperando[${idx}].trocas[${tIdx}].dataHora = SGE_RT.state.currentRelatorio.data + 'T' + this.value">
                            </div>
                            <div>
                                <button class="remove-btn" style="margin-top: 24px;" onclick="SGE_RT.relatorio.removerTroca(${idx}, ${tIdx})">✕</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `}).join('');

        const user = SGE_RT.auth.currentUser;
        const turnoInfo = user
            ? (user.accessLevel === 'gestao' ? 'Gestão · Todos os Equipamentos' : `Turno ${user.letraTurno || '—'} · ${user.escalaJornada || 'Misto'} · ${equipamentos.length} equipamentos`)
            : '';

        app.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px;">
                <h2 style="font-size: 24px; color: var(--text-1);">Novo Relatório</h2>
                <div style="text-align: right; font-size: 13px;">
                    <div style="color: var(--text-2);">${new Date().toLocaleDateString('pt-BR')}</div>
                    ${turnoInfo ? `<div style="color: var(--primary); font-weight: 600; margin-top: 2px;">${turnoInfo}</div>` : ''}
                </div>
            </div>

            <div class="equipamento-card">
                <div class="grid-2">
                    <div class="input-group">
                        <label>Data do Turno</label>
                        <input type="date" value="${r.data}" onchange="SGE_RT.state.currentRelatorio.data = this.value">
                    </div>
                    <div class="input-group">
                        <label>Letra Turno</label>
                        <input type="text" value="${r.letraTurno}" readonly style="background: var(--bg-body); color: var(--text-3);">
                    </div>
                </div>
            </div>

            ${equipamentosHTML}

            <button class="add-equip-btn" onclick="SGE_RT.relatorio.adicionarEquipamento()">
                + Adicionar Outro Equipamento
            </button>

            <div class="equipamento-card" style="margin-top: 24px;">
                <div class="input-group">
                    <label>Observações Gerais</label>
                    <textarea rows="3" onchange="SGE_RT.state.currentRelatorio.observacoes = this.value" placeholder="Alguma ocorrência geral importante?">${r.observacoes}</textarea>
                </div>
            </div>

            <div class="form-actions">
                <button class="secondary-btn" style="flex: 1;" onclick="if(confirm('Cancelar e perder dados?')) { SGE_RT.state.currentRelatorio=null; SGE_RT.relatorio.renderNovoRelatorio(); }">
                    Cancelar
                </button>
                <button class="primary-btn" style="flex: 2;" onclick="SGE_RT.relatorio.salvarRelatorio()">
                    Salvar Relatório
                </button>
            </div>
        `;
    },

    async renderHistorico() {
        if (!this.els.historicoView) this.cacheElements();
        const app = this.els.historicoView;
        if (!app) return;

        app.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="skeleton" style="height: 120px; border-radius: var(--radius-md);"></div>
                <div class="skeleton" style="height: 120px; border-radius: var(--radius-md);"></div>
                <div class="skeleton" style="height: 120px; border-radius: var(--radius-md);"></div>
            </div>
        `;

        const date = new Date().toISOString().split('T')[0];
        const supervisorId = SGE_RT.auth.currentUser?.supervisor_id;
        const res = await SGE_RT.api.getRelatorios(supervisorId, date);

        if (res.success && res.relatorios && res.relatorios.length > 0) {
            SGE_RT.state.relatoriosHistorico = res.relatorios;

            app.innerHTML = res.relatorios.map(r => `
                <div class="equipamento-card mb-4" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                            <h3 style="font-weight: 600; font-size: 16px;">Relatório de Turno ${r.letraTurno || '-'}</h3>
                            <p style="color: var(--text-2); font-size: 13px;">${new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')} | Supervisor: ${r.supervisor}</p>
                        </div>
                        <button class="secondary-btn" style="padding: 6px 12px; font-size: 13px; color: var(--status-green); border-color: var(--status-green);" onclick="SGE_RT.relatorio.copiarWhatsApp('${btoa(unescape(encodeURIComponent(JSON.stringify(r))))}')">
                            Copiar WhatsApp
                        </button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${r.equipamentosOperando.map(e => `
                            <div style="border-left: 3px solid var(--primary); padding-left: 12px; font-size: 13px;">
                                <span style="font-weight: 600; color: var(--text-1);">${e.equipamento} ${e.tipo ? `(${e.tipo})` : ''}</span>
                                <span style="color: var(--text-2);"> - ${e.area}</span>
                                ${e.trocas && e.trocas.length ? `<span style="background: rgba(253, 126, 20, 0.1); color: var(--status-orange); padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; font-weight: 600;">${e.trocas.length} Ocorrências</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } else {
            app.innerHTML = `
                <div class="no-data-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                    </svg>
                    <h3>Nenhum Relatório</h3>
                    <p>Não há dados registrados para a data selecionada.</p>
                </div>
            `;
        }
    },

    copiarWhatsApp(encodedData) {
        try {
            const r = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
            let text = `*RELATÓRIO DE TURNO - ${r.letraTurno || '-'}*\n`;
            text += `📅 ${new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}\n`;
            text += `👤 Sup: ${r.supervisor}\n\n`;

            r.equipamentosOperando.forEach(eq => {
                text += `🚛 *${eq.equipamento}* ${eq.tipo ? `(${eq.tipo})` : ''}\n`;
                text += `📍 ${eq.area}\n`;
                if (eq.motorista) text += `👨‍✈️ ${eq.motorista}\n`;

                if (Array.isArray(eq.operadores) && eq.operadores.length) {
                    eq.operadores.forEach(op => {
                        if (op) text += `👷 ${op}\n`;
                    });
                } else if (typeof eq.operadores === 'string' && eq.operadores) {
                    text += `👷 ${eq.operadores}\n`;
                }

                if (eq.trocas && eq.trocas.length) {
                    eq.trocas.forEach(tr => {
                        text += `⚠️ *${tr.motivo}* -> ${tr.equipamentoNovo || 'S/EQ'}\n`;
                    });
                }
                text += `\n`;
            });

            if (r.observacoes) text += `📝 *Obs:* ${r.observacoes}\n`;

            navigator.clipboard.writeText(text);
            SGE_RT.helpers.toast('Copiado para a área de transferência', 'success');
        } catch (e) {
            SGE_RT.helpers.toast('Erro ao copiar dados. Tente novamente.', 'error');
            console.error(e);
        }
    },

    async renderDashboard() {
        if (!this.els.dashboardView) this.cacheElements();
        const app = this.els.dashboardView;
        if (!app) return;

        app.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:24px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div class="skeleton" style="height: 90px; border-radius: var(--radius-md);"></div>
                    <div class="skeleton" style="height: 90px; border-radius: var(--radius-md);"></div>
                    <div class="skeleton" style="height: 90px; border-radius: var(--radius-md);"></div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div class="skeleton" style="height: 300px; border-radius: var(--radius-md);"></div>
                    <div class="skeleton" style="height: 300px; border-radius: var(--radius-md);"></div>
                </div>
            </div>
        `;

        const date = new Date().toISOString().split('T')[0];
        const res = await SGE_RT.api.getDashboard(date);

        if (!res.success) return SGE_RT.helpers.toast('Erro ao carregar dashboard', 'error');
        const data = res.data;

        app.innerHTML = `
            <h2 style="font-size: 24px; color: var(--text-1); margin-bottom: 24px;">Dashboard Operacional</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
                <div class="equipamento-card" style="border-left: 4px solid var(--primary);">
                    <p style="font-size: 11px; font-weight: 600; color: var(--text-2); text-transform: uppercase;">Total Equipamentos</p>
                    <h3 style="font-size: 28px; font-weight: 700; color: var(--text-1); margin-top: 8px;">${data.totalEquipamentos || 0}</h3>
                </div>
                <div class="equipamento-card" style="border-left: 4px solid var(--status-orange);">
                    <p style="font-size: 11px; font-weight: 600; color: var(--text-2); text-transform: uppercase;">Trocas Realizadas</p>
                    <h3 style="font-size: 28px; font-weight: 700; color: var(--text-1); margin-top: 8px;">${data.totalTrocas || 0}</h3>
                </div>
                <div class="equipamento-card" style="border-left: 4px solid var(--status-green);">
                    <p style="font-size: 11px; font-weight: 600; color: var(--text-2); text-transform: uppercase;">Relatórios Entregues</p>
                    <h3 style="font-size: 28px; font-weight: 700; color: var(--text-1); margin-top: 8px;">${data.totalRelatorios || 0}</h3>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; @media(max-width: 768px) { grid-template-columns: 1fr; }">
                <div class="equipamento-card">
                    <h3 style="font-size: 14px; margin-bottom: 16px; color: var(--text-1);">Motivos de Troca</h3>
                    <canvas id="chartMotivos"></canvas>
                </div>
                <div class="equipamento-card">
                    <h3 style="font-size: 14px; margin-bottom: 16px; color: var(--text-1);">Top Equipamentos</h3>
                    <canvas id="chartEquip"></canvas>
                </div>
            </div>
        `;

        if (window.Chart) {
            setTimeout(() => {
                const motivosKeys = Object.keys(data.trocasMotivos || {});
                const motivosValues = Object.values(data.trocasMotivos || {});

                // Define standard colors
                const colors = {
                    'Manutenção Preventiva': '#2e9e5a',
                    'Manutenção Corretiva': '#f59f00',
                    'Avaria': '#dc3545',
                    'Sinistro': '#9c27b0',
                    'Outros': '#6c757d'
                };

                const bgColors = motivosKeys.map(k => colors[k] || '#0f3868');

                if (document.getElementById('chartMotivos')) {
                    new Chart(document.getElementById('chartMotivos'), {
                        type: 'doughnut',
                        data: {
                            labels: motivosKeys.length ? motivosKeys : ['Sem Dados'],
                            datasets: [{
                                data: motivosValues.length ? motivosValues : [1],
                                backgroundColor: motivosValues.length ? bgColors : ['#e2e8f0']
                            }]
                        },
                        options: { responsive: true, cutout: '70%' }
                    });
                }

                if (document.getElementById('chartEquip')) {
                    new Chart(document.getElementById('chartEquip'), {
                        type: 'bar',
                        data: {
                            labels: Object.keys(data.topEquipamentos || {}).length ? Object.keys(data.topEquipamentos).slice(0, 5) : ['Nenhum'],
                            datasets: [{
                                label: 'Ocorrências',
                                data: Object.values(data.topEquipamentos || {}).length ? Object.values(data.topEquipamentos).slice(0, 5) : [0],
                                backgroundColor: '#0f3868'
                            }]
                        },
                        options: { responsive: true, scales: { y: { beginAtZero: true, grid: { display: false } } } }
                    });
                }
            }, 100);
        }
    }
};
