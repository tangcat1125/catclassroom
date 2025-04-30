// --- START OF FILE main.js (最終整合版 v3：動態列表 + 全監聽 + 智慧截圖) ---

// -----------------------------------------------------------------------------
// 1. 引入 Firebase 和必要的工具
// -----------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
// 引入 Firebase Storage 的功能
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// -----------------------------------------------------------------------------
// 2. Firebase 設定 (請確認與你的 Firebase 專案一致)
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074",
  measurementId: "G-6C92GYSX3F"
};

// -----------------------------------------------------------------------------
// 3. 初始化 Firebase (包含 Database 和 Storage)
// -----------------------------------------------------------------------------
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app); // 初始化 Storage

// -----------------------------------------------------------------------------
// 4. 取得重要的畫面元素
// -----------------------------------------------------------------------------
const responseBoard = document.querySelector(".response-board");
const studentListContainer = document.querySelector(".student-status-list");

// -----------------------------------------------------------------------------
// 5. 全域變數，用來追蹤狀態
// -----------------------------------------------------------------------------
let currentQuestionId = null;
let currentQuestionText = "老師尚未出題";
let answersListenerUnsubscribe = null;
let handwritingListeners = {};
let currentLoginData = {};
let currentAnswersData = {};

// -----------------------------------------------------------------------------
// 6. 按鈕功能函數 (掛載到 window 讓 HTML 可以呼叫)
// -----------------------------------------------------------------------------

/**
 * 複製學生登入連結到剪貼簿
 */
window.copyLink = function() {
    const linkInput = document.getElementById("login-link");
    if (!linkInput) return alert("錯誤：找不到連結輸入框！");
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    try {
        document.execCommand("copy");
        alert("✅ 學生登入連結已複製！");
    } catch (err) {
        navigator.clipboard.writeText(linkInput.value).then(() => {
            alert("✅ 學生登入連結已複製！ (API)");
        }).catch(err => {
            console.error('複製失敗:', err);
            alert("❌ 複製失敗，請手動複製連結。");
        });
    }
    window.getSelection()?.removeAllRanges(); // ?. 避免在不支援的環境報錯
};

/**
 * 顯示題目設定面板 (目前僅為提示)
 */
window.showQuestionPanel = function() {
    alert("👉 此功能尚未實作。\n請使用「開啟派題中心」按鈕來選擇並派送題目。");
};

/**
 * 擷取畫面、上傳 Storage、發送任務給學生 (使用 html2canvas)
 */
