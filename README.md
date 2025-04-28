# 白貓工作室白皮書
智慧教學互動系統 - 白貓工作室
🐾 專案簡介
本系統為【白貓工作室】開發的教學互動平台，
結合 Firebase Realtime Database，實現：

學生登入、作答、即時求救

教師出題、控課、結束統計

公開大螢幕共用討論

小組合作與學習歷程記錄

專為國小至高中課堂互動設計，支援40分鐘～45分鐘課堂節奏。

🔥 功能總覽

功能	狀態
學生登入（rollcall.html）	✅ 完成
學生作答（student-irs.html）	✅ 完成
學生求救系統	✅ 完成
公共聊天室	⬜ 製作中
小組私聊	⬜ 預定開發
老師出題推送（teacher-ui.html）	⬜ 預定開發
公開討論大螢幕（public-ui.html）	⬜ 預定開發
課後檢討統計（teacher-review.html）	⬜ 預定開發
📋 系統結構圖
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
🛠️ 模組說明

檔案	說明
index.html	系統主入口
rollcall.html	學生登入畫面
StudentUi_Login.html / student-irs.html	學生互動作答頁
public-ui.html	公開討論大螢幕
teacher-ui.html	老師控課介面
teacher-review.html	課後統計檢討頁
firebase-config.js	Firebase設定檔
main.js	控制老師出題/推送/課程流程
student-ui.js	控制學生作答/求救/聊天室行為
style.css	共用基礎CSS樣式
Student-Interface.css	學生端專用版面CSS
rollcall-style.css	登入頁CSS樣式
🔧 安裝與使用
Fork或Clone本倉庫

修改 firebase-config.js，換成你的Firebase設定

開啟本機或GitHub Pages直接部署

學生用手機掃QRcode登入，老師用電腦控課

📂 Firebase資料結構
/login

/studentAnswers

/chatMessages

/groupChats

/helpRequests

🧩 未來規劃
小組私聊討論（支援@標記）

AI自動派題模式

課堂成果自動生成報告（PDF）

🙌 授權與致謝
© 2025 白貓工作室保留所有權利
特別感謝OpenAI、Firebase、GitHub Pages技術支援
