// --- START OF FILE student-ui.js (笨蛋也能懂的全面註解修正版) ---

// -----------------------------------------------------------------------------
// 步驟 1：引入 Firebase 資料庫需要的工具
// -----------------------------------------------------------------------------
// 從 Firebase 的網路服務中，引入我們需要用到的功能：
// getDatabase: 用來取得資料庫本人
// ref: 用來指定我們要操作資料庫的哪個「路徑」(像檔案夾路徑)
// onValue: 用來「持續監聽」某個路徑的資料變化，只要一變就會通知我們
// set: 用來把資料「寫入」或「覆蓋」到指定路徑
// push: 用來在某個路徑下「新增」一筆不重複的資料 (像新增留言)
import { getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// -----------------------------------------------------------------------------
// 步驟 2：取得已經在 HTML 初始化的 Firebase 資料庫
// -----------------------------------------------------------------------------
// 我們假設在 StudentUi_Login.html 裡面已經有用 firebase.initializeApp(firebaseConfig);
// 並且把資料庫放到了 window.db 這個全域變數裡，這裡直接拿來用。
const db = window.db;

// -----------------------------------------------------------------------------
// 步驟 3：取得並顯示學生自己的資訊
// -----------------------------------------------------------------------------
// 從瀏覽器的臨時記憶體 (sessionStorage) 讀取之前登入時存的學生資料
let studentId = sessionStorage.getItem("studentId");
let studentName = sessionStorage.getItem("studentName");
let studentClass = sessionStorage.getItem("studentClass");

// 如果沒讀到 (例如直接開這個頁面沒登入)，就給他一個臨時的訪客身份
if (!studentId) {
  const now = Date.now(); // 取得現在的時間，弄個獨一無二的 ID
  studentId = `guest_${now}`;
  studentName = "訪客";
  studentClass = "自由教室";
  // 把訪客資訊也存一下，這樣重整頁面才不會又變一個新訪客
  sessionStorage.setItem("studentId", studentId);
  sessionStorage.setItem("studentName", studentName);
  sessionStorage.setItem("studentClass", studentClass);
}

// 把學生的名字和班級顯示在畫面上對應的 ID 位置
document.getElementById("student-name").innerText = studentName;
document.getElementById("student-class").innerText = studentClass;

// 找到畫面上那個紅色指示燈，存起來方便後面用
const redLight = document.getElementById("red-light");

// -----------------------------------------------------------------------------
// 步驟 4：設定全班總人數 (會影響進度條百分比)
// -----------------------------------------------------------------------------
// **注意：** 這裡的 13 是寫死的，如果班級人數不同，需要修改這裡！
const TOTAL_STUDENTS = 13;

// -----------------------------------------------------------------------------
// 步驟 5：持續監聽老師是不是出了新題目
// -----------------------------------------------------------------------------
// 指定我們要監聽 Firebase 裡的 "/teacher/currentQuestion" 這個路徑
const currentQuestionRef = ref(db, "/teacher/currentQuestion");

// 開始用 onValue 持續監聽這個路徑
onValue(currentQuestionRef, (snapshot) => {
  // snapshot 就像是 Firebase 在那個時間點拍下的一張照片，裡面有資料
  const question = snapshot.val(); // .val() 可以把照片裡的資料拿出來

  // --- A. 收到題目後的處理 ---
  // 檢查一下收到的資料是不是有問題，或者老師清空題目了
  if (!question || !question.type || !question.text) {
    console.log("老師尚未出題或已清除題目。");
    document.getElementById("systemMessage").innerText = "等待老師出題中...";
    document.getElementById("answerPanel").style.display = "none"; // 隱藏作答區
    if (redLight) redLight.classList.remove("active"); // 關掉紅燈
    return; // 結束這次的處理
  }

  // 從收到的題目資料中，拿出重要的資訊
  const qid = question.id || question.questionId || `unknown_${Date.now()}`; // 題目獨一無二的 ID
  const qtype = question.type; // 題目類型 (例如: choice, truefalse, shortanswer, handwrite)
  const qtext = question.text; // 題目文字內容

  console.log(`收到題目 (ID: ${qid}, Type: ${qtype}): ${qtext}`); // 在控制台印出收到的題目資訊，方便除錯

  // 更新畫面上的系統訊息，告訴學生老師出題了
  document.getElementById("systemMessage").innerText = `📢 老師出題：${qtext}`;

  // 把目前的題目 ID 存到瀏覽器臨時記憶體，方便其他地方 (像聊天室) 使用
  sessionStorage.setItem("questionId", qid);

  // 讓紅色指示燈閃爍，提醒學生
  if (redLight) redLight.classList.add("active");

  // --- B. 清理並準備作答區 ---
  // 先把之前的作答區隱藏起來，清空裡面的舊題目文字和舊按鈕
  const answerPanel = document.getElementById("answerPanel");
  const questionTextDiv = document.getElementById("questionText");
  const answerButtonsDiv = document.getElementById("answerButtons");
  answerPanel.style.display = "none"; // 預設隱藏
  questionTextDiv.innerText = "";
  answerButtonsDiv.innerHTML = "";

  // --- C. 根據題目類型，顯示不同的作答方式 ---
  if (qtype === "handwrite") {
    // 如果是手寫題，等個 0.8 秒後自動打開手寫上傳頁面
    setTimeout(() => {
      const url = `handwrite-upload.html?questionId=${qid}&studentId=${studentId}`;
      window.open(url, "_blank"); // 在新分頁打開
    }, 800);
  } else if (qtype === "truefalse" || qtype === "choice") {
    // 如果是是非題或選擇題，呼叫下面的 showAnswerButtons 函數來顯示按鈕
    showAnswerButtons(qtype, qid, qtext);
  } else if (qtype === "shortanswer") {
    // 如果是簡答題，呼叫下面的 showShortAnswerBox 函數來顯示輸入框
    showShortAnswerBox(qid, qtext);
  }

  // --- D. 載入相關資料 ---
  // 呼叫下面的 loadAnswers 函數，去讀取目前有多少人回答了這題 (主要是更新進度條)
  loadAnswers(qid);
  // 呼叫下面的 listenToChatroom 函數，開始監聽這題專屬的聊天室訊息
  listenToChatroom(qid);
});

// -----------------------------------------------------------------------------
// 步驟 6：監聽並顯示特定題目的聊天室訊息
// -----------------------------------------------------------------------------
function listenToChatroom(questionId) {
  const chatListDiv = document.getElementById("chatList"); // 找到顯示聊天內容的區塊
  const chatroomRef = ref(db, `chat/${questionId}`); // 指定要監聽的路徑 (例如 chat/Q123)

  // 開始用 onValue 持續監聽這個聊天室路徑
  onValue(chatroomRef, (snapshot) => {
    const data = snapshot.val(); // 取得這個聊天室的所有訊息資料
    chatListDiv.innerHTML = ""; // 先清空舊的聊天內容

    // 如果沒有訊息，就不用做了
    if (!data) {
      chatListDiv.innerHTML = "<p style='color: grey; font-style: italic;'>目前沒有聊天訊息...</p>";
      return;
    }

    // 把每一條訊息都拿出來，顯示在畫面上
    Object.values(data).forEach((msg) => {
      const div = document.createElement("div"); // 創建一個新的 div 元素來放訊息
      div.className = "chat-item"; // 給它一個 CSS class 方便美化

      // 根據訊息類型 (是文字還是其他?) 來決定怎麼顯示
      if (msg.type === "text") {
        // 如果是文字，檢查有沒有包含 "@"，有的話給個背景色提醒
        const isMention = msg.text.includes("@");
        div.innerHTML = `💬 <strong>${msg.from || '匿名'}</strong>：<span class="chat-text"${isMention ? " style='background-color: #fff9c4; padding: 1px 3px; border-radius: 3px;'" : ""}>${escapeHtml(msg.text)}</span>`; // escapeHtml 防止 XSS
      } else {
        // 如果不是文字 (未來可能傳圖片或其他)，就簡單顯示 JSON 字串
        div.innerHTML = `📎 <strong>${msg.from || '匿名'}</strong>：分享了一個非文字內容`;
        // console.log("收到非文字訊息:", msg); // 在控制台顯示詳細內容
      }

      chatListDiv.appendChild(div); // 把這條訊息加到聊天區塊的尾巴
    });

    // 自動捲動到聊天室底部，讓使用者看到最新訊息
    chatListDiv.scrollTop = chatListDiv.scrollHeight;
  });
}

// 小工具：用來跳脫 HTML 特殊字元，避免 XSS 攻擊
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, """)
         .replace(/'/g, "'");
 }

// -----------------------------------------------------------------------------
// 步驟 7：讓學生可以發送聊天室訊息
// -----------------------------------------------------------------------------
// 這個函數會被 HTML 裡的「送出聊天室訊息」按鈕呼叫 (onclick)
// 所以必須掛在 window 底下，變成全域函數
window.sendChatMessage = function () {
  // 從瀏覽器臨時記憶體讀取目前是哪個題目 ID，如果沒有就用 'unknown'
  const questionId = sessionStorage.getItem("questionId") || "unknown";
  const chatInput = document.getElementById("chatInput"); // 找到輸入框
  const text = chatInput.value.trim(); // 取得輸入的文字，並去掉頭尾空白

  // 如果沒輸入文字，跳個提醒，然後結束
  if (!text) {
    alert("請輸入訊息內容！");
    return;
  }

  // 準備要存到 Firebase 的訊息資料
  const data = {
    from: studentName,       // 發送者姓名
    studentId: studentId,    // 發送者 ID (可選，方便追蹤)
    type: "text",            // 訊息類型是文字
    text: text,              // 訊息內容
    time: new Date().toISOString() // 記錄發送時間
  };

  // 指定要存到哪個聊天室路徑下
  const chatRef = ref(db, `chat/${questionId}`);

  // 用 push 把這筆新訊息加到指定的聊天室路徑下
  push(chatRef, data)
    .then(() => {
      // 如果成功送出...
      console.log("聊天訊息已送出:", data);
      chatInput.value = ""; // 清空輸入框
    })
    .catch((err) => {
      // 如果送出失敗...
      console.error("❌ 發送聊天訊息失敗：", err);
      alert("❌ 發送失敗：" + err.message); // 跳提醒告訴使用者
    });
};

// -----------------------------------------------------------------------------
// 步驟 8：根據題目類型，顯示對應的作答按鈕 (是非/選擇)
// -----------------------------------------------------------------------------
function showAnswerButtons(type, questionId, text) {
  const panel = document.getElementById("answerPanel");       // 找到整個作答區塊
  const textDiv = document.getElementById("questionText");    // 找到顯示題目文字的區塊
  const buttonsDiv = document.getElementById("answerButtons"); // 找到放按鈕的區塊

  console.log("顯示作答按鈕:", type);

  // 把作答區塊顯示出來
  panel.style.display = "block";
  // 把題目文字放進去
  textDiv.innerText = text;
  // 清空舊的按鈕 (如果有的話)
  buttonsDiv.innerHTML = "";

  // 決定按鈕上有哪些選項
  const options = (type === "truefalse") ? ["是", "否"] : ["A", "B", "C", "D"];

  // 為每一個選項創建一個按鈕
  options.forEach(opt => {
    const btn = document.createElement("button"); // 創建按鈕元素
    btn.className = "send-btn"; // 給按鈕加上 CSS class
    btn.innerText = opt; // 設定按鈕上顯示的文字
    // 設定按鈕被點擊時要執行的動作：呼叫下面的 submitAnswer 函數
    btn.onclick = () => submitAnswer(questionId, opt);
    buttonsDiv.appendChild(btn); // 把按鈕加到畫面上
  });
}

// -----------------------------------------------------------------------------
// 步驟 9：根據題目類型，顯示對應的作答輸入框 (簡答)
// -----------------------------------------------------------------------------
function showShortAnswerBox(questionId, questionText) {
  const panel = document.getElementById("answerPanel");
  const textDiv = document.getElementById("questionText");
  const buttonsDiv = document.getElementById("answerButtons"); // 雖然叫 buttonsDiv，但這裡放輸入框

  console.log("顯示簡答輸入框");

  panel.style.display = "block"; // 顯示作答區
  textDiv.innerText = questionText; // 顯示題目文字

  // 直接用 HTML 字串產生輸入框和送出按鈕
  buttonsDiv.innerHTML = `
    <textarea id="shortAnswerInput" rows="3" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; font-size: 16px;" placeholder="請在此輸入你的答案..."></textarea>
    <button class="send-btn" style="margin-top:10px;" onclick="submitShortAnswer('${questionId}')">送出簡答</button>
  `;
  // 讓輸入框自動獲得焦點，方便學生直接打字
  setTimeout(() => {
      const textarea = document.getElementById('shortAnswerInput');
      if(textarea) textarea.focus();
  }, 100); // 短暫延遲確保元素已渲染
}

// -----------------------------------------------------------------------------
// 步驟 10：處理簡答題的送出
// -----------------------------------------------------------------------------
// 這個函數會被簡答題的「送出簡答」按鈕呼叫 (onclick)
// 所以也要掛在 window 底下
window.submitShortAnswer = function (qid) {
  const input = document.getElementById("shortAnswerInput"); // 找到簡答輸入框
  const answer = input.value.trim(); // 取得輸入的答案

  // 檢查是否為空
  if (!answer) {
    alert("請輸入內容！");
    return;
  }
  // 呼叫通用的 submitAnswer 函數來送出
  submitAnswer(qid, answer);
};

// -----------------------------------------------------------------------------
// 步驟 11：將學生的答案送到 Firebase 儲存
// -----------------------------------------------------------------------------
function submitAnswer(questionId, answerText) {
  console.log(`準備送出答案 - QID: ${questionId}, 答案: ${answerText}`);

  // 準備要存到 Firebase 的答案資料
  const data = {
    studentId: studentId,     // 學生 ID
    name: studentName,        // 學生姓名
    answer: answerText,       // 學生回答的內容
    questionId: questionId,   // 對應的題目 ID
    time: new Date().toISOString() // 記錄回答時間
  };

  // 指定要存到哪個路徑 (例如 answers/S01/Q123)
  const answerRef = ref(db, `answers/${studentId}/${questionId}`);

  // 用 set 把這筆答案資料寫入或覆蓋到指定路徑
  set(answerRef, data)
    .then(() => {
      // 如果成功送出...
      console.log("答案已成功送出！");
      alert("✅ 答案已送出！"); // 跳提醒告訴學生
      document.getElementById("answerPanel").style.display = "none"; // 把作答區隱藏起來
      if (redLight) redLight.classList.remove("active"); // 關掉紅燈，表示已作答
    })
    .catch((err) => {
      // 如果送出失敗...
      console.error("❌ 送出答案失敗：", err);
      alert("❌ 發送失敗：" + err.message); // 跳提醒告訴學生
    });
}

// -----------------------------------------------------------------------------
// 步驟 12：讀取全班對目前題目的作答狀況 (只更新進度條)
// -----------------------------------------------------------------------------
function loadAnswers(qid) {
  const allAnswersRef = ref(db, "answers"); // 指定監聽整個 /answers 路徑
  const progressBarFill = document.getElementById("progressFill"); // 找到進度條的填滿部分

  // **重要：** 這個函數現在只負責更新進度條，不再把每個人的答案顯示在 messageList！

  // 開始用 onValue 持續監聽 /answers 路徑
  onValue(allAnswersRef, (snapshot) => {
    const allAnswersData = snapshot.val(); // 取得所有學生的答案資料
    let answeredCount = 0; // 計算有多少人回答了 *這一題*

    if (allAnswersData) {
      // 遍歷所有學生 ID
      Object.keys(allAnswersData).forEach(sId => {
        // 檢查這個學生底下，是否有針對 *目前題目 qid* 的作答紀錄
        if (allAnswersData[sId] && allAnswersData[sId][qid]) {
          answeredCount++; // 如果有，計數器加 1
        }
      });
    }

    // 計算完成百分比 (要處理總人數是 0 的情況)
    const percent = TOTAL_STUDENTS > 0 ? Math.round((answeredCount / TOTAL_STUDENTS) * 100) : 0;

    // 更新進度條的寬度和顯示文字
    if (progressBarFill) { // 檢查一下元素是否存在，避免錯誤
      progressBarFill.style.width = `${percent}%`;
      progressBarFill.innerText = `${answeredCount} / ${TOTAL_STUDENTS}`;
      console.log(`進度更新 (QID: ${qid}): ${answeredCount} / ${TOTAL_STUDENTS} (${percent}%)`);
    } else {
      console.warn("警告：找不到進度條元素 #progressFill");
    }
  });
}

// -----------------------------------------------------------------------------
// 步驟 13：處理求救按鈕和表單的顯示/隱藏
// -----------------------------------------------------------------------------
const helpBtn = document.getElementById("help-button");
const helpForm = document.getElementById("helpForm"); // 找到求救表單區塊

// 如果畫面上找得到求救按鈕
if (helpBtn) {
  // 幫按鈕加上點擊事件監聽
  helpBtn.addEventListener("click", () => {
    // 切換求救表單的顯示狀態 (如果原本是隱藏就顯示，反之亦然)
    helpForm.style.display = helpForm.style.display === "none" ? "block" : "none";
  });
} else {
  console.warn("警告：找不到求救按鈕 #help-button");
}


// -----------------------------------------------------------------------------
// 步驟 14：處理發送求救訊息
// -----------------------------------------------------------------------------
// 這個函數會被求救表單裡的「發送給老師」按鈕呼叫 (onclick)
// 所以也要掛在 window 底下
window.sendHelp = function () {
  const helpTextInput = document.getElementById("helpText"); // 找到求救訊息輸入框
  const msg = helpTextInput.value.trim(); // 取得輸入的訊息

  // 檢查是否為空
  if (!msg) {
    alert("請輸入你遇到的問題！");
    return;
  }

  // 準備要存到 Firebase 的求救資料
  const data = {
    message: msg,             // 求救內容
    from: studentName,        // 學生姓名
    studentId: studentId,     // 學生 ID
    class: studentClass,      // 學生班級
    time: new Date().toISOString() // 求救時間
  };

  // 指定要存到哪個路徑 (例如 help/S01)
  // 注意：這裡用 set，所以同一個學生再次求救會覆蓋舊的！
  // 如果希望保留歷史紀錄，應該用 push 到 help 路徑下，或 push 到 help/studentId 下
  const helpRef = ref(db, `help/${studentId}`);

  // 用 set 把這筆求救資料寫入或覆蓋到指定路徑
  set(helpRef, data)
    .then(() => {
      // 如果成功送出...
      console.log("求救訊息已送出！");
      document.getElementById("helpStatus").style.display = "block"; // 顯示「已傳送」提示
      helpTextInput.value = ""; // 清空輸入框
      helpForm.style.display = "none"; // 送出後自動隱藏表單
      alert("✅ 求救訊息已發送給老師！");
    })
    .catch((err) => {
      // 如果送出失敗...
      console.error("❌ 發送求救失敗：", err);
      alert("❌ 求救失敗：" + err.message); // 跳提醒告訴學生
    });
};

// --- END OF FILE student-ui.js (笨蛋也能懂的全面註解修正版) ---
