"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  type: string;
  notes: string | null;
  priority: number;
  isActive: boolean;
}

const emptyItem = (): Partial<Contact> => ({
  name: "", phoneNumber: "", type: "", notes: "", priority: 0, isActive: true,
});

export default function EmergencyPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Contact>>(emptyItem());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try { setItems(await (await fetch("/api/emergency")).json()); }
    catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyItem()); setError(null); setModal("add"); };
  const openEdit = (c: Contact) => { setForm({ ...c }); setError(null); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/emergency", { method: modal === "add" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setModal(null); fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/emergency?id=${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); }
    catch { setError("Failed to delete"); }
  };

  if (loading) return <div className={s.loading}>Loading emergency contacts...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div><h1>🚨 Emergency Contacts</h1><p className={s.subtitle}>{items.length} contacts</p></div>
        <div className={s.headerActions}><button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button></div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}
      <div className={s.tableWrap}>
        {items.length === 0 ? (
          <div className={s.empty}><div className={s.emptyIcon}>🚨</div><div className={s.emptyText}>No contacts yet</div><button className="btn btn-primary" onClick={openAdd}>Add First</button></div>
        ) : (
          <table className={s.table}>
            <thead><tr><th>Name</th><th>Phone</th><th>Type</th><th>Priority</th><th>Active</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className={s.cellMuted}>{c.phoneNumber}</td>
                  <td><span className={`${s.badge} ${s.badgeBlue}`}>{c.type}</span></td>
                  <td className={s.cellMuted}>{c.priority}</td>
                  <td>{c.isActive ? <span className={`${s.badge} ${s.badgeGreen}`}>Active</span> : <span className={`${s.badge} ${s.badgeRed}`}>Inactive</span>}</td>
                  <td className={s.cellTruncate + " " + s.cellMuted}>{c.notes || "—"}</td>
                  <td><div className={s.cellActions}>
                    <button className={s.btnIcon} onClick={() => openEdit(c)}>✏️</button>
                    <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => setDeleteId(c.id)}>🗑️</button>
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
            <div className={s.modalHeader}><h2>{modal === "add" ? "Add Contact" : "Edit Contact"}</h2><button className={s.modalClose} onClick={() => setModal(null)}>✕</button></div>
            <div className={s.modalBody}>
              <div className={s.formGroup}><label>Name</label><input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label>Phone Number</label><input value={form.phoneNumber ?? ""} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></div>
                <div className={s.formGroup}><label>Type</label><input value={form.type ?? ""} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Crisis Line, House Phone" /></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label>Priority (lower = higher)</label><input type="number" value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} /></div>
                <div className={s.formGroup}>
                  <label>Active</label>
                  <select value={form.isActive ? "true" : "false"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className={s.formGroup}><label>Notes</label><textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
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
            <div className={s.modalHeader}><h2>Delete Contact</h2><button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button></div>
            <div className={s.modalBody}><p className={s.confirmText}>Are you sure you want to delete this emergency contact?</p></div>
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
