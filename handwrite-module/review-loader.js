import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

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

// 取得 URL 中的 questionId
const urlParams = new URLSearchParams(location.search);
const questionId = urlParams.get('questionId');
document.getElementById('questionTitle').innerText = questionId || "未指定題目";

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayTimestamp = today.getTime();

const answersRef = ref(db, 'handwriting');
const reviewRef = ref(db, `handwritingReview/${questionId}`);
const loginRef = ref(db, 'login');

const container = document.getElementById('answersContainer');
const previewImage = document.getElementById('previewImage');
const progressInfo = document.getElementById('progressInfo');

loadAll();

async function loadAll() {
  const [answerSnap, reviewSnap, loginSnap] = await Promise.all([
    get(answersRef),
    get(reviewRef),
    get(loginRef)
  ]);

  if (!answerSnap.exists()) {
    progressInfo.innerText = '❌ 今日尚無繳交資料';
    return;
  }

  const reviewData = reviewSnap.exists() ? reviewSnap.val() : {};
  const loginData = loginSnap.exists() ? loginSnap.val() : {};
  let submitted = 0;
  let total = 0;
  let html = '';

  // 統計登入學生總數（今日登入）
  Object.values(loginData).forEach(classGroup => {
    Object.values(classGroup).forEach(user => {
      if (user.time >= todayTimestamp) total++;
    });
  });

  // 顯示每位學生的繳交圖像
  answerSnap.forEach(child => {
    const studentId = child.key;
    const studentAnswers = child.val();
    const data = studentAnswers[questionId];

    if (!data || data.timestamp < todayTimestamp) return; // 略過非今日資料
    submitted++;

    const imageUrl = data.imageUrl;
    const reviewed = reviewData[studentId];
    const feedback = reviewed?.feedback || '';
    const reviewedAt = reviewed?.reviewedAt || null;

    html += `
      <div class="student-entry">
        <img class="thumbnail" src="${imageUrl}" alt="${studentId}" onclick="showPreview('${imageUrl}')">
        <div style="flex:1">
          <strong>${studentId}</strong><br>
          🕒 ${new Date(data.timestamp).toLocaleString()}<br>
          <textarea id="fb_${studentId}" placeholder="輸入評語..." rows="2" style="width:100%">${feedback}</textarea>
          <button onclick="saveReview('${studentId}')">✅ ${reviewedAt ? '已批閱' : '批閱'}</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html || '❌ 尚無今日繳交資料';
  progressInfo.innerText = `📝 今日繳交：${submitted} / ${total} 人`;
}

window.showPreview = function (url) {
  previewImage.src = url;
  previewImage.style.display = 'block';
};

window.saveReview = async function (studentId) {
  const feedback = document.getElementById(`fb_${studentId}`).value.trim();
  const newData = {
    reviewer: "teacher", // 這裡你也可以改成老師帳號
    feedback,
    reviewedAt: Date.now()
  };
  const reviewPath = ref(db, `handwritingReview/${questionId}/${studentId}`);
  await set(reviewPath, newData);
  alert(`✅ 已儲存對 ${studentId} 的批閱！`);
  loadAll(); // 重新載入顯示狀態更新
};
