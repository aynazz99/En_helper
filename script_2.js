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
  const loginBtn = document.getElementById("loginBtn");
  const testBtn = document.getElementById("testBtn");
  const levelBtn = document.getElementById("levelBtn");

  let currentProfileId = null;

  function updateLoginBtn(name) {
    loginBtn.textContent = name ? name : "Выбрать профиль";
  }

  // Выбор / создание профиля
  loginBtn.addEventListener("click", async () => {
    const name = prompt("Введите имя профиля:");
    if (!name) return;

    currentProfileId = name.replace(/\s+/g, "_"); // id профиля без пробелов
    const profileRef = database.ref("profiles/" + currentProfileId);

    // Проверяем, существует ли профиль
    const snapshot = await profileRef.get();
    if (!snapshot.exists()) {
      // Создаём новый профиль
      await profileRef.set({
        name: name,
        knownWords: []
      });
      alert(`Создан новый профиль: ${name}`);
    } else {
      alert(`Вы вошли в профиль: ${name}`);
    }

    updateLoginBtn(name);
  });

  // Test — возврат на страницу теста
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

});


document.addEventListener("DOMContentLoaded", () => {
  const testBtn = document.getElementById("testBtn");
  const levelBtn = document.getElementById("levelBtn");
  const listSelect = document.getElementById("listSelect");

  // Обработчик для кнопки "Test"
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      window.location.href = "index.html"; // Переход на страницу теста
    });
  }

  // Обработчик для кнопки "Level Check"
  if (levelBtn) {
    levelBtn.addEventListener("click", () => {
      if (!listSelect) return;

      // 1. Подпрыгивает сам select
      listSelect.classList.add("bounce");

      // 2. Добавляется красная граница на select
      listSelect.classList.add("red-border");

      // Убираем класс анимации через 600ms (длительность анимации)
      setTimeout(() => {
        listSelect.classList.remove("bounce");
      }, 600);

      // Убираем красную границу через 800ms
      setTimeout(() => {
        listSelect.classList.remove("red-border");
      }, 800);
    });
  }
});
