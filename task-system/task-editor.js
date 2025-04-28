// task-manage.js - 白貓工作室 前端本地派題系統

// 用來存放所有預備的題目
let preparedQuestions = [];

// 記錄目前派送出去的題目
let currentQuestion = null;

// 新增一題
function addQuestion(questionObj) {
  preparedQuestions.push(questionObj);
  updateQuestionList();
}

// 更新題目清單顯示
function updateQuestionList() {
  const listDiv = document.getElementById('questionList');
  listDiv.innerHTML = '';

  if (preparedQuestions.length === 0) {
    listDiv.innerHTML = '<p>\u76ee\u524d\u6c92\u6709\u4efb\u4f55\u984c\u76ee，\u8acb\u65b0\u589e\u4e00\u984c！</p>';
    return;
  }

  preparedQuestions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-item';
    qDiv.innerHTML = `<strong>\u984c${index + 1}:</strong> ${q.text}<br>` +
                     `<button onclick="assignQuestion(${index})">\u6d3e\u9001\u6b64\u984c</button>`;
    listDiv.appendChild(qDiv);
  });
}

// 派送題目（不再上傳 Firebase，只是本地更新）
function assignQuestion(index) {
  const question = preparedQuestions[index];
  if (!question) {
    alert('\u4e0d\u5b58\u5728\u7684\u984c\u76ee！');
    return;
  }

  // 把當前題目存到 currentQuestion
  currentQuestion = question;
  alert(`\u5df2\u6d3e\u9001\u984c${index + 1}\uff01\n\u984c目內容：${question.text}`);

  console.log('Current Question =', currentQuestion);
}

// 預備演示：打開頁面就有模擬題
window.onload = function() {
  preparedQuestions = [
    { text: '\u592a\u967d\u7cfb\u6709\u591a\u5c11\u9846\u884c\u661f？', type: 'choice', options: { A: '7顆', B: '8顆', C: '9顆', D: '10顆' }, correctAnswer: 'B' },
    { text: '\u6c34\u662f\u5426\u662f\u56db\u72c0物\u8cea\u4e4b\u4e00？', type: 'truefalse', correctAnswer: 'true' }
  ];
  updateQuestionList();
};
