import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// ✅ Firebase 資料庫物件（來自 firebase-config.js）
const db = window.db;

// ✅ 取用 sessionStorage 存的學生資料
const studentName = sessionStorage.getItem("studentName");
const studentId = sessionStorage.getItem("studentId");
const studentClass = sessionStorage.getItem("studentClass");

// ✅ 顯示學生資料（記得 HTML 用的是 studentName、className）
document.getElementById("studentName").innerText = studentName;
document.getElementById("className").innerText = studentClass;

// 🟧 橘燈點擊後：開啟留言框
function toggleHelpInput() {
  const box = document.getElementById("helpBox");
  box.style.display = (box.style.display === "none") ? "block" : "none";
}

// 🟧 送出留言
function sendHelp() {
  const message = document.getElementById("helpText").value;
  if (message) {
    set(ref(db, `help/${studentId}`), {
      message,
      time: new Date().toISOString()
    });
    alert("✅ 已送出給老師！");
    document.getElementById("helpBox").style.display = "none";
  }
}
window.sendHelp = sendHelp; // ⭐ 綁定給 HTML 裡的 onclick 用

// 🔴 紅燈控制（老師出題時）
const questionRef = ref(db, "teacher/question");
onValue(questionRef, (snapshot) => {
  const data = snapshot.val();
  const red = document.getElementById("questionLight");
  const modal = document.getElementById("popupModal");
  if (data && data.active) {
    red.classList.add("active");
    modal.style.display = "flex";
    // 你可以放 data.image 給截圖 img 元素（id="question-image"）也 OK
  } else {
    red.classList.remove("active");
    modal.style.display = "none";
  }
});

// 🟩 答題送出
function submitAnswer() {
  set(ref(db, `answers/${studentId}`), {
    name: studentName,
    status: "done",
    time: new Date().toISOString()
  });
  alert("✅ 答案已送出！");
  document.getElementById("popupModal").style.display = "none";
}
window.submitAnswer = submitAnswer;
