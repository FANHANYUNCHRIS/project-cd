// 聖誕樹、下雪、聖誕帽只在 12 月（台灣時間）出現；網址加 ?festive=1 可以提前預覽。
const isFestiveSeason = new URLSearchParams(location.search).has('festive')
    || new Intl.DateTimeFormat('en', { timeZone: 'Asia/Taipei', month: 'numeric' }).format(new Date()) === '12';
document.documentElement.classList.toggle('is-festive', isFestiveSeason);

// 首頁雪花只在可見時播放；負延遲讓首次顯示已有自然分布的飄雪。
document.addEventListener('DOMContentLoaded', () => {
    const snow = document.querySelector('.hero-snow');
    // 2026-11-23 聖誕改版：開場背景就是雪夜，雪花不再只限 12 月
    if (!snow || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const flakes = document.createDocumentFragment();
    for (let i = 0; i < 48; i++) {
        const flake = document.createElement('span');
        flake.className = 'hero-snowflake';
        flake.style.setProperty('--snow-left', `${Math.random() * 100}%`);
        flake.style.setProperty('--snow-size', `${2 + Math.random() * 4}px`);
        flake.style.setProperty('--snow-opacity', `${0.2 + Math.random() * 0.55}`);
        flake.style.setProperty('--snow-duration', `${10 + Math.random() * 12}s`);
        flake.style.setProperty('--snow-delay', `${-Math.random() * 22}s`);
        flake.style.setProperty('--snow-drift', `${Math.random() * 120 - 60}px`);
        flakes.appendChild(flake);
    }
    snow.appendChild(flakes);

    // 2026-11-23 擁有者指定：整個網站背景都是黑色下雪。雪花層搬到 body 最前面、固定在畫面上，
    // 白色卡片浮在雪上面；只有切到別的分頁（document.hidden）才暫停。
    snow.classList.add('is-global');
    document.body.prepend(snow);
    const updateSnow = () => snow.classList.toggle('is-paused', document.hidden);
    document.addEventListener('visibilitychange', updateSnow);
});

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. 產品資料 (共用於滿版選單與詳情彈窗)
       ========================================= */
    // ingredients（成分）／notice（產品注意事項）是草擬內容：ingredients
    // 根據 desc／allergens 既有資訊合理推敲，不是實際配方單；notice 是共用的
    // 通用提醒文字。兩者都還沒經過老闆本人核對，正式上線前務必比對實際配方
    // 表修改，食品原料/過敏原標示需要跟實際販售商品完全一致，不能只是「合理猜測」
    // 注意事項改成條列式（見 setProductModalNotices），notice 欄位對應改成陣列，
    // 每個元素是一條列點
    const genericProductNotices = [
        "本產品為手工新鮮現做，不添加防腐劑，請盡快冷藏保存並於期限內食用完畢。",
        "因應手工製作與食材天然差異，商品外觀、顏色可能略有不同，以實際到貨為準。"
    ];

    // 成分徽章的圖示對照表：逐一挑跟該食材最接近的 Font Awesome Free 圖示
    // （沒有完全對應的品項就挑意象相近的，例如巧克力沒有專屬圖示，用
    // fa-cookie-bite 代表「咬一口的甜點」）。找不到對照的品項退回
    // defaultIngredientIcon（嫩芽，代表食材/原料的通用意象）
    const ingredientIcons = {
        '土鳳梨餡': 'fa-lemon',
        '法國奶油': 'fa-cheese',
        '中筋麵粉': 'fa-wheat-awn',
        '雞蛋': 'fa-egg',
        '細砂糖': 'fa-cube',
        '鹽': 'fa-mound',
        '紅心鹹蛋黃': 'fa-egg',
        '烏豆沙餡': 'fa-seedling',
        '奶油酥皮': 'fa-layer-group',
        '奶油': 'fa-cheese',
        '伯爵茶葉': 'fa-mug-hot',
        '香草籽': 'fa-leaf',
        '苦甜巧克力': 'fa-cookie-bite',
        '鮮奶油': 'fa-ice-cream'
    };
    const defaultIngredientIcon = 'fa-seedling';

    const productsData = {
        '1': {
            name: "鳳梨酥",
            price: "NT$ 500",
            qty: "10入/盒",
            desc: "嚴選台灣在地小農土鳳梨，慢火熬煮酸甜鳳梨餡，搭配法國奶油酥皮，入口散發濃郁奶香與自然果酸層次。",
            allergens: "蛋、奶、麩質",
            ingredients: ["土鳳梨餡", "法國奶油", "中筋麵粉", "雞蛋", "細砂糖", "鹽"],
            notice: genericProductNotices
        }
    };

    /* =========================================
       2. 導覽列（Navbar）
       ========================================= */
    const navbar = document.getElementById('main-navbar');

    /* 深淺色判斷靠下面「哪個連結該亮」共用同一個 IntersectionObserver 驅動，
       不依賴 scroll 事件的觸發頻率，反應即時可靠。
       原本手機版捲動時會收起/滑出整條導覽列，但底部分頁列現在是常駐可點的
       操作區（不是純裝飾的頂欄），跟著捲動消失反而讓人點不到，改成不管往上
       往下捲，導覽列都固定顯示，跟桌機版行為一致 */

    // 2026-11-23 聖誕改版後首頁不再內嵌大樓展示（改成直接開 building/index.html），
    // 這段只在大樓面板還存在時執行
    if (document.getElementById('brand-building-panel')) {
    const buildingLaunch = document.getElementById('building-showcase-launch');
    const buildingClose = document.getElementById('building-showcase-close');
    const buildingSection = document.getElementById('brand-building-panel');
    let buildingFrame;
    let buildingOpener = buildingLaunch;
    // 「進入 3D 大樓」與「進入這一層」共用：桌機在展示框裡開，手機（≤1024px）直接開整頁。
    document.querySelectorAll('[data-building-launch]').forEach(link => {
        link.addEventListener('click', event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (window.matchMedia('(max-width: 1024px)').matches) return;
            event.preventDefault();
            if (buildingFrame) buildingFrame.remove();
            buildingOpener = link;
            buildingFrame = document.createElement('iframe');
            buildingFrame.title = 'Project.CD 互動 3D 大樓';
            buildingFrame.src = link.href;
            buildingClose.before(buildingFrame);
            buildingSection.classList.add('building-is-open');
            buildingClose.hidden = false;
            buildingClose.focus({ preventScroll: true });
        });
    });

    // 樓層導覽：清單和剖面圖一起反白，下方卡片換成該層內容。
    (function initBuildingFloors() {
        const floorButtons = [...buildingSection.querySelectorAll('.building-floor')];
        const blocks = [...buildingSection.querySelectorAll('.building-block')];
        const detailCode = document.getElementById('building-detail-code');
        const detailZones = document.getElementById('building-detail-zones');
        const enter = document.getElementById('building-floor-enter');
        const select = code => {
            floorButtons.forEach(btn => {
                const on = btn.dataset.floor === code;
                btn.setAttribute('aria-pressed', String(on));
                if (on) detailZones.textContent = btn.dataset.zones;
            });
            blocks.forEach(block => block.classList.toggle('is-current', block.dataset.floor === code));
            detailCode.textContent = code;
            enter.href = 'building/index.html?floor=' + code;
            placeCursor();
        };
        // 電玩感「選擇關卡」：金色游標滑到目前選中的樓層
        const cursor = buildingSection.querySelector('.floor-cursor');
        function placeCursor() {
            const btn = floorButtons.find(b => b.getAttribute('aria-pressed') === 'true');
            if (!cursor || !btn || !btn.offsetParent) return;
            // 用 offsetTop 累加（不受進場動畫的位移影響），分頁剛切出來、清單還在動也量得準
            let x = 0, y = 0, el = btn;
            while (el && el !== cursor.parentElement) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
            if (el !== cursor.parentElement) return;
            cursor.style.transform = `translate(${x + 10}px, ${y + (btn.offsetHeight - 14) / 2}px)`;
        }
        window.addEventListener('resize', placeCursor);
        // 大樓在品牌區的分頁裡，分頁切出來時清單從隱藏變可見，要重新對齊游標
        if (cursor && 'ResizeObserver' in window) new ResizeObserver(placeCursor).observe(cursor.parentElement);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeCursor);
        floorButtons.forEach(btn => btn.addEventListener('click', () => select(btn.dataset.floor)));
        blocks.forEach(block => block.addEventListener('click', () => select(block.dataset.floor)));
        select('1F');
    })();

    // 營業狀態（台灣時間 06:00–22:00）與天氣（讀 3D 大樓同一份 building/weather.json，沒有今天的資料就不顯示）。
    (function initBuildingStatus() {
        const list = buildingSection.querySelector('.building-status');
        const text = document.getElementById('building-status-text');
        const weather = document.getElementById('building-status-weather');
        const update = () => {
            const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
            const open = hour >= 6 && hour < 22;
            text.textContent = open ? '營業中' : '已打烊';
            list.classList.toggle('is-closed', !open);
        };
        update();
        setInterval(update, 60000);
        fetch('building/weather.json', { cache: 'no-store' })
            .then(response => (response.ok ? response.json() : null))
            .then(feed => {
                if (!feed || !Array.isArray(feed.periods)) return;
                const now = Date.now();
                const period = feed.periods.find(p => new Date(p.from).getTime() <= now && now < new Date(p.to).getTime());
                if (!period || !period.note) return;
                weather.textContent = '今日天氣 ' + period.note;
                weather.hidden = false;
            })
            .catch(() => {});
    })();
    buildingClose.addEventListener('click', () => {
        buildingFrame.remove();
        buildingFrame = null;
        buildingSection.classList.remove('building-is-open');
        buildingClose.hidden = true;
        buildingOpener.focus({ preventScroll: true });
    });
    }

    // 品牌區三個分頁：故事、人物、大樓（2026-11-21 虛擬大樓併進品牌區）。
    (function initBrandTabs() {
        const tabs = [...document.querySelectorAll('.brand-tabs [role="tab"]')];
        const activate = tab => {
            tabs.forEach(item => {
                const selected = item === tab;
                item.setAttribute('aria-selected', String(selected));
                item.tabIndex = selected ? 0 : -1;
                document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
            });
        };
        // 舊連結 #virtual-building 還能用：直接打開「大樓」分頁
        const openBuildingFromHash = () => {
            if (location.hash !== '#virtual-building') return;
            const buildingTab = document.getElementById('brand-building-tab');
            if (buildingTab) activate(buildingTab);
            document.getElementById('brand').scrollIntoView();
        };
        openBuildingFromHash();
        // 圖片、產品區載入後版面會變高，等全部載完再對準一次
        window.addEventListener('load', openBuildingFromHash);
        window.addEventListener('hashchange', openBuildingFromHash);
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activate(tab));
            tab.addEventListener('keydown', event => {
                let target;
                if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
                if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
                if (event.key === 'Home') target = tabs[0];
                if (event.key === 'End') target = tabs[tabs.length - 1];
                if (!target) return;
                event.preventDefault();
                activate(target);
                target.focus();
            });
        });
    })();

    /* =========================================
       4. 品牌團隊人物切換器
       ========================================= */
    (function initTeamSwitcher() {
        const teamData = [
            {
                name: '武裝神姬',
                job: '咖啡甜點專家',
                battleRole: '戰鬥專家',
                weapon: '武士刀×狙擊槍',
                quote: '「用數據與匠心，重新定義這間店存在的意義。」',
                // 手機版名字/座右銘擠在同一排（見 .team-mobile-namequote），完整版
                // 座右銘太長會被擠到換行，另外準備一句短版專給手機版用，桌機版彈窗
                // 的 .team-info-quote 維持用完整版 quote，不受影響
                mobileQuote: '「數據與匠心」',
                bio: '武裝神姬對品質近乎苛求：食材只要有一絲落差就直接退回，任何新品上市前，都必須先通過十輪盲測才准放行。她相信真正的浪漫不是天馬行空的靈感，而是把每個微小細節都做到位的紀律，是這間店最後、也最嚴格的把關者。',
                avatar: 'images/staff01.jpg',
                portrait: 'images/staff01-nobg.webp'
            },
            {
                name: '強襲魔女',
                job: '職代理店長×最強雜工',
                battleRole: '移動基地',
                weapon: '車',
                quote: '「溫度差一度，風味就不再是那個風味。」',
                mobileQuote: '「差一度，就不是了」',
                bio: '強襲魔女的戰鬥職位是「移動基地」，武器欄只寫了一個字：車。戰鬥風格寫著「只想看戲」，實際上卻是店裡所有配方溫控背後最嚴謹的把關者——缺人手時補收銀、缺食材時開車去載貨，是名符其實、什麼都攬在身上的萬能雜工。',
                // team-2.jpg 還沒真的上傳，圖片放進 images/ 資料夾就會自動生效，
                // 在那之前 avatar/portrait 各自的錯誤處理會顯示通用佔位樣式
                avatar: 'images/team-2.jpg',
                portrait: 'images/team-2.jpg'
            },
            {
                name: '貓貓',
                job: '招財貓',
                battleRole: '偵查',
                weapon: '車',
                quote: '「每一次失敗的配方，都是下一次成功的線索。」',
                mobileQuote: '「失敗是線索」',
                bio: '貓貓，代號直白到讓人懷疑是不是隨便取的，但認識他的人都知道，這個名字其實再貼切不過。工作職位登記為「招財貓」——不是因為他負責收銀或招攬客人，而是每次新品試賣的業績都莫名特別好，久而久之大家都戲稱他是店裡真正的財運吉祥物。戰鬥職位是「偵查」，這點倒是完全符合他本人的個性：對任何風味的風吹草動都異常敏銳，市面上一有新的甜點趨勢，他總是第一個發現、第一個買回來拆解分析。專用武器同樣是車，戰鬥風格也跟強襲魔女一樣寫著「只想看戲」，兩人常被說像是同一個模子刻出來的，平時窩在研發室的角落，安安靜靜地不知道在忙什麼，直到某天突然端出一款完全不像同一個人做得出來的新配方。負責新品開發與風味實驗的他，習慣用近乎科學實驗的方式反覆測試比例——同一款塔皮他能連續烤二十幾次，只為了抓出那零點五公克奶油的差異，直到找出最平衡的那個版本才肯罷休。他常說，每一次失敗的配方，都是下一次成功的線索，這句話與其說是激勵自己，不如說是他真心相信的偵查守則：任何蛛絲馬跡，都不該被輕易放過。武裝神姬常說，三人小隊裡最讓她放心的就是貓貓——外表看起來最像來亂的一個，實際上卻是把每一次失敗都仔細記錄歸檔的那個人，這份不動聲色的執著，才是他真正的戰鬥力所在。',
                avatar: 'images/team-3.jpg',
                portrait: 'images/team-3.jpg'
            }
        ];

        /* 2026-11 日式 RPG 隊伍選單：左邊隊伍（金色游標）、立繪、狀態、對話框。
           台詞與自我介紹放在對話框，一段一段翻頁：打字中點一下先顯示整句，再點翻下一段。 */
        const listEl = document.getElementById('team-avatar-list');
        if (!listEl || teamData.length === 0) return;
        const byId = id => document.getElementById(id);
        const party = listEl.closest('.party');
        const nameEl = byId('team-info-name');
        const jobEl = byId('team-info-job');
        const battleEl = byId('team-info-battle');
        const weaponEl = byId('team-info-weapon');
        const portraitEl = byId('team-portrait');
        const emptyEl = byId('team-portrait-empty');
        const stageLabel = byId('party-stage-label');
        const dialog = byId('party-dialog');
        const speakerEl = byId('party-dialog-speaker');
        const textEl = byId('party-dialog-text');
        const liveEl = byId('party-dialog-live');
        const pageEl = byId('party-dialog-page');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';
        byId('party-count').textContent = `隊伍 ${teamData.length}／${teamData.length}`;
        dialog.setAttribute('aria-label', '對話，按一下看下一段');

        // 自我介紹切成對話框的頁：在標點後斷開，每頁最多約 60 字
        const toPages = (quote, bio) => {
            const pages = [quote];
            let cur = '';
            bio.split(/(?<=[。！？；，：])/).forEach(part => {
                if (cur && (cur + part).length > 60) { pages.push(cur); cur = ''; }
                cur += part;
            });
            if (cur) pages.push(cur);
            return pages;
        };

        let pages = [];
        let page = 0;
        let typing = null;
        let announce = false;
        const finishTyping = () => {
            if (typing) clearInterval(typing);
            typing = null;
            textEl.textContent = pages[page];
            dialog.classList.remove('is-typing');
        };
        const showPage = n => {
            page = n;
            const text = pages[page];
            pageEl.textContent = `${page + 1}／${pages.length}`;
            if (announce) liveEl.textContent = text;
            if (typing) clearInterval(typing);
            typing = null;
            if (reduceMotion.matches) { finishTyping(); return; }
            let i = 0;
            textEl.textContent = '';
            dialog.classList.add('is-typing');
            typing = setInterval(() => {
                i += 1;
                textEl.textContent = text.slice(0, i);
                if (i >= text.length) finishTyping();
            }, 35);
        };
        dialog.addEventListener('click', () => {
            announce = true;
            if (typing) finishTyping();
            else showPage((page + 1) % pages.length);
        });

        const rows = teamData.map((member, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'party-member';
            btn.setAttribute('role', 'option');
            btn.innerHTML = '<span class="party-avatar"><img alt="" loading="lazy"></span><span class="party-member-text"><b></b><span></span></span>';
            btn.querySelector('b').textContent = member.name;
            btn.querySelector('.party-member-text span').textContent = member.job;
            const img = btn.querySelector('img');
            // 照片還沒上傳時顯示「待補」，不顯示瀏覽器的裂圖示
            img.addEventListener('error', () => { img.parentElement.textContent = '待補'; }, { once: true });
            img.src = member.avatar;
            btn.addEventListener('click', () => showMember(i, true));
            btn.addEventListener('keydown', event => {
                const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
                let next = step === undefined ? null : i + step;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = teamData.length - 1;
                if (next === null) return;
                event.preventDefault();
                next = (next + teamData.length) % teamData.length;
                showMember(next, true);
                rows[next].focus();
            });
            listEl.appendChild(btn);
            return btn;
        });

        let active = -1;
        function showMember(index, fromUser) {
            if (index === active) return;
            const dir = index > active ? 1 : -1;
            active = index;
            const member = teamData[index];
            rows.forEach((row, i) => {
                const on = i === index;
                row.classList.toggle('is-active', on);
                row.setAttribute('aria-selected', String(on));
                row.tabIndex = on ? 0 : -1;
            });
            party.style.setProperty('--party-i', index);
            nameEl.textContent = member.name;
            jobEl.textContent = member.job;
            battleEl.textContent = member.battleRole;
            weaponEl.textContent = member.weapon;
            stageLabel.textContent = `MEMBER ${String(index + 1).padStart(2, '0')}`;
            speakerEl.textContent = member.name;
            announce = fromUser;
            pages = toPages(member.quote, member.bio);
            showPage(0);

            const animate = fromUser && !reduceMotion.matches;
            if (animate) {
                party.querySelectorAll('.party-name, .party-stats > div').forEach((el, k) => {
                    el.animate([{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }],
                        { duration: 360, delay: k * 70, easing: easeOut, fill: 'backwards' });
                });
            }
            // 立繪：先預載，失敗就顯示「照片準備中」
            const preload = new Image();
            preload.onload = () => {
                if (teamData[active] !== member) return;
                portraitEl.src = member.portrait;
                portraitEl.alt = `${member.name}立繪`;
                portraitEl.hidden = false;
                emptyEl.hidden = true;
                if (animate) {
                    portraitEl.animate([{ opacity: 0, translate: `${-24 * dir}px 0` }, { opacity: 1, translate: '0 0' }],
                        { duration: 420, easing: easeOut });
                }
            };
            preload.onerror = () => {
                if (teamData[active] !== member) return;
                portraitEl.hidden = true;
                emptyEl.hidden = false;
            };
            preload.src = member.portrait;
        }

        showMember(0, false);
    })();

    /* =========================================
       5. 產品區塊：一個產品一個滿版畫面
       ========================================= */
    async function showPineappleModel(stage) {
        const canvas = stage.querySelector('canvas');
        const status = stage.querySelector('[role="status"]');
        try {
            const setInteractive = await window.initPineappleModel(stage);
            canvas.hidden = false;
            status.hidden = true;
            return setInteractive;
        } catch (error) {
            status.textContent = '目前無法顯示 3D 模型';
            console.warn('鳳梨酥 3D 模型無法載入', error);
        }
    }

    (function initProductPanels() {
        const placeholder = document.getElementById('products-placeholder');
        if (!placeholder) return;
        const product = productsData['1'];
        const section = document.createElement('section');
        section.id = 'products';
        /* 2026-11-23 聖誕改版（設計稿 https://claude.ai/artifact/Mz1NPmJB4Duk2mnuZaVZrZ ）：
           整頁一張卡，照片當背景，卡上只放品名、規格、價格和兩個按鈕。
           成分、過敏原、注意事項和 3D 模型都在「商品詳情」彈窗（#product-modal）。 */
        section.className = 'fullscreen-section xcard xcard-photo dark-section';
        section.setAttribute('aria-labelledby', 'products-title');
        const unitPrice = parseInt(product.price.replace(/[^\d]/g, ''), 10) || 0;
        section.innerHTML = `
            <div class="xpanel">
            <div class="xcard-bg xcard-bg-product" aria-hidden="true"></div>
            <div class="xcard-body">
                <div class="xcard-copy">
                    <h2 class="xcard-title" id="products-title">手作土鳳梨酥</h2>
                    <p class="xcard-text">土鳳梨餡・法國奶油酥皮・10 入／盒</p>
                    <p class="xcard-price"><span>NT$</span><strong>${unitPrice.toLocaleString()}</strong></p>
                    <div class="xcard-actions">
                        <button type="button" class="xbtn xbtn-solid xcard-buy"><span class="xcard-buy-text">加入購物車</span></button>
                        <button type="button" class="xbtn xbtn-ghost xcard-detail">商品詳情</button>
                    </div>
                </div>
            </div>
            </div>`;
        const buyText = section.querySelector('.xcard-buy-text');
        section.querySelector('.xcard-buy').addEventListener('click', () => {
            if (typeof window.addItemToCart !== 'function') return;
            const added = window.addItemToCart({ productId: '1', name: product.name, price: unitPrice, qty: 1 });
            if (!added) return;
            buyText.textContent = '已加入！';
            setTimeout(() => { buyText.textContent = '加入購物車'; }, 1200);
        });
        section.querySelector('.xcard-detail').addEventListener('click', () => openProductModal('1'));
        placeholder.replaceWith(section);

        /* 桌機滑鼠移到產品照上，淡金光跟著游標走（CSS 在 style.css「知識庫靈感三項」）。
           只在有滑鼠的裝置綁定；用 rAF 節流，一個畫面最多寫一次。 */
        const photo = section.querySelector('.xcard-bg-product');
        if (photo && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            let glowFrame = 0;
            photo.addEventListener('pointermove', e => {
                if (glowFrame) return;
                glowFrame = requestAnimationFrame(() => {
                    const r = photo.getBoundingClientRect();
                    photo.style.setProperty('--gx', `${e.clientX - r.left}px`);
                    photo.style.setProperty('--gy', `${e.clientY - r.top}px`);
                    glowFrame = 0;
                });
            });
        }
    })();

    /* =========================================
       9. 螢幕四周 4 邊滾動進度條 (頂/右/底/左)
       ========================================= */
    const pTop = document.getElementById('scroll-progress-top');
    const pRight = document.getElementById('scroll-progress-right');
    const pBottom = document.getElementById('scroll-progress-bottom');
    const pLeft = document.getElementById('scroll-progress-left');

    // 真正在捲動的元素從 html 換成 body 了（見 style.css 開頭的說明，修
    // Safari 往上拖到底露白的問題），監聽對象跟著從 window 改成 body——
    // 'scroll' 事件不會從內層元素冒泡到 window，監聽 window 會完全收不到。
    //
    // 原本每次 scroll 事件都直接同步寫 4 個元素的 style.width/height，
    // scroll 事件一次手勢可以觸發幾十次、又跟 body 自己的
    // scroll-snap/-webkit-overflow-scrolling 平滑捲動搶主執行緒，造成
    // 捲動時明顯卡頓——改成用 requestAnimationFrame 節流，一個畫面週期
    // 最多算一次、所有變動一次寫完，不管 scroll 事件實際觸發幾次；
    // { passive: true } 讓瀏覽器不用等這段 JS 執行完就能先開始捲動
    let scrollProgressTicking = false;
    document.body.addEventListener('scroll', () => {
        if (scrollProgressTicking) return;
        scrollProgressTicking = true;

        requestAnimationFrame(() => {
            const winScroll = document.body.scrollTop;
            const height = document.body.scrollHeight - document.body.clientHeight;
            // CSS 現在用 transform: scale() 畫進度條（不再是 width/height），
            // scale 吃 0-1 的倍率，不是百分比，所以這裡除以 100 換算
            const scrolled = winScroll / height;

            if (pTop) pTop.style.transform = `scaleX(${scrolled})`;
            if (pRight) pRight.style.transform = `scaleY(${scrolled})`;
            if (pBottom) pBottom.style.transform = `scaleX(${scrolled})`;
            if (pLeft) pLeft.style.transform = `scaleY(${scrolled})`;

            scrollProgressTicking = false;
        });
    }, { passive: true });

    /* =========================================
       10. 果凍彈跳式頁面浮現 (徹底解決閃爍問題)
       ========================================= */
    const revealElements = document.querySelectorAll('.reveal-element, .reveal-fade, .reveal-slide-left, .reveal-slide-right, .reveal-zoom, .reveal-sheen');
    const REVEAL_BASE_DELAY = 200; // 滿版吸附會讓區塊瞬間跳出來，延遲一下再播動畫才看得到
    const revealTimers = new WeakMap();

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            const pendingTimer = revealTimers.get(el);
            if (pendingTimer) clearTimeout(pendingTimer);

            if (entry.isIntersecting) {
                const stagger = parseFloat(el.dataset.revealDelay || '0') * 1000;
                revealTimers.set(el, setTimeout(() => {
                    el.classList.add('reveal-active');
                }, REVEAL_BASE_DELAY + stagger));
            } else {
                // 離開畫面就重置，捲回來時可以再播一次
                el.classList.remove('reveal-active');
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0
    });

    revealElements.forEach(el => revealObserver.observe(el));

    /* 電玩感「獲得道具」：加入購物車成功時，畫面上方跳出 RPG 小視窗（js/member.js 呼叫） */
    (function initItemGet() {
        let box = null;
        let hideTimer = null;
        window.showItemGet = (name, qty) => {
            if (!box) {
                box = document.createElement('div');
                box.className = 'item-get rpg-window';
                box.setAttribute('role', 'status');
                box.innerHTML = '<span class="item-get-icon" aria-hidden="true"><span></span></span><span class="item-get-text"><span class="item-get-label">獲得了</span><b></b></span>';
                document.body.appendChild(box);
            }
            box.querySelector('b').textContent = `${name} ×${qty}`;
            box.classList.remove('is-shown');
            void box.offsetWidth;
            box.classList.add('is-shown');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => box.classList.remove('is-shown'), 2400);
        };
    })();

    /* 送出訂單後：收據從黑色出單機「印」出來（js/member.js 呼叫，取代原本的 alert）。
       匯款資訊直接讀結帳彈窗裡的同一份文字，不另外寫死。網址加 ?receipt=1 可預覽。 */
    (function initOrderReceipt() {
        const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const pad = n => String(n).padStart(2, '0');
        const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
        let overlay = null;
        let lastFocus = null;
        let hideTimer = null;

        function paymentLines() {
            return [...document.querySelectorAll('.checkout-payment-row')].map(row => {
                const label = row.querySelector('.checkout-payment-label');
                const value = row.querySelector('#checkout-payment-account-num') || row.querySelector('.checkout-payment-value');
                return label && value ? [label.textContent.trim(), value.textContent.trim()] : null;
            }).filter(Boolean);
        }

        function close() {
            if (!overlay) return;
            overlay.classList.remove('is-open');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                if (!overlay.classList.contains('is-open')) overlay.hidden = true;
            }, 260);
            document.removeEventListener('keydown', onKey);
            if (lastFocus) lastFocus.focus();
        }
        function onKey(e) { if (e.key === 'Escape') close(); }

        window.showOrderReceipt = ({ items = [], subtotal = 0, pickupDate = '', customerName = '' } = {}) => {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'receipt-overlay';
                overlay.setAttribute('role', 'dialog');
                overlay.setAttribute('aria-modal', 'true');
                overlay.setAttribute('aria-labelledby', 'receipt-title');
                document.body.appendChild(overlay);
                overlay.addEventListener('click', e => {
                    if (e.target === overlay || e.target.closest('.receipt-done')) close();
                });
            }
            const now = new Date();
            const pick = pickupDate ? new Date(pickupDate + 'T00:00:00') : null;
            const pickText = pick ? `${pick.getFullYear()}.${pad(pick.getMonth() + 1)}.${pad(pick.getDate())}（${WEEK[pick.getDay()]}）` : '—';
            const no = `CD${now.getFullYear() % 100}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
            const rows = items.map(it => `<li><span>${esc(it.name)} <em>×${esc(it.qty)}</em></span><span>NT$ ${esc(it.price * it.qty)}</span></li>`).join('');
            const pay = paymentLines().map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');

            overlay.innerHTML = `
                <div class="receipt-stage">
                    <div class="receipt-printer" aria-hidden="true"><span class="receipt-printer-led"></span><span class="receipt-printer-name">ORDER PRINTER</span></div>
                    <div class="receipt-clip">
                        <div class="receipt-paper">
                            <p class="receipt-brand">PROJECT.CD</p>
                            <p class="receipt-tagline">一個人的甜點研究室</p>
                            <h2 class="receipt-title" id="receipt-title">訂單已送出</h2>
                            <p class="receipt-meta"><span>NO. ${no}</span><span>${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}</span></p>
                            <ul class="receipt-items">${rows}</ul>
                            <p class="receipt-total"><span>小計</span><span>NT$ ${esc(subtotal)}</span></p>
                            <dl class="receipt-info">
                                <div><dt>取貨日</dt><dd>${pickText}</dd></div>
                                ${customerName ? `<div><dt>訂購人</dt><dd>${esc(customerName)}</dd></div>` : ''}
                                ${pay}
                            </dl>
                            <p class="receipt-note">請依上方帳戶完成匯款；確認款項後，出貨前會透過 LINE 提供取貨資訊。</p>
                            <p class="receipt-thanks">THANK YOU</p>
                        </div>
                    </div>
                    <button type="button" class="receipt-done">完成</button>
                </div>`;

            lastFocus = document.activeElement;
            clearTimeout(hideTimer);
            overlay.classList.remove('is-open');
            overlay.hidden = false;
            void overlay.offsetWidth;
            overlay.classList.add('is-open');
            overlay.querySelector('.receipt-done').focus({ preventScroll: true });
            document.addEventListener('keydown', onKey);
        };

        if (new URLSearchParams(location.search).has('receipt')) {
            const d = new Date(); d.setDate(d.getDate() + 6);
            if (d.getDay() === 1) d.setDate(d.getDate() + 1);
            window.addEventListener('load', () => setTimeout(() => window.showOrderReceipt({
                items: [{ name: '經典鳳梨酥', qty: 2, price: 360 }, { name: '鳳梨酥禮盒', qty: 1, price: 680 }],
                subtotal: 1400,
                pickupDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
                customerName: '預覽顧客'
            }), 600));
        }
    })();

    /* =========================================
       每個頁面的進場編排（2026-11）
       每一頁列出「依閱讀順序」要浮上來的元素；頁面捲進畫面 35% 時加上
       .is-inview，CSS 依 --enter-i 一個接一個播。離開畫面就重置，捲回來再播一次。
       這裡只管進場動畫，導覽列高亮與 LOGO 深淺仍只由 navObserver 決定。
       ========================================= */
    (function initSectionEntrances() {
        const plans = [
            ['#products', ['.xcard-title', '.xcard-text', '.xcard-price', '.xcard-actions']],
            ['#brand', ['.xcard-title', '.xcard-text', '.xcard-actions', '.xcard-facts li']],
            ['#shop', ['.xcard-title', '.xcard-text', '.xcard-list li', '.xcard-actions', '.xcard-note']],
            ['.site-footer', [
                '.site-footer-brand', '.site-footer-col', '.site-footer-social', '.site-footer-bottom'
            ]]
        ];
        const scopes = new Set();
        plans.forEach(([scopeSel, steps]) => {
            const scope = document.querySelector(scopeSel);
            if (!scope) return;
            scopes.add(scope);
            let i = 0;
            steps.forEach(step => {
                const [sel, variant] = Array.isArray(step) ? step : [step, null];
                scope.querySelectorAll(sel).forEach(el => {
                    el.classList.add('enter');
                    if (variant) el.classList.add(variant);
                    el.style.setProperty('--enter-i', Math.min(i++, 12));
                });
            });
        });
        const entranceObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.2) entry.target.classList.add('is-inview');
                else if (!entry.isIntersecting) entry.target.classList.remove('is-inview');
            });
        }, { threshold: [0, 0.2] });
        scopes.forEach(scope => entranceObserver.observe(scope));
    })();

    /* =========================================
       11. Scrollspy 導覽列滾動自動高亮
       ========================================= */
    const sections = document.querySelectorAll('header[id], section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const sectionDotsEl = document.getElementById('section-dots');
    const sectionDots = document.querySelectorAll('.section-dot');
    const sectionIndexEl = document.getElementById('section-index');
    const sectionIndexCurrent = document.getElementById('section-index-current');
    // 總頁數跟著右側小圓點數量自動計算，新增或移除章節時不用再手動改數字
    const sectionIndexTotal = document.getElementById('section-index-total');
    const sectionIndexName = document.getElementById('section-index-name');
    if (sectionIndexTotal) sectionIndexTotal.textContent = String(sectionDots.length).padStart(2, '0');

    const observerOptions = {
        root: null,
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 有些滿版區塊（例如品牌介紹）沒有自己的導覽列項目，用 data-nav-group 歸類到既有項目底下
                const currentId = entry.target.dataset.navGroup || entry.target.getAttribute('id');
                const isDark = entry.target.classList.contains('dark-section');

                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const isActive = href === `#${currentId}`;
                    link.classList.toggle('active', isActive);
                });

                sectionDots.forEach(dot => {
                    dot.classList.toggle('active', dot.dataset.target === currentId);
                });

                if (sectionDotsEl) {
                    sectionDotsEl.classList.toggle('on-dark', isDark);
                }

                // 左側頁碼標籤：跟右側小圓點共用同一個 currentId／isDark 判斷，
                // 兩邊才會同步切換，不會有時間差造成的不一致
                if (sectionIndexCurrent) {
                    const dotIndex = Array.from(sectionDots).findIndex(dot => dot.dataset.target === currentId);
                    if (dotIndex !== -1) {
                        const nextNum = String(dotIndex + 1).padStart(2, '0');
                        // 電玩感 HUD：換關時數字從下往上翻上來，關卡名稱跟著換
                        if (sectionIndexCurrent.textContent !== nextNum) {
                            sectionIndexCurrent.textContent = nextNum;
                            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                                sectionIndexCurrent.animate([{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: '0 0' }],
                                    { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
                            }
                        }
                        if (sectionIndexName) sectionIndexName.textContent = sectionDots[dotIndex].getAttribute('aria-label') || '';
                    }
                }

                if (sectionIndexEl) {
                    sectionIndexEl.classList.toggle('on-dark', isDark);
                }

                // 導覽列深淺色也交給同一個observer驅動，不再靠scroll事件手動算位置
                navbar.classList.toggle('on-dark', isDark);
            }
        });
    }, observerOptions);

    sections.forEach(section => navObserver.observe(section));

    /* =========================================
       12b. 聯繫彈窗開關（原本是頁面上滾動得到的區塊，改成點導覽列聯繫圖示才彈出）
       ========================================= */
    const contactModal = document.getElementById('contact-modal');
    const contactModalClose = document.getElementById('contact-modal-close');
    const contactTrigger = document.getElementById('nav-btn-contact');

    if (contactModal && contactModalClose && contactTrigger) {
        contactTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(contactModal);
        });

        contactModalClose.addEventListener('click', () => closeModal(contactModal));
    }

    /* =========================================
       12c. 常見問題彈窗開關（原本是頁面上滾動得到的區塊，改成點頁尾連結才彈出）
       ========================================= */
    const faqModal = document.getElementById('faq-modal');
    const faqModalClose = document.getElementById('faq-modal-close');
    const footerLinkFaq = document.getElementById('footer-link-faq');

    if (faqModal && faqModalClose && footerLinkFaq) {
        footerLinkFaq.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(faqModal);
        });

        faqModalClose.addEventListener('click', () => closeModal(faqModal));
    }

    /* =========================================
       13. 聯繫表單發送成功互動反饋
       ========================================= */
    const contactForm = document.getElementById('contact-form');
    const btnSubmit = document.getElementById('btn-contact-submit');

    if (contactForm && btnSubmit) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const originalHTML = btnSubmit.innerHTML;

            btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>傳送中...</span>`;
            btnSubmit.disabled = true;

            fetch(contactForm.action, {
                method: contactForm.method,
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            })
                .then(response => {
                    if (!response.ok) throw new Error('submit failed');
                    btnSubmit.innerHTML = `<i class="fa-solid fa-check"></i> <span>發送成功！</span>`;
                    btnSubmit.style.backgroundColor = '#1F5C23';
                    btnSubmit.style.color = '#ffffff';
                    contactForm.reset();
                })
                .catch(() => {
                    btnSubmit.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>發送失敗，請稍後再試</span>`;
                    btnSubmit.style.backgroundColor = '#B30000';
                    btnSubmit.style.color = '#ffffff';
                })
                .finally(() => {
                    setTimeout(() => {
                        btnSubmit.innerHTML = originalHTML;
                        btnSubmit.style.backgroundColor = '';
                        btnSubmit.style.color = '';
                        btnSubmit.disabled = false;
                    }, 2500);
                });
        });
    }

    /* =========================================
       13b. 購物車未登入引導畫面的貓咪插畫，還沒上傳時的優雅預留樣式
       ========================================= */
    const cartLoginGateCatImg = document.getElementById('cart-login-gate-cat-img');
    if (cartLoginGateCatImg) {
        // 這張是寫死在 HTML 裡的靜態 <img>，瀏覽器在 parse 到這個標籤時就會立刻開始
        // 抓取，很可能在這支 script 執行以前就已經抓取失敗、error 事件已經錯過了——
        // 跟其他張用 JS 動態塞 innerHTML 才設 src 的圖片（監聽器一定先掛好）不同，
        // 這裡要先補判斷 complete + naturalWidth===0（已經載入失敗過的訊號），
        // 不能只靠 addEventListener('error', ...) 賭監聽器掛的時機夠早
        const markFallback = () => cartLoginGateCatImg.parentElement.classList.add('img-fallback');
        if (cartLoginGateCatImg.complete && cartLoginGateCatImg.naturalWidth === 0) {
            markFallback();
        } else {
            cartLoginGateCatImg.addEventListener('error', markFallback, { once: true });
        }
    }

    /* =========================================
       14. Modal 無障礙輔助 (焦點管理 + Tab 循環鎖定)
       ========================================= */
    let lastFocusedBeforeModal = null;

    function getFocusableElements(container) {
        return Array.from(container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ));
    }

    // 彈窗開著時鎖住背景頁面的捲動——手機版彈窗是 fixed 疊層，背景本身仍是可捲動的長頁面，
    // 沒鎖住的話背景會透出一條頁面捲軸，使用者也能在彈窗打開時把背景拖動捲走。
    // 用 Set 記錄目前開著的彈窗而不是單純計數器，是因為有些流程會疊兩層彈窗
    // （例如商品彈窗開著時再跳出登入彈窗），用 Set 才不會因為開關順序不對稱而讓計數器對不齊
    const openModals = new Set();

    function syncBodyScrollLock() {
        document.body.style.overflow = openModals.size > 0 ? 'hidden' : '';
    }

    function openModal(modal) {
        lastFocusedBeforeModal = document.activeElement;
        modal.removeAttribute('inert');
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('active');
        openModals.add(modal);
        syncBodyScrollLock();
        const focusable = getFocusableElements(modal);
        (focusable[0] || modal).focus();
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('inert', '');
        openModals.delete(modal);
        syncBodyScrollLock();
        if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
    }

    // 讓 js/member.js（會員登入、購物車、結帳彈窗）可以共用同一套開關/焦點管理邏輯，不用重複寫一份
    window.openModal = openModal;
    window.closeModal = closeModal;

    // 品牌卡的「認識團隊」：打開 RPG 隊伍選單彈窗（2026-11-23 聖誕改版從品牌區搬過來）
    const teamModal = document.getElementById('team-modal');
    const teamOpen = document.getElementById('brand-team-open');
    if (teamModal && teamOpen) {
        teamOpen.addEventListener('click', () => {
            openModal(teamModal);
            window.dispatchEvent(new Event('resize'));
        });
        document.getElementById('team-modal-close').addEventListener('click', () => closeModal(teamModal));
    }

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            const focusable = getFocusableElements(modal);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    });

    /* =========================================
       15. 顧客服務條款彈窗 (Policy Modal)
       ========================================= */
    const policyModal = document.getElementById('policy-modal');
    const policyModalClose = document.getElementById('policy-modal-close');
    const policyTitle = document.getElementById('policy-modal-title');
    const policyBody = document.getElementById('policy-modal-body');
    const policyLinks = document.querySelectorAll('.policy-link');

    const policyData = {
        shipping: {
            title: "取貨與保存須知",
            content: `
                <p><strong>1. 付款與取貨：</strong>官網訂單一律採匯款付款；確認款項後寄到超商，出貨前會透過 LINE 提供取貨資訊。</p>
                <p><strong>2. 取貨日期：</strong>下單時可以指定取貨日期，最早為下單後 5 天；每週一公休，不提供週一取貨。</p>
                <p><strong>3. 保存方式：</strong>甜點為新鮮手工現做、無添加防腐劑，取貨後請盡快冷藏，並於期限內享用完畢。</p>
            `
        },
        returns: {
            title: "退換貨政策",
            content: `
                <p><strong>1. 食品類別聲明：</strong>依據消費者保護法規定，烘焙食品屬易於腐敗、保存期限較短之商品，不適用 7 天鑑賞期。</p>
                <p><strong>2. 瑕疵退換：</strong>若您收到的商品有嚴重毀損、變質或品項不符，請於收到商品 2 小時內拍照留存，並透過官方管道聯繫我們，我們將立即為您辦理退換作業。</p>
            `
        },
        privacy: {
            title: "隱私權政策",
            content: `
                <p><strong>1. 資料蒐集：</strong>我們僅會於訂購、配送及客戶服務之必要範圍內，蒐集您的姓名、電話、地址與 Email。</p>
                <p><strong>2. 資料保護：</strong>Project.CD 絕不向第三方出售、出租或交換您的個人隱私資料，請安心購物。</p>
            `
        },
        terms: {
            title: "服務條款",
            content: `
                <p><strong>1. 帳號使用：</strong>會員帳號僅供本人使用，請妥善保管您的登入<span style="white-space: nowrap;">密碼</span>，因帳號外洩所生之損害由使用者自行負責。</p>
                <p><strong>2. 訂購流程：</strong>官網會員訂購為現做商品，取貨日期需至少於下單後 5 個工作天，並不提供週一取貨；送出訂單即表示同意上述取貨時程安排。</p>
                <p><strong>3. 條款修訂：</strong>我們得因應營運需要修訂本條款，修訂後將公告於本頁面，請留意最新版本內容。</p>
            `
        }
    };

    // 常見問題彈窗裡的服務條款區塊固定顯示同一份內容（不像 policy-modal 要依點擊的連結
    // 切換），直接用上面 policyData.terms 填一次即可，不用等使用者點擊才填
    const faqTermsBody = document.getElementById('faq-terms-body');
    if (faqTermsBody) {
        faqTermsBody.innerHTML = policyData.terms.content;
    }

    policyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const type = link.getAttribute('data-policy');
            if (policyData[type]) {
                policyTitle.textContent = policyData[type].title;
                policyBody.innerHTML = policyData[type].content;
                openModal(policyModal);
            }
        });
    });

    policyModalClose.addEventListener('click', () => {
        closeModal(policyModal);
    });

    /* =========================================
       16. 產品多圖彈窗 (Product Gallery Modal - 支持 6 張縮圖)
       ========================================= */
    const productModal = document.getElementById('product-modal');
    const productModalClose = document.getElementById('product-modal-close');
    const modalModelStage = productModal.querySelector('.pineapple-model-stage');
    let modalModelRequested = false;
    const modalTitle = document.getElementById('product-modal-title');
    const modalPrice = document.getElementById('product-modal-price');
    const modalQty = document.getElementById('product-modal-qty');
    const modalDesc = document.getElementById('product-modal-desc');
    const modalIngredients = document.getElementById('product-modal-ingredients');
    const modalAllergen = document.getElementById('product-modal-allergen-text');
    const modalNoticeList = document.getElementById('product-modal-notice-list');
    const modalCta = document.getElementById('product-modal-cta');

    // 成分改用 icon 徽章：每個成分各自一顆膠囊，跟 .product-modal-meta .qty
    // 那顆「10入/盒」份量徽章同一套視覺語言（淺灰底、20px 圓角），圖示依
    // ingredientIcons 對照表逐一挑對應的圖示，查不到的退回 defaultIngredientIcon
    function setProductModalIngredients(items) {
        modalIngredients.innerHTML = '';
        items.forEach(text => {
            const badge = document.createElement('span');
            badge.className = 'ingredient-badge';
            const icon = document.createElement('i');
            icon.className = 'fa-solid ' + (ingredientIcons[text] || defaultIngredientIcon);
            icon.setAttribute('aria-hidden', 'true');
            badge.appendChild(icon);
            badge.appendChild(document.createTextNode(text));
            modalIngredients.appendChild(badge);
        });
    }

    // 注意事項改條列式：過敏原那條 <li> 固定寫在 HTML 裡不用重建，這裡只
    // 負責清掉舊商品留下的其餘列點、依新商品的 notices 陣列補上新的
    function setProductModalNotices(notices) {
        modalNoticeList.querySelectorAll('.product-modal-notice-item').forEach(li => li.remove());
        notices.forEach(text => {
            const li = document.createElement('li');
            li.className = 'product-modal-notice-item';
            li.textContent = text;
            modalNoticeList.appendChild(li);
        });
    }

    // 分段控制器：產品介紹／注意事項同時間只顯示一個面板，取代
    // 原本文字全部攤開的做法（見 CSS 的 .product-modal-tabs 說明）
    const productModalTabs = document.querySelectorAll('.product-modal-tab');
    const productModalPanels = document.querySelectorAll('.product-modal-tab-panel');

    function setProductModalTab(panelName) {
        productModalTabs.forEach(tab => {
            const isActive = tab.dataset.panel === panelName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        productModalPanels.forEach(panel => {
            panel.hidden = panel.id !== `product-modal-panel-${panelName}`;
        });
    }

    productModalTabs.forEach(tab => {
        tab.addEventListener('click', () => setProductModalTab(tab.dataset.panel));
    });

    function openProductModal(productId) {
        const data = productsData[productId];
        if (!data) return;

        // 記錄目前開啟的商品 id，供 js/member.js 的「加入購物車」功能讀取
        productModal.dataset.productId = productId;
        // 單價存成純數字放進 dataset，供 js/member.js 的數量+/-即時換算小計、
        // 以及「進入匯款資訊」寫入購物車時讀取——不要反過來從畫面上已經格式化
        // 好的 modalPrice.textContent 去 parse，那個欄位之後會顯示「單價×數量」
        // 的小計，不再是單價本身
        productModal.dataset.unitPrice = parseInt(data.price.replace(/[^\d]/g, ''), 10) || 0;

        modalTitle.textContent = data.name;
        modalPrice.textContent = data.price;
        modalQty.textContent = data.qty;
        modalDesc.textContent = data.desc;
        setProductModalIngredients(data.ingredients);
        modalAllergen.textContent = `本產品含${data.allergens}，不適合對其過敏體質者食用`;
        setProductModalNotices(data.notice);

        setProductModalTab('desc');
        openModal(productModal);
        if (!modalModelRequested) {
            modalModelRequested = true;
            showPineappleModel(modalModelStage);
        }
    }

    productModalClose.addEventListener('click', () => {
        closeModal(productModal);
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                if (modal.classList.contains('active')) closeModal(modal);
            });
        }
    });

    if (modalCta) {
        modalCta.addEventListener('click', () => {
            closeModal(productModal);
            openModal(document.getElementById('cart-modal'));
        });
    }

    /* =========================================
       17. 密碼欄「顯示/隱藏」切換（登入、註冊表單共用）
       ========================================= */
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;

        btn.addEventListener('click', () => {
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            btn.setAttribute('aria-pressed', String(!showing));
            btn.setAttribute('aria-label', showing ? '顯示密碼' : '隱藏密碼');
            btn.querySelector('i').className = showing ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    });

    /* =========================================
       18. 自訂生日日期選擇器（取代原生 <input type="date">，
       原生彈出視窗是系統畫的，沒辦法套用網站自己的黑白風格，全部自己刻）
       只收「月/日」不收出生年——生日欄位這裡只拿來做生日當月/當天發優惠用，
       不需要完整出生年份，收越少個資越好。月曆版面計算固定套用 2024（閏年）
       當參照年份，這樣 2/29 才選得到，但完全不會存進資料或顯示出來 */
    /* 拆成可重用的 factory——原本只有註冊表單用，現在會員彈窗編輯生日也要用同一套月曆，
       不想複製貼上兩份幾乎一樣的邏輯。ids 指定這個實例要抓哪組 DOM 元素，
       onSelect 是選好日期（或按「清除」）後的回呼，拿到 'MM-DD' 或空字串 */
    function createBirthdayPicker(ids, onSelect) {
        const wrap = document.getElementById(ids.wrap);
        if (!wrap) return null;

        const trigger = document.getElementById(ids.trigger);
        const display = document.getElementById(ids.display);
        const hiddenInput = document.getElementById(ids.hidden);
        const panel = document.getElementById(ids.panel);
        const label = document.getElementById(ids.label);
        const grid = document.getElementById(ids.grid);
        const btnClear = document.getElementById(ids.clear);
        const btnToday = document.getElementById(ids.today);

        const LEAP_REF_YEAR = 2024; // 只用來算月曆格子，不會存進資料
        const today = new Date();
        let viewMonth = today.getMonth(); // 0-11
        let selected = null; // { month, day }

        function pad(n) { return String(n).padStart(2, '0'); }

        function updateTrigger(skipNotify) {
            if (selected) {
                display.textContent = `${pad(selected.month + 1)} / ${pad(selected.day)}`;
                trigger.classList.add('has-value');
                hiddenInput.value = `${pad(selected.month + 1)}-${pad(selected.day)}`;
            } else {
                display.textContent = '月 / 日';
                trigger.classList.remove('has-value');
                hiddenInput.value = '';
            }
            if (!skipNotify && onSelect) onSelect(hiddenInput.value);
        }

        function daysInMonth(month) {
            return new Date(LEAP_REF_YEAR, month + 1, 0).getDate();
        }

        function render() {
            label.textContent = `${pad(viewMonth + 1)} 月`;

            const firstWeekday = new Date(LEAP_REF_YEAR, viewMonth, 1).getDay();
            const total = daysInMonth(viewMonth);
            const prevTotal = daysInMonth(viewMonth - 1 < 0 ? 11 : viewMonth - 1);

            let html = '';
            for (let i = firstWeekday - 1; i >= 0; i--) {
                html += `<button type="button" class="date-picker-day outside" disabled>${prevTotal - i}</button>`;
            }
            for (let d = 1; d <= total; d++) {
                const isSelected = selected && selected.month === viewMonth && selected.day === d;
                const isToday = today.getMonth() === viewMonth && today.getDate() === d;
                html += `<button type="button" class="date-picker-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}" data-day="${d}">${d}</button>`;
            }
            const remainder = (firstWeekday + total) % 7;
            const trailing = remainder === 0 ? 0 : 7 - remainder;
            for (let d = 1; d <= trailing; d++) {
                html += `<button type="button" class="date-picker-day outside" disabled>${d}</button>`;
            }
            grid.innerHTML = html;

            grid.querySelectorAll('.date-picker-day[data-day]').forEach(btn => {
                btn.addEventListener('click', () => {
                    selected = { month: viewMonth, day: parseInt(btn.dataset.day, 10) };
                    updateTrigger();
                    closePanel();
                });
            });
        }

        function openPanel() {
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            if (selected) { viewMonth = selected.month; }
            render();
        }

        function closePanel() {
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', () => {
            if (panel.hidden) openPanel();
            else closePanel();
        });

        wrap.querySelector('[data-nav="prev"]').addEventListener('click', () => {
            viewMonth--;
            if (viewMonth < 0) { viewMonth = 11; }
            render();
        });

        wrap.querySelector('[data-nav="next"]').addEventListener('click', () => {
            viewMonth++;
            if (viewMonth > 11) { viewMonth = 0; }
            render();
        });

        btnClear.addEventListener('click', () => {
            selected = null;
            updateTrigger();
            closePanel();
        });

        btnToday.addEventListener('click', () => {
            viewMonth = today.getMonth();
            render();
        });

        document.addEventListener('click', (e) => {
            if (!panel.hidden && !wrap.contains(e.target)) closePanel();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !panel.hidden) closePanel();
        });

        updateTrigger(true);

        return {
            // 從外部（例如 Firestore 讀回來的資料）設定目前選到的日期，不觸發 onSelect，
            // 不然一開啟會員彈窗、資料一填入，就會誤觸發一次「寫回資料庫」
            setValue(value) {
                if (value && typeof value === 'string') {
                    const parts = value.split('-');
                    const m = parseInt(parts.length === 3 ? parts[1] : parts[0], 10);
                    const d = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);
                    selected = (m >= 1 && m <= 12 && d >= 1) ? { month: m - 1, day: d } : null;
                } else {
                    selected = null;
                }
                updateTrigger(true);
            }
        };
    }

    window.createBirthdayPicker = createBirthdayPicker;

    createBirthdayPicker({
        wrap: 'signup-birthday-wrap',
        trigger: 'signup-birthday-trigger',
        display: 'signup-birthday-display',
        hidden: 'signup-birthday',
        panel: 'signup-birthday-panel',
        label: 'signup-birthday-label',
        grid: 'signup-birthday-grid',
        clear: 'signup-birthday-clear',
        today: 'signup-birthday-today'
    });

    /* =========================================
       自訂下拉選單（取代 <select>，原生彈出視窗是系統畫的，
       跟生日日期選擇器同一個理由，CSS 改不了顏色/字型）
       ========================================= */
    function createCustomSelect(ids) {
        const wrap = document.getElementById(ids.wrap);
        if (!wrap) return null;

        const trigger = document.getElementById(ids.trigger);
        const display = document.getElementById(ids.display);
        const hiddenInput = document.getElementById(ids.hidden);
        const panel = document.getElementById(ids.panel);
        const options = Array.from(panel.querySelectorAll('.custom-select-option'));

        function openPanel() {
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
        }

        function closePanel() {
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
        }

        function selectOption(opt, skipNotify) {
            options.forEach(o => {
                o.classList.remove('selected');
                o.setAttribute('aria-selected', 'false');
            });
            opt.classList.add('selected');
            opt.setAttribute('aria-selected', 'true');
            hiddenInput.value = opt.dataset.value;
            display.textContent = opt.textContent;
            trigger.classList.toggle('has-value', !!opt.dataset.value);
            closePanel();
            if (!skipNotify) hiddenInput.dispatchEvent(new Event('change'));
        }

        trigger.addEventListener('click', () => {
            if (panel.hidden) openPanel();
            else closePanel();
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => selectOption(opt));
        });

        document.addEventListener('click', (e) => {
            if (!panel.hidden && !wrap.contains(e.target)) closePanel();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !panel.hidden) closePanel();
        });

        return {
            setValue(value) {
                const opt = options.find(o => o.dataset.value === (value || '')) || options[0];
                if (opt) selectOption(opt, true);
            }
        };
    }

    createCustomSelect({
        wrap: 'signup-store-wrap',
        trigger: 'signup-store-trigger',
        display: 'signup-store-display',
        hidden: 'signup-store',
        panel: 'signup-store-panel'
    });
});
// 使用既有 scrollspy 的 active 狀態同步浮鈕，彈窗關閉時回到目前章節。
document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('nav-links');
    if (!bar) return;
    const tabs = [...bar.querySelectorAll('a, button')].filter(tab => !tab.closest('.nav-brand-tab'));
    // 同一套 24px 線條圖示，直接使用 SVG，避免字型未載入時顯示英文名稱。
    const mobileIcons = [
        "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" />\n  <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />",
        "<path d=\"M4 20V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13M3 20h18\"/><path d=\"M4 11c3-4 5 4 8 0s5 4 8 0\"/>",
        "<path d=\"M3 9h18l-3-6H6ZM5 9v12h14V9M10 21v-7h4v7\"/>",
        "<rect x=\"4\" y=\"7\" width=\"16\" height=\"14\" rx=\"2\"/><path d=\"M8 7V6a4 4 0 0 1 8 0v1\"/>",
        "<circle cx=\"12\" cy=\"8\" r=\"5\" />\n  <path d=\"M20 21a8 8 0 0 0-16 0\" />"
];
    let selected = null;
    let notchWidth = bar.getBoundingClientRect().width;
    let shapeWidth = 0;
    /* 2026-11-23 手機分頁列卡頓修正：
       以前凹槽動畫每一格都重畫一張 SVG 當遮罩，手機每格都要重新解碼圖片，
       會卡、還會閃一格空白底板。現在只在寬度改變時畫「一張兩倍寬、凹槽在正中間」的底板，
       切換時只改 --nav-notch-offset，讓 CSS 用 mask-position 滑過去。 */
    const buildShape = () => {
        const width = notchWidth;
        if (!width || width === shapeWidth) return;
        shapeWidth = width;
        const w2 = width * 2;
        const c = width;
        // 圓鈕半徑 26px，凹槽半徑 34px；同心圓弧維持 8px 間距。四角圓角交給 CSS border-radius。
        const path = `M0 0 H${c - 46} C${c - 38} 0 ${c - 33.41} 7.63 ${c - 31.95} 11.63 A34 34 0 0 0 ${c + 31.95} 11.63 C${c + 33.41} 7.63 ${c + 38} 0 ${c + 46} 0 H${w2} V76 H0 Z`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w2}" height="76" viewBox="0 0 ${w2} 76"><path d="${path}" fill="white"/></svg>`;
        bar.style.setProperty('--nav-shape', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
        bar.style.setProperty('--nav-shape-w', `${w2}px`);
    };
    const drawNotch = (percent, instant = false) => {
        if (window.innerWidth > 1024) return;
        bar.style.setProperty('--nav-notch-x', `${percent}%`);
        buildShape();
        if (!notchWidth) return;
        if (instant) bar.classList.add('notch-instant');
        bar.style.setProperty('--nav-notch-offset', `${notchWidth * percent / 100 - notchWidth}px`);
        if (instant) requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.remove('notch-instant')));
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    tabs.forEach((tab, index) => {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.classList.add('mobile-tab-svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '2.25');
        icon.setAttribute('stroke-linecap', 'round');
        icon.setAttribute('stroke-linejoin', 'round');
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = mobileIcons[index];
        tab.appendChild(icon);
    });
    const select = (tab, animate = true) => {
        if (!tab || tab === selected) return;
        selected = tab;
        tabs.forEach(item => item.classList.toggle('mobile-tab-selected', item === tab));
        const index = tabs.indexOf(tab);
        drawNotch((index + 0.5) * 20, !animate || reduced.matches);
    };
    const activeSection = () => tabs.find(tab => tab.matches('a.active')) || tabs[1];
    /* 點分頁後頁面會平滑捲過中間的章節，捲動途中不要讓圓鈕一站一站停（之前會跳 首頁→產品→商城），
       先鎖在點的那一格，捲動停下來後再對回實際所在章節。 */
    let travelLock = null;
    let travelTimer;
    let travelFailsafe;
    const releaseTravel = () => {
        if (!travelLock) return;
        travelLock = null;
        clearTimeout(travelTimer);
        clearTimeout(travelFailsafe);
        window.removeEventListener('scroll', onTravelScroll, true);
        if (!document.querySelector('#cart-modal.active, #account-modal.active, #auth-modal.active')) select(activeSection());
    };
    let travelTarget = null;
    const onTravelScroll = () => {
        clearTimeout(travelTimer);
        // 捲到目標那一頁（scroll-snap 會停在頂端）而且停下來，才解鎖
        travelTimer = setTimeout(() => {
            if (!travelTarget || Math.abs(travelTarget.getBoundingClientRect().top) < 4) releaseTravel();
        }, 160);
    };
    tabs.forEach(tab => tab.addEventListener('click', () => {
        select(tab);
        const target = tab.matches('a[href^="#"]') && document.querySelector(tab.getAttribute('href'));
        // 已經在那一頁就不用鎖
        if (!target || Math.abs(target.getBoundingClientRect().top) < 4) return;
        travelLock = tab;
        travelTarget = target;
        window.addEventListener('scroll', onTravelScroll, true);
        clearTimeout(travelTimer);
        clearTimeout(travelFailsafe);
        // 等捲動真的開始、停下來 160ms 後才解鎖；萬一完全沒捲動，2.5 秒後保底解鎖
        travelFailsafe = setTimeout(releaseTravel, 2500);
    }));
    new MutationObserver(records => {
        if (travelLock) return;
        if (document.querySelector('#cart-modal.active, #account-modal.active, #auth-modal.active')) return;
        if (records.some(record => record.oldValue?.split(' ').includes('active') !== record.target.classList.contains('active'))) {
            const tab = activeSection();
            if (tab !== selected) select(tab);
        }
    }).observe(bar, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    ['cart-modal', 'account-modal', 'auth-modal'].forEach(id => {
        const modal = document.getElementById(id);
        if (!modal) return;
        new MutationObserver(() => {
            if (modal.classList.contains('active')) select(id === 'cart-modal' ? tabs[3] : tabs[4]);
            else if (!document.querySelector('#cart-modal.active, #account-modal.active, #auth-modal.active')) select(activeSection());
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
    /* 2026-11-24 面板開著時導覽列仍露在上面、點得到：點任何一格先關掉目前的購物車／會員／登入面板，
       避免兩個面板疊在一起；再點一次同一格（例如購物車開著又點購物車）就只是關掉。 */
    bar.addEventListener('click', event => {
        const tab = tabs.find(item => item.contains(event.target));
        if (!tab) return;
        const open = [...document.querySelectorAll('#cart-modal.active, #account-modal.active, #auth-modal.active')];
        if (!open.length) return;
        const sameTab = open.some(modal => (modal.id === 'cart-modal' ? tabs[3] : tabs[4]) === tab);
        open.forEach(modal => window.closeModal(modal));
        if (sameTab) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
    select(activeSection(), false);
    new ResizeObserver(() => {
        notchWidth = bar.getBoundingClientRect().width;
        if (selected) drawNotch((tabs.indexOf(selected) + 0.5) * 20, true);
    }).observe(bar);
});

// 桌機導覽列選中滑塊：量目前 a.active 的位置寫進 CSS 變數，由 style.css 的
// .nav-links.has-slider::after 畫出並用彈簧曲線滑過去。選中狀態沿用 navObserver
// 切換的 .active（只觀察連結本身的 class），不另外監聽捲動事件。
document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('nav-links');
    if (!bar) return;
    const desktop = window.matchMedia('(min-width: 1025px)');
    const links = [...bar.querySelectorAll('a[href^="#"]')];
    let placed = false;
    const place = (instant = false) => {
        if (!desktop.matches) return;
        // 只算看得見的文字連結（手機版專用分頁、隱藏項目的 offsetParent 是 null）
        const link = links.find(a => a.classList.contains('active') && a.offsetParent);
        if (!link) {
            bar.style.setProperty('--slider-o', '0');
            return;
        }
        const jump = instant || !placed;
        if (jump) bar.classList.add('slider-instant');
        bar.style.setProperty('--slider-x', `${link.offsetLeft}px`);
        bar.style.setProperty('--slider-w', `${link.offsetWidth}px`);
        bar.style.setProperty('--slider-o', '1');
        if (!placed) {
            bar.classList.add('has-slider');
            placed = true;
        }
        if (jump) {
            bar.getBoundingClientRect(); // 先套用位置，再恢復動畫
            bar.classList.remove('slider-instant');
        }
    };
    const watch = new MutationObserver(() => place());
    links.forEach(a => watch.observe(a, { attributes: true, attributeFilter: ['class'] }));
    new ResizeObserver(() => place(true)).observe(bar);
    desktop.addEventListener('change', () => place(true));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => place(true));
    place(true);
});

// 2026-11-23「加到主畫面」App：註冊離線小幫手（見 sw.js）
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}

/* 品牌重點固定由訪客操作，鍵盤左右鍵也可切換。 */
(function initBrandCarousel() {
    const carousel = document.querySelector('.brand-carousel');
    if (!carousel) return;

    const cards = [...carousel.querySelectorAll('.brand-carousel-card')];
    const arrows = carousel.querySelectorAll('.brand-carousel-arrow');
    const status = carousel.querySelector('[role="status"]');
    const positions = ['center', 'right', 'left'];
    let current = 0;
    let drag;

    function show(step) {
        current = (current + step + cards.length) % cards.length;
        cards.forEach((card, index) => {
            const offset = (index - current + cards.length) % cards.length;
            card.dataset.position = positions[offset];
            card.inert = index !== current;
        });
        const label = cards[current].querySelector('h2').innerText.trim().replace(/\s+/g, ' ');
        status.textContent = (current + 1) + ' / ' + cards.length + '，' + label;
    }

    arrows.forEach(button => {
        button.addEventListener('click', () => show(Number(button.dataset.step)));
        button.hidden = false;
    });
    carousel.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0 || event.target.closest('a, button')) return;
        if (event.pointerType === 'mouse') event.preventDefault();
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        carousel.setPointerCapture(event.pointerId);
    });
    carousel.addEventListener('pointerup', event => {
        if (drag?.id !== event.pointerId) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        drag = undefined;
        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
            show(dx < 0 ? 1 : -1);
        }
    });
    carousel.addEventListener('lostpointercapture', event => {
        if (drag?.id === event.pointerId) drag = undefined;
    });
    carousel.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        show(event.key === 'ArrowLeft' ? -1 : 1);
    });
    show(0);
})();
