🐾 智慧教學互動系統 - 白貓工作室
📖 專案簡介
本系統為【白貓工作室】開發的教學互動平台，
結合 Firebase Realtime Database，
實現：

學生登入、作答、即時求救

教師出題、控課、結束統計

公開大螢幕共用討論

小組合作與學習歷程記錄

教師派題系統（task-system/）

專為國小至高中課堂互動設計，
支援 40分鐘～45分鐘 課堂節奏。

🔥 功能總覽

功能	狀態
學生登入（rollcall.html）	✅ 完成
學生互動作答（student-irs.html）	✅ 完成
學生求救系統	✅ 完成
公共聊天室	⬜ 製作中
小組私聊系統	⬜ 預定開發
教師出題推送（teacher-ui.html）	⬜ 預定開發
公開討論大螢幕（public-ui.html）	⬜ 預定開發
課後檢討統計（teacher-review.html）	⬜ 預定開發
教師派題系統（task-system/）	⬜ 新增預定開發（2025/4開始）
🧩 系統結構圖
plaintext
複製
編輯
rollcall.html (學生登入)
    ↓
student-irs.html (學生互動主頁)
    ↓
public-ui.html (大螢幕討論)
    ↓
teacher-ui.html (老師控課)
    ↓
teacher-review.html (課後統計)
    ↓
task-system/ (派題系統專區)
🛠️ 各模組介紹

模組	用途
index.html	系統入口頁
rollcall.html	學生登入頁
StudentUi_Login.html / student-irs.html	學生互動主頁（作答、求救、聊天室）
public-ui.html	公開討論大螢幕
teacher-ui.html	教師控課界面
teacher-review.html	課後檢討統計界面
firebase-config.js	Firebase設定
main.js	控課邏輯（出題、推送、統計）
student-ui.js	學生互動行為（作答/求救/聊天室）
style.css	共用CSS樣式
Student-Interface.css	學生端專用CSS樣式
rollcall-style.css	登入頁CSS樣式
task-system/	🎯【新資料夾】教師派題系統（出題、派送、題庫管理）
└── task-center.html	出題中心
└── task-editor.html	題目編輯器
└── task-manage.js	控制出題推送/管理
└── task-style.css	派題專用版面CSS
📂 Firebase 資料結構（2025版）
plaintext
複製
編輯
/login
/studentAnswers
/chatMessages
/groupChats
/helpRequests
/preparedCourses
/currentTasks
/taskSystem (新增，用於教師派題資料)
🔧 安裝與使用方式
Fork 或 Clone 本倉庫

修改 firebase-config.js（換成自己的Firebase設定）

本機或GitHub Pages直接部署

學生端掃QR登入；教師端控課

🧩 未來發展規劃
完成小組分聊（支援@標記）

自動補救教學（AI診斷）

自動生成課堂學習成果PDF

擴充 task-system/ 題庫系統

支援不同學段（國小、中學、職校）

資料庫說明
📚 作答資料流程設計（雙回傳系統）
為確保即時互動與完整記錄，學生作答時會同時更新兩個資料庫：


資料庫	路徑	資料內容	用途
tasks-database	/tasks/{questionId}/answers/{studentId}	座號、姓名、作答選項	統計每題答題分布（如即時顯示班級選擇）
results-database	/results/{studentId}/{questionId}	題號、作答選項、正確與否、作答時間	個人作答歷程紀錄（供老師查詢、生成學習成果）
🎯 資料流簡圖
plaintext
複製
編輯
(1) 老師出題 ➔ 寫入 /tasks/{questionId}
(2) 學生UI即時讀取 ➔ /tasks/{questionId}
(3) 學生送出作答 ➔ 同步寫入：
    - /tasks/{questionId}/answers/{studentId}
    - /results/{studentId}/{questionId}
🧠 主要欄位設計建議
tasks-database ➔ 每一題答題記錄

欄位	說明
studentId	學生座號或學號
studentName	學生姓名
selectedOption	學生選擇的選項（如A、B、C、D）
results-database ➔ 每個學生的作答歷程

欄位	說明
questionId	題目ID
selectedOption	學生選擇的選項
isCorrect	是否答對（true/false）
answerTime	答題完成的時間（timestamp或秒數）
📈 未來擴充
加入作答秒數紀錄（用於統計作答速度）

分析個別學生弱點題型

公開大螢幕即時顯示答題狀況

自動生成學生個人學習歷程報告

🙌 授權與致謝
© 2025 白貓工作室 保留所有權利
感謝 OpenAI、Firebase、GitHub Pages 等開源工具技術支援！

