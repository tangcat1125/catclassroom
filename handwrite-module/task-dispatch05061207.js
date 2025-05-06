// task-dispatch.js
// 搭配新版 index.html 使用，支援任務發布、學生連結產生、作答統計與繳交清單預覽
// 含 Debug Mode、console log preview 與一鍵截圖派送功能

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyBB3wmBveYumzmPUQuIr4ApZYxKnnT-IdA",
  authDomain: "catclassroom-login.firebaseapp.com",
  databaseURL: "https://catclassroom-login-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catclassroom-login",
  storageBucket: "catclassroom-login.appspot.com",
  messagingSenderId: "123487233181",
  appId: "1:123487233181:web:aecc2891dc2d1096962074"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const DEBUG_MODE = true;

window.publishTask = async function () {
  const questionId = document.getElementById('questionId').value.trim();
  const title = document.getElementById('title').value.trim();
  const backgroundUrl = document.getElementById('backgroundUrl').value.trim();
  if (!questionId || !title) return alert("請填入題目代碼與標題");

  const taskRef = ref(db, `handwritingTasks/${questionId}`);
  await set(taskRef, { title, backgroundUrl, releaseTimestamp: Date.now() });

  const preview = `https://tangcat1125.github.io/catclassroom/handwrite-module/handwrite-upload.html?questionId=${encodeURIComponent(questionId)}`;
  const review = `review-handwrite.html?questionId=${encodeURIComponent(questionId)}`;

  document.getElementById('previewLinkDisplay').textContent = preview;
  document.getElementById('reviewLink').textContent = review;

  document.getElementById('status').textContent = `✅ 任務已發布：${questionId}`;
  document.getElementById('generalLink').innerHTML = `📎 通用作答連結：<br><code id="previewLinkDisplay">${preview}</code><button class="copy-btn" onclick="copyToClipboard('previewLinkDisplay')">📋 複製</button>`;

  if (DEBUG_MODE) console.log('[DEBUG] 發布任務', { questionId, title, backgroundUrl });
  loadImages(questionId);
};

window.generateLink = function () {
  const qid = document.getElementById('questionId').value.trim();
  const sid = document.getElementById('studentId').value.trim();
  const name = document.getElementById('studentName').value.trim();
  const cls = document.getElementById('studentClass').value.trim();
  if (!qid || !sid) return alert("請填入題目代碼與學生 ID");

  const url = `https://tangcat1125.github.io/catclassroom/handwrite-module/handwrite-upload.html?questionId=${encodeURIComponent(qid)}&studentId=${encodeURIComponent(sid)}&studentName=${encodeURIComponent(name)}&studentClass=${encodeURIComponent(cls)}`;

  document.getElementById('generatedLink').innerHTML = `👉 <code id="studentLinkCode">${url}</code><button class="copy-btn" onclick="copyToClipboard('studentLinkCode')">📋 複製</button>`;
  if (DEBUG_MODE) console.log('[DEBUG] 產生學生連結', url);
};

window.copyToClipboard = function (id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => alert("已複製連結到剪貼簿！"));
};

window.openPreview = function () {
  const url = document.getElementById('previewLinkDisplay').textContent;
  if (url.startsWith('http')) window.open(url, '_blank');
};

window.openReview = function () {
  const url = document.getElementById('reviewLink').textContent;
  if (url.startsWith('http') || url.endsWith('.html')) window.open(url, '_blank');
};

window.loadProgress = async function () {
  const questionId = document.getElementById('questionId').value.trim();
  const manualTotal = parseInt(document.getElementById('totalStudents').value);
  const handwritingRef = ref(db, 'handwriting');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  let submitted = 0;

  const snap = await get(handwritingRef);
  if (snap.exists()) {
    snap.forEach(snapChild => {
      const answers = snapChild.val();
      const data = answers[questionId];
      if (data && data.timestamp >= todayTimestamp) submitted++;
    });
  }

  let total = manualTotal;
  if (!total) {
    const loginSnap = await get(ref(db, 'login'));
    total = 0;
    loginSnap.forEach(cls => {
      Object.values(cls.val()).forEach(user => {
        if (user.time && user.time >= todayTimestamp) total++;
      });
    });
  }

  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
  document.getElementById('progressStatus').innerText = `✅ ${submitted} / ${total} 人已繳交`;
  const bar = document.getElementById('progressBar');
  bar.style.width = `${percent}%`;
  bar.innerText = `${percent}%`;

  if (DEBUG_MODE) console.log('[DEBUG] 作答進度', { submitted, total });
};

async function loadImages(questionId) {
  const handwritingRef = ref(db, 'handwriting');
  const reviewRef = ref(db, `handwritingReview/${questionId}`);
  const container = document.getElementById('imageList');
  container.innerHTML = '載入中...';

  const [snap, reviewSnap] = await Promise.all([
    get(handwritingRef),
    get(reviewRef)
  ]);

  if (!snap.exists()) return container.innerText = '❌ 查無作答';
  let html = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  snap.forEach(snapChild => {
    const answers = snapChild.val();
    const data = answers[questionId];
    if (data && data.imageUrl && data.timestamp >= todayTimestamp) {
      const reviewed = reviewSnap.exists() && reviewSnap.val()[snapChild.key];
      const icon = reviewed ? '✅' : '⏳';
      html += `<div style="display:inline-block;text-align:center;">
        <img class="thumbnail" src="${data.imageUrl}" title="${snapChild.key}" onclick="window.open('${data.imageUrl}')">
        <div>${icon}</div>
      </div>`;
    }
  });

  container.innerHTML = html || '❌ 尚無今日繳交紀錄';
  if (DEBUG_MODE) console.log('[DEBUG] 圖像清單載入完成');
}

// 🆕 一鍵截圖派送懶人模式
window.lazySuperScreenshotDispatch = async function () {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const questionId = `${today}-screenshot`;
    const title = "請依據截圖內容手寫作答";

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    track.stop();

    const storage = getStorage();
    const fileRef = storageRef(storage, `screenshots/${questionId}.png`);
    await uploadString(fileRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(fileRef);

    document.getElementById("questionId").value = questionId;
    document.getElementById("title").value = title;
    document.getElementById("backgroundUrl").value = downloadUrl;

    // 顯示預覽圖與連結
    const img = document.getElementById("bgPreviewImg");
    const link = document.getElementById("bgPreviewUrl");
    if (img && link) {
      img.src = downloadUrl;
      link.textContent = downloadUrl;
    }

    await publishTask();
    document.getElementById("status").innerHTML = `✅ 一鍵截圖任務已發布！<br>📎 圖片連結：<code>${downloadUrl}</code>`;

    if (DEBUG_MODE) console.log("[DEBUG] 截圖背景上傳成功並已派送", { questionId, downloadUrl });
  } catch (err) {
    console.error("截圖派送失敗", err);
    alert("🐛 懶人截圖派送失敗，請檢查權限！");
  }
};
