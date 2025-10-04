// ==========================
// script_2.js
// ==========================

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
if (imageContainer) imageContainer.style.display = 'none';

// ==========================
// Встроенная панель логов
// ==========================
function showLogs(message) {
  let logDiv = document.getElementById("logDiv");

  if (!logDiv) {
    logDiv = document.createElement("div");
    logDiv.id = "logDiv";
    logDiv.style.position = "fixed";
    logDiv.style.bottom = "0";
    logDiv.style.left = "0";
    logDiv.style.width = "100%";
    logDiv.style.maxHeight = "150px";
    logDiv.style.overflowY = "auto";
    logDiv.style.background = "rgba(0,0,0,0.7)";
    logDiv.style.color = "white";
    logDiv.style.fontSize = "12px";
    logDiv.style.fontFamily = "monospace";
    logDiv.style.padding = "5px";
    logDiv.style.zIndex = "9999";
    document.body.appendChild(logDiv);
  }

  const p = document.createElement("div");
  p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// ==========================
// Логирование действий профиля
// ==========================
async function logProfileAction(profileId, action, details = "") {
  const logMessage = `${action}: ${details}`;
  showLogs(logMessage); // показываем в UI

  try {
    const logRef = database.ref(`profiles/${profileId}/log`);
    const timestamp = new Date().toISOString();
    await logRef.push({ timestamp, action, details });
  } catch (error) {
    showLogs(`ERROR writing to Firebase: ${error.message}`);
    console.error(error);
  }
}

// ==========================
// Подробная трассировка загрузки
// ==========================
async function traceProfileStep(profileId, step, details = "") {
  showLogs(`TRACE - ${step}: ${details}`);
  try {
    const traceRef = database.ref(`profiles/${profileId}/loadTrace`);
    const timestamp = new Date().toISOString();
    await traceRef.push({ timestamp, step, details });
  } catch (error) {
    showLogs(`ERROR writing trace to Firebase: ${error.message}`);
  }
}

// ==========================
// Автоматический вход через Telegram
// ==========================
async function autoLogin() {
  try {
    traceProfileStep("unknown", "Start autoLogin", "Begin auto login process");

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser) {
      traceProfileStep("unknown", "Telegram user not found");
      showLogs("Telegram user data not found!");
      return;
    }

    const profileId = String(tgUser.id);
    const profileName = tgUser.username || tgUser.first_name || `User${profileId}`;
    currentProfileId = profileId;

    traceProfileStep(profileId, "Telegram user found", `Name: ${profileName}, ID: ${profileId}`);

    const profileRef = database.ref(`profiles/${profileId}`);
    traceProfileStep(profileId, "Firebase check", "Checking if profile exists");

    const snapshot = await profileRef.get();

    if (!snapshot.exists()) {
      traceProfileStep(profileId, "Profile not found", "Creating new profile");
      await profileRef.set({
        name: profileName,
        knownWords: [],
        log: {},
        loadTrace: {}
      });
      traceProfileStep(profileId, "Profile created", `Profile ${profileName} created`);
      await logProfileAction(profileId, "createProfile", `Profile created for ${profileName}`);
    } else {
      traceProfileStep(profileId, "Profile loaded", `Profile exists: ${snapshot.val().name}`);
      await logProfileAction(profileId, "loadProfile", `Profile loaded: ${snapshot.val().name}`);
    }

    traceProfileStep(profileId, "Show UI", "Displaying quiz interface");
    showQuizUI();
    await updateKnownCounter();

    traceProfileStep(profileId, "AutoLogin finished", "Profile fully loaded");

  } catch (error) {
    showLogs(`ERROR in autoLogin: ${error.message}`);
    console.error(error);
  }
}

// ==========================
// Обновление счётчика knownWords
// ==========================
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

  await logProfileAction(currentProfileId, "updateCounter", `Known words: ${uniqueWords.length}`);
}

// ==========================
// Интерфейс квиза
// ==========================
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
  if(container) container.remove();

  showLogs("Quiz UI shown");
}

// ==========================
// Проверка валидности слова
// ==========================
function isValidWord(word) {
  return /^[a-zA-Z\s'-]+$/.test(word);
}

// ==========================
// Обработка отправки ответа
// ==========================
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const answerInput = document.getElementById("answerInput");

submitAnswerBtn.addEventListener("click", async () => {
  const newWord = answerInput.value.trim();

  if (!currentProfileId) {
    showFeedbackInsideInput("Профиль не загружен!", true);
    showLogs("Attempted to submit word without profile");
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
    await logProfileAction(currentProfileId, "duplicateWord", newWord);
  } else {
    words.push(newWord);
    await profileRef.set(words);
    showFeedbackInsideInput("Слово добавлено!", false);
    await logProfileAction(currentProfileId, "addWord", newWord);
    updateKnownCounter();
  }
});

// ==========================
// Подсказка внутри input
// ==========================
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

// ==========================
// Отключение масштабирования
// ==========================
document.addEventListener('gesturestart', e=>e.preventDefault());
let lastTouchEnd=0;
document.addEventListener('touchend', e=>{
  const now=new Date().getTime();
  if(now-lastTouchEnd<=300) e.preventDefault();
  lastTouchEnd=now;
}, false);
document.addEventListener('touchstart', e=>{ if(e.touches.length>1) e.preventDefault(); }, {passive:false});

// ==========================
// Автологин при загрузке
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  autoLogin();

  // Регистрация Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => showLogs("Service Worker registered"))
      .catch(err => showLogs("Service Worker registration error: " + err.message));
  }
});
