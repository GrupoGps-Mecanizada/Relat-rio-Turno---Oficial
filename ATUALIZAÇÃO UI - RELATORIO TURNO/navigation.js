'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.navigation = {
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.els = {
            tabBtns: document.querySelectorAll('#relatorio-tabs .dash-tab-btn'),
            navItems: document.querySelectorAll('.nav-menu-item[data-view]'),
            views: document.querySelectorAll('.view'),
            navMenuBtn: document.getElementById('nav-menu-btn'),
            navOverlay: document.getElementById('nav-menu-overlay'),
            hubBtn: document.getElementById('hub-menu-btn'),
            hubOverlay: document.getElementById('hub-dropdown-overlay'),
            hubClose: document.getElementById('hub-close-btn'),
            exportBtn: document.getElementById('topbar-export-btn')
        };
    },

    bindEvents() {
        // Tab clicks
        this.els.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo(btn.dataset.view));
        });

        // Nav menu items
        this.els.navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.view);
                this.closeNav();
            });
        });

        // Hamburger
        if (this.els.navMenuBtn) {
            this.els.navMenuBtn.addEventListener('click', () => {
                this.els.navOverlay?.classList.toggle('hidden');
            });
        }

        // Close nav on overlay backdrop
        if (this.els.navOverlay) {
            this.els.navOverlay.addEventListener('click', (e) => {
                if (e.target === this.els.navOverlay) this.closeNav();
            });
        }

        // Hub toggle
        if (this.els.hubBtn && this.els.hubOverlay) {
            this.els.hubBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.els.hubOverlay.classList.toggle('hidden');
                this.els.hubOverlay.classList.toggle('show');
            });
        }
        if (this.els.hubClose) {
            this.els.hubClose.addEventListener('click', () => this.closeHub());
        }
        if (this.els.hubOverlay) {
            this.els.hubOverlay.addEventListener('click', (e) => {
                if (e.target === this.els.hubOverlay) this.closeHub();
            });
        }

        // Export
        if (this.els.exportBtn) {
            this.els.exportBtn.addEventListener('click', () => this.handleExport());
        }

        // Logo home click
        document.getElementById('logo-home')?.addEventListener('click', () => {
            this.navigateTo('novo');
            this.closeNav();
        });

        // Accordion sections
        document.querySelectorAll('.accordion-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const section = trigger.closest('.accordion-section');
                const content = section.querySelector('.accordion-content');
                const isActive = section.classList.contains('active');
                section.classList.toggle('active', !isActive);
                if (content) {
                    content.style.maxHeight = !isActive ? content.scrollHeight + 'px' : '0';
                    content.style.opacity = !isActive ? '1' : '0';
                }
            });
            // Init active sections
            const section = trigger.closest('.accordion-section');
            const content = section.querySelector('.accordion-content');
            if (content && section.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
            }
        });

        // Refresh button on historico
        document.getElementById('historico-refresh-btn')?.addEventListener('click', () => {
            if (SGE_RT.relatorio) SGE_RT.relatorio.renderHistorico();
        });
    },

    navigateTo(viewKey) {
        if (!viewKey) return;
        SGE_RT.state.view = viewKey;

        // Update views
        this.els.views.forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`${viewKey}-view`);
        if (target) target.classList.add('active');

        // Update tabs
        this.els.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewKey);
        });

        // Update nav items
        this.els.navItems.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewKey);
        });

        // Trigger view logic
        if (SGE_RT.relatorio) {
            if (viewKey === 'novo') SGE_RT.relatorio.renderNovoRelatorio();
            else if (viewKey === 'historico') SGE_RT.relatorio.renderHistorico();
            else if (viewKey === 'dashboard') SGE_RT.relatorio.renderDashboard();
        }
    },

    closeNav() {
        this.els.navOverlay?.classList.add('hidden');
    },

    closeHub() {
        this.els.hubOverlay?.classList.add('hidden');
        this.els.hubOverlay?.classList.remove('show');
    },

    handleExport() {
        if (SGE_RT.state.view === 'historico' && SGE_RT.state.relatoriosHistorico?.length) {
            const rows = [];
            SGE_RT.state.relatoriosHistorico.forEach(r => {
                r.equipamentosOperando.forEach(eq => {
                    rows.push([r.supervisor, r.letraTurno, r.data, eq.equipamento, eq.area, eq.motorista, (eq.operadores || []).join('; '), (eq.trocas || []).length]);
                });
            });
            const csv = ['Supervisor,Turno,Data,Equipamento,Área,Motorista,Operadores,Trocas', ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            SGE_RT.helpers.toast('CSV exportado com sucesso', 'success');
        } else {
            SGE_RT.helpers.toast('Navegue para o Histórico para exportar', 'info');
        }
    },

    // Show/hide dashboard tab based on access level
    showDashboardTab() {
        const tabEl = document.getElementById('tab-dashboard');
        const navBtn = document.getElementById('nav-dashboard-btn');
        const accGestao = document.getElementById('acc-gestao');
        if (tabEl) tabEl.style.display = '';
        if (navBtn) navBtn.style.display = '';
        if (accGestao) {
            accGestao.classList.add('active');
            const content = accGestao.querySelector('.accordion-content');
            if (content) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
            }
        }
    },

    // Update stats footer in nav
    updateStats(equip, turno) {
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
        setVal('stat-equip-menu', equip);
        setVal('stat-turno-menu', turno);
    }
};
