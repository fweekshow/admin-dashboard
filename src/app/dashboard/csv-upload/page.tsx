"use client";

import { useState, useRef } from "react";
import s from "../shared.module.css";
import u from "./upload.module.css";

const TABLES = [
  { value: "meals", label: "Meal Templates", file: "meal-menu.csv" },
  { value: "activities", label: "Activity Templates", file: "group-schedule.csv" },
  { value: "schedule", label: "Daily Schedule", file: "daily-schedule.csv" },
  { value: "staff", label: "Staff Members", file: "team-roster.csv" },
  { value: "guidelines", label: "Guidelines", file: "" },
  { value: "houserules", label: "House Rules", file: "" },
  { value: "emergency", label: "Emergency Contacts", file: "emergency-contacts.csv" },
  { value: "housekeeping", label: "Housekeeping Schedule", file: "housekeeping-schedule.csv" },
  { value: "laundry", label: "Laundry Schedule", file: "laundry-schedule.csv" },
  { value: "medications", label: "Medications", file: "medications.csv" },
];

const EXPECTED_HEADERS: Record<string, string[]> = {
  meals: ["Date", "Day of Week", "Meal Type", "Items", "Start Time", "End Time", "Nutrition Highlights", "Notes"],
  activities: ["Date", "Day of Week", "Activity Name", "Description", "Start Time", "End Time", "Location", "Facilitator", "Notes"],
  schedule: ["Start Time", "End Time", "Block Type", "Activity", "Location", "Notes", "Days of Week", "Refers to Meal", "Refers to Activity", "Refers to Meds"],
  staff: ["Name", "Title", "Division", "Email", "Phone", "Reports To"],
  guidelines: ["Title", "Content", "Category"],
  houserules: ["Title", "Content", "Category"],
  emergency: ["Name", "Phone Number", "Type", "Notes", "Priority"],
  housekeeping: ["Date", "Day of Week", "Room/Area", "Task Type", "Daily Tasks Completed", "Assigned Staff", "Time In", "Time Out", "Supervisor Initials", "Notes"],
  laundry: ["Date", "Day of Week", "Member Name", "Room Number", "Laundry Type", "Laundry Vendor", "Expected Return Date", "Returned Date", "Condition Check", "Notes"],
  medications: ["User", "Medication", "Dosage", "Time", "Frequency", "Prescribing Doctor", "Notes"],
};

interface ParsedRow {
  [key: string]: string;
}

