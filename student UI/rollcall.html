// --- student-ui.js v6.2：最終 inline 版，不留任何空白 ---
// ESM 載入 Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getDatabase, ref, onValue,
  set, push, off
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

// ← 在這裡完整貼上您 firebase-config.js 的內容 ↓
const firebaseConfig = {
  apiKey: "AIza…",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-ABCDEFGH"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
console.log('✅ Firebase 已完成初始化');

// 全域設定
const TOTAL_STUDENTS = 13;
let studentId, studentName, studentClass, el;

// 監聽 DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  loadStudentInfo();
  cacheDOM();
  renderStudentInfo();
  setupAllListeners();
  console.log('🎉 學生介面 v6.2 啟動完成');
});

// 載入學生資料
function loadStudentInfo(){
  studentId    = sessionStorage.getItem('studentId');
  studentName  = sessionStorage.getItem('studentName');
  studentClass = sessionStorage.getItem('studentClass');
  if(!studentId){
    const now = Date.now();
    studentId    = `guest_${now}`;
    studentName  = '訪客';
    studentClass = 'Guest';
    sessionStorage.setItem('studentId', studentId);
    sessionStorage.setItem('studentName', studentName);
    sessionStorage.setItem('studentClass', studentClass);
  }
  console.log(`Loaded: ${studentName} (${studentClass}) [${studentId}]`);
}

// 快取 DOM
function cacheDOM(){
  el = {};
  el.nameSpan     = document.getElementById('student-name');
  el.classSpan    = document.getElementById('student-class');  // 修正為 student-class
  el.redLight     = document.getElementById('red-light');
  el.sysMsg       = document.getElementById('systemMessage');
  el.answerPanel  = document.getElementById('answerPanel');
  el.questionText = document.getElementById('questionText');
  el.answerArea   = document.getElementById('answerButtons');
  el.progressFill = document.getElementById('progressFill');
  el.chatList     = document.getElementById('chatList');
  el.chatInput    = document.getElementById('chatInput');
  el.helpBtn      = document.getElementById('help-button');
  el.helpForm     = document.getElementById('helpForm');
  el.helpInput    = document.getElementById('helpText');
  el.helpStatus   = document.getElementById('helpStatus');
}

// 顯示學生資訊
function renderStudentInfo(){
  if(el.nameSpan)  el.nameSpan.textContent  = studentName;
  if(el.classSpan) el.classSpan.textContent = studentClass;
}

// 基礎轉義
function escapeHtml(s=''){ return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;'); }

// 設置所有 Firebase 監聽
let currentChatRef = null;
function setupAllListeners(){
  onValue(ref(db,'teacher/currentQuestion'), snap=>handleQuestion(snap.val()));
  switchChat('lobby','大廳');
  if(el.helpBtn) el.helpBtn.onclick = ()=> el.helpForm.classList.toggle('show');
}

// 處理題目
function handleQuestion(q){
  hideAnswer(); resetProgress();
  if(!q?.type){
    el.sysMsg.textContent = '等待老師出題中…';
    el.redLight.classList.remove('active');
    switchChat('lobby','大廳');
    sessionStorage.removeItem('questionId');
    return;
  }
  const qid = (q.id||Date.now()).toString();
  sessionStorage.setItem('questionId',qid);
  el.sysMsg.textContent = `📢 老師: ${q.text}`;
  el.redLight.classList.add('active');
  if(q.type==='choice'||q.type==='truefalse') showChoices(q.type,qid,q.text);
  else if(q.type==='shortanswer')   showShort(qid,q.text);
  updateProgress(qid);
  switchChat(qid,q.text.slice(0,10)+'…');
}

// 顯示選項
function showChoices(type,qid,text){
  const opts = type==='truefalse'?['是','否']:['A','B','C','D'];
  el.answerPanel.style.display = 'block';
  el.questionText.textContent  = text;
  el.answerArea.innerHTML = opts.map(o=>
    `<button class="send-btn" onclick="submitAnswer('${qid}','${o}')">${o}</button>`
  ).join('');
}

// 顯示簡答
function showShort(qid,text){
  el.answerPanel.style.display = 'block';
  el.questionText.textContent=text;
  el.answerArea.innerHTML=`
    <textarea id="shortAnswerInput" rows="3" placeholder="請輸入…"></textarea>
    <button class="send-btn" onclick="submitShort('${qid}')">送出</button>
  `;
}

// 隱藏答題面板
function hideAnswer(){ if(el.answerPanel) el.answerPanel.style.display='none'; }

// 更新進度
function resetProgress(){
  if(el.progressFill){
    el.progressFill.style.width='0%';
    el.progressFill.textContent=`0/${TOTAL_STUDENTS}`;
  }
}
function updateProgress(qid){
  onValue(ref(db,'answers'),snap=>{
    const d=snap.val()||{};
    const cnt=Object.values(d).filter(u=>u[qid]).length;
    const p=Math.round(cnt/TOTAL_STUDENTS*100);
    el.progressFill.style.width=p+'%';
    el.progressFill.textContent=`${cnt}/${TOTAL_STUDENTS}`;
  });
}

// 提交答案
window.submitAnswer = (qid,ans)=> {
  set(ref(db,`answers/${studentId}/${qid}`),{
    studentId, name: studentName, answer:ans, time:new Date().toISOString()
  }).then(_=>{
    alert('✅ 答案送出'); hideAnswer(); el.redLight.classList.remove('active');
  }).catch(e=>alert('❌ '+e.message));
};
window.submitShort = qid=>{ const t=document.getElementById('shortAnswerInput')?.value.trim(); if(!t)return alert('請輸入文字'); window.submitAnswer(qid,t); };

// 聊天室
function switchChat(id,label){
  if(currentChatRef) off(currentChatRef);
  currentChatRef=ref(db,`chat/${id}`);
  el.chatList.innerHTML='<p><i>讀取中…</i></p>';
  onValue(currentChatRef,snap=>{
    const msgs=snap.val()||{};
    el.chatList.innerHTML=Object.values(msgs)
      .sort((a,b)=> new Date(a.time)-new Date(b.time))
      .map(m=>`
        <div class="chat-item${m.studentId===studentId?' self-message':''}">
          <strong>${escapeHtml(m.from)}</strong>: ${escapeHtml(m.text)}
        </div>`
      ).join('')||'<p><i>無訊息</i></p>';
    el.chatList.scrollTop=el.chatList.scrollHeight;
  });
}
window.sendChatMessage = ()=>{ const txt=el.chatInput.value.trim(); if(!txt)return alert('請輸入訊息'); push(ref(db,`chat/${sessionStorage.getItem('questionId')||'lobby'}`),{ from:studentName,studentId,text:txt,time:new Date().toISOString() }); el.chatInput.value=''; };

// 求救
window.sendHelp = ()=>{ const msg=el.helpInput.value.trim(); if(!msg)return alert('請輸入求救內容'); set(ref(db,`help/${studentId}`),{ from:studentName, studentId, class:studentClass, message:msg, time:new Date().toISOString() }).then(_=> alert('✅ 求救送出'), el.helpForm.classList.remove('show')).catch(e=>alert('❌ '+e.message)); };
// --- End of v6.2 ---
