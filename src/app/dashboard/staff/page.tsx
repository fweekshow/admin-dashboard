"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";

interface Staff {
  id: string;
  name: string;
  title: string | null;
  division: string | null;
  email: string | null;
  phone: string | null;
  bhrStatus: string | null;
  reportsToId: string | null;
  reportsTo: { id: string; name: string } | null;
}

const emptyStaff = (): Partial<Staff> => ({
  name: "", title: "", division: "", email: "", phone: "", bhrStatus: "", reportsToId: "",
});

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Staff>>(emptyStaff());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/staff");
      setStaff(await r.json());
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyStaff()); setError(null); setModal("add"); };
  const openEdit = (s: Staff) => { setForm({ ...s, reportsToId: s.reportsToId ?? "" }); setError(null); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const method = modal === "add" ? "POST" : "PUT";
      const res = await fetch("/api/staff", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setModal(null); fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/staff?id=${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); }
    catch { setError("Failed to delete"); }
  };

  if (loading) return <div className={s.loading}>Loading staff...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>👥 Staff Members</h1>
          <p className={s.subtitle}>{staff.length} staff members</p>
        </div>
        <div className={s.headerActions}>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Staff</button>
        </div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}

      <div className={s.tableWrap}>
        {staff.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>👥</div>
            <div className={s.emptyText}>No staff members yet</div>
            <button className="btn btn-primary" onClick={openAdd}>Add First Staff</button>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Division</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Reports To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className={s.cellMuted}>{m.title || "—"}</td>
                  <td className={s.cellMuted}>{m.division || "—"}</td>
                  <td className={s.cellMuted}>{m.email || "—"}</td>
                  <td className={s.cellMuted}>{m.phone || "—"}</td>
                  <td className={s.cellMuted}>{m.reportsTo?.name || "—"}</td>
                  <td>
                    <div className={s.cellActions}>
                      <button className={s.btnIcon} onClick={() => openEdit(m)}>✏️</button>
                      <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => setDeleteId(m.id)}>🗑️</button>
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
              <h2>{modal === "add" ? "Add Staff Member" : "Edit Staff Member"}</h2>
              <button className={s.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Name</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Title</label>
                  <input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className={s.formGroup}>
                  <label>Division</label>
                  <input value={form.division ?? ""} onChange={(e) => setForm({ ...form, division: e.target.value })} />
                </div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Email</label>
                  <input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className={s.formGroup}>
                  <label>Phone</label>
                  <input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Reports To</label>
                <select value={form.reportsToId ?? ""} onChange={(e) => setForm({ ...form, reportsToId: e.target.value || null })}>
                  <option value="">None</option>
                  {staff.filter((st) => st.id !== form.id).map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </div>
              <div className={s.formGroup}>
                <label>BHR Status</label>
                <input value={form.bhrStatus ?? ""} onChange={(e) => setForm({ ...form, bhrStatus: e.target.value })} placeholder="Optional" />
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
            <div className={s.modalHeader}><h2>Delete Staff</h2><button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button></div>
            <div className={s.modalBody}><p className={s.confirmText}>Are you sure? This may affect activities assigned to this staff member.</p></div>
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
