import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ⬇️ 你的 Firebase 設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ⬇️ 假設 questionId 會從網址參數中取得（或你可寫死）
const urlParams = new URLSearchParams(window.location.search);
const questionId = urlParams.get("qid") || "demo-question"; // fallback 預設值

const answersContainer = document.getElementById("answersContainer");
const previewImage = document.getElementById("previewImage");
const progressInfo = document.getElementById("progressInfo");

const questionTitle = document.getElementById("questionTitle");
questionTitle.textContent = "題目 ID：" + questionId;

const answersRef = ref(db, `/handwritingAnswers/${questionId}`);
onValue(answersRef, (snapshot) => {
  const data = snapshot.val();
  answersContainer.innerHTML = "";
  previewImage.src = "";
  
  if (!data) {
    progressInfo.textContent = "尚無學生作答。";
    return;
  }

  progressInfo.textContent = `共 ${Object.keys(data).length} 筆作答`;

  Object.entries(data).forEach(([studentId, info]) => {
    const div = document.createElement("div");
    div.className = "student-entry";

    const img = document.createElement("img");
    img.src = info.imageUrl;
    img.className = "thumbnail";
    img.alt = `${info.name} 的作答`;
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

    div.appendChild(img);
    div.appendChild(meta);
    answersContainer.appendChild(div);
  });
});
