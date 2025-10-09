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
const db = firebase.database();

// ======================
// Работа с избранным
// ======================

// будем хранить в ветке "favorites"
async function toggleFavorite(cardName) {
  const favRef = db.ref("favorites/" + cardName);

  const snapshot = await favRef.get();

  if (snapshot.exists()) {
    // если уже есть → удаляем
    await favRef.remove();
    console.log("Убрано из избранного:", cardName);
    return false; // вернём false → теперь не избранное
  } else {
    // если нет → добавляем
    await favRef.set(true);
    console.log("Добавлено в избранное:", cardName);
    return true; // вернём true → теперь избранное
  }
}

// проверка: является ли карточка избранной
async function isFavorite(cardName) {
  const snapshot = await db.ref("favorites/" + cardName).get();
  return snapshot.exists();
}

// ======================
// Кнопка звезды
// ======================
function setupStarButton(card) {
  const starBtn = document.querySelector(".star-btn");
  if (!starBtn) return;

  if (favorites.includes(card.name)) {
    starBtn.classList.add("active");
    starBtn.textContent = "⭐";
  } else {
    starBtn.classList.remove("active");
    starBtn.textContent = "";
  }

  starBtn.onclick = () => {
    if (favorites.includes(card.name)) {
      db.ref("favorites/" + card.name).remove();
      favorites = favorites.filter(f => f !== card.name);
      starBtn.classList.remove("active");
      starBtn.textContent = "";
    } else {
      db.ref("favorites/" + card.name).set(true);
      favorites.push(card.name);
      starBtn.classList.add("active");
      starBtn.textContent = "⭐";
    }
  };
}




const cardSelect = document.getElementById('CardSelect');
const imageContainer = document.getElementById('imageContainer');
const answersContainer = document.getElementById('answers');
// изначально скрываем блок с кнопками
answersContainer.style.display = "none";
const levelBtn = document.getElementById("levelBtn");
const welcomeContainer = document.getElementById("welcomeContainer");
const cardsBtn = document.getElementById("cardsBtn");
const fiftyBtn = document.getElementById('fiftyBtn');
fiftyBtn.style.display = "none"; // скрыть сразу




let folders = {};
let cards = [];
let remainingCards = [];
let currentCard = null;
let favorites = [];
let folderFavorites = []; // глобально для текущей папки

// Загружаем JSON
fetch('folders.json')
  .then(res => res.json())
  .then(data => {
    folders = data;
    Object.keys(folders).forEach(folderName => {
      const option = document.createElement('option');
      option.value = folderName;
      option.textContent = folderName;
      cardSelect.appendChild(option);
    });
  })
  .catch(err => console.error("Ошибка загрузки JSON:", err));

cardSelect.addEventListener('change', () => {
  const folder = cardSelect.value;
  if (!folder || !folders[folder]) return;

  imageContainer.style.display = "block"
  answersContainer.style.display = "grid"; 
  if (fiftyBtn) fiftyBtn.style.display = "inline-block";

  // Подготавливаем колоду
  cards = folders[folder].map(card => ({
    name: card.name,
    url: `images/${folder}/${card.file}`
  }));
  remainingCards = [...cards];

  // Загружаем избранное один раз для выбранной папки
  db.ref(`favorites/${folder}`).once("value").then(snapshot => {
    folderFavorites = snapshot.exists() ? Object.keys(snapshot.val()) : [];
    showCard();
  });
});

// функция перемешивания
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// показать карточку
function showCard() {
  if (remainingCards.length === 0) remainingCards = [...cards];

  const randomIndex = Math.floor(Math.random() * remainingCards.length);
  currentCard = remainingCards.splice(randomIndex, 1)[0];

  imageContainer.innerHTML = '';

  const flipCard = document.createElement('div');
  flipCard.className = 'flip-card';
  flipCard.innerHTML = `
    <div class="flip-card-inner">
      <div class="flip-card-front">
        <img src="${currentCard.url}" alt="Картинка" style="width:100%; height:100%; border-radius:12px;">
      </div>
      <div class="flip-card-back">
        <p>${currentCard.name}</p>
      </div>
    </div>
  `;
  flipCard.addEventListener('click', () => flipCard.classList.toggle('flipped'));
  imageContainer.appendChild(flipCard);

  // кнопка-звезда
  const starBtn = document.createElement("button");
  starBtn.className = "star-btn";
  starBtn.textContent = folderFavorites.includes(currentCard.name) ? "⭐" : "☆";
  imageContainer.appendChild(starBtn);

  starBtn.onclick = () => {
    const folderName = cardSelect.value;
    if (folderFavorites.includes(currentCard.name)) {
      db.ref(`favorites/${folderName}/${currentCard.name}`).remove();
      folderFavorites = folderFavorites.filter(f => f !== currentCard.name);
      starBtn.textContent = "☆";
    } else {
      db.ref(`favorites/${folderName}/${currentCard.name}`).set(true);
      folderFavorites.push(currentCard.name);
      starBtn.textContent = "⭐";
    }
  };

  // Варианты ответов
  const answers = [currentCard.name];
  const namesPool = cards.map(c => c.name).filter(n => n !== currentCard.name);
  while (answers.length < 4 && namesPool.length > 0) {
    const index = Math.floor(Math.random() * namesPool.length);
    answers.push(namesPool.splice(index, 1)[0]);
  }
  answers.sort(() => Math.random() - 0.5);

  answersContainer.innerHTML = '';
  answers.forEach(answer => {
    const btn = document.createElement('button');
    btn.textContent = answer;
    btn.className = 'answerBtn';
    btn.disabled = false;
    btn.classList.remove('disabled');
    btn.onclick = () => checkAnswer(
      answer === currentCard.name,
      btn,
      Array.from(answersContainer.children).find(b => b.textContent === currentCard.name)
    );
    answersContainer.appendChild(btn);
  });

  if (fiftyBtn) fiftyBtn.disabled = false; // сброс кнопки 50/50
}


// проверка ответа
function checkAnswer(isCorrect, btn, correctBtn) {
  const buttons = answersContainer.querySelectorAll('.answerBtn');
  buttons.forEach(b => b.disabled = true);

  correctBtn.classList.add('correct');
  if (!isCorrect) btn.classList.add('wrong');

  setTimeout(() => {
    buttons.forEach(b => {
      b.classList.remove('correct', 'wrong');
      b.disabled = false;
      b.classList.remove('disabled');
    });

    showCard(); // следующая карточка
  }, isCorrect ? 500 : 1500);
}


// 50/50
function useFifty() {
  if (!currentCard) return;

  const correct = currentCard.name;
  const buttons = Array.from(answersContainer.querySelectorAll('.answerBtn'))
                       .filter(b => b.textContent !== correct && !b.disabled);

  shuffleArray(buttons).slice(0, 2).forEach(b => {
    b.disabled = true;
    b.classList.add('disabled');
  });

  fiftyBtn.disabled = true;
}

if (fiftyBtn) fiftyBtn.addEventListener('click', useFifty);




function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