window.takeScreenshot = function(event) { // 加入 event 參數
  const boardToCapture = document.querySelector(".response-board");
  const screenshotButton = event?.target; // ?. 安全地取得觸發事件的按鈕

  if (!boardToCapture) {
    alert("錯誤：找不到 .response-board 元素進行截圖！");
    return;
  }

  console.log("開始截圖流程...");
  let originalButtonText = '擷取回應區畫面'; // 預設文字
  if (screenshotButton) {
      originalButtonText = screenshotButton.textContent;
      screenshotButton.disabled = true;
      screenshotButton.textContent = '截圖中...';
  }

  const loadingMsg = document.createElement('p');
  loadingMsg.textContent = '正在產生截圖，請稍候...';
  loadingMsg.style.cssText = 'text-align: center; font-weight: bold; color: #007bff; margin: 10px 0;'; // 稍微美化
  boardToCapture.prepend(loadingMsg);
  const originalBoardBorder = boardToCapture.style.border;
  boardToCapture.style.border = "3px dashed #007bff"; // 顯示截取中

  html2canvas(boardToCapture, {
      useCORS: true,
      allowTaint: true,
      scale: window.devicePixelRatio * 1.2,
      logging: false,
      onclone: (clonedDoc) => {
           // 在複製的 DOM 上移除載入訊息，避免它被截進去
           const clonedLoadingMsg = clonedDoc.querySelector(".response-board > p:first-child");
           if (clonedLoadingMsg && clonedLoadingMsg.textContent.includes('正在產生截圖')) {
               clonedLoadingMsg.remove();
           }
      }
  }).then(canvas => {
    console.log("截圖 Canvas 已產生，準備轉換為 Blob...");
    loadingMsg.remove(); // 移除提示訊息
    boardToCapture.style.border = originalBoardBorder; // 恢復邊框

    canvas.toBlob(function(blob) {
      if (!blob) {
        console.error("Canvas toBlob() 失敗！");
        alert("❌ 截圖轉換失敗，無法上傳。");
        if (screenshotButton) { screenshotButton.disabled = false; screenshotButton.textContent = originalButtonText; }
        return;
      }
      if (blob.size > 5 * 1024 * 1024) { // 限制 5MB (可調整)
         alert(`❌ 截圖檔案過大 (${(blob.size / 1024 / 1024).toFixed(2)} MB)，無法上傳。請嘗試縮小回應區內容。`);
         if (screenshotButton) { screenshotButton.disabled = false; screenshotButton.textContent = originalButtonText; }
         return;
      }


      console.log("Blob 產生成功 (大小: " + (blob.size / 1024).toFixed(1) + " KB)，準備上傳...");
      if (screenshotButton) screenshotButton.textContent = '上傳中...';

      const timestamp = Date.now();
      const fileName = `screenshot_task_${timestamp}.png`;
      const imageRef = storageRef(storage, `screenshots/${fileName}`);

      uploadBytes(imageRef, blob).then((snapshot) => {
        console.log('圖片成功上傳到 Firebase Storage！', snapshot.metadata.fullPath);
        if (screenshotButton) screenshotButton.textContent = '取得網址...';

        getDownloadURL(snapshot.ref).then((downloadURL) => {
          console.log('取得圖片下載 URL:', downloadURL);
          if (screenshotButton) screenshotButton.textContent = '發送任務...';

          const screenshotTaskData = {
            imageUrl: downloadURL,
            taskId: `screenshot_${timestamp}`,
            timestamp: timestamp
          };

          const taskRef = ref(db, '/teacher/currentScreenshotAnnotationTask');

          set(taskRef, screenshotTaskData).then(() => {
            console.log("截圖註記任務已成功發送到 Realtime Database！");
            alert("✅ 截圖已成功發送給學生進行註記！");
            if (screenshotButton) { screenshotButton.disabled = false; screenshotButton.textContent = originalButtonText; }
          }).catch((dbError) => {
            console.error("寫入截圖任務到 RTDB 失敗:", dbError);
            alert("❌ 截圖已上傳，但發送任務給學生失敗！(RTDB Error)");
            if (screenshotButton) { screenshotButton.disabled = false; screenshotButton.textContent = originalButtonText; }
          });

        }).catch((urlError) => {
          console.error("取得下載 URL 失敗:", urlError);
          alert("❌ 圖片已上傳，但無法取得圖片網址，任務發送失敗！(URL Error)");
          if (screenshotButton) { screenshotButton.disabled = false; screenshotButton.textContent = originalButtonText; }
        });

      }).catch((uploadError) => {
        console.error("上傳圖片到 Storage 失敗:", uploadError);
        // 根據錯誤碼提供更詳細的提示
        let errorMsg = "❌ 圖片上傳失敗！";
        if (uploadError.code === 'storage/unauthorized') {
            errorMsg += " 請檢查 Firebase Storage 的權限設定。";
        } else if (uploadError.code === 'storage/canceled') {
             errorMsg += " 上傳被取消。";
        } else {
             errorMsg += " 請檢查網路連線或稍後再試。";
        }
        alert(errorMsg);
        if (screenshotButton) { screenshotButton.disabled = false; screenshotButton.textContent = originalButtonText; }
      });

    }, 'image/png'); // 指定 PNG 格式

  }).catch(err => {
    console.error("html2canvas 截圖失敗:", err);
    alert("❌ 截圖處理失敗！");
     loadingMsg.remove(); // 確保移除提示
     boardToCapture.style.border = originalBoardBorder; // 恢復邊框
    if (screenshotButton) { screenshotButton.disabled = false; screenshotButton.textContent = originalButtonText; }
  });
}


