
// Анимация карточек
const cards = document.querySelectorAll('.card');
let current = 0;

setInterval(() => {
  cards.forEach(card => card.style.transform = 'scale(1)');
  cards[current].style.transform = 'scale(1.1)';
  current = (current + 1) % cards.length;
}, 1000);

