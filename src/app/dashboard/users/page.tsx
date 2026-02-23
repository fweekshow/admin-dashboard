"use client";

import { useEffect, useState, useCallback } from "react";
import s from "../shared.module.css";

interface Role { id: string; name: string; }

interface User {
  id: string;
  walletAddress: string | null;
  conversationId: string | null;
  name: string | null;
  role: string;
  roleId: string;
  assignedClients: { client: { id: string; name: string } }[];
  assignedAdvocate: { advocate: { id: string; name: string } }[] | null;
}

const ROLE_COLORS: Record<string, string> = {
  admin: s.badgeRed,
  staff: s.badgeBlue,
  advocate: s.badgeGreen,
  client: s.badgeYellow,
  family: s.badgeBlue,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([
        fetch("/api/users").then((res) => res.json()),
        fetch("/api/roles").then((res) => res.json()),
      ]);
      setUsers(u);
      setRoles(r);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (u: User) => { setEditUser(u); setSelectedRoleId(u.roleId); setError(null); };

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editUser.id, roleId: selectedRoleId }),
      });
      if (!res.ok) throw new Error();
      setEditUser(null);
      fetchData();
    } catch {
      setError("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const filterRoles = ["ALL", ...Array.from(new Set(users.map((u) => u.role)))];
  const filtered = filter === "ALL" ? users : users.filter((u) => u.role === filter);

  if (loading) return <div className={s.loading}>Loading users...</div>;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div><h1>👤 Users &amp; Roles</h1><p className={s.subtitle}>{users.length} users</p></div>
        <div className={s.headerActions}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "8px 14px", borderRadius: "8px", background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
            {filterRoles.map((r) => <option key={r} value={r}>{r === "ALL" ? "All Roles" : r}</option>)}
          </select>
        </div>
      </div>
      {error && <div className={s.errorBanner}>{error}</div>}
      <div className={s.tableWrap}>
        {filtered.length === 0 ? (
          <div className={s.empty}><div className={s.emptyIcon}>👤</div><div className={s.emptyText}>No users found</div></div>
        ) : (
          <table className={s.table}>
            <thead><tr><th>Name</th><th>Role</th><th>Wallet Address</th><th>Assigned Clients</th><th>Advocate</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name || "Unnamed"}</td>
                  <td><span className={`${s.badge} ${ROLE_COLORS[u.role.toLowerCase()] || s.badgeBlue}`}>{u.role}</span></td>
                  <td className={s.cellTruncate + " " + s.cellMuted} style={{ maxWidth: 200 }}>{u.walletAddress || "—"}</td>
                  <td>
                    {u.assignedClients && u.assignedClients.length > 0 ? (
                      <div className={s.tagList}>{u.assignedClients.map((ac) => <span key={ac.client.id} className={s.tag}>{ac.client.name}</span>)}</div>
                    ) : <span className={s.cellMuted}>—</span>}
                  </td>
                  <td>
                    {u.assignedAdvocate && u.assignedAdvocate.length > 0 ? (
                      <div className={s.tagList}>{u.assignedAdvocate.map((aa) => <span key={aa.advocate.id} className={s.tag}>{aa.advocate.name}</span>)}</div>
                    ) : <span className={s.cellMuted}>—</span>}
                  </td>
                  <td><button className={s.btnIcon} onClick={() => openEdit(u)} title="Change role">✏️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editUser && (
        <div className={s.modalOverlay} onClick={() => setEditUser(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2>Change Role</h2>
              <button className={s.modalClose} onClick={() => setEditUser(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                User: <strong style={{ color: "var(--text-primary)" }}>{editUser.name || "Unnamed"}</strong>
              </p>
              <div className={s.formGroup}>
                <label>Role</label>
                <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className={s.modalFooter}>
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRole} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
