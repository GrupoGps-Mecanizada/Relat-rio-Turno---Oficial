'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.api = {
    async doReq(url, method, params = null) {
        if (!url || !navigator.onLine) {
            return { success: false, error: 'Offline ou URL não configurada' };
        }

        try {
            if (method === 'GET') {
                const query = new URLSearchParams({
                    action: params.action || '',
                    ...params
                }).toString();
                const res = await fetch(`${url}?${query}`);
                if (!res.ok) throw new Error('Erro na rede HTTP');
                return await res.json();
            } else {
                const res = await fetch(url, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(params)
                });
                return { success: true };
            }
        } catch (e) {
            console.error('API Error:', e);
            return { success: false, error: e.message };
        }
    },

    async login(username, password) {
        const url = SGE_RT.CONFIG.gasUrl;
        // Uses the current script logic
        try {
            const res = await fetch(`${url}?action=login&username=${username}&password=${password}`);
            return await res.json();
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async fetchColaboradores() {
        const url = SGE_RT.CONFIG.efetivoUrl;
        if (!url) return { success: false, error: 'URL do Efetivo não configurada' };
        return await this.doReq(url, 'GET', { action: 'listar_colaboradores' });
    },

    async fetchEquipamentos(supervisor) {
        const url = SGE_RT.CONFIG.gasUrl;
        return await this.doReq(url, 'GET', { action: 'getEquipamentos', supervisor });
    },

    async getRelatorios(supervisor, date) {
        const url = SGE_RT.CONFIG.gasUrl;
        return await this.doReq(url, 'GET', { action: 'getRelatorios', supervisor, date });
    },

    async getDashboard(date) {
        const url = SGE_RT.CONFIG.gasUrl;
        return await this.doReq(url, 'GET', { action: 'getDashboard', date });
    },

    async salvarRelatorio(relatorio) {
        const url = SGE_RT.CONFIG.gasUrl;
        const payload = {
            action: 'saveRelatorio',
            relatorio: relatorio
        };
        // Needs a normal POST that returns JSON as the old index.html handled
        try {
            const res = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};
