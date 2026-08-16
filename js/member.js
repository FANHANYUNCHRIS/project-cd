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
    const navBtnAccount = document.getElementById('nav-btn-account');

    const authErrorMessages = {
        'auth/invalid-email': '信箱格式不正確',
        'auth/user-disabled': '此帳號已被停用',
        'auth/user-not-found': '查無此帳號',
        'auth/wrong-password': '密碼錯誤',
        'auth/invalid-credential': '帳號或密碼錯誤',
        'auth/email-already-in-use': '此信箱已被註冊',
        'auth/weak-password': '密碼強度不足，至少需要 6 碼'
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

    /* --- 會員資料彈窗：登入後點擊皇冠圖示顯示，取代原本直接跳 confirm() 問是否登出 --- */
    const accountModal = document.getElementById('account-modal');
    const accountModalClose = document.getElementById('account-modal-close');
    const btnAccountLogout = document.getElementById('btn-account-logout');
    const accountDisplayName = document.getElementById('account-display-name');
    const accountAvatarBtn = document.getElementById('account-avatar-btn');
    const accountAvatarIcon = document.getElementById('account-avatar-icon');
    const avatarPicker = document.getElementById('avatar-picker');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const accountTitleSelect = document.getElementById('account-title-select');
    const achievementOptgroup = document.getElementById('achievement-optgroup');
    const titleDropdown = document.getElementById('title-dropdown');
    const titleDropdownTrigger = document.getElementById('title-dropdown-trigger');
    const titleDropdownLabel = document.getElementById('title-dropdown-label');
    const titleDropdownPanel = document.getElementById('title-dropdown-panel');
    const accountInfoPhone = document.getElementById('account-info-phone');
    const accountInfoEmail = document.getElementById('account-info-email');
    const accountInfoBirthday = document.getElementById('account-info-birthday');
    const accountInfoCreated = document.getElementById('account-info-created');
    const accountInfoMemberNo = document.getElementById('account-info-memberno');
    const accountHistoryList = document.getElementById('account-history-list');
    const accountHistoryEmpty = document.getElementById('account-history-empty');
    const accountHistoryEmptyText = document.getElementById('account-history-empty-text');

    /* 成就封號：達到條件後自動出現在封號選單裡讓客人選用，不會憑空覆蓋掉客人原本選的封號 */
    const achievementTitles = [
        { label: '登入達人', check: data => (data.loginCount || 0) >= 10 },
        { label: '忠實會員', check: data => (data.loginCount || 0) >= 30 },
        { label: '消費新星', check: data => (data.completedSpend || 0) >= 1000 },
        { label: '甜點大戶', check: data => (data.completedSpend || 0) >= 5000 },
        { label: '傳說貴賓', check: data => (data.completedSpend || 0) >= 10000 }
    ];
    /* 12生肖大頭貼：內建可換，不用上傳圖片；SVG 線條圖跟 index.html 裡 .avatar-option 按鈕的圖示完全一致，
       這樣選擇後大頭貼跟選單裡按鈕看起來才是同一顆圖案 */
    const svgAttrs = 'viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
    const avatarIcons = {
        rat: `<svg ${svgAttrs}><circle cx="16" cy="19" r="7"/><circle cx="9" cy="11" r="2.5"/><circle cx="23" cy="11" r="2.5"/><line x1="5" y1="18" x2="10" y2="19"/><line x1="5" y1="22" x2="10" y2="21"/><line x1="27" y1="18" x2="22" y2="19"/><line x1="27" y1="22" x2="22" y2="21"/><circle cx="13" cy="18" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="0.8" fill="currentColor" stroke="none"/><circle cx="16" cy="24" r="1" fill="currentColor" stroke="none"/></svg>`,
        ox: `<svg ${svgAttrs}><circle cx="16" cy="19" r="7"/><path d="M8 13 Q4 8 8 5"/><path d="M24 13 Q28 8 24 5"/><circle cx="13" cy="18" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        tiger: `<svg ${svgAttrs}><circle cx="16" cy="19" r="7"/><path d="M9 13 L6 7 L12 11 Z"/><path d="M23 13 L26 7 L20 11 Z"/><line x1="10" y1="21" x2="13" y2="23"/><line x1="22" y1="21" x2="19" y2="23"/><circle cx="13" cy="18" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        rabbit: `<svg ${svgAttrs}><circle cx="16" cy="20" r="7"/><ellipse cx="11" cy="7" rx="2.2" ry="6.5" transform="rotate(-15 11 7)"/><ellipse cx="21" cy="7" rx="2.2" ry="6.5" transform="rotate(15 21 7)"/><circle cx="13" cy="19" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="19" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        dragon: `<svg ${svgAttrs}><path d="M5 25 Q10 12 16 16 Q22 20 27 7"/><line x1="27" y1="7" x2="29" y2="3"/><line x1="24" y1="8" x2="25" y2="4"/><circle cx="26" cy="8" r="0.9" fill="currentColor" stroke="none"/></svg>`,
        snake: `<svg ${svgAttrs}><path d="M8 7 Q22 7 12 16 Q2 25 24 25"/><line x1="24" y1="25" x2="28" y2="23"/><line x1="24" y1="25" x2="28" y2="27"/><circle cx="9" cy="8" r="0.9" fill="currentColor" stroke="none"/></svg>`,
        horse: `<svg ${svgAttrs}><ellipse cx="16" cy="19" rx="6" ry="9"/><path d="M11 12 L9 6 L14 11 Z"/><path d="M21 12 L23 6 L18 11 Z"/><circle cx="13" cy="18" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        goat: `<svg ${svgAttrs}><circle cx="16" cy="19" r="7"/><path d="M9 14 Q3 13 5 8 Q6 5 10 7"/><path d="M23 14 Q29 13 27 8 Q26 5 22 7"/><circle cx="13" cy="18" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        monkey: `<svg ${svgAttrs}><circle cx="16" cy="19" r="7"/><circle cx="7" cy="19" r="3"/><circle cx="25" cy="19" r="3"/><circle cx="16" cy="21" r="4"/><circle cx="13" cy="17" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="17" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        rooster: `<svg ${svgAttrs}><circle cx="14" cy="19" r="7"/><path d="M9 12 L11 6 L13 12 L15 6 L17 12"/><path d="M21 17 L27 15 L21 20 Z"/><circle cx="11" cy="18" r="0.8" fill="currentColor" stroke="none"/><circle cx="17" cy="18" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        dog: `<svg ${svgAttrs}><circle cx="16" cy="18" r="7"/><ellipse cx="8" cy="16" rx="3" ry="5.5" transform="rotate(-20 8 16)"/><ellipse cx="24" cy="16" rx="3" ry="5.5" transform="rotate(20 24 16)"/><ellipse cx="16" cy="23" rx="3" ry="2"/><circle cx="13" cy="17" r="0.8" fill="currentColor" stroke="none"/><circle cx="19" cy="17" r="0.8" fill="currentColor" stroke="none"/></svg>`,
        pig: `<svg ${svgAttrs}><circle cx="16" cy="18" r="7"/><path d="M10 12 L8 8 L13 10 Z"/><path d="M22 12 L24 8 L19 10 Z"/><rect x="12" y="20" width="8" height="6" rx="3"/><circle cx="14.5" cy="23" r="0.8" fill="currentColor" stroke="none"/><circle cx="17.5" cy="23" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="0.8" fill="currentColor" stroke="none"/><circle cx="20" cy="16" r="0.8" fill="currentColor" stroke="none"/></svg>`
    };

    function setAccountAvatar(avatarId) {
        const id = avatarIcons[avatarId] ? avatarId : 'rat';
        accountAvatarIcon.innerHTML = avatarIcons[id];
        avatarOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.avatar === id));
    }

    function openAccountModal() {
        if (!currentUser) return;

        accountDisplayName.textContent = currentUser.displayName || '會員';
        accountTitleSelect.value = '';
        achievementOptgroup.innerHTML = '';
        syncTitleDropdownLabel();
        closeTitleDropdown();
        setAccountAvatar('rat');
        avatarPicker.hidden = true;
        if (accountInfoPhone) accountInfoPhone.textContent = '—';
        if (accountInfoEmail) accountInfoEmail.textContent = currentUser.email || '—';
        if (accountInfoBirthday) accountInfoBirthday.textContent = '—';
        if (accountInfoCreated) accountInfoCreated.textContent = '—';
        if (accountInfoMemberNo) accountInfoMemberNo.textContent = currentUser.uid.slice(-8).toUpperCase();
        accountHistoryList.innerHTML = '';
        accountHistoryList.appendChild(accountHistoryEmpty);
        accountHistoryEmptyText.textContent = '載入中...';
        accountHistoryEmpty.hidden = false;

        openModal(accountModal);

        /* 三欄依序浮現，不是同時彈出——面板逐一「上線」的節奏感，呼應 HUD 開機動畫。
           用 GSAP stagger 取代原本的 CSS animation-delay 寫法，每次開彈窗都會重新播放 */
        gsap.fromTo(
            accountModal.querySelectorAll('.account-column'),
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.1 }
        );

        db.collection('users').doc(currentUser.uid).get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();

            accountDisplayName.textContent = data.displayName || currentUser.email || '會員';
            setAccountAvatar(data.avatarId);

            achievementOptgroup.innerHTML = achievementTitles
                .filter(t => t.check(data))
                .map(t => `<option value="${t.label}">${t.label}</option>`)
                .join('');
            accountTitleSelect.value = data.title || '';
            syncTitleDropdownLabel();

            if (accountInfoPhone) accountInfoPhone.textContent = data.phone || '未填寫';
            if (accountInfoBirthday) accountInfoBirthday.textContent = data.birthday || '未填寫';
            if (accountInfoCreated) {
                accountInfoCreated.textContent = data.createdAt && data.createdAt.toDate
                    ? data.createdAt.toDate().toLocaleDateString('zh-TW')
                    : '—';
            }
        }).catch(err => {
            console.error('讀取會員資料失敗', err);
        });

        db.collection('orders').where('uid', '==', currentUser.uid).get().then(snapshot => {
            const completedOrders = snapshot.docs
                .map(doc => doc.data())
                .filter(order => order.status === 'completed')
                .sort((a, b) => (b.pickupDate || '').localeCompare(a.pickupDate || ''));

            accountHistoryList.innerHTML = '';

            if (completedOrders.length === 0) {
                accountHistoryEmptyText.textContent = '尚無購買紀錄';
                accountHistoryEmpty.hidden = false;
                accountHistoryList.appendChild(accountHistoryEmpty);
                return;
            }

            completedOrders.forEach(order => {
                const itemsText = (order.items || []).map(it => `${it.name} × ${it.qty}`).join('、');
                const item = document.createElement('div');
                item.className = 'account-history-item';
                item.innerHTML = `
                    <p class="account-history-date">${order.pickupDate || ''}</p>
                    <p class="account-history-items">${itemsText}</p>
                `;
                accountHistoryList.appendChild(item);
            });
        }).catch(err => {
            console.error('讀取購買紀錄失敗', err);
            accountHistoryEmptyText.textContent = '讀取失敗';
        });
    }

    accountAvatarBtn.addEventListener('click', () => {
        avatarPicker.hidden = !avatarPicker.hidden;
    });

    avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            if (!currentUser) return;
            const avatarId = opt.dataset.avatar;
            setAccountAvatar(avatarId);
            avatarPicker.hidden = true;
            db.collection('users').doc(currentUser.uid).update({ avatarId }).catch(err => {
                console.error('更新大頭貼失敗', err);
            });
        });
    });

    accountTitleSelect.addEventListener('change', () => {
        if (!currentUser) return;
        db.collection('users').doc(currentUser.uid).update({ title: accountTitleSelect.value }).catch(err => {
            console.error('更新封號失敗', err);
        });
    });

    /* 封號下拉選單是自訂 HUD 面板，不是原生 select 外觀（原生下拉清單瀏覽器渲染，CSS 改不動）。
       底下真正的 <select> 只當資料來源跟存值用，畫面上這個面板每次點開都重新讀取 <select>
       目前的 optgroup/option（包含動態塞進去的成就封號）現組出來，兩邊資料不會脫節 */
    function syncTitleDropdownLabel() {
        const selected = accountTitleSelect.options[accountTitleSelect.selectedIndex];
        titleDropdownLabel.textContent = (selected && selected.value) ? selected.textContent : '選擇封號';
    }

    function closeTitleDropdown() {
        titleDropdown.classList.remove('open');
        titleDropdownPanel.hidden = true;
        titleDropdownTrigger.setAttribute('aria-expanded', 'false');
    }

    function renderTitleDropdown() {
        let html = '';
        Array.from(accountTitleSelect.children).forEach(child => {
            if (child.tagName === 'OPTGROUP') {
                if (!child.children.length) return;
                html += `<p class="title-dropdown-group-label">${child.label}</p>`;
                Array.from(child.children).forEach(opt => {
                    const selected = opt.value === accountTitleSelect.value ? ' selected' : '';
                    html += `<button type="button" class="title-dropdown-option${selected}" data-value="${opt.value}">${opt.textContent}</button>`;
                });
            }
        });
        titleDropdownPanel.innerHTML = html;

        titleDropdownPanel.querySelectorAll('.title-dropdown-option').forEach(btn => {
            btn.addEventListener('click', () => {
                accountTitleSelect.value = btn.dataset.value;
                accountTitleSelect.dispatchEvent(new Event('change', { bubbles: true }));
                syncTitleDropdownLabel();
                closeTitleDropdown();
            });
        });
    }

    titleDropdownTrigger.addEventListener('click', () => {
        const willOpen = titleDropdownPanel.hidden;
        if (willOpen) {
            renderTitleDropdown();
            titleDropdownPanel.hidden = false;
            titleDropdown.classList.add('open');
            titleDropdownTrigger.setAttribute('aria-expanded', 'true');
        } else {
            closeTitleDropdown();
        }
    });

    document.addEventListener('click', e => {
        if (!titleDropdown.contains(e.target)) closeTitleDropdown();
    });

    navBtnAccount.addEventListener('click', () => {
        if (currentUser) {
            openAccountModal();
        } else {
            openAuthModal('login');
        }
    });

    accountModalClose.addEventListener('click', () => closeModal(accountModal));

    btnAccountLogout.addEventListener('click', () => {
        if (confirm('是否登出？')) {
            auth.signOut();
            closeModal(accountModal);
        }
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

    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            // 登入後：人像圖示換成金色皇冠，代表已是會員；滑鼠移上去看得到姓名
            navAccountIconPerson.hidden = true;
            navAccountIconCrown.hidden = false;
            navBtnAccount.setAttribute('aria-label', '會員專區');
            db.collection('users').doc(user.uid).get().then(doc => {
                const name = (doc.exists && doc.data().displayName) || user.email;
                navBtnAccount.title = name + '（點擊登出）';
            });
            subscribeCart(user.uid);
        } else {
            navAccountIconPerson.hidden = false;
            navAccountIconCrown.hidden = true;
            navBtnAccount.setAttribute('aria-label', '會員登入');
            navBtnAccount.title = '會員登入';
            unsubscribeCart();
        }
    });

    /* =========================================
       2. 產品彈窗：數量調整（加入購物車的實際寫入邏輯在後續步驟接上）
       ========================================= */
    const qtyMinus = document.getElementById('product-modal-qty-minus');
    const qtyPlus = document.getElementById('product-modal-qty-plus');
    const qtyValue = document.getElementById('product-modal-qty-value');

    function resetProductQty() {
        qtyValue.textContent = '1';
    }

    qtyMinus.addEventListener('click', () => {
        const current = parseInt(qtyValue.textContent, 10);
        if (current > 1) qtyValue.textContent = current - 1;
    });

    qtyPlus.addEventListener('click', () => {
        const current = parseInt(qtyValue.textContent, 10);
        qtyValue.textContent = current + 1;
    });

    // 每次開啟產品彈窗時，數量重置為 1。
    // openProductModal() 是 script.js 內部（DOMContentLoaded 閉包）的區域函式，
    // 這裡拿不到參照，改用 MutationObserver 監看 #product-modal 的 active class 變化來偵測開啟。
    const productModalEl = document.getElementById('product-modal');
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
    const cartEmptyState = document.getElementById('cart-empty-state');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartBadge = document.getElementById('cart-badge');
    const btnGoCheckout = document.getElementById('btn-go-checkout');
    const navBtnCart = document.getElementById('nav-btn-cart');
    const addToCartBtn = document.getElementById('product-modal-add-cart');
    const addCartNote = document.getElementById('product-modal-add-note');

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

    function renderCartBadge() {
        const count = cartItems.reduce((sum, it) => sum + it.qty, 0);
        cartBadge.textContent = count;
        cartBadge.hidden = count === 0;
    }

    function renderCartModal() {
        cartItemsList.innerHTML = '';
        cartEmptyState.hidden = cartItems.length > 0;
        btnGoCheckout.disabled = cartItems.length === 0;

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
        });
    }

    function unsubscribeCart() {
        if (cartUnsubscribe) { cartUnsubscribe(); cartUnsubscribe = null; }
        cartItems = [];
        renderCartModal();
    }

    navBtnCart.addEventListener('click', () => {
        if (!currentUser) { openAuthModal('login'); return; }
        openModal(cartModal);
    });

    cartModalClose.addEventListener('click', () => closeModal(cartModal));

    addToCartBtn.addEventListener('click', () => {
        if (!currentUser) {
            addCartNote.hidden = false;
            openAuthModal('login');
            return;
        }
        addCartNote.hidden = true;

        const productId = productModalEl.dataset.productId;
        const name = document.getElementById('product-modal-title').textContent;
        const priceText = document.getElementById('product-modal-price').textContent;
        const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
        const qty = parseInt(qtyValue.textContent, 10) || 1;

        const existing = cartItems.find(it => it.productId === productId);
        if (existing) {
            existing.qty += qty;
        } else {
            cartItems.push({ productId, name, price, qty });
        }
        saveCart();

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

        db.collection('orders').add(orderData)
            .then(() => {
                cartItems = [];
                return saveCart();
            })
            .then(() => {
                checkoutForm.reset();
                closeModal(checkoutModal);
                alert('訂單已送出！我們會於出貨前透過 LINE 提供取貨資訊。');
            })
            .catch(err => {
                checkoutError.textContent = '訂單送出失敗，請稍後再試（' + err.code + '）';
                checkoutError.hidden = false;
            })
            .finally(() => setSubmitLoading(btnCheckoutSubmit, false));
    });

});
