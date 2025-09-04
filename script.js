// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCgSFDj7fRw6HSvZyOz1g5IM749f2sY55M",
  authDomain: "wordquiz-659d7.firebaseapp.com",
  databaseURL: "https://wordquiz-659d7-default-rtdb.firebaseio.com",
  projectId: "wordquiz-659d7",
  storageBucket: "wordquiz-659d7.firebasestorage.app",
  messagingSenderId: "785560761880",
  appId: "1:785560761880:web:9455e5767af0e0b9b1f56d"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Открываем базу
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WordQuizDB", 1);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("lists")) {
        db.createObjectStore("lists", { keyPath: "name" }); // name = название списка
      }
    };
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.error);
  });
}

async function saveListsToDB(data) {
  const db = await openDB();
  const tx = db.transaction("lists", "readwrite");
  const store = tx.objectStore("lists");

  // очищаем старые данные
  store.clear();

  for (let listName in data) {
    store.put({ name: listName, words: data[listName] });
  }

  return tx.complete;
}

async function loadListsFromDB() {
  const db = await openDB();
  const tx = db.transaction("lists", "readonly");
  const store = tx.objectStore("lists");

  const allLists = await store.getAll(); // получаем все объекты
  const result = {};
  allLists.forEach(item => {
    result[item.name] = item.words;
  });

  return result;
}


// Твой код дальше ↓↓↓
let words=[], allWords=[], index=0, correct_answers=0, wrong_answers=0;
let reverse=false, currentWord=null, remainingWords=[];
let inputMode=false;

const saveListBtn = document.getElementById('saveListBtn');

saveListBtn.addEventListener("click", () => {
  database.ref('lists').once('value')
    .then(async snapshot => {
      const data = snapshot.val() || {};
      await saveListsToDB(data); // сохраняем в IndexedDB
      alert("Списки и слова сохранены для оффлайн ✅");
    })
    .catch(err => {
      console.error("Ошибка при сохранении:", err);
      alert("Не удалось сохранить списки для оффлайна 😢");
    });
});

window.addEventListener("load", async () => {
  try {
    // пытаемся онлайн
    const snapshot = await database.ref('lists').once('value');
    const data = snapshot.val() || {};
    renderLists(data); // показываем в select
    console.log("Списки загружены с Firebase ✅");
  } catch(err) {
    console.warn("Firebase недоступен, пробуем оффлайн:", err);
    const data = await loadListsFromDB();
    if (Object.keys(data).length > 0) {
      renderLists(data);
      console.log("Списки загружены из IndexedDB ✅");
    } else {
      wordDiv.textContent = "Нет сохранённых списков. Сначала нажмите 💾 при онлайн-доступе.";
      wordDiv.classList.remove("placeholder");
    }
  }
});


const switchBtn=document.getElementById('switchBtn');
const modeBtn=document.getElementById('modeBtn');
const fiftyBtn=document.getElementById('fiftyBtn');
const wordDiv=document.getElementById('word');
const answersDiv=document.getElementById('answers');
answersDiv.style.display = 'none';
const inputModeDiv=document.getElementById('inputModeDiv');
const answerInput=document.getElementById('answerInput');
const feedback=document.getElementById('feedback');
const submitAnswerBtn=document.getElementById('submitAnswerBtn');
const submitWrapper=document.getElementById('submitWrapper');
const progressDiv=document.getElementById('progress');
const progressFill=document.getElementById('progressFill');
const progressBar = document.getElementById('progressBar');
progressDiv.style.display = 'none';
progressFill.style.display = 'none';
switchBtn.style.display = 'none';
fiftyBtn.style.display = 'none';
modeBtn.style.display = 'none';
progressBar.style.display = 'none';

// Скрываем прогресс при загрузке страницы
progressDiv.style.display = 'none';
progressFill.style.display = 'none';
// Скрываем кнопки при загрузке страницы
switchBtn.style.display = 'none';
fiftyBtn.style.display = 'none';
modeBtn.style.display = 'none';
progressBar.style.display = 'none';

function focusInputSoon() {
  if (!inputMode) return;
  requestAnimationFrame(()=>{
    answerInput.focus({ preventScroll: true });
    // курсор в конец
    const len = answerInput.value.length;
    try { answerInput.setSelectionRange(len, len); } catch(e){}
  });
}

switchBtn.addEventListener('click', ()=>{reverse=!reverse; if(currentWord) drawCurrentQuestion();});
fiftyBtn.addEventListener('click', useFifty);

// НЕ даём кнопке воровать фокус (чтобы клавиатура не закрывалась)
submitAnswerBtn.addEventListener('mousedown', e => e.preventDefault());
submitAnswerBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  submitFromButton();
}, {passive:false});
submitAnswerBtn.addEventListener('click', e => {
  e.preventDefault();
  submitFromButton();
});

