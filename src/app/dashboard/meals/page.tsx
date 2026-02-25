"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";
import CsvUploadInline from "../CsvUploadInline";
import { DAYS, MEAL_TYPES } from "@/lib/constants";

interface Meal {
  id: string;
  mealType: string;
  items: string[];
  notes: string | null;
  daysOfWeek: string[];
  startTime: string | null;
  endTime: string | null;
  date: string | null;
}

const emptyMeal = (): Partial<Meal> => ({
  mealType: "Breakfast",
  items: [],
  notes: "",
  daysOfWeek: [],
  startTime: "",
  endTime: "",
});

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Meal>>(emptyMeal());
  const [itemInput, setItemInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    try {
      const r = await fetch("/api/meals");
      const data = await r.json();
      setMeals(data);
    } catch {
      setError("Failed to load meals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const openAdd = () => {
    setForm(emptyMeal());
    setItemInput("");
    setError(null);
    setModal("add");
  };

  const openEdit = (meal: Meal) => {
    setForm({ ...meal });
    setItemInput("");
    setError(null);
    setModal("edit");
  };

  const addItem = () => {
    if (!itemInput.trim()) return;
    setForm((f) => ({ ...f, items: [...(f.items ?? []), itemInput.trim()] }));
    setItemInput("");
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({
      ...f,
      items: (f.items ?? []).filter((_, i) => i !== idx),
    }));
  };

  const toggleDay = (day: string) => {
    setForm((f) => {
      const current = f.daysOfWeek ?? [];
      return {
        ...f,
        daysOfWeek: current.includes(day)
          ? current.filter((d) => d !== day)
          : [...current, day],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const method = modal === "add" ? "POST" : "PUT";
      const res = await fetch("/api/meals", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setModal(null);
      fetchMeals();
    } catch {
      setError("Failed to save meal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/meals?id=${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchMeals();
    } catch {
      setError("Failed to delete meal");
    }
  };

  if (loading) return <div className={s.loading}>Loading meals...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>🍴 Meals</h1>
          <p className={s.subtitle}>{meals.length} meal templates</p>
        </div>
        <div className={s.headerActions}>
          <CsvUploadInline table="meals" label="Meals" onSuccess={fetchMeals} />
          <button className="btn btn-primary" onClick={openAdd}>+ Add Meal</button>
        </div>
      </div>

      {error && <div className={s.errorBanner}>{error}</div>}

      <div className={s.tableWrap}>
        {meals.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>🍴</div>
            <div className={s.emptyText}>No meals yet</div>
            <button className="btn btn-primary" onClick={openAdd}>Add First Meal</button>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Items</th>
                <th>Days</th>
                <th>Time</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal.id}>
                  <td><span className={s.badge + " " + s.badgeBlue}>{meal.mealType}</span></td>
                  <td className={s.cellTruncate}>
                    {Array.isArray(meal.items) ? meal.items.join(", ") : String(meal.items)}
                  </td>
                  <td>
                    <div className={s.tagList}>
                      {meal.daysOfWeek.map((d) => (
                        <span key={d} className={s.tag}>{d}</span>
                      ))}
                    </div>
                  </td>
                  <td className={s.cellMuted}>
                    {meal.startTime && meal.endTime
                      ? `${meal.startTime} – ${meal.endTime}`
                      : meal.startTime || "—"}
                  </td>
                  <td className={s.cellTruncate + " " + s.cellMuted}>{meal.notes || "—"}</td>
                  <td>
                    <div className={s.cellActions}>
                      <button className={s.btnIcon} title="Edit" onClick={() => openEdit(meal)}>✏️</button>
                      <button className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete" onClick={() => setDeleteId(meal.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className={s.modalOverlay} onClick={() => setModal(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2>{modal === "add" ? "Add Meal" : "Edit Meal"}</h2>
              <button className={s.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Meal Type</label>
                <select
                  value={form.mealType ?? ""}
                  onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                >
                  {MEAL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={form.startTime ?? ""}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className={s.formGroup}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={form.endTime ?? ""}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Days of Week</label>
                <div className={s.daysGrid}>
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`${s.dayChip} ${(form.daysOfWeek ?? []).includes(d) ? s.dayChipActive : ""}`}
                      onClick={() => toggleDay(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Menu Items</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    placeholder="Add an item..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
                  />
                  <button className="btn btn-secondary" type="button" onClick={addItem}>Add</button>
                </div>
                <div className={s.tagList} style={{ marginTop: 8 }}>
                  {(form.items ?? []).map((item, idx) => (
                    <span
                      key={idx}
                      className={s.tag}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeItem(idx)}
                      title="Click to remove"
                    >
                      {item} ✕
                    </span>
                  ))}
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Notes</label>
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className={s.modalFooter}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className={s.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2>Delete Meal</h2>
              <button className={s.modalClose} onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <p className={s.confirmText}>Are you sure you want to delete this meal? This action cannot be undone.</p>
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
