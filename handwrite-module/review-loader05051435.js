// review-loader.js - 教師端手寫作答總覽
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

const questionId = new URLSearchParams(window.location.search).get("questionId");
const titleSpan = document.getElementById("questionTitle");
const progressInfo = document.getElementById("progressInfo");
const container = document.getElementById("answersContainer");
const previewImage = document.getElementById("previewImage");

if (questionId) titleSpan.textContent = questionId;

const handwritingRef = ref(db, `handwriting`);
onValue(handwritingRef, (snapshot) => {
  const data = snapshot.val();
  container.innerHTML = "";
  let count = 0;

  for (const studentId in data) {
    if (data[studentId][questionId]) {
      const entry = data[studentId][questionId];
      const div = document.createElement("div");
      div.className = "student-entry";

      const img = document.createElement("img");
      img.src = entry.imageUrl;
      img.className = "thumbnail";
      img.onclick = () => {
        previewImage.src = entry.imageUrl;
        previewImage.style.display = "block";
      };

      const meta = document.createElement("div");
      meta.innerHTML = `<strong>${entry.studentName}</strong>（${entry.studentClass}）<br><code>${studentId}</code><br><small>🕓 ${new Date(entry.timestamp).toLocaleString()}</small>`;

      div.appendChild(img);
      div.appendChild(meta);
      container.appendChild(div);
      count++;
    }
  }

  progressInfo.innerHTML = `📦 已收到作答：${count} 筆`;
});
