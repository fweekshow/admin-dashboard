"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";

interface LaundryItem {
  id: string;
  date: string;
  dayOfWeek: string;
  memberName: string | null;
  clientId: string | null;
  client: { id: string; name: string } | null;
  roomNumber: string | null;
  laundryType: string;
  laundryVendor: string | null;
  expectedReturnDate: string | null;
  conditionCheck: boolean | null;
  notes: string | null;
}

const LAUNDRY_TYPES = ["Personal", "Linens", "Towels"];

const emptyItem = (): Partial<LaundryItem> => ({
  date: new Date().toISOString().split("T")[0], dayOfWeek: "", memberName: "",
  roomNumber: "", laundryType: "Personal", laundryVendor: "", notes: "",
});

export default function LaundryPage() {
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<LaundryItem>>(emptyItem());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try { setItems(await (await fetch("/api/laundry")).json()); }
    catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyItem()); setError(null); setModal("add"); };
  const openEdit = (l: LaundryItem) => { setForm({ ...l, date: l.date ? l.date.split("T")[0] : "" }); setError(null); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/laundry", { method: modal === "add" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setModal(null); fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/laundry?id=${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); }
    catch { setError("Failed to delete"); }
  };

  if (loading) return <div className={s.loading}>Loading laundry...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div><h1>👕 Laundry</h1><p className={s.subtitle}>{items.length} records</p></div>
        <div className={s.headerActions}><button className="btn btn-primary" onClick={openAdd}>+ Add Record</button></div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}
      <div className={s.tableWrap}>
        {items.length === 0 ? (
          <div className={s.empty}><div className={s.emptyIcon}>👕</div><div className={s.emptyText}>No records yet</div><button className="btn btn-primary" onClick={openAdd}>Add First</button></div>
        ) : (
          <table className={s.table}>
            <thead><tr><th>Date</th><th>Day</th><th>Member</th><th>Room</th><th>Type</th><th>Vendor</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td className={s.cellMuted}>{l.date ? new Date(l.date).toLocaleDateString() : "—"}</td>
                  <td className={s.cellMuted}>{l.dayOfWeek}</td>
                  <td>{l.memberName || l.client?.name || "—"}</td>
                  <td className={s.cellMuted}>{l.roomNumber || "—"}</td>
                  <td><span className={`${s.badge} ${s.badgeBlue}`}>{l.laundryType}</span></td>
                  <td className={s.cellMuted}>{l.laundryVendor || "—"}</td>
                  <td className={s.cellTruncate + " " + s.cellMuted}>{l.notes || "—"}</td>
                  <td><div className={s.cellActions}>
                    <button className={s.btnIcon} onClick={() => openEdit(l)}>✏️</button>
                    <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => setDeleteId(l.id)}>🗑️</button>
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
                <div className={s.formGroup}><label>Day of Week</label><input value={form.dayOfWeek ?? ""} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} placeholder="e.g. Monday" /></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label>Member Name</label><input value={form.memberName ?? ""} onChange={(e) => setForm({ ...form, memberName: e.target.value })} /></div>
                <div className={s.formGroup}><label>Room Number</label><input value={form.roomNumber ?? ""} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} /></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label>Laundry Type</label><select value={form.laundryType ?? ""} onChange={(e) => setForm({ ...form, laundryType: e.target.value })}>{LAUNDRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className={s.formGroup}><label>Vendor</label><input value={form.laundryVendor ?? ""} onChange={(e) => setForm({ ...form, laundryVendor: e.target.value })} /></div>
              </div>
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
