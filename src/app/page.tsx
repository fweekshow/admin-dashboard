"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

interface ActionConfig {
  id: string;
  actionId: string;
  label: string;
  enabled: boolean;
  responseType: string;
  staticText: string | null;
  dataSource: string | null;
  templateFormat: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [actions, setActions] = useState<ActionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const fetchActions = async () => {
    try {
      const res = await fetch("/api/actions");
      if (!res.ok) throw new Error("Failed to fetch actions");
      const data = await res.json();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = async (actionId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update action");
      fetchActions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const getResponseTypeLabel = (type: string) => {
    switch (type) {
      case "static":
        return "Static Text";
      case "database":
        return "Database Query";
      case "template":
        return "Template";
      default:
        return type;
    }
  };

  const getDataSourceLabel = (source: string | null) => {
    if (!source) return "-";
    const labels: Record<string, string> = {
      meals: "Meals",
      activities: "Activities",
      guidelines: "Guidelines",
      houseRules: "House Rules",
      medications: "Medications",
      advocates: "Advocates",
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading actions...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🏠</span>
              <h1>Concierge Admin</h1>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
          <p className={styles.subtitle}>Manage quick action responses</p>
        </div>
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.error}>
            <span>⚠️</span> {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className={styles.grid}>
          {actions.map((action) => (
            <div key={action.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <span className={styles.actionLabel}>{action.label}</span>
                  <code className={styles.actionId}>{action.actionId}</code>
                </div>
                <button
                  className={`toggle ${action.enabled ? "active" : ""}`}
                  onClick={() => toggleAction(action.actionId, !action.enabled)}
                  title={action.enabled ? "Disable action" : "Enable action"}
                />
              </div>

              <div className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Type</span>
                  <span className={`badge ${action.responseType === "database" ? "badge-success" : "badge-warning"}`}>
                    {getResponseTypeLabel(action.responseType)}
                  </span>
                </div>
                {action.dataSource && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Source</span>
                    <span className={styles.metaValue}>
                      {getDataSourceLabel(action.dataSource)}
                    </span>
                  </div>
                )}
              </div>

              {action.responseType === "static" && action.staticText && (
                <div className={styles.preview}>
                  <span className={styles.previewLabel}>Preview</span>
                  <div className={styles.previewContent}>
                    {action.staticText.substring(0, 100)}
                    {action.staticText.length > 100 && "..."}
                  </div>
                </div>
              )}

              <div className={styles.cardActions}>
                <Link href={`/actions/${action.actionId}`} className="btn btn-secondary">
                  Edit Response
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

