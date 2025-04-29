// task-manage.js - 白貓工作室 派題系統新版（支援手寫派題）

import { taskDatabase } from "./firebase-config-task.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { uploadCurrentQuestion } from "./task-database.js";

// 題目暫存
let allQuestions = [];
let filteredQuestions = [];

// DOM元素
const questionListDiv = document.getElementById('questionList');
const filterDateInput = document.getElementById('filterDate');
const filterCourseLevelSelect = document.getElementById('filterCourseLevel');
const filterSubjectSelect = document.getElementById('filterSubject');
const filterBtn = document.getElementById('filterBtn');

// 綁定篩選按鈕
filterBtn.addEventListener('click', updateFilter);

// 更新畫面上的題目列表
function updateQuestionList() {
  questionListDiv.innerHTML = '';

  if (filteredQuestions.length === 0) {
    questionListDiv.innerHTML = '<p>找不到符合條件的題目，請調整篩選條件。</p>';
    return;
  }

  filteredQuestions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-item';
    qDiv.innerHTML = `
      <strong>題${index + 1}:</strong> ${q.text}<br>
      <button onclick="assignQuestion(${index})">📤 派送這題</button>
      <button onclick="assignHandwriteQuestion(${index})">✏️ 手寫派題</button>
      <hr>
    `;
    questionListDiv.appendChild(qDiv);
  });
}

// 派送一般題到 /currentQuestion
window.assignQuestion = function(index) {
  const question = filteredQuestions[index];
  if (!question) {
    alert('題目不存在！');
    return;
  }
  uploadCurrentQuestion(question);
  alert(`✅ 已將題${index + 1}派送給班級！`);
}

// 派送手寫題到 /teacher/question
window.assignHandwriteQuestion = function(index) {
  const question = filteredQuestions[index];
  if (!question) {
    alert('題目不存在！');
    return;
  }

  const now = Date.now();
  const handwriteData = {
    id: question.id || `Q-${now}`,
    timestamp: now,
    content: question.text
  };

  const teacherQuestionRef = ref(taskDatabase, '/teacher/question');
  set(teacherQuestionRef, handwriteData)
    .then(() => {
      alert(`✅ 已派送到手寫作答系統！`);
    })
    .catch((error) => {
      console.error('❌ 派送失敗：', error);
      alert('派送失敗，請查看主控台(console)');
    });
}

// 更新篩選結果
function updateFilter() {
  const filterDate = filterDateInput.value;
  const filterCourseLevel = filterCourseLevelSelect.value;
  const filterSubject = filterSubjectSelect.value;

  filteredQuestions = allQuestions.filter(q => {
    const matchDate = filterDate ? q.date === filterDate : true;
    const matchCourse = filterCourseLevel ? q.courseLevel === filterCourseLevel : true;
    const matchSubject = filterSubject ? q.subject === filterSubject : true;
    return matchDate && matchCourse && matchSubject;
  });

  updateQuestionList();
}

// 讀取所有題目
function loadQuestions() {
  const questionsRef = ref(taskDatabase, '/questions');
  onValue(questionsRef, (snapshot) => {
    const data = snapshot.val();
    allQuestions = [];

    if (data) {
      Object.keys(data).forEach(key => {
        allQuestions.push({ id: key, ...data[key] });
      });
    }
    filteredQuestions = allQuestions;
    updateQuestionList();
  });
}

loadQuestions();
