const startBtn = document.getElementById('start-btn');
const quizContainer = document.getElementById('quiz');
const questionElement = document.getElementById('question');
const answerButtons = document.getElementById('answer-buttons');
const nextButton = document.getElementById('next-btn');
const scoreContainer = document.getElementById('score-container');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-btn');
const feedbackText = document.getElementById('answer-feedback');

let shuffledQuestions, currentQuestionIndex, score;

const questions = [
  // Marvel
  { category: 'Marvel', question: "Who is known as the 'First Avenger'?", answers: [ { text: "Iron Man", correct: false },{ text: "Captain America", correct: true },{ text: "Thor", correct: false },{ text: "Hulk", correct: false } ] },
  { category: 'Marvel', question: "What is Thor's hammer called?", answers: [ { text: "Mjolnir", correct: true },{ text: "Stormbreaker", correct: false },{ text: "Gungnir", correct: false },{ text: "Thunderstrike", correct: false } ] },
  { category: 'Marvel', question: "Who is the leader of the X-Men?", answers: [ { text: "Cyclops", correct: true },{ text: "Wolverine", correct: false },{ text: "Professor X", correct: true },{ text: "Magneto", correct: false } ] },
  { category: 'Marvel', question: "Which Marvel character is blind and uses echolocation?", answers: [ { text: "Daredevil", correct: true },{ text: "Blade", correct: false },{ text: "Ghost Rider", correct: false },{ text: "Punisher", correct: false } ] },
  { category: 'Marvel', question: "Captain America's shield is made of?", answers: [ { text: "Vibranium", correct: true },{ text: "Adamantium", correct: false },{ text: "Uru", correct: false },{ text: "Titanium", correct: false } ] },

  // DC
  { category: 'DC', question: "Superhero from planet Krypton is?", answers: [ { text: "Superman", correct: true },{ text: "Batman", correct: false },{ text: "Wonder Woman", correct: false },{ text: "Green Lantern", correct: false } ] },
  { category: 'DC', question: "Who is the fastest superhero in DC?", answers: [ { text: "The Flash", correct: true },{ text: "Superman", correct: false },{ text: "Green Arrow", correct: false },{ text: "Aquaman", correct: false } ] },
  { category: 'DC', question: "Aquaman's real name is?", answers: [ { text: "Arthur Curry", correct: true },{ text: "Orin", correct: false },{ text: "Mera", correct: false },{ text: "Clark Kent", correct: false } ] },
  { category: 'DC', question: "Hero who uses lasso of truth?", answers: [ { text: "Wonder Woman", correct: true },{ text: "Zatanna", correct: false },{ text: "Batgirl", correct: false },{ text: "Hawkgirl", correct: false } ] },
  { category: 'DC', question: "Who founded the Justice League?", answers: [ { text: "Martian Manhunter", correct: true },{ text: "Batman", correct: false },{ text: "Superman", correct: false },{ text: "Wonder Woman", correct: false } ] },

  // MCU
  { category: 'MCU', question: "Which Infinity Stone does Vision have?", answers: [ { text: "Mind Stone", correct: true },{ text: "Time Stone", correct: false },{ text: "Power Stone", correct: false },{ text: "Space Stone", correct: false } ] },
  { category: 'MCU', question: "Where did Tony Stark build his first Iron Man suit?", answers: [ { text: "Cave in Afghanistan", correct: true },{ text: "Stark Tower", correct: false },{ text: "New York", correct: false },{ text: "S.H.I.E.L.D base", correct: false } ] },
  { category: 'MCU', question: "What organization does Captain America join?", answers: [ { text: "S.H.I.E.L.D.", correct: true },{ text: "H.Y.D.R.A.", correct: false },{ text: "The Avengers", correct: false },{ text: "A.I.M.", correct: false } ] },
  { category: 'MCU', question: "Who is Black Panther's sister?", answers: [ { text: "Shuri", correct: true },{ text: "Nakia", correct: false },{ text: "Okoye", correct: false },{ text: "Ramonda", correct: false } ] },
  { category: 'MCU', question: "Spider-Man first appeared in MCU in?", answers: [ { text: "Captain America: Civil War", correct: true },{ text: "Spider-Man: Homecoming", correct: false },{ text: "Avengers: Infinity War", correct: false },{ text: "Iron Man 3", correct: false } ] },

  // Hollywood
  { category: 'Hollywood', question: "Who directed 'Inception'?", answers: [ { text: "Christopher Nolan", correct: true },{ text: "Steven Spielberg", correct: false },{ text: "James Cameron", correct: false },{ text: "Quentin Tarantino", correct: false } ] },
  { category: 'Hollywood', question: "Which movie features the quote 'I'll be back'?", answers: [ { text: "The Terminator", correct: true },{ text: "Rambo", correct: false },{ text: "Predator", correct: false },{ text: "Robocop", correct: false } ] },
  { category: 'Hollywood', question: "Ship's name in 'Alien' film?", answers: [ { text: "Nostromo", correct: true },{ text: "Serenity", correct: false },{ text: "Galactica", correct: false },{ text: "Discovery", correct: false } ] },
  { category: 'Hollywood', question: "Who starred as Jack Dawson in 'Titanic'?", answers: [ { text: "Leonardo DiCaprio", correct: true },{ text: "Brad Pitt", correct: false },{ text: "Tom Cruise", correct: false },{ text: "Johnny Depp", correct: false } ] },
  { category: 'Hollywood', question: "Best Picture Oscar of 2020?", answers: [ { text: "Parasite", correct: true },{ text: "1917", correct: false },{ text: "Joker", correct: false },{ text: "Once Upon a Time in Hollywood", correct: false } ] },

  // Extra questions to give more volume
  { category: 'Marvel', question: "Which hero is known as the 'Merc with a Mouth'?", answers: [ { text: "Deadpool", correct: true },{ text: "Wolverine", correct: false },{ text: "Spider-Man", correct: false },{ text: "Iron Man", correct: false } ] },
  { category: 'DC', question: "Where is Batman's primary base of operation?", answers: [ { text: "Gotham City", correct: true },{ text: "Metropolis", correct: false },{ text: "Central City", correct: false },{ text: "Star City", correct: false } ] },
  { category: 'MCU', question: "Who was the director of 'Guardians of the Galaxy'?", answers: [ { text: "James Gunn", correct: true },{ text: "Joss Whedon", correct: false },{ text: "Ryan Coogler", correct: false },{ text: "Taika Waititi", correct: false } ] },
  { category: 'Hollywood', question: "In 'The Matrix', what color pill does Neo take?", answers: [ { text: "Red", correct: true },{ text: "Blue", correct: false },{ text: "Green", correct: false },{ text: "Black", correct: false } ] },
  { category: 'Marvel', question: "Wakanda is located in which continent?", answers: [ { text: "Africa", correct: true },{ text: "Asia", correct: false },{ text: "South America", correct: false },{ text: "Europe", correct: false } ] },
];

