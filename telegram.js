document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const webapp = window.Telegram.WebApp;

    // Telegram рекомендует вызвать ready()
    if (typeof webapp.ready === "function") {
      webapp.ready();
    }

    // Принудительно разворачиваем на полный экран
    if (typeof webapp.expand === "function") {
      webapp.expand();
    }

    // Можно для стилей добавить класс fullscreen
    document.body.classList.add("tg-fullscreen");

  } else {
    console.log("Сайт открыт не в Telegram WebApp");
  }
});
