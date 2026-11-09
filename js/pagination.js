/* Responsive pages preserve the original DOM, event handlers and form values. */
document.addEventListener('DOMContentLoaded', () => {
    const controllers = new Map();
    let scheduled = false;
    const rootSelector = '.modal-overlay > .modal-container, #brand-story-panel, #brand-team-panel, #products .pastry-content';
    const pendingRoots = new Set();
    const observer = new MutationObserver(records => {
        for (const record of records) {
            const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
            if (!target) continue;
            if (record.type === 'attributes' && record.oldValue === target.getAttribute(record.attributeName)) continue;
            const root = target.closest(rootSelector);
            if (root) pendingRoots.add(root);
            // Opening a dialog changes the overlay itself, outside its content root.
            else if (target.matches('.modal-overlay')) {
                const content = target.querySelector(':scope > .modal-container');
                if (content) pendingRoots.add(content);
            }
        }
        if (pendingRoots.size) flushSoon();
    });
    const observe = () => document.querySelectorAll('.modal-overlay, #brand, #products').forEach(surface => observer.observe(surface, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeOldValue: true, attributeFilter: ['hidden', 'class', 'aria-hidden']
    }));
    function schedule() {
        document.querySelectorAll(rootSelector).forEach(root => pendingRoots.add(root));
        flushSoon();
    }
    function flushSoon() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            const roots = [...pendingRoots];
            pendingRoots.clear();
            observer.disconnect();
            try {
                roots.forEach(update);
            } finally {
                observe();
            }
        });
    }
    function update(root) {
        if (!root.getClientRects().length) return;
        const section = root.closest('#brand, #products');
        let state = controllers.get(root);
        if (!state) {
            const nav = document.createElement('nav');
            nav.className = 'screen-pages';
            nav.setAttribute('aria-label', '內容分頁');
            nav.innerHTML = '<button type="button" aria-label="上一頁">上一頁</button><span role="status" aria-live="polite"></span><button type="button" aria-label="下一頁">下一頁</button>';
            // Keep controls inside their content area and modal focus trap.
            root.append(nav);
            state = { root, nav, page: 0, pages: [], units: [], branches: [] };
            controllers.set(root, state);
            nav.firstElementChild.addEventListener('click', () => turn(state, -1));
            nav.lastElementChild.addEventListener('click', () => turn(state, 1));
        }
        const anchor = state.pages[state.page]?.[0];
        state.units.forEach(el => el.classList.remove('screen-page-away'));
        state.branches.forEach(el => el.classList.remove('screen-page-empty'));
        state.nav.hidden = true;
        const viewport = window.visualViewport?.height || window.innerHeight;
        let limit = Math.max(180, viewport - 48);
        if (section) {
            const style = getComputedStyle(section);
            limit = section.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
            if (section.id === 'brand') {
                limit -= section.querySelector('.brand-section-header').getBoundingClientRect().height;
                limit -= parseFloat(style.rowGap);
            }
        }
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
            if (children.length && el.getBoundingClientRect().height > Math.max(100, (limit - 100) * .48) && !el.matches('.form-group, .auth-checkbox-row, button, a, .form-submit-area, .pastry-gallery, .pastry-stage, .pastry-thumbnails, .team-avatar-rail, .team-portrait, .team-mobile-portrait, .brand-emblem, .brand-visual, .brand-principles > div, .team-stat-list, .team-mobile-stats')) {
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
    const visibility = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) schedule();
    });
    document.querySelectorAll('#brand, #products').forEach(section => visibility.observe(section));
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    document.fonts.ready.then(schedule);
    observe();
    schedule();
});