startBtn.addEventListener('click', startQuiz);
nextButton.addEventListener('click', () => {
  currentQuestionIndex++;
  feedbackText.classList.add('hidden');
  setNextQuestion();
});
restartButton.addEventListener('click', () => {
  startQuiz();
  scoreContainer.classList.add('hidden');
  feedbackText.classList.add('hidden');
});

function startQuiz() {
  score = 0;
  scoreElement.textContent = score;
  currentQuestionIndex = 0;
  shuffledQuestions = questions.sort(() => Math.random() - 0.5);
  quizContainer.classList.remove('hidden');
  scoreContainer.classList.add('hidden');
  startBtn.classList.add('hidden');
  nextButton.classList.add('hidden');
  feedbackText.classList.add('hidden');
  setNextQuestion();
}

function setNextQuestion() {
  resetState();
  if (currentQuestionIndex >= shuffledQuestions.length) {
    endQuiz();
    return;
  }
  showQuestion(shuffledQuestions[currentQuestionIndex]);
}

function showQuestion(question) {
  questionElement.textContent = question.question;
  // Shuffle answers to randomize button order
  let shuffledAnswers = question.answers
    .map(value => ({ value, sort: Math.random() })) // attach random sort keys
    .sort((a, b) => a.sort - b.sort)               // sort by random keys
    .map(({ value }) => value);                     // extract shuffled values

  shuffledAnswers.forEach(answer => {
    const button = document.createElement('button');
    button.textContent = answer.text;
    button.classList.add('btn');
    button.addEventListener('click', () => selectAnswer(button, answer.correct));
    answerButtons.appendChild(button);
  });
}


function resetState() {
  clearStatusClass(document.body);
  nextButton.classList.add('hidden');
  while (answerButtons.firstChild) {
    answerButtons.removeChild(answerButtons.firstChild);
  }
}

function selectAnswer(button, correct) {
  if (correct) {
    feedbackText.textContent = "Correct! Well done.";
    score++;
    scoreElement.textContent = score;
  } else {
    feedbackText.textContent = "Wrong Answer! Better luck on the next.";
  }
  feedbackText.classList.remove('hidden');

  setStatusClass(button, correct);
  Array.from(answerButtons.children).forEach(btn => {
    btn.disabled = true;
    if (btn !== button) {
      setStatusClass(btn, false);
    }
  });
  nextButton.classList.remove('hidden');
}

function setStatusClass(element, correct) {
  clearStatusClass(element);
  if (correct) element.classList.add('correct');
  else element.classList.add('wrong');
}

function clearStatusClass(element) {
  element.classList.remove('correct');
  element.classList.remove('wrong');
}

function endQuiz() {
  quizContainer.classList.add('hidden');
  scoreContainer.classList.remove('hidden');
  startBtn.classList.remove('hidden');
  nextButton.classList.add('hidden');
  feedbackText.classList.add('hidden');

  let totalQuestions = shuffledQuestions.length;
  let praise = '';

  let scorePercent = (score / totalQuestions) * 100;
  if (scorePercent >= 90) praise = "You're a true pop culture nerd! 👏";
  else if (scorePercent >= 50) praise = "Well done! You have good knowledge.";
  else praise = "Looks like you need to increase your pop culture knowledge! 📚";

  scoreElement.textContent = `${score} / ${totalQuestions}. ${praise}`;
}
