===========================================
手寫模組 Handwrite Module - 使用說明（2025 新版）
白貓工作室 CatClassroom Project
===========================================

【模組簡介】
- 本模組負責管理學生的手寫作答內容。
- 支援觸控手寫、滑鼠繪圖、圖片上傳。
- 學生可在有題目或無題目的情況下進行繪圖與提交。
- 適用裝置：桌機、筆電、Chromebook、iPad、手機等。

【模組資料夾結構】
/handwrite-module
  |- handwrite-config.js       (Firebase初始化設定)
  |- handwrite-database.js     (作答上傳處理邏輯，可選用)
  |- handwrite-upload.html     (正式使用頁面，支援觸控與自由繪圖)
  |- handwrite-interface.css   (樣式檔，可選用)
  |- readme.txt                (本使用說明檔案)

【功能支援說明】
- ⭕ 支援滑鼠與觸控畫布作答（含手機與平板）
- ⭕ 支援無題目情境作答（會自動產生 questionId 以利老師辨識）
- ⭕ 支援畫布預覽功能
- ⭕ 支援老師題目派送後限制時間內作答（如有設定）

【Firebase 資料路徑規劃】
- 所有作答資料儲存在 Realtime Database 的 `/handwriting/`
- 結構：
  handwriting/
    └─ studentId/
         └─ questionId/
              ├─ imageUrl (string) 圖片資料URL (Data URL 或 Storage URL)
              ├─ timestamp (number) 作答時間戳記
              ├─ studentName (string)
              ├─ studentClass (string)
              ├─ fromCanvas (boolean) 是否來自畫布繪圖

【上傳行為規則】
- 學生端：需 sessionStorage 有 studentId 才能上傳
- 若無 teacher 題目派送，系統自動命名 `自由繪圖_時間戳`
- 顯示上傳狀態與圖像預覽

【建議使用方式】
- ✅ 在 rollcall.html 登入後使用 sessionStorage 存入基本資訊（ID/姓名/班級）
- ✅ 接著進入 handwrite-upload.html，自動載入學生身份與題目（若有）
- ✅ 畫圖 ➜ 點擊上傳 ➜ 預覽圖顯示即成功

【開發擴充方向】
- 圖片可上傳至 Firebase Storage，僅在 Database 儲存網址（未來開啟）
- 支援老師端對手寫內容評語與簡單評分（未來開啟）
- 支援 canvas 繪圖內容還原與覆寫（未來開啟）

===========================================
Powered by 白貓工作室．貓老師 & 小白聯合開發
