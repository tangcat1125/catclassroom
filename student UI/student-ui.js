// --- START OF FILE student-ui.js (v6.3：修正全域函數掛載 + 語法檢查) ---
console.log("載入 student-ui.js (v6.3)...");

// --------------------------------------------------
// 1. 引入 Firebase 功能
// --------------------------------------------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getDatabase, ref, onValue,
  set, push, off // off 用於移除監聽器
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';
console.log("Firebase DB 功能已引入。");

// --------------------------------------------------
// 2. Firebase 配置 (從 HTML 複製過來的，請確保正確)
// --------------------------------------------------
// ** 請務必將下面的 placeholder 替換為你真實的 Firebase 配置！ **
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA", // 示例，請替換
  authDomain: "catclassroom-login.firebaseapp.com", // 示例，請替換
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app", // 示例，請替換
  projectId: "catclassroom-login", // 示例，請替換
  storageBucket: "catclassroom-login.appspot.com", // 示例，請替換
  messagingSenderId: "123487233181", // 示例，請替換
  appId: "1:123487233181:web:aecc2891dc2d1096962074" // 示例，請替換
  // measurementId: "G-ABCDEFGH" // 可選
};

// --------------------------------------------------
// 3. 初始化 Firebase
// --------------------------------------------------
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db  = getDatabase(app);
    console.log('✅ Firebase 已完成初始化');
} catch (e) {
    console.error("Firebase 初始化失敗！", e);
    alert("頁面初始化失敗(Firebase Init Error)，請檢查網路或聯繫管理員。");
    throw e; // 停止執行
}

// --------------------------------------------------
// 4. 全域設定與變數
// --------------------------------------------------
const TOTAL_STUDENTS = 13; // *** 修改為實際人數 ***
let studentId, studentName, studentClass; // studentClass 將儲存 "班級 座號號"
let el = {}; // 用於快取 DOM 元素
let currentChatListenerRef = null; // 儲存當前聊天監聽器的引用
console.log("全域變數已定義。");

// --------------------------------------------------
// 5. 程式進入點：監聽 DOM Ready
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM 已載入，開始初始化...");
  loadStudentInfo();
  cacheDOM();
  renderStudentInfo();
  setupEventListeners(); // 分開設置非 Firebase 的事件監聽
  setupFirebaseListeners(); // 分開設置 Firebase 監聽
  console.log('🎉 學生介面 v6.3 啟動完成');
});

// --------------------------------------------------
// 6. 初始化相關函數
// --------------------------------------------------
function loadStudentInfo(){
  studentId    = sessionStorage.getItem('studentId');
  studentName  = sessionStorage.getItem('studentName');
  studentClass = sessionStorage.getItem('studentClass'); // v6.2 存的是 "班級 座號號"
  if(!studentId){ // 訪客處理
    console.warn("未登入，啟用訪客模式。");
    const now = Date.now();
    studentId    = `guest_${now}`;
    studentName  = '訪客';
    studentClass = '訪客'; // 訪客顯示 "訪客"
    try {
        sessionStorage.setItem('studentId', studentId);
        sessionStorage.setItem('studentName', studentName);
        sessionStorage.setItem('studentClass', studentClass);
    } catch(e) { console.warn("無法寫入 sessionStorage"); }
  }
  console.log(`學生資訊已載入: ${studentName} (${studentClass}) [${studentId}]`);
}

function cacheDOM(){
  el = { // 使用物件字面量一次性賦值
    nameSpan     : document.getElementById('student-name'),
    classSpan    : document.getElementById('student-class'), // HTML ID 應為 student-class
    redLight     : document.getElementById('red-light'),
    sysMsg       : document.getElementById('systemMessage'),
    answerPanel  : document.getElementById('answerPanel'),
    questionText : document.getElementById('questionText'),
    answerArea   : document.getElementById('answerButtons'),
    progressFill : document.getElementById('progressFill'),
    chatList     : document.getElementById('chatList'),
    chatInput    : document.getElementById('chatInput'),
    helpBtn      : document.getElementById('help-button'),
    helpForm     : document.getElementById('helpForm'),
    helpInput    : document.getElementById('helpText'),
    helpStatus   : document.getElementById('helpStatus'),
    chatSendBtn  : document.querySelector('.chat-input-box button') // 快取聊天發送按鈕
    // 可以加入更多需要頻繁操作的元素
  };
  console.log("DOM 元素已快取。");
}

