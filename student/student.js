// ✅ 修正版 student.js — 顯示學生身份與老師出題訊息
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

// ✅ 顯示學生基本資料（從 localStorage）
const infoClass = document.getElementById("infoClass");
const infoSeat = document.getElementById("infoSeat");
const infoName = document.getElementById("infoName");

const savedClass = localStorage.getItem("classType") || "?";
const savedSeat = localStorage.getItem("seat") || "?";
const savedName = localStorage.getItem("name") || "?";

infoClass.textContent = savedClass;
infoSeat.textContent = savedSeat;
infoName.textContent = savedName;

// ✅ 監聽老師出題內容 /teacher/currentQuestion
const systemMessageBox = document.getElementById("systemMessageContent");
const questionRef = ref(db, "teacher/currentQuestion");

onValue(questionRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.text) {
    systemMessageBox.textContent = data.text;
  } else {
    systemMessageBox.textContent = "等待老師指令中...";
  }
});
