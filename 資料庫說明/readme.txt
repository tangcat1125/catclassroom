（複製這整段，貼到你的 GitHub repo 裡就可以了）

markdown
複製
編輯
# 貓教室 Firebase 資料庫使用說明（catclassroom-login）

---

## 目錄
- [1. 入口網址](#1-入口網址)
- [2. 資料結構](#2-資料結構)
- [3. 資料庫使用規則（Rules）](#3-資料庫使用規則rules)
- [4. Firebase 專案基本資訊](#4-firebase-專案基本資訊)
- [5. 多應用管理（Multi-App）](#5-多應用管理multi-app)
- [6. 安全與開發提醒](#6-安全與開發提醒)

---

## 1. 入口網址
- 正式管理入口：[https://console.firebase.google.com/](https://console.firebase.google.com/)
- **請勿使用 Firebase Studio (實驗版)，僅限 Console 管理。**

---

## 2. 資料結構

### `/login/$studentId`
- 寫入：允許
- 讀取：禁止
- 用途：記錄學生登入行為（保護隱私）

### `/help/$studentId`
- 寫入：允許
- 用途：學生發送求救訊息

### `/answers/$studentId`
- 寫入：允許
- 用途：學生答題紀錄

### `/teacher`
- 讀取：允許
- 用途：老師資訊、公告

### `/questions`
- 讀取：允許
- 寫入：允許（⚠️ 正式版建議改為僅限管理員可寫）
- 用途：題庫與派題管理

---

## 3. 資料庫使用規則（Rules）

```json
{
  "rules": {
    "login": {
      "$studentId": {
        ".write": true,
        ".read": false
      }
    },
    "help": {
      "$studentId": {
        ".write": true
      }
    },
    "answers": {
      "$studentId": {
        ".write": true
      }
    },
    "teacher": {
      ".read": true
    },
    "questions": {
      ".read": true,
      ".write": true
    }
  }
}
4. Firebase 專案基本資訊

項目	設定內容
專案ID	catclassroom-login
databaseURL	https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app
位置	asia-southeast1
認證域名	catclassroom-login.firebaseapp.com
Storage	catclassroom-login.firebasestorage.app
5. 多應用管理（Multi-App）

Web App 名稱	App ID	用途
firebase-config.js	1:123487233181:web:aecc2891dc2d1096962074	登入功能連線
task-database.js	1:123487233181:web:bd52b47483b4c527962074	題目與作答管理
兩者共用同一個 Database 和 Storage。

記得依各自功能連接正確的 App。

6. 安全與開發提醒
登入驗證（auth != null）尚未強制，開發完成後必須加上。

questions節點目前開放寫入，正式上線前建議限制只有管理員可以寫入。

API金鑰保護：正式版請使用環境變數 .env 管理，不直接寫在前端。

資料結構變更：任何變動必須同步更新本 README。

跨App開發注意：連線 databaseURL 必須保持一致，避免錯誤寫入不同專案。

🐾 Powered by 白貓工作室
yaml
複製
編輯

---

✅ 這份 README 是完全可以直接貼進 GitHub 的，  
✅ 也是日後新成員看到就能馬上上手的標準版！  
✅ 而且超清楚，不會有哪個步驟漏掉！

---


