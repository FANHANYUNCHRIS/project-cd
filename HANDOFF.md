# 交接筆記

> Claude 與 GPT（Codex）輪流接手時看這份。只記目前狀態，舊內容做完就刪。開工先 `git pull`。

**最後更新**：2026-11-23，Claude

## 目前狀態
- **導覽列改黑色浮空（2026-11-23，擁有者指定）**：桌機膠囊和三顆圓鈕、手機底部分頁列都改成黑底＋髮絲白邊＋陰影。選中的那格放大、變香檳金、發金光；手機版原本的凹槽圓鈕拿掉。只改樣式（`css/style.css` 最後一段），選中邏輯沒動。測過：預覽桌機 1440、手機 390。**沒測**：真的 iPhone。
- **示範登入（只在本機預覽）**：開 `http://localhost:8765/index.html?demo=1` 就是已登入的假會員（皇冠圖示、會員資料、2 筆購買紀錄、購物車 2 盒），不用密碼、不寫進 Firebase，重新整理就還原。程式在 `js/demo-login.js`，正式網站網址不是 localhost，所以完全不會啟動。
- **結帳取貨日曆（2026-11-23，擁有者核准設計稿 https://claude.ai/artifact/3g7vrhRXLnXjqJ3W6GAULp ）**：結帳的取貨日期從系統日期框改成自己的月曆。可取貨日＝白色浮起圓鈕，太早或週一＝淡灰點不下去，選中＝黑底金字。可看本月起 3 個月，左右滑也能換月，按「確定」才寫入。
  - 程式在 `js/member.js` 的 `initPickupPicker`（日期規則沿用 `getMinPickupDate`／`isValidPickupDate`），樣式在 `css/style.css` 最後一段「結帳取貨日曆」。
  - 測過：預覽手機 390、桌機 1440 打開、選日、確定、換月上限、Esc 只關日曆不關結帳。**沒測**：登入後走完整結帳、真的 iPhone 滑動換月。
  - 之後可做：會員卡翻面（擁有者說先做日曆，這個還沒開始）。
- **首頁聖誕改版（2026-11-23，擁有者核准設計稿 https://claude.ai/artifact/Mz1NPmJB4Duk2mnuZaVZrZ ）**：首頁四頁都改成深色滿版卡片。
  - 開場「雪夜」：只留獨角獸、Project.CD、「一個人的甜點研究室」，飄雪＋金色光點（雪不再限 12 月）。舊的產品小名片、PRESS START、聖誕帽、森林拿掉。
  - 產品卡：照片 `images/xmas/product.jpg` 當背景，品名、規格、NT$ 500、「加入購物車」（1 盒）、「商品詳情」（開既有 `#product-modal`，裡面有成分、注意事項、3D 和數量）。產品區舊的 3D 框、能力值、頁籤都拿掉（模板在 `js/script.js` 的 `initProductPanels`）。
  - 品牌卡：`images/xmas/brand.jpg`，標題、故事、1 人／1 樣／0 防腐劑，「認識團隊」開新的 `#team-modal`（原本的 RPG 隊伍選單整段搬進去），「逛虛擬大樓」直接開 `building/index.html`。品牌區的頁籤和內嵌大樓面板已刪（`js/script.js` 大樓那段加了「面板不存在就跳過」）。
  - 商城卡：`images/xmas/shop.jpg`，三條購買說明＋「前往訂購」（回產品卡），平台「即將開放」改一行小字。
  - 左側 STAGE 頁碼、桌機四角 HUD 框隱藏。樣式全在 `css/style.css` 最後一段（`.xcard*`、`.xbtn*`）。
  - 三張照片是 AI 生成的暫時圖（禮盒照裡是 8 顆，實際 10 入），有真實照片就直接換同檔名。
  - 測過：預覽的桌機 1440×900、手機 390×844 四頁、商品詳情彈窗、認識團隊彈窗（開、關）、頁尾，主控台只有原本就缺的 `team-2.jpg`、`team-3.jpg`。**沒測**：真的 iPhone、登入後實際加入購物車。
