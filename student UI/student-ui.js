// ✅ 白貓教室學生互動邏輯 student-ui.js
import { getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const db = window.db;
let studentId = sessionStorage.getItem("studentId");
let studentName = sessionStorage.getItem("studentName");
let studentClass = sessionStorage.getItem("studentClass");

if (!studentId) {
  const now = Date.now();
  studentId = `guest_${now}`;
  studentName = "訪客";
  studentClass = "自由教室";
}

document.getElementById("student-name").innerText = studentName;
document.getElementById("student-class").innerText = studentClass;

const redLight = document.getElementById("red-light");
const TOTAL_STUDENTS = 13;

const currentQuestionRef = ref(db, "/teacher/currentQuestion");
onValue(currentQuestionRef, (snapshot) => {
  const question = snapshot.val();
  if (!question || !question.type || !question.text) return;

  const qid = question.id || question.questionId || "unknown";
  const qtype = question.type;
  const qtext = question.text;

  document.getElementById("systemMessage").innerText = `📢 老師出題：${qtext}`;
  sessionStorage.setItem("questionId", qid);

  if (redLight) redLight.classList.add("active");

  const msgList = document.getElementById("messageList");
  const teacherMsg = document.createElement("div");
  teacherMsg.className = "message-item";
  teacherMsg.innerText = `📢 老師出題：${qtext}`;
  msgList.prepend(teacherMsg);

  if (qtype === "handwrite") {
    setTimeout(() => {
      const url = `handwrite-upload.html?questionId=${qid}&studentId=${studentId}`;
      window.open(url, "_blank");
    }, 800);
  } else if (qtype === "truefalse" || qtype === "choice") {
    showAnswerButtons(qtype, qid, qtext);
  } else if (qtype === "shortanswer") {
    showShortAnswerBox(qid, qtext);
  }

  loadAnswers(qid);
  listenToChat(qid); // ✅ 綁定對應題目的聊天室
});

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

function showShortAnswerBox(questionId, questionText) {
  const panel = document.getElementById("answerPanel");
  const textDiv = document.getElementById("questionText");
  const buttonsDiv = document.getElementById("answerButtons");
  panel.style.display = "block";
  textDiv.innerText = questionText;

  buttonsDiv.innerHTML = `
    <textarea id="shortAnswerInput" rows="3" style="width:100%;padding:10px;border-radius:6px;border:1px solid #ccc;"></textarea>
    <button class="send-btn" style="margin-top:10px;" onclick="submitShortAnswer('${questionId}')">送出簡答</button>
  `;
}

window.submitShortAnswer = function (qid) {
  const answer = document.getElementById("shortAnswerInput").value.trim();
  if (!answer) {
    alert("請輸入內容！");
    return;
  }
  submitAnswer(qid, answer);
};

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

    const percent = Math.round((count / TOTAL_STUDENTS) * 100);
    bar.style.width = `${percent}%`;
    bar.innerText = `${count} / ${TOTAL_STUDENTS}`;
  });
}

// 🆘 求救系統
const helpBtn = document.getElementById("help-button");
helpBtn.addEventListener("click", () => {
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

// 💬 公開留言
window.sendPublicMessage = async function () {
  const msg = document.getElementById("publicMessage").value.trim();
  if (!msg) return alert("請輸入訊息！");

  const message = {
    from: studentName,
    time: new Date().toISOString(),
    content: msg
  };

  const dbRef = ref(db, "messages");
  await push(dbRef, message);
  document.getElementById("publicMessage").value = "";
};

const messagesRef = ref(db, "messages");
onValue(messagesRef, (snapshot) => {
  const list = snapshot.val();
  if (!list) return;
  for (const key in list) {
    const msg = list[key];
    const div = document.createElement("div");
    div.className = "message-bubble";
    div.innerHTML = `
      <div class="meta">💬 ${msg.from} @ ${formatTime(msg.time)}</div>
      <div>${msg.content}</div>
    `;
    document.getElementById("messageList").appendChild(div);
  }
});

// 🔗 課程聊天室功能
function listenToChat(qid) {
  const chatRef = ref(db, `chat/${qid}`);
  const chatList = document.getElementById("chatList");
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    chatList.innerHTML = "";
    for (let key in data) {
      const msg = data[key];
      const div = document.createElement("div");
      div.className = "chat-item";
      div.innerHTML = `<strong>${msg.from}</strong>: ${msg.text}`;
      chatList.appendChild(div);
    }
  });
}

window.sendChatMessage = async function () {
  const msg = document.getElementById("chatInput").value.trim();
  const qid = sessionStorage.getItem("questionId");
  if (!msg || !qid) return;

  const data = {
    from: studentName,
    time: new Date().toISOString(),
    text: msg
  };

  await push(ref(db, `chat/${qid}`), data);
  document.getElementById("chatInput").value = "";
};

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}
