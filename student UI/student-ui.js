// --- START OF FILE student-ui.js (v4：初始聊天室 + 動態切換) ---

// -----------------------------------------------------------------------------
// 步驟 1：引入 Firebase 工具
// -----------------------------------------------------------------------------
import { getDatabase, ref, onValue, set, push, off } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js"; // 新增 off

// -----------------------------------------------------------------------------
// 步驟 2：取得 Firebase 資料庫
// -----------------------------------------------------------------------------
const db = window.db;

// -----------------------------------------------------------------------------
// 步驟 3：取得學生資訊 (同前)
// -----------------------------------------------------------------------------
let studentId = sessionStorage.getItem("studentId");
let studentName = sessionStorage.getItem("studentName");
let studentClass = sessionStorage.getItem("studentClass");
// (訪客邏輯同前)
if (!studentId) { /* ...訪客處理... */ const n=Date.now(); studentId=`guest_${n}`; studentName="訪客"; studentClass="自由教室"; sessionStorage.setItem("studentId",studentId); sessionStorage.setItem("studentName",studentName); sessionStorage.setItem("studentClass",studentClass); }

// -----------------------------------------------------------------------------
// 步驟 4：設定全班總人數 (同前)
// -----------------------------------------------------------------------------
const TOTAL_STUDENTS = 13;

// -----------------------------------------------------------------------------
// 步驟 5：取得畫面元素 (同前)
// -----------------------------------------------------------------------------
const studentNameSpan = document.getElementById("student-name");
const studentClassSpan = document.getElementById("student-class");
const redLight = document.getElementById("red-light");
const systemMessageDiv = document.getElementById("systemMessage");
const answerPanel = document.getElementById("answerPanel");
const questionTextDiv = document.getElementById("questionText");
const answerButtonsDiv = document.getElementById("answerButtons");
const chatListDiv = document.getElementById("chatList");
const chatInput = document.getElementById("chatInput");
const chatContextLabel = document.getElementById("chatContextLabel"); // ** 新增 **
const progressBarFill = document.getElementById("progressFill");
const helpBtn = document.getElementById("help-button");
const helpForm = document.getElementById("helpForm");
const helpTextInput = document.getElementById("helpText");
const helpStatusDiv = document.getElementById("helpStatus");

// -----------------------------------------------------------------------------
// 步驟 6：全域變數 (追蹤狀態)
// -----------------------------------------------------------------------------
let currentChatListenerRef = null; // ** 新增：儲存目前聊天監聽的路徑引用 **
let currentChatId = 'lobby';     // ** 新增：目前正在監聽的聊天室 ID，預設為 lobby **
let lastHandledTaskId = null;    // 截圖任務用

