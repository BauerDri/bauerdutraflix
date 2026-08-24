"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY =
  "bauerdutraflix:splash-seen";

export default function AppSplash() {
  const [visible, setVisible] =
    useState(false);

  const [leaving, setLeaving] =
    useState(false);

  useEffect(() => {
    const alreadySeen =
      window.sessionStorage.getItem(
        SPLASH_KEY
      );

    if (alreadySeen) {
      return;
    }

    setVisible(true);

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const exitTimer =
      window.setTimeout(() => {
        setLeaving(true);
      }, 1400);

    const removeTimer =
      window.setTimeout(() => {
        setVisible(false);

        window.sessionStorage.setItem(
          SPLASH_KEY,
          "true"
        );

        document.body.style.overflow =
          previousOverflow;
      }, 1900);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);

      document.body.style.overflow =
        previousOverflow;
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={
        leaving
          ? "app-splash leaving"
          : "app-splash"
      }
      aria-label="Carregando BauerDutraFlix"
    >
      <div className="splash-light splash-light-one" />
      <div className="splash-light splash-light-two" />

      <div className="splash-content">
        <div className="splash-symbol">
          <span>B</span>
        </div>

        <div className="splash-name">
          <span>BauerDutra</span>
          <strong>Flix</strong>
        </div>

        <p>Seu streaming pessoal</p>

        <div className="splash-progress">
          <span />
        </div>
      </div>
    </div>
  );
}