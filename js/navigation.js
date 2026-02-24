'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.navigation = {
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.els = {
            navBtns: document.querySelectorAll('.module-title'),
            views: document.querySelectorAll('.view'),
            mobileBtn: document.getElementById('mobile-menu-btn'),
            nav: document.getElementById('nav')
        };
    },

    bindEvents() {
        if (this.els.navBtns) {
            this.els.navBtns.forEach(btn => {
                btn.addEventListener('click', (e) => this.navigate(e));
            });
        }

        if (this.els.mobileBtn) {
            this.els.mobileBtn.addEventListener('click', () => {
                if (this.els.nav) this.els.nav.classList.toggle('active');
            });
        }
    },

    navigate(e) {
        const targetView = e.currentTarget.dataset.view;
        if (!targetView) return;

        // Update active class on nav
        this.els.navBtns.forEach(btn => {
            btn.parentElement.classList.remove('active');
        });
        e.currentTarget.parentElement.classList.add('active');

        // Close mobile menu if open
        if (this.els.nav && this.els.nav.classList.contains('active')) {
            this.els.nav.classList.remove('active');
        }

        // Hide all views, show target
        this.els.views.forEach(view => {
            view.classList.remove('active');
        });

        const viewEl = document.getElementById(`${targetView}-view`);
        if (viewEl) viewEl.classList.add('active');

        // Trigger view-specific logic
        if (targetView === 'novo') {
            if (SGE_RT.relatorio) SGE_RT.relatorio.renderNovoRelatorio();
        } else if (targetView === 'historico') {
            if (SGE_RT.relatorio) SGE_RT.relatorio.renderHistorico();
        } else if (targetView === 'dashboard') {
            if (SGE_RT.relatorio) SGE_RT.relatorio.renderDashboard();
        }
    }
};
