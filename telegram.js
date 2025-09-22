document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const webapp = window.Telegram.WebApp;

    // Telegram рекомендует вызвать ready()
    if (typeof webapp.ready === "function") {
      webapp.ready();
    }

    // Функция для переключения классов body
    function updateMode() {
      if (webapp.isExpanded) {
        document.body.classList.add("tg-fullscreen");
        document.body.classList.remove("tg-mini");
      } else {
        document.body.classList.add("tg-mini");
        document.body.classList.remove("tg-fullscreen");
      }
    }

    // первый вызов
    updateMode();

    // слушаем изменения размера окна Telegram WebApp
    if (typeof webapp.onEvent === "function") {
      webapp.onEvent("viewportChanged", updateMode);
    } else {
      window.addEventListener("resize", updateMode);
    }
  } else {
    console.log("Сайт открыт не в Telegram WebApp");
  }
});
