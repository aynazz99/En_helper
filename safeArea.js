const BASE_PADDING = 20; // тот самый padding, который был раньше

document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();

    const header = document.querySelector('header');

    function applyTelegramSafeArea() {
        const safeTop = tg.viewportStableOffsetTop || 0;
        if (header) header.style.transform = `translateY(${safeTop + BASE_PADDING}px)`;
    }

    applyTelegramSafeArea();
    window.addEventListener("resize", applyTelegramSafeArea);
});
