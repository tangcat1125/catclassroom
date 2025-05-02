// main.js：白貓教師端互動邏輯 + 出題面板連結修正

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074",
  measurementId: "G-92GYSX3F"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const currentDate = new Date().toISOString().split('T')[0];
const knownStudents = new Set();

function copyLink() {
  const linkInput = document.getElementById("login-link");
  linkInput.select();
  linkInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("連結已複製，請貼給學生！");
}

function showQuestionPanel() {
  window.open("https://tangcat1125.github.io/catclassroom/task-system/task-center.html", "_blank");
}

function takeScreenshot() {
  alert("擷圖功能尚未實作，請稍後再試。");
}

function addStudentResponse(id, text, color = "green", identity = "未知") {
  const board = document.querySelector(".response-board") || document.getElementById("responseBoard");
  const box = document.createElement("div");
  const isKnown = knownStudents.has(id);
  const boxColor = isKnown ? color : "red";
  const displayName = isKnown ? `${id} (${identity})` : `⚠️ 未登記：${id} (${identity})`;

  box.className = `response-box ${boxColor}`;
  box.innerText = `${displayName}: ${text}`;
  board.appendChild(box);

  if (!isKnown) flashUnknownStudent(id);
}

function flashUnknownStudent(id) {
  const board = document.querySelector(".response-board") || document.getElementById("responseBoard");
  board.style.border = "3px dashed red";
  setTimeout(() => {
    board.style.border = "none";
  }, 1200);
}

function isToday(timestamp) {
  if (!timestamp) return false;
  const date = new Date(timestamp).toISOString().split('T')[0];
  return date === currentDate;
}

function setupLoginListener() {
  const loginRef = ref(db, "login");
  onValue(loginRef, (snapshot) => {
    const students = snapshot.val() || {};
    const list = document.querySelector(".student-status-list") || document.getElementById("studentStatusList");
    list.innerHTML = '';
    knownStudents.clear();

    Object.keys(students).forEach(identity => {
      Object.entries(students[identity]).forEach(([seat, data]) => {
        const studentId = data.name || seat;
        const studentName = data.name || seat;
        const timestamp = data.timestamp;
        if (timestamp && isToday(timestamp)) {
          const displayText = `${studentName} (${seat}) [${identity}]`;
          const row = document.createElement("div");
          row.className = "student-row";
          row.innerHTML = `<span class="status-dot green"></span> ${displayText}`;
          list.appendChild(row);
          knownStudents.add(studentId);
          addStudentResponse(studentName, "已登入", "green", identity);
        }
      });
    });
  });
}

function setupHelpListener() {
  const helpRef = ref(db, "help");
  onValue(helpRef, (snapshot) => {
    const helpData = snapshot.val() || {};
    const board = document.querySelector(".response-board") || document.getElementById("responseBoard");
    board.innerHTML = '';

    Object.keys(helpData).forEach(classType => {
      Object.entries(helpData[classType]).forEach(([seat, data]) => {
        const studentName = data.name || seat;
        const identity = classType;
        if (data.timestamp && isToday(data.timestamp)) {
          const timestamp = new Date(data.timestamp).toLocaleString();
          addStudentResponse(studentName, `發送求救訊號！(${timestamp})`, "red", identity);
          if (!knownStudents.has(studentName)) {
            const list = document.querySelector(".student-status-list") || document.getElementById("studentStatusList");
            const row = document.createElement("div");
            row.className = "student-row";
            row.innerHTML = `<span class="status-dot red"></span> ${studentName} (${seat}) [${identity}]`;
            list.appendChild(row);
            knownStudents.add(studentName);
          }
        }
      });
    });
  });
}

function setupChatListener(questionId = "question1") {
  const chatRef = ref(db, `chat/${questionId}`);
  onChildAdded(chatRef, (snapshot) => {
    const message = snapshot.val();
    const studentName = message.name || "匿名";
    const identity = "未知";
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : "未知時間";
    if (isToday(message.timestamp)) {
      addStudentResponse(studentName, `${message.text} (${timestamp})`, "green", identity);
    }
  });
}

function setupAll() {
  setupLoginListener();
  setupHelpListener();
  setupChatListener();
  const questionRef = ref(db, "teacher/currentQuestion");
  onValue(questionRef, (snapshot) => {
    const question = snapshot.val();
    if (question && question.id) {
      console.log("[Question] 當前題目 ID:", question.id);
      setupChatListener(question.id);
    }
  });
}

// 按鈕掛載
window.addEventListener("DOMContentLoaded", () => {
  const copyLinkBtn = document.getElementById("copyLinkButton");
  if (copyLinkBtn) copyLinkBtn.addEventListener("click", copyLink);

  const questionPanelBtn = document.getElementById("questionPanelButton");
  if (questionPanelBtn) questionPanelBtn.addEventListener("click", showQuestionPanel);

  const screenshotBtn = document.getElementById("screenshotButton");
  if (screenshotBtn) screenshotBtn.addEventListener("click", takeScreenshot);

  const backBtn = document.getElementById("backButton");
  if (backBtn) backBtn.addEventListener("click", () => history.back());

  setupAll();
});
