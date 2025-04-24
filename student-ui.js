// 初始化燈號狀態
let teacherHasQuestion = false;
let studentNeedHelp = false;

const redLight = document.getElementById("red-light");
const orangeLight = document.getElementById("orange-light");
const helpBox = document.getElementById("help-box");
const helpInput = document.getElementById("help-text");
const helpSend = document.getElementById("help-send");
const tfArea = document.getElementById("tf-area");
const mcqArea = document.getElementById("mcq-area");

// 模擬：每 8 秒老師出題開紅燈
setInterval(() => {
  teacherHasQuestion = !teacherHasQuestion;
  updateLights();
  updateQuestionUI();
}, 8000);

function updateLights() {
  redLight.style.opacity = teacherHasQuestion ? 1 : 0.2;
  orangeLight.style.opacity = studentNeedHelp ? 1 : 0.2;
}

orangeLight.addEventListener("click", () => {
  studentNeedHelp = !studentNeedHelp;
  updateLights();
  helpBox.style.display = studentNeedHelp ? "block" : "none";
});

helpSend.addEventListener("click", () => {
  const msg = helpInput.value.trim();
  if (msg !== "") {
    console.log("✅ 傳送學生求救：", msg);
    // 寫入 Firebase 可在這裡加上
    helpInput.value = "";
    studentNeedHelp = false;
    updateLights();
    helpBox.style.display = "none";
  }
});

function updateQuestionUI() {
  tfArea.style.display = teacherHasQuestion ? "block" : "none";
  mcqArea.style.display = teacherHasQuestion ? "block" : "none";
}

// TODO: 這裡可以擴充按鈕點選題目、Firebase 回傳答案等等
