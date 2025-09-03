let words = [], allWords = [], index = 0, correct_answers = 0, wrong_answers = 0;
let reverse = false, currentWord = null, remainingWords = [];
let inputMode = false;

const switchBtn = document.getElementById('switchBtn');
const modeBtn = document.getElementById('modeBtn');
const fiftyBtn = document.getElementById('fiftyBtn');
const wordDiv = document.getElementById('word');
const answersDiv = document.getElementById('answers');
const inputModeDiv = document.getElementById('inputModeDiv');
const answerInput = document.getElementById('answerInput');
const feedback = document.getElementById('feedback');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const submitWrapper = document.getElementById('submitWrapper');
const progressDiv = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');

const listSelect = document.getElementById('listSelect');
const addListToggle = document.getElementById('addListToggle');
const addListForm = document.getElementById('addListForm');
const addListBtn = document.getElementById('addListBtn');
const newListName = document.getElementById('newListName');
const newListText = document.getElementById('newListText');

// Смена языка
switchBtn.addEventListener('click', () => {
  reverse = !reverse;
  if (currentWord) drawCurrentQuestion();
});

// 50/50
fiftyBtn.addEventListener('click', useFifty);

// Кнопка режима ввода
modeBtn.addEventListener('click', () => {
  inputMode = !inputMode;
  if (inputMode) {
    answersDiv.style.display = 'none';
    inputModeDiv.style.display = 'block';
    submitWrapper.style.display = 'block';
    fiftyBtn.style.display = 'none';
    modeBtn.textContent = '🎛️';
    focusInputSoon();
  } else {
    answersDiv.style.display = 'grid';
    inputModeDiv.style.display = 'none';
    submitWrapper.style.display = 'none';
    fiftyBtn.style.display = 'inline-block';
    modeBtn.textContent = '✍️';
  }
  if (currentWord) drawCurrentQuestion();
});

// Кнопка отправки в режиме ввода
submitAnswerBtn.addEventListener('click', e => { e.preventDefault(); submitFromButton(); });
submitAnswerBtn.addEventListener('touchstart', e => { e.preventDefault(); submitFromButton(); }, { passive: false });
submitAnswerBtn.addEventListener('mousedown', e => e.preventDefault());

function submitFromButton() {
  if (!currentWord) return;
  const correct = reverse ? currentWord.word : currentWord.trans;
  checkTextAnswer(answerInput.value.trim(), correct);
}

function focusInputSoon() {
  if (!inputMode) return;
  requestAnimationFrame(() => {
    answerInput.focus({ preventScroll: true });
    const len = answerInput.value.length;
    try { answerInput.setSelectionRange(len, len); } catch (e) {}
  });
}

// Загрузка всех списков
function loadAllLists() {
  if (navigator.onLine) {
    // Есть интернет — подгружаем с Firebase
    database.ref('lists').once('value').then(snapshot => {
      const data = snapshot.val() || {};
      populateListSelect(data);

      // Кэшируем через SW
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CACHE_LISTS', lists: data });
      }
    });
  } else {
    // Нет интернета — подгружаем из кэша
    fetch('/all-lists.json')
      .then(res => res.json())
      .then(data => populateListSelect(data))
      .catch(() => {
        wordDiv.textContent = "Списки недоступны — нет интернета и кэша";
        wordDiv.classList.add("placeholder");
      });
  }
}

// Заполняем select
function populateListSelect(data) {
  listSelect.innerHTML = '<option disabled selected>Выберите список</option>';
  for (let key in data) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    listSelect.appendChild(option);
  }
  wordDiv.textContent = "Выберите список слов";
  wordDiv.classList.add("placeholder");
}

loadAllLists();

// Выбор списка
listSelect.onchange = () => {
  const selected = listSelect.value;
  if (!selected) return;

  if (navigator.onLine) {
    database.ref('lists/' + selected).once('value').then(snapshot => {
      words = Object.values(snapshot.val());
      initWordList();
    });
  } else {
    fetch('/all-lists.json')
      .then(res => res.json())
      .then(data => {
        words = Object.values(data[selected] || {});
        initWordList();
      });
  }
};

function initWordList() {
  allWords = [...new Map(words.map(w => [`${w.word};${w.trans}`, w])).values()];
  remainingWords = shuffleArray([...allWords]);
  index = 0; correct_answers = 0; wrong_answers = 0; currentWord = null;

  // Показываем интерфейс
  answersDiv.style.display = inputMode ? 'none' : 'grid';
  inputModeDiv.style.display = inputMode ? 'block' : 'none';
  submitWrapper.style.display = inputMode ? 'block' : 'none';
  switchBtn.style.display = 'inline-block';
  fiftyBtn.style.display = inputMode ? 'none' : 'inline-block';
  modeBtn.style.display = 'inline-block';
  progressDiv.style.display = 'block';
  progressFill.style.display = 'block';

  loadNextWord();
}

