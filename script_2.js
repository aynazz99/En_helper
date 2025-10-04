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

document.addEventListener("DOMContentLoaded", () => {
  showLoading(true);
  attemptLogin(0);
});

// 🔁 Повторная попытка входа
function attemptLogin(retryCount) {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (!tgUser || !tgUser.id) {
    if (retryCount < 5) {
      setTimeout(() => attemptLogin(retryCount + 1), 1000);
    } else {
      showLoading(false);
      alert("❌ Не удалось получить данные Telegram. Проверьте соединение.");
    }
    return;
  }

  currentProfileId = String(tgUser.id);
  const displayName = tgUser.username || tgUser.first_name || "Telegram User";

  const profileRef = database.ref("profiles/" + currentProfileId);
  profileRef.get()
    .then(snapshot => {
      if (!snapshot.exists()) {
        return profileRef.set({ name: displayName, knownWords: [] });
      }
    })
    .then(() => {
      console.log("✅ Профиль готов:", currentProfileId);
      showLoading(false);
      showQuizUI();
      updateKnownCounter();
    })
    .catch(error => {
      console.error("Ошибка входа:", error);
      showLoading(false);
      alert("⚠️ Ошибка при загрузке профиля. Попробуйте позже.");
    });

  // Регистрация Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ Service Worker зарегистрирован"))
      .catch(err => console.error("❌ Ошибка Service Worker:", err));
  }
}

// 🔄 Показ/скрытие загрузки
function showLoading(show) {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = show ? "flex" : "none";
}

// 📦 Интерфейс
function showQuizUI() {
  const inputModeDiv = document.getElementById("inputModeDiv");
  const submitWrapper = document.getElementById("submitWrapper");
  const welcome = document.getElementById("welcome");
  const counter = document.getElementById("knownCounter");
  const imageContainer = document.getElementById("imageContainer");

  if (welcome) welcome.style.display = "none";
  if (inputModeDiv) inputModeDiv.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if (imageContainer) imageContainer.style.display = "flex";

  const container = document.getElementById("welcomeContainer");
  if (container) container.remove();
}

// ✅ Проверка слова
function isValidWord(word) {
  return /^[a-zA-Z\s'-]+$/.test(word);
}

// ➕ Добавление слова
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const answerInput = document.getElementById("answerInput");

submitAnswerBtn.addEventListener("click", async () => {
  const newWord = answerInput.value.trim();

  if (!currentProfileId) {
    alert("Ошибка: профиль не загружен.");
    return;
  }

  if (!newWord || !isValidWord(newWord)) {
    showInputFeedback("Только английские буквы и слова", true);
    return;
  }

  try {
    const profileRef = database.ref("profiles/" + currentProfileId + "/knownWords");
    const snapshot = await profileRef.get();
    const words = snapshot.val() || [];

    if (words.includes(newWord)) {
      showInputFeedback("Слово уже есть!", true);
    } else {
      words.push(newWord);
      await profileRef.set(words);
      showInputFeedback("Слово добавлено!", false);
      updateKnownCounter();
    }
  } catch (error) {
    console.error("Ошибка добавления слова:", error);
    showInputFeedback("Ошибка сети!", true);
  }
});

// 🔢 Обновление счётчика
async function updateKnownCounter() {
  try {
    const snapshot = await database.ref(`profiles/${currentProfileId}/knownWords`).get();
    const words = snapshot.val() || [];
    const uniqueWords = [...new Set(words)];

    const numberElement = document.querySelector("#knownCounter .kc-number");
    if (numberElement) {
      numberElement.textContent = uniqueWords.length;
      numberElement.classList.add("bounce");
      setTimeout(() => numberElement.classList.remove("bounce"), 600);
    }
  } catch (error) {
    console.error("Ошибка счётчика:", error);
  }
}

// ✨ Анимация поля ввода
function showInputFeedback(message, isError) {
  answerInput.value = "";
  answerInput.placeholder = message;
  answerInput.classList.add("bounce");
  answerInput.style.borderColor = isError ? "red" : "green";

  setTimeout(() => {
    answerInput.classList.remove("bounce");
    answerInput.style.borderColor = "";
    answerInput.placeholder = "Введите слово на английском";
    answerInput.focus();
  }, 1500);
}

// 🚫 Отключение масштабирования
document.addEventListener("gesturestart", e => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener("touchend", e => {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);
document.addEventListener("touchstart", e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
