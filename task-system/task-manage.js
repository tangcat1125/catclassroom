// task-manage.js - 白貓工作室 派題系統篩選版（小整理版）

import { taskDatabase } from "./firebase-config-task.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
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

// 更新題目清單到畫面
function updateQuestionList() {
  questionListDiv.innerHTML = '';

  if (filteredQuestions.length === 0) {
    questionListDiv.innerHTML = '<p>找不到符合條件的題目，請調整篩選條件。</p>';
    return;
  }

  filteredQuestions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-item';
    qDiv.innerHTML = `<strong>題${index + 1}:</strong> ${q.text}<br>` +
                     `<button onclick="assignQuestion(${index})">📤 派送這題</button>`;
    questionListDiv.appendChild(qDiv);
  });
}

// 派送單一題目
function assignQuestion(index) {
  const question = filteredQuestions[index];
  if (!question) {
    alert('題目不存在！');
    return;
  }

  uploadCurrentQuestion(question);
  alert(`✅ 已將題${index + 1}派送給班級！`);
}

// 從 Firebase 載入全部題目
function loadQuestions() {
  const questionsRef = ref(taskDatabase, '/questions');
  onValue(questionsRef, (snapshot) => {
    const data = snapshot.val();
    allQuestions = [];

    if (data) {
      Object.keys(data).forEach(key => {
        allQuestions.push({ id: key, ...data[key]
