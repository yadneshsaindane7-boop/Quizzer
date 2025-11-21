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

const levelDisplay = document.getElementById('level-display');
const xpFill = document.getElementById('xp-fill');
const xpText = document.getElementById('xp-text');
const streakPill = document.getElementById('streak-pill');

const bestStreakDisplay = document.getElementById('best-streak-display');
const highScoreDisplay = document.getElementById('high-score-display');
const quizzesPlayedDisplay = document.getElementById('quizzes-played-display');

const achievementToast = document.getElementById('achievement-toast');
const achievementTitle = document.getElementById('achievement-title');
const achievementDesc = document.getElementById('achievement-desc');
const confettiContainer = document.getElementById('confetti-container');

// Sounds
const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');
const soundClick = document.getElementById('sound-click');

let allQuestions = [];
let shuffledQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizActive = false;
let currentCategory = 'all';

// Gamification state
let playerXP = 0;
let playerLevel = 1;
let highScore = 0;
let bestStreak = 0;
let quizzesPlayed = 0;
let unlockedAchievements = new Set();
let currentStreak = 0;

// ────────────────────────────────
// Achievements config
// ────────────────────────────────
const achievementsConfig = [
  {
    id: 'first_quiz',
    title: 'First Blood',
    desc: 'Completed your first quiz.',
    condition: (ctx, stats) => stats.quizzesPlayed >= 1
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    desc: 'Scored 100% on a quiz.',
    condition: (ctx) => ctx.percent === 100
  },
  {
    id: 'marvel_expert',
    title: 'Marvel Expert',
    desc: 'Scored 90%+ on a Marvel quiz.',
    condition: (ctx) => ctx.category === 'Marvel' && ctx.percent >= 90
  },
  {
    id: 'streak_5',
    title: 'On Fire',
    desc: 'Reached a streak of 5 correct answers.',
    condition: (ctx, stats) => ctx.streak >= 5 || stats.bestStreak >= 5
  },
  {
    id: 'level_5',
    title: 'Level 5',
    desc: 'Reached level 5.',
    condition: (ctx, stats) => stats.level >= 5
  },
  {
    id: 'grinder',
    title: 'Quiz Grinder',
    desc: 'Completed 10 quizzes.',
    condition: (ctx, stats) => stats.quizzesPlayed >= 10
  }
];

// ────────────────────────────────
// Player state persistence
// ────────────────────────────────
function loadPlayerState() {
  try {
    const raw = localStorage.getItem('quizzer_player');
    if (!raw) return;
    const data = JSON.parse(raw);
    playerXP = data.xp ?? 0;
    playerLevel = data.level ?? 1;
    highScore = data.highScore ?? 0;
    bestStreak = data.bestStreak ?? 0;
    quizzesPlayed = data.quizzesPlayed ?? 0;
    if (Array.isArray(data.achievements)) {
      unlockedAchievements = new Set(data.achievements);
    }
  } catch (e) {
    console.error('Failed to load player state', e);
  }
}

