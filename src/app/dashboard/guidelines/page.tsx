"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";
import CsvUploadInline from "../CsvUploadInline";

interface Guideline {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

const emptyItem = (): Partial<Guideline> => ({ title: "", content: "", category: "" });

export default function GuidelinesPage() {
  const [items, setItems] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Guideline>>(emptyItem());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try { setItems(await (await fetch("/api/guidelines")).json()); }
    catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyItem()); setError(null); setModal("add"); };
  const openEdit = (g: Guideline) => { setForm({ ...g }); setError(null); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/guidelines", { method: modal === "add" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setModal(null); fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/guidelines?id=${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchData(); }
    catch { setError("Failed to delete"); }
  };

  if (loading) return <div className={s.loading}>Loading guidelines...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div><h1>📖 Guidelines</h1><p className={s.subtitle}>{items.length} guidelines</p></div>
        <div className={s.headerActions}><CsvUploadInline table="guidelines" label="Guidelines" onSuccess={fetchData} /><button className="btn btn-primary" onClick={openAdd}>+ Add Guideline</button></div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}
      <div className={s.tableWrap}>
        {items.length === 0 ? (
          <div className={s.empty}><div className={s.emptyIcon}>📖</div><div className={s.emptyText}>No guidelines yet</div><button className="btn btn-primary" onClick={openAdd}>Add First</button></div>
        ) : (
          <table className={s.table}>
            <thead><tr><th>Title</th><th>Category</th><th>Content</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id}>
                  <td>{g.title}</td>
                  <td>{g.category ? <span className={`${s.badge} ${s.badgeBlue}`}>{g.category}</span> : <span className={s.cellMuted}>—</span>}</td>
                  <td className={s.cellTruncate}>{g.content}</td>
                  <td><div className={s.cellActions}>
                    <button className={s.btnIcon} onClick={() => openEdit(g)}>✏️</button>
                    <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => setDeleteId(g.id)}>🗑️</button>
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
            <div className={s.modalHeader}><h2>{modal === "add" ? "Add Guideline" : "Edit Guideline"}</h2><button className={s.modalClose} onClick={() => setModal(null)}>✕</button></div>
            <div className={s.modalBody}>
              <div className={s.formGroup}><label>Title</label><input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className={s.formGroup}><label>Category</label><input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Optional" /></div>
              <div className={s.formGroup}><label>Content</label><textarea value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} /></div>
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
            <div className={s.modalHeader}><h2>Delete Guideline</h2><button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button></div>
            <div className={s.modalBody}><p className={s.confirmText}>Are you sure you want to delete this guideline?</p></div>
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
