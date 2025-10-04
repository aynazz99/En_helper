// =======================================
// Firebase и Mini App автологин с логами
// =======================================

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

// Основная переменная для текущего профиля
let currentProfileId = null;

// Контейнер для логов (можно добавить на страницу или смотреть в консоли)
function showLogs(message, type="info") {
    const prefix = new Date().toLocaleTimeString();
    const fullMessage = `[${prefix}] ${message}`;
    console.log(fullMessage);
}

// =======================================
// Автологин через Telegram Mini App
// =======================================
window.Telegram.WebApp.ready();

document.addEventListener("DOMContentLoaded", async () => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    showLogs("Start autoLogin: Begin auto login process", "trace");

    if (!tgUser || !tgUser.id) {
        showLogs("Telegram user not found! Fallback to manual mode.", "error");
        // Здесь можно вызвать старый селект выбора профиля или показать сообщение
        return;
    }

    showLogs("Telegram user found:", "trace");
    showLogs(`User ID: ${tgUser.id}`, "trace");
    showLogs(`Username: ${tgUser.username}`, "trace");
    showLogs(`First name: ${tgUser.first_name}`, "trace");

    const profileId = tgUser.id.toString(); // уникальный ключ по Telegram ID
    currentProfileId = profileId;

    try {
        const profileRef = database.ref("profiles/" + profileId);
        const snapshot = await profileRef.get();

        if (!snapshot.exists()) {
            showLogs("Profile not found in Firebase. Creating new profile...", "trace");
            const name = tgUser.username || tgUser.first_name || `User#${tgUser.id}`;
            await profileRef.set({
                name: name,
                knownWords: []
            });
            showLogs(`Created profile: ${name} (${profileId})`, "success");
        } else {
            showLogs(`Profile loaded: ${snapshot.val().name} (${profileId})`, "success");
        }

        // После загрузки или создания профиля показываем UI
        showQuizUI();
        await updateKnownCounter();
        showLogs("Auto login finished successfully", "success");
    } catch (err) {
        console.error(err);
        showLogs("Error during autoLogin: " + err.message, "error");
    }
});

// =======================================
// Обновление счетчика knownWords
// =======================================
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

// =======================================
// Отображение интерфейса
// =======================================
function showQuizUI() {
    const inputModeDiv = document.getElementById("inputModeDiv");
    const submitWrapper = document.getElementById("submitWrapper");
    const welcome = document.getElementById("welcome");
    const counter = document.getElementById("knownCounter");
    const imageContainer = document.getElementById('imageContainer');

    if (welcome) welcome.style.display = "none";
    if (inputModeDiv) inputModeDiv.style.display = "block";
    if (submitWrapper) submitWrapper.style.display = "block";
    if (counter) counter.style.display = "flex";
    if (imageContainer) imageContainer.style.display = 'flex';

    const container = document.getElementById('welcomeContainer');
    if (container) container.remove();
}