// -----------------------------------------------------------------------------
// 7. 輔助函數 (維持 V2 版本內容)
// -----------------------------------------------------------------------------
function flashUnknownElement(element) { if (!element) return; const ob=element.style.border; element.style.border="3px dashed red"; setTimeout(()=>{element.style.border=ob||"2px solid #ddd";},1500); }
function addStudentResponse(studentId, studentName, answerText) { const b=document.createElement("div"); const g=studentId?.toString().toLowerCase().startsWith('g'); let dn=`${studentName||'匿名'} (${studentId})`; let bc="green"; if(g){bc="red";dn=`⚠️ 訪客：${dn}`;} b.className=`response-box ${bc}`; b.innerText=`${dn}: 回答「${answerText}」`; responseBoard.appendChild(b); if(g) flashUnknownElement(b); }
function addHandwritingResponse(studentId, data) { const qid=data.questionId||'未知'; console.log(`顯示 ${studentId} 手寫 (題目: ${qid})`); const b=document.createElement("div"); const g=studentId?.toString().toLowerCase().startsWith('g'); let dn=`${data.studentName||'匿名'} (${studentId})`; let bc="blue"; if(g){bc="orange";dn=`⚠️ 訪客：${dn}`;} b.className=`response-box ${bc}`; b.style.lineHeight='1.4'; const hwId=`${studentId}-${qid}`; const oldB=responseBoard.querySelector(`.response-box[data-hw-id="${hwId}"]`); if(oldB)oldB.remove(); b.setAttribute('data-hw-id',hwId); b.innerHTML=`<strong style="display:block;margin-bottom:3px;">${dn}</strong> 對題目 "<strong>${qid}</strong>" 提交手寫：<br><img src="${data.imageUrl}" alt="學生 ${studentId} 手寫(${qid})" style="max-width:90%;max-height:150px;margin-top:5px;border:1px solid #ccc;cursor:pointer;display:block;margin-left:auto;margin-right:auto;" onclick="window.open('${data.imageUrl}','_blank')" onerror="this.alt='圖片載入失敗';this.style.display='none';this.nextElementSibling.style.display='block';"><span style="display:none;color:red;font-size:.9em;">圖片載入失敗</span><small style="display:block;margin-top:4px;font-size:.8em;color:#666;">提交: ${data.timestamp?new Date(data.timestamp).toLocaleString():'未知'}</small>`; const firstRB=responseBoard.querySelector('.response-box'); if(firstRB){responseBoard.insertBefore(b,firstRB);} else{const t=responseBoard.querySelector('h3')||responseBoard.querySelector('p'); if(t){t.insertAdjacentElement('afterend',b);} else{responseBoard.appendChild(b);}} if(g)flashUnknownElement(b); }
function updateStudentStatusLights(qid) { if(!studentListContainer) return; console.log(`更新燈號 (QID: ${qid})`); const rows=studentListContainer.querySelectorAll(".student-row"); rows.forEach(r=>{const s=r.querySelector("span"); if(!s) return; const sid=r.getAttribute('data-student-id'); if(!sid){s.className="grey"; return;} if(!qid){s.className="blue"; return;} if(currentAnswersData?.[sid]?.[qid]){s.className="green";} else{s.className="blue";}}); }
function updateStudentList(loginData) { if (!studentListContainer) return; console.log("更新學生列表"); studentListContainer.innerHTML='<h4>學生狀態：</h4>'; currentLoginData=loginData||{}; const sortedIds=Object.keys(currentLoginData).sort(); if(sortedIds.length>0){sortedIds.forEach(sid=>{const si=currentLoginData[sid]; const sn=si.StudentName||'未知'; const r=document.createElement('div'); r.className='student-row'; r.setAttribute('data-student-id',sid); const s=document.createElement('span'); if(currentQuestionId&¤tAnswersData?.[sid]?.[currentQuestionId]){s.className='green';}else{s.className='blue';} r.appendChild(s); r.appendChild(document.createTextNode(` ${sn} (${sid})`)); studentListContainer.appendChild(r);});} else{studentListContainer.innerHTML+='<p style="color:grey;font-style:italic;">目前無學生登入。</p>';} }

