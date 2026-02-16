"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
}

const DATA_SOURCES = [
  { value: "meals", label: "Meals - Today's meal schedule" },
  { value: "activities", label: "Activities - Today's activities" },
  { value: "guidelines", label: "Guidelines - Facility guidelines" },
  { value: "houseRules", label: "House Rules - House rules list" },
  { value: "medications", label: "Medications - User's medications (requires context)" },
  { value: "advocates", label: "Advocates - Assigned advocates (requires context)" },
];

const RESPONSE_TYPES = [
  { value: "static", label: "Static Text", description: "Display a fixed message" },
  { value: "database", label: "Database Query", description: "Fetch data from the database" },
  { value: "template", label: "Template", description: "Combine static text with data" },
];

export default function ActionEditor() {
  const params = useParams();
  const router = useRouter();
  const actionId = params.actionId as string;

  const [action, setAction] = useState<ActionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [responseType, setResponseType] = useState("static");
  const [staticText, setStaticText] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [templateFormat, setTemplateFormat] = useState("");

  useEffect(() => {
    fetchAction();
  }, [actionId]);

  const fetchAction = async () => {
    try {
      const res = await fetch(`/api/actions/${actionId}`);
      if (!res.ok) throw new Error("Action not found");
      const data = await res.json();
      setAction(data);
      
      // Populate form
      setLabel(data.label);
      setEnabled(data.enabled);
      setResponseType(data.responseType);
      setStaticText(data.staticText || "");
      setDataSource(data.dataSource || "");
      setTemplateFormat(data.templateFormat || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          enabled,
          responseType,
          staticText: responseType === "static" || responseType === "template" ? staticText : null,
          dataSource: responseType === "database" || responseType === "template" ? dataSource : null,
          templateFormat: responseType === "template" ? templateFormat : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save action");
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Action not found</div>
        <Link href="/" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← Back to Dashboard
        </Link>
        <div className={styles.headerContent}>
          <h1>{label}</h1>
          <code className={styles.actionId}>{actionId}</code>
        </div>
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.alert + " " + styles.alertError}>
            <span>⚠️</span> {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {success && (
          <div className={styles.alert + " " + styles.alertSuccess}>
            <span>✓</span> Changes saved successfully!
          </div>
        )}

        <div className={styles.form}>
          {/* Basic Settings */}
          <section className={styles.section}>
            <h2>Basic Settings</h2>
            
            <div className={styles.field}>
              <label htmlFor="label">Button Label</label>
              <input
                id="label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., 📅 Schedule"
              />
            </div>

            <div className={styles.field}>
              <label>Enabled</label>
              <div className={styles.toggleWrapper}>
                <button
                  type="button"
                  className={`toggle ${enabled ? "active" : ""}`}
                  onClick={() => setEnabled(!enabled)}
                />
                <span className={styles.toggleLabel}>
                  {enabled ? "Action is active" : "Action is disabled"}
                </span>
              </div>
            </div>
          </section>

          {/* Response Configuration */}
          <section className={styles.section}>
            <h2>Response Configuration</h2>

            <div className={styles.field}>
              <label>Response Type</label>
              <div className={styles.radioGroup}>
                {RESPONSE_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`${styles.radioCard} ${responseType === type.value ? styles.radioCardActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="responseType"
                      value={type.value}
                      checked={responseType === type.value}
                      onChange={(e) => setResponseType(e.target.value)}
                    />
                    <span className={styles.radioCardTitle}>{type.label}</span>
                    <span className={styles.radioCardDesc}>{type.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Static Text Field */}
            {(responseType === "static" || responseType === "template") && (
              <div className={styles.field}>
                <label htmlFor="staticText">
                  {responseType === "static" ? "Message Content" : "Template Text"}
                </label>
                <textarea
                  id="staticText"
                  value={staticText}
                  onChange={(e) => setStaticText(e.target.value)}
                  placeholder={responseType === "static" 
                    ? "Enter the message to display..."
                    : "Enter template with placeholders like {date}, {mealsCount}..."}
                  rows={6}
                />
                <p className={styles.hint}>
                  Supports Markdown formatting. Use ** for bold, * for italic.
                </p>
              </div>
            )}

            {/* Data Source Field */}
            {(responseType === "database" || responseType === "template") && (
              <div className={styles.field}>
                <label htmlFor="dataSource">Data Source</label>
                <select
                  id="dataSource"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                >
                  <option value="">Select a data source...</option>
                  {DATA_SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Template Format Field */}
            {responseType === "template" && (
              <div className={styles.field}>
                <label htmlFor="templateFormat">Template Format</label>
                <textarea
                  id="templateFormat"
                  value={templateFormat}
                  onChange={(e) => setTemplateFormat(e.target.value)}
                  placeholder="Custom format for data display..."
                  rows={4}
                />
                <p className={styles.hint}>
                  Available placeholders: {"{date}"}, {"{time}"}, {"{dayOfWeek}"}, {"{mealsCount}"}, {"{activitiesCount}"}
                </p>
              </div>
            )}
          </section>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

