<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>派題中心 - 白貓工作室</title>
  <link rel="stylesheet" href="task-style.css">
  <style>
    /* 添加漂出Modal样式 */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      justify-content: center;
      align-items: center;
    }
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
    }
    .modal-header {
      font-size: 20px;
      margin-bottom: 1rem;
    }
    .close-btn {
      float: right;
      font-size: 24px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header>
    <h1>派題中心 - 白貓工作室</h1>
    <button id="newQuestionBtn">➕ 新增題目</button>
  </header>

  <main>
    <section class="question-bank">
      <h2>題字清單</h2>
      <div id="questionList">
        <!-- 題目列出區 -->
      </div>
    </section>
  </main>

  <!-- 新增題目 Modal -->
  <div id="questionModal" class="modal">
    <div class="modal-content">
      <span class="close-btn" id="closeModal">&times;</span>
      <div class="modal-header">新增題目</div>
      <label>題目內容：</label>
      <textarea id="modalQuestionText" rows="4" placeholder="請輸入題目。"></textarea>

      <label>題型：</label>
      <select id="modalQuestionType">
        <option value="choice">選擇題</option>
        <option value="truefalse">是非題</option>
      </select>

      <div id="choiceOptionsArea">
        <label>A選項：</label><input type="text" id="optionA"><br>
        <label>B選項：</label><input type="text" id="optionB"><br>
        <label>C選項：</label><input type="text" id="optionC"><br>
        <label>D選項：</label><input type="text" id="optionD"><br>
      </div>

      <label>正確答案：</label>
      <input type="text" id="modalCorrectAnswer" placeholder="請輸入正確選項">

      <button id="aiHelperBtn">🤖 AI輔助生成題目</button>
      <div>
        <small>推薦Prompt：請用中文為國小五年級學生出一題四選一選擇題，主題為『太陽系』，並正確標示答案。</small>
      </div>

      <button id="saveQuestionModalBtn">儲存題目</button>
    </div>
  </div>

  <script src="task-manage.js"></script>
  <script>
    // 打開和關閉 Modal
    const newQuestionBtn = document.getElementById('newQuestionBtn');
    const questionModal = document.getElementById('questionModal');
    const closeModal = document.getElementById('closeModal');

    newQuestionBtn.onclick = () => {
      questionModal.style.display = 'flex';
    };

    closeModal.onclick = () => {
      questionModal.style.display = 'none';
    };

    window.onclick = (e) => {
      if (e.target == questionModal) {
        questionModal.style.display = 'none';
      }
    };
  </script>
</body>
</html>
