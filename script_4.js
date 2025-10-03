// ==========================
// Глобальные переменные
// ==========================

// Хранилище диалогов
let dialogs = {};
let currentDialog = null;
let currentNode = null;

// Таймер
let timerInterval;
let totalTime = 2 * 60; // 3 минуты (в секундах)
let remainingTime = totalTime;
let modifiedLocations = new Set(); // отслеживание применённых модификаторов

// ==========================
// DOM-элементы
// ==========================
const dialogSelect = document.getElementById("DialogSelect");

const leftBubble = document.querySelector(".left-bubble");
const rightBubble = document.querySelector(".right-bubble");
const answersContainer = document.getElementById("answers");
const imageContainer = document.getElementById("imageContainer");

const startBtn = document.getElementById("startBtn");
const answerBtns = document.querySelectorAll(".answerBtn");

const leftCharacterContainer = document.querySelector(".character.left");
const rightCharacterContainer = document.querySelector(".character.right");

const timeText = document.getElementById("timeText");
const timeBar = document.getElementById("timeBar");

const popup = document.getElementById("popup");
const popupMessage = popup.querySelector(".popup-message");
const restartBtn = document.getElementById("restartBtn");

// ==========================
// Константы
// ==========================

// Таблица "локация → коэффициент уменьшения оставшегося времени"
const timeModifiers = {
  "look_passport.png": 0.7,
  "the-end.jpg": 0.01,
  "baggage-weigh-ok.png": 1.5,
  "no-liquids.png": 0.7,
  "payment-area.png": 0.5,
  "agree.png": 1.5,
  "security-argue.png": 0.6,
  "security-delay.png": 0.4,
  "payment-wait.png": 0.7

};

// Константы таймингов
const ANSWER_DELAY = 1500; // задержка перед показом ответа, мс

// ==========================
// Инициализация
// ==========================

// Скрываем персонажей
// leftCharacterContainer.style.display = "none";
// rightCharacterContainer.style.display = "none";



// ==========================
// Основные функции
// ==========================

// ==========================
// Конфиг модификаторов левого персонажа
// ==========================
const leftCharacterModifiers = {
  "airport-waiting-place.jpg": { visible: false }, // скрыть персонажа
  "checkin.png": { visible: true, src: "airport_staff.png", label: "Airport Staff" },
  "security-check.png": { visible: true, src: "security.png", label: "Security" },
  "lounge-sleep.png": { visible: true, src: "megaphone.png", label: "Announcement" },
  "airport_coffee.png": { visible: true, src: "megaphone.png", label: "Announcement" },
  "barista-write.png": { visible: true, src: "barista.png", label: "Barista" },
  "dutyfree-counter.png": { visible: true, src: "shop-staff.png", label: "Cashier" },
  "airport-waiting-place_2.jpg": { visible: true, src: "megaphone.png", label: "Announcement" },
};

const defaultLeftCharacterSrc = "person_left.png"; // стандартная картинка

// ==========================
// Функция применения модификатора
// ==========================
function applyLeftCharacterModifier(node) {
  const loc = (node.locations || [node.location])[0];
  const mod = leftCharacterModifiers[loc];

  const leftCharacterImg = leftCharacterContainer.querySelector("img");
  const leftCharacterLabel = leftCharacterContainer.querySelector(".character-label");

  if (!leftCharacterImg || !leftCharacterLabel) return; // если элементов нет, выходим

  if (mod) {
    // Видимость контейнера и пузыря
    if (mod.visible !== undefined) {
      leftCharacterContainer.style.display = mod.visible === false ? "none" : "";
      leftBubble.style.display = mod.visible === false ? "none" : "";
    }

    // Меняем картинку только если указана src
    if (mod.src) {
      leftCharacterImg.src = mod.src;
    }

    // Меняем подпись только если указана label
    if (mod.label !== undefined) {
      leftCharacterLabel.textContent = mod.label;
      leftCharacterLabel.style.display = ""; // показать подпись
    } else {
      leftCharacterLabel.style.display = "none"; // скрыть, если не задана
    }

  } else {
    // Локация не в списке — оставляем текущие значения
  }
}


