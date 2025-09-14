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



// открыть попап
addProfileBtn.addEventListener("click", () => {
  profileInput.value = "";
  profileMessage.textContent = "";
  popup.classList.add("show"); // плавное появление
  profileInput.focus();
});

// закрыть попап
function closePopup() {
  popup.classList.remove("show"); // плавное исчезновение
}
profileCancelBtn.addEventListener("click", closePopup);

// закрытие по клику/тапу вне окна
popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    closePopup();
  }
});
popup.addEventListener("touchstart", (e) => {
  if (e.target === popup) {
    closePopup();
  }
});



profileAddBtn.addEventListener("click", async () => {
  const name = profileInput.value.trim();
  if (!name) {
    profileMessage.style.color = "red";
    profileMessage.textContent = "Введите имя профиля!";
    return;
  }

  const password = prompt("Придумайте пароль для профиля");
  if (!password) {
    profileMessage.style.color = "red";
    profileMessage.textContent = "Пароль обязателен!";
    return;
  }

  const profileId = name.replace(/\s+/g, "_");
  const profileRef = database.ref("profiles/" + profileId);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) {
    await profileRef.set({ name: name, password: password, knownWords: [] });

    profileMessage.style.color = "green";
    profileMessage.textContent = `Создан новый профиль: ${name}`;

    await updateProfileSelect();
    listSelect.value = profileId;
    currentProfileId = profileId;

    // Закрываем попап через 1.5 секунды
    setTimeout(closePopup, 1500);
        // Показываем интерфейс сразу
    showQuizUI();
  } else {
    profileMessage.style.color = "orange";
    profileMessage.textContent = `Профиль уже существует: ${name}`;
    profileInput.focus();
  }
});


async function updateProfileSelect() {
  const snapshot = await database.ref("profiles").get();
  const profiles = snapshot.val() || {};

  // Очищаем селект
  listSelect.innerHTML = "";

  // Заглушка
  const placeholder = document.createElement("option");
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.value = "";
  placeholder.textContent = "Выберите профиль";
  listSelect.appendChild(placeholder);

  // Добавляем реальные профили
  Object.keys(profiles).forEach(id => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = profiles[id].name;
    listSelect.appendChild(option);
  });
}

// Отключение масштабирования
document.addEventListener('gesturestart', e=>e.preventDefault());
let lastTouchEnd=0;
document.addEventListener('touchend', e=>{
  const now=new Date().getTime();
  if(now-lastTouchEnd<=300) e.preventDefault();
  lastTouchEnd=now;
}, false);
document.addEventListener('touchstart', e=>{ if(e.touches.length>1) e.preventDefault(); }, {passive:false});


document.addEventListener("DOMContentLoaded", () => {
  const DeleteProfileBtn = document.getElementById("DeleteProfileBtn");
  const deletePopup = document.getElementById("deletePopup");
  const deleteProfileNameInput = document.getElementById("deleteProfileNameInput");
  const deleteCurrentBtn = document.getElementById("deleteCurrentBtn");
  const deleteAllBtn = document.getElementById("deleteAllBtn");
  const deleteMessage = document.getElementById("deleteMessage");
  const deleteCancelBtn = document.getElementById("deleteCancelBtn");

  // открыть попап удаления
  DeleteProfileBtn.addEventListener("click", () => {
    deletePopup.classList.add("show");
    deleteProfileNameInput.value = "";
    deleteMessage.textContent = "";
    deleteProfileNameInput.focus();
  });



// Функция для закрытия попапа
function closeDeletePopup() {
  deletePopup.classList.remove("show");
}

// Закрытие по клику вне окна
deletePopup.addEventListener("click", (e) => {
  if (e.target === deletePopup) {
    closeDeletePopup();
  }
});

// Закрытие по тач-событию вне окна
deletePopup.addEventListener("touchstart", (e) => {
  if (e.target === deletePopup) {
    closeDeletePopup();
  }
});

// Закрытие по кнопке "Отмена"
deleteCancelBtn.addEventListener("click", closeDeletePopup);


  deleteCurrentBtn.addEventListener("click", async () => {
  const profileId = listSelect.value;

  // Проверяем, что выбран реальный профиль
  if (!profileId) {
    deleteMessage.style.color = "red";
    deleteMessage.textContent = "Текущий профиль отсутствует";
    setTimeout(() => deleteMessage.textContent = "", 2000);
    return;
  }

  const profileRef = database.ref("profiles/" + profileId);

  try {
    const snapshot = await profileRef.get();

    // Если профиль не найден — сообщаем и выходим
    if (!snapshot.exists()) {
      deleteMessage.style.color = "orange";
      deleteMessage.textContent = "Выбранный профиль не найден!";
      setTimeout(() => deleteMessage.textContent = "", 2000);
      await updateProfileSelect(); // обновим селект
      return;
    }

    // Сначала запрос пароля
    const password = prompt("Введите пароль для удаления профиля");
    if (password !== "1234") {
      deleteMessage.style.color = "red";
      deleteMessage.textContent = "Неверный пароль!";
      setTimeout(() => deleteMessage.textContent = "", 2000);
      return;
    }

    // Подтверждение удаления
    const confirmDelete = confirm(`Вы уверены, что хотите удалить профиль "${snapshot.val().name}"?`);
    if (!confirmDelete) return;

    // Удаляем профиль
    await profileRef.remove();
    deleteMessage.style.color = "green";
    deleteMessage.textContent = `Профиль "${snapshot.val().name}" удалён!`;
    setTimeout(() => deleteMessage.textContent = "", 1000);

    await updateProfileSelect();

  } catch (error) {
    console.error("Ошибка удаления профиля:", error);
    deleteMessage.style.color = "red";
    deleteMessage.textContent = "Произошла ошибка!";
    setTimeout(() => deleteMessage.textContent = "", 1000);
  }
});


  // удалить все профили
  deleteAllBtn.addEventListener("click", async () => {
  // Проверяем, есть ли профили
  const snapshot = await database.ref("profiles").get();
  const profiles = snapshot.val() || {};

  if (Object.keys(profiles).length === 0) {
    deleteMessage.style.color = "red";
    deleteMessage.textContent = "Нет профилей для удаления!";
    setTimeout(() => deleteMessage.textContent = "", 1000);
    return;
  }

  // Проверка пароля
  const password = prompt("Введите пароль для удаления всех профилей");
  if (password !== "1234") {
    deleteMessage.style.color = "red";
    deleteMessage.textContent = "Неверный пароль!";
    setTimeout(() => deleteMessage.textContent = "", 1000);
    return;
  }

  // Подтверждение удаления
  const confirmDeleteAll = confirm("Вы уверены, что хотите удалить все профили?");
  if (!confirmDeleteAll) return;

  // Удаляем все профили
  await database.ref("profiles").remove();
  deleteMessage.style.color = "green";
  deleteMessage.textContent = "Все профили удалены!";
  setTimeout(() => deleteMessage.textContent = "", 1000);

  await updateProfileSelect(); // обновляем селект
  setTimeout(() => deletePopup.classList.remove("show"), 1500);
});

});

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


