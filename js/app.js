'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.app = {
    async start() {
        const loadingScreen = document.getElementById('loading-screen');
        const statusEl = document.getElementById('loading-status');
        const topbar = document.getElementById('topbar');
        const main = document.getElementById('main');

        // Prepare fade in
        if (topbar) topbar.style.opacity = '0';
        if (main) main.style.opacity = '0';

        const setStatus = (msg) => {
            if (statusEl) statusEl.innerHTML = msg + '<span class="loading-dots"></span>';
        };

        if (loadingScreen) {
            loadingScreen.classList.remove('hide');
        }

        SGE_RT.navigation.init();
        setStatus('Sincronizando banco de dados...');

        try {
            // Load base data from Supabase Gestão de Efetivo schemas
            const [colsOk, eqOk] = await Promise.all([
                SGE_RT.api.loadColaboradores(),
                SGE_RT.api.loadEquipamentos()
            ]);

            if (!colsOk || !eqOk) {
                console.warn('SGE_RT: Algum erro ocorreu ao carregar dados operacionais.');
            }

            // Setup Realtime connections for Relatorios
            SGE_RT.api.setupRealtime();

            if (SGE_RT.relatorio) {
                SGE_RT.relatorio.init();
            }

            setStatus('Montando interface...');

            // Start default view
            SGE_RT.state.dataLoaded = true;
            SGE_RT.relatorio.renderNovoRelatorio();

        } catch (e) {
            SGE_RT.helpers.toast('Erro ao inicializar o app', 'error');
            console.error(e);
        } finally {
            // Smooth transition
            await new Promise(r => setTimeout(r, 400));

            if (topbar) topbar.style.transition = 'opacity .4s ease';
            if (main) main.style.transition = 'opacity .4s ease';

            if (topbar) topbar.style.opacity = '1';
            if (main) main.style.opacity = '1';

            if (loadingScreen && loadingScreen.parentNode) {
                loadingScreen.classList.add('hide');
                setTimeout(() => loadingScreen.remove(), 700);
            }
        }
    }
};

// Bootstrap check - Initialize Auth. App will be started if Auth passes.
document.addEventListener('DOMContentLoaded', () => {
    if (SGE_RT.auth) {
        SGE_RT.auth.init();
    } else {
        SGE_RT.app.start();
    }
});
