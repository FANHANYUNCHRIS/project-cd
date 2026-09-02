document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. 產品資料 (共用於滿版選單與詳情彈窗)
       ========================================= */
    const productsData = {
        '1': {
            name: "經典鳳梨酥",
            price: "NT$ 500",
            qty: "10入/盒",
            desc: "嚴選台灣在地小農土鳳梨，慢火熬煮酸甜鳳梨餡，搭配法國 Isigny 發酵奶油酥皮，入口散發濃郁奶香與自然果酸層次。",
            images: [
                "images/product-1.jpg",
                "images/product-1-detail1.jpg",
                "images/product-1-detail2.jpg",
                "images/product-1-detail3.jpg"
            ],
            // 前 4 個是全系列共通的品質承諾，第 5 個換成這款商品說明裡
            // 特別點出的主原料，5 個徽章才不會 4 個商品長得一模一樣
            tags: [
                { icon: "fa-snowflake", label: "低溫冷藏保鮮" },
                { icon: "fa-shield-cat", label: "無添加防腐劑" },
                { icon: "fa-stamp", label: "台灣在地製造" },
                { icon: "fa-mortar-pestle", label: "手工新鮮現做" },
                { icon: "fa-leaf", label: "台灣土鳳梨嚴選" }
            ]
        },
        '2': {
            name: "法式磅蛋糕",
            price: "NT$ 400",
            qty: "1條/盒",
            desc: "濕潤扎實的法式傳統蛋糕體，融合英式伯爵茶葉與馬達加斯加香草籽，甜而不膩，是下午茶的最佳伴侶。",
            images: [
                "images/product-2.jpg",
                "images/product-2-detail1.jpg",
                "images/product-2-detail2.jpg",
                "images/product-2-detail3.jpg"
            ],
            tags: [
                { icon: "fa-snowflake", label: "低溫冷藏保鮮" },
                { icon: "fa-shield-cat", label: "無添加防腐劑" },
                { icon: "fa-stamp", label: "台灣在地製造" },
                { icon: "fa-mortar-pestle", label: "手工新鮮現做" },
                { icon: "fa-leaf", label: "馬達加斯加香草" }
            ]
        },
        '3': {
            name: "焦糖堅果塔",
            price: "NT$ 600",
            qty: "10入/盒",
            desc: "手工熬煮法國海鹽焦糖醬，均勻裹覆夏威夷豆與核桃，放在香脆塔皮上，口感層次豐富，香氣四溢。",
            images: [
                "images/product-3.jpg",
                "images/product-3-detail1.jpg",
                "images/product-3-detail2.jpg",
                "images/product-3-detail3.jpg"
            ],
            tags: [
                { icon: "fa-snowflake", label: "低溫冷藏保鮮" },
                { icon: "fa-shield-cat", label: "無添加防腐劑" },
                { icon: "fa-stamp", label: "台灣在地製造" },
                { icon: "fa-mortar-pestle", label: "手工新鮮現做" },
                { icon: "fa-leaf", label: "夏威夷豆與核桃" }
            ]
        },
        '4': {
            name: "巧克力派",
            price: "NT$ 650",
            qty: "8吋/顆",
            desc: "以香醇苦甜巧克力製成綿密內餡，搭配酥脆奶油派皮，口感濃郁扎實，是巧克力愛好者不能錯過的經典選擇。",
            images: [
                "images/product-4.jpg",
                "images/product-4-detail1.jpg",
                "images/product-4-detail2.jpg",
                "images/product-4-detail3.jpg"
            ],
            tags: [
                { icon: "fa-snowflake", label: "低溫冷藏保鮮" },
                { icon: "fa-shield-cat", label: "無添加防腐劑" },
                { icon: "fa-stamp", label: "台灣在地製造" },
                { icon: "fa-mortar-pestle", label: "手工新鮮現做" },
                { icon: "fa-leaf", label: "香醇苦甜巧克力" }
            ]
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

    /* =========================================
       3. 首頁背景影片輪播 (雙層淡入淡出)
       ========================================= */
    (function initHeroVideoBackground() {
        const clips = [
            'videos/coffee1.mp4',
            'videos/chocolate1.mp4',
            'videos/coffee2.mp4',
            'videos/chocolate2.mp4'
        ];
        const layers = document.querySelectorAll('.hero-video-bg .hero-video');
        if (layers.length < 2) return;

        // 使用者於系統設定關閉動態效果時，改用海報靜態圖，不自動播放/輪播影片
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let clipIndex = 0;
        let activeLayer = 0;
        let preloadStarted = false;

        function preloadNext(nextLayer) {
            clipIndex = (clipIndex + 1) % clips.length;
            layers[nextLayer].src = clips[clipIndex];
            layers[nextLayer].load();
        }

        // Safari 等瀏覽器有時會擋下自動播放（政策/省電模式等），且不一定會補畫面，
        // 導致背景永遠停在黑畫面。這裡記住「目前該播誰」，一旦使用者有任何互動
        // （捲動、點擊、觸控）就立刻重試播放，不會再卡死。
        let pendingRetryLayer = null;

        function tryPlay(layerEl) {
            const result = layerEl.play();
            if (result && typeof result.catch === 'function') {
                result.catch(() => { pendingRetryLayer = layerEl; });
            }
        }

        function retryPendingPlay() {
            if (pendingRetryLayer && pendingRetryLayer.paused) {
                tryPlay(pendingRetryLayer);
            }
        }
        ['pointerdown', 'scroll', 'keydown', 'touchstart'].forEach(evt => {
            window.addEventListener(evt, retryPendingPlay, { passive: true });
        });

        function crossfadeTo(nextLayer) {
            layers[activeLayer].classList.remove('active');
            layers[nextLayer].classList.add('active');
            layers[nextLayer].currentTime = 0;
            tryPlay(layers[nextLayer]);
            activeLayer = nextLayer;
            preloadStarted = false;
        }

        layers.forEach((layerEl, i) => {
            // 播到剩 1.5 秒時就提前載入下一支影片，切換時才不會卡頓
            layerEl.addEventListener('timeupdate', () => {
                if (i !== activeLayer || preloadStarted) return;
                if (layerEl.duration && layerEl.duration - layerEl.currentTime <= 1.5) {
                    preloadStarted = true;
                    preloadNext(activeLayer === 0 ? 1 : 0);
                }
            });

            layerEl.addEventListener('ended', () => {
                if (i !== activeLayer) return;
                crossfadeTo(activeLayer === 0 ? 1 : 0);
            });
        });

        layers[0].src = clips[0];
        layers[0].load();
        layers[0].classList.add('active');
        tryPlay(layers[0]);
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
                portrait: 'images/staff01-nobg.png'
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

        const listEl = document.getElementById('team-avatar-list');
        const nameEl = document.getElementById('team-info-name');
        const jobEl = document.getElementById('team-info-job');
        const battleRoleEl = document.getElementById('team-info-battle');
        const weaponEl = document.getElementById('team-info-weapon');
        const quoteEl = document.getElementById('team-info-quote');
        const bioEl = document.getElementById('team-info-bio');
        const portraitEl = document.getElementById('team-portrait');
        const portraitTextEl = document.getElementById('team-portrait-text');
        const btnUp = document.getElementById('team-nav-up');
        const btnDown = document.getElementById('team-nav-down');

        // 手機專用排版（見 index.html 的 .team-mobile-* 區塊）跟桌機版是同一份
        // teamData，只是拆開重排、各自獨立的元素，這裡另外抓一份對應的節點，
        // 跟桌機版元素一起同步寫入，不需要另外寫一套切換邏輯
        const mobileNameEl = document.getElementById('team-mobile-name');
        const mobileQuoteEl = document.getElementById('team-mobile-quote');
        const mobileJobEl = document.getElementById('team-mobile-job');
        const mobileBattleRoleEl = document.getElementById('team-mobile-battle');
        const mobileWeaponEl = document.getElementById('team-mobile-weapon');
        const mobileBioEl = document.getElementById('team-mobile-bio');
        const mobilePortraitEl = document.getElementById('team-mobile-portrait');

        if (!listEl || teamData.length === 0) return;

        let activeIndex = 0;

        teamData.forEach((member, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `team-avatar-item${i === 0 ? ' active' : ''}`;
            btn.setAttribute('aria-label', member.name);
            // alt 特意留空：按鈕本身已經有 aria-label 提供無障礙名稱，圖片只是裝飾用；
            // 如果 alt 填了名字，圖片讀取失敗時 Chrome 滑鼠移過去會跳出瀏覽器原生的
            // alt 文字提示框，跟畫面上其他元素的視覺風格不一致，也不是我們想要的提示
            btn.innerHTML = `<img src="${member.avatar}" alt="" loading="lazy">`;
            // 照片還沒上傳時，用通用佔位圖示取代瀏覽器預設的裂圖示
            btn.querySelector('img').addEventListener('error', () => {
                btn.classList.add('img-fallback');
            }, { once: true });
            btn.addEventListener('click', () => showMember(i));
            listEl.appendChild(btn);
        });

        const avatarButtons = listEl.querySelectorAll('.team-avatar-item');

        function showMember(index) {
            activeIndex = (index + teamData.length) % teamData.length;
            const member = teamData[activeIndex];

            avatarButtons.forEach((btn, i) => btn.classList.toggle('active', i === activeIndex));

            nameEl.textContent = member.name;
            jobEl.textContent = member.job;
            battleRoleEl.textContent = member.battleRole;
            weaponEl.textContent = member.weapon;
            quoteEl.textContent = member.quote;
            bioEl.textContent = member.bio;

            if (mobileNameEl) mobileNameEl.textContent = member.name;
            if (mobileQuoteEl) mobileQuoteEl.textContent = member.mobileQuote || member.quote;
            if (mobileJobEl) mobileJobEl.textContent = member.job;
            if (mobileBattleRoleEl) mobileBattleRoleEl.textContent = member.battleRole;
            if (mobileWeaponEl) mobileWeaponEl.textContent = member.weapon;
            if (mobileBioEl) mobileBioEl.textContent = member.bio;

            loadPortraitInto(portraitEl, member, () => { portraitTextEl.innerHTML = ''; });
            if (mobilePortraitEl) loadPortraitInto(mobilePortraitEl, member);
        }

        // 立繪還沒上傳時（圖片路徑 404），用通用佔位樣式取代——background-image
        // 讀取失敗不會像 <img> 一樣自動觸發瀏覽器裂圖示，要自己用 Image()
        // 預先載入一次才知道成不成功。桌機版立繪跟手機版複製的立繪
        // （.team-mobile-portrait）共用這個函式，避免同一段預載邏輯寫兩次
        function loadPortraitInto(el, member, onSettle) {
            el.style.opacity = '0';
            el.setAttribute('aria-label', `${member.name} 立繪`);

            setTimeout(() => {
                const preload = new Image();
                preload.onload = () => {
                    el.classList.remove('img-fallback');
                    el.style.backgroundImage = `url('${member.portrait}')`;
                    el.style.opacity = '1';
                    if (onSettle) onSettle();
                };
                preload.onerror = () => {
                    el.classList.add('img-fallback');
                    el.style.backgroundImage = 'none';
                    el.style.opacity = '1';
                    if (onSettle) onSettle();
                };
                preload.src = member.portrait;
            }, 200);
        }

        if (btnUp) btnUp.addEventListener('click', () => showMember(activeIndex - 1));
        if (btnDown) btnDown.addEventListener('click', () => showMember(activeIndex + 1));

        showMember(0);
    })();

    /* =========================================
       5. 產品區塊滿版分割選單
       ========================================= */
    (function initProductPanels() {
        const panelsEl = document.getElementById('product-panels');
        if (!panelsEl) return;

        Object.keys(productsData).forEach((id, index) => {
            const product = productsData[id];

            const panel = document.createElement('div');
            panel.className = `product-panel ${index % 2 === 0 ? 'reveal-slide-left' : 'reveal-slide-right'}`;
            panel.dataset.revealDelay = String(index * 0.12);
            panel.setAttribute('role', 'button');
            panel.setAttribute('tabindex', '0');
            panel.setAttribute('aria-label', `查看${product.name}詳細介紹`);

            panel.innerHTML = `
                <div class="product-panel-image" data-bg="${product.images[0]}"></div>
                <div class="product-panel-stats">
                    <div class="product-panel-stat-box">
                        <span class="product-panel-stat-label">品名</span>
                        <h3 class="product-panel-name">${product.name}</h3>
                    </div>
                    <div class="product-panel-stat-box">
                        <span class="product-panel-stat-label">價格</span>
                        <span class="product-panel-price">${product.price}</span>
                    </div>
                    <div class="product-panel-stat-box">
                        <span class="product-panel-stat-label">份量</span>
                        <span class="product-panel-qty">${product.qty}</span>
                    </div>
                </div>
            `;

            panel.addEventListener('click', () => openProductModal(id));
            panel.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openProductModal(id);
                }
            });

            panelsEl.appendChild(panel);
        });

        // 產品圖片延遲載入：面板接近可視範圍才設定背景圖，節省行動裝置流量
        const lazyBgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const bgEl = entry.target;
                bgEl.style.backgroundImage = `url('${bgEl.dataset.bg}')`;
                observer.unobserve(bgEl);
            });
        }, { rootMargin: '300px' });

        panelsEl.querySelectorAll('.product-panel-image').forEach(el => lazyBgObserver.observe(el));
    })();

    /* =========================================
       9. 螢幕四周 4 邊滾動進度條 (頂/右/底/左)
       ========================================= */
    const pTop = document.getElementById('scroll-progress-top');
    const pRight = document.getElementById('scroll-progress-right');
    const pBottom = document.getElementById('scroll-progress-bottom');
    const pLeft = document.getElementById('scroll-progress-left');

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        if (pTop) pTop.style.width = `${scrolled}%`;
        if (pRight) pRight.style.height = `${scrolled}%`;
        if (pBottom) pBottom.style.width = `${scrolled}%`;
        if (pLeft) pLeft.style.height = `${scrolled}%`;
    });

    /* =========================================
       10. 果凍彈跳式頁面浮現 (徹底解決閃爍問題)
       ========================================= */
    const revealElements = document.querySelectorAll('.reveal-element, .reveal-fade, .reveal-slide-left, .reveal-slide-right, .reveal-zoom');
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

    /* =========================================
       11. Scrollspy 導覽列滾動自動高亮
       ========================================= */
    const sections = document.querySelectorAll('header[id], section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const sectionDotsEl = document.getElementById('section-dots');
    const sectionDots = document.querySelectorAll('.section-dot');
    const sectionIndexEl = document.getElementById('section-index');
    const sectionIndexCurrent = document.getElementById('section-index-current');

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
                        sectionIndexCurrent.textContent = String(dotIndex + 1).padStart(2, '0');
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
    const footerLinkContact = document.getElementById('footer-link-contact');

    if (contactModal && contactModalClose) {
        [contactTrigger, footerLinkContact].filter(Boolean).forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(contactModal);
            });
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
                    btnSubmit.style.backgroundColor = '#28a745';
                    btnSubmit.style.color = '#ffffff';
                    contactForm.reset();
                })
                .catch(() => {
                    btnSubmit.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>發送失敗，請稍後再試</span>`;
                    btnSubmit.style.backgroundColor = '#e60000';
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
            title: "購物與冷藏配送須知",
            content: `
                <p><strong>1. 配送方式：</strong>為確保甜點品質與口感，全品項皆採黑貓宅急便【全程低溫冷藏/冷凍】配送。</p>
                <p><strong>2. 寄送時間：</strong>完成付款後約 2-4 個工作天內出貨，週日不提供收送貨服務。</p>
                <p><strong>3. 運費說明：</strong>全館消費滿 NT$ 2,500 即享免運優惠，未達門檻冷凍/冷藏運費為 NT$ 220。</p>
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
    const mainImg = document.getElementById('product-modal-main-img');
    const galleryMain = document.querySelector('.gallery-main');
    const thumbsBox = document.getElementById('product-modal-thumbs');
    const dotsBox = document.getElementById('product-modal-dots');
    const navPrevBtn = document.getElementById('gallery-nav-prev');
    const navNextBtn = document.getElementById('gallery-nav-next');
    const modalTitle = document.getElementById('product-modal-title');
    const modalPrice = document.getElementById('product-modal-price');
    const modalQty = document.getElementById('product-modal-qty');
    const modalDesc = document.getElementById('product-modal-desc');
    const modalTags = document.getElementById('product-modal-tags');
    const modalCta = document.getElementById('product-modal-cta');

    // 圖片尚未上傳（404）時，顯示品牌色佔位圖示，而不是瀏覽器預設的裂圖
    mainImg.addEventListener('load', () => mainImg.parentElement.classList.remove('img-fallback'));
    mainImg.addEventListener('error', () => mainImg.parentElement.classList.add('img-fallback'));

    // 目前開啟的商品圖片清單／索引——手機版箭頭/圓點/滑動跟桌機版縮圖列
    // 共用同一份狀態，切換來源不同但結果一致
    let galleryImages = [];
    let galleryName = '';
    let galleryIndex = 0;

    function showGalleryImage(index) {
        galleryIndex = (index + galleryImages.length) % galleryImages.length;
        const imgSrc = galleryImages[galleryIndex];

        mainImg.src = imgSrc;
        mainImg.alt = `${galleryName}商品照片 ${galleryIndex + 1}`;

        document.querySelectorAll('.thumb-item').forEach((t, i) => t.classList.toggle('active', i === galleryIndex));
        document.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === galleryIndex));
    }

    navPrevBtn.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
    navNextBtn.addEventListener('click', () => showGalleryImage(galleryIndex + 1));

    // 手機版滑動切圖：只看水平位移，避免跟彈窗本身的垂直捲動互相干擾
    let touchStartX = 0;
    let touchStartY = 0;
    galleryMain.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });
    galleryMain.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        showGalleryImage(galleryIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    function openProductModal(productId) {
        const data = productsData[productId];
        if (!data) return;

        // 記錄目前開啟的商品 id，供 js/member.js 的「加入購物車」功能讀取
        productModal.dataset.productId = productId;

        modalTitle.textContent = data.name;
        modalPrice.textContent = data.price;
        modalQty.textContent = data.qty;
        modalDesc.textContent = data.desc;

        modalTags.innerHTML = '';
        data.tags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'tag-item';
            item.innerHTML = `
                <span class="tag-badge"><i class="fa-solid ${tag.icon}"></i></span>
                <span class="tag-label">${tag.label}</span>
            `;
            modalTags.appendChild(item);
        });

        galleryImages = data.images;
        galleryName = data.name;

        thumbsBox.innerHTML = '';
        dotsBox.innerHTML = '';

        data.images.forEach((imgSrc, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumb-item ${index === 0 ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${imgSrc}" alt="${data.name}縮圖 ${index + 1}" loading="lazy">`;

            const thumbImg = thumb.querySelector('img');
            thumbImg.addEventListener('error', () => thumb.classList.add('img-fallback'), { once: true });

            thumb.addEventListener('click', () => showGalleryImage(index));

            thumbsBox.appendChild(thumb);

            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `gallery-dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `第 ${index + 1} 張圖片，共 ${data.images.length} 張`);
            dot.addEventListener('click', () => showGalleryImage(index));
            dotsBox.appendChild(dot);
        });

        showGalleryImage(0);
        openModal(productModal);
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