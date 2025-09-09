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
let currentIndex = 0;

// Загружаем JSON
fetch('folders.json')
  .then(res => res.json())
  .then(data => {
    folders = data;

    // Заполняем селект
    Object.keys(folders).forEach(folderName => {
      const option = document.createElement('option');
      option.value = folderName;
      option.textContent = folderName;
      cardSelect.appendChild(option);
    });
  })
  .catch(err => console.error("Ошибка загрузки JSON:", err));

if (fiftyBtn) {
  fiftyBtn.addEventListener('click', useFifty);
}


// При выборе папки
cardSelect.addEventListener('change', () => {
  const folder = cardSelect.value;
  if (!folder || !folders[folder]) return;
  // показываем блок кнопок, как только выбрана папка
  answersContainer.style.display = "grid"; // или "flex", если используешь flex
  if (cardsBtn) cardsBtn.style.display = "none";
  if (fiftyBtn) fiftyBtn.style.display = "inline-block"; // показываем кнопку 50/50
  
  // Берём список карточек
cards = folders[folder].map(card => ({
  name: card.name,
  url: `images/${folder}/${card.file}`  
}));


  // Перемешиваем
  cards.sort(() => Math.random() - 0.5);
  currentIndex = 0;

  showCard();
});

// ============================
// Показ карточки
// ============================
function checkAnswer(isCorrect, btn, correctBtn) {
  const buttons = answersContainer.querySelectorAll('.answerBtn');
  
  // Блокируем все кнопки
  buttons.forEach(b => b.disabled = true);

  // Подсветка
  correctBtn.classList.add('correct'); // правильный ответ зелёным
  if (!isCorrect) btn.classList.add('wrong'); // если ошибся — красным

  // Переход к следующей карточке через паузу
  setTimeout(() => {
    buttons.forEach(b => {
      b.classList.remove('correct', 'wrong');
      b.disabled = false;
    });
            // разблокируем кнопку 50/50 для новой карточки
    if (fiftyBtn) fiftyBtn.disabled = false;
    currentIndex = (currentIndex + 1) % cards.length;
    showCard();
  }, isCorrect ? 500 : 2000);
}

// ============================
// Показ карточки
// ============================
function showCard() {
  if (cards.length === 0) return;

  const card = cards[currentIndex];

  // Картинка
  imageContainer.innerHTML = '';
  const img = document.createElement('img');
  img.src = card.url;
  img.style.width = '250px';
  img.style.borderRadius = '12px';
  imageContainer.appendChild(img);

  // Варианты ответов
  const answers = [card.name];
  const namesPool = cards.map(c => c.name).filter(n => n !== card.name);

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
    btn.onclick = () => checkAnswer(answer === card.name, btn, Array.from(answersContainer.children).find(b => b.textContent === card.name));
    answersContainer.appendChild(btn);
  });
}


  // Test — возврат на страницу теста
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

    // Test — возврат на страницу теста
  if (levelBtn) {
    levelBtn.addEventListener("click", () => {
      window.location.href = "level_check_Page.html";
    });
  }

if (cardsBtn) {
  cardsBtn.addEventListener("click", () => {
    if (!cardSelect) return;

    const selIndex = cardSelect.selectedIndex; // индекс выбранной опции
    const selectedOption = cardSelect.options[selIndex] || null;

    const isPlaceholder = selIndex <= 0 || (selectedOption && selectedOption.disabled) || cardSelect.value === "";

    if (isPlaceholder) {
      // прыжок, как в script_2.js
      cardSelect.classList.add("bounce", "red-border");
      setTimeout(() => cardSelect.classList.remove("bounce"), 600);
      setTimeout(() => cardSelect.classList.remove("red-border"), 800);
    } else {
      showQuizUI();
      console.log("Папка выбрана:", cardSelect.value);
    }
  });
}

function useFifty() {
  const card = cards[currentIndex];
  const correct = card.name; // правильный ответ
  let wrongBtns = Array.from(answersContainer.querySelectorAll('.answerBtn'))
                     .filter(b => b.textContent !== correct && !b.disabled);

  // перемешиваем и отключаем 2 неправильные кнопки
  shuffleArray(wrongBtns).slice(0, 2).forEach(b => {
    b.disabled = true;
    b.classList.add('disabled');
  });

  fiftyBtn.disabled = true; // блокируем кнопку подсказки
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

