import type { ReactNode } from "react";
import { useState } from "react";
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

  if (managerUnlocked || !managerPinConfigured) {
    return <>{children}</>;
  }

  return (
    <section className="card gate-card">
      <div>
        <p className="section-eyebrow">做饭 / 管理模式</p>
        <h2>{title}</h2>
        <p className="muted-text">{description}</p>
      </div>

      <label className="field">
        <span>管理 PIN</span>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="输入家庭管理员 PIN"
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
            setError("PIN 不正确，再试一次。");
          }
        }}
      >
        进入做饭模式
      </button>
    </section>
  );
}
