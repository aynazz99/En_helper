// safeArea.js
const tg = window.Telegram.WebApp;
tg.ready();

function applySafeArea() {
    const safeTop = tg.viewportStableOffsetTop;
    const safeBottom = tg.viewportStableOffsetBottom;

    // Отступ шапки
    const header = document.querySelector("header");
    if (header) header.style.paddingTop = safeTop + "px";

    // Отступ нижнего контейнера (кнопки, таймер)
    const bottomContainer = document.querySelector(".bottom-container");
    if (bottomContainer) bottomContainer.style.paddingBottom = safeBottom + "px";

    // Можно добавить отступ для всего body, если нужно
    document.body.style.paddingTop = safeTop + "px";
    document.body.style.paddingBottom = safeBottom + "px";
}

// Применяем сразу
applySafeArea();

// Пересчёт при изменении ориентации или размера экрана
window.addEventListener("resize", applySafeArea);
