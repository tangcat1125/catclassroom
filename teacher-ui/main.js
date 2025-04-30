// main.js：白貓教師端互動邏輯（亮紅燈 blingbling 最終版）

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onChildAdded } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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
  alert("📸 此處可加入 html2canvas 擷圖功能或手動截圖");
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

// 🔥 監聽 Firebase 深層 handwriting/{studentId}/{questionId}
onChildAdded(ref(db, "handwriting"), (studentSnap) => {
  const studentId = studentSnap.key;
  const studentRef = ref(db, `handwriting/${studentId}`);

  onChildAdded(studentRef, (answerSnap) => {
    const data = answerSnap.val();
    const questionId = answerSnap.key;

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
});
