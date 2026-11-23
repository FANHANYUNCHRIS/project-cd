# 交接筆記

> Claude 與 GPT（Codex）輪流接手時看這份。只記目前狀態，舊內容做完就刪。開工先 `git pull`。

**最後更新**：2026-11-23，Claude（額度快用完，交給 GPT）

## 目前狀態（全部已上線 https://fanhanyunchris.github.io/project-cd/ ）
- **首頁外觀**：全站黑底＋飄雪（雪花層 `.hero-snow` 由 `js/script.js` 搬到 body、固定在畫面上）。開場第一頁是雪夜（獨角獸、Project.CD、「一個人的甜點研究室」）。產品／品牌／商城各一張**直式白色卡片**（`.xpanel`，照片在上、文字按鈕在下，微微浮動），高度跟螢幕走，內容不捲動。樣式在 `css/style.css` 最後幾段：「聖誕改版」（`.xcard*`、`.xbtn*`）→「直式白卡片」（`.xpanel`，會覆蓋前者）。產品卡模板在 `js/script.js` 的 `initProductPanels`。三張照片 `images/xmas/*.jpg` 是 AI 暫時圖，有真實照片直接換同檔名。
- **導覽列**：黑底浮空，選中那格放大、變香檳金、發金光（`css/style.css`「黑色浮空導覽列」段）。選中邏輯沒動：桌機由 navObserver、手機由分頁列程式決定。手機舊的凹槽圓鈕已不用（JS 還會寫遮罩變數，CSS 不用）。LOGO 文字預設白色。
- **右邊捲軸隱藏**、畫面可以縮放（擁有者試過不能縮放後又改回可以）。
- **App 圖示**：黑底＋平面香檳金 CD（用 `images/CD LOGO.png` 產生，擁有者選的；不要立體亮金、不用獨角獸）。網址 `?v=cd2`，已加到主畫面的人要刪掉重加才會換。
- **結帳取貨日曆**：`js/member.js` 的 `initPickupPicker`，可取貨日白色浮起圓鈕、太早或週一淡灰、選中黑底金字，看 3 個月，按「確定」才寫入。
- **送出訂單收據**：黑色出單機印白色收據（`window.showOrderReceipt`，`js/script.js`），網址加 `?receipt=1` 用假資料預覽。
- **示範登入（只在本機）**：`http://localhost:8765/index.html?demo=1` 直接是已登入的假會員（會員資料、2 筆購買紀錄、購物車 2 盒），不寫進 Firebase。程式 `js/demo-login.js`，正式網站不會啟動。
- 「加到主畫面」App：`manifest.webmanifest`、`sw.js`（一律先上網拿最新）。Google 登入在 iPhone 主畫面 App 和 LINE／FB／IG 內建瀏覽器會顯示白話說明（見下方「等官方信箱」）。
- 付款／配送文字已統一：匯款付款、超商取貨、取貨至少 5 天後、週一不取貨。
- **都沒在真的手機上測過**：白卡片、黑導覽列、取貨日曆滑動換月、App 新圖示。也沒有實際登入走完整結帳（會寫進 Firebase 訂單）。

## 下一步（等擁有者決定，不要自己開工）
- 擁有者可能會用真的 iPhone 看新外觀後提修改，照擁有者說的調。
- 會員卡翻面（FB 影片的點子，擁有者說「先做日曆」，這個還沒開始）。
- 要擁有者提供或決定的：產品真實照片、YouTube／Facebook／Instagram 連結（目前空的）、團隊第 2、3 位照片（`team-2.jpg`、`team-3.jpg`，主控台的 404 就是它們）、小遊戲連到本機資料夾、分享預覽圖（og:image）。
- 設計檢查還有一處「文字太貼邊」（購物車「請先登入會員」那塊 `cart-login-gate`），沒處理。

## 等官方信箱：開啟 Google 登入（2026-11-23 做到一半，擁有者決定暫停）
- 查到的事實：Firebase 原本**根本沒開 Google 登入**，`fanhanyunchris.github.io` 也不在授權網域，所以官網的 Google 按鈕從來沒能用。
- 已做完並保留：(1) 新建公開 repo `FANHANYUNCHRIS/fanhanyunchris.github.io`（本機 `Documents/GitHub/fanhanyunchris.github.io`），放 Firebase 官方登入輔助檔 `__/auth/`，網址 https://fanhanyunchris.github.io/__/auth/handler 已確認能開；(2) Firebase 授權網域已加 `fanhanyunchris.github.io`；(3) Google Cloud 條款擁有者已同意。
- 已暫停：Google 供應商開過又**關掉**（支援信箱只能選擁有者私人 Gmail，擁有者不要公開）；官網 Google 按鈕和「或」分隔線加了 `hidden` 藏起來（`index.html`）。
- 官方信箱申請好之後要做：① 把官方信箱加進 Firebase 專案成員（擁有者操作），② Firebase › Authentication › 登入方式 › 開 Google，公開名稱 Project.CD、支援信箱選官方信箱（Google Cloud › Google Auth Platform › 品牌 也確認沒有私人 Gmail），③ Google Cloud › 用戶端 › Web client (auto created by Google Service)：JavaScript 來源加 `https://fanhanyunchris.github.io`、重新導向 URI 加 `https://fanhanyunchris.github.io/__/auth/handler`，④ `js/firebase-config.js` 的 authDomain 改成 `fanhanyunchris.github.io`，iPhone 主畫面 App 改用 `signInWithRedirect`（`js/member.js` 目前在主畫面 App 直接顯示說明不嘗試），manifest 的 scope 可能要放寬到 `/` 讓 `/__/auth/` 留在 App 裡，⑤ 拿掉 `index.html` 兩個 `hidden`，⑥ 電腦、Safari、iPhone 主畫面 App 各測一次。主畫面 App 這條路沒有實測過，不保證成功。

## 注意事項
- 設計規範看 `CLAUDE.md` 和 `AGENTS.md`。
- 本機預覽：在專案資料夾開伺服器（Claude 用的是 8765 埠），打開 `http://localhost:8765/index.html`。改 CSS／JS 後要把 `index.html` 裡的 `?v=` 版本號換掉，不然會看到舊檔。
- `.impeccable/` 資料夾是設計工具的暫存，不要 commit。
