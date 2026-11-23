/* =========================================
   示範登入（只在本機預覽有效，正式網站完全不會啟動）
   用法：本機開 http://localhost:8765/index.html?demo=1
   不用帳號密碼，直接看到「已登入」的畫面：皇冠圖示、會員資料、購物車、結帳。
   資料全部是假的、只存在這個分頁的記憶體裡，不會寫進 Firebase；重新整理就還原。
   做法：把 firebase.auth() / firebase.firestore() 換成假的版本，member.js 不用改。
   ========================================= */
(function () {
    var host = location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    if (!isLocal || new URLSearchParams(location.search).get('demo') !== '1') return;
    if (typeof firebase === 'undefined') return;

    function ts(date) {
        return { toDate: function () { return date; }, toMillis: function () { return date.getTime(); } };
    }
    function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); d.setHours(14, 30, 0, 0); return d; }

    var DEMO_USER = { uid: 'demo-user', email: 'demo@project-cd.test', displayName: '示範會員' };

    // 假資料庫：collection -> { docId: data }
    var store = {
        users: {
            'demo-user': {
                displayName: '示範會員', email: DEMO_USER.email, phone: '0912-345-678',
                birthday: '12-25', createdAt: ts(new Date(2026, 5, 1)),
                points: 150, completedSpend: 1500, loginCount: 3
            }
        },
        carts: {
            'demo-user': { items: [{ productId: '1', name: '手作土鳳梨酥', price: 500, qty: 2 }] }
        },
        orders: {
            'demo-order-0001': {
                uid: 'demo-user', status: 'completed', createdAt: ts(daysAgo(6)),
                items: [{ name: '手作土鳳梨酥', qty: 2, price: 500 }], subtotal: 1000
            },
            'demo-order-0002': {
                uid: 'demo-user', status: 'completed', createdAt: ts(daysAgo(3)),
                items: [{ name: '手作土鳳梨酥', qty: 1, price: 500 }], subtotal: 500
            }
        }
    };
    var listeners = []; // { col, id, cb }

    function clone(v) { return v; }
    function snap(id, data) {
        return { id: id, exists: data !== undefined, data: function () { return data; } };
    }
    function notify(col, id) {
        listeners.forEach(function (l) {
            if (l.col === col && l.id === id) l.cb(snap(id, store[col][id]));
        });
    }
    // FieldValue 的 increment / serverTimestamp 在假資料庫裡直接算掉
    function resolve(oldVal, v) {
        if (v && typeof v === 'object' && v.__demoIncrement !== undefined) return (oldVal || 0) + v.__demoIncrement;
        if (v && typeof v === 'object' && v.__demoNow) return ts(new Date());
        return v;
    }
    function applyFields(target, data) {
        Object.keys(data).forEach(function (k) { target[k] = resolve(target[k], data[k]); });
        return target;
    }

    function docRef(col, id) {
        store[col] = store[col] || {};
        return {
            id: id,
            get: function () { return Promise.resolve(snap(id, store[col][id])); },
            set: function (data, opts) { store[col][id] = applyFields(opts && opts.merge ? (store[col][id] || {}) : {}, data); notify(col, id); return Promise.resolve(); },
            update: function (data) { store[col][id] = applyFields(store[col][id] || {}, data); notify(col, id); return Promise.resolve(); },
            onSnapshot: function (cb) {
                var l = { col: col, id: id, cb: cb };
                listeners.push(l);
                setTimeout(function () { cb(snap(id, store[col][id])); }, 0);
                return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
            }
        };
    }
    function collectionRef(col) {
        store[col] = store[col] || {};
        return {
            doc: function (id) { return docRef(col, id); },
            add: function (data) {
                var id = 'demo-' + Date.now().toString(36);
                store[col][id] = applyFields({}, data);
                return Promise.resolve({ id: id });
            },
            where: function (field, op, value) {
                return {
                    get: function () {
                        var docs = Object.keys(store[col])
                            .filter(function (id) { return store[col][id][field] === value; })
                            .map(function (id) { return snap(id, store[col][id]); });
                        return Promise.resolve({ docs: docs });
                    }
                };
            }
        };
    }
    var fakeDb = { collection: collectionRef };

    var authCallbacks = [];
    var fakeAuth = {
        currentUser: DEMO_USER,
        onAuthStateChanged: function (cb) {
            authCallbacks.push(cb);
            setTimeout(function () { cb(fakeAuth.currentUser); }, 0);
            return function () {};
        },
        signOut: function () {
            fakeAuth.currentUser = null;
            authCallbacks.forEach(function (cb) { cb(null); });
            return Promise.resolve();
        },
        // 示範模式下按「登入」不檢查密碼，直接回到示範會員
        signInWithEmailAndPassword: function () { return fakeAuth._signIn(); },
        signInWithPopup: function () { return fakeAuth._signIn(); },
        createUserWithEmailAndPassword: function () { return fakeAuth._signIn(); },
        setPersistence: function () { return Promise.resolve(); },
        sendPasswordResetEmail: function () { return Promise.resolve(); },
        _signIn: function () {
            fakeAuth.currentUser = DEMO_USER;
            authCallbacks.forEach(function (cb) { cb(DEMO_USER); });
            return Promise.resolve({ user: DEMO_USER, additionalUserInfo: { isNewUser: false } });
        }
    };

    var realAuth = firebase.auth;
    var realFirestore = firebase.firestore;
    var patchedAuth = function () { return fakeAuth; };
    Object.keys(realAuth).forEach(function (k) { patchedAuth[k] = realAuth[k]; });
    patchedAuth.Auth = realAuth.Auth;
    patchedAuth.GoogleAuthProvider = realAuth.GoogleAuthProvider;
    var patchedFirestore = function () { return fakeDb; };
    patchedFirestore.FieldValue = {
        increment: function (n) { return { __demoIncrement: n }; },
        serverTimestamp: function () { return { __demoNow: true }; }
    };
    firebase.auth = patchedAuth;
    firebase.firestore = patchedFirestore;

    window.__projectCdDemo = { store: store, auth: fakeAuth };
    console.info('[示範登入] 已用假帳號登入，資料不會寫進 Firebase。');
})();
