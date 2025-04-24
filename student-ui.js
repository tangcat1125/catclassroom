// ✅ 載入 Firebase Realtime Database 模組
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// ✅ 拿到 Firebase DB 物件（來自全域變數）
const db = window.db;

// ✅ 從 sessionStorage 取得登入時儲存的學生資訊
const studentName = sessionStorage.getItem("studentName");
const studentId = sessionStorage.getItem("studentId");
const studentClass = sessionStorage.getItem("studentClass");

// ✅ 顯示學生班級與姓名
document.getElementById("student-name").innerText = studentName || "未登入";
document.getElementById("student-class").innerText = studentClass || "未知班級";

// 🟧 點擊橘燈開關留言區
document.getElementById("help-button").addEventListener("click", () => {
  const box = document.getElementById("helpBox");
  box.style.display = (box.style.display === "none" || box.style.display === "") ? "block" : "none";
});

// 🟧 送出留言給老師
window.sendHelp = function () {
  const message = document.getElementById("helpText").value;
  if (!message) {
    alert("請先輸入問題訊息！");
    return;
  }
  set(ref(db, `help/${studentId}`), {
    message,
    time: new Date().toISOString()
  }).then(() => {
    alert("✅ 已送出給老師！");
    document.getElementById("helpBox").style.display = "none";
  }).catch((error) => {
    alert("❌ 發送失敗：" + error.message);
  });
};

// 🔴 監聽老師是否出題
const questionRef = ref(db, "teacher/question");

onValue(questionRef, (snapshot) => {
  const data = snapshot.val();
  const redLight = document.getElementById("red-light");
  const modal = document.getElementById("question-modal");

  if (data && data.active) {
    redLight.classList.add("active");
    modal.style.display = "flex";
    document.getElementById("question-image").src = data.image || "";
  } else {
    redLight.classList.remove("active");
    modal.style.display = "none";
  }
});

// 🟩 送出答案給老師
window.submitAnswer = function () {
  set(ref(db, `answers/${studentId}`), {
    name: studentName,
    time: new Date().toISOString(),
    status: "done"
  }).then(() => {
    alert("✅ 答案已送出！");
    document.getElementById("question-modal").style.display = "none";
  }).catch((error) => {
    alert("❌ 發送答案失敗：" + error.message);
  });
};