// Показать следующее слово
function loadNextWord() {
  if (remainingWords.length === 0) {
    wordDiv.textContent = 'Готово! Вы прошли все слова 🎉';
    wordDiv.classList.remove('placeholder');
    answersDiv.style.display = 'none';
    inputModeDiv.style.display = 'none';
    submitWrapper.style.display = 'none';
    return;
  }
  currentWord = remainingWords.pop();
  index++;
  document.getElementById('welcome').style.display = 'none';
  drawCurrentQuestion();
  focusInputSoon();
}

// Отобразить текущий вопрос
function drawCurrentQuestion() {
  const question = reverse ? currentWord.trans : currentWord.word;
  const correct = reverse ? currentWord.word : currentWord.trans;

  wordDiv.textContent = question;
  wordDiv.classList.remove('placeholder');

  progressDiv.textContent = `${index} из ${allWords.length} (${correct_answers}/${wrong_answers})`;
  progressFill.style.width = `${(index / allWords.length) * 100}%`;

  if (!inputMode) {
    const allOptions = allWords.map(x => reverse ? x.word : x.trans).filter(x => x !== correct);
    let options = [correct, ...shuffleArray(allOptions).slice(0, 3)];
    options = shuffleArray(options);
    const buttons = answersDiv.querySelectorAll('.answerBtn');
    buttons.forEach((btn, i) => {
      btn.textContent = options[i];
      btn.disabled = false;
      btn.className = 'answerBtn';
      btn.onclick = () => checkAnswer(btn, correct);
    });
    fiftyBtn.disabled = false;
  } else {
    feedback.textContent = '';
    feedback.className = '';
    answerInput.value = '';
    focusInputSoon();
    answerInput.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); submitFromButton(); } };
  }
}

// Проверка ответа через кнопки
function checkAnswer(btn, correct) {
  if (!currentWord) return;
  if (btn.textContent === correct) correct_answers++; else wrong_answers++;
  const buttons = answersDiv.querySelectorAll('.answerBtn');
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
    else if (b === btn) b.classList.add('wrong');
  });
  setTimeout(() => loadNextWord(), btn.textContent === correct ? 500 : 2000);
}

// Проверка ответа через текст
function checkTextAnswer(userAnswer, correct) {
  if (!userAnswer) {
    answerInput.classList.add('error');
    answerInput.style.transition = 'transform 0.2s';
    answerInput.style.transform = 'translateY(-5px)';
    setTimeout(() => {
      answerInput.style.transform = 'translateY(5px)';
      setTimeout(() => answerInput.style.transform = 'translateY(0)', 100);
    }, 100);
    setTimeout(() => answerInput.classList.remove('error'), 500);
    focusInputSoon();
    return;
  }

  if (userAnswer.toLowerCase() === correct.toLowerCase()) {
    correct_answers++;
    answerInput.classList.add('success');
    answerInput.style.transition = 'transform 0.2s';
    answerInput.style.transform = 'translateY(-5px)';
    setTimeout(() => {
      answerInput.style.transform = 'translateY(5px)';
      setTimeout(() => answerInput.style.transform = 'translateY(0)', 100);
    }, 100);
    setTimeout(() => answerInput.classList.remove('success'), 500);
    setTimeout(() => loadNextWord(), 500);
  } else {
    wrong_answers++;
    feedback.textContent = correct;
    feedback.className = 'err';
    setTimeout(() => loadNextWord(), 3000);
  }
  focusInputSoon();
}

// 50/50
function useFifty() {
  const correct = reverse ? currentWord.word : currentWord.trans;
  let wrongBtns = Array.from(answersDiv.querySelectorAll('.answerBtn'))
    .filter(b => b.textContent !== correct && !b.disabled);
  shuffleArray(wrongBtns).slice(0, 2).forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  fiftyBtn.disabled = true;
}

// Перемешивание массива
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Добавление нового списка
addListToggle.onclick = () => { addListForm.style.display = addListForm.style.display === 'none' ? 'flex' : 'none'; };
addListBtn.onclick = () => {
  const name = newListName.value.trim();
  const text = newListText.value.trim();
  if (!name || !text) return alert('Введите имя списка и слова');
  const newWords = text.split('\n').map(line => {
    const [word, trans] = line.split(';').map(x => x.trim());
    return { word, trans };
  }).filter(x => x.word && x.trans);
  database.ref('lists/' + name).set(newWords).then(() => {
    alert('Список добавлен!');
    newListName.value = ''; newListText.value = ''; addListForm.style.display = 'none';
    loadAllLists();
  }).catch(err => console.error(err));
};

// Отключение масштабирования
document.addEventListener('gesturestart', e => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);
document.addEventListener('touchstart', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
