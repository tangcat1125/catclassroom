# 學生互動介面說明（Student UI - v6.3 基準）

本模組包含學生登入、觀看題目、作答、聊天、求救等互動功能。

## 🔗 頁面連結與說明
- **登入頁面（rollcall.html）**：學生選擇身份（本班/訪客），輸入姓名與座號/代號。登入成功後將學生 ID 和姓名存入 `sessionStorage`，並寫入 Firebase `/login/{studentId}` 路徑，最後跳轉至作答頁。
- **互動主頁（StudentUi_Login.html）**：學生主要操作介面。

## ✅ 功能總覽（StudentUi_Login.html - 基於 v6.3 JS）

1.  **顯示學生資訊**：從 `sessionStorage` 讀取並顯示學生姓名和班級/座號。
2.  **紅燈提示**：老師出題時，頂部指示燈閃爍。
3.  **系統訊息區**：顯示老師派送的題目文字或系統狀態。
4.  **動態作答區**：根據老師派送的題目類型 (`choice`, `truefalse`, `shortanswer`)，顯示對應的作答按鈕或輸入框。
5.  **進度條**：監聽 `/answers` 路徑，顯示本題全班作答進度。
6.  **求救系統**：提供按鈕顯示/隱藏求救輸入框，可發送訊息至 Firebase `/help/{studentId}`。
7.  **課程聊天室**：
    *   初始狀態連接至 `/chat/lobby` (大廳)。
    *   老師派題後，自動切換監聽並連接至 `/chat/{questionId}`。
    *   老師清除題目後，自動切換回 `/chat/lobby`。
    *   學生可發送訊息至當前連接的聊天室。
    *   自己發送的訊息有特殊樣式標示。
8.  **手寫題跳轉**：若收到 `handwrite` 題型，自動在新分頁開啟 `handwrite-upload.html`。
9.  **(暫時移除/註解)** 截圖註記任務：v6.3 版本暫時移除了監聽截圖任務和開啟帶背景手寫頁的功能，待核心穩定後再加入。
10. **貓咪角角**：畫面右下角固定顯示 `cat.png` 圖示 (需確保圖片存在)。

## 📦 Firebase 資料使用說明

| 功能區塊         | 對應資料路徑                      | 讀/寫 權限 (v6.3 假設) |
|------------------|------------------------------------|--------------------------|
| 學生登入 (寫入)  | `/login/{studentId}`               | 學生 Write (Rollcall)    |
| 學生登入 (讀取)  | `/login`                           | 老師 Read (TeacherUI)     |
| 學生作答 (寫入)  | `/answers/{studentId}/{qid}`      | 學生 Write               |
| 學生作答 (讀取)  | `/answers`                         | 老師/學生 Read           |
| 老師出題 (讀取)  | `/teacher/currentQuestion`         | 學生 Read                |
| 求救訊息 (寫入)  | `/help/{studentId}`                | 學生 Write (Set)         |
| 求救訊息 (讀取)  | `/help`                            | 老師 Read                |
| 課程聊天室       | `/chat/lobby`, `/chat/{qid}`       | 學生 Read/Write (Push)   |
| 截圖任務 (讀取)  | `/teacher/currentScreenshotAnnotationTask` | 學生 Read (暫未啟用)     |
| 手寫作答 (寫入)  | `/handwriting/{studentId}/{qid}`   | 學生 Write (Handwrite)   |
| 手寫作答 (讀取)  | `/handwriting`                     | 老師 Read (TeacherUI)     |

## 🧠 操作邏輯與互動 (v6.3)

- 學生從 `rollcall.html` 登入，產生 `studentId` 和 `studentName` 存入 `sessionStorage`。
- 自動跳轉至 `StudentUi_Login.html`。
- `student-ui.js` 初始化，讀取 `sessionStorage` 顯示資訊，預設連接大廳聊天室。
- 監聽 `/teacher/currentQuestion`：
    - 若有新題目，更新系統訊息，根據題型顯示作答區，切換至題目聊天室，開始監聽答案進度。
    - 若題目被清除，顯示等待訊息，切換回大廳聊天室。
- 學生作答後，答案寫入 `/answers/...`，作答區隱藏，紅燈熄滅。
- 學生可在當前聊天室發言，訊息寫入 `/chat/...`。
- 學生可點擊求救按鈕發送訊息。

## 🧪 測試須知 (v6.3)

- **Firebase 配置**: 確保 `rollcall.html` 和 `StudentUi_Login.html` 中的 `firebaseConfig` 物件使用你**真實且正確**的配置。
- **Firebase 規則**: 確保已發佈允許相關路徑讀寫的規則 (參考之前提供的純淨版規則)。
- **登入流程**: **務必**從 `rollcall.html` 開始登入，才能將學生資訊正確寫入 `sessionStorage`。直接打開 `StudentUi_Login.html` 會導致無法識別學生身份。
- **瀏覽器快取**: 測試前務必清除瀏覽器快取，確保載入的是最新的 HTML, CSS, JS 檔案。
- **開發者工具 (F12)**: 持續關注 Console (主控台) 的輸出，檢查是否有紅色錯誤訊息。

## 📁 關聯檔案
- `rollcall.html`：登入畫面 (兩欄式版本)
- `rollcall-style.css`：登入畫面樣式
- `StudentUi_Login.html`：互動主頁 HTML 結構 (v4)
- `Student-Interface.css`：互動主頁樣式
- `student-ui.js`：主邏輯控制 (v6.3)
- `cat.png`：角落裝飾圖示 (需放在同一資料夾)
