===========================================
手寫模組 Handwrite Module - 使用說明
白貓工作室 CatClassroom Project
===========================================

【模組簡介】
- 本模組負責管理學生手寫作答內容。
- 支援上傳手寫圖片、紀錄對應題目與學生資料。
- 目標是與主系統分開，保持資料清晰、模組化設計。

【模組資料夾結構】
/handwrite-module
  |- handwrite-config.js      (Firebase初始化)
  |- handwrite-database.js    (存取手寫資料)
  |- handwrite-upload.html    (上傳手寫作答介面)
  |- handwrite-interface.css  (手寫介面樣式，選用)
  |- readme.txt                (本說明檔)

【Firebase資料路徑規劃】
- 所有手寫資料存放於 Realtime Database 的 `/handwriting/`
- 每一筆手寫資料包含以下欄位：
  - studentId (string)：學生代號
  - questionId (string)：題目代號
  - imageUrl (string)：儲存圖片連結
  - timestamp (number)：上傳時間（毫秒）

【基本規則（Rules）】
- 只有登入學生本人能寫入自己的手寫資料。
- 老師可以讀取所有學生手寫資料。
- 他人無法讀取、修改、刪除非本人資料。

【開發注意事項】
- 本模組不共用 task-system 的 firebase-config.js
- 獨立使用 handwrite-config.js 作初始化連線。
- 上傳圖片可考慮搭配 Firebase Storage，並在 Database 儲存網址。

【未來擴充方向】
- 支援圖片批量上傳。
- 支援手寫內容標記與評分。

===========================================
Powered by 白貓工作室
