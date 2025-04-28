// task-editor.js - 白貓工作室 題目編輯控制子

// 保存新題目
function saveQuestion() {
  const type = document.getElementById('questionType').value;
  const text = document.getElementById('questionText').value.trim();
  const correctAnswer = document.getElementById('correctAnswer').value.trim();

  if (!text || !correctAnswer) {
    alert('\u984c目或\u6b63\u78ba\u7b54\u6848\u4e0d\u80fd\u7a7a\uff01');
    return;
  }

  let questionObj = {
    type: type,
    text: text,
    correctAnswer: correctAnswer
  };

  if (type === 'choice') {
    questionObj.options = {
      A: document.getElementById('optionA').value.trim(),
      B: document.getElementById('optionB').value.trim(),
      C: document.getElementById('optionC').value.trim(),
      D: document.getElementById('optionD').value.trim()
    };
  }

  // TODO: 上傳圖片元素可以在以後進行加強

  // 將新題目加入到 preparedQuestions
  if (typeof addQuestion === 'function') {
    addQuestion(questionObj);
    alert('\u5df2新增題目！');
    clearEditor();
  } else {
    console.error('addQuestion 函數未找到！');
  }
}

// 清空編輯區
function clearEditor() {
  document.getElementById('questionText').value = '';
  document.getElementById('correctAnswer').value = '';
  document.getElementById('optionA').value = '';
  document.getElementById('optionB').value = '';
  document.getElementById('optionC').value = '';
  document.getElementById('optionD').value = '';
}

// 操作上展：依題目類型顯示不同頁面元素
const questionTypeSelect = document.getElementById('questionType');
questionTypeSelect.addEventListener('change', function() {
  const selectedType = this.value;
  document.getElementById('choiceOptions').style.display = (selectedType === 'choice') ? 'block' : 'none';
  document.getElementById('imageUpload').style.display = (selectedType === 'image') ? 'block' : 'none';
});

// 組對 save button
const saveBtn = document.getElementById('saveQuestionBtn');
saveBtn.addEventListener('click', saveQuestion);
