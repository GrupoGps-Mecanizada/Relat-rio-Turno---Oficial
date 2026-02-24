'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.app = {
    async start() {
        SGE_RT.helpers.showLoadingScreen(true, 'Sincronizando banco de dados...');

        SGE_RT.navigation.init();

        try {
            // Fetch Efetivo Collaborators and Local Equipment info
            const [colRes, eqRes] = await Promise.all([
                SGE_RT.api.fetchColaboradores(),
                SGE_RT.api.fetchEquipamentos(SGE_RT.state.user.nome)
            ]);

            if (colRes && colRes.success) {
                // colRes is an array matching Gestao Efetivo's DB structure
                SGE_RT.state.colaboradores = colRes.data || [];
            }
            if (eqRes && eqRes.success) {
                SGE_RT.state.equipamentos = eqRes.equipamentos || [];
            }

            if (SGE_RT.relatorio) {
                SGE_RT.relatorio.init();
            }

            // Re-render main view
            SGE_RT.relatorio.renderNovoRelatorio();

        } catch (e) {
            SGE_RT.helpers.toast('Erro ao inicializar o app', 'error');
            console.error(e);
        } finally {
            SGE_RT.helpers.showLoadingScreen(false);
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
