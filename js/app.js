'use strict';

window.SGE_RT = window.SGE_RT || {};
SGE_RT.app = {
    async start() {
        const loadingScreen = document.getElementById('loading-screen');
        const statusEl = document.getElementById('loading-status');
        const topbar = document.getElementById('topbar');
        const main = document.getElementById('main');

        // Inicialmente oculta o conteúdo da tela principal para preparar o fade in
        if (topbar) topbar.style.opacity = '0';
        if (main) main.style.opacity = '0';

        const setStatus = (msg) => {
            if (statusEl) statusEl.innerHTML = msg + '<span class="loading-dots"></span>';
        };

        if (loadingScreen) {
            loadingScreen.classList.remove('hide');
        }

        setStatus('Sincronizando banco de dados...');
        SGE_RT.navigation.init();

        try {
            setStatus('Baixando dados... Isso pode levar alguns segundos.');

            // Fetch Efetivo Collaborators and Local Equipment info
            const [colRes, eqRes] = await Promise.all([
                SGE_RT.api.fetchColaboradores(),
                SGE_RT.api.fetchEquipamentos(SGE_RT.state.user.nome)
            ]);

            if (colRes && colRes.success) {
                SGE_RT.state.colaboradores = colRes.data || [];
            }
            if (eqRes && eqRes.success) {
                SGE_RT.state.equipamentos = eqRes.equipamentos || [];
            }

            if (SGE_RT.relatorio) {
                SGE_RT.relatorio.init();
            }

            setStatus('Montando interface...');
            // Re-render main view
            SGE_RT.relatorio.renderNovoRelatorio();

        } catch (e) {
            SGE_RT.helpers.toast('Erro ao inicializar o app', 'error');
            console.error(e);
        } finally {
            // Suaviza a transição de entrada do app
            await new Promise(r => setTimeout(r, 400));

            if (topbar) topbar.style.transition = 'opacity .4s ease';
            if (main) main.style.transition = 'opacity .4s ease';

            if (topbar) topbar.style.opacity = '1';
            if (main) main.style.opacity = '1';

            if (loadingScreen && loadingScreen.parentNode) {
                loadingScreen.classList.add('hide');
                // Remove do DOM após a animação de opacidade terminar
                setTimeout(() => loadingScreen.remove(), 700);
            }
        }
    }
};

// Bootstrap check
document.addEventListener('DOMContentLoaded', () => {
    // If auth module exists, start via auth.checkSession
    if (SGE_RT.auth) {
        SGE_RT.auth.init();
    } else {
        // Fallback
        SGE_RT.app.start();
    }
});
