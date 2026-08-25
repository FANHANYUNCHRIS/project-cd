document.addEventListener('DOMContentLoaded', () => {

    const OWNER_EMAIL = 'hokutoshinken7ns@gmail.com';

    const auth = firebase.auth();
    const db = firebase.firestore();

    const loginPanel = document.getElementById('admin-login-panel');
    const ordersPanel = document.getElementById('admin-orders-panel');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('admin-login-error');
    const deniedMsg = document.getElementById('admin-denied-msg');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const ordersTable = document.getElementById('admin-orders-table');
    const ordersEmpty = document.getElementById('admin-orders-empty');
    const ordersTbody = document.getElementById('admin-orders-tbody');

    const authErrorMessages = {
        'auth/invalid-email': '信箱格式不正確',
        'auth/user-not-found': '查無此帳號',
        'auth/wrong-password': '密碼錯誤',
        'auth/invalid-credential': '帳號或密碼錯誤'
    };

    let ordersUnsubscribe = null;

    const statusLabels = { new: '待處理', completed: '已完成', cancelled: '已取消' };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.hidden = true;
        deniedMsg.hidden = true;

        const btn = document.getElementById('btn-admin-login');
        const textEl = btn.querySelector('.btn-text');
        const originalText = textEl.textContent;
        textEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 登入中...';
        btn.disabled = true;

        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => { loginForm.reset(); })
            .catch(err => {
                loginError.textContent = authErrorMessages[err.code] || ('登入失敗（' + err.code + '）');
                loginError.hidden = false;
            })
            .finally(() => {
                textEl.textContent = originalText;
                btn.disabled = false;
            });
    });

    logoutBtn.addEventListener('click', () => auth.signOut());

    function daysUntil(dateStr) {
        const target = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.round((target - today) / 86400000);
    }

    function renderOrders(orders) {
        ordersEmpty.hidden = orders.length > 0;
        ordersTable.hidden = orders.length === 0;
        ordersTbody.innerHTML = '';

        orders.forEach(order => {
            const tr = document.createElement('tr');
            const status = order.status || 'new';
            if (status === 'new' && daysUntil(order.pickupDate) <= 1) tr.classList.add('admin-row-urgent');
            if (status === 'completed') tr.classList.add('admin-row-completed');
            if (status === 'cancelled') tr.classList.add('admin-row-cancelled');

            const itemNames = (order.items || []).map(it => it.name).join('<br>');
            const itemQtys = (order.items || []).map(it => `× ${it.qty}`).join('<br>');
            const created = order.createdAt && order.createdAt.toDate
                ? order.createdAt.toDate().toLocaleString('zh-TW')
                : '—';

            const statusOptions = Object.keys(statusLabels).map(key =>
                `<option value="${key}"${key === status ? ' selected' : ''}>${statusLabels[key]}</option>`
            ).join('');

            tr.innerHTML = `
                <td><select class="admin-status-select" data-order-id="${order.id}">${statusOptions}</select></td>
                <td>${order.pickupDate}</td>
                <td>${order.customerName || ''}</td>
                <td>${order.phone || ''}</td>
                <td class="admin-col-items">${itemNames}</td>
                <td class="admin-col-qty">${itemQtys}</td>
                <td>NT$ ${order.subtotal || 0}</td>
                <td class="admin-col-note">${order.note || ''}</td>
                <td>${created}</td>
            `;
            ordersTbody.appendChild(tr);
        });
    }

    /* 標記完成時才把消費金額/點數累加到會員資料，且用 pointsAwarded 記錄是否已加過，
       避免店主之後又切回「待處理」再切回「已完成」時被重複累加 */
    ordersTbody.addEventListener('change', (e) => {
        const select = e.target.closest('.admin-status-select');
        if (!select) return;
        const orderId = select.dataset.orderId;
        const newStatus = select.value;
        const orderRef = db.collection('orders').doc(orderId);

        orderRef.get().then(doc => {
            if (!doc.exists) return;
            const order = doc.data();
            const wasAwarded = !!order.pointsAwarded;
            const willBeCompleted = newStatus === 'completed';
            const updates = { status: newStatus };
            const subtotal = order.subtotal || 0;
            const earnedPoints = Math.floor(subtotal / 10);

            if (!wasAwarded && willBeCompleted && order.uid) {
                updates.pointsAwarded = true;
                db.collection('users').doc(order.uid).update({
                    points: firebase.firestore.FieldValue.increment(earnedPoints),
                    completedSpend: firebase.firestore.FieldValue.increment(subtotal)
                }).catch(err => console.error('更新會員點數失敗', err));
            } else if (wasAwarded && !willBeCompleted && order.uid) {
                updates.pointsAwarded = false;
                db.collection('users').doc(order.uid).update({
                    points: firebase.firestore.FieldValue.increment(-earnedPoints),
                    completedSpend: firebase.firestore.FieldValue.increment(-subtotal)
                }).catch(err => console.error('更新會員點數失敗', err));
            }

            return orderRef.update(updates);
        }).catch(err => {
            console.error('更新訂單狀態失敗', err);
        });
    });

    function subscribeOrders() {
        ordersUnsubscribe = db.collection('orders').orderBy('pickupDate', 'asc')
            .onSnapshot(snapshot => {
                const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderOrders(orders);
            }, err => {
                console.error('讀取訂單失敗', err);
            });
    }

    function unsubscribeOrders() {
        if (ordersUnsubscribe) { ordersUnsubscribe(); ordersUnsubscribe = null; }
    }

    auth.onAuthStateChanged(user => {
        if (user && user.email === OWNER_EMAIL) {
            loginPanel.hidden = true;
            ordersPanel.hidden = false;
            logoutBtn.hidden = false;
            subscribeOrders();
        } else if (user) {
            // 有登入，但不是店主帳號
            loginPanel.hidden = false;
            ordersPanel.hidden = true;
            logoutBtn.hidden = false;
            deniedMsg.hidden = false;
            loginForm.hidden = true;
            unsubscribeOrders();
        } else {
            loginPanel.hidden = false;
            ordersPanel.hidden = true;
            logoutBtn.hidden = true;
            deniedMsg.hidden = true;
            loginForm.hidden = false;
            unsubscribeOrders();
        }
    });

});
