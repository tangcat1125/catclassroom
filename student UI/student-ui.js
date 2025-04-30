import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const db = window.db;
let studentId = sessionStorage.getItem("studentId");
let studentName = sessionStorage.getItem("studentName");
let studentClass = sessionStorage.getItem("studentClass");

// ✅ 兼容陌生人
if (!studentId) {
  const now = Date.now();
  studentId = `guest_${now}`;
  studentName = "訪客";
  studentClass = "自由教室";
}

// ✅ 顯示基本資料
document.getElementById("student-name").innerText = studentName;
document.getElementById("student-class").innerText = studentClass;

// 🔴 紅燈控制
const redLight = document.getElementById("red-light");

// 預設總人數（未來可讀 Firebase 調整）
const TOTAL_STUDENTS = 13;

// ✅ 監聽出題
const currentQuestionRef = ref(db, "/currentQuestion");
onValue(currentQuestionRef, (snapshot) => {
  const question = snapshot.val();
  if (!question || !question.type || !question.text) return;

  const qid = question.id || question.questionId || "unknown";
  const qtype = question.type;
  const qtext = question.text;

  // 顯示題目
  document.getElementById("systemMessage").innerText = `📢 老師出題：${qtext}`;
  sessionStorage.setItem("questionId", qid);

  // 紅燈閃爍
  if (redLight) redLight.classList.add("active");

  // 題型反應
  if (qtype === "handwrite") {
    setTimeout(() => {
      const url = `handwrite-upload.html?questionId=${qid}&studentId=${studentId}`;
      window.open(url, "_blank");
    }, 800);
  } else if (qtype === "truefalse" || qtype === "choice") {
    showAnswerButtons(qtype, qid, qtext);
  }

  // 顯示目前所有回應
  loadAnswers(qid);
});

// ✅ 顯示按鈕作答區
function showAnswerButtons(type, questionId, text) {
  const panel = document.getElementById("answerPanel");
  const textDiv = document.getElementById("questionText");
  const buttonsDiv = document.getElementById("answerButtons");
  panel.style.display = "block";
  textDiv.innerText = text;
  buttonsDiv.innerHTML = "";

  const options = (type === "truefalse") ? ["是", "否"] : ["A", "B", "C", "D"];
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "send-btn";
    btn.innerText = opt;
    btn.onclick = () => submitAnswer(questionId, opt);
    buttonsDiv.appendChild(btn);
  });
}

// ✅ 傳送作答
function submitAnswer(questionId, answerText) {
  const data = {
    studentId,
    name: studentName,
    answer: answerText,
    questionId,
    time: new Date().toISOString()
  };

  set(ref(db, `answers/${studentId}/${questionId}`), data)
    .then(() => {
      alert("✅ 答案已送出！");
      document.getElementById("answerPanel").style.display = "none";
      if (redLight) redLight.classList.remove("active");
    })
    .catch((err) => {
      alert("❌ 發送失敗：" + err.message);
    });
}

// ✅ 顯示所有人回答＋進度條
function loadAnswers(qid) {
  const allAnswersRef = ref(db, "answers");
  const msgList = document.getElementById("messageList");
  const bar = document.getElementById("progressFill");

  onValue(allAnswersRef, (snapshot) => {
    const data = snapshot.val();
    let count = 0;
    msgList.innerHTML = "";

    for (let sid in data) {
      const record = data[sid][qid];
      if (record) {
        count++;
        const div = document.createElement("div");
        div.className = "message-item";
        div.innerText = `✅ ${record.name}：回答「${record.answer}」`;
        msgList.appendChild(div);
      }
    }

    // 血條更新
    const percent = Math.round((count / TOTAL_STUDENTS) * 100);
    bar.style.width = `${percent}%`;
    bar.innerText = `${count} / ${TOTAL_STUDENTS}`;
  });
}

// ✅ 求救邏輯
document.getElementById("help-button").addEventListener("click", () => {
  const form = document.getElementById("helpForm");
  form.style.display = form.style.display === "none" ? "block" : "none";
});

window.sendHelp = function () {
  const msg = document.getElementById("helpText").value.trim();
  if (!msg) return alert("請輸入問題！");

  const data = {
    message: msg,
    from: studentName,
    class: studentClass,
    time: new Date().toISOString()
  };

  set(ref(db, `help/${studentId}`), data)
    .then(() => {
      document.getElementById("helpStatus").style.display = "block";
      document.getElementById("helpText").value = "";
    })
    .catch((err) => {
      alert("❌ 求救失敗：" + err.message);
    });
};
