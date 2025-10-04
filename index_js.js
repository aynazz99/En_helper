// Здесь может быть реальный initData, например:
// let initData = Telegram.WebApp.initDataUnsafe;

// Для примера возьмём тестовые данные:
let initData = {
  user: { id: 12345, name: "Alex", lang: "ru" },
  session: "abcd1234",
  features: ["cards", "test", "dialog"]
};

// Функция вывода на экран
function showInitData(data) {
  const output = document.getElementById("initDataOutput");

  if (typeof data === "string") {
    output.textContent = data;
  } else {
    output.textContent = JSON.stringify(data, null, 2);
  }
}

// Выводим initData
showInitData(initData);

// Анимация карточек
const cards = document.querySelectorAll('.card');
let current = 0;

setInterval(() => {
  cards.forEach(card => card.style.transform = 'scale(1)');
  cards[current].style.transform = 'scale(1.1)';
  current = (current + 1) % cards.length;
}, 800);
