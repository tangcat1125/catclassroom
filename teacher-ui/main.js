// main.js：白貓工作室 教師端互動邏輯（強化陌生人紅燈 + 作答內容顯示）

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onChildAdded } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "你的_API_KEY",
  authDomain: "你的_project.firebaseapp.com",
  databaseURL: "https://你的_project.firebaseio.com",
  projectId: "你的_projectId",
  storageBucket: "你的_project.appspot.com",
  messagingSenderId: "xxxxxxxxxx",
  appId: "1:xxxxxxxxxx:web:xxxxxxxxxx"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function copyLink() {
  const linkInput = document.getElementById("login-link");
  linkInput.select();
  linkInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("連結已複製，請貼給學生！");
}

function showQuestionPanel() {
  alert("👉 請到後續版本加入『題目輸入區』功能 😸");
}

function takeScreenshot() {
  alert("📸 此處將整合 html2canvas 或下載功能（建議手動擷圖）");
}

function addStudentResponse(id, text, color = "green") {
  const board = document.querySelector(".response-board");
  const box = document.createElement("div");

  const knownStudents = Array.from(document.querySelectorAll(".student-row"))
    .map(row => row.textContent.trim());

  const isKnown = knownStudents.includes(id);
  const boxColor = isKnown ? color : "red";
  const displayName = isKnown ? id : `⚠️ 未登記：${id}`;

  box.className = `response-box ${boxColor}`;
  box.innerText = `${displayName}: ${text}`;
  board.appendChild(box);

  if (!isKnown) {
    flashUnknownStudent(id);
  }
}

function flashUnknownStudent(id) {
  const board = document.querySelector(".response-board");
  board.style.border = "3px dashed red";
  setTimeout(() => {
    board.style.border = "none";
  }, 1200);
}

// ✅ 強化陌生作答偵測與顯示內容
onChildAdded(ref(db, "handwriting"), (snapshot) => {
  const newId = snapshot.key;
  const data = snapshot.val();

  const known = Array.from(document.querySelectorAll(".student-row"))
    .some(row => row.textContent.trim() === newId);

  if (!known) {
    const list = document.querySelector(".student-status-list");
    const row = document.createElement("div");
    row.className = "student-row";
    row.innerHTML = `<span class="red"></span> ${newId}（陌生）`;
    list.appendChild(row);

    const board = document.querySelector(".response-board");
    const alertBox = document.createElement("div");
    alertBox.className = "response-box red";
    const summary = data && data.questionId ? `畫圖作答於「${data.questionId}」` : "提交了手寫內容";
    alertBox.innerText = `⚠️ 陌生學生 ${newId}：${summary}`;
    board.appendChild(alertBox);

    flashUnknownStudent(newId);
  }
});
