const QUESTIONS_URL = 'questions.json';

const startBtn = document.getElementById('start-btn');
const quizContainer = document.getElementById('quiz');
const questionElement = document.getElementById('question');
const answerButtons = document.getElementById('answer-buttons');
const nextButton = document.getElementById('next-btn');
const scoreContainer = document.getElementById('score-container');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-btn');
const feedbackText = document.getElementById('answer-feedback');
const statusText = document.getElementById('status-text');
const liveScore = document.getElementById('live-score');
const questionCounter = document.getElementById('question-counter');
const categorySelect = document.getElementById('category-select');
const questionCountSelect = document.getElementById('question-count');
const questionContainerEl = document.getElementById('question-container');
const progressWrapper = document.getElementById('progress-wrapper');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// Sounds
const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');
const soundClick = document.getElementById('sound-click');

let allQuestions = [];
let shuffledQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizActive = false;

// ────────────────────────────────
// FETCH QUESTIONS.JSON
// ────────────────────────────────
fetch(QUESTIONS_URL)
  .then(res => {
    if (!res.ok) throw new Error('Failed to load questions.json');
    return res.json();
  })
  .then(data => {
    if (!Array.isArray(data) || !data.length) {
      throw new Error('Invalid questions.json format');
    }
    allQuestions = data;
    statusText.textContent = 'Questions loaded. Pick category & amount.';
    startBtn.disabled = false;
  })
  .catch(err => {
    console.error(err);
    statusText.textContent = 'Error loading questions.json.';
    startBtn.disabled = true;
  });

// ────────────────────────────────
// EVENT LISTENERS
// ────────────────────────────────
startBtn.addEventListener('click', () => {
  playSound(soundClick);
  startQuiz();
});

nextButton.addEventListener('click', () => {
  if (!quizActive) return;
  playSound(soundClick);
  currentQuestionIndex++;
  feedbackText.classList.add('hidden');
  setNextQuestion();
});

restartButton.addEventListener('click', () => {
  playSound(soundClick);
  scoreContainer.classList.add('hidden');
  startQuiz();
});

// ────────────────────────────────
// START QUIZ
// ────────────────────────────────
function startQuiz() {
  if (!allQuestions.length) return;

  quizActive = true;
  score = 0;
  currentQuestionIndex = 0;
  liveScore.textContent = 'Score: 0';
  feedbackText.classList.add('hidden');
  statusText.textContent = '';

  const selectedCategory = categorySelect.value;
  const requestedCount = parseInt(questionCountSelect.value, 10);

  let filtered =
    selectedCategory === 'all'
      ? [...allQuestions]
      : allQuestions.filter(q => q.category === selectedCategory);

  let available = filtered.length;

  if (available === 0) {
    statusText.textContent = 'No questions available for this category.';
    quizActive = false;
    return;
  }

  if (available < requestedCount) {
    statusText.textContent =
      `Only ${available} questions available for this category. Starting with ${available}.`;
  } else {
    statusText.textContent = '';
  }

  shuffledQuestions = shuffleArray(filtered).slice(
    0,
    Math.min(requestedCount, available)
  );

  progressWrapper.classList.remove('hidden');
  setProgress(0);

  quizContainer.classList.remove('hidden');
  scoreContainer.classList.add('hidden');
  startBtn.classList.add('hidden');
  nextButton.classList.add('hidden');

  setNextQuestion();
}

// ────────────────────────────────
// QUESTION FLOW
// ────────────────────────────────
function setNextQuestion() {
  resetState();

  if (currentQuestionIndex >= shuffledQuestions.length) {
    setProgress(1);
    endQuiz();
    return;
  }

  const current = currentQuestionIndex + 1;
  const total = shuffledQuestions.length;
  questionCounter.textContent = `Question ${current} / ${total}`;

  nextButton.textContent = current === total ? 'Finish' : 'Next';

  setProgress((current - 1) / total);
  showQuestion(shuffledQuestions[currentQuestionIndex]);
}

function showQuestion(question) {
  // trigger fade animation
  questionContainerEl.classList.remove('fade-in');
  // force reflow to restart animation
  void questionContainerEl.offsetWidth;
  questionContainerEl.classList.add('fade-in');

  questionElement.textContent = question.question;

  const shuffledAnswers = shuffleArray(question.answers);

  shuffledAnswers.forEach(answer => {
    const button = document.createElement('button');
    button.textContent = answer.text;
    button.classList.add('answer-btn');
    button.dataset.correct = String(!!answer.correct);
    button.addEventListener('click', () => selectAnswer(button));
    answerButtons.appendChild(button);
  });
}

function resetState() {
  while (answerButtons.firstChild) {
    answerButtons.removeChild(answerButtons.firstChild);
  }
  feedbackText.classList.add('hidden');
  nextButton.classList.add('hidden');
}

// ────────────────────────────────
// ANSWER SELECTION
// ────────────────────────────────
function selectAnswer(selectedButton) {
  if (!quizActive) return;

  const isCorrect = selectedButton.dataset.correct === 'true';

  if (isCorrect) {
    score++;
    feedbackText.textContent = 'Correct!';
    playSound(soundCorrect);
  } else {
    feedbackText.textContent = 'Wrong!';
    playSound(soundWrong);
  }
  feedbackText.classList.remove('hidden');

  liveScore.textContent = `Score: ${score}`;

  const buttons = Array.from(answerButtons.children);

  buttons.forEach(btn => {
    btn.disabled = true;
    const btnIsCorrect = btn.dataset.correct === 'true';
    if (btnIsCorrect) {
      btn.classList.add('correct');
    } else if (btn === selectedButton && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  nextButton.classList.remove('hidden');
}

// ────────────────────────────────
// END QUIZ
// ────────────────────────────────
function endQuiz() {
  quizActive = false;
  quizContainer.classList.add('hidden');
  scoreContainer.classList.remove('hidden');
  startBtn.classList.remove('hidden');
  nextButton.classList.add('hidden');
  progressWrapper.classList.add('hidden');

  const total = shuffledQuestions.length;
  const percent = (score / total) * 100;

  let praise =
    percent >= 90
      ? "You're a true pop culture god! 🔥"
      : percent >= 70
      ? 'Great job! 👊'
      : percent >= 50
      ? 'Not bad!'
      : 'You need to watch more movies and anime. 📚';

  scoreElement.textContent = `${score} / ${total} — ${praise}`;
}

// ────────────────────────────────
// UTILITY
// ────────────────────────────────
function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function setProgress(ratio) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const percent = Math.round(clamped * 100);
  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }
  if (progressText) {
    progressText.textContent = `${percent}%`;
  }
}

function playSound(el) {
  if (!el) return;
  try {
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch {
    // ignore
  }
}
