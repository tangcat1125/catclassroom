// task-editor.js - 正式版：處理 task-editor.html 的互動與儲存

import { taskDatabase } from "./firebase-config-task.js";
import { ref, push, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 取得 DOM 元素
const questionTypeSelect = document.getElementById('questionType');
const questionTextInput = document.getElementById('questionText');
const choiceOptionsDiv = document.getElementById('choiceOptions');
const optionAInput = document.getElementById('optionA');
const optionBInput = document.getElementById('optionB');
const optionCInput = document.getElementById('optionC');
const optionDInput = document.getElementById('optionD');
const imageUploadDiv = document.getElementById('imageUpload'); // 圖片題目前先不處理
const correctAnswerInput = document.getElementById('correctAnswer');
const saveQuestionBtn = document.getElementById('saveQuestionBtn');

// 題型變更時，控制哪些欄位要顯示
questionTypeSelect.addEventListener('change', () => {
  const selectedType = questionTypeSelect.value;
  if (selectedType === 'choice') {
    choiceOptionsDiv.style.display = 'block';
    imageUploadDiv.style.display = 'none';
  } else if (selectedType === 'image') {
    choiceOptionsDiv.style.display = 'none';
    imageUploadDiv.style.display = 'block';
  } else {
    choiceOptionsDiv.style.display = 'none';
    imageUploadDiv.style.display = 'none';
  }
});

// 儲存按鈕點擊時
saveQuestionBtn.addEventListener('click', saveQuestionToFirebase);

// --- 儲存題目的核心函數 ---
function saveQuestionToFirebase() {
  const type = questionTypeSelect.value;
  const text = questionTextInput.value.trim();
  const answer = correctAnswerInput.value.trim();

  if (!text) {
    alert('請輸入題目內容！');
    return;
  }
  if (!answer) {
    alert('請輸入正確答案！');
    return;
  }

  let questionData = { type, text, answer };

  if (type === 'choice') {
    const optionA = optionAInput.value.trim();
    const optionB = optionBInput.value.trim();
    const optionC = optionCInput.value.trim();
    const optionD = optionDInput.value.trim();

    if (!optionA || !optionB) {
      alert('選擇題請至少填寫A和B選項！');
      return;
    }
    if (!['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
      alert('選擇題的正確答案必須是A、B、C、D其中之一！');
      return;
    }
    questionData.options = {
      A: optionA,
      B: optionB,
      C: optionC,
      D: optionD,
    };
    questionData.answer = answer.toUpperCase(); // 統一大寫存入
  } else if (type === 'truefalse') {
    if (!['true', 'false', '是', '否'].includes(answer.toLowerCase())) {
      alert('是非題的答案請填寫 True / False 或 是 / 否！');
      return;
    }
    questionData.answer = (answer === '是') ? 'true' : (answer === '否') ? 'false' : answer.toLowerCase();
  } else if (type === 'image') {
    alert('圖片題目前不支援儲存，請選其他題型！');
    return;
  }

  // 寫入 Firebase
  const newQuestionRef = push(ref(taskDatabase, '/questions'));
  set(newQuestionRef, questionData)
    .then(() => {
      alert('✅ 題目成功儲存！');
      clearForm();
    })
    .catch((error) => {
      console.error('❌ 儲存題目失敗：', error);
      alert('儲存失敗，請查看控制台錯誤訊息');
    });
}

// --- 清空表單 ---
function clearForm() {
  questionTextInput.value = '';
  correctAnswerInput.value = '';
  optionAInput.value = '';
  optionBInput.value = '';
  optionCInput.value = '';
  optionDInput.value = '';
  questionTypeSelect.selectedIndex = 0;
  choiceOptionsDiv.style.display = 'none';
  imageUploadDiv.style.display = 'none';
}

// --- 頁面一開始初始化 ---
choiceOptionsDiv.style.display = 'none';
imageUploadDiv.style.display = 'none';

console.log('task-editor.js 已正確載入！');
