# 學生互動介面說明（StudentUi_Login.html）

本頁面為學生在課堂互動中使用的主要作答與通訊介面。

## 🔗 頁面連結與說明
- **登入頁面（rollcall.html）**：學生輸入姓名與座號，寫入 Firebase 並進入作答頁。
  - 網址：https://tangcat1125.github.io/catclassroom/student%20UI/rollcall.html
- **互動主頁（StudentUi_Login.html）**：學生觀看題目、作答、聊天室互動等功能。
  - 網址：https://tangcat1125.github.io/catclassroom/student%20UI/StudentUi_Login.html

## ✅ 功能總覽（StudentUi_Login.html）

1. **顯示學生資訊**：登入後顯示班級與姓名。
2. **紅燈提示**：老師出題時啟動紅燈閃爍提醒。
3. **訊息板**：顯示老師出題內容、同學作答、留言與系統通知。
4. **答題區**：依照題型出現按鈕、輸入欄或跳轉手寫頁面。
5. **進度條**：顯示全班作答進度（完成人數 / 總人數）。
6. **求救系統**：學生可按下求救鍵，向老師發送文字訊息，並顯示已傳送狀態。
7. **公開留言牆**：可發送一般訊息，留言會即時顯示在所有人的頁面上。
8. **課程聊天室**（新功能）：對應每次出題，開啟分流聊天室，讓學生即時交流。
9. **派發連結功能**（新增）：當老師於 Firebase `/teacher/linkMessage` 發送課程連結，學生會在訊息板中收到該連結並可點擊開啟。
10. **貓咪角角**：畫面右下角固定顯示 cat.png 圖示。

## 📦 Firebase 資料使用說明

| 功能區塊         | 對應資料路徑               |
|------------------|-----------------------------|
| 學生登入         | `/login/{studentId}`        |
| 學生作答         | `/answers/{studentId}/{qid}` |
| 老師出題         | `/teacher/currentQuestion`  |
| 求救訊息         | `/help/{studentId}`         |
| 公開留言牆       | `/messages/{autoId}`        |
| 課程聊天室       | `/chat/{questionId}/{auto}` |
| 派發連結         | `/teacher/linkMessage`      |
| 學生登入資訊     | `sessionStorage`            |

## 🧠 操作邏輯與互動

- 學生登入後進入 StudentUi_Login.html，根據老師派題自動進入對應作答區域。
- 若為 `handwrite` 題型，會跳出繪圖畫面（`handwrite-upload.html`）。
- 若為 `choice` / `truefalse`，則產生對應按鈕作答。
- 若為 `shortanswer`，會出現簡答欄位供學生輸入。
- 若收到 `/teacher/linkMessage`，將會在訊息板中顯示一條超連結訊息供學生點擊操作。
- 若有發送 `chat` 相關資料，會自動綁定聊天室資料顯示。

## 🧪 測試須知

請搭配 Firebase Realtime Database 使用，並確認以下路徑皆允許讀取或寫入：
- `/login`
- `/answers`
- `/messages`
- `/help`
- `/teacher/currentQuestion`
- `/teacher/linkMessage`
- `/chat`

## 📁 關聯檔案
- `rollcall.html`：登入畫面
- `StudentUi_Login.html`：互動主頁 HTML 結構
- `student-ui.js`：主邏輯控制
- `Student-Interface.css`：版面與樣式
- `cat.png`：角落裝飾圖示