// -----------------------------------------------------------------------------
// 8. Firebase 資料監聽器 (維持 V2 版本內容)
// -----------------------------------------------------------------------------
function listenToAnswers(qid) { console.log(`準備監聽題目 ${qid} 一般答案`); if(answersListenerUnsubscribe){console.log("停止舊答案監聽"); answersListenerUnsubscribe(); answersListenerUnsubscribe=null;} currentAnswersData={}; if(!qid){console.log("無題目ID，不監聽答案"); updateStudentStatusLights(null); return;} const answersRef=ref(db,`answers`); console.log(`監聽 /answers for QID ${qid}`); answersListenerUnsubscribe=onValue(answersRef,(s)=>{console.log(`收到 ${qid} 答案更新`); currentAnswersData=s.val()||{}; responseBoard.querySelectorAll('.response-box.green, .response-box.red').forEach(b=>b.remove()); const noAns=Array.from(responseBoard.querySelectorAll('p')).find(p=>p.textContent.includes('尚無學生對此題作答')); if(noAns)noAns.remove(); let cnt=0; Object.keys(currentAnswersData).forEach(sid=>{if(currentAnswersData[sid]?.[qid]){const ad=currentAnswersData[sid][qid]; if(ad.answer!==undefined&&ad.answer!==null){addStudentResponse(sid,ad.name||sid,ad.answer); cnt++;}}}); if(cnt===0&&responseBoard.querySelectorAll('.response-box').length===0){const p=document.createElement('p');p.textContent='目前尚無學生對此題作答。';p.style.color='grey';p.style.fontStyle='italic';responseBoard.appendChild(p);} updateStudentStatusLights(qid);},(e)=>{console.error(`監聽 ${qid} 答案出錯:`,e); const ep=document.createElement('p');ep.textContent=`讀取一般答案出錯！`;ep.style.color='red';responseBoard.appendChild(ep);updateStudentStatusLights(null);}); }
function listenToHandwriting() { console.log("開始監聽 /handwriting"); const hwRef=ref(db,"handwriting"); onChildAdded(hwRef,(ss)=>{const sid=ss.key; console.log(`偵測到 ${sid} 手寫資料夾`); const shwRef=ref(db,`handwriting/${sid}`); handwritingListeners[sid]=onChildAdded(shwRef,(qs)=>{const qid=qs.key; const d=qs.val(); if(d?.imageUrl){addHandwritingResponse(sid,d);}else{console.warn(`${sid} 手寫(題目 ${qid})資料不完整`);}},(e)=>{console.error(`監聽 ${sid} 手寫出錯:`,e);});},(e)=>{console.error("監聽 /handwriting 主路徑出錯:",e);}); }
function listenToLoginStatus() { console.log("開始監聽 /login"); const loginRef=ref(db,'login'); onValue(loginRef,(s)=>{console.log("收到登入狀態更新"); updateStudentList(s.val());},(e)=>{console.error("監聽 /login 出錯:",e); if(studentListContainer)studentListContainer.innerHTML='<h4>學生狀態：</h4><p style="color:red;">讀取登入狀態失敗！</p>';}); }

// -----------------------------------------------------------------------------
// 9. 主要的程式進入點：監聽老師派題 (維持 V2 版本內容)
// -----------------------------------------------------------------------------
function initializeTeacherUI() { console.log("UI 初始化"); responseBoard.innerHTML="<p>正在初始化，等待老師從「派題中心」出題...</p>"; if(studentListContainer)studentListContainer.innerHTML='<h4>學生狀態：</h4><p>讀取登入狀態...</p>'; const cqRef=ref(db,"/teacher/currentQuestion"); console.log("開始監聽 /teacher/currentQuestion"); onValue(cqRef,(s)=>{const qd=s.val(); if(qd?.id){const nqid=qd.id; const nqt=qd.text||'題目文字未提供'; console.log(`偵測到題目更新！ ID: ${nqid}`); if(nqid!==currentQuestionId){currentQuestionId=nqid; currentQuestionText=nqt; responseBoard.innerHTML=`<h3>題目：${currentQuestionText} (ID: ${currentQuestionId})</h3>`; listenToAnswers(currentQuestionId); updateStudentStatusLights(currentQuestionId);}else{console.log("題目ID未變"); if(responseBoard.querySelector('h3'))responseBoard.querySelector('h3').innerText=`題目：${nqt} (ID: ${currentQuestionId})`; updateStudentStatusLights(currentQuestionId);}}else{console.log("題目被清除"); const oldQid=currentQuestionId; currentQuestionId=null; currentQuestionText="老師尚未出題或已清除題目"; responseBoard.innerHTML=`<p>${currentQuestionText}</p>`; if(answersListenerUnsubscribe){console.log("停止答案監聽"); answersListenerUnsubscribe(); answersListenerUnsubscribe=null;} currentAnswersData={}; if(oldQid)updateStudentStatusLights(null);}},(e)=>{console.error("監聽 /teacher/currentQuestion 出錯:",e); responseBoard.innerHTML=`<p style="color:red;">讀取老師題目出錯！</p>`; currentQuestionId=null; if(answersListenerUnsubscribe)answersListenerUnsubscribe(); answersListenerUnsubscribe=null; currentAnswersData={}; updateStudentStatusLights(null);}); listenToHandwriting(); listenToLoginStatus(); }

// -----------------------------------------------------------------------------
// 10. 執行初始化
// -----------------------------------------------------------------------------
initializeTeacherUI();

// --- END OF FILE main.js (最終整合版 v3：動態列表 + 全監聽 + 智慧截圖) ---
