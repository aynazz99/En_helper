// script_2.js
// Инициализация Firebase
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

let currentProfileId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Автоматический вход через Telegram
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (!tgUser || !tgUser.id) {
    alert("Ошибка: данные Telegram недоступны.");
    return;
  }

  currentProfileId = String(tgUser.id);
  const displayName = tgUser.username || tgUser.first_name || "Telegram User";

  const profileRef = database.ref("profiles/" + currentProfileId);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) {
    await profileRef.set({
      name: displayName,
      knownWords: []
    });
    console.log("🆕 Профиль создан:", currentProfileId);
  } else {
    console.log("✅ Профиль найден:", currentProfileId);
  }

  showQuizUI();
  updateKnownCounter();

  // Регистрация Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ Service Worker зарегистрирован"))
      .catch(err => console.error("❌ Ошибка Service Worker:", err));
  }
});

// DOM элементы
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const answerInput = document.getElementById("answerInput");
const imageContainer = document.getElementById('imageContainer');
imageContainer.style.display = 'none';

// Функция отображения интерфейса
function showQuizUI() {
  const inputModeDiv = document.getElementById("inputModeDiv");
  const submitWrapper = document.getElementById("submitWrapper");
  const welcome = document.getElementById("welcome");
  const levelBtn = document.getElementById("levelBtn");
  const counter = document.getElementById("knownCounter");

  if (welcome) welcome.style.display = "none";
  if (inputModeDiv) inputModeDiv.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if (imageContainer) imageContainer.style.display = "flex";

  const container = document.getElementById('welcomeContainer');
  if (container) container.remove();
}

// Проверка допустимого слова
function isValidWord(word) {
  return /^[a-zA-Z\s'-]+$/.test(word);
}

// Обработка ответа
submitAnswerBtn.addEventListener("click", async () => {
  const newWord = answerInput.value.trim();

  if (!currentProfileId) {
    alert("Ошибка: профиль не загружен.");
    return;
  }

  if (!newWord || !isValidWord(newWord)) {
    answerInput.classList.add("bounce");
    answerInput.style.borderColor = "red";
    setTimeout(() => {
      answerInput.classList.remove("bounce");
      answerInput.style.borderColor = "";
    }, 1500);
    return;
  }

  const profileRef = database.ref("profiles/" + currentProfileId + "/knownWords");
  const snapshot = await profileRef.get();
  const words = snapshot.val() || [];

  if (words.includes(newWord)) {
    answerInput.placeholder = "Слово уже есть!";
  } else {
    words.push(newWord);
    await profileRef.set(words);
    answerInput.placeholder = "Слово добавлено!";
    updateKnownCounter();
  }

  answerInput.value = "";
  answerInput.classList.add("bounce");
  answerInput.style.borderColor = "green";
  setTimeout(() => {
    answerInput.classList.remove("bounce");
    answerInput.style.borderColor = "";
    answerInput.placeholder = "Введите слово на английском";
  }, 1500);
});

// Обновление счётчика
async function updateKnownCounter() {
  if (!currentProfileId) return;

  const snapshot = await database.ref(`profiles/${currentProfileId}/knownWords`).get();
  const words = snapshot.val() || [];
  const uniqueWords = [...new Set(words)];

  const numberElement = document.querySelector("#knownCounter .kc-number");
  if (numberElement) {
    numberElement.textContent = uniqueWords.length;
    numberElement.classList.add("bounce");
    setTimeout(() => numberElement.classList.remove("bounce"), 600);
  }
}

// Отключение масштабирования
document.addEventListener('gesturestart', e => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);
document.addEventListener('touchstart', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
