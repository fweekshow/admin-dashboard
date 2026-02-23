"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const BLOCK_TYPES = ["WakeUp", "MedicationWindow", "Meal", "GroupSession", "FreeTime", "QuietHours", "LightsOut", "Other"];

interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string | null;
  blockType: string;
  activity: string;
  location: string | null;
  notes: string | null;
  daysOfWeek: string[];
  refersToMeal: boolean;
  refersToActivity: boolean;
  refersToMeds: boolean;
}

const emptyBlock = (): Partial<ScheduleBlock> => ({
  startTime: "", endTime: "", blockType: "Other", activity: "", location: "", notes: "",
  daysOfWeek: [], refersToMeal: false, refersToActivity: false, refersToMeds: false,
});

export default function SchedulePage() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<ScheduleBlock>>(emptyBlock());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/schedule");
      setBlocks(await r.json());
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyBlock()); setError(null); setModal("add"); };
  const openEdit = (b: ScheduleBlock) => { setForm({ ...b }); setError(null); setModal("edit"); };

  const toggleDay = (day: string) => {
    setForm((f) => {
      const cur = f.daysOfWeek ?? [];
      return { ...f, daysOfWeek: cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day] };
    });
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const method = modal === "add" ? "POST" : "PUT";
      const res = await fetch("/api/schedule", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setModal(null); fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/schedule?id=${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); }
    catch { setError("Failed to delete"); }
  };

  const blockColor = (type: string) => {
    const map: Record<string, string> = { Meal: s.badgeBlue, GroupSession: s.badgeGreen, MedicationWindow: s.badgeYellow, LightsOut: s.badgeRed };
    return map[type] || "";
  };

  if (loading) return <div className={s.loading}>Loading schedule...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>📅 Daily Schedule</h1>
          <p className={s.subtitle}>{blocks.length} schedule blocks</p>
        </div>
        <div className={s.headerActions}>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Block</button>
        </div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}

      <div className={s.tableWrap}>
        {blocks.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>📅</div>
            <div className={s.emptyText}>No schedule blocks yet</div>
            <button className="btn btn-primary" onClick={openAdd}>Add First Block</button>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Activity</th>
                <th>Location</th>
                <th>Days</th>
                <th>Refs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id}>
                  <td className={s.cellMuted}>{b.startTime}{b.endTime ? ` – ${b.endTime}` : ""}</td>
                  <td><span className={`${s.badge} ${blockColor(b.blockType)}`}>{b.blockType}</span></td>
                  <td>{b.activity}</td>
                  <td className={s.cellMuted}>{b.location || "—"}</td>
                  <td><div className={s.tagList}>{b.daysOfWeek.map((d) => <span key={d} className={s.tag}>{d}</span>)}</div></td>
                  <td className={s.cellMuted}>
                    {[b.refersToMeal && "🍴", b.refersToActivity && "🏃", b.refersToMeds && "💊"].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td>
                    <div className={s.cellActions}>
                      <button className={s.btnIcon} onClick={() => openEdit(b)}>✏️</button>
                      <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => setDeleteId(b.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className={s.modalOverlay} onClick={() => setModal(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2>{modal === "add" ? "Add Schedule Block" : "Edit Schedule Block"}</h2>
              <button className={s.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Block Type</label>
                <select value={form.blockType ?? ""} onChange={(e) => setForm({ ...form, blockType: e.target.value })}>
                  {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className={s.formGroup}>
                <label>Activity Name</label>
                <input value={form.activity ?? ""} onChange={(e) => setForm({ ...form, activity: e.target.value })} placeholder="e.g. Morning Meditation" />
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Start Time</label>
                  <input type="time" value={form.startTime ?? ""} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className={s.formGroup}>
                  <label>End Time</label>
                  <input type="time" value={form.endTime ?? ""} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Location</label>
                <input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Optional" />
              </div>
              <div className={s.formGroup}>
                <label>Days of Week</label>
                <div className={s.daysGrid}>
                  {DAYS.map((d) => (
                    <button key={d} type="button" className={`${s.dayChip} ${(form.daysOfWeek ?? []).includes(d) ? s.dayChipActive : ""}`} onClick={() => toggleDay(d)}>{d}</button>
                  ))}
                </div>
              </div>
              <div className={s.formRow}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.refersToMeal ?? false} onChange={(e) => setForm({ ...form, refersToMeal: e.target.checked })} style={{ width: "auto" }} /> Refers to Meal
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.refersToActivity ?? false} onChange={(e) => setForm({ ...form, refersToActivity: e.target.checked })} style={{ width: "auto" }} /> Refers to Activity
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.refersToMeds ?? false} onChange={(e) => setForm({ ...form, refersToMeds: e.target.checked })} style={{ width: "auto" }} /> Refers to Meds
                </label>
              </div>
              <div className={s.formGroup}>
                <label>Notes</label>
                <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <div className={s.modalFooter}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className={s.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}><h2>Delete Block</h2><button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button></div>
            <div className={s.modalBody}><p className={s.confirmText}>Are you sure you want to delete this schedule block?</p></div>
            <div className={s.modalFooter}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDelete} style={{ background: "var(--error)" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