function submitFromButton(){
  if(!currentWord) return;
  const correct = reverse ? currentWord.word : currentWord.trans;
  checkTextAnswer((answerInput.value||"").trim(), correct);
}

modeBtn.addEventListener('click', ()=>{
  inputMode=!inputMode;
  if(inputMode){
    answersDiv.style.display='none';
    inputModeDiv.style.display='block';
    submitWrapper.style.display='block';
    fiftyBtn.style.display='none';
    modeBtn.textContent='🎛️';
    focusInputSoon();
  } else {
    answersDiv.style.display='grid';
    inputModeDiv.style.display='none';
    submitWrapper.style.display='none';
    fiftyBtn.style.display='inline-block';
    modeBtn.textContent='✍️';
  }
  if(currentWord) drawCurrentQuestion();
});

function loadNextWord(){
  if(remainingWords.length===0){
    // Без alert, чтобы не закрывать клавиатуру
    wordDiv.textContent='Готово! Вы прошли все слова 🎉';
    wordDiv.classList.remove('placeholder');
    answersDiv.style.display='none';
    inputModeDiv.style.display='none';
    submitWrapper.style.display='none';
    return;
  }
  currentWord=remainingWords.pop();
  index++;
  document.getElementById('welcome').style.display='none';
  drawCurrentQuestion();
  focusInputSoon();
}

function drawCurrentQuestion(){
  const question=reverse?currentWord.trans:currentWord.word;
  const correct=reverse?currentWord.word:currentWord.trans;

  wordDiv.textContent=question;
  wordDiv.classList.remove('placeholder');

  progressDiv.textContent=`${index} из ${allWords.length} (${correct_answers}/${wrong_answers})`;
  progressFill.style.width=`${(index/allWords.length)*100}%`;

  if(!inputMode){
    const allOptions=allWords.map(x=>reverse?x.word:x.trans).filter(x=>x!==correct);
    let options=[correct,...shuffleArray(allOptions).slice(0,3)];
    options=shuffleArray(options);
    const buttons=answersDiv.querySelectorAll('.answerBtn');
    buttons.forEach((btn,i)=>{
      btn.textContent=options[i]; btn.disabled=false; btn.className='answerBtn'; btn.onclick=()=>checkAnswer(btn,correct);
    });
    fiftyBtn.disabled=false;
  } else {
    feedback.textContent='';
    feedback.className='';
    answerInput.value='';
    focusInputSoon();
    // Enter также отправляет
    answerInput.onkeydown=(e)=>{ if(e.key==="Enter"){ e.preventDefault(); submitFromButton(); } };
  }
}

function checkAnswer(btn, correct){
  if(!currentWord){ 
    // список не выбран — подсвечиваем select
    listSelect.style.borderColor = 'red';
    listSelect.style.transition = 'transform 0.2s, border-color 0.2s';
    listSelect.style.transform = 'translateY(-5px)';
    setTimeout(()=>{
      listSelect.style.transform = 'translateY(5px)';
      setTimeout(()=>{
        listSelect.style.transform = 'translateY(0)';
        listSelect.style.borderColor = '#ccc';
      }, 100);
    }, 100);
    return;
  }

  // обычная проверка ответа
  if(btn.textContent === correct) correct_answers++; else wrong_answers++;
  const buttons = answersDiv.querySelectorAll('.answerBtn');
  buttons.forEach(b=>{
    b.disabled = true;
    if(b.textContent === correct) b.classList.add('correct');
    else if(b === btn) b.classList.add('wrong');
  });
  setTimeout(()=>loadNextWord(), btn.textContent === correct ? 500 : 2000);
}


function checkTextAnswer(userAnswer, correct){
if (!userAnswer) {
  // Добавляем класс для красного эффекта
  answerInput.classList.add('error');

  // Подпрыгивание
  answerInput.style.transition = 'transform 0.2s';
  answerInput.style.transform = 'translateY(-5px)';
  setTimeout(() => {
    answerInput.style.transform = 'translateY(5px)';
    setTimeout(() => {
      answerInput.style.transform = 'translateY(0)';
    }, 100);
  }, 100);

  // Убираем класс через 0.5 секунду
  setTimeout(() => {
    answerInput.classList.remove('error');
  }, 500);

  focusInputSoon();
  return;
}

if (userAnswer.toLowerCase() === correct.toLowerCase()) {
    correct_answers++;
    // Добавляем зелёную подсветку
    answerInput.classList.add('success');
    // Подпрыгивание, как при ошибке
    answerInput.style.transition = 'transform 0.2s';
    answerInput.style.transform = 'translateY(-5px)';
    setTimeout(() => {
        answerInput.style.transform = 'translateY(5px)';
        setTimeout(() => {
            answerInput.style.transform = 'translateY(0)';
        }, 100);
    }, 100);

    // Убираем подсветку через 1 секунду
    setTimeout(() => {
        answerInput.classList.remove('success');
    }, 500);

    // Быстрый переход к следующему слову
    setTimeout(() => { loadNextWord(); }, 500);
  } else {
    wrong_answers++;
    feedback.textContent= correct;
    feedback.className='err';
    // показываем 3с и идём дальше
    setTimeout(()=>{ loadNextWord(); }, 3000);
  }
  focusInputSoon();
}