function renderStudentInfo(){
  if(el.nameSpan)  el.nameSpan.textContent  = studentName || '...';
  if(el.classSpan) el.classSpan.textContent = studentClass || '...'; // 顯示班級座號
  console.log("學生資訊已渲染到畫面。");
}

// --------------------------------------------------
// 7. 輔助函數
// --------------------------------------------------
function escapeHtml(s=''){ return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'''); }
function hideAnswerPanel(){ if(el.answerPanel) el.answerPanel.style.display='none'; }
function showAnswerPanel(){ if(el.answerPanel) el.answerPanel.style.display='block'; }
function resetProgress(){ if(el.progressFill){ el.progressFill.style.width='0%'; el.progressFill.textContent=`0/${TOTAL_STUDENTS}`; } }

// --------------------------------------------------
// 8. 事件綁定 (非 Firebase)
// --------------------------------------------------
function setupEventListeners() {
    // 求救按鈕顯示/隱藏表單
    if(el.helpBtn && el.helpForm) {
        el.helpBtn.addEventListener('click', () => {
            // 使用 classList.toggle 更簡潔
            el.helpForm.style.display = (el.helpForm.style.display === "none" || !el.helpForm.style.display) ? "block" : "none";
        });
    }
    // ** 將 onclick 改為 addEventListener **
    // 如果聊天發送按鈕存在，綁定點擊事件到 window.sendChatMessage
     if (el.chatSendBtn) {
         el.chatSendBtn.addEventListener('click', window.sendChatMessage); // 使用 addEventListener
     } else {
          console.warn("找不到聊天發送按鈕！");
     }
    // 其他需要綁定的按鈕也可以在這裡處理
     console.log("非 Firebase 事件監聽器已設置。");
}

// --------------------------------------------------
// 9. Firebase 監聽器設置
// --------------------------------------------------
function setupFirebaseListeners(){
  // 監聽老師出題
  const questionRef = ref(db,'teacher/currentQuestion');
  onValue(questionRef, (snapshot) => handleQuestion(snapshot.val()), (error) => {
      console.error("監聽題目失敗:", error);
      if(el.sysMsg) el.sysMsg.textContent = '讀取題目失敗!';
  });

  // 初始監聽大廳聊天室
  switchChatListener('lobby','大廳');
  console.log("Firebase 監聽器已設置。");
}

// --------------------------------------------------
// 10. 核心功能 - 處理題目
// --------------------------------------------------
function handleQuestion(q){
  hideAnswerPanel();
  resetProgress();

  if(!q || typeof q !== 'object' || !q.type || !q.text){ // 更嚴格檢查題目物件
    if(el.sysMsg) el.sysMsg.textContent = '等待老師出題中…';
    if(el.redLight) el.redLight.classList.remove('active');
    switchChatListener('lobby','大廳'); // 切回大廳
    try { sessionStorage.removeItem('questionId'); } catch(e){}
    console.log("題目已清除或格式錯誤。");
    return;
  }

  const qid = String(q.id || q.questionId || Date.now()); // 確保 qid 是字串
  const qtype = q.type;
  const qtext = q.text;
  console.log(`處理題目: ID=${qid}, Type=${qtype}`);

  try { sessionStorage.setItem('questionId',qid); } catch(e) { console.warn("無法寫入 questionId 到 sessionStorage"); }
  if(el.sysMsg) el.sysMsg.textContent = `📢 老師: ${qtext}`;
  if(el.redLight) el.redLight.classList.add('active');

  // 根據題型顯示不同介面
  if(qtype ==='choice' || qtype ==='truefalse') {
      showChoices(qtype, qid, qtext);
  } else if(qtype ==='shortanswer') {
      showShortAnswer(qid, qtext);
  } else if (qtype === 'handwrite') {
      // 普通手寫題跳轉 (保留)
       console.log("偵測到普通手寫題，準備跳轉...");
       setTimeout(() => { window.open(`handwrite-upload.html?questionId=${qid}&studentId=${studentId}`, "_blank"); }, 800);
  } else if (qtype === 'screenshot_annotation') {
       // 截圖註記題型，顯示等待訊息 (實際觸發由截圖任務監聽器處理)
       console.log("收到截圖註記題型標記，等待任務 URL...");
       if(el.sysMsg) el.sysMsg.textContent += " (等待老師截圖...)";
       // 通常不顯示普通作答區
       hideAnswerPanel();
  } else {
    console.warn("未知的題目類型:", qtype);
    showGenericMessage("收到未知題型，請依老師指示。");
  }

  // 監聽答案進度 和 切換到題目聊天室
  if (qtype !== 'handwrite' && qtype !== 'screenshot_annotation') { // 手寫題通常不計進度條?
       updateProgress(qid);
  }
  const chatContext = qtext.length > 10 ? qtext.substring(0, 10) + '…' : qtext;
  switchChatListener(qid, `題目: ${chatContext}`);
}

// --------------------------------------------------
// 11. 核心功能 - 顯示作答介面
// --------------------------------------------------
function showChoices(type, qid, text){
  if(!el.answerPanel || !el.questionText || !el.answerArea) return;
  const opts = type==='truefalse' ? ['是','否'] : ['A','B','C','D'];
  el.questionText.textContent = text || '';
  // **修正：onclick 裡函數調用要傳遞字串參數，需要加引號**
  el.answerArea.innerHTML = opts.map(o=>
    `<button class="send-btn" onclick="window.submitAnswer('${qid}','${escapeHtml(o)}')">${escapeHtml(o)}</button>`
  ).join('');
  showAnswerPanel();
}

function showShortAnswer(qid, text){
  if(!el.answerPanel || !el.questionText || !el.answerArea) return;
  el.questionText.textContent = text || '';
  el.answerArea.innerHTML=`
    <textarea id="shortAnswerInput" rows="3" placeholder="請輸入…" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
    <button class="send-btn" onclick="window.submitShort('${qid}')" style="margin-top: 8px;">送出</button>
  `; // 使用 window.submitShort
  showAnswerPanel();
  setTimeout(()=>{document.getElementById('shortAnswerInput')?.focus();},100);
}

function showGenericMessage(message){
   if(!el.answerPanel || !el.questionText || !el.answerArea) return;
   el.questionText.textContent = message || '';
   el.answerArea.innerHTML = ''; // 清空按鈕區
   showAnswerPanel();
}


// --------------------------------------------------
// 12. 核心功能 - 提交答案 (掛載到 window)
// --------------------------------------------------
window.submitAnswer = (qid, ans) => {
  if (!qid || ans === undefined || !studentId || !db) {
      console.error("提交答案失敗：缺少必要參數或 DB 未初始化。");
      alert("❌ 提交失敗！");
      return;
  }
  console.log(`提交答案: QID=${qid}, Ans=${ans}`);
  const data = { studentId, name: studentName, answer: ans, questionId: qid, time: new Date().toISOString() };
  const answerRef = ref(db, `answers/${studentId}/${qid}`);
  set(answerRef, data).then(() => {
    console.log("答案成功寫入 Firebase");
    alert('✅ 答案已送出');
    hideAnswerPanel();
    if(el.redLight) el.redLight.classList.remove('active');
  }).catch(e => {
    console.error('答案寫入 Firebase 失敗:', e);
    alert('❌ 答案送出失敗: ' + e.message);
  });
};

// 這個函數需要呼叫 window.submitAnswer，所以也要掛到 window
window.submitShort = qid => {
    const textarea = document.getElementById('shortAnswerInput');
    const text = textarea?.value.trim();
    if (!text) {
        alert('請輸入文字內容！');
        return;
    }
    window.submitAnswer(qid, text); // 調用已掛載到 window 的 submitAnswer
};


// --------------------------------------------------
// 13. 核心功能 - 更新進度條
// --------------------------------------------------
function updateProgress(qid){
  if(!qid || !el.progressFill || !db) return;
  const answersRef = ref(db,'answers');
  onValue(answersRef, (snapshot) => {
    const allAnswersData = snapshot.val() || {};
    let answeredCount = 0;
    // 計算有多少學生回答了這一題
    Object.keys(allAnswersData).forEach(sId => {
        if(allAnswersData[sId]?.[qid]) { // 檢查是否存在對應題目的答案
            answeredCount++;
        }
    });
    const percent = TOTAL_STUDENTS > 0 ? Math.round((answeredCount / TOTAL_STUDENTS) * 100) : 0;
    el.progressFill.style.width = percent + '%';
    el.progressFill.textContent = `${answeredCount} / ${TOTAL_STUDENTS}`;
  }, (error) => {
      console.error(`讀取答案進度 (QID:${qid}) 失敗:`, error);
      // 出錯時可以顯示錯誤狀態
      el.progressFill.style.width = '100%';
      el.progressFill.style.backgroundColor = 'red';
      el.progressFill.textContent = '錯誤';
      setTimeout(() => { // 短暫顯示錯誤後恢復
          el.progressFill.style.backgroundColor = '#66bb6a';
          resetProgress();
      }, 2000);
  });
}

// --------------------------------------------------
// 14. 核心功能 - 聊天室 (sendChatMessage 掛載到 window)
// --------------------------------------------------
window.sendChatMessage = () => {
    const targetChatId = sessionStorage.getItem('questionId') || 'lobby';
    const textInput = el.chatInput; // 使用快取的元素
    if (!textInput) { console.error("找不到聊天輸入框元素！"); return; }
    const text = textInput.value.trim();
    if (!text) { alert('請輸入訊息內容！'); return; }
    if (!db) { alert("錯誤：未連接服務，無法發送。"); return; }

    const messageData = {
        from: studentName,
        studentId: studentId,
        text: text,
        type: "text",
        time: new Date().toISOString()
    };
    const chatRef = ref(db, `chat/${targetChatId}`);
    console.log(`發送訊息到 chat/${targetChatId}`);
    push(chatRef, messageData).then(() => {
        textInput.value = ''; // 清空
        textInput.focus();
    }).catch(e => {
        console.error("發送聊天訊息失敗:", e);
        alert('❌ 發送失敗: ' + e.message);
    });
};

// --------------------------------------------------
// 15. 核心功能 - 求救 (sendHelp 掛載到 window)
// --------------------------------------------------
window.sendHelp = () => {
    const msgInput = el.helpInput;
    if (!msgInput) { console.error("找不到求救輸入框元素！"); return;}
    const msg = msgInput.value.trim();
    if (!msg) { alert('請輸入求救內容！'); return; }
    if (!db) { alert("錯誤：未連接服務，無法發送。"); return; }

    const helpData = {
        from: studentName,
        studentId: studentId,
        class: studentClass || '未知', // 使用 studentClass (班級 座號號)
        message: msg,
        time: new Date().toISOString()
    };
    const helpRef = ref(db, `help/${studentId}`); // 每個學生只保留最新的求救
    console.log(`發送求救訊息 for ${studentId}`);
    set(helpRef, helpData).then(() => {
        alert('✅ 求救訊息已發送！');
        if(el.helpStatus) el.helpStatus.style.display = 'block';
        msgInput.value = '';
        if(el.helpForm) el.helpForm.style.display = 'none';
         // 短暫顯示後隱藏狀態
         setTimeout(() => { if(el.helpStatus) el.helpStatus.style.display = 'none'; }, 3000);
    }).catch(e => {
        console.error("發送求救失敗:", e);
        alert('❌ 求救失敗: ' + e.message);
    });
};

// --- 截圖註記相關功能暫時移除或註解，待確認流程穩定 ---
/*
function listenForScreenshotTasks() { ... }
function showScreenshotTaskPrompt(...) { ... }
function hideScreenshotTaskPrompt(...) { ... }
window.openHandwriteWithBackground = function(...) { ... }
// 在 setupFirebaseListeners 中移除 listenForScreenshotTasks() 的呼叫
// 在 handleQuestion 中移除對 screenshot_annotation 的判斷
*/

console.log("student-ui.js (v6.3) 所有函數定義完畢。");

// --- END OF FILE student-ui.js (v6.3：修正全域函數掛載 + 語法檢查) ---
