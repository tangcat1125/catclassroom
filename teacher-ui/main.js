// main.js：白貓工作室 教師端互動邏輯（含中文註解）

// Firebase 監聽初始化（v9模組）
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

// 功能：複製 LINK 到剪貼簿
function copyLink() {
  const linkInput = document.getElementById("login-link");
  linkInput.select();
  linkInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("連結已複製，請貼給學生！");
}

// 功能：顯示出題區（預留）
function showQuestionPanel() {
  alert("👉 請到後續版本加入『題目輸入區』功能 😸");
}

// 功能：擷圖（預留）
function takeScreenshot() {
  alert("📸 此處將整合 html2canvas 或下載功能（建議手動擷圖）");
}

// 功能：處理學生回應顯示
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

// 功能：閃爍紅燈提示（陌生人）
function flashUnknownStudent(id) {
  const board = document.querySelector(".response-board");
  board.style.border = "3px dashed red";
  setTimeout(() => {
    board.style.border = "none";
  }, 1200);
}

// ✅ 自動監聽 Firebase handwriting 區是否有陌生人交卷
onChildAdded(ref(db, "handwriting"), (snapshot) => {
  const newId = snapshot.key;
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
    alertBox.innerText = `⚠️ 陌生學生 ${newId} 提交了作答`;
    board.appendChild(alertBox);
  }
});
