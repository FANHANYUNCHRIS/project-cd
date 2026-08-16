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
            name: "宇治抹茶馬卡龍",
            price: "NT$ 520",
            qty: "6入/盒",
            shortDesc: "日本宇治抹茶內餡，外酥內軟極致美味。",
            desc: "採用日本宇治丸久小山園抹茶粉，調配苦甜平衡的抹茶白巧克力甘納許內餡，外酥內軟，呈現經典法式風情。",
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
       2. 滾動收縮式導覽列 (Scroll-Shrink Sticky Navbar)
       ========================================= */
    const navbar = document.getElementById('main-navbar');

    /* 深淺色判斷原本靠 scroll 事件裡手動算 getBoundingClientRect() 跟一個寫死的px門檻比較——
       這個做法在 smooth-scroll + scroll-snap 快速切換滿版區塊時，scroll事件觸發頻率跟不上，
       畫面看起來會卡一下才反應。改成跟下面「哪個連結該亮」共用同一個 IntersectionObserver，
       深淺色的判定改由瀏覽器 compositor 直接驅動，不再依賴 scroll 事件的觸發頻率，更即時可靠 */
    let lastNavScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

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

        function crossfadeTo(nextLayer) {
            layers[activeLayer].classList.remove('active');
            layers[nextLayer].classList.add('active');
            layers[nextLayer].currentTime = 0;
            layers[nextLayer].play().catch(() => {});
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
        layers[0].play().catch(() => {});
    })();

    /* =========================================
       4. 品牌團隊人物切換器
       ========================================= */
    (function initTeamSwitcher() {
        const teamData = [
            {
                name: '范漢雲',
                dept: '經營團隊',
                role: '創辦人 / 總監',
                quote: '「用數據與匠心，重新定義這間店存在的意義。」',
                bio: '品牌的起點，源自於他對完美風味近乎苛求的堅持。從食材挑選到門市選址，每一個決策都經過反覆推敲，確保呈現在顧客面前的，永遠是最精確的答案。',
                avatar: 'images/team-1.jpg',
                portrait: 'images/team-1.jpg'
            },
            {
                name: '陳緹希',
                dept: '烘焙廚房',
                role: '首席主廚',
                quote: '「溫度差一度，風味就不再是那個風味。」',
                bio: '擁有多年法式烘焙經歷，擅長將傳統工法與精準控溫技術結合，是店內所有配方背後最嚴謹的把關者。',
                avatar: 'images/team-2.jpg',
                portrait: 'images/team-2.jpg'
            },
            {
                name: '鄭品宣',
                dept: '研發部門',
                role: '甜點研發專員',
                quote: '「每一次失敗的配方，都是下一次成功的線索。」',
                bio: '負責新品開發與風味實驗，習慣用近乎科學實驗的方式反覆測試比例，直到找出最平衡的那個版本。',
                avatar: 'images/team-3.jpg',
                portrait: 'images/team-3.jpg'
            }
        ];

        const listEl = document.getElementById('team-avatar-list');
        const indexEl = document.getElementById('team-info-index');
        const watermarkEl = document.getElementById('team-info-watermark');
        const nameEl = document.getElementById('team-info-name');
        const deptEl = document.getElementById('team-info-dept');
        const roleEl = document.getElementById('team-info-role');
        const quoteEl = document.getElementById('team-info-quote');
        const bioEl = document.getElementById('team-info-bio');
        const portraitEl = document.getElementById('team-portrait');
        const portraitTextEl = document.getElementById('team-portrait-text');
        const portraitInitialEl = document.getElementById('team-portrait-initial');
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

            indexEl.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(teamData.length).padStart(2, '0')}`;
            watermarkEl.textContent = String(activeIndex + 1).padStart(2, '0');
            nameEl.textContent = `[ ${member.name} ]`;
            deptEl.textContent = member.dept;
            roleEl.textContent = member.role;
            quoteEl.textContent = member.quote;
            bioEl.textContent = member.bio;
            portraitEl.style.opacity = '0';

            setTimeout(() => {
                portraitTextEl.innerHTML = '';
                portraitInitialEl.textContent = member.name.charAt(0);
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
                <div class="product-panel-image" data-bg="${product.images[0]}">
                    <span class="product-panel-initial" aria-hidden="true">${product.name.charAt(0)}</span>
                </div>
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
       6. 首頁副標文字寬度自動對齊品牌名稱
       ========================================= */
    function matchHeroTaglineWidth() {
        const heroTitle = document.querySelector('.hero-content h1');
        const heroTagline = document.querySelector('.hero-content p');
        if (!heroTitle || !heroTagline) return;

        heroTagline.style.fontSize = '';
        const targetWidth = heroTitle.offsetWidth;
        const currentWidth = heroTagline.offsetWidth;
        if (!targetWidth || !currentWidth) return;

        const currentFontSize = parseFloat(getComputedStyle(heroTagline).fontSize);
        heroTagline.style.fontSize = `${currentFontSize * (targetWidth / currentWidth)}px`;
    }

    function syncResponsiveSizing() {
        matchHeroTaglineWidth();
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(syncResponsiveSizing);
    } else {
        syncResponsiveSizing();
    }
    window.addEventListener('resize', syncResponsiveSizing);

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

    document.querySelectorAll('.nav-links a, .nav-icon-link, .nav-icon-btn, .product-panel, .team-avatar-item, .team-nav-btn, .btn-submit, .btn-modal-cta, .btn-modal-cta-secondary, .btn-google-signin, .qty-btn, .shop-glass-card, .btn-line-cta, .btn-back-to-top, .btn-music-toggle, .btn-mobile-sound-toggle, .btn-sound-toggle, .btn-copy-email, .faq-card, .auth-checkbox-row, .auth-tab, .auth-forgot-link, .hamburger-btn, .modal-close, .policy-link, .footer-social a, .thumb-item, .section-dot, .scroll-down-indicator, .account-avatar, .avatar-option, .account-title-select').forEach(el => {
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

    function openModal(modal) {
        lastFocusedBeforeModal = document.activeElement;
        modal.removeAttribute('inert');
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('active');
        const focusable = getFocusableElements(modal);
        (focusable[0] || modal).focus();
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('inert', '');
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
       ========================================= */
    (function initBirthdayPicker() {
        const wrap = document.querySelector('.date-picker-wrap');
        if (!wrap) return;

        const trigger = document.getElementById('signup-birthday-trigger');
        const display = document.getElementById('signup-birthday-display');
        const hiddenInput = document.getElementById('signup-birthday');
        const panel = document.getElementById('signup-birthday-panel');
        const label = document.getElementById('signup-birthday-label');
        const grid = document.getElementById('signup-birthday-grid');
        const btnClear = document.getElementById('signup-birthday-clear');
        const btnToday = document.getElementById('signup-birthday-today');
        const weekdaysEl = wrap.querySelector('.date-picker-weekdays');

        const today = new Date();
        let viewYear = today.getFullYear();
        let viewMonth = today.getMonth(); // 0-11
        let viewMode = 'day'; // 'day' | 'year'
        let selected = null; // { year, month, day }

        function pad(n) { return String(n).padStart(2, '0'); }

        function updateTrigger() {
            if (selected) {
                display.textContent = `${selected.year}/${pad(selected.month + 1)}/${pad(selected.day)}`;
                trigger.classList.add('has-value');
                hiddenInput.value = `${selected.year}-${pad(selected.month + 1)}-${pad(selected.day)}`;
            } else {
                display.textContent = '年 / 月 / 日';
                trigger.classList.remove('has-value');
                hiddenInput.value = '';
            }
        }

        function daysInMonth(year, month) {
            return new Date(year, month + 1, 0).getDate();
        }

        function renderDayView() {
            weekdaysEl.hidden = false;
            grid.classList.remove('year-view');
            label.textContent = `${viewYear} 年 ${pad(viewMonth + 1)} 月`;

            const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
            const total = daysInMonth(viewYear, viewMonth);
            const prevTotal = daysInMonth(viewYear, viewMonth - 1);

            let html = '';
            for (let i = firstWeekday - 1; i >= 0; i--) {
                html += `<button type="button" class="date-picker-day outside" disabled>${prevTotal - i}</button>`;
            }
            for (let d = 1; d <= total; d++) {
                const isSelected = selected && selected.year === viewYear && selected.month === viewMonth && selected.day === d;
                const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
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
                    selected = { year: viewYear, month: viewMonth, day: parseInt(btn.dataset.day, 10) };
                    updateTrigger();
                    closePanel();
                });
            });
        }

        function renderYearView() {
            weekdaysEl.hidden = true;
            grid.classList.add('year-view');
            const startYear = viewYear - (viewYear % 20);
            label.textContent = `${startYear} - ${startYear + 19}`;

            let html = '';
            for (let y = startYear; y < startYear + 20; y++) {
                const isSelected = y === viewYear;
                html += `<button type="button" class="date-picker-year${isSelected ? ' selected' : ''}" data-year="${y}">${y}</button>`;
            }
            grid.innerHTML = html;

            grid.querySelectorAll('.date-picker-year').forEach(btn => {
                btn.addEventListener('click', () => {
                    viewYear = parseInt(btn.dataset.year, 10);
                    viewMode = 'day';
                    render();
                });
            });
        }

        function render() {
            if (viewMode === 'day') renderDayView();
            else renderYearView();
        }

        function openPanel() {
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            viewMode = 'day';
            if (selected) { viewYear = selected.year; viewMonth = selected.month; }
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

        label.addEventListener('click', () => {
            viewMode = viewMode === 'day' ? 'year' : 'day';
            render();
        });

        wrap.querySelector('[data-nav="prev"]').addEventListener('click', () => {
            if (viewMode === 'day') {
                viewMonth--;
                if (viewMonth < 0) { viewMonth = 11; viewYear--; }
            } else {
                viewYear -= 20;
            }
            render();
        });

        wrap.querySelector('[data-nav="next"]').addEventListener('click', () => {
            if (viewMode === 'day') {
                viewMonth++;
                if (viewMonth > 11) { viewMonth = 0; viewYear++; }
            } else {
                viewYear += 20;
            }
            render();
        });

        btnClear.addEventListener('click', () => {
            selected = null;
            updateTrigger();
            closePanel();
        });

        btnToday.addEventListener('click', () => {
            viewYear = today.getFullYear();
            viewMonth = today.getMonth();
            viewMode = 'day';
            render();
        });

        document.addEventListener('click', (e) => {
            if (!panel.hidden && !wrap.contains(e.target)) closePanel();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !panel.hidden) closePanel();
        });

        updateTrigger();
    })();
});