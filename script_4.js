let dialogs = {};
let currentDialog = null;
let currentNode = null;
let timerInterval;
let timerActive = false; // активность таймера

const dialogSelect = document.getElementById("DialogSelect");
const leftBubble = document.querySelector(".left-bubble");
const rightBubble = document.querySelector(".right-bubble");
const answersContainer = document.getElementById("answers");
const imageContainer = document.getElementById("imageContainer");
const startBtn = document.getElementById("startBtn");
const answerBtns = document.querySelectorAll(".answerBtn");

// Получаем персонажей и пузыри
const leftCharacterContainer = document.querySelector(".character.left");
const rightCharacterContainer = document.querySelector(".character.right");

// Скрываем их изначально
leftCharacterContainer.style.display = "none";
rightCharacterContainer.style.display = "none";

// Сначала скрываем все кнопки, кроме первой
answerBtns.forEach((btn, i) => {
  if (i !== 0) btn.style.display = "none";
});

// Устанавливаем первую кнопку как Старт
answerBtns[0].textContent = "Get Started";

// таблица соответствий location → картинка левого персонажа
const leftCharacterMap = {
  "security-check.png": "security.png",
  "checkin.jpg": "airport_staff.png",
  "boarding-gate.png": "gate_staff.png",
  "customs.png": "customs_officer.png"
};


// Показ узла
function showNode(nodeKey) {
  const node = currentDialog.nodes[nodeKey];
  currentNode = nodeKey;
  currentNodeObj = node; // сохраняем объект текущего узла

  updateImage(node);

  // Сброс пузырей
  leftBubble.textContent = "";
  rightBubble.textContent = "";

  // Реплика персонажа
  if (node.speaker === "left") {
    const leftCharacter = document.getElementById("leftCharacter");

    // Меняем картинку ТОЛЬКО если есть соответствие
    if (node.location && leftCharacterMap[node.location]) {
      leftCharacter.src = leftCharacterMap[node.location];
    }

    leftBubble.textContent = node.text;
  } else if (node.speaker === "right") {
    rightBubble.textContent = node.text;
  }
  
  if (node.location === "airport-waiting-place.jpg" || node.location === "boarding-gate.png") {
    showPopup("Поздравляем, вы смогли улететь ✈️", true);
    return;
}



  // Кнопки только если есть ответы
  answersContainer.innerHTML = "";
  if (node.answers) {
    node.answers.forEach(ans => {
      const nextNodeKey = ans.next;
      const nextNode = currentDialog.nodes[nextNodeKey];

      const btn = document.createElement("button");
      btn.className = "answerBtn";
      
      // Используем текст кнопки из JSON
      btn.textContent = ans.text;


btn.onclick = () => {
  const allBtns = answersContainer.querySelectorAll("button");

  // показываем ответ пользователя
  leftBubble.textContent = "";
  rightBubble.textContent = ans.text || "";

  // показываем картинку nextNode, если это right
  const nextNode = currentDialog.nodes[ans.next];
  if (nextNode.speaker === "right") {
    updateImage(nextNode);
  }

  // скрываем кнопки
  allBtns.forEach(b => b.style.display = "none");

  // через 1.5 секунды показываем их снова и переходим дальше
  setTimeout(() => {
    showNode(ans.next);
    allBtns.forEach(b => b.style.display = "");
  }, 1500);
};




      answersContainer.appendChild(btn);
    });

  } else {
    // Если у текущей ноды нет ответов и next нет — диалог завершён
    if (!node.next || !(node.next in currentDialog.nodes)) {
      leftBubble.textContent = "";
      rightBubble.textContent = "Диалог завершён.";
      answersContainer.style.display = "none"; // скрываем кнопки
    } else {
      showNode(node.next);
    }
  }
}


function updateImage(node) {
  imageContainer.innerHTML = "";

  if (node.locations) {
    node.locations.forEach(loc => {
      const img = document.createElement("img");
      img.src = "locations/" + loc;
      img.alt = "Location";
      imageContainer.appendChild(img);
    });
  } else if (node.location) {
    const img = document.createElement("img");
    img.src = "locations/" + node.location;
    img.alt = "Location";
    imageContainer.appendChild(img);
  }
}


// Таймер на 3 минуты
let totalTime = 3 * 60; // 3 минуты в секундах
let remainingTime = totalTime;

const timeText = document.getElementById('timeText');
const timeBar = document.getElementById('timeBar');

// Форматирование времени в mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Функция для динамического цвета прогресс-бара
function getDynamicColor(percent) {
  // Инвертируем прогресс: 100% -> 0%, 0% -> 100% (чтобы цвет уменьшался)
  const inverted = 100 - percent;

  let hue;
  if (inverted < 50) {
    // верхняя половина: зелёный -> желтый
    hue = 120 - (inverted / 50) * 60; // 120° → 60°
  } else {
    // нижняя половина: желтый -> красный
    hue = 60 - ((inverted - 50) / 50) * 60; // 60° → 0°
  }
  return `hsl(${hue}, 90%, 50%)`;
}


// Функция запуска игры
function startGame() {
  fetch("dialogs.json")
    .then(res => res.json())
    .then(data => {
      dialogs = data;

      const firstTopic = Object.keys(dialogs)[0];
      currentDialog = dialogs[firstTopic];
      currentNode = currentDialog.start;

      // Скрываем кнопку Старт
      answerBtns[0].style.display = "none";

      // Показываем персонажей
      leftCharacterContainer.style.display = "";
      rightCharacterContainer.style.display = "";

      // Показываем остальные кнопки
      answerBtns.forEach(btn => btn.style.display = "");

      // Показываем первый узел
      showNode(currentNode);

      // Сбрасываем таймер
      clearInterval(timerInterval);
      remainingTime = totalTime;
      timerInterval = setInterval(updateTimer, 1000);
    });
}

  // Обработчик на кнопку "Старт"
  answerBtns[0].addEventListener("click", startGame);

function updateTimer() {
  // Обновляем текст и прогресс-бар
  timeText.textContent = `Оставшееся время до вылета самолёта: ${formatTime(remainingTime)}`;
  const progressPercent = (remainingTime / totalTime) * 100;
  timeBar.style.width = `${progressPercent}%`;
  timeBar.style.backgroundColor = getDynamicColor(progressPercent);

  // Уменьшаем оставшееся время
  if (remainingTime > 0) {
    remainingTime--;
  } else {
    clearInterval(timerInterval); // останавливаем таймер
    showPopup("Время вышло, вы опоздали на рейс ❌", false);
    return; // дальше не показываем кнопки
  }
}




function showPopup(message, isSuccess = true) {
  clearInterval(timerInterval); // останавливаем таймер на всякий случай
  
  const popup = document.getElementById("popup");
  popup.style.display = "flex";

  const popupMessage = popup.querySelector(".popup-message");
  popupMessage.textContent = message;

  const restartBtn = document.getElementById("restartBtn");
  restartBtn.onclick = () => {
    popup.style.display = "none";
    startGame(); // перезапуск игры
  };

  // Можно добавить разные стили для успеха/провала
  popup.style.backgroundColor = isSuccess ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.3)";
  // Конфетти только при успехе
  if (isSuccess && typeof confetti === "function") {
    confetti({
      particleCount: 200,
      spread: 100,
      startVelocity: 30,
      gravity: 0.5,
      ticks: 600,
      origin: { x: 0.5, y: 0.4 }
    });
  }
}



