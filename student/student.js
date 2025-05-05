import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// 顯示學生基本資料
const infoClass = document.getElementById("infoClass");
const infoSeat = document.getElementById("infoSeat");
const infoName = document.getElementById("infoName");

const studentInfo = JSON.parse(localStorage.getItem("studentInfo")) || {};
const savedClass = studentInfo.classType || "未知班級";
const savedSeat = studentInfo.seat || "未知座號";
const savedName = studentInfo.name || "未知姓名";

infoClass.textContent = savedClass;
infoSeat.textContent = savedSeat;
infoName.textContent = savedName;

if (!studentInfo.classType || !studentInfo.seat || !studentInfo.name) {
  console.warn("⚠️ localStorage 中缺少學生資料，請確認 login.js 有正常儲存");
}

// 監聽老師出題
const systemMessageBox = document.getElementById("systemMessageContent");
const questionRef = ref(db, "teacher/currentQuestion");

onValue(questionRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.text && data.timestamp) {
    const isToday = new Date(data.timestamp).toDateString() === new Date().toDateString();
    if (isToday) {
      systemMessageBox.textContent = data.text;
    } else {
      systemMessageBox.textContent = "等待今日老師指令中...";
    }
  } else {
    systemMessageBox.textContent = "等待今日老師指令中...";
  }
});
