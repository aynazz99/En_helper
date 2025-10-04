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

document.addEventListener("DOMContentLoaded", () => {
  const listSelect = document.getElementById("ProfileSelect");

  // Функция для загрузки всех профилей из базы и заполнения select
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

  // Обработчик выбора профиля
listSelect.addEventListener("change", async () => {
  const profileId = listSelect.value;
  if (!profileId) return;

  const profileRef = database.ref("profiles/" + profileId);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) return;

  const profileData = snapshot.val();
  const inputPassword = prompt("Введите пароль профиля");

  if (inputPassword === profileData.password) {
    currentProfileId = profileId;
    console.log("Выбран профиль:", currentProfileId);
    showQuizUI();
    updateKnownCounter(); // <-- обновляем счётчик
  } else {
    alert("Неверный пароль!");
    listSelect.value = ""; // сброс выбора
  }
});



  // Изначальная загрузка всех профилей при старте
  loadProfiles();
  
  // Регистрация Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ Service Worker зарегистрирован"))
      .catch(err => console.error("❌ Ошибка Service Worker:", err));
  }
});


// Объявление переменных для элементов DOM и управления профилями
const addProfileBtn = document.getElementById("addProfileBtn");
const popup = document.getElementById("profilePopup");
const profileInput = document.getElementById("profileNameInput");
const profileCancelBtn = document.getElementById("profileCancelBtn");
const profileAddBtn = document.getElementById("profileAddBtn");
const profileMessage = document.getElementById("profileMessage");
const listSelect = document.getElementById("ProfileSelect");
let currentProfileId = null;
const imageContainer = document.getElementById('imageContainer');
imageContainer.style.display = 'none';

// функция для обновления счётчика knownWords текущего профиля
async function updateKnownCounter() {
  if (!currentProfileId) return;

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
  const counter = document.getElementById("knownCounter"); // счётчик

  if (welcome) welcome.style.display = "none"; // прячем приветствие
  if (inputModeDiv) inputModeDiv.style.display = "block"; // показываем поле
  if (submitWrapper) submitWrapper.style.display = "block"; // показываем кнопку
  if (counter) counter.style.display = "flex"; // показываем счётчик
  if(imageContainer) imageContainer.style.display = 'flex' // показываем контейнер 
  const container = document.getElementById('welcomeContainer');
  // Удаляем пустой контейнер
  container.remove();
}


// функция проверки: только английские буквы, пробел, дефис и апостроф
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
    updateKnownCounter(); // <-- обновляем счётчик
  }
});


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


