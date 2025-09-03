let words = [], allWords = [], index = 0, correct_answers = 0, wrong_answers = 0;
let reverse = false;
let currentWord = null;
let remainingWords = [];

const switchBtn = document.getElementById('switchBtn');
const fiftyBtn = document.getElementById('fiftyBtn');
const wordDiv = document.getElementById('word');
const answersDiv = document.getElementById('answers');
const progressDiv = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');

// Смена языка
switchBtn.addEventListener('click', () => {
  reverse = !reverse;
  if (currentWord) {
    drawCurrentQuestion();
  }
});

// Кнопка 50/50
fiftyBtn.addEventListener('click', useFifty);

// Загрузка списка слов
function loadWordList(listName) {
  fetch(`data/${listName}.txt`)
    .then(res => res.text())
    .then(text => {
      words = text.split('\n').map(line => {
        const [word, trans] = line.split(';').map(x => x.trim());
        return { word, trans };
      }).filter(x => x.word && x.trans);

      if (words.length < 4) {
        alert('Список должен содержать минимум 4 слова!');
        return;
      }

      // Убираем дубликаты (по паре слово;перевод)
      allWords = [...new Map(words.map(w => [`${w.word};${w.trans}`, w])).values()];

      // Создаем очередь случайных слов без повторов
      remainingWords = shuffleArray([...allWords]);

      // Сброс счётчиков
      index = 0;
      correct_answers = 0;
      wrong_answers = 0;
      currentWord = null;

      loadNextWord();
    })
    .catch(err => {
      console.error(err);
      alert('Ошибка при загрузке списка');
    });
}

// Показать следующее слово
function loadNextWord() {
  if (remainingWords.length === 0) {
    alert('Вы прошли все слова!');
    return;
  }

  currentWord = remainingWords.pop(); // достаём слово из очереди
  index++;
  drawCurrentQuestion();
}

// Отобразить текущий вопрос и варианты ответов
function drawCurrentQuestion() {
  const question = reverse ? currentWord.trans : currentWord.word;
  const correct = reverse ? currentWord.word : currentWord.trans;

  // Формируем список вариантов из всего массива, кроме правильного
  const allOptions = allWords
    .map(x => reverse ? x.word : x.trans)
    .filter(x => x !== correct);

  let options = [correct, ...shuffleArray(allOptions).slice(0, 3)];
  options = shuffleArray(options);

  // Обновляем текст вопроса
  wordDiv.textContent = question;

  // Обновляем прогресс
  progressDiv.textContent = `${index} из ${allWords.length} (${correct_answers}/${wrong_answers})`;
  progressFill.style.width = `${(index / allWords.length) * 100}%`;

  // Обновляем кнопки ответов
  const buttons = answersDiv.querySelectorAll('.answerBtn');
  buttons.forEach((btn, i) => {
    btn.textContent = options[i];
    btn.disabled = false;
    btn.className = 'answerBtn';
    btn.onclick = () => checkAnswer(btn, correct);
  });

  fiftyBtn.disabled = false;
}

// Проверка ответа
function checkAnswer(btn, correct) {
  if (btn.textContent === correct) {
    correct_answers++;
  } else {
    wrong_answers++;
  }

  const buttons = answersDiv.querySelectorAll('.answerBtn');
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
    else if (b === btn) b.classList.add('wrong');
  });

  // Задержка перед следующим вопросом
  setTimeout(() => loadNextWord(), btn.textContent === correct ? 500 : 4000);
}

// 50/50
function useFifty() {
  const correct = reverse ? currentWord.word : currentWord.trans;
  let wrongBtns = Array.from(answersDiv.querySelectorAll('.answerBtn'))
    .filter(b => b.textContent !== correct && !b.disabled);
  shuffleArray(wrongBtns);
  wrongBtns.slice(0, 2).forEach(b => {
    b.disabled = true;
    b.classList.add('disabled');
  });
  fiftyBtn.disabled = true;
}

// Перемешивание массива (Фишер–Йетс)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
