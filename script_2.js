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
const imageContainer = document.getElementById('imageContainer');
if(imageContainer) imageContainer.style.display = 'none';

// Подробный лог действий профиля
async function logProfileAction(profileId, action, details = "") {
  const logRef = database.ref(`profiles/${profileId}/log`);
  const timestamp = new Date().toISOString();
  await logRef.push({ timestamp, action, details });
}

// Функция обновления счётчика knownWords
async function updateKnownCounter() {
  if (!currentProfileId) return;

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

    await logProfileAction(currentProfileId, "updateKnownCounter", `Count: ${uniqueWords.length}`);
  } catch (error) {
    console.error("Ошибка updateKnownCounter:", error);
    if (currentProfileId) await logProfileAction(currentProfileId, "error", `updateKnownCounter: ${error.message}`);
  }
}

// Автоматический вход через Telegram Mini App
async function autoLogin() {
  try {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser) {
      console.error("Telegram user data not found!");
      return;
    }

    const profileId = String(tgUser.id);
    const profileName = tgUser.username || tgUser.first_name || `User${profileId}`;
    currentProfileId = profileId;

    const profileRef = database.ref(`profiles/${profileId}`);
    const snapshot = await profileRef.get();

    if (!snapshot.exists()) {
      // Создаём новый профиль
      await profileRef.set({
        name: profileName,
        knownWords: [],
        log: {}
      });
      console.log(`Создан новый профиль: ${profileName}`);
      await logProfileAction(profileId, "createProfile", `Profile created for ${profileName}`);
    } else {
      console.log(`Профиль найден: ${snapshot.val().name}`);
      await logProfileAction(profileId, "loadProfile", `Profile loaded: ${snapshot.val().name}`);
    }

    // Показ интерфейса викторины
    showQuizUI();
    await updateKnownCounter();

  } catch (error) {
    console.error("Ошибка autoLogin:", error);
    if (currentProfileId) await logProfileAction(currentProfileId, "error", `autoLogin: ${error.message}`);
  }
}

// Функция показа UI викторины
function showQuizUI() {
  const inputModeDiv = document.getElementById("inputModeDiv");
  const submitWrapper = document.getElementById("submitWrapper");
  const welcome = document.getElementById("welcome");
  const counter = document.getElementById("knownCounter");

  if (welcome) welcome.style.display = "none";
  if (inputModeDiv) inputModeDiv.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if (imageContainer) imageContainer.style.display = 'flex';

  const container = document.getElementById('welcomeContainer');
  if (container) container.remove();
}

// Проверка слова
function isValidWord(word) {
  return /^[a-zA-Z\s'-]+$/.test(word);
}

// Обработчик добавления слова
submitAnswerBtn.addEventListener("click", async () => {
  const newWord = answerInput.value.trim();
  if (!currentProfileId) return;

  if (!newWord) {
    showFeedbackInsideInput("Введите слово!", true);
    return;
  }

  if (!isValidWord(newWord)) {
    showFeedbackInsideInput("Только английские буквы и слова", true);
    return;
  }

  try {
    const profileRef = database.ref(`profiles/${currentProfileId}/knownWords`);
    const snapshot = await profileRef.get();
    const words = snapshot.val() || [];

    if (words.includes(newWord)) {
      showFeedbackInsideInput("Слово уже есть!", true);
    } else {
      words.push(newWord);
      await profileRef.set(words);
      showFeedbackInsideInput("Слово добавлено!", false);
      await logProfileAction(currentProfileId, "addWord", newWord);
      updateKnownCounter();
    }
  } catch (error) {
    console.error("Ошибка добавления слова:", error);
    await logProfileAction(currentProfileId, "error", `addWord: ${error.message}`);
  }
});

// Подсказка внутри input
function showFeedbackInsideInput(message, isError) {
  const originalPlaceholder = "Введите слово на английском";
  answerInput.value = "";
  answerInput.placeholder = message;
  answerInput.classList.add("bounce");
  answerInput.style.borderColor = isError ? "red" : "green";

  setTimeout(() => {
    answerInput.focus();
    answerInput.classList.remove("bounce");
    answerInput.placeholder = originalPlaceholder;
    answerInput.style.borderColor = "";
  }, 1500);
}

// Отключение масштабирования
document.addEventListener('gesturestart', e => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);
document.addEventListener('touchstart', e => { if(e.touches.length > 1) e.preventDefault(); }, {passive:false});

// Запуск авто-входа после загрузки страницы
document.addEventListener("DOMContentLoaded", autoLogin);

// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .then(() => console.log("✅ Service Worker зарегистрирован"))
    .catch(err => console.error("❌ Ошибка Service Worker:", err));
}
