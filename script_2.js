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
const addProfileBtn = document.getElementById("addProfileBtn");
const popup = document.getElementById("profilePopup");
const profileInput = document.getElementById("profileNameInput");
const profileCancelBtn = document.getElementById("profileCancelBtn");
const profileAddBtn = document.getElementById("profileAddBtn");
const profileMessage = document.getElementById("profileMessage");
const listSelect = document.getElementById("ProfileSelect");

// ==============================
// Функция ожидания Telegram WebApp
// ==============================
function waitForTelegramWebApp(timeout = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.Telegram?.WebApp) {
        resolve(window.Telegram.WebApp);
      } else if (Date.now() - start > timeout) {
        reject("Telegram WebApp не найден");
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

// ==============================
// Основной запуск
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  let webApp;
  try {
    webApp = await waitForTelegramWebApp();
  } catch (err) {
    alert("Эта версия работает только внутри Telegram Mini App");
    return;
  }

  webApp.ready();
  const telegramUser = webApp.initDataUnsafe?.user;
  if (!telegramUser) {
    alert("Не удалось получить данные Telegram");
    return;
  }

  console.log("Telegram User:", telegramUser);

  // ==============================
  // Функции работы с профилями
  // ==============================
  async function loadProfiles() {
    const snapshot = await database.ref("profiles").get();
    listSelect.innerHTML = '<option disabled selected>Выберите профиль</option>';
    if (snapshot.exists()) {
      const profiles = snapshot.val();
      for (const id in profiles) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = profiles[id].name;
        listSelect.appendChild(option);
      }
    }
  }

  async function updateProfileSelect() {
    const snapshot = await database.ref("profiles").get();
    const profiles = snapshot.val() || {};
    listSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.value = "";
    placeholder.textContent = "Выберите профиль";
    listSelect.appendChild(placeholder);
    Object.keys(profiles).forEach(id => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = profiles[id].name;
      listSelect.appendChild(option);
    });
  }

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
    if(imageContainer) imageContainer.style.display = 'flex';
    const container = document.getElementById('welcomeContainer');
    if (container) container.remove();
  }

  // ==============================
  // Работа с профилями
  // ==============================
  listSelect.addEventListener("change", async () => {
    const profileId = listSelect.value;
    if (!profileId) return;

    const profileRef = database.ref("profiles/" + profileId);
    const snapshot = await profileRef.get();
    if (!snapshot.exists()) return;

    currentProfileId = profileId;
    showQuizUI();
    updateKnownCounter();
  });

  addProfileBtn.addEventListener("click", () => {
    profileInput.value = "";
    profileMessage.textContent = "";
    popup.classList.add("show");
    profileInput.focus();
  });

  function closePopup() {
    popup.classList.remove("show");
  }
  profileCancelBtn.addEventListener("click", closePopup);
  popup.addEventListener("click", e => { if (e.target === popup) closePopup(); });
  popup.addEventListener("touchstart", e => { if (e.target === popup) closePopup(); });

  profileAddBtn.addEventListener("click", async () => {
    const name = profileInput.value.trim();
    if (!name) {
      profileMessage.style.color = "red";
      profileMessage.textContent = "Введите имя профиля!";
      return;
    }
    const password = prompt("Придумайте пароль для профиля") || "";
    const profileId = name.replace(/\s+/g, "_");
    const profileRef = database.ref("profiles/" + profileId);
    const snapshot = await profileRef.get();
    if (!snapshot.exists()) {
      await profileRef.set({ name, password, knownWords: [] });
      profileMessage.style.color = "green";
      profileMessage.textContent = `Создан новый профиль: ${name}`;
      await updateProfileSelect();
      listSelect.value = profileId;
      currentProfileId = profileId;
      setTimeout(closePopup, 1500);
      showQuizUI();
    } else {
      profileMessage.style.color = "orange";
      profileMessage.textContent = `Профиль уже существует: ${name}`;
      profileInput.focus();
    }
  });

  await loadProfiles();

  // ==============================
  // Работа с вводом слова
  // ==============================
  function isValidWord(word) {
    return /^[a-zA-Z\s'-]+$/.test(word);
  }

  submitAnswerBtn.addEventListener("click", async () => {
    const newWord = answerInput.value.trim();
    if (!currentProfileId) {
      showFeedbackInsideInput("Выберите профиль!", true);
      return;
    }
    if (!newWord) {
      showFeedbackInsideInput("Введите слово!", true);
      return;
    }
    if (!isValidWord(newWord)) {
      showFeedbackInsideInput("Только английские буквы", true);
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

  // ==============================
  // Service Worker
  // ==============================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ Service Worker зарегистрирован"))
      .catch(err => console.error("❌ Ошибка Service Worker:", err));
  }
});
