'use strict';

/**
 * SGE_RT — Login (via SGE.acesso do sge-core)
 * Usa a sessão real do login da Central (Supabase Auth). Sem sessão, vai para o login da Central.
 * Na dúvida (erro, rede), não entra.
 */
window.SGE_RT = window.SGE_RT || {};

const SSO_APP_SLUG = 'relatorio_turno_mec';

// Régua única → nomes antigos (ver "Régua única de acesso - especificação" no cofre).
const PERFIL_POR_PAPEL = { ADMIN: 'ADM', GESTOR: 'GESTAO' };

SGE_RT.auth = {
    currentUser: null,

    init() {
        this.cacheElements();
        this.checkSession();
    },

    cacheElements() {
        this.els = {
            loginScreen: document.getElementById('login-screen'),
            appScreen: document.getElementById('app'),
            topbarUser: document.getElementById('topbar-user'),
            navMenuUser: document.getElementById('nav-menu-user')
        };
    },

    async checkSession() {
        const core = window.SGECore;
        if (!core || !core.acesso) {
            // Sem o sge-core (falha ao baixar) não dá para conferir o login: não entra.
            const statusEl = document.getElementById('loading-status');
            if (statusEl) statusEl.textContent = 'Não consegui carregar o login. Confira a internet e recarregue a página.';
            return;
        }

        // Só continua se a pessoa estiver logada e tiver acesso a este sistema.
        const r = await core.acesso.entrar(SSO_APP_SLUG);
        await this._buildCurrentUser({
            id: r.usuario.id,
            email: r.usuario.email || '',
            nome: r.usuario.nome,
            perfil: PERFIL_POR_PAPEL[r.papel] || 'SUPERVISOR'
        });
    },

    async _buildCurrentUser({ id, email, nome, perfil }) {
        let resolvedPerfil = perfil;
        if (email.endsWith('@sge')) resolvedPerfil = 'ADM';
        else if (email.endsWith('@gestaomecanizada.com')) resolvedPerfil = 'GESTAO';
        else if (email.endsWith('@mecanizada.com')) resolvedPerfil = 'SUPERVISOR';

        const isGestao = resolvedPerfil === 'GESTAO' || resolvedPerfil === 'ADM';
        let supervisorId = null, supervisorNome = null, letraTurno = '', escalaJornada = '';

        if (window.supabase && email) {
            try {
                const { data, error } = await supabase.schema('gps_mec')
                    .from('efetivo_gps_mec_supervisores')
                    .select('id, name, default_regime')
                    .eq('email', email)
                    .maybeSingle();

                if (!error && data) {
                    supervisorId = data.id;
                    supervisorNome = data.name;
                    const regime = (data.default_regime || '').trim();
                    const parts = regime.split(' ');
                    const lastPart = parts[parts.length - 1];
                    if (/^[A-E]$/i.test(lastPart)) letraTurno = lastPart.toUpperCase();
                    const regimeUp = regime.toUpperCase();
                    if (regimeUp.includes('12X36') || regimeUp.includes('24HS')) escalaJornada = '24HS';
                    else if (regimeUp.includes('ADM')) escalaJornada = 'ADM';
                    else if (regimeUp.includes('16H')) escalaJornada = '16H';
                    else if (regimeUp.includes('4X4')) escalaJornada = '4x4';
                }
            } catch (e) {
                console.warn('SGE_RT Auth: Erro ao buscar supervisor:', e);
            }
        }

        this.currentUser = {
            id, email,
            nome: nome || supervisorNome || email.split('@')[0],
            perfil: resolvedPerfil,
            accessLevel: isGestao ? 'gestao' : 'supervisor',
            supervisor_id: supervisorId,
            supervisor_nome: supervisorNome,
            letraTurno,
            escalaJornada
        };

        if (!SGE_RT.state) SGE_RT.state = {};
        SGE_RT.state.user = this.currentUser;

        console.info(
            `%cSGE_RT Auth ✓%c ${email} | Turno: ${letraTurno || '—'} | Escala: ${escalaJornada || 'Sem restrição'} | Perfil: ${resolvedPerfil}`,
            'background:#0f3868;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;',
            'color:#334155;'
        );

        this.showApp();
    },

    async logout() {
        this.currentUser = null;
        if (SGE_RT.state) { SGE_RT.state.user = null; SGE_RT.state.dataLoaded = false; }
        window.SGECore.acesso.sair(SSO_APP_SLUG);
    },

    showApp() {
        if (this.els.loginScreen) this.els.loginScreen.classList.add('hidden');
        if (this.els.appScreen) this.els.appScreen.style.display = 'flex';

        const u = this.currentUser;
        const isGestao = u && u.accessLevel === 'gestao';

        // ── Topbar user chip (mesmo padrão visual do Efetivo) ────────────
        if (this.els.topbarUser && u) {
            const badgeText = isGestao
                ? 'Gestor · Todos os Equipamentos'
                : `Turno ${u.letraTurno || '—'} · ${u.escalaJornada || 'Misto'}`;

            this.els.topbarUser.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="text-align:right;">
                        <div style="font-size:12px;font-weight:700;color:var(--text-1);line-height:1.2;">${u.nome}</div>
                        <div style="font-size:10px;color:var(--text-3);margin-top:2px;font-weight:500;">${badgeText}</div>
                    </div>
                    <button id="logout-btn" title="Sair" style="display:flex;align-items:center;gap:4px;font-weight:600;font-size:11px;background:none;border:1px solid var(--border);border-radius:6px;color:var(--text-3);cursor:pointer;padding:5px 8px;transition:all .15s;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Sair
                    </button>
                </div>`;
            document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        }

        // ── Nav menu footer user info ─────────────────────────────────────
        if (this.els.navMenuUser && u) {
            const badgeText = isGestao
                ? 'Gestor'
                : `Turno ${u.letraTurno || '—'}`;
            this.els.navMenuUser.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;width:100%;">
                    <div style="width:28px;height:28px;border-radius:7px;background:var(--accent-glow);border:1px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--accent);flex-shrink:0;">
                        ${u.nome.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:12px;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.nome}</div>
                        <div style="font-size:10px;color:var(--text-3);">${badgeText}</div>
                    </div>
                    <button id="logout-btn-nav" title="Sair" style="background:none;border:none;color:var(--text-3);cursor:pointer;padding:4px;border-radius:4px;display:flex;align-items:center;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    </button>
                </div>`;
            document.getElementById('logout-btn-nav')?.addEventListener('click', () => this.logout());
        }

        // ── Show gestão-only elements ─────────────────────────────────────
        if (isGestao && SGE_RT.navigation?.showDashboardTab) {
            SGE_RT.navigation.showDashboardTab();
        }

        // ── Update nav stats ──────────────────────────────────────────────
        if (SGE_RT.navigation?.updateStats) {
            const equipsCount = (SGE_RT.state?.equipamentos || []).length || '—';
            const turno = u?.letraTurno || (isGestao ? 'ADM' : '—');
            SGE_RT.navigation.updateStats(equipsCount, turno);
        }

        // ── Boot app ──────────────────────────────────────────────────────
        // (o radar de presença da Central agora vem do sge-core)
        if (SGE_RT.app?.start) SGE_RT.app.start();
    }
};
