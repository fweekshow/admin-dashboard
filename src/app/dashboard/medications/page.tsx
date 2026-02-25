"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";
import CsvUploadInline from "../CsvUploadInline";

interface MedEntry {
  medication: string;
  dosage: string;
  time: string;
  frequency: string;
  prescribingDoctor: string;
  notes: string;
}

interface UserMed {
  id: string;
  userId: string;
  schedule: { medications?: MedEntry[] } | MedEntry[];
  user: { id: string; name: string | null; walletAddress: string; conversationId: string };
  updatedAt: string;
}

interface UserOption {
  id: string;
  name: string | null;
  walletAddress: string;
}

const emptyEntry = (): MedEntry => ({
  medication: "",
  dosage: "",
  time: "",
  frequency: "Daily",
  prescribingDoctor: "",
  notes: "",
});

function getMeds(schedule: UserMed["schedule"]): MedEntry[] {
  if (Array.isArray(schedule)) return schedule;
  if (schedule && typeof schedule === "object" && Array.isArray((schedule as any).medications)) {
    return (schedule as any).medications;
  }
  return [];
}

export default function MedicationsPage() {
  const [records, setRecords] = useState<UserMed[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<UserMed | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [entries, setEntries] = useState<MedEntry[]>([emptyEntry()]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [medsRes, usersRes] = await Promise.all([
        fetch("/api/medications"),
        fetch("/api/users"),
      ]);
      const medsData = await medsRes.json();
      const usersData = await usersRes.json();
      setRecords(medsData);
      setUsers(usersData);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const usersWithoutMeds = users.filter(
    (u) => !records.some((r) => r.userId === u.id)
  );

  const openAdd = () => {
    setModal("add");
    setSelectedUserId(usersWithoutMeds[0]?.id || "");
    setEntries([emptyEntry()]);
    setError(null);
  };

  const openEdit = (rec: UserMed) => {
    setModal("edit");
    setSelectedRecord(rec);
    const meds = getMeds(rec.schedule);
    setEntries(meds.length > 0 ? meds.map((m) => ({ ...m })) : [emptyEntry()]);
    setError(null);
  };

  const addEntry = () => setEntries([...entries, emptyEntry()]);

  const removeEntry = (idx: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: keyof MedEntry, value: string) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: value };
    setEntries(updated);
  };

  const handleSave = async () => {
    const validEntries = entries.filter((e) => e.medication.trim());
    if (validEntries.length === 0) {
      setError("Add at least one medication");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const schedule = { medications: validEntries };
      if (modal === "add") {
        const res = await fetch("/api/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUserId, schedule }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed");
        }
      } else if (modal === "edit" && selectedRecord) {
        const res = await fetch("/api/medications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedRecord.id, schedule }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed");
        }
      }
      setModal(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/medications?id=${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchData();
    } catch {
      setError("Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={s.loading}>Loading medications...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>💊 Medications</h1>
          <p className={s.subtitle}>Manage client medication schedules</p>
        </div>
        <div className={s.headerActions}>
          <CsvUploadInline table="medications" label="Medications" onSuccess={fetchData} />
          <button onClick={openAdd} className={s.btnIcon} title="Add Medications" style={{ width: "auto", padding: "8px 16px", gap: "6px", display: "flex", alignItems: "center" }}>
            ➕ Add
          </button>
        </div>
      </div>

      {error && !modal && !deleteId && <div className={s.errorBanner}>⚠️ {error}</div>}

      {records.length === 0 ? (
        <div className={s.tableWrap}>
          <div className={s.empty}>
            <div className={s.emptyIcon}>💊</div>
            <div className={s.emptyText}>No medication records yet</div>
            <button onClick={openAdd} className={s.btnIcon} style={{ width: "auto", padding: "8px 16px" }}>
              ➕ Add Medications
            </button>
          </div>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Medications</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const meds = getMeds(rec.schedule);
                return (
                  <tr key={rec.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{rec.user.name || "—"}</div>
                      <div className={s.cellMuted} style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                        {rec.user.walletAddress.slice(0, 8)}...
                      </div>
                    </td>
                    <td>
                      <div className={s.tagList}>
                        {meds.slice(0, 4).map((m, i) => (
                          <span key={i} className={s.tag}>
                            {m.medication} {m.dosage && `(${m.dosage})`}
                          </span>
                        ))}
                        {meds.length > 4 && (
                          <span className={s.tag}>+{meds.length - 4} more</span>
                        )}
                        {meds.length === 0 && <span className={s.cellMuted}>No medications</span>}
                      </div>
                    </td>
                    <td className={s.cellMuted}>
                      {new Date(rec.updatedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={s.cellActions}>
                        <button onClick={() => openEdit(rec)} className={s.btnIcon} title="Edit">✏️</button>
                        <button onClick={() => setDeleteId(rec.id)} className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className={s.modalOverlay} onClick={() => setModal(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className={s.modalHeader}>
              <h2>{modal === "add" ? "Add Medications" : "Edit Medications"}</h2>
              <button className={s.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              {error && <div className={s.errorBanner}>{error}</div>}

              {modal === "add" && (
                <div className={s.formGroup}>
                  <label>Client</label>
                  <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                    {usersWithoutMeds.length === 0 && <option value="">All users have medications</option>}
                    {usersWithoutMeds.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.walletAddress.slice(0, 12) + "..."}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modal === "edit" && selectedRecord && (
                <div className={s.formGroup}>
                  <label>Client</label>
                  <input
                    type="text"
                    value={selectedRecord.user.name || selectedRecord.user.walletAddress}
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-secondary)" }}>
                  Medications ({entries.length})
                </label>
                <button onClick={addEntry} className={s.btnIcon} title="Add medication" style={{ width: "auto", padding: "4px 10px", fontSize: 12 }}>
                  ➕ Add Med
                </button>
              </div>

              {entries.map((entry, idx) => (
                <div key={idx} style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: 16, border: "1px solid var(--border-subtle)", position: "relative" }}>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(idx)}
                      style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: 14 }}
                      title="Remove"
                    >✕</button>
                  )}
                  <div className={s.formRow}>
                    <div className={s.formGroup}>
                      <label>Medication *</label>
                      <input
                        type="text"
                        value={entry.medication}
                        onChange={(e) => updateEntry(idx, "medication", e.target.value)}
                        placeholder="e.g. Lisinopril"
                      />
                    </div>
                    <div className={s.formGroup}>
                      <label>Dosage</label>
                      <input
                        type="text"
                        value={entry.dosage}
                        onChange={(e) => updateEntry(idx, "dosage", e.target.value)}
                        placeholder="e.g. 10mg"
                      />
                    </div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}>
                      <label>Time</label>
                      <input
                        type="text"
                        value={entry.time}
                        onChange={(e) => updateEntry(idx, "time", e.target.value)}
                        placeholder="e.g. 8:00 AM"
                      />
                    </div>
                    <div className={s.formGroup}>
                      <label>Frequency</label>
                      <select value={entry.frequency} onChange={(e) => updateEntry(idx, "frequency", e.target.value)}>
                        <option>Daily</option>
                        <option>Twice Daily</option>
                        <option>Three Times Daily</option>
                        <option>Weekly</option>
                        <option>As Needed</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}>
                      <label>Prescribing Doctor</label>
                      <input
                        type="text"
                        value={entry.prescribingDoctor}
                        onChange={(e) => updateEntry(idx, "prescribingDoctor", e.target.value)}
                        placeholder="Dr. Smith"
                      />
                    </div>
                    <div className={s.formGroup}>
                      <label>Notes</label>
                      <input
                        type="text"
                        value={entry.notes}
                        onChange={(e) => updateEntry(idx, "notes", e.target.value)}
                        placeholder="Take with food, etc."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setModal(null)} className={s.btnIcon} style={{ width: "auto", padding: "8px 16px" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={s.btnIcon}
                style={{ width: "auto", padding: "8px 16px", background: "var(--accent-primary)", color: "white", borderColor: "var(--accent-primary)" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className={s.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={s.modalHeader}>
              <h2>Delete Medication Record</h2>
              <button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <p className={s.confirmText}>
                Are you sure you want to delete this medication record? This action cannot be undone.
              </p>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setDeleteId(null)} className={s.btnIcon} style={{ width: "auto", padding: "8px 16px" }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className={`${s.btnIcon} ${s.btnIconDanger}`}
                style={{ width: "auto", padding: "8px 16px" }}
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