function useFifty(){
  const correct=reverse?currentWord.word:currentWord.trans;
  let wrongBtns=Array.from(answersDiv.querySelectorAll('.answerBtn')).filter(b=>b.textContent!==correct&&!b.disabled);
  shuffleArray(wrongBtns).slice(0,2).forEach(b=>{ b.disabled=true; b.classList.add('disabled'); });
  fiftyBtn.disabled=true;
}

function shuffleArray(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i], array[j]]=[array[j], array[i]];
  }
  return array;
}

const listSelect=document.getElementById('listSelect');
const addListToggle=document.getElementById('addListToggle');
const addListForm=document.getElementById('addListForm');
const addListBtn=document.getElementById('addListBtn');
const newListName=document.getElementById('newListName');
const newListText=document.getElementById('newListText');

const listContainer = document.getElementById('listContainer');
const deleteListBtn = document.getElementById('deleteListBtn');
const ADMIN_CODE = "89991627939"; // код для удаления списка

// Показ кнопки удаления при выборе списка
listSelect.addEventListener('change', () => {
  deleteListBtn.style.display = listSelect.value ? 'inline-block' : 'none';
});

// Удаление списка
deleteListBtn.addEventListener('click', () => {
  const code = prompt("Введите код для удаления списка:");
  if(code !== ADMIN_CODE){
    alert("Неверный код!");
    return;
  }
  const selected = listSelect.value;
  if(!selected) return;

  // Удаляем из Firebase
  database.ref('lists/'+selected).remove()
    .then(() => {
      alert(`Список "${selected}" удалён`);
      // Удаляем из выпадающего списка
      const option = listSelect.querySelector(`option[value="${selected}"]`);
      if(option) option.remove();
      listSelect.value = ""; // сброс выбора
      deleteListBtn.style.display = 'none';
    })
    .catch(err => console.error(err));
});


listSelect.onchange = async () => {
  const selected = listSelect.value;
  if (!selected) return;

  let listData;

  try {
    // Онлайн
    const snapshot = await database.ref('lists/' + selected).once('value');
    listData = snapshot.val() || [];
  } catch(err) {
    // Оффлайн
    const allLists = await loadListsFromDB();
    listData = allLists[selected] || [];
  }

  words = listData;
  allWords = [...new Map(words.map(w => [`${w.word};${w.trans}`, w])).values()];
  remainingWords = shuffleArray([...allWords]);
  index = 0;
  correct_answers = 0;
  wrong_answers = 0;
  currentWord = null;

  wordDiv.classList.remove("placeholder");

  answersDiv.style.display = 'grid';
  progressDiv.style.display = 'block';
  progressFill.style.display = 'block';
  switchBtn.style.display = 'inline-block';
  fiftyBtn.style.display = 'inline-block';
  modeBtn.style.display = 'inline-block';
  progressBar.style.display = 'block';

  loadNextWord();
};


addListToggle.onclick=()=>{ addListForm.style.display=addListForm.style.display==='none'?'flex':'none'; };
addListBtn.onclick=()=>{
  const name=newListName.value.trim();
  const text=newListText.value.trim();
  if(!name||!text) return alert('Введите имя списка и слова');
  const newWords=text.split('\n').map(line=>{
    const [word,trans]=line.split(';').map(x=>x.trim()); 
    return {word,trans};
  }).filter(x=>x.word&&x.trans);
  database.ref('lists/'+name).set(newWords).then(()=>{
    alert('Список добавлен!'); newListName.value=''; newListText.value=''; addListForm.style.display='none';
  }).catch(err=>console.error(err));
};

// Отключение масштабирования
document.addEventListener('gesturestart', e=>e.preventDefault());
let lastTouchEnd=0;
document.addEventListener('touchend', e=>{
  const now=new Date().getTime();
  if(now-lastTouchEnd<=300) e.preventDefault();
  lastTouchEnd=now;
}, false);
document.addEventListener('touchstart', e=>{ if(e.touches.length>1) e.preventDefault(); }, {passive:false});

// --- Динамическое позиционирование кнопки на iOS PWA ---
let vh = window.innerHeight;

window.addEventListener('resize', () => {
    const newVh = window.innerHeight;
    const delta = vh - newVh;

    if (delta > 150) { // клавиатура открылась
        submitWrapper.style.position = 'absolute';
        submitWrapper.style.bottom = delta + 'px';
    } else {
        submitWrapper.style.position = 'static';
        submitWrapper.style.bottom = 'auto';
    }
});


