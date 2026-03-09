'use strict';

/**
 * SGE RT — Push Notifications
 *
 * Mostra notificações nativas do browser quando:
 *   - Um novo relatório de turno é salvo por outro usuário (Supabase Realtime)
 *   - A aba está em segundo plano (document.hidden)
 *
 * Permissão é solicitada automaticamente após o login, de forma não invasiva
 * (solicita apenas se o browser já não bloqueou).
 */
(function () {
    'use strict';

    const SGE_RT_NOTIF = window.SGE_RT_NOTIF = {};
    let _enabled = false;

    // ── Solicita permissão de forma suave ──────────────────
    SGE_RT_NOTIF.requestPermission = async function () {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') { _enabled = true; return true; }
        if (Notification.permission === 'denied') return false;

        const permission = await Notification.requestPermission();
        _enabled = permission === 'granted';
        return _enabled;
    };

    // ── Mostra uma notificação ─────────────────────────────
    SGE_RT_NOTIF.notify = function (title, body, options = {}) {
        if (!_enabled || Notification.permission !== 'granted') return;
        // Notifica apenas quando a aba está oculta
        if (!document.hidden && !options.force) return;

        try {
            const n = new Notification(title, {
                body,
                icon: 'favicon.svg',
                badge: 'favicon.svg',
                tag: options.tag || 'sge-rt-notif',
                renotify: true,
                ...options
            });
            n.onclick = () => { window.focus(); n.close(); };
        } catch (e) {
            console.warn('[SGE RT Notif]', e);
        }
    };

    // ── Notifica novos relatórios via Supabase Realtime ───
    SGE_RT_NOTIF.setupRelatorioListener = function () {
        if (!window.supabase || typeof window.supabase.channel !== 'function') {
            setTimeout(SGE_RT_NOTIF.setupRelatorioListener, 3000);
            return;
        }

        // Tenta detectar a tabela de relatórios (nome pode variar por schema)
        window.supabase
            .channel('sge-rt-notif-relatorio')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'gps_compartilhado',
                table: 'relatorios_turno'
            }, (payload) => {
                const rel = payload.new;
                if (!rel) return;

                // Não notifica o próprio usuário
                const myEmail = window.SGE_RT?.auth?.currentUser?.email;
                if (myEmail && rel.usuario_email === myEmail) return;

                const supervisor = rel.supervisor_nome || rel.usuario || 'Supervisor';
                const turno = rel.turno || '';
                const equip = rel.equipamento_nome || rel.equipamento_id || '';

                SGE_RT_NOTIF.notify(
                    `Novo Relatório — ${supervisor}`,
                    `${supervisor} registrou relatório${turno ? ' do turno ' + turno : ''}${equip ? ' — ' + equip : ''}`,
                    { tag: `rt-rel-${rel.id || Date.now()}` }
                );
            })
            .subscribe();
    };

    // ── Auto-start após o login ────────────────────────────
    function _autoStart() {
        if (window.SGE_RT?.auth?.currentUser) {
            SGE_RT_NOTIF.requestPermission().then(granted => {
                if (granted) {
                    SGE_RT_NOTIF.setupRelatorioListener();
                    console.info('[SGE RT Notif] Notificações ativas.');
                }
            });
        } else {
            setTimeout(_autoStart, 2000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(_autoStart, 4000));
    } else {
        setTimeout(_autoStart, 4000);
    }
})();
