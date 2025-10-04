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

document.addEventListener("DOMContentLoaded", async () => {
  const imageContainer = document.getElementById('imageContainer');
  const quizContainer = document.getElementById("inputModeDiv");
  const submitWrapper = document.getElementById("submitWrapper");
  const counter = document.getElementById("knownCounter");
  const welcome = document.getElementById("welcome");
  const welcomeContainer = document.getElementById('welcomeContainer');
  const initDataContainer = document.getElementById('initDataContainer');

  imageContainer.style.display = 'none';

  // Проверяем, есть ли Telegram WebApp
  if (!window.Telegram?.WebApp) {
    alert("Этот скрипт работает только внутри Telegram Mini App!");
    return;
  }

  // Получаем initData
  const tg = window.Telegram.WebApp;
  const initData = tg.initData || {};
  const initDataUnsafe = tg.initDataUnsafe || {};

  // Показываем на экране все данные initData
  if (initDataContainer) {
    initDataContainer.textContent = JSON.stringify({ initData, initDataUnsafe }, null, 2);
  }

  // Берём user_id для профиля
  const userId = initDataUnsafe.user?.id;
  if (!userId) {
    alert("Не удалось определить user_id из initData!");
    return;
  }

  let currentProfileId = userId;

  // Загружаем профиль по user_id
  const profileRef = database.ref(`profiles/${currentProfileId}`);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) {
    // Если профиля нет — создаём пустой
    await profileRef.set({
      name: initDataUnsafe.user?.first_name || "Unknown",
      knownWords: []
    });
  }

  // Показываем UI квиза
  if (welcome) welcome.style.display = "none";
  if (quizContainer) quizContainer.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if (imageContainer) imageContainer.style.display = 'flex';
  if (welcomeContainer) welcomeContainer.remove();

  // Функция обновления счётчика
  async function updateKnownCounter() {
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

  updateKnownCounter();

  // Проверка корректности слова
  function isValidWord(word) {
    return /^[a-zA-Z\s'-]+$/.test(word);
  }

  // Обработчик кнопки Submit
  const submitAnswerBtn = document.getElementById("submitAnswerBtn");
  const answerInput = document.getElementById("answerInput");

  submitAnswerBtn.addEventListener("click", async () => {
    const newWord = answerInput.value.trim();

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

  // Регистрация Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ Service Worker зарегистрирован"))
      .catch(err => console.error("❌ Ошибка Service Worker:", err));
  }
});
