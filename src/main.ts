import { AppGame } from "@core/AppGame"

// Mount PIXI application inside #app
const host = document.getElementById('app') as HTMLDivElement
const game = new AppGame({ host })


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => console.log("[SW] registered"))
      .catch((err) => console.warn("[SW] failed:", err));
  });
}