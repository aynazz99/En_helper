// Инициализация Firebase (используем Realtime Database, как в исходном коде)
// Предполагается, что Firebase SDK загружен глобально через <script> теги.
const firebaseConfig = {
  apiKey: "AIzaSyCgSFDj7fRw6HSvZyOz1g5IM749f2sY55M",
  authDomain: "wordquiz-659d7.firebaseapp.com",
  databaseURL: "https://wordquiz-659d7-default-rtdb.firebaseio.com",
  projectId: "wordquiz-659d7",
  storageBucket: "wordquiz-659d7.firebasestorage.app",
  messagingSenderId: "785560761880",
  appId: "1:785560761880:web:9455e5767af0e0b9b1f56d"
};

// Проверяем, что глобальный объект 'firebase' доступен, прежде чем инициализировать
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
} else {
  console.error("❌ Firebase SDK не загружен!");
}

const database = typeof firebase !== 'undefined' ? firebase.database() : null;
let currentProfileId = null;

// Объявление переменных DOM
const answerInput = document.getElementById("answerInput");
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const imageContainer = document.getElementById('imageContainer');

// --- ЛОГИКА АВТОВХОДА ЧЕРЕЗ TELEGRAM ---

/**
 * Получает информацию о пользователе из Telegram WebApp.
 * @param {object} tg - Глобальный объект Telegram WebApp.
 * @returns {object|null} Объект с id и name пользователя или null.
 */
function getTgUserInfo(tg) {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
    console.error("❌ Данные пользователя Telegram WebApp не найдены.");
    return null;
  }
  const user = tg.initDataUnsafe.user;
  return {
    // Telegram ID используем как ключ профиля. Преобразуем в строку.
    id: user.id.toString(), 
    // Используем username или имя как отображаемое имя
    name: user.username || user.first_name || 'Анонимный Пользователь'
  };
}

/**
 * Автоматически логинит или создает профиль в Firebase на основе данных Telegram.
 * @param {object} tg - Глобальный объект Telegram WebApp.
 */
async function autoLoginOrCreateProfile(tg) {
  const userInfo = getTgUserInfo(tg);

  if (!database) {
    console.error("⛔ Firebase Realtime Database не инициализирована.");
    displayFatalError("Ошибка: База данных не инициализирована.");
    return;
  }

  if (!userInfo) {
    // Показываем ошибку, если данные Telegram отсутствуют
    displayFatalError("Ошибка: Приложение должно быть запущено в Telegram Mini App.");
    return;
  }

  const { id: tgUserId, name: tgUserName } = userInfo;
  const profileRef = database.ref("profiles/" + tgUserId);

  try {
    const snapshot = await profileRef.get();

    if (snapshot.exists()) {
      // Профиль найден, логинимся
      currentProfileId = tgUserId;
      console.log("✅ Профиль загружен (TG ID):", tgUserId);
    } else {
      // Профиль не существует, создаем новый
      await profileRef.set({ 
        name: tgUserName, 
        knownWords: [] // Инициализация массива слов
      });
      currentProfileId = tgUserId;
      console.log(`✨ Новый профиль создан для ${tgUserName} (ID: ${tgUserId})`);
    }

    // Сразу показываем основной интерфейс
    showQuizUI();
    updateKnownCounter();

  } catch (error) {
    console.error("❌ Ошибка при работе с Firebase:", error);
    displayFatalError(`Ошибка базы данных: ${error.message}`);
  }
}

/**
 * Отображает фатальную ошибку вместо интерфейса приложения.
 * @param {string} message - Сообщение об ошибке.
 */
function displayFatalError(message) {
  const container = document.getElementById('welcomeContainer') || document.body;
  container.innerHTML = `<div class="p-4 text-center text-red-600 font-bold" style="font-size: 1.2rem;">
    ${message}
  </div>`;
}

// --- ФУНКЦИИ ИНИЦИАЛИЗАЦИИ И DOMContentLoaded ---

document.addEventListener("DOMContentLoaded", () => {
  // Инициализация Telegram WebApp
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    // Дополнительно устанавливаем высоту WebApp, если нужно
    tg.expand(); 
  }

  // Запуск автоматического входа/создания профиля
  autoLoginOrCreateProfile(tg);
  
  // Регистрация Service Worker (оставлена из оригинального кода)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ Service Worker зарегистрирован"))
      .catch(err => console.error("❌ Ошибка Service Worker:", err));
  }
});

// --- ЛОГИКА ВИКТОРИНЫ (СОХРАНЕНА) ---

// функция для обновления счётчика knownWords текущего профиля
async function updateKnownCounter() {
  if (!currentProfileId || !database) return;

  const snapshot = await database.ref(`profiles/${currentProfileId}/knownWords`).get();
  const words = snapshot.val() || [];
  const uniqueWords = [...new Set(words)];

  // находим элемент с цифрой
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
  const levelBtn = document.getElementById("levelBtn"); 
  const counter = document.getElementById("knownCounter"); 

  if (welcome) welcome.style.display = "none";
  if (inputModeDiv) inputModeDiv.style.display = "block";
  if (submitWrapper) submitWrapper.style.display = "block";
  if (counter) counter.style.display = "flex";
  if(imageContainer) imageContainer.style.display = 'flex'
  
  const container = document.getElementById('welcomeContainer');
  // Удаляем пустой контейнер (если он существует)
  if (container) container.remove();
}


// функция проверки: только английские буквы, пробел, дефис и апостроф
function isValidWord(word) {
  return /^[a-zA-Z\s'-]+$/.test(word);
}

// Обработчик кнопки отправки ответа
if (submitAnswerBtn) {
  submitAnswerBtn.addEventListener("click", async () => {
    const newWord = answerInput.value.trim();

    if (!currentProfileId) {
      showFeedbackInsideInput("Профиль не загружен!", true);
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
}


// функция для подсказки внутри input с подпрыгиванием
function showFeedbackInsideInput(message, isError) {
  const originalPlaceholder = "Введите слово на английском";
  answerInput.value = "";
  answerInput.placeholder = message;

  // добавляем анимацию и цвет рамки
  answerInput.classList.add("bounce");
  answerInput.style.borderColor = isError ? "red" : "green";

  setTimeout(() => {
    // возвращаем всё в исходное состояние
    answerInput.focus();
    answerInput.classList.remove("bounce");
    answerInput.placeholder = originalPlaceholder;
    answerInput.style.borderColor = "";
  }, 1500); // подсказка 1.5 секунды
  
}
