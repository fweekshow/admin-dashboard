"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "../../page.module.css";
import { ACTIONS } from "@/lib/constants";

interface Override {
  actionId: string;
  enabled: boolean;
  text: string;
}

interface CardState {
  mode: "override" | "smart";
  enabled: boolean;
  text: string;
  smartPrompt: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
  smartResult: string | null;
}

export default function OverridesPage() {
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [loading, setLoading] = useState(true);

  const initCards = useCallback(() => {
    const initial: Record<string, CardState> = {};
    ACTIONS.forEach((a) => {
      initial[a.id] = { mode: "override", enabled: false, text: "", smartPrompt: "", saving: false, saved: false, error: null, smartResult: null };
    });
    return initial;
  }, []);

  useEffect(() => {
    const init = initCards();
    fetch("/api/overrides")
      .then((r) => r.json())
      .then((overrides: Override[]) => {
        overrides.forEach((o) => { if (init[o.actionId]) { init[o.actionId].enabled = o.enabled; init[o.actionId].text = o.text; } });
        setCards(init); setLoading(false);
      })
      .catch(() => { setCards(init); setLoading(false); });
  }, [initCards]);

  const updateCard = (id: string, updates: Partial<CardState>) => {
    setCards((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  const saveOverride = async (actionId: string) => {
    const card = cards[actionId];
    updateCard(actionId, { saving: true, error: null, saved: false });
    try {
      const res = await fetch("/api/overrides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId, enabled: card.enabled, text: card.text }) });
      if (!res.ok) throw new Error("Save failed");
      updateCard(actionId, { saving: false, saved: true });
      setTimeout(() => updateCard(actionId, { saved: false }), 3000);
    } catch { updateCard(actionId, { saving: false, error: "Failed to save" }); }
  };

  const runSmartUpdate = async (actionId: string) => {
    const card = cards[actionId];
    if (!card.smartPrompt.trim()) return;
    updateCard(actionId, { saving: true, error: null, smartResult: null });
    try {
      const res = await fetch("/api/smart-update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId, prompt: card.smartPrompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Smart update failed");
      updateCard(actionId, { saving: false, smartResult: data.summary || "Changes applied!", smartPrompt: "" });
      setTimeout(() => updateCard(actionId, { smartResult: null }), 5000);
    } catch (err) { updateCard(actionId, { saving: false, error: err instanceof Error ? err.message : "Smart update failed" }); }
  };

  if (loading) return <div className={styles.loading}>Loading overrides...</div>;

  return (
    <div style={{ padding: 0 }}>
      <h1 style={{ marginBottom: 4 }}>⚡ Action Overrides</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Override any quick action response or use AI to update the database</p>

      <main className={styles.main}>
        {ACTIONS.map((action) => {
          const card = cards[action.id];
          if (!card) return null;
          return (
            <div key={action.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}><span className={styles.emoji}>{action.emoji}</span><h2>{action.label}</h2></div>
                <div className={styles.toggleRow}>
                  <label className={styles.overrideToggle}><input type="checkbox" checked={card.enabled} onChange={(e) => updateCard(action.id, { enabled: e.target.checked })} /><span className={styles.toggleSlider} /></label>
                  <span className={styles.toggleLabel}>{card.enabled ? "Override ON" : "Override OFF"}</span>
                </div>
              </div>
              {action.hasSmartUpdate && (
                <div className={styles.modeTabs}>
                  <button className={`${styles.modeTab} ${card.mode === "override" ? styles.modeTabActive : ""}`} onClick={() => updateCard(action.id, { mode: "override" })}>Raw Override</button>
                  <button className={`${styles.modeTab} ${card.mode === "smart" ? styles.modeTabActive : ""}`} onClick={() => updateCard(action.id, { mode: "smart" })}>Smart Update (AI)</button>
                </div>
              )}
              {(card.mode === "override" || !action.hasSmartUpdate) && (
                <div className={styles.cardBody}>
                  <label className={styles.fieldLabel}>Bot response when user taps &ldquo;{action.label}&rdquo;</label>
                  <textarea className={styles.textArea} value={card.text} onChange={(e) => updateCard(action.id, { text: e.target.value })} placeholder={card.enabled ? "Type exactly what the bot should say..." : "Enable override above, then type your message here..."} rows={4} disabled={!card.enabled} />
                  <div className={styles.cardFooter}>
                    {card.error && <span className={styles.errorText}>{card.error}</span>}
                    {card.saved && <span className={styles.successText}>Saved!</span>}
                    <button className="btn btn-primary" onClick={() => saveOverride(action.id)} disabled={card.saving}>{card.saving ? "Saving..." : "Save"}</button>
                  </div>
                </div>
              )}
              {card.mode === "smart" && action.hasSmartUpdate && (
                <div className={styles.cardBody}>
                  <label className={styles.fieldLabel}>Describe what you want to change in plain English</label>
                  <textarea className={styles.textArea} value={card.smartPrompt} onChange={(e) => updateCard(action.id, { smartPrompt: e.target.value })} placeholder={`e.g. "Add yoga at 3pm on Mondays in the gym"`} rows={4} />
                  <div className={styles.cardFooter}>
                    {card.error && <span className={styles.errorText}>{card.error}</span>}
                    {card.smartResult && <span className={styles.successText}>{card.smartResult}</span>}
                    <button className="btn btn-primary" onClick={() => runSmartUpdate(action.id)} disabled={card.saving || !card.smartPrompt.trim()}>{card.saving ? "Updating..." : "Apply with AI"}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