- 首頁頁尾社群圖示已放大到 44×44 觸控範圍；「與我聯繫」裡的 LINE 小標改成 h3。
- 購物車「請先登入會員」的貓咪插畫已補上（`images/cart-login-cat.png`，GPT 生成，黑白灰、透明背景、320×320）。
- 桌機版導覽列膠囊加了「黑色反白滑過去」效果（`css/style.css` 的 `.has-slider::after` + `js/script.js` 最後一段）。高亮仍由 navObserver 決定，滑塊只是跟著 `.active` 移動；手機版不受影響；減少動態時直接跳位。
- 頁尾改版（依設計稿 https://claude.ai/artifact/Ht2Eo67mW46yBjuUvBxFNh ）：商城回到滿版一頁，頁尾改成接在後面的黑底收尾（`.site-footer`，不撐滿畫面，捲到底停在商城下半部＋頁尾）。三欄：品牌資訊（內湖區／公休週一／取貨至少 5 天後）、購物說明（常見問題、退換貨說明、服務條款、隱私權政策，沿用既有彈窗）、追蹤我們；最下面版權＋小遊戲。虛擬大樓圖示已從頁尾拿掉（選單已有）。網站目前沒有音效開關。
- 常見問題裡 iOpen Mall 已換成 7-ELEVEN 賣貨便；退換貨那題改成「直接聯繫我們，之後平台訂單依平台規定」。
- 配送說明已統一成「匯款付款、超商取貨、取貨日期至少 5 天後、週一不取貨」（擁有者確認）：常見問題的「取貨與保存須知」彈窗、卡片、搜尋引擎用的 FAQ 都改了；黑貓宅配、2–4 天出貨、免運門檻的舊文字已拿掉。運費沒寫，擁有者有需要再補。
- 技術檢查修正（2026-11-20）：團隊立繪改用 `images/staff01-nobg.webp`（1.9MB → 116KB），導覽列／登入彈窗 LOGO 改用 `images/unicorn-logo-256.png`（原本 2048px 大圖）。原始的 `staff01-nobg.png`、`UNICORN LOGO.png` 還留著沒刪（後者是搜尋引擎資料用的 LOGO 網址）。`css/style.css` 刪掉約 1,100 行沒在用的舊樣式（舊頁尾、舊商城、舊產品展示、相簿縮圖等），刪前刪後在桌機與手機逐一比對過所有元素樣式，只有預期修改的地方不同。產品區／品牌區的「往下」箭頭點擊範圍加大到 44×44；虛擬大樓樓層說明改成分隔線，不再是框中框。
- 送出訂單收據（2026-11-23，擁有者同意）：結帳送出成功後不再跳 alert，改成黑色「出單機」印出一張白色收據（`window.showOrderReceipt`，在 `js/script.js`；`js/member.js` 送單成功時呼叫，函式不存在時才退回 alert）。收據列出品項、小計、取貨日、訂購人、匯款資訊（直接讀結帳彈窗 `.checkout-payment-row` 的文字，改帳號只要改一處）。樣式在 `css/style.css` 最後一段。網址加 `?receipt=1` 可用假資料預覽。桌機 1440 與手機 375 測過（印出動畫、完成鈕、Esc 關閉、關掉再開）；**沒有實際登入下單走一次**（會寫進 Firebase 訂單）。付款方式已統一成「匯款」（2026-11-23 擁有者決定）：常見問題卡片、取貨與保存須知彈窗、搜尋引擎 FAQ、商城黑卡、產品區「取貨與通路」頁籤原本寫「超商取貨付款」，都改成「匯款付款、確認款項後寄到超商取貨」。
- 「加到主畫面」App（2026-11-23，擁有者選做法一，不上架商店）：新增 `manifest.webmanifest`（名稱、白色主題、全螢幕無網址列）、`images/app/` 四張圖示（黑底白獨角獸，由 `UNICORN LOGO.png` 產生；含 Android 圓角安全版與 iPhone 180px 版）、`sw.js` 離線小幫手（只管本站、一律先上網拿最新，離線才用舊的，Firebase／CDN 不碰），在 `js/script.js` 最後註冊；`index.html` 頁首加了 manifest 與 iPhone 用的設定。本機預覽確認設定檔、圖示都讀得到、小幫手有啟用、沒有錯誤；**還沒在真的 iPhone／Android 上實際加到主畫面試過**。之後要改 `sw.js` 行為時把 `CACHE` 名稱改掉，舊的存檔會自動清。
- 手機底部分頁列卡頓修正（2026-11-23，擁有者用 iPhone 錄影回報切換很卡）：(1) 凹槽動畫原本每格重畫 SVG 遮罩，手機要一直重新解碼、還會閃一格空白底板 → 改成寬度改變時才畫一張兩倍寬底板，用 CSS `mask-position` 滑動（`js/script.js` 的 `buildShape`／`drawNotch`、`css/style.css` 最後一段）；(2) 點分頁後捲動途中圓鈕會一站一站停（首頁→產品→商城）→ 點下去先鎖在目標，捲到目標停下來才對回實際章節（保底 2.5 秒）；(3) 關掉 iPhone 點擊灰色圓底，改成圖示按下縮小。手機 375 預覽測過：直接跳到目標、購物車開關、手動捲動同步都正常；**真的 iPhone 還沒重測**。
- Google 登入（2026-11-23，擁有者回報 iPhone 主畫面 App 按 Google 登入跳紅字）：iPhone 主畫面 App 開不了 Google 登入小視窗（Safari、Android 正常），LINE／FB／IG 內建瀏覽器 Google 自己會擋。`js/member.js` 現在遇到這兩種情況直接顯示白話說明（改用信箱登入或用 Safari／Chrome 打開），不再硬試；也補了彈窗被擋、網路不穩等錯誤的中文。**根本解法還沒做**：要讓主畫面 App 也能用 Google 登入，得把 Firebase 的 authDomain 改成跟網站同一個網域（例如自訂網域或 fanhanyunchris.github.io 根目錄放 Firebase 登入輔助檔），並在 Google Cloud 加上新的回呼網址，需要擁有者操作帳號後台。

