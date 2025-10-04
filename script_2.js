// ================================
// Инициализация Firebase
// ================================
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

// ================================
// DOM элементы
// ================================
const logContainer = document.getElementById('initDataContainer'); // для логов и debug
const imageContainer = document.getElementById('imageContainer');
const quizContainer = document.getElementById("inputModeDiv");
const submitWrapper = document.getElementById("submitWrapper");
const counter = document.getElementById("knownCounter");
const welcome = document.getElementById("welcome");
const welcomeContainer = document.getElementById('welcomeContainer');
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const answerInput = document.getElementById("answerInput");

imageContainer.style.display = 'none';

// ================================
// Функция логирования
// ================================
function log(msg, data = null) {
  console.log(msg, data || '');
  if (logContainer) {
    logContainer.textContent += `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (data) logContainer.textContent += `: ${JSON.stringify(data, null, 2)}`;
    logContainer.textContent += '\n';
  }
}

// ================================
// Ждём инициализации WebApp
// ================================
const waitForWebApp = () => new Promise(res => {
  const check = () => {
    if (window.Telegram?.WebApp) {
      res(window.Telegram.WebApp);
    } else {
      setTimeout(check, 50);
    }
  };
  check();
});

waitForWebApp().then(async tg => {
  log("Telegram WebApp найден");
  tg.ready();
  log("Telegram WebApp готов");

  // ================================
  // Получаем initData
  // ================================
  const initData = tg.initData || {};
  const initDataUnsafe = tg.initDataUnsafe || {};

  log("initData", initData);
  log("initDataUnsafe", initDataUnsafe);

  // ================================
  // Определяем профиль по user_id
  // ================================
  const userId = initDataUnsafe.user?.id;
  if (!userId) {
    log("Ошибка: не удалось получить user_id");
    alert("Не удалось определить user_id!");
    return;
  }

  let currentProfileId = userId;
  log("Текущий профиль (user_id)", currentProfileId);

  // ================================
  // Проверяем профиль в Firebase
  // ================================
  const profileRef = database.ref(`profiles/${currentProfileId}`);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) {
    log("Профиль не найден, создаём новый", { name: initDataUnsafe.user?.first_name || "Unknown" });
    await profileRef.set({
      name: initDataUnsafe.user?.first_name || "Unknown",
      knownWords: []
    });
  } else {
    log("Профиль найден", snapshot.val());
  }

  // ================================
  // Показ UI квиза
  // ================================
  if (welcome) welcome.style.display = "none";
  if (quizContainer) quizContainer.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if (imageContainer) imageContainer.style.display = 'flex';
  if (welcomeContainer) welcomeContainer.remove();
  log("UI квиза показан");

  // ================================
  // Функция обновления счётчика knownWords
  // ================================
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
    log("Обновлён счётчик слов", uniqueWords.length);
  }

  updateKnownCounter();

  // ================================
  // Проверка корректности слова
  // ================================
  function isValidWord(word) {
    return /^[a-zA-Z\s'-]+$/.test(word);
  }

  // ================================
  // Обработчик кнопки Submit
  // ================================
  submitAnswerBtn.addEventListener("click", async () => {
    const newWord = answerInput.value.trim();
    log("Попытка добавить слово", newWord);

    if (!newWord) {
      showFeedbackInsideInput("Введите слово!", true);
      return;
    }

    if (!isValidWord(newWord)) {
      showFeedbackInsideInput("Только английские буквы и слова", true);
      return;
    }

    const wordsRef = database.ref(`profiles/${currentProfileId}/knownWords`);
    const snapshot = await wordsRef.get();
    const words = snapshot.val() || [];

    if (words.includes(newWord)) {
      showFeedbackInsideInput("Слово уже есть!", true);
      log("Слово уже есть в профиле", newWord);
    } else {
      words.push(newWord);
      await wordsRef.set(words);
      showFeedbackInsideInput("Слово добавлено!", false);
      updateKnownCounter();
      log("Слово добавлено в профиль", newWord);
    }
  });

  // ================================
  // Подсказка в input
  // ================================
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

  // ================================
  // Регистрация Service Worker
  // ================================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => log("Service Worker зарегистрирован"))
      .catch(err => log("Ошибка Service Worker", err));
  }
});
