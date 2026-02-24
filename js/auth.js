'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.auth = {
    init() {
        this.cacheElements();
        this.bindEvents();
        this.checkSession();
    },

    cacheElements() {
        this.els = {
            loginScreen: document.getElementById('login-screen'),
            appScreen: document.getElementById('app'),
            loginForm: document.getElementById('login-form'),
            userInput: document.getElementById('login-user'),
            passInput: document.getElementById('login-pass'),
            submitBtn: document.getElementById('login-submit'),
            errorMsg: document.getElementById('login-error'),
            logoutBtn: document.getElementById('logout-btn'),
            topbarUser: document.getElementById('topbar-user')
        };
    },

    bindEvents() {
        if (this.els.loginForm) {
            this.els.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.els.logoutBtn) {
            this.els.logoutBtn.addEventListener('click', () => this.logout());
        }
    },

    checkSession() {
        const saved = localStorage.getItem('user_session_rt');
        if (saved) {
            try {
                SGE_RT.state.user = JSON.parse(saved);
                this.showApp();
            } catch (e) {
                this.logout();
            }
        } else {
            this.showLogin();
        }
    },

    async handleLogin(e) {
        e.preventDefault();

        const user = this.els.userInput.value.trim();
        const pass = this.els.passInput.value.trim();

        if (!user || !pass) {
            this.showError('Preencha os campos obrigatórios.');
            return;
        }

        this.setLoading(true);

        const res = await SGE_RT.api.login(user, pass);

        if (res && res.success) {
            localStorage.setItem('user_session_rt', JSON.stringify(res.supervisor));
            SGE_RT.state.user = res.supervisor;
            this.showApp();
        } else {
            this.showError(res?.error || 'Usuário ou senha incorretos.');
        }

        this.setLoading(false);
    },

    logout() {
        localStorage.removeItem('user_session_rt');
        SGE_RT.state.user = null;
        this.showLogin();
        SGE_RT.state.colaboradores = [];
    },

    showLogin() {
        if (this.els.loginScreen) this.els.loginScreen.classList.remove('hidden');
        if (this.els.appScreen) this.els.appScreen.style.display = 'none';
        if (this.els.userInput) this.els.userInput.value = '';
        if (this.els.passInput) this.els.passInput.value = '';
        this.showError('');
    },

    async showApp() {
        if (this.els.loginScreen) this.els.loginScreen.classList.add('hidden');
        if (this.els.appScreen) this.els.appScreen.style.display = 'block';

        const isGestao = SGE_RT.state.user.accessLevel === 'gestao';

        if (this.els.topbarUser) {
            this.els.topbarUser.innerHTML = `
                <div style="text-align:right">
                    <div style="font-weight:600; color:var(--text-1); line-height:1.2; font-size:14px;">${SGE_RT.state.user.nome}</div>
                    <div style="font-size:11px; color:var(--text-3); margin-top:2px; font-weight:500">
                        ${isGestao ? 'Gestor' : 'Turno ' + (SGE_RT.state.user.letraTurno || '-')}
                    </div>
                </div>
            `;
        }

        if (isGestao) {
            document.getElementById('nav-dashboard').style.display = 'block';
        }

        // Initialize main app modules
        if (SGE_RT.app && typeof SGE_RT.app.start === 'function') {
            await SGE_RT.app.start();
        }
    },

    setLoading(isLoading) {
        if (this.els.submitBtn) {
            this.els.submitBtn.disabled = isLoading;
            this.els.submitBtn.textContent = isLoading ? 'Entrando...' : 'Entrar';
        }
    },

    showError(msg) {
        if (this.els.errorMsg) {
            this.els.errorMsg.textContent = msg;
            this.els.errorMsg.classList.toggle('active', !!msg);
        }
    }
};
