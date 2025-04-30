// main.js：教師端截圖功能＋broadcast 廣播支援

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onChildAdded, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.firebasestorage.app",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074",
  measurementId: "G-6C92GYSX3F"
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
  alert("👉 後續版本將整合題目派送功能");
}

function takeScreenshot() {
  import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js').then(({ default: html2canvas }) => {
    html2canvas(document.body).then(canvas => {
      const imageData = canvas.toDataURL("image/png");
      const screenshotRef = ref(db, "broadcast/screenshot");
      set(screenshotRef, {
        url: imageData,
        timestamp: Date.now()
      }).then(() => {
        alert("📸 截圖已成功上傳給學生！");
      }).catch(err => {
        alert("❌ 截圖上傳失敗：「" + err.message + "」");
      });
    });
  });
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

  if (!isKnown) flashUnknownStudent(id);
}

function flashUnknownStudent(id) {
  const board = document.querySelector(".response-board");
  board.style.border = "3px dashed red";
  setTimeout(() => {
    board.style.border = "none";
  }, 1200);
}

// ✅ 正確監聽 handwriting/guest 下的所有作答（自由繪圖）
const guestRef = ref(db, "handwriting/guest");

onChildAdded(guestRef, (answerSnap) => {
  const questionId = answerSnap.key;
  const data = answerSnap.val();
  const studentId = "guest";

  const known = Array.from(document.querySelectorAll(".student-row"))
    .some(row => row.textContent.trim() === studentId);

  if (!known) {
    const list = document.querySelector(".student-status-list");
    const row = document.createElement("div");
    row.className = "student-row";
    row.innerHTML = `<span class="red"></span> ${studentId}（陌生）`;
    list.appendChild(row);

    const board = document.querySelector(".response-board");
    const alertBox = document.createElement("div");
    alertBox.className = "response-box red";
    alertBox.innerText = `⚠️ 陌生學生 ${studentId}：手寫圖作答於「${questionId}」`;
    board.appendChild(alertBox);

    flashUnknownStudent(studentId);
  }
});