function parseCSVPreview(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: ParsedRow[] = [];
  for (let i = 1; i < Math.min(lines.length, 51); i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = values[idx].trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

export default function CsvUploadPage() {
  const [table, setTable] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; imported?: number; total?: number; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [columnMismatch, setColumnMismatch] = useState<{ missing: string[]; unexpected: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const validateColumns = (csvHeaders: string[], targetTable: string): { valid: boolean; missing: string[]; unexpected: string[] } => {
    const expected = EXPECTED_HEADERS[targetTable];
    if (!expected) return { valid: true, missing: [], unexpected: [] };
    const normalizedExpected = expected.map((h) => h.toLowerCase().trim());
    const normalizedCsv = csvHeaders.map((h) => h.toLowerCase().trim());
    const missing = expected.filter((h) => !normalizedCsv.includes(h.toLowerCase().trim()));
    const unexpected = csvHeaders.filter((h) => !normalizedExpected.includes(h.toLowerCase().trim()));
    const matchCount = expected.length - missing.length;
    const valid = matchCount >= Math.ceil(expected.length * 0.5) && missing.length <= 2;
    return { valid, missing, unexpected };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);
    setColumnMismatch(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setError("Please select a .csv file");
      return;
    }
    setFile(f);
    const text = await f.text();
    const parsed = parseCSVPreview(text);
    if (parsed.rows.length === 0) {
      setError("No data rows found in the CSV");
      setPreview(null);
      return;
    }
    // Validate columns immediately
    if (table) {
      const validation = validateColumns(parsed.headers, table);
      if (!validation.valid) {
        setColumnMismatch({ missing: validation.missing, unexpected: validation.unexpected });
      }
    }
    setPreview(parsed);
  };

  const handleUpload = async () => {
    if (!file || !table) return;
    setUploading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("table", table);
      formData.append("clearExisting", clearExisting.toString());
      const res = await fetch("/api/csv-import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setColumnMismatch(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const expectedHeaders = table ? EXPECTED_HEADERS[table] || [] : [];
  const selectedTable = TABLES.find((t) => t.value === table);
  const totalRows = preview ? preview.rows.length : 0;
  const moreRows = totalRows >= 50;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>📤 CSV Upload</h1>
          <p className={s.subtitle}>Import data from CSV files into the database</p>
        </div>
      </div>

      {/* Step 1: Select table */}
      <div className={u.card}>
        <div className={u.stepHeader}>
          <span className={u.stepBadge}>1</span>
          <h3>Select Target Table</h3>
        </div>
        <div className={u.tableGrid}>
          {TABLES.map((t) => (
            <button
              key={t.value}
              className={`${u.tableOption} ${table === t.value ? u.tableOptionActive : ""}`}
              onClick={() => { setTable(t.value); handleReset(); }}
            >
              <span className={u.tableLabel}>{t.label}</span>
              {t.file && <span className={u.tableFile}>{t.file}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Expected columns info */}
      {table && (
        <div className={u.card}>
          <div className={u.stepHeader}>
            <span className={u.stepBadge}>2</span>
            <h3>Upload CSV File</h3>
          </div>
          <div className={u.expectedCols}>
            <p className={u.expectedLabel}>Expected CSV columns for <strong>{selectedTable?.label}</strong>:</p>
            <div className={s.tagList}>
              {expectedHeaders.map((h) => (
                <span key={h} className={s.tag}>{h}</span>
              ))}
            </div>
          </div>
          <div className={u.uploadArea}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className={u.fileInput}
              id="csv-file"
            />
            <label htmlFor="csv-file" className={u.uploadLabel}>
              <span className={u.uploadIcon}>📁</span>
              <span className={u.uploadText}>
                {file ? file.name : "Click to select a CSV file"}
              </span>
              {file && (
                <span className={u.uploadMeta}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {preview && (
        <div className={u.card}>
          <div className={u.stepHeader}>
            <span className={u.stepBadge}>3</span>
            <h3>Preview &amp; Import</h3>
          </div>
          <div className={u.previewInfo}>
            <span className={`${s.badge} ${s.badgeBlue}`}>
              {totalRows}{moreRows ? "+" : ""} rows detected
            </span>
            <span className={`${s.badge} ${s.badgeGreen}`}>
              {preview.headers.length} columns
            </span>
          </div>
          <div className={u.previewTableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>#</th>
                  {preview.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td className={s.cellMuted}>{i + 1}</td>
                    {preview.headers.map((h) => (
                      <td key={h}>
                        <div className={s.cellTruncate}>{row[h] || "—"}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalRows > 10 && (
            <p className={u.previewNote}>
              Showing first 10 of {totalRows}{moreRows ? "+" : ""} rows
            </p>
          )}

          <div className={u.importActions}>
            <label className={u.checkboxLabel}>
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
              />
              <span>Clear existing records before import</span>
            </label>
            <div className={u.importBtns}>
              <button onClick={handleReset} className={u.btnSecondary}>
                Reset
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !!columnMismatch}
                className={u.btnPrimary}
                title={columnMismatch ? "Fix column mismatch before importing" : ""}
              >
                {uploading ? "Importing..." : columnMismatch ? "⚠️ Column Mismatch" : `Import ${totalRows}${moreRows ? "+" : ""} Rows`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column mismatch warning */}
      {columnMismatch && (
        <div className={u.mismatchBanner}>
          <div className={u.mismatchTitle}>⚠️ Column Mismatch — CSV doesn&apos;t match the target table</div>
          {columnMismatch.missing.length > 0 && (
            <div className={u.mismatchSection}>
              <span className={u.mismatchLabel}>Missing columns:</span>
              <div className={s.tagList}>
                {columnMismatch.missing.map((h) => (
                  <span key={h} className={u.tagMissing}>{h}</span>
                ))}
              </div>
            </div>
          )}
          {columnMismatch.unexpected.length > 0 && (
            <div className={u.mismatchSection}>
              <span className={u.mismatchLabel}>Unexpected columns:</span>
              <div className={s.tagList}>
                {columnMismatch.unexpected.map((h) => (
                  <span key={h} className={u.tagUnexpected}>{h}</span>
                ))}
              </div>
            </div>
          )}
          <p className={u.mismatchHint}>Upload a CSV with matching columns or select the correct target table.</p>
        </div>
      )}

      {/* Result/Error banners */}
      {error && (
        <div className={s.errorBanner}>⚠️ {error}</div>
      )}
      {result?.success && (
        <div className={s.successBanner}>
          ✅ Successfully imported {result.imported} of {result.total} rows into <strong>{selectedTable?.label}</strong>
        </div>
      )}
    </div>
  );
}
