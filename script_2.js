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
  const addProfileBtn = document.getElementById("addProfileBtn");
  const listSelect = document.getElementById("ProfileSelect");
  const testBtn = document.getElementById("testBtn");
  const levelBtn = document.getElementById("levelBtn");

  let currentProfileId = null;

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

  // При выборе профиля из списка сохраняем текущий профиль
  listSelect.addEventListener("change", () => {
    currentProfileId = listSelect.value;
    console.log("Выбран профиль:", currentProfileId);
  });

  // Изначальная загрузка всех профилей при старте
  loadProfiles();

  // Test — возврат на страницу теста
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Level Check — базовая анимация select
  if (levelBtn) {
    levelBtn.addEventListener("click", () => {
      if (!listSelect) return;

      listSelect.classList.add("bounce");
      listSelect.classList.add("red-border");

      setTimeout(() => listSelect.classList.remove("bounce"), 600);
      setTimeout(() => listSelect.classList.remove("red-border"), 800);
    });
  }

  // Регистрация Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("✅ Service Worker зарегистрирован"))
      .catch(err => console.error("❌ Ошибка Service Worker:", err));
  }
});




const addProfileBtn = document.getElementById("addProfileBtn");
const popup = document.getElementById("profilePopup");
const profileInput = document.getElementById("profileNameInput");
const profileCancelBtn = document.getElementById("profileCancelBtn");
const profileAddBtn = document.getElementById("profileAddBtn");
const profileMessage = document.getElementById("profileMessage");
const listSelect = document.getElementById("ProfileSelect");
let currentProfileId = null;

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


// создать профиль
profileAddBtn.addEventListener("click", async () => {
  const name = profileInput.value.trim();
  if (!name) {
    profileMessage.style.color = "red";
    profileMessage.textContent = "Введите имя профиля!";
    return;
  }

  const profileId = name.replace(/\s+/g, "_");
  const profileRef = database.ref("profiles/" + profileId);
  const snapshot = await profileRef.get();

  if (!snapshot.exists()) {
    await profileRef.set({ name: name, knownWords: [] });

    profileMessage.style.color = "green";
    profileMessage.textContent = `Создан новый профиль: ${name}`;

    await updateProfileSelect();
    listSelect.value = profileId;
    currentProfileId = profileId;

    // закрываем попап через 0.8 секунды, чтобы увидеть сообщение
    setTimeout(closePopup, 800);

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

  // закрыть попап
  deleteCancelBtn.addEventListener("click", () => deletePopup.classList.remove("show"));


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
  setTimeout(() => deletePopup.classList.remove("show"), 800);
});

});
