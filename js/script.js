document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. 產品資料 (共用於滿版選單與詳情彈窗)
       ========================================= */
    const productsData = {
        '1': {
            name: "經典鳳梨酥",
            price: "NT$ 500",
            qty: "10入/盒",
            shortDesc: "嚴選台灣在地土鳳梨，搭配發酵奶油酥皮，酸甜果香。",
            desc: "嚴選台灣在地小農土鳳梨，慢火熬煮酸甜鳳梨餡，搭配法國 Isigny 發酵奶油酥皮，入口散發濃郁奶香與自然果酸層次。",
            images: [
                "images/product-1.jpg",
                "images/product-1-detail1.jpg",
                "images/product-1-detail2.jpg",
                "images/product-1-detail3.jpg",
                "images/product-1-detail4.jpg",
                "images/product-1-detail5.jpg"
            ]
        },
        '2': {
            name: "法式磅蛋糕",
            price: "NT$ 400",
            qty: "1條/盒",
            shortDesc: "濕潤扎實蛋糕體，散發伯爵茶香與香草籽優雅風味。",
            desc: "濕潤扎實的法式傳統蛋糕體，融合英式伯爵茶葉與馬達加斯加香草籽，甜而不膩，是下午茶的最佳伴侶。",
            images: [
                "images/product-2.jpg",
                "images/product-2-detail1.jpg",
                "images/product-2-detail2.jpg",
                "images/product-2-detail3.jpg",
                "images/product-2-detail4.jpg",
                "images/product-2-detail5.jpg"
            ]
        },
        '3': {
            name: "焦糖堅果塔",
            price: "NT$ 600",
            qty: "10入/盒",
            shortDesc: "手工海鹽焦糖包裹夏威夷豆與核桃，口感酥脆香濃。",
            desc: "手工熬煮法國海鹽焦糖醬，均勻裹覆夏威夷豆與核桃，放在香脆塔皮上，口感層次豐富，香氣四溢。",
            images: [
                "images/product-3.jpg",
                "images/product-3-detail1.jpg",
                "images/product-3-detail2.jpg",
                "images/product-3-detail3.jpg",
                "images/product-3-detail4.jpg",
                "images/product-3-detail5.jpg"
            ]
        },
        '4': {
            name: "巧克力派",
            price: "NT$ 650",
            qty: "8吋/顆",
            shortDesc: "濃郁苦甜巧克力內餡，搭配酥脆奶油派皮，經典不敗的巧克力風味。",
            desc: "以香醇苦甜巧克力製成綿密內餡，搭配酥脆奶油派皮，口感濃郁扎實，是巧克力愛好者不能錯過的經典選擇。",
            images: [
                "images/product-4.jpg",
                "images/product-4-detail1.jpg",
                "images/product-4-detail2.jpg",
                "images/product-4-detail3.jpg",
                "images/product-4-detail4.jpg",
                "images/product-4-detail5.jpg"
            ]
        }
    };

    /* =========================================
       2. 捲動連動導覽列行為 (Scroll-Driven Navbar Behavior)
       ========================================= */
    const navbar = document.getElementById('main-navbar');

    /* 深淺色判斷原本靠 scroll 事件裡手動算 getBoundingClientRect() 跟一個寫死的px門檻比較——
       這個做法在 smooth-scroll + scroll-snap 快速切換滿版區塊時，scroll事件觸發頻率跟不上，
       畫面看起來會卡一下才反應。改成跟下面「哪個連結該亮」共用同一個 IntersectionObserver，
       深淺色的判定改由瀏覽器 compositor 直接驅動，不再依賴 scroll 事件的觸發頻率，更即時可靠 */
    let lastNavScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // 手機選單開著的時候不要收起導覽列，不然漢堡按鈕跟著消失會關不掉選單
        const mobileDrawer = document.getElementById('nav-links');
        const isMobileMenuOpen = mobileDrawer && mobileDrawer.classList.contains('open');

        if (!isMobileMenuOpen) {
            if (currentScrollY > lastNavScrollY && currentScrollY > 80) {
                navbar.classList.add('nav-hidden'); // 往下滑，收起
            } else if (currentScrollY < lastNavScrollY) {
                navbar.classList.remove('nav-hidden'); // 往上滑，滑出
            }
        }

        lastNavScrollY = currentScrollY;
    });

    /* =========================================
       2b. 導覽列音樂/音效置中（跟左邊導覽膠囊、右邊會員/聯繫/購物車保持等距）
       ========================================= */
    /* 導覽膠囊寬度跟右側工具區寬度都會隨內容/斷點變動，純 CSS 沒辦法算出
       兩個獨立元素中間的等距點，所以在這裡即時量測兩者的邊界，把音樂/音效
       這組的中心點設在正中間——這樣膠囊跟右側圖示才能維持在原本的位置不動，
       音樂/音效才是真正「插進中間」的第三塊，不是靠它們兩個各自往內縮 */
    function positionNavSoundGroup() {
        const pill = document.getElementById('nav-links');
        const soundGroup = document.querySelector('.nav-sound-group');
        const utilityGroup = document.querySelector('.nav-utility-group');
        if (!pill || !soundGroup || !utilityGroup) return;
        if (getComputedStyle(soundGroup).display === 'none') return; // 手機版音樂/音效收進漢堡選單了，不用算

        const navbarRect = navbar.getBoundingClientRect();
        const pillRect = pill.getBoundingClientRect();
        const utilityRect = utilityGroup.getBoundingClientRect();
        const midpoint = (pillRect.right + utilityRect.left) / 2 - navbarRect.left;
        soundGroup.style.left = `${midpoint}px`;
    }

    positionNavSoundGroup();
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(positionNavSoundGroup);
    }
    window.addEventListener('load', positionNavSoundGroup);
    window.addEventListener('resize', positionNavSoundGroup);

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
                weapon: '武士刀X狙擊槍',
                style: '任務執行到極致',
                quote: '「用數據與匠心，重新定義這間店存在的意義。」',
                bio: '武裝神姬對品質近乎苛求：食材只要有一絲落差就直接退回，任何新品上市前，都必須先通過十輪盲測才准放行。她相信真正的浪漫不是天馬行空的靈感，而是把每個微小細節都做到位的紀律，是這間店最後、也最嚴格的把關者。',
                avatar: 'images/staff01.jpg',
                portrait: 'images/staff01-nobg.png'
            },
            {
                name: '強襲魔女',
                job: '職代理店長X最強雜工',
                battleRole: '移動基地',
                weapon: '車',
                style: '只想看戲',
                quote: '「溫度差一度，風味就不再是那個風味。」',
                bio: '強襲魔女的戰鬥職位是「移動基地」，武器欄只寫了一個字：車。戰鬥風格寫著「只想看戲」，實際上卻是店裡所有配方溫控背後最嚴謹的把關者——缺人手時補收銀、缺食材時開車去載貨，是名符其實、什麼都攬在身上的萬能雜工。',
                avatar: 'images/team-2.jpg',
                portrait: 'images/team-2.jpg'
            },
            {
                name: '貓貓',
                job: '招財貓',
                battleRole: '偵查',
                weapon: '車',
                style: '只想看戲',
                quote: '「每一次失敗的配方，都是下一次成功的線索。」',
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
        const styleEl = document.getElementById('team-info-style');
        const quoteEl = document.getElementById('team-info-quote');
        const bioEl = document.getElementById('team-info-bio');
        const portraitEl = document.getElementById('team-portrait');
        const portraitTextEl = document.getElementById('team-portrait-text');
        const btnUp = document.getElementById('team-nav-up');
        const btnDown = document.getElementById('team-nav-down');

        if (!listEl || teamData.length === 0) return;

        let activeIndex = 0;

        teamData.forEach((member, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `team-avatar-item${i === 0 ? ' active' : ''}`;
            btn.setAttribute('aria-label', member.name);
            btn.innerHTML = `<img src="${member.avatar}" alt="${member.name}" loading="lazy">`;
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
            styleEl.textContent = member.style;
            quoteEl.textContent = member.quote;
            bioEl.textContent = member.bio;
            portraitEl.style.opacity = '0';

            setTimeout(() => {
                portraitTextEl.innerHTML = '';
                portraitEl.style.backgroundImage = `url('${member.portrait}')`;
                portraitEl.setAttribute('aria-label', `${member.name} 立繪`);
                portraitEl.style.opacity = '1';
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
                <div class="product-panel-body">
                    <h3 class="product-panel-name">${product.name}</h3>
                    <p class="product-panel-detail">${product.shortDesc}</p>
                    <div class="product-panel-meta">
                        <span class="product-panel-price">${product.price}</span>
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
       7. Web Audio API 音效與右下角圓形切換按鈕（含音效音量）
       ========================================= */
    let soundEnabled = false;
    let audioCtx = null;
    let sfxVolume = 0.05;

    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const sfxVolumeSlider = document.getElementById('sfx-volume-slider');

    if (sfxVolumeSlider) {
        const savedSfxVolume = localStorage.getItem('projectCD_sfxVolume');
        if (savedSfxVolume !== null) sfxVolumeSlider.value = savedSfxVolume;

        sfxVolume = parseFloat(sfxVolumeSlider.value);
        sfxVolumeSlider.addEventListener('input', () => {
            sfxVolume = parseFloat(sfxVolumeSlider.value);
            localStorage.setItem('projectCD_sfxVolume', sfxVolumeSlider.value);
        });
    }

    if (btnSoundToggle) {
        btnSoundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                btnSoundToggle.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
                btnSoundToggle.classList.add('active-sound');
                playChimeSound(880, 'sine', 0.1);
            } else {
                btnSoundToggle.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
                btnSoundToggle.classList.remove('active-sound');
            }
        });
    }

    function playChimeSound(freq = 600, type = 'sine', duration = 0.08) {
        if (!soundEnabled || !audioCtx || sfxVolume <= 0) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    }

    /* 點擊音改成微動開關式的噪訊喀嗒（不是原本的三角波鈴聲），
       濾波噪訊本身能量分散在整個頻段，感知音量比純音低很多，所以乘上放大係數才聽得清楚 */
    function playClickSound() {
        if (!soundEnabled || !audioCtx || sfxVolume <= 0) return;
        try {
            const bufferSize = Math.floor(audioCtx.sampleRate * 0.008);
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const bandpass = audioCtx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 5500;
            bandpass.Q.value = 1.5;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(Math.min(sfxVolume * 8, 1), audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.006);
            noise.connect(bandpass);
            bandpass.connect(gain);
            gain.connect(audioCtx.destination);
            noise.start();
        } catch (e) {}
    }

    document.querySelectorAll('.nav-links a, .nav-icon-link, .nav-icon-btn, .product-panel, .team-nav-btn, .team-avatar-item, .btn-submit, .btn-modal-cta, .btn-modal-cta-secondary, .btn-google-signin, .qty-btn, .shop-glass-card, .btn-line-cta, .btn-music-toggle, .btn-mobile-sound-toggle, .btn-sound-toggle, .btn-copy-email, .faq-card, .auth-checkbox-row, .auth-tab, .auth-forgot-link, .hamburger-btn, .modal-close, .policy-link, .footer-social a, .thumb-item, .section-dot, .scroll-down-indicator, .account-logout-btn, .history-month-btn').forEach(el => {
        el.addEventListener('click', playClickSound);
    });

    /* =========================================
       8. HTML5 原生背景音樂控制 (#btn-music-toggle，含音量)
       ========================================= */
    const bgAudio = document.getElementById('bg-audio');
    const btnMusicToggle = document.getElementById('btn-music-toggle');
    const musicVolumeSlider = document.getElementById('music-volume-slider');
    let isMusicPlaying = false;

    if (bgAudio && musicVolumeSlider) {
        const savedMusicVolume = localStorage.getItem('projectCD_musicVolume');
        if (savedMusicVolume !== null) musicVolumeSlider.value = savedMusicVolume;

        bgAudio.volume = parseFloat(musicVolumeSlider.value);
        musicVolumeSlider.addEventListener('input', () => {
            bgAudio.volume = parseFloat(musicVolumeSlider.value);
            localStorage.setItem('projectCD_musicVolume', musicVolumeSlider.value);
        });
    }

    if (btnMusicToggle && bgAudio) {
        btnMusicToggle.addEventListener('click', () => {
            if (!isMusicPlaying) {
                bgAudio.play().then(() => {
                    isMusicPlaying = true;
                    btnMusicToggle.innerHTML = `<i class="fa-solid fa-compact-disc fa-spin"></i>`;
                    btnMusicToggle.classList.add('active-music');
                }).catch(err => {
                    console.log("Audio playback error:", err);
                });
            } else {
                bgAudio.pause();
                isMusicPlaying = false;
                btnMusicToggle.innerHTML = `<i class="fa-solid fa-music"></i>`;
                btnMusicToggle.classList.remove('active-music');
            }
        });
    }

    /* =========================================
       8b. 手機/平板精簡音樂＋音效開關 (合併控制，共用桌機版的播放狀態與音量變數)
       ========================================= */
    const btnMobileSound = document.getElementById('btn-mobile-sound-toggle');
    const mobileSoundPopover = document.getElementById('mobile-sound-popover');
    const mobileMusicVolumeSlider = document.getElementById('mobile-music-volume-slider');
    const mobileSfxVolumeSlider = document.getElementById('mobile-sfx-volume-slider');

    if (mobileMusicVolumeSlider && musicVolumeSlider) {
        mobileMusicVolumeSlider.value = musicVolumeSlider.value;
        mobileMusicVolumeSlider.addEventListener('input', () => {
            musicVolumeSlider.value = mobileMusicVolumeSlider.value;
            musicVolumeSlider.dispatchEvent(new Event('input'));
        });
    }

    if (mobileSfxVolumeSlider && sfxVolumeSlider) {
        mobileSfxVolumeSlider.value = sfxVolumeSlider.value;
        mobileSfxVolumeSlider.addEventListener('input', () => {
            sfxVolumeSlider.value = mobileSfxVolumeSlider.value;
            sfxVolumeSlider.dispatchEvent(new Event('input'));
        });
    }

    if (btnMobileSound) {
        let mobileSoundActive = false;
        const mobileSoundIcon = btnMobileSound.querySelector('i');

        btnMobileSound.addEventListener('click', () => {
            mobileSoundActive = !mobileSoundActive;

            if (mobileSoundActive) {
                if (!isMusicPlaying && btnMusicToggle) btnMusicToggle.click();
                if (!soundEnabled && btnSoundToggle) btnSoundToggle.click();
                if (mobileSoundIcon) mobileSoundIcon.className = 'fa-solid fa-volume-high';
                btnMobileSound.classList.add('active-sound');
                btnMobileSound.setAttribute('aria-expanded', 'true');
                mobileSoundPopover.classList.add('open');
            } else {
                if (isMusicPlaying && btnMusicToggle) btnMusicToggle.click();
                if (soundEnabled && btnSoundToggle) btnSoundToggle.click();
                if (mobileSoundIcon) mobileSoundIcon.className = 'fa-solid fa-volume-xmark';
                btnMobileSound.classList.remove('active-sound');
                btnMobileSound.setAttribute('aria-expanded', 'false');
                mobileSoundPopover.classList.remove('open');
            }
        });
    }

    /* =========================================
       8c. 平板/手機漢堡選單開合
       ========================================= */
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinksDrawer = document.getElementById('nav-links');
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');

    if (hamburgerBtn && navLinksDrawer && mobileMenuBackdrop) {
        const closeMobileMenu = () => {
            navLinksDrawer.classList.remove('open');
            mobileMenuBackdrop.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        };

        const drawerLinks = navLinksDrawer.querySelectorAll('a[href^="#"]');

        const openMobileMenu = () => {
            // 每次打開都重置成全白，不要讓上次點過的項目或捲動監聽器設的 .active 殘留高亮，
            // 抽屜選單只顯示「剛剛點了誰」，不顯示「目前捲到哪」（那是桌機版膠囊在做的事）
            drawerLinks.forEach(link => link.classList.remove('tapped'));
            navLinksDrawer.classList.add('open');
            mobileMenuBackdrop.classList.add('open');
            hamburgerBtn.setAttribute('aria-expanded', 'true');
        };

        hamburgerBtn.addEventListener('click', () => {
            const isOpen = navLinksDrawer.classList.contains('open');
            if (isOpen) closeMobileMenu(); else openMobileMenu();
        });

        mobileMenuBackdrop.addEventListener('click', closeMobileMenu);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinksDrawer.classList.contains('open')) closeMobileMenu();
        });

        // 點選抽屜裡的頁面連結（首頁/品牌/產品/商城/聯繫）後：亮出剛點的那個，並自動收合選單
        drawerLinks.forEach(link => {
            link.addEventListener('click', () => {
                drawerLinks.forEach(l => l.classList.remove('tapped'));
                link.classList.add('tapped');
                closeMobileMenu();
            });
        });

        // 螢幕從手機/平板尺寸放大回桌機尺寸時，確保抽屜狀態重置
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) closeMobileMenu();
        });
    }

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
                    link.classList.toggle('active', href === `#${currentId}`);
                });

                sectionDots.forEach(dot => {
                    dot.classList.toggle('active', dot.dataset.target === currentId);
                });

                if (sectionDotsEl) {
                    sectionDotsEl.classList.toggle('on-dark', isDark);
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
    const contactTriggers = [
        document.getElementById('nav-btn-contact'),
        document.getElementById('nav-link-contact-mobile')
    ];

    if (contactModal && contactModalClose) {
        contactTriggers.forEach(trigger => {
            if (!trigger) return;
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
            playChimeSound(1318, 'sine', 0.2);

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
       13b. 信箱一鍵複製
       ========================================= */
    document.querySelectorAll('.btn-copy-email').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.copyText;
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check"></i>`;
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('copied');
                }, 1800);
            }).catch(() => {});
        });
    });

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
                <p><strong>1. 帳號使用：</strong>會員帳號僅供本人使用，請妥善保管您的登入密碼，因帳號外洩所生之損害由使用者自行負責。</p>
                <p><strong>2. 訂購流程：</strong>官網會員訂購為現做商品，取貨日期需至少於下單後 5 個工作天，並不提供週一取貨；送出訂單即表示同意上述取貨時程安排。</p>
                <p><strong>3. 條款修訂：</strong>我們得因應營運需要修訂本條款，修訂後將公告於本頁面，請留意最新版本內容。</p>
            `
        }
    };

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
    const thumbsBox = document.getElementById('product-modal-thumbs');
    const modalTitle = document.getElementById('product-modal-title');
    const modalPrice = document.getElementById('product-modal-price');
    const modalQty = document.getElementById('product-modal-qty');
    const modalDesc = document.getElementById('product-modal-desc');
    const modalCta = document.getElementById('product-modal-cta');

    // 圖片尚未上傳（404）時，顯示品牌色佔位圖示，而不是瀏覽器預設的裂圖
    mainImg.addEventListener('load', () => mainImg.parentElement.classList.remove('img-fallback'));
    mainImg.addEventListener('error', () => mainImg.parentElement.classList.add('img-fallback'));

    function openProductModal(productId) {
        const data = productsData[productId];
        if (!data) return;

        // 記錄目前開啟的商品 id，供 js/member.js 的「加入購物車」功能讀取
        productModal.dataset.productId = productId;

        modalTitle.textContent = data.name;
        modalPrice.textContent = data.price;
        modalQty.textContent = data.qty;
        modalDesc.textContent = data.desc;

        mainImg.src = data.images[0];
        thumbsBox.innerHTML = '';

        data.images.forEach((imgSrc, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumb-item ${index === 0 ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${imgSrc}" alt="縮圖" loading="lazy">`;

            const thumbImg = thumb.querySelector('img');
            thumbImg.addEventListener('error', () => thumb.classList.add('img-fallback'), { once: true });

            thumb.addEventListener('click', () => {
                mainImg.src = imgSrc;
                document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });

            thumbsBox.appendChild(thumb);
        });

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
});