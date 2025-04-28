// task-editor.js - 白貓工作室 出題系統 升級版

import { taskDatabase } from "./firebase-config-task.js";
import { ref, push, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 取得 DOM 元素
const questionTypeSelect = document.getElementById('questionType');
const questionTextInput = document.getElementById('questionText');
const questionDateInput = document.getElementById('questionDate');
const courseLevelSelect = document.getElementById('courseLevel');
const subjectSelect = document.getElementById('subject');

const choiceOptionsDiv = document.getElementById('choiceOptions');
const option1Input = document.getElementById('option1');
const option2Input = document.getElementById('option2');
const option3Input = document.getElementById('option3');
const option4Input = document.getElementById('option4');
const imageUploadDiv = document.getElementById('imageUpload');

const correctAnswerSelect = document.getElementById('correctAnswerSelect');
const correctAnswerInput = document.getElementById('correctAnswerInput');
const multiAnswerCheckboxes = document.getElementById('multiAnswerCheckboxes');

const saveQuestionBtn = document.getElementById('saveQuestionBtn');

// 題型變更時切換正確答案欄位
questionTypeSelect.addEventListener('change', () => {
  const selectedType = questionTypeSelect.value;

  correctAnswerSelect.style.display = 'none';
  correctAnswerInput.style.display = 'none';
  multiAnswerCheckboxes.style.display = 'none';
  choiceOptionsDiv.style.display = 'none';
  imageUploadDiv.style.display = 'none';

  if (selectedType === 'choice' || selectedType === 'highschool') {
    choiceOptionsDiv.style.display = 'block';
    setupCorrectAnswerSelect(['1', '2', '3', '4']);
    correctAnswerSelect.style.display = 'inline-block';
  } else if (selectedType === 'multichoice') {
    choiceOptionsDiv.style.display = 'block';
    multiAnswerCheckboxes.style.display = 'block';
  } else if (selectedType === 'truefalse') {
    setupCorrectAnswerSelect(['是', '否']);
    correctAnswerSelect.style.display = 'inline-block';
  } else if (selectedType === 'shortanswer') {
    correctAnswerInput.style.display = 'inline-block';
  } else if (selectedType === 'image') {
    imageUploadDiv.style.display = 'block';
    correctAnswerInput.style.display = 'inline-block';
  }
});

// 建立正確答案的下拉選單選項
function setupCorrectAnswerSelect(options) {
  correctAnswerSelect.innerHTML = '';
  options.forEach(opt => {
    const optionElement = document.createElement('option');
    optionElement.value = opt;
    optionElement.textContent = opt;
    correctAnswerSelect.appendChild(optionElement);
  });
}

// 儲存按鈕點擊
saveQuestionBtn.addEventListener('click', saveQuestionToFirebase);

// 核心：儲存題目到 Firebase
function saveQuestionToFirebase() {
  const type = questionTypeSelect.value;
  const text = questionTextInput.value.trim();
  const date = questionDateInput.value;
  const courseLevel = courseLevelSelect.value;
  const subject = subjectSelect.value;

  if (!text) {
    alert('請輸入題目內容！');
    return;
  }
  if (!date) {
    alert('請選擇出題日期！');
    return;
  }

  let answer = null;

  if (type === 'choice' || type === 'highschool' || type === 'truefalse') {
    answer = correctAnswerSelect.value;
    if (!answer) {
      alert('請選擇正確答案！');
      return;
    }
  } else if (type === 'multichoice') {
    const selectedOptions = [];
    multiAnswerCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.checked) selectedOptions.push(cb.value);
    });
    if (selectedOptions.length === 0) {
      alert('請至少勾選一個正確答案！');
      return;
    }
    answer = selectedOptions;
  } else if (type === 'shortanswer' || type === 'image') {
    answer = correctAnswerInput.value.trim();
    if (!answer) {
      alert('請輸入正確答案！');
      return;
    }
  }

  // 準備存進Firebase的資料
  const questionData = {
    type,
    text,
    date,
    courseLevel,
    subject,
    answer
  };

  if (type === 'choice' || type === 'highschool' || type === 'multichoice') {
    questionData.options = {
      1: option1Input.value.trim(),
      2: option2Input.value.trim(),
      3: option3Input.value.trim(),
      4: option4Input.value.trim(),
    };
  }

  const newQuestionRef = push(ref(taskDatabase, '/questions'));
  set(newQuestionRef, questionData)
    .then(() => {
      alert('✅ 題目已成功儲存到Firebase！');
      clearForm();
    })
    .catch((error) => {
      console.error('❌ 儲存失敗：', error);
      alert('儲存失敗，請查看控制台錯誤訊息！');
    });
}

// 清空表單
function clearForm() {
  questionTextInput.value = '';
  questionDateInput.value = '';
  courseLevelSelect.selectedIndex = 0;
  subjectSelect.selectedIndex = 0;
  option1Input.value = '';
  option2Input.value = '';
  option3Input.value = '';
  option4Input.value = '';
  correctAnswerInput.value = '';
  correctAnswerSelect.innerHTML = '';
  multiAnswerCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

  questionTypeSelect.selectedIndex = 0;
  choiceOptionsDiv.style.display = 'none';
  correctAnswerSelect.style.display = 'none';
  correctAnswerInput.style.display = 'none';
  multiAnswerCheckboxes.style.display = 'none';
  imageUploadDiv.style.display = 'none';
}

console.log('✅ task-editor.js 已完整升級完成！');
