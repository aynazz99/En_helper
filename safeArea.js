document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();

    const header = document.querySelector("header");
    if (!header) return;

    function applyTelegramSafeArea() {
        const safeTop = tg.viewportStableOffsetTop || 0;
        header.style.paddingTop = 12 + safeTop + "px"; // базовый padding + offset
    }

    applyTelegramSafeArea();
    window.addEventListener("resize", applyTelegramSafeArea);
});

