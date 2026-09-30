"use client";

import { useEffect } from "react";

/** Registra o service worker (PWA) após a hidratação. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[pwa] falha ao registrar service worker:", err);
      });
    }
  }, []);
  return null;
}
