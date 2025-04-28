// task-manage.js - 白貓工作室 派題系統 JS控制子

// 用來存放一課程中先預備好的題目
let preparedQuestions = [];

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

// 派送題目給全班學生
function assignQuestion(index) {
  const question = preparedQuestions[index];
  if (!question) {
    alert('\u4e0d\u5b58\u5728\u7684\u984c\u76ee！');
    return;
  }

  // 將題目送到 Firebase （這裡介入未來連線編變）
  console.log('\u6d3e\u9001\u984c\u76ee：', question);
  alert(`\u5df2\u5c07\u984c${index + 1}\u6d3e\u9001\u7d66\u73ed級\uff01`);

  // TODO: 將宜當的 Firebase 設定上传
}

// 預備演示：讓小系統一開始就有模擬題
window.onload = function() {
  preparedQuestions = [
    { text: '\u592a\u967d\u7cfb\u6709\u591a\u5c11\u9846\u884c\u661f？', type: 'choice' },
    { text: '\u6c34\u662f\u5426\u662f\u56db\u72c0物\u8cea\u4e4b\u4e00？', type: 'truefalse' }
  ];
  updateQuestionList();
};
