document.addEventListener('DOMContentLoaded', () => {

    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUser = null;

    /* =========================================
       1. 會員登入／註冊
       ========================================= */
    const authModal = document.getElementById('auth-modal');
    const authModalClose = document.getElementById('auth-modal-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const navAccountIconPerson = document.getElementById('nav-account-icon-person');
    const navAccountIconCrown = document.getElementById('nav-account-icon-crown');
    const navAccountIconPersonMobile = document.getElementById('nav-account-icon-person-mobile');
    const navAccountIconCrownMobile = document.getElementById('nav-account-icon-crown-mobile');
    // 桌機版跟手機版分頁列各自有一顆會員圖示按鈕（見 index.html 裡的
    // #nav-btn-account／#nav-btn-account-mobile，都共用 class="nav-account-btn"），
    // 但這裡原本只綁定桌機版那顆的 id，手機版分頁列的會員鈕從來沒有真的
    // 接上開合彈窗的邏輯——點了完全沒反應。改成用 class 選取兩顆，事件/
    // 圖示切換/title 提示文字都同步套用，不用維護兩份重複邏輯、也不用
    // 再單獨保留桌機版那個 id 變數
    const navAccountBtns = document.querySelectorAll('.nav-account-btn');

    const authErrorMessages = {
        'auth/invalid-email': '信箱格式不正確',
        'auth/user-disabled': '此帳號已被停用',
        'auth/user-not-found': '查無此帳號',
        'auth/wrong-password': '密碼錯誤',
        'auth/invalid-credential': '帳號或密碼錯誤',
        'auth/email-already-in-use': '此信箱已被註冊',
        'auth/weak-password': '密碼強度不足，至少需要 6 碼',
        'auth/popup-blocked': '登入視窗被擋下來了，請允許彈出視窗後再試一次',
        'auth/popup-closed-by-user': '登入視窗已關閉，沒有完成登入',
        'auth/cancelled-popup-request': '登入視窗已關閉，沒有完成登入',
        'auth/network-request-failed': '網路連線不穩，請再試一次',
        'auth/operation-not-supported-in-this-environment': '這個瀏覽器不支援 Google 登入，請改用信箱登入',
        'auth/web-storage-unsupported': '這個瀏覽器不支援 Google 登入，請改用信箱登入'
    };

    function authErrorText(err) {
        return authErrorMessages[err.code] || ('發生錯誤，請稍後再試（' + err.code + '）');
    }

    function switchAuthTab(tab) {
        authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        loginForm.hidden = tab !== 'login';
        signupForm.hidden = tab !== 'signup';
        loginError.hidden = true;
        signupError.hidden = true;
    }

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    function openAuthModal(tab) {
        switchAuthTab(tab || 'login');
        openModal(authModal);
    }

    /* --- 會員資料彈窗：登入後點擊皇冠圖示顯示，開啟時即時從 Firestore 抓資料填入。
       大頭貼切換／封號／會員等級／優惠券在資料庫裡沒有對應欄位（從沒建過後端），
       畫面上已經拿掉，只接了真的有資料的欄位：姓名/信箱/電話/生日/加入日期/會員等級/累積金額/購買紀錄/登出 --- */
    const accountModal = document.getElementById('account-modal');
    const accountModalClose = document.getElementById('account-modal-close');
    const accountInfoName = document.getElementById('account-info-name');
    const accountInfoEmail = document.getElementById('account-info-email');
    const accountInfoPhone = document.getElementById('account-info-phone');
    const accountInfoBirthday = document.getElementById('account-info-birthday');
    const accountInfoCreated = document.getElementById('account-info-created');
    const accountInfoTier = document.getElementById('account-info-tier');
    const accountInfoSpend = document.getElementById('account-info-spend');
    const accountTierProgressFill = document.getElementById('account-tier-progress-fill');
    const accountTierProgressText = document.getElementById('account-tier-progress-text');

    /* 會員遊戲卡三面切換（資訊／累積／購買）。
       點上方頁籤、在卡片上左右滑動、或在頁籤上按左右鍵都能切換。
       切換時卡片不旋轉，只有內容淡入。
       用 hidden 屬性換面（pagination.js 會重新量，但卡片高度固定，不會多出分頁）。 */
    const gameCardInner = document.getElementById('game-card-inner');
    const gameTabs = [...document.querySelectorAll('.game-card-tab')];
    const gameFaces = [0, 1, 2].map(i => document.getElementById('game-face-' + i));
    let gameFace = 0;
    function showGameFace(next, dir) {
        if (!gameCardInner || next === gameFace || next < 0 || next > 2) return;
        const sign = dir || (next > gameFace ? 1 : -1);
        gameFaces[gameFace].hidden = true;
        gameFaces[next].hidden = false;
        gameTabs.forEach((tab, i) => {
            tab.setAttribute('aria-selected', String(i === next));
            tab.tabIndex = i === next ? 0 : -1;
        });
        gameFace = next;
        // 卡片本身不動（擁有者指定不要旋轉），只有內容從滑動方向輕輕淡入
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !gameFaces[next].animate) return;
        gameFaces[next].animate(
            [{ opacity: 0, transform: `translateX(${12 * sign}px)` }, { opacity: 1, transform: 'translateX(0)' }],
            { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
    }
    gameTabs.forEach((tab, i) => {
        tab.addEventListener('click', () => showGameFace(i));
        tab.addEventListener('keydown', e => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            const next = (gameFace + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
            showGameFace(next, e.key === 'ArrowRight' ? 1 : -1);
            gameTabs[next].focus();
        });
    });
    if (gameCardInner) {
        let sx = 0, sy = 0, tracking = false;
        gameCardInner.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; tracking = true; });
        gameCardInner.addEventListener('pointerup', e => {
            if (!tracking) return;
            tracking = false;
            const dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            showGameFace(gameFace + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        });
        gameCardInner.addEventListener('pointercancel', () => { tracking = false; });
    }
    // 每次打開會員資料都從第一面開始
    window.resetGameCard = () => {
        if (!gameCardInner) return;
        gameFaces.forEach((f, i) => { f.hidden = i !== 0; });
        gameTabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === 0)); tab.tabIndex = i === 0 ? 0 : -1; });
        gameFace = 0;
    };
    const btnAccountLogout = document.getElementById('btn-account-logout');
    const historyMonthPrev = document.getElementById('history-month-prev');
    const historyMonthNext = document.getElementById('history-month-next');
    const historyMonthLabel = document.getElementById('history-month-label');
    const accountHistoryList = document.getElementById('account-history-list');
    const accountHistoryEmpty = document.getElementById('account-history-empty');

    let completedOrders = [];
    let historyViewDate = new Date();

    // dateLike 可能是 <input type="date"> 存的 'YYYY-MM-DD' 字串，也可能是 Firestore Timestamp
    function formatDateSlash(dateLike) {
        if (!dateLike) return '—';
        let d;
        if (typeof dateLike === 'string') {
            d = new Date(`${dateLike}T00:00:00`);
        } else if (typeof dateLike.toDate === 'function') {
            d = dateLike.toDate();
        } else {
            return '—';
        }
        if (isNaN(d.getTime())) return '—';
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    }

    // 會員等級用現有的 points 欄位即時換算，不用另外存欄位。點數是消費金額
    // /10（見 admin.js 的 earnedPoints），門檻原本是銀 1000／金 5000 點，
    // 換算回消費金額要 1 萬／5 萬元，以商品均價 NT$400-650 來看等於要買
    // 75-125 次才有金卡，等級制度形同虛設——改成銀 300／金 1000 點，
    // 對應消費滿 3,000／10,000 元，大約買 5-8 次、15-20 次就能感受到升級
    function getMemberTier(points) {
        if (points >= 1000) return '金卡會員';
        if (points >= 300) return '銀卡會員';
        return '銅卡會員';
    }

    // 進度條門檻直接用消費金額（累積金額 completedSpend），跟 getMemberTier
    // 的 points 門檻（300／1000）換算成消費金額是同一組數字（points = 消費
    // /10，見 admin.js 的 earnedPoints），只是這裡不用再繞回點數
    const TIER_SPEND_THRESHOLDS = { silver: 3000, gold: 10000 };

    function getTierProgress(spend) {
        if (spend >= TIER_SPEND_THRESHOLDS.gold) {
            return { percent: 100, text: '已達最高等級' };
        }
        const target = spend >= TIER_SPEND_THRESHOLDS.silver ? TIER_SPEND_THRESHOLDS.gold : TIER_SPEND_THRESHOLDS.silver;
        const base = spend >= TIER_SPEND_THRESHOLDS.silver ? TIER_SPEND_THRESHOLDS.silver : 0;
        const percent = Math.min(100, Math.max(0, ((spend - base) / (target - base)) * 100));
        const remaining = target - spend;
        // 中欄卡片較窄，文字要短到不會換行（見 CSS 的 white-space:nowrap）——
        // 拿掉「會員」跟多餘空格，金額前不留空格，比原本「再消費 NT$ X 升級XX會員」
        // 短了近 1/4
        const nextTier = target === TIER_SPEND_THRESHOLDS.gold ? '金卡' : '銀卡';
        return { percent, text: `還差 NT$${remaining.toLocaleString()} 升${nextTier}` };
    }

    // 生日跟姓名/信箱/電話一樣是唯讀欄位，只顯示註冊當下填的值——原本這格
    // 做成可以直接點開月曆重新選日期並寫回 Firestore，但跟其他唯讀欄位混在
    // 同一份清單裡，只有這格有可點的樣式/箭頭，使用者容易誤會是排版錯誤。
    // 值存成 'MM-DD'（見 script.js 的 signup 生日選擇器），這裡轉成跟原本
    // 顯示格式一致的 'MM / DD'
    function formatBirthdayDisplay(value) {
        if (!value || typeof value !== 'string') return '—';
        const parts = value.split('-');
        if (parts.length !== 2) return '—';
        return `${parts[0]} / ${parts[1]}`;
    }

    function renderAccountProfile(uid) {
        db.collection('users').doc(uid).get().then(doc => {
            const data = doc.exists ? doc.data() : {};
            accountInfoName.textContent = data.displayName || '—';
            accountInfoEmail.textContent = data.email || (currentUser && currentUser.email) || '—';
            accountInfoPhone.textContent = data.phone || '—';
            accountInfoBirthday.textContent = formatBirthdayDisplay(data.birthday);
            accountInfoCreated.textContent = formatDateSlash(data.createdAt);
            const points = data.points || 0;
            const spend = data.completedSpend || 0;
            if (accountInfoTier) accountInfoTier.textContent = getMemberTier(points);
            const heroClass = document.getElementById('game-hero-class');
            if (heroClass) heroClass.textContent = getMemberTier(points);
            if (accountInfoSpend) accountInfoSpend.textContent = 'NT$ ' + spend.toLocaleString();
            if (accountTierProgressFill && accountTierProgressText) {
                const progress = getTierProgress(spend);
                accountTierProgressFill.style.width = progress.percent + '%';
                accountTierProgressText.textContent = progress.text;
            }
        });
    }

    // 購買紀錄只列已完成訂單（status: 'completed'，見 admin.js 的訂單狀態切換）
    function renderHistoryMonth() {
        const y = historyViewDate.getFullYear();
        const m = historyViewDate.getMonth();
        historyMonthLabel.textContent = `${y}年${String(m + 1).padStart(2, '0')}月`;

        accountHistoryList.querySelectorAll('.account-history-item').forEach(el => el.remove());

        const monthOrders = completedOrders.filter(o => {
            const d = o.createdAt && typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : null;
            return d && d.getFullYear() === y && d.getMonth() === m;
        });

        const pager = document.getElementById('game-items-pager');
        const pageLabel = document.getElementById('game-items-page');
        if (monthOrders.length === 0) {
            accountHistoryEmpty.hidden = false;
            if (pager) pager.hidden = true;
            return;
        }
        accountHistoryEmpty.hidden = true;

        /* 道具欄：一筆訂單一列（日期、品項、小計），卡片內一頁最多 3 筆，
           超過用下方上下頁切換，卡片本身不捲動 */
        // 手機滿版卡片空間大，一頁放 5 筆；桌機小卡放 3 筆
        const perPage = window.matchMedia('(max-width: 1024px)').matches ? 5 : 3;
        const pages = Math.ceil(monthOrders.length / perPage);
        historyItemPage = Math.min(historyItemPage, pages - 1);
        if (pager) {
            pager.hidden = pages <= 1;
            pageLabel.textContent = `${historyItemPage + 1} / ${pages}`;
            document.getElementById('game-items-prev').disabled = historyItemPage === 0;
            document.getElementById('game-items-next').disabled = historyItemPage >= pages - 1;
        }

        monthOrders.slice(historyItemPage * perPage, historyItemPage * perPage + perPage).forEach(order => {
            const d = order.createdAt.toDate();
            const date = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
            const items = (order.items || []).map(it => `${it.name} ×${it.qty}`).join('、') || '—';

            const div = document.createElement('div');
            div.className = 'account-history-item game-item';
            const icon = document.createElement('span');
            icon.className = 'game-item-icon';
            icon.setAttribute('aria-hidden', 'true');
            const body = document.createElement('span');
            body.className = 'game-item-body';
            const name = document.createElement('span');
            name.className = 'game-item-name';
            name.textContent = items;
            const meta = document.createElement('span');
            meta.className = 'game-item-meta';
            meta.textContent = `${date}・#${order.id.slice(0, 6).toUpperCase()}`;
            body.append(name, meta);
            const price = document.createElement('span');
            price.className = 'game-item-price';
            price.textContent = `NT$${Number(order.subtotal || 0).toLocaleString()}`;
            div.append(icon, body, price);
            accountHistoryList.insertBefore(div, accountHistoryEmpty);
        });
    }
    let historyItemPage = 0;
    const gameItemsPrev = document.getElementById('game-items-prev');
    const gameItemsNext = document.getElementById('game-items-next');
    if (gameItemsPrev) gameItemsPrev.addEventListener('click', () => { historyItemPage = Math.max(0, historyItemPage - 1); renderHistoryMonth(); });
    if (gameItemsNext) gameItemsNext.addEventListener('click', () => { historyItemPage += 1; renderHistoryMonth(); });

    function loadAccountHistory(uid) {
        // 只用單一 where 相等條件查詢（不加 orderBy），避免需要額外建立 Firestore 複合索引；
        // 排序、狀態篩選、月份分組全部改在前端做
        db.collection('orders').where('uid', '==', uid).get().then(snapshot => {
            completedOrders = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(o => o.status === 'completed')
                .sort((a, b) => {
                    const at = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                    const bt = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
                    return bt - at;
                });
            historyViewDate = new Date();
            historyItemPage = 0;
            const count = document.getElementById('game-order-count');
            if (count) count.textContent = completedOrders.length + ' 筆';
            renderHistoryMonth();
        });
    }

    historyMonthPrev.addEventListener('click', () => {
        historyViewDate = new Date(historyViewDate.getFullYear(), historyViewDate.getMonth() - 1, 1);
        historyItemPage = 0;
        renderHistoryMonth();
    });

    historyMonthNext.addEventListener('click', () => {
        historyViewDate = new Date(historyViewDate.getFullYear(), historyViewDate.getMonth() + 1, 1);
        historyItemPage = 0;
        renderHistoryMonth();
    });

    function openAccountModal() {
        if (!currentUser) return;
        if (window.resetGameCard) window.resetGameCard();
        renderAccountProfile(currentUser.uid);
        loadAccountHistory(currentUser.uid);
        openModal(accountModal);
    }

    navAccountBtns.forEach(btn => btn.addEventListener('click', () => {
        if (currentUser) {
            openAccountModal();
        } else {
            openAuthModal('login');
        }
    }));

    accountModalClose.addEventListener('click', () => closeModal(accountModal));

    btnAccountLogout.addEventListener('click', () => {
        auth.signOut().then(() => closeModal(accountModal));
    });

    authModalClose.addEventListener('click', () => closeModal(authModal));

    function setSubmitLoading(button, loading) {
        const textEl = button.querySelector('.btn-text');
        if (loading) {
            button.dataset.originalText = textEl.textContent;
            textEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 處理中...';
            button.disabled = true;
        } else {
            textEl.textContent = button.dataset.originalText || textEl.textContent;
            button.disabled = false;
        }
    }

    // 信箱欄按鍵盤的「下一個」直接跳到密碼欄，不要提早送出
    document.getElementById('login-email').addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        document.getElementById('login-password').focus();
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.hidden = true;
        const btn = document.getElementById('btn-login-submit');
        setSubmitLoading(btn, true);

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('login-remember').checked;
        const persistence = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;

        auth.setPersistence(persistence)
            .then(() => auth.signInWithEmailAndPassword(email, password))
            .then(cred => {
                loginForm.reset();
                closeModal(authModal);
                db.collection('users').doc(cred.user.uid).update({
                    loginCount: firebase.firestore.FieldValue.increment(1)
                }).catch(err => console.error('更新登入次數失敗', err));
            })
            .catch(err => {
                loginError.classList.remove('auth-success');
                loginError.textContent = authErrorText(err);
                loginError.hidden = false;
            })
            .finally(() => setSubmitLoading(btn, false));
    });

    /* --- 忘記密碼：寄送 Firebase 重設密碼信 --- */
    const btnForgotPassword = document.getElementById('btn-forgot-password');

    if (btnForgotPassword) {
        btnForgotPassword.addEventListener('click', () => {
            const email = document.getElementById('login-email').value.trim();
            loginError.classList.remove('auth-success');

            if (!email) {
                loginError.textContent = '請先在信箱欄位輸入您的帳號信箱，再點擊忘記密碼';
                loginError.hidden = false;
                return;
            }

            auth.sendPasswordResetEmail(email)
                .then(() => {
                    loginError.classList.add('auth-success');
                    loginError.textContent = '重設密碼信件已寄出，請至信箱查收';
                    loginError.hidden = false;
                })
                .catch(err => {
                    loginError.textContent = authErrorText(err);
                    loginError.hidden = false;
                });
        });
    }

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signupError.hidden = true;
        const btn = document.getElementById('btn-signup-submit');
        setSubmitLoading(btn, true);

        const name = document.getElementById('signup-name').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const birthday = document.getElementById('signup-birthday').value;
        const preferredStore = document.getElementById('signup-store').value;
        const marketingOptIn = document.getElementById('signup-marketing').checked;

        auth.createUserWithEmailAndPassword(email, password)
            .then(cred => {
                return db.collection('users').doc(cred.user.uid).set({
                    displayName: name,
                    phone: phone,
                    email: email,
                    birthday: birthday || null,
                    preferredStore: preferredStore || null,
                    marketingOptIn: marketingOptIn,
                    loginCount: 1,
                    points: 0,
                    completedSpend: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                signupForm.reset();
                closeModal(authModal);
            })
            .catch(err => {
                signupError.textContent = authErrorText(err);
                signupError.hidden = false;
            })
            .finally(() => setSubmitLoading(btn, false));
    });

    /* --- Google 帳號登入（第一次登入會自動建立帳號，不需要另外註冊）
       注意：Google 登入用的是彈出視窗跳轉授權，只能在真正的網域（或 localhost）下運作，
       用 file:// 直接開啟網頁測試不了，等網站部署到正式網址後才能測 --- */
    const btnGoogleSignin = document.getElementById('btn-google-signin');
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    if (btnGoogleSignin) {
        btnGoogleSignin.addEventListener('click', () => {
            const activeError = loginForm.hidden ? signupError : loginError;
            activeError.hidden = true;

            /* 2026-11-23 擁有者回報：iPhone「加到主畫面」的 App 用 Google 登入會跳紅字錯誤。
               iPhone 主畫面 App 開不了 Google 的登入小視窗（Safari、Android 都正常），
               LINE／FB／IG 內建瀏覽器則是 Google 自己會擋。這兩種情況先講清楚該怎麼做，不去硬試。 */
            const ua = navigator.userAgent;
            const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
            const isIOSHomeApp = isIOS && (navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches);
            const isInAppBrowser = /Line\/|FBAN|FBAV|FB_IAB|Instagram/i.test(ua);
            if (isIOSHomeApp || isInAppBrowser) {
                activeError.textContent = isIOSHomeApp
                    ? 'iPhone 主畫面的 App 目前不能用 Google 登入。請改用信箱登入，或用 Safari 打開網站再用 Google 登入。'
                    : '在 LINE／Facebook／Instagram 裡打開的網頁不能用 Google 登入。請點右上角選單，改用 Safari 或 Chrome 打開。';
                activeError.hidden = false;
                return;
            }

            auth.signInWithPopup(googleProvider)
                .then(result => {
                    return db.collection('users').doc(result.user.uid).set({
                        displayName: result.user.displayName || '',
                        email: result.user.email || '',
                        provider: 'google',
                        loginCount: firebase.firestore.FieldValue.increment(1),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                })
                .then(() => closeModal(authModal))
                .catch(err => {
                    activeError.textContent = authErrorText(err);
                    activeError.hidden = false;
                });
        });
    }

    // 桌機／手機各一組人像/皇冠圖示，登入狀態切換時兩組要同步——用陣列
    // 迴圈取代手動各寫一次，之後不會再漏掉某一邊（同一類疏漏今天已經
    // 在點擊事件、購物車徽章上各踩過一次）
    const navAccountIconPairs = [
        [navAccountIconPerson, navAccountIconCrown],
        [navAccountIconPersonMobile, navAccountIconCrownMobile],
    ];

    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            // 登入後：人像圖示換成皇冠，代表已是會員；滑鼠移上去看得到姓名。
            // 桌機版這兩個是 <svg>，不是普通 HTML 元素——實測 SVGElement 的
            // .hidden 屬性賦值不會反映到實際的 hidden attribute（跟
            // HTMLElement 不一樣），賦值後畫面不會真的切換，所以這裡改用
            // setAttribute/removeAttribute 直接操作
            navAccountIconPairs.forEach(([person, crown]) => {
                person.setAttribute('hidden', '');
                crown.removeAttribute('hidden');
            });
            navAccountBtns.forEach(btn => btn.setAttribute('aria-label', '會員專區'));
            // 2026-11-24 擁有者：每次都要重新登入。請瀏覽器把本站資料（含登入狀態）列為「不要自動清掉」，
            // iPhone 主畫面 App 與 Chrome 都支援；不支援的瀏覽器就略過，不影響登入。
            if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
            db.collection('users').doc(user.uid).get().then(doc => {
                const name = (doc.exists && doc.data().displayName) || user.email;
                navAccountBtns.forEach(btn => { btn.title = name + '（點擊登出）'; });
            });
            subscribeCart(user.uid);
        } else {
            navAccountIconPairs.forEach(([person, crown]) => {
                person.removeAttribute('hidden');
                crown.setAttribute('hidden', '');
            });
            navAccountBtns.forEach(btn => {
                btn.setAttribute('aria-label', '會員登入');
                btn.title = '會員登入';
            });
            unsubscribeCart();
        }
    });

    /* =========================================
       2. 產品彈窗：數量調整（加入購物車的實際寫入邏輯在後續步驟接上）
       ========================================= */
    const qtyMinus = document.getElementById('product-modal-qty-minus');
    const qtyPlus = document.getElementById('product-modal-qty-plus');
    const qtyValue = document.getElementById('product-modal-qty-value');
    const modalPriceEl = document.getElementById('product-modal-price');
    const productModalEl = document.getElementById('product-modal');

    // 價錢跟著數量+/-即時變化，顯示「單價 × 數量」的小計，不是固定的單價——
    // 單價由 script.js 的 openProductModal() 寫進 productModalEl.dataset.unitPrice
    function updateModalPrice() {
        const unitPrice = parseInt(productModalEl.dataset.unitPrice, 10) || 0;
        const qty = parseInt(qtyValue.textContent, 10) || 1;
        modalPriceEl.textContent = 'NT$ ' + (unitPrice * qty).toLocaleString();
    }

    function resetProductQty() {
        qtyValue.textContent = '1';
        updateModalPrice();
    }

    qtyMinus.addEventListener('click', () => {
        const current = parseInt(qtyValue.textContent, 10);
        if (current > 1) qtyValue.textContent = current - 1;
        updateModalPrice();
    });

    qtyPlus.addEventListener('click', () => {
        const current = parseInt(qtyValue.textContent, 10);
        qtyValue.textContent = current + 1;
        updateModalPrice();
    });

    // 每次開啟產品彈窗時，數量重置為 1、價錢跟著重算回單價。
    // openProductModal() 是 script.js 內部（DOMContentLoaded 閉包）的區域函式，
    // 這裡拿不到參照，改用 MutationObserver 監看 #product-modal 的 active class 變化來偵測開啟。
    if (productModalEl) {
        new MutationObserver(() => {
            if (productModalEl.classList.contains('active')) resetProductQty();
        }).observe(productModalEl, { attributes: true, attributeFilter: ['class'] });
    }

    /* =========================================
       3. 購物車（需登入；資料存在 carts/{uid} 單一文件的 items 陣列）
       ========================================= */
    const cartModal = document.getElementById('cart-modal');
    const cartModalClose = document.getElementById('cart-modal-close');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartEmptyEl = document.getElementById('cart-empty');
    const cartEmptyCta = document.getElementById('cart-empty-cta');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartSummaryEl = document.getElementById('cart-summary');
    const cartBadge = document.getElementById('cart-badge');
    const cartBadgeMobile = document.getElementById('cart-badge-mobile');
    const btnGoCheckout = document.getElementById('btn-go-checkout');
    // 跟會員鈕同一個問題：手機版分頁列的購物車鈕（#nav-btn-cart-mobile，
    // 共用 class="nav-cart-btn"）原本沒有真的綁定開合彈窗的邏輯
    const navCartBtns = document.querySelectorAll('.nav-cart-btn');
    const addToCartBtn = document.getElementById('product-modal-add-cart');
    const addCartNote = document.getElementById('product-modal-add-note');
    const cartBody = document.getElementById('cart-body');
    const cartLoginGate = document.getElementById('cart-login-gate');
    const cartLoginGateCta = document.getElementById('cart-login-gate-cta');

    let cartItems = [];
    let cartUnsubscribe = null;

    function cartTotal() {
        return cartItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    }

    function saveCart() {
        return db.collection('carts').doc(currentUser.uid).set({
            items: cartItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    let animateCartBadge = false;

    function renderCartBadge() {
        const count = cartItems.reduce((sum, it) => sum + it.qty, 0);
        [cartBadge, cartBadgeMobile].forEach(badge => {
            badge.textContent = count;
            badge.hidden = count === 0;

            if (animateCartBadge && count > 0) {
                badge.classList.remove('cart-badge-pop');
                requestAnimationFrame(() => {
                    badge.classList.add('cart-badge-pop');
                    badge.addEventListener('animationend', () => badge.classList.remove('cart-badge-pop'), { once: true });
                });
            }
        });
        animateCartBadge = false;
    }

    function renderCartModal() {
        const loggedIn = !!currentUser;
        cartLoginGate.hidden = loggedIn;
        cartBody.hidden = !loggedIn;

        cartItemsList.innerHTML = '';
        const hasItems = cartItems.length > 0;
        cartEmptyEl.hidden = hasItems;
        cartSummaryEl.hidden = !hasItems;
        btnGoCheckout.hidden = !hasItems;
        btnGoCheckout.disabled = !hasItems;

        cartItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'cart-line-item';
            li.innerHTML = `
                <div class="cart-line-info">
                    <div class="cart-line-name">${item.name}</div>
                    <div class="cart-line-price">NT$ ${item.price} × ${item.qty}</div>
                </div>
                <div class="qty-stepper">
                    <button type="button" class="qty-btn cart-qty-minus" aria-label="減少數量">&minus;</button>
                    <span>${item.qty}</span>
                    <button type="button" class="qty-btn cart-qty-plus" aria-label="增加數量">&plus;</button>
                </div>
                <button type="button" class="cart-line-remove" aria-label="移除"><i class="fa-solid fa-trash"></i></button>
            `;
            li.querySelector('.cart-qty-minus').addEventListener('click', () => {
                if (item.qty > 1) { item.qty -= 1; } else { cartItems.splice(index, 1); }
                saveCart();
            });
            li.querySelector('.cart-qty-plus').addEventListener('click', () => {
                item.qty += 1;
                saveCart();
            });
            li.querySelector('.cart-line-remove').addEventListener('click', () => {
                cartItems.splice(index, 1);
                saveCart();
            });
            cartItemsList.appendChild(li);
        });

        cartSubtotalEl.textContent = 'NT$ ' + cartTotal();
        renderCartBadge();
    }

    function subscribeCart(uid) {
        cartUnsubscribe = db.collection('carts').doc(uid).onSnapshot(doc => {
            cartItems = (doc.exists && doc.data().items) || [];
            renderCartModal();
        }, err => {
            // 原本沒有錯誤處理：onSnapshot 失敗（例如 Firestore 權限規則擋下讀取）
            // 會靜默失敗，success callback 永遠不會觸發，renderCartModal() 就
            // 沒機會重新執行，購物車彈窗會卡在登入前的「請先登入會員」畫面，
            // 即使 currentUser 其實已經是登入狀態——先印出錯誤方便排查，
            // 並且仍然呼叫 renderCartModal() 讓「已登入」這件事至少能正確反映
            // 在畫面上（只是購物車內容讀不到、視為空清單），不要整個卡住
            console.error('讀取購物車失敗，請檢查 Firestore 權限規則：', err);
            cartItems = [];
            renderCartModal();
        });
    }

    function unsubscribeCart() {
        if (cartUnsubscribe) { cartUnsubscribe(); cartUnsubscribe = null; }
        cartItems = [];
        renderCartModal();
    }

    navCartBtns.forEach(btn => btn.addEventListener('click', () => {
        openModal(cartModal);
    }));

    cartModalClose.addEventListener('click', () => closeModal(cartModal));

    // 兩個彈窗 z-index 相同（都是 .modal-overlay 共用的 2000），疊層順序只看
    // HTML 裡誰寫在後面——auth-modal 在 cart-modal 之前，購物車沒關就直接疊開
    // 登入彈窗，登入表單會被還開著的購物車彈窗蓋在下面，畫面上看起來像
    // 「按了沒反應」。先關購物車再開登入彈窗，避免兩個 .active 彈窗疊在一起
    cartLoginGateCta.addEventListener('click', () => {
        closeModal(cartModal);
        openAuthModal('login');
    });

    // 購物車是空的時候「去看看有什麼好吃的」連結：先關掉購物車彈窗再捲到
    // 產品區塊，不然彈窗還開著會擋住捲動後的畫面
    if (cartEmptyCta) {
        cartEmptyCta.addEventListener('click', () => {
            closeModal(cartModal);
        });
    }

    // 寫進購物車的共用入口：產品彈窗、首頁產品區的「加入購物車」都走這裡，
    // 登入檢查、Firestore 同步、徽章動畫只維護一份。未登入回傳 false 並開登入彈窗
    function addItemToCart({ productId, name, price, qty }) {
        if (!currentUser) {
            openAuthModal('login');
            return false;
        }
        const existing = cartItems.find(it => it.productId === productId);
        if (existing) {
            existing.qty += qty;
        } else {
            cartItems.push({ productId, name, price, qty });
        }
        saveCart();
        animateCartBadge = true;
        renderCartBadge();
        if (typeof window.showItemGet === 'function') window.showItemGet(name, qty);
        return true;
    }
    window.addItemToCart = addItemToCart;

    addToCartBtn.addEventListener('click', () => {
        // 讀 dataset 存的單價，不是 #product-modal-price 畫面上的文字——
        // 那格現在顯示的是「單價×數量」小計（見上面 updateModalPrice），
        // 購物車每一行需要的是單價本身，乘法留給 renderCartModal 自己算
        const added = addItemToCart({
            productId: productModalEl.dataset.productId,
            name: document.getElementById('product-modal-title').textContent,
            price: parseInt(productModalEl.dataset.unitPrice, 10) || 0,
            qty: parseInt(qtyValue.textContent, 10) || 1
        });
        addCartNote.hidden = added;
        if (!added) return;

        const originalText = addToCartBtn.textContent;
        addToCartBtn.textContent = '已加入！';
        setTimeout(() => { addToCartBtn.textContent = originalText; }, 1200);
    });

    /* =========================================
       4. 取貨日期規則：最少提前 5 天，且不可為週一（公休）
       ========================================= */
    function toDateKey(d) {
        const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function getMinPickupDate() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 5);
        while (d.getDay() === 1) { d.setDate(d.getDate() + 1); } // 1 = 週一
        return d;
    }

    function isValidPickupDate(dateStr) {
        if (!dateStr) return false;
        const picked = new Date(`${dateStr}T00:00:00`);
        if (picked.getDay() === 1) return false;
        return picked >= getMinPickupDate();
    }

    /* =========================================
       5. 結帳彈窗：送出訂單
       ========================================= */
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutModalClose = document.getElementById('checkout-modal-close');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutSummary = document.getElementById('checkout-order-summary');
    const checkoutDateInput = document.getElementById('checkout-pickup-date');
    const checkoutDateError = document.getElementById('checkout-date-error');
    const checkoutNameInput = document.getElementById('checkout-name');
    const checkoutPhoneInput = document.getElementById('checkout-phone');
    const checkoutError = document.getElementById('checkout-error');
    const btnCheckoutSubmit = document.getElementById('btn-checkout-submit');

    btnGoCheckout.addEventListener('click', () => {
        if (cartItems.length === 0) return;
        closeModal(cartModal);

        checkoutSummary.innerHTML = cartItems.map(it =>
            `<div class="summary-line"><span>${it.name} × ${it.qty}</span><span>NT$ ${it.price * it.qty}</span></div>`
        ).join('') + `<div class="summary-line summary-total"><span>小計</span><span>NT$ ${cartTotal()}</span></div>`;

        checkoutDateInput.min = toDateKey(getMinPickupDate());
        checkoutDateInput.value = '';
        pickupPicker.reset();
        checkoutDateError.hidden = true;
        checkoutError.hidden = true;
        btnCheckoutSubmit.disabled = true;

        if (currentUser) {
            db.collection('users').doc(currentUser.uid).get().then(doc => {
                if (doc.exists) {
                    checkoutNameInput.value = doc.data().displayName || '';
                    checkoutPhoneInput.value = doc.data().phone || '';
                }
            });
        }

        openModal(checkoutModal);
    });

    checkoutModalClose.addEventListener('click', () => closeModal(checkoutModal));

    /* 複製匯款帳號：跟設計系統文件裡定案的「複製成功文字 #1F5C24」同一套語意色，
       不是隨手挑的綠色。圖示 1.2 秒後自動換回原本的複製圖示 */
    const checkoutCopyBtn = document.getElementById('checkout-copy-account');
    const checkoutAccountNum = document.getElementById('checkout-payment-account-num');
    if (checkoutCopyBtn && checkoutAccountNum) {
        checkoutCopyBtn.addEventListener('click', () => {
            const raw = checkoutAccountNum.textContent.replace(/-/g, '');
            navigator.clipboard.writeText(raw).then(() => {
                const icon = checkoutCopyBtn.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'fa-solid fa-check';
                checkoutCopyBtn.style.color = '#1F5C23';
                setTimeout(() => {
                    icon.className = originalClass;
                    checkoutCopyBtn.style.color = '';
                }, 1200);
            });
        });
    }

    /* 取貨日曆（2026-11-23，設計稿 https://claude.ai/artifact/3g7vrhRXLnXjqJ3W6GAULp ）
       - 可取貨的日子是白色圓鈕，太早或週一公休的日子變淡、點不下去。
       - 選好按「確定」才寫進隱藏的 #checkout-pickup-date，並觸發 change，沿用下面原本的檢查。
       - 只能往後看 3 個月。 */
    const pickupPicker = (function initPickupPicker() {
        const trigger = document.getElementById('pickup-trigger');
        const panel = document.getElementById('pickup-panel');
        if (!trigger || !panel) return { reset() {} };
        const display = document.getElementById('pickup-display');
        const monthLabel = document.getElementById('pickup-month');
        const grid = document.getElementById('pickup-grid');
        const prevBtn = document.getElementById('pickup-prev');
        const nextBtn = document.getElementById('pickup-next');
        const pickedText = document.getElementById('pickup-picked');
        const okBtn = document.getElementById('pickup-ok');
        const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
        const MAX_MONTHS_AHEAD = 3;
        let view = null;      // 目前顯示的月份（該月 1 號）
        let draft = '';       // 面板裡點選、還沒按確定的日期
        const label = key => {
            const d = new Date(`${key}T00:00:00`);
            return `${d.getMonth() + 1}/${d.getDate()}（${WEEK[d.getDay()]}）`;
        };
        const firstMonth = () => { const m = getMinPickupDate(); return new Date(m.getFullYear(), m.getMonth(), 1); };
        const lastMonth = () => { const f = firstMonth(); return new Date(f.getFullYear(), f.getMonth() + MAX_MONTHS_AHEAD - 1, 1); };

        function render() {
            const y = view.getFullYear(), m = view.getMonth();
            monthLabel.textContent = `${y} 年 ${m + 1} 月`;
            prevBtn.disabled = view <= firstMonth();
            nextBtn.disabled = view >= lastMonth();
            const min = getMinPickupDate();
            const frag = document.createDocumentFragment();
            for (let i = 0; i < view.getDay(); i++) frag.appendChild(document.createElement('span'));
            const days = new Date(y, m + 1, 0).getDate();
            for (let d = 1; d <= days; d++) {
                const date = new Date(y, m, d);
                const key = toDateKey(date);
                const monday = date.getDay() === 1;
                const ok = !monday && date >= min;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'pickup-day';
                btn.textContent = d;
                btn.dataset.date = key;
                btn.setAttribute('aria-label', `${m + 1}月${d}日（${WEEK[date.getDay()]}）${ok ? '' : (monday ? '，週一公休' : '，太早不能取貨')}`);
                if (!ok) { btn.disabled = true; btn.classList.add('is-off'); }
                if (key === draft) { btn.classList.add('is-picked'); btn.setAttribute('aria-pressed', 'true'); }
                frag.appendChild(btn);
            }
            grid.replaceChildren(frag);
            pickedText.textContent = draft ? `取貨日：${label(draft)}` : '請點一個日期';
            okBtn.disabled = !draft;
        }

        function open() {
            draft = checkoutDateInput.value;
            const base = draft ? new Date(`${draft}T00:00:00`) : getMinPickupDate();
            view = new Date(base.getFullYear(), base.getMonth(), 1);
            render();
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            const focusTarget = grid.querySelector('.is-picked') || grid.querySelector('.pickup-day:not(:disabled)') || nextBtn;
            focusTarget.focus({ preventScroll: true });
        }
        function close(refocus = true) {
            if (panel.hidden) return;
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (refocus) trigger.focus({ preventScroll: true });
        }

        trigger.addEventListener('click', () => (panel.hidden ? open() : close()));
        prevBtn.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
        nextBtn.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
        grid.addEventListener('click', e => {
            const btn = e.target.closest('.pickup-day');
            if (!btn || btn.disabled) return;
            draft = btn.dataset.date;
            render();
            const again = grid.querySelector(`[data-date="${draft}"]`);
            if (again) again.focus({ preventScroll: true });
        });
        okBtn.addEventListener('click', () => {
            if (!draft) return;
            checkoutDateInput.value = draft;
            display.textContent = label(draft);
            trigger.classList.add('has-value');
            close();
            checkoutDateInput.dispatchEvent(new Event('change'));
        });
        // 左右滑動換月份（手機）
        let touchX = null;
        grid.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
        grid.addEventListener('touchend', e => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(dx) < 50) return;
            const btn = dx < 0 ? nextBtn : prevBtn;
            if (!btn.disabled) btn.click();
        });
        // Esc 先關日曆，不要連結帳彈窗一起關
        panel.addEventListener('keydown', e => {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
        });
        document.addEventListener('pointerdown', e => {
            if (!panel.hidden && !panel.contains(e.target) && !trigger.contains(e.target)) close(false);
        });

        return {
            reset() {
                draft = '';
                display.textContent = '請選擇取貨日';
                trigger.classList.remove('has-value');
                close(false);
            }
        };
    })();

    checkoutDateInput.addEventListener('change', () => {
        if (isValidPickupDate(checkoutDateInput.value)) {
            checkoutDateError.hidden = true;
            btnCheckoutSubmit.disabled = false;
        } else {
            checkoutDateError.hidden = false;
            btnCheckoutSubmit.disabled = true;
            checkoutDateInput.value = '';
        }
    });

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        checkoutError.hidden = true;

        if (!isValidPickupDate(checkoutDateInput.value)) {
            checkoutDateError.hidden = false;
            return;
        }

        setSubmitLoading(btnCheckoutSubmit, true);

        const orderData = {
            uid: currentUser.uid,
            customerName: checkoutNameInput.value.trim(),
            phone: checkoutPhoneInput.value.trim(),
            email: currentUser.email,
            items: cartItems,
            subtotal: cartTotal(),
            pickupDate: checkoutDateInput.value,
            note: document.getElementById('checkout-note').value.trim(),
            status: 'new',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const receiptData = {
            items: cartItems.map(it => ({ ...it })),
            subtotal: orderData.subtotal,
            pickupDate: orderData.pickupDate,
            customerName: orderData.customerName
        };

        db.collection('orders').add(orderData)
            .then(() => {
                cartItems = [];
                return saveCart();
            })
            .then(() => {
                checkoutForm.reset();
                closeModal(checkoutModal);
                if (typeof window.showOrderReceipt === 'function') {
                    window.showOrderReceipt(receiptData);
                } else {
                    alert('訂單已送出！請依彈窗內的帳戶資訊完成匯款，我們確認款項後會於出貨前透過 LINE 提供取貨資訊。');
                }
            })
            .catch(err => {
                checkoutError.textContent = '訂單送出失敗，請稍後再試（' + err.code + '）';
                checkoutError.hidden = false;
            })
            .finally(() => setSubmitLoading(btnCheckoutSubmit, false));
    });

});
