// ==========================
// Глобальные переменные
// ==========================

// Хранилище диалогов
let dialogs = {};
let currentDialog = null;
let currentNode = null;

// Таймер
let timerInterval;
let totalTime = 3 * 60; // 3 минуты (в секундах)
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

// Соответствие location → картинка левого персонажа
const leftCharacterMap = {
  "security-check.png": "security.png",
  "checkin.jpg": "airport_staff.png",
  "airport_coffee.png": "megaphone.png"
};

// Таблица "локация → коэффициент уменьшения оставшегося времени"
const timeModifiers = {
  "look_passport.png": 0.7,
  "the-end.jpg": 0.01,
  "baggage-weigh-ok.png": 1.5,
  "no-liquids.png": 0.7,
  "pay.png": 0.5,
  "agree.png": 1.5,

};

// Константы таймингов
const ANSWER_DELAY = 1500; // задержка перед показом ответа, мс

// ==========================
// Инициализация
// ==========================

// Скрываем персонажей
leftCharacterContainer.style.display = "none";
rightCharacterContainer.style.display = "none";

// Скрываем все кнопки, кроме первой ("Старт")
answerBtns.forEach((btn, i) => {
  if (i !== 0) btn.style.display = "none";
});
answerBtns[0].textContent = "Get Started";

// ==========================
// Основные функции
// ==========================

// ==========================
// Конфиг модификаторов левого персонажа
// ==========================
const leftCharacterModifiers = {
  "airport-waiting-place.jpg": { visible: false }, // скрыть персонажа
  "checkin.jpg": { visible: true, src: "airport_staff.png" }, // показать с другой картинкой
  "security-check.png": { visible: true, src: "security.png" },
  "lounge-sleep.png": { visible: true, src: "megaphone.png"},
  "airport_coffee.png": { visible: true, src: "megaphone.png"},
  "barista-write.png": { visible: true, src: "barista.png"},
};

const defaultLeftCharacterSrc = "person_left.png"; // стандартная картинка

// ==========================
// Функция применения модификатора
// ==========================
function applyLeftCharacterModifier(node) {
  const loc = (node.locations || [node.location])[0];
  const mod = leftCharacterModifiers[loc];

  const leftCharacterImg = leftCharacterContainer.querySelector("img");

  if (!leftCharacterImg) return; // если img нет, выходим

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
  } else {
    // Локация не в списке — оставляем текущую картинку и видимость без изменений
    // Ничего не делаем
  }
}

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

// Проверка модификаторов времени
function checkTimeModifier(node) {
  if (!node) return;

  const locs = node.locations || [node.location];
  locs.forEach(loc => {
    if (timeModifiers[loc] && !modifiedLocations.has(loc)) {
      remainingTime = Math.floor(remainingTime * timeModifiers[loc]);
      modifiedLocations.add(loc);
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

      // Прячем кнопку "Старт"
      answerBtns[0].style.display = "none";

      // Показываем персонажей и остальные кнопки
      leftCharacterContainer.style.display = "";
      rightCharacterContainer.style.display = "";
      answerBtns.forEach(btn => (btn.style.display = ""));

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
answerBtns[0].addEventListener("click", startGame);
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
  answersContainer.innerHTML = "";

  // Сбрасываем персонажей
  leftCharacterContainer.style.display = "none";
  rightCharacterContainer.style.display = "none";
  const leftImg = leftCharacterContainer.querySelector("img");
  if (leftImg) leftImg.src = defaultLeftCharacterSrc;
}
