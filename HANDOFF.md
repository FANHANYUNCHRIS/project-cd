# 交接筆記

> Claude 與 GPT（Codex）輪流接手時看這份。只記目前狀態，舊內容做完就刪。開工先 `git pull`。

**最後更新**：2026-11-20，Claude

## 目前狀態
- 首頁頁尾社群圖示已放大到 44×44 觸控範圍；「與我聯繫」裡的 LINE 小標改成 h3。
- 購物車「請先登入會員」的貓咪插畫已補上（`images/cart-login-cat.png`，GPT 生成，黑白灰、透明背景、320×320）。
- 桌機版導覽列膠囊加了「黑色反白滑過去」效果（`css/style.css` 的 `.has-slider::after` + `js/script.js` 最後一段）。高亮仍由 navObserver 決定，滑塊只是跟著 `.active` 移動；手機版不受影響；減少動態時直接跳位。

- 產品區改成「單品頁」（依設計稿 https://claude.ai/artifact/VnRwaVbsNKeoGckiz5R8eJ ）：左 3D 展示框，右標題、三張數值卡、直接購買卡（數量＋加入購物車，不再先開彈窗）、資訊頁籤。加入購物車走 `js/member.js` 新的 `window.addItemToCart()`，跟產品彈窗共用。手機版自動分 2 頁：第 1 頁到購買卡，頁籤在第 2 頁。
- 品牌區改版（依設計稿 https://claude.ai/artifact/BZjFbdJKgEM4qGkg4kNev3 ）：定位「一個人的甜點研究室」，分頁變成 品牌故事／研究方法／原物料／品牌團隊，分頁樣式改成 iOS 分段控制器。原物料卡片還沒寫奶油、麵粉、糖的品牌名稱（擁有者有指定品牌，等他提供）。
- 虛擬大樓區改版（依設計稿 https://claude.ai/artifact/U2eUXTSBxcqKNbxdaymGHX ）：右邊改成大樓剖面圖＋樓層導覽（RF/4F/3F/2F/1F/B1，名稱跟 3D 大樓一致），點樓層會顯示內容，「進入這一層」開 `building/index.html?floor=2F` 這種網址，3D 大樓會直接跳到那層（`building/index.html` 最後加了一行讀網址）。左邊有營業狀態（台灣時間 06:00–22:00）和天氣小標籤（讀 `building/weather.json`，沒有今天的預報就不顯示——目前資料停在 10/31，所以暫時不會出現）。手機版沒有剖面圖，清單排兩欄，「進入」直接開整頁。
- 舊的「線上電商購買」「產品注意事項」兩個彈窗已刪除（內容在產品區頁籤裡）。

## 下一步（等擁有者決定，不要自己開工）
- Impeccable 檢查回報首頁還有：一處文字對比不足、一處文字太貼邊框。尚未處理。
- 首頁字型 Inter 被標為「太常見」，換不換由擁有者決定。

## 注意事項
- 設計規範看 `CLAUDE.md` 和 `AGENTS.md`。
- 本機預覽：在專案資料夾開伺服器，打開 `http://localhost:8080/index.html`。