// Функция для показа временной картинки
function showIntroImage(src) {
  const imageContainer = document.getElementById("imageContainer");
  
  // Очищаем контейнер от предыдущихintroOverlay.start картинок
  imageContainer.innerHTML = "";

  // Создаём и добавляем новую картинку
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Intro Image";
  img.id = "introImage";
  imageContainer.appendChild(img);
}

// Показываем картинку в начале
showIntroImage("airport.jpg");

// ==========================
// Показ узла диалога
// ==========================
function showNode(nodeKey) {
  const node = currentDialog.nodes[nodeKey];
  currentNode = nodeKey;

  // Сброс текстовых пузырей
  leftBubble.textContent = "";
  rightBubble.textContent = "";

  // Обновляем фон/локацию
  updateImage(node);

  // Применяем модификатор времени
  checkTimeModifier(node);

  // Применяем модификатор левого персонажа
  applyLeftCharacterModifier(node);

  // Реплика персонажа
  if (node.speaker === "left") {
    leftBubble.textContent = node.text;
  } else if (node.speaker === "right") {
    rightBubble.textContent = node.text;
  }

  // Проверка на успешное завершение
  if (["walking-to-gate.png", "boarding-gate.png"].includes(node.location)) {
    showPopup("Поздравляем, вы смогли улететь ✈️", true);
    return;
  }

  // Отрисовка возможных ответов или автоматический переход
  renderAnswers(node);
}


// Сброс текстовых пузырей
function resetBubbles() {
  leftBubble.textContent = "";
  rightBubble.textContent = "";
}



// Отрисовка возможных ответов
function renderAnswers(node) {
  answersContainer.innerHTML = "";

  if (node.answers) {
    node.answers.forEach(ans => {
      const btn = document.createElement("button");
      btn.className = "answerBtn";
      btn.textContent = ans.text;

      btn.onclick = () => handleAnswerClick(ans);
      answersContainer.appendChild(btn);
    });
  } else if (!node.next || !(node.next in currentDialog.nodes)) {
    // Нет ответов и нет перехода — конец диалога
    rightBubble.textContent = "Диалог завершён.";
  } else {
    // Автоматический переход
    showNode(node.next);
  }
}

// Обработчик клика по ответу
function handleAnswerClick(ans) {
  const allBtns = answersContainer.querySelectorAll("button");

  // Показываем ответ пользователя
  rightBubble.textContent = ans.text || "";

  // Если следующий узел "правый", обновляем картинку
  const nextNode = currentDialog.nodes[ans.next];
  if (nextNode.speaker === "right") {
    updateImage(nextNode);
  }

  // Скрываем кнопки
  allBtns.forEach(b => (b.style.display = "none"));

  // Через 1.5 сек. переходим дальше
  setTimeout(() => {
    showNode(ans.next);
    allBtns.forEach(b => (b.style.display = ""));
  }, ANSWER_DELAY);
}

// Отрисовка картинки локации
function updateImage(node) {
  imageContainer.innerHTML = "";
  const locs = node.locations || [node.location];

  locs.forEach(loc => {
    const img = document.createElement("img");
    img.src = "locations/" + loc;
    img.alt = "Location";
    imageContainer.appendChild(img);
  });
}

// ==========================
// Таймер
// ==========================

// Форматирование времени в mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Цвет прогресс-бара
function getDynamicColor(percent) {
  const inverted = 100 - percent;
  let hue = inverted < 50
    ? 120 - (inverted / 50) * 60 // зелёный → жёлтый
    : 60 - ((inverted - 50) / 50) * 60; // жёлтый → красный

  return `hsl(${hue}, 90%, 50%)`;
}

function showBubble(value) {
  const bubble = document.createElement('div');
  bubble.className = 'time-bubble';

  // Добавляем + или - перед числом
  bubble.textContent = (value >= 1 ? '+' : '-') + value;

  // Координаты — центр экрана
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;

  bubble.style.left = x + 'px';
  bubble.style.top = y + 'px';
  bubble.style.backgroundColor = value >= 1 ? 'green' : 'red';
  document.body.appendChild(bubble);

  // Удаление после анимации
  setTimeout(() => bubble.remove(), 1000);
}