## 下一步（等擁有者決定，不要自己開工）
- 完整檢查（2026-11-20）技術面 13/20。還沒處理、要擁有者提供或決定的：產品沒有真實照片（最大扣分）、YouTube／Facebook／Instagram 連結是空的、團隊第 2、3 位沒照片（`team-2.jpg`、`team-3.jpg`）、小遊戲連到本機資料夾、沒有分享預覽圖（og:image）、首頁第一眼看不出賣鳳梨酥。
- 檢查工具還回報一處灰字對比不足（#a5a5a5），很可能是停用狀態的分頁按鈕（WCAG 不要求停用按鈕對比），沒處理；另有一處文字太貼邊框（品牌團隊卡）也沒處理。

## 等官方信箱：開啟 Google 登入（2026-11-23 做到一半，擁有者決定暫停）
- 查到的事實：Firebase 原本**根本沒開 Google 登入**，`fanhanyunchris.github.io` 也不在授權網域，所以官網的 Google 按鈕從來沒能用。
- 已做完並保留：(1) 新建公開 repo `FANHANYUNCHRIS/fanhanyunchris.github.io`（本機 `Documents/GitHub/fanhanyunchris.github.io`），放 Firebase 官方登入輔助檔 `__/auth/`，網址 https://fanhanyunchris.github.io/__/auth/handler 已確認能開；(2) Firebase 授權網域已加 `fanhanyunchris.github.io`；(3) Google Cloud 條款擁有者已同意。
- 已暫停：Google 供應商開過又**關掉**（支援信箱只能選擁有者私人 Gmail，擁有者不要公開）；官網 Google 按鈕和「或」分隔線加了 `hidden` 藏起來（`index.html`）。
- 官方信箱申請好之後要做：① 把官方信箱加進 Firebase 專案成員（擁有者操作），② Firebase › Authentication › 登入方式 › 開 Google，公開名稱 Project.CD、支援信箱選官方信箱（Google Cloud › Google Auth Platform › 品牌 也確認沒有私人 Gmail），③ Google Cloud › 用戶端 › Web client (auto created by Google Service)：JavaScript 來源加 `https://fanhanyunchris.github.io`、重新導向 URI 加 `https://fanhanyunchris.github.io/__/auth/handler`，④ `js/firebase-config.js` 的 authDomain 改成 `fanhanyunchris.github.io`，iPhone 主畫面 App 改用 `signInWithRedirect`（`js/member.js` 目前在主畫面 App 直接顯示說明不嘗試），manifest 的 scope 可能要放寬到 `/` 讓 `/__/auth/` 留在 App 裡，⑤ 拿掉 `index.html` 兩個 `hidden`，⑥ 電腦、Safari、iPhone 主畫面 App 各測一次。主畫面 App 這條路沒有實測過，不保證成功。

## 注意事項
- 設計規範看 `CLAUDE.md` 和 `AGENTS.md`。
- 本機預覽：在專案資料夾開伺服器，打開 `http://localhost:8080/index.html`。
