// ==============================
// Инициализация Firebase
// ==============================
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

// ==============================
// Переменные
// ==============================
let currentProfileId = null;
const imageContainer = document.getElementById('imageContainer');
imageContainer.style.display = 'none';
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const answerInput = document.getElementById("answerInput");

// ==============================
// Telegram WebApp
// ==============================
const webApp = window.Telegram?.WebApp;
let telegramUser = null;

if (webApp) {
  webApp.ready();
  telegramUser = webApp.initDataUnsafe?.user || null;
}

// ==============================
// Создание профиля Telegram в Firebase
// ==============================
async function createOrGetTelegramProfile() {
  if (!telegramUser) return;

  const profileId = telegramUser.id; // уникальный Telegram ID
  const profileRef = database.ref("profiles/" + profileId);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) {
    await profileRef.set({
      name: telegramUser.first_name || "User",
      username: telegramUser.username || "",
      knownWords: []
    });
    console.log("Создан новый профиль Telegram:", telegramUser.first_name);
  } else {
    console.log("Профиль Telegram уже существует:", snapshot.val().name);
  }

  currentProfileId = profileId;
  updateKnownCounter();
  showQuizUI();
}

// ==============================
// Обновление счётчика слов
// ==============================
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

// ==============================
// Показ UI после выбора профиля
// ==============================
function showQuizUI() {
  const inputModeDiv = document.getElementById("inputModeDiv");
  const submitWrapper = document.getElementById("submitWrapper");
  const welcome = document.getElementById("welcome");
  const counter = document.getElementById("knownCounter");

  if (welcome) welcome.style.display = "none";
  if (inputModeDiv) inputModeDiv.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if(imageContainer) imageContainer.style.display = 'flex';

  const container = document.getElementById('welcomeContainer');
  if (container) container.remove();
}

// ==============================
// Добавление нового слова
// ==============================
function isValidWord(word) {
  return /^[a-zA-Z\s'-]+$/.test(word);
}

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

  const profileRef = database.ref(`profiles/${currentProfileId}/knownWords`);
  const snapshot = await profileRef.get();
  const words = snapshot.val() || [];

  if (words.includes(newWord)) {
    showFeedbackInsideInput("Слово уже есть!", true);
  } else {
    words.push(newWord);
    await profileRef.set(words);
    showFeedbackInsideInput("Слово добавлено!", false);
    updateKnownCounter();
  }
});

// ==============================
// Подсказка внутри input с подпрыгиванием
// ==============================
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

// ==============================
// Запуск при загрузке страницы
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  if (telegramUser) {
    await createOrGetTelegramProfile();
  } else {
    alert("Эта версия работает только внутри Telegram Mini App");
  }
});
