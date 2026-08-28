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

    /* --- 會員資料彈窗：登入後點擊皇冠圖示顯示，開啟時即時從 Firestore 抓資料填入。
       大頭貼切換／封號／會員等級／優惠券在資料庫裡沒有對應欄位（從沒建過後端），
       畫面上已經拿掉，只接了真的有資料的欄位：姓名/信箱/電話/生日/加入日期/購物點數/購買紀錄/登出 --- */
    const accountModal = document.getElementById('account-modal');
    const accountModalClose = document.getElementById('account-modal-close');
    const accountInfoName = document.getElementById('account-info-name');
    const accountInfoEmail = document.getElementById('account-info-email');
    const accountInfoPhone = document.getElementById('account-info-phone');
    const accountInfoBirthday = document.getElementById('account-info-birthday');
    const accountInfoCreated = document.getElementById('account-info-created');
    const accountInfoMemberno = document.getElementById('account-info-memberno');
    const accountInfoPoints = document.getElementById('account-info-points');
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

    // 生日只存「月-日」（MM-DD），不收出生年——舊格式（改版前存成 YYYY-MM-DD）也相容處理，只取月/日顯示
    function formatBirthdayMonthDay(value) {
        if (!value || typeof value !== 'string') return '—';
        const parts = value.split('-');
        const month = parts.length === 3 ? parts[1] : parts[0];
        const day = parts.length === 3 ? parts[2] : parts[1];
        if (!month || !day) return '—';
        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
    }

    function renderAccountProfile(uid) {
        db.collection('users').doc(uid).get().then(doc => {
            const data = doc.exists ? doc.data() : {};
            accountInfoName.textContent = data.displayName || '—';
            accountInfoEmail.textContent = data.email || (currentUser && currentUser.email) || '—';
            accountInfoPhone.textContent = data.phone || '—';
            accountInfoBirthday.textContent = formatBirthdayMonthDay(data.birthday);
            accountInfoCreated.textContent = formatDateSlash(data.createdAt);
            // 資料庫沒有獨立的會員編號欄位，用帳號 uid 前 8 碼推導出穩定、唯一的顯示 ID
            accountInfoMemberno.textContent = 'CD' + uid.slice(0, 8).toUpperCase();
            accountInfoPoints.textContent = (data.points || 0).toLocaleString();
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

        if (monthOrders.length === 0) {
            accountHistoryEmpty.hidden = false;
            return;
        }
        accountHistoryEmpty.hidden = true;

        monthOrders.forEach(order => {
            const d = order.createdAt.toDate();
            const datetime = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            const itemsHtml = (order.items || []).map(it =>
                `<li><span>${it.name} x${it.qty}</span><span>NT$${it.price * it.qty}</span></li>`
            ).join('');

            const div = document.createElement('div');
            div.className = 'account-history-item';
            div.innerHTML = `
                <div class="account-history-item-head">
                    <span class="account-history-order-no">#${order.id.slice(0, 8).toUpperCase()}</span>
                    <span class="account-history-datetime">${datetime}</span>
                </div>
                <ul class="account-history-item-list">${itemsHtml}</ul>
                <div class="account-history-item-total">
                    <span>小計</span>
                    <span>NT$${order.subtotal}</span>
                </div>
            `;
            accountHistoryList.insertBefore(div, accountHistoryEmpty);
        });
    }

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
            renderHistoryMonth();
        });
    }

    historyMonthPrev.addEventListener('click', () => {
        historyViewDate = new Date(historyViewDate.getFullYear(), historyViewDate.getMonth() - 1, 1);
        renderHistoryMonth();
    });

    historyMonthNext.addEventListener('click', () => {
        historyViewDate = new Date(historyViewDate.getFullYear(), historyViewDate.getMonth() + 1, 1);
        renderHistoryMonth();
    });

    function openAccountModal() {
        if (!currentUser) return;
        renderAccountProfile(currentUser.uid);
        loadAccountHistory(currentUser.uid);
        openModal(accountModal);
    }

    navBtnAccount.addEventListener('click', () => {
        if (currentUser) {
            openAccountModal();
        } else {
            openAuthModal('login');
        }
    });

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
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartSummaryEl = document.getElementById('cart-summary');
    const cartBadge = document.getElementById('cart-badge');
    const btnGoCheckout = document.getElementById('btn-go-checkout');
    const navBtnCart = document.getElementById('nav-btn-cart');
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

    function renderCartBadge() {
        const count = cartItems.reduce((sum, it) => sum + it.qty, 0);
        cartBadge.textContent = count;
        cartBadge.hidden = count === 0;
    }

    function renderCartModal() {
        const loggedIn = !!currentUser;
        cartLoginGate.hidden = loggedIn;
        cartBody.hidden = !loggedIn;

        cartItemsList.innerHTML = '';
        const hasItems = cartItems.length > 0;
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
        });
    }

    function unsubscribeCart() {
        if (cartUnsubscribe) { cartUnsubscribe(); cartUnsubscribe = null; }
        cartItems = [];
        renderCartModal();
    }

    navBtnCart.addEventListener('click', () => {
        openModal(cartModal);
    });

    cartModalClose.addEventListener('click', () => closeModal(cartModal));

    cartLoginGateCta.addEventListener('click', () => openAuthModal('login'));

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
