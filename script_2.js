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
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    alert("Эта версия работает только внутри Telegram Mini App");
    return;
  }

  webApp.ready();
  const telegramUser = webApp.initDataUnsafe?.user;
  if (!telegramUser) {
    alert("Не удалось получить данные Telegram");
    return;
  }

  const answerInput = document.getElementById("answerInput");
  const submitAnswerBtn = document.getElementById("submitAnswerBtn");
  const imageContainer = document.getElementById("imageContainer");
  imageContainer.style.display = "none";

  // Создаём или получаем профиль
  currentProfileId = telegramUser.id;
  const profileRef = database.ref("profiles/" + currentProfileId);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) {
    await profileRef.set({
      name: telegramUser.first_name || "User",
      username: telegramUser.username || "",
      knownWords: []
    });
  }

  showQuizUI();
  await updateKnownCounter();

  // Обработчик добавления слова
  submitAnswerBtn.addEventListener("click", async () => {
    const newWord = answerInput.value.trim();
    if (!newWord) {
      showFeedback("Введите слово!", true);
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(newWord)) {
      showFeedback("Только английские буквы", true);
      return;
    }

    const wordsSnapshot = await database.ref(`profiles/${currentProfileId}/knownWords`).get();
    const words = wordsSnapshot.val() || [];
    if (words.includes(newWord)) {
      showFeedback("Слово уже есть!", true);
      return;
    }

    words.push(newWord);
    await database.ref(`profiles/${currentProfileId}/knownWords`).set(words);
    showFeedback("Слово добавлено!", false);
    updateKnownCounter();
  });

  async function updateKnownCounter() {
    const snapshot = await database.ref(`profiles/${currentProfileId}/knownWords`).get();
    const words = snapshot.val() || [];
    const numberElement = document.querySelector("#knownCounter .kc-number");
    if (numberElement) {
      numberElement.textContent = [...new Set(words)].length;
      numberElement.classList.add("bounce");
      setTimeout(() => numberElement.classList.remove("bounce"), 600);
    }
  }

  function showQuizUI() {
    const inputModeDiv = document.getElementById("inputModeDiv");
    const submitWrapper = document.getElementById("submitWrapper");
    const counter = document.getElementById("knownCounter");
    const container = document.getElementById('welcomeContainer');

    if (inputModeDiv) inputModeDiv.style.display = "block";
    if (submitWrapper) submitWrapper.style.display = "block";
    if (counter) counter.style.display = "flex";
    if (imageContainer) imageContainer.style.display = 'flex';
    if (container) container.remove();
  }

  function showFeedback(message, isError) {
    const originalPlaceholder = "Введите слово на английском";
    answerInput.value = "";
    answerInput.placeholder = message;
    answerInput.classList.add("bounce");
    answerInput.style.borderColor = isError ? "red" : "green";
    setTimeout(() => {
      answerInput.classList.remove("bounce");
      answerInput.placeholder = originalPlaceholder;
      answerInput.style.borderColor = "";
      answerInput.focus();
    }, 1500);
  }
});
