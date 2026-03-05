'use strict';

/**
 * SGE_RT — API Communication (Supabase Edition)
 * Replaces all Google Apps Script calls with direct Supabase queries.
 * Reads employees/equipment from Gestão de Efetivo tables.
 * Writes/reads shift reports from dedicated Relatório de Turno tables.
 */
window.SGE_RT = window.SGE_RT || {};

SGE_RT.api = {
    activeRequests: 0,
    subscriptions: [],

    updateSyncBar(isLoading) {
        const bar = document.getElementById('global-sync-bar');
        if (!bar) return;
        if (isLoading) {
            this.activeRequests++;
            if (this.activeRequests === 1) {
                bar.classList.remove('success');
                bar.classList.add('loading');
            }
        } else {
            this.activeRequests = Math.max(0, this.activeRequests - 1);
            if (this.activeRequests === 0) {
                bar.classList.remove('loading');
                bar.classList.add('success');
                setTimeout(() => { if (this.activeRequests === 0) bar.classList.remove('success'); }, 500);
            }
        }
    },

    _handleError(error, context) {
        console.error(`SGE_RT Supabase [${context}]:`, error.message || error);
        SGE_RT.helpers.toast(`Erro: ${context}`, 'error');
        return null;
    },

    // ─── LOAD COLABORADORES (from Gestão de Efetivo) ───
    async loadColaboradores() {
        if (!window.supabase) return false;
        try {
            this.updateSyncBar(true);

            let query = supabase.schema('gps_mec')
                .from('efetivo_gps_mec_colaboradores')
                .select('id, name, function, regime, status, category, supervisor_id, equipment_id, equipment:efetivo_gps_mec_equipamentos(id, sigla, numero)')
                .eq('status', 'ATIVO')
                .eq('category', 'OPERACIONAL')
                .order('name');

            // If user is a supervisor (not gestão), only load their team
            if (SGE_RT.auth.currentUser && SGE_RT.auth.currentUser.accessLevel !== 'gestao') {
                if (SGE_RT.auth.currentUser.supervisor_id) {
                    query = query.eq('supervisor_id', SGE_RT.auth.currentUser.supervisor_id);
                }
            }

            const { data, error } = await query;
            this.updateSyncBar(false);

            if (error) return this._handleError(error, 'Carregar Colaboradores');

            SGE_RT.state.colaboradores = data.map(e => ({
                id: e.id,
                nome: e.name,
                funcao: e.function || '',
                regime: e.regime || '',
                status: e.status,
                supervisor_id: e.supervisor_id,
                equipment_id: e.equipment_id,
                equipamento: e.equipment ? `${e.equipment.sigla}${e.equipment.numero ? '-' + e.equipment.numero : ''}` : ''
            }));

            return true;
        } catch (e) {
            this.updateSyncBar(false);
            console.error('SGE_RT loadColaboradores failed:', e);
            return false;
        }
    },

    // ─── LOAD EQUIPAMENTOS (from Gestão de Efetivo) ───
    async loadEquipamentos() {
        if (!window.supabase) return false;
        try {
            this.updateSyncBar(true);

            const user = SGE_RT.auth.currentUser;
            const isGestao = user && user.accessLevel === 'gestao';
            const escalaJornada = user && user.escalaJornada;

            let query = supabase.schema('gps_mec')
                .from('efetivo_gps_mec_equipamentos')
                .select('*')
                .eq('status', 'ATIVO')
                .order('sigla');

            // Supervisor com escala definida → filtra apenas equipamentos da sua escala.
            // Gestão/ADM ou escala indefinida → vê todos os equipamentos.
            if (!isGestao && escalaJornada) {
                // Inclui também equipamentos sem escala definida (null / vazio)
                // Supabase não suporta OR em .in() diretamente, por isso usamos filtro manual depois.
                // Buscamos tudo e filtramos no cliente (a coleção é pequena ~40 registros).
            }

            const { data, error } = await query;
            this.updateSyncBar(false);

            if (error) return this._handleError(error, 'Carregar Equipamentos');

            // Filtragem por escala da jornada do supervisor (lado cliente)
            const equipamentosRaw = data.filter(eq => {
                if (isGestao || !escalaJornada) return true; // gestão vê tudo
                const escalaEq = (eq.escala || '').toUpperCase();
                // Supervisor só vê equipamentos da sua escala ou sem escala atribuída
                return !escalaEq || escalaEq === escalaJornada.toUpperCase();
            });

            SGE_RT.state.equipamentos = equipamentosRaw.map(eq => ({
                id: eq.id,
                sigla: eq.sigla,
                numero: eq.numero || '',
                escala: eq.escala || '',
                placa: `${eq.sigla}${eq.numero ? '-' + eq.numero : ''}`,
                tipo: eq.sigla
            }));

            console.info(`SGE_RT: Equipamentos carregados → ${SGE_RT.state.equipamentos.length} (escala filtro: ${escalaJornada || 'todos'})`);
            return true;
        } catch (e) {
            this.updateSyncBar(false);
            console.error('SGE_RT loadEquipamentos failed:', e);
            return false;
        }
    },

    // ─── SAVE RELATÓRIO ───
    async salvarRelatorio(relatorio) {
        if (!window.supabase) return { success: false, error: 'Supabase não configurado' };
        this.updateSyncBar(true);

        try {
            // 1. Insert master record
            const { data: masterData, error: masterError } = await supabase.schema('gps_mec')
                .from('relatorio_gps_mec_relatorios_turno')
                .insert({
                    supervisor_id: SGE_RT.auth.currentUser?.supervisor_id || null,
                    supervisor_nome: relatorio.supervisor,
                    letra_turno: relatorio.letraTurno || null,
                    data: relatorio.data,
                    observacoes: relatorio.observacoes || null
                })
                .select()
                .single();

            if (masterError) throw masterError;

            // 2. Insert equipment rows
            if (relatorio.equipamentosOperando && relatorio.equipamentosOperando.length > 0) {
                const equipRows = relatorio.equipamentosOperando.map(eq => ({
                    relatorio_id: masterData.id,
                    equipamento_placa: eq.equipamento || '',
                    equipamento_tipo: eq.tipo || '',
                    vaga: eq.vaga || '',
                    area: eq.area || '',
                    motorista: eq.motorista || '',
                    operadores: Array.isArray(eq.operadores) ? eq.operadores : [],
                    trocas: Array.isArray(eq.trocas) ? eq.trocas : []
                }));

                const { error: eqError } = await supabase.schema('gps_mec')
                    .from('relatorio_gps_mec_relatorio_equipamentos')
                    .insert(equipRows);

                if (eqError) throw eqError;
            }

            this.updateSyncBar(false);
            return { success: true, id: masterData.id };
        } catch (e) {
            this.updateSyncBar(false);
            console.error('SGE_RT salvarRelatorio failed:', e);
            return { success: false, error: e.message };
        }
    },

    // ─── GET RELATÓRIOS (Histórico) ───
    async getRelatorios(supervisorId, date) {
        if (!window.supabase) return { success: false, relatorios: [] };
        this.updateSyncBar(true);

        try {
            let query = supabase.schema('gps_mec')
                .from('relatorio_gps_mec_relatorios_turno')
                .select('*, equipamentos:relatorio_gps_mec_relatorio_equipamentos(*)')
                .eq('data', date)
                .order('created_at', { ascending: false });

            // Supervisors only see their own reports
            if (supervisorId && SGE_RT.auth.currentUser?.accessLevel !== 'gestao') {
                query = query.eq('supervisor_id', supervisorId);
            }

            const { data, error } = await query;
            this.updateSyncBar(false);

            if (error) return this._handleError(error, 'Carregar Histórico') || { success: false, relatorios: [] };

            const relatorios = data.map(r => ({
                id: r.id,
                supervisor: r.supervisor_nome,
                letraTurno: r.letra_turno || '',
                data: r.data,
                observacoes: r.observacoes || '',
                equipamentosOperando: (r.equipamentos || []).map(eq => ({
                    equipamento: eq.equipamento_placa,
                    tipo: eq.equipamento_tipo,
                    vaga: eq.vaga,
                    area: eq.area,
                    motorista: eq.motorista,
                    operadores: eq.operadores || [],
                    trocas: eq.trocas || []
                }))
            }));

            return { success: true, relatorios };
        } catch (e) {
            this.updateSyncBar(false);
            console.error('SGE_RT getRelatorios failed:', e);
            return { success: false, relatorios: [] };
        }
    },

    // ─── GET DASHBOARD DATA ───
    async getDashboard(date) {
        if (!window.supabase) return { success: false };
        this.updateSyncBar(true);

        try {
            // Fetch all reports for the date with their equipment
            const { data: relatorios, error } = await supabase.schema('gps_mec')
                .from('relatorio_gps_mec_relatorios_turno')
                .select('*, equipamentos:relatorio_gps_mec_relatorio_equipamentos(*)')
                .eq('data', date);

            this.updateSyncBar(false);

            if (error) return this._handleError(error, 'Dashboard') || { success: false };

            let totalRelatorios = relatorios.length;
            let totalEquipamentos = 0;
            let totalTrocas = 0;
            const equipamentosCount = {};
            const trocasMotivos = {};

            relatorios.forEach(r => {
                const eqs = r.equipamentos || [];
                totalEquipamentos += eqs.length;

                eqs.forEach(eq => {
                    const nome = eq.equipamento_placa || 'Indefinido';
                    equipamentosCount[nome] = (equipamentosCount[nome] || 0) + 1;

                    const trocas = eq.trocas || [];
                    trocas.forEach(tr => {
                        totalTrocas++;
                        const motivo = tr.motivo || 'Outro';
                        trocasMotivos[motivo] = (trocasMotivos[motivo] || 0) + 1;
                    });
                });
            });

            // Build top equipamentos as object for Chart.js
            const topEquipamentos = {};
            Object.entries(equipamentosCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .forEach(([k, v]) => topEquipamentos[k] = v);

            return {
                success: true,
                data: {
                    totalRelatorios,
                    totalEquipamentos,
                    totalTrocas,
                    trocasMotivos,
                    topEquipamentos
                }
            };
        } catch (e) {
            this.updateSyncBar(false);
            console.error('SGE_RT getDashboard failed:', e);
            return { success: false };
        }
    },

    // ─── REALTIME ───
    setupRealtime() {
        if (!window.supabase) return;
        let realtimeTimer = null;
        const debouncedReload = () => {
            if (realtimeTimer) clearTimeout(realtimeTimer);
            realtimeTimer = setTimeout(() => {
                // Reload history if currently viewing it
                if (SGE_RT.state.view === 'historico' && SGE_RT.relatorio) {
                    SGE_RT.relatorio.renderHistorico();
                }
            }, 1000);
        };

        const subscription = supabase
            .channel('realtime:gps_mec:relatorio_gps_mec_relatorios_turno')
            .on('postgres_changes', { event: '*', schema: 'gps_mec', table: 'relatorio_gps_mec_relatorios_turno' }, () => debouncedReload())
            .subscribe();
        this.subscriptions.push(subscription);
        console.info('SGE_RT: Real-time subscriptions active.');
    }
};
