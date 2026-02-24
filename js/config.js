'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.CONFIG = {
    // Configurado pelo usuário para Salvar/Listar Relatórios do Turno
    gasUrl: 'https://script.google.com/macros/s/AKfycbyYAdg1YHQ3FZK70YTdFvhv3zQz1cskEsk5jVU6OTRR7mjykKvUm0D-Hdq8uv4fgNcs2w/exec',

    // URL do Backend do Gestão de Efetivo para puxar colaboradores
    efetivoUrl: 'https://script.google.com/macros/s/AKfycbwxGAQlf6699osRjUSenW7E9Ca-GXbU1-s67UVWVmfpKy6cPQnTJeSh14Z6uapFp8P0Cg/exec', // <-- The user needs to supply the same URL as Gestão Efetivo, actually wait, looking at the previous index.html, the user uses the SAME URL for everything?
    // Let me use the URL from gestao efetivo's config.js which I just read
    efetivoUrl: 'https://script.google.com/macros/s/AKfycbxD8NY-qjqDyXaIIg4xdj-0DV37dJ-DckWPqvgigcI18GogyTKOeFYlfYJQsEoDjrrx/exec',

    // Toast duration in ms
    toastDuration: 3200,

    // Vagas Requested by User
    vagas: [
        'AP 01', 'AP 02', 'AP 03', 'AP 04', 'AP 05', 'AP 06', 'AP 07', 'AP 08', 'AP 09', 'AP 10', 'AP 11', 'AP 12',
        'AV 01', 'AV 02', 'AV 03', 'AV 04', 'AV 05', 'AV 06', 'AV 07', 'AV 08',
        'BROOK 01', 'BROOK 02', 'BROOK 03', 'BROOK 04',
        'HV 01', 'HV 02', 'HV 03',
        'ASPIRADOR 1', 'ASPIRADOR 2', 'ASPIRADOR 3', 'ASPIRADOR 4', 'ASPIRADOR 5', 'ASPIRADOR 6', 'ASPIRADOR 7', 'ASPIRADOR 8', 'ASPIRADOR 9', 'ASPIRADOR 10',
        'ASPIRADOR TELHADO',
        'MOTO BOMBA',
        'CONJUGADO'
    ]
};
