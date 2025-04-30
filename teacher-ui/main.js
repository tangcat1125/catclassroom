// main.js：白貓工作室 教師端互動邏輯（含中文註解）

// 功能：複製 LINK 到剪貼簿
function copyLink() {
  const linkInput = document.getElementById("login-link");
  linkInput.select();
  linkInput.setSelectionRange(0, 99999); // 適用行動裝置
  document.execCommand("copy");
  alert("連結已複製，請貼給學生！");
}

// 功能：顯示出題區（未來可變成彈出視窗）
function showQuestionPanel() {
  alert("👉 請到後續版本加入『題目輸入區』功能 😸");
}

// 功能：截圖（模擬用）
function takeScreenshot() {
  alert("📸 此處將整合 html2canvas 或下載功能（建議手動擷圖）");
}

// 🔜 以下預留跑馬燈動畫／學生回應處理邏輯，可未來擴充：
/*
// 動態新增學生回應（未來用）
function addStudentResponse(id, text, color = "green") {
  const board = document.querySelector(".response-board");
  const box = document.createElement("div");
  box.className = `response-box ${color}`;
  box.innerText = `${id}: ${text}`;
  board.appendChild(box);
}
*/

// 預備用動畫：黃框閃爍（可未來加在 student-row 上）
/*
function flashStudent(id) {
  const row = document.querySelector(`.student-row[data-id='${id}']`);
  if (!row) return;
  row.style.border = "2px dashed yellow";
  setTimeout(() => {
    row.style.border = "none";
  }, 1000);
}
*/
