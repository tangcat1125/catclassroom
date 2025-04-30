// --- START OF FILE student-ui.js (v3：加入接收截圖註記任務功能) ---

// -----------------------------------------------------------------------------
// 步驟 1：引入 Firebase 資料庫需要的工具
// -----------------------------------------------------------------------------
import { getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// -----------------------------------------------------------------------------
// 步驟 2：取得已經在 HTML 初始化的 Firebase 資料庫
// -----------------------------------------------------------------------------
const db = window.db;

// -----------------------------------------------------------------------------
// 步驟 3：取得並顯示學生自己的資訊
// -----------------------------------------------------------------------------
let studentId = sessionStorage.getItem("studentId");
let studentName = sessionStorage.getItem("studentName");
let studentClass = sessionStorage.getItem("studentClass");

if (!studentId) {
  const now = Date.now();
  studentId = `guest_${now}`;
  studentName = "訪客";
  studentClass = "自由教室";
  sessionStorage.setItem("studentId", studentId);
  sessionStorage.setItem("studentName", studentName);
  sessionStorage.setItem("studentClass", studentClass);
}

document.getElementById("student-name").innerText = studentName;
document.getElementById("student-class").innerText = studentClass;
const redLight = document.getElementById("red-light");

// -----------------------------------------------------------------------------
// 步驟 4：設定全班總人數 (會影響進度條百分比)
// -----------------------------------------------------------------------------
const TOTAL_STUDENTS = 13; // **記得修改這裡以符合實際人數**

// -----------------------------------------------------------------------------
// 步驟 5：持續監聽老師是不是出了新題目
// -----------------------------------------------------------------------------
const currentQuestionRef = ref(db, "/teacher/currentQuestion");

onValue(currentQuestionRef, (snapshot) => {
  const question = snapshot.val();

  // --- A. 清理舊狀態 ---
  // 無論如何，先隱藏舊的作答區和截圖任務提示
  document.getElementById("answerPanel").style.display = "none";
  hideScreenshotTaskPrompt(); // 呼叫新函數隱藏提示

  if (!question || !question.type || !question.text) {
    console.log("老師尚未出題或已清除題目。");
    document.getElementById("systemMessage").innerText = "等待老師出題中...";
    if (redLight) redLight.classList.remove("active");
    // 清空聊天室 (可選)
    const chatListDiv = document.getElementById("chatList");
    if(chatListDiv) chatListDiv.innerHTML = "<p style='color: grey; font-style: italic;'>等待新題目...</p>";
    return;
  }

  // --- B. 處理新題目 ---
  const qid = question.id || question.questionId || `unknown_${Date.now()}`;
  const qtype = question.type;
  const qtext = question.text;

  console.log(`收到題目 (ID: ${qid}, Type: ${qtype}): ${qtext}`);

  document.getElementById("systemMessage").innerText = `📢 老師出題：${qtext}`;
  sessionStorage.setItem("questionId", qid); // 儲存當前題目 ID
  if (redLight) redLight.classList.add("active");

  // --- C. 根據題目類型顯示作答方式 (避開截圖任務) ---
  // *** 新增條件：如果題目類型是我們約定好的截圖註記標記，就先不做事 ***
  // *** 等待下面的 screenshotTaskRef 監聽器來處理 ***
  if (qtype === 'screenshot_annotation') {
      console.log("收到截圖註記任務標記，等待截圖 URL...");
      // 不顯示普通作答區，可以在 systemMessage 旁加個提示
      document.getElementById("systemMessage").innerText += " (請等待老師截圖...)";
  } else if (qtype === "handwrite") {
    // 普通手寫題
    setTimeout(() => {
      const url = `handwrite-upload.html?questionId=${qid}&studentId=${studentId}`;
      window.open(url, "_blank");
    }, 800);
  } else if (qtype === "truefalse" || qtype === "choice") {
    showAnswerButtons(qtype, qid, qtext);
  } else if (qtype === "shortanswer") {
    showShortAnswerBox(qid, qtext);
  } else {
      console.warn("未知的題目類型:", qtype);
      // 可以顯示一個通用提示
      showGenericMessage("收到一個新題型，請依老師指示操作。");
  }

  // --- D. 載入相關資料 ---
  loadAnswers(qid); // 更新進度條
  listenToChatroom(qid); // 監聽這題的聊天室

});

// -----------------------------------------------------------------------------
// *** 步驟 5.5：新增 - 持續監聽老師是否發送了截圖註記任務 ***
// -----------------------------------------------------------------------------
const screenshotTaskRef = ref(db, '/teacher/currentScreenshotAnnotationTask');
let lastHandledTaskId = null; // 避免重複處理同一個任務

onValue(screenshotTaskRef, (snapshot) => {
    const taskData = snapshot.val();

    if (taskData && taskData.imageUrl && taskData.taskId) {
        // 檢查是否是新的任務 ID，避免因為其他資料變動而重複觸發
        if (taskData.taskId !== lastHandledTaskId) {
            lastHandledTaskId = taskData.taskId; // 記錄已處理的 ID
            console.log("收到新的截圖註記任務！Task ID:", taskData.taskId, "Image URL:", taskData.imageUrl);

            // 在畫面上顯示提示，讓學生點擊以開啟手寫頁面
            showScreenshotTaskPrompt(taskData.imageUrl, taskData.taskId);

            // 收到任務時，也可以讓紅燈閃爍或給其他視覺提示
            if (redLight) redLight.classList.add("active");
            // 可以覆蓋掉 systemMessage 的內容
            document.getElementById("systemMessage").innerHTML = `
                老師發送了一張截圖，請點擊下方按鈕進行註記！
                <button class="send-btn highlight-blink" onclick="openHandwriteWithBackground('${encodeURIComponent(taskData.imageUrl)}', '${taskData.taskId}')" style="margin-top: 10px; background-color: #ff7043;">
                    ✏️ 前往註記
                </button>
            `;
             // 隱藏可能存在的普通作答區
             document.getElementById("answerPanel").style.display = "none";

        } else {
             console.log("收到的截圖任務 ID 與上次相同，忽略。");
        }
    } else {
        console.log("老師尚未發送截圖任務或已清除。");
        hideScreenshotTaskPrompt(); // 隱藏提示
        // 如果老師清除了任務，可以考慮重設 systemMessage
        if (lastHandledTaskId !== null) { // 只有在之前有任務時才重設
             // document.getElementById("systemMessage").innerText = "老師已清除截圖任務，等待新指令...";
             lastHandledTaskId = null; // 重設記錄
        }

    }
});

/**
 * 新增：在特定位置顯示 "前往註記" 的提示按鈕
 * @param {string} encodedImageUrl - 編碼後的圖片 URL
 * @param {string} taskId - 任務 ID
 */
function showScreenshotTaskPrompt(encodedImageUrl, taskId) {
    // 我們可以利用原本放作答按鈕的區域來顯示提示
    const panel = document.getElementById("answerPanel");
    const textDiv = document.getElementById("questionText");
    const buttonsDiv = document.getElementById("answerButtons");

    panel.style.display = "block"; // 顯示這個區塊
    textDiv.innerHTML = "<strong>老師發送了截圖，請點擊下方按鈕開始註記：</strong>"; // 提示文字
    buttonsDiv.innerHTML = `
        <button class="send-btn highlight-blink" onclick="openHandwriteWithBackground('${encodedImageUrl}', '${taskId}')" style="background-color: #f57c00; font-size: 18px; padding: 12px 25px;">
           🚀 前往註記畫面
        </button>
    `;
    // 也可以在這裡加一個預覽小圖 (可選)
    // buttonsDiv.innerHTML += `<img src="${decodeURIComponent(encodedImageUrl)}" style="max-width: 100px; display: block; margin-top: 10px;">`;
}

/**
 * 新增：隱藏 "前往註記" 的提示 (如果老師清除了任務)
 */
function hideScreenshotTaskPrompt() {
    // 簡單地隱藏 answerPanel 即可
    // document.getElementById("answerPanel").style.display = "none";
    // 或者更精確地只清除內容
    const panel = document.getElementById("answerPanel");
     if (panel.querySelector('.highlight-blink')) { // 檢查裡面是否有註記按鈕
         panel.style.display = "none";
         document.getElementById("questionText").innerHTML = "";
         document.getElementById("answerButtons").innerHTML = "";
     }
}

/**
 * 新增：打開手寫頁面，並將背景圖 URL 和任務 ID 作為參數傳遞
 * @param {string} encodedImageUrl - 編碼後的圖片 URL
 * @param {string} taskId - 任務 ID
 */
window.openHandwriteWithBackground = function(encodedImageUrl, taskId) {
    // 組合目標 URL，加入 backgroundUrl 和 taskId (或 questionId)
    // taskId 可以用來當作這次手寫的 questionId
    const url = `handwrite-upload.html?backgroundUrl=${encodedImageUrl}&questionId=${taskId}&studentId=${studentId}`;
    console.log("準備開啟手寫頁面，URL:", url);
    window.open(url, '_blank');

    // 點擊後可以隱藏提示，或顯示"已開啟"
    hideScreenshotTaskPrompt();
    document.getElementById("systemMessage").innerText = "已開啟註記畫面，請在新分頁完成作答。";
     if (redLight) redLight.classList.remove("active"); // 點擊後關閉紅燈

}

// -----------------------------------------------------------------------------
// 步驟 6 - 14 (監聽聊天室、發送聊天、顯示按鈕/輸入框、送出答案、更新進度條、求救)
// **維持我們在 v2 版本 (笨蛋也能懂的註解版) 的內容即可，這裡不再重複貼出**
// -----------------------------------------------------------------------------

// (假設以下函數都已存在且功能正確)
function listenToChatroom(questionId) { /* ... v2 版本內容 ... */
    const chatListDiv = document.getElementById("chatList");
    const chatroomRef = ref(db, `chat/${questionId}`);
    onValue(chatroomRef, (snapshot) => {
        const data = snapshot.val(); chatListDiv.innerHTML = "";
        if (!data) { chatListDiv.innerHTML = "<p style='color: grey; font-style: italic;'>目前沒有聊天訊息...</p>"; return; }
        Object.values(data).forEach((msg) => {
            const div = document.createElement("div"); div.className = "chat-item";
            if (msg.type === "text") {
                const isMention = msg.text.includes("@");
                div.innerHTML = `💬 <strong>${msg.from || '匿名'}</strong>：<span class="chat-text"${isMention ? " style='background-color: #fff9c4; padding: 1px 3px; border-radius: 3px;'" : ""}>${escapeHtml(msg.text)}</span>`;
            } else { div.innerHTML = `📎 <strong>${msg.from || '匿名'}</strong>：分享了一個非文字內容`; }
            chatListDiv.appendChild(div);
        });
        chatListDiv.scrollTop = chatListDiv.scrollHeight;
    });
}
function escapeHtml(unsafe) { if (!unsafe) return ""; return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """).replace(/'/g, "'"); }
window.sendChatMessage = function () { /* ... v2 版本內容 ... */
    const questionId = sessionStorage.getItem("questionId") || "unknown";
    const chatInput = document.getElementById("chatInput");
    const text = chatInput.value.trim();
    if (!text) { alert("請輸入訊息內容！"); return; }
    const data = { from: studentName, studentId: studentId, type: "text", text: text, time: new Date().toISOString() };
    const chatRef = ref(db, `chat/${questionId}`);
    push(chatRef, data).then(() => { console.log("聊天訊息已送出"); chatInput.value = ""; }).catch((err) => { console.error("發送聊天失敗：", err); alert("❌ 發送失敗：" + err.message); });
};
function showAnswerButtons(type, questionId, text) { /* ... v2 版本內容 ... */
    const panel = document.getElementById("answerPanel"); const textDiv = document.getElementById("questionText"); const buttonsDiv = document.getElementById("answerButtons");
    console.log("顯示作答按鈕:", type); panel.style.display = "block"; textDiv.innerText = text; buttonsDiv.innerHTML = "";
    const options = (type === "truefalse") ? ["是", "否"] : ["A", "B", "C", "D"];
    options.forEach(opt => { const btn = document.createElement("button"); btn.className = "send-btn"; btn.innerText = opt; btn.onclick = () => submitAnswer(questionId, opt); buttonsDiv.appendChild(btn); });
}
function showShortAnswerBox(questionId, questionText) { /* ... v2 版本內容 ... */
    const panel = document.getElementById("answerPanel"); const textDiv = document.getElementById("questionText"); const buttonsDiv = document.getElementById("answerButtons");
    console.log("顯示簡答輸入框"); panel.style.display = "block"; textDiv.innerText = questionText;
    buttonsDiv.innerHTML = `<textarea id="shortAnswerInput" rows="3" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; font-size: 16px;" placeholder="請在此輸入你的答案..."></textarea><button class="send-btn" style="margin-top:10px;" onclick="submitShortAnswer('${questionId}')">送出簡答</button>`;
    setTimeout(() => { const textarea = document.getElementById('shortAnswerInput'); if(textarea) textarea.focus(); }, 100);
}
function showGenericMessage(message) { // 顯示通用訊息
    const panel = document.getElementById("answerPanel"); const textDiv = document.getElementById("questionText"); const buttonsDiv = document.getElementById("answerButtons");
    panel.style.display = "block"; textDiv.innerText = message; buttonsDiv.innerHTML = "";
}
window.submitShortAnswer = function (qid) { /* ... v2 版本內容 ... */
    const input = document.getElementById("shortAnswerInput"); const answer = input.value.trim();
    if (!answer) { alert("請輸入內容！"); return; } submitAnswer(qid, answer);
};
function submitAnswer(questionId, answerText) { /* ... v2 版本內容 ... */
    console.log(`準備送出答案 - QID: ${questionId}, 答案: ${answerText}`);
    const data = { studentId: studentId, name: studentName, answer: answerText, questionId: questionId, time: new Date().toISOString() };
    const answerRef = ref(db, `answers/${studentId}/${questionId}`);
    set(answerRef, data).then(() => { console.log("答案已成功送出！"); alert("✅ 答案已送出！"); document.getElementById("answerPanel").style.display = "none"; if (redLight) redLight.classList.remove("active"); }).catch((err) => { console.error("送出答案失敗：", err); alert("❌ 發送失敗：" + err.message); });
}
function loadAnswers(qid) { /* ... v2 版本內容 (只更新進度條) ... */
    const allAnswersRef = ref(db, "answers"); const progressBarFill = document.getElementById("progressFill");
    onValue(allAnswersRef, (snapshot) => {
        const allAnswersData = snapshot.val(); let answeredCount = 0;
        if (allAnswersData) { Object.keys(allAnswersData).forEach(sId => { if (allAnswersData[sId]?.[qid]) answeredCount++; }); }
        const percent = TOTAL_STUDENTS > 0 ? Math.round((answeredCount / TOTAL_STUDENTS) * 100) : 0;
        if (progressBarFill) { progressBarFill.style.width = `${percent}%`; progressBarFill.innerText = `${answeredCount} / ${TOTAL_STUDENTS}`; console.log(`進度更新 (QID: ${qid}): ${answeredCount}/${TOTAL_STUDENTS} (${percent}%)`); }
        else { console.warn("警告：找不到進度條元素 #progressFill"); }
    });
}
const helpBtn = document.getElementById("help-button"); const helpForm = document.getElementById("helpForm");
if (helpBtn) { helpBtn.addEventListener("click", () => { helpForm.style.display = helpForm.style.display === "none" ? "block" : "none"; }); }
else { console.warn("警告：找不到求救按鈕 #help-button"); }
window.sendHelp = function () { /* ... v2 版本內容 ... */
    const helpTextInput = document.getElementById("helpText"); const msg = helpTextInput.value.trim();
    if (!msg) { alert("請輸入你遇到的問題！"); return; }
    const data = { message: msg, from: studentName, studentId: studentId, class: studentClass, time: new Date().toISOString() };
    const helpRef = ref(db, `help/${studentId}`);
    set(helpRef, data).then(() => { console.log("求救訊息已送出"); document.getElementById("helpStatus").style.display = "block"; helpTextInput.value = ""; helpForm.style.display = "none"; alert("✅ 求救訊息已發送給老師！"); }).catch((err) => { console.error("發送求救失敗：", err); alert("❌ 求救失敗：" + err.message); });
};

// 確保 CSS 中有 .highlight-blink 樣式
/*
@keyframes blink {
  50% { opacity: 0.6; }
}
.highlight-blink {
  animation: blink 1s linear infinite;
}
*/


// --- END OF FILE student-ui.js (v3：加入接收截圖註記任務功能) ---