// -----------------------------------------------------------------------------
// 步驟 7：輔助函數 (escapeHtml)
// -----------------------------------------------------------------------------
function escapeHtml(unsafe) { if (!unsafe) return ""; return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """).replace(/'/g, "'"); }

// -----------------------------------------------------------------------------
// 步驟 8：核心功能函數
// -----------------------------------------------------------------------------

/**
 * 更新畫面頂部的學生資訊
 */
function displayStudentInfo() {
    if (studentNameSpan) studentNameSpan.innerText = studentName;
    if (studentClassSpan) studentClassSpan.innerText = studentClass;
}

/**
 * 切換監聽不同的聊天室
 * @param {string} chatId 要監聽的聊天室 ID ('lobby' 或 題目ID)
 * @param {string} contextName 顯示在介面上的名稱
 */
function switchChatListener(chatId, contextName) {
    // 1. 如果之前有監聽器，先移除它
    if (currentChatListenerRef) {
        console.log(`停止監聽舊聊天室: ${currentChatId}`);
        off(currentChatListenerRef); // 使用 off() 移除監聽器
        currentChatListenerRef = null;
    }

    // 2. 更新當前聊天室 ID 和介面標籤
    currentChatId = chatId;
    if (chatContextLabel) {
        chatContextLabel.innerText = `(${contextName})`;
    }
    console.log(`開始監聽新聊天室: ${currentChatId} (${contextName})`);

    // 3. 設定新的監聽路徑引用
    const chatroomRef = ref(db, `chat/${currentChatId}`);
    currentChatListenerRef = chatroomRef; // 保存引用，以便之後移除

    // 4. 清空目前的聊天列表，顯示載入中
     if (chatListDiv) chatListDiv.innerHTML = "<p style='color: grey; font-style: italic;'>讀取聊天訊息中...</p>";

    // 5. 設定新的 onValue 監聽器
    onValue(currentChatListenerRef, (snapshot) => {
        if (!chatListDiv) return; // 再次檢查元素是否存在
        const data = snapshot.val();
        chatListDiv.innerHTML = ""; // 清空

        if (!data) {
            chatListDiv.innerHTML = "<p style='color: grey; font-style: italic;'>目前沒有聊天訊息...</p>";
            return;
        }

        Object.values(data).sort((a, b) => new Date(a.time) - new Date(b.time)) // 按時間排序
          .forEach((msg) => {
            const div = document.createElement("div");
            div.className = "chat-item";
            if (msg.type === "text") {
                const isMention = msg.text.includes("@");
                // 判斷是否是自己發的訊息
                const selfClass = (msg.studentId === studentId) ? ' self-message' : '';
                div.className += selfClass; // 添加 self-message class
                div.innerHTML = `💬 <strong class="chat-sender">${msg.from || '匿名'}</strong>：<span class="chat-text"${isMention ? " style='background-color: #fff9c4;'" : ""}>${escapeHtml(msg.text)}</span>`;
            } else {
                div.innerHTML = `📎 <strong>${msg.from || '匿名'}</strong>：分享了一個非文字內容`;
            }
            chatListDiv.appendChild(div);
        });
        // 捲動到底部
        setTimeout(() => chatListDiv.scrollTop = chatListDiv.scrollHeight, 50); // 短延遲確保渲染完成
    }, (error) => {
        console.error(`監聽聊天室 ${currentChatId} 出錯:`, error);
        if (chatListDiv) chatListDiv.innerHTML = `<p style='color: red;'>讀取聊天訊息失敗！</p>`;
    });
}

/**
 * 發送聊天訊息 (會自動判斷要送到哪個聊天室)
 */
window.sendChatMessage = function () {
    // 根據 session 中是否有 questionId 決定目標聊天室
    const targetChatId = sessionStorage.getItem("questionId") || 'lobby';
    const text = chatInput?.value.trim(); // ?. 安全取值

    if (!text) { alert("請輸入訊息內容！"); return; }
    if (!chatInput) { alert("錯誤：找不到聊天輸入框！"); return; }

    const data = {
        from: studentName,
        studentId: studentId,
        type: "text",
        text: text,
        time: new Date().toISOString()
    };

    const chatRef = ref(db, `chat/${targetChatId}`);
    console.log(`準備發送訊息到: chat/${targetChatId}`);

    push(chatRef, data).then(() => {
        console.log("聊天訊息已送出");
        chatInput.value = ""; // 清空輸入框
        chatInput.focus(); // 讓使用者可以繼續輸入
    }).catch((err) => {
        console.error("發送聊天失敗：", err);
        alert("❌ 發送失敗：" + err.message);
    });
};

// --- 作答區相關函數 (showAnswerButtons, showShortAnswerBox, showGenericMessage) ---
function showAnswerButtons(type, qid, qtext){ /* ...同v3...*/ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; console.log("顯示作答按鈕:",type); p.style.display="block"; t.innerText=qtext; b.innerHTML=""; const o=(type==="truefalse")?["是","否"]:["A","B","C","D"]; o.forEach(opt=>{const btn=document.createElement("button");btn.className="send-btn";btn.innerText=opt;btn.onclick=()=>submitAnswer(qid,opt);b.appendChild(btn);});}
function showShortAnswerBox(qid, qtext){ /* ...同v3...*/ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; console.log("顯示簡答輸入框"); p.style.display="block"; t.innerText=qtext; b.innerHTML=`<textarea id="shortAnswerInput" rows="3" style="width:100%;padding:10px;border-radius:6px;border:1px solid #ccc;font-size:16px;" placeholder="請在此輸入..."></textarea><button class="send-btn" style="margin-top:10px;" onclick="submitShortAnswer('${qid}')">送出簡答</button>`; setTimeout(()=>{document.getElementById('shortAnswerInput')?.focus();},100);}
function showGenericMessage(message){ /* ...同v3...*/ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; p.style.display="block"; t.innerText=message; b.innerHTML="";}
window.submitShortAnswer = function (qid){ /* ...同v3...*/ const i=document.getElementById("shortAnswerInput"),a=i?.value.trim(); if(!a){alert("請輸入內容！");return;}submitAnswer(qid,a);};
function submitAnswer(qid, answer){ /* ...同v3...*/ console.log(`送出答案-QID:${qid},答案:${answer}`); const d={studentId,name:studentName,answer,questionId:qid,time:new Date().toISOString()}; const r=ref(db,`answers/${studentId}/${qid}`); set(r,d).then(()=>{console.log("答案送出成功");alert("✅答案已送出！");answerPanel.style.display="none";redLight?.classList.remove("active");}).catch(e=>{console.error("送出答案失敗:",e);alert("❌發送失敗:"+e.message);});}

// --- 進度條更新函數 (loadAnswers) ---
function loadAnswers(qid) { /* ...同v3 (只更新進度條)... */
    const answersRef = ref(db, "answers");
    onValue(answersRef, (snapshot) => {
        const data = snapshot.val(); let count = 0;
        if (data) { Object.keys(data).forEach(sId => { if (data[sId]?.[qid]) count++; }); }
        const percent = TOTAL_STUDENTS > 0 ? Math.round((count / TOTAL_STUDENTS) * 100) : 0;
        if (progressBarFill) { progressBarFill.style.width = `${percent}%`; progressBarFill.innerText = `${count}/${TOTAL_STUDENTS}`; /*console.log(`進度(QID:${qid}):${count}/${TOTAL_STUDENTS}`);*/ }
    });
}

// --- 截圖註記任務提示函數 (show/hide/open) ---
function showScreenshotTaskPrompt(encodedImageUrl, taskId){ /* ...同v3...*/ const p=answerPanel,t=questionTextDiv,b=answerButtonsDiv; p.style.display="block"; t.innerHTML="<strong>老師發送截圖，點擊下方按鈕開始註記：</strong>"; b.innerHTML=`<button class="send-btn highlight-blink" onclick="openHandwriteWithBackground('${encodedImageUrl}','${taskId}')" style="background-color:#f57c00;font-size:18px;padding:12px 25px;">🚀 前往註記畫面</button>`;}
function hideScreenshotTaskPrompt(){ /* ...同v3...*/ const p=answerPanel; if(p?.querySelector('.highlight-blink')){p.style.display="none";questionTextDiv.innerHTML="";answerButtonsDiv.innerHTML="";}}
window.openHandwriteWithBackground = function(encodedImageUrl, taskId){ /* ...同v3...*/ const url=`handwrite-upload.html?backgroundUrl=${encodedImageUrl}&questionId=${taskId}&studentId=${studentId}`; console.log("開啟手寫頁:",url); window.open(url,'_blank'); hideScreenshotTaskPrompt(); systemMessageDiv.innerText="已開啟註記畫面，請在新分頁完成。"; redLight?.classList.remove("active");}

// --- 求救相關函數 (help button listener, sendHelp) ---
if(helpBtn){helpBtn.addEventListener("click",()=>{helpForm.style.display=helpForm.style.display==="none"?"block":"none";});}else{console.warn("找不到求救按鈕");}
window.sendHelp = function(){ /* ...同v3...*/ const msg=helpTextInput?.value.trim(); if(!msg){alert("請輸入問題！");return;}const d={message:msg,from:studentName,studentId,class:studentClass,time:new Date().toISOString()}; const r=ref(db,`help/${studentId}`); set(r,d).then(()=>{console.log("求救送出");helpStatusDiv.style.display="block";helpTextInput.value="";helpForm.style.display="none";alert("✅求救已發送！");}).catch(e=>{console.error("求救失敗:",e);alert("❌求救失敗:"+e.message);});};

// -----------------------------------------------------------------------------
// 步驟 9：Firebase 資料監聽器
// -----------------------------------------------------------------------------

/**
 * 監聽老師出題路徑 (/teacher/currentQuestion)
 */
function listenForQuestions() {
    const questionRef = ref(db, "/teacher/currentQuestion");
    console.log("開始監聽老師出題...");
    onValue(questionRef, (snapshot) => {
        const question = snapshot.val();
        answerPanel.style.display = "none"; // 無論如何先隱藏舊作答區
        hideScreenshotTaskPrompt(); // 隱藏舊的截圖提示

        if (!question || !question.type || !question.text) {
            console.log("老師清除題目或未出題");
            systemMessageDiv.innerText = "等待老師出題中...";
            if (redLight) redLight.classList.remove("active");
            sessionStorage.removeItem("questionId"); // 清除題目ID
            sessionStorage.removeItem("currentQuestionText"); // 清除題目文字
            switchChatListener('lobby', '大廳'); // ** 切換回大廳聊天室 **
            // 清空進度條? (可選)
            if(progressBarFill){progressBarFill.style.width='0%'; progressBarFill.innerText=`0 / ${TOTAL_STUDENTS}`;}
            return;
        }

        const qid = question.id || question.questionId || `unknown_${Date.now()}`;
        const qtype = question.type;
        const qtext = question.text;
        console.log(`收到題目(ID:${qid}, Type:${qtype}): ${qtext}`);

        systemMessageDiv.innerText = `📢 老師出題：${qtext}`;
        sessionStorage.setItem("questionId", qid); // 保存當前題目ID
        sessionStorage.setItem("currentQuestionText", qtext); // 保存當前題目文字 (給聊天室用)
        if (redLight) redLight.classList.add("active");

        // ** 切換到該題目的聊天室 **
        switchChatListener(qid, qtext.substring(0, 15) + '...'); // 用題目文字做提示

        // 根據題型顯示作答介面 (避開截圖任務)
        if (qtype === 'screenshot_annotation') {
            console.log("收到截圖任務標記，等待截圖 URL...");
            systemMessageDiv.innerText += " (請等待老師截圖...)";
        } else if (qtype === "handwrite") {
            setTimeout(() => { window.open(`handwrite-upload.html?questionId=${qid}&studentId=${studentId}`, "_blank"); }, 800);
        } else if (qtype === "truefalse" || qtype === "choice") {
            showAnswerButtons(qtype, qid, qtext);
        } else if (qtype === "shortanswer") {
            showShortAnswerBox(qid, qtext);
        } else {
            console.warn("未知題型:", qtype);
            showGenericMessage("收到新題型，請依老師指示操作。");
        }

        loadAnswers(qid); // 更新進度條
    }, (error) => {
         console.error("監聽老師題目出錯:", error);
         systemMessageDiv.innerText = "讀取老師題目時發生錯誤！";
    });
}

/**
 * 監聽老師發送截圖任務路徑 (/teacher/currentScreenshotAnnotationTask)
 */
function listenForScreenshotTasks() {
    const taskRef = ref(db, '/teacher/currentScreenshotAnnotationTask');
    console.log("開始監聽截圖任務...");
    onValue(taskRef, (snapshot) => {
        const taskData = snapshot.val();
        if (taskData?.imageUrl && taskData.taskId && taskData.taskId !== lastHandledTaskId) {
            lastHandledTaskId = taskData.taskId;
            console.log("收到新截圖任務！Task ID:", taskData.taskId);
            // 確保當前題目是截圖類型才顯示按鈕 (避免覆蓋其他題目)
            const currentQid = sessionStorage.getItem("questionId");
            // 這裡假設老師發送截圖任務時，currentQuestion 的 qtype 會是 'screenshot_annotation'
            // 或者我們可以更寬鬆一點，只要收到任務就顯示
             console.log("顯示截圖註記提示");
             showScreenshotTaskPrompt(encodeURIComponent(taskData.imageUrl), taskData.taskId);
             if (redLight) redLight.classList.add("active");
             systemMessageDiv.innerHTML = `老師發送了一張截圖，請點擊下方按鈕進行註記！`; // 覆蓋題目訊息
             answerPanel.style.display = "block"; // 確保面板顯示

        } else if (!taskData && lastHandledTaskId !== null) {
            console.log("老師清除截圖任務");
            hideScreenshotTaskPrompt();
            lastHandledTaskId = null;
            // 可以重設 systemMessage，但要小心不要蓋掉老師可能發出的新題目
            // if (!sessionStorage.getItem("questionId")) {
            //     systemMessageDiv.innerText = "等待老師出題中...";
            // }
        }
    }, (error) => {
        console.error("監聽截圖任務出錯:", error);
    });
}

// -----------------------------------------------------------------------------
// 步驟 10：初始化學生介面
// -----------------------------------------------------------------------------
function initializeStudentView() {
    console.log("初始化學生介面...");
    displayStudentInfo();                     // 顯示學生姓名班級
    systemMessageDiv.innerText = "正在連線，等待老師指令..."; // 初始訊息
    listenForQuestions();                     // 開始監聽老師題目
    listenForScreenshotTasks();               // 開始監聽截圖任務
    switchChatListener('lobby', '大廳');     // ** 預設進入大廳聊天室 **
    // 可以在這裡預先載入一次 answers 更新進度條 (如果需要)
    // loadAnswers(sessionStorage.getItem("questionId") || null);
     // 添加 CSS 樣式到 head
    const style = document.createElement('style');
    style.textContent = `
        .chat-item.self-message { background-color: #e1f5fe !important; border-left: 4px solid #03a9f4; }
        .chat-item.self-message .chat-sender { color: #0277bd; font-weight: bold; }
        .highlight-blink { animation: blink 1.2s ease-in-out infinite alternate; }
        @keyframes blink { from { opacity: 1; } to { opacity: 0.7; transform: scale(1.02); } }
    `;
    document.head.appendChild(style);

}

// 執行初始化
initializeStudentView();

// --- END OF FILE student-ui.js (v4：初始聊天室 + 動態切換) ---
