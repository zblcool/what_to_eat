import type { ReactNode } from "react";
import { useState } from "react";
import { useI18n } from "../i18n";
import { useApp } from "../state/AppContext";

interface ModeGateProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ModeGate({ title, description, children }: ModeGateProps) {
  const { managerUnlocked, unlockManager } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const managerPinConfigured = Boolean(import.meta.env.VITE_MANAGER_PIN?.trim());
  const { text } = useI18n();

  if (managerUnlocked || !managerPinConfigured) {
    return <>{children}</>;
  }

  return (
    <section className="card gate-card">
      <div>
        <p className="section-eyebrow">{text("做饭 / 管理模式", "Kitchen / Admin Mode")}</p>
        <h2>{title}</h2>
        <p className="muted-text">{description}</p>
      </div>

      <label className="field">
        <span>{text("管理 PIN", "Manager PIN")}</span>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder={text("输入家庭管理员 PIN", "Enter family manager PIN")}
          type="password"
        />
      </label>

      {error ? <p className="inline-error">{error}</p> : null}

      <button
        type="button"
        className="primary-button"
        onClick={() => {
          const success = unlockManager(pin);
          if (!success) {
            setError(text("PIN 不正确，再试一次。", "Incorrect PIN. Please try again."));
          }
        }}
      >
        {text("进入做饭模式", "Enter Kitchen Mode")}
      </button>
    </section>
  );
}
