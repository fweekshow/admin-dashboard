"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";
import CsvUploadInline from "../CsvUploadInline";
import { DAYS } from "@/lib/constants";

interface Activity {
  id: string;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  daysOfWeek: string[];
  notes: string | null;
  facilitator: { id: string; name: string } | null;
  facilitatorId: string | null;
}

interface StaffOption {
  id: string;
  name: string;
}

const emptyActivity = (): Partial<Activity> => ({
  name: "",
  description: "",
  startTime: "",
  endTime: "",
  location: "",
  daysOfWeek: [],
  notes: "",
  facilitatorId: "",
});

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Activity>>(emptyActivity());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/staff"),
      ]);
      setActivities(await aRes.json());
      setStaff(await sRes.json());
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm(emptyActivity()); setError(null); setModal("add"); };
  const openEdit = (a: Activity) => { setForm({ ...a, facilitatorId: a.facilitatorId ?? "" }); setError(null); setModal("edit"); };

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
      const res = await fetch("/api/activities", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setModal(null);
      fetchData();
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/activities?id=${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchData();
    } catch { setError("Failed to delete"); }
  };

  if (loading) return <div className={s.loading}>Loading activities...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>🏃 Activities</h1>
          <p className={s.subtitle}>{activities.length} activity templates</p>
        </div>
        <div className={s.headerActions}>
          <CsvUploadInline table="activities" label="Activities" onSuccess={fetchData} />
          <button className="btn btn-primary" onClick={openAdd}>+ Add Activity</button>
        </div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}

      <div className={s.tableWrap}>
        {activities.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>🏃</div>
            <div className={s.emptyText}>No activities yet</div>
            <button className="btn btn-primary" onClick={openAdd}>Add First Activity</button>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Time</th>
                <th>Location</th>
                <th>Days</th>
                <th>Facilitator</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className={s.cellMuted}>{a.startTime} – {a.endTime}</td>
                  <td className={s.cellMuted}>{a.location || "—"}</td>
                  <td>
                    <div className={s.tagList}>
                      {a.daysOfWeek.map((d) => <span key={d} className={s.tag}>{d}</span>)}
                    </div>
                  </td>
                  <td className={s.cellMuted}>{a.facilitator?.name || "—"}</td>
                  <td>
                    <div className={s.cellActions}>
                      <button className={s.btnIcon} title="Edit" onClick={() => openEdit(a)}>✏️</button>
                      <button className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete" onClick={() => setDeleteId(a.id)}>🗑️</button>
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
              <h2>{modal === "add" ? "Add Activity" : "Edit Activity"}</h2>
              <button className={s.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Name</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Activity name" />
              </div>
              <div className={s.formGroup}>
                <label>Description</label>
                <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description..." />
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
                <input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Optional location" />
              </div>
              <div className={s.formGroup}>
                <label>Days of Week</label>
                <div className={s.daysGrid}>
                  {DAYS.map((d) => (
                    <button key={d} type="button"
                      className={`${s.dayChip} ${(form.daysOfWeek ?? []).includes(d) ? s.dayChipActive : ""}`}
                      onClick={() => toggleDay(d)}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Facilitator</label>
                <select value={form.facilitatorId ?? ""} onChange={(e) => setForm({ ...form, facilitatorId: e.target.value || null })}>
                  <option value="">None</option>
                  {staff.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </div>
              <div className={s.formGroup}>
                <label>Notes</label>
                <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
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
            <div className={s.modalHeader}>
              <h2>Delete Activity</h2>
              <button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <p className={s.confirmText}>Are you sure you want to delete this activity?</p>
            </div>
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
