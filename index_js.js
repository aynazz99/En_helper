document.addEventListener('DOMContentLoaded', () => {
  const webapp = Telegram?.WebApp;
  if (webapp?.initDataUnsafe?.user && webapp.expand) {
    webapp.ready();
    webapp.expand();
    document.body.classList.add('tg-fullscreen'); // этот класс подключается к body
  }
});



// Анимация карточек
const cards = document.querySelectorAll('.card');
let current = 0;

setInterval(() => {
  cards.forEach(card => card.style.transform = 'scale(1)');
  cards[current].style.transform = 'scale(1.1)';
  current = (current + 1) % cards.length;
}, 1000);



