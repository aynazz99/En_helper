let words = [], index = 0, correct_answers = 0, wrong_answers = 0, reverse = false;

const switchBtn = document.getElementById('switchBtn');
const fiftyBtn = document.getElementById('fiftyBtn');
const wordDiv = document.getElementById('word');
const answersDiv = document.getElementById('answers');
const progressDiv = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');

switchBtn.addEventListener('click', ()=> { reverse = !reverse; loadQuestion(); });
fiftyBtn.addEventListener('click', useFifty);

// Подгрузка списка слов
function loadWordList(listName){
  fetch(`data/${listName}.txt`)
    .then(res => res.text())
    .then(text => {
      words = text.split('\n').map(line => {
        const [word, trans] = line.split(';').map(x => x.trim());
        return {word, trans};
      }).filter(x => x.word && x.trans);

      if(words.length < 4){ alert('Список должен содержать минимум 4 слова!'); return; }

      words = shuffleArray(words);
      index = 0; correct_answers = 0; wrong_answers = 0;
      loadQuestion();
    })
    .catch(err => { console.error(err); alert('Ошибка при загрузке списка'); });
}

// Показ вопроса
function loadQuestion(){
  if(words.length === 0){
    alert(`Вы ответили правильно на ${correct_answers} из ${index}`);
    return;
  }

  const randIndex = Math.floor(Math.random() * words.length);
  const w = words.splice(randIndex, 1)[0];
  index++;

  const question = reverse ? w.trans : w.word;
  const correct = reverse ? w.word : w.trans;

  const allOptions = words.map(x => reverse ? x.word : x.trans).filter(x => x !== correct);
  let options = [correct, ...shuffleArray(allOptions).slice(0,3)];
  options = shuffleArray(options);

  wordDiv.textContent = question;
  progressDiv.textContent = `${index} из ${index + words.length} (${correct_answers}/${wrong_answers})`;
  progressFill.style.width = `${(index / (index + words.length)) * 100}%`;

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
  setTimeout(()=>{ loadQuestion(); }, btn.textContent === correct ? 500 : 4000);
}

// 50/50
function useFifty(){
  const correct = reverse ? words[index-1].word : words[index-1].trans;
  let wrongBtns = Array.from(answersDiv.querySelectorAll('.answerBtn'))
                       .filter(b => b.textContent !== correct && !b.disabled);
  shuffleArray(wrongBtns);
  wrongBtns.slice(0,2).forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  fiftyBtn.disabled = true;
}

// Перемешивание массива
function shuffleArray(array){
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
