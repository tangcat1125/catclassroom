import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// 初始化
const db = window.db;

// 取用 sessionStorage
const studentName = sessionStorage.getItem("studentName");
const studentId = sessionStorage.getItem("studentId");
const studentClass = sessionStorage.getItem("studentClass");

// 顯示資料
document.getElementById("student-name").innerText = studentName;
document.getElementById("student-class").innerText = studentClass;

// 橘燈按鈕事件：留言給老師
document.getElementById("help-button").addEventListener("click", () => {
  const message = prompt("請輸入想傳給老師的訊息：");
  if (message) {
    set(ref(db, `help/${studentId}`), {
      message: message,
      time: new Date().toISOString()
    });
  }
});

// 紅燈亮燈條件：老師出題
const questionRef = ref(db, "teacher/question");
onValue(questionRef, (snapshot) => {
  const data = snapshot.val();
  const redlight = document.getElementById("red-light");
  if (data && data.active) {
    redlight.classList.add("active");
  } else {
    redlight.classList.remove("active");
  }
});
