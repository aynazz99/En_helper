document.addEventListener("DOMContentLoaded", () => {
  function animate(element) {
    if (!element) return;
    element.classList.add("bounce", "red-border");
    setTimeout(() => element.classList.remove("bounce"), 600);
    setTimeout(() => element.classList.remove("red-border"), 800);
  }

  const buttons = [
    { id: "testBtn", page: "test.html", select: document.getElementById("listSelect") },
    { id: "levelBtn", page: "level_check_Page.html", select: document.getElementById("ProfileSelect"), extraBtn: document.getElementById("addProfileBtn") },
    { id: "cardsBtn", page: "flashCards.html", select: document.getElementById("CardSelect") },
    { id: "DialogBtn", page: "dialog.html", select: document.getElementById("DialogSelect") }
  ];

  buttons.forEach(btn => {
    const el = document.getElementById(btn.id);
    if (!el) return;

    el.addEventListener("click", () => {
      const currentPage = window.location.pathname.split("/").pop();

      // Если есть селект — проверяем placeholder
      if (btn.select) {
        const selIndex = btn.select.selectedIndex;
        const selectedOption = btn.select.options[selIndex] || null;
        const isPlaceholder = selIndex <= 0 || (selectedOption && selectedOption.disabled) || btn.select.value === "";

        if (isPlaceholder) {
          animate(btn.select); // подпрыгивает только селект
          if (btn.extraBtn) animate(btn.extraBtn);
          return; // не идём на страницу
        }
      }

      // Переход только если не текущая страница
      if (currentPage !== btn.page) {
        window.location.href = btn.page;
      } else {
        // Текущая страница и селект заполнен — подпрыгивает кнопка
        animate(el);
      }
    });
  });
});

(function() {
  const onlyMobile = true;
  if (onlyMobile && window.matchMedia && !window.matchMedia('(max-width:480px)').matches) return;

  const footer = document.querySelector('footer');
  if (!footer) return;
  if (document.getElementById('bottomContainer')) return; // уже создан

  // Создаём контейнер
  const bottomContainer = document.createElement('div');
  bottomContainer.id = 'bottomContainer';

  // Список элементов, которые перемещаем
  const idsToMove = [
    'word',
    'answers',
    'inputModeDiv',
    'progressBar',
    'progress',
    'submitWrapper',
    'submitAnswerBtn'
  ];

  idsToMove.forEach(id => {
    const el = document.getElementById(id);
    if (el) bottomContainer.appendChild(el);
  });

  // Вставляем контейнер перед футером
  footer.parentNode.insertBefore(bottomContainer, footer);

  // следим за клавиатурой
  function updateKeyboardHeight() {
    let keyboardHeight = 0;
    if (window.visualViewport) {
      const vv = window.visualViewport;
      const layoutH = window.innerHeight;
      const visualH = vv.height;
      const offsetTop = vv.offsetTop || 0;
      keyboardHeight = Math.max(0, layoutH - visualH - offsetTop);
    }
    document.documentElement.style.setProperty('--keyboard-height', keyboardHeight + 'px');
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateKeyboardHeight);
    window.visualViewport.addEventListener('scroll', updateKeyboardHeight);
  } else {
    window.addEventListener('resize', updateKeyboardHeight);
  }
  updateKeyboardHeight();
})();

