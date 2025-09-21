document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
        tg.ready();

        const safeTop = tg.viewportStableOffsetTop || 20;
        const safeBottom = tg.viewportStableOffsetBottom || 20;

        // Добавляем отступ **к header**
        const header = document.querySelector("header");
        if (header) header.style.paddingTop = safeTop + "px";

        // Для body (если нужно, чтобы остальной контент тоже не ушёл под вырез)
        document.body.style.paddingTop = safeTop + "px";
        document.body.style.paddingBottom = safeBottom + "px";

        // Для пересчёта при повороте экрана
        window.addEventListener("resize", () => {
            header.style.paddingTop = tg.viewportStableOffsetTop + "px";
            document.body.style.paddingTop = tg.viewportStableOffsetTop + "px";
            document.body.style.paddingBottom = tg.viewportStableOffsetBottom + "px";
        });
    }
});
