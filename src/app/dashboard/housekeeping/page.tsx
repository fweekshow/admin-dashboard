"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";

interface HousekeepingItem {
  id: string;
  date: string;
  dayOfWeek: string;
  roomArea: string | null;
  taskType: string | null;
  dailyTasksCompleted: string | null;
  assignedStaffId: string | null;
  assignedStaff: { id: string; name: string } | null;
  supervisorInitials: string | null;
  notes: string | null;
}

interface StaffOption { id: string; name: string; }

const emptyItem = (): Partial<HousekeepingItem> => ({
  date: new Date().toISOString().split("T")[0], dayOfWeek: "", roomArea: "", taskType: "Daily",
  dailyTasksCompleted: "", assignedStaffId: "", supervisorInitials: "", notes: "",
});

const TASK_TYPES = ["Daily", "Deep"];
const DOW = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function HousekeepingPage() {
  const [items, setItems] = useState<HousekeepingItem[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<HousekeepingItem>>(emptyItem());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [hRes, sRes] = await Promise.all([fetch("/api/housekeeping"), fetch("/api/staff")]);
      setItems(await hRes.json());
      setStaff(await sRes.json());
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyItem()); setError(null); setModal("add"); };
  const openEdit = (h: HousekeepingItem) => { setForm({ ...h, date: h.date ? h.date.split("T")[0] : "", assignedStaffId: h.assignedStaffId ?? "" }); setError(null); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/housekeeping", { method: modal === "add" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setModal(null); fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/housekeeping?id=${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); }
    catch { setError("Failed to delete"); }
  };

  if (loading) return <div className={s.loading}>Loading housekeeping...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div><h1>🧹 Housekeeping</h1><p className={s.subtitle}>{items.length} records</p></div>
        <div className={s.headerActions}><button className="btn btn-primary" onClick={openAdd}>+ Add Record</button></div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}
      <div className={s.tableWrap}>
        {items.length === 0 ? (
          <div className={s.empty}><div className={s.emptyIcon}>🧹</div><div className={s.emptyText}>No records yet</div><button className="btn btn-primary" onClick={openAdd}>Add First</button></div>
        ) : (
          <table className={s.table}>
            <thead><tr><th>Date</th><th>Day</th><th>Room/Area</th><th>Type</th><th>Staff</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id}>
                  <td className={s.cellMuted}>{h.date ? new Date(h.date).toLocaleDateString() : "—"}</td>
                  <td className={s.cellMuted}>{h.dayOfWeek}</td>
                  <td>{h.roomArea || "—"}</td>
                  <td>{h.taskType ? <span className={`${s.badge} ${h.taskType === "Deep" ? s.badgeYellow : s.badgeBlue}`}>{h.taskType}</span> : "—"}</td>
                  <td className={s.cellMuted}>{h.assignedStaff?.name || "—"}</td>
                  <td className={s.cellTruncate + " " + s.cellMuted}>{h.notes || "—"}</td>
                  <td><div className={s.cellActions}>
                    <button className={s.btnIcon} onClick={() => openEdit(h)}>✏️</button>
                    <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => setDeleteId(h.id)}>🗑️</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className={s.modalOverlay} onClick={() => setModal(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}><h2>{modal === "add" ? "Add Record" : "Edit Record"}</h2><button className={s.modalClose} onClick={() => setModal(null)}>✕</button></div>
            <div className={s.modalBody}>
              <div className={s.formRow}>
                <div className={s.formGroup}><label>Date</label><input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className={s.formGroup}><label>Day of Week</label><select value={form.dayOfWeek ?? ""} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}><option value="">Select</option>{DOW.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label>Room/Area</label><input value={form.roomArea ?? ""} onChange={(e) => setForm({ ...form, roomArea: e.target.value })} /></div>
                <div className={s.formGroup}><label>Task Type</label><select value={form.taskType ?? ""} onChange={(e) => setForm({ ...form, taskType: e.target.value })}>{TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div className={s.formGroup}><label>Assigned Staff</label><select value={form.assignedStaffId ?? ""} onChange={(e) => setForm({ ...form, assignedStaffId: e.target.value || null })}><option value="">None</option>{staff.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}</select></div>
              <div className={s.formGroup}><label>Supervisor Initials</label><input value={form.supervisorInitials ?? ""} onChange={(e) => setForm({ ...form, supervisorInitials: e.target.value })} /></div>
              <div className={s.formGroup}><label>Notes</label><textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
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
            <div className={s.modalHeader}><h2>Delete Record</h2><button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button></div>
            <div className={s.modalBody}><p className={s.confirmText}>Are you sure?</p></div>
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
