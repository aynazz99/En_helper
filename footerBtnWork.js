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
