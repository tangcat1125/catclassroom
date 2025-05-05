// review-loader.js
// 對應 review-handwrite.html，教師批閱學生手寫作答專用模組

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ✅ Firebase 設定（與 handwrite-upload、task-dispatch 共用專案）
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ 抓取題目 ID
const urlParams = new URLSearchParams(window.location.search);
const questionId = urlParams.get("qid") || "demo-question";

// 📌 UI 元件
const questionTitle = document.getElementById("questionTitle");
const answersContainer = document.getElementById("answersContainer");
const previewImage = document.getElementById("previewImage");
const progressInfo = document.getElementById("progressInfo");

// 顯示題目 ID
questionTitle.textContent = `題目 ID：${questionId}`;

// 🔄 從 Firebase 載入學生作答資料
const answersRef = ref(db, `/handwritingAnswers/${questionId}`);
onValue(answersRef, (snapshot) => {
  const data = snapshot.val();
  answersContainer.innerHTML = "";
  previewImage.src = "";

  if (!data) {
    progressInfo.textContent = "尚無學生作答。";
    return;
  }

  const entries = Object.entries(data);
  progressInfo.textContent = `共 ${entries.length} 筆作答`;

  entries.forEach(([studentId, info]) => {
    const entryDiv = document.createElement("div");
    entryDiv.className = "student-entry";

    const img = document.createElement("img");
    img.src = info.imageUrl;
    img.alt = `${info.name} 的作答`;
    img.className = "thumbnail";
    img.onclick = () => {
      previewImage.src = info.imageUrl;
      previewImage.alt = `${info.name} 的作答預覽`;
    };

    const meta = document.createElement("div");
    meta.innerHTML = `
      👤 ${info.name || "未命名"}<br>
      🏫 ${info.class || "?"} 班 ${info.seat || "?"} 號<br>
      🆔 ${studentId}
    `;

    // 👉 批閱區塊
    const tools = document.createElement("div");
    tools.innerHTML = `
      <label>批改：</label>
      <button data-val="correct">✔</button>
      <button data-val="wrong">✘</button>
      <button data-val="revise">💬</button><br>
      <textarea rows="2" cols="30" placeholder="老師留言...">${info.feedback?.comment || ""}</textarea><br>
      <button class="saveBtn">💾 儲存回饋</button>
      <button class="downloadBtn">⬇️ 下載圖片</button>
    `;

    // 批閱按鈕選取效果
    tools.querySelectorAll("button[data-val]").forEach(btn => {
      btn.onclick = () => {
        tools.querySelectorAll("button[data-val]").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      };
    });

    // 預設選中原先批改結果
    if (info.feedback?.result) {
      const selectedBtn = tools.querySelector(`button[data-val="${info.feedback.result}"]`);
      if (selectedBtn) selectedBtn.classList.add("selected");
    }

    // 儲存回饋事件
    tools.querySelector(".saveBtn").onclick = () => {
      const selected = tools.querySelector("button.selected[data-val]")?.dataset.val || "";
      const comment = tools.querySelector("textarea").value;
      update(ref(db, `/handwritingAnswers/${questionId}/${studentId}`), {
        feedback: { result: selected, comment }
      }).then(() => alert("✅ 已儲存！"));
    };

    // 下載圖片事件
    tools.querySelector(".downloadBtn").onclick = () => {
      const link = document.createElement("a");
      link.href = info.imageUrl;
      link.download = `${info.name || studentId}-作答.png`;
      link.click();
    };

    // 加入畫面
    entryDiv.appendChild(img);
    entryDiv.appendChild(meta);
    entryDiv.appendChild(tools);
    answersContainer.appendChild(entryDiv);
  });
});
