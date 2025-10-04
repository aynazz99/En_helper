
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


// получаем ссылки на DOM-элементы
const answerInput = document.getElementById("answerInput");
const submitAnswerBtn = document.getElementById("submitAnswerBtn");

// функция для обновления счётчика knownWords текущего профиля
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

function showQuizUI() {
  const inputModeDiv = document.getElementById("inputModeDiv");
  const submitWrapper = document.getElementById("submitWrapper");
  const welcome = document.getElementById("welcome");
  const counter = document.getElementById("knownCounter");

  if (welcome) welcome.style.display = "none";
  if (inputModeDiv) inputModeDiv.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if (imageContainer) imageContainer.style.display = "flex";

  updateKnownCounter();

  const container = document.getElementById("welcomeContainer");
  if (container) container.remove();
  
  const textContainer = document.getElementById("textContainer");
  textContainer.textContent = "Проверим, сколько английских слов ты реально помнишь...";

}

// функция проверки: только английские буквы, пробел, дефис и апостроф
function isValidWord(word) {
  return /^[a-zA-Z\s'-]+$/.test(word);
}

// подсказка внутри input
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

// обработка добавления слова
submitAnswerBtn.addEventListener("click", async () => {
  const newWord = answerInput.value.trim();

  if (!currentProfileId) {
    showFeedbackInsideInput("Ошибка входа!", true);
    return;
  }

  if (!newWord) {
    showFeedbackInsideInput("Введите слово!", true);
    return;
  }

  if (!isValidWord(newWord)) {
    showFeedbackInsideInput("Только английские буквы и слова", true);
    return;
  }

  const profileRef = database.ref("profiles/" + currentProfileId + "/knownWords");
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

// Автоматический вход через Telegram Mini App
document.addEventListener("DOMContentLoaded", async () => {
  // получаем пользователя из Telegram
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    id: "test123", // фейковый id для теста в браузере
    username: "TestUser",
    first_name: "Test"
  };

  if (!tgUser || !tgUser.id) {
    alert("Ошибка: данные Telegram недоступны");
    return;
  }

  currentProfileId = tgUser.id.toString();

  const profileRef = database.ref("profiles/" + currentProfileId);
  const snapshot = await profileRef.get();

  if (snapshot.exists()) {
    console.log("✅ Профиль найден:", snapshot.val());
  } else {
    const newProfile = {
      name: tgUser.username || tgUser.first_name || "User",
      knownWords: []
    };
    await profileRef.set(newProfile);
    console.log("✅ Создан новый профиль:", newProfile);
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


