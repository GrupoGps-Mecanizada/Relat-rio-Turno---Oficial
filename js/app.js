'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.app = {
    async start() {
        const loadingScreen = document.getElementById('loading-screen');
        const statusEl = document.getElementById('loading-status');
        const topbar = document.getElementById('topbar');
        const main = document.getElementById('main');
        const tabs = document.getElementById('relatorio-tabs');

        if (topbar) topbar.style.opacity = '0';
        if (main) main.style.opacity = '0';
        if (tabs) tabs.style.opacity = '0';
        if (loadingScreen) loadingScreen.classList.remove('hide');

        const setStatus = (msg) => {
            if (statusEl) statusEl.innerHTML = msg + '<span class="loading-dots"></span>';
        };

        SGE_RT.navigation.init();
        setStatus('Sincronizando banco de dados');

        try {
            const [colsOk, eqOk] = await Promise.all([
                SGE_RT.api.loadColaboradores(),
                SGE_RT.api.loadEquipamentos()
            ]);

            if (!colsOk || !eqOk) {
                console.warn('SGE_RT: Algum erro ocorreu ao carregar dados operacionais.');
            }

            // Update nav stats after data is loaded
            const equipsCount = (SGE_RT.state.equipamentos || []).length;
            const turno = SGE_RT.auth.currentUser?.letraTurno || '—';
            SGE_RT.navigation.updateStats(equipsCount, turno);

            SGE_RT.api.setupRealtime();

            if (SGE_RT.relatorio) SGE_RT.relatorio.init();

            setStatus('Montando interface');
            SGE_RT.state.dataLoaded = true;
            SGE_RT.relatorio.renderNovoRelatorio();

        } catch (e) {
            SGE_RT.helpers.toast('Erro ao inicializar o app', 'error');
            console.error(e);
        } finally {
            await new Promise(r => setTimeout(r, 350));

            const fadeIn = (el) => {
                if (!el) return;
                el.style.transition = 'opacity .4s ease';
                el.style.opacity = '1';
            };

            fadeIn(topbar);
            fadeIn(main);
            fadeIn(tabs);

            if (loadingScreen?.parentNode) {
                loadingScreen.classList.add('hide');
                setTimeout(() => loadingScreen.remove(), 700);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (SGE_RT.auth) SGE_RT.auth.init();
    else SGE_RT.app.start();
});