// Проверка модификаторов времени и отображение пузыря
function checkTimeModifier(node) {
  if (!node) return;

  const locs = node.locations || [node.location];
  locs.forEach(loc => {
    if (timeModifiers[loc] && !modifiedLocations.has(loc)) {
      const modifier = timeModifiers[loc];
      remainingTime = Math.floor(remainingTime * modifier);
      modifiedLocations.add(loc);

      // Координаты пузыря: центр контейнера с картинкой или центр окна
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      const img = document.querySelector("#imageContainer img");
      if (img) {
        const rect = img.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top;
      }

      showBubble(modifier, x, y);
    }
  });
}

// Обновление таймера
function updateTimer() {
  timeText.textContent = `Оставшееся время: ${formatTime(remainingTime)}`;
  const progressPercent = (remainingTime / totalTime) * 100;
  timeBar.style.width = `${progressPercent}%`;
  timeBar.style.backgroundColor = getDynamicColor(progressPercent);

  if (remainingTime > 0) {
    remainingTime--;
  } else {
    clearInterval(timerInterval);
    showPopup("К сожалению, вы не смогли улететь ❌", false);
  }
}


// ==========================
// Управление игрой
// ==========================

// Запуск игры
function startGame() {
  resetGameState();
  fetch("dialogs.json")
    .then(res => res.json())
    .then(data => {
      dialogs = data;
      const firstTopic = Object.keys(dialogs)[0];
      currentDialog = dialogs[firstTopic];
      currentNode = currentDialog.start;


      // Прячем интро-оверлей
      const introOverlay = document.getElementById("introOverlay");
      if (introOverlay) {
        introOverlay.style.display = "none";
      }

      // В startGame() очищаем контейнер с картинкой
      const imageContainer = document.getElementById("imageContainer");
      if (imageContainer) {
        imageContainer.innerHTML = ""; // очищаем все элементы внутри
      }

      // Показываем персонажей и остальные кнопки
leftCharacterContainer.style.visibility = "visible";
rightCharacterContainer.style.visibility = "visible";
answersContainer.style.visibility = "visible";


      // Первый узел
      showNode(currentNode);

      // Запускаем таймер
      clearInterval(timerInterval);
      remainingTime = totalTime;
      timerInterval = setInterval(updateTimer, 1000);
    });
}

// Попап (успех / провал)
function showPopup(message, isSuccess = true) {
  clearInterval(timerInterval);

  popup.style.display = "flex";
  popupMessage.textContent = message;

  popup.style.backgroundColor = isSuccess
    ? "rgba(0,255,0,0.2)"
    : "rgba(255,0,0,0.3)";

  if (isSuccess && typeof confetti === "function") {
    confetti({
      particleCount: 200,
      spread: 100,
      startVelocity: 30,
      gravity: 0.5,
      ticks: 600,
      origin: { x: 0.5, y: 0.4 },
    });
  }
}

// ==========================
// Слушатели событий
// ==========================
if (startBtn) {
  startBtn.addEventListener("click", startGame);
}

restartBtn.addEventListener("click", () => {
  popup.style.display = "none";
  startGame();
});



// ==========================
// Функция сброса состояния перед запуском игры
// ==========================
function resetGameState() {
  // Сбрасываем таймер
  clearInterval(timerInterval);
  remainingTime = totalTime;

  // Сбрасываем модификаторы
  modifiedLocations.clear();

  // Сбрасываем диалоги
  currentDialog = null;
  currentNode = null;

  // Сбрасываем текстовые пузыри
  resetBubbles();

  // Сбрасываем кнопки ответов
answersContainer.style.visibility = "visible";

  // Сбрасываем персонажей
leftCharacterContainer.style.visibility = "visible";
rightCharacterContainer.style.visibility = "visible";
  const leftImg = leftCharacterContainer.querySelector("img");
  if (leftImg) leftImg.src = defaultLeftCharacterSrc;
}

