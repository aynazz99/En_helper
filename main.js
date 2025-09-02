let words = [], allWords = [], index = 0, correct_answers = 0, wrong_answers = 0, reverse = false;
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
  if(currentWord) drawCurrentQuestion();
});

// Кнопка 50/50
fiftyBtn.addEventListener('click', useFifty);

// Загрузка списка слов
function loadWordList(listName){
  fetch(`data/${listName}.txt`)
    .then(res => res.text())
    .then(text => {
      words = text.split('\n').map(line => {
        const [word, trans] = line.split(';').map(x => x.trim());
        return {word, trans};
      }).filter(x => x.word && x.trans);

      if(words.length < 4){ alert('Список должен содержать минимум 4 слова!'); return; }

      allWords = [...words];
      remainingWords = shuffleArray([...allWords]); // очередь случайных слов без повторов
      index = 0; correct_answers = 0; wrong_answers = 0;
      currentWord = null;
      loadNextWord();
    })
    .catch(err => { console.error(err); alert('Ошибка при загрузке списка'); });
}

// Берём следующее слово из remainingWords
function loadNextWord(){
  if(remainingWords.length === 0){
    alert('Вы прошли все слова!'); 
    return;
  }
  currentWord = remainingWords.pop(); // берём слово без случайного индекса
  index++;
  drawCurrentQuestion();
}

// Отображение текущего вопроса и вариантов
function drawCurrentQuestion(){
  const question = reverse ? currentWord.trans : currentWord.word;
  const correct = reverse ? currentWord.word : currentWord.trans;

  // Всегда формируем варианты из полного списка
  const allOptions = allWords.map(x => reverse ? x.word : x.trans)
                             .filter(x => x !== correct);
  let options = [correct, ...shuffleArray(allOptions).slice(0,3)];
  options = shuffleArray(options);

  wordDiv.textContent = question;
  progressDiv.textContent = `${index} из ${allWords.length} (${correct_answers}/${wrong_answers})`;
  progressFill.style.width = `${(index / allWords.length) * 100}%`;

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
function checkAnswer(btn, correct){
  if(btn.textContent === correct) correct_answers++; else wrong_answers++;

  const buttons = answersDiv.querySelectorAll('.answerBtn');
  buttons.forEach(b => {
    b.disabled = true;
    if(b.textContent === correct) b.classList.add('correct');
    else if(b === btn) b.classList.add('wrong');
  });

  setTimeout(() => loadNextWord(), btn.textContent === correct ? 500 : 4000);
}

// 50/50
function useFifty(){
  const correct = reverse ? currentWord.word : currentWord.trans;
  let wrongBtns = Array.from(answersDiv.querySelectorAll('.answerBtn'))
                       .filter(b => b.textContent !== correct && !b.disabled);
  shuffleArray(wrongBtns);
  wrongBtns.slice(0,2).forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  fiftyBtn.disabled = true;
}

// Перемешивание массива
function shuffleArray(array){
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
