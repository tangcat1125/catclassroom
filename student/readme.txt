# CatClassroom - 學生互動介面 UI

這是 CatClassroom 專案中的學生端網頁介面。它提供了一個平台，讓學生可以登入虛擬教室、接收老師的指令、參與即時聊天、發送求救訊號，並對老師發布的問題進行作答。整個系統的核心互動依賴於 Firebase Realtime Database 進行即時資料同步。

**🚀 線上演示 (Live Demo):**

[https://tangcat1125.github.io/catclassroom/student/](https://tangcat1125.github.io/catclassroom/student/)

## ✨ 主要功能

*   **學生登入:**
    *   區分「本班學生」與「他班學生」。
    *   本班學生透過下拉選單選擇座號 (1-52)。
    *   他班學生輸入臨時編號 (G1-G52)。
    *   若未輸入姓名，則自動以座號/編號作為姓名。
    *   登入成功後記錄學生資訊到 Firebase `login` 路徑。
*   **資訊傳遞:** 使用 `localStorage` 將學生登入資訊（班級類型、姓名、座號）從登入頁面傳遞到作答區頁面。
*   **作答區介面:**
    *   在頁面頂部顯示當前登入學生的資訊。
    *   **系統訊息區:** 即時顯示老師透過 Firebase 發送的指令或題目。
    *   **SOS 求救:** 提供一個按鈕，點擊後將求救訊號記錄到 Firebase `help` 路徑。
    *   **課程聊天室:**
        *   即時顯示 Firebase `chat` 路徑下的聊天訊息。
        *   允許學生發送訊息到聊天室。
    *   **動態互動區:**
        *   預設顯示聊天輸入框。
        *   當老師發布題目時，此區域會自動切換為對應的作答按鈕 (例如 A/B/C/D 或 ○/X)。
        *   學生點擊答案後，將作答記錄寫入 Firebase `questions` 路徑下對應題目的 `answers` 中。

## 🛠️ 技術棧

*   **前端:** HTML, CSS, JavaScript (ES Modules)
*   **後端 & 資料庫:** Firebase Realtime Database

## 📁 專案結構 (student/ 資料夾內)
Use code with caution.
Markdown
student/
├── index.html # 學生登入頁面
├── student.html # 學生作答區頁面
├── login.js # 登入頁面的 JavaScript 邏輯
├── student.js # 作答區頁面的 JavaScript 邏輯
└── (style.css) # (可選) CSS 樣式表
## 🔧 設定與配置 (Setup / Configuration)

要運行此專案或進行二次開發，您需要設定 Firebase：

1.  **建立 Firebase 專案:** 前往 [Firebase 控制台](https://console.firebase.google.com/) 建立一個新的專案。
2.  **啟用 Realtime Database:** 在您的 Firebase 專案中，建立一個 Realtime Database 實例。建議選擇離您使用者較近的區域 (例如 `asia-southeast1`)。
3.  **設定資料庫安全規則:**
    *   這是**非常重要**的一步，用於保護您的資料庫不被未授權訪問。
    *   前往 Firebase 控制台 -> Realtime Database -> 規則 (Rules)。
    *   **⚠️ 目前專案使用的規則較為寬鬆，可能存在安全風險。** 在生產環境或公開部署前，強烈建議根據 Firebase 文件學習並設定更嚴格、基於身份驗證 (Firebase Authentication) 的安全規則，以確保只有合適的使用者（例如已登入的學生或老師）才能讀寫特定路徑。
    *   您可以參考專案中目前使用的規則，但請務必理解其含義並考慮安全性。
4.  **獲取 Firebase 設定金鑰:**
    *   在 Firebase 控制台，進入您的專案設定 (Project settings)。
    *   在「一般」(General) 標籤頁下方，找到「您的應用」(Your apps) 區塊。
    *   如果還沒有 Web 應用，請點擊「新增應用」(Add app) 並選擇 Web (</>)。
    *   註冊應用後，您會看到一個 `firebaseConfig` 物件，其中包含 `apiKey`, `authDomain`, `databaseURL` 等金鑰。
5.  **配置 JavaScript 檔案:**
    *   打開 `login.js` 檔案。
    *   找到 `firebaseConfig` 這個 JavaScript 物件。
    *   將您在上一步中獲取的金鑰複製並貼到對應的位置。
    *   **(注意)** 後續 `student.js` 在初始化 Firebase 時也需要這個 `firebaseConfig` 物件。您可以考慮將其提取到一個共享的設定檔中。
    *   **🔒 安全警告:** **切勿**將包含真實金鑰的程式碼直接提交到**公開**的 Git 儲存庫。對於部署，強烈建議使用環境變數或其他安全機制來管理這些敏感金鑰。

## 🤔 運作方式簡述

1.  **登入 (`index.html` + `login.js`):**
    *   使用者輸入資訊。
    *   JS 驗證輸入並處理姓名。
    *   JS 將登入記錄寫入 Firebase RTDB 的 `login` 路徑。
    *   JS 將學生資訊 (`classType`, `name`, `seat`) 存入 `localStorage`。
    *   JS 將頁面跳轉到 `student.html`。
2.  **作答區 (`student.html` + `student.js`):**
    *   頁面載入時，JS 從 `localStorage` 讀取學生資訊並顯示在頂部。
    *   (後續實作) JS 初始化 Firebase 連接。
    *   (後續實作) JS 設置 Firebase 監聽器，監聽 `chat`, `teacher/currentQuestion` 等路徑的變化。
    *   (後續實作) 根據監聽到的資料變化，動態更新聊天室內容、系統訊息、切換互動區（聊天/作答按鈕）。
    *   (後續實作) 將學生的聊天訊息、求救訊號、作答結果寫入 Firebase RTDB 的對應路徑。

---

希望這份 README 對您有所幫助！
Use code with caution.
說明：
標題和描述： 清晰說明專案用途。
線上演示： 直接提供 GitHub Pages 連結。
功能列表： 條列出主要實現的功能點。
技術棧： 列出使用的主要技術。
專案結構： 展示 student/ 資料夾下的檔案佈局。
設定與配置： 詳細說明了 Firebase 的設置步驟，並特別強調了安全規則的重要性和當前規則可能存在的風險，以及API 金鑰的安全管理。這是任何使用 Firebase 的專案 README 都應該包含的重要部分。
運作方式簡述： 簡要說明了從登入到作答區的資料流程和基本原理。
你可以根據實際情況調整這份 README 的內容。
