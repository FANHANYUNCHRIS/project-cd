/* Responsive pages preserve the original DOM, event handlers and form values. */
document.addEventListener('DOMContentLoaded', () => {
    const controllers = new Map();
    let scheduled = false;
    const observer = new MutationObserver(schedule);
    const observe = () => observer.observe(document.body, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ['hidden', 'class', 'aria-hidden']
    });
    function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            observer.disconnect();
            document.querySelectorAll('.modal-overlay.active > .modal-container, #brand .team-info-merged, #team-mobile-bio').forEach(update);
            observe();
        });
    }
    function update(root) {
        if (!root.getClientRects().length) return;
        let state = controllers.get(root);
        if (!state) {
            const nav = document.createElement('nav');
            nav.className = 'screen-pages';
            nav.setAttribute('aria-label', '內容分頁');
            nav.innerHTML = '<button type="button" aria-label="上一頁">上一頁</button><span role="status" aria-live="polite"></span><button type="button" aria-label="下一頁">下一頁</button>';
            root.after(nav);
            // Modal controls belong inside their dialog for focus trapping.
            if (root.matches('.modal-container, .team-info-merged')) root.append(nav);
            state = { root, nav, page: 0, pages: [], units: [], branches: [] };
            controllers.set(root, state);
            nav.firstElementChild.addEventListener('click', () => turn(state, -1));
            nav.lastElementChild.addEventListener('click', () => turn(state, 1));
        }
        const anchor = state.pages[state.page]?.[0];
        state.units.forEach(el => el.classList.remove('screen-page-away'));
        state.branches.forEach(el => el.classList.remove('screen-page-empty'));
        state.nav.hidden = true;
        const isModal = root.matches('.modal-container');
        const viewport = window.visualViewport?.height || window.innerHeight;
        const limit = isModal ? Math.max(180, viewport - 48) : Math.max(160, Math.min(400, viewport - 320));
        // Split long prose into spans without changing or discarding any text.
        [...(root.matches('p:not(:has(*))') ? [root] : []), ...root.querySelectorAll('p:not(:has(*))')].forEach(p => {
            if (p.textContent.length < 110 || p.querySelector('.screen-prose')) return;
            const text = p.textContent;
            p.textContent = '';
            for (let i = 0; i < text.length; i += 100) {
                const span = document.createElement('span');
                span.className = 'screen-prose';
                span.textContent = text.slice(i, i + 100);
                p.append(span);
            }
        });
        state.units = [];
        state.branches = [];
        function collect(el) {
            if (el === state.nav || el.matches('.modal-close, .sr-only, script, [hidden]') || !el.getClientRects().length || getComputedStyle(el).display === 'none') return;
            const children = [...el.children].filter(child => !child.matches('svg, input[type="hidden"]'));
            if (children.length && el.getBoundingClientRect().height > Math.max(100, (limit - 100) * .48) && !el.matches('.form-group, .auth-checkbox-row, button, a, .form-submit-area')) {
                state.branches.push(el);
                children.forEach(collect);
            } else state.units.push(el);
        }
        [...root.children].forEach(collect);
        const show = units => {
            const visible = new Set(units);
            state.units.forEach(el => el.classList.toggle('screen-page-away', !visible.has(el)));
            [...state.branches].reverse().forEach(el => {
                const hasContent = units.some(unit => el.contains(unit));
                el.classList.toggle('screen-page-empty', !hasContent);
            });
        };
        // Measure real layout, including padding, grid gaps, headings and controls.
        if (root.getBoundingClientRect().height <= limit) {
            state.pages = [state.units];
            state.page = 0;
            return;
        }
        state.nav.hidden = false;
        state.pages = [];
        let page = [];
        for (const unit of state.units) {
            show([...page, unit]);
            if (page.length && root.getBoundingClientRect().height > limit) {
                state.pages.push(page);
                page = [unit];
            } else page.push(unit);
        }
        if (page.length) state.pages.push(page);
        const anchored = state.pages.findIndex(items => items.includes(anchor));
        state.page = anchored >= 0 ? anchored : Math.min(state.page, state.pages.length - 1);
        state.show = show;
        render(state);
    }
    function render(state) {
        state.show(state.pages[state.page] || []);
        state.nav.hidden = state.pages.length < 2;
        state.nav.firstElementChild.disabled = state.page === 0;
        state.nav.lastElementChild.disabled = state.page >= state.pages.length - 1;
        state.nav.children[1].textContent = `${state.page + 1} / ${state.pages.length}`;
    }
    function turn(state, delta) {
        observer.disconnect();
        state.page = Math.max(0, Math.min(state.pages.length - 1, state.page + delta));
        render(state);
        observe();
    }
    // Native form validation can target an input on another page.
    document.addEventListener('invalid', event => {
        for (const state of controllers.values()) {
            const page = state.pages.findIndex(items => items.some(el => el === event.target || el.contains(event.target)));
            if (page < 0) continue;
            const firstInvalid = state.root.querySelector(':invalid:not(form)');
            if (firstInvalid && firstInvalid !== event.target) continue;
            observer.disconnect();
            state.page = page;
            if (state.show) render(state);
            observe();
        }
    }, true);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    document.fonts.ready.then(schedule);
    observe();
    schedule();
});
