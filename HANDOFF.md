# 交接筆記

> Claude 與 GPT（Codex）輪流接手時看這份。只記目前狀態，舊內容做完就刪。開工先 `git pull`。

**最後更新**：2026-11-24，Claude

## 目前狀態（全部已上線 https://fanhanyunchris.github.io/project-cd/ ）
- **首頁與滿版卡片**：開場保留雪夜、獨角獸與品牌字樣，無卡片外框。從產品開始使用滿版白卡，四周留細邊距、四角圓角，並加 2 px 淺色邊框。桌機圖文並排，上方預留導覽空間。手機圖文上下，底部避開分頁列與安全區。樣式在 `css/style.css` 的「主題滿版卡片」，產品卡由 `initProductPanels` 產生。現有照片在 `images/xmas/`，正式產品照待補。
- **品牌區**：整張卡片可左右滑動，含照片、內文及操作。第一張是完整品牌介紹，保留「認識團隊」和「逛虛擬大樓」，第二、三張顯示「準備中」。左右邊緣保留淡箭頭，底部無按鈕或可見頁碼。滑動由 `js/script.js` 的 `initBrandCarousel` 處理，箭頭也可點選或用鍵盤操作。垂直手勢保留頁面捲動。
- **品牌字體及頁尾**：Project.CD 品牌字樣使用 League Spartan（聯盟斯巴達）。頁尾購物說明是共用外框的四列清單，常見問題、退換貨、服務條款、隱私政策各自開啟。LINE、YouTube、Facebook、Instagram 以品牌色圖示橫排，保留無障礙名稱與 44 px 觸控區。只有 LINE 已有正式網址。設計決定另見 [GitHub 知識庫](https://github.com/FANHANYUNCHRIS/knowledge-base)。
- **導覽列**：黑底浮空，選中那格放大、變香檳金、發金光（`css/style.css`「黑色浮空導覽列」段）。選中邏輯沒動：桌機由 navObserver、手機由分頁列程式決定。手機舊的凹槽圓鈕已不用（JS 還會寫遮罩變數，CSS 不用）。LOGO 文字預設白色。
- **右邊捲軸隱藏**、畫面可以縮放（擁有者試過不能縮放後又改回可以）。
- **App 圖示**：黑底＋平面香檳金 CD（用 `images/CD LOGO.png` 產生，擁有者選的；不要立體亮金、不用獨角獸）。網址 `?v=cd2`，已加到主畫面的人要刪掉重加才會換。
- **結帳取貨日曆**：`js/member.js` 的 `initPickupPicker`，可取貨日白色浮起圓鈕、太早或週一淡灰、選中黑底金字，看 3 個月，按「確定」才寫入。
- **送出訂單收據**：黑色出單機印白色收據（`window.showOrderReceipt`，`js/script.js`），網址加 `?receipt=1` 用假資料預覽。
- **示範登入（只在本機）**：`http://localhost:8765/index.html?demo=1` 直接是已登入的假會員（會員資料、2 筆購買紀錄、購物車 2 盒），不寫進 Firebase。程式 `js/demo-login.js`，正式網站不會啟動。
- 「加到主畫面」App：`manifest.webmanifest`、`sw.js`（一律先上網拿最新）。Google 登入在 iPhone 主畫面 App 和 LINE／FB／IG 內建瀏覽器會顯示白話說明（見下方「等官方信箱」）。
- 付款／配送文字已統一：匯款付款、超商取貨、取貨至少 5 天後、週一不取貨。
- **驗證範圍**：桌機官網已確認卡片圓角與導覽間距、購物清單與社群橫排，並實測品牌卡向左拖到「準備中」、向右回到品牌介紹。手機實機尚未驗證品牌滑動、直向捲動、導覽安全區、取貨日曆或 App 圖示。結帳未走到實際送單。
- **頁尾蓋住雪花（2026-11-24）**：雪花原本會落在頁尾文字上，`.site-footer` 加了 `position: relative; z-index: 1`，現在雪只在黑色區域飄。
- **知識庫靈感三項（2026-11-24 Claude）**：①開場標語下加一行細淡斜體英文「a one-person dessert lab」（Cormorant Garamond）；②桌機滑鼠移到產品照上，淡金光跟著游標（`initProductPanels` 內的 pointermove，手機不啟動）；③「在哪裡買」禮盒照捲進畫面時由暗、稍大慢慢亮開，再有一道金光掃過（`#shop.is-inview .xcard-bg-shop::before/::after`，減少動態時關閉）。CSS 在 `css/style.css` 最後「知識庫靈感三項」段。桌機 1440 與手機 390 預覽看過，真手機沒測。
- **會員遊戲卡（2026-11-24 Claude，擁有者指定）**：會員資料彈窗整個改成一張 RPG 角色卡（`#game-card`，沿用 `.rpg-window` 黑白金框），三面：資訊（頭像、姓名、等級、信箱電話生日加入）、累積（等級、EXP 經驗值條＝升級進度、累積金額、完成訂單數）、購買（道具欄，依月份，一頁 3 筆，多的用卡片內上下頁）。點上方頁籤或左右滑動切換，卡片不旋轉、內容淡入（擁有者指定）；每次打開回到第一面。原本欄位 id 都保留。程式在 `js/member.js` 的 showGameFace／renderHistoryMonth，樣式在 `css/style.css` 最後「會員遊戲卡」段。**手機版是滿版畫面**（擁有者指定）：點會員後卡片填滿畫面（上左右留 12px，下方讓出底部分頁列），白色外框拿掉，上方有品牌列和關閉鍵，登出鍵在卡片底部；道具欄手機一頁 5 筆、桌機 3 筆。手機產品照捲進畫面也有一道金光。預覽測過三面、滑動、空狀態；真手機沒測。
- **品牌卡手機滑動（2026-11-24 Claude 在預覽手機 390 用模擬手指測）**：往左滑到下一張、往右滑回來、輕碰不會翻頁，都正常；直向捲動交給瀏覽器（`touch-action: pan-y`）。**真的 iPhone 仍沒測。**

## 下一步（等擁有者決定，不要自己開工）
- 若擁有者要求驗證，優先用 iPhone 測品牌區左右滑動、直向捲動與底部導覽間距。兩張「準備中」卡片等擁有者提供內容再替換。
- 要擁有者提供或決定的：產品真實照片、YouTube／Facebook／Instagram 連結（目前空的）、團隊第 2、3 位照片（`team-2.jpg`、`team-3.jpg`，主控台的 404 就是它們）、小遊戲連到本機資料夾、分享預覽圖（og:image）。
- **之後可以考慮：網站訪客分析 PostHog**（2026-11-24 擁有者要記下，還沒決定做）。可看到多少人來、看了哪些商品、在哪一步沒結帳；免費額度夠用。要註冊帳號並在網站加追蹤程式，等正式開賣、有客人後再評估，屆時和免費的 Google Analytics 比較。注意擁有者不花錢、私人信箱不公開、不替擁有者同意條款。
- 設計檢查的 5 個「文字太貼邊」（`cart-login-gate`、`xpanel`、頁尾購物說明清單 `site-footer-links` 和它的分隔線）2026-11-24 Claude 在手機 390 逐一看過，都是誤報：容器沒有自己的框或底色，或文字本身有 12px 內距、照片刻意滿版。沒改。

## 等官方信箱：開啟 Google 登入（2026-11-23 做到一半，擁有者決定暫停）
- 查到的事實：Firebase 原本**根本沒開 Google 登入**，`fanhanyunchris.github.io` 也不在授權網域，所以官網的 Google 按鈕從來沒能用。
- 已做完並保留：(1) 新建公開 repo `FANHANYUNCHRIS/fanhanyunchris.github.io`（本機 `Documents/GitHub/fanhanyunchris.github.io`），放 Firebase 官方登入輔助檔 `__/auth/`，網址 https://fanhanyunchris.github.io/__/auth/handler 已確認能開；(2) Firebase 授權網域已加 `fanhanyunchris.github.io`；(3) Google Cloud 條款擁有者已同意。
- 已暫停：Google 供應商開過又**關掉**（支援信箱只能選擁有者私人 Gmail，擁有者不要公開）；官網 Google 按鈕和「或」分隔線加了 `hidden` 藏起來（`index.html`）。
- 官方信箱申請好之後要做：① 把官方信箱加進 Firebase 專案成員（擁有者操作），② Firebase › Authentication › 登入方式 › 開 Google，公開名稱 Project.CD、支援信箱選官方信箱（Google Cloud › Google Auth Platform › 品牌 也確認沒有私人 Gmail），③ Google Cloud › 用戶端 › Web client (auto created by Google Service)：JavaScript 來源加 `https://fanhanyunchris.github.io`、重新導向 URI 加 `https://fanhanyunchris.github.io/__/auth/handler`，④ `js/firebase-config.js` 的 authDomain 改成 `fanhanyunchris.github.io`，iPhone 主畫面 App 改用 `signInWithRedirect`（`js/member.js` 目前在主畫面 App 直接顯示說明不嘗試），manifest 的 scope 可能要放寬到 `/` 讓 `/__/auth/` 留在 App 裡，⑤ 拿掉 `index.html` 兩個 `hidden`，⑥ 電腦、Safari、iPhone 主畫面 App 各測一次。主畫面 App 這條路沒有實測過，不保證成功。

## 注意事項
- **擁有者決定（2026-11-24）：現在以手機版為主**，設計、調整、驗證都先看手機（390 寬）；電腦版之後會另外設計自己的款式，現在只要確保不壞掉。
- 設計規範看 `CLAUDE.md` 和 `AGENTS.md`。
- 本機預覽：在專案資料夾開伺服器（Claude 用的是 8765 埠），打開 `http://localhost:8765/index.html`。改 CSS／JS 後要把 `index.html` 裡的 `?v=` 版本號換掉，不然會看到舊檔。
- `.impeccable/` 資料夾是設計工具的暫存，不要 commit。
