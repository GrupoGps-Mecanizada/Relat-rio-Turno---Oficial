'use strict';

window.SGE_RT = window.SGE_RT || {};

SGE_RT.helpers = {
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const el = document.createElement('div');
        el.className = `toast toast-${type}`;

        // Define icone com base no tipo
        let icon = '<svg viewBox="0 0 24 24" fill="none" class="toast-icon" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4M12 8h.01"/></svg>';

        if (type === 'success') {
            icon = '<svg viewBox="0 0 24 24" fill="none" class="toast-icon" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>';
        } else if (type === 'error') {
            icon = '<svg viewBox="0 0 24 24" fill="none" class="toast-icon" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><path d="M18 6L6 18M6 6l12 12"/></svg>';
        }

        el.innerHTML = `
            ${icon}
            <div class="toast-content">
                <div class="toast-title">${type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : 'Aviso'}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fechar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        `;

        container.appendChild(el);

        // Animate in
        requestAnimationFrame(() => {
            el.style.transform = 'translateY(0) scale(1)';
            el.style.opacity = '1';
        });

        // Close logic
        const closeBtn = el.querySelector('.toast-close');
        let hideTimeoutId = null;

        const hide = () => {
            el.style.transform = 'translateY(100%) scale(0.95)';
            el.style.opacity = '0';
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (hideTimeoutId) clearTimeout(hideTimeoutId);
                hide();
            });
        }

        // Auto close
        if (type !== 'error') {
            hideTimeoutId = setTimeout(hide, SGE_RT.CONFIG.toastDuration || 3000);
        }
    },

    showLoadingScreen(show, status = 'Inicializando...') {
        const el = document.getElementById('loading-screen');
        const st = document.getElementById('loading-status');
        if (!el) return;

        if (st) st.textContent = status;

        if (show) {
            el.style.display = 'flex';
        } else {
            el.style.opacity = '0';
            setTimeout(() => { el.style.display = 'none'; el.style.opacity = '1'; }, 300);
        }
    },

    formatDateBR(dateStr) {
        if (!dateStr) return '';
        // Fix timezone issue when parsing simple YYYY-MM-DD
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR');
    },

    generateId() {
        return Math.random().toString(36).substring(2, 10);
    }
};
