document.addEventListener('DOMContentLoaded', () => {
    // 品牌故事與角色資料分開呈現，沿用既有角色內容分頁。
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
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activate(tab));
            tab.addEventListener('keydown', event => {
                let target;
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') target = tabs[1 - index];
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
});
