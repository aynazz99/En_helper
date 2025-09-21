document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();

    const safeTop = tg.viewportStableOffsetTop || 0;
    const header = document.querySelector('header');
    if (header) header.style.transform = `translateY(${safeTop}px)`;

    // Чтобы реагировать на изменение размера экрана
    window.addEventListener("resize", () => {
        const safeTop = tg.viewportStableOffsetTop || 0;
        if (header) header.style.transform = `translateY(${safeTop}px)`;
    });
});
