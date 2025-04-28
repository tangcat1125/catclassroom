<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>派題中心 - 白貓工作室</title>
  <link rel="stylesheet" href="task-style.css">
</head>
<body>
  <header>
    <h1>派題中心 - 白貓工作室</h1>
  </header>

  <main>
    <section class="course-info">
      <input type="text" id="courseName" placeholder="課程名稱">
      <select id="courseTime">
        <option value="40">國小一課 (40分)</option>
        <option value="45">國高中一課 (45分)</option>
      </select>
    </section>

    <section class="question-bank">
      <h2>題字清單</h2>
      <div id="questionList">
        <!-- 現有題目列出 -->
      </div>
      <button id="newQuestionBtn" onclick="window.location.href='task-editor.html'">➕ 新增題目</button>
    </section>

    <section class="assign-section">
      <h2>派送控制</h2>
      <button id="assignBtn">派送選取題目</button>
    </section>

    <section class="status-section">
      <h2>作答狀態跟蹤</h2>
      <div id="statusBoard">
        <!-- 顯示學生作答狀態 -->
      </div>
    </section>
  </main>

  <script src="task-manage.js"></script>
</body>
</html>
