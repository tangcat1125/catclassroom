===========================================
白貓教學互動平台 - 網站架構總覽（2025 版）
白貓工作室 CatClassroom Project
===========================================

📌 本平台特色
- 採模組化設計：各頁面獨立部署，可直接開啟使用
- 所有模組透過 Firebase Realtime Database 資料交換
- 每個子系統皆為獨立資料夾，支援單獨測試與部署

===========================================
📁 頂層目錄（https://tangcat1125.github.io/catclassroom/）
- 🔗 系統首頁：教師入口建議使用

📁 /student-ui/
- 🔗 學生登入（點名）：/student-ui/rollcall.html
- 🔗 學生作答主頁：/student-ui/student-irs.html
- 🔗 學生 UI 腳本：student-ui.js（含作答、求救、聊天室）

📁 /teacher-ui/
- 🔗 教師控課主頁：/teacher-ui/index.html
- 🔗 教師控課 JS 腳本：main.js（處理出題、截圖、回應板）
- 🔗 共用樣式表：style.css

📁 /public-ui/
- 🔗 公開大螢幕展示：/public-ui/index.html

📁 /review-ui/
- 🔗 課後檢討統計：/review-ui/index.html

📁 /task-system/
- 🔗 出題中心：/task-system/task-center.html
- 🔗 題目編輯器：/task-system/task-editor.html
- 🔗 題目管理邏輯：task-manage.js

📁 /handwrite-module/
- 🔗 手寫作答頁（觸控/滑鼠/自由繪圖）：/handwrite-module/handwrite-upload.html
- 🔧 Firebase Config：handwrite-config.js
- 🖼️ 畫布 + 預覽功能：已整合於上傳頁面

📁 /assets/
- 存放圖片、QR Code、icon

📄 firebase-config.js
- 每個模組共用的 Firebase 設定（或以模組獨立配置）

===========================================
📡 Firebase 資料節點範例
- /login/{studentId}：點名登入資訊
- /answers/{studentId}：學生選項作答
- /handwriting/{studentId}/{questionId}：手寫圖片上傳
- /questions/：題目庫（由教師建立）
- /teacher/question：目前派送中題目

===========================================
📌 路由統一入口建議
- 教師統一入口：https://tangcat1125.github.io/catclassroom/teacher-ui/index.html
- 學生登入入口：https://tangcat1125.github.io/catclassroom/student-ui/rollcall.html
- 手寫作答（可單獨使用）：https://tangcat1125.github.io/catclassroom/handwrite-module/handwrite-upload.html

===========================================
💡 設計原則
- 各界面獨立設計，不混用功能邏輯
- 資料整合交會點：Firebase
- 支援不同班級、座號、動態命題、統計回收
- 對應 40~45 分鐘課堂節奏，學生端可獨立操作

===========================================
🐾 Powered by 白貓工作室．貓老師 & 小白聯合開發
