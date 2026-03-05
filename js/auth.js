'use strict';

/**
 * SGE_RT — Authentication Module v2 (SSO Centralizado)
 * 
 * FLUXO:
 *   1. Chega com ?sso_token=JWT na URL → decodifica → inicializa Supabase com token da Central
 *   2. Ou chega sem token → verifica localStorage (sessão prévia válida)
 *   3. Se não autenticado → redireciona para sso_login.html
 *   A tela de login LOCAL não é usada (segurança fica na Central SGE).
 */
window.SGE_RT = window.SGE_RT || {};

// ─── Configuração ────────────────────────────────────────────────────────────
const SSO_APP_SLUG = 'relatorio_turno';
const SSO_LOGIN_URL = 'https://grupogps-mecanizada.github.io/SGE-CENTRAL/sso_login.html';
// URL de redirect de volta para este app (usa location atual sem querystring)
const SSO_REDIRECT_URL = () => window.location.origin + window.location.pathname;

SGE_RT.auth = {
    currentUser: null,

    init() {
        this.cacheElements();
        // Não precisa de bindEvents para login local — toda auth vai pela Central
        this.checkSession();
    },

    cacheElements() {
        this.els = {
            loginScreen: document.getElementById('login-screen'),
            appScreen: document.getElementById('app'),
            topbarUser: document.getElementById('topbar-user')
        };
    },

    // ─── PONTO DE ENTRADA: verifica sessão SSO ───────────────────────────────
    async checkSession() {
        // 1) Token SSO na URL (vindo do redirect após login na Central)
        const urlParams = new URLSearchParams(window.location.search);
        const ssoToken = urlParams.get('sso_token');

        if (ssoToken) {
            const parsed = this._parseSSOToken(ssoToken);
            if (parsed) {
                // Salva no localStorage para próxima visita
                this._saveSSOSession(parsed, ssoToken);
                // Limpa o token da URL (não fica exposto em histórico do browser)
                history.replaceState(null, '', window.location.pathname);
                await this._initFromSSOPayload(parsed);
                return;
            }
        }

        // 2) Sessão prévia no localStorage
        const storedToken = this._getStoredToken();
        if (storedToken) {
            const parsed = this._parseSSOToken(storedToken);
            if (parsed && this._isTokenValid(parsed)) {
                await this._initFromSSOPayload(parsed);
                return;
            }
        }

        // 3) Fallback: Supabase Auth direto (sessão legada do Supabase)
        if (window.supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await this._initFromSupabaseSession(session.user);
                return;
            }
        }

        // 4) Nada → redireciona para a Central SGE fazer o login
        this._redirectToSSO();
    },

    // ─── INICIALIZA APP A PARTIR DO PAYLOAD SSO ──────────────────────────────
    async _initFromSSOPayload(payload) {
        const user = payload.user || {};

        // Re-autentica o Supabase client usando o access_token salvo (se existir)
        const accessToken = localStorage.getItem('sge_session_token');
        if (accessToken && window.supabase) {
            // Injeta o token na sessão do Supabase para que queries autenticadas funcionem
            try {
                await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: localStorage.getItem('sge_session_refresh_token') || accessToken
                });
            } catch (e) {
                console.warn('SGE_RT Auth: Não foi possível setar sessão Supabase via SSO token:', e.message);
            }
        }

        await this._buildCurrentUser({
            id: user.id || '',
            email: user.email || '',
            nome: user.nome || user.email?.split('@')[0] || 'Usuário',
            perfil: user.perfil || 'SUPERVISOR'
        });
    },

    // ─── INICIALIZA APP A PARTIR DE SESSÃO SUPABASE DIRETA (legado) ──────────
    async _initFromSupabaseSession(supaUser) {
        await this._buildCurrentUser({
            id: supaUser.id,
            email: supaUser.email || '',
            nome: supaUser.user_metadata?.full_name || supaUser.email?.split('@')[0] || 'Usuário',
            perfil: supaUser.user_metadata?.perfil || 'SUPERVISOR'
        });
    },

    // ─── CONSTRÓI O currentUser COM DADOS ENRIQUECIDOS DO SUPABASE ───────────
    async _buildCurrentUser({ id, email, nome, perfil }) {
        // Determina perfil/accessLevel pelo domínio do email (compatibilidade)
        let resolvedPerfil = perfil;
        if (email.endsWith('@sge')) resolvedPerfil = 'ADM';
        else if (email.endsWith('@gestaomecanizada.com')) resolvedPerfil = 'GESTAO';
        else if (email.endsWith('@mecanizada.com')) resolvedPerfil = 'SUPERVISOR';

        const isGestao = resolvedPerfil === 'GESTAO' || resolvedPerfil === 'ADM';

        let supervisorId = null;
        let supervisorNome = null;
        let letraTurno = '';
        let escalaJornada = '';

        // Busca dados do supervisor na tabela do Supabase pelo e-mail
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

                    // Letra do turno (A, B, C, D, E)
                    if (/^[A-E]$/i.test(lastPart)) {
                        letraTurno = lastPart.toUpperCase();
                    }

                    // Escala da jornada
                    const regimeUp = regime.toUpperCase();
                    if (regimeUp.includes('12X36') || regimeUp.includes('24HS')) {
                        escalaJornada = '24HS';
                    } else if (regimeUp.includes('ADM')) {
                        escalaJornada = 'ADM';
                    } else if (regimeUp.includes('16H')) {
                        escalaJornada = '16H';
                    } else if (regimeUp.includes('4X4')) {
                        escalaJornada = '4x4';
                    }
                }
            } catch (e) {
                console.warn('SGE_RT Auth: Erro ao buscar supervisor:', e);
            }
        }

        this.currentUser = {
            id,
            email,
            nome: nome || supervisorNome || email.split('@')[0],
            perfil: resolvedPerfil,
            accessLevel: isGestao ? 'gestao' : 'supervisor',
            supervisor_id: supervisorId,
            supervisor_nome: supervisorNome,
            letraTurno,
            escalaJornada
        };

        if (!SGE_RT.state) {
            SGE_RT.state = {};
        }

        SGE_RT.state.user = this.currentUser;

        console.info(
            `%cSGE_RT Auth ✓%c ${email} | Turno: ${letraTurno || '—'} | Escala: ${escalaJornada || 'Sem restrição'} | Perfil: ${resolvedPerfil}`,
            'background:#0f3868;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;',
            'color:#334155;'
        );

        this.showApp();
    },

    // ─── LOGOUT ─────────────────────────────────────────────────────────────
    async logout() {
        // Apaga sessão do localStorage
        ['sge_session_token', 'sge_session_refresh_token', 'sge_session_id',
            'sge_session_user_id', 'sge_session_user_name', 'sge_session_user_email',
            'sge_session_app_slug', 'sge_session_app_name', 'sge_sso_token'].forEach(k => {
                try { localStorage.removeItem(k); } catch (_) { }
            });

        if (window.supabase) {
            try { await supabase.auth.signOut(); } catch (_) { }
        }

        this.currentUser = null;
        if (SGE_RT.state) {
            SGE_RT.state.user = null;
            SGE_RT.state.dataLoaded = false;
        }

        // Redireciona para a Central para novo login
        this._redirectToSSO();
    },

    // ─── UI ─────────────────────────────────────────────────────────────────
    showApp() {
        // Oculta tela de login (não usada, mas existe no HTML)
        if (this.els.loginScreen) this.els.loginScreen.classList.add('hidden');
        if (this.els.appScreen) this.els.appScreen.style.display = 'block';

        const u = this.currentUser;
        const isGestao = u && u.accessLevel === 'gestao';

        if (this.els.topbarUser && u) {
            const badgeText = isGestao
                ? 'Gestor · Todos os Equipamentos'
                : `Turno ${u.letraTurno || '—'} · ${u.escalaJornada || 'Misto'}`;

            this.els.topbarUser.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; margin-right:12px;">
                    <div style="text-align:right">
                        <div style="font-weight:600; color:var(--text-1); line-height:1.2; font-size:13px;">${u.nome}</div>
                        <div style="font-size:11px; color:var(--text-3); margin-top:2px; font-weight:500">${badgeText}</div>
                    </div>
                    <button id="logout-btn" title="Sair" style="display:flex; align-items:center; gap:4px; font-weight:600; font-size:12px; background:none; border:none; color:var(--text-3); cursor:pointer; padding:4px 8px; border-radius:4px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Sair
                    </button>
                </div>
            `;
            document.getElementById('logout-btn').onclick = () => this.logout();
        }

        if (isGestao) {
            const dashNav = document.getElementById('nav-dashboard');
            if (dashNav) dashNav.style.display = 'block';
        }

        if (SGE_RT.app && typeof SGE_RT.app.start === 'function') {
            SGE_RT.app.start();
        }
    },

    // ─── HELPERS SSO ────────────────────────────────────────────────────────

    /** Decodifica o JWT simulado gerado pela Central (base64 do payload) */
    _parseSSOToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (e) {
            console.warn('SGE_RT Auth: Token SSO inválido.', e);
            return null;
        }
    },

    /** Verifica se o token ainda não expirou */
    _isTokenValid(payload) {
        if (!payload || !payload.exp) return false;
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
    },

    /** Salva o token SSO e dados no localStorage */
    _saveSSOSession(payload, rawToken) {
        try {
            localStorage.setItem('sge_sso_token', rawToken);
            // sge_session_token = Supabase access_token vindo do localStorage (já salvo pela Central)
            // Se não existir, usamos o rawToken como referência
        } catch (_) { }
    },

    /** Recupera token SSO do localStorage */
    _getStoredToken() {
        try {
            return localStorage.getItem('sge_sso_token') || null;
        } catch (_) { return null; }
    },

    /** Redireciona para o login da Central SGE */
    _redirectToSSO() {
        const redirectBack = encodeURIComponent(SSO_REDIRECT_URL());
        const loginUrl = `${SSO_LOGIN_URL}?app_slug=${SSO_APP_SLUG}&redirect=${redirectBack}`;
        console.info(`SGE_RT: Redirecionando para SSO Central → ${loginUrl}`);

        // Mostra tela de loading antes do redirect para melhor UX
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
            const statusEl = document.getElementById('loading-status');
            if (statusEl) statusEl.textContent = 'Redirecionando para autenticação...';
        }

        setTimeout(() => {
            window.location.href = loginUrl;
        }, 400);
    }
};
