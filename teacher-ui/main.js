// --- Firebase SDK 初始化（CDN 模組） ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- Firebase 配置 ---
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

// --- 複製登入連結按鈕 ---
const copyLinkBtn = document.getElementById('copyLinkButton');
if (copyLinkBtn) {
  copyLinkBtn.addEventListener('click', () => {
    const input = document.getElementById('login-link');
    input.select();
    document.execCommand('copy');
    alert("已複製學生登入連結！");
  });
}

// --- 出題面板按鈕（目前尚未實作） ---
const questionPanelBtn = document.getElementById('questionPanelButton');
if (questionPanelBtn) {
  questionPanelBtn.addEventListener('click', () => {
    alert("👉 出題面板功能尚未實作，可用於單題設計。");
  });
}

// --- 擷圖派題按鈕（✅ 跳轉至擷圖派題頁面） ---
const screenshotBtn = document.getElementById('screenshotButton');
if (screenshotBtn) {
  screenshotBtn.addEventListener('click', () => {
    window.location.href = "https://tangcat1125.github.io/catclassroom/teacher-ui/task-capture/capture.html";
  });
}

// --- 教室管理按鈕 ---
const classroomMgmtBtn = document.getElementById('classroomMgmtButton');
if (classroomMgmtBtn) {
  classroomMgmtBtn.addEventListener('click', () => {
    alert("🔧 教室管理功能尚未實作。");
  });
}

// --- 出題小精靈按鈕 ---
const quizBtn = document.getElementById('quizButton');
if (quizBtn) {
  quizBtn.addEventListener('click', () => {
    alert("✨ 出題小精靈功能尚未實作。");
  });
}

// --- 派題中心按鈕（✅ 跳轉） ---
const dispatchBtn = document.getElementById('dispatchButton');
if (dispatchBtn) {
  dispatchBtn.addEventListener('click', () => {
    window.location.href = "https://tangcat1125.github.io/catclassroom/task-system/task-center.html";
  });
}

// --- 返回首頁按鈕 ---
const backBtn = document.getElementById('backButton');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = "https://tangcat1125.github.io/catclassroom/";
  });
}
