'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.state = {
    view: 'novo',
    user: null,
    equipamentos: [],
    colaboradores: [],
    vagas: SGE_RT.CONFIG.vagas,
    currentRelatorio: null,
    relatoriosHistorico: [],
    dashboardData: null,
    sidebarOpen: false
};
