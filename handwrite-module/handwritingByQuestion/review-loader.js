import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const urlParams = new URLSearchParams(window.location.search);
const questionId = urlParams.get("qid") || "demo-question";

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

    // --- 新增批改工具區塊 ---
    const toolsDiv = document.createElement("div");
    toolsDiv.innerHTML = `
      <label>批改：</label>
      <button data-val="correct">✔</button>
      <button data-val="wrong">✘</button>
      <button data-val="revise">💬</button><br>
      <textarea rows="2" cols="30" placeholder="老師留言...">${info.feedback?.comment || ""}</textarea><br>
      <button class="saveBtn">💾 儲存回饋</button>
      <button class="downloadBtn">⬇️ 下載圖片</button>
    `;

    // 儲存按鈕
    toolsDiv.querySelector(".saveBtn").onclick = () => {
      const result = toolsDiv.querySelector("button[data-val].selected")?.dataset.val || "";
      const comment = toolsDiv.querySelector("textarea").value;
      const updateRef = ref(db, `/handwritingAnswers/${questionId}/${studentId}`);
      update(updateRef, {
        feedback: { result, comment }
      }).then(() => {
        alert("✅ 已儲存！");
      });
    };

    // 批改按鈕選擇效果
    toolsDiv.querySelectorAll("button[data-val]").forEach(btn => {
      btn.onclick = () => {
        toolsDiv.querySelectorAll("button[data-val]").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      };
    });

    // 預設勾選原始資料
    if (info.feedback?.result) {
      const btnToCheck = toolsDiv.querySelector(`button[data-val="${info.feedback.result}"]`);
      if (btnToCheck) btnToCheck.classList.add("selected");
    }

    // 下載圖片
    toolsDiv.querySelector(".downloadBtn").onclick = () => {
      const link = document.createElement("a");
      link.href = info.imageUrl;
      link.download = `${info.name || studentId}-作答.png`;
      link.click();
    };

    div.appendChild(img);
    div.appendChild(meta);
    div.appendChild(toolsDiv);
    answersContainer.appendChild(div);
  });
});