function savePlayerState() {
  try {
    const data = {
      xp: playerXP,
      level: playerLevel,
      highScore,
      bestStreak,
      quizzesPlayed,
      achievements: Array.from(unlockedAchievements)
    };
    localStorage.setItem('quizzer_player', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save player state', e);
  }
}

function xpForNextLevel(level) {
  return 100 * level;
}

function updateXPUI() {
  if (!levelDisplay || !xpFill || !xpText) return;
  const needed = xpForNextLevel(playerLevel);
  const ratio = needed > 0 ? Math.min(playerXP / needed, 1) : 0;
  xpFill.style.width = `${Math.round(ratio * 100)}%`;
  levelDisplay.textContent = String(playerLevel);
  xpText.textContent = `${playerXP} XP`;
}

function addXP(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  playerXP += amount;
  let leveledUp = false;
  while (playerXP >= xpForNextLevel(playerLevel)) {
    playerXP -= xpForNextLevel(playerLevel);
    playerLevel++;
    leveledUp = true;
  }
  if (leveledUp) {
    showLevelUpAnimation();
  }
  updateXPUI();
  savePlayerState();
}

function showLevelUpAnimation() {
  if (!levelDisplay) return;
  levelDisplay.classList.add('streak-pill', 'hot');
  setTimeout(() => {
    levelDisplay.classList.remove('streak-pill', 'hot');
  }, 600);
}

function updateStreakUI() {
  if (!streakPill) return;
  streakPill.textContent = `🔥 Streak: ${currentStreak}`;
  if (currentStreak >= 3) streakPill.classList.add('hot');
  else streakPill.classList.remove('hot');
}

function updateSummaryMeta() {
  if (bestStreakDisplay) bestStreakDisplay.textContent = String(bestStreak);
  if (highScoreDisplay) highScoreDisplay.textContent = String(highScore);
  if (quizzesPlayedDisplay) quizzesPlayedDisplay.textContent = String(quizzesPlayed);
}

// ────────────────────────────────
// Initial load
// ────────────────────────────────
loadPlayerState();
updateXPUI();
updateStreakUI();
updateSummaryMeta();

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
  currentStreak = 0;
  updateStreakUI();
  liveScore.textContent = 'Score: 0';
  feedbackText.classList.add('hidden');
  statusText.textContent = '';

  currentCategory = categorySelect.value;
  const requestedCount = parseInt(questionCountSelect.value, 10);

  let filtered =
    currentCategory === 'all'
      ? [...allQuestions]
      : allQuestions.filter(q => q.category === currentCategory);

  const available = filtered.length;

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
  void questionContainerEl.offsetWidth; // restart animation
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
// ANSWER SELECTION + GAMIFICATION
// ────────────────────────────────
function selectAnswer(selectedButton) {
  if (!quizActive) return;

  const isCorrect = selectedButton.dataset.correct === 'true';

  if (isCorrect) {
    score++;
    currentStreak++;
    feedbackText.textContent = 'Correct!';
    playSound(soundCorrect);

    // XP: base + streak bonus every 3
    let xpGain = 10;
    if (currentStreak > 0 && currentStreak % 3 === 0) {
      xpGain += 5;
    }
    addXP(xpGain);
  } else {
    feedbackText.textContent = 'Wrong!';
    currentStreak = 0;
    playSound(soundWrong);
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  updateStreakUI();
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

  feedbackText.classList.remove('hidden');
  nextButton.classList.remove('hidden');
}

// ────────────────────────────────
// END QUIZ + ACHIEVEMENTS + CONFETTI
// ────────────────────────────────
function endQuiz() {
  quizActive = false;
  quizContainer.classList.add('hidden');
  scoreContainer.classList.remove('hidden');
  startBtn.classList.remove('hidden');
  nextButton.classList.add('hidden');
  progressWrapper.classList.add('hidden');

  const total = shuffledQuestions.length;
  const percent = total > 0 ? (score / total) * 100 : 0;

  if (score > highScore) {
    highScore = score;
  }
  quizzesPlayed++;

  // High score bonus XP
  if (percent >= 80) {
    addXP(20);
  }
  if (percent === 100) {
    addXP(30);
  }

  savePlayerState();
  updateSummaryMeta();

  let praise =
    percent >= 90
      ? "You're a true pop culture god! 🔥"
      : percent >= 70
      ? 'Great job! 👊'
      : percent >= 50
      ? 'Not bad!'
      : 'You need to watch more movies and anime. 📚';

  scoreElement.textContent = `${score} / ${total} — ${praise}`;

  const ctx = {
    percent: Math.round(percent),
    category: currentCategory,
    score,
    totalQuestions: total,
    streak: currentStreak
  };
  const stats = {
    level: playerLevel,
    xp: playerXP,
    highScore,
    bestStreak,
    quizzesPlayed
  };

  checkAchievements(ctx, stats);

  if (percent >= 80) {
    launchConfetti();
  }
}

// ────────────────────────────────
// ACHIEVEMENTS
// ────────────────────────────────
function checkAchievements(ctx, stats) {
  achievementsConfig.forEach(ach => {
    if (unlockedAchievements.has(ach.id)) return;
    try {
      if (ach.condition(ctx, stats)) {
        unlockAchievement(ach);
      }
    } catch (e) {
      console.error('Achievement condition error', ach.id, e);
    }
  });
}

function unlockAchievement(ach) {
  unlockedAchievements.add(ach.id);
  savePlayerState();
  showAchievementToast(ach.title, ach.desc);
}

let toastTimeout = null;
function showAchievementToast(title, desc) {
  if (!achievementToast) return;
  achievementTitle.textContent = `Achievement Unlocked: ${title}`;
  achievementDesc.textContent = desc;

  achievementToast.classList.remove('hidden');
  achievementToast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    achievementToast.classList.remove('show');
    setTimeout(() => {
      achievementToast.classList.add('hidden');
    }, 250);
  }, 2600);
}

// ────────────────────────────────
/* CONFETTI */
// ────────────────────────────────
function launchConfetti() {
  if (!confettiContainer) return;
  confettiContainer.innerHTML = '';

  const pieces = 120;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's';
    piece.style.background = randomGreenNeon();
    confettiContainer.appendChild(piece);
  }

  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 2600);
}

function randomGreenNeon() {
  const h = 120 + (Math.random() * 40 - 20); // around green
  const s = 70 + Math.random() * 20;
  const l = 45 + Math.random() * 15;
  return `hsl(${h}, ${s}%, ${l}%)`;
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
