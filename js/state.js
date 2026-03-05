'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.state = {
    view: 'novo',
    user: null,
    equipamentos: [],       // From gps_mec.efetivo_gps_mec_equipamentos
    colaboradores: [],      // From gps_mec.efetivo_gps_mec_colaboradores
    supervisores: [],       // From gps_mec.efetivo_gps_mec_supervisores
    currentRelatorio: null,
    relatoriosHistorico: [],
    dashboardData: null,
    dataLoaded: false,
    sidebarOpen: false
};
